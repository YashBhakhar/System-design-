# Concept Map: System Design

Learn system design **one concept at a time**, in plain words, with a **real-world example** for every idea. It's made for first-year students and anyone who keeps forgetting what "redundancy" or "sharding" meant halfway through learning something else.

## Three ways to use it

| Mode | For | What you get |
| --- | --- | --- |
| **Learn** | Starting from zero | A step-by-step path where every concept comes after what it needs. Mark concepts "I understand this" to track progress. |
| **Browse** | Finding a topic | Concepts grouped by the problem they deal with: *Handling traffic, Storing data, Making it fast, …* |
| **Explore** | Seeing connections | A small map around one concept: what to know first, what it leads to, related ideas, and what **not** to confuse it with. |

Search works everywhere (press `/`). Progress is saved in your browser; there are no accounts.

## Run it locally

```bash
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173). Link straight to a concept: `/#/learn/redundancy`.

## What's covered

| Topic | Concepts | Built from |
| --- | --- | --- |
| Scalability | 33 | [CS75 Scalability lecture](https://www.youtube.com/watch?v=-W9F__D3oY4), [Scalability for Dummies](https://web.archive.org/web/20221030091841/http://www.lecloud.net/tagged/scalability/chrono) |

Coming next: correctness & consistency (CAP theorem, ACID, consistency models).

## Contributing

Corrections, clearer examples and new concepts are very welcome, and you don't need to code to report a confusing explanation. See [CONTRIBUTING.md](CONTRIBUTING.md) for the concept format and the writing style guide.

## Tech

React 18 + Vite, plain CSS. No backend.

## License

- **Code:** [MIT](LICENSE)
- **Learning content** (everything in `src/data/topics/`): [CC BY-SA 4.0](LICENSE-CONTENT). You may reuse and adapt it with credit to this project, and must share changes under the same license.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before taking part. To report a security problem, see [SECURITY.md](SECURITY.md). Changes are listed in [CHANGELOG.md](CHANGELOG.md).
