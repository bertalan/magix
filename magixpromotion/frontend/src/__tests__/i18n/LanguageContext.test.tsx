/**
 * Test TDD — LanguageContext + LanguageSwitcher + integrazione i18n.
 *
 * Verifica: cambio lingua, persistenza localStorage, traduzione stringhe,
 * pulsante switcher con aria-label accessibile, route con prefisso lingua.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

/* I moduli sotto test verranno importati dopo la creazione */
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import i18n from "i18next";
import "../../i18n";

// --- Helper: Componente consumer per testare il context ---
function LangConsumer() {
  const { lang, setLang, t } = useLanguage();
  return (
    <div>
      <span data-testid="current-lang">{lang}</span>
      <span data-testid="translated">{t("nav.home")}</span>
      <button onClick={() => setLang("en")}>Switch EN</button>
      <button onClick={() => setLang("it")}>Switch IT</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  i18n.changeLanguage("it");
});

describe("LanguageContext", () => {
  it("lingua di default è 'it'", () => {
    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("current-lang")).toHaveTextContent("it");
  });

  it("restituisce la traduzione italiana per nav.home", () => {
    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("translated")).toHaveTextContent("HOME");
  });

  it("cambia lingua a 'en' e restituisce traduzione inglese", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );

    await user.click(screen.getByText("Switch EN"));

    await waitFor(() => {
      expect(screen.getByTestId("current-lang")).toHaveTextContent("en");
      expect(screen.getByTestId("translated")).toHaveTextContent("HOME");
    });
  });

  it("persiste la lingua in localStorage", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );
    await user.click(screen.getByText("Switch EN"));
    await waitFor(() => {
      expect(localStorage.getItem("magix-lang")).toBe("en");
    });
  });

  it("legge la lingua salvata in localStorage al mount", () => {
    localStorage.setItem("magix-lang", "en");
    render(
      <LanguageProvider>
        <LangConsumer />
      </LanguageProvider>,
    );
    expect(screen.getByTestId("current-lang")).toHaveTextContent("en");
  });
});

describe("LanguageSwitcher", () => {
  it("mostra 'EN' quando la lingua corrente è 'it'", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>,
    );
    expect(screen.getByRole("button", { name: /lingua|language/i })).toHaveTextContent("EN");
  });

  it("mostra 'IT' dopo il click (lingua cambiata a 'en')", async () => {
    const user = userEvent.setup();
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>,
    );
    const btn = screen.getByRole("button", { name: /lingua|language/i });
    await user.click(btn);
    await waitFor(() => {
      expect(btn).toHaveTextContent("IT");
    });
  });

  it("ha aria-label accessibile", () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>,
    );
    const btn = screen.getByRole("button", { name: /lingua|language/i });
    expect(btn).toBeInTheDocument();
  });
});
