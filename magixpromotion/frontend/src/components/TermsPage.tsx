/**
 * TermsPage — Termini e condizioni del servizio.
 * Contenuto statico con dati aziendali dal CMS (SiteSettings).
 */
import React from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { FileText } from "lucide-react";

const TermsPage: React.FC = () => {
  const { data: settings } = useSiteSettings();
  const companyName = settings?.company_name || "Magix Promotion";
  const email = settings?.email || "info@magixpromotion.it";

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[var(--accent)] text-sm font-bold tracking-widest mb-6">
          <FileText size={16} />
          LEGALE
        </div>
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tighter mb-6 text-[var(--text-main)]">
          TERMINI E <span className="gradient-text">CONDIZIONI</span>
        </h1>
        <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
          Condizioni generali di utilizzo del sito e dei servizi offerti.
        </p>
      </div>

      {/* Contenuto */}
      <div className="glass-panel rounded-[2rem] p-8 md:p-12 border border-[var(--glass-border)]">
        <div className="prose-custom flex flex-col gap-10 text-[var(--text-muted)] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              PREMESSA
            </h2>
            <p>
              I presenti Termini e Condizioni regolano l'utilizzo del sito web di{" "}
              <strong className="text-[var(--text-main)]">{companyName}</strong> e dei servizi
              di booking e management artistico offerti. L'utilizzo del sito implica l'accettazione
              integrale delle presenti condizioni.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              SERVIZI OFFERTI
            </h2>
            <p>
              {companyName} offre servizi di:
            </p>
            <ul className="list-disc list-inside mt-3 flex flex-col gap-1.5">
              <li>Booking e management di artisti e band</li>
              <li>Organizzazione di eventi musicali</li>
              <li>Consulenza per la selezione di artisti</li>
              <li>Preventivi personalizzati per eventi privati e pubblici</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              RICHIESTE DI PREVENTIVO
            </h2>
            <p>
              Le richieste inviate tramite il form di contatto non costituiscono un contratto
              vincolante. Il preventivo verrà formulato sulla base delle informazioni fornite e
              comunicato all'indirizzo email indicato. L'accettazione del preventivo da parte
              del cliente e la conferma da parte di {companyName} costituiranno il perfezionamento
              dell'accordo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              PROPRIETÀ INTELLETTUALE
            </h2>
            <p>
              Tutti i contenuti del sito — testi, immagini, loghi, video, grafica — sono
              di proprietà di {companyName} o dei rispettivi titolari e sono protetti
              dalle leggi sul diritto d'autore. È vietata qualsiasi riproduzione, distribuzione
              o utilizzo non autorizzato.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              LIMITAZIONE DI RESPONSABILITÀ
            </h2>
            <p>
              {companyName} si impegna a mantenere le informazioni del sito accurate e aggiornate,
              ma non garantisce la completezza o l'assenza di errori. Le date degli eventi, i prezzi
              e la disponibilità degli artisti sono soggetti a variazioni e vanno confermati tramite
              preventivo ufficiale.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              LEGGE APPLICABILE
            </h2>
            <p>
              I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia
              sarà competente il Foro di Alessandria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              CONTATTI
            </h2>
            <p>
              Per domande relative ai presenti Termini, scrivi a{" "}
              <a href={`mailto:${email}`} className="text-[var(--accent)] hover:underline">{email}</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
