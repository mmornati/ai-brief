export function generateSkill(pipelineDef, formatDef) {
  const formatName = formatDef.name;
  const steps = pipelineDef.steps || [];

  const stepLines = steps.map((s, i) => `${i + 1}. **${s.name}** — ${s.description}`);

  const skillContent = [
    '# Claude Code Skill',
    '',
    `# ai-brief-${formatName}`,
    '',
    `Run the ai-brief pipeline for ${formatName} output on a markdown file.`,
    '',
    '## Usage',
    '',
    '```',
    `node src/cli.js run <input> --format ${formatName}`,
    '```',
    '',
    '## Pipeline Steps',
    '',
    ...stepLines,
    '',
  ].join('\n');

  return { skillDir: `ai-brief-${formatName}`, skillContent };
}

export function generateMasterSkill(pipelineDef, formats) {
  const steps = pipelineDef.steps || [];

  const stepLines = steps.map((s, i) => `${i + 1}. **${s.name}** — ${s.description}`);
  const formatLines = formats.map(f => `- \`${f.name}\``);

  const skillContent = [
    '# Claude Code Skill',
    '',
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
    'node src/cli.js run <input> --format <format>',
    '```',
    '',
    '## Pipeline Steps',
    '',
    ...stepLines,
    '',
  ].join('\n');

  return { skillDir: 'ai-brief-run', skillContent };
}

export default async function orchestrate(accumulatedContent) {
  console.log('claude: pipeline complete');
}
