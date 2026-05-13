const CACHE_NAMES = {
  precache: 'precache-v1',
  pages: 'pages-v1',
  assets: 'assets-v1',
  images: 'images-v1',
  fonts: 'fonts-v1',
  api: 'api-v1',
}

const PRECACHE_URLS = self.__WB_MANIFEST || []

function offlineHTML() {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Application hors ligne</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f1f5f9;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;padding:24px;text-align:center;gap:24px}
    h1{font-size:1.5rem;font-weight:700}
    p{color:#94a3b8;font-size:0.875rem;line-height:1.6;max-width:400px}
    button{padding:12px 24px;border-radius:8px;font-size:0.875rem;font-weight:600;border:none;cursor:pointer;transition:opacity .15s;background:#60a5fa;color:#fff}
    button:hover{opacity:.85}
  </style>
</head>
<body>
  <h1>Application hors ligne</h1>
  <p>Vérifie ta connexion internet puis réessaie.</p>
  <button onclick="location.reload()">Réessayer</button>
</body>
</html>`
}

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAMES.precache)
      const urls = PRECACHE_URLS.map(e => typeof e === 'string' ? e : e.url)
      for (const url of urls) {
        try {
          const res = await fetch(url)
          if (res.ok) {
            await cache.put(url, res)
          } else {
            console.error(`Precache ${url}: status ${res.status}`)
          }
        } catch (e) {
          console.error(`Precache ${url} failed:`, e)
        }
      }
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => !Object.values(CACHE_NAMES).includes(k))
            .map((k) => caches.delete(k)),
        ),
      ),
    ]),
  )
})

async function networkFirst(request, cacheName, timeoutMs = 5000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), timeoutMs),
  )

  try {
    const response = await Promise.race([fetch(request), timeout])
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.destination === 'document') {
      return new Response(offlineHTML(), {
        status: 503,
        headers: { 'Content-Type': 'text/html;charset=utf-8' },
      })
    }
    return new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    let source = cached || await caches.match(request, { cacheName: CACHE_NAMES.precache })

    if (!source && request.destination === 'document') {
      const indexUrl = new URL('./index.html', self.location)
      source = await caches.match(indexUrl)
        || await caches.match(indexUrl, { cacheName: CACHE_NAMES.precache })
    }

    const fetchPromise = fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response.clone())
        }
        return response
      })
      .catch(() => {
        if (request.destination === 'document' && !source) {
          return new Response(offlineHTML(), {
            status: 503,
            headers: { 'Content-Type': 'text/html;charset=utf-8' },
          })
        }
        return source || new Response('Offline', { status: 503 })
      })

    return source || fetchPromise
  } catch {
    if (request.destination === 'document') {
      return new Response(offlineHTML(), {
        status: 503,
        headers: { 'Content-Type': 'text/html;charset=utf-8' },
      })
    }
    return new Response('Offline', { status: 503 })
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== self.location.origin && !url.href.includes('/api/')) return

  if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.pages))
    return
  }

  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker'
  ) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.assets))
    return
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.images))
    return
  }

  if (request.destination === 'font') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.fonts))
    return
  }

  if (url.href.includes('/api/')) {
    event.respondWith(networkFirst(request, CACHE_NAMES.api, 5000))
    return
  }

  event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.pages))
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
