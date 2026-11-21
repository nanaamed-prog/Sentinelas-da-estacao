import { useEffect, useState } from 'react';
/** Converte rotas do app (/vigilias/colheita/) em hash simples (#vigilias-colheita) e vice-versa. */
export const toHash = (href: string) => {
  const [p, frag] = href.split('#');
  const slug = p.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  return '#' + (slug || 'inicio') + (frag ? '-' + frag : '');
};
export const fromHash = (h: string) => {
  const s = h.replace(/^#/, '');
  if (!s || s === 'inicio') return '/';
  const [a, ...b] = s.split('-');
  if (a === 'boas') return '/boas-vindas/';
  return '/' + [a, ...b].join('/') + '/';
};
export function useHashPath() {
  const [p, setP] = useState(() => fromHash(location.hash));
  useEffect(() => {
    const on = () => { setP(fromHash(location.hash)); window.scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return p;
}
export function go(href: string, replace = false) {
  const h = toHash(href);
  if (replace) { history.replaceState(null, '', h); dispatchEvent(new HashChangeEvent('hashchange')); }
  else location.hash = h;
}
