import { describe, it, expect } from 'vitest';

describe('CLI entry point', () => {
  it('should export a commands map with expected keys', async () => {
    const mod = await import('../src/cli.js');
    expect(mod.commands).toBeDefined();
    expect(Object.keys(mod.commands)).toEqual(['init', 'run', 'status', 'resume']);
  });
});
