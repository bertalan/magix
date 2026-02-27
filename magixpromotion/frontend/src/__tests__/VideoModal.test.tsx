/**
 * Test suite per il componente VideoModal (lite YouTube embed).
 *
 * Verifica: rendering, embed URL, parseVideoUrl, lite embed (thumbnail + click-to-play),
 * chiusura (Escape/backdrop/X), a11y attributes, gestione URL non supportati, body scroll lock.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VideoModal, { getEmbedUrl, parseVideoUrl } from "../components/VideoModal";

// --- Unit test per getEmbedUrl ---

describe("getEmbedUrl", () => {
  it("converte URL YouTube standard in embed", () => {
    const url = "https://www.youtube.com/watch?v=EpIhJzo7apY";
    expect(getEmbedUrl(url)).toBe(
      "https://www.youtube.com/embed/EpIhJzo7apY?autoplay=1&rel=0"
    );
  });

  it("converte URL youtu.be short link", () => {
    const url = "https://youtu.be/111YapUfdEo";
    expect(getEmbedUrl(url)).toBe(
      "https://www.youtube.com/embed/111YapUfdEo?autoplay=1&rel=0"
    );
  });

  it("converte URL Dailymotion dai.ly", () => {
    const url = "https://dai.ly/x71bykc";
    expect(getEmbedUrl(url)).toBe(
      "https://www.dailymotion.com/embed/video/x71bykc?autoplay=1"
    );
  });

  it("converte URL Dailymotion completo", () => {
    const url = "http://dai.ly/x6ip9v7";
    expect(getEmbedUrl(url)).toBe(
      "https://www.dailymotion.com/embed/video/x6ip9v7?autoplay=1"
    );
  });

  it("restituisce null per URL vuoto", () => {
    expect(getEmbedUrl("")).toBeNull();
  });

  it("restituisce null per URL non riconosciuto", () => {
    expect(getEmbedUrl("https://example.com/some-video")).toBeNull();
  });

  it("restituisce l'URL se contiene /embed/", () => {
    const url = "https://www.youtube.com/embed/abc123?autoplay=1";
    expect(getEmbedUrl(url)).toBe(url);
  });

  it("converte anche URL youtube-nocookie.com", () => {
    const url = "https://www.youtube-nocookie.com/embed/EpIhJzo7apY";
    expect(getEmbedUrl(url)).toBe(
      "https://www.youtube.com/embed/EpIhJzo7apY?autoplay=1&rel=0"
    );
  });
});

// --- Unit test per parseVideoUrl ---

describe("parseVideoUrl", () => {
  it("restituisce info complete per YouTube standard", () => {
    const info = parseVideoUrl("https://www.youtube.com/watch?v=EpIhJzo7apY");
    expect(info).not.toBeNull();
    expect(info!.provider).toBe("youtube");
    expect(info!.embedUrl).toContain("youtube.com/embed/EpIhJzo7apY");
    expect(info!.thumbnailUrl).toBe(
      "https://img.youtube.com/vi/EpIhJzo7apY/maxresdefault.jpg"
    );
  });

  it("restituisce info per youtu.be short link", () => {
    const info = parseVideoUrl("https://youtu.be/111YapUfdEo");
    expect(info!.provider).toBe("youtube");
    expect(info!.thumbnailUrl).toContain("111YapUfdEo");
  });

  it("restituisce info Dailymotion senza thumbnail", () => {
    const info = parseVideoUrl("https://dai.ly/x71bykc");
    expect(info!.provider).toBe("dailymotion");
    expect(info!.thumbnailUrl).toBeNull();
    expect(info!.embedUrl).toContain("dailymotion.com/embed/video/x71bykc");
  });

  it("restituisce provider generic per embed URL", () => {
    const info = parseVideoUrl("https://player.vimeo.com/video/123");
    expect(info!.provider).toBe("generic");
    expect(info!.thumbnailUrl).toBeNull();
  });

  it("restituisce null per URL non riconosciuto", () => {
    expect(parseVideoUrl("https://example.com/not-a-video")).toBeNull();
  });

  it("restituisce null per stringa vuota", () => {
    expect(parseVideoUrl("")).toBeNull();
  });
});

// --- Component test per VideoModal ---

describe("VideoModal", () => {
  const defaultProps = {
    videoUrl: "https://www.youtube.com/watch?v=EpIhJzo7apY",
    artistName: "RED MOON",
    onClose: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onClose.mockClear();
  });

  it("renderizza il modal con ruolo dialog e aria-modal", () => {
    render(<VideoModal {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute(
      "aria-label",
      "Video promo di RED MOON"
    );
  });

  it("mostra il nome dell'artista nell'header", () => {
    render(<VideoModal {...defaultProps} />);
    expect(screen.getByText("RED MOON")).toBeInTheDocument();
    expect(screen.getByText("VIDEO PROMO")).toBeInTheDocument();
  });

  // --- Lite embed: thumbnail-first ---

  it("mostra il thumbnail YouTube prima del click (lite embed)", () => {
    render(<VideoModal {...defaultProps} />);
    // Non deve esserci un iframe inizialmente
    expect(screen.queryByTitle("Video promo di RED MOON")).not.toBeInTheDocument();
    // Deve esserci il thumbnail
    const thumb = screen.getByAltText("Anteprima video RED MOON");
    expect(thumb).toBeInTheDocument();
    expect(thumb).toHaveAttribute(
      "src",
      "https://img.youtube.com/vi/EpIhJzo7apY/maxresdefault.jpg"
    );
  });

  it("mostra il pulsante play sul thumbnail", () => {
    render(<VideoModal {...defaultProps} />);
    const playBtn = screen.getByLabelText("Avvia video promo di RED MOON");
    expect(playBtn).toBeInTheDocument();
  });

  it("carica l'iframe solo dopo il click sul thumbnail", async () => {
    const user = userEvent.setup();
    render(<VideoModal {...defaultProps} />);
    // Nessun iframe iniziale
    expect(screen.queryByTitle("Video promo di RED MOON")).not.toBeInTheDocument();
    // Click sul play
    const playBtn = screen.getByLabelText("Avvia video promo di RED MOON");
    await user.click(playBtn);
    // Ora l'iframe deve essere presente
    const iframe = screen.getByTitle("Video promo di RED MOON");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("youtube.com/embed/EpIhJzo7apY")
    );
    expect(iframe).toHaveAttribute("allowFullScreen");
  });

  it("mostra etichetta YouTube sul thumbnail", () => {
    render(<VideoModal {...defaultProps} />);
    expect(screen.getByText("YouTube")).toBeInTheDocument();
  });

  it("mostra etichetta Dailymotion per video Dailymotion", () => {
    render(
      <VideoModal
        {...defaultProps}
        videoUrl="https://dai.ly/x71bykc"
        artistName="MISTER JUMP"
      />
    );
    expect(screen.getByText("Dailymotion")).toBeInTheDocument();
  });

  // --- Fallback per URL sconosciuto ---

  it("mostra fallback con link esterno per URL non supportati", () => {
    render(
      <VideoModal
        {...defaultProps}
        videoUrl="https://example.com/not-a-video"
      />
    );
    expect(screen.getByText("Video non disponibile per l'embed")).toBeInTheDocument();
    expect(screen.getByText("Apri su YouTube")).toHaveAttribute(
      "href",
      "https://example.com/not-a-video"
    );
  });

  // --- Chiusura ---

  it("chiude il modal con Escape", async () => {
    render(<VideoModal {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("chiude il modal cliccando sul pulsante X", async () => {
    const user = userEvent.setup();
    render(<VideoModal {...defaultProps} />);
    const closeBtn = screen.getByLabelText("Chiudi video");
    await user.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("chiude il modal cliccando sul backdrop", async () => {
    const user = userEvent.setup();
    render(<VideoModal {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    // Click direttamente sul dialog (backdrop area)
    await user.click(dialog);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  // --- Scroll lock ---

  it("blocca lo scroll del body quando aperto", () => {
    const { unmount } = render(<VideoModal {...defaultProps} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    // Dopo unmount, lo scroll viene ripristinato
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  // --- Dailymotion (click-to-play) ---

  it("gestisce URL Dailymotion con click-to-play", async () => {
    const user = userEvent.setup();
    render(
      <VideoModal
        {...defaultProps}
        videoUrl="https://dai.ly/x71bykc"
        artistName="MISTER JUMP"
      />
    );
    // Click per attivare
    const playBtn = screen.getByLabelText("Avvia video promo di MISTER JUMP");
    await user.click(playBtn);
    const iframe = screen.getByTitle("Video promo di MISTER JUMP");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("dailymotion.com/embed/video/x71bykc")
    );
  });

  // --- Iframe attributes ---

  it("l'iframe contiene gli attributi allow corretti", async () => {
    const user = userEvent.setup();
    render(<VideoModal {...defaultProps} />);
    const playBtn = screen.getByLabelText("Avvia video promo di RED MOON");
    await user.click(playBtn);
    const iframe = screen.getByTitle("Video promo di RED MOON");
    const allowAttr = iframe.getAttribute("allow") || "";
    expect(allowAttr).toContain("autoplay");
    expect(allowAttr).toContain("accelerometer");
    expect(allowAttr).toContain("gyroscope");
    expect(allowAttr).toContain("encrypted-media");
    expect(allowAttr).toContain("clipboard-write");
    expect(allowAttr).toContain("web-share");
  });

  it("l'iframe ha referrerPolicy strict-origin-when-cross-origin", async () => {
    const user = userEvent.setup();
    render(<VideoModal {...defaultProps} />);
    const playBtn = screen.getByLabelText("Avvia video promo di RED MOON");
    await user.click(playBtn);
    const iframe = screen.getByTitle("Video promo di RED MOON");
    expect(iframe).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  });
});
