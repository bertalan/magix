import React from "react";
import { ViewState } from "@/types";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface MobileMenuProps {
  navItems: Array<{ label: string; view: ViewState; icon: string }>;
  activeView: ViewState;
  setView: (v: ViewState) => void;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ navItems, activeView, setView, onClose }) => {
  const trapRef = useFocusTrap<HTMLDivElement>();

  // Close on Escape key
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={trapRef}
      id="mobile-menu"
      className="fixed inset-0 z-40 bg-[var(--bg-color)] flex flex-col items-center justify-center gap-8 text-3xl font-heading font-bold"
      role="dialog"
      aria-modal="true"
      aria-label="Menu navigazione"
    >
      <nav aria-label="Navigazione mobile">
        <ul className="flex flex-col items-center gap-8 list-none p-0 m-0">
          {navItems.map((item) => (
            <li key={item.label}>
              <button
                onClick={() => setView(item.view)}
                className={`text-3xl font-heading font-bold hover:text-[var(--accent)] transition-colors ${
                  activeView === item.view ? "text-[var(--accent)]" : "text-[var(--text-main)]"
                }`}
                aria-current={activeView === item.view ? "page" : undefined}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default MobileMenu;
