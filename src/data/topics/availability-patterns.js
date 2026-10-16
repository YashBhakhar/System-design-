/*
 * Topic: Availability patterns
 * Learned from:
 *   - System Design Primer, the Availability patterns section
 *
 * `sources` = the "Learn more" links: the best beginner-friendly page per concept.
 */

const link = (label, url) => ({ label, url });

const PRIMER = (anchor, title) =>
  link(`System Design Primer: ${title}`, `https://github.com/donnemartin/system-design-primer#${anchor}`);
const WIKI_FAILOVER = link("Wikipedia: Failover", "https://en.wikipedia.org/wiki/Failover");
const WIKI_HA = link("Wikipedia: High availability", "https://en.wikipedia.org/wiki/High_availability");

const nodes = [
  {
    id: "failover",
    title: "Failover",
    aliases: ["fail-over", "fail over", "standby", "hot standby", "cold standby", "availability patterns", "switch over"],
    level: 2,
    concern: "up",
    kind: "technique",
    prereqs: ["high-availability"],
    short: "When a server dies, a backup takes over its work automatically.",
    what: [
      "**Failover** means switching to a backup when the main machine fails, ideally so quickly that users barely notice.",
      "The machines check on each other with a **heartbeat**: a small 'I'm alive' message sent every second or so. When the heartbeats stop, the backup assumes the main one is dead and takes over."
    ],
    example:
      "In a football match, if the goalkeeper is injured, the substitute keeper comes on. If the substitute is already warmed up on the bench (**hot standby**), play restarts in a minute. If they have to be called in from home (**cold standby**), the team waits a long time.",
    why: "Every machine fails eventually. Failover turns a failure from 'the site is down until someone fixes it' into 'a short hiccup'.",
    details: [
      "There are two main styles: **active–passive** (the backup waits) and **active–active** (every machine works).",
      "**Hot standby**: the backup is already running, so takeover is quick. **Cold standby**: the backup must first start up, so there is more downtime.",
      "Failover and **replication** work together: failover gives you a working machine, replication makes sure it has the data."
    ],
    pros: ["Short downtime instead of a long outage", "Happens automatically, even at 3 a.m."],
    cons: [
      "More hardware to pay for, and more complexity to set up and test",
      "Data can be lost if the main machine dies before its newest writes were copied to the backup"
    ],
    remember: "Failover = the backup takes over when heartbeats stop.",
    sources: [PRIMER("fail-over", "Fail-over"), WIKI_FAILOVER]
  },
  {
    id: "active-passive",
    title: "Active–Passive Failover",
    aliases: ["active passive", "active-passive", "master-slave failover", "primary backup", "heartbeat"],
    level: 3,
    concern: "up",
    kind: "technique",
    prereqs: ["failover"],
    short: "One server does all the work; a spare waits and takes over if it fails.",
    what: [
      "In **active–passive** failover, only the **active** server handles traffic. The **passive** server stands by and exchanges heartbeats with it.",
      "If the heartbeats stop, the passive server takes over the active server's **IP address** (its address on the network), so requests now reach it instead, and it carries on the service."
    ],
    example:
      "A bank branch has one cashier at the counter and a second trained cashier doing paperwork in the back. If the first cashier falls ill, the second steps up to the same counter, and customers keep queuing at the same window.",
    why: "It's the simplest way to remove a single point of failure: one machine works, one waits, and users always go to the same address.",
    details: [
      "Downtime depends on whether the passive server is in **hot** standby (already running) or **cold** standby (must start up first).",
      "Also called **master–slave failover**."
    ],
    pros: ["Simple: only one server is ever in charge", "Users keep using the same address"],
    cons: ["The spare server sits idle most of the time", "Some downtime while the switch happens"],
    remember: "One works, one waits.",
    sources: [PRIMER("active-passive", "Active-passive"), WIKI_FAILOVER]
  },
  {
    id: "active-active",
    title: "Active–Active Failover",
    aliases: ["active active", "active-active", "master-master failover"],
    level: 3,
    concern: "up",
    kind: "technique",
    prereqs: ["failover", "load-balancer"],
    short: "Every server handles traffic; if one fails, the others carry its share.",
    what: [
      "In **active–active** failover, **all** servers handle traffic at the same time and share the load between them.",
      "If one fails, the others keep going and take on its share. Nothing has to 'switch on', because everyone is already working."
    ],
    example:
      "A supermarket has three billing counters open. If one cashier goes on a break, customers simply join the other two queues. The queues get longer, but the shop keeps selling.",
    why: "No machine sits idle, so you get more capacity from the same hardware, and a failure causes no switch-over pause.",
    details: [
      "If the servers face the public internet, **DNS** must know the public IP addresses of all of them.",
      "If the servers are internal, the application itself must know about all of them.",
      "Leave spare capacity: if two servers each run at 80%, one alone can't carry 160%.",
      "Also called **master–master failover**."
    ],
    pros: ["No idle hardware", "No switch-over delay when one fails"],
    cons: ["More complex: every server must be able to handle any request", "If the servers share data, they can conflict when both change it"],
    remember: "Everyone works; if one drops, the rest cover.",
    sources: [PRIMER("active-active", "Active-active"), WIKI_FAILOVER]
  },
  {
    id: "availability-nines",
    title: "Availability in Nines",
    aliases: ["nines", "three nines", "four nines", "99.9", "99.99", "uptime", "downtime", "sla", "availability in numbers"],
    level: 2,
    concern: "up",
    kind: "idea",
    prereqs: ["high-availability"],
    short: "Availability is measured as a percentage of uptime, counted in 9s: 99.9% is 'three nines'.",
    what: [
      "Availability is usually measured as the **percentage of time a service is working**. People count the nines: **99.9%** is 'three nines', **99.99%** is 'four nines'.",
      "Each extra nine means about **ten times less** downtime allowed."
    ],
    example:
      "A shop open '99.9% of the time' may be closed for about 8¾ hours a year. At '99.99%', it may be closed for only about 53 minutes a year, less than a single lunch break.",
    why: "'Highly available' is vague. A number turns it into a clear promise you can design for, check and write into a contract (often called an **SLA**, a service level agreement).",
    details: [
      "**99.9% (three nines)**: about **8h 46min** of downtime per year, 43min 50s per month, 10min 5s per week, 1min 26s per day.",
      "**99.99% (four nines)**: about **52min 36s** per year, 4min 23s per month, 1min per week, 8.6s per day.",
      "These use a year of 365¼ days. Every extra nine usually costs much more money and effort."
    ],
    remember: "Each extra nine = about 10× less downtime.",
    sources: [PRIMER("availability-in-numbers", "Availability in numbers"), WIKI_HA]
  },
  {
    id: "availability-sequence-parallel",
    title: "Availability in Sequence vs Parallel",
    aliases: ["in sequence", "in parallel", "series", "combined availability", "total availability"],
    level: 3,
    concern: "up",
    kind: "principle",
    prereqs: ["availability-nines"],
    short: "Parts that all must work lower availability; backups side by side raise it.",
    what: [
      "If a service is built from several parts, its total availability depends on how the parts are arranged.",
      "**In sequence** (a request needs **every** part): multiply their availabilities. Total = A × B. The total is **lower** than either part.",
      "**In parallel** (any **one** part is enough): the service is down only if **all** parts are down at once. Total = 1 − (1 − A) × (1 − B). The total is **higher** than either part."
    ],
    example: [
      "**In sequence**: to reach college you take a bus, then a train. If either one breaks down, you're late. More links in the chain means more ways to fail.",
      "**In parallel**: the college gate has two ATMs. You can withdraw cash unless **both** are broken at the same time, which is much rarer."
    ],
    why: "It explains why adding parts in a chain quietly makes a system less reliable, and why putting backups side by side (redundancy) is how you gain nines.",
    details: [
      "Two parts at 99.9% each, **in sequence**: 0.999 × 0.999 ≈ **99.8%**.",
      "The same two parts **in parallel**: 1 − (0.001 × 0.001) = **99.9999%**.",
      "The parallel formula assumes the parts fail **independently**. If both share one power supply, they can fail together, and the real number is lower."
    ],
    remember: "Chain = multiply (worse). Side by side = both must fail (better).",
    sources: [PRIMER("availability-in-parallel-vs-in-sequence", "Availability in parallel vs in sequence"), WIKI_HA]
  }
];

// Pairs that look alike but mean different things (shown as "Don't confuse with").
const confusions = [
  {
    a: "active-passive",
    b: "active-active",
    note: "**Active–passive**: one server works, the spare waits and takes over when it fails. **Active–active**: all servers work at once and cover for each other."
  },
  {
    a: "failover",
    b: "replication",
    note: "**Failover** keeps a working **machine** answering requests. **Replication** keeps up-to-date **copies of the data**. You usually need both: a backup machine is useless without the data."
  }
];

// Related concepts. Read each edge as: "<from> <label> <to>"
const edges = [
  { from: "replication", to: "active-passive", label: "is the data side of" },
  { from: "master-master", to: "active-active", label: "is the data side of" },
  { from: "redundancy", to: "availability-sequence-parallel", label: "works because of" },
  { from: "failover", to: "single-point-of-failure", label: "removes a" },
  { from: "active-active", to: "dns-round-robin", label: "can use" }
];

export default { nodes, edges, confusions };
