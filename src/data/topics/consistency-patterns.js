/*
 * Topic: Consistency patterns
 * Learned from:
 *   - System Design Primer, the Consistency patterns section
 *   - "Transactions Across Datacenters" (Ryan Barrett, Google I/O 2009)
 *
 * `sources` = the "Learn more" links: the best beginner-friendly page per concept.
 */

const link = (label, url) => ({ label, url });

const PRIMER = (anchor, title) =>
  link(`System Design Primer: ${title}`, `https://github.com/donnemartin/system-design-primer#${anchor}`);
const BARRETT = link(
  "Ryan Barrett: Transactions Across Datacenters (talk notes)",
  "https://snarfed.org/transactions_across_datacenters_io.html"
);

const nodes = [
  {
    id: "weak-consistency",
    title: "Weak Consistency",
    aliases: ["best effort", "weak", "consistency patterns", "memcached", "voip", "real time"],
    level: 2,
    concern: "consistency",
    kind: "technique",
    prereqs: ["cap-consistency"],
    short: "After a write, reads may or may not see it. Best effort, no promise.",
    what: [
      "With **weak consistency**, the system makes **no promise** that a read will see the latest write. It tries its best, and sometimes the data is simply missed or lost.",
      "It sounds bad, but for some uses, old data is worthless anyway, so there's no point waiting for it."
    ],
    example:
      "You're on a phone call and lose signal for three seconds. When the line comes back, you hear what's being said **now**. You don't get a replay of the three seconds you missed, and you wouldn't want one: the conversation has moved on.",
    why: "For live things like voice calls, video chat and online multiplayer games, **now** matters more than **complete**. Waiting to recover missed data would add delay and make the experience worse.",
    details: [
      "Seen in **memcached** (a cache kept in memory): a value may vanish or be out of date, and the app must cope.",
      "Good for real-time uses: calls, live video, game positions."
    ],
    pros: ["Fastest: nothing waits for other copies", "Keeps live experiences smooth"],
    cons: ["Reads can miss writes completely", "Only suitable when lost or old data doesn't matter"],
    remember: "Weak = best effort. What you miss, you miss.",
    sources: [PRIMER("weak-consistency", "Weak consistency"), BARRETT]
  },
  {
    id: "eventual-consistency",
    title: "Eventual Consistency",
    aliases: ["eventual", "eventually consistent", "asynchronous replication", "async replication", "dns", "email"],
    level: 2,
    concern: "consistency",
    kind: "technique",
    prereqs: ["cap-consistency", "replication"],
    short: "After a write, reads will see it eventually, usually very soon, but not instantly.",
    what: [
      "With **eventual consistency**, a write is saved on one copy first and then sent to the other copies **in the background**. This is called **asynchronous replication**: the writer doesn't wait for the other copies to catch up.",
      "For a short time, some copies have the new value and some still have the old one. If no new writes come in, all copies **eventually** agree. Often that's within milliseconds, but there's no fixed deadline."
    ],
    example:
      "You change your profile photo. Your friend in the same city sees the new one straight away; a friend abroad still sees the old one for a few seconds. A moment later, everyone sees the new photo.",
    why: "It lets a system stay fast and keep answering even when some copies are far away or briefly unreachable. That's why it's the usual choice for **highly available** (AP) systems.",
    details: [
      "Seen in **DNS** (the internet's address book): a changed website address can take a while to reach every DNS server in the world.",
      "Seen in **email**: a message can take a few seconds or minutes to reach every device.",
      "Your app must cope with reading old data for a short time."
    ],
    pros: ["Writes are fast: no waiting for every copy", "Keeps working when some copies are unreachable"],
    cons: ["Reads can be out of date for a while", "Two copies changed at once can conflict, and must be merged later"],
    remember: "Eventual = everyone agrees soon, not instantly.",
    sources: [PRIMER("eventual-consistency", "Eventual consistency"), link("Wikipedia: Eventual consistency", "https://en.wikipedia.org/wiki/Eventual_consistency")]
  },
  {
    id: "strong-consistency",
    title: "Strong Consistency",
    aliases: ["strong", "strongly consistent", "synchronous replication", "sync replication", "transactions"],
    level: 2,
    concern: "consistency",
    kind: "technique",
    prereqs: ["cap-consistency", "replication"],
    short: "After a write, every read sees it. No old data, ever.",
    what: [
      "With **strong consistency**, once a write succeeds, **every** read after it sees the new value, whichever copy answers. This is exactly the consistency guarantee from the CAP theorem.",
      "It is usually done with **synchronous replication**: a write is confirmed only after the copies that matter have saved it."
    ],
    example:
      "You and your sister share a bank account. You withdraw ₹2,000 at an ATM. A second later she checks the balance on her phone, and it already shows ₹2,000 less. It never shows the old balance.",
    why: "Some data must never be out of date: money, seat bookings, stock counts. Anything that uses **transactions** (a group of changes that must all happen together, or not at all) needs every reader to see the same truth.",
    details: [
      "Seen in **file systems** and **relational databases** (SQL databases such as MySQL and PostgreSQL).",
      "Writes are slower, because they wait for other copies to confirm.",
      "During a network partition, a strongly consistent system has to refuse or delay some requests. That's the **CP** choice."
    ],
    pros: ["Everyone always sees the same, latest data", "Much simpler to reason about"],
    cons: ["Slower writes: they wait for other copies", "Less available: may refuse requests when copies can't talk"],
    remember: "Strong = once written, everyone sees it.",
    sources: [PRIMER("strong-consistency", "Strong consistency"), BARRETT]
  }
];

// Pairs that look alike but mean different things (shown as "Don't confuse with").
const confusions = [
  {
    a: "weak-consistency",
    b: "eventual-consistency",
    note: "**Weak**: a read may **never** see a write; it can be lost. **Eventual**: a read **will** see the write, just not straight away."
  },
  {
    a: "eventual-consistency",
    b: "strong-consistency",
    note: "**Eventual**: copies sync in the background (asynchronous), so reads can be briefly out of date. **Strong**: a write waits for the copies (synchronous), so reads are never out of date."
  },
  {
    a: "strong-consistency",
    b: "cap-consistency",
    note: "Same guarantee, seen from two sides. **Consistency (in CAP)** is the promise: every read gets the latest write. **Strong consistency** is the pattern that delivers it, usually with synchronous replication."
  }
];

// Related concepts. Read each edge as: "<from> <label> <to>"
const edges = [
  { from: "ap-system", to: "eventual-consistency", label: "usually gives" },
  { from: "cp-system", to: "strong-consistency", label: "gives" },
  { from: "weak-consistency", to: "latency", label: "keeps down the" },
  { from: "strong-consistency", to: "latency", label: "adds to the write" },
  { from: "object-caching", to: "weak-consistency", label: "often means" }
];

export default { nodes, edges, confusions };
