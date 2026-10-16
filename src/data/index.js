/*
 * All concepts live here. Each learned topic gets its own file in ./topics
 * and is added to TOPICS below. The format is described in CONTRIBUTING.md.
 */
import scalability from "./topics/scalability.js";
import { CONCERNS, KINDS, LANES, LEVELS } from "./concerns.js";

const TOPICS = [scalability];

export { CONCERNS, KINDS, LANES, LEVELS };

export const NODES = TOPICS.flatMap((t) => t.nodes);
export const EDGES = TOPICS.flatMap((t) => t.edges ?? []);
export const CONFUSIONS = TOPICS.flatMap((t) => t.confusions ?? []);

export const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));
export const CONCERN_BY_ID = Object.fromEntries(CONCERNS.map((c) => [c.id, c]));

const prereqsOf = (n) => (n.prereqs ?? []).filter((id) => NODE_BY_ID[id]);

/*
 * The learning path: every concept comes after its prerequisites.
 * Among concepts that are ready, earlier concerns go first, then file order.
 * So a new concept slots into the right place just by listing its prereqs.
 */
function learningPath() {
  const concernRank = new Map(CONCERNS.map((c, i) => [c.id, i]));
  const fileRank = new Map(NODES.map((n, i) => [n.id, i]));
  const rank = (id) => [concernRank.get(NODE_BY_ID[id].concern) ?? 99, fileRank.get(id)];
  const before = (a, b) => {
    const [ca, fa] = rank(a), [cb, fb] = rank(b);
    return ca !== cb ? ca < cb : fa < fb;
  };

  const waiting = new Map(NODES.map((n) => [n.id, new Set(prereqsOf(n))]));
  const path = [];
  while (waiting.size) {
    let next = null;
    for (const [id, pre] of waiting) if (pre.size === 0 && (!next || before(id, next))) next = id;
    if (!next) break; // a prerequisite loop; npm run check-data reports it
    path.push(next);
    waiting.delete(next);
    for (const pre of waiting.values()) pre.delete(next);
  }
  // Anything stuck in a loop still appears, at the end.
  return [...path, ...waiting.keys()];
}

export const PATH = learningPath();

/** Concepts in a concern, in learning-path order. */
export const conceptsIn = (concernId) => PATH.filter((id) => NODE_BY_ID[id].concern === concernId);

/** "Know these first". */
export const prereqs = (id) => prereqsOf(NODE_BY_ID[id]);

/** Concepts that list this one as a prerequisite. */
export const leadsTo = (id) => PATH.filter((other) => prereqs(other).includes(id));

/** "Don't confuse with": [{ id, note }]. */
export const confusedWith = (id) =>
  CONFUSIONS.filter((c) => c.a === id || c.b === id).map((c) => ({ id: c.a === id ? c.b : c.a, note: c.note }));

/** Other labelled connections, not already a prerequisite, a "leads to" or a confusion. */
export function relatedTo(id) {
  const taken = new Set([id, ...prereqs(id), ...leadsTo(id), ...confusedWith(id).map((c) => c.id)]);
  const related = [];
  for (const e of EDGES) {
    const other = e.from === id ? e.to : e.to === id ? e.from : null;
    if (!other || taken.has(other) || !NODE_BY_ID[other]) continue;
    taken.add(other);
    related.push({ id: other, sentence: `${NODE_BY_ID[e.from].title} ${e.label} ${NODE_BY_ID[e.to].title}` });
  }
  return related;
}
