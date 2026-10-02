import React from 'react';
import { Sparkles, Mic, Zap, ShieldCheck, Award, Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { VERIFIED_SCHEMES_100 } from '../data/seedSchemes';

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
    <section className="relative w-full bg-gradient-to-b from-emerald-900/10 via-slate-50 to-slate-100 dark:from-emerald-950/40 dark:via-slate-950 dark:to-slate-900 pt-12 pb-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto text-center space-y-8 relative z-10">
        {/* Vernacular Language Active Indicator */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Vernacular Voice Support Active in <strong>{currentLanguage.name} ({currentLanguage.nativeName})</strong></span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-5xl mx-auto">
          {t('heroTitle')}
        </h1>

        {/* Sub-headline */}
        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          {t('heroSubtitle', { count: VERIFIED_SCHEMES_100.length })}
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
          <button
            onClick={onCheckEligibilityClick}
            className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 hover:scale-[1.02] transition-all flex items-center gap-3"
          >
            <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
            <span>{t('heroCheckBtn')}</span>
          </button>

          <button
            onClick={onOpenVoiceWidget}
            className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-base border border-slate-700 shadow-xl hover:scale-[1.02] transition-all flex items-center gap-3"
          >
            <Mic className="w-5 h-5 text-emerald-400" />
            <span>{t('heroSpeakBtn')}</span>
          </button>
        </div>

        {/* Metrics Bar */}
        <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
          <div className="glass-card p-5 rounded-2xl text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-black text-2xl sm:text-3xl">{VERIFIED_SCHEMES_100.length}</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Schemes Covered</p>
          </div>

          <div className="glass-card p-5 rounded-2xl text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-amber-500 mb-1">
              <Award className="w-5 h-5" />
              <span className="font-black text-2xl sm:text-3xl">₹10 Lakh+</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Direct Benefits</p>
          </div>

          <div className="glass-card p-5 rounded-2xl text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <Layers className="w-5 h-5" />
              <span className="font-black text-2xl sm:text-3xl">10</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Regional Languages</p>
          </div>

          <div className="glass-card p-5 rounded-2xl text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <Zap className="w-5 h-5" />
              <span className="font-black text-2xl sm:text-3xl">100%</span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deterministic Match</p>
          </div>
        </div>
      </div>
    </section>
  );
};
