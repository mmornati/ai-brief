#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { runPipeline } from './pipeline/runner.js';
import { getStatus, resume as resumePipeline } from './pipeline/tracker.js';

function parseArgs(args) {
  let inputFile = null;
  let format = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--format') {
      format = args[++i];
    } else if (!inputFile && !args[i].startsWith('--')) {
      inputFile = args[i];
    }
  }

  return { inputFile, format };
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
    run(rawArgs) {
      const { inputFile, format } = parseArgs(rawArgs);

      if (!format) {
        console.error('--format is required (blog|slides)');
        process.exit(1);
      }

      if (!inputFile) {
        console.error('Usage: ai-brief run <input-file> --format <format>');
        process.exit(1);
      }

      runPipeline(inputFile, format).catch(err => {
        console.error(err.message);
        process.exit(1);
      });
    },
  },
  status: {
    description: 'Show current pipeline status',
    async run(rawArgs) {
      const { inputFile } = parseArgs(rawArgs);

      if (!inputFile) {
        console.error('Usage: ai-brief status <input-file>');
        process.exit(1);
      }

      try {
        const status = await getStatus();

        if (status.completed.length === 0 && !status.failed) {
          console.log(`Pipeline status for ${inputFile}:`);
          console.log('  No pipeline run in progress.');
          return;
        }

        const stepNames = [...status.completed, ...(status.failed ? [status.failed] : []), ...status.pending];
        const allStepNames = status.completed.concat(status.failed ? [status.failed] : []).concat(status.pending);
        const seen = new Set();
        const allSteps = [];
        for (const name of [...status.completed, ...(status.failed ? [status.failed] : []), ...status.pending]) {
          if (!seen.has(name)) {
            seen.add(name);
            allSteps.push(name);
          }
        }

        console.log(`Pipeline status for ${inputFile}:`);
        for (let i = 0; i < allSteps.length; i++) {
          const name = allSteps[i];
          const num = String(i + 1).padStart(2, ' ');
          if (status.completed.includes(name)) {
            console.log(`  ✅ ${num}. ${name.padEnd(12)} — completed`);
          } else if (status.failed === name) {
            console.log(`  ❌ ${num}. ${name.padEnd(12)} — FAILED (see .step-${i + 1}.failed)`);
          } else {
            console.log(`  ⏳ ${num}. ${name.padEnd(12)} — pending`);
          }
        }
        if (status.outputFile) {
          console.log(`Output: ${status.outputFile}`);
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
      const { inputFile, format } = parseArgs(rawArgs);

      if (!format) {
        console.error('--format is required (blog|slides)');
        process.exit(1);
      }

      if (!inputFile) {
        console.error('Usage: ai-brief resume <input-file> --format <format>');
        process.exit(1);
      }

      try {
        await resumePipeline(inputFile, format);
      } catch (err) {
        if (err.message === 'Pipeline already complete' || err.message === 'No pipeline run in progress') {
          console.log(err.message);
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
  console.log('  --format <format>   Output format (blog|slides)');
  console.log('');
  console.log('Examples:');
  console.log('  ai-brief run docs/idea.md --format blog');
  console.log('  ai-brief run docs/idea.md --format slides');
  console.log('  ai-brief status docs/idea.md');
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
