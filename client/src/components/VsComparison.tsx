import React from 'react';
import { XCircle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const VsComparison: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
          Value Beyond Existing Portals
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
          {t('vsTitle')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Existing Portals (myScheme.gov.in) */}
        <div className="glass-card p-6 rounded-3xl border border-rose-200 dark:border-rose-950 bg-rose-50/20 dark:bg-rose-950/20 space-y-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-extrabold text-lg border-b border-rose-200 dark:border-rose-900 pb-3">
            <ShieldAlert className="w-5 h-5" />
            <span>Traditional Government Portals (myScheme.gov.in)</span>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <li className="flex items-start gap-2 text-rose-700 dark:text-rose-400">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Lists all schemes without personalized matching score</span>
            </li>
            <li className="flex items-start gap-2 text-rose-700 dark:text-rose-400">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Requires manual search & complex filtering through hundreds of options</span>
            </li>
            <li className="flex items-start gap-2 text-rose-700 dark:text-rose-400">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Requires reading lengthy, confusing PDF government guidelines</span>
            </li>
            <li className="flex items-start gap-2 text-rose-700 dark:text-rose-400">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>No instant personalized eligibility assessment module</span>
            </li>
            <li className="flex items-start gap-2 text-rose-700 dark:text-rose-400">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>No document checker or missing paper detection before applying</span>
            </li>
            <li className="flex items-start gap-2 text-rose-700 dark:text-rose-400">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>No 10-language voice synthesis or speech recognition support</span>
            </li>
          </ul>
        </div>

        {/* GoodSchemeAI Platform */}
        <div className="glass-card p-6 rounded-3xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/40 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-lg border-b border-emerald-200 dark:border-emerald-800 pb-3">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span>GoodSchemeAI Platform (Our AI Solution)</span>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 font-semibold">
            <li className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>Personalized 0-100% eligibility score for every citizen profile</span>
            </li>
            <li className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>Grounded AI explains rules in simple regional language without jargon</span>
            </li>
            <li className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>Detects missing documents in advance before application submission</span>
            </li>
            <li className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>Checks application readiness & pre-fills regional application drafts</span>
            </li>
            <li className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>Step-by-step end-to-end guidance from discovery to CSC submission</span>
            </li>
            <li className="flex items-start gap-2 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <span>10-Language Multilingual Spoken Conversational Assistant</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
