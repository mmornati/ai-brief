const FORMAT_NAME_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

function assertValidFormatName(name) {
  if (typeof name !== 'string' || name.length === 0 || !FORMAT_NAME_RE.test(name)) {
    throw new Error(
      `Invalid format name: expected kebab-case identifier, got ${JSON.stringify(name)}`
    );
  }
}

function stepLine(step, index) {
  if (!step || typeof step.name !== 'string' || typeof step.description !== 'string') {
    return null;
  }
  return `${index + 1}. **${step.name}** — ${step.description}`;
}

function readSteps(pipelineDef) {
  if (!pipelineDef || !Array.isArray(pipelineDef.steps)) return [];
  return pipelineDef.steps.map(stepLine).filter(Boolean);
}

function readFormatNames(formats) {
  if (!Array.isArray(formats)) return [];
  return formats
    .filter(f => f && typeof f.name === 'string' && FORMAT_NAME_RE.test(f.name))
    .map(f => `- \`${f.name}\``);
}

function claudeFrontmatter(formatName) {
  const description = `Run the ai-brief pipeline for ${formatName} output on a markdown file.`;
  return ['---', `name: ai-brief-${formatName}`, `description: ${description}`, '---', ''].join('\n');
}

function claudeMasterFrontmatter() {
  return [
    '---',
    'name: ai-brief-run',
    'description: Run the ai-brief pipeline on a markdown file and generate the specified output format.',
    '---',
    '',
  ].join('\n');
}

export function generateSkill(pipelineDef, formatDef, sourceRoot) {
  assertValidFormatName(formatDef && formatDef.name);
  const formatName = formatDef.name;
  const stepLines = readSteps(pipelineDef);
  const prefix = sourceRoot ? `cd ${sourceRoot} && ` : '';

  const skillContent = [
    claudeFrontmatter(formatName),
    `# ai-brief-${formatName}`,
    '',
    `Run the ai-brief pipeline for ${formatName} output on a markdown file.`,
    '',
    '## Usage',
    '',
    '```',
    `${prefix}node src/cli.js run "\$PWD/<input>" --format ${formatName}`,
    '```',
    '',
    '## Pipeline Steps',
    '',
    ...stepLines,
    '',
  ].join('\n');

  return { skillDir: formatName, skillContent };
}

export function generateMasterSkill(pipelineDef, formats, sourceRoot) {
  const stepLines = readSteps(pipelineDef);
  const formatLines = readFormatNames(formats);
  const prefix = sourceRoot ? `cd ${sourceRoot} && ` : '';

  const skillContent = [
    claudeMasterFrontmatter(),
    '# ai-brief-run',
    '',
    'Run the ai-brief pipeline on a markdown file and generate the specified output format.',
    '',
    '## Supported Formats',
    '',
    ...formatLines,
    '',
    '## Usage',
    '',
    '```',
    `${prefix}node src/cli.js run "\$PWD/<input>" --format <format>`,
    '```',
    '',
    '## Pipeline Steps',
    '',
    ...stepLines,
    '',
  ].join('\n');

  return { skillDir: 'run', skillContent };
}

export default async function orchestrate(accumulatedContent) {
  console.log('claude: pipeline complete');
}
