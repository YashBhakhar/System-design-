/*
 * Depth levels, the browser's half: how many concepts to send.
 * The Worker owns the other half (answer length, model): worker/src/config.js.
 *
 *   k            best matches to send
 *   neighbours   extra concepts from the graph, around the best matches:
 *                "none", "prereqs" (of the top match) or "prereqs+related" (of the top 2)
 *   contextChars text budget for all concepts together
 */
export const ASK_LEVELS = {
  quick: { label: "Quick", hint: "Short answer", k: 2, neighbours: "none", contextChars: 3_000 },
  normal: { label: "Normal", hint: "Usual answer", k: 4, neighbours: "prereqs", contextChars: 7_000 },
  deep: { label: "Deep", hint: "Long answer, step by step", k: 6, neighbours: "prereqs+related", contextChars: 12_000 }
};

export const DEFAULT_LEVEL = "normal";

// The Worker accepts at most 8 concepts.
export const MAX_CONCEPTS = 8;
