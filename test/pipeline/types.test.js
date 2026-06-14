import { describe, it, expect, beforeAll } from 'vitest';
import { validateDefinition, loadPipelineDefinition, loadFormatDefinition } from '../../src/pipeline/types.js';
import { resolve } from 'path';
import { writeFileSync, unlinkSync, mkdirSync } from 'fs';

const PIPELINE_PATH = resolve('pipeline-definition/pipeline.json');
const FORMATS_PATH = resolve('pipeline-definition/formats.json');

describe('StepIO contract shape', () => {
  it('validateDefinition returns steps for valid input', () => {
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

  it('throws when steps is missing', () => {
    expect(() => validateDefinition({}, '/p.json')).toThrow(/missing or invalid "steps" array/);
  });

  it('throws when steps is not an array', () => {
    expect(() => validateDefinition({ steps: 'not-array' }, '/p.json')).toThrow(/missing or invalid "steps" array/);
  });

  it('throws when steps array is empty', () => {
    expect(() => validateDefinition({ steps: [] }, '/p.json')).toThrow(/"steps" array is empty/);
  });

  it('throws when step is null', () => {
    expect(() => validateDefinition({ steps: [null] }, '/p.json')).toThrow(/step\[0\] must be a non-null object/);
  });

  it('throws when step missing name', () => {
    expect(() => validateDefinition({ steps: [{ promptFile: 'x.md', description: 'x' }] }, '/p.json'))
      .toThrow(/step\[0\] missing or invalid required field "name"/);
  });

  it('throws when step missing promptFile', () => {
    expect(() => validateDefinition({ steps: [{ name: 'x', description: 'x' }] }, '/p.json'))
      .toThrow(/step\[0\] missing or invalid required field "promptFile"/);
  });

  it('throws when step missing description', () => {
    expect(() => validateDefinition({ steps: [{ name: 'x', promptFile: 'x.md' }] }, '/p.json'))
      .toThrow(/step\[0\] missing or invalid required field "description"/);
  });

  it('throws when step name is empty string', () => {
    expect(() => validateDefinition({ steps: [{ name: '', promptFile: 'x.md', description: 'x' }] }, '/p.json'))
      .toThrow(/step\[0\] missing or invalid required field "name"/);
  });
});

describe('loadPipelineDefinition', () => {
  const tmpPath = resolve('/tmp/test-pipeline.json');

  afterAll(() => {
    try { unlinkSync(tmpPath); } catch {}
  });

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
    writeFileSync(tmpPath, '{ invalid json }', 'utf-8');
    expect(() => loadPipelineDefinition(tmpPath))
      .toThrow(/Invalid JSON in pipeline definition/);
  });

  it('error includes file path', () => {
    writeFileSync(tmpPath, '{ invalid json }', 'utf-8');
    try {
      loadPipelineDefinition(tmpPath);
    } catch (err) {
      expect(err.message).toContain(tmpPath);
      expect(err.cause).toBeDefined();
    }
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
    const tmpPath = resolve('/tmp/test-formats-bad.json');
    writeFileSync(tmpPath, '{ broken json }', 'utf-8');
    try {
      expect(() => loadFormatDefinition(tmpPath))
        .toThrow(/Invalid JSON in format definition/);
    } finally {
      unlinkSync(tmpPath);
    }
  });

  it('throws for missing formats array', () => {
    const tmpPath = resolve('/tmp/test-formats.json');
    writeFileSync(tmpPath, JSON.stringify({}), 'utf-8');
    try {
      expect(() => loadFormatDefinition(tmpPath))
        .toThrow(/missing or invalid "formats" array/);
    } finally {
      unlinkSync(tmpPath);
    }
  });

  it('throws for missing format name', () => {
    const tmpPath = resolve('/tmp/test-formats.json');
    writeFileSync(tmpPath, JSON.stringify({ formats: [{ orchestrator: 'x.js' }] }), 'utf-8');
    try {
      expect(() => loadFormatDefinition(tmpPath))
        .toThrow(/formats\[0\] missing or invalid "name"/);
    } finally {
      unlinkSync(tmpPath);
    }
  });
});
