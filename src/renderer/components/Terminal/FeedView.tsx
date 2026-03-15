import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { FeedPreview } from './FeedPreview'
import { EmbedFeedItem } from './EmbedFeedItem'

type SourceFilter = 'news' | 'reddit' | 'x' | 'substack'

const PAGE_SIZE = 10

interface FeedDocument {
  id: string
  url: string
  source: string
  sourceName?: string
  published: number
  averageSentiment: number
  reliability: number
  sentiment: Array<{ ticker: string | null; name: string | null; entityType: string; sentiment: string }>
}

function sentimentColor(score: number): string {
  if (score > 0.15) return 'text-terminal-bull'
  if (score < -0.15) return 'text-terminal-red'
  return 'text-terminal-muted'
}

function sentimentLabel(score: number): string {
  if (score > 0.15) return 'POS'
  if (score < -0.15) return 'NEG'
  return 'NEU'
}

function sourceIcon(source: string): string {
  switch (source.toUpperCase()) {
    case 'NEWS': return '\u25A0'
    case 'REDDIT': return '\u25B2'
    case 'X': return '\u2731'
    case 'SUBSTACK': return '\u25C6'
    default: return '\u25CF'
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function timeAgo(ts: number): string {
  const now = Date.now()
  const epoch = ts < 1e12 ? ts * 1000 : ts
  const diff = now - epoch
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

// ── Shimmer skeleton for loading titles ────────────────────────

function TitleSkeleton({ width }: { width: number }) {
  return (
    <div className="h-3.5 rounded overflow-hidden" style={{ width: `${width}%` }}>
      <div
        className="h-full rounded"
        style={{
          background: 'linear-gradient(90deg, rgba(49,130,206,0.04) 0%, rgba(49,130,206,0.12) 40%, rgba(49,130,206,0.04) 80%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.8s ease-in-out infinite',
        }}
      />
    </div>
  )
}

// ── Individual feed item ───────────────────────────────────────

type TitleState = 'waiting' | 'resolving' | 'resolved'

function hasPreview(source: string): boolean {
  const s = source.toUpperCase()
  return s === 'X' || s === 'REDDIT'
}

function FeedItem({ doc, title, titleState, index, onNavigate, onPreview }: {
  doc: FeedDocument
  title: string | null
  titleState: TitleState
  index: number
  onNavigate: (ticker: string) => void
  onPreview: (url: string, source: string, rect: DOMRect) => void
}) {
  const previewBtnRef = useRef<HTMLButtonElement>(null)
  const domain = extractDomain(doc.url)
  const tickers = doc.sentiment
    .filter(s => s.ticker)
    .map(s => s.ticker!)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 5)

  const skeletonWidth = 40 + ((index * 37) % 45)

  return (
    <div
      className="border-b border-terminal-border/30 py-3 px-2 font-mono text-xs"
      style={{
        animation: titleState === 'resolved' ? `feedReveal 0.4s ease-out both` : undefined,
        animationDelay: titleState === 'resolved' ? '0.05s' : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Source icon */}
        <span className={`w-5 text-center shrink-0 pt-0.5 text-sm transition-colors duration-500 ${
          titleState === 'resolved' ? 'text-terminal-muted/60' : 'text-terminal-muted/20'
        }`}>
          {sourceIcon(doc.source)}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title line */}
          {titleState === 'resolved' || title ? (
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-text hover:text-terminal-accent transition-colors cursor-pointer leading-snug block truncate text-sm"
              style={{ animation: 'titleFadeIn 0.5s ease-out both' }}
              title={title || domain}
            >
              {title || domain}
            </a>
          ) : titleState === 'resolving' ? (
            <div className="flex items-center gap-2">
              <TitleSkeleton width={skeletonWidth} />
              <span className="text-terminal-accent/30 text-[9px] animate-pulse">{'\u25CF'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 opacity-30">
              <TitleSkeleton width={skeletonWidth} />
            </div>
          )}

          {/* Meta line */}
          <div
            className={`flex items-center gap-2 mt-1.5 text-terminal-muted/60 transition-opacity duration-500 ${
              titleState === 'resolved' ? 'opacity-100' : titleState === 'resolving' ? 'opacity-40' : 'opacity-20'
            }`}
          >
            <span className="text-terminal-muted/40">{doc.source}</span>
            <span className="text-terminal-muted/20">{'\u2502'}</span>
            <span>{domain}</span>
            <span className="text-terminal-muted/20">{'\u2502'}</span>
            <span>{timeAgo(doc.published)}</span>
            <span className="text-terminal-muted/20">{'\u2502'}</span>
            <span className={sentimentColor(doc.averageSentiment)}>
              {sentimentLabel(doc.averageSentiment)} {doc.averageSentiment > 0 ? '+' : ''}{doc.averageSentiment.toFixed(2)}
            </span>
            {doc.reliability > 0 && (
              <>
                <span className="text-terminal-muted/20">{'\u2502'}</span>
                <span>REL {(doc.reliability * 100).toFixed(0)}%</span>
              </>
            )}
          </div>

          {/* Tickers */}
          {tickers.length > 0 && titleState === 'resolved' && (
            <div className="flex gap-2 mt-1.5" style={{ animation: 'titleFadeIn 0.4s ease-out 0.15s both' }}>
              {tickers.map(t => (
                <button
                  key={t}
                  onClick={() => onNavigate(t)}
                  className="text-terminal-accent/70 hover:text-terminal-accent transition-colors"
                >
                  ${t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview button for X/Reddit */}
        {hasPreview(doc.source) && titleState === 'resolved' && (
          <button
            ref={previewBtnRef}
            onClick={() => {
              const rect = previewBtnRef.current?.getBoundingClientRect()
              if (rect) onPreview(doc.url, doc.source, rect)
            }}
            className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-sm text-terminal-muted/40 hover:text-terminal-accent hover:bg-terminal-accent/5 transition-colors"
            title="Preview embed"
          >
            {'\u25A3'}
          </button>
        )}

        {/* Sentiment bar */}
        <div className="shrink-0 w-1 h-10 rounded-full overflow-hidden bg-terminal-border/20 mt-0.5">
          <div
            className={`w-full rounded-full transition-all duration-700 ${
              titleState !== 'resolved'
                ? 'bg-terminal-border/10'
                : doc.averageSentiment > 0.15 ? 'bg-terminal-bull/60'
                : doc.averageSentiment < -0.15 ? 'bg-terminal-red/60'
                : 'bg-terminal-muted/30'
            }`}
            style={{
              height: titleState === 'resolved'
                ? `${Math.min(100, Math.abs(doc.averageSentiment) * 100 + 20)}%`
                : '0%',
              transition: 'height 0.6s ease-out, background-color 0.4s',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Cascading title resolver ───────────────────────────────────

function useCascadingTitles(docs: FeedDocument[] | undefined) {
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [resolving, setResolving] = useState<Set<string>>(new Set())
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const abortRef = useRef(false)

  // Stable key so the effect doesn't re-fire on every render
  const docsKey = docs?.map(d => d.id).join(',') ?? ''

  useEffect(() => {
    if (!docs?.length) return

    abortRef.current = false
    const urls = docs.map(d => d.url)

    setTitles({})
    setResolving(new Set())
    setResolved(new Set())

    async function cascade() {
      for (let i = 0; i < urls.length; i++) {
        if (abortRef.current) break
        const url = urls[i]

        setResolving(prev => {
          const next = new Set(prev)
          for (let j = i; j < Math.min(i + 5, urls.length); j++) {
            next.add(urls[j])
          }
          return next
        })

        try {
          const title = await window.api?.titles.resolve(url)
          if (abortRef.current) break
          if (title) {
            setTitles(prev => ({ ...prev, [url]: title }))
          }
        } catch {
          // Graceful fallback
        }

        setResolved(prev => new Set(prev).add(url))
        setResolving(prev => {
          const next = new Set(prev)
          next.delete(url)
          return next
        })
      }
    }

    cascade()
    return () => { abortRef.current = true }
  }, [docsKey])

  function getState(url: string): TitleState {
    if (resolved.has(url)) return 'resolved'
    if (resolving.has(url)) return 'resolving'
    return 'waiting'
  }

  return { titles, getState }
}

// ── Main feed view ─────────────────────────────────────────────

export function FeedView() {
  const { navigate, settings } = useAppStore()
  const apiKey = settings.sentiSenseApiKey
  const [filter, setFilter] = useState<SourceFilter>('news')
  const [page, setPage] = useState(0)

  // Reset page when filter changes
  useEffect(() => { setPage(0) }, [filter])

  const fetchDocs = useCallback(async () => {
    if (!apiKey) return []
    return window.api.sentisense.callWithKey('documents.getBySource', apiKey, filter, { limit: 50 }) as Promise<FeedDocument[]>
  }, [apiKey, filter])

  const { data: allDocs } = useSentiSenseQuery<FeedDocument[]>(fetchDocs, [apiKey, filter])

  // Paginate
  const totalPages = allDocs ? Math.ceil(allDocs.length / PAGE_SIZE) : 0
  const docs = allDocs?.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const isEmbedMode = filter === 'x' || filter === 'reddit'
  const { titles, getState } = useCascadingTitles(isEmbedMode ? undefined : docs)

  const [preview, setPreview] = useState<{ url: string; source: string; rect: DOMRect } | null>(null)

  const filters: { key: SourceFilter; label: string }[] = [
    { key: 'news', label: 'NEWS' },
    { key: 'reddit', label: 'REDDIT' },
    { key: 'x', label: 'X' },
    { key: 'substack', label: 'SUBSTACK' },
  ]

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Inline keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes titleFadeIn {
          from { opacity: 0; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes feedReveal {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-terminal-text">Live Feed</h1>
          <span className="text-terminal-muted/40 text-xs font-mono">
            {allDocs?.length ?? 0} documents
            {totalPages > 1 && ` \u00B7 page ${page + 1}/${totalPages}`}
          </span>
        </div>

        {/* Source filter tabs */}
        <div className="flex gap-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                filter === f.key
                  ? 'bg-terminal-accent/15 text-terminal-accent'
                  : 'text-terminal-muted hover:text-terminal-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      {!isEmbedMode && (
        <div className="flex items-center gap-3 px-2 py-1.5 border-b border-terminal-border text-[10px] font-mono text-terminal-muted/50 uppercase tracking-wider">
          <span className="w-5" />
          <span className="flex-1">Title</span>
          <span className="w-7" />
          <span className="w-1" />
        </div>
      )}
      {isEmbedMode && (
        <div className="px-2 py-1.5 border-b border-terminal-border text-[10px] font-mono text-terminal-muted/50 uppercase tracking-wider">
          {filter === 'x' ? 'X Posts' : 'Reddit Posts'} — Official Embeds
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {!allDocs && (
          <div className="py-8 space-y-4 px-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3" style={{ opacity: 1 - i * 0.1 }}>
                <div className="w-5 h-3.5 rounded bg-terminal-border/10" />
                <TitleSkeleton width={35 + ((i * 29) % 50)} />
              </div>
            ))}
          </div>
        )}
        {docs?.length === 0 && (
          <div className="text-terminal-muted text-sm font-mono p-4 text-center">No documents found.</div>
        )}
        {docs?.map((doc, i) => {
          if (isEmbedMode) {
            const tickers = doc.sentiment
              .filter(s => s.ticker)
              .map(s => s.ticker!)
              .filter((t, idx, arr) => arr.indexOf(t) === idx)
              .slice(0, 5)
            return (
              <EmbedFeedItem
                key={doc.id}
                url={doc.url}
                source={doc.source}
                sentiment={doc.averageSentiment}
                tickers={tickers}
                publishedAt={doc.published}
                onNavigate={(t) => navigate(`/stocks/${t}`, { ticker: t })}
              />
            )
          }
          return (
            <FeedItem
              key={doc.id}
              doc={doc}
              title={titles[doc.url] ?? null}
              titleState={getState(doc.url)}
              index={i}
              onNavigate={(t) => navigate(`/stocks/${t}`, { ticker: t })}
              onPreview={(url, source, rect) => setPreview({ url, source, rect })}
            />
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-terminal-border/30">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs font-mono rounded text-terminal-muted hover:text-terminal-accent hover:bg-terminal-accent/5 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-terminal-muted transition-colors"
          >
            {'\u2190'} Prev
          </button>
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded text-xs font-mono transition-colors ${
                  i === page
                    ? 'bg-terminal-accent/15 text-terminal-accent'
                    : 'text-terminal-muted/40 hover:text-terminal-muted'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-xs font-mono rounded text-terminal-muted hover:text-terminal-accent hover:bg-terminal-accent/5 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-terminal-muted transition-colors"
          >
            Next {'\u2192'}
          </button>
        </div>
      )}

      {/* Embed preview overlay */}
      {preview && (
        <FeedPreview
          url={preview.url}
          source={preview.source}
          anchorRect={preview.rect}
          onClose={() => setPreview(null)}
        />
      )}

      {/* Footer */}
      <div className="pt-2">
        <p className="text-terminal-muted/30 text-[10px] font-mono text-center">
          Titles fetched from source URLs. Sentiment by SentiSense. Not financial advice.
        </p>
      </div>
    </div>
  )
}
