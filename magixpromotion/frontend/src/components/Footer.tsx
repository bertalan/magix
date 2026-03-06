import React from "react";
import { ViewState } from "@/types";
import { useMenu } from "@/hooks/useMenu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";

interface FooterProps {
  setView: (v: ViewState) => void;
}

const Footer: React.FC<FooterProps> = ({ setView }) => {
  const { lang, t } = useLanguage();
  const { data: legalMenu } = useMenu("footer_legal", lang);
  const { data: settings } = useSiteSettings();

  const legalLinks = legalMenu?.items || [];

  /** Genera deep link navigazione verso Google Maps (apre l'app su mobile) */
  const getNavigationUrl = () => {
    if (!settings) return "#";
    const addr = settings.address;
    if (addr.latitude && addr.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${addr.latitude},${addr.longitude}`;
    }
    const fullAddr = `${addr.street}, ${addr.zip_code} ${addr.city}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddr)}`;
  };

  return (
    <footer className="py-12 px-6 md:px-12 border-t border-[var(--glass-border)] bg-[var(--bg-secondary)]" aria-label="Footer">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Colonna brand */}
        <div className="flex flex-col gap-2">
          <span className="font-heading font-bold text-xl text-[var(--text-main)]">
            {settings?.company_name || "MAGIX PROMOTION"}
          </span>
          <span className="text-[var(--text-muted)] text-sm">
            &copy; {new Date().getFullYear()}{" "}
            {settings?.company_name || "Magix Promotion"} — {t("footer.rights")}
          </span>
          {settings?.vat_number && (
            <span className="text-[var(--text-muted)] text-xs">
              {t("footer.vat")} {settings.vat_number}
            </span>
          )}
        </div>

        {/* Colonna contatti (da SiteSettings) */}
        <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
          {settings?.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-2 hover:text-[var(--text-main)] transition-colors"
            >
              <Phone size={14} /> {settings.phone}
            </a>
          )}
          {settings?.email && (
            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-2 hover:text-[var(--text-main)] transition-colors"
            >
              <Mail size={14} /> {settings.email}
            </a>
          )}
          {settings?.address?.street && (
            <a
              href={getNavigationUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-[var(--text-main)] transition-colors"
              aria-label={t("footer.navigateTo")}
            >
              <MapPin size={14} />
              {settings.address.street}, {settings.address.zip_code}{" "}
              {settings.address.city}
              <ExternalLink size={12} />
            </a>
          )}
        </div>

        {/* Colonna link legali */}
        <div className="flex flex-col md:items-end gap-2 text-sm text-[var(--text-muted)]">
          {legalLinks.length > 0 ? (
            legalLinks.map((link) => (
              <a
                key={link.title}
                href={link.url}
                className="hover:text-[var(--text-main)] transition-colors"
                {...(link.openInNewTab
                  ? { target: "_blank", rel: "noopener" }
                  : {})}
              >
                {link.title.toUpperCase()}
              </a>
            ))
          ) : (
            <>
              <button
                onClick={() => setView("PRIVACY")}
                className="hover:text-[var(--text-main)] transition-colors text-left"
              >
                {t("footer.privacy")}
              </button>
              <button
                onClick={() => setView("TERMS")}
                className="hover:text-[var(--text-main)] transition-colors text-left"
              >
                {t("footer.terms")}
              </button>
              <button
                onClick={() => setView("CONTACTS")}
                className="hover:text-[var(--text-main)] transition-colors text-left"
              >
                {t("footer.contacts")}
              </button>
              <button
                onClick={() => setView("PRESS")}
                className="hover:text-[var(--text-main)] transition-colors text-left"
              >
                {t("footer.press")}
              </button>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
