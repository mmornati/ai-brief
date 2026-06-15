export const PROVIDERS = {
  'openai-compatible': { name: 'OpenAI-compatible', module: './providers/openai-compatible.js' },
  passthrough: { name: 'Passthrough (no AI)', module: null },
};

export async function createExecutePrompt(providerName) {
  const provider = PROVIDERS[providerName];
  if (!provider) {
    throw new Error(
      `Unknown provider "${providerName}". Available: ${Object.keys(PROVIDERS).join(', ')}`
    );
  }
  if (!provider.module) return null;
  const mod = await import(provider.module);
  if (typeof mod.executePrompt !== 'function') {
    throw new Error(`Provider "${providerName}" must export an executePrompt function`);
  }
  return mod.executePrompt;
}
