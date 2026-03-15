import React, { useEffect, useState } from 'react'

interface Props {
  url: string
  source: string
  sentiment: number
  tickers: string[]
  publishedAt: number
  onNavigate: (ticker: string) => void
}

function sentimentColor(score: number): string {
  if (score > 0.15) return 'text-terminal-bull'
  if (score < -0.15) return 'text-terminal-red'
  return 'text-terminal-muted'
}

function sentimentBadge(score: number): string {
  if (score > 0.15) return 'POS'
  if (score < -0.15) return 'NEG'
  return 'NEU'
}

function timeAgo(ts: number): string {
  const epoch = ts < 1e12 ? ts * 1000 : ts
  const mins = Math.floor((Date.now() - epoch) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function EmbedFeedItem({ url, source, sentiment, tickers, publishedAt, onNavigate }: Props) {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    window.api?.titles.oembed(url).then(html => {
      if (cancelled) return
      if (html) setEmbedHtml(html)
      else setError(true)
      setLoading(false)
    }).catch(() => {
      if (!cancelled) { setError(true); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [url])

  return (
    <div
      className="border-b border-terminal-border/20 py-3 px-2"
      style={{ animation: 'feedReveal 0.4s ease-out both' }}
    >
      {/* Sentiment + tickers bar */}
      <div className="flex items-center gap-2 mb-2 font-mono text-[10px]">
        <span className={sentimentColor(sentiment)}>
          {sentimentBadge(sentiment)} {sentiment > 0 ? '+' : ''}{sentiment.toFixed(2)}
        </span>
        <span className="text-terminal-muted/20">{'\u2502'}</span>
        <span className="text-terminal-muted/40">{timeAgo(publishedAt)}</span>
        {tickers.length > 0 && (
          <>
            <span className="text-terminal-muted/20">{'\u2502'}</span>
            {tickers.map(t => (
              <button
                key={t}
                onClick={() => onNavigate(t)}
                className="text-terminal-accent/70 hover:text-terminal-accent transition-colors"
              >
                ${t}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Embed content */}
      {loading && (
        <div className="rounded-lg bg-terminal-surface/30 border border-terminal-border/20 p-4">
          <div className="flex items-center gap-2">
            <div
              className="h-3 rounded w-3/4"
              style={{
                background: 'linear-gradient(90deg, rgba(49,130,206,0.04) 0%, rgba(49,130,206,0.10) 40%, rgba(49,130,206,0.04) 80%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.8s ease-in-out infinite',
              }}
            />
          </div>
          <div
            className="h-3 rounded w-1/2 mt-2"
            style={{
              background: 'linear-gradient(90deg, rgba(49,130,206,0.03) 0%, rgba(49,130,206,0.07) 40%, rgba(49,130,206,0.03) 80%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s ease-in-out infinite 0.2s',
            }}
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-terminal-surface/20 border border-terminal-border/20 p-3 text-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terminal-accent text-xs font-mono hover:underline"
          >
            View on {source === 'X' ? 'X' : 'Reddit'} {'\u2192'}
          </a>
        </div>
      )}

      {embedHtml && (
        <div
          className="embed-content [&_blockquote]:border-none [&_blockquote]:p-0 [&_blockquote]:m-0 [&_iframe]:rounded-lg [&_iframe]:border [&_iframe]:border-terminal-border/20"
          style={{ animation: 'titleFadeIn 0.4s ease-out both' }}
          dangerouslySetInnerHTML={{ __html: embedHtml }}
          onClick={(e) => {
            const target = (e.target as HTMLElement).closest('a')
            if (target?.href) {
              e.preventDefault()
              e.stopPropagation()
              window.open(target.href, '_blank')
            }
          }}
        />
      )}
    </div>
  )
}
