/*
 * Topic: Performance vs scalability
 * Learned from:
 *   - "A Word on Scalability" (Werner Vogels, 2006)
 *   - "Scalability, Availability & Stability Patterns" (Jonas Bonér), the trade-offs section
 *
 * `sources` = the "Learn more" links: the best beginner-friendly page per concept.
 */

const link = (label, url) => ({ label, url });

const VOGELS = link(
  "Werner Vogels: A Word on Scalability",
  "https://www.allthingsdistributed.com/2006/03/a_word_on_scalability.html"
);
const BONER = link(
  "Jonas Bonér: Scalability, Availability & Stability Patterns (slides)",
  "https://www.slideshare.net/slideshow/scalability-availability-stability-patterns/4062682"
);
const PRIMER = link(
  "System Design Primer: Performance vs scalability",
  "https://github.com/donnemartin/system-design-primer#performance-vs-scalability"
);

const nodes = [
  {
    id: "performance",
    title: "Performance",
    aliases: ["speed", "fast", "slow", "performance vs scalability", "response time"],
    level: 1,
    concern: "foundations",
    kind: "idea",
    prereqs: ["server"],
    short: "How fast your system answers a single request.",
    what: [
      "Performance is how quickly a system does its job for **one** user: how long you wait between clicking and seeing the page.",
      "Good performance means each request is handled quickly, without wasted work."
    ],
    example:
      "A chai-wala who makes a cup in 1 minute has good performance. If he takes 10 minutes for every cup, even when you're his only customer, that's a **performance problem**: the stall is slow however quiet it is.",
    why: "Performance and scalability are easy to mix up, but they are different problems with different fixes. Before fixing anything, you need to know which one you have.",
    details: [
      "**Performance problem**: the system is slow even for a **single user**. Fix the slow work itself: a better algorithm, a cache, a faster query.",
      "**Scalability problem**: the system is fast for one user but gets slow **under heavy load**. Fix it by adding resources in a way that actually helps (more servers, splitting data).",
      "A system can have good performance and poor scalability, or the other way round."
    ],
    remember: "Slow for one user = performance problem. Slow only when busy = scalability problem.",
    sources: [PRIMER, BONER]
  },
  {
    id: "proportional-scaling",
    title: "Proportional Scaling",
    aliases: ["linear scalability", "linear scaling", "scales linearly", "bottleneck", "adding resources"],
    level: 2,
    concern: "scaling",
    kind: "principle",
    prereqs: ["scalability", "horizontal-scaling"],
    short: "Double the resources should give roughly double the capacity.",
    what: [
      "Werner Vogels (Amazon's CTO) gives a simple test: a service is scalable if **adding resources increases performance in proportion** to what you added.",
      "Here 'performance' can mean handling **more** work (more users and requests) or **bigger** work (larger amounts of data)."
    ],
    example:
      "Open a second billing counter at a supermarket and you expect about twice as many customers served per hour. If both cashiers must share one slow card machine, the second counter adds almost nothing. That shared machine is a **bottleneck**.",
    why: "This is the real test of scalability. If doubling your servers gives only 10% more capacity, something shared (a database, a single queue, one busy machine) is holding everything back, and buying more servers just wastes money.",
    details: [
      "Perfectly proportional scaling is rare. The goal is to get close to it.",
      "Adding servers for **redundancy** (spares in case one fails) should not make the system slower. If it does, the design doesn't scale well.",
      "When scaling stops helping, find the shared piece everything waits for (the bottleneck) and split or remove it."
    ],
    remember: "Scalable = more resources give proportionally more capacity.",
    sources: [VOGELS, link("Wikipedia: Bottleneck (software)", "https://en.wikipedia.org/wiki/Bottleneck_(software)")]
  },
  {
    id: "algorithms-at-scale",
    title: "Algorithms That Don't Scale",
    aliases: ["big o", "time complexity", "complexity", "o(n^2)", "quadratic", "algorithm cost"],
    level: 2,
    concern: "scaling",
    kind: "problem",
    prereqs: ["performance", "scalability"],
    short: "Code that's quick with a little data can become painfully slow as data grows.",
    what: [
      "Some ways of solving a problem take a **little** more time as data grows. Others take **far** more. With 100 records you can't tell them apart; with 10 million, one finishes in a second and the other takes days.",
      "Vogels warns that many algorithms that work fine with low load and small data can **explode in cost** as requests, data or servers grow."
    ],
    example: [
      "A teacher checks whether any two students share a roll number by comparing every pair. With 50 students that's about 1,200 comparisons, a few minutes of work. With 50,000 students in a university it's about **1.25 billion** comparisons.",
      "A smarter way: sort the list once, then compare only neighbours. Same answer, a tiny fraction of the work."
    ],
    why: "No number of extra servers can rescue an algorithm whose cost explodes. This is where system design meets **DSA**: describing how work grows as data grows is exactly what **Big O notation** is for.",
    details: [
      "Ask: if the data becomes 10× bigger, does the work become 10× bigger, or 100× bigger?",
      "Watch for loops inside loops over the same data, and for work repeated again and again that could be done once."
    ],
    remember: "Ask how the work grows when the data grows 10×.",
    sources: [
      VOGELS,
      link(
        "Khan Academy: Big-O notation",
        "https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/big-o-notation"
      )
    ]
  },
  {
    id: "heterogeneous-servers",
    title: "Mixed (Heterogeneous) Servers",
    aliases: ["heterogeneity", "heterogeneous", "different hardware", "weighted load balancing", "uneven servers"],
    level: 3,
    concern: "traffic",
    kind: "problem",
    prereqs: ["horizontal-scaling", "load-balancer"],
    short: "As you scale out, your servers stop being identical, and the design must cope with that.",
    what: [
      "As a system grows, its machines become a mix: new servers are faster than old ones, some are bigger because that's cheaper, some are in other cities.",
      "Vogels points out that designs which assume every machine is the same either **break** or **waste** the newer, stronger machines."
    ],
    example:
      "Four friends split a project equally, 25% each. One has a new laptop and finishes in an hour; another has an old one and needs a whole day. Splitting **equally** means everyone waits for the slowest. Splitting by **how fast each person works** finishes much sooner.",
    why: "Treating every server the same, as DNS round robin does, gives a slow old machine as much work as a powerful new one. Smarter load balancing uses each machine according to what it can handle.",
    details: [
      "**Weighted** load balancing: give stronger machines a bigger share of the requests.",
      "**Least busy**: send each request to whichever server has the least work right now, instead of blindly taking turns."
    ],
    remember: "Servers aren't equal, so don't share the work equally.",
    sources: [
      VOGELS,
      link(
        "Wikipedia: Load balancing - Heterogeneous machines",
        "https://en.wikipedia.org/wiki/Load_balancing_(computing)#Heterogeneous_machines"
      )
    ]
  },
  {
    id: "design-for-scale",
    title: "Design for Scale from the Start",
    aliases: ["afterthought", "plan for growth", "growth axes", "scalable architecture"],
    level: 2,
    concern: "scaling",
    kind: "principle",
    prereqs: ["proportional-scaling", "algorithms-at-scale"],
    short: "Scalability has to be planned into the design; it can't be bolted on at the end.",
    what: [
      "Vogels' main lesson: **scalability cannot be an afterthought.** It has to be part of the design from the beginning.",
      "That doesn't mean building for millions of users on day one. It means knowing **how your system will grow** and avoiding choices that block that growth."
    ],
    example:
      "You can't add a third floor to a house later unless the foundation was built to carry it. You don't have to build the third floor now, but you do have to pour the right foundation.",
    why: "A design that can't scale often has to be rewritten while users are waiting. Thinking ahead costs little; rebuilding costs a lot.",
    details: [
      "Know your **growth axes**: what will grow? Users, requests, data size, number of servers, number of locations.",
      "Decide where you need **redundancy** (spare copies) so one failure doesn't stop the service.",
      "Expect **mixed hardware** instead of assuming every machine is identical.",
      "Avoid algorithms whose cost explodes as data grows."
    ],
    remember: "Pour the foundation for the floors you'll add later.",
    sources: [VOGELS, PRIMER]
  }
];

// Pairs that look alike but mean different things (shown as "Don't confuse with").
const confusions = [
  {
    a: "performance",
    b: "scalability",
    note: "**Performance** = how fast it is for one user. **Scalability** = whether it stays fast as users grow. Slow for one user: a performance problem. Fast for one but slow under heavy load: a scalability problem."
  }
];

// Related concepts. Read each edge as: "<from> <label> <to>"
const edges = [
  { from: "cache", to: "performance", label: "improves" },
  { from: "redundancy", to: "proportional-scaling", label: "should not hurt" },
  { from: "heterogeneous-servers", to: "dns-round-robin", label: "are handled badly by" },
  { from: "design-for-scale", to: "redundancy", label: "plans for" },
  { from: "design-for-scale", to: "heterogeneous-servers", label: "plans for" },
  { from: "design-for-scale", to: "stateless-server", label: "often starts with" }
];

export default { nodes, edges, confusions };
