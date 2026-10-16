import { useEffect } from "react";

/** ← and → go to the previous / next page (ignored while typing). */
export function useArrowKeys(prevHref, nextHref) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest("input, textarea") || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowRight" && nextHref) window.location.hash = nextHref;
      if (e.key === "ArrowLeft" && prevHref) window.location.hash = prevHref;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref]);
}
