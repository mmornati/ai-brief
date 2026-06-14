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

  it('skillDir matches ai-brief-{format} pattern', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result.skillDir).toBe('ai-brief-slides');
  });

  it('skillContent has Claude Code header', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result.skillContent).toContain('Claude Code Skill');
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
    expect(result.skillDir).toBe('ai-brief-slides');
  });
});

describe('claude generateMasterSkill', () => {
  const formats = [
    { name: 'blog', orchestrator: 'src/formats/opencode.js' },
    { name: 'slides', orchestrator: 'src/formats/claude.js' },
  ];

  it('returns an object with skillDir ai-brief-run', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result).toHaveProperty('skillDir', 'ai-brief-run');
    expect(result).toHaveProperty('skillContent');
  });

  it('has Claude Code header', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result.skillContent).toContain('Claude Code Skill');
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
});
