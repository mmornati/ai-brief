import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { resolve } from 'path';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import {
  validateDefinition,
  validateFormatDefinition,
  loadPipelineDefinition,
  loadFormatDefinition,
  EXPECTED_PIPELINE_SEQUENCE,
} from '../../src/pipeline/types.js';

const PIPELINE_PATH = resolve('pipeline-definition/pipeline.json');
const FORMATS_PATH = resolve('pipeline-definition/formats.json');

let tmpDir;
beforeAll(() => {
  tmpDir = mkdtempSync(resolve(tmpdir(), 'ai-brief-types-test-'));
});

afterAll(() => {
  if (tmpDir) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

function tmpJsonPath(name) {
  return resolve(tmpDir, name);
}

describe('StepIO contract shape', () => {
  it('StepIO typedef matches the spec shape (content, metadata, state)', () => {
    const stepIo = {
      content: 'hello',
      metadata: { source: 'test' },
      state: {
        stepIndex: 0,
        completedSteps: [],
        currentStep: 'validate',
        failedStep: null,
      },
    };
    expect(typeof stepIo.content).toBe('string');
    expect(typeof stepIo.metadata).toBe('object');
    expect(stepIo.metadata).not.toBeNull();
    expect(Array.isArray(stepIo.metadata) ? 'array' : typeof stepIo.metadata).toBe('object');
    expect(typeof stepIo.state).toBe('object');
    expect(Array.isArray(stepIo.state.completedSteps)).toBe(true);
    expect(typeof stepIo.state.stepIndex).toBe('number');
  });
});

describe('validateDefinition', () => {
  it('returns steps for valid input', () => {
    const valid = {
      steps: [
        { name: 'validate', promptFile: 'steps/validate.md', description: 'Validate input' },
        { name: 'research', promptFile: 'steps/research.md', description: 'Research context' },
      ],
    };
    const result = validateDefinition(valid, '/fake/pipeline.json');
    expect(result).toEqual({ steps: valid.steps });
  });

  it('throws when definition is null', () => {
    expect(() => validateDefinition(null, '/p.json')).toThrow(/must be a non-null object/);
  });

  it('throws when definition is not an object', () => {
    expect(() => validateDefinition('string', '/p.json')).toThrow(/must be a non-null object/);
  });

  it('throws when definition is a top-level array', () => {
    expect(() => validateDefinition([], '/p.json')).toThrow(/must be a non-null object/);
    expect(() => validateDefinition(['steps'], '/p.json')).toThrow(/must be a non-null object/);
  });

  it('throws when steps is missing', () => {
    expect(() => validateDefinition({}, '/p.json')).toThrow(/missing or invalid "steps" array/);
  });

  it('throws when steps is not an array', () => {
    expect(() => validateDefinition({ steps: 'not-array' }, '/p.json'))
      .toThrow(/missing or invalid "steps" array/);
  });

  it('throws when steps array is empty', () => {
    expect(() => validateDefinition({ steps: [] }, '/p.json'))
      .toThrow(/"steps" array is empty/);
  });

  it('throws when step[0] is null', () => {
    expect(() => validateDefinition({ steps: [null] }, '/p.json'))
      .toThrow(/step\[0\] must be a non-null object/);
  });

  it('throws when step[1] is null (off-by-one check)', () => {
    const def = {
      steps: [
        { name: 'a', promptFile: 'a.md', description: 'A' },
        null,
      ],
    };
    expect(() => validateDefinition(def, '/p.json'))
      .toThrow(/step\[1\] must be a non-null object/);
  });

  it('throws when step[0] is a primitive (number)', () => {
    expect(() => validateDefinition({ steps: [5] }, '/p.json'))
      .toThrow(/step\[0\] must be a non-null object/);
  });

  it('throws when step[0] is an array', () => {
    expect(() => validateDefinition({ steps: [[]] }, '/p.json'))
      .toThrow(/step\[0\] must be a non-null object/);
  });

  it('throws when step missing name', () => {
    expect(() => validateDefinition(
      { steps: [{ promptFile: 'x.md', description: 'x' }] },
      '/p.json',
    )).toThrow(/step\[0\] missing or invalid required field "name"/);
  });

  it('throws when step missing promptFile', () => {
    expect(() => validateDefinition(
      { steps: [{ name: 'x', description: 'x' }] },
      '/p.json',
    )).toThrow(/step\[0\] missing or invalid required field "promptFile"/);
  });

  it('throws when step missing description', () => {
    expect(() => validateDefinition(
      { steps: [{ name: 'x', promptFile: 'x.md' }] },
      '/p.json',
    )).toThrow(/step\[0\] missing or invalid required field "description"/);
  });

  it('throws when step name is empty string', () => {
    expect(() => validateDefinition(
      { steps: [{ name: '', promptFile: 'x.md', description: 'x' }] },
      '/p.json',
    )).toThrow(/step\[0\] missing or invalid required field "name"/);
  });

  it('throws when step name is whitespace-only', () => {
    expect(() => validateDefinition(
      { steps: [{ name: '   ', promptFile: 'x.md', description: 'x' }] },
      '/p.json',
    )).toThrow(/step\[0\] missing or invalid required field "name"/);
  });

  it('throws when promptFile is whitespace-only', () => {
    expect(() => validateDefinition(
      { steps: [{ name: 'x', promptFile: '\t', description: 'x' }] },
      '/p.json',
    )).toThrow(/step\[0\] missing or invalid required field "promptFile"/);
  });

  it('throws when description is whitespace-only', () => {
    expect(() => validateDefinition(
      { steps: [{ name: 'x', promptFile: 'x.md', description: '  ' }] },
      '/p.json',
    )).toThrow(/step\[0\] missing or invalid required field "description"/);
  });

  it('throws on duplicate step name', () => {
    const def = {
      steps: [
        { name: 'a', promptFile: 'a.md', description: 'A' },
        { name: 'a', promptFile: 'b.md', description: 'B' },
      ],
    };
    expect(() => validateDefinition(def, '/p.json'))
      .toThrow(/duplicate step name "a" at index 1/);
  });

  it('throws when step count does not match expected sequence', () => {
    const def = {
      steps: [
        { name: 'validate', promptFile: 'v.md', description: 'V' },
      ],
    };
    expect(() => validateDefinition(def, '/p.json', EXPECTED_PIPELINE_SEQUENCE))
      .toThrow(/expected 6 steps, got 1/);
  });

  it('throws when step name does not match expected sequence position', () => {
    const def = {
      steps: [
        { name: 'validate', promptFile: 'v.md', description: 'V' },
        { name: 'wrong', promptFile: 'w.md', description: 'W' },
        { name: 'structure', promptFile: 's.md', description: 'S' },
        { name: 'write', promptFile: 'w2.md', description: 'W2' },
        { name: 'format', promptFile: 'f.md', description: 'F' },
        { name: 'review', promptFile: 'r.md', description: 'R' },
      ],
    };
    expect(() => validateDefinition(def, '/p.json', EXPECTED_PIPELINE_SEQUENCE))
      .toThrow(/step ordering mismatch at index 1: expected "research", got "wrong"/);
  });
});

describe('validateFormatDefinition', () => {
  it('returns formats for valid input', () => {
    const def = {
      formats: [
        { name: 'blog', orchestrator: 'src/formats/opencode.js' },
      ],
    };
    const result = validateFormatDefinition(def, '/fake/formats.json');
    expect(result).toEqual({ formats: def.formats });
  });

  it('throws when definition is null', () => {
    expect(() => validateFormatDefinition(null, '/f.json'))
      .toThrow(/must be a non-null object/);
  });

  it('throws when definition is a top-level array', () => {
    expect(() => validateFormatDefinition([], '/f.json'))
      .toThrow(/must be a non-null object/);
  });

  it('throws when formats array is missing', () => {
    expect(() => validateFormatDefinition({}, '/f.json'))
      .toThrow(/missing or invalid "formats" array/);
  });

  it('throws when formats array is empty', () => {
    expect(() => validateFormatDefinition({ formats: [] }, '/f.json'))
      .toThrow(/"formats" array is empty/);
  });

  it('throws when format entry is null', () => {
    expect(() => validateFormatDefinition({ formats: [null] }, '/f.json'))
      .toThrow(/formats\[0\] must be a non-null object/);
  });

  it('throws when format entry is a primitive', () => {
    expect(() => validateFormatDefinition({ formats: [42] }, '/f.json'))
      .toThrow(/formats\[0\] must be a non-null object/);
  });

  it('throws when format entry is an array', () => {
    expect(() => validateFormatDefinition({ formats: [[]] }, '/f.json'))
      .toThrow(/formats\[0\] must be a non-null object/);
  });

  it('throws when format name is missing', () => {
    expect(() => validateFormatDefinition(
      { formats: [{ orchestrator: 'x.js' }] },
      '/f.json',
    )).toThrow(/formats\[0\] missing or invalid "name"/);
  });

  it('throws when format name is whitespace-only', () => {
    expect(() => validateFormatDefinition(
      { formats: [{ name: '  ', orchestrator: 'x.js' }] },
      '/f.json',
    )).toThrow(/formats\[0\] missing or invalid "name"/);
  });

  it('throws when orchestrator is missing', () => {
    expect(() => validateFormatDefinition(
      { formats: [{ name: 'blog' }] },
      '/f.json',
    )).toThrow(/formats\[0\] missing or invalid "orchestrator"/);
  });

  it('throws when orchestrator is whitespace-only', () => {
    expect(() => validateFormatDefinition(
      { formats: [{ name: 'blog', orchestrator: '   ' }] },
      '/f.json',
    )).toThrow(/formats\[0\] missing or invalid "orchestrator"/);
  });

  it('throws on duplicate format name', () => {
    const def = {
      formats: [
        { name: 'blog', orchestrator: 'a.js' },
        { name: 'blog', orchestrator: 'b.js' },
      ],
    };
    expect(() => validateFormatDefinition(def, '/f.json'))
      .toThrow(/duplicate format name "blog" at index 1/);
  });
});

describe('loadPipelineDefinition', () => {
  it('loads and validates the real pipeline.json', () => {
    const result = loadPipelineDefinition(PIPELINE_PATH);
    expect(result.steps).toHaveLength(6);
    expect(result.steps.map(s => s.name)).toEqual([
      'validate', 'research', 'structure', 'write', 'format', 'review',
    ]);
    result.steps.forEach(s => {
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('promptFile');
      expect(s).toHaveProperty('description');
    });
  });

  it('throws descriptive error for missing file', () => {
    expect(() => loadPipelineDefinition('/nonexistent/pipeline.json'))
      .toThrow(/Failed to read pipeline definition/);
  });

  it('throws descriptive error for malformed JSON', () => {
    const p = tmpJsonPath('bad-pipeline.json');
    writeFileSync(p, '{ invalid json }', 'utf-8');
    expect(() => loadPipelineDefinition(p))
      .toThrow(/Invalid JSON in pipeline definition/);
  });

  it('error includes file path and cause', () => {
    const p = tmpJsonPath('bad-pipeline-cause.json');
    writeFileSync(p, '{ invalid json }', 'utf-8');
    let err;
    try {
      loadPipelineDefinition(p);
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.message).toContain(p);
    expect(err.cause).toBeDefined();
  });
});

describe('loadFormatDefinition', () => {
  it('loads the real formats.json', () => {
    const result = loadFormatDefinition(FORMATS_PATH);
    expect(result.formats).toHaveLength(2);
    expect(result.formats[0]).toEqual({ name: 'blog', orchestrator: 'src/formats/opencode.js' });
    expect(result.formats[1]).toEqual({ name: 'slides', orchestrator: 'src/formats/claude.js' });
  });

  it('throws for missing file', () => {
    expect(() => loadFormatDefinition('/nonexistent/formats.json'))
      .toThrow(/Failed to read format definition/);
  });

  it('throws for invalid JSON', () => {
    const p = tmpJsonPath('bad-formats.json');
    writeFileSync(p, '{ broken json }', 'utf-8');
    expect(() => loadFormatDefinition(p))
      .toThrow(/Invalid JSON in format definition/);
  });

  it('throws for missing formats array', () => {
    const p = tmpJsonPath('empty-formats.json');
    writeFileSync(p, JSON.stringify({}), 'utf-8');
    expect(() => loadFormatDefinition(p))
      .toThrow(/missing or invalid "formats" array/);
  });

  it('throws for missing format name', () => {
    const p = tmpJsonPath('no-name-formats.json');
    writeFileSync(p, JSON.stringify({ formats: [{ orchestrator: 'x.js' }] }), 'utf-8');
    expect(() => loadFormatDefinition(p))
      .toThrow(/formats\[0\] missing or invalid "name"/);
  });
});
