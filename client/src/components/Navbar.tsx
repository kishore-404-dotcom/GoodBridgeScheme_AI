import React, { useState } from 'react';
import { Sun, Moon, Mic, Shield, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSiteText } from '../hooks/useSiteText';
import { SUPPORTED_LANGUAGES } from '../utils/vernacularDictionary';
import { Route } from '../hooks/useHashRoute';

interface NavbarProps {
  currentPage: Route['page'];
  onOpenVoiceWidget: () => void;
}

const NAV_LINKS: { page: Route['page']; href: string; labelKey: string }[] = [
  { page: 'home', href: '#/', labelKey: 'navHome' },
  { page: 'schemes', href: '#/schemes', labelKey: 'navSchemes' },
  { page: 'eligibility', href: '#/eligibility', labelKey: 'navEligibility' }
];

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onOpenVoiceWidget }) => {
  const { isDark, toggleTheme } = useTheme();
  const { currentLanguage, setLanguageCode } = useLanguage();
  const st = useSiteText();
  const [isLangOpen, setIsLangOpen] = useState(false);

  // A scheme detail page belongs to the "Schemes" section
  const activePage = currentPage === 'scheme' ? 'schemes' : currentPage;

  return (
    <header className="print:hidden sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      {/* Independent Assistant Disclaimer Bar */}
      <div className="bg-slate-900 text-slate-300 py-1.5 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto flex items-center gap-1.5 text-[11px]">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{st('disclaimer')}</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 lg:h-20 flex items-center justify-between gap-4 lg:gap-8">
        {/* Brand Logo */}
        <a href="#/" className="flex items-center gap-3 min-w-0 flex-1 md:flex-none">
          <div className="w-10 h-10 lg:w-12 lg:h-12 shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black text-lg lg:text-xl tracking-tighter">
            GB
          </div>
          <div className="min-w-0">
            <span className="block truncate font-black text-base lg:text-2xl tracking-tight text-slate-900 dark:text-white">
              GoodBridge<span className="text-emerald-600 dark:text-emerald-400">Scheme</span> AI
            </span>
            <p className="hidden lg:block text-xs font-semibold text-slate-500 dark:text-slate-400">{st('brandTagline')}</p>
          </div>
        </a>

        {/* Primary Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 flex-1 justify-center" aria-label="Main">
          {NAV_LINKS.map((link) => {
            const isActive = activePage === link.page;
            return (
              <a
                key={link.page}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 lg:px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st(link.labelKey)}
              </a>
            );
          })}
        </nav>

        {/* Right Tools */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* AI Voice Assistant */}
          <button
            onClick={onOpenVoiceWidget}
            title={st('navAskAI')}
            className="flex items-center gap-2 p-2.5 sm:px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">{st('navAskAI')}</span>
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              aria-haspopup="listbox"
              aria-expanded={isLangOpen}
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>{currentLanguage.flag}</span>
              <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 max-h-80 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguageCode(lang.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      currentLanguage.code === lang.code
                        ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">{lang.nativeName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sun / Moon Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Dark/Light Mode"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Compact navigation for narrow windows */}
      <nav className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto" aria-label="Main">
        {NAV_LINKS.map((link) => (
          <a
            key={link.page}
            href={link.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
              activePage === link.page
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {st(link.labelKey)}
          </a>
        ))}
      </nav>
    </header>
  );
};
