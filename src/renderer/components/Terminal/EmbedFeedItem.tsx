import React, { useEffect, useState, useRef } from 'react'

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

function injectDarkTheme(html: string, source: string): string {
  const isX = source.toUpperCase() === 'X'
  if (isX) {
    return html.replace('<blockquote class="twitter-tweet"', '<blockquote class="twitter-tweet" data-theme="dark" data-dnt="true"')
  }
  return html
    .replace(/<blockquote class="reddit-embed-bq"/, '<blockquote class="reddit-embed-bq" data-embed-theme="dark" data-embed-showmedia="false"')
    .replace(/style="height:\s*\d+px"/, 'style="height:auto"')
}

function buildEmbedSrcdoc(embedHtml: string, source: string): string {
  const isX = source.toUpperCase() === 'X'
  const themedHtml = injectDarkTheme(embedHtml, source)

  const widgetScript = isX
    ? '<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>'
    : '<script async src="https://embed.reddit.com/widgets.js" charset="UTF-8"></script>'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: transparent !important;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    blockquote { margin: 0 !important; max-width: 100% !important; }
    iframe { max-width: 100% !important; }
    .twitter-tweet { margin: 0 !important; }
    .reddit-embed-bq {
      background: #1A1B1E !important;
      color: #D7DADC !important;
      border: none !important;
    }
    .reddit-embed-bq a { color: #6B9BD2 !important; }
  </style>
</head>
<body>
  ${themedHtml}
  ${widgetScript}
  <script>
    let lastH = 0;
    const poll = setInterval(() => {
      const h = document.documentElement.scrollHeight;
      if (h !== lastH && h > 30) {
        lastH = h;
        window.parent.postMessage({ type: 'embed-resize', height: h }, '*');
      }
    }, 200);
    setTimeout(() => clearInterval(poll), 12000);
  </script>
</body>
</html>`
}

// ── Fixed-height card with reveal animation ────────────────────

const CARD_HEIGHT = 200

export function EmbedFeedItem({ url, source, sentiment, tickers, publishedAt, onNavigate }: Props) {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [ready, setReady] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [contentHeight, setContentHeight] = useState(CARD_HEIGHT)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'embed-resize' && typeof e.data.height === 'number') {
        if (iframeRef.current?.contentWindow === e.source) {
          setContentHeight(Math.max(e.data.height, 100))
          if (!ready) setReady(true)
        }
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [ready])

  const isX = source.toUpperCase() === 'X'
  const displayHeight = expanded ? Math.min(contentHeight + 4, 600) : CARD_HEIGHT

  return (
    <div className="flex flex-col">
      {/* Card */}
      <div
        className="rounded-xl border border-terminal-border/20 bg-terminal-surface/20 overflow-hidden relative"
        style={{
          height: `${displayHeight + 32}px`, // 32px for header
          transition: 'height 0.3s ease',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-terminal-border/10 font-mono text-[10px] h-8">
          <span className={`${isX ? 'text-terminal-muted/50' : 'text-orange-400/50'}`}>
            {isX ? '\u2731' : '\u25B2'}
          </span>
          <span className={sentimentColor(sentiment)}>
            {sentimentBadge(sentiment)} {sentiment > 0 ? '+' : ''}{sentiment.toFixed(2)}
          </span>
          <span className="text-terminal-muted/15">{'\u2502'}</span>
          <span className="text-terminal-muted/40">{timeAgo(publishedAt)}</span>
          {tickers.length > 0 && (
            <>
              <span className="text-terminal-muted/15">{'\u2502'}</span>
              {tickers.slice(0, 3).map(t => (
                <button
                  key={t}
                  onClick={() => onNavigate(t)}
                  className="text-terminal-accent/60 hover:text-terminal-accent transition-colors"
                >
                  ${t}
                </button>
              ))}
            </>
          )}
          <div className="ml-auto flex items-center gap-1">
            {ready && contentHeight > CARD_HEIGHT && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-terminal-muted/30 hover:text-terminal-accent transition-colors text-[10px]"
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? '\u25B4' : '\u25BE'}
              </button>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-muted/30 hover:text-terminal-accent transition-colors"
              onClick={(e) => { e.stopPropagation(); window.open(url, '_blank'); e.preventDefault() }}
            >
              {'\u2197'}
            </a>
          </div>
        </div>

        {/* Embed body */}
        <div className="relative" style={{ height: `${displayHeight}px`, overflow: 'hidden' }}>
          {/* Skeleton */}
          {(loading || !ready) && !error && (
            <div className="absolute inset-0 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full" style={{
                  background: 'linear-gradient(90deg, rgba(49,130,206,0.04) 0%, rgba(49,130,206,0.10) 40%, rgba(49,130,206,0.04) 80%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.8s ease-in-out infinite',
                }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 rounded w-2/5" style={{
                    background: 'linear-gradient(90deg, rgba(49,130,206,0.04) 0%, rgba(49,130,206,0.10) 40%, rgba(49,130,206,0.04) 80%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.8s ease-in-out infinite',
                  }} />
                  <div className="h-2.5 rounded w-1/4" style={{
                    background: 'linear-gradient(90deg, rgba(49,130,206,0.03) 0%, rgba(49,130,206,0.07) 40%, rgba(49,130,206,0.03) 80%)',
                    backgroundSize: '200% 100%', animation: 'shimmer 1.8s ease-in-out infinite 0.1s',
                  }} />
                </div>
              </div>
              <div className="h-2.5 rounded w-4/5" style={{
                background: 'linear-gradient(90deg, rgba(49,130,206,0.03) 0%, rgba(49,130,206,0.07) 40%, rgba(49,130,206,0.03) 80%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.8s ease-in-out infinite 0.2s',
              }} />
              <div className="h-2.5 rounded w-3/5" style={{
                background: 'linear-gradient(90deg, rgba(49,130,206,0.02) 0%, rgba(49,130,206,0.05) 40%, rgba(49,130,206,0.02) 80%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.8s ease-in-out infinite 0.3s',
              }} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center justify-center h-full">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-terminal-accent text-xs font-mono hover:underline"
                onClick={(e) => { e.stopPropagation(); window.open(url, '_blank'); e.preventDefault() }}
              >
                View on {isX ? 'X' : 'Reddit'} {'\u2192'}
              </a>
            </div>
          )}

          {/* Iframe */}
          {embedHtml && (
            <iframe
              ref={iframeRef}
              srcDoc={buildEmbedSrcdoc(embedHtml, source)}
              sandbox="allow-scripts allow-same-origin allow-popups"
              style={{
                width: '100%',
                height: `${Math.max(contentHeight, CARD_HEIGHT)}px`,
                border: 'none',
                background: 'transparent',
                opacity: ready ? 1 : 0,
                transition: 'opacity 0.4s ease',
                display: 'block',
              }}
            />
          )}

          {/* Fade-out gradient at bottom when collapsed */}
          {!expanded && ready && contentHeight > CARD_HEIGHT && (
            <div
              className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
              style={{ background: 'linear-gradient(transparent, rgba(26,29,48,0.95))' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
