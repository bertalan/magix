import React from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { ROUTE_SLUGS } from "@/lib/routes";
import { Search, Home, Mail } from "lucide-react";

interface NotFoundPageProps {
  setView: (view: "HOME" | "TALENT" | "EVENTS") => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ setView }) => {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [query, setQuery] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      window.location.href = `/${lang}/${ROUTE_SLUGS[lang].artists}/?search=${encodeURIComponent(q)}`;
    }
  };

  const buildMailto = () => {
    const details = [
      `${t("notFound.emailErrorLabel")}: 404`,
      `URL: ${window.location.href}`,
      `Referrer: ${document.referrer || t("notFound.direct")}`,
      `Date: ${new Date().toISOString()}`,
      `Browser: ${navigator.userAgent}`,
      `Screen: ${screen.width}x${screen.height}`,
      "",
      t("notFound.emailPrompt"),
    ].join("\n");

    const subject = encodeURIComponent(
      t("notFound.emailSubject")
    );
    const body = encodeURIComponent(details);
    return `mailto:info@magixpromotion.it?subject=${subject}&body=${body}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      {/* Glitch 404 */}
      <h1
        className="font-heading font-bold leading-none mb-2 select-none animate-[glitch_3s_infinite]"
        style={{
          fontSize: "clamp(6rem, 20vw, 10rem)",
          background: "linear-gradient(90deg, var(--accent), var(--accent-secondary), #00d4ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </h1>

      <h2 className="font-heading text-2xl font-semibold mb-3 text-[var(--text-primary)]">
        {t("notFound.title")}
      </h2>

      <p className="text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
        {t("notFound.description")}
      </p>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="flex gap-2 w-full max-w-sm mb-8"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("notFound.searchPlaceholder")}
          autoComplete="off"
          className="flex-1 px-4 py-2.5 rounded-full bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all font-body text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-full text-white font-medium text-sm transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, var(--accent-secondary), var(--accent))",
          }}
          aria-label={t("notFound.searchPlaceholder")}
        >
          <Search className="w-5 h-5" />
        </button>
      </form>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => setView("HOME")}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white font-medium text-sm transition-all hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
            boxShadow: "0 4px 20px rgba(255,0,247,.3)",
          }}
        >
          <Home className="w-4 h-4" />
          {t("notFound.backHome")}
        </button>

        <a
          href={buildMailto()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[var(--text-secondary)] font-medium text-sm border border-[var(--border-color)] bg-[var(--card-bg)] hover:bg-[var(--card-bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all"
        >
          <Mail className="w-4 h-4" />
          {t("notFound.report")}
        </a>
      </div>

      {/* Diagnostic details */}
      <div className="mt-10 px-4 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-left text-xs text-[var(--text-secondary)] max-w-md w-full opacity-50">
        <span className="text-[var(--text-secondary)]">URL:</span>{" "}
        {window.location.pathname}
      </div>

      {/* Glitch keyframes */}
      <style>{`
        @keyframes glitch {
          0%, 92%, 100% { opacity: 1; transform: none; }
          93% { opacity: .8; transform: translate(-2px, 1px) skewX(-1deg); }
          94% { opacity: .9; transform: translate(2px, -1px); }
          95% { opacity: .7; transform: translate(-1px, 2px) skewX(1deg); }
          96% { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
