/**
 * @typedef {{ content: string, metadata: Record<string, unknown>, state: PipelineState }} StepIO
 * @typedef {{ stepIndex: number, completedSteps: string[], currentStep: string|null, failedStep: string|null }} PipelineState
 * @typedef {{ name: string, promptFile: string, description: string, accumulate?: boolean }} StepDefinition
 * @typedef {{ name: string, orchestrator: string }} FormatDefinition
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Canonical pipeline step sequence (per architecture.md § Structure Patterns).
 * @type {readonly string[]}
 */
export const EXPECTED_PIPELINE_SEQUENCE = Object.freeze([
  'validate', 'research', 'structure', 'write', 'format', 'review',
]);

/**
 * @param {string} pipelinePath
 * @param {readonly string[]} [expectedSequence]
 * @returns {{ steps: StepDefinition[] }}
 */
export function loadPipelineDefinition(pipelinePath, expectedSequence = EXPECTED_PIPELINE_SEQUENCE) {
  const absPath = resolve(pipelinePath);
  const parsed = readJsonFile(absPath, 'pipeline definition');
  return validateDefinition(parsed, absPath, expectedSequence);
}

/**
 * @param {string} formatsPath
 * @returns {{ formats: FormatDefinition[] }}
 */
export function loadFormatDefinition(formatsPath) {
  const absPath = resolve(formatsPath);
  const parsed = readJsonFile(absPath, 'format definition');
  return validateFormatDefinition(parsed, absPath);
}

/**
 * @param {unknown} def
 * @param {string} filePath
 * @param {readonly string[]} [expectedSequence]
 * @returns {{ steps: StepDefinition[] }}
 */
export function validateDefinition(def, filePath, expectedSequence) {
  if (Array.isArray(def) || !def || typeof def !== 'object') {
    throw new Error(`Pipeline definition at ${filePath}: must be a non-null object`);
  }

  if (!Array.isArray(def.steps)) {
    throw new Error(`Pipeline definition at ${filePath}: missing or invalid "steps" array`);
  }

  if (def.steps.length === 0) {
    throw new Error(`Pipeline definition at ${filePath}: "steps" array is empty`);
  }

  if (expectedSequence && def.steps.length !== expectedSequence.length) {
    throw new Error(
      `Pipeline definition at ${filePath}: expected ${expectedSequence.length} steps, got ${def.steps.length}`,
    );
  }

  const requiredFields = ['name', 'promptFile', 'description'];
  const seenNames = new Set();
  for (let i = 0; i < def.steps.length; i++) {
    const step = def.steps[i];
    if (Array.isArray(step) || !step || typeof step !== 'object') {
      throw new Error(`Pipeline definition at ${filePath}: step[${i}] must be a non-null object`);
    }
    for (const field of requiredFields) {
      if (typeof step[field] !== 'string' || step[field].trim() === '') {
        throw new Error(
          `Pipeline definition at ${filePath}: step[${i}] missing or invalid required field "${field}"`,
        );
      }
    }
    if (seenNames.has(step.name)) {
      throw new Error(
        `Pipeline definition at ${filePath}: duplicate step name "${step.name}" at index ${i}`,
      );
    }
    seenNames.add(step.name);
    if (expectedSequence && step.name !== expectedSequence[i]) {
      throw new Error(
        `Pipeline definition at ${filePath}: step ordering mismatch at index ${i}: expected "${expectedSequence[i]}", got "${step.name}"`,
      );
    }
  }

  return { steps: def.steps };
}

/**
 * @param {unknown} def
 * @param {string} filePath
 * @returns {{ formats: FormatDefinition[] }}
 */
export function validateFormatDefinition(def, filePath) {
  if (Array.isArray(def) || !def || typeof def !== 'object') {
    throw new Error(`Format definition at ${filePath}: must be a non-null object`);
  }

  if (!Array.isArray(def.formats)) {
    throw new Error(`Format definition at ${filePath}: missing or invalid "formats" array`);
  }

  if (def.formats.length === 0) {
    throw new Error(`Format definition at ${filePath}: "formats" array is empty`);
  }

  const seenNames = new Set();
  for (let i = 0; i < def.formats.length; i++) {
    const fmt = def.formats[i];
    if (Array.isArray(fmt) || !fmt || typeof fmt !== 'object') {
      throw new Error(`Format definition at ${filePath}: formats[${i}] must be a non-null object`);
    }
    if (typeof fmt.name !== 'string' || fmt.name.trim() === '') {
      throw new Error(`Format definition at ${filePath}: formats[${i}] missing or invalid "name"`);
    }
    if (seenNames.has(fmt.name)) {
      throw new Error(
        `Format definition at ${filePath}: duplicate format name "${fmt.name}" at index ${i}`,
      );
    }
    seenNames.add(fmt.name);
    if (typeof fmt.orchestrator !== 'string' || fmt.orchestrator.trim() === '') {
      throw new Error(
        `Format definition at ${filePath}: formats[${i}] missing or invalid "orchestrator"`,
      );
    }
  }

  return { formats: def.formats };
}

/**
 * @param {string} absPath
 * @param {string} label
 * @returns {unknown}
 */
function readJsonFile(absPath, label) {
  let raw;
  try {
    raw = readFileSync(absPath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read ${label} at ${absPath}`, { cause: err });
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Invalid JSON in ${label} at ${absPath}: ${err.message}`,
      { cause: err },
    );
  }
}

export {};
