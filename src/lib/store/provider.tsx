'use client';
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Store, browserStorage } from './store';
import { emptyDB, type DB } from './schema';

const StoreCtx = createContext<Store | null>(null);
const SERVER_DB = emptyDB();

let singleton: Store | null = null;
const getStore = () => (singleton ??= new Store(browserStorage));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(getStore);
  return <StoreCtx.Provider value={store}>{children}</StoreCtx.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreCtx);
  if (!s) throw new Error('useStore fora do StoreProvider');
  return s;
}

export function useDB(): DB {
  const s = useStore();
  return useSyncExternalStore(s.subscribe, s.getSnapshot, () => SERVER_DB);
}

/** true depois que o app montou no navegador (dados locais disponíveis). */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

/** Relógio que atualiza a cada minuto. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}
