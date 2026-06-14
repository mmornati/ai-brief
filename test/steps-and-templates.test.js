import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const STEPS_DIR = resolve(HERE, '..', 'steps');
const TEMPLATES_DIR = resolve(HERE, '..', 'src', 'templates', 'default');
const PIPELINE_FILE = resolve(HERE, '..', 'pipeline-definition', 'pipeline.json');

const KEBAB_RE = /^[a-z](?:-?[a-z0-9]+)*\.md$/;

function readSafe(path) {
  try {
    return readFileSync(path, 'utf-8');
  } catch (err) {
    throw new Error(`Cannot read ${path}: ${err.message}`);
  }
}

function readPipeline() {
  if (!existsSync(PIPELINE_FILE)) {
    throw new Error(`pipeline.json missing at ${PIPELINE_FILE}`);
  }
  try {
    const data = JSON.parse(readFileSync(PIPELINE_FILE, 'utf-8'));
    if (!Array.isArray(data?.steps)) {
      throw new Error(`pipeline.json 'steps' is missing or not an array`);
    }
    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`pipeline.json contains invalid JSON: ${err.message}`);
    }
    throw err;
  }
}

function instructionsBlock(content) {
  const fromIntro = content.match(/^#\s+\S+([\s\S]*?)(?=^##\s+|\Z)/m);
  return fromIntro ? fromIntro[1] : '';
}

function listMarkdownFiles(dir) {
  return readdirSync(dir).filter(f => f.endsWith('.md'));
}

describe('Step prompt files (AC #1, #3, #4, #5)', () => {
  const stepFiles = listMarkdownFiles(STEPS_DIR);

  it('steps/ contains six prompt files', () => {
    expect(stepFiles.length).toBe(6);
  });

  it('all step files are kebab-case and exist on disk', () => {
    stepFiles.forEach(file => {
      expect(file).toMatch(KEBAB_RE);
      expect(existsSync(resolve(STEPS_DIR, file))).toBe(true);
    });
  });

  stepFiles.forEach(file => {
    it(`${file} is a non-empty markdown file with required sections`, () => {
      const content = readSafe(resolve(STEPS_DIR, file));
      expect(content.length).toBeGreaterThan(0);
      expect(content).toMatch(/^#\s+\w+/m);
      expect(content).toMatch(/^##\s+Instructions\b/im);
    });
  });

  it('validate.md instructs to check structure, spelling, and completeness', () => {
    const content = readSafe(resolve(STEPS_DIR, 'validate.md'));
    const body = instructionsBlock(content);
    expect(body).toMatch(/structur/i);
    expect(body).toMatch(/spelling/i);
    expect(body).toMatch(/completeness/i);
  });

  it('review.md instructs an adversarial review pass', () => {
    const content = readSafe(resolve(STEPS_DIR, 'review.md'));
    const body = instructionsBlock(content);
    expect(body).toMatch(/adversarial/i);
    expect(body).toMatch(/review/i);
  });
});

describe('Default templates (AC #2, #3)', () => {
  const templateFiles = listMarkdownFiles(TEMPLATES_DIR);

  it('templates/ contains brief, story, and slide', () => {
    expect(templateFiles.sort()).toEqual(['brief.md', 'slide.md', 'story.md']);
  });

  it('all template files are kebab-case and exist on disk', () => {
    templateFiles.forEach(file => {
      expect(file).toMatch(KEBAB_RE);
      expect(existsSync(resolve(TEMPLATES_DIR, file))).toBe(true);
    });
  });

  templateFiles.forEach(file => {
    it(`${file} is a non-empty file`, () => {
      const content = readSafe(resolve(TEMPLATES_DIR, file));
      expect(content.length).toBeGreaterThan(0);
    });
  });

  it('brief.md has frontmatter with title, date, tags', () => {
    const content = readSafe(resolve(TEMPLATES_DIR, 'brief.md'));
    expect(content).toMatch(/^---\n[\s\S]*?\n---/);
    expect(content).toMatch(/^title:/m);
    expect(content).toMatch(/^date:/m);
    expect(content).toMatch(/^tags:/m);
  });

  it('brief.md has Introduction, Body, Conclusion sections', () => {
    const content = readSafe(resolve(TEMPLATES_DIR, 'brief.md'));
    expect(content).toMatch(/^##\s+Introduction\b/m);
    expect(content).toMatch(/^##\s+Body\b/m);
    expect(content).toMatch(/^##\s+Conclusion\b/m);
  });

  it('slide.md uses Marp frontmatter, slide separators, speaker notes, and class directives', () => {
    const content = readSafe(resolve(TEMPLATES_DIR, 'slide.md'));
    expect(content).toMatch(/^marp:\s*true/m);
    expect(content).toMatch(/<!--\s*speaker:/);
    expect(content).toMatch(/<!--\s*_class:/);

    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/m);
    const frontmatter = fmMatch ? fmMatch[0] : '';
    const fmDashes = (frontmatter.match(/^---$/gm) || []).length;
    const allDashes = (content.match(/^---$/gm) || []).length;
    const slideSeparators = allDashes - fmDashes;
    expect(slideSeparators).toBeGreaterThanOrEqual(2);
  });

  it('story.md has standard story template structure', () => {
    const content = readSafe(resolve(TEMPLATES_DIR, 'story.md'));
    expect(content).toMatch(/^##\s+Story\b/m);
    expect(content).toMatch(/^##\s+Acceptance Criteria\b/m);
    expect(content).toMatch(/^##\s+Tasks\s*\/?\s*Subtasks\b/m);
    expect(content).toMatch(/^##\s+Dev Notes\b/m);
    expect(content).toMatch(/^##\s+Dev Agent Record\b/m);
  });
});

describe('Pipeline registry ↔ step files', () => {
  it('every pipeline step has a string kebab-case name and a corresponding file', () => {
    const pipeline = readPipeline();
    pipeline.steps.forEach(step => {
      expect(typeof step.name).toBe('string');
      expect(step.name.length).toBeGreaterThan(0);
      expect(step.name).toMatch(/^[a-z](?:-?[a-z0-9]+)*$/);
      const expectedFile = `${step.name}.md`;
      expect(existsSync(resolve(STEPS_DIR, expectedFile))).toBe(true);
    });
  });
});
