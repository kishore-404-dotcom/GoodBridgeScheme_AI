import React, { useMemo, useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowRight, ExternalLink, X } from 'lucide-react';
import { Scheme } from '../../../shared/types';
import { useLanguage } from '../context/LanguageContext';
import { useSiteText } from '../hooks/useSiteText';
import { useSchemeTranslations } from '../hooks/useSchemeTranslations';
import { CATEGORIES_LIST, categoryLabelKey } from '../components/CategoryGrid';

interface SchemesPageProps {
  schemes: Scheme[];
  initialQuery: string;
  initialCategory: string;
}

type SortKey = 'relevance' | 'benefit' | 'name';

/** Cards rendered (and translated) at a time; "Show more" reveals the next page */
const PAGE_SIZE = 20;

// Option values match the values used in the scheme eligibility rules
const GENDER_OPTIONS = ['Female', 'Male'];
const SOCIAL_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const OCCUPATION_OPTIONS = [
  { value: 'Student', labelKey: 'occStudent' },
  { value: 'Farmer', labelKey: 'occFarmer' },
  { value: 'Self-Employed', labelKey: 'occSelfEmployed' },
  { value: 'Artisan', labelKey: 'occArtisan' },
  { value: 'Homemaker', labelKey: 'occHomemaker' },
  { value: 'Rural Laborer', labelKey: 'occRuralWorker' }
];

/** A rule list with no entries (or an "All" entry) means the scheme is open to everyone */
const allows = (list: string[] | undefined, value: string, openValues: string[] = ['All']): boolean =>
  !list || list.length === 0 || list.some((v) => openValues.includes(v)) || list.includes(value);

const matchesQuery = (s: Scheme, q: string): boolean =>
  [s.name, s.description, s.summaryText, s.category, s.ministryOrDepartment, ...s.tags]
    .join(' ')
    .toLowerCase()
    .includes(q);

export const SchemesPage: React.FC<SchemesPageProps> = ({ schemes, initialQuery, initialCategory }) => {
  const { t } = useLanguage();
  const st = useSiteText();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [gender, setGender] = useState('');
  const [social, setSocial] = useState('');
  const [occupation, setOccupation] = useState('');
  const [sort, setSort] = useState<SortKey>('relevance');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = schemes.filter((s) => {
      const rules = s.eligibilityRules || {};
      return (
        (!q || matchesQuery(s, q)) &&
        (!category || s.category === category) &&
        (!gender || allows(rules.genderAllowed, gender)) &&
        (!social || allows(rules.categoriesAllowed, social)) &&
        (!occupation || allows(rules.occupationsAllowed, occupation, ['All', 'All Citizens']))
      );
    });

    if (sort === 'benefit') return [...filtered].sort((a, b) => b.financialBenefitAmount - a.financialBenefitAmount);
    if (sort === 'name') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (q) {
      // Relevance: schemes whose name matches the query come first
      return [...filtered].sort((a, b) => Number(b.name.toLowerCase().includes(q)) - Number(a.name.toLowerCase().includes(q)));
    }
    return filtered;
  }, [schemes, query, category, gender, social, occupation, sort]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Start from the first page whenever the search or filters change
  useEffect(() => setVisibleCount(PAGE_SIZE), [results]);
  const { schemes: visibleSchemes, loading: translating } = useSchemeTranslations(results.slice(0, visibleCount), 'card');

  const activeFilterCount = [category, gender, social, occupation].filter(Boolean).length;
  const clearAll = () => {
    setCategory('');
    setGender('');
    setSocial('');
    setOccupation('');
  };

  const radioGroup = (
    name: string,
    title: string,
    value: string,
    onChange: (v: string) => void,
    options: { value: string; label: string; count?: number }[]
  ) => (
    <fieldset className="py-4 border-b border-slate-200 dark:border-slate-800 last:border-b-0">
      <legend className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">{title}</legend>
      <div className="space-y-1">
        {[{ value: '', label: st('filterAny') }, ...options].map((opt) => (
          <label
            key={opt.value || 'any'}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors ${
              value === opt.value
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <input
                type="radio"
                name={name}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="accent-emerald-600"
              />
              {opt.label}
            </span>
            {opt.count !== undefined && <span className="text-xs text-slate-400">{opt.count}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">{st('schemesTitle')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{st('schemesSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-8 items-start">
        {/* Filter Sidebar */}
        <aside className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 px-5 py-4 lg:sticky lg:top-32">
          <div className="flex items-center justify-between pb-2">
            <h2 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              {st('filtersTitle')}
              {activeFilterCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">{activeFilterCount}</span>
              )}
            </h2>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                {st('clearFilters')}
              </button>
            )}
          </div>

          {radioGroup(
            'category',
            st('filterCategory'),
            category,
            setCategory,
            CATEGORIES_LIST.map((c) => ({
              value: c.id,
              label: st(c.labelKey),
              count: schemes.filter((s) => s.category === c.id).length
            }))
          )}
          {radioGroup('gender', st('filterGender'), gender, setGender, GENDER_OPTIONS.map((g) => ({ value: g, label: st(g === 'Female' ? 'genderFemale' : 'genderMale') })))}
          {radioGroup('social', st('filterSocialCategory'), social, setSocial, SOCIAL_OPTIONS.map((c) => ({ value: c, label: c === 'General' ? st('socialGeneral') : c })))}
          {radioGroup('occupation', st('filterOccupation'), occupation, setOccupation, OCCUPATION_OPTIONS.map((o) => ({ value: o.value, label: st(o.labelKey) })))}
        </aside>

        {/* Results */}
        <div className="space-y-5 min-w-0">
          {/* Search + Sort Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="flex-1 min-w-0 bg-transparent py-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-700" aria-label={st('clearFilters')}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
              <span className="whitespace-nowrap">{st('sortBy')}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="px-3 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500"
              >
                <option value="relevance">{st('sortRelevance')}</option>
                <option value="benefit">{st('sortBenefit')}</option>
                <option value="name">{st('sortName')}</option>
              </select>
            </label>
          </div>

          <p className="text-sm font-bold text-slate-500 dark:text-slate-400" aria-live="polite">
            {st('resultsCount', { count: results.length })}
            {translating && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold">· {st('translating')}</span>}
          </p>

          {results.length === 0 ? (
            <div className="glass-card rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400">
              {st('noResults')}
            </div>
          ) : (
            <ul className="space-y-4">
              {visibleSchemes.map((scheme) => (
                <li key={scheme.schemeId}>
                  <article className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 hover:shadow-lg transition-all p-6 flex flex-col md:flex-row md:items-start gap-5">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {st(categoryLabelKey(scheme.category))}
                        </span>
                        <span className="text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {st(scheme.level === 'State' ? 'levelState' : 'levelCentral')}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                        <a href={`#/scheme/${scheme.schemeId}`} className="hover:text-emerald-700 dark:hover:text-emerald-400">
                          {scheme.name}
                        </a>
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{scheme.ministryOrDepartment}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{scheme.summaryText}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {scheme.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="md:w-64 shrink-0 flex flex-col gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <div className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400">{st('benefitLabel')}</div>
                        <div className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">{scheme.financialBenefit}</div>
                      </div>
                      <a
                        href={`#/scheme/${scheme.schemeId}`}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-colors"
                      >
                        {st('viewDetails')} <ArrowRight className="w-4 h-4" />
                      </a>
                      <a
                        href={scheme.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {st('officialWebsite')} <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
          {results.length > visibleCount && (
            <div className="text-center pt-2">
              <button
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="px-6 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500 font-bold text-sm transition-colors"
              >
                {st('showMore', { count: Math.min(PAGE_SIZE, results.length - visibleCount) })}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
