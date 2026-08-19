import React, { useState } from 'react';
import { Scheme, ApplicationDraft } from '../../../shared/types';
import { X, Volume2, FileText, CheckCircle2, ExternalLink, Printer, Download, Sparkles, ShieldCheck } from 'lucide-react';
import { SpeechService } from '../services/speechService';
import { ApiService } from '../services/apiService';
import { useLanguage } from '../context/LanguageContext';
import { useProfile } from '../context/ProfileContext';

interface SchemeDetailModalProps {
  scheme: Scheme | null;
  onClose: () => void;
}

export const SchemeDetailModal: React.FC<SchemeDetailModalProps> = ({ scheme, onClose }) => {
  const { currentLanguage, t } = useLanguage();
  const { profile } = useProfile();
  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!scheme) return null;

  const handleSpeak = () => {
    if (isPlaying) {
      SpeechService.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const text = `${scheme.name}. ${scheme.description}. Financial benefit: ${scheme.financialBenefit}. Application procedure: ${scheme.applicationSteps.map((s) => s.title).join(', ')}.`;
      SpeechService.speak(text, currentLanguage.code, () => setIsPlaying(false));
    }
  };

  const handleGenerateDraft = async () => {
    setLoadingDraft(true);
    const generated = await ApiService.generateDraft(scheme.schemeId, profile.fullName, currentLanguage.name);
    setDraft(generated);
    setLoadingDraft(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card w-full max-w-3xl rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              {scheme.category}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              {scheme.level} Government
            </span>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified: {scheme.lastCheckedDate}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {scheme.name}
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-sm shadow-md">
              💰 Financial Benefit: {scheme.financialBenefit}
            </div>

            <button
              onClick={handleSpeak}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isPlaying
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlaying ? 'Stop Voice' : `Read Aloud (${currentLanguage.nativeName})`}</span>
            </button>
          </div>
        </div>

        {/* Detailed Scheme Content */}
        <div className="py-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{scheme.description}</p>
          </div>

          {/* Documents Required */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Required Documents Checklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scheme.documentsRequired.map((doc, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Application Steps */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Step-by-Step Application Guide</h3>
            <div className="space-y-3">
              {scheme.applicationSteps.map((step) => (
                <div key={step.stepNumber} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {step.stepNumber}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{step.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-filled Regional Draft Generator */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900/20 via-slate-900/10 to-amber-900/20 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pre-Filled Regional Application Draft</h4>
              </div>
              <button
                onClick={handleGenerateDraft}
                disabled={loadingDraft}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow"
              >
                {loadingDraft ? 'Generating Draft...' : '⚡ Generate Draft Preview'}
              </button>
            </div>

            {draft && (
              <div className="mt-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 font-mono">
                <div className="flex justify-between font-bold text-emerald-600 border-b pb-2">
                  <span>OFFICIAL APPLICATION PREVIEW DRAFT</span>
                  <span>Date: {draft.generatedDate}</span>
                </div>
                <p><strong>Applicant Name:</strong> {draft.applicantName}</p>
                <p><strong>Scheme:</strong> {draft.schemeName} ({draft.schemeId})</p>
                <p><strong>Language:</strong> {draft.language}</p>
                <p><strong>Official Submission Link:</strong> {scheme.applicationUrl}</p>
                <div className="pt-2 flex gap-2">
                  <button onClick={() => window.print()} className="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-sans font-bold flex items-center gap-1">
                    <Printer className="w-3.5 h-3.5" /> Print Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
          >
            Close Window
          </button>

          <a
            href={scheme.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2"
          >
            <span>Proceed to Official Government Portal</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
