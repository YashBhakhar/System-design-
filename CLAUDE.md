# Concept Map: notes for AI assistants

A React + Vite site that teaches system design one concept at a time, for first-year students. It has three modes: **Learn** (an ordered path), **Browse** (concepts grouped by concern) and **Explore** (a small map around one concept).

## Commands

- `npm run dev`: local site
- `npm run check-data`: validates concept data (must show 0 errors)
- `npm run build`: production build

Run `check-data` and `build` after every change.

## Where things are

- `src/data/topics/*.js`: the content. One file per topic, exporting `{ nodes, edges, confusions }`.
- `src/data/concerns.js`: concerns (Browse cards), kinds, depth levels.
- `src/data/index.js`: loads topics; computes `PATH` (learning order from `prereqs`), `leadsTo`, `relatedTo`, `confusedWith`.
- `src/views/`: `LearnView`, `BrowseView`, `ExploreView` (+ `localMapLayout.js`, pure layout maths).
- `src/components/ConceptPage.jsx`: the concept page shared by all modes.
- `src/utils/route.js`: hash routes `#/learn/<id>`, `#/browse/<concern>/<id>`, `#/explore/<id>`.

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
- Per-viewer state (progress, mode, theme) goes through `src/utils/storage.js`, which must never throw.
- Respect `prefers-reduced-motion`.
