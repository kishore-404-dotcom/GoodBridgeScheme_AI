import React, { useCallback, useEffect, useState } from 'react';
import {
  Lock, LogOut, RefreshCw, ThumbsUp, ThumbsDown, Flag, CheckCircle2, RotateCcw, Search, Eye, ClipboardCheck, MessageSquare, AlertTriangle
} from 'lucide-react';
import { ApiService, FeedbackSummary, UsageStats, FeedbackReport } from '../services/apiService';
import { useSiteText } from '../hooks/useSiteText';

type Filter = 'open' | 'resolved' | 'all';
const TOKEN_KEY = 'goodbridge_admin_token';

/** Session-only: the admin token is forgotten when the browser closes */
const readToken = (): string => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};
const saveToken = (token: string) => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: token lives in memory only */
  }
};

const ERRORS: Record<string, string> = {
  unauthorized: 'That admin token is not valid, or ADMIN_TOKEN is not set on the server.',
  unavailable: 'The database is not connected, so there is no feedback to show.',
  error: 'Could not reach the server. Please try again.'
};

/**
 * Feedback dashboard for the team: citizen votes, error reports (mark resolved / reopen) and
 * anonymous usage counts. Protected by the server's ADMIN_TOKEN.
 */
export const AdminPage: React.FC = () => {
  const st = useSiteText();
  const [token, setToken] = useState(readToken);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('open');
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (t: string, f: Filter) => {
    if (!t) return;
    setLoading(true);
    setError(null);
    const [res, stats] = await Promise.all([ApiService.getFeedbackSummary(t, f), ApiService.getUsageStats(30)]);
    setLoading(false);
    if (!res.ok) {
      setError(ERRORS[res.reason]);
      setSummary(null);
      if (res.reason === 'unauthorized') {
        saveToken('');
        setToken('');
      }
      return;
    }
    setSummary(res.data);
    setUsage(stats);
  }, []);

  useEffect(() => {
    load(token, filter);
  }, [token, filter, load]);

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    saveToken(t);
    setToken(t);
    setInput('');
  };

  const signOut = () => {
    saveToken('');
    setToken('');
    setSummary(null);
    setUsage(null);
  };

  const toggleResolved = async (report: FeedbackReport) => {
    setBusyId(report._id);
    const res = await ApiService.setReportResolved(token, report._id, !report.resolved);
    setBusyId(null);
    if (!res.ok) {
      setError(ERRORS[res.reason]);
      return;
    }
    load(token, filter);
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <form onSubmit={signIn} className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Feedback dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">For the GoodBridgeScheme AI team. Enter the server's admin token.</p>
          </div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="admin-token">Admin token</label>
          <input
            id="admin-token"
            type="password"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-400">{error}</p>}
          <button type="submit" disabled={!input.trim()} className="w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm disabled:opacity-50 transition-colors">
            Open dashboard
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">The token is kept only for this browser session.</p>
        </form>
      </div>
    );
  }

  const t = summary?.totals;
  const votes = t ? t.helpful + t.notHelpful : 0;
  const helpfulPct = votes ? Math.round(((t?.helpful ?? 0) / votes) * 100) : null;
  const usageCards = [
    { Icon: Search, label: 'Searches', value: usage?.totals.search ?? 0 },
    { Icon: Eye, label: 'Scheme views', value: usage?.totals.scheme_view ?? 0 },
    { Icon: ClipboardCheck, label: 'Eligibility checks', value: usage?.totals.eligibility_check ?? 0 },
    { Icon: MessageSquare, label: 'AI chats', value: usage?.totals.chat ?? 0 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Feedback dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Citizen feedback and anonymous usage. No personal data is collected.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load(token, filter)} disabled={loading} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:border-emerald-500 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={signOut} className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:border-rose-400">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-sm font-semibold text-rose-800 dark:text-rose-200">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}

      {/* Feedback totals */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { Icon: ThumbsUp, label: 'Helpful votes', value: t?.helpful ?? 0, tone: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400' },
          { Icon: ThumbsDown, label: 'Not helpful votes', value: t?.notHelpful ?? 0, tone: 'text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-400' },
          { Icon: CheckCircle2, label: 'Found helpful', value: helpfulPct === null ? '—' : `${helpfulPct}%`, tone: 'text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-400' },
          { Icon: Flag, label: 'Open error reports', value: t?.openReports ?? 0, tone: 'text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-400' }
        ].map(({ Icon, label, value, tone }) => (
          <div key={label} className="glass-card rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone}`}><Icon className="w-5 h-5" /></span>
            <span>
              <span className="block text-2xl font-black text-slate-900 dark:text-white leading-none">{value}</span>
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{label}</span>
            </span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Error reports */}
        <section className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Error reports</h2>
            <div role="tablist" className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              {(['open', 'resolved', 'all'] as Filter[]).map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${filter === f ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {!summary?.reports.length ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
              {loading ? 'Loading…' : filter === 'open' ? 'No open reports. Everything reported has been handled.' : 'No reports here.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {summary.reports.map((r) => (
                <li key={r._id} className={`rounded-2xl border p-4 ${r.resolved ? 'border-slate-200 dark:border-slate-800 opacity-70' : 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <a href={`#/scheme/${encodeURIComponent(r.schemeId)}`} className="font-extrabold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400">{r.schemeName}</a>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">{st(`reportReason_${r.reason || 'other'}`)}</span>
                        <span>{new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        {r.language && <span className="uppercase">{r.language}</span>}
                        {r.resolved && <span className="font-bold text-emerald-700 dark:text-emerald-400">Resolved</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleResolved(r)}
                      disabled={busyId === r._id}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50 ${r.resolved ? 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                    >
                      {r.resolved ? <><RotateCcw className="w-3.5 h-3.5" /> Reopen</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Mark resolved</>}
                    </button>
                  </div>
                  {r.message && <p className="text-sm text-slate-700 dark:text-slate-300 mt-3 whitespace-pre-wrap break-words">{r.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          {/* Usage */}
          <section className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">Usage (last 30 days)</h2>
            {usage ? (
              <ul className="grid grid-cols-2 gap-4">
                {usageCards.map(({ Icon, label, value }) => (
                  <li key={label}>
                    <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="block text-xl font-black text-slate-900 dark:text-white mt-1">{value}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No usage data yet.</p>
            )}
          </section>

          {/* Most rated schemes */}
          <section className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">Most rated schemes</h2>
            {!summary?.schemes.length ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No feedback yet.</p>
            ) : (
              <ul className="space-y-3">
                {summary.schemes.slice(0, 10).map((s) => {
                  const up = s.counts.helpful ?? 0;
                  const down = s.counts.not_helpful ?? 0;
                  const reports = s.counts.wrong_info ?? 0;
                  return (
                    <li key={s.schemeId}>
                      <a href={`#/scheme/${encodeURIComponent(s.schemeId)}`} className="block text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 leading-snug">{s.name}</a>
                      <span className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {up}</span>
                        <span className="flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> {down}</span>
                        <span className="flex items-center gap-1"><Flag className="w-3 h-3" /> {reports}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
};
