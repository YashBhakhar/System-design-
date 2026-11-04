import { useEffect, useRef, useState } from "react";
import { NODE_BY_ID } from "../data/index.js";
import { AI_URL, MAX_QUESTION, ask } from "../ai/client.js";
import { ASK_LEVELS, DEFAULT_LEVEL } from "../ai/levels.js";
import { addMessage, deleteChat, findChat, loadChats, newChatId, saveChats } from "../ai/chats.js";
import { funMessage, loadingMessage } from "../ai/messages.js";
import { replaceHash } from "../utils/route.js";
import { storage } from "../utils/storage.js";
import { Rich } from "../utils/RichText.jsx";
import Icon from "../components/Icon.jsx";

const EXAMPLES = ["What is CAP?", "Latency vs throughput?", "How does Netflix stay available?"];

// Where an answer came from. Decided by our code (client.js), not by the AI.
const ORIGINS = {
  map: { label: "From Concept Map", hint: "Built from this site's concepts." },
  mixed: { label: "Concept Map + AI", hint: "Our concepts, plus the AI's general knowledge." },
  ai: { label: "AI-generated · may be wrong", hint: "Nothing on this site matched, so check the facts." }
};

// Errors where asking the same question again can work.
const RETRY = new Set(["SLOW_DOWN", "NETWORK", "UPSTREAM"]);

const LIST_ITEM = /^(?:[-*•]|(\d+)[.)])\s+(.*)$/;

// The AI writes short paragraphs and "- " lists (worker/src/prompt.js): group lines into those.
function toBlocks(text) {
  const blocks = [];
  let open = null;
  for (const raw of String(text).split("\n")) {
    // Headings become plain lines; *italic* loses its stars (Rich only does **bold**).
    const line = raw
      .trim()
      .replace(/^#{1,6}\s+/, "")
      .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?![*\w])/g, "$1$2");
    if (!line) {
      open = null;
      continue;
    }
    const item = line.match(LIST_ITEM);
    const type = item ? (item[1] ? "ol" : "ul") : "p";
    if (!open || open.type !== type) blocks.push((open = { type, lines: [] }));
    open.lines.push(item ? item[2] : line);
  }
  return blocks;
}

function AnswerText({ text }) {
  return toBlocks(text).map((b, i) => {
    if (b.type === "p") return <p key={i}><Rich text={b.lines.join(" ")} /></p>;
    const List = b.type;
    return (
      <List key={i}>
        {b.lines.map((line, j) => (
          <li key={j}>
            <Rich text={line} />
          </li>
        ))}
      </List>
    );
  });
}

function Message({ m, onRetry }) {
  if (m.role === "user") return <div className="msg user">{m.text}</div>;

  if (m.error) {
    return (
      <div className="msg fun">
        <span>{m.text}</span>
        {onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            Ask again
          </button>
        )}
      </div>
    );
  }

  const origin = ORIGINS[m.origin] ?? ORIGINS.ai;
  const concepts = (m.conceptIds ?? []).filter((id) => NODE_BY_ID[id]);
  return (
    <div className="msg answer">
      <div className="msg-meta">
        <span className={`origin ${m.origin}`} title={origin.hint}>
          {origin.label}
        </span>
        {ASK_LEVELS[m.level] && <span className="tag">{ASK_LEVELS[m.level].label}</span>}
      </div>
      <AnswerText text={m.text} />
      {concepts.length > 0 && (
        <div className="msg-sources">
          <h2>Read more on this site</h2>
          <div className="chips">
            {concepts.map((id) => (
              <a key={id} className="chip" href={`#/learn/${id}`}>
                {NODE_BY_ID[id].title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatList({ chats, currentId, onDelete }) {
  if (!chats.length) return <p className="chat-empty">No chats yet.</p>;
  return (
    <ul className="chat-list">
      {chats.map((c) => (
        <li key={c.id} className={c.id === currentId ? "current" : ""}>
          <a href={`#/ask/${c.id}`} aria-current={c.id === currentId ? "page" : undefined} title={c.title}>
            {c.title}
          </a>
          <button type="button" className="chat-del" onClick={() => onDelete(c.id)} aria-label={`Delete chat: ${c.title}`}>
            <Icon name="trash" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Intro({ onPick }) {
  return (
    <div className="ask-intro">
      <h1>Ask AI</h1>
      <p className="lede">Ask anything about system design, like how big apps stay fast and online.</p>
      {!AI_URL && <p className="msg fun">{funMessage("NOT_CONFIGURED")}</p>}
      <div className="chips">
        {EXAMPLES.map((q) => (
          <button key={q} type="button" className="chip" onClick={() => onPick(q)} disabled={!AI_URL}>
            {q}
          </button>
        ))}
      </div>
      <ul className="origin-key">
        {Object.entries(ORIGINS).map(([key, o]) => (
          <li key={key}>
            <span className={`origin ${key}`}>{o.label}</span>
            {o.hint}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AskView({ chatId }) {
  const [chats, setChats] = useState(loadChats);
  const [level, setLevel] = useState(() => {
    const saved = storage.get("ask-level", DEFAULT_LEVEL);
    return ASK_LEVELS[saved] ? saved : DEFAULT_LEVEL;
  });
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(null); // { chatId, text } while waiting for an answer
  const controller = useRef(null);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  const chat = findChat(chats, chatId);
  const tooLong = draft.length > MAX_QUESTION;

  // Every change is saved straight away.
  const update = (change) =>
    setChats((prev) => {
      const next = change(prev);
      saveChats(next);
      return next;
    });

  // Leaving the Ask tab cancels a question that is still waiting.
  useEffect(() => () => controller.current?.abort(), []);

  // A deleted or unknown chat in the URL: show a new chat instead.
  useEffect(() => {
    if (chatId && !chat) replaceHash("#/ask");
  }, [chatId, chat]);

  // Keep the newest message in view.
  useEffect(() => {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endRef.current?.scrollIntoView({ block: "end", behavior: smooth ? "smooth" : "auto" });
  }, [chatId, chat?.messages.length, pending]);

  // The box grows with the question, up to a limit (see .composer textarea).
  useEffect(() => {
    const box = inputRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${box.scrollHeight}px`;
  }, [draft]);

  // On a computer, start typing straight away; on phones, don't pop the keyboard up.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
  }, [chatId]);

  async function send(text, { retry = false } = {}) {
    const question = text.trim();
    if (!question || pending || question.length > MAX_QUESTION) return;

    const id = chat?.id ?? newChatId();
    const earlier = chat?.messages ?? [];
    // Messages before this question (a retry's question is already in the chat).
    const history = retry ? earlier.slice(0, earlier.findLastIndex((m) => m.role === "user")) : earlier;

    if (!retry) {
      update((prev) => addMessage(prev, id, { role: "user", text: question }));
      setDraft("");
    }
    if (!chat) replaceHash(`#/ask/${id}`);
    setPending({ chatId: id, text: loadingMessage() });

    controller.current = new AbortController();
    const result = await ask({ question, level, messages: history, signal: controller.current.signal });
    setPending(null);
    if (result.error === "CANCELLED") return;

    const answer = result.error
      ? { role: "assistant", text: funMessage(result.error), error: result.error, level }
      : { role: "assistant", text: result.answer, origin: result.origin, conceptIds: result.conceptIds, level };
    // The chat may have been deleted while waiting.
    update((prev) => (findChat(prev, id) ? addMessage(prev, id, answer) : prev));
  }

  const retryLast = () => {
    const lastQuestion = chat?.messages.findLast((m) => m.role === "user");
    if (lastQuestion) send(lastQuestion.text, { retry: true });
  };

  const remove = (id) => {
    if (!window.confirm("Delete this chat?")) return;
    update((prev) => deleteChat(prev, id));
    if (id === chatId) replaceHash("#/ask");
  };

  const removeAll = () => {
    if (!window.confirm("Delete all chats? This can't be undone.")) return;
    update(() => []);
    replaceHash("#/ask");
  };

  const pickLevel = (key) => {
    setLevel(key);
    storage.set("ask-level", key);
  };

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter is a new line. Not while an IME is composing a word.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  };

  const chatsPanel = (
    <>
      <a className="btn new-chat" href="#/ask">
        <Icon name="plus" /> New chat
      </a>
      <ChatList chats={chats} currentId={chat?.id} onDelete={remove} />
      {chats.length > 1 && (
        <button type="button" className="link-btn" onClick={removeAll}>
          Delete all chats
        </button>
      )}
    </>
  );

  const messages = chat?.messages ?? [];
  const last = messages.at(-1);

  return (
    <div className="ask">
      <aside className="side ask-side" aria-label="Chats">
        {chatsPanel}
      </aside>

      <div className="ask-main">
        <details className="path-mobile ask-mobile">
          <summary>Chats ({chats.length})</summary>
          <div className="ask-mobile-list">{chatsPanel}</div>
        </details>

        <section className="thread" role="log" aria-live="polite" aria-label="Conversation">
          {!chat && <Intro onPick={send} />}
          {messages.map((m, i) => (
            <Message
              key={`${m.at}-${i}`}
              m={m}
              onRetry={m === last && RETRY.has(m.error) && !pending ? retryLast : undefined}
            />
          ))}
          {pending && pending.chatId === chat?.id && (
            <div className="msg answer thinking">
              <span className="dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {pending.text}
            </div>
          )}
          <div ref={endRef} />
        </section>

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <div className="composer-box">
            <label htmlFor="ask-input" className="sr-only">
              Your question
            </label>
            <textarea
              id="ask-input"
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a system design question…"
              disabled={!AI_URL}
            />
            {pending ? (
              <button type="button" className="btn primary" onClick={() => controller.current?.abort()}>
                <Icon name="stop" /> Stop
              </button>
            ) : (
              <button type="submit" className="btn primary" disabled={!draft.trim() || tooLong || !AI_URL}>
                <Icon name="send" />
                <span className="sr-only">Send</span>
              </button>
            )}
          </div>
          <div className="composer-foot">
            <div className="seg seg-sm" role="radiogroup" aria-label="Answer depth">
              {Object.entries(ASK_LEVELS).map(([key, l]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={level === key}
                  title={l.hint}
                  onClick={() => pickLevel(key)}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {draft.length > MAX_QUESTION - 100 && (
              <span className={`count ${tooLong ? "over" : ""}`}>
                {draft.length}/{MAX_QUESTION}
              </span>
            )}
            <small className="ask-note">Answers can be wrong. Don't type personal info.</small>
          </div>
        </form>
      </div>
    </div>
  );
}
