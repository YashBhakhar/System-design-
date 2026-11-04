// Checks the Ask tab's logic (no network, no API keys). Run: npm run check-ai
// Try one question: npm run check-ai -- "what is a load balancer"
import { MIN_SCORE, retrieve, scoreAll, stem, toContext } from "../src/ai/retrieve.js";
import { ASK_LEVELS, MAX_CONCEPTS } from "../src/ai/levels.js";

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

errors.forEach((e) => console.error("ERROR", e));
console.log(`\n${errors.length} errors`);
process.exit(errors.length ? 1 : 0);
