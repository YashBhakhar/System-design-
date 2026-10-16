import { useEffect, useMemo, useRef, useState } from "react";
import { CONCERN_BY_ID, NODE_BY_ID, PATH } from "../data/index.js";
import Icon from "./Icon.jsx";
import { Rich } from "../utils/RichText.jsx";

// Best matches first: title start > title > alias > one-line meaning.
function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PATH.map((id) => NODE_BY_ID[id])
    .map((n) => {
      const title = n.title.toLowerCase();
      const score = title.startsWith(q)
        ? 4
        : title.includes(q)
          ? 3
          : n.aliases?.some((a) => a.toLowerCase().includes(q))
            ? 2
            : n.short.toLowerCase().includes(q)
              ? 1
              : 0;
      return { n, score };
    })
    .filter((x) => x.score)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.n);
}

export default function SearchBar({ onPick }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const results = useMemo(() => search(query), [query]);

  useEffect(() => setActive(0), [query]);

  // Press "/" anywhere to jump to search.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.target.closest("input, textarea")) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pick = (node) => {
    onPick(node.id);
    setQuery("");
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      pick(results[active]);
    } else if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  const showList = open && query.trim() !== "";

  return (
    <div className="search">
      <label htmlFor="search">
        <Icon name="search" />
        <span className="sr-only">Search concepts</span>
      </label>
      <input
        ref={inputRef}
        id="search"
        type="search"
        placeholder="Search"
        autoComplete="off"
        aria-expanded={showList}
        aria-controls="search-results"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {showList && (
        <ul id="search-results" className="results" role="listbox">
          {results.length === 0 && <li className="results-empty">No concept found</li>}
          {results.map((n, i) => (
            <li
              key={n.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : ""}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(n);
              }}
            >
              <b>{n.title}</b>
              <small>
                {CONCERN_BY_ID[n.concern]?.name} · <Rich text={n.short} />
              </small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
