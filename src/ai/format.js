/*
 * Turns an AI answer into blocks for AskView: paragraphs and lists.
 * The AI is asked for short paragraphs and "- " lists (worker/src/prompt.js),
 * but this also copes with "1." lists, headings and *italic*.
 *
 *   toBlocks(text) → [{ type: "p" | "ul" | "ol", lines: [string] }]
 */
const LIST_ITEM = /^(?:[-*•]|(\d+)[.)])\s+(.*)$/;

export function toBlocks(text) {
  const blocks = [];
  let open = null;
  for (const raw of String(text ?? "").split("\n")) {
    // Headings become plain lines; *italic* loses its stars (Rich only does **bold**).
    const line = raw
      .trim()
      .replace(/^#{1,6}\s+/, "")
      .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?![*\w])/g, "$1$2");
    if (!line) {
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
