import { useLanguage } from '../context/LanguageContext';
import { SITE_STRINGS } from '../utils/siteStrings';

/**
 * Translator for site navigation and the schemes pages.
 * Looks up SITE_STRINGS (current language, then English) and otherwise
 * defers to the main dictionary via t().
 */
export const useSiteText = () => {
  const { currentLanguage, t } = useLanguage();

  return (key: string, vars: Record<string, string | number> = {}): string => {
    const text = SITE_STRINGS[currentLanguage.code]?.[key] ?? SITE_STRINGS.en[key];
    if (text === undefined) return t(key, vars);
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
  };
};
