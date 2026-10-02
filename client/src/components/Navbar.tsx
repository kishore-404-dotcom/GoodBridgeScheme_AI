import React, { useState } from 'react';
import { Search, Sun, Moon, Mic, UserCheck, Shield, Bookmark, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useProfile } from '../context/ProfileContext';
import { SUPPORTED_LANGUAGES } from '../utils/vernacularDictionary';

interface NavbarProps {
  onSearchChange: (query: string) => void;
  onOpenVoiceWidget: () => void;
  onOpenAuthModal: () => void;
  onOpenBookmarks: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearchChange,
  onOpenVoiceWidget,
  onOpenAuthModal,
  onOpenBookmarks
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { currentLanguage, setLanguageCode, t } = useLanguage();
  const { savedSchemeIds } = useProfile();
  const [searchVal, setSearchVal] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchVal);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      {/* Independent Assistant Disclaimer Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto flex items-center gap-1.5 text-[11px]">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            Independent citizen assistant, not an official government website. Always apply on the official scheme portal.
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-4 cursor-pointer min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black text-lg sm:text-xl tracking-tighter">
            GB
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="block truncate font-black text-base sm:text-2xl tracking-tight text-slate-900 dark:text-white">
                GoodBridge<span className="text-emerald-600 dark:text-emerald-400">Scheme</span> AI
              </span>
            </div>
            <p className="hidden sm:block text-xs font-semibold text-slate-500 dark:text-slate-400">
              Vernacular Scheme Assistant
            </p>
          </div>
        </div>

        {/* Central Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-xl relative">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              onSearchChange(e.target.value);
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-11 pr-12 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <button
            type="button"
            onClick={onOpenVoiceWidget}
            className="absolute right-2.5 top-2 p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 hover:scale-105 transition-all"
            title="Speak query"
          >
            <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>
        </form>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Voice Assistant Button */}
          <button
            onClick={onOpenVoiceWidget}
            title="Voice Assistant"
            className="flex items-center gap-2 p-2.5 sm:px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 hover:scale-[1.02] transition-all"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Voice Assistant</span>
          </button>

          {/* Multilingual Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>{currentLanguage.flag}</span>
              <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 max-h-72 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguageCode(lang.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      currentLanguage.code === lang.code ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50' : 'text-slate-700 dark:text-slate-300'
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
            className="hidden sm:block p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Dark/Light Mode"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Saved Bookmarks */}
          <button
            onClick={onOpenBookmarks}
            className="relative p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors hidden sm:flex"
            title="Saved Schemes"
          >
            <Bookmark className="w-5 h-5" />
            {savedSchemeIds.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {savedSchemeIds.length}
              </span>
            )}
          </button>

          {/* Sign In Button */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 p-2.5 sm:px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all"
            title="Sign In"
          >
            <UserCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Sign In →</span>
          </button>
        </div>
      </div>
    </header>
  );
};
