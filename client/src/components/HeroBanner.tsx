import React from 'react';
import { Sparkles, Mic, Zap, ShieldCheck, Award, Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeroBannerProps {
  onCheckEligibilityClick: () => void;
  onOpenVoiceWidget: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onCheckEligibilityClick,
  onOpenVoiceWidget
}) => {
  const { currentLanguage, t } = useLanguage();

  return (
    <section className="relative overflow-hidden pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-12 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="text-center max-w-4xl mx-auto space-y-6">
        {/* Vernacular Active Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
          <span>Active Language: <strong>{currentLanguage.name} ({currentLanguage.nativeName})</strong></span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {t('heroTitle')}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t('heroSubtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onCheckEligibilityClick}
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-600/30 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
            <span>{t('checkEligibilityBtn')}</span>
          </button>

          <button
            onClick={onOpenVoiceWidget}
            className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-base border border-slate-700/50 shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Mic className="w-5 h-5 text-emerald-400 animate-bounce" />
            <span>{t('askVoiceBtn')}</span>
          </button>
        </div>

        {/* Live Statistics Ticker */}
        <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="glass-card p-4 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-extrabold text-xl sm:text-2xl">100</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Verified Schemes</p>
          </div>

          <div className="glass-card p-4 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-1">
              <Award className="w-5 h-5" />
              <span className="font-extrabold text-xl sm:text-2xl">₹10 Lakh+</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Direct Welfare Grants</p>
          </div>

          <div className="glass-card p-4 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
              <Layers className="w-5 h-5" />
              <span className="font-extrabold text-xl sm:text-2xl">10</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Regional Languages</p>
          </div>

          <div className="glass-card p-4 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
              <Zap className="w-5 h-5" />
              <span className="font-extrabold text-xl sm:text-2xl">100%</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Deterministic Match</p>
          </div>
        </div>
      </div>
    </section>
  );
};
