import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { render } from '../../src/formats/slides.js';
import { getProjectRoot } from '../../src/utils/paths.js';

const SAMPLE_CONTENT = `# My Presentation

## Introduction

Welcome to the presentation.

Note: Greet the audience and introduce the topic.

## Main Topic

Some key points about the main topic.

- Point one
- Point two
- Point three

[speaker]: Elaborate on each point with examples.

## Conclusion

Thank you for attending.

Note: Open the floor for questions.`;

const MINIMAL_CONTENT = `# Just a Title`;

const CONTENT_NO_H1 = `## Section One

Content without an H1 heading.

## Section Two

More content here.`;

const projectRoot = getProjectRoot();
const slidesOutDir = resolve(projectRoot, 'ai-brief-output', 'slides');
const userTemplatePath = resolve(projectRoot, 'src', 'templates', 'user', 'slide.md');
const defaultTemplatePath = resolve(projectRoot, 'src', 'templates', 'default', 'slide.md');

const generatedFiles = [];

function trackOutput(inputFile) {
  const base = inputFile.replace(/\.md$/, '').replace(/.*\//, '');
  const outPath = resolve(slidesOutDir, `${base}-slides.md`);
  generatedFiles.push(outPath);
  return outPath;
}

describe('slides format render', () => {
  beforeAll(() => {
    if (!existsSync(slidesOutDir)) {
      mkdirSync(slidesOutDir, { recursive: true });
    }
  });

  afterAll(() => {
    for (const file of generatedFiles) {
      try { rmSync(file, { force: true }); } catch { }
    }
    try { rmSync(userTemplatePath, { force: true }); } catch { }
  });

  beforeEach(() => {
    try { rmSync(userTemplatePath, { force: true }); } catch { }
  });

  it('produces a markdown file with --- slide separators', async () => {
    const outPath = trackOutput('docs/my-talk.md');
    const result = await render(SAMPLE_CONTENT, { inputFile: 'docs/my-talk.md' });
    expect(result).toBe(outPath);
    expect(existsSync(outPath)).toBe(true);

    const output = readFileSync(outPath, 'utf-8');
    expect(output).toContain('\n---\n');
  });

  it('has a title slide with the presentation title', async () => {
    const outPath = trackOutput('talk.md');
    await render(SAMPLE_CONTENT, { inputFile: 'talk.md' });
    const output = readFileSync(outPath, 'utf-8');
    expect(output).toMatch(/^#\s+My Presentation/m);
  });

  it('produces at least 3 slides (title, body, end)', async () => {
    const outPath = trackOutput('talk2.md');
    await render(SAMPLE_CONTENT, { inputFile: 'talk2.md' });
    const output = readFileSync(outPath, 'utf-8');
    const slides = output.split('\n---\n');
    expect(slides.length).toBeGreaterThanOrEqual(3);
  });

  it('formats speaker notes as <!-- speaker: note text -->', async () => {
    const outPath = trackOutput('talk3.md');
    await render(SAMPLE_CONTENT, { inputFile: 'talk3.md' });
    const output = readFileSync(outPath, 'utf-8');
    expect(output).toContain('<!-- speaker: Greet the audience and introduce the topic. -->');
    expect(output).toContain('<!-- speaker: Elaborate on each point with examples. -->');
    expect(output).toContain('<!-- speaker: Open the floor for questions. -->');
  });

  it('strips original Note: and [speaker]: lines from slide content', async () => {
    const outPath = trackOutput('talk4.md');
    await render(SAMPLE_CONTENT, { inputFile: 'talk4.md' });
    const output = readFileSync(outPath, 'utf-8');
    expect(output).not.toMatch(/^Note:/m);
    expect(output).not.toMatch(/^\[speaker\]:/m);
  });

  it('uses user template over default when available', async () => {
    const userTemplate = '<!-- custom slide deck -->\n{{slides}}';
    writeFileSync(userTemplatePath, userTemplate, 'utf-8');

    const outPath = trackOutput('talk5.md');
    await render(SAMPLE_CONTENT, { inputFile: 'talk5.md' });
    const output = readFileSync(outPath, 'utf-8');
    expect(output).toContain('<!-- custom slide deck -->');
  });

  it('falls back to default template when no user template exists', async () => {
    const outPath = trackOutput('talk6.md');
    await render(SAMPLE_CONTENT, { inputFile: 'talk6.md' });
    const output = readFileSync(outPath, 'utf-8');
    expect(output.trim().length).toBeGreaterThan(0);
  });

  it('produces at least one slide from minimal content (title only)', async () => {
    const outPath = trackOutput('minimal.md');
    await render(MINIMAL_CONTENT, { inputFile: 'minimal.md' });
    const output = readFileSync(outPath, 'utf-8');
    expect(output.trim().length).toBeGreaterThan(0);
    expect(output).toContain('Just a Title');
  });

  it('throws descriptive error for empty content', async () => {
    await expect(render('', { inputFile: 'empty.md' })).rejects.toThrow(/empty/);
    await expect(render('   ', { inputFile: 'empty.md' })).rejects.toThrow(/empty/);
    await expect(render(null, { inputFile: 'empty.md' })).rejects.toThrow(/empty/);
    await expect(render(123, { inputFile: 'empty.md' })).rejects.toThrow(/empty/);
  });

  it('outputs to ai-brief-output/slides/{input-name}-slides.md', async () => {
    const outPath = trackOutput('docs/my-talk.md');
    const result = await render(SAMPLE_CONTENT, { inputFile: 'docs/my-talk.md' });
    expect(result).toBe(outPath);
    expect(result).toContain('ai-brief-output');
    expect(result).toContain('slides');
    expect(result).toMatch(/my-talk-slides\.md$/);
  });

  it('derives title from filename when no H1 heading exists', async () => {
    const outPath = trackOutput('no-h1-talk.md');
    await render(CONTENT_NO_H1, { inputFile: 'no-h1-talk.md' });
    const output = readFileSync(outPath, 'utf-8');
    expect(output).toContain('No H1 Talk');
  });

  it('falls back to plain output when template is not found', async () => {
    const tempBackup = defaultTemplatePath + '.test-bak';
    renameSync(defaultTemplatePath, tempBackup);
    try {
      const outPath = trackOutput('fallback.md');
      const result = await render(SAMPLE_CONTENT, { inputFile: 'fallback.md' });
      expect(result).toContain('fallback-slides.md');
      const output = readFileSync(result, 'utf-8');
      expect(output).toContain('My Presentation');
      expect(output).toContain('\n---\n');
    } finally {
      renameSync(tempBackup, defaultTemplatePath);
    }
  });
});
