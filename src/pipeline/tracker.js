import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { getProjectRoot, resolveSourcePath } from '../utils/paths.js';
import { loadSteps } from './step-loader.js';
import { runPipeline } from './runner.js';

function padded(i) {
  return String(i + 1).padStart(2, '0');
}

function markerCompleted(i) {
  return `.step-${i + 1}.completed`;
}

function markerFailed(i) {
  return `.step-${i + 1}.failed`;
}

function outputFileName(i, name) {
  return `${padded(i)}-${name}.md`;
}

function parseMarkerIndex(filename) {
  const match = filename.match(/^\.step-(\d+)\.(completed|failed)$/);
  return match ? parseInt(match[1], 10) - 1 : null;
}

async function scanSteps(stepsDir, steps) {
  let files;
  try {
    files = await readdir(stepsDir);
  } catch {
    return steps.map(() => 'pending');
  }

  const state = steps.map(() => 'pending');

  for (const file of files) {
    const idx = parseMarkerIndex(file);
    if (idx === null || idx >= steps.length) continue;

    if (file.endsWith('.failed')) {
      state[idx] = 'failed';
    } else if (file.endsWith('.completed') && state[idx] !== 'failed') {
      state[idx] = 'completed';
    }
  }

  return state;
}

export async function getStatus(options = {}) {
  const projectRoot = options.projectRoot || getProjectRoot();
  const stepsDir = options.stepsDir || path.resolve(projectRoot, 'ai-brief-output', 'steps');
  const pipelinePath = options.pipelinePath || path.resolve(projectRoot, 'pipeline-definition', 'pipeline.json');

  const steps = await loadSteps(pipelinePath);
  const state = await scanSteps(stepsDir, steps);

  const completed = [];
  let failed = null;
  const pending = [];

  for (let i = 0; i < steps.length; i++) {
    if (state[i] === 'failed') {
      if (!failed) failed = steps[i].name;
      pending.push(steps[i].name);
    } else if (state[i] === 'completed') {
      completed.push(steps[i].name);
    } else {
      pending.push(steps[i].name);
    }
  }

  return { completed, failed, pending, outputFile: null };
}

export async function getLastCompletedStep(options = {}) {
  const projectRoot = options.projectRoot || getProjectRoot();
  const stepsDir = options.stepsDir || path.resolve(projectRoot, 'ai-brief-output', 'steps');
  const pipelinePath = options.pipelinePath || path.resolve(projectRoot, 'pipeline-definition', 'pipeline.json');

  const steps = await loadSteps(pipelinePath);
  const state = await scanSteps(stepsDir, steps);

  for (let i = steps.length - 1; i >= 0; i--) {
    if (state[i] === 'completed') return i;
  }

  return -1;
}

export async function getFailedStep(options = {}) {
  const projectRoot = options.projectRoot || getProjectRoot();
  const stepsDir = options.stepsDir || path.resolve(projectRoot, 'ai-brief-output', 'steps');
  const pipelinePath = options.pipelinePath || path.resolve(projectRoot, 'pipeline-definition', 'pipeline.json');

  const steps = await loadSteps(pipelinePath);
  const state = await scanSteps(stepsDir, steps);

  for (let i = 0; i < steps.length; i++) {
    if (state[i] === 'failed') return i;
  }

  return null;
}

export async function isComplete(options = {}) {
  const projectRoot = options.projectRoot || getProjectRoot();
  const stepsDir = options.stepsDir || path.resolve(projectRoot, 'ai-brief-output', 'steps');
  const pipelinePath = options.pipelinePath || path.resolve(projectRoot, 'pipeline-definition', 'pipeline.json');

  const steps = await loadSteps(pipelinePath);
  const state = await scanSteps(stepsDir, steps);

  return state.every(s => s === 'completed');
}

export async function resume(inputFile, format, options = {}) {
  const projectRoot = options.projectRoot || getProjectRoot();
  const stepsDir = options.stepsDir || path.resolve(projectRoot, 'ai-brief-output', 'steps');
  const pipelinePath = options.pipelinePath || path.resolve(projectRoot, 'pipeline-definition', 'pipeline.json');
  const formatsPath = options.formatsPath || path.resolve(projectRoot, 'pipeline-definition', 'formats.json');

  const steps = await loadSteps(pipelinePath);
  const state = await scanSteps(stepsDir, steps);

  const isAlreadyComplete = state.every(s => s === 'completed');
  if (isAlreadyComplete) {
    throw new Error('Pipeline already complete');
  }

  const hasStarted = state.some(s => s !== 'pending');
  if (!hasStarted) {
    throw new Error('No pipeline run in progress');
  }

  let resumeStep;
  const failedIdx = state.findIndex(s => s === 'failed');
  if (failedIdx !== -1) {
    resumeStep = failedIdx;
  } else {
    resumeStep = state.findIndex(s => s === 'pending');
  }

  let accumulatedContext = '';
  for (let i = 0; i < resumeStep; i++) {
    if (state[i] === 'completed') {
      const outPath = path.resolve(stepsDir, outputFileName(i, steps[i].name));
      const content = await readFile(outPath, 'utf-8');
      accumulatedContext = content;
    }
  }

  if (!accumulatedContext) {
    const inputPath = path.resolve(projectRoot, inputFile);
    accumulatedContext = await readFile(inputPath, 'utf-8');
  }

  await runPipeline(inputFile, format, {
    ...options,
    startFrom: resumeStep,
    accumulatedContext,
    pipelinePath,
    formatsPath,
    projectRoot,
    outDir: stepsDir,
  });
}
