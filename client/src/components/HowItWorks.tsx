import React from 'react';
import { ClipboardList, Search, CheckCircle2, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          How It Works
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
          {t('howItWorksTitle')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {/* Step 1 */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center relative flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
            <ClipboardList className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('step1Title')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('step1Desc')}</p>
        </div>

        {/* Step 2 */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center relative flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 shadow-sm">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('step2Title')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('step2Desc')}</p>
        </div>

        {/* Step 3 */}
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center relative flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('step3Title')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">{t('step3Desc')}</p>
        </div>
      </div>
    </section>
  );
};
