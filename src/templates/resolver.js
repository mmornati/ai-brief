import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isFile } from '../utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = __dirname;

const INVALID_NAME_CHARS = /[\/\\\u0000]/;
const PARENT_SEGMENT = /(^|\/)\.\.(\/|$)/;

function assertValidTemplateName(templateName) {
  if (typeof templateName !== 'string' || templateName.length === 0) {
    throw new TypeError(
      `templateName must be a non-empty string, got ${typeof templateName}`
    );
  }
  if (templateName === '..' || templateName === '.' || PARENT_SEGMENT.test(templateName)) {
    throw new Error(
      `Invalid templateName "${templateName}": must not contain ".." segments`
    );
  }
  if (INVALID_NAME_CHARS.test(templateName)) {
    throw new Error(
      `Invalid templateName "${templateName}": must not contain path separators or NUL bytes`
    );
  }
}

export async function resolveTemplateFrom(templateName, templatesDir) {
  assertValidTemplateName(templateName);

  const baseDir = path.resolve(templatesDir);
  const userPath = path.join(baseDir, 'user', templateName);
  const defaultPath = path.join(baseDir, 'default', templateName);

  if (await isFile(userPath)) {
    return userPath;
  }

  if (await isFile(defaultPath)) {
    return defaultPath;
  }

  throw new Error(
    `Template "${templateName}" not found. Tried:\n` +
    `  - ${userPath}\n` +
    `  - ${defaultPath}`
  );
}

export async function resolveTemplate(templateName) {
  return resolveTemplateFrom(templateName, TEMPLATES_DIR);
}
