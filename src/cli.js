#!/usr/bin/env node
import { fileURLToPath } from 'url';

export const commands = {
  init: {
    description: 'Scaffold a new project in the target directory',
    run() {
      console.log('ai-brief init: Scaffold a new project');
    },
  },
  run: {
    description: 'Execute the full pipeline',
    run() {
      console.log('ai-brief run: Execute the full pipeline');
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

  cmd.run();
}
