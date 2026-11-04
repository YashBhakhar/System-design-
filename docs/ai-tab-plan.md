# Plan: "Ask" tab (AI answers about system design)

## Goal

A fourth mode, **Ask**, next to Learn / Browse / Explore. A student types a question such as "What is CAP?" or "How does Netflix stay available?" and gets an answer that says where it came from:

- **From Concept Map**: built from our own concepts, with links to them.
- **Concept Map + AI**: our concepts, plus general AI knowledge.
- **AI-generated**: nothing in our data matched, so the answer may be wrong.

It must cost nothing: Groq free tier first, Gemini free tier as fallback, and a Cloudflare Worker (free plan) to hide the API keys.

> **Changed during T-01 (Nov 2026):** the plan started Gemini-first. When we measured it, Gemini 3.5's free tier took 20–30 s per answer and often replied "high demand", while Groq's `gpt-oss-120b` answered in ~2 s with valid JSON. So the order is now Groq → Groq → Gemini. It's one list (`PROVIDERS` in `worker/src/config.js`), so it's easy to flip back.

## How it works

```
Browser (GitHub Pages)                       Cloudflare Worker (free)            AI
─────────────────────                        ────────────────────────            ──
1. Student asks a question, picks a level
2. retrieve.js scores our concepts locally
   → top K concepts (+ graph neighbours)
3. POST { question, level, context, history } ──► 4. Check origin, size, rate limit
                                                  5. Build prompt (fixed system prompt)
                                                  6. Try PROVIDERS in order ─────────► Groq gpt-oss-120b
                                                     on any failure → next ─────────► Groq gpt-oss-20b
                                                                                 ───► Gemini 3.5 Flash
                                                  7. Return { answer, usedConceptIds,
                                                     usedGeneralKnowledge } or { error }
8. Check the ids against NODE_BY_ID
9. Show the answer + origin badge
10. Save the chat in localStorage (storage.js)
```

Key decisions:

- **Keys live only in the Worker** (`wrangler secret`). Nothing secret is in the React bundle.
- **Retrieval runs in the browser.** The data is already loaded and there are only about 55 concepts, so it's instant and costs no API calls. Only the matching concepts are sent, not the whole dataset.
- **Code decides the origin badge, not the AI.** The model returns the ids it used, and the client keeps only ids that really exist.
- **No login.** Chats go in `localStorage` through `storage.js`, so they survive a refresh but not "clear browsing data".
- **No streaming in v1.** We need a JSON reply to get the ids, and a loading message is fine for answers of this length.

## Depth levels

Shown as three buttons: Quick / Normal / Deep. Students don't see temperature or top-K. Temperature is fixed at 0.3.

| Level  | Concepts sent (K) | Graph neighbours added        | Answer length (prompt) | Token ceiling | gpt-oss reasoning | Gemini fallback |
|--------|-------------------|-------------------------------|------------------------|---------------|-------------------|-----------------|
| Quick  | 2                 | none                          | ~100 words             | 1024          | low               | Flash-Lite      |
| Normal | 4                 | prereqs of the top match      | ~250 words             | 2048          | low               | Flash           |
| Deep   | 6                 | prereqs + `relatedTo` of top 2| ~500 words, step by step | 4096        | medium            | Flash           |

Length is set in the prompt. The token ceiling is only a safety net, kept high because "thinking" tokens count towards it, and a low ceiling cuts the JSON off half-way.

The Worker owns this table (`LEVELS` in `worker/src/config.js`), so a client can't ask for 50k tokens. The client owns K and the neighbours (`src/ai/levels.js`).

## Fun messages (instead of dry errors)

The Worker returns an error `code`, and `src/ai/messages.js` turns it into a message. Pick one message at random from each list.

| Code             | When                                       | Example message |
|------------------|--------------------------------------------|-----------------|
| `QUOTA`          | Every provider said its daily quota is used up | "Some moron used up all the free AI today 🤡 Come back tomorrow." / "Some idiot ate all our free tokens 🍪 Try again tomorrow." |
| `SLOW_DOWN`      | Our per-IP limit, or a provider's per-minute limit | "Slow down, genius 🐢 Wait one minute and ask again." / "Too fast, dummy 🏎️ Wait a minute." |
| `TOO_LONG`       | Question longer than 500 characters        | "Bro, this is a book, not a question 📚 Keep it short." |
| `OFF_TOPIC`      | The model flagged the question as not about software or system design | "Nice try, clown 🤡 I only answer system design questions." |
| `NETWORK`        | `fetch` failed or the user is offline      | "Your internet is dead, buddy 💀 Check your Wi-Fi and try again." |
| `UPSTREAM`       | Any other provider or Worker failure       | "The AI broke. Not your fault this time 🤕 Try again." |
| `NOT_CONFIGURED` | Site built without `VITE_AI_URL`           | "The AI is sleeping 😴 Someone forgot to turn it on." |

Keep every message short and in simple English: one joke word, one emoji, and one clear next step (wait, try again, check Wi-Fi). Mix the words (moron, idiot, genius, dummy, clown, buddy) so the same one doesn't repeat every time.

Free daily quotas reset once a day (Gemini's at midnight Pacific time), so `QUOTA` can say "come back tomorrow".

## Tasks

### T-01 Worker: proxy, rate limit, fallback
New folder `worker/` (its own `package.json`, plain JS):

- `worker/wrangler.toml`: name `concept-map-ai`, a `[vars]` entry `ALLOWED_ORIGINS` = `https://yashbhakhar.github.io,http://localhost:5173` (an origin has no path, so `/System-design-/` is left off), and a Rate Limiting binding (`[[ratelimits]]`, `name = "LIMITER"`, e.g. 6 requests per 60 s per IP). Check the binding is on the free plan when setting it up. If it isn't, use a per-isolate `Map` (best-effort). **Don't** write to KV on every request: KV's free plan allows only 1,000 writes a day.
- `worker/src/config.js`: `PROVIDERS` (the order to try: `openai/gpt-oss-120b`, `openai/gpt-oss-20b` on Groq, then `gemini-3.5-flash` / `-flash-lite`), the `LEVELS` table, and the size limits (question ≤ 500 chars, context ≤ 12k chars, history ≤ 4 turns). `llama-3.3-70b-versatile` was the first Groq pick, but it's no longer on Groq. Check names with `GET /check` after any change.
- `worker/src/prompt.js`: the fixed system prompt:
  - Explain for a first-year student, in plain words, with an everyday example.
  - Use the provided Concept Map context first. List in `usedConceptIds` only the ids you actually used.
  - Set `usedGeneralKnowledge: true` if anything came from outside the context. For named companies (Netflix, Uber, …), say what is publicly known and don't invent internal details.
  - If the question isn't about software or system design, return `offTopic: true`.
  - Reply as JSON: `{ answer, usedConceptIds, usedGeneralKnowledge, offTopic }`.
- `worker/src/providers.js`:
  - `callProvider(env, provider, ask)` picks one of these:
    - Groq → `POST https://api.groq.com/openai/v1/chat/completions` with `response_format: { type: "json_object" }` and `reasoning_effort` (gpt-oss only).
    - Gemini → `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with header `x-goog-api-key`, `responseMimeType: "application/json"` + `responseSchema`.
  - Both return the parsed object or throw `{ code }`: 429 per-minute → `SLOW_DOWN`, 429 daily → `QUOTA`, anything else → `UPSTREAM`.
- `worker/src/index.js`: handles CORS (`OPTIONS`, and only the allowed origins), then the method, size and rate-limit checks, then tries `PROVIDERS` in order (`QUOTA` only if **every** one is used up), then returns JSON.
- Secrets: `npx wrangler secret put GEMINI_API_KEY` and `GROQ_API_KEY`. Deploy with `npx wrangler deploy` (manual, not in CI for now).

### T-02 Retrieval (pure, testable)
`src/ai/retrieve.js`, with no React:

- `tokenize(text)`: lowercase, split on non-letters, drop stop words ("what", "is", "how", "the", …).
- `scoreConcept(node, tokens)`: weighted matches: title 6, alias 4, `short` 2, `remember` 2, `what` / `details` 1. A full-phrase match on a title or alias gets a bonus.
- `retrieve(question, level)`: scores every node in `NODES`, keeps those above `MIN_SCORE`, takes the top K, adds neighbours with the existing `prereqs()` / `relatedTo()` from `src/data/index.js`, and returns `[{ id, score }]`.
- `toContext(ids, maxChars)`: a compact text per concept (id, title, short, what, example, details, remember), with `**` removed and cut to the level's character budget.

Reuse the scoring style of `SearchBar.jsx`'s `search()`, but don't change that component.

### T-03 Client API + messages
- `src/ai/client.js`: `ask({ question, level, history })` → runs `retrieve`, then `fetch(import.meta.env.VITE_AI_URL, …)` with a 30 s timeout. It returns `{ answer, origin, conceptIds }`, or `{ error: code }`.
  - Origin rule: keep only `usedConceptIds` that exist in `NODE_BY_ID`. Then:
    - no valid ids → `"ai"`
    - valid ids and `usedGeneralKnowledge` → `"mixed"`
    - otherwise → `"map"`
- `src/ai/messages.js`: the fun message lists above, plus `funMessage(code)` and a few loading lines ("Thinking… don't rush me 🤔", "Wait, I'm reading my notes 📖").
- `src/ai/levels.js`: K and the neighbour rules per level.

### T-04 Chat storage
`src/ai/chats.js`, built on `storage.js` (so it never throws):

- Key `chats`: `[{ id, title, createdAt, messages: [{ role, text, origin, conceptIds, level }] }]`.
- Keep at most 20 chats and 30 messages per chat, dropping the oldest. The title is the first question, cut to 60 characters.
- `listChats`, `getChat`, `saveMessage`, `deleteChat`, `clearChats`.

### T-05 Ask view + routing
- `src/utils/route.js`: add `"ask"` to `MODES`. Routes are `#/ask` (new chat) and `#/ask/<chatId>`.
- `src/components/Header.jsx`: add `ask: "Ask AI"` to `LABELS`. When `mode === "ask"`, picking a search result must open Learn: use `hrefFor(mode === "ask" ? "learn" : mode, id)`.
- `src/App.jsx`: render `<AskView chatId={route.a} />` for `mode === "ask"`.
- `src/views/AskView.jsx`:
  - Chat list (side on desktop, a dropdown on phones), a "New chat" button and "Clear all".
  - Messages. The answer is rendered as paragraphs and `- ` bullets, with `Rich` for inline bold (no markdown library).
  - An origin badge on each answer, with concept chips linking to `#/learn/<id>`.
  - The Quick / Normal / Deep segmented control, remembered with `storage` key `ask-level`.
  - Input with Enter to send and Shift+Enter for a new line, disabled while waiting, and a 500-character counter.
  - Footer note: "Answers can be wrong. Don't type personal info."
  - Example questions on an empty chat: "What is CAP?", "Latency vs throughput?", "How does Netflix stay available?"
- `src/App.css`: styles that use the existing CSS variables, in both themes. Badge colours: map = accent, mixed = a softer accent, ai = warning. Any typing-dots animation stops under `prefers-reduced-motion`.

### T-06 Build config + docs
- `.github/workflows/deploy.yml`: in the Build step, `env: VITE_AI_URL: ${{ vars.VITE_AI_URL }}` (a repository variable, not a secret, because it's a public URL).
- `.env.example`: `VITE_AI_URL=http://localhost:8787` (the address of `wrangler dev`).
- `README.md`: an "Ask AI" section covering the Worker setup, the secrets and the variable.
- `CLAUDE.md`: list `src/ai/` and `worker/` under "Where things are".
- `CHANGELOG.md`: an entry.

### T-07 Checks (second-to-last)
There's no test framework, so add `scripts/check-ai.js` (`npm run check-ai`, plain Node like `check-data.js`):

- "what is latency" → `latency` in the top 2.
- "cap theorem" → `cap-theorem` in the top 2.
- "how does netflix recommend movies" → nothing above `MIN_SCORE` (so the answer is AI-generated).
- The origin rule (`map` / `mixed` / `ai`) with made-up ids filtered out.
- `chats.js` caps (21 chats → 20 kept).

Run `npm run check-data`, `npm run check-ai` and `npm run build`.

### T-08 Browser QA (last)
Run `npm run dev` and `cd worker && npx wrangler dev` (with `VITE_AI_URL=http://localhost:8787` in `.env`):

1. The **Ask AI** tab appears after Explore and opens `#/ask`.
2. "What is latency?" on Normal → **From Concept Map** badge, and the chip opens `#/learn/latency`.
3. "How does Netflix stay available?" → **AI-generated** or **Concept Map + AI** badge.
4. "Best biryani recipe?" → the off-topic fun message.
5. Send 7 questions within a minute → the speedrunner message.
6. Force `QUOTA` in the Worker → a "some moron / some idiot" message.
7. Stop `wrangler dev` → the "internet is dead" message.
8. Refresh → the chat is still there. "Clear all" → it's gone.
9. A private window with storage blocked → Ask still works and nothing crashes.
10. Both themes, a phone-width layout (no sideways scrolling), and reduced motion on.
11. **Regression:** Learn / Browse / Explore and the header search still work, and the search inside Ask opens Learn.

## Later (not in v1)

- Embeddings (Gemini embedding model, precomputed at build time) if keyword retrieval misses too often.
- Streaming answers.
- Move Gemini back to first place if its free tier gets faster (re-time it with the same test questions).
- Supabase only if students ask for history across devices.

## Setup status

- [x] Cloudflare account (free, `*.workers.dev` URL)
- [x] Gemini key (AI Studio) and Groq key (console.groq.com)
- [x] GitHub Pages origin: `https://yashbhakhar.github.io`
