import React from "react";

/**
 * Logo "m" in font Monoton — due varianti:
 *
 * variant="neon"   → Proposta A: testo gradient con glow neon, senza sfondo.
 *                     L'ombra (text-shadow) crea un alone luminoso visibile
 *                     sia su sfondo scuro che chiaro.
 *
 * variant="badge"  → Proposta B: la "m" gradient dentro un badge vetro
 *                     con bordo accent e leggero stroke scuro sulla lettera
 *                     per garantire leggibilità su qualsiasi background.
 */

export type LogoVariant = "neon" | "badge";

interface MagixLogoProps {
  /** Stile del logo */
  variant?: LogoVariant;
  /** Dimensione in px (default 40) */
  size?: number;
  className?: string;
}

/* ─── Proposta A — Neon Glow ─────────────────────────────── */

const NeonLogo: React.FC<{ size: number; className?: string }> = ({
  size,
  className = "",
}) => (
  <span
    className={`magix-logo-neon ${className}`}
    aria-hidden="true"
    style={{
      fontFamily: "'Monoton', cursive",
      fontSize: size * 0.85,
      lineHeight: 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      /* Gradient text */
      background: "var(--accent-gradient)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      /* Neon glow — si adatta al tema via --accent */
      filter: "drop-shadow(0 0 6px var(--accent)) drop-shadow(0 0 14px var(--accent-secondary))",
      /* Leggero stroke per contrasto su sfondo chiaro */
      WebkitTextStroke: "0.5px var(--glass-border)",
      transform: "rotate(-6deg)",
      transition: "filter 0.3s ease, transform 0.3s ease",
      userSelect: "none",
    }}
  >
    m
  </span>
);

/* ─── Proposta B — Glass Badge ───────────────────────────── */

const BadgeLogo: React.FC<{ size: number; className?: string }> = ({
  size,
  className = "",
}) => (
  <span
    className={`magix-logo-badge ${className}`}
    aria-hidden="true"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      /* Contenitore vetro con bordo accent */
      background: "var(--glass)",
      border: "2px solid var(--accent)",
      borderRadius: size * 0.22,
      boxShadow:
        "0 0 12px color-mix(in srgb, var(--accent) 35%, transparent), var(--card-shadow)",
      transform: "rotate(-6deg)",
      transition: "box-shadow 0.3s ease, transform 0.3s ease",
      overflow: "hidden",
      userSelect: "none",
    }}
  >
    <span
      style={{
        fontFamily: "'Monoton', cursive",
        fontSize: size * 0.62,
        lineHeight: 1,
        /* Gradient text */
        background: "var(--accent-gradient)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        /* Stroke scuro per leggibilità garantita */
        WebkitTextStroke: "0.8px rgba(0,0,0,0.25)",
        /* Leggera ombra interna */
        filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
      }}
    >
      m
    </span>
  </span>
);

/* ─── Componente pubblico ────────────────────────────────── */

const MagixLogo: React.FC<MagixLogoProps> = ({
  variant = "neon",
  size = 40,
  className,
}) => {
  return variant === "badge" ? (
    <BadgeLogo size={size} className={className} />
  ) : (
    <NeonLogo size={size} className={className} />
  );
};

export default MagixLogo;
