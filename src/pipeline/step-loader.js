import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const kebabCaseRe = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function isKebabCase(str) {
  return kebabCaseRe.test(str);
}

function readJsonSync(raw, absPath, label) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to load ${label}: ${absPath} — ${err.message}`, { cause: err });
  }
}

async function readJsonFile(absPath, label) {
  let raw;
  try {
    raw = await readFile(absPath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to load ${label}: ${absPath} — ${err.message}`, { cause: err });
  }
  return readJsonSync(raw, absPath, label);
}

function assertObject(def, absPath, label) {
  if (Array.isArray(def) || !def || typeof def !== 'object') {
    throw new Error(`Failed to load ${label}: ${absPath} — must be a non-null object`);
  }
}

function assertArray(arr, name, absPath, label) {
  if (!Array.isArray(arr)) {
    throw new Error(`Failed to load ${label}: ${absPath} — missing or invalid "${name}" array`);
  }
}

function assertString(value, path, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Failed to load ${label}: ${path} missing or invalid required string field`);
  }
}

function assertPathArg(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Failed to load ${label}: path must be a non-empty string`);
  }
}

export async function loadSteps(pipelinePath, expectedSequence) {
  assertPathArg(pipelinePath, 'step definitions');
  const absPath = resolve(pipelinePath);
  const parsed = await readJsonFile(absPath, 'step definitions');

  assertObject(parsed, absPath, 'step definitions');
  assertArray(parsed.steps, 'steps', absPath, 'step definitions');

  if (parsed.steps.length === 0) {
    return [];
  }

  const validated = validateStepDefinitions(parsed.steps, absPath, expectedSequence);
  return validated;
}

export async function loadFormats(formatsPath) {
  assertPathArg(formatsPath, 'format definitions');
  const absPath = resolve(formatsPath);
  const parsed = await readJsonFile(absPath, 'format definitions');

  assertObject(parsed, absPath, 'format definitions');
  assertArray(parsed.formats, 'formats', absPath, 'format definitions');

  if (parsed.formats.length === 0) {
    return [];
  }

  return validateFormatDefinitions(parsed.formats, absPath);
}

export function validateStepDefinitions(steps, filePath, expectedSequence) {
  if (expectedSequence && steps.length !== expectedSequence.length) {
    throw new Error(
      `Failed to load step definitions: ${filePath} — expected ${expectedSequence.length} steps, got ${steps.length}`,
    );
  }

  const seenNames = new Set();

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    if (Array.isArray(step) || !step || typeof step !== 'object') {
      throw new Error(
        `Failed to load step definitions: ${filePath} — step[${i}] must be a non-null object`,
      );
    }

    assertString(step.name, `step[${i}].name`, 'step definitions');
    assertString(step.promptFile, `step[${i}].promptFile`, 'step definitions');
    assertString(step.description, `step[${i}].description`, 'step definitions');

    if (seenNames.has(step.name)) {
      throw new Error(
        `Failed to load step definitions: ${filePath} — duplicate step name "${step.name}" at index ${i}`,
      );
    }
    seenNames.add(step.name);

    if (!isKebabCase(step.name)) {
      throw new Error(
        `Failed to load step definitions: ${filePath} — step[${i}] name "${step.name}" must be kebab-case`,
      );
    }

    if (!step.promptFile.endsWith('.md')) {
      throw new Error(
        `Failed to load step definitions: ${filePath} — step[${i}] promptFile must end with .md`,
      );
    }

    if (expectedSequence && step.name !== expectedSequence[i]) {
      throw new Error(
        `Failed to load step definitions: ${filePath} — step ordering mismatch at index ${i}: expected "${expectedSequence[i]}", got "${step.name}"`,
      );
    }
  }

  return steps;
}

export function validateFormatDefinitions(formats, filePath) {
  const seenNames = new Set();

  for (let i = 0; i < formats.length; i++) {
    const fmt = formats[i];

    if (Array.isArray(fmt) || !fmt || typeof fmt !== 'object') {
      throw new Error(
        `Failed to load format definitions: ${filePath} — formats[${i}] must be a non-null object`,
      );
    }

    assertString(fmt.name, `formats[${i}].name`, 'format definitions');
    assertString(fmt.orchestrator, `formats[${i}].orchestrator`, 'format definitions');

    if (seenNames.has(fmt.name)) {
      throw new Error(
        `Failed to load format definitions: ${filePath} — duplicate format name "${fmt.name}" at index ${i}`,
      );
    }
    seenNames.add(fmt.name);

    if (!fmt.orchestrator.endsWith('.js')) {
      throw new Error(
        `Failed to load format definitions: ${filePath} — formats[${i}] orchestrator must be a .js file`,
      );
    }
  }

  return formats;
}
