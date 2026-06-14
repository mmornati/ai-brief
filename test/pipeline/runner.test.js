import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { runPipeline } from '../../src/pipeline/runner.js';

let tmpDir;

beforeAll(() => {
  tmpDir = mkdtempSync(resolve(tmpdir(), 'ai-brief-runner-test-'));
});

afterAll(() => {
  if (tmpDir) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

function write(pathSegments, content) {
  const absPath = resolve(tmpDir, ...pathSegments);
  mkdirSync(absPath.substring(0, absPath.lastIndexOf('/')), { recursive: true });
  writeFileSync(absPath, content, 'utf-8');
  return absPath;
}

function outDir(name) {
  return resolve(tmpDir, name);
}

describe('runPipeline', () => {
  it('executes all steps in sequence and creates output and marker files', async () => {
    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({
      steps: [
        { name: 'validate', promptFile: 'steps/validate.md', description: 'Validate input' },
        { name: 'research', promptFile: 'steps/research.md', description: 'Research context' },
      ],
    }));
    write(['pipeline-definition', 'formats.json'], JSON.stringify({
      formats: [{ name: 'blog', orchestrator: 'test/orch-blog.js' }],
    }));
    write(['steps', 'validate.md'], 'Validate the input');
    write(['steps', 'research.md'], 'Research the topic');
    write(['test', 'orch-blog.js'], 'export default async function orch(c) { return c; }');
    write(['docs', 'test.md'], '# Test Input');

    const od = outDir('steps1');
    await runPipeline('docs/test.md', 'blog', {
      projectRoot: tmpDir,
      outDir: od,
    });

    expect(existsSync(resolve(od, '01-validate.md'))).toBe(true);
    expect(existsSync(resolve(od, '02-research.md'))).toBe(true);
    expect(existsSync(resolve(od, '.step-0.completed'))).toBe(true);
    expect(existsSync(resolve(od, '.step-1.completed'))).toBe(true);
  });

  it('passes accumulated content through steps', async () => {
    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({
      steps: [
        { name: 'validate', promptFile: 'steps/v.md', description: 'V' },
      ],
    }));
    write(['pipeline-definition', 'formats.json'], JSON.stringify({
      formats: [{ name: 'blog', orchestrator: 'test/orch2.js' }],
    }));
    write(['steps', 'v.md'], 'STEP_PROMPT');
    write(['test', 'orch2.js'], 'export default async function orch(c) { return c; }');
    write(['docs', 'accum.md'], 'INPUT_TEXT');

    const od = outDir('steps2');
    await runPipeline('docs/accum.md', 'blog', {
      projectRoot: tmpDir,
      outDir: od,
    });

    const stepOutput = readFileSync(resolve(od, '01-validate.md'), 'utf-8');
    expect(stepOutput).toContain('STEP_PROMPT');
    expect(stepOutput).toContain('INPUT_TEXT');
  });

  it('stops on step failure and writes failed marker', async () => {
    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({
      steps: [
        { name: 'validate', promptFile: 'steps/nope.md', description: 'Validate' },
      ],
    }));
    write(['pipeline-definition', 'formats.json'], JSON.stringify({
      formats: [{ name: 'blog', orchestrator: 'test/orch3.js' }],
    }));
    write(['test', 'orch3.js'], 'export default async function orch(c) { return c; }');
    write(['docs', 'fail.md'], 'content');

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const od = outDir('steps3');

    await runPipeline('docs/fail.md', 'blog', {
      projectRoot: tmpDir,
      outDir: od,
    });

    expect(existsSync(resolve(od, '.step-0.completed'))).toBe(false);
    expect(existsSync(resolve(od, '.step-0.failed'))).toBe(true);

    const failedContent = readFileSync(resolve(od, '.step-0.failed'), 'utf-8');
    expect(failedContent).toContain('Step "validate" failed');

    spy.mockRestore();
  });

  it('throws for unknown format', async () => {
    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({
      steps: [{ name: 'validate', promptFile: 'steps/v.md', description: 'V' }],
    }));
    write(['pipeline-definition', 'formats.json'], JSON.stringify({
      formats: [{ name: 'blog', orchestrator: 'test/orch4.js' }],
    }));
    write(['steps', 'v.md'], 'prompt');
    write(['test', 'orch4.js'], 'export default async function orch(c) { return c; }');
    write(['docs', 'unknown.md'], 'content');

    await expect(runPipeline('docs/unknown.md', 'slides', {
      projectRoot: tmpDir,
      outDir: outDir('steps4'),
    })).rejects.toThrow(/Unknown format/);
  });

  it('rejects for empty steps', async () => {
    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({ steps: [] }));
    write(['pipeline-definition', 'formats.json'], JSON.stringify({
      formats: [{ name: 'blog', orchestrator: 'test/orch5.js' }],
    }));
    write(['test', 'orch5.js'], 'export default async function orch(c) { throw new Error(\"no steps\"); }');
    write(['docs', 'empty.md'], 'content');

    const od = outDir('steps5');

    await expect(runPipeline('docs/empty.md', 'blog', {
      projectRoot: tmpDir,
      outDir: od,
    })).rejects.toThrow(/no steps/);
  });

  it('accepts custom executePrompt', async () => {
    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({
      steps: [{ name: 'validate', promptFile: 'steps/cust.md', description: 'C' }],
    }));
    write(['pipeline-definition', 'formats.json'], JSON.stringify({
      formats: [{ name: 'blog', orchestrator: 'test/orch6.js' }],
    }));
    write(['steps', 'cust.md'], 'PROMPT');
    write(['test', 'orch6.js'], 'export default async function orch(c) { return c; }');
    write(['docs', 'custom.md'], 'INPUT');

    const customFn = vi.fn(async (prompt) => 'CUSTOM_' + prompt);
    const od = outDir('steps6');

    await runPipeline('docs/custom.md', 'blog', {
      projectRoot: tmpDir,
      outDir: od,
      executePrompt: customFn,
    });

    expect(customFn).toHaveBeenCalledOnce();
    expect(customFn).toHaveBeenCalledWith(expect.stringContaining('PROMPT'));

    const stepOutput = readFileSync(resolve(od, '01-validate.md'), 'utf-8');
    expect(stepOutput).toBe('CUSTOM_PROMPT\n\nINPUT');
  });

  it('calls format orchestrator after all steps', async () => {
    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({
      steps: [{ name: 'validate', promptFile: 'steps/final.md', description: 'F' }],
    }));
    write(['pipeline-definition', 'formats.json'], JSON.stringify({
      formats: [{ name: 'blog', orchestrator: 'test/orch-final.js' }],
    }));
    write(['steps', 'final.md'], 'FINAL_PROMPT');
    write(['docs', 'final.md'], 'FINAL_INPUT');

    let orchestratedContent = null;
    write(['test', 'orch-final.js'], `
      let stored;
      export default async function orch(content) { stored = content; }
      export function getStored() { return stored; }
    `);

    const od = outDir('steps7');
    await runPipeline('docs/final.md', 'blog', {
      projectRoot: tmpDir,
      outDir: od,
    });

    const mod = await import(resolve(tmpDir, 'test/orch-final.js') + '?t=' + Date.now());
    expect(mod.getStored()).toBeDefined();
  });
});
