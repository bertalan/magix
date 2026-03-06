import React from "react";
import type { PressAreaData, EPKListItem, ViewState } from "@/types";
import { fetchPressArea } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import SEOHead from "./SEOHead";
import {
  Newspaper,
  Download,
  Camera,
  FileText,
  Music,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

interface PressAreaPageProps {
  setView: (v: ViewState) => void;
  /** Eventuale slug artista per auto-scroll */
  scrollToArtist?: string | null;
  /** Callback per navigare al dettaglio artista */
  onArtistClick?: (artistId: number) => void;
}

/* ------------------------------------------------------------------
 * Asset card helper — singolo bottone scarica
 * ----------------------------------------------------------------*/
const AssetButton: React.FC<{
  href: string;
  icon: React.ReactNode;
  label: string;
}> = ({ href, icon, label }) => (
  <a
    href={href.startsWith("http") ? href : `${API_BASE}${href}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-panel border border-[var(--glass-border)] text-sm font-bold text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-all group"
    download
  >
    <span className="group-hover:scale-110 transition-transform">{icon}</span>
    {label}
  </a>
);

/* ------------------------------------------------------------------
 * EPK Card — singolo kit artista
 * ----------------------------------------------------------------*/
const EPKCard: React.FC<{
  item: EPKListItem;
  t: (key: string) => string;
  onArtistClick?: (artistId: number) => void;
  highlight?: boolean;
}> = ({ item, t, onArtistClick, highlight }) => {
  const { assets, artist } = item;

  return (
    <article
      id={artist?.slug ?? `epk-${item.id}`}
      className={`glass-panel rounded-3xl border p-6 sm:p-8 transition-all ${
        highlight
          ? "border-[var(--accent)]/50 ring-2 ring-[var(--accent)]/20 shadow-xl"
          : "border-[var(--glass-border)] hover:border-[var(--accent)]/30"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[var(--text-main)] tracking-tight">
            {item.title || artist?.title || "EPK"}
          </h3>
          {item.description && (
            <p className="text-[var(--text-muted)] text-sm mt-1 max-w-lg">
              {item.description}
            </p>
          )}
        </div>
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
          {t("press.updated")}{" "}
          {new Date(item.updated_at).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Asset download buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {assets.photo && (
          <AssetButton
            href={assets.photo}
            icon={<Camera size={16} />}
            label={t("press.photo")}
          />
        )}
        {assets.rider && (
          <AssetButton
            href={assets.rider}
            icon={<FileText size={16} />}
            label={t("press.rider")}
          />
        )}
        {assets.bio && (
          <AssetButton
            href={assets.bio}
            icon={<Music size={16} />}
            label={t("press.bio")}
          />
        )}
        {assets.logo && (
          <AssetButton
            href={assets.logo}
            icon={<ImageIcon size={16} />}
            label={t("press.logo")}
          />
        )}
      </div>

      {/* Link artista */}
      {artist && onArtistClick && (
        <button
          onClick={() => onArtistClick(artist.id)}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] hover:underline"
        >
          <ExternalLink size={14} />
          {t("press.viewArtist")}
        </button>
      )}
    </article>
  );
};

/* ==================================================================
 * PressAreaPage
 * =================================================================*/
const PressAreaPage: React.FC<PressAreaPageProps> = ({
  setView: _setView,
  scrollToArtist,
  onArtistClick,
}) => {
  const { t, lang } = useLanguage();
  const [data, setData] = React.useState<PressAreaData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPressArea(lang)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Errore nel caricamento della press area.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // Auto-scroll to artist anchor when data loads
  React.useEffect(() => {
    if (scrollToArtist && data) {
      const el = document.getElementById(scrollToArtist);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
      }
    }
  }, [scrollToArtist, data]);

  // Separa company EPK dagli altri
  const companyEPK = React.useMemo(
    () => data?.items.find((i) => i.is_company) ?? null,
    [data],
  );
  const bandEPKs = React.useMemo(
    () => data?.items.filter((i) => !i.is_company) ?? [],
    [data],
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <SEOHead
        title={`${t("press.title")} ${t("press.titleAccent")} — Magix Promotion`}
        description={t("press.subtitle")}
        type="website"
      />

      {/* ─── Hero ─── */}
      <div className="mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-bold text-xs tracking-[0.3em] mb-4">
          {t("press.badge")}
        </span>
        <h1 className="text-4xl md:text-6xl font-heading font-extrabold tracking-tight text-[var(--text-main)] uppercase leading-none mb-4">
          {t("press.title")}{" "}
          <span className="text-[var(--accent)]">{t("press.titleAccent")}</span>
        </h1>
        <p className="text-lg text-[var(--text-muted)] max-w-2xl">
          {t("press.subtitle")}
        </p>
      </div>

      {/* ─── Loading / Error ─── */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={40} className="animate-spin text-[var(--accent)]" />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-[var(--text-muted)]">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* ─── Intro CMS (da PressAreaPage Wagtail) ─── */}
          {data.intro?.intro_text && (
            <div className="mb-16 glass-panel rounded-3xl border border-[var(--accent)]/20 p-8 sm:p-12">
              <div
                className="prose prose-invert prose-lg max-w-none text-[var(--text-muted)]
                  [&_h2]:text-[var(--text-main)] [&_h2]:font-heading [&_h2]:font-extrabold
                  [&_h3]:text-[var(--text-main)] [&_h3]:font-heading
                  [&_a]:text-[var(--accent)] [&_a]:no-underline [&_a:hover]:underline
                  [&_strong]:text-[var(--text-main)]"
                dangerouslySetInnerHTML={{ __html: data.intro.intro_text }}
              />
            </div>
          )}

          {/* ─── Company EPK (in evidenza) ─── */}
          {companyEPK && (
            <section className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[var(--text-main)] flex items-center gap-3 mb-8">
                <Newspaper className="text-[var(--accent)]" size={28} />
                {t("press.companyKit")}
              </h2>
              <EPKCard item={companyEPK} t={t} highlight />
            </section>
          )}

          {/* ─── Band EPKs grid ─── */}
          {bandEPKs.length > 0 && (
            <section className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[var(--text-main)] flex items-center gap-3 mb-8">
                <Download className="text-[var(--accent)]" size={28} />
                {t("press.bandKits")}
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {bandEPKs.map((item) => (
                  <EPKCard
                    key={item.id}
                    item={item}
                    t={t}
                    onArtistClick={onArtistClick}
                    highlight={scrollToArtist === item.artist?.slug}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!companyEPK && bandEPKs.length === 0 && (
            <p className="text-center text-[var(--text-muted)] py-20 text-lg">
              {t("press.noKits")}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default PressAreaPage;
