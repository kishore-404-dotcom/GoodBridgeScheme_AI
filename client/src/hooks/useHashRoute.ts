import { useEffect, useState } from 'react';

/**
 * Minimal hash router: #/, #/schemes?category=..., #/scheme/SCH-001, #/eligibility
 * Hash routing keeps the browser back button working without a router dependency
 * or server rewrites.
 */
export type Route =
  | { page: 'home' }
  | { page: 'schemes'; params: URLSearchParams }
  | { page: 'scheme'; schemeId: string; tab?: string }
  | { page: 'eligibility' }
  | { page: 'admin' };

const parseHash = (hash: string): Route => {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'schemes') return { page: 'schemes', params: new URLSearchParams(query) };
  if (parts[0] === 'scheme' && parts[1]) return { page: 'scheme', schemeId: decodeURIComponent(parts[1]), tab: parts[2] };
  if (parts[0] === 'eligibility') return { page: 'eligibility' };
  if (parts[0] === 'admin') return { page: 'admin' };
  return { page: 'home' };
};

export const navigate = (path: string): void => {
  window.location.hash = path.startsWith('#') ? path : `#${path}`;
};

export const useHashRoute = (): Route => {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
};
