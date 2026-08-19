import React, { useState } from 'react';
import { Scheme } from '../../../shared/types';
import { Volume2, Bookmark, CheckCircle2, FileText, ExternalLink, Filter } from 'lucide-react';
import { SpeechService } from '../services/speechService';
import { useLanguage } from '../context/LanguageContext';
import { useProfile } from '../context/ProfileContext';

interface SchemeCatalogProps {
  schemes: Scheme[];
  onSelectScheme: (schemeId: string) => void;
  onOpenDocumentChecker: (scheme: Scheme) => void;
}

export const SchemeCatalog: React.FC<SchemeCatalogProps> = ({
  schemes,
  onSelectScheme,
  onOpenDocumentChecker
}) => {
  const { currentLanguage, t } = useLanguage();
  const { isSchemeSaved, toggleSaveScheme } = useProfile();
  const [playingSchemeId, setPlayingSchemeId] = useState<string | null>(null);

  const handleSpeakScheme = (scheme: Scheme, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingSchemeId === scheme.schemeId) {
      SpeechService.stop();
      setPlayingSchemeId(null);
    } else {
      setPlayingSchemeId(scheme.schemeId);
      const textToSpeak = `${scheme.name}. ${scheme.summaryText}. Financial Benefit: ${scheme.financialBenefit}. Required documents: ${scheme.documentsRequired.join(', ')}.`;
      SpeechService.speak(textToSpeak, currentLanguage.code, () => setPlayingSchemeId(null));
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Verified Official Scheme Registry</span>
            <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
              {schemes.length} Schemes
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse verified welfare programs with vernacular audio readouts and instant document checklists.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemes.map((scheme) => {
          const saved = isSchemeSaved(scheme.schemeId);
          const isSpeaking = playingSchemeId === scheme.schemeId;

          return (
            <div
              key={scheme.schemeId}
              onClick={() => onSelectScheme(scheme.schemeId)}
              className="glass-card rounded-3xl p-5 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {scheme.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Speak Button */}
                    <button
                      onClick={(e) => handleSpeakScheme(scheme, e)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isSpeaking
                          ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                      title={t('readAloudBtn')}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Bookmark Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveScheme(scheme.schemeId);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        saved
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                      title="Bookmark Scheme"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Scheme Name */}
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {scheme.name}
                </h3>

                {/* Financial Benefit Badge */}
                <div className="inline-block px-3 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs mb-3 border border-emerald-200 dark:border-emerald-800">
                  💰 {scheme.financialBenefit}
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                  {scheme.summaryText}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDocumentChecker(scheme);
                  }}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Check Papers</span>
                </button>

                <a
                  href={scheme.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Apply Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
