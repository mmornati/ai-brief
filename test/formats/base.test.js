import { describe, it, expect, afterAll } from 'vitest';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { FormatWriter } from '../../src/formats/base.js';
import { getProjectRoot } from '../../src/utils/paths.js';

const projectRoot = getProjectRoot();
const generatedFiles = [];

class MockWriter extends FormatWriter {
  constructor() {
    super('mock', 'mock.md', 'test');
  }

  async render(content, metadata = {}) {
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('Cannot generate mock output: accumulated content is empty');
    }
    const title = this.parseTitle(content, metadata.inputFile);
    const output = `# ${title}\n\n${content}`;
    const outPath = await this.writeOutput(metadata.inputFile, output);
    generatedFiles.push(outPath);
    return outPath;
  }
}

describe('FormatWriter base class', () => {
  beforeEach(() => {
    generatedFiles.length = 0;
  });
  afterAll(() => {
    for (const file of generatedFiles) {
      try { rmSync(file, { force: true }); } catch { }
    }
    try { rmSync(resolve(projectRoot, 'ai-brief-output', 'mock'), { recursive: true, force: true }); } catch { }
  });

  it('cannot be instantiated directly', () => {
    expect(() => new FormatWriter('test')).toThrow(/abstract/);
  });

  it('render throws if not overridden', async () => {
    class IncompleteWriter extends FormatWriter {
      constructor() { super('incomplete'); }
    }
    const writer = new IncompleteWriter();
    await expect(writer.render('content', {})).rejects.toThrow(/must implement render/);
  });

  it('subclass can be instantiated and render works', async () => {
    const writer = new MockWriter();
    expect(writer.formatName).toBe('mock');
    expect(writer.templateName).toBe('mock.md');
    expect(writer.defaultInputName).toBe('test');
  });

  it('parseTitle extracts H1 heading', () => {
    const writer = new MockWriter();
    expect(writer.parseTitle('# My Title\n\nContent', 'file.md')).toBe('My Title');
  });

  it('parseTitle falls back to filename when no H1', () => {
    const writer = new MockWriter();
    expect(writer.parseTitle('No heading here', 'my-file.md')).toBe('My File');
  });

  it('parseTitle falls back to Untitled when no H1 and no inputFile', () => {
    const writer = new MockWriter();
    expect(writer.parseTitle('No heading here', undefined)).toBe('Untitled');
  });

  it('getOutputPath returns correct directory and file path', () => {
    const writer = new MockWriter();
    const { outDir, outPath } = writer.getOutputPath('docs/my-input.md');
    expect(outDir).toContain('ai-brief-output');
    expect(outDir).toContain('mock');
    expect(outPath).toMatch(/my-input-mock\.md$/);
  });

  it('getOutputPath uses defaultInputName when no inputFile', () => {
    const writer = new MockWriter();
    const { outPath } = writer.getOutputPath(undefined);
    expect(outPath).toMatch(/test-mock\.md$/);
  });

  it('readTemplate returns null when template does not exist', async () => {
    const writer = new MockWriter();
    const result = await writer.readTemplate();
    expect(result).toBeNull();
  });

  it('mock writer produces output file', async () => {
    const writer = new MockWriter();
    const result = await writer.render('# Test Content\n\nBody text.', { inputFile: 'test-input.md' });
    expect(result).toContain('ai-brief-output');
    expect(result).toContain('mock');
    expect(result).toMatch(/test-input-mock\.md$/);
    expect(existsSync(result)).toBe(true);
  });

  it('mock writer throws on empty content', async () => {
    const writer = new MockWriter();
    await expect(writer.render('', { inputFile: 'empty.md' })).rejects.toThrow(/empty/);
    await expect(writer.render('   ', {})).rejects.toThrow(/empty/);
    await expect(writer.render(null, {})).rejects.toThrow(/empty/);
  });

  it('new format writer integrates with pipeline pattern', async () => {
    class NewsletterWriter extends FormatWriter {
      constructor() { super('newsletter', 'newsletter.md', 'digest'); }
      async render(content, metadata = {}) {
        if (typeof content !== 'string' || content.trim().length === 0) {
          throw new Error('Cannot generate newsletter: accumulated content is empty');
        }
        const title = this.parseTitle(content, metadata.inputFile);
        const output = `# Newsletter: ${title}\n\n${content}`;
        const outPath = await this.writeOutput(metadata.inputFile, output);
        generatedFiles.push(outPath);
        return outPath;
      }
    }

    const writer = new NewsletterWriter();
    expect(writer.formatName).toBe('newsletter');
    expect(writer.templateName).toBe('newsletter.md');
    expect(writer.defaultInputName).toBe('digest');

    const result = await writer.render('# Weekly Update\n\nNews here.', { inputFile: 'week-01.md' });
    expect(result).toMatch(/week-01-newsletter\.md$/);
    expect(existsSync(result)).toBe(true);

    try { rmSync(resolve(projectRoot, 'ai-brief-output', 'newsletter'), { recursive: true, force: true }); } catch { }
  });
});
