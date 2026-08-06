import { useEffect } from "react";
import { useLocation } from "react-router";

/** Resets scroll position to the top on every route change (React Router doesn't do this by default). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // The plain (x, y) form still respects the global `scroll-behavior:
    // smooth` CSS, which makes this visibly animate instead of landing
    // instantly like a fresh page load. Force it with an explicit option.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
