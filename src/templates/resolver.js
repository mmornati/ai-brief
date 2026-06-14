import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exists } from '../utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname);

export async function resolveTemplateFrom(templateName, templatesDir) {
  const userPath = path.join(templatesDir, 'user', templateName);
  const defaultPath = path.join(templatesDir, 'default', templateName);

  if (await exists(userPath)) {
    return userPath;
  }

  if (await exists(defaultPath)) {
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
