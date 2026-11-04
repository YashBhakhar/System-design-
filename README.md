# Concept Map: System Design

Learn system design **one concept at a time**, in plain words, with a **real-world example** for every idea. It's made for first-year students and anyone who keeps forgetting what "redundancy" or "sharding" meant halfway through learning something else.

**Live site:** https://yashbhakhar.github.io/System-design-/

## Four ways to use it

| Mode | For | What you get |
| --- | --- | --- |
| **Learn** | Starting from zero | A step-by-step path where every concept comes after what it needs. Mark concepts "I understand this" to track progress. |
| **Browse** | Finding a topic | Concepts grouped by the problem they deal with: *Handling traffic, Storing data, Making it fast, …* |
| **Explore** | Seeing connections | A small map around one concept: what to know first, what it leads to, related ideas, and what **not** to confuse it with. |
| **Ask AI** | Your own question | Ask anything about system design, like "How does Netflix stay available?". Each answer says where it came from: **From Concept Map**, **Concept Map + AI**, or **AI-generated** (may be wrong), with links to the concepts it used. Pick Quick, Normal or Deep. |

Search works everywhere (press `/`). Progress and Ask AI chats are saved in your browser; there are no accounts.

Ask AI sends your question, plus the matching concepts from this site, to a free AI service (Groq, or Google Gemini as a backup). On free plans these services may use what you send to improve their products, so don't type personal information.

## Run it locally

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173). Link straight to a concept: `/#/learn/redundancy`.

### Ask AI setup

Everything else works without this. The AI keys live in a small [Cloudflare Worker](worker/) (free plan), never in the website.

1. **Point the site at a Worker.** Create `.env.local` (ignored by git) with one line:

   ```bash
   VITE_AI_URL=https://concept-map-ai.yash-dotsqares5251.workers.dev
   ```

   Use `http://localhost:8787` instead to run your own Worker (step 2). Without this file, the Ask tab says the AI is off.

2. **Run your own Worker** (optional). Get free keys from [Groq](https://console.groq.com) and [Google AI Studio](https://aistudio.google.com), then:

   ```bash
   cd worker
   npm install
   cp .dev.vars.example .dev.vars   # paste your keys into .dev.vars (ignored by git)
   npm run dev                      # http://localhost:8787
   ```

   With `DEV_MODE=1` in `.dev.vars`, open http://localhost:8787/check to see whether the model names in `worker/src/config.js` exist.

3. **Deploy the Worker** (maintainers):

   ```bash
   cd worker
   npx wrangler login
   npm run deploy
   npx wrangler secret put GROQ_API_KEY
   npx wrangler secret put GEMINI_API_KEY
   ```

   The Worker only answers requests from the origins in `ALLOWED_ORIGINS` (`worker/wrangler.toml`) and limits each visitor to 6 questions a minute.

4. **Connect the live site:** in the GitHub repo, *Settings → Secrets and variables → Actions → Variables*, add `VITE_AI_URL` with the Worker's URL. The next deploy picks it up.

`npm run check-ai` tests the Ask AI logic, in the site and in the Worker, without any keys or network. `npm run check-ai -- "your question"` shows which concepts a question matches.

## What's covered

| Topic | Concepts | Built from |
| --- | --- | --- |
| Scalability | 33 | [CS75 Scalability lecture](https://www.youtube.com/watch?v=-W9F__D3oY4), [Scalability for Dummies](https://web.archive.org/web/20221030091841/http://www.lecloud.net/tagged/scalability/chrono) |
| Performance vs scalability | 5 | [A Word on Scalability](https://www.allthingsdistributed.com/2006/03/a_word_on_scalability.html) (Werner Vogels), [Scalability, Availability & Stability Patterns](https://www.slideshare.net/slideshow/scalability-availability-stability-patterns/4062682) (Jonas Bonér) |

Coming next: correctness & consistency (CAP theorem, ACID, consistency models).

## Contributing

Corrections, clearer examples and new concepts are very welcome, and you don't need to code to report a confusing explanation. See [CONTRIBUTING.md](CONTRIBUTING.md) for the concept format and the writing style guide.

## Tech

React 18 + Vite, plain CSS. The only server code is the Ask AI proxy in [worker/](worker/), a Cloudflare Worker that holds the AI keys. The plan behind it is in [docs/ai-tab-plan.md](docs/ai-tab-plan.md).

## License

- **Code:** [MIT](LICENSE)
- **Learning content** (everything in `src/data/topics/`): [CC BY-SA 4.0](LICENSE-CONTENT). You may reuse and adapt it with credit to this project, and must share changes under the same license.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before taking part. To report a security problem, see [SECURITY.md](SECURITY.md). Changes are listed in [CHANGELOG.md](CHANGELOG.md).
