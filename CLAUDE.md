# Concept Map: notes for AI assistants

A React + Vite site that teaches system design one concept at a time, for first-year students. It has four modes: **Learn** (an ordered path), **Browse** (concepts grouped by concern), **Explore** (a small map around one concept) and **Ask AI** (questions answered from our concepts, then general AI knowledge, with the source marked).

## Commands

- `npm run dev`: local site (Ask AI needs `VITE_AI_URL` in `.env.local`; see README)
- `npm run check-data`: validates concept data (must show 0 errors)
- `npm run check-ai`: tests the Ask AI logic, no keys or network (must show 0 errors); `-- "question"` shows what a question matches
- `npm run build`: production build
- `cd worker && npm run dev | check | deploy`: the Ask AI Worker locally, a dry-run bundle, or a deploy

Run `check-data`, `check-ai` and `build` after every change. Run `cd worker && npm run check` after changing `worker/`.

## Where things are

- `src/data/topics/*.js`: the content. One file per topic, exporting `{ nodes, edges, confusions }`.
- `src/data/concerns.js`: concerns (Browse cards), kinds, depth levels.
- `src/data/index.js`: loads topics; computes `PATH` (learning order from `prereqs`), `leadsTo`, `relatedTo`, `confusedWith`.
- `src/views/`: `LearnView`, `BrowseView`, `ExploreView` (+ `localMapLayout.js`, pure layout maths), `AskView`.
- `src/components/ConceptPage.jsx`: the concept page shared by Learn, Browse and Explore.
- `src/utils/route.js`: hash routes `#/learn/<id>`, `#/browse/<concern>/<id>`, `#/explore/<id>`, `#/ask/<chat>`.
- `src/ai/`: Ask AI logic, no React. `retrieve.js` (which concepts match a question), `levels.js` (Quick / Normal / Deep), `client.js` (calls the Worker, decides the origin badge), `chats.js` (saved chats), `messages.js` (fun error and loading messages).
- `worker/`: the Cloudflare Worker that holds the AI keys. `src/config.js` has the provider order, models, levels and limits; `src/prompt.js` the fixed instructions.
- `docs/ai-tab-plan.md`: the Ask AI design and why it is built this way.

## Writing content

Follow the field reference and style guide in [CONTRIBUTING.md](CONTRIBUTING.md). The rules that matter most:

- Plain words for a first-year student; explain or link every technical term.
- Every concept has a real-world `example` from everyday life, and a one-line `remember`.
- Accuracy over simplicity: never simplify into something false.
- `prereqs` drive the learning path. List only true prerequisites, and never create loops.
- "Learn more" `sources`: free, beginner-friendly pages, checked to load. Never invent URLs.

## Code conventions

- Plain JavaScript (no TypeScript), function components, no extra UI libraries.
- Styles live in `src/App.css` using the CSS variables at the top; support light and dark themes.
- Per-viewer state (progress, mode, theme, Ask AI chats and level) goes through `src/utils/storage.js`, which must never throw.
- Respect `prefers-reduced-motion`.

## Ask AI rules

- API keys live only in Worker secrets (`wrangler secret put`) or the git-ignored `worker/.dev.vars`. Never in the site, the repo or `VITE_*` variables (those end up in the public bundle).
- The origin badge is decided by code (`originOf` in `src/ai/client.js`), never by trusting the AI's word.
- Error messages are fun but simple English: one joke word, one emoji, one clear next step (`src/ai/messages.js`).
- After changing a model name in `worker/src/config.js`, check it with `GET /check` (local Worker with `DEV_MODE=1`).
