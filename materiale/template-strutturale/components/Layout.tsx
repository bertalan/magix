
import React from 'react';
import { ViewState } from '../types';
import { Music, Search, Users, Menu, X, Sun, Moon, Sparkle } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ViewState;
  setView: (v: ViewState) => void;
  currentTheme: 'electric-night' | 'pastel-dream';
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, currentTheme, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { label: 'MUSIC', view: 'HOME' as ViewState, icon: Music },
    { label: 'ROSTER', view: 'TALENT' as ViewState, icon: Users },
    { label: 'AI SCOUT', view: 'SCOUT' as ViewState, icon: Search },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-color)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel h-20 flex items-center px-6 md:px-12 justify-between theme-transition">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setView('HOME')}
        >
          <div className="w-10 h-10 bg-[var(--accent-gradient)] rounded-lg flex items-center justify-center font-bold text-xl font-heading transform -rotate-6 shadow-lg shadow-[var(--accent)]/20">
            <span className={currentTheme === 'pastel-dream' ? 'text-white' : 'text-black'}>U</span>
          </div>
          <span className="font-heading font-extrabold text-2xl tracking-tighter text-[var(--text-main)]">
            UTA <span className="opacity-40">MUSIC</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setView(item.view)}
              className={`text-sm font-bold tracking-widest hover:text-[var(--accent)] transition-colors ${
                activeView === item.view ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {item.label}
            </button>
          ))}
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-[var(--glass)] border border-[var(--glass-border)] text-[var(--text-main)] hover:scale-110 transition-transform"
            title="Switch Palette"
          >
            {currentTheme === 'electric-night' ? <Sparkle size={18} /> : <Moon size={18} />}
          </button>
        </nav>

        {/* Mobile Nav Actions */}
        <div className="flex items-center gap-4 md:hidden">
          <button onClick={toggleTheme} className="p-2 text-[var(--text-main)]">
             {currentTheme === 'electric-night' ? <Sparkle size={20} /> : <Moon size={20} />}
          </button>
          <button 
            className="text-[var(--text-main)]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--bg-color)] flex flex-col items-center justify-center gap-8 text-3xl font-heading font-bold animate-in fade-in zoom-in duration-300">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setView(item.view);
                setIsMenuOpen(false);
              }}
              className="hover:text-[var(--accent)] transition-colors text-[var(--text-main)]"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-[var(--glass-border)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-heading font-bold text-xl text-[var(--text-main)]">UTA MUSIC REIMAGINED</span>
            <span className="text-[var(--text-muted)] text-sm">© 2024 UNITED TALENT AGENCY. ALL RIGHTS RESERVED.</span>
          </div>
          <div className="flex gap-6 text-[var(--text-muted)] text-sm">
            <a href="#" className="hover:text-[var(--text-main)] transition-colors">PRIVACY</a>
            <a href="#" className="hover:text-[var(--text-main)] transition-colors">TERMS</a>
            <a href="#" className="hover:text-[var(--text-main)] transition-colors">CONTACT</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
