import { Fragment } from "react";
import { CONCERN_BY_ID, NODE_BY_ID, PATH } from "../data/index.js";
import { countDone } from "../hooks/useProgress.js";
import { useArrowKeys } from "../hooks/useArrowKeys.js";
import ConceptPage, { DoneButton } from "../components/ConceptPage.jsx";
import Icon from "../components/Icon.jsx";

function PathList({ currentId, done }) {
  // Group consecutive steps by concern.
  const groups = [];
  PATH.forEach((id, i) => {
    const concern = NODE_BY_ID[id].concern;
    if (groups.at(-1)?.concern !== concern) groups.push({ concern, steps: [] });
    groups.at(-1).steps.push({ id, n: i + 1 });
  });

  return groups.map((g) => (
    <Fragment key={g.concern + g.steps[0].id}>
      <div className="group">
        <span className="dot" style={{ background: CONCERN_BY_ID[g.concern].color }} />
        {CONCERN_BY_ID[g.concern].name}
      </div>
      <ol className="steps">
        {g.steps.map(({ id, n }) => (
          <li key={id}>
            <a
              href={`#/learn/${id}`}
              className={`step ${done.has(id) ? "done" : ""} ${id === currentId ? "current" : ""}`}
              aria-current={id === currentId ? "step" : undefined}
            >
              <span className="n">{done.has(id) ? <Icon name="tick" /> : n}</span>
              {NODE_BY_ID[id].title}
            </a>
          </li>
        ))}
      </ol>
    </Fragment>
  ));
}

export default function LearnView({ id, done, onToggle }) {
  // No concept in the URL: continue where the viewer left off.
  const current = NODE_BY_ID[id] ? id : PATH.find((x) => !done.has(x)) ?? PATH[0];
  const i = PATH.indexOf(current);
  const prev = PATH[i - 1];
  const next = PATH[i + 1];
  const { n, pct } = countDone(PATH, done);

  useArrowKeys(prev && `#/learn/${prev}`, next && `#/learn/${next}`);

  return (
    <div className="learn">
      <aside className="path" aria-label="Learning path">
        <div className="path-head">
          <h2>Learning path</h2>
          <p>
            {n} of {PATH.length} understood
          </p>
          <div className="bar">
            <i style={{ width: `${pct}%` }} />
          </div>
        </div>
        <PathList currentId={current} done={done} />
      </aside>

      <div>
        <details className="path-mobile">
          <summary>
            Step {i + 1} of {PATH.length} · {n} understood
          </summary>
          <PathList currentId={current} done={done} />
        </details>
        <ConceptPage
          key={current}
          id={current}
          mode="learn"
          done={done}
          eyebrow={`Step ${i + 1} of ${PATH.length} · ${CONCERN_BY_ID[NODE_BY_ID[current].concern].name}`}
          footer={
            <>
              <DoneButton id={current} done={done} onToggle={onToggle} />
              <div className="nav-btns">
                <a className="btn" href={prev ? `#/learn/${prev}` : undefined} aria-disabled={!prev}>
                  <Icon name="left" /> Previous
                </a>
                <a className="btn primary" href={next ? `#/learn/${next}` : undefined} aria-disabled={!next}>
                  {next ? `Next: ${NODE_BY_ID[next].title}` : "End of the path"} <Icon name="right" />
                </a>
              </div>
            </>
          }
        />
      </div>
    </div>
  );
}
