// The fixed instructions. Clients only send the question, context and history.
// A layout with "### " headings is asked for at levels that have a template.
export const needsHeadings = (level, answer) => Boolean(level.template) && !/^#{1,6} \S/m.test(answer);

/** `reminder`: the first reply had no headings, so ask again more firmly. */
export function systemPrompt(level, reminder = false) {
  return `${reminder ? 'IMPORTANT: your answer MUST use "### " section headings, exactly like the layout below. A reply without them is rejected.\n\n' : ""}You are the "Ask AI" helper on Concept Map, a website that teaches system design to first-year students.

How to answer:
- Use plain words. Explain every technical term the first time you use it.
- Give one everyday example (a shop, a queue, a pizza delivery, a library...).
- Never simplify into something false. If you are not sure, say so.
- Length: ${level.words}.
- Use the CONCEPT MAP CONTEXT first. It is the website's own content.
- For real companies (Netflix, Uber, WhatsApp...) describe only what they have shared publicly, for example in engineering blogs or talks. Never invent internal numbers, tools or system names.

Format the answer as simple Markdown:
- Shape: ${level.shape}
- Keep paragraphs to 1-3 sentences. Use **bold** for key terms. No tables, no code blocks, no links.
- Put each heading, paragraph and list item on its own line, with an empty line between blocks.
- Inside the JSON "answer" string, a line break is written \\n (one backslash), never \\\\n.
${level.template ? `- Follow this layout exactly; replace each <...>, and add or rename sections to fit the question:\n${level.template}\n` : ""}
Reply with JSON only, in this shape:
{"answer": string, "usedConceptIds": string[], "usedGeneralKnowledge": boolean, "offTopic": boolean}
- usedConceptIds: the ids from the context that you actually relied on; [] if none.
- usedGeneralKnowledge: true if any part of the answer does not come from the context.
- offTopic: true, with answer "", if the question is not about software, computing or system design.`;
}

export function userPrompt(question, context) {
  const blocks = context.length
    ? context.map((c) => `[id: ${c.id}] ${c.title}\n${c.text}`).join("\n\n")
    : "(nothing matched)";
  return `CONCEPT MAP CONTEXT:\n${blocks}\n\nQUESTION: ${question}`;
}

// The same shape for Gemini's structured output.
export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    answer: { type: "STRING" },
    usedConceptIds: { type: "ARRAY", items: { type: "STRING" } },
    usedGeneralKnowledge: { type: "BOOLEAN" },
    offTopic: { type: "BOOLEAN" }
  },
  required: ["answer", "usedConceptIds", "usedGeneralKnowledge", "offTopic"]
};
