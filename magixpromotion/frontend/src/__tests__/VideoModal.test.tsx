/**
 * Test suite per il componente VideoModal.
 *
 * Verifica: rendering, embed URL, chiusura (Escape/backdrop/X),
 * a11y attributes, gestione URL non supportati, body scroll lock.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VideoModal, { getEmbedUrl } from "../components/VideoModal";

// --- Unit test per getEmbedUrl ---

describe("getEmbedUrl", () => {
  it("converte URL YouTube standard in embed nocookie", () => {
    const url = "https://www.youtube.com/watch?v=EpIhJzo7apY";
    expect(getEmbedUrl(url)).toBe(
      "https://www.youtube-nocookie.com/embed/EpIhJzo7apY?autoplay=1&rel=0&modestbranding=1"
    );
  });

  it("converte URL youtu.be short link", () => {
    const url = "https://youtu.be/111YapUfdEo";
    expect(getEmbedUrl(url)).toBe(
      "https://www.youtube-nocookie.com/embed/111YapUfdEo?autoplay=1&rel=0&modestbranding=1"
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
    const url = "https://www.youtube-nocookie.com/embed/abc123?autoplay=1";
    expect(getEmbedUrl(url)).toBe(url);
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

  it("renderizza un iframe con URL embed YouTube nocookie", () => {
    render(<VideoModal {...defaultProps} />);
    const iframe = screen.getByTitle("Video promo di RED MOON");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com/embed/EpIhJzo7apY")
    );
    expect(iframe).toHaveAttribute("allowFullScreen");
  });

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

  it("blocca lo scroll del body quando aperto", () => {
    const { unmount } = render(<VideoModal {...defaultProps} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    // Dopo unmount, lo scroll viene ripristinato
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("gestisce URL Dailymotion correttamente", () => {
    render(
      <VideoModal
        {...defaultProps}
        videoUrl="https://dai.ly/x71bykc"
        artistName="MISTER JUMP"
      />
    );
    const iframe = screen.getByTitle("Video promo di MISTER JUMP");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("dailymotion.com/embed/video/x71bykc")
    );
  });
});
