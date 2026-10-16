import { CONCERN_BY_ID, KINDS, LEVELS, NODE_BY_ID, confusedWith, prereqs } from "../data/index.js";
import { hrefFor } from "../utils/route.js";
import { Paragraphs, Rich } from "../utils/RichText.jsx";
import Icon from "./Icon.jsx";

const List = ({ items }) => (
  <ul>
    {items.map((text, i) => (
      <li key={i}>
        <Rich text={text} />
      </li>
    ))}
  </ul>
);

/** The full explanation of one concept. Same in every mode; only `top`, `eyebrow` and `footer` differ. */
export default function ConceptPage({ id, mode, done, top, eyebrow, footer }) {
  const c = NODE_BY_ID[id];
  const concern = CONCERN_BY_ID[c.concern];
  const first = prereqs(id);
  const confused = confusedWith(id);

  return (
    <article className="page">
      {top}
      <div className="eyebrow">
        <span className="dot" style={{ background: concern.color }} />
        {eyebrow}
      </div>
      <h1>{c.title}</h1>
      <p className="lede">
        <Rich text={c.short} />
      </p>
      <div className="tags">
        <span className="tag">{KINDS[c.kind]?.label}</span>
        <span className="tag">Depth: {LEVELS[c.level]}</span>
      </div>

      {first.length > 0 && (
        <section className="first">
          <h2>Know these first</h2>
          <div className="chips">
            {first.map((p) => (
              <a key={p} className="chip" href={hrefFor(mode, p)}>
                {done.has(p) && (
                  <span className="ok">
                    <Icon name="tick" />
                    <span className="sr-only">understood</span>
                  </span>
                )}
                {NODE_BY_ID[p].title}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="sec">
        <h2>What is it?</h2>
        <Paragraphs value={c.what} />
      </section>

      <section className="note">
        <h2>Real-world example</h2>
        <div className="ruled">
          <Paragraphs value={c.example} />
        </div>
      </section>

      {c.why && (
        <section className="sec">
          <h2>Why does it matter?</h2>
          <Paragraphs value={c.why} />
        </section>
      )}

      {c.details?.length > 0 && (
        <section className="sec">
          <h2>How it works</h2>
          <List items={c.details} />
        </section>
      )}

      {(c.pros?.length > 0 || c.cons?.length > 0) && (
        <div className="cols">
          {c.pros?.length > 0 && (
            <section className="box good">
              <h2>Good</h2>
              <List items={c.pros} />
            </section>
          )}
          {c.cons?.length > 0 && (
            <section className="box bad">
              <h2>Watch out</h2>
              <List items={c.cons} />
            </section>
          )}
        </div>
      )}

      {c.remember && (
        <section className="card-remember">
          <h2>Remember</h2>
          <p>
            <Rich text={c.remember} />
          </p>
        </section>
      )}

      {confused.map((x) => (
        <section key={x.id} className="confuse">
          <h2>
            <Icon name="warn" /> Don't confuse with <a href={hrefFor(mode, x.id)}>{NODE_BY_ID[x.id].title}</a>
          </h2>
          <p>
            <Rich text={x.note} />
          </p>
        </section>
      ))}

      {c.sources?.length > 0 && (
        <section className="sec more">
          <h2>Learn more</h2>
          <ul>
            {c.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {footer && <div className="actions">{footer}</div>}
    </article>
  );
}

export function DoneButton({ id, done, onToggle }) {
  const isDone = done.has(id);
  return (
    <button type="button" className={`btn ${isDone ? "done" : ""}`} onClick={() => onToggle(id)} aria-pressed={isDone}>
      {isDone ? (
        <>
          <Icon name="tick" /> Understood
        </>
      ) : (
        "I understand this"
      )}
    </button>
  );
}
