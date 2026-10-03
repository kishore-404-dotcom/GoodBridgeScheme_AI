import React, { useEffect, useMemo, useState } from 'react';
import {
  GraduationCap, Tractor, Store, Hammer, HardHat, Search, Home, Briefcase, UserCheck, Wrench, Heart,
  Stethoscope, MapPin, ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Loader2, Circle, Accessibility,
  Users, ClipboardList, AlertTriangle, ShieldCheck, Lock, Clock, UserRoundCheck,
  Fingerprint, Landmark, Camera, IndianRupee, ShoppingBasket, Cake, Contact, Sprout
} from 'lucide-react';
import { useProfile, DEFAULT_PROFILE } from '../context/ProfileContext';
import { useLanguage } from '../context/LanguageContext';
import { useSiteText } from '../hooks/useSiteText';
import { DOCUMENT_TYPES, DocumentTypeId } from '../../../shared/documents';
import { ApiService } from '../services/apiService';
import { readStore, writeStore } from '../utils/storage';
import { VERIFIED_SCHEMES_100 } from '../data/seedSchemes';
import { EligibilityReport, StoredReport } from './EligibilityReport';
import {
  ROLE_OPTIONS, INCOME_BANDS, EDUCATION_LEVELS, INTEREST_OPTIONS, INDIAN_STATES, MAX_INTERESTS,
  RoleId, IncomeBandId, EducationLevel
} from '../../../shared/eligibilityOptions';
import { SocialCategory, TargetGender, UserProfile } from '../../../shared/types';

interface EligibilityAssessmentProps {
  onSelectScheme: (schemeId: string) => void;
  onOpenChat: () => void;
}

interface Answers {
  roleId?: RoleId;
  state?: string;
  district: string;
  residenceType?: 'Rural' | 'Urban';
  age?: number;
  gender?: TargetGender;
  education?: EducationLevel;
  incomeBandId?: IncomeBandId;
  category?: SocialCategory;
  isBPL: boolean;
  hasDisability: boolean;
  isMinority: boolean;
  interests: string[];
  documents: string[];
}

const TOTAL_STEPS = 6;

/** Saved report, unless it refers to schemes that are no longer in the dataset (e.g. after a data update) */
const loadSavedReport = (): StoredReport | null => {
  const saved = readStore<StoredReport | null>('lastReport', null);
  if (!saved) return null;
  const ids = new Set(VERIFIED_SCHEMES_100.map((s) => s.schemeId));
  if ([...saved.eligible, ...saved.partial].every((r) => ids.has(r.scheme.schemeId))) return saved;
  writeStore('lastReport', null);
  return null;
};
const ANALYSIS_STEPS = ['an_step1', 'an_step2', 'an_step3', 'an_step4', 'an_step5'];
const MIN_ANALYSIS_MS = 2600;

const ROLE_ICONS: Record<RoleId, React.ElementType> = {
  student: GraduationCap,
  farmer: Tractor,
  business: Store,
  artisan: Hammer,
  worker: HardHat,
  jobSeeker: Search,
  homemaker: Home,
  salaried: Briefcase,
  senior: UserCheck
};

const INTEREST_ICONS: Record<string, React.ElementType> = {
  education: GraduationCap,
  jobs: Wrench,
  agriculture: Tractor,
  business: Briefcase,
  women: Heart,
  pension: UserCheck,
  health: Stethoscope
};

const DOCUMENT_ICONS: Record<DocumentTypeId, React.ElementType> = {
  aadhaar: Fingerprint,
  bank: Landmark,
  photo: Camera,
  income: IndianRupee,
  residence: Home,
  caste: Users,
  ration: ShoppingBasket,
  age: Cake,
  education: GraduationCap,
  otherId: Contact,
  land: Sprout,
  workerId: HardHat,
  disability: Accessibility,
  medical: Stethoscope,
  marriage: Heart
};

const SOCIAL_CATEGORIES: SocialCategory[] = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const GENDERS: TargetGender[] = ['Male', 'Female', 'Transgender'];

/** Pre-fill from a previous assessment so "Edit Answers" and page refreshes keep the citizen's work */
const answersFromProfile = (p: UserProfile): Answers => ({
  roleId: p.roleId as RoleId | undefined,
  state: p.state || undefined,
  district: p.district || '',
  residenceType: p.residenceType === 'Urban' ? 'Urban' : p.residenceType === 'Rural' && p.roleId ? 'Rural' : undefined,
  age: p.roleId ? p.age : undefined,
  gender: p.gender !== 'All' ? p.gender : undefined,
  education: p.education as EducationLevel | undefined,
  incomeBandId: p.incomeBandId as IncomeBandId | undefined,
  category: p.roleId ? p.category : undefined,
  isBPL: p.isBPL,
  hasDisability: p.hasDisability,
  isMinority: Boolean(p.isMinority),
  interests: p.interests || [],
  documents: p.documents || []
});

export const EligibilityAssessment: React.FC<EligibilityAssessmentProps> = ({ onSelectScheme, onOpenChat }) => {
  const { profile, updateProfile, confirmProfile, resetProfile } = useProfile();
  const { t } = useLanguage();
  const st = useSiteText();

  const [answers, setAnswers] = useState<Answers>(() => answersFromProfile(profile));
  const [step, setStep] = useState(1);
  const [savedReport] = useState(loadSavedReport);
  const [phase, setPhase] = useState<'intro' | 'wizard' | 'analysing' | 'report'>(savedReport ? 'report' : 'intro');
  const [report, setReport] = useState<StoredReport | null>(savedReport);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState(false);
  const [stateQuery, setStateQuery] = useState('');

  // Persona quick-launchers set a role on the profile; reflect it in the wizard
  useEffect(() => {
    if (profile.roleId && profile.roleId !== answers.roleId && (phase === 'wizard' || phase === 'intro')) {
      setAnswers((prev) => ({ ...prev, roleId: profile.roleId as RoleId }));
      setStep(1);
      setPhase('wizard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.roleId]);

  const set = (updates: Partial<Answers>) => setAnswers((prev) => ({ ...prev, ...updates }));

  const stepValid = useMemo(() => {
    switch (step) {
      case 1: return Boolean(answers.roleId);
      case 2: return Boolean(answers.state && answers.residenceType);
      case 3: return Boolean(answers.age && answers.age > 0 && answers.age <= 120 && answers.gender && answers.education);
      case 4: return Boolean(answers.incomeBandId && answers.category);
      case 5: return answers.interests.length > 0;
      case 6: return true; // having no documents yet is a valid answer
      default: return false;
    }
  }, [step, answers]);

  const filteredStates = INDIAN_STATES.filter((s) => s.toLowerCase().includes(stateQuery.trim().toLowerCase()));

  const toggleInterest = (id: string) => {
    set({
      interests: answers.interests.includes(id)
        ? answers.interests.filter((i) => i !== id)
        : answers.interests.length < MAX_INTERESTS
          ? [...answers.interests, id]
          : answers.interests
    });
  };

  const toggleDocument = (id: string) =>
    setAnswers((prev) => ({
      ...prev,
      documents: prev.documents.includes(id) ? prev.documents.filter((d) => d !== id) : [...prev.documents, id]
    }));

  const runAssessment = async () => {
    const role = ROLE_OPTIONS.find((r) => r.id === answers.roleId)!;
    const band = INCOME_BANDS.find((b) => b.id === answers.incomeBandId)!;
    const nextProfile: UserProfile = {
      ...profile,
      age: answers.age!,
      gender: answers.gender!,
      state: answers.state!,
      district: answers.district.trim() || undefined,
      occupation: role.occupation,
      annualIncome: band.assumedIncome,
      category: answers.category!,
      hasDisability: answers.hasDisability,
      isBPL: answers.isBPL,
      residenceType: answers.residenceType!,
      roleId: role.id,
      incomeBandId: band.id,
      education: answers.education,
      isMinority: answers.isMinority,
      interests: answers.interests,
      documents: answers.documents
    };
    updateProfile(nextProfile);

    setPhase('analysing');
    setError(false);
    setAnalysisStep(0);
    const ticker = window.setInterval(() => setAnalysisStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length)), MIN_ANALYSIS_MS / ANALYSIS_STEPS.length);

    const [res] = await Promise.all([
      ApiService.evaluateEligibility(nextProfile),
      new Promise((r) => setTimeout(r, MIN_ANALYSIS_MS))
    ]);
    window.clearInterval(ticker);

    if (!res) {
      setError(true);
      return;
    }

    const newReport: StoredReport = {
      profile: nextProfile,
      eligible: res.eligibleSchemes,
      partial: res.partialMatches,
      generatedAt: new Date().toISOString()
    };
    confirmProfile();
    setReport(newReport);
    writeStore('lastReport', newReport);
    setPhase('report');
    document.getElementById('eligibility-checker')?.scrollIntoView({ behavior: 'smooth' });
  };

  const startNew = () => {
    resetProfile();
    writeStore('lastReport', null);
    setReport(null);
    setAnswers(answersFromProfile(DEFAULT_PROFILE));
    setStep(1);
    setPhase('intro');
  };

  const editAnswers = () => {
    setAnswers(answersFromProfile(report?.profile || profile));
    setStep(1);
    setPhase('wizard');
  };

  // ---------- Report ----------
  if (phase === 'report' && report) {
    return (
      <section id="eligibility-checker" className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-10 scroll-mt-24">
        <EligibilityReport
          report={report}
          onSelectScheme={onSelectScheme}
          onStartNew={startNew}
          onEditAnswers={editAnswers}
          onOpenChat={onOpenChat}
        />
      </section>
    );
  }

  // ---------- Analysing ----------
  if (phase === 'analysing') {
    return (
      <section id="eligibility-checker" className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-10 scroll-mt-24">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" />
            <div className="absolute inset-3 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center">
              {error ? <AlertTriangle className="w-9 h-9 text-amber-500" /> : <Sparkles className="w-9 h-9 text-emerald-600 dark:text-emerald-400 animate-pulse" />}
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{t('anTitle')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t('anSubtitle')}</p>

          <ul className="max-w-sm mx-auto mt-8 space-y-3 text-left">
            {ANALYSIS_STEPS.map((key, i) => {
              const done = i < analysisStep;
              const active = i === analysisStep && !error;
              return (
                <li key={key} className={`flex items-center gap-3 text-sm font-semibold transition-opacity ${done || active ? 'opacity-100' : 'opacity-40'}`}>
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : active ? (
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                  <span className="text-slate-700 dark:text-slate-200">{t(key)}</span>
                </li>
              );
            })}
          </ul>

          {error && (
            <div role="alert" className="mt-8 max-w-md mx-auto space-y-4">
              <p className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-sm font-semibold text-rose-800 dark:text-rose-300">
                {t('anError')}
              </p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setPhase('wizard')} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-700">
                  {t('wizBack')}
                </button>
                <button onClick={runAssessment} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">
                  {t('anRetry')}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // ---------- Welcome ----------
  if (phase === 'intro') {
    const promises = [
      { Icon: UserRoundCheck, key: 'wizIntroPoint1' },
      { Icon: Lock, key: 'wizIntroPoint2' },
      { Icon: Sparkles, key: 'wizIntroPoint3' },
      { Icon: Clock, key: 'wizIntroPoint4' }
    ];
    return (
      <section id="eligibility-checker" className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-10 scroll-mt-24">
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-4 h-4" /> {t('wizIntroBadge')}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mt-5 leading-tight">{t('wizIntroTitle')}</h2>
              <p className="text-base text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">{t('wizIntroSubtitle')}</p>
              <button
                type="button"
                onClick={() => setPhase('wizard')}
                className="mt-8 inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 hover:scale-[1.02] transition-all"
              >
                {t('wizIntroStart')} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {promises.map(({ Icon, key }) => (
                <li key={key} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <span className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  // ---------- Wizard ----------
  const optionCard = (selected: boolean) =>
    `text-left p-4 sm:p-5 rounded-2xl border-2 transition-all hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
      selected
        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 shadow-md shadow-emerald-500/10'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-emerald-300 dark:hover:border-emerald-700'
    }`;
  const chip = (selected: boolean) =>
    `px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
      selected
        ? 'border-emerald-500 bg-emerald-600 text-white'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:border-emerald-300'
    }`;
  const label = 'block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3';
  const iconTile = (selected: boolean) =>
    `w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
      selected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
    }`;

  const header = (titleKey: string, subtitleKey: string) => (
    <div className="mb-8">
      <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">{t(titleKey)}</h2>
      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">{t(subtitleKey)}</p>
    </div>
  );

  return (
    <section id="eligibility-checker" className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-10 scroll-mt-24">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider mb-2">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t('wizStepOf', { step, total: TOTAL_STEPS })}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 transition-all duration-500"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Role */}
        {step === 1 && (
          <div>
            {header('wizRoleTitle', 'wizRoleSubtitle')}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ROLE_OPTIONS.map((role) => {
                const Icon = ROLE_ICONS[role.id];
                const selected = answers.roleId === role.id;
                return (
                  <button key={role.id} type="button" aria-pressed={selected} onClick={() => set({ roleId: role.id, age: role.id === 'senior' && !answers.age ? 60 : answers.age })} className={optionCard(selected)}>
                    <div className={iconTile(selected)}><Icon className="w-5 h-5" /></div>
                    <div className="font-extrabold text-slate-900 dark:text-white">{t(`role_${role.id}`)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t(`role_${role.id}_desc`)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div>
            {header('wizLocationTitle', 'wizLocationSubtitle')}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label htmlFor="state-search" className={label}>{t('wizStateLabel')}</label>
                <div className="relative mb-3">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="state-search"
                    type="text"
                    value={stateQuery}
                    onChange={(e) => setStateQuery(e.target.value)}
                    placeholder={answers.state || t('wizStatePlaceholder')}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStates.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { set({ state: s }); setStateQuery(''); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                        answers.state === s
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 font-bold text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{s}</span>
                      {answers.state === s && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
                <label htmlFor="district-input" className={`${label} mt-6`}>{t('wizDistrictLabel')}</label>
                <input
                  id="district-input"
                  type="text"
                  value={answers.district}
                  onChange={(e) => set({ district: e.target.value })}
                  placeholder={t('wizDistrictPlaceholder')}
                  maxLength={60}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <span className={label}>{t('wizAreaLabel')}</span>
                <div className="grid grid-cols-2 gap-4">
                  {(['Rural', 'Urban'] as const).map((area) => {
                    const selected = answers.residenceType === area;
                    const Icon = area === 'Rural' ? Tractor : Store;
                    return (
                      <button key={area} type="button" aria-pressed={selected} onClick={() => set({ residenceType: area })} className={optionCard(selected)}>
                        <div className={iconTile(selected)}><Icon className="w-5 h-5" /></div>
                        <div className="font-extrabold text-slate-900 dark:text-white">{t(`area_${area}`)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Personal details */}
        {step === 3 && (
          <div>
            {header('wizPersonalTitle', 'wizPersonalSubtitle')}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label htmlFor="age-input" className={label}>{t('wizAgeLabel')}</label>
                <div className="flex items-center gap-4">
                  <input
                    id="age-input"
                    type="number"
                    min={1}
                    max={120}
                    inputMode="numeric"
                    value={answers.age ?? ''}
                    onChange={(e) => set({ age: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-28 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('wizAgeUnit')}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={answers.age ?? 25}
                  onChange={(e) => set({ age: Number(e.target.value) })}
                  aria-label={t('wizAgeLabel')}
                  className="w-full mt-4 accent-emerald-600"
                />

                <span className={`${label} mt-8`}>{t('wizGenderLabel')}</span>
                <div className="flex flex-wrap gap-3">
                  {GENDERS.map((g) => (
                    <button key={g} type="button" aria-pressed={answers.gender === g} onClick={() => set({ gender: g })} className={chip(answers.gender === g)}>
                      {t(`gender_${g}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className={label}>{t('wizEducationLabel')}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EDUCATION_LEVELS.map((edu) => (
                    <button key={edu} type="button" aria-pressed={answers.education === edu} onClick={() => set({ education: edu })} className={`${optionCard(answers.education === edu)} !p-4 flex items-center gap-3`}>
                      <GraduationCap className={`w-5 h-5 shrink-0 ${answers.education === edu ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{t(`edu_${edu}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Income, category, special status */}
        {step === 4 && (
          <div>
            {header('wizEligibilityTitle', 'wizEligibilitySubtitle')}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <span className={label}>{t('wizIncomeLabel')}</span>
                <div className="space-y-3">
                  {INCOME_BANDS.map((band) => {
                    const selected = answers.incomeBandId === band.id;
                    return (
                      <button key={band.id} type="button" aria-pressed={selected} onClick={() => set({ incomeBandId: band.id })} className={`${optionCard(selected)} w-full !p-4 flex items-center justify-between`}>
                        <span className="flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-lg flex items-center justify-center font-black ${selected ? 'bg-emerald-600 text-white' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'}`}>₹</span>
                          <span className="font-bold text-slate-900 dark:text-white">{t(`income_${band.id}`)}</span>
                        </span>
                        {selected ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className={label}>{t('wizCategoryLabel')}</span>
                <div className="flex flex-wrap gap-3">
                  {SOCIAL_CATEGORIES.map((c) => (
                    <button key={c} type="button" aria-pressed={answers.category === c} onClick={() => set({ category: c })} className={chip(answers.category === c)}>
                      {c === 'General' ? t('cat_General') : c}
                    </button>
                  ))}
                </div>

                <span className={`${label} mt-8`}>{t('wizSpecialLabel')}</span>
                <div className="space-y-3">
                  {([
                    { key: 'isBPL', id: 'bpl', Icon: ClipboardList },
                    { key: 'hasDisability', id: 'disability', Icon: Accessibility },
                    { key: 'isMinority', id: 'minority', Icon: Users }
                  ] as const).map(({ key, id, Icon }) => {
                    const selected = answers[key];
                    return (
                      <button key={id} type="button" aria-pressed={selected} onClick={() => set({ [key]: !selected } as Partial<Answers>)} className={`${optionCard(selected)} w-full !p-4 flex items-center gap-3`}>
                        <Icon className={`w-5 h-5 shrink-0 ${selected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                        <span className="flex-1">
                          <span className="block font-bold text-sm text-slate-900 dark:text-white">{t(`special_${id}`)}</span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">{t(`special_${id}_desc`)}</span>
                        </span>
                        {selected ? <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Interests */}
        {step === 5 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              {header('wizInterestTitle', 'wizInterestSubtitle')}
              <span className="mb-8 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t('wizInterestCount', { count: answers.interests.length, max: MAX_INTERESTS })}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {INTEREST_OPTIONS.map((opt) => {
                const Icon = INTEREST_ICONS[opt.id];
                const selected = answers.interests.includes(opt.id);
                const disabled = !selected && answers.interests.length >= MAX_INTERESTS;
                return (
                  <button key={opt.id} type="button" aria-pressed={selected} disabled={disabled} onClick={() => toggleInterest(opt.id)} className={`${optionCard(selected)} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    <div className={iconTile(selected)}><Icon className="w-5 h-5" /></div>
                    <div className="font-extrabold text-slate-900 dark:text-white">{t(`interest_${opt.id}`)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t(`interest_${opt.id}_desc`)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6: Documents the citizen already has (declared, nothing uploaded) */}
        {step === 6 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-8">
              <div>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">{st('wizDocsTitle')}</h2>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">{st('wizDocsSubtitle')}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {st('wizDocsCount', { count: answers.documents.length, total: DOCUMENT_TYPES.length })}
                </span>
                <button
                  type="button"
                  onClick={() => set({ documents: answers.documents.length === DOCUMENT_TYPES.length ? [] : [...DOCUMENT_TYPES] })}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500"
                >
                  {answers.documents.length === DOCUMENT_TYPES.length ? st('wizDocsClear') : st('wizDocsAll')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {DOCUMENT_TYPES.map((id) => {
                const Icon = DOCUMENT_ICONS[id];
                const selected = answers.documents.includes(id);
                return (
                  <button key={id} type="button" aria-pressed={selected} onClick={() => toggleDocument(id)} className={`${optionCard(selected)} relative`}>
                    {selected && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                    <div className={iconTile(selected)}><Icon className="w-5 h-5" /></div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">{st(`doc_${id}`)}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{st(`doc_${id}_desc`)}</div>
                  </button>
                );
              })}
            </div>
            <p className="flex items-center gap-2 mt-6 text-xs text-slate-500 dark:text-slate-400">
              <Lock className="w-4 h-4 shrink-0" /> {st('wizDocsPrivacy')}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-0 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> {t('wizBack')}
          </button>
          <button
            type="button"
            disabled={!stepValid}
            onClick={() => (step < TOTAL_STEPS ? setStep(step + 1) : runAssessment())}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed transition-all"
          >
            {step < TOTAL_STEPS ? t('wizContinue') : (<><Sparkles className="w-4 h-4" /> {t('wizSeeResults')}</>)}
            {step < TOTAL_STEPS && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </section>
  );
};
