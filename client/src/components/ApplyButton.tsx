import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, X, Info, Clock } from 'lucide-react';
import type { Scheme } from '../../../shared/types';
import { useSiteText } from '../hooks/useSiteText';
import { applyLink } from '../utils/applyLink';

interface ApplyButtonProps {
  /** Scheme as shown (translated text when available); the link always comes from the official record */
  scheme: Scheme;
  className: string;
  iconClassName?: string;
}

/** Warms DNS + TLS for the government site while the citizen reads the guide, so it opens faster */
const preconnect = (url: string) => {
  try {
    const origin = new URL(url).origin;
    if (document.head.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    document.head.appendChild(link);
  } catch {
    /* invalid URL: nothing to warm */
  }
};

/**
 * Official application link with a short "before you go" guide: what the link is (application page,
 * multi-scheme portal or form), what to look for on the portal and the official steps.
 * Renders nothing when the scheme has no online application.
 */
export const ApplyButton: React.FC<ApplyButtonProps> = ({ scheme, className, iconClassName = 'w-4 h-4' }) => {
  const st = useSiteText();
  const [open, setOpen] = useState(false);
  const apply = applyLink(scheme);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!apply) return null;
  const site = new URL(apply.url).hostname.replace(/^www\./, '');
  const note = apply.labelKey === 'applyPortal' ? 'leavingPortalNote' : apply.labelKey === 'applyForm' ? 'leavingFormNote' : 'leavingOnlineNote';
  const steps = scheme.applicationSteps.slice(0, 5);

  return (
    <>
      <a
        href={apply.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onMouseEnter={() => preconnect(apply.url)}
        onClick={(e) => {
          // Ctrl/Cmd/middle click still opens the site directly
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          preconnect(apply.url);
          setOpen(true);
        }}
      >
        {st(apply.labelKey)} <ExternalLink className={iconClassName} />
      </a>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-guide-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-left"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{st(apply.labelKey)}</p>
                <h2 id="apply-guide-title" className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">{scheme.name}</h2>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 break-all">{site}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={st('closeGuide')} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="flex items-start gap-2 mt-4 text-sm p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{st(note, { scheme: scheme.shortTitle || scheme.name })}</span>
            </p>

            {steps.length > 0 && (
              <>
                <h3 className="mt-5 mb-2 text-sm font-extrabold text-slate-900 dark:text-white">{st('leavingStepsTitle')}</h3>
                <ol className="space-y-2">
                  {steps.map((step) => (
                    <li key={step.stepNumber} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center">{step.stepNumber}</span>
                      <span>{step.description}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            <p className="flex items-center gap-2 mt-5 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-4 h-4 shrink-0" /> {st('leavingSlowNote')}
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              <a
                href={apply.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25"
              >
                {st('continueTo', { site })} <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500"
              >
                {st('closeGuide')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
