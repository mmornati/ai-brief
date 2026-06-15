import { readFile, unlink as fsUnlink } from 'node:fs/promises';
import path from 'node:path';
import { loadSteps, loadFormats } from './step-loader.js';
import { writeFile, mkdir } from '../utils/file.js';
import { getProjectRoot } from '../utils/paths.js';

export async function defaultExecutePrompt(promptAndContext) {
  return promptAndContext;
}

async function loadPrompt(promptFile, rootDir) {
  const absPath = path.resolve(rootDir, promptFile);
  return readFile(absPath, 'utf-8');
}

export async function loadFormatOrchestrator(formatDef, rootDir) {
  const absPath = path.resolve(rootDir, formatDef.orchestrator);
  const mod = await import(absPath);
  if (typeof mod.default === 'function') return mod.default;
  if (typeof mod.orchestrate === 'function') return mod.orchestrate;
  throw new Error(`Format orchestrator ${formatDef.orchestrator} must export a default function or named export "orchestrate"`);
}

export async function runPipeline(inputFile, format, options = {}) {
  const projectRoot = options.projectRoot || getProjectRoot();
  const executeFn = options.executePrompt || defaultExecutePrompt;
  const outDir = options.outDir || path.resolve(projectRoot, 'ai-brief-output', 'steps');
  const pipelinePath = options.pipelinePath || path.resolve(projectRoot, 'pipeline-definition', 'pipeline.json');
  const formatsPath = options.formatsPath || path.resolve(projectRoot, 'pipeline-definition', 'formats.json');
  const startFrom = Math.max(0, options.startFrom ?? 0);
  const accumulatedContext = options.accumulatedContext;

  const steps = await loadSteps(pipelinePath);
  const formats = await loadFormats(formatsPath);

  const formatDef = formats.find(f => f.name === format);
  if (!formatDef) {
    throw new Error(`Unknown format "${format}". Available formats: ${formats.map(f => f.name).join(', ')}`);
  }

  await mkdir(outDir);

  const padded = (i) => String(i + 1).padStart(2, '0');

  function markerPath(i, suffix) {
    return path.resolve(outDir, `.step-${i + 1}.${suffix}`);
  }

  function outputPath(i, stepName) {
    return path.resolve(outDir, `${padded(i)}-${stepName}.md`);
  }

  let accumulatedContent;
  if (accumulatedContext !== undefined) {
    accumulatedContent = accumulatedContext;
  } else {
    const inputPath = path.resolve(projectRoot, inputFile);
    accumulatedContent = await readFile(inputPath, 'utf-8');
  }

  for (let i = startFrom; i < steps.length; i++) {
    const step = steps[i];

    try {
      const promptText = await loadPrompt(step.promptFile, projectRoot);
      const fullPrompt = promptText + '\n\n' + accumulatedContent;
      console.log(`\n--- Step ${i + 1}/${steps.length}: ${step.name} ---`);
      const result = await executeFn(fullPrompt);

      const preview = result.slice(0, 500).replace(/\n/g, '\n  ');
      console.log(`  ${preview}${result.length > 500 ? '\n  ...' : ''}`);
      await writeFile(outputPath(i, step.name), result);
      await writeFile(markerPath(i, 'completed'), '');
      try { await fsUnlink(markerPath(i, 'failed')); } catch { }

      const shouldAccumulate = step.accumulate !== false;
      if (shouldAccumulate) {
        accumulatedContent = result;
      } else {
        const sidecarDir = path.resolve(projectRoot, 'ai-brief-output');
        const sidecarFile = path.basename(inputFile, path.extname(inputFile)) + '-review.md';
        await writeFile(path.resolve(sidecarDir, sidecarFile), result);
      }
    } catch (err) {
      const errorMsg = `Step "${step.name}" failed: ${err.message}`;
      console.error(errorMsg);
      await writeFile(markerPath(i, 'failed'), errorMsg);
      const wrapped = new Error(errorMsg);
      wrapped.cause = err;
      throw wrapped;
    }
  }

  const orchestrator = await loadFormatOrchestrator(formatDef, projectRoot);
  return orchestrator(accumulatedContent, { inputFile, format });
}
