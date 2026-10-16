import { useEffect } from "react";
import Header from "./components/Header.jsx";
import LearnView from "./views/LearnView.jsx";
import BrowseView from "./views/BrowseView.jsx";
import ExploreView from "./views/ExploreView.jsx";
import { useProgress } from "./hooks/useProgress.js";
import { useTheme } from "./hooks/useTheme.js";
import { replaceHash, useRoute } from "./utils/route.js";
import { storage } from "./utils/storage.js";

export default function App() {
  const route = useRoute();
  const { done, toggle } = useProgress();
  const theme = useTheme();

  // No mode in the URL: open the mode used last time (Learn for first-time visitors).
  // Old links like #redundancy are turned into #/learn/redundancy.
  useEffect(() => {
    if (!route.mode) replaceHash(`#/${storage.get("mode", "learn")}`);
    else if (route.legacy) replaceHash(`#/learn/${route.a}`);
    else storage.set("mode", route.mode);
  }, [route]);

  // New page: start at the top (Explore keeps its map in place).
  useEffect(() => {
    if (route.mode !== "explore") window.scrollTo(0, 0);
  }, [route.mode, route.a, route.b]);

  if (!route.mode) return null;

  return (
    <>
      <Header mode={route.mode} onToggleTheme={theme.toggle} />
      <main key={route.mode === "explore" ? "explore" : window.location.hash}>
        {route.mode === "learn" && <LearnView id={route.a} done={done} onToggle={toggle} />}
        {route.mode === "browse" && <BrowseView concernId={route.a} conceptId={route.b} done={done} onToggle={toggle} />}
        {route.mode === "explore" && <ExploreView id={route.a} done={done} />}
      </main>
    </>
  );
}
