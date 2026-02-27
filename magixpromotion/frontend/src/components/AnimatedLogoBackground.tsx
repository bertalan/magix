import React, { useEffect, useRef } from "react";

/**
 * AnimatedLogoBackground
 *
 * Sfondo globale: diverse "m" Monoton semitrasparenti che fluttuano,
 * ruotano e si ingrandiscono fino a uscire dallo schermo, poi vengono
 * riciclate. Disegnate su un <canvas> fissato dietro tutti i contenuti
 * → zero impatto sul DOM / repaint, alta performance.
 *
 * Rispetta le variabili CSS del tema (--accent, --accent-secondary)
 * e si ferma automaticamente con `prefers-reduced-motion`.
 */

interface Particle {
  x: number;          // posizione corrente X (0–1 normalizzata)
  y: number;          // posizione corrente Y (0–1 normalizzata)
  scale: number;      // scala corrente
  scaleSpeed: number; // velocità di crescita
  rotation: number;   // angolo corrente (rad)
  rotSpeed: number;   // velocità rotazione (rad/frame)
  dx: number;         // drift X per frame
  dy: number;         // drift Y per frame
  opacity: number;    // opacità corrente
  opacityMax: number; // opacità massima
  phase: number;      // fase nel ciclo vita (0→1)
  color: string;      // colore accent
}

const PARTICLE_COUNT = 6;          // poche → elegante, non invasivo
const MAX_SCALE = 8;               // scala max prima di riciclo
const FADE_IN_END = 0.15;          // fase in cui raggiunge opacità max
const FADE_OUT_START = 0.7;        // fase in cui inizia a sfumare

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function spawnParticle(colors: string[]): Particle {
  return {
    x: randomBetween(0.1, 0.9),
    y: randomBetween(0.1, 0.9),
    scale: randomBetween(0.3, 1),
    scaleSpeed: randomBetween(0.003, 0.008),
    rotation: randomBetween(0, Math.PI * 2),
    rotSpeed: randomBetween(-0.004, 0.004),
    dx: randomBetween(-0.0004, 0.0004),
    dy: randomBetween(-0.0006, 0.0002),    // tendenza leggera verso l'alto
    opacity: 0,
    opacityMax: randomBetween(0.04, 0.10),  // molto bassa → sfondo sottile
    phase: 0,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

function getThemeColors(): string[] {
  const style = getComputedStyle(document.documentElement);
  const accent = style.getPropertyValue("--accent").trim() || "#ff00f7";
  const secondary = style.getPropertyValue("--accent-secondary").trim() || "#7000ff";
  return [accent, secondary];
}

const AnimatedLogoBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    // Rispetta prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- Resize handler ---
    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // --- Particelle iniziali ---
    const colors = getThemeColors();
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      spawnParticle(colors)
    );
    // Sfasare le fasi iniziali per avere un ciclo continuo
    particlesRef.current.forEach((p, i) => {
      p.phase = i / PARTICLE_COUNT;
      p.scale = 0.3 + (p.phase * MAX_SCALE * 0.6);
      p.opacity = p.phase > FADE_IN_END && p.phase < FADE_OUT_START
        ? p.opacityMax
        : 0;
    });

    // --- Testo "m" pre-renderizzato su offscreen canvas ---
    // Lo creiamo una volta per evitare di impostare il font ogni frame
    const glyphCanvas = document.createElement("canvas");
    const glyphSize = 256;
    glyphCanvas.width = glyphSize;
    glyphCanvas.height = glyphSize;
    const glyphCtx = glyphCanvas.getContext("2d")!;
    glyphCtx.textAlign = "center";
    glyphCtx.textBaseline = "middle";
    glyphCtx.font = `${glyphSize * 0.7}px Monoton, cursive`;
    glyphCtx.fillStyle = "#ffffff";
    glyphCtx.fillText("m", glyphSize / 2, glyphSize / 2 + glyphSize * 0.03);

    // --- Loop di animazione ---
    function animate() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      for (const p of particlesRef.current) {
        // Avanza fase
        p.phase += 0.001;
        p.scale += p.scaleSpeed;
        p.rotation += p.rotSpeed;
        p.x += p.dx;
        p.y += p.dy;

        // Calcola opacità con fade-in / fade-out
        if (p.phase < FADE_IN_END) {
          p.opacity = (p.phase / FADE_IN_END) * p.opacityMax;
        } else if (p.phase < FADE_OUT_START) {
          p.opacity = p.opacityMax;
        } else if (p.phase < 1) {
          p.opacity = ((1 - p.phase) / (1 - FADE_OUT_START)) * p.opacityMax;
        } else {
          p.opacity = 0;
        }

        // Ricicla se completamente fuori o troppo grande
        if (p.phase >= 1 || p.scale > MAX_SCALE) {
          const newColors = getThemeColors();
          Object.assign(p, spawnParticle(newColors));
          continue;
        }

        // Disegna
        const px = p.x * w;
        const py = p.y * h;
        const size = glyphSize * p.scale;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(px, py);
        ctx.rotate(p.rotation);

        // Tinta con il colore accent: usiamo globalCompositeOperation
        // Disegniamo il glyph bianco e lo coloriamo
        ctx.drawImage(glyphCanvas, -size / 2, -size / 2, size, size);

        // Sovrapposizione colore
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = p.color;
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.globalCompositeOperation = "source-over";

        ctx.restore();
      }

      frameRef.current = requestAnimationFrame(animate);
    }

    // Avvia dopo che il font Monoton è disponibile
    document.fonts.ready.then(() => {
      // Ridisegna il glyph con il font caricato
      glyphCtx.clearRect(0, 0, glyphSize, glyphSize);
      glyphCtx.font = `${glyphSize * 0.7}px Monoton, cursive`;
      glyphCtx.fillStyle = "#ffffff";
      glyphCtx.fillText("m", glyphSize / 2, glyphSize / 2 + glyphSize * 0.03);
      frameRef.current = requestAnimationFrame(animate);
    });

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
};

export default AnimatedLogoBackground;
