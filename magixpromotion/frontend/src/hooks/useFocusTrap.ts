import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Focus trap hook for modals and dialogs.
 *
 * - On mount, focuses the first focusable element inside the container.
 * - Traps Tab / Shift+Tab cycling within the container.
 * - Returns a ref to attach to the container element.
 *
 * The parent component is responsible for handling Escape to close.
 */
export function useFocusTrap<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Save the element that was focused before the trap opened, to restore later
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    // Focus the first focusable element
    first?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    el.addEventListener("keydown", handler);
    return () => {
      el.removeEventListener("keydown", handler);
      // Restore focus to the element that opened the modal
      previouslyFocused?.focus();
    };
  }, []);

  return ref;
}
