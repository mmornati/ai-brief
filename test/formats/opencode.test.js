import { describe, it, expect } from 'vitest';
import { generateSkill, generateMasterSkill } from '../../src/formats/opencode.js';

const samplePipeline = {
  steps: [
    { name: 'validate', promptFile: 'steps/validate.md', description: 'Validate input markdown' },
    { name: 'research', promptFile: 'steps/research.md', description: 'Research domain context' },
    { name: 'format', promptFile: 'steps/format.md', description: 'Apply output format' },
  ],
};

const sampleFormat = { name: 'blog', orchestrator: 'src/formats/opencode.js' };

describe('opencode generateSkill', () => {
  it('returns an object with skillDir and skillContent', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result).toHaveProperty('skillDir');
    expect(result).toHaveProperty('skillContent');
  });

  it('skillDir is the unprefixed format name (ai-brief- is added by the installer)', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result.skillDir).toBe('blog');
  });

  it('skillContent references CLI entry point', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result.skillContent).toContain('node src/cli.js run');
    expect(result.skillContent).toContain('--format blog');
  });

  it('skillContent lists pipeline steps', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result.skillContent).toContain('validate');
    expect(result.skillContent).toContain('research');
    expect(result.skillContent).toContain('format');
    expect(result.skillContent).toContain('Validate input markdown');
  });

  it('handles empty steps gracefully', () => {
    const result = generateSkill({ steps: [] }, sampleFormat);
    expect(result.skillContent).toContain('ai-brief-blog');
    expect(result.skillDir).toBe('blog');
  });

  it('handles missing steps', () => {
    const result = generateSkill({}, sampleFormat);
    expect(result.skillContent).toContain('ai-brief-blog');
  });

  it('filters out malformed step entries', () => {
    const result = generateSkill(
      { steps: [null, { name: 'ok', description: 'good' }, { name: 'no-desc' }, 'not-an-object'] },
      sampleFormat
    );
    expect(result.skillContent).toContain('ok');
    expect(result.skillContent).toContain('good');
    expect(result.skillContent).not.toContain('undefined');
  });

  it('rejects path-traversal format names', () => {
    expect(() => generateSkill(samplePipeline, { name: '../etc' })).toThrow(/Invalid format name/);
    expect(() => generateSkill(samplePipeline, { name: 'foo/bar' })).toThrow(/Invalid format name/);
    expect(() => generateSkill(samplePipeline, { name: '' })).toThrow(/Invalid format name/);
    expect(() => generateSkill(samplePipeline, {})).toThrow(/Invalid format name/);
    expect(() => generateSkill(samplePipeline, { name: 'OK' })).toThrow(/Invalid format name/);
  });
});

describe('opencode generateMasterSkill', () => {
  const formats = [
    { name: 'blog', orchestrator: 'src/formats/opencode.js' },
    { name: 'slides', orchestrator: 'src/formats/claude.js' },
  ];

  it('returns an object with skillDir "run" (prefix added by installer)', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result).toHaveProperty('skillDir', 'run');
    expect(result).toHaveProperty('skillContent');
  });

  it('lists supported formats', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result.skillContent).toContain('blog');
    expect(result.skillContent).toContain('slides');
  });

  it('references generic CLI usage', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result.skillContent).toContain('--format <format>');
  });

  it('lists pipeline steps', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result.skillContent).toContain('validate');
    expect(result.skillContent).toContain('research');
  });

  it('handles null/undefined formats', () => {
    const result = generateMasterSkill(samplePipeline, null);
    expect(result.skillDir).toBe('run');
    expect(result.skillContent).toContain('ai-brief-run');
  });

  it('filters malformed format entries from the listing', () => {
    const result = generateMasterSkill(samplePipeline, [
      null,
      { name: 'good' },
      { name: 'BAD NAME' },
      'not-an-object',
    ]);
    expect(result.skillContent).toContain('`good`');
    expect(result.skillContent).not.toContain('`BAD NAME`');
    expect(result.skillContent).not.toContain('`undefined`');
  });
});
