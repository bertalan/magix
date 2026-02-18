import { useState, useEffect } from "react";

/**
 * Hook that detects user preference for reduced motion.
 * Returns true when `prefers-reduced-motion: reduce` is active.
 * Listens for changes so it reacts to system settings toggles in real time.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
