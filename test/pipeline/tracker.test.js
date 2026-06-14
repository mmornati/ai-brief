import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { getStatus, getLastCompletedStep, getFailedStep, isComplete, resume } from '../../src/pipeline/tracker.js';

let tmpDir;

beforeAll(() => {
  tmpDir = mkdtempSync(resolve(tmpdir(), 'ai-brief-tracker-test-'));
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

function stepsDir(name) {
  return resolve(tmpDir, name);
}

function setupPipeline(stepsOverride) {
  write(['pipeline-definition', 'pipeline.json'], JSON.stringify({
    steps: stepsOverride || [
      { name: 'validate', promptFile: 'steps/validate.md', description: 'Validate input' },
      { name: 'research', promptFile: 'steps/research.md', description: 'Research context' },
      { name: 'structure', promptFile: 'steps/structure.md', description: 'Structure content' },
    ],
  }));
  write(['pipeline-definition', 'formats.json'], JSON.stringify({
    formats: [{ name: 'blog', orchestrator: 'test/orch.js' }],
  }));
  write(['test', 'orch.js'], 'export default async function orch(c) { return c; }');
  write(['docs', 'test.md'], '# Test Input');
}

function writeMarker(sDir, stepNum, suffix) {
  writeFileSync(resolve(sDir, `.step-${stepNum}.${suffix}`), '');
}

function writeStepOutput(sDir, stepNum, name, content) {
  const padded = String(stepNum).padStart(2, '0');
  writeFileSync(resolve(sDir, `${padded}-${name}.md`), content, 'utf-8');
}

const opts = (od, extra = {}) => ({
  projectRoot: tmpDir,
  stepsDir: od,
  ...extra,
});

function stepStates(status) {
  return status.steps.map(s => `${s.name}:${s.state}`).join(',');
}

describe('getStatus', () => {
  it('returns all pending when no markers exist', async () => {
    const od = stepsDir('empty-status');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    const status = await getStatus(opts(od, { inputFile: 'docs/test.md' }));
    expect(status.steps).toEqual([
      { name: 'validate', state: 'pending' },
      { name: 'research', state: 'pending' },
      { name: 'structure', state: 'pending' },
    ]);
    expect(status.outputFile).toBeNull();
  });

  it('reports completed and failed steps in pipeline order', async () => {
    const od = stepsDir('partial-status');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    writeMarker(od, 2, 'failed');
    const status = await getStatus(opts(od, { inputFile: 'docs/test.md' }));
    expect(stepStates(status)).toBe('validate:completed,research:failed,structure:pending');
    expect(status.outputFile).toBeNull();
  });

  it('reports all completed steps', async () => {
    const od = stepsDir('all-completed-status');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    writeMarker(od, 2, 'completed');
    writeMarker(od, 3, 'completed');
    const status = await getStatus(opts(od, { inputFile: 'docs/test.md', format: 'blog' }));
    expect(stepStates(status)).toBe('validate:completed,research:completed,structure:completed');
    expect(status.outputFile).toBe(resolve(tmpDir, 'ai-brief-output', 'blog', 'test-blog.md'));
  });

  it('outputFile is null when pipeline complete but format missing', async () => {
    const od = stepsDir('all-completed-no-format');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    writeMarker(od, 2, 'completed');
    writeMarker(od, 3, 'completed');
    const status = await getStatus(opts(od, { inputFile: 'docs/test.md' }));
    expect(status.outputFile).toBeNull();
  });

  it('failed marker takes precedence over completed', async () => {
    const od = stepsDir('both-markers');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    writeMarker(od, 1, 'failed');
    const status = await getStatus(opts(od, { inputFile: 'docs/test.md' }));
    expect(stepStates(status)).toBe('validate:failed,research:pending,structure:pending');
  });

  it('handles some completed and some pending without failure', async () => {
    const od = stepsDir('completed-and-pending');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    const status = await getStatus(opts(od, { inputFile: 'docs/test.md' }));
    expect(stepStates(status)).toBe('validate:completed,research:pending,structure:pending');
  });

  it('handles non-existent steps directory', async () => {
    const od = stepsDir('nonexistent-dir');
    setupPipeline();
    const status = await getStatus(opts(od, { inputFile: 'docs/test.md' }));
    expect(stepStates(status)).toBe('validate:pending,research:pending,structure:pending');
  });

  it('ignores stale markers beyond current pipeline length', async () => {
    const od = stepsDir('stale-markers');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    writeMarker(od, 99, 'failed');
    const status = await getStatus(opts(od, { inputFile: 'docs/test.md' }));
    expect(stepStates(status)).toBe('validate:completed,research:pending,structure:pending');
  });

  it('ignores .step-0 markers', async () => {
    const od = stepsDir('zero-marker');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 0, 'completed');
    const status = await getStatus(opts(od, { inputFile: 'docs/test.md' }));
    expect(stepStates(status)).toBe('validate:pending,research:pending,structure:pending');
  });
});

describe('getLastCompletedStep', () => {
  it('returns -1 when no steps completed', async () => {
    setupPipeline();
    expect(await getLastCompletedStep(opts(stepsDir('no-completed')))).toBe(-1);
  });

  it('returns the last completed step index', async () => {
    const od = stepsDir('some-completed');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    writeMarker(od, 2, 'completed');
    expect(await getLastCompletedStep(opts(od))).toBe(1);
  });
});

describe('getFailedStep', () => {
  it('returns null when no failures', async () => {
    const od = stepsDir('no-failure');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    expect(await getFailedStep(opts(od))).toBeNull();
  });

  it('returns the first failed step index', async () => {
    const od = stepsDir('has-failure');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 2, 'failed');
    expect(await getFailedStep(opts(od))).toBe(1);
  });
});

describe('isComplete', () => {
  it('returns false when no steps defined', async () => {
    setupPipeline([]);
    expect(await isComplete(opts(stepsDir('empty-pipeline')))).toBe(false);
  });

  it('returns false when no steps completed', async () => {
    setupPipeline();
    expect(await isComplete(opts(stepsDir('not-complete')))).toBe(false);
  });

  it('returns false when some steps are pending', async () => {
    const od = stepsDir('partial-complete');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    expect(await isComplete(opts(od))).toBe(false);
  });

  it('returns true when all steps completed', async () => {
    const od = stepsDir('fully-complete');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    writeMarker(od, 2, 'completed');
    writeMarker(od, 3, 'completed');
    expect(await isComplete(opts(od))).toBe(true);
  });
});

describe('resume', () => {
  it('throws with PIPELINE_COMPLETE code when pipeline is already complete', async () => {
    const od = stepsDir('resume-complete');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    writeMarker(od, 2, 'completed');
    writeMarker(od, 3, 'completed');
    let caught;
    try {
      await resume('docs/test.md', 'blog', opts(od));
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.code).toBe('PIPELINE_COMPLETE');
    expect(caught.message).toMatch(/Pipeline already complete/);
  });

  it('throws with NO_RUN code when no pipeline run in progress', async () => {
    const od = stepsDir('resume-never-started');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    let caught;
    try {
      await resume('docs/test.md', 'blog', opts(od));
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect(caught.code).toBe('NO_RUN');
    expect(caught.message).toMatch(/No pipeline run in progress/);
  });

  it('resumes from failed step with last completed step as context', async () => {
    const od = stepsDir('resume-failed');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    writeMarker(od, 2, 'completed');
    writeMarker(od, 3, 'failed');
    writeStepOutput(od, 1, 'validate', 'VALIDATE OUTPUT');
    writeStepOutput(od, 2, 'research', 'RESEARCH OUTPUT');

    const steps = [
      { name: 'validate', promptFile: 'steps/validate.md', description: 'V' },
      { name: 'research', promptFile: 'steps/research.md', description: 'R' },
      { name: 'structure', promptFile: 'steps/structure.md', description: 'S' },
    ];

    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({ steps }));
    write(['steps', 'structure.md'], 'STRUCTURE_PROMPT');

    const customFn = async (prompt) => 'RESUMED_' + prompt;
    await resume('docs/test.md', 'blog', {
      ...opts(od),
      executePrompt: customFn,
    });

    expect(existsSync(resolve(od, '.step-3.completed'))).toBe(true);
    expect(existsSync(resolve(od, '.step-3.failed'))).toBe(false);

    const stepOutput = readFileSync(resolve(od, '03-structure.md'), 'utf-8');
    expect(stepOutput).toContain('RESUMED_');
    expect(stepOutput).toContain('STRUCTURE_PROMPT');
    expect(stepOutput).toContain('RESEARCH OUTPUT');
    expect(stepOutput).not.toContain('VALIDATE OUTPUT');
  });

  it('falls back to input file when no completed step precedes resume target', async () => {
    const od = stepsDir('resume-gap');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 2, 'failed');
    writeStepOutput(od, 1, 'validate', 'SHOULD_NOT_USE_THIS');

    const steps = [
      { name: 'validate', promptFile: 'steps/validate.md', description: 'V' },
      { name: 'research', promptFile: 'steps/research.md', description: 'R' },
    ];
    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({ steps }));
    write(['steps', 'research.md'], 'RESEARCH_PROMPT');

    const customFn = async (prompt) => prompt;
    await resume('docs/test.md', 'blog', {
      ...opts(od),
      executePrompt: customFn,
    });

    const out = readFileSync(resolve(od, '02-research.md'), 'utf-8');
    expect(out).toContain('# Test Input');
    expect(out).not.toContain('SHOULD_NOT_USE_THIS');
  });

  it('resumes from first pending step when no failed marker', async () => {
    const od = stepsDir('resume-pending');
    mkdirSync(od, { recursive: true });
    setupPipeline();
    writeMarker(od, 1, 'completed');
    writeStepOutput(od, 1, 'validate', 'VALIDATE OUT');

    const steps = [
      { name: 'validate', promptFile: 'steps/v.md', description: 'V' },
      { name: 'research', promptFile: 'steps/r.md', description: 'R' },
    ];
    write(['pipeline-definition', 'pipeline.json'], JSON.stringify({ steps }));
    write(['steps', 'r.md'], 'RESEARCH_PROMPT');

    const customFn = async (prompt) => 'CONTINUED_' + prompt;

    await resume('docs/test.md', 'blog', {
      ...opts(od),
      executePrompt: customFn,
      formatsPath: resolve(tmpDir, 'pipeline-definition', 'formats.json'),
    });

    expect(existsSync(resolve(od, '.step-2.completed'))).toBe(true);
  });
});
