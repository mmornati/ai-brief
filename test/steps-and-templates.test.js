import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const STEPS_DIR = resolve('steps');
const TEMPLATES_DIR = resolve('src/templates/default');

const EXPECTED_STEPS = [
  'validate.md',
  'research.md',
  'structure.md',
  'write.md',
  'format.md',
  'review.md',
];

const EXPECTED_TEMPLATES = [
  'brief.md',
  'story.md',
  'slide.md',
];

describe('Step prompt files (AC #1)', () => {
  EXPECTED_STEPS.forEach(file => {
    it(`${file} exists in steps/`, () => {
      expect(existsSync(resolve(STEPS_DIR, file))).toBe(true);
    });

    it(`${file} is a non-empty markdown file`, () => {
      const content = readFileSync(resolve(STEPS_DIR, file), 'utf-8');
      expect(content.length).toBeGreaterThan(0);
      expect(content.startsWith('#')).toBe(true);
    });
  });

  it('all step files use kebab-case naming', () => {
    EXPECTED_STEPS.forEach(file => {
      expect(file).toMatch(/^[a-z][a-z0-9-]*\.md$/);
      expect(file).not.toMatch(/[A-Z_]/);
    });
  });
});

describe('Default templates (AC #2)', () => {
  EXPECTED_TEMPLATES.forEach(file => {
    it(`${file} exists in src/templates/default/`, () => {
      expect(existsSync(resolve(TEMPLATES_DIR, file))).toBe(true);
    });

    it(`${file} is a non-empty file`, () => {
      const content = readFileSync(resolve(TEMPLATES_DIR, file), 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  it('brief.md has frontmatter with title, date, tags', () => {
    const content = readFileSync(resolve(TEMPLATES_DIR, 'brief.md'), 'utf-8');
    expect(content).toContain('title:');
    expect(content).toContain('date:');
    expect(content).toContain('tags:');
    expect(content).toContain('---');
  });

  it('brief.md has intro, body, conclusion sections', () => {
    const content = readFileSync(resolve(TEMPLATES_DIR, 'brief.md'), 'utf-8');
    expect(content).toContain('Introduction');
    expect(content).toContain('Body');
    expect(content).toContain('Conclusion');
  });

  it('slide.md uses --- slide separators and speaker notes', () => {
    const content = readFileSync(resolve(TEMPLATES_DIR, 'slide.md'), 'utf-8');
    const slideCount = (content.match(/^---$/gm) || []).length;
    expect(slideCount).toBeGreaterThanOrEqual(3);
    expect(content).toContain('speaker:');
    expect(content).toContain('marp: true');
  });

  it('story.md has standard story template structure', () => {
    const content = readFileSync(resolve(TEMPLATES_DIR, 'story.md'), 'utf-8');
    expect(content).toContain('## Story');
    expect(content).toContain('## Acceptance Criteria');
    expect(content).toContain('## Tasks / Subtasks');
    expect(content).toContain('## Dev Notes');
    expect(content).toContain('## Dev Agent Record');
  });
});

describe('Step prompt content (AC #4, #5)', () => {
  it('validate.md instructs to validate input', () => {
    const content = readFileSync(resolve(STEPS_DIR, 'validate.md'), 'utf-8');
    expect(content).toMatch(/validat/i);
    expect(content).toMatch(/structur/i);
    expect(content).toMatch(/spelling/i);
    expect(content).toMatch(/completeness/i);
  });

  it('review.md instructs adversarial review pass', () => {
    const content = readFileSync(resolve(STEPS_DIR, 'review.md'), 'utf-8');
    expect(content).toMatch(/adversarial/i);
    expect(content).toMatch(/review/i);
  });
});

describe('Naming conventions (AC #3)', () => {
  it('step files follow kebab-case', () => {
    EXPECTED_STEPS.forEach(file => {
      expect(file).toMatch(/^[a-z][a-z0-9-]*\.md$/);
    });
  });

  it('template files follow kebab-case', () => {
    EXPECTED_TEMPLATES.forEach(file => {
      expect(file).toMatch(/^[a-z][a-z0-9-]*\.md$/);
    });
  });

  it('step names in pipeline.json match step file names', () => {
    const pipeline = JSON.parse(
      readFileSync(resolve('pipeline-definition/pipeline.json'), 'utf-8')
    );
    pipeline.steps.forEach(step => {
      const expectedFile = `${step.name}.md`;
      expect(existsSync(resolve(STEPS_DIR, expectedFile))).toBe(true);
    });
  });
});
