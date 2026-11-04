/*
 * What the Ask tab says when something goes wrong, and while it waits.
 * Simple English: one joke word, one emoji, one clear next step.
 * Codes come from the Worker (worker/src/index.js) or from client.js.
 */
export const ERROR_MESSAGES = {
  QUOTA: [
    "Some moron used up all the free AI today 🤡 Come back tomorrow.",
    "Some idiot ate all our free tokens 🍪 Try again tomorrow."
  ],
  SLOW_DOWN: [
    "Slow down, genius 🐢 Wait one minute and ask again.",
    "Too fast, dummy 🏎️ Wait a minute."
  ],
  TOO_LONG: ["Bro, this is a book, not a question 📚 Keep it short."],
  OFF_TOPIC: ["Nice try, clown 🤡 I only answer system design questions."],
  NETWORK: ["Your internet is dead, buddy 💀 Check your Wi-Fi and try again."],
  UPSTREAM: ["The AI broke. Not your fault this time 🤕 Try again."],
  NOT_CONFIGURED: ["The AI is sleeping 😴 Someone forgot to turn it on."]
};

export const LOADING_MESSAGES = [
  "Thinking… don't rush me 🤔",
  "Wait, I'm reading my notes 📖",
  "Asking my brain cell 🧠",
  "Typing with two fingers ⌨️"
];

const pick = (list, random = Math.random) => list[Math.floor(random() * list.length)];

/** A fun message for an error code. Unknown codes get the UPSTREAM one. */
export const funMessage = (code, random) => pick(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UPSTREAM, random);

export const loadingMessage = (random) => pick(LOADING_MESSAGES, random);
