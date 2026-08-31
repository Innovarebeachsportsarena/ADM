// ============================================================
// SERVICE WORKER — Innovare Checklist
// ------------------------------------------------------------
// Guarda em cache os arquivos do app (HTML, ícones, manifest)
// para que ele abra mesmo sem internet. As chamadas ao Google
// Apps Script (salvar/ler o checklist) NUNCA usam esse cache —
// sempre buscam dado fresco da rede, já que são os dados reais.
//
// Importante: os arquivos do app usam estratégia "rede primeiro,
// cache como plano B" — assim, sempre que o aparelho estiver
// online, ele busca a versão mais nova publicada, e só usa a
// cópia salva localmente quando estiver sem internet. Isso evita
// o app ficar "preso" numa versão antiga depois de uma atualização.
// ============================================================

const CACHE_NOME = 'innovare-checklist-v2';
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

  // Demais arquivos do app: tenta a rede primeiro (pra sempre pegar a
  // versão mais nova); se estiver offline, cai pro que tiver em cache.
  evento.respondWith(
    fetch(evento.request)
      .then((respostaDaRede) => {
        const copia = respostaDaRede.clone();
        caches.open(CACHE_NOME).then((cache) => cache.put(evento.request, copia));
        return respostaDaRede;
      })
      .catch(() => caches.match(evento.request))
  );
});
