// Checks the Ask tab's logic (no network, no API keys). Run: npm run check-ai
// Try one question: npm run check-ai -- "what is a load balancer"
import { MIN_SCORE, retrieve, scoreAll, stem, toContext } from "../src/ai/retrieve.js";
import { ASK_LEVELS, MAX_CONCEPTS } from "../src/ai/levels.js";
import { ask, historyFor, MAX_QUESTION, originOf } from "../src/ai/client.js";
import { ERROR_MESSAGES, funMessage, loadingMessage } from "../src/ai/messages.js";

const question = process.argv[2];
if (question) {
  console.log(`Scores (a match needs ${MIN_SCORE}+):`);
  for (const { id, score } of scoreAll(question).slice(0, 8)) console.log(`  ${String(score).padStart(6)}  ${id}`);
  for (const level of Object.keys(ASK_LEVELS)) {
    console.log(`${level.padEnd(7)} → ${retrieve(question, level).map((c) => c.id + (c.via === "neighbour" ? "*" : "")).join(", ") || "(nothing: AI-generated answer)"}`);
  }
  console.log("* = added from the graph");
  process.exit(0);
}

const errors = [];
const check = (ok, message) => ok || errors.push(message);
const ids = (q, level = "normal") => retrieve(q, level).map((c) => c.id);
const topTwo = (q) => ids(q).slice(0, 2);

// Words that should end up the same.
for (const [a, b] of [["scaling", "scalability"], ["available", "availability"], ["caching", "cache"], ["servers", "server"], ["queries", "query"], ["consistent", "consistency"]]) {
  check(stem(a) === stem(b), `stem: "${a}" → "${stem(a)}" but "${b}" → "${stem(b)}"`);
}

// Question → a concept that must be among the top two matches.
const EXPECTED = [
  ["what is latency", "latency"],
  ["cap theorem", "cap-theorem"],
  ["What is CAP?", "cap-theorem"],
  ["difference between vertical and horizontal scaling", "vertical-scaling"],
  ["what is a load balancer", "load-balancer"],
  ["why do we need caching", "cache"],
  ["sharding vs replication", "sharding"],
  ["what is eventual consistency", "eventual-consistency"],
  ["how many nines is 99.99", "availability-nines"],
  ["what is SPOF", "single-point-of-failure"],
  ["how do queues help", "message-queue"],
  ["explain active passive failover", "active-passive"],
  ["what is redis", "in-memory-store"],
  ["How does Netflix stay available?", "high-availability"]
];
for (const [q, id] of EXPECTED) {
  const top = q.includes("Netflix") ? ids(q) : topTwo(q); // Netflix: anywhere in the list is fine
  check(top.includes(id), `"${q}": expected "${id}", got [${top.join(", ")}]`);
}

// Off-topic or not in our data: nothing sent, so the answer is marked AI-generated.
for (const q of ["best biryani recipe", "how does netflix recommend movies", "who won the cricket world cup", "hello"]) {
  check(ids(q).length === 0, `"${q}": expected no match, got [${ids(q).join(", ")}]`);
}

// Levels: more concepts at deeper levels, never more than the Worker accepts.
for (const q of ["cap theorem", "sharding vs replication", "why do we need caching"]) {
  const [quick, normal, deep] = ["quick", "normal", "deep"].map((l) => retrieve(q, l));
  check(quick.length <= normal.length && normal.length <= deep.length, `"${q}": levels not increasing (${quick.length}, ${normal.length}, ${deep.length})`);
  check(deep.length <= MAX_CONCEPTS, `"${q}": ${deep.length} concepts at deep, max is ${MAX_CONCEPTS}`);
  check(!quick.some((c) => c.via === "neighbour"), `"${q}": quick should not add graph neighbours`);
  check(new Set(deep.map((c) => c.id)).size === deep.length, `"${q}": duplicate concepts`);
}

// Context text: within budget, no ** markup, best match first and complete.
for (const level of Object.keys(ASK_LEVELS)) {
  const found = ids("sharding vs replication", level);
  const context = toContext(found, ASK_LEVELS[level].contextChars);
  const total = context.reduce((sum, c) => sum + c.text.length, 0);
  check(total <= ASK_LEVELS[level].contextChars, `context (${level}): ${total} chars, budget ${ASK_LEVELS[level].contextChars}`);
  check(!context.some((c) => c.text.includes("**")), `context (${level}): still has ** markup`);
  check(context[0]?.id === found[0] && !context[0].text.endsWith("…"), `context (${level}): best match missing or cut short`);
}
check(toContext(["no-such-concept"], 1000).length === 0, "context: unknown id should be skipped");

// Origin badge: decided by our code, made-up ids don't count.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const [ids, general, expected] of [
  [["latency"], false, { origin: "map", conceptIds: ["latency"] }],
  [["latency", "cap-theorem"], true, { origin: "mixed", conceptIds: ["latency", "cap-theorem"] }],
  [[], true, { origin: "ai", conceptIds: [] }],
  [["made-up-id"], false, { origin: "ai", conceptIds: [] }],
  [["latency", "made-up-id", "latency"], false, { origin: "map", conceptIds: ["latency"] }],
  [undefined, undefined, { origin: "ai", conceptIds: [] }]
]) {
  const got = originOf(ids, general);
  check(same(got, expected), `originOf(${JSON.stringify(ids)}, ${general}): got ${JSON.stringify(got)}`);
}

// History: last 4 real messages, failed answers left out.
const chat = [1, 2, 3, 4, 5].flatMap((i) => [{ role: "user", text: `q${i}` }, { role: "assistant", text: `a${i}` }]);
check(same(historyFor(chat).map((m) => m.text), ["q4", "a4", "q5", "a5"]), "history: should keep the last 4 messages");
check(historyFor([{ role: "user", text: "q" }, { role: "assistant", text: "x", error: "QUOTA" }]).length === 1, "history: errors should be left out");

// Fun messages: every code has one; unknown codes fall back.
for (const code of Object.keys(ERROR_MESSAGES)) check(typeof funMessage(code) === "string", `message: none for ${code}`);
check(ERROR_MESSAGES.UPSTREAM.includes(funMessage("SOMETHING_NEW")), "message: unknown code should use UPSTREAM");
check(funMessage("QUOTA", () => 0.99) !== funMessage("QUOTA", () => 0), "message: QUOTA should have more than one");
check(typeof loadingMessage() === "string", "message: no loading message");

// ask(): checks before any network call.
check((await ask({ question: "  ", url: "x" })).error === "BAD_REQUEST", "ask: empty question");
check((await ask({ question: "a".repeat(MAX_QUESTION + 1), url: "x" })).error === "TOO_LONG", "ask: long question");
check((await ask({ question: "hi", url: "" })).error === "NOT_CONFIGURED", "ask: no URL");

// ask(): with a fake network.
const realFetch = globalThis.fetch;
const fakeFetch = (status, body, onCall) => {
  globalThis.fetch = async (_url, init) => {
    onCall?.(JSON.parse(init.body));
    if (status === "offline") throw new TypeError("Failed to fetch");
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  };
};
let sent;
fakeFetch(200, { answer: "A", usedConceptIds: ["latency"], usedGeneralKnowledge: false, provider: "groq", model: "m" }, (b) => (sent = b));
const good = await ask({ question: "what is latency", level: "quick", url: "x" });
check(good.answer === "A" && good.origin === "map" && same(good.conceptIds, ["latency"]), `ask: good answer, got ${JSON.stringify(good)}`);
check(sent?.level === "quick" && sent.context[0]?.id === "latency" && Array.isArray(sent.history), `ask: request body wrong: ${JSON.stringify(sent)?.slice(0, 120)}`);
for (const [status, body, expected] of [
  [429, { error: "QUOTA" }, "QUOTA"],
  [429, { error: "SLOW_DOWN" }, "SLOW_DOWN"],
  [200, { error: "OFF_TOPIC" }, "OFF_TOPIC"],
  [502, { error: "UPSTREAM" }, "UPSTREAM"],
  [500, "<html>oops</html>", "UPSTREAM"],
  [200, { nothing: true }, "UPSTREAM"],
  ["offline", null, "NETWORK"]
]) {
  fakeFetch(status, body);
  const got = await ask({ question: "what is latency", url: "x" });
  check(got.error === expected, `ask: ${status} ${JSON.stringify(body)} should give ${expected}, got ${JSON.stringify(got)}`);
}
const controller = new AbortController();
controller.abort();
globalThis.fetch = async (_u, init) => { init.signal.throwIfAborted(); };
check((await ask({ question: "what is latency", url: "x", signal: controller.signal })).error === "CANCELLED", "ask: cancel should give CANCELLED");
globalThis.fetch = realFetch;

errors.forEach((e) => console.error("ERROR", e));
console.log(`\n${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
