export async function executePrompt(prompt) {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1')
    .replace(/\/+$/, '')
    .replace(/\/chat\/completions$/, '');
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    throw new Error(
      'AI_API_KEY environment variable is required for the openai-compatible provider.\n' +
      'Set it via: export AI_API_KEY=your-key\n' +
      'You can also set OPENAI_BASE_URL for a custom endpoint (default: https://api.openai.com/v1)\n' +
      'and AI_MODEL to select the model (default: gpt-4o-mini).'
    );
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    let body;
    try { body = await response.text(); } catch { body = ''; }
    const url = response.url || `${baseUrl}/chat/completions`;
    throw new Error(
      `AI API error: ${response.status} ${response.statusText}${body ? ` — ${body}` : ''}\n` +
      `  URL:   ${url}\n` +
      `  Model: ${model}`
    );
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
