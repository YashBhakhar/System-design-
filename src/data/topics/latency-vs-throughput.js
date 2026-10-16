/*
 * Topic: Latency vs throughput
 * Learned from:
 *   - "Understanding latency vs throughput" (Cadence community blog)
 *   - System Design Primer, the Latency vs throughput section
 *
 * `sources` = the "Learn more" links: the best beginner-friendly page per concept.
 */

const link = (label, url) => ({ label, url });

const CADENCE = link(
  "Cadence Blog: Understanding latency vs throughput",
  "https://community.cadence.com/cadence_blogs_8/b/fv/posts/understanding-latency-vs-throughput"
);
const PRIMER = link(
  "System Design Primer: Latency vs throughput",
  "https://github.com/donnemartin/system-design-primer#latency-vs-throughput"
);

const nodes = [
  {
    id: "latency",
    title: "Latency",
    aliases: ["delay", "response time", "lag", "ping", "wait time", "latency vs throughput"],
    level: 1,
    concern: "foundations",
    kind: "idea",
    prereqs: ["performance"],
    short: "How long one request takes, from asking to getting the answer.",
    what: [
      "Latency is the **time one thing takes**: the gap between sending a request and getting the response back.",
      "It is measured in time: milliseconds or seconds. Lower latency means a faster answer."
    ],
    example:
      "You order a pizza at 8:00 and it arrives at 8:30. The **latency** is 30 minutes. It doesn't matter how many other pizzas the shop made tonight; this is how long **you** waited.",
    why: "People feel latency directly. A page that takes 5 seconds to open feels broken, even if the system can serve thousands of other users at the same moment.",
    details: [
      "Latency is about **one request**, so it is closely tied to performance.",
      "It comes from many small delays added together: travel across the network, waiting in line, the server's work, reading data.",
      "Lowering it usually means doing less work per request, or doing it closer to the user (for example with a cache)."
    ],
    remember: "Latency = how long one request takes.",
    sources: [PRIMER, CADENCE, link("Wikipedia: Latency (engineering)", "https://en.wikipedia.org/wiki/Latency_(engineering)")]
  },
  {
    id: "throughput",
    title: "Throughput",
    aliases: ["bandwidth", "capacity", "requests per second", "rps", "qps", "rate"],
    level: 1,
    concern: "foundations",
    kind: "idea",
    prereqs: ["performance"],
    short: "How many requests the system finishes in a given time.",
    what: [
      "Throughput is the **amount of work finished per unit of time**: requests per second, orders per hour, messages per minute.",
      "It describes the system as a whole, not any single request. Higher throughput means more work gets done."
    ],
    example:
      "A pizza shop with four ovens bakes 40 pizzas an hour. That is its **throughput**. Each pizza still takes 30 minutes to arrive (that's its latency), but the shop serves many customers at the same time.",
    why: "When many users arrive together, what matters is whether the system can keep up. If requests come in faster than the throughput, they pile up in a queue and everyone waits longer.",
    details: [
      "Measured as a count per time: for example, 500 requests per second.",
      "You can often raise throughput by doing more work **at the same time**: more servers, more ovens.",
      "Each extra server adds capacity, which links throughput to scaling."
    ],
    remember: "Throughput = how much work gets finished per second.",
    sources: [PRIMER, CADENCE, link("Wikipedia: Throughput", "https://en.wikipedia.org/wiki/Throughput")]
  },
  {
    id: "latency-throughput-tradeoff",
    title: "Latency vs Throughput Trade-off",
    aliases: ["batching", "latency throughput tradeoff", "acceptable latency", "maximal throughput"],
    level: 2,
    concern: "foundations",
    kind: "principle",
    prereqs: ["latency", "throughput"],
    short: "Aim for the highest throughput that still keeps latency acceptable.",
    what: [
      "Latency and throughput are **separate measures**, and improving one does not automatically improve the other. Sometimes you must give up a little of one to gain the other.",
      "The rule of thumb from the System Design Primer: aim for **maximal throughput with acceptable latency**."
    ],
    example: [
      "A bus driver could leave the moment one passenger sits down. That passenger gets there fast (low latency), but the bus carries very few people (low throughput).",
      "If the driver waits until the bus is full, many more people travel per hour (high throughput), but the first passenger waits longer (higher latency). A good timetable is the middle ground."
    ],
    why: "Without this rule you may optimise the wrong thing: a system that handles a huge number of requests but makes each user wait too long is still a bad system, and so is the reverse.",
    details: [
      "**Batching** (grouping many small jobs and doing them together) usually raises throughput but adds waiting time for each job.",
      "Handling each request immediately keeps latency low but can waste capacity.",
      "A system near its maximum throughput starts queueing requests, so latency rises. Leave some spare capacity.",
      "Decide what 'acceptable' means for your users first (for example, a page under 1 second), then maximise throughput within that limit."
    ],
    pros: ["Tuning for throughput serves many users with fewer machines.", "Tuning for latency makes each user's experience feel fast."],
    cons: ["Pushing one to the extreme often hurts the other."],
    remember: "Get the most work done per second while each user still waits an acceptable time.",
    sources: [PRIMER, CADENCE]
  }
];

// Pairs that look alike but mean different things (shown as "Don't confuse with").
const confusions = [
  {
    a: "latency",
    b: "throughput",
    note: "**Latency** = how long **one** request takes. **Throughput** = how many requests finish **per second**. A highway can have high throughput (many cars per hour) and still take a long time to cross (high latency)."
  },
  {
    a: "latency",
    b: "performance",
    note: "**Performance** is the general idea of how fast the system is. **Latency** is one way to measure it: the time a single request takes."
  }
];

// Related concepts. Read each edge as: "<from> <label> <to>"
const edges = [
  { from: "cache", to: "latency", label: "lowers the" },
  { from: "horizontal-scaling", to: "throughput", label: "raises the" },
  { from: "message-queue", to: "throughput", label: "helps smooth out the" },
  { from: "scalability", to: "throughput", label: "is about keeping up the" }
];

export default { nodes, edges, confusions };
