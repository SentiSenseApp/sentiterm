import type { IpcMain } from 'electron'

const USER_AGENT = 'SentiTerm/1.0 (+https://github.com/SentiSenseApp/sentiterm)'

// ── LRU memory cache (no persistent storage per COMP-317) ──────
const MAX_CACHE = 500
const cache = new Map<string, { title: string; ts: number }>()

function cacheGet(url: string): string | null {
  const entry = cache.get(url)
  if (!entry) return null
  // Evict after 30 minutes
  if (Date.now() - entry.ts > 30 * 60_000) {
    cache.delete(url)
    return null
  }
  return entry.title
}

function cacheSet(url: string, title: string): void {
  // Evict oldest if at capacity
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(url, { title, ts: Date.now() })
}

// ── Rate limiter (2 req/sec max — be polite) ───────────────────
let lastFetchTime = 0
const MIN_INTERVAL_MS = 300 // ~3 req/sec

async function throttle(): Promise<void> {
  const now = Date.now()
  const wait = MIN_INTERVAL_MS - (now - lastFetchTime)
  if (wait > 0) {
    await new Promise(resolve => setTimeout(resolve, wait))
  }
  lastFetchTime = Date.now()
}

// ── Source-aware extraction ─────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function isXTwitterUrl(url: string): boolean {
  const host = extractDomain(url)
  return host === 'twitter.com' || host === 'x.com'
}

function extractTitleFromHTML(html: string, url: string): string {
  // For X/Twitter: don't extract title (may contain full tweet text — ToS risk)
  // Instead return author + "post on X"
  if (isXTwitterUrl(url)) {
    const match = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/)
      || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:title"/)
    if (match) {
      // og:title on X is usually "Author on X: "tweet text""
      const parts = match[1].split(/\s+on\s+X:/i)
      if (parts.length >= 2) {
        return `${parts[0].trim()} — post on X`
      }
    }
    return `Post on X`
  }

  // Prefer og:title (more descriptive than <title>)
  const ogMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]*)"/)
    || html.match(/<meta\s+content="([^"]*)"\s+(?:property|name)="og:title"/)
  if (ogMatch?.[1]) {
    return decodeEntities(ogMatch[1]).trim()
  }

  // Fallback: <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch?.[1]) {
    return decodeEntities(titleMatch[1]).trim()
  }

  return ''
}

// ── URL slug heuristic (zero-cost fallback) ────────────────────

function titleFromSlug(url: string): string {
  try {
    const { pathname, hostname } = new URL(url)
    const domain = hostname.replace(/^www\./, '')

    // Grab the last meaningful path segment
    const segments = pathname.split('/').filter(Boolean)
    if (!segments.length) return domain

    // Find the longest segment (usually the article slug)
    const slug = segments.reduce((a, b) => a.length >= b.length ? a : b)

    // Skip if it looks like a hash/UUID/numeric ID
    if (/^[0-9a-f-]{20,}$/i.test(slug) || /^\d+$/.test(slug)) return domain

    // Clean up: remove dates, file extensions, trailing hashes
    const cleaned = slug
      .replace(/\.html?$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\d{6,}\b/g, '')  // remove long date strings like 02212026
      .replace(/\s{2,}/g, ' ')
      .trim()

    if (cleaned.length < 5) return domain

    // Title case
    const titled = cleaned.replace(/\b\w/g, c => c.toUpperCase())
    return `${titled} — ${domain}`
  } catch {
    return extractDomain(url)
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

// ── Fetch a title from a URL ───────────────────────────────────

async function fetchTitle(url: string): Promise<string> {
  // Check cache first
  const cached = cacheGet(url)
  if (cached !== null) return cached

  const domain = extractDomain(url)

  try {
    await throttle()

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timer)

    // Read first 16KB — title is always in <head>
    // Try even on non-200: some 403/paywall pages still have a <title>
    const reader = response.body?.getReader()
    if (!reader) {
      const fallback = titleFromSlug(url)
      cacheSet(url, fallback)
      return fallback
    }

    let html = ''
    const decoder = new TextDecoder()
    try {
      // Read with a tight timeout — don't hang on slow streams
      const readTimeout = setTimeout(() => reader.cancel(), 2000)
      while (html.length < 16384) {
        const { done, value } = await reader.read()
        if (done) break
        html += decoder.decode(value, { stream: true })
        if (html.includes('</head>')) break
      }
      clearTimeout(readTimeout)
      reader.cancel()
    } catch {
      // Stream error or cancelled — use whatever we got
    }

    const extracted = extractTitleFromHTML(html, url)

    // If we got a real title, use it (even from a 403 page)
    if (extracted && extracted.length > 3) {
      cacheSet(url, extracted)
      return extracted
    }

    // URL slug heuristic as smart fallback
    const fallback = titleFromSlug(url)
    cacheSet(url, fallback)
    return fallback
  } catch {
    // Network error, timeout, blocked — smart fallback
    const fallback = titleFromSlug(url)
    cacheSet(url, fallback)
    return fallback
  }
}

// ── IPC setup ──────────────────────────────────────────────────

// ── oEmbed fetcher (main process — no CORS) ───────────────────

async function fetchOEmbed(url: string): Promise<string | null> {
  const domain = extractDomain(url)
  let oembedUrl = ''

  if (domain === 'x.com' || domain === 'twitter.com') {
    oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true&dnt=true&theme=dark&maxwidth=380`
  } else if (domain.includes('reddit.com')) {
    oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`
  }

  if (!oembedUrl) return null

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    return data.html ?? null
  } catch {
    return null
  }
}

export function setupTitleResolverIPC(ipcMain: IpcMain): void {
  ipcMain.handle('titles:resolve', async (_event, url: string) => {
    return fetchTitle(url)
  })

  ipcMain.handle('titles:resolveBatch', async (_event, urls: string[]) => {
    const results: Record<string, string> = {}
    for (const url of urls) {
      results[url] = await fetchTitle(url)
    }
    return results
  })

  ipcMain.handle('titles:oembed', async (_event, url: string) => {
    return fetchOEmbed(url)
  })
}
