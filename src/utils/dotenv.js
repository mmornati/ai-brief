import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadDotenv(filePath) {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) return;

  const content = readFileSync(resolved, 'utf-8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    let key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if (!key) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function loadDotenvFromRoot() {
  loadDotenv('.env');
}
