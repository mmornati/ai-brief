import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile, exists } from '../src/utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

async function createTempDir() {
  const tmpBase = path.resolve(PROJECT_ROOT, 'test', '.tmp');
  await mkdir(tmpBase).catch(() => {});
  const tmpDir = await fs.promises.mkdtemp(path.join(tmpBase, 'install-test-'));
  return tmpDir;
}

function createSkillSource(skillsDir, name) {
  const skillPath = path.join(skillsDir, name);
  fs.mkdirSync(skillPath, { recursive: true });
  fs.writeFileSync(path.join(skillPath, 'SKILL.md'), `# ai-brief-${name} skill\n`, 'utf-8');
}

function createTemplateSource(templatesDir, name) {
  const content = `# ${name} template\n`;
  fs.writeFileSync(path.join(templatesDir, name), content, 'utf-8');
}

function createStepSource(stepsDir, name) {
  const content = `# ${name} prompt\n`;
  fs.writeFileSync(path.join(stepsDir, name), content, 'utf-8');
}

describe('install', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await createTempDir();
  });

  afterEach(async () => {
    if (tmpDir && (await exists(tmpDir))) {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('registers skills for opencode', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    await mkdir(path.join(sourceRoot, 'skills', 'slides'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# ai-brief-blog skill\n');
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'slides', 'SKILL.md'), '# ai-brief-slides skill\n');

    const projectDir = await createTempDir();
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    const blogSkill = path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md');
    const slidesSkill = path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-slides', 'SKILL.md');

    expect(await exists(blogSkill)).toBe(true);
    expect(await exists(slidesSkill)).toBe(true);
    expect(fs.readFileSync(blogSkill, 'utf-8')).toContain('ai-brief-blog skill');

    await fs.promises.rm(projectDir, { recursive: true, force: true });
  });

  it('registers skills for Claude Code', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# skill\n');

    const projectDir = await createTempDir();
    await mkdir(path.join(projectDir, '.claude'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['claude'], sourceRoot });

    const skillPath = path.join(projectDir, '.claude', 'skills', 'ai-brief-blog', 'SKILL.md');
    expect(await exists(skillPath)).toBe(true);

    await fs.promises.rm(projectDir, { recursive: true, force: true });
  });

  it('registers skills for both IDEs', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# skill\n');

    const projectDir = await createTempDir();
    await mkdir(path.join(projectDir, '.opencode'));
    await mkdir(path.join(projectDir, '.claude'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode', 'claude'], sourceRoot });

    expect(await exists(path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md'))).toBe(true);
    expect(await exists(path.join(projectDir, '.claude', 'skills', 'ai-brief-blog', 'SKILL.md'))).toBe(true);

    await fs.promises.rm(projectDir, { recursive: true, force: true });
  });

  it('errors when no IDE detected', async () => {
    const sourceRoot = tmpDir;

    const { install } = await import('../src/install.js');
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const emptyDir = await createTempDir();
    await install(emptyDir, { ides: [], sourceRoot });

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: No supported AI assistant detected.');

    exitSpy.mockRestore();
    errorSpy.mockRestore();
    await fs.promises.rm(emptyDir, { recursive: true, force: true });
  });

  it('deploys template files', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'default'));
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'default', 'brief.md'), '# brief template\n');
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'default', 'story.md'), '# story template\n');

    const projectDir = await createTempDir();
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    expect(await exists(path.join(projectDir, 'ai-brief', 'templates', 'brief', 'default.md'))).toBe(true);
    expect(await exists(path.join(projectDir, 'ai-brief', 'templates', 'story', 'default.md'))).toBe(true);

    await fs.promises.rm(projectDir, { recursive: true, force: true });
  });

  it('deploys step prompts', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'steps'));
    fs.writeFileSync(path.join(sourceRoot, 'steps', 'validate.md'), '# validate prompt\n');
    fs.writeFileSync(path.join(sourceRoot, 'steps', 'research.md'), '# research prompt\n');

    const projectDir = await createTempDir();
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    expect(await exists(path.join(projectDir, 'ai-brief', 'steps', 'validate.md'))).toBe(true);
    expect(await exists(path.join(projectDir, 'ai-brief', 'steps', 'research.md'))).toBe(true);

    await fs.promises.rm(projectDir, { recursive: true, force: true });
  });

  it('backs up existing files before overwriting', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# new content\n');

    const projectDir = await createTempDir();
    await mkdir(path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog'));
    fs.writeFileSync(path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md'), '# old content\n');

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    const bakPath = path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md.bak');
    expect(await exists(bakPath)).toBe(true);
    expect(fs.readFileSync(bakPath, 'utf-8')).toBe('# old content\n');

    await fs.promises.rm(projectDir, { recursive: true, force: true });
  });

  it('dry-run does not modify files', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# content\n');

    const projectDir = await createTempDir();
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], dryRun: true, sourceRoot });

    const skillPath = path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md');
    expect(await exists(skillPath)).toBe(false);

    await fs.promises.rm(projectDir, { recursive: true, force: true });
  });

  it('auto-detects IDEs from target directory', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# content\n');

    const projectDir = await createTempDir();
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { sourceRoot });

    const skillPath = path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md');
    expect(await exists(skillPath)).toBe(true);

    await fs.promises.rm(projectDir, { recursive: true, force: true });
  });

  it('gracefully handles no source directories (empty skills)', async () => {
    const sourceRoot = tmpDir;

    const projectDir = await createTempDir();
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await expect(install(projectDir, { ides: ['opencode'], sourceRoot })).resolves.not.toThrow();

    await fs.promises.rm(projectDir, { recursive: true, force: true });
  });
});
