import { describe, it, expect } from 'vitest';
import { generateSkill, generateMasterSkill } from '../../src/formats/claude.js';

const samplePipeline = {
  steps: [
    { name: 'validate', promptFile: 'steps/validate.md', description: 'Validate input markdown' },
    { name: 'write', promptFile: 'steps/write.md', description: 'Write full content' },
    { name: 'review', promptFile: 'steps/review.md', description: 'Review and polish' },
  ],
};

const sampleFormat = { name: 'slides', orchestrator: 'src/formats/claude.js' };

describe('claude generateSkill', () => {
  it('returns an object with skillDir and skillContent', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result).toHaveProperty('skillDir');
    expect(result).toHaveProperty('skillContent');
  });

  it('skillDir is the unprefixed format name (ai-brief- is added by the installer)', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result.skillDir).toBe('slides');
  });

  it('skillContent has Claude Code YAML frontmatter', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result.skillContent).toMatch(/^---\nname: ai-brief-slides\n/);
    expect(result.skillContent).toMatch(/description: .*slides.*\n---/);
  });

  it('skillContent references CLI entry point', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result.skillContent).toContain('node src/cli.js run');
    expect(result.skillContent).toContain('--format slides');
  });

  it('skillContent lists pipeline steps', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result.skillContent).toContain('validate');
    expect(result.skillContent).toContain('write');
    expect(result.skillContent).toContain('review');
  });

  it('handles empty steps gracefully', () => {
    const result = generateSkill({ steps: [] }, sampleFormat);
    expect(result.skillContent).toContain('ai-brief-slides');
    expect(result.skillDir).toBe('slides');
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

describe('claude generateMasterSkill', () => {
  const formats = [
    { name: 'blog', orchestrator: 'src/formats/opencode.js' },
    { name: 'slides', orchestrator: 'src/formats/claude.js' },
  ];

  it('returns an object with skillDir "run" (prefix added by installer)', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result).toHaveProperty('skillDir', 'run');
    expect(result).toHaveProperty('skillContent');
  });

  it('has Claude Code YAML frontmatter', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result.skillContent).toMatch(/^---\nname: ai-brief-run\n/);
  });

  it('lists supported formats', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result.skillContent).toContain('blog');
    expect(result.skillContent).toContain('slides');
  });

  it('lists pipeline steps', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result.skillContent).toContain('validate');
    expect(result.skillContent).toContain('write');
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
