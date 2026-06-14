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

  it('skillDir matches ai-brief-{format} pattern', () => {
    const result = generateSkill(samplePipeline, sampleFormat);
    expect(result.skillDir).toBe('ai-brief-blog');
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
    expect(result.skillDir).toBe('ai-brief-blog');
  });

  it('handles missing steps', () => {
    const result = generateSkill({}, sampleFormat);
    expect(result.skillContent).toContain('ai-brief-blog');
  });
});

describe('opencode generateMasterSkill', () => {
  const formats = [
    { name: 'blog', orchestrator: 'src/formats/opencode.js' },
    { name: 'slides', orchestrator: 'src/formats/claude.js' },
  ];

  it('returns an object with skillDir ai-brief-run', () => {
    const result = generateMasterSkill(samplePipeline, formats);
    expect(result).toHaveProperty('skillDir', 'ai-brief-run');
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
});
