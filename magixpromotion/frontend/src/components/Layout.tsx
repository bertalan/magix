import React from "react";
import { ViewState } from "@/types";
import Header from "./Header";
import Footer from "./Footer";
import SkipLink from "./SkipLink";

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  setView: (v: ViewState) => void;
  currentTheme: "electric-night" | "pastel-dream";
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeView,
  setView,
  currentTheme,
  toggleTheme,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-color)]">
      <SkipLink />
      <Header
        activeView={activeView}
        setView={setView}
        currentTheme={currentTheme}
        toggleTheme={toggleTheme}
      />
      <main id="main-content" className="flex-grow pt-20" role="main">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
