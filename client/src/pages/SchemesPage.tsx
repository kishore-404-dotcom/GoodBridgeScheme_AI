import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, ArrowRight, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Scheme } from '../../../shared/types';
import { useLanguage } from '../context/LanguageContext';
import { useSiteText } from '../hooks/useSiteText';
import { applyLink, howToApplyHref } from '../utils/applyLink';
import { useSchemeTranslations, prefetchSchemeTranslation } from '../hooks/useSchemeTranslations';
import { CATEGORIES_LIST, categoryLabelKey } from '../components/CategoryGrid';

interface SchemesPageProps {
  schemes: Scheme[];
  initialQuery: string;
  initialCategory: string;
}

type SortKey = 'relevance' | 'benefit' | 'name';

/** Schemes per page (only the current page is rendered and translated) */
const PAGE_SIZE = 20;

/** Page numbers to show: first, last, and the current page's neighbours, with gaps as null */
const pageItems = (current: number, total: number): (number | null)[] => {
  const wanted = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  // Avoid a lone gap: show page 2 / total-1 instead of "…" when only one page is skipped
  if (wanted.has(3)) wanted.add(2);
  if (wanted.has(total - 2)) wanted.add(total - 1);
  const sorted = [...wanted].sort((a, b) => a - b);
  const items: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) items.push(null);
    items.push(n);
  });
  return items;
};

// Option values match the values used in the scheme eligibility rules
const GENDER_OPTIONS = ['Female', 'Male'];
const SOCIAL_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'EWS'];

/** A rule list with no entries (or an "All" entry) means the scheme is open to everyone */
const allows = (list: string[] | undefined, value: string, openValues: string[] = ['All']): boolean =>
  !list || list.length === 0 || list.some((v) => openValues.includes(v)) || list.includes(value);

const matchesQuery = (s: Scheme, q: string): boolean =>
  [s.name, s.description, s.summaryText, s.category, s.ministryOrDepartment, ...s.tags]
    .join(' ')
    .toLowerCase()
    .includes(q);

export const SchemesPage: React.FC<SchemesPageProps> = ({ schemes, initialQuery, initialCategory }) => {
  const { t, currentLanguage } = useLanguage();
  const st = useSiteText();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [gender, setGender] = useState('');
  const [social, setSocial] = useState('');
  const [sort, setSort] = useState<SortKey>('relevance');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = schemes.filter((s) => {
      const rules = s.eligibilityRules || {};
      return (
        (!q || matchesQuery(s, q)) &&
        (!category || s.category === category) &&
        (!gender || allows(rules.genderAllowed, gender)) &&
        (!social || allows(rules.categoriesAllowed, social))
      );
    });

    if (sort === 'benefit') return [...filtered].sort((a, b) => b.financialBenefitAmount - a.financialBenefitAmount);
    if (sort === 'name') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    if (q) {
      // Relevance: schemes whose name matches the query come first
      return [...filtered].sort((a, b) => Number(b.name.toLowerCase().includes(q)) - Number(a.name.toLowerCase().includes(q)));
    }
    return filtered;
  }, [schemes, query, category, gender, social, sort]);

  const [page, setPage] = useState(1);
  const resultsTopRef = useRef<HTMLDivElement>(null);
  // Start from the first page whenever the search or filters change
  useEffect(() => setPage(1), [results]);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const firstIndex = (page - 1) * PAGE_SIZE;
  const { schemes: visibleSchemes, loading: translating } = useSchemeTranslations(results.slice(firstIndex, firstIndex + PAGE_SIZE), 'card');

  const goToPage = (n: number) => {
    setPage(Math.min(Math.max(n, 1), pageCount));
    resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const activeFilterCount = [category, gender, social].filter(Boolean).length;
  const clearAll = () => {
    setCategory('');
    setGender('');
    setSocial('');
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
        <aside className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
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

          <div className="filter-scroll px-5 pb-4 lg:overflow-y-auto lg:overscroll-contain min-h-0">
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
          </div>
        </aside>

        {/* Results */}
        <div ref={resultsTopRef} className="space-y-5 min-w-0 scroll-mt-36">
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
                  <article
                    // Hovering or focusing a card starts translating its full page, so it opens translated
                    onMouseEnter={() => prefetchSchemeTranslation(currentLanguage.code, scheme.schemeId, 'full')}
                    onFocus={() => prefetchSchemeTranslation(currentLanguage.code, scheme.schemeId, 'full')}
                    className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 hover:shadow-lg transition-all p-6 flex flex-col md:flex-row md:items-start gap-5">
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
                      {(() => {
                        const apply = applyLink(scheme);
                        const cls = 'px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors';
                        return apply ? (
                          <a href={apply.url} target="_blank" rel="noopener noreferrer" className={cls}>
                            {st(apply.labelKey)} <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <a href={howToApplyHref(scheme.schemeId)} className={cls} title={st('applyOfflineNote')}>
                            {st('applyOfflineTitle')} <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        );
                      })()}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
          {pageCount > 1 && (
            <nav aria-label={st('pageNav')} className="flex flex-col items-center gap-3 pt-4">
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold flex items-center gap-1 hover:border-emerald-500 disabled:opacity-40 disabled:hover:border-slate-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> {st('prevPage')}
                </button>
                {pageItems(page, pageCount).map((n, i) =>
                  n === null ? (
                    <span key={`gap-${i}`} className="w-8 text-center text-slate-400" aria-hidden="true">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => goToPage(n)}
                      aria-current={n === page ? 'page' : undefined}
                      aria-label={st('goToPage', { page: n })}
                      className={`h-10 min-w-10 px-3 rounded-xl text-sm font-extrabold border transition-colors ${
                        n === page
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/25'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === pageCount}
                  className="h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold flex items-center gap-1 hover:border-emerald-500 disabled:opacity-40 disabled:hover:border-slate-300 transition-colors"
                >
                  {st('nextPage')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {st('pageRange', { from: firstIndex + 1, to: Math.min(firstIndex + PAGE_SIZE, results.length), total: results.length })}
              </p>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
};
