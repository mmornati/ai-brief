#!/usr/bin/env node
import { fileURLToPath } from 'url';
import { runPipeline } from './pipeline/runner.js';

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
    run() {
      console.log('ai-brief status: Show current pipeline status');
    },
  },
  resume: {
    description: 'Resume a paused pipeline from the last completed step',
    run() {
      console.log('ai-brief resume: Resume a paused pipeline');
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
