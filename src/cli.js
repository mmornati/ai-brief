#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { loadDotenvFromRoot } from './utils/dotenv.js';
import { runPipeline } from './pipeline/runner.js';
import { getStatus, resume as resumePipeline } from './pipeline/tracker.js';
import { createExecutePrompt } from './ai/provider.js';

loadDotenvFromRoot();

function parseArgs(args) {
  let inputFile = null;
  let format = null;
  let provider = 'passthrough';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--format' || arg === '-f') {
      const next = args[++i];
      if (next === undefined) {
        throw new Error('--format requires a value');
      }
      format = next;
    } else if (arg.startsWith('--format=')) {
      const value = arg.slice('--format='.length);
      if (value === '') {
        throw new Error('--format requires a value');
      }
      format = value;
    } else if (arg === '--provider' || arg === '-p') {
      const next = args[++i];
      if (next === undefined) {
        throw new Error('--provider requires a value');
      }
      provider = next;
    } else if (arg.startsWith('--provider=')) {
      const value = arg.slice('--provider='.length);
      if (value === '') {
        throw new Error('--provider requires a value');
      }
      provider = value;
    } else if (!arg.startsWith('--') && !arg.startsWith('-') && inputFile === null) {
      inputFile = arg;
    }
  }

  return { inputFile, format, provider };
}

function formatStatusLine(idx, step) {
  const num = String(idx + 1).padStart(2, ' ');
  const name = step.name.padEnd(12);
  if (step.state === 'completed') {
    return `  ✅ ${num}. ${name} — completed`;
  }
  if (step.state === 'failed') {
    return `  ❌ ${num}. ${name} — FAILED (see .step-${idx + 1}.failed)`;
  }
  return `  ⏳ ${num}. ${name} — pending`;
}

export const commands = {
  init: {
    description: 'Scaffold a new project in the target directory',
    run() {
      console.log('ai-brief init: Scaffold a new project');
    },
  },
  run: {
    description: 'Execute the full pipeline on a markdown input file',
    async run(rawArgs) {
      let parsed;
      try {
        parsed = parseArgs(rawArgs);
      } catch (err) {
        console.error(err.message);
        process.exit(1);
        return;
      }

      if (!parsed.format) {
        console.error('--format is required (blog|slides)');
        process.exit(1);
      }

      if (!parsed.inputFile) {
        console.error('Usage: ai-brief run <input-file> --format <format>');
        process.exit(1);
      }

      if (parsed.provider !== 'passthrough') {
        console.log(`Using AI provider: ${parsed.provider}`);
      }

      let executePrompt;
      try {
        executePrompt = await createExecutePrompt(parsed.provider);
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }

      const options = {};
      if (executePrompt) options.executePrompt = executePrompt;

      try {
        const outputPath = await runPipeline(parsed.inputFile, parsed.format, options);
        console.log(`\nPipeline complete. Output: ${outputPath}`);
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    },
  },
  status: {
    description: 'Show current pipeline status',
    async run(rawArgs) {
      let parsed;
      try {
        parsed = parseArgs(rawArgs);
      } catch (err) {
        console.error(err.message);
        process.exit(1);
        return;
      }

      if (!parsed.inputFile) {
        console.error('Usage: ai-brief status <input-file> [--format <format>]');
        process.exit(1);
      }

      try {
        const status = await getStatus({
          inputFile: parsed.inputFile,
          format: parsed.format,
        });

        const allCompleted = status.steps.length > 0 && status.steps.every(s => s.state === 'completed');
        const hasAnyState = status.steps.some(s => s.state !== 'pending');

        console.log(`Pipeline status for ${parsed.inputFile}:`);
        if (!hasAnyState) {
          console.log('  No pipeline run in progress.');
          return;
        }

        for (let i = 0; i < status.steps.length; i++) {
          console.log(formatStatusLine(i, status.steps[i]));
        }
        if (status.outputFile) {
          const suffix = allCompleted ? '' : ' (pending)';
          console.log(`Output: ${status.outputFile}${suffix}`);
        }
      } catch (err) {
        console.error(err.message);
        process.exit(1);
      }
    },
  },
  resume: {
    description: 'Resume a paused pipeline from the last completed step',
    async run(rawArgs) {
      let parsed;
      try {
        parsed = parseArgs(rawArgs);
      } catch (err) {
        console.error(err.message);
        process.exit(1);
        return;
      }

      if (!parsed.format) {
        console.error('--format is required (blog|slides)');
        process.exit(1);
      }

      if (!parsed.inputFile) {
        console.error('Usage: ai-brief resume <input-file> --format <format>');
        process.exit(1);
      }

      try {
        await resumePipeline(parsed.inputFile, parsed.format);
      } catch (err) {
        if (err.code === 'PIPELINE_COMPLETE' || err.code === 'NO_RUN' || err.code === 'NO_PIPELINE') {
          console.error(err.message);
          process.exit(1);
        }
        console.error(err.message);
        process.exit(1);
      }
    },
  },
};

function printHelp() {
  console.log('Usage: ai-brief <command> [options]');
  console.log('');
  console.log('Commands:');
  for (const [name, cmd] of Object.entries(commands)) {
    console.log(`  ${name.padEnd(10)} ${cmd.description}`);
  }
  console.log('');
  console.log('Run command options:');
  console.log('  --format <format>    Output format (blog|slides)');
  console.log('  --provider <name>    AI provider (passthrough|openai-compatible, default: passthrough)');
  console.log('');
  console.log('AI provider environment variables (for --provider openai-compatible):');
  console.log('  AI_API_KEY           API key (required)');
  console.log('  AI_BASE_URL          API base URL (default: https://api.openai.com/v1)');
  console.log('  AI_MODEL             Model name (default: gpt-4o-mini)');
  console.log('');
  console.log('Examples:');
  console.log('  ai-brief run docs/idea.md --format blog');
  console.log('  ai-brief run docs/idea.md --format slides --provider openai-compatible');
  console.log('  ai-brief status docs/idea.md');
  console.log('  ai-brief status docs/idea.md --format blog');
  console.log('  ai-brief resume docs/idea.md --format blog');
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  const args = process.argv.slice(2);
  const commandName = args[0];

  if (!commandName || commandName === '--help' || commandName === '-h') {
    printHelp();
    process.exit(0);
  }

  const cmd = commands[commandName];
  if (!cmd) {
    console.error(`Unknown command: ${commandName}`);
    console.error('Run "ai-brief --help" for usage information.');
    process.exit(1);
  }

  cmd.run(args.slice(1));
}
