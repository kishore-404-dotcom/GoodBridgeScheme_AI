import React, { useState } from 'react';
import { Zap, CheckCircle2, AlertCircle, ArrowRight, RotateCcw, Filter } from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { ApiService } from '../services/apiService';
import { EligibilityEvaluationResult } from '../../../shared/types';

interface QuickEligibilityCardProps {
  onSelectScheme: (schemeId: string) => void;
}

export const QuickEligibilityCard: React.FC<QuickEligibilityCardProps> = ({ onSelectScheme }) => {
  const { profile, updateProfile } = useProfile();
  const [evalResults, setEvalResults] = useState<EligibilityEvaluationResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await ApiService.evaluateEligibility(profile);
    setEvalResults(res.allEvaluations.slice(0, 6)); // Top 6 matching schemes
    setLoading(false);
  };

  return (
    <section id="eligibility-checker" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Zap className="w-5 h-5 fill-emerald-500 text-emerald-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Embedded Citizen Eligibility Assessment Engine
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter basic details below for an instant deterministic match against 100 verified central & state schemes.
            </p>
          </div>

          {evalResults && (
            <button
              onClick={() => setEvalResults(null)}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Questionnaire
            </button>
          )}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleEvaluate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Age */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Age (Years): <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{profile.age} yrs</span>
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
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">State / UT</label>
            <select
              value={profile.state}
              onChange={(e) => updateProfile({ state: e.target.value })}
              className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
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
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Occupation / Status</label>
            <select
              value={profile.occupation}
              onChange={(e) => updateProfile({ occupation: e.target.value })}
              className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
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
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Annual Family Income: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹{profile.annualIncome.toLocaleString('en-IN')}</span>
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

          {/* Social Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <select
              value={profile.category}
              onChange={(e) => updateProfile({ category: e.target.value as any })}
              className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="General">General</option>
              <option value="OBC">OBC (Other Backward Classes)</option>
              <option value="SC">SC (Scheduled Caste)</option>
              <option value="ST">ST (Scheduled Tribe)</option>
              <option value="EWS">EWS (Economically Weaker Section)</option>
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
            <select
              value={profile.gender}
              onChange={(e) => updateProfile({ gender: e.target.value as any })}
              className="w-full text-xs font-semibold p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Genders</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>

          {/* Special Status Toggles */}
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.isBPL}
                onChange={(e) => updateProfile({ isBPL: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Holds BPL Ration Card (Below Poverty Line)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.hasDisability}
                onChange={(e) => updateProfile({ hasDisability: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Person with Benchmark Disability (Divyangjan)</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>{loading ? 'Evaluating Rules...' : 'Run Eligibility Check'}</span>
            </button>
          </div>
        </form>

        {/* Results Panel */}
        {evalResults && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>Instant Diagnostic Results ({evalResults.filter((r) => r.isEligible).length} Eligible Schemes Found)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evalResults.map((item) => (
                <div
                  key={item.scheme.schemeId}
                  onClick={() => onSelectScheme(item.scheme.schemeId)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-lg ${
                    item.isEligible
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.scheme.category}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                        item.isEligible ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {item.matchScorePercentage}% Match
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {item.scheme.name}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-extrabold mb-2">
                    💰 {item.scheme.financialBenefit}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                    {item.aiSimplifiedExplanation}
                  </p>

                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>View Scheme Details & Apply</span>
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
