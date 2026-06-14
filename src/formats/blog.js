import path from 'node:path';
import { getProjectRoot } from '../utils/paths.js';
import { resolveTemplate } from '../templates/resolver.js';
import { readFile, writeFile, mkdir } from '../utils/file.js';

function parseTitle(content) {
  const match = content.match(/^# (.+)/m);
  return match ? match[1].trim() : 'Untitled';
}

function extractTags(content) {
  const lines = content.split('\n');
  const tags = [];
  let inResearch = false;
  for (const line of lines) {
    if (/^##\s*research/i.test(line)) inResearch = true;
    else if (/^##\s/.test(line) && !/^##\s*research/i.test(line)) inResearch = false;
    if (inResearch) {
      const match = line.match(/tags:\s*\[([^\]]+)\]/i);
      if (match) {
        tags.push(...match[1].split(',').map(t => t.trim()).filter(Boolean));
      }
      const bullet = line.match(/^-\s*`([^`]+)`/);
      if (bullet) tags.push(bullet[1]);
    }
  }
  return tags;
}

function generateFrontmatter(title, tags) {
  const today = new Date().toISOString().split('T')[0];
  const tagsYaml = tags.length > 0
    ? `  - ${tags.join('\n  - ')}`
    : '[]';
  return [
    '---',
    `title: "${title}"`,
    `date: ${today}`,
    'tags:',
    tagsYaml,
    'draft: true',
    '---',
  ].join('\n');
}

function extractBody(content) {
  return content.replace(/---[\s\S]*?---\n*/g, '').trim();
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

export async function render(accumulatedContent, metadata = {}) {
  if (!accumulatedContent || accumulatedContent.trim().length === 0) {
    throw new Error('Cannot generate blog post: accumulated content is empty');
  }

  const projectRoot = getProjectRoot();
  const inputName = metadata.inputFile
    ? path.basename(metadata.inputFile, path.extname(metadata.inputFile))
    : 'post';

  const title = parseTitle(accumulatedContent);
  const tags = extractTags(accumulatedContent);
  const frontmatter = generateFrontmatter(title, tags);

  let body = extractBody(accumulatedContent);
  body = ensureHeadings(body);

  let output;
  try {
    const templatePath = await resolveTemplate('blog.md');
    const templateContent = await readFile(templatePath);
    output = templateContent
      .replace('{{content}}', body)
      .replace('{{frontmatter}}', frontmatter);
  } catch {
    output = frontmatter + '\n\n' + body;
  }

  const outDir = path.resolve(projectRoot, 'ai-brief-output', 'blog');
  await mkdir(outDir);
  const outPath = path.resolve(outDir, `${inputName}-blog.md`);
  await writeFile(outPath, output);

  return outPath;
}

export default async function orchestrate(accumulatedContent, metadata = {}) {
  return render(accumulatedContent, metadata);
}
