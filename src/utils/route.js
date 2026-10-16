import { useEffect, useState } from "react";
import { NODE_BY_ID } from "../data/index.js";

export const MODES = ["learn", "browse", "explore"];

/*
 * URLs:
 *   #/learn/<concept>
 *   #/browse   #/browse/<concern>   #/browse/<concern>/<concept>
 *   #/explore/<concept>
 * Old links like #redundancy still work (they open Learn).
 */
export function parseHash(hash) {
  const [mode, a, b] = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (MODES.includes(mode)) return { mode, a, b };
  if (NODE_BY_ID[mode]) return { mode: "learn", a: mode, legacy: true };
  return { mode: null };
}

export function hrefFor(mode, id) {
  if (mode === "browse") return `#/browse/${NODE_BY_ID[id].concern}/${id}`;
  return `#/${mode ?? "learn"}/${id}`;
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

/** Change the URL without adding a history entry, and re-render. */
export function replaceHash(hash) {
  window.history.replaceState(null, "", hash);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
