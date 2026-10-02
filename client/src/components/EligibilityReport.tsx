import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Award, CheckCircle2, XCircle, Sparkles, FileText, ExternalLink, Share2,
  Download, RotateCcw, Pencil, MessageSquare, TrendingUp, Gauge, ShieldCheck, ClipboardList, IndianRupee, ListChecks,
  AlertTriangle, ChevronDown
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORIES_LIST } from './CategoryGrid';
import { EligibilityEvaluationResult, UserProfile } from '../../../shared/types';

export interface StoredReport {
  profile: UserProfile;
  eligible: EligibilityEvaluationResult[];
  partial: EligibilityEvaluationResult[];
  generatedAt: string;
}

interface EligibilityReportProps {
  report: StoredReport;
  onSelectScheme: (schemeId: string) => void;
  onStartNew: () => void;
  onEditAnswers: () => void;
  onOpenChat: () => void;
}

/** Rule engine criterion names → translation keys */
const CRITERION_KEYS: Record<string, string> = {
  'Age Criteria': 'critAge',
  'Income Cap': 'critIncome',
  'Target Gender': 'critGender',
  'State Domicile': 'critState',
  Occupation: 'critOccupation',
  'BPL Status': 'critBpl',
  'Social Category': 'critCategory',
  Disability: 'critDisability',
  Landholding: 'critLand',
  Residence: 'critResidence',
  Education: 'critEducation',
  Minority: 'critMinority'
};

/** Conditions the rule engine cannot check from the answers; shown separately in amber */
const TO_CONFIRM = 'To confirm';
const CONFIRM_PREFIX = 'Confirm before applying: ';

// Long result lists are collapsed; everything expands for printing
const ELIGIBLE_PREVIEW = 10;
const ALMOST_PREVIEW = 5;

export const EligibilityReport: React.FC<EligibilityReportProps> = ({
  report,
  onSelectScheme,
  onStartNew,
  onEditAnswers,
  onOpenChat
}) => {
  const { t, currentLanguage } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAllEligible, setShowAllEligible] = useState(false);
  const [showAllAlmost, setShowAllAlmost] = useState(false);

  // Print (and "Save as PDF") in light colours even when the site is in dark mode
  useEffect(() => {
    const root = document.documentElement;
    let wasDark = false;
    const before = () => {
      wasDark = root.classList.contains('dark');
      root.classList.remove('dark');
      // The PDF should contain every result, not just the collapsed preview
      flushSync(() => {
        setShowAllEligible(true);
        setShowAllAlmost(true);
      });
    };
    const after = () => {
      if (wasDark) root.classList.add('dark');
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  const { profile, eligible, partial } = report;
  const shown = [...eligible, ...partial];
  const scores = shown.map((r) => r.matchScorePercentage);
  const highest = scores.length ? Math.max(...scores) : 0;
  const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const generatedOn = new Date(report.generatedAt).toLocaleDateString(`${currentLanguage.code}-IN`, { day: 'numeric', month: 'long', year: 'numeric' });

  const title = eligible.length > 0
    ? t('repTitleEligible', { count: eligible.length })
    : partial.length > 0
      ? t('repTitleAlmost', { count: partial.length })
      : t('repTitleNoMatch');

  const shareScheme = async (r: EligibilityEvaluationResult) => {
    const text = `${r.scheme.name}: ${r.scheme.financialBenefit}. ${r.scheme.applicationUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: r.scheme.name, text, url: r.scheme.applicationUrl });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopiedId(r.scheme.schemeId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Share sheet dismissed or clipboard blocked: nothing to do
    }
  };

  const summaryItems = [
    { label: t('repRole'), value: profile.roleId ? t(`role_${profile.roleId}`) : profile.occupation },
    { label: t('repState'), value: profile.district ? `${profile.district}, ${profile.state}` : profile.state },
    { label: t('repAge'), value: `${profile.age} ${t('wizAgeUnit')}` },
    { label: t('repIncome'), value: profile.incomeBandId ? t(`income_${profile.incomeBandId}`) : `₹${profile.annualIncome.toLocaleString('en-IN')}` },
    { label: t('repCategory'), value: profile.category === 'General' ? t('cat_General') : profile.category },
    { label: t('repEducation'), value: profile.education ? t(`edu_${profile.education}`) : '—' }
  ];

  const renderCard = (r: EligibilityEvaluationResult) => {
    const category = CATEGORIES_LIST.find((c) => c.id === r.scheme.category);
    const Icon = category?.icon || Award;

    return (
      <article
        key={r.scheme.schemeId}
        className={`rounded-3xl border-2 p-5 sm:p-6 break-inside-avoid ${
          r.isEligible
            ? 'border-emerald-300 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 via-white to-amber-50/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900'
            : 'border-amber-300 dark:border-amber-800 bg-gradient-to-br from-amber-50/70 via-white to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900'
        }`}
      >
        {/* Card header */}
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${r.isEligible ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">{r.scheme.name}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className={`text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg ${r.isEligible ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                {r.isEligible ? t('label_high') : t('label_partial')}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{r.scheme.ministryOrDepartment}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-2xl sm:text-3xl font-black ${r.isEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>{r.matchScorePercentage}%</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('repMatch')}</div>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">{r.scheme.summaryText}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          {/* Why you match / what is missing */}
          <div className="space-y-4">
            <div>
              <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">{t('repWhyMatch')}</h5>
              <ul className="space-y-1.5">
                {r.criteriaMet.filter((c) => c.criterion !== TO_CONFIRM).map((c) => (
                  <li key={c.criterion} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-px" />
                    <span><strong>{t(CRITERION_KEYS[c.criterion] || c.criterion)}:</strong> {c.details}</span>
                  </li>
                ))}
                {(r.matchedInterests || []).map((id) => (
                  <li key={id} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-px" />
                    <span>{t('repInterestMatch', { interest: t(`interest_${id}`) })}</span>
                  </li>
                ))}
                {r.criteriaMet.length === 0 && !(r.matchedInterests || []).length && (
                  <li className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-px" />
                    <span>{r.aiSimplifiedExplanation}</span>
                  </li>
                )}
              </ul>
            </div>
            {r.criteriaMet
              .filter((c) => c.criterion === TO_CONFIRM)
              .map((c) => (
                <div key={c.criterion} className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-3">
                  <h5 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {t('critToConfirm')}
                  </h5>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{c.details.replace(CONFIRM_PREFIX, '')}</p>
                </div>
              ))}
            {r.criteriaFailed.length > 0 && (
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">{t('repMissing')}</h5>
                <ul className="space-y-1.5">
                  {r.criteriaFailed.map((c) => (
                    <li key={c.criterion} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-px" />
                      <span><strong>{t(CRITERION_KEYS[c.criterion] || c.criterion)}:</strong> {c.details}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Benefits and documents */}
          <div className="space-y-4">
            <div>
              <h5 className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">{t('repBenefits')}</h5>
              <p className="flex items-start gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <IndianRupee className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                {r.scheme.financialBenefit}
              </p>
            </div>
            <div>
              <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">{t('repDocuments')}</h5>
              <ul className="space-y-1.5">
                {r.scheme.documentsRequired.map((doc) => (
                  <li key={doc} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-px" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 mt-6 print:hidden">
          <a
            href={r.scheme.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 transition-colors"
          >
            {t('repApply')} <ExternalLink className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => onSelectScheme(r.scheme.schemeId)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-400 transition-colors"
          >
            <ListChecks className="w-4 h-4" /> {t('repViewSteps')}
          </button>
          <button
            type="button"
            onClick={() => shareScheme(r)}
            title={copiedId === r.scheme.schemeId ? t('repCopied') : t('repShare')}
            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 transition-colors"
          >
            {copiedId === r.scheme.schemeId ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div id="eligibility-report" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl print:shadow-none print:border-0 print:p-0">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
          <ShieldCheck className="w-4 h-4" /> {t('repBadge')}
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-4 leading-tight">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{t('repSubtitle')}</p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition-colors">
            <Download className="w-4 h-4" /> {t('repDownload')}
          </button>
          <button onClick={onOpenChat} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-extrabold text-sm border border-slate-700 transition-colors">
            <MessageSquare className="w-4 h-4 text-emerald-400" /> {t('repAskAI')}
          </button>
          <button onClick={onEditAnswers} className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Pencil className="w-4 h-4" /> {t('repEditAnswers')}
          </button>
          <button onClick={onStartNew} className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <RotateCcw className="w-4 h-4" /> {t('repNewAssessment')}
          </button>
        </div>
      </div>

      {/* Profile summary */}
      <div className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">{t('repProfileSummary')}</h3>
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {summaryItems.map((item) => (
            <div key={item.label}>
              <dt className="text-[10px] font-black uppercase tracking-wider text-slate-400">{item.label}</dt>
              <dd className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 mt-8 print:block">
        {/* Scheme cards */}
        <div className="space-y-8 min-w-0">
          {eligible.length > 0 && (
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {t('repEligibleSection')} ({eligible.length})
              </h3>
              <div className="space-y-5">{(showAllEligible ? eligible : eligible.slice(0, ELIGIBLE_PREVIEW)).map(renderCard)}</div>
              {!showAllEligible && eligible.length > ELIGIBLE_PREVIEW && (
                <button type="button" onClick={() => setShowAllEligible(true)} className="print:hidden mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors">
                  <ChevronDown className="w-4 h-4" /> {t('repShowAll', { count: eligible.length })}
                </button>
              )}
            </div>
          )}
          {partial.length > 0 && (
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500" /> {t('repAlmostSection')} ({partial.length})
              </h3>
              <div className="space-y-5">{(showAllAlmost ? partial : partial.slice(0, ALMOST_PREVIEW)).map(renderCard)}</div>
              {!showAllAlmost && partial.length > ALMOST_PREVIEW && (
                <button type="button" onClick={() => setShowAllAlmost(true)} className="print:hidden mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-extrabold text-sm hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors">
                  <ChevronDown className="w-4 h-4" /> {t('repShowAll', { count: partial.length })}
                </button>
              )}
            </div>
          )}
          {shown.length === 0 && (
            <div className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">{t('repSubtitle')}</div>
          )}
        </div>

        {/* Summary sidebar */}
        <aside className="lg:sticky lg:top-28 self-start space-y-4 print:hidden">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">{t('repSummaryTitle')}</h3>
            <ul className="space-y-4">
              {[
                { Icon: Award, value: eligible.length, label: t('repTotalEligible'), tone: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950' },
                { Icon: ClipboardList, value: partial.length, label: t('repAlmost'), tone: 'text-amber-600 bg-amber-100 dark:bg-amber-950' },
                { Icon: TrendingUp, value: `${highest}%`, label: t('repHighest'), tone: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950' },
                { Icon: Gauge, value: `${average}%`, label: t('repAverage'), tone: 'text-blue-600 bg-blue-100 dark:bg-blue-950' }
              ].map(({ Icon, value, label, tone }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}><Icon className="w-5 h-5" /></span>
                  <span>
                    <span className="block text-xl font-black text-slate-900 dark:text-white leading-none">{value}</span>
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{label}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <button onClick={onOpenChat} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm hover:bg-emerald-100 transition-colors">
            <Sparkles className="w-4 h-4" /> {t('repAskAI')}
          </button>
        </aside>
      </div>

      <p className="text-[11px] text-slate-400 text-center mt-10">{t('repDisclaimer', { date: generatedOn })}</p>
    </div>
  );
};
