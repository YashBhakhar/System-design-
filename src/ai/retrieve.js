/*
 * Finds the concepts that match a question, for the Ask tab.
 * Runs in the browser over our own data: no API call, instant.
 * Pure functions (no React), so scripts/check-ai.js can test them.
 *
 * Score = for each word of the question, how rare the word is (rare words
 * count more) x where it appears (title > aliases > short / remember > body),
 * plus a bonus when a whole title or alias appears in the question.
 */
import { NODES, NODE_BY_ID, prereqs, relatedTo } from "../data/index.js";
import { ASK_LEVELS, DEFAULT_LEVEL, MAX_CONCEPTS } from "./levels.js";

// Below MIN_SCORE a concept is not a match. Below RELATIVE x the best score,
// it is too weak next to the best match to be worth sending.
export const MIN_SCORE = 6;
const RELATIVE = 0.3;

const FIELD_WEIGHT = { title: 6, aliases: 4, short: 2, remember: 2, body: 1 };
const PHRASE_BONUS = { title: 6, aliases: 4 }; // per word of the phrase

const STOP_WORDS = new Set(
  `a an the is are was were be been being am do does did done how what why when where which who whom whose
  can could should would will shall may might must i me my we our you your it its they them their he she
  of to in on at for from with by about into over under between and or but not no so if then than as
  this that these those there here vs versus difference different explain tell please give show
  example examples mean means meaning work works working use used using get gets make makes
  system systems design some any all more most very also just like really thing things way ways
  happen happens keep keeps stay stays need needs want wants help helps
  best good better worse worst great nice top simple simply easy real`.split(/\s+/)
);

// Endings to strip, longest first, so "scaling", "scalable" and "scalability" all become "scal".
const SUFFIXES = [
  "ability", "ibility", "ation", "ition", "ement", "ments", "ment", "ness", "ency", "ence",
  "able", "ible", "ated", "ates", "ing", "ies", "ied", "ers", "ent", "ate", "ed", "es", "er", "ly", "e", "s", "y"
];

export function stem(word) {
  for (const s of SUFFIXES) {
    if (word.endsWith(s) && word.length - s.length >= 3) return word.slice(0, -s.length);
  }
  return word;
}

/** Lowercase words, without stop words, stemmed. Keeps order (for phrase matches). */
export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/\*\*/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .map(stem);
}

const asText = (value) => (Array.isArray(value) ? value.join(" ") : value ?? "");

// Built once: each concept's words per field, and how rare each word is.
const INDEX = NODES.map((n) => ({
  id: n.id,
  fields: {
    title: new Set(tokenize(n.title)),
    aliases: new Set(tokenize((n.aliases ?? []).join(" "))),
    short: new Set(tokenize(n.short)),
    remember: new Set(tokenize(n.remember)),
    body: new Set(tokenize([asText(n.what), n.example, n.why, asText(n.details)].join(" ")))
  },
  phrases: [
    { field: "title", words: tokenize(n.title.replace(/\(.*?\)/g, "")) },
    ...(n.aliases ?? []).map((a) => ({ field: "aliases", words: tokenize(a) }))
  ].filter((p) => p.words.length)
}));

const RARITY = (() => {
  const count = new Map();
  for (const entry of INDEX) {
    const words = new Set(Object.values(entry.fields).flatMap((set) => [...set]));
    for (const w of words) count.set(w, (count.get(w) ?? 0) + 1);
  }
  return (w) => Math.log(1 + NODES.length / (count.get(w) ?? 0.5));
})();

const containsPhrase = (tokens, words) =>
  tokens.some((_, i) => words.every((w, j) => tokens[i + j] === w));

/** Every concept with a score above 0, best first: [{ id, score }]. */
export function scoreAll(question) {
  const tokens = tokenize(question);
  const unique = [...new Set(tokens)];
  return INDEX.map(({ id, fields, phrases }) => {
    let score = 0;
    for (const w of unique) {
      let weight = 0;
      for (const [field, words] of Object.entries(fields)) if (words.has(w)) weight += FIELD_WEIGHT[field];
      score += weight * RARITY(w);
    }
    // Only the best phrase counts, so a concept with many aliases doesn't win by numbers.
    let bonus = 0;
    for (const p of phrases) {
      if (containsPhrase(tokens, p.words)) bonus = Math.max(bonus, PHRASE_BONUS[p.field] * p.words.length);
    }
    return { id, score: Math.round((score + bonus) * 10) / 10 };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * The concepts to send for a question at a level.
 * [{ id, score, via: "match" | "neighbour" }]; empty when nothing matches well.
 */
export function retrieve(question, levelName = DEFAULT_LEVEL) {
  const level = ASK_LEVELS[levelName] ?? ASK_LEVELS[DEFAULT_LEVEL];
  const scored = scoreAll(question);
  const best = scored[0]?.score ?? 0;
  const matches = scored
    .filter((x) => x.score >= MIN_SCORE && x.score >= best * RELATIVE)
    .slice(0, level.k)
    .map((x) => ({ ...x, via: "match" }));
  if (!matches.length) return [];

  const around = [];
  if (level.neighbours !== "none") {
    const centres = matches.slice(0, level.neighbours === "prereqs" ? 1 : 2).map((m) => m.id);
    for (const id of centres) {
      around.push(...prereqs(id));
      if (level.neighbours === "prereqs+related") around.push(...relatedTo(id).map((r) => r.id));
    }
  }
  const taken = new Set(matches.map((m) => m.id));
  const neighbours = [...new Set(around)]
    .filter((id) => !taken.has(id))
    .map((id) => ({ id, score: 0, via: "neighbour" }));

  return [...matches, ...neighbours].slice(0, MAX_CONCEPTS);
}

const plain = (text) => asText(text).replace(/\*\*/g, "");

/**
 * The text sent to the AI for each concept: [{ id, title, text }].
 * Earlier concepts (better matches) get their full text first; later ones
 * are cut short when the level's budget runs out.
 */
export function toContext(ids, maxChars) {
  let budget = maxChars;
  const out = [];
  for (const id of ids) {
    const n = NODE_BY_ID[id];
    if (!n || budget < 80) continue;
    const full = [
      plain(n.short),
      plain(n.what),
      n.example && `Example: ${plain(n.example)}`,
      n.details && plain(n.details),
      n.remember && `Remember: ${plain(n.remember)}`
    ]
      .filter(Boolean)
      .join("\n");
    const text = full.length <= budget ? full : `${full.slice(0, budget - 1).replace(/\s+\S*$/, "")}…`;
    budget -= text.length;
    out.push({ id, title: n.title, text });
  }
  return out;
}
