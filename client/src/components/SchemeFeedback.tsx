import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Flag, CheckCircle2 } from 'lucide-react';
import { ApiService, FeedbackType } from '../services/apiService';
import { useLanguage } from '../context/LanguageContext';
import { useSiteText } from '../hooks/useSiteText';
import { readStore, writeStore } from '../utils/storage';

interface SchemeFeedbackProps {
  schemeId: string;
}

type Status = 'idle' | 'sending' | 'thanks' | 'unavailable' | 'error';

/**
 * "Was this helpful?" and "Report incorrect information" for a scheme page.
 * Saved anonymously to the database; a vote is remembered on this device so it isn't repeated.
 */
export const SchemeFeedback: React.FC<SchemeFeedbackProps> = ({ schemeId }) => {
  const { currentLanguage } = useLanguage();
  const st = useSiteText();
  const voteKey = `feedback_${schemeId}`;
  const [voted, setVoted] = useState<FeedbackType | null>(() => readStore<FeedbackType | null>(voteKey, null));
  const [status, setStatus] = useState<Status>('idle');
  const [reporting, setReporting] = useState(false);
  const [message, setMessage] = useState('');

  const send = async (type: FeedbackType, text?: string) => {
    setStatus('sending');
    const result = await ApiService.sendFeedback(schemeId, type, currentLanguage.code, text);
    if (result === 'saved') {
      setStatus('thanks');
      if (type !== 'wrong_info') {
        setVoted(type);
        writeStore(voteKey, type);
      } else {
        setReporting(false);
        setMessage('');
      }
    } else {
      setStatus(result === 'unavailable' ? 'unavailable' : 'error');
    }
  };

  return (
    <section className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4" aria-label={st('feedbackTitle')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-extrabold text-slate-900 dark:text-white">{st('feedbackTitle')}</h2>
        {voted ? (
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {st('feedbackThanks')}
          </span>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => send('helpful')}
              disabled={status === 'sending'}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold flex items-center gap-2 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 disabled:opacity-50 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" /> {st('feedbackYes')}
            </button>
            <button
              onClick={() => send('not_helpful')}
              disabled={status === 'sending'}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold flex items-center gap-2 hover:border-rose-400 hover:text-rose-700 dark:hover:text-rose-400 disabled:opacity-50 transition-colors"
            >
              <ThumbsDown className="w-4 h-4" /> {st('feedbackNo')}
            </button>
          </div>
        )}
      </div>

      {!reporting ? (
        <button
          onClick={() => {
            setReporting(true);
            setStatus('idle');
          }}
          className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-1.5"
        >
          <Flag className="w-4 h-4" /> {st('reportWrongInfo')}
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (message.trim().length >= 5) send('wrong_info', message.trim());
          }}
          className="space-y-3"
        >
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor={`report-${schemeId}`}>
            {st('reportPrompt')}
          </label>
          <textarea
            id={`report-${schemeId}`}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder={st('reportPlaceholder')}
            className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">{st('reportPrivacy')}</p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={status === 'sending' || message.trim().length < 5}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold disabled:opacity-50 transition-colors"
            >
              {st('reportSend')}
            </button>
            <button type="button" onClick={() => setReporting(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">
              {st('reportCancel')}
            </button>
          </div>
        </form>
      )}

      {status === 'thanks' && !voted && <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{st('reportThanks')}</p>}
      {status === 'unavailable' && <p role="status" className="text-sm font-semibold text-amber-700 dark:text-amber-400">{st('feedbackUnavailable')}</p>}
      {status === 'error' && <p role="status" className="text-sm font-semibold text-rose-700 dark:text-rose-400">{st('feedbackError')}</p>}
    </section>
  );
};
