import { describe, it, expect } from 'vitest';
import { resolve } from 'path';
import {
  loadSteps,
  loadFormats,
  validateStepDefinitions,
  validateFormatDefinitions,
} from '../../src/pipeline/step-loader.js';

const FIXTURES = resolve('test/fixtures');

function fixture(name) {
  return resolve(FIXTURES, name);
}

describe('loadSteps', () => {
  it('returns ordered step array for valid pipeline.json', async () => {
    const steps = await loadSteps(fixture('pipeline-valid.json'));
    expect(steps).toHaveLength(6);
    expect(steps.map(s => s.name)).toEqual([
      'validate', 'research', 'structure', 'write', 'format', 'review',
    ]);
    steps.forEach(s => {
      expect(s).toHaveProperty('name');
      expect(s).toHaveProperty('promptFile');
      expect(s).toHaveProperty('description');
    });
  });

  it('returns empty array for empty steps', async () => {
    const steps = await loadSteps(fixture('pipeline-empty.json'));
    expect(steps).toEqual([]);
  });

  it('throws descriptive error for malformed JSON', async () => {
    await expect(loadSteps(fixture('pipeline-malformed.json')))
      .rejects.toThrow(/Failed to load step definitions/);
  });

  it('throws descriptive error for missing file', async () => {
    await expect(loadSteps('/nonexistent/pipeline.json'))
      .rejects.toThrow(/Failed to load step definitions/);
  });

  it('throws for missing steps array', async () => {
    await expect(loadSteps(fixture('pipeline-missing-steps.json')))
      .rejects.toThrow(/missing or invalid "steps" array/);
  });

  it('throws for non-kebab-case step names', async () => {
    await expect(loadSteps(fixture('pipeline-bad-names.json')))
      .rejects.toThrow(/must be kebab-case/);
  });

  it('throws for non-.md promptFile', async () => {
    await expect(loadSteps(fixture('pipeline-bad-ext.json')))
      .rejects.toThrow(/must end with .md/);
  });

  it('error includes the file path', async () => {
    const p = fixture('pipeline-malformed.json');
    await expect(loadSteps(p)).rejects.toThrow(p);
  });
});

describe('loadFormats', () => {
  it('returns format array for valid formats.json', async () => {
    const formats = await loadFormats(fixture('formats-valid.json'));
    expect(formats).toHaveLength(2);
    expect(formats[0]).toEqual({ name: 'blog', orchestrator: 'src/formats/opencode.js' });
    expect(formats[1]).toEqual({ name: 'slides', orchestrator: 'src/formats/claude.js' });
  });

  it('returns empty array for empty formats', async () => {
    const formats = await loadFormats(fixture('formats-empty.json'));
    expect(formats).toEqual([]);
  });

  it('throws descriptive error for missing file', async () => {
    await expect(loadFormats('/nonexistent/formats.json'))
      .rejects.toThrow(/Failed to load format definitions/);
  });

  it('throws for non-.js orchestrator', async () => {
    await expect(loadFormats(fixture('formats-bad-ext.json')))
      .rejects.toThrow(/must be a .js file/);
  });
});

describe('validateStepDefinitions', () => {
  it('returns steps for valid input', () => {
    const steps = [
      { name: 'validate', promptFile: 'steps/validate.md', description: 'Validate input' },
      { name: 'research', promptFile: 'steps/research.md', description: 'Research context' },
    ];
    const result = validateStepDefinitions(steps, '/fake/pipeline.json');
    expect(result).toBe(steps);
  });

  it('throws when step is null', () => {
    expect(() => validateStepDefinitions([null], '/p.json'))
      .toThrow(/step\[0\] must be a non-null object/);
  });

  it('throws when step is an array', () => {
    expect(() => validateStepDefinitions([[]], '/p.json'))
      .toThrow(/step\[0\] must be a non-null object/);
  });

  it('throws when step missing name', () => {
    expect(() => validateStepDefinitions(
      [{ promptFile: 'x.md', description: 'x' }],
      '/p.json',
    )).toThrow(/missing or invalid required field/);
  });

  it('throws when step missing promptFile', () => {
    expect(() => validateStepDefinitions(
      [{ name: 'x', description: 'x' }],
      '/p.json',
    )).toThrow(/missing or invalid required field/);
  });

  it('throws when step missing description', () => {
    expect(() => validateStepDefinitions(
      [{ name: 'x', promptFile: 'x.md' }],
      '/p.json',
    )).toThrow(/missing or invalid required field/);
  });

  it('throws when name is empty string', () => {
    expect(() => validateStepDefinitions(
      [{ name: '', promptFile: 'x.md', description: 'x' }],
      '/p.json',
    )).toThrow(/missing or invalid required field/);
  });

  it('throws on duplicate step name', () => {
    const steps = [
      { name: 'a', promptFile: 'a.md', description: 'A' },
      { name: 'a', promptFile: 'b.md', description: 'B' },
    ];
    expect(() => validateStepDefinitions(steps, '/p.json'))
      .toThrow(/duplicate step name "a"/);
  });

  it('throws when name is not kebab-case', () => {
    const steps = [
      { name: 'NotKebab', promptFile: 'a.md', description: 'A' },
    ];
    expect(() => validateStepDefinitions(steps, '/p.json'))
      .toThrow(/must be kebab-case/);
  });

  it('throws when promptFile does not end with .md', () => {
    const steps = [
      { name: 'validate', promptFile: 'steps/validate.txt', description: 'V' },
    ];
    expect(() => validateStepDefinitions(steps, '/p.json'))
      .toThrow(/must end with .md/);
  });

  it('throws on step ordering mismatch when expectedSequence given', () => {
    const steps = [
      { name: 'validate', promptFile: 'v.md', description: 'V' },
      { name: 'wrong', promptFile: 'w.md', description: 'W' },
    ];
    expect(() => validateStepDefinitions(steps, '/p.json', ['validate', 'research']))
      .toThrow(/step ordering mismatch at index 1/);
  });
});

describe('validateFormatDefinitions', () => {
  it('returns formats for valid input', () => {
    const formats = [
      { name: 'blog', orchestrator: 'src/formats/opencode.js' },
    ];
    const result = validateFormatDefinitions(formats, '/fake/formats.json');
    expect(result).toBe(formats);
  });

  it('throws when format is null', () => {
    expect(() => validateFormatDefinitions([null], '/f.json'))
      .toThrow(/formats\[0\] must be a non-null object/);
  });

  it('throws when format is an array', () => {
    expect(() => validateFormatDefinitions([[]], '/f.json'))
      .toThrow(/formats\[0\] must be a non-null object/);
  });

  it('throws when format name is missing', () => {
    expect(() => validateFormatDefinitions(
      [{ orchestrator: 'x.js' }],
      '/f.json',
    )).toThrow(/missing or invalid required field/);
  });

  it('throws when orchestrator is missing', () => {
    expect(() => validateFormatDefinitions(
      [{ name: 'blog' }],
      '/f.json',
    )).toThrow(/missing or invalid required field/);
  });

  it('throws on duplicate format name', () => {
    const formats = [
      { name: 'blog', orchestrator: 'a.js' },
      { name: 'blog', orchestrator: 'b.js' },
    ];
    expect(() => validateFormatDefinitions(formats, '/f.json'))
      .toThrow(/duplicate format name "blog"/);
  });

  it('throws when orchestrator does not end with .js', () => {
    const formats = [
      { name: 'blog', orchestrator: 'src/formats/opencode.py' },
    ];
    expect(() => validateFormatDefinitions(formats, '/f.json'))
      .toThrow(/must be a .js file/);
  });
});
