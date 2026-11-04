// Checks the Worker with fake AI providers: no keys, no network, no wrangler.
// Run from the repo root: npm run check-ai (runs this too), or node worker/test/check-worker.js
import worker from "../src/index.js";
import { PROVIDERS } from "../src/config.js";

const ORIGIN = "http://localhost:5173";
const env = { ALLOWED_ORIGINS: `https://example.github.io,${ORIGIN}`, GROQ_API_KEY: "groq-test", GEMINI_API_KEY: "gemini-test" };

const errors = [];
const check = (ok, message) => ok || errors.push(message);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Each request gets its own IP unless one is given, so the rate limit stays out of the way.
let ipCount = 0;
async function call(body, { origin = ORIGIN, method = "POST", ip, path = "/", useEnv = env } = {}) {
  const headers = { "content-type": "application/json", "cf-connecting-ip": ip ?? `10.0.0.${++ipCount}` };
  if (origin) headers.origin = origin;
  const init = { method, headers };
  if (method === "POST") init.body = typeof body === "string" ? body : JSON.stringify(body);
  const res = await worker.fetch(new Request(`http://worker${path}`, init), useEnv);
  const text = await res.text();
  return { status: res.status, headers: res.headers, json: text ? JSON.parse(text) : null };
}

// Fake providers. `script` is a list of replies, one per upstream call, in order:
//   { ok: {answer...} } | { status, text } | { raw: "not json" } | { throws: true }
let calls = [];
function fakeUpstream(script) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    const body = JSON.parse(init.body);
    const api = String(url).includes("groq.com") ? "groq" : "gemini";
    const model = api === "groq" ? body.model : String(url).match(/models\/([^:]+):/)[1];
    calls.push({ api, model, body, headers: init.headers });
    const step = script[calls.length - 1] ?? { status: 500, text: "no more scripted replies" };
    if (step.throws) throw new TypeError("network down");
    if (step.status) return new Response(step.text ?? "", { status: step.status });
    const content = step.raw ?? JSON.stringify(step.ok);
    return Response.json(
      api === "groq"
        ? { choices: [{ message: { content } }] }
        : { candidates: [{ content: { parts: [{ text: content }] } }] }
    );
  };
}
// The default fake answer has a "### " section, so Normal / Deep don't retry for headings.
const answer = (extra = {}) => ({ ok: { answer: "An answer.\n\n### More\n- a point", usedConceptIds: [], usedGeneralKnowledge: true, offTopic: false, ...extra } });
const QUESTION = { question: "What is latency?", level: "normal", context: [{ id: "latency", title: "Latency", text: "How long one request takes." }] };

const log = console.log;
console.log = () => {}; // the Worker logs each failed provider; keep the output clean

// --- Who may call it ---
fakeUpstream([answer()]);
check((await call(QUESTION, { origin: null })).json?.error === "FORBIDDEN", "no Origin header should be FORBIDDEN");
check((await call(QUESTION, { origin: "https://evil.example" })).status === 403, "unknown origin should be 403");
check(calls.length === 0, "a refused request must not reach a provider");
const pre = await worker.fetch(new Request("http://worker/", { method: "OPTIONS", headers: { origin: ORIGIN } }), env);
check(pre.status === 204 && pre.headers.get("access-control-allow-origin") === ORIGIN, "preflight from the site should be allowed");
check((await call(null, { method: "GET" })).status === 405, "GET / should be 405");
check((await call(null, { method: "GET", path: "/check" })).status !== 200, "/check must be off without DEV_MODE");

// --- Input checks ---
check((await call("not json")).json?.error === "BAD_REQUEST", "bad JSON → BAD_REQUEST");
check((await call({ question: "   " })).json?.error === "BAD_REQUEST", "empty question → BAD_REQUEST");
check((await call({ question: "a".repeat(501) })).json?.error === "TOO_LONG", "501-char question → TOO_LONG");
check((await call({ question: "hi", context: [{ id: "x", text: "y".repeat(40_000) }] })).json?.error === "TOO_LONG", "huge body → TOO_LONG");

// --- Happy path, and what gets sent ---
fakeUpstream([answer({ usedConceptIds: ["latency", "made-up", "latency"], usedGeneralKnowledge: false })]);
let r = await call(QUESTION);
check(r.status === 200 && r.json.answer.startsWith("An answer.") && r.json.provider === "groq" && r.json.model === PROVIDERS[0].model, `first provider should answer, got ${JSON.stringify(r.json)}`);
check(same(r.json.usedConceptIds, ["latency"]), `only sent ids count, once each: got ${JSON.stringify(r.json.usedConceptIds)}`);
check(r.json.usedGeneralKnowledge === false, "usedGeneralKnowledge should pass through");
check(r.headers.get("access-control-allow-origin") === ORIGIN, "answer should carry the CORS header");
check(calls[0].headers.authorization === "Bearer groq-test", "Groq key should go in the Authorization header");
const sentText = JSON.stringify(calls[0].body.messages);
check(sentText.includes("[id: latency]") && sentText.includes("QUESTION: What is latency?"), "prompt should carry the context and question");
check(!sentText.includes("groq-test") && !sentText.includes("gemini-test"), "keys must never be in the prompt");

fakeUpstream([answer({ answer: "Intro.\\n\\n### Title\\n- a\\n- b" })]);
check((await call(QUESTION)).json.answer === "Intro.\n\n### Title\n- a\n- b", "line breaks escaped twice should become real ones");
check(calls[0].body.messages[0].content.includes('"### " heading'), "the normal level should ask for headings");

// Missing "### " sections at Normal / Deep: one firmer retry, same provider.
const FLAT = answer({ answer: "One long paragraph, no sections." });
const SECTIONED = answer({ answer: "Short answer.\n\n### Why\n- a" });
fakeUpstream([FLAT, SECTIONED]);
r = await call(QUESTION);
check(r.json.answer.includes("### Why") && calls.length === 2 && calls[1].model === calls[0].model, "flat Normal answer → one retry, sectioned answer kept");
check(calls[1].body.messages[0].content.startsWith("IMPORTANT") && !calls[0].body.messages[0].content.startsWith("IMPORTANT"), "only the retry should carry the reminder");
fakeUpstream([FLAT, FLAT]);
r = await call({ ...QUESTION, level: "deep" });
check(r.status === 200 && r.json.answer === "One long paragraph, no sections." && calls.length === 2, "two flat answers → first one returned, no third call");
fakeUpstream([FLAT, { status: 429, text: "requests per minute" }]);
r = await call(QUESTION);
check(r.status === 200 && r.json.answer === "One long paragraph, no sections." && calls.length === 2, "a failed retry keeps the first answer");
fakeUpstream([FLAT]);
r = await call({ ...QUESTION, level: "quick" });
check(r.status === 200 && calls.length === 1, "Quick has no sections, so no retry");
fakeUpstream([SECTIONED]);
await call(QUESTION);
check(calls.length === 1, "a sectioned answer needs no retry");

fakeUpstream([answer({ usedGeneralKnowledge: "yes" })]);
check((await call(QUESTION)).json.usedGeneralKnowledge === true, "anything but false counts as general knowledge (safer badge)");

// Levels: token ceiling and reasoning effort.
for (const [level, maxTokens, reasoning] of [["quick", 1024, "low"], ["deep", 4096, "medium"], ["no-such-level", 2048, "low"]]) {
  fakeUpstream([answer()]);
  await call({ ...QUESTION, level });
  check(calls[0].body.max_tokens === maxTokens && calls[0].body.reasoning_effort === reasoning, `level ${level}: got max_tokens ${calls[0].body.max_tokens}, reasoning ${calls[0].body.reasoning_effort}`);
}

// Context and history are trimmed, never rejected.
fakeUpstream([answer()]);
await call({
  question: "q",
  context: [{ id: "Bad ID!", text: "x" }, ...Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, title: `C${i}`, text: "t".repeat(2000) }))],
  history: Array.from({ length: 9 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", text: `h${i}` }))
});
const prompt = calls[0].body.messages.at(-1).content;
check(!prompt.includes("Bad ID!"), "a bad concept id should be dropped");
check((prompt.match(/\[id: /g) ?? []).length <= 8, "at most 8 concepts should be sent");
check(prompt.length < 12_000 + 2_000, `context should be cut to about 12k chars (prompt ${prompt.length})`);
const hist = calls[0].body.messages.slice(1, -1).map((m) => m.content);
check(same(hist, ["h5", "h6", "h7", "h8"]), `history should be the last 4 turns, got ${JSON.stringify(hist)}`);

// --- Fallback order ---
const order = (expected) => same(calls.map((c) => c.model), expected);
const [g1, g2] = [PROVIDERS[0].model, PROVIDERS[1].model];
const gemini = (level) => PROVIDERS[2].model[level];

fakeUpstream([{ status: 429, text: "Rate limit reached on requests per minute (RPM)" }, answer()]);
r = await call(QUESTION);
check(r.status === 200 && order([g1, g2]) && r.json.model === g2, `per-minute limit on the first should fall to the second: ${calls.map((c) => c.model)}`);

fakeUpstream([{ status: 500 }, { raw: "not json at all" }, answer()]);
r = await call({ ...QUESTION, level: "quick" });
check(r.status === 200 && r.json.provider === "gemini" && order([g1, g2, gemini("quick")]), `bad replies should fall through to Gemini (quick model): ${calls.map((c) => c.model)}`);
check(calls[2].headers["x-goog-api-key"] === "gemini-test", "Gemini key should go in x-goog-api-key");

fakeUpstream([answer({ answer: "   " }), { throws: true }, answer()]);
check((await call(QUESTION)).json.provider === "gemini", "an empty answer and a network error should both fall through");

fakeUpstream([answer()]);
r = await call(QUESTION, { useEnv: { ...env, GROQ_API_KEY: undefined } });
check(r.json.provider === "gemini" && calls.every((c) => c.api === "gemini"), "without a Groq key, Gemini should answer");

// --- Off topic ---
fakeUpstream([answer({ offTopic: true, answer: "" })]);
r = await call({ question: "Best biryani recipe?" });
check(r.status === 200 && r.json.error === "OFF_TOPIC" && calls.length === 1, "off-topic should return OFF_TOPIC without trying others");

// --- When everything fails: which code ---
const DAILY_GROQ = { status: 429, text: "Rate limit reached for model on tokens per day (TPD)" };
const DAILY_GEMINI = { status: 429, text: '{"error":{"status":"RESOURCE_EXHAUSTED","details":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}}' };
const MINUTE = { status: 429, text: "requests per minute" };
for (const [script, status, code, label] of [
  [[DAILY_GROQ, DAILY_GROQ, DAILY_GEMINI], 429, "QUOTA", "all used up for the day"],
  [[DAILY_GROQ, DAILY_GROQ, { status: 503, text: "high demand" }], 502, "UPSTREAM", "used up + overloaded (not QUOTA: one is just broken)"],
  [[DAILY_GROQ, MINUTE, { status: 500 }], 429, "SLOW_DOWN", "a per-minute limit anywhere"],
  [[{ status: 500 }, { status: 401, text: "bad key" }, { throws: true }], 502, "UPSTREAM", "all broken"]
]) {
  fakeUpstream(script);
  r = await call(QUESTION);
  check(r.status === status && r.json.error === code && calls.length === PROVIDERS.length, `${label}: expected ${status} ${code}, got ${r.status} ${r.json?.error} after ${calls.length} calls`);
}

// --- Rate limit (fallback counter; LIMITER binding absent here) ---
fakeUpstream(Array.from({ length: 10 }, () => answer()));
const results = [];
for (let i = 0; i < 7; i++) results.push((await call(QUESTION, { ip: "1.2.3.4" })).json.error ?? "ok");
check(same(results, ["ok", "ok", "ok", "ok", "ok", "ok", "SLOW_DOWN"]), `7th question in a minute should be SLOW_DOWN: ${results}`);
check(calls.length === 6, "a rate-limited question must not reach a provider");
check((await call(QUESTION, { ip: "5.6.7.8" })).json.answer, "another visitor should not be limited");

// With the Cloudflare binding, it decides.
fakeUpstream([answer()]);
r = await call(QUESTION, { useEnv: { ...env, LIMITER: { limit: async () => ({ success: false }) } } });
check(r.status === 429 && r.json.error === "SLOW_DOWN" && calls.length === 0, "the LIMITER binding should be used when present");

console.log = log;
errors.forEach((e) => console.error("ERROR", e));
console.log(`\nWorker: ${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
