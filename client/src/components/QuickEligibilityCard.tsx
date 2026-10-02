import React, { useState } from 'react';
import { Zap, CheckCircle2, RotateCcw, Filter, ArrowRight } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useLanguage } from '../context/LanguageContext';
import { ApiService } from '../services/apiService';
import { EligibilityEvaluationResult } from '../../../shared/types';

interface QuickEligibilityCardProps {
  onSelectScheme: (schemeId: string) => void;
}

export const QuickEligibilityCard: React.FC<QuickEligibilityCardProps> = ({ onSelectScheme }) => {
  const { profile, updateProfile, confirmProfile } = useProfile();
  const { t } = useLanguage();
  const [evalResults, setEvalResults] = useState<EligibilityEvaluationResult[] | null>(null);
  const [totalEligible, setTotalEligible] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await ApiService.evaluateEligibility(profile);
    if (res) {
      confirmProfile();
      setEvalResults(res.allEvaluations.slice(0, 6)); // Top 6 matching schemes
      setTotalEligible(res.eligibleSchemes.length);
    } else {
      setEvalResults(null);
      setError('Could not check eligibility because the server is not reachable. Please make sure the backend is running and try again.');
    }
    setLoading(false);
  };

  return (
    <section id="eligibility-checker" className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-10">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Zap className="w-6 h-6 fill-emerald-500 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {t('eligTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('eligSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {evalResults && (
            <button
              onClick={() => setEvalResults(null)}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <RotateCcw className="w-4 h-4" /> Reset Filters
            </button>
          )}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleEvaluate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Age */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Citizen Age: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">{profile.age} Years</span>
            </label>
            <input
              type="range"
              min="10"
              max="90"
              value={profile.age}
              onChange={(e) => updateProfile({ age: parseInt(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* State */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">State Domicile</label>
            <select
              value={profile.state}
              onChange={(e) => updateProfile({ state: e.target.value })}
              className="w-full text-xs font-bold p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All India">All India (Central Schemes)</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Bihar">Bihar</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Kerala">Kerala</option>
              <option value="Punjab">Punjab</option>
            </select>
          </div>

          {/* Occupation */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Occupation / Status</label>
            <select
              value={profile.occupation}
              onChange={(e) => updateProfile({ occupation: e.target.value })}
              className="w-full text-xs font-bold p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Student">Student</option>
              <option value="Farmer">Farmer / Agricultural Worker</option>
              <option value="Self-Employed">Self-Employed / MSME Owner</option>
              <option value="Artisan">Artisan / Craftsman (Vishwakarma)</option>
              <option value="Homemaker">Homemaker / Unemployed Woman</option>
              <option value="Senior Citizen">Senior Citizen (60+ yrs)</option>
              <option value="General Citizen">General Citizen</option>
            </select>
          </div>

          {/* Annual Income */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Annual Family Income: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">₹{profile.annualIncome.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="range"
              min="30000"
              max="1200000"
              step="10000"
              value={profile.annualIncome}
              onChange={(e) => updateProfile({ annualIncome: parseInt(e.target.value) })}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Category */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Social Category</label>
            <select
              value={profile.category}
              onChange={(e) => updateProfile({ category: e.target.value as any })}
              className="w-full text-xs font-bold p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="General">General</option>
              <option value="OBC">OBC (Other Backward Classes)</option>
              <option value="SC">SC (Scheduled Caste)</option>
              <option value="ST">ST (Scheduled Tribe)</option>
              <option value="EWS">EWS (Economically Weaker Section)</option>
            </select>
          </div>

          {/* Gender */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Gender</label>
            <select
              value={profile.gender}
              onChange={(e) => updateProfile({ gender: e.target.value as any })}
              className="w-full text-xs font-bold p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Genders</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>

          {/* Special Status Toggles */}
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.isBPL}
                  onChange={(e) => updateProfile({ isBPL: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span>Holds BPL Ration Card</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.hasDisability}
                  onChange={(e) => updateProfile({ hasDisability: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span>Person with Benchmark Disability (Divyangjan)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>{loading ? t('eligCalculating') : t('eligFindBtn')}</span>
            </button>
          </div>
        </form>

        {error && (
          <div role="alert" className="mt-8 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-sm font-semibold text-rose-800 dark:text-rose-300">
            ⚠️ {error}
          </div>
        )}

        {/* Results Panel */}
        {evalResults && (
          <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <span>{t('eligFound', { count: totalEligible })}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {evalResults.map((item) => (
                <div
                  key={item.scheme.schemeId}
                  onClick={() => onSelectScheme(item.scheme.schemeId)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-xl ${
                    item.isEligible
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.scheme.category}
                    </span>
                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full ${
                        item.isEligible ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {item.matchScorePercentage}% Match
                    </span>
                  </div>

                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1 mb-2">
                    {item.scheme.name}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-extrabold mb-3">
                    💰 {item.scheme.financialBenefit}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                    {item.aiSimplifiedExplanation}
                  </p>

                  <div className="flex items-center justify-between text-xs font-extrabold text-emerald-600 dark:text-emerald-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <span>Check Application Steps</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
