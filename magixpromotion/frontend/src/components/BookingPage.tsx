import React from "react";
import BookingForm from "./BookingForm";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Mail } from "lucide-react";

interface BookingPageProps {
  preselectedArtist?: string;
}

/**
 * Pagina wrapper per il form di booking.
 * Mostra una hero section con titolo e descrizione,
 * il componente BookingForm in un pannello glass,
 * e un contatto alternativo in fondo (da SiteSettings).
 */
const BookingPage: React.FC<BookingPageProps> = ({ preselectedArtist }) => {
  const { data: settings } = useSiteSettings();
  const contactEmail = settings?.email || "";

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[var(--accent)] text-sm font-bold tracking-widest mb-6">
          <Mail size={16} />
          RICHIESTA PREVENTIVO
        </div>
        <h2 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tighter mb-6 text-[var(--text-main)]">
          PRENOTA LA TUA <span className="gradient-text">BAND</span>
        </h2>
        <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
          Compila il form e riceverai un preventivo personalizzato entro 24 ore.
          Nessun impegno, solo la musica giusta per il tuo evento.
        </p>
      </div>

      {/* Form */}
      <div className="glass-panel rounded-[2rem] p-8 md:p-12 border border-[var(--glass-border)]">
        <BookingForm preselectedArtist={preselectedArtist} />
      </div>

      {/* Contatto alternativo (da SiteSettings) */}
      {contactEmail && (
        <div className="mt-12 text-center text-[var(--text-muted)] text-sm">
          <p>
            Preferisci parlare direttamente? Scrivici a{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="text-[var(--accent)] hover:underline"
            >
              {contactEmail}
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
