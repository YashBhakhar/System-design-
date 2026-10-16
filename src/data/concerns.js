/*
 * Concerns = the problem areas shown as cards in Browse.
 * Order matters: it is the order of Browse cards and the tie-breaker for the learning path.
 * `icon` is a name from src/components/Icon.jsx.
 */
export const CONCERNS = [
  { id: "foundations", name: "Foundations", blurb: "The basic words everything else is built on.", icon: "layers", color: "#64748b" },
  { id: "scaling", name: "Scaling servers", blurb: "Going from one machine to many.", icon: "expand", color: "#2563eb" },
  { id: "traffic", name: "Handling traffic", blurb: "Spreading users across your servers.", icon: "split", color: "#7c3aed" },
  { id: "up", name: "Staying up & safe", blurb: "Surviving failures and keeping attackers out.", icon: "shield", color: "#dc2626" },
  { id: "data", name: "Storing data", blurb: "Where data lives, and how it grows.", icon: "database", color: "#059669" },
  { id: "fast", name: "Making it fast", blurb: "Answering quickly without redoing work.", icon: "zap", color: "#d97706" },
  { id: "async", name: "Background work", blurb: "Doing slow work without making users wait.", icon: "clock", color: "#db2777" },
  {
    id: "consistency",
    name: "Correctness & consistency",
    blurb: "Keeping data right when many machines share it.",
    icon: "check",
    color: "#0891b2",
    comingSoon: ["CAP theorem", "ACID", "Consistency models"]
  }
];

// What kind of thing a concept is. `lane` = its column inside a Browse concern.
export const KINDS = {
  idea: { label: "Basic idea", lane: "ideas" },
  principle: { label: "Principle", lane: "ideas" },
  problem: { label: "Problem", lane: "ideas" },
  technique: { label: "Technique", lane: "techniques" },
  tool: { label: "Tool", lane: "tools" }
};

export const LANES = [
  { id: "ideas", title: "Ideas & principles", hint: "What it is and why it matters" },
  { id: "techniques", title: "Techniques", hint: "Ways to solve the problem" },
  { id: "tools", title: "Tools", hint: "Real products and hardware" }
];

export const LEVELS = {
  1: "Big picture",
  2: "Core idea",
  3: "Detail"
};
