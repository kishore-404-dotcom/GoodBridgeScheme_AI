import React, { useState } from 'react';
import { Search, Mic, Zap, ShieldCheck, Layers, Languages, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteText } from '../hooks/useSiteText';
import { SUPPORTED_LANGUAGES } from '../utils/vernacularDictionary';
import { CATEGORIES_LIST } from './CategoryGrid';

interface HeroBannerProps {
  schemeCount: number;
  onSearch: (query: string) => void;
  onCheckEligibilityClick: () => void;
  onOpenVoiceWidget: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  schemeCount,
  onSearch,
  onCheckEligibilityClick,
  onOpenVoiceWidget
}) => {
  const { t } = useLanguage();
  const st = useSiteText();
  const [query, setQuery] = useState('');

  const stats = [
    { icon: ShieldCheck, value: schemeCount, label: st('statSchemes') },
    { icon: Layers, value: CATEGORIES_LIST.length, label: st('statCategories') },
    { icon: Languages, value: SUPPORTED_LANGUAGES.length, label: st('statLanguages') }
  ];

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-emerald-900/10 via-slate-50 to-slate-100 dark:from-emerald-950/40 dark:via-slate-950 dark:to-slate-900 px-4 sm:px-8 py-14 lg:py-20 border-b border-slate-200 dark:border-slate-800">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center">
        {/* Left: headline, search, actions */}
        <div className="space-y-7">
          <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            {t('heroTitle')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            {st('heroSubtitleAll', { count: schemeCount })}
          </p>

          {/* Scheme Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch(query.trim());
            }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl max-w-2xl"
            role="search"
          >
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('searchPlaceholder')}
              className="flex-1 min-w-0 bg-transparent py-3 text-sm sm:text-base font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={onOpenVoiceWidget}
              className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
              title={t('heroSpeakBtn')}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              type="submit"
              className="px-5 sm:px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-colors"
            >
              {st('heroSearchBtn')}
            </button>
          </form>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onCheckEligibilityClick}
              className="px-7 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-3"
            >
              <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
              <span>{t('heroCheckBtn')}</span>
            </button>
            <button
              onClick={onOpenVoiceWidget}
              className="px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-base border border-slate-700 shadow-xl transition-all flex items-center gap-3"
            >
              <Mic className="w-5 h-5 text-emerald-400" />
              <span>{t('heroSpeakBtn')}</span>
            </button>
          </div>
        </div>

        {/* Right: what the platform offers, with real numbers only */}
        <div className="glass-card rounded-3xl p-6 lg:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <Icon className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
                <div className="font-black text-2xl lg:text-3xl text-slate-900 dark:text-white mt-1">{value}</div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={onCheckEligibilityClick}
            className="w-full text-left p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 transition-colors group"
          >
            <h3 className="font-extrabold text-slate-900 dark:text-white">{st('homeCtaTitle')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{st('homeCtaDesc')}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
              {t('heroCheckBtn')} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>

          <button
            onClick={onOpenVoiceWidget}
            className="w-full text-left p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-colors group"
          >
            <h3 className="font-extrabold text-slate-900 dark:text-white">{st('homeAskTitle')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{st('homeAskDesc')}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
              {st('navAskAI')} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
