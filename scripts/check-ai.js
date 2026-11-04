// Checks the Ask tab's logic (no network, no API keys). Run: npm run check-ai
// Try one question: npm run check-ai -- "what is a load balancer"
import { MIN_SCORE, retrieve, scoreAll, stem, toContext } from "../src/ai/retrieve.js";
import { ASK_LEVELS, MAX_CONCEPTS } from "../src/ai/levels.js";
import { ask, historyFor, MAX_QUESTION, originOf } from "../src/ai/client.js";
import { ERROR_MESSAGES, funMessage, loadingMessage } from "../src/ai/messages.js";
import { addMessage, deleteChat, findChat, loadChats, MAX_CHATS, MAX_MESSAGES, newChatId, saveChats, titleFor } from "../src/ai/chats.js";
import { toBlocks } from "../src/ai/format.js";

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

// Chats: limits, order, titles, and broken storage.
let chats = [];
for (let i = 1; i <= MAX_CHATS + 1; i++) chats = addMessage(chats, `c${i}`, { role: "user", text: `question ${i}` }, i);
check(chats.length === MAX_CHATS, `chats: ${chats.length} kept, max is ${MAX_CHATS}`);
check(chats[0].id === `c${MAX_CHATS + 1}` && !findChat(chats, "c1"), "chats: newest should be first and the oldest dropped");
chats = addMessage(chats, "c5", { role: "assistant", text: "answer", origin: "map", conceptIds: ["latency"] }, 100);
check(chats[0].id === "c5" && chats[0].messages.length === 2 && chats[0].title === "question 5", "chats: answering should move the chat to the top and keep its title");
check(chats[0].messages[1].origin === "map" && chats[0].messages[1].at === 100, "chats: answer extras should be kept");
for (let i = 0; i < MAX_MESSAGES + 5; i++) chats = addMessage(chats, "c5", { role: "user", text: `m${i}` }, 200 + i);
check(findChat(chats, "c5").messages.length === MAX_MESSAGES && findChat(chats, "c5").messages.at(-1).text === `m${MAX_MESSAGES + 4}`, "chats: should keep only the newest messages");
const before = chats;
addMessage(before, "new", { role: "user", text: "x" });
check(before === chats && before.length === MAX_CHATS && !findChat(before, "new"), "chats: input should not change");
check(deleteChat(chats, "c5").length === MAX_CHATS - 1 && !findChat(deleteChat(chats, "c5"), "c5"), "chats: delete");
check(titleFor("  short  question ") === "short question", "title: should trim spaces");
const longTitle = titleFor("why does a load balancer need health checks when servers can fail at any moment of the day");
check(longTitle.length <= 61 && longTitle.endsWith("…") && !/\s…$/.test(longTitle), `title: long one should be cut at a word: "${longTitle}"`);
check(/^[a-z0-9]+$/.test(newChatId()) && newChatId() !== newChatId(), "chat id: should be URL-safe and different each time");

// Storage: no localStorage (Node, blocked) → empty; saved → loaded; junk → dropped.
check(loadChats().length === 0, "storage: no localStorage should give no chats");
const memory = new Map();
globalThis.localStorage = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, String(v)) };
saveChats(chats.slice(0, 3));
check(loadChats().length === 3 && loadChats()[0].id === chats[0].id, "storage: saved chats should load back");
memory.set("cm-chats", JSON.stringify([null, { id: 5 }, { id: "ok", messages: [{ role: "user", text: "q" }, { role: "hacker", text: "x" }, null] }, "junk"]));
check(same(loadChats().map((c) => [c.id, c.messages.length]), [["ok", 1]]), `storage: junk should be dropped, got ${JSON.stringify(loadChats())}`);
memory.set("cm-chats", "{not json");
check(loadChats().length === 0, "storage: broken JSON should give no chats");
memory.set("cm-chats", JSON.stringify({ not: "a list" }));
check(loadChats().length === 0, "storage: a non-list should give no chats");
globalThis.localStorage = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); } };
saveChats(chats);
check(loadChats().length === 0, "storage: blocked or full storage should not throw");
delete globalThis.localStorage;

// Answer formatting: paragraphs, lists, headings and stray stars.
const shape = (text) => toBlocks(text).map((b) => `${b.type}:${b.lines.join("|")}`);
for (const [text, expected] of [
  ["One.\nStill one.\n\nTwo.", ["p:One.|Still one.", "p:Two."]],
  ["Intro:\n- a\n- **b**\nAfter.", ["p:Intro:", "ul:a|**b**", "p:After."]],
  ["1. first\n2) second", ["ol:first|second"]],
  ["* star\n• dot", ["ul:star|dot"]],
  ["### Heading\ntext", ["h:Heading", "p:text"]],
  ["Intro.\n## **Bold title**:\n- a", ["p:Intro.", "h:Bold title", "ul:a"]],
  ["Line one.\\n\\n- point\\n- point two", ["p:Line one.", "ul:point|point two"]],
  ["### How it works\n1. ask\n2. answer\n### Summary\n- done", ["h:How it works", "ol:ask|answer", "h:Summary", "ul:done"]],
  ["#hashtag stays", ["p:#hashtag stays"]],
  ["**Step-by-step flow**\n1. a", ["h:Step-by-step flow", "ol:a"]],
  ["**Key take-aways:**\n- x", ["h:Key take-aways", "ul:x"]],
  ["**Summary**: it spreads load.", ["p:**Summary**: it spreads load."]],
  ["**Bold** start of a sentence.", ["p:**Bold** start of a sentence."]],
  ["- **Why caching matters**\n- **Speed** – fast reads.", ["h:Why caching matters", "ul:**Speed** – fast reads."]],
  ["- **Redis**\n- **Memcached**", ["ul:**Redis**|**Memcached**"]],
  ["only if *all* fail, **bold** stays, 2*3*4 too", ["p:only if all fail, **bold** stays, 2*3*4 too"]],
  ["- *item* here", ["ul:item here"]],
  ["\n\n  \n", []],
  [undefined, []]
]) {
  check(same(shape(text), expected), `format ${JSON.stringify(text)}: got ${JSON.stringify(shape(text))}`);
}

errors.forEach((e) => console.error("ERROR", e));
console.log(`\nSite: ${errors.length} errors`);
if (errors.length) process.exit(1);

// Then the Worker's own checks (it prints its result and exits).
await import("../worker/test/check-worker.js");
