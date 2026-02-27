/**
 * ContactsPage — Contacts page with company info,
 * OpenStreetMap embed and social links.
 * All text is i18n-aware via useLanguage / t().
 */
import React from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Phone, Mail, Globe, Facebook, Youtube } from "lucide-react";

const ContactsPage: React.FC = () => {
  const { t } = useLanguage();
  const { data: settings } = useSiteSettings();

  const companyName = settings?.company_name || "Magix Promotion";
  const phone = settings?.phone || "+39 335 523 0855";
  const email = settings?.email || "info@magixpromotion.it";
  const addr = settings?.address;
  const addressStr = addr
    ? `${addr.street}, ${addr.zip_code} ${addr.city} (${addr.province}), ${addr.country_name}`
    : "Via dello Scabiolo, 15067 Novi Ligure (AL), Italia";
  const lat = addr?.latitude || 44.7631;
  const lng = addr?.longitude || 8.7873;
  const facebook = settings?.social?.facebook;
  const youtube = settings?.social?.youtube;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.005}%2C${lng + 0.01}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  const mapLinkUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 glass-panel rounded-full text-[var(--accent)] text-sm font-bold tracking-widest mb-6">
          <MapPin size={16} />
          {t("contacts.badge")}
        </div>
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tighter mb-6 text-[var(--text-main)]">
          {t("contacts.title")} <span className="gradient-text">{t("contacts.titleAccent")}</span>
        </h1>
        <p className="text-[var(--text-muted)] text-lg max-w-xl mx-auto">
          {t("contacts.subtitle")}
          <br />
          {t("contacts.subtitleLine2")}
        </p>
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        {/* Phone */}
        <a
          href={`tel:${phone.replace(/\s/g, "")}`}
          className="glass-panel rounded-2xl p-6 border border-[var(--glass-border)] flex flex-col items-center gap-3 hover:border-[var(--accent)] transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform">
            <Phone size={22} />
          </div>
          <span className="text-sm text-[var(--text-muted)]">{t("contacts.phone")}</span>
          <span className="text-[var(--text-main)] font-bold text-sm">{phone}</span>
        </a>

        {/* Email */}
        <a
          href={`mailto:${email}`}
          className="glass-panel rounded-2xl p-6 border border-[var(--glass-border)] flex flex-col items-center gap-3 hover:border-[var(--accent)] transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform">
            <Mail size={22} />
          </div>
          <span className="text-sm text-[var(--text-muted)]">{t("contacts.email")}</span>
          <span className="text-[var(--text-main)] font-bold text-sm">{email}</span>
        </a>

        {/* Address */}
        <a
          href={mapLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-panel rounded-2xl p-6 border border-[var(--glass-border)] flex flex-col items-center gap-3 hover:border-[var(--accent)] transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform">
            <Globe size={22} />
          </div>
          <span className="text-sm text-[var(--text-muted)]">{t("contacts.office")}</span>
          <span className="text-[var(--text-main)] font-bold text-sm text-center leading-snug">{addressStr}</span>
        </a>
      </div>

      {/* OpenStreetMap */}
      <div className="glass-panel rounded-[2rem] overflow-hidden border border-[var(--glass-border)] mb-12">
        <iframe
          title={t("contacts.mapTitle", { companyName })}
          width="100%"
          height="350"
          src={mapUrl}
          className="border-0 w-full"
          loading="lazy"
        />
        <div className="px-6 py-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <MapPin size={14} className="text-[var(--accent)]" />
          <a href={mapLinkUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">
            {t("contacts.openMap")}
          </a>
        </div>
      </div>

      {/* Social */}
      {(facebook || youtube) && (
        <div className="glass-panel rounded-2xl p-8 border border-[var(--glass-border)] text-center">
          <h2 className="text-lg font-bold text-[var(--text-main)] mb-5 tracking-wide">{t("contacts.followUs")}</h2>
          <div className="flex items-center justify-center gap-6">
            {facebook && (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={22} />
              </a>
            )}
            {youtube && (
              <a
                href={youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[var(--accent)]/15 flex items-center justify-center text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={22} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;
