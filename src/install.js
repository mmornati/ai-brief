import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exists, mkdir, copy, backup, readdir } from './utils/file.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

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
  if (await exists(path.join(targetDir, '.opencode'))) {
    ides.push('opencode');
  }
  if (await exists(path.join(targetDir, '.claude'))) {
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
    const stat = await fs.promises.stat(path.join(sourceDirs.skills, entry));
    if (stat.isDirectory()) {
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
  const templates = [];
  for (const entry of entries) {
    if (entry.endsWith('.md')) {
      templates.push(entry);
    }
  }
  return templates;
}

async function getStepFiles(sourceRoot) {
  const sourceDirs = getSourceDirs(sourceRoot);
  if (!(await exists(sourceDirs.steps))) {
    return [];
  }
  const entries = await readdir(sourceDirs.steps);
  return entries.filter(e => e.endsWith('.md'));
}

async function deploySkills(targetDir, ides, dryRun, sourceRoot) {
  const sourceDirs = getSourceDirs(sourceRoot);
  const skillNames = await getSkillNames(sourceRoot);
  for (const ide of ides) {
    for (const skillName of skillNames) {
      const src = path.join(sourceDirs.skills, skillName, 'SKILL.md');
      const dest = resolveSkillDest(targetDir, ide, skillName);
      const action = `register skill ai-brief-${skillName} for ${ide} → ${dest}`;
      if (dryRun) {
        console.log(`[dry-run] ${action}`);
      } else {
        const destDir = path.dirname(dest);
        if (!(await exists(destDir))) {
          await mkdir(destDir);
        }
        if (await exists(dest)) {
          await backup(dest);
          console.log(`  backed up existing ${dest} → ${dest}.bak`);
        }
        await copy(src, dest);
        console.log(`  ${action}`);
      }
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
    const action = `deploy template ${tmplFile} → ${dest}`;
    if (dryRun) {
      console.log(`[dry-run] ${action}`);
    } else {
      const destDir = path.dirname(dest);
      if (!(await exists(destDir))) {
        await mkdir(destDir);
      }
      if (await exists(dest)) {
        await backup(dest);
        console.log(`  backed up existing ${dest} → ${dest}.bak`);
      }
      await copy(src, dest);
      console.log(`  ${action}`);
    }
  }
}

async function deployStepPrompts(targetDir, dryRun, sourceRoot) {
  const sourceDirs = getSourceDirs(sourceRoot);
  const stepFiles = await getStepFiles(sourceRoot);
  for (const stepFile of stepFiles) {
    const src = path.join(sourceDirs.steps, stepFile);
    const dest = path.join(targetDir, TARGET_STEPS_DIR, stepFile);
    const action = `deploy step prompt ${stepFile} → ${dest}`;
    if (dryRun) {
      console.log(`[dry-run] ${action}`);
    } else {
      const destDir = path.dirname(dest);
      if (!(await exists(destDir))) {
        await mkdir(destDir);
      }
      if (await exists(dest)) {
        await backup(dest);
        console.log(`  backed up existing ${dest} → ${dest}.bak`);
      }
      await copy(src, dest);
      console.log(`  ${action}`);
    }
  }
}

export async function install(targetDir, options = {}) {
  const dryRun = options.dryRun || false;
  const ides = options.ides || (await detectIDEs(targetDir));
  const sourceRoot = options.sourceRoot || PROJECT_ROOT;

  if (ides.length === 0) {
    console.error('Error: No supported AI assistant detected.');
    console.error('ai-brief requires opencode and/or Claude Code to be installed.');
    console.error('Install one of them and ensure its config directory (.opencode/ or .claude/)');
    console.error('exists in the target project root before running install.');
    process.exit(1);
  }

  if (dryRun) {
    console.log('ai-brief install [dry-run]');
    console.log(`  target: ${targetDir}`);
    console.log(`  detected IDEs: ${ides.join(', ')}`);
    console.log('');
  } else {
    console.log(`ai-brief install`);
    console.log(`  target: ${targetDir}`);
    console.log(`  detected IDEs: ${ides.join(', ')}`);
    console.log('');
  }

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
    if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (!args[i].startsWith('--')) {
      targetDir = args[i];
    }
  }

  install(targetDir, { dryRun }).catch(err => {
    console.error('Installation failed:', err.message);
    process.exit(1);
  });
}
