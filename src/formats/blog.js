import { FormatWriter } from './base.js';

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const eqIdx = line.indexOf(':');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if (key === 'tags') {
      const tagMatch = value.match(/^\[([^\]]*)\]$/);
      if (tagMatch) {
        frontmatter.tags = tagMatch[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      }
    } else if (key === 'title') {
      frontmatter.title = value.replace(/^["']|["']$/g, '');
    }
  }
  return frontmatter;
}

function extractTags(content) {
  const fm = parseFrontmatter(content);
  if (fm.tags && fm.tags.length > 0) return fm.tags;

  const lines = content.split('\n');
  const tagSet = new Set();
  let inResearch = false;
  for (const line of lines) {
    if (/^##\s+research\b/i.test(line)) inResearch = true;
    else if (/^##\s/.test(line) && !/^##\s+research\b/i.test(line)) inResearch = false;
    if (inResearch) {
      const match = line.match(/tags:\s*\[([^\]]+)\]/i);
      if (match) {
        match[1].split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagSet.add(t));
      }
      const bullet = line.match(/^-\s*`([^`]+)`/);
      if (bullet) tagSet.add(bullet[1]);
    }
  }
  return [...tagSet];
}

function escapeYamlString(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function generateFrontmatter(title, tags) {
  const today = new Date().toISOString().split('T')[0];
  const tagsYaml = tags.length > 0
    ? tags.map(t => `  - "${escapeYamlString(t)}"`).join('\n')
    : '[]';
  return [
    '---',
    `title: "${escapeYamlString(title)}"`,
    `date: ${today}`,
    'tags:',
    tagsYaml,
    'draft: true',
    '---',
  ].join('\n');
}

function extractBody(content) {
  return content.replace(/^---[\s\S]*?---\n*/, '').trim();
}

function ensureHeadings(body) {
  const hasH2 = /^##\s/m.test(body);
  const hasH3 = /^###\s/m.test(body);
  if (hasH2 || hasH3) return body;
  const lines = body.split('\n');
  if (lines.length > 0 && !lines[0].startsWith('#')) {
    lines.unshift('## Overview');
  }
  return lines.join('\n');
}

class BlogWriter extends FormatWriter {
  constructor() {
    super('blog', 'blog.md', 'post');
  }

  async render(accumulatedContent, metadata = {}) {
    if (typeof accumulatedContent !== 'string' || accumulatedContent.trim().length === 0) {
      throw new Error('Cannot generate blog post: accumulated content is empty');
    }

    const title = this.parseTitle(accumulatedContent, metadata.inputFile);
    const tags = extractTags(accumulatedContent);
    const frontmatter = generateFrontmatter(title, tags);

    let body = extractBody(accumulatedContent);
    body = ensureHeadings(body);

    const templateContent = await this.readTemplate();
    const output = templateContent !== null
      ? templateContent.replace('{{frontmatter}}', frontmatter).replace('{{content}}', body)
      : frontmatter + '\n\n' + body;

    return this.writeOutput(metadata.inputFile, output);
  }
}

const writer = new BlogWriter();

export async function render(accumulatedContent, metadata = {}) {
  return writer.render(accumulatedContent, metadata);
}

export default render;
