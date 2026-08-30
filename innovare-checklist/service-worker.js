// ============================================================
// SERVICE WORKER — Innovare Checklist
// ------------------------------------------------------------
// Guarda em cache os arquivos do app (HTML, ícones, manifest)
// para que ele abra mesmo sem internet. As chamadas ao Google
// Apps Script (salvar/ler o checklist) NUNCA usam esse cache —
// sempre buscam dado fresco da rede, já que são os dados reais.
// ============================================================

const CACHE_NOME = 'innovare-checklist-v1';
const ARQUIVOS_PARA_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './favicon-32.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_PARA_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(
        chaves
          .filter((chave) => chave !== CACHE_NOME)
          .map((chave) => caches.delete(chave))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  // Chamadas ao Google Apps Script: sempre direto na rede, nunca em cache.
  if (evento.request.url.includes('script.google.com')) {
    evento.respondWith(fetch(evento.request));
    return;
  }

  // Demais arquivos do app: tenta o cache primeiro, senão busca na rede.
  evento.respondWith(
    caches.match(evento.request).then((respostaCache) => respostaCache || fetch(evento.request))
  );
});
