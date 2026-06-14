import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { getProjectRoot } from '../utils/paths.js';
import { loadSteps } from './step-loader.js';
import { runPipeline } from './runner.js';

function padded(i) {
  return String(i + 1).padStart(2, '0');
}

function outputFileName(i, name) {
  return `${padded(i)}-${name}.md`;
}

function parseMarkerIndex(filename) {
  const match = filename.match(/^\.step-(\d+)\.(completed|failed)$/);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  if (num <= 0) return null;
  return num - 1;
}

function expectedOutputFile(projectRoot, inputFile, format) {
  if (!format) return null;
  const base = path.basename(inputFile, path.extname(inputFile));
  return path.resolve(projectRoot, 'ai-brief-output', format, `${base}-${format}.md`);
}

async function scanSteps(stepsDir, steps) {
  let files;
  try {
    files = await readdir(stepsDir);
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
      return steps.map(() => 'pending');
    }
    throw err;
  }

  const state = steps.map(() => 'pending');

  for (const file of files) {
    const idx = parseMarkerIndex(file);
    if (idx === null || idx >= steps.length) continue;

    if (file.endsWith('.failed')) {
      state[idx] = 'failed';
      continue;
    }
    if (state[idx] !== 'failed') {
      state[idx] = 'completed';
    }
  }

  return state;
}

async function loadState(options) {
  const projectRoot = options.projectRoot || getProjectRoot();
  const stepsDir = options.stepsDir || path.resolve(projectRoot, 'ai-brief-output', 'steps');
  const pipelinePath = options.pipelinePath || path.resolve(projectRoot, 'pipeline-definition', 'pipeline.json');
  const steps = await loadSteps(pipelinePath);
  const state = await scanSteps(stepsDir, steps);
  return { projectRoot, stepsDir, pipelinePath, steps, state };
}

function buildStepStatuses(steps, state) {
  return steps.map((step, i) => ({
    name: step.name,
    state: state[i],
  }));
}

export async function getStatus(options = {}) {
  const { projectRoot, steps, state } = await loadState(options);
  const stepStatuses = buildStepStatuses(steps, state);
  const allCompleted = steps.length > 0 && state.every(s => s === 'completed');
  const outputFile = allCompleted && options.format
    ? expectedOutputFile(projectRoot, options.inputFile, options.format)
    : null;
  return { steps: stepStatuses, outputFile };
}

export async function getLastCompletedStep(options = {}) {
  const { state } = await loadState(options);
  for (let i = state.length - 1; i >= 0; i--) {
    if (state[i] === 'completed') return i;
  }
  return -1;
}

export async function getFailedStep(options = {}) {
  const { state } = await loadState(options);
  for (let i = 0; i < state.length; i++) {
    if (state[i] === 'failed') return i;
  }
  return null;
}

export async function isComplete(options = {}) {
  const { state } = await loadState(options);
  return state.length > 0 && state.every(s => s === 'completed');
}

export async function resume(inputFile, format, options = {}) {
  const { projectRoot, stepsDir, pipelinePath, steps, state } = await loadState(options);

  if (steps.length === 0) {
    throw Object.assign(new Error('No pipeline defined'), { code: 'NO_PIPELINE' });
  }

  if (state.every(s => s === 'completed')) {
    throw Object.assign(new Error('Pipeline already complete'), { code: 'PIPELINE_COMPLETE' });
  }

  if (state.every(s => s === 'pending')) {
    throw Object.assign(new Error('No pipeline run in progress'), { code: 'NO_RUN' });
  }

  let resumeStep;
  const failedIdx = state.findIndex(s => s === 'failed');
  if (failedIdx !== -1) {
    resumeStep = failedIdx;
  } else {
    resumeStep = state.findIndex(s => s === 'pending');
  }

  let lastConsecutive = -1;
  for (let i = 0; i < resumeStep; i++) {
    if (state[i] === 'completed' && i === lastConsecutive + 1) {
      lastConsecutive = i;
    } else {
      break;
    }
  }

  let accumulatedContext;
  if (lastConsecutive >= 0) {
    const outPath = path.resolve(stepsDir, outputFileName(lastConsecutive, steps[lastConsecutive].name));
    accumulatedContext = await readFile(outPath, 'utf-8');
  } else {
    const inputPath = path.resolve(projectRoot, inputFile);
    accumulatedContext = await readFile(inputPath, 'utf-8');
  }

  const formatsPath = options.formatsPath || path.resolve(projectRoot, 'pipeline-definition', 'formats.json');

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
