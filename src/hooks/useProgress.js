import { useCallback, useState } from "react";
import { storage } from "../utils/storage.js";

/** Which concepts this viewer marked "I understand this". */
export function useProgress() {
  const [done, setDone] = useState(() => new Set(storage.get("done", [])));

  const toggle = useCallback((id) => {
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      storage.set("done", [...next]);
      return next;
    });
  }, []);

  return { done, toggle };
}

export function countDone(ids, done) {
  const n = ids.filter((id) => done.has(id)).length;
  return { n, pct: ids.length ? Math.round((n / ids.length) * 100) : 0 };
}
