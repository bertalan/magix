/**
 * TermsPage — Terms & conditions page.
 * All text is i18n-aware via useLanguage / t().
 */
import React from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "./SEOHead";
import { FileText } from "lucide-react";

const TermsPage: React.FC = () => {
  const { t } = useLanguage();
  const { data: settings } = useSiteSettings();
  const companyName = settings?.company_name || "Magix Promotion";
  const email = settings?.email || "info@magixpromotion.it";
  const vars = { companyName };

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <SEOHead
        title={t("terms.title")}
        description={t("terms.subtitle")}
        type="website"
      />
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[var(--accent)] text-sm font-bold tracking-widest mb-6">
          <FileText size={16} />
          {t("terms.badge")}
        </div>
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tighter mb-6 text-[var(--text-main)]">
          {t("terms.title")} <span className="gradient-text">{t("terms.titleAccent")}</span>
        </h1>
        <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
          {t("terms.subtitle")}
        </p>
      </div>

      {/* Content */}
      <div className="glass-panel rounded-[2rem] p-8 md:p-12 border border-[var(--glass-border)]">
        <div className="prose-custom flex flex-col gap-10 text-[var(--text-muted)] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("terms.premise")}
            </h2>
            <p>{t("terms.premiseText", vars)}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("terms.services")}
            </h2>
            <p>{t("terms.servicesIntro", vars)}</p>
            <ul className="list-disc list-inside mt-3 flex flex-col gap-1.5">
              <li>{t("terms.serviceBooking")}</li>
              <li>{t("terms.serviceEvents")}</li>
              <li>{t("terms.serviceConsulting")}</li>
              <li>{t("terms.serviceQuotes")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("terms.quotes")}
            </h2>
            <p>{t("terms.quotesText", vars)}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("terms.ip")}
            </h2>
            <p>{t("terms.ipText", vars)}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("terms.liability")}
            </h2>
            <p>{t("terms.liabilityText", vars)}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("terms.law")}
            </h2>
            <p>{t("terms.lawText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("terms.contactSection")}
            </h2>
            <p>
              {t("terms.contactText")}{" "}
              <a href={`mailto:${email}`} className="text-[var(--accent)] hover:underline">{email}</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
