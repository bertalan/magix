/**
 * PrivacyPage — Informativa privacy conforme GDPR.
 * Contenuto statico con dati aziendali dal CMS (SiteSettings).
 */
import React from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Shield } from "lucide-react";

const PrivacyPage: React.FC = () => {
  const { data: settings } = useSiteSettings();
  const companyName = settings?.company_name || "Magix Promotion";
  const email = settings?.email || "info@magixpromotion.it";
  const address = settings?.address;
  const fullAddress = address
    ? `${address.street}, ${address.zip_code} ${address.city} (${address.province}), ${address.country_name}`
    : "";

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[var(--accent)] text-sm font-bold tracking-widest mb-6">
          <Shield size={16} />
          INFORMATIVA
        </div>
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tighter mb-6 text-[var(--text-main)]">
          PRIVACY <span className="gradient-text">POLICY</span>
        </h1>
        <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
          Informativa sul trattamento dei dati personali ai sensi del Regolamento UE 2016/679 (GDPR).
        </p>
      </div>

      {/* Contenuto */}
      <div className="glass-panel rounded-[2rem] p-8 md:p-12 border border-[var(--glass-border)]">
        <div className="prose-custom flex flex-col gap-10 text-[var(--text-muted)] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              TITOLARE DEL TRATTAMENTO
            </h2>
            <p>
              <strong className="text-[var(--text-main)]">{companyName}</strong>
              {fullAddress && <><br />{fullAddress}</>}
              <br />Email: <a href={`mailto:${email}`} className="text-[var(--accent)] hover:underline">{email}</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              DATI RACCOLTI
            </h2>
            <p>
              Il sito raccoglie i seguenti dati personali esclusivamente attraverso il form di richiesta preventivo:
            </p>
            <ul className="list-disc list-inside mt-3 flex flex-col gap-1.5">
              <li>Nome e cognome</li>
              <li>Indirizzo email</li>
              <li>Numero di telefono (facoltativo)</li>
              <li>Informazioni sull'evento (tipologia, data, luogo)</li>
              <li>Messaggio libero (facoltativo)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              FINALITÀ DEL TRATTAMENTO
            </h2>
            <p>
              I dati sono trattati esclusivamente per rispondere alle richieste di preventivo,
              gestire le comunicazioni relative ai servizi di booking e management artistico,
              e adempiere agli obblighi di legge.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              BASE GIURIDICA
            </h2>
            <p>
              Il trattamento è basato sul consenso dell'interessato (art. 6.1.a GDPR),
              espresso tramite l'accettazione dell'informativa nel form di contatto,
              e sull'esecuzione di misure precontrattuali (art. 6.1.b GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              CONSERVAZIONE DEI DATI
            </h2>
            <p>
              I dati personali sono conservati per il tempo necessario all'evasione della richiesta
              e comunque non oltre 24 mesi dalla raccolta, salvo obblighi di legge.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              DIRITTI DELL'INTERESSATO
            </h2>
            <p>
              In qualsiasi momento puoi esercitare i diritti previsti dagli artt. 15-22 del GDPR:
            </p>
            <ul className="list-disc list-inside mt-3 flex flex-col gap-1.5">
              <li>Accesso ai propri dati personali</li>
              <li>Rettifica o cancellazione</li>
              <li>Limitazione del trattamento</li>
              <li>Portabilità dei dati</li>
              <li>Opposizione al trattamento</li>
              <li>Revoca del consenso</li>
            </ul>
            <p className="mt-3">
              Per esercitare i tuoi diritti, scrivi a{" "}
              <a href={`mailto:${email}`} className="text-[var(--accent)] hover:underline">{email}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              COOKIE
            </h2>
            <p>
              Questo sito utilizza esclusivamente cookie tecnici necessari al funzionamento
              (preferenza tema, nessun cookie di profilazione o di terze parti).
              Non è richiesto il consenso ai sensi dell'art. 122 del Codice Privacy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
