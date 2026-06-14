/**
 * @typedef {{ content: string, metadata: Record<string, unknown>, state: PipelineState }} StepIO
 * @typedef {{ stepIndex: number, completedSteps: string[], currentStep: string|null, failedStep: string|null }} PipelineState
 * @typedef {{ name: string, promptFile: string, description: string }} StepDefinition
 * @typedef {{ name: string, orchestrator: string }} FormatDefinition
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * @param {string} pipelinePath
 * @returns {{ steps: StepDefinition[] }}
 */
export function loadPipelineDefinition(pipelinePath) {
  const absPath = resolve(pipelinePath);
  let raw;
  try {
    raw = readFileSync(absPath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read pipeline definition at ${absPath}`, { cause: err });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in pipeline definition at ${absPath}: ${err.message}`, { cause: err });
  }

  return validateDefinition(parsed, absPath);
}

/**
 * @param {unknown} def
 * @param {string} filePath
 * @returns {{ steps: StepDefinition[] }}
 */
export function validateDefinition(def, filePath) {
  if (!def || typeof def !== 'object') {
    throw new Error(`Pipeline definition at ${filePath}: must be a non-null object`);
  }

  if (!Array.isArray(def.steps)) {
    throw new Error(`Pipeline definition at ${filePath}: missing or invalid "steps" array`);
  }

  if (def.steps.length === 0) {
    throw new Error(`Pipeline definition at ${filePath}: "steps" array is empty`);
  }

  const requiredFields = ['name', 'promptFile', 'description'];
  for (let i = 0; i < def.steps.length; i++) {
    const step = def.steps[i];
    if (!step || typeof step !== 'object') {
      throw new Error(`Pipeline definition at ${filePath}: step[${i}] must be a non-null object`);
    }
    for (const field of requiredFields) {
      if (!step[field] || typeof step[field] !== 'string') {
        throw new Error(`Pipeline definition at ${filePath}: step[${i}] missing or invalid required field "${field}"`);
      }
    }
  }

  return { steps: def.steps };
}

/**
 * @param {string} formatsPath
 * @returns {{ formats: FormatDefinition[] }}
 */
export function loadFormatDefinition(formatsPath) {
  const absPath = resolve(formatsPath);
  let raw;
  try {
    raw = readFileSync(absPath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read format definition at ${absPath}`, { cause: err });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in format definition at ${absPath}: ${err.message}`, { cause: err });
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Format definition at ${absPath}: must be a non-null object`);
  }

  if (!Array.isArray(parsed.formats)) {
    throw new Error(`Format definition at ${absPath}: missing or invalid "formats" array`);
  }

  for (let i = 0; i < parsed.formats.length; i++) {
    const fmt = parsed.formats[i];
    if (!fmt || typeof fmt !== 'object') {
      throw new Error(`Format definition at ${absPath}: formats[${i}] must be a non-null object`);
    }
    if (!fmt.name || typeof fmt.name !== 'string') {
      throw new Error(`Format definition at ${absPath}: formats[${i}] missing or invalid "name"`);
    }
    if (!fmt.orchestrator || typeof fmt.orchestrator !== 'string') {
      throw new Error(`Format definition at ${absPath}: formats[${i}] missing or invalid "orchestrator"`);
    }
  }

  return { formats: parsed.formats };
}
