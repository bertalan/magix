/**
 * PrivacyPage — Privacy policy page, GDPR compliant.
 * All text is i18n-aware via useLanguage / t().
 */
import React from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield } from "lucide-react";

const PrivacyPage: React.FC = () => {
  const { t } = useLanguage();
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
          {t("privacy.badge")}
        </div>
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tighter mb-6 text-[var(--text-main)]">
          {t("privacy.title")} <span className="gradient-text">{t("privacy.titleAccent")}</span>
        </h1>
        <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
          {t("privacy.subtitle")}
        </p>
      </div>

      {/* Content */}
      <div className="glass-panel rounded-[2rem] p-8 md:p-12 border border-[var(--glass-border)]">
        <div className="prose-custom flex flex-col gap-10 text-[var(--text-muted)] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("privacy.controller")}
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
              {t("privacy.dataCollected")}
            </h2>
            <p>{t("privacy.dataCollectedIntro")}</p>
            <ul className="list-disc list-inside mt-3 flex flex-col gap-1.5">
              <li>{t("privacy.dataName")}</li>
              <li>{t("privacy.dataEmail")}</li>
              <li>{t("privacy.dataPhone")}</li>
              <li>{t("privacy.dataEvent")}</li>
              <li>{t("privacy.dataMessage")}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("privacy.purpose")}
            </h2>
            <p>{t("privacy.purposeText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("privacy.legalBasis")}
            </h2>
            <p>{t("privacy.legalBasisText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("privacy.retention")}
            </h2>
            <p>{t("privacy.retentionText")}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("privacy.rights")}
            </h2>
            <p>{t("privacy.rightsIntro")}</p>
            <ul className="list-disc list-inside mt-3 flex flex-col gap-1.5">
              <li>{t("privacy.rightAccess")}</li>
              <li>{t("privacy.rightRectification")}</li>
              <li>{t("privacy.rightRestriction")}</li>
              <li>{t("privacy.rightPortability")}</li>
              <li>{t("privacy.rightObjection")}</li>
              <li>{t("privacy.rightWithdraw")}</li>
            </ul>
            <p className="mt-3">
              {t("privacy.rightsContact")}{" "}
              <a href={`mailto:${email}`} className="text-[var(--accent)] hover:underline">{email}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
              <div className="w-8 h-[2px] bg-[var(--accent)]" />
              {t("privacy.cookies")}
            </h2>
            <p>{t("privacy.cookiesText")}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
