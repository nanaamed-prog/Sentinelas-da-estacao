import { go, useHashPath } from './router';
export const usePathname = () => useHashPath();
export const useRouter = () => ({ replace: (h: string) => go(h, true), push: (h: string) => go(h) });
export const notFound = () => { throw new Error('404'); };
