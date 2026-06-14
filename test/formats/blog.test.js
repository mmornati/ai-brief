import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { render } from '../../src/formats/blog.js';
import { getProjectRoot } from '../../src/utils/paths.js';

const SAMPLE_CONTENT = `# My Blog Post

## Research

Some research findings.

tags: [tech, devtools]

## Write

The main content of the post.

### Subsection One

Detailed information about the topic.

### Subsection Two

More details here.

## Review

Final review notes.`;

const SAMPLE_CONTENT_NO_H1 = `## Section One

Content without an H1 heading.`;

const SAMPLE_CONTENT_NO_HEADINGS = `Just a plain paragraph without any markdown headings.`;

const projectRoot = getProjectRoot();
const blogOutDir = resolve(projectRoot, 'ai-brief-output', 'blog');
const userTemplatePath = resolve(projectRoot, 'src', 'templates', 'user', 'blog.md');
const defaultTemplatePath = resolve(projectRoot, 'src', 'templates', 'default', 'blog.md');
const userTemplateBackup = resolve(projectRoot, 'src', 'templates', 'user', 'blog.md.test-bak');

const generatedFiles = [];

function trackOutput(inputFile) {
  const base = inputFile.replace(/\.md$/, '').replace(/.*\//, '');
  const outPath = resolve(blogOutDir, `${base}-blog.md`);
  generatedFiles.push(outPath);
  return outPath;
}

describe('blog format render', () => {
  beforeAll(() => {
    if (!existsSync(blogOutDir)) {
      mkdirSync(blogOutDir, { recursive: true });
    }
  });

  afterAll(() => {
    for (const file of generatedFiles) {
      try { rmSync(file, { force: true }); } catch { }
    }
    try { rmSync(userTemplatePath, { force: true }); } catch { }
    try { rmSync(userTemplateBackup, { force: true }); } catch { }
  });

  beforeEach(() => {
    try { rmSync(userTemplatePath, { force: true }); } catch { }
    try { rmSync(userTemplateBackup, { force: true }); } catch { }
  });

  it('produces a markdown file with frontmatter and body', async () => {
    const outPath = trackOutput('docs/my-post.md');
    const result = await render(SAMPLE_CONTENT, { inputFile: 'docs/my-post.md' });
    expect(result).toBe(outPath);
    expect(existsSync(outPath)).toBe(true);

    const output = readFileSync(outPath, 'utf-8');
    expect(output).toMatch(/^---\n/);
    expect(output).toContain('title: "My Blog Post"');
    expect(output).toContain('date:');
    expect(output).toContain('draft: true');
    expect(output).toContain('tags:');
    expect(output).toContain('## Introduction');
    expect(output).toContain('## Write');
    expect(output).toContain('### Subsection One');
  });

  it('frontmatter fields are non-empty and well-formed YAML', async () => {
    const outPath = trackOutput('post.md');
    await render(SAMPLE_CONTENT, { inputFile: 'post.md' });
    const output = readFileSync(outPath, 'utf-8');
    const frontmatter = output.match(/^---\n([\s\S]*?)\n---/);
    expect(frontmatter).not.toBeNull();
    const yaml = frontmatter[1];
    expect(yaml).toContain('title:');
    expect(yaml).toContain('date:');
    expect(yaml).toContain('draft:');
    expect(yaml).toContain('tags:');
    expect(yaml).not.toContain('undefined');
    expect(yaml).not.toContain('null');
  });

  it('body is non-empty markdown with at least one heading', async () => {
    const outPath = trackOutput('post2.md');
    await render(SAMPLE_CONTENT, { inputFile: 'post2.md' });
    const output = readFileSync(outPath, 'utf-8');
    const body = output.replace(/^---[\s\S]*?---\n*/, '');
    expect(body.trim().length).toBeGreaterThan(0);
    expect(body).toMatch(/^##\s/m);
  });

  it('uses user template over default when available', async () => {
    const userTemplate = '{{frontmatter}}\n\n**User Custom Section**\n\n{{content}}';
    writeFileSync(userTemplatePath, userTemplate, 'utf-8');

    const outPath = trackOutput('post3.md');
    await render(SAMPLE_CONTENT, { inputFile: 'post3.md' });
    const output = readFileSync(outPath, 'utf-8');
    expect(output).toContain('**User Custom Section**');
    expect(output).not.toContain('## Introduction');
  });

  it('falls back to default template when no user template exists', async () => {
    const outPath = trackOutput('post4.md');
    await render(SAMPLE_CONTENT, { inputFile: 'post4.md' });
    const output = readFileSync(outPath, 'utf-8');
    expect(output).toContain('## Introduction');
    expect(output).toContain('## Conclusion');
  });

  it('throws descriptive error for empty content', async () => {
    await expect(render('', { inputFile: 'empty.md' })).rejects.toThrow(/empty/);
    await expect(render('   ', { inputFile: 'empty.md' })).rejects.toThrow(/empty/);
    await expect(render(null, { inputFile: 'empty.md' })).rejects.toThrow(/empty/);
  });

  it('uses "Untitled" for content without H1 heading', async () => {
    const outPath = trackOutput('no-h1.md');
    await render(SAMPLE_CONTENT_NO_H1, { inputFile: 'no-h1.md' });
    const output = readFileSync(outPath, 'utf-8');
    expect(output).toContain('title: "Untitled"');
  });

  it('ensures at least one H2 heading exists in output body', async () => {
    const outPath = trackOutput('no-headings.md');
    await render(SAMPLE_CONTENT_NO_HEADINGS, { inputFile: 'no-headings.md' });
    const output = readFileSync(outPath, 'utf-8');
    const body = output.replace(/^---[\s\S]*?---\n*/, '');
    expect(body).toMatch(/^##\s/m);
  });

  it('outputs to ai-brief-output/blog/{input-name}-blog.md', async () => {
    const result = await render(SAMPLE_CONTENT, { inputFile: 'docs/my-post.md' });
    expect(result).toContain('ai-brief-output');
    expect(result).toContain('blog');
    expect(result).toMatch(/my-post-blog\.md$/);
  });

  it('uses input filename basename without extension', async () => {
    const result = await render(SAMPLE_CONTENT, { inputFile: 'path/to/article-name.md' });
    expect(result).toMatch(/article-name-blog\.md$/);
  });

  it('extracts tags from research step output', async () => {
    const outPath = trackOutput('tags.md');
    await render(SAMPLE_CONTENT, { inputFile: 'tags.md' });
    const output = readFileSync(outPath, 'utf-8');
    const frontmatter = output.match(/^---\n([\s\S]*?)\n---/);
    const yaml = frontmatter[1];
    expect(yaml).toMatch(/tech/);
    expect(yaml).toMatch(/devtools/);
  });
});
