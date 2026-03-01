/**
 * Test utilities — Wrapper con i18n e LanguageProvider per i test dei componenti.
 */
import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "@/i18n";

/**
 * Wrapper component riutilizzabile per LanguageProvider.
 * Usalo con render() e renderHook().
 */
const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

/**
 * Render personalizzato che wrappa il componente in LanguageProvider.
 * Usa questo al posto di `render()` per tutti i componenti che usano `useLanguage()`.
 */
function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { renderWithProviders, AllProviders };
