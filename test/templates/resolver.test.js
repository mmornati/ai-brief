import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, exists } from '../../src/utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

async function createTempDir() {
  const tmpBase = path.resolve(PROJECT_ROOT, 'test', '.tmp');
  await mkdir(tmpBase).catch(() => {});
  const tmpDir = await fs.promises.mkdtemp(path.join(tmpBase, 'resolver-test-'));
  return tmpDir;
}

describe('resolveTemplateFrom', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await createTempDir();
    await mkdir(path.join(tmpDir, 'user'));
    await mkdir(path.join(tmpDir, 'default'));
    fs.writeFileSync(path.join(tmpDir, 'default', 'brief.md'), '# default brief\n');
    fs.writeFileSync(path.join(tmpDir, 'user', 'brief.md'), '# user brief\n');
    fs.writeFileSync(path.join(tmpDir, 'default', 'story.md'), '# default story\n');
  });

  afterEach(async () => {
    if (tmpDir && (await exists(tmpDir))) {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('resolves from user/ when template exists in both user/ and default/', async () => {
    const { resolveTemplateFrom } = await import('../../src/templates/resolver.js');
    const result = await resolveTemplateFrom('brief.md', tmpDir);
    expect(result).toBe(path.join(tmpDir, 'user', 'brief.md'));
  });

  it('falls back to default/ when template only exists in default/', async () => {
    const { resolveTemplateFrom } = await import('../../src/templates/resolver.js');
    const result = await resolveTemplateFrom('story.md', tmpDir);
    expect(result).toBe(path.join(tmpDir, 'default', 'story.md'));
  });

  it('returns user/ path when only user/ has the template', async () => {
    fs.writeFileSync(path.join(tmpDir, 'user', 'custom.md'), '# custom\n');
    const { resolveTemplateFrom } = await import('../../src/templates/resolver.js');
    const result = await resolveTemplateFrom('custom.md', tmpDir);
    expect(result).toBe(path.join(tmpDir, 'user', 'custom.md'));
  });

  it('throws a descriptive error when template does not exist in either directory', async () => {
    const { resolveTemplateFrom } = await import('../../src/templates/resolver.js');
    await expect(resolveTemplateFrom('nonexistent.md', tmpDir)).rejects.toThrow(
      /Template "nonexistent\.md" not found/
    );
  });

  it('error lists both paths tried', async () => {
    const { resolveTemplateFrom } = await import('../../src/templates/resolver.js');
    try {
      await resolveTemplateFrom('missing.md', tmpDir);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err.message).toContain(path.join(tmpDir, 'user', 'missing.md'));
      expect(err.message).toContain(path.join(tmpDir, 'default', 'missing.md'));
    }
  });

  it('rejects path-traversal templateName with ".." segments', async () => {
    const { resolveTemplateFrom } = await import('../../src/templates/resolver.js');
    await expect(resolveTemplateFrom('../foo.md', tmpDir)).rejects.toThrow(/must not contain "\.\." segments/);
    await expect(resolveTemplateFrom('a/../b.md', tmpDir)).rejects.toThrow(/must not contain "\.\." segments/);
  });

  it('rejects templateName containing path separators or NUL', async () => {
    const { resolveTemplateFrom } = await import('../../src/templates/resolver.js');
    await expect(resolveTemplateFrom('a/b.md', tmpDir)).rejects.toThrow(/path separators/);
    await expect(resolveTemplateFrom('a\\b.md', tmpDir)).rejects.toThrow(/path separators/);
    await expect(resolveTemplateFrom('foo\u0000bar.md', tmpDir)).rejects.toThrow(/path separators/);
  });

  it('rejects non-string templateName with a TypeError', async () => {
    const { resolveTemplateFrom } = await import('../../src/templates/resolver.js');
    await expect(resolveTemplateFrom(undefined, tmpDir)).rejects.toBeInstanceOf(TypeError);
    await expect(resolveTemplateFrom('', tmpDir)).rejects.toBeInstanceOf(TypeError);
    await expect(resolveTemplateFrom(123, tmpDir)).rejects.toBeInstanceOf(TypeError);
  });

  it('skips a directory shaped like the template name (isFile check, not just exists)', async () => {
    fs.writeFileSync(path.join(tmpDir, 'default', 'custom.md'), '# default custom\n');
    fs.mkdirSync(path.join(tmpDir, 'user', 'custom.md'), { recursive: true });
    const { resolveTemplateFrom } = await import('../../src/templates/resolver.js');
    const result = await resolveTemplateFrom('custom.md', tmpDir);
    expect(result).toBe(path.join(tmpDir, 'default', 'custom.md'));
  });
});

describe('resolveTemplate', () => {
  it('is exported as the public API', async () => {
    const mod = await import('../../src/templates/resolver.js');
    expect(typeof mod.resolveTemplate).toBe('function');
  });
});
