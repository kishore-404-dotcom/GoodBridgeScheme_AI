import React from 'react';
import { GraduationCap, Tractor, Briefcase, ArrowRight } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

interface PersonaQuickSelectProps {
  onFilterCategory: (category: string) => void;
}

export const PersonaQuickSelect: React.FC<PersonaQuickSelectProps> = ({ onFilterCategory }) => {
  const { updateProfile } = useProfile();

  const handleSelectPersona = (occupation: string, category: string, age: number) => {
    updateProfile({ occupation, age });
    onFilterCategory(category);
    const element = document.getElementById('eligibility-checker');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Solution in Action (Citizen Personas)
        </h3>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Quick-Launch Schemes for Your Role
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student */}
        <div
          onClick={() => handleSelectPersona('Student', 'Student / Education', 19)}
          className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Student & Youth</h4>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 mb-4">
            <li>✔ Post-Matric & Merit Scholarships</li>
            <li>✔ AICTE Girl Student Grants (₹50k/yr)</li>
            <li>✔ PM YASASVI & Vidya Laxmi Education Loans</li>
          </ul>
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>Find 25 Student Schemes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Farmer */}
        <div
          onClick={() => handleSelectPersona('Farmer', 'Agriculture / Farmers', 42)}
          className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Tractor className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Farmer & Agriculture</h4>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 mb-4">
            <li>✔ PM-KISAN ₹6,000 Direct Cash Transfer</li>
            <li>✔ PM Fasal Bima Crop Insurance</li>
            <li>✔ PM Kusum Solar Pumps & Kisan Credit Card</li>
          </ul>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>Find 20 Farmer Schemes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Entrepreneur */}
        <div
          onClick={() => handleSelectPersona('Self-Employed', 'Entrepreneurship / MSME', 34)}
          className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Briefcase className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Entrepreneur & MSME</h4>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 mb-4">
            <li>✔ PM MUDRA Loans (up to ₹10 Lakh)</li>
            <li>✔ PM Vishwakarma Artisans Toolkit Grant</li>
            <li>✔ Stand Up India SC/ST & Women Business Loans</li>
          </ul>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>Find 20 Business Schemes</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </section>
  );
};
