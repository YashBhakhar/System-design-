/*
 * Sends a question to the Ask AI Worker and works out where the answer came from.
 *
 *   ask({ question, level, history }) →
 *     { answer, origin, conceptIds, provider, model }   or   { error: CODE }
 *
 * origin: "map"   from our concepts only
 *         "mixed" our concepts + general AI knowledge
 *         "ai"    general AI knowledge only (may be wrong)
 */
import { NODE_BY_ID } from "../data/index.js";
import { retrieve, toContext } from "./retrieve.js";
import { ASK_LEVELS, DEFAULT_LEVEL } from "./levels.js";

// Set at build time (.env.local, or the VITE_AI_URL repo variable). `?.` keeps plain Node working for check-ai.
export const AI_URL = import.meta.env?.VITE_AI_URL ?? "";

// Same limit as the Worker (worker/src/config.js).
export const MAX_QUESTION = 500;

// The Worker may try three models in turn, the slowest up to 35 s.
const TIMEOUT_MS = 80_000;

// How many earlier messages go with a question, so "and why?" makes sense.
const HISTORY_MESSAGES = 4;

/** Where an answer came from. Only ids of real concepts count. */
export function originOf(usedConceptIds, usedGeneralKnowledge) {
  const conceptIds = [...new Set((usedConceptIds ?? []).filter((id) => NODE_BY_ID[id]))];
  const origin = !conceptIds.length ? "ai" : usedGeneralKnowledge ? "mixed" : "map";
  return { origin, conceptIds };
}

/** The last few messages of a chat, as the Worker expects them. Failed answers are left out. */
export function historyFor(messages) {
  return (messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.text && !m.error)
    .slice(-HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, text: m.text }));
}

/**
 * Ask the AI. Never throws: failures come back as { error: CODE }.
 * Pass `signal` to cancel; a cancelled question returns { error: "CANCELLED" }.
 */
export async function ask({ question, level = DEFAULT_LEVEL, messages = [], signal, url = AI_URL }) {
  const q = String(question ?? "").trim();
  if (!q) return { error: "BAD_REQUEST" };
  if (q.length > MAX_QUESTION) return { error: "TOO_LONG" };
  if (!url) return { error: "NOT_CONFIGURED" };

  const levelName = ASK_LEVELS[level] ? level : DEFAULT_LEVEL;
  const found = retrieve(q, levelName);
  const context = toContext(found.map((c) => c.id), ASK_LEVELS[levelName].contextChars);

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: q, level: levelName, context, history: historyFor(messages) }),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout
    });
  } catch {
    if (signal?.aborted) return { error: "CANCELLED" };
    // Timed out → the AI side is slow; anything else → the student's connection.
    return { error: timeout.aborted ? "UPSTREAM" : "NETWORK" };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { error: "UPSTREAM" };
  }
  if (data.error) return { error: data.error };
  if (!res.ok || typeof data.answer !== "string") return { error: "UPSTREAM" };

  return {
    answer: data.answer,
    ...originOf(data.usedConceptIds, data.usedGeneralKnowledge),
    provider: data.provider,
    model: data.model
  };
}
