/*
 * Turns an AI answer into blocks for AskView: headings, paragraphs and lists.
 * The AI is asked for "### " headings, short paragraphs, "- " points and
 * "1." steps (worker/src/prompt.js); this also copes with *italic* and
 * line breaks that arrive as the two characters \n.
 *
 *   toBlocks(text) → [{ type: "h" | "p" | "ul" | "ol", lines: [string] }]
 */
const LIST_ITEM = /^(?:[-*•]|(\d+)[.)])\s+(.*)$/;
// "### Title", or a line (or "- " point) that is only bold: "**Title**", "**Title:**".
// Models use all three as titles.
const HEADING = /^(?:#{1,6}\s+(.*)|(?:[-*•]\s+)?\*\*([^*]{1,60}?):?\*\*:?)$/;

/** Real line breaks for ones the AI escaped twice ("\\n" in its JSON). */
export const fixLineBreaks = (text) => String(text ?? "").replace(/\\r\\n|\\n/g, "\n");

export function toBlocks(text) {
  const blocks = [];
  let open = null;
  for (const raw of fixLineBreaks(text).split("\n")) {
    // *italic* loses its stars (Rich only does **bold**).
    const line = raw.trim().replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?![*\w])/g, "$1$2");
    if (!line) {
      open = null;
      continue;
    }
    const heading = line.match(HEADING);
    // A bold "- " point is a title only if it has 2+ words ("- **Redis**" stays a point).
    const bulletTitle = heading && heading[2] !== undefined && /^[-*•]\s/.test(line);
    if (heading && !(bulletTitle && !/\S\s+\S/.test(heading[2]))) {
      // "### **Title**" → "Title": a heading is bold already.
      blocks.push({ type: "h", lines: [(heading[1] ?? heading[2]).replace(/^\*\*(.*)\*\*:?$/, "$1")] });
      open = null;
      continue;
    }
    const item = line.match(LIST_ITEM);
    const type = item ? (item[1] ? "ol" : "ul") : "p";
    if (!open || open.type !== type) blocks.push((open = { type, lines: [] }));
    open.lines.push(item ? item[2] : line);
  }
  return blocks;
}
