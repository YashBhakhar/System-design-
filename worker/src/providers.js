/*
 * Groq and Gemini calls. The order they are tried in is PROVIDERS in config.js.
 * Each returns the model's parsed JSON, or throws { code }:
 *   QUOTA     - daily free quota used up
 *   SLOW_DOWN - per-minute limit hit
 *   UPSTREAM  - anything else (bad key, overloaded, bad reply, timeout...)
 */
import { PROVIDERS, TEMPERATURE } from "./config.js";
import { RESPONSE_SCHEMA, systemPrompt, userPrompt } from "./prompt.js";

const fail = (code, detail) => Object.assign(new Error(detail ?? code), { code });

async function post(url, headers, body, timeoutMs) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (e) {
    throw fail("UPSTREAM", `network: ${e.message}`);
  }
  const text = await res.text();
  // Both providers say "per day" somewhere in a daily-quota 429.
  if (res.status === 429) throw fail(/per ?day|RPD|TPD/i.test(text) ? "QUOTA" : "SLOW_DOWN", text.slice(0, 300));
  if (!res.ok) throw fail("UPSTREAM", `${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

function parseReply(raw) {
  try {
    return JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    throw fail("UPSTREAM", "reply was not valid JSON");
  }
}

/** The model name a provider uses for a level. */
export const modelFor = (provider, levelName) =>
  typeof provider.model === "string" ? provider.model : provider.model[levelName];

/** Ask one provider. `ask` = { levelName, level, question, context, history, reminder? }. */
export function callProvider(env, provider, ask) {
  return provider.api === "groq" ? callGroq(env, provider, ask) : callGemini(env, provider, ask);
}

async function callGemini(env, provider, { levelName, level, question, context, history, reminder }) {
  if (!env.GEMINI_API_KEY) throw fail("UPSTREAM", "GEMINI_API_KEY not set");
  const model = modelFor(provider, levelName);
  const data = await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    { "x-goog-api-key": env.GEMINI_API_KEY },
    {
      systemInstruction: { parts: [{ text: systemPrompt(level, reminder) }] },
      contents: [
        ...history.map((h) => ({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] })),
        { role: "user", parts: [{ text: userPrompt(question, context) }] }
      ],
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: level.maxTokens,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    },
    provider.timeoutMs
  );
  // Skip "thought" parts; join the rest.
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  const raw = parts.filter((p) => !p.thought && p.text).map((p) => p.text).join("");
  if (!raw) throw fail("UPSTREAM", `empty reply (${data.candidates?.[0]?.finishReason ?? "no candidate"})`);
  return { ...parseReply(raw), model };
}

async function callGroq(env, provider, { levelName, level, question, context, history, reminder }) {
  if (!env.GROQ_API_KEY) throw fail("UPSTREAM", "GROQ_API_KEY not set");
  const model = modelFor(provider, levelName);
  const data = await post(
    "https://api.groq.com/openai/v1/chat/completions",
    { authorization: `Bearer ${env.GROQ_API_KEY}` },
    {
      model,
      temperature: TEMPERATURE,
      max_tokens: level.maxTokens,
      response_format: { type: "json_object" },
      ...(model.startsWith("openai/gpt-oss") && { reasoning_effort: level.reasoning }),
      messages: [
        { role: "system", content: systemPrompt(level, reminder) },
        ...history.map((h) => ({ role: h.role === "user" ? "user" : "assistant", content: h.text })),
        { role: "user", content: userPrompt(question, context) }
      ]
    },
    provider.timeoutMs
  );
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw fail("UPSTREAM", `empty reply (${data.choices?.[0]?.finish_reason ?? "no choice"})`);
  return { ...parseReply(raw), model };
}

/** Dev only: do the configured model names exist for these keys? */
export async function checkModels(env) {
  const wanted = (api) =>
    [...new Set(PROVIDERS.filter((p) => p.api === api).flatMap((p) => (typeof p.model === "string" ? [p.model] : Object.values(p.model))))];
  const result = {};
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
      headers: { "x-goog-api-key": env.GEMINI_API_KEY ?? "" }
    });
    const data = await res.json();
    const names = new Set((data.models ?? []).map((m) => m.name.replace(/^models\//, "")));
    result.gemini = res.ok ? Object.fromEntries(wanted("gemini").map((m) => [m, names.has(m)])) : { error: data.error?.message ?? res.status };
    result.geminiFlashModels = [...names].filter((n) => n.includes("flash")).sort();
  } catch (e) {
    result.gemini = { error: e.message };
  }
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { authorization: `Bearer ${env.GROQ_API_KEY ?? ""}` }
    });
    const data = await res.json();
    const ids = new Set((data.data ?? []).map((m) => m.id));
    result.groq = res.ok ? Object.fromEntries(wanted("groq").map((m) => [m, ids.has(m)])) : { error: data.error?.message ?? res.status };
    result.groqModels = [...ids].sort();
  } catch (e) {
    result.groq = { error: e.message };
  }
  return result;
}
