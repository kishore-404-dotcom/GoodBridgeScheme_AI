import type { Scheme } from '../../../shared/types';

export type ApplyLabelKey = 'applyOnline' | 'applyPortal' | 'applyForm';

/**
 * The scheme's checked official application link and the label that matches it,
 * or null when the scheme has no online application (apply at an office, bank or CSC).
 */
export const applyLink = (scheme: Scheme): { url: string; labelKey: ApplyLabelKey } | null => {
  if (!scheme.applicationUrl) return null;
  const labelKey = scheme.applicationLinkType === 'form' ? 'applyForm' : scheme.applicationLinkType === 'portal' ? 'applyPortal' : 'applyOnline';
  return { url: scheme.applicationUrl, labelKey };
};

/** Detail page opened on its "How to apply" tab */
export const howToApplyHref = (schemeId: string): string => `#/scheme/${encodeURIComponent(schemeId)}/apply`;
