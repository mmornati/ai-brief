import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { tmpdir } from 'os';
import { runPipeline } from '../../src/pipeline/runner.js';
import { createExecutePrompt, PROVIDERS } from '../../src/ai/provider.js';

let tmpDir;

function write(pathSegments, content) {
  const absPath = resolve(tmpDir, ...pathSegments);
  mkdirSync(dirname(absPath), { recursive: true });
  writeFileSync(absPath, content, 'utf-8');
  return absPath;
}

function outDir(name) {
  return resolve(tmpDir, name);
}

beforeAll(() => {
  tmpDir = mkdtempSync(resolve(tmpdir(), 'ai-brief-integration-'));
});

afterAll(() => {
  if (tmpDir) {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

describe('full pipeline integration', () => {
  it('executes all 6 steps and produces final output with custom executePrompt', async () => {
    const steps = [
      { name: 'validate', promptFile: 'steps/validate.md', description: 'Validate input' },
      { name: 'research', promptFile: 'steps/research.md', description: 'Research context' },
      { name: 'structure', promptFile: 'steps/structure.md', description: 'Structure outline' },
      { name: 'write', promptFile: 'steps/write.md', description: 'Write content' },
      { name: 'format', promptFile: 'steps/format.md', description: 'Apply format' },
      { name: 'review', promptFile: 'steps/review.md', description: 'Review and polish' },
    ];

    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({ steps }));
    write(['pipeline-definition', 'formats.json'], JSON.stringify({
      formats: [{ name: 'blog', orchestrator: 'test/orch.js' }],
    }));

    for (const step of steps) {
      write(['steps', `${step.name}.md`], `Prompt for ${step.name}`);
    }

    write(['test', 'orch.js'], `export default async function render(content, metadata) {
      return "/dev/null/output.md";
    }`);
    write(['test', 'input.md'], '# Test Idea\n\nSome content\n');

    let promptCount = 0;
    const mockExecute = vi.fn(async (prompt) => {
      promptCount++;
      return `Step ${promptCount} output for: ${stepNames[promptCount - 1]}`;
    });
    const stepNames = steps.map(s => s.name);

    const od = outDir('full-pipeline');

    const result = await runPipeline('test/input.md', 'blog', {
      projectRoot: tmpDir,
      outDir: od,
      executePrompt: mockExecute,
    });

    expect(mockExecute).toHaveBeenCalledTimes(6);

    for (let i = 1; i <= 6; i++) {
      const padded = String(i).padStart(2, '0');
      const stepFile = resolve(od, `${padded}-${stepNames[i - 1]}.md`);
      expect(existsSync(stepFile)).toBe(true);
      const stepContent = readFileSync(stepFile, 'utf-8');
      expect(stepContent).toContain(`Step ${i} output for: ${stepNames[i - 1]}`);
    }

    for (let i = 1; i <= 6; i++) {
      expect(existsSync(resolve(od, `.step-${i}.completed`))).toBe(true);
    }

    expect(result).toBe('/dev/null/output.md');
  });

  describe('provider system', () => {
    it('createExecutePrompt returns null for passthrough', async () => {
      const fn = await createExecutePrompt('passthrough');
      expect(fn).toBeNull();
    });

    it('createExecutePrompt throws for unknown provider', async () => {
      await expect(createExecutePrompt('nonexistent')).rejects.toThrow(/Unknown provider/);
    });

    it('PROVIDERS has expected entries', () => {
      expect(PROVIDERS).toHaveProperty('passthrough');
      expect(PROVIDERS).toHaveProperty('openai-compatible');
    });

    it('openai-compatible provider module has executePrompt function', async () => {
      const fn = await createExecutePrompt('openai-compatible');
      expect(fn).toBeTypeOf('function');
      expect(fn.name).toBe('executePrompt');
    });

    it('openai-compatible executePrompt rejects without API key', async () => {
      const oldAiKey = process.env.AI_API_KEY;
      const oldOpenAiKey = process.env.OPENAI_API_KEY;
      delete process.env.AI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      try {
        const fn = await createExecutePrompt('openai-compatible');
        await expect(fn('test prompt')).rejects.toThrow(/AI_API_KEY/);
      } finally {
        if (oldAiKey) process.env.AI_API_KEY = oldAiKey;
        if (oldOpenAiKey) process.env.OPENAI_API_KEY = oldOpenAiKey;
      }
    });
  });
});
