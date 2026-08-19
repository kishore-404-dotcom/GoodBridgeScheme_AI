import React from 'react';
import { GraduationCap, Tractor, Briefcase, Heart, UserCheck, Wrench, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CategoryGridProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CATEGORIES_LIST = [
  { id: 'Student / Education', title: 'Student / Education', count: 25, icon: GraduationCap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' },
  { id: 'Agriculture / Farmers', title: 'Agriculture / Farmers', count: 20, icon: Tractor, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' },
  { id: 'Entrepreneurship / MSME', title: 'Entrepreneurship / MSME', count: 20, icon: Briefcase, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' },
  { id: 'Women / Family Welfare', title: 'Women / Family Welfare', count: 15, icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800' },
  { id: 'Senior Citizens / Social Welfare', title: 'Senior Citizens / Social Welfare', count: 10, icon: UserCheck, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800' },
  { id: 'Employment / Skill Development', title: 'Employment / Skill Development', count: 10, icon: Wrench, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800' }
];

export const CategoryGrid: React.FC<CategoryGridProps> = ({ selectedCategory, onSelectCategory }) => {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
          {t('findCategoriesTitle')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Explore 100 verified central & state welfare programs grouped by beneficiary sector.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {CATEGORIES_LIST.map((cat) => {
          const IconComp = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? 'All' : cat.id)}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[140px] ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl shadow-emerald-600/30 scale-105'
                  : 'glass-card hover:border-emerald-500 hover:shadow-md'
              }`}
            >
              <div className={`p-3 rounded-xl mb-2 border ${isSelected ? 'bg-white/20 text-white border-transparent' : cat.color}`}>
                <IconComp className="w-6 h-6" />
              </div>

              <div>
                <span className={`text-[11px] font-extrabold block ${isSelected ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                  {cat.count} Verified Schemes
                </span>
                <h4 className={`text-xs font-extrabold leading-tight mt-0.5 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {cat.title}
                </h4>
              </div>

              <div className="mt-2 text-[10px] font-bold flex items-center gap-0.5">
                <span>{isSelected ? 'Selected' : 'Filter'}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
