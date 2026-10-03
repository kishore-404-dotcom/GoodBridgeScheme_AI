import React from 'react';
import { GraduationCap, Tractor, Briefcase, Heart, UserCheck, Wrench, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteText } from '../hooks/useSiteText';
import { VERIFIED_SCHEMES_100 } from '../data/seedSchemes';

interface CategoryGridProps {
  onSelectCategory: (category: string) => void;
}

/** Translation key for a scheme category label (falls back to the English category) */
export const categoryLabelKey = (category: string): string =>
  CATEGORIES_LIST.find((c) => c.id === category)?.labelKey || category;

export const CATEGORIES_LIST = [
  { id: 'Student / Education', title: 'Student / Education', labelKey: 'catStudent', icon: GraduationCap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' },
  { id: 'Agriculture / Farmers', title: 'Agriculture / Farmers', labelKey: 'catAgri', icon: Tractor, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' },
  { id: 'Entrepreneurship / MSME', title: 'Entrepreneurship / MSME', labelKey: 'catBiz', icon: Briefcase, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' },
  { id: 'Women / Family Welfare', title: 'Women / Family Welfare', labelKey: 'catWomen', icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800' },
  { id: 'Senior Citizens / Social Welfare', title: 'Senior Citizens / Social Welfare', labelKey: 'catSocial', icon: UserCheck, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800' },
  { id: 'Employment / Skill Development', title: 'Employment / Skill Development', labelKey: 'catSkills', icon: Wrench, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800' }
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelectCategory }) => {
  const { t } = useLanguage();
  const st = useSiteText();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          {t('findCategoriesTitle')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {st('categoriesSubtitle', { count: VERIFIED_SCHEMES_100.length })}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {CATEGORIES_LIST.map((cat) => {
          const IconComp = cat.icon;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[160px] hover:border-emerald-500 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className={`p-3 rounded-xl mb-2 border ${cat.color}`}>
                <IconComp className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] font-extrabold block text-slate-400 dark:text-slate-500">
                  {st('schemeCount', { count: VERIFIED_SCHEMES_100.filter((s) => s.category === cat.id).length })}
                </span>
                <h4 className="text-sm font-extrabold leading-tight mt-0.5 text-slate-900 dark:text-white">
                  {st(cat.labelKey)}
                </h4>
              </div>

              <div className="mt-2 text-[11px] font-bold flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400">
                <span>{st('viewSchemes')}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
