import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exists, isDir, copy, backup, readdir, stat } from './utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

export class InstallError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InstallError';
  }
}

function getSourceDirs(sourceRoot) {
  return {
    skills: path.join(sourceRoot, 'skills'),
    templates: path.join(sourceRoot, 'src', 'templates', 'default'),
    steps: path.join(sourceRoot, 'steps'),
  };
}

const OPENCODE_SKILL_DIR = '.opencode/agents/skills';
const CLAUDE_SKILL_DIR = '.claude/skills';
const TARGET_TEMPLATES_DIR = 'ai-brief/templates';
const TARGET_STEPS_DIR = 'ai-brief/steps';

async function detectIDEs(targetDir) {
  const ides = [];
  if (await isDir(path.join(targetDir, '.opencode'))) {
    ides.push('opencode');
  }
  if (await isDir(path.join(targetDir, '.claude'))) {
    ides.push('claude');
  }
  return ides;
}

function resolveSkillDest(targetDir, ide, skillName) {
  const base = ide === 'claude' ? CLAUDE_SKILL_DIR : OPENCODE_SKILL_DIR;
  return path.join(targetDir, base, `ai-brief-${skillName}`, 'SKILL.md');
}

async function getSkillNames(sourceRoot) {
  const sourceDirs = getSourceDirs(sourceRoot);
  if (!(await exists(sourceDirs.skills))) {
    return [];
  }
  const entries = await readdir(sourceDirs.skills);
  const skills = [];
  for (const entry of entries) {
    if (await isDir(path.join(sourceDirs.skills, entry))) {
      skills.push(entry);
    }
  }
  return skills;
}

async function getTemplateFormats(sourceRoot) {
  const sourceDirs = getSourceDirs(sourceRoot);
  if (!(await exists(sourceDirs.templates))) {
    return [];
  }
  const entries = await readdir(sourceDirs.templates);
  return entries.filter(e => e.endsWith('.md'));
}

async function getStepFiles(sourceRoot) {
  const sourceDirs = getSourceDirs(sourceRoot);
  if (!(await exists(sourceDirs.steps))) {
    return [];
  }
  const entries = await readdir(sourceDirs.steps);
  return entries.filter(e => e.endsWith('.md'));
}

async function copyWithBackup(src, dest, dryRun, action) {
  if (!(await exists(src))) {
    console.warn(`  [warn] source not found, skipping: ${src}`);
    return false;
  }
  if (dryRun) {
    console.log(`[dry-run] ${action}`);
    if (await exists(dest)) {
      console.log(`[dry-run]   would back up ${dest} → ${dest}.bak`);
    }
    return false;
  }
  if (await exists(dest)) {
    await backup(dest);
    console.log(`  backed up existing ${dest} → ${dest}.bak`);
  }
  await copy(src, dest);
  console.log(`  ${action}`);
  return true;
}

async function deploySkills(targetDir, ides, dryRun, sourceRoot) {
  const sourceDirs = getSourceDirs(sourceRoot);
  const skillNames = await getSkillNames(sourceRoot);
  for (const ide of ides) {
    for (const skillName of skillNames) {
      const src = path.join(sourceDirs.skills, skillName, 'SKILL.md');
      const dest = resolveSkillDest(targetDir, ide, skillName);
      await copyWithBackup(
        src,
        dest,
        dryRun,
        `register skill ai-brief-${skillName} for ${ide} → ${dest}`
      );
    }
  }
}

async function deployTemplates(targetDir, dryRun, sourceRoot) {
  const sourceDirs = getSourceDirs(sourceRoot);
  const templateFormats = await getTemplateFormats(sourceRoot);
  for (const tmplFile of templateFormats) {
    const formatName = path.basename(tmplFile, '.md');
    const src = path.join(sourceDirs.templates, tmplFile);
    const dest = path.join(targetDir, TARGET_TEMPLATES_DIR, formatName, 'default.md');
    await copyWithBackup(
      src,
      dest,
      dryRun,
      `deploy template ${tmplFile} → ${dest}`
    );
  }
}

async function deployStepPrompts(targetDir, dryRun, sourceRoot) {
  const sourceDirs = getSourceDirs(sourceRoot);
  const stepFiles = await getStepFiles(sourceRoot);
  for (const stepFile of stepFiles) {
    const src = path.join(sourceDirs.steps, stepFile);
    const dest = path.join(targetDir, TARGET_STEPS_DIR, stepFile);
    await copyWithBackup(
      src,
      dest,
      dryRun,
      `deploy step prompt ${stepFile} → ${dest}`
    );
  }
}

export async function install(targetDir, options = {}) {
  const dryRun = options.dryRun || false;
  const ides = options.ides || (await detectIDEs(targetDir));
  const sourceRoot = options.sourceRoot || PROJECT_ROOT;

  if (ides.length === 0) {
    throw new InstallError(
      'No supported AI assistant detected.\n' +
        'ai-brief requires opencode and/or Claude Code to be installed.\n' +
        'Install one of them and ensure its config directory (.opencode/ or .claude/)\n' +
        'exists in the target project root before running install.'
    );
  }

  const banner = dryRun ? 'ai-brief install [dry-run]' : 'ai-brief install';
  console.log(banner);
  console.log(`  target: ${targetDir}`);
  console.log(`  detected IDEs: ${ides.join(', ')}`);
  console.log('');

  await deploySkills(targetDir, ides, dryRun, sourceRoot);
  await deployTemplates(targetDir, dryRun, sourceRoot);
  await deployStepPrompts(targetDir, dryRun, sourceRoot);

  if (!dryRun) {
    console.log('');
    console.log('Installation complete.');
  }
}

const isMain = process.argv[1] && (
  process.argv[1] === fileURLToPath(import.meta.url) ||
  process.argv[1].endsWith('install.js')
);

if (isMain) {
  const args = process.argv.slice(2);
  let targetDir = '.';
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}`);
      console.error('Usage: install.sh [--dry-run] [target-dir]');
      process.exit(1);
    } else {
      targetDir = arg;
    }
  }

  install(targetDir, { dryRun }).catch(err => {
    if (err instanceof InstallError) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error('Installation failed:', err.stack || err.message);
    }
    process.exit(1);
  });
}
