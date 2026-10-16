// Per-viewer preferences in localStorage. Never required: private windows
// or blocked storage simply fall back to the defaults.
export const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(`cm-${key}`);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`cm-${key}`, JSON.stringify(value));
    } catch {
      // ignore: storage is optional
    }
  }
};
