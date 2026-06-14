import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

export function getProjectRoot() {
  return projectRoot;
}

export function resolveSourcePath(...segments) {
  return path.resolve(projectRoot, ...segments);
}

export function resolveTargetPath(targetDir, ...segments) {
  return path.resolve(targetDir, ...segments);
}
