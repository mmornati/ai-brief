import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';

const CLI = 'src/cli.js';

function run(args) {
  return spawnSync('node', [CLI, ...args], { encoding: 'utf8' });
}

describe('CLI entry point', () => {
  it('should export a commands map with expected keys', async () => {
    const mod = await import('../src/cli.js');
    expect(mod.commands).toBeDefined();
    expect(Object.keys(mod.commands)).toEqual(['init', 'run', 'status', 'resume']);
  });

  it('every registered command has a description and a run function', async () => {
    const mod = await import('../src/cli.js');
    for (const [name, cmd] of Object.entries(mod.commands)) {
      expect(typeof cmd.description, `${name}.description`).toBe('string');
      expect(cmd.description.length, `${name}.description`).toBeGreaterThan(0);
      expect(typeof cmd.run, `${name}.run`).toBe('function');
    }
  });

  it('--help prints usage and exits 0', () => {
    const r = run(['--help']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Usage: ai-brief/);
    expect(r.stdout).toMatch(/init/);
    expect(r.stdout).toMatch(/run/);
    expect(r.stdout).toMatch(/status/);
    expect(r.stdout).toMatch(/resume/);
  });

  it('-h prints usage and exits 0', () => {
    const r = run(['-h']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Usage: ai-brief/);
  });

  it('no-args prints usage and exits 0', () => {
    const r = run([]);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Usage: ai-brief/);
  });

  it('unknown command exits 1 with an error on stderr', () => {
    const r = run(['bogus-command']);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/Unknown command: bogus-command/);
  });

  it('known command without args prints usage and exits 1', () => {
    const r = run(['status']);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/Usage: ai-brief status/);
  });

  it('run without --format exits 1', () => {
    const r = run(['run', 'docs/test.md']);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/--format is required/);
  });
});
