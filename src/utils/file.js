import { promises as fsp } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';

export async function exists(filePath) {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function mkdir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

export async function copy(src, dest) {
  await mkdir(path.dirname(dest));
  await fsp.copyFile(src, dest);
}

export async function backup(filePath) {
  const bakPath = filePath + '.bak';
  if (await exists(filePath)) {
    await fsp.copyFile(filePath, bakPath);
  }
}

export async function readFile(filePath) {
  return fsp.readFile(filePath, 'utf-8');
}

export async function writeFile(filePath, content) {
  await mkdir(path.dirname(filePath));
  await fsp.writeFile(filePath, content, 'utf-8');
}

export async function readdir(dirPath) {
  return fsp.readdir(dirPath);
}

export async function stat(filePath) {
  return fsp.stat(filePath);
}
