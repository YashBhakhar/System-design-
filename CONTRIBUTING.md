# Contributing to Concept Map

Thanks for helping! This project explains system design **one concept at a time, in plain words, with a real-world example for everything**. It's written for first-year students and anyone new to the topic.

You don't need to write code to help.

## Ways to help

| You want to… | Do this |
| --- | --- |
| Report a confusing or wrong explanation | [Open an issue](../../issues/new/choose) → "Explanation is wrong or unclear" |
| Suggest a new concept or topic | [Open an issue](../../issues/new/choose) → "Suggest a new concept or topic" |
| Report a bug in the site | [Open an issue](../../issues/new/choose) → "Bug report" |
| Fix or write a concept yourself | Follow the steps below and open a pull request |

## Set up

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
npm run dev          # opens the site at http://localhost:5173
npm run check-data   # checks the concept data for mistakes
npm run build        # makes sure the site still builds
```

## Where the content lives

```
src/data/
  concerns.js          the concern cards (Foundations, Storing data, …), kinds and depth levels
  index.js             loads every topic file and works out the learning path
  topics/
    scalability.js     one file per topic: concepts, related links, "don't confuse" pairs
```

- **Editing a concept?** Find it in `src/data/topics/` by its `id` and change the text.
- **New concept for an existing topic?** Add it to that topic's `nodes` list.
- **New topic?** Copy `topics/scalability.js` as a starting point, then import it in `src/data/index.js` and add it to `TOPICS`.

## A concept, field by field

```js
{
  id: "load-balancer",              // unique, lower-case-with-dashes; used in links (#/learn/load-balancer)
  title: "Load Balancer",
  aliases: ["lb", "haproxy"],       // other words people search for (optional)
  level: 1,                         // depth: 1 = big picture, 2 = core idea, 3 = detail
  concern: "traffic",               // which Browse card it belongs to (see concerns.js)
  kind: "technique",                // idea | principle | problem | technique | tool
  prereqs: ["horizontal-scaling"],  // "Know these first" (optional, but please think about it)
  short: "One line: what it is.",
  what: "What is it?",              // a string, or an array of paragraphs
  example: "Real-world example",    // a string, or an array of paragraphs (required!)
  why: "Why does it matter?",       // optional
  details: ["How it works", "…"],   // optional bullet list
  pros: ["…"],                      // optional: shown as "Good"
  cons: ["…"],                      // optional: shown as "Watch out"
  remember: "One line to revise from.",
  sources: [link("Site: Page title", "https://…")] // "Learn more" links
}
```

Text can use `**bold**`. Nothing else is formatted.

### Prerequisites decide the learning path

There is no hand-written order. The **Learn** path is worked out from `prereqs`: every concept comes after the concepts it needs. When several concepts are ready, earlier concerns come first, then bigger-picture concepts (lower `level`) before details. List only what a learner *really* needs to understand first, usually 1 to 3 concepts. A prerequisite may live in another topic file.

### Kinds

| kind | Use it for | Example |
| --- | --- | --- |
| `idea` | A basic thing to understand | Server, Database |
| `principle` | A rule of thumb | Stateless servers, Normalization |
| `problem` | Something to avoid | Single point of failure |
| `technique` | A way to solve a problem | Load balancer, Sharding |
| `tool` | A real product or piece of hardware | Redis, RabbitMQ |

### Other connections

At the bottom of a topic file:

- **`edges`**: other links between concepts, shown as "Related". Each one reads as a sentence: `{ from: "cache", to: "database", label: "reduces load on the" }` → "Cache reduces load on the Database".
- **`confusions`**: pairs that look alike but mean different things, shown as "Don't confuse with" on both concepts:
  `{ a: "replication", b: "sharding", note: "**Replication** copies the same data… **Sharding** splits…" }`

## Writing style (please read)

The whole project depends on this. A reviewer will check it.

1. **Write for a first-year student.** If a word needs explaining, explain it or link its concept. No unexplained jargon or acronyms.
2. **Every concept needs a real-world example from everyday life**: college, shops, food, phones, buses, banks. It should be something anyone in any country can picture, not another technical system.
3. **Short sentences. One idea per sentence.**
4. **`short` is one line** and makes sense on its own (it appears in search results and cards).
5. **`remember` is the one line someone would write on a flashcard.**
6. **Be correct.** Simple is good; wrong is not. If you simplify, don't simplify into something false.
7. **Say why.** Every concept should answer "why does this exist?", not only "what is it?".

## "Learn more" links

- Prefer beginner-friendly, free pages: MDN, official docs, Cloudflare's Learning Center, the System Design Primer, Wikipedia where it's clear.
- No paywalls, no sign-up walls, no affiliate links.
- 1 to 3 links per concept. Label them `"Site: Page title"`.
- Open every link before you add it.

## Before you open a pull request

- [ ] `npm run check-data` shows **0 errors**
- [ ] `npm run build` succeeds
- [ ] You opened the site and read your concept in Learn, Browse and Explore
- [ ] Every new concept has a real-world example and a `remember` line

A check runs these automatically on every pull request too.

## Licence of contributions

By contributing you agree that your **code** is shared under the [MIT licence](LICENSE) and your **written content** (anything in `src/data/topics/`) under [CC BY-SA 4.0](LICENSE-CONTENT).

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).
