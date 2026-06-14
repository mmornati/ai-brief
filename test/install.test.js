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

describe('install', () => {
  let tmpDir;
  let projectDir;
  let logSpy;
  let errorSpy;

  beforeEach(async () => {
    tmpDir = await createTempDir();
    projectDir = await createTempDir();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    for (const dir of [tmpDir, projectDir]) {
      if (dir && (await exists(dir))) {
        await fs.promises.rm(dir, { recursive: true, force: true });
      }
    }
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('registers skills for opencode', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    await mkdir(path.join(sourceRoot, 'skills', 'slides'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# ai-brief-blog skill\n');
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'slides', 'SKILL.md'), '# ai-brief-slides skill\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    const blogSkill = path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md');
    const slidesSkill = path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-slides', 'SKILL.md');

    expect(await exists(blogSkill)).toBe(true);
    expect(await exists(slidesSkill)).toBe(true);
    expect(fs.readFileSync(blogSkill, 'utf-8')).toContain('ai-brief-blog skill');
  });

  it('registers skills for Claude Code', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# skill\n');
    await mkdir(path.join(projectDir, '.claude'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['claude'], sourceRoot });

    const skillPath = path.join(projectDir, '.claude', 'skills', 'ai-brief-blog', 'SKILL.md');
    expect(await exists(skillPath)).toBe(true);
  });

  it('registers skills for both IDEs', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# skill\n');
    await mkdir(path.join(projectDir, '.opencode'));
    await mkdir(path.join(projectDir, '.claude'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode', 'claude'], sourceRoot });

    expect(await exists(path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md'))).toBe(true);
    expect(await exists(path.join(projectDir, '.claude', 'skills', 'ai-brief-blog', 'SKILL.md'))).toBe(true);
  });

  it('throws InstallError when no IDE is detected', async () => {
    const { install, InstallError } = await import('../src/install.js');

    await expect(install(projectDir, { ides: [], sourceRoot: tmpDir }))
      .rejects.toBeInstanceOf(InstallError);
    await expect(install(projectDir, { ides: [], sourceRoot: tmpDir }))
      .rejects.toThrow('No supported AI assistant detected');
  });

  it('throws InstallError when no IDE config directory exists', async () => {
    const { install, InstallError } = await import('../src/install.js');
    const emptyDir = await createTempDir();
    try {
      await expect(install(emptyDir, { sourceRoot: tmpDir }))
        .rejects.toBeInstanceOf(InstallError);
    } finally {
      await fs.promises.rm(emptyDir, { recursive: true, force: true });
    }
  });

  it('does not treat a file named .opencode as an IDE installation', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# skill\n');
    fs.writeFileSync(path.join(projectDir, '.opencode'), 'not a directory\n');

    const { install, InstallError } = await import('../src/install.js');
    await expect(install(projectDir, { sourceRoot }))
      .rejects.toBeInstanceOf(InstallError);
  });

  it('deploys template files', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'default'));
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'default', 'brief.md'), '# brief template\n');
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'default', 'story.md'), '# story template\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    expect(await exists(path.join(projectDir, 'ai-brief', 'templates', 'brief', 'default.md'))).toBe(true);
    expect(await exists(path.join(projectDir, 'ai-brief', 'templates', 'story', 'default.md'))).toBe(true);
  });

  it('deploys step prompts', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'steps'));
    fs.writeFileSync(path.join(sourceRoot, 'steps', 'validate.md'), '# validate prompt\n');
    fs.writeFileSync(path.join(sourceRoot, 'steps', 'research.md'), '# research prompt\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    expect(await exists(path.join(projectDir, 'ai-brief', 'steps', 'validate.md'))).toBe(true);
    expect(await exists(path.join(projectDir, 'ai-brief', 'steps', 'research.md'))).toBe(true);
  });

  it('backs up existing files before overwriting', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# new content\n');

    await mkdir(path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog'));
    fs.writeFileSync(path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md'), '# old content\n');

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    const bakPath = path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md.bak');
    expect(await exists(bakPath)).toBe(true);
    expect(fs.readFileSync(bakPath, 'utf-8')).toBe('# old content\n');
  });

  it('skips a source skill whose SKILL.md is missing', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    await mkdir(path.join(sourceRoot, 'skills', 'broken'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# ok\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { install } = await import('../src/install.js');
      await install(projectDir, { ides: ['opencode'], sourceRoot });
      expect(await exists(path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md'))).toBe(true);
      expect(await exists(path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-broken', 'SKILL.md'))).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('dry-run does not modify files', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# content\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], dryRun: true, sourceRoot });

    const skillPath = path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md');
    expect(await exists(skillPath)).toBe(false);
  });

  it('auto-detects IDEs from target directory', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'skills', 'blog'));
    fs.writeFileSync(path.join(sourceRoot, 'skills', 'blog', 'SKILL.md'), '# content\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { sourceRoot });

    const skillPath = path.join(projectDir, '.opencode', 'agents', 'skills', 'ai-brief-blog', 'SKILL.md');
    expect(await exists(skillPath)).toBe(true);
  });

  it('gracefully handles no source directories (empty skills)', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await expect(install(projectDir, { ides: ['opencode'], sourceRoot })).resolves.not.toThrow();
  });

  it('deploys user templates from src/templates/user/', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'default'));
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'user'));
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'default', 'brief.md'), '# default brief\n');
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'user', 'brief.md'), '# user brief\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    const userDest = path.join(projectDir, 'ai-brief', 'templates', 'brief', 'user.md');
    expect(await exists(userDest)).toBe(true);
    expect(fs.readFileSync(userDest, 'utf-8')).toBe('# user brief\n');
  });

  it('does not overwrite existing user template at target', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'default'));
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'user'));
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'user', 'brief.md'), '# new user content\n');

    const targetUserDir = path.join(projectDir, 'ai-brief', 'templates', 'brief');
    await mkdir(targetUserDir);
    fs.writeFileSync(path.join(targetUserDir, 'user.md'), '# existing user content\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    expect(fs.readFileSync(path.join(targetUserDir, 'user.md'), 'utf-8')).toBe('# existing user content\n');
  });

  it('preserves existing user templates when deploying default templates', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'default'));
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'default', 'brief.md'), '# new default\n');

    const targetFormatDir = path.join(projectDir, 'ai-brief', 'templates', 'brief');
    await mkdir(targetFormatDir);
    fs.writeFileSync(path.join(targetFormatDir, 'default.md'), '# old default\n');
    fs.writeFileSync(path.join(targetFormatDir, 'user.md'), '# user override\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    expect(fs.readFileSync(path.join(targetFormatDir, 'user.md'), 'utf-8')).toBe('# user override\n');
    expect(fs.readFileSync(path.join(targetFormatDir, 'default.md'), 'utf-8')).toBe('# new default\n');
  });

  it('creates a .bak of the previous default template when it is overwritten (AC3)', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'default'));
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'default', 'brief.md'), '# new default\n');

    const targetFormatDir = path.join(projectDir, 'ai-brief', 'templates', 'brief');
    await mkdir(targetFormatDir);
    fs.writeFileSync(path.join(targetFormatDir, 'default.md'), '# old default\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], sourceRoot });

    const bakPath = path.join(targetFormatDir, 'default.md.bak');
    expect(await exists(bakPath)).toBe(true);
    expect(fs.readFileSync(bakPath, 'utf-8')).toBe('# old default\n');
  });

  it('logs the user-template preservation message under --dry-run', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'default'));
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'default', 'brief.md'), '# default\n');

    const targetFormatDir = path.join(projectDir, 'ai-brief', 'templates', 'brief');
    await mkdir(targetFormatDir);
    fs.writeFileSync(path.join(targetFormatDir, 'default.md'), '# old default\n');
    fs.writeFileSync(path.join(targetFormatDir, 'user.md'), '# user override\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await install(projectDir, { ides: ['opencode'], dryRun: true, sourceRoot });

    const flatCalls = logSpy.mock.calls.map(args => String(args[0])).join('\n');
    expect(flatCalls).toMatch(/\[dry-run\][^\n]*preserving user template[^\n]*user\.md/);
    expect(fs.readFileSync(path.join(targetFormatDir, 'default.md'), 'utf-8')).toBe('# old default\n');
    expect(fs.readFileSync(path.join(targetFormatDir, 'user.md'), 'utf-8')).toBe('# user override\n');
  });

  it('rejects a default template with an empty stem (e.g. ".md") with InstallError', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'default'));
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'default', '.md'), '# weird\n');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install, InstallError } = await import('../src/install.js');
    await expect(
      install(projectDir, { ides: ['opencode'], sourceRoot })
    ).rejects.toBeInstanceOf(InstallError);
  });

  it('treats src/templates/user being a regular file as no user templates', async () => {
    const sourceRoot = tmpDir;
    await mkdir(path.join(sourceRoot, 'src', 'templates', 'default'));
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'default', 'brief.md'), '# default\n');
    fs.writeFileSync(path.join(sourceRoot, 'src', 'templates', 'user'), 'not a directory');
    await mkdir(path.join(projectDir, '.opencode'));

    const { install } = await import('../src/install.js');
    await expect(
      install(projectDir, { ides: ['opencode'], sourceRoot })
    ).resolves.not.toThrow();

    const userDest = path.join(projectDir, 'ai-brief', 'templates', 'brief', 'user.md');
    expect(await exists(userDest)).toBe(false);
  });
});
