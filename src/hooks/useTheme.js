import { useEffect, useState } from "react";
import { storage } from "../utils/storage.js";

/** Light/dark theme: follows the OS until the viewer picks one. */
export function useTheme() {
  const [theme, setTheme] = useState(() => storage.get("theme", null));

  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, [theme]);

  const toggle = () => {
    const isDark = theme ? theme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = isDark ? "light" : "dark";
    storage.set("theme", next);
    setTheme(next);
  };

  return { toggle };
}
