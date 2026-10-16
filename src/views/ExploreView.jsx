import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CONCERN_BY_ID, KINDS, NODE_BY_ID, PATH, confusedWith, leadsTo, prereqs, relatedTo } from "../data/index.js";
import { layoutLocalMap } from "./localMapLayout.js";
import { storage } from "../utils/storage.js";
import { Rich } from "../utils/RichText.jsx";
import Icon from "../components/Icon.jsx";

const MOVE_MS = 560; // matches the pill transition in App.css

function neighbourhood(id) {
  const nodes = [
    { id, role: "center" },
    ...prereqs(id).map((x) => ({ id: x, role: "pre" })),
    ...leadsTo(id).map((x) => ({ id: x, role: "lead" })),
    ...relatedTo(id).map((x) => ({ id: x.id, role: "related", title: x.sentence })),
    ...confusedWith(id).map((x) => ({ id: x.id, role: "confused" }))
  ];
  return nodes.filter((n, i) => nodes.findIndex((m) => m.id === n.id) === i);
}

function LocalMap({ id, done }) {
  const areaRef = useRef(null);
  const pillRefs = useRef(new Map());
  const layoutRef = useRef({ pos: {}, labels: [], wires: [] });
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [layout, setLayout] = useState(layoutRef.current);
  const [showWires, setShowWires] = useState(false);
  const [leaving, setLeaving] = useState([]);
  const [hover, setHover] = useState(null);
  const nodes = useMemo(() => neighbourhood(id), [id]);
  const prevNodes = useRef([]);

  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(areaRef.current);
    return () => ro.disconnect();
  }, []);

  // Measure the pills, compute where they go, then let CSS slide them there.
  useLayoutEffect(() => {
    if (!size.w) return;
    const measured = nodes.map((n) => {
      const el = pillRefs.current.get(n.id);
      return { ...n, w: el?.offsetWidth ?? 120, h: el?.offsetHeight ?? 40 };
    });
    const next = layoutLocalMap(measured, size.w, size.h);

    // Pills that are no longer needed fade out where they were.
    const keep = new Set(nodes.map((n) => n.id));
    const gone = prevNodes.current.filter((n) => !keep.has(n.id) && layoutRef.current.pos[n.id]);
    prevNodes.current = nodes;
    setLeaving(gone.map((n) => ({ ...n, ...layoutRef.current.pos[n.id] })));

    setShowWires(false);
    const frame = requestAnimationFrame(() => {
      layoutRef.current = next;
      setLayout(next);
    });
    const wiresTimer = setTimeout(() => setShowWires(true), MOVE_MS);
    const leaveTimer = setTimeout(() => setLeaving([]), 450);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(wiresTimer);
      clearTimeout(leaveTimer);
    };
  }, [nodes, size]);

  const startAt = { x: size.w / 2 - 60, y: size.h / 2 - 20 };

  const pill = (n, isLeaving = false) => {
    const p = isLeaving ? n : layout.pos[n.id];
    const at = p ?? startAt;
    const c = NODE_BY_ID[n.id];
    return (
      <a
        key={(isLeaving ? "gone-" : "") + n.id}
        ref={isLeaving ? undefined : (el) => (el ? pillRefs.current.set(n.id, el) : pillRefs.current.delete(n.id))}
        href={`#/explore/${n.id}`}
        title={n.title}
        className={`pill ${n.role} ${!p || isLeaving ? "hidden" : ""}`}
        style={{ transform: `translate(${at.x}px, ${at.y}px)` }}
        tabIndex={isLeaving ? -1 : undefined}
        aria-hidden={isLeaving || undefined}
        onMouseEnter={() => setHover(n.id)}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(n.id)}
        onBlur={() => setHover(null)}
      >
        <span className="dot" style={{ background: CONCERN_BY_ID[c.concern].color }} />
        {c.title}
        {done.has(n.id) && n.role !== "center" && (
          <span className="ok">
            <Icon name="tick" />
            <span className="sr-only">understood</span>
          </span>
        )}
      </a>
    );
  };

  return (
    <div className="map-wrap" ref={areaRef}>
      <svg className={`wires ${showWires ? "" : "hide"}`} aria-hidden="true">
        {showWires &&
          layout.wires.map((w) => (
            <path key={w.kind + w.id} d={w.d} className={`${w.kind} ${hover === w.id || hover === id ? "hot" : ""}`} />
          ))}
      </svg>
      {layout.labels.map((l) => (
        <div key={l.text} className="col-label" style={{ left: l.x, top: l.y }}>
          {l.text}
        </div>
      ))}
      {leaving.map((n) => pill(n, true))}
      {nodes.map((n) => pill(n))}
      <div className="map-hint">Click a concept to move it to the centre</div>
    </div>
  );
}

function Summary({ id }) {
  const c = NODE_BY_ID[id];
  const concern = CONCERN_BY_ID[c.concern];
  return (
    <aside className="summary" aria-live="polite">
      <div className="eyebrow">
        <span className="dot" style={{ background: concern.color }} />
        {concern.name} · {KINDS[c.kind]?.label}
      </div>
      <h2>{c.title}</h2>
      <p className="lede">
        <Rich text={c.short} />
      </p>
      {c.remember && (
        <section className="card-remember">
          <h2>Remember</h2>
          <p>
            <Rich text={c.remember} />
          </p>
        </section>
      )}
      <a className="btn primary" href={`#/learn/${id}`}>
        Read the full explanation <Icon name="right" />
      </a>
      <a className="btn" href={`#/browse/${c.concern}/${id}`}>
        Open in {concern.name}
      </a>
    </aside>
  );
}

export default function ExploreView({ id, done }) {
  // No concept in the URL: reopen the last one explored.
  const current = NODE_BY_ID[id] ? id : NODE_BY_ID[storage.get("explore")] ? storage.get("explore") : PATH[1];
  useEffect(() => storage.set("explore", current), [current]);

  return (
    <div className="explore">
      <LocalMap id={current} done={done} />
      <Summary id={current} />
    </div>
  );
}
