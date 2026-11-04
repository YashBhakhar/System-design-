/*
 * Everything tunable in one place.
 * Model names: check them with GET /check (dev only) after changing.
 */

/*
 * Tried in order until one answers. Each model has its own free quota,
 * so a longer list means more free questions per day.
 * Groq is first because it answers in ~2 s; Gemini's free tier was taking
 * 20-30 s and often replying "high demand" (measured Nov 2026).
 */
export const PROVIDERS = [
  { api: "groq", model: "openai/gpt-oss-120b", timeoutMs: 20_000 },
  { api: "groq", model: "openai/gpt-oss-20b", timeoutMs: 20_000 },
  { api: "gemini", model: { quick: "gemini-3.5-flash-lite", normal: "gemini-3.5-flash", deep: "gemini-3.5-flash" }, timeoutMs: 35_000 }
];

/*
 * Depth levels. `words` steers the answer length through the prompt.
 * `maxTokens` is only a safety ceiling: "thinking" tokens count towards it
 * too, so it is set well above the answer length to avoid cut-off JSON.
 * `reasoning` is how hard gpt-oss models think (Groq only).
 */
export const LEVELS = {
  quick: { words: "about 100 words", maxTokens: 1024, reasoning: "low" },
  normal: { words: "about 250 words", maxTokens: 2048, reasoning: "low" },
  deep: { words: "about 500 words, step by step, with a short summary at the end", maxTokens: 4096, reasoning: "medium" }
};

export const TEMPERATURE = 0.3;

export const LIMITS = {
  bodyBytes: 32_000,
  question: 500,
  contextItems: 8,
  contextChars: 12_000,
  historyTurns: 4,
  historyChars: 1_000 // per turn
};

// Used only when the LIMITER binding is missing (e.g. an old wrangler).
export const FALLBACK_RATE = { limit: 6, periodMs: 60_000 };
