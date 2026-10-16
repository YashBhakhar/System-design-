import { MODES, hrefFor } from "../utils/route.js";
import SearchBar from "./SearchBar.jsx";
import Icon from "./Icon.jsx";

const LABELS = { learn: "Learn", browse: "Browse", explore: "Explore" };

export default function Header({ mode, onToggleTheme }) {
  return (
    <header className="top">
      <nav className="seg" aria-label="Mode">
        {MODES.map((m) => (
          <a key={m} href={`#/${m}`} aria-current={m === mode ? "page" : undefined}>
            {LABELS[m]}
          </a>
        ))}
      </nav>
      <div className="brand">
        Concept Map <span>· System Design</span>
      </div>
      <SearchBar onPick={(id) => (window.location.hash = hrefFor(mode, id))} />
      <button type="button" className="icon-btn" onClick={onToggleTheme} aria-label="Switch light or dark theme">
        <Icon name="moon" />
      </button>
    </header>
  );
}
