// Checks the concept data for mistakes. Run: npm run check-data
import { NODES, NODE_BY_ID, EDGES, CONFUSIONS, CONCERN_BY_ID, KINDS, LEVELS, PATH, prereqs } from "../src/data/index.js";

const errors = [];
const warnings = [];
const ids = new Set();

for (const n of NODES) {
  const where = `concept "${n.id}"`;
  if (ids.has(n.id)) errors.push(`${where}: duplicate id`);
  ids.add(n.id);
  if (!/^[a-z0-9-]+$/.test(n.id)) errors.push(`${where}: id must be kebab-case`);
  for (const field of ["title", "short", "what", "example"]) {
    if (!n[field]) errors.push(`${where}: missing "${field}"`);
  }
  if (!CONCERN_BY_ID[n.concern]) errors.push(`${where}: unknown concern "${n.concern}" (see src/data/concerns.js)`);
  else if (CONCERN_BY_ID[n.concern].comingSoon) errors.push(`${where}: concern "${n.concern}" is marked comingSoon; remove that first`);
  if (!KINDS[n.kind]) errors.push(`${where}: unknown kind "${n.kind}" (use ${Object.keys(KINDS).join(", ")})`);
  if (!LEVELS[n.level]) errors.push(`${where}: level must be 1, 2 or 3`);
  for (const p of n.prereqs ?? []) if (!NODE_BY_ID[p]) errors.push(`${where}: unknown prerequisite "${p}"`);
  if (!n.remember) warnings.push(`${where}: no "remember" line`);
  if (!n.sources?.length) warnings.push(`${where}: no "Learn more" sources`);
}

// Prerequisites must not loop (A needs B, B needs A).
const position = new Map(PATH.map((id, i) => [id, i]));
for (const n of NODES) {
  for (const p of prereqs(n.id)) {
    if (position.get(p) > position.get(n.id)) errors.push(`concept "${n.id}": prerequisite loop involving "${p}"`);
  }
}

const linked = new Set(NODES.filter((n) => n.prereqs?.length).flatMap((n) => [n.id, ...n.prereqs]));
for (const e of EDGES) {
  const where = `edge "${e.from} -> ${e.to}"`;
  if (!ids.has(e.from)) errors.push(`${where}: unknown "from" id`);
  if (!ids.has(e.to)) errors.push(`${where}: unknown "to" id`);
  if (!e.label) errors.push(`${where}: missing label`);
  linked.add(e.from);
  linked.add(e.to);
}

for (const c of CONFUSIONS) {
  const where = `confusion "${c.a} / ${c.b}"`;
  if (!ids.has(c.a) || !ids.has(c.b)) errors.push(`${where}: unknown id`);
  if (!c.note) errors.push(`${where}: missing note`);
}

for (const n of NODES) {
  if (!linked.has(n.id)) warnings.push(`concept "${n.id}": not connected to anything`);
}

warnings.forEach((w) => console.warn("warn ", w));
errors.forEach((e) => console.error("ERROR", e));
console.log(
  `\n${NODES.length} concepts, ${EDGES.length} connections, ${CONFUSIONS.length} confusions, ` +
    `${errors.length} errors, ${warnings.length} warnings`
);
process.exit(errors.length ? 1 : 0);
