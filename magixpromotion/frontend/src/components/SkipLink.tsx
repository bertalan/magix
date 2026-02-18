import React from "react";

/**
 * Skip-to-content link for keyboard users.
 * Hidden by default (sr-only), becomes visible on focus
 * for Tab-navigating users.
 */
const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-[var(--accent)] focus:text-[var(--bg-color)] focus:rounded-full focus:font-bold focus:tracking-wider"
    >
      Vai al contenuto principale
    </a>
  );
};

export default SkipLink;
