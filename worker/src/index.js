/*
 * Ask AI proxy.
 *
 * POST /  { question, level, context: [{ id, title, text }], history: [{ role, text }] }
 *   200 → { answer, usedConceptIds, usedGeneralKnowledge, provider, model }
 *   4xx/5xx/200 → { error: CODE }   (codes are listed in docs/ai-tab-plan.md)
 *
 * GET /check  (only with DEV_MODE=1): do the configured models exist?
 */
import { FALLBACK_RATE, LEVELS, LIMITS, PROVIDERS } from "./config.js";
import { callProvider, checkModels, modelFor } from "./providers.js";
import { needsHeadings } from "./prompt.js";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin");
    const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim());
    const cors = allowed.includes(origin)
      ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", vary: "origin" }
      : {};
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors } });

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/check" && env.DEV_MODE === "1") {
      return reply(200, await checkModels(env));
    }
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (!cors["access-control-allow-origin"]) return reply(403, { error: "FORBIDDEN" });
    if (request.method !== "POST") return reply(405, { error: "BAD_REQUEST" });

    const ip = request.headers.get("cf-connecting-ip") ?? "local";
    if (!(await allowRequest(env, ip))) return reply(429, { error: "SLOW_DOWN" });

    const input = await readInput(request);
    if (input.error) return reply(400, input);
    const ask = { ...input, level: LEVELS[input.levelName] };
    const { context } = input;

    // Each provider in turn, until one answers.
    const errors = [];
    for (const provider of PROVIDERS) {
      try {
        let out = await callProvider(env, provider, ask);
        if (out.offTopic) return reply(200, { error: "OFF_TOPIC" });
        if (typeof out.answer !== "string" || !out.answer.trim()) throw Object.assign(new Error("empty answer"), { code: "UPSTREAM" });
        // Normal and Deep should have "### " sections; models sometimes skip them. Ask once more, firmly,
        // and keep the first answer if the second fails or is no better.
        if (needsHeadings(ask.level, fixBreaks(out.answer))) {
          try {
            const again = await callProvider(env, provider, { ...ask, reminder: true });
            if (typeof again.answer === "string" && !again.offTopic && !needsHeadings(ask.level, fixBreaks(again.answer))) out = again;
          } catch {
            // keep the first answer
          }
        }
        // Only ids we actually sent count as "from the Concept Map".
        const sent = new Set(context.map((c) => c.id));
        return reply(200, {
          answer: fixBreaks(out.answer).trim(),
          usedConceptIds: [...new Set((Array.isArray(out.usedConceptIds) ? out.usedConceptIds : []).filter((id) => sent.has(id)))],
          usedGeneralKnowledge: out.usedGeneralKnowledge !== false,
          provider: provider.api,
          model: out.model
        });
      } catch (e) {
        console.log(`${provider.api} ${modelFor(provider, input.levelName)} failed: ${e.code ?? "UPSTREAM"} ${e.message}`);
        errors.push(e.code ?? "UPSTREAM");
      }
    }
    // All failed: "used up" only if every one is used up.
    if (errors.every((c) => c === "QUOTA")) return reply(429, { error: "QUOTA" });
    if (errors.includes("SLOW_DOWN")) return reply(429, { error: "SLOW_DOWN" });
    return reply(502, { error: "UPSTREAM" });
  }
};

// Some models escape line breaks twice in JSON, leaving "\n" as two characters.
const fixBreaks = (text) => text.replace(/\\r\\n|\\n/g, "\n");

async function readInput(request) {
  const raw = await request.text();
  if (raw.length > LIMITS.bodyBytes) return { error: "TOO_LONG" };
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return { error: "BAD_REQUEST" };
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return { error: "BAD_REQUEST" };
  if (question.length > LIMITS.question) return { error: "TOO_LONG" };

  const levelName = LEVELS[body.level] ? body.level : "normal";

  // Context is cut to fit, never rejected.
  let budget = LIMITS.contextChars;
  const context = [];
  for (const c of Array.isArray(body.context) ? body.context.slice(0, LIMITS.contextItems) : []) {
    if (typeof c?.id !== "string" || !/^[a-z0-9-]{1,80}$/.test(c.id) || budget <= 0) continue;
    const text = String(c.text ?? "").slice(0, budget);
    budget -= text.length;
    context.push({ id: c.id, title: String(c.title ?? c.id).slice(0, 120), text });
  }

  const history = (Array.isArray(body.history) ? body.history.slice(-LIMITS.historyTurns) : [])
    .filter((h) => typeof h?.text === "string" && h.text.trim())
    .map((h) => ({ role: h.role === "user" ? "user" : "assistant", text: h.text.slice(0, LIMITS.historyChars) }));

  return { question, levelName, context, history };
}

// Cloudflare's rate limiter when available; otherwise a best-effort per-isolate counter.
const recent = new Map();
async function allowRequest(env, ip) {
  if (env.LIMITER) return (await env.LIMITER.limit({ key: ip })).success;
  const now = Date.now();
  const times = (recent.get(ip) ?? []).filter((t) => now - t < FALLBACK_RATE.periodMs);
  if (times.length >= FALLBACK_RATE.limit) return false;
  times.push(now);
  recent.set(ip, times);
  return true;
}
