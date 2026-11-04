/*
 * Topic: Availability vs consistency (CAP theorem)
 * Learned from:
 *   - System Design Primer, the Availability vs consistency section
 *   - "CAP Theorem: Revisited" (Robert Greiner)
 *   - "The CAP FAQ" (Henry Robinson)
 *
 * `sources` = the "Learn more" links: the best beginner-friendly page per concept.
 */

const link = (label, url) => ({ label, url });

const PRIMER = (anchor, title) =>
  link(`System Design Primer: ${title}`, `https://github.com/donnemartin/system-design-primer#${anchor}`);
const GREINER = link("Robert Greiner: CAP Theorem Revisited", "https://robertgreiner.com/cap-theorem-revisited/");
const CAP_FAQ = link("Henry Robinson: The CAP FAQ", "https://github.com/henryr/cap-faq");
const WIKI_CAP = link("Wikipedia: CAP theorem", "https://en.wikipedia.org/wiki/CAP_theorem");

const nodes = [
  {
    id: "network-partition",
    title: "Network Partition",
    aliases: ["partition", "partition tolerance", "split brain", "network split", "network failure"],
    level: 2,
    concern: "consistency",
    kind: "problem",
    prereqs: ["replication"],
    short: "The network breaks, so some servers keep running but can't talk to each other.",
    what: [
      "A **network partition** happens when the connection between servers breaks. Each server is still running and still has users, but messages between the groups never arrive.",
      "**Partition tolerance** means the system keeps working anyway, even though its parts are cut off from each other."
    ],
    example:
      "A cinema sells tickets at two counters, one at each entrance. The cashiers phone each other after every sale so nobody sells the same seat twice. Then the phone line goes dead. Both counters are open and customers are queuing, but neither cashier knows what the other is selling.",
    why: "Real networks fail: a cable is cut, a router crashes, a data centre loses its link. Once your data lives on more than one machine, a partition is a **when**, not an **if**. So every system that keeps copies must decide what to do when it happens.",
    details: [
      "A partition is **not** the same as a crashed server. In a partition, both sides are alive and both may get requests.",
      "It is also not the same as a slow server. Messages to a slow server arrive late; messages across a partition never arrive. From the inside, the two are hard to tell apart."
    ],
    remember: "Partition = servers still running, but cut off from each other.",
    sources: [CAP_FAQ, link("Wikipedia: Network partition", "https://en.wikipedia.org/wiki/Network_partition")]
  },
  {
    id: "cap-consistency",
    title: "Consistency (in CAP)",
    aliases: ["consistency", "strong consistency", "linearizability", "latest write", "up to date"],
    level: 2,
    concern: "consistency",
    kind: "idea",
    prereqs: ["replication"],
    short: "Every read gets the latest write, or an error. Never old data.",
    what: [
      "In CAP, **consistency** means every read sees the **most recent write**, no matter which server answers. If the system can't promise that, it returns an error instead of old data.",
      "To the user, it looks as if there were only **one copy** of the data, even when there are many."
    ],
    example:
      "You change your phone number at the college office. A minute later your friend asks a different clerk for it. With consistency, that clerk gives the **new** number, or says 'I can't check right now'. Never the old one.",
    why: "Some data must never be out of date: a bank balance, the last seat on a train, stock of the final item in a shop. Showing an old value there leads to real mistakes, like selling the same seat twice.",
    details: [
      "This is a different meaning from the **C in ACID** (database transactions), which is about data following its rules. Same word, different idea.",
      "The strict name for CAP consistency is **linearizability**."
    ],
    remember: "Consistent = you always see the latest write, or an error.",
    sources: [PRIMER("cap-theorem", "CAP theorem"), CAP_FAQ]
  },
  {
    id: "cap-availability",
    title: "Availability (in CAP)",
    aliases: ["availability", "always answers", "no errors", "every request gets a response"],
    level: 2,
    concern: "consistency",
    kind: "idea",
    prereqs: ["replication"],
    short: "Every request to a working server gets a real answer, though maybe not the latest.",
    what: [
      "In CAP, **availability** means every request sent to a working server gets a **real response**: not an error, not a timeout.",
      "The catch: the answer might not contain the most recent data."
    ],
    example:
      "A shop's online page shows '5 left in stock' even while the warehouse system is unreachable. You always get an answer, but the real number might already be 3.",
    why: "For many apps, an answer that's slightly out of date is far better than no answer. People would rather see a like count that's a few seconds old than an error page.",
    details: [
      "CAP availability is strict: **every** request to a working server must succeed. It's not '99.9% of the time'.",
      "That makes it different from **high availability**, which is about overall uptime."
    ],
    remember: "Available = you always get an answer, maybe an old one.",
    sources: [PRIMER("cap-theorem", "CAP theorem"), CAP_FAQ]
  },
  {
    id: "cap-theorem",
    title: "CAP Theorem",
    aliases: ["cap", "brewer's theorem", "availability vs consistency", "consistency vs availability", "pick two"],
    level: 1,
    concern: "consistency",
    kind: "principle",
    prereqs: ["network-partition", "cap-consistency", "cap-availability"],
    short: "When the network splits, a system with copies must choose: always correct, or always answering.",
    what: [
      "The CAP theorem talks about three guarantees: **Consistency** (every read gets the latest write), **Availability** (every request gets an answer) and **Partition tolerance** (keep working when the network splits).",
      "It is often summed up as 'pick any two of three'. That's misleading. Networks **will** split, so partition tolerance isn't optional. The real rule is: **during a partition, you must choose between consistency and availability.**",
      "When the network is healthy, a system can be both consistent and available."
    ],
    example: [
      "Back to the two cinema counters with the dead phone line. A customer asks for seat F7. The cashier has two choices:",
      "**Stop selling** until the line is fixed, so no seat is ever sold twice. That's choosing **consistency**.",
      "**Keep selling** from their own list, so customers are served but the same seat might go to two people. That's choosing **availability**.",
      "No cashier can do both while the line is dead. That's the CAP theorem."
    ],
    why: "It turns a vague worry into a clear design question: **'When servers can't talk, should we refuse, or answer with what we have?'** The right choice depends on what the data is for.",
    details: [
      "First proposed by Eric Brewer in 2000, and proved by Seth Gilbert and Nancy Lynch in 2002.",
      "It only applies to data spread across more than one machine. A single server can't be partitioned from itself.",
      "Systems that claim 'CA' (consistent and available, no partition tolerance) are usually single-machine, or are hoping the network never fails."
    ],
    remember: "Network splits will happen. When they do, choose: correct or answering.",
    sources: [PRIMER("availability-vs-consistency", "Availability vs consistency"), GREINER, WIKI_CAP]
  },
  {
    id: "cp-system",
    title: "CP: Choose Consistency",
    aliases: ["cp", "consistency and partition tolerance", "atomic reads and writes", "zookeeper"],
    level: 2,
    concern: "consistency",
    kind: "technique",
    prereqs: ["cap-theorem"],
    short: "During a partition, refuse or time out rather than give an out-of-date answer.",
    what: [
      "A **CP** system stays correct during a partition. If a server can't confirm it has the latest data, it waits, and the request may end in a **timeout** or an **error**.",
      "Some users are turned away for a while, but nobody is ever shown wrong data."
    ],
    example:
      "A bank's ATM loses its connection to the bank. Instead of guessing your balance and handing out cash, it shows 'Service unavailable, try later'. Annoying, but it can't let you spend money you don't have.",
    why: "Choose CP when a wrong answer is worse than no answer: payments, bank balances, booking the last seat, keeping stock exact. The Primer puts it as: when the business needs **atomic reads and writes** (each change happens fully or not at all, and everyone sees it).",
    pros: ["Data is never out of date or contradictory", "Simpler to reason about: one true value"],
    cons: ["Some requests fail or wait during a partition", "Users see errors until the network recovers"],
    remember: "CP: better to say 'try later' than to say something wrong.",
    sources: [PRIMER("cp---consistency-and-partition-tolerance", "CP: consistency and partition tolerance"), GREINER]
  },
  {
    id: "ap-system",
    title: "AP: Choose Availability",
    aliases: ["ap", "availability and partition tolerance", "dynamo", "stale data"],
    level: 2,
    concern: "consistency",
    kind: "technique",
    prereqs: ["cap-theorem"],
    short: "During a partition, keep answering with the data you have, and sync up later.",
    what: [
      "An **AP** system keeps answering during a partition. Each server replies with the newest data **it** has, which may not be the latest overall.",
      "Writes made on either side are shared once the network recovers. Until then, different servers may give different answers.",
      "This is called **eventual consistency**: if updates stop, all copies **eventually** agree."
    ],
    example:
      "You post a photo and your friend in another city doesn't see it for a few seconds; your like count is a little different on your phone and your laptop. Nobody is harmed, and everything matches up shortly.",
    why: "Choose AP when staying up matters more than being exactly right every second: social media feeds, like counts, shopping carts, product reviews. Amazon's Dynamo database was built this way so customers could always add to their cart.",
    pros: ["Users always get an answer", "Keeps working through network failures"],
    cons: [
      "Users may see old data for a while",
      "Two sides may change the same thing during a partition, and those conflicts must be sorted out later"
    ],
    remember: "AP: always answer, fix the differences later.",
    sources: [PRIMER("ap---availability-and-partition-tolerance", "AP: availability and partition tolerance"), GREINER, CAP_FAQ]
  }
];

// Pairs that look alike but mean different things (shown as "Don't confuse with").
const confusions = [
  {
    a: "cap-consistency",
    b: "cap-availability",
    note: "**Consistency**: every answer is up to date, or you get an error. **Availability**: you always get an answer, but it may be old. During a network partition you can't have both."
  },
  {
    a: "cap-availability",
    b: "high-availability",
    note: "**High availability** is about uptime: the system is up 99.9% of the time thanks to backups. **CAP availability** is stricter and narrower: during a partition, every request to a working server still gets a real answer."
  },
  {
    a: "cp-system",
    b: "ap-system",
    note: "Both handle a network partition. **CP** refuses or waits rather than risk old data (an ATM saying 'try later'). **AP** answers with what it has and syncs later (a like count that's a few seconds behind)."
  },
  {
    a: "network-partition",
    b: "single-point-of-failure",
    note: "A **single point of failure** is one part whose death stops everything. A **network partition** is when parts are all alive but can't reach each other."
  }
];

// Related concepts. Read each edge as: "<from> <label> <to>"
const edges = [
  { from: "replication", to: "cap-theorem", label: "is where you meet the" },
  { from: "master-master", to: "ap-system", label: "faces the same write conflicts as an" },
  { from: "ap-system", to: "high-availability", label: "favours" },
  { from: "redundancy", to: "cap-consistency", label: "puts at risk" }
];

export default { nodes, edges, confusions };
