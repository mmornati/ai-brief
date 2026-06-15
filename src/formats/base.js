import path from 'node:path';
import { getProjectRoot } from '../utils/paths.js';
import { resolveTemplate } from '../templates/resolver.js';
import { readFile, writeFile, mkdir } from '../utils/file.js';

export class FormatWriter {
  constructor(formatName, templateName, defaultInputName) {
    if (new.target === FormatWriter) {
      throw new Error('FormatWriter is abstract and cannot be instantiated directly');
    }
    this.formatName = formatName;
    this.templateName = templateName || `${formatName}.md`;
    this.defaultInputName = defaultInputName || formatName;
  }

  parseTitle(content, inputFile) {
    if (typeof content !== 'string') return 'Untitled';
    const h1Match = content.match(/^# (.+)/m);
    if (h1Match) return h1Match[1].trim();
    const fmBlock = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmBlock) {
      const titleLine = fmBlock[1].match(/^title:\s*"?([^"\n]+)"?/m);
      if (titleLine) return titleLine[1].trim();
    }
    if (inputFile) {
      const base = path.basename(inputFile, path.extname(inputFile));
      if (base) return base.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    return 'Untitled';
  }

  getOutputPath(inputFile) {
    const projectRoot = getProjectRoot();
    const inputName = inputFile
      ? path.basename(inputFile, path.extname(inputFile))
      : this.defaultInputName;
    const outDir = path.resolve(projectRoot, 'ai-brief-output', this.formatName);
    return { outDir, outPath: path.resolve(outDir, `${inputName}-${this.formatName}.md`) };
  }

  async resolveTemplatePath() {
    return resolveTemplate(this.templateName);
  }

  async readTemplate() {
    try {
      const templatePath = await this.resolveTemplatePath();
      return await readFile(templatePath);
    } catch (err) {
      if (!err.message.includes('not found. Tried:')) throw err;
      return null;
    }
  }

  async writeOutput(inputFile, content) {
    const { outDir, outPath } = this.getOutputPath(inputFile);
    await mkdir(outDir);
    await writeFile(outPath, content);
    return outPath;
  }

  async render(content, metadata) {
    throw new Error('FormatWriter subclasses must implement render(content, metadata)');
  }
}
