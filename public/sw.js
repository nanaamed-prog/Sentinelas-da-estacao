/* Sentinelas da Estação — service worker
 * Estratégia: cache apenas de arquivos estáticos e páginas (conteúdo NÃO sensível).
 * Dados pessoais ficam no aparelho (Fase 1) ou no Supabase (Fase 2) e nunca entram no cache.
 */
const VERSAO = 'sentinelas-v1';
const ESSENCIAIS = ['/', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ESSENCIAIS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // nunca cachear API

  // Arquivos versionados do Next: cache-first
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copia = res.clone(); caches.open(VERSAO).then((c) => c.put(req, copia)); return res;
    })));
    return;
  }
  // Páginas: rede primeiro, cache como reserva offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      const copia = res.clone(); caches.open(VERSAO).then((c) => c.put(req, copia)); return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('/'))));
  }
});
