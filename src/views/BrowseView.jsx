import { CONCERNS, CONCERN_BY_ID, KINDS, LANES, NODE_BY_ID, conceptsIn } from "../data/index.js";
import { countDone } from "../hooks/useProgress.js";
import { useArrowKeys } from "../hooks/useArrowKeys.js";
import ConceptPage, { DoneButton } from "../components/ConceptPage.jsx";
import Icon from "../components/Icon.jsx";
import { Rich } from "../utils/RichText.jsx";

const tint = (color) => ({ color, background: `color-mix(in srgb, ${color} 12%, transparent)` });

function ConcernGrid({ done }) {
  return (
    <div className="wrap">
      <h1>Browse by concern</h1>
      <p className="lede">Every concept is grouped by the problem it deals with. Pick an area.</p>
      <div className="grid">
        {CONCERNS.map((k) => {
          const ids = conceptsIn(k.id);
          if (k.comingSoon) {
            return (
              <div key={k.id} className="ccard soon">
                <div className="ico" style={tint(k.color)}>
                  <Icon name={k.icon} />
                </div>
                <span className="badge">Coming soon</span>
                <h2>{k.name}</h2>
                <p>{k.blurb}</p>
                <div className="meta">{k.comingSoon.join(" · ")}</div>
              </div>
            );
          }
          const { n, pct } = countDone(ids, done);
          return (
            <a key={k.id} className="ccard" href={`#/browse/${k.id}`}>
              <div className="ico" style={tint(k.color)}>
                <Icon name={k.icon} />
              </div>
              <h2>{k.name}</h2>
              <p>{k.blurb}</p>
              <div className="meta">
                {ids.length} concepts · {n} understood
              </div>
              <div className="bar">
                <i style={{ width: `${pct}%` }} />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ConcernLanes({ concern, done }) {
  const ids = conceptsIn(concern.id);
  return (
    <div className="wrap">
      <a className="back" href="#/browse">
        <Icon name="left" /> All concerns
      </a>
      <h1>{concern.name}</h1>
      <p className="lede">{concern.blurb}</p>
      <div className="lanes">
        {LANES.map((lane) => {
          const inLane = ids.filter((id) => KINDS[NODE_BY_ID[id].kind]?.lane === lane.id);
          return (
            <section key={lane.id} className="lane">
              <h2>{lane.title}</h2>
              <p>{lane.hint}</p>
              <div className="lane-list">
                {inLane.length === 0 && <div className="empty">Nothing here yet</div>}
                {inLane.map((id) => (
                  <a key={id} className="mini" href={`#/browse/${concern.id}/${id}`}>
                    <b>
                      {NODE_BY_ID[id].title}
                      {done.has(id) && (
                        <span className="ok">
                          <Icon name="tick" />
                          <span className="sr-only">understood</span>
                        </span>
                      )}
                    </b>
                    <small>
                      <Rich text={NODE_BY_ID[id].short} />
                    </small>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BrowseConcept({ concern, id, done, onToggle }) {
  const ids = conceptsIn(concern.id);
  const i = ids.indexOf(id);
  const prevHref = ids[i - 1] && `#/browse/${concern.id}/${ids[i - 1]}`;
  const nextHref = ids[i + 1] && `#/browse/${concern.id}/${ids[i + 1]}`;
  useArrowKeys(prevHref, nextHref);

  return (
    <div className="browse-page">
      <aside className="side" aria-label={`Concepts in ${concern.name}`}>
        <nav className="crumbs" aria-label="Breadcrumb">
          <a href="#/browse">Browse</a>
          <span aria-hidden="true">/</span>
          <a href={`#/browse/${concern.id}`}>{concern.name}</a>
        </nav>
        <ol className="steps">
          {ids.map((x) => (
            <li key={x}>
              <a
                href={`#/browse/${concern.id}/${x}`}
                className={`step ${done.has(x) ? "done" : ""} ${x === id ? "current" : ""}`}
                aria-current={x === id ? "page" : undefined}
              >
                <span className="n">{done.has(x) && <Icon name="tick" />}</span>
                {NODE_BY_ID[x].title}
              </a>
            </li>
          ))}
        </ol>
      </aside>
      <ConceptPage
        key={id}
        id={id}
        mode="browse"
        done={done}
        top={
          <a className="back" href={`#/browse/${concern.id}`}>
            <Icon name="left" /> Back to {concern.name}
          </a>
        }
        eyebrow={`${concern.name} · ${i + 1} of ${ids.length}`}
        footer={
          <>
            <div className="nav-btns">
              <DoneButton id={id} done={done} onToggle={onToggle} />
              <a className="btn" href={`#/explore/${id}`}>
                See it on the map
              </a>
            </div>
            <div className="nav-btns">
              <a className="btn" href={prevHref} aria-disabled={!prevHref}>
                <Icon name="left" /> Previous
              </a>
              <a className="btn primary" href={nextHref ?? `#/browse/${concern.id}`}>
                {nextHref ? `Next: ${NODE_BY_ID[ids[i + 1]].title}` : `Back to ${concern.name}`} <Icon name="right" />
              </a>
            </div>
          </>
        }
      />
    </div>
  );
}

export default function BrowseView({ concernId, conceptId, done, onToggle }) {
  const concern = CONCERN_BY_ID[concernId];
  if (!concern || concern.comingSoon) return <ConcernGrid done={done} />;
  if (NODE_BY_ID[conceptId]?.concern === concern.id) {
    return <BrowseConcept concern={concern} id={conceptId} done={done} onToggle={onToggle} />;
  }
  return <ConcernLanes concern={concern} done={done} />;
}
