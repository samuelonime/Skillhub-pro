// utils/aiClient.js — Resilient multi-provider AI client
//
// Tries providers in order until one succeeds. This means a single provider
// running out of quota (e.g. Gemini 429) no longer breaks resume generation
// or job scouting — it automatically falls through to the next configured key.
//
// Configure any subset of these env vars. Providers with no key are skipped:
//   GEMINI_API_KEY     → Google Gemini   (gemini-2.0-flash)
//   GROQ_API_KEY       → Groq            (llama-3.3-70b-versatile)
//   OPENROUTER_API_KEY → OpenRouter      (free Llama 3 model)
//
// The order is controlled by AI_PROVIDER_ORDER (comma list), default:
//   gemini,groq,openrouter

const ORDER = (process.env.AI_PROVIDER_ORDER || 'gemini,groq,openrouter')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// ── Individual provider callers ──────────────────────────────────────────────

async function callGemini(systemPrompt, userPrompt, { temperature, maxTokens, json }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('skip: GEMINI_API_KEY not set');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  const generationConfig = { temperature, maxOutputTokens: maxTokens };
  if (json) generationConfig.responseMimeType = 'application/json';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = JSON.stringify(data.error || data);
    const e = new Error(`Gemini error: ${msg}`);
    e.retryable = res.status === 429 || res.status >= 500;
    throw e;
  }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text');
  return text;
}

// Groq + OpenRouter are both OpenAI-compatible — share one caller.
async function callOpenAICompatible(baseURL, key, model, systemPrompt, userPrompt, { temperature, maxTokens, json }) {
  if (!key) throw new Error('skip: key not set');

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  };
  if (json) body.response_format = { type: 'json_object' };

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = JSON.stringify(data.error || data);
    const e = new Error(`AI error: ${msg}`);
    e.retryable = res.status === 429 || res.status >= 500;
    throw e;
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Provider returned no text');
  return text;
}

const PROVIDERS = {
  gemini: (sys, usr, opts) => callGemini(sys, usr, opts),
  groq:   (sys, usr, opts) => callOpenAICompatible(
    'https://api.groq.com/openai/v1',
    process.env.GROQ_API_KEY,
    process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    sys, usr, opts,
  ),
  openrouter: (sys, usr, opts) => callOpenAICompatible(
    'https://openrouter.ai/api/v1',
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
    sys, usr, opts,
  ),
};

// ── Public API ───────────────────────────────────────────────────────────────

function isAIConfigured() {
  return ORDER.some(p => {
    if (p === 'gemini')     return !!process.env.GEMINI_API_KEY;
    if (p === 'groq')       return !!process.env.GROQ_API_KEY;
    if (p === 'openrouter') return !!process.env.OPENROUTER_API_KEY;
    return false;
  });
}

/**
 * Generate text using the first available AI provider, falling back on failure.
 * @returns {Promise<{ text: string, provider: string }>}
 */
async function generateText(systemPrompt, userPrompt, opts = {}) {
  const options = {
    temperature: opts.temperature ?? 0.7,
    maxTokens:   opts.maxTokens   ?? 4000,
    json:        opts.json        ?? false,
  };

  const errors = [];
  for (const name of ORDER) {
    const provider = PROVIDERS[name];
    if (!provider) continue;
    try {
      const text = await provider(systemPrompt, userPrompt, options);
      return { text, provider: name };
    } catch (err) {
      // "skip:" means no key configured — silently move on
      if (!String(err.message).startsWith('skip:')) {
        console.warn(`[AI] Provider "${name}" failed: ${err.message.slice(0, 160)}`);
        errors.push(`${name}: ${err.message.slice(0, 80)}`);
      }
    }
  }

  throw new Error(
    errors.length
      ? `All AI providers failed → ${errors.join(' | ')}`
      : 'No AI provider configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY.'
  );
}

module.exports = { generateText, isAIConfigured };