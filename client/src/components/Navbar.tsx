import React, { useState } from 'react';
import { Search, Sun, Moon, Mic, UserCheck, Shield, Bookmark, Sparkles, ChevronDown } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      {/* Top Emblem & Govt Trust Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <span className="flex items-center gap-1 font-semibold text-emerald-400">
            <Shield className="w-3.5 h-3.5" /> Official Government Scheme Assistant
          </span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline text-slate-400">
            ZABR-003 Vernacular Citizen Portal (100% Grounded Official Data)
          </span>
        </div>
      </div>

      {/* Main Header Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 py-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                GoodScheme<span className="text-emerald-600 dark:text-emerald-400">AI</span>
              </span>
              <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                PROD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              YojnaMitra Citizen AI Assistant
            </p>
          </div>
        </div>

        {/* Central Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => {
              setSearchVal(e.target.value);
              onSearchChange(e.target.value);
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-10 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-inner"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <button
            type="button"
            onClick={onOpenVoiceWidget}
            className="absolute right-2 top-1.5 p-1.5 rounded-full text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
            title="Speak query"
          >
            <Mic className="w-4 h-4 animate-bounce" />
          </button>
        </form>

        {/* Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Assistant Trigger */}
          <button
            onClick={onOpenVoiceWidget}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium text-xs sm:text-sm shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline font-semibold">Voice AI</span>
          </button>

          {/* Multilingual Regional Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span>{currentLanguage.flag}</span>
              <span>{currentLanguage.nativeName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 max-h-64 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguageCode(lang.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
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

          {/* Theme Toggle Button (Sun/Moon) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Saved Bookmarks */}
          <button
            onClick={onOpenBookmarks}
            className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors hidden sm:flex"
            title="Saved Schemes"
          >
            <Bookmark className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            {savedSchemeIds.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {savedSchemeIds.length}
              </span>
            )}
          </button>

          {/* Sign In Button */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all"
          >
            <UserCheck className="w-4 h-4" />
            <span>{t('signInBtn')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
