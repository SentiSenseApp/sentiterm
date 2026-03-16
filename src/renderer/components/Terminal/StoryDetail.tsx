import React from 'react'
import ReactMarkdown from 'react-markdown'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { fetchStoryDetail } from '../../lib/api'

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="text-sm text-terminal-text/80 leading-relaxed mb-3">{children}</p>,
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-lg font-bold text-terminal-text mt-4 mb-2">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-bold text-terminal-text mt-3 mb-2">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold text-terminal-text mt-2 mb-1">{children}</h3>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="pl-4 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="pl-4 mb-3 space-y-1 list-decimal">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="text-sm text-terminal-text/80">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="text-terminal-text font-semibold">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="text-terminal-muted italic">{children}</em>,
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-terminal-accent hover:underline"
      onClick={e => { if (href) { e.preventDefault(); window.open(href, '_blank') } }}>
      {children}
    </a>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    if (className) return <pre className="bg-terminal-bg p-3 rounded-lg border border-terminal-border my-2 overflow-x-auto"><code className="text-[11px] font-mono text-terminal-text">{children}</code></pre>
    return <code className="bg-terminal-bg px-1 py-0.5 rounded text-terminal-amber font-mono text-xs">{children}</code>
  },
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-terminal-accent/30 pl-3 my-3 text-terminal-muted italic text-sm">{children}</blockquote>
  ),
  hr: () => <hr className="border-terminal-border/30 my-4" />,
}

function sentimentBadge(score: number): { label: string; className: string } {
  if (score > 0.2) return { label: 'BULLISH', className: 'badge-bullish' }
  if (score < -0.2) return { label: 'BEARISH', className: 'badge-bearish' }
  return { label: 'NEUTRAL', className: 'badge-neutral' }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const hrs = Math.floor(diff / 3_600_000)
  if (hrs < 1) return 'Just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function StoryDetail() {
  const { routeParams, navigate, settings } = useAppStore()
  const apiKey = settings.sentiSenseApiKey
  const clusterId = routeParams.clusterId

  const { data: story, loading, error } = useSentiSenseQuery<Record<string, unknown>>(
    async () => {
      if (!clusterId || !apiKey) return null
      return fetchStoryDetail(apiKey, clusterId)
    },
    [apiKey, clusterId]
  )

  if (!clusterId) return null
  if (!apiKey) return (
    <div className="p-6">
      <button onClick={() => navigate('/stories')} className="text-terminal-accent text-xs font-mono mb-4 hover:underline">{'\u2190'} Back to Stories</button>
      <div className="terminal-card p-6"><p className="text-terminal-muted text-sm">SentiSense API key required to view story details.</p></div>
    </div>
  )

  // Extract fields from the response
  const cluster = (story?.cluster ?? story) as Record<string, unknown> | null
  const title = String(cluster?.title ?? '')
  const summarizedContent = String(cluster?.summarizedContent ?? cluster?.narrativeBody ?? '')
  const narrativeBody = String(story?.narrativeBody ?? cluster?.narrativeBody ?? '')
  const sentiment = Number(cluster?.averageSentiment ?? 0)
  const sourceCount = Number(cluster?.clusterSize ?? 0)
  const createdAt = Number(cluster?.createdAt ?? 0)
  const badge = sentimentBadge(sentiment)

  // Tickers
  const rawTickers = (story?.tickers ?? []) as string[]
  const displayTickers = (story?.displayTickers ?? []) as string[]
  const tickers = rawTickers.length > 0 ? rawTickers : displayTickers.map(dt => {
    const m = dt.match(/\(([A-Z0-9.]+)\)$/)
    return m ? m[1] : dt
  })

  // Content to render (prefer narrativeBody if available, else summarizedContent)
  const content = narrativeBody || summarizedContent

  return (
    <div className="p-6 max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/stories')}
        className="text-terminal-accent text-xs font-mono mb-4 hover:underline"
      >
        {'\u2190'} Back to Stories
      </button>

      {loading && (
        <div className="terminal-card p-6 space-y-3">
          <div className="h-4 rounded w-3/4 bg-terminal-surface/50 animate-pulse" />
          <div className="h-3 rounded w-full bg-terminal-surface/30 animate-pulse" />
          <div className="h-3 rounded w-5/6 bg-terminal-surface/20 animate-pulse" />
        </div>
      )}

      {error && (
        <div className="terminal-card p-6">
          <p className="text-terminal-red text-sm font-mono">{error}</p>
        </div>
      )}

      {story && (
        <div className="terminal-card p-6">
          {/* Metadata */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${badge.className}`}>
              {badge.label}
            </span>
            <span className="text-terminal-muted/50 text-xs font-mono">
              {sourceCount} sources {'\u00B7'} {timeAgo(createdAt)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-lg font-semibold text-terminal-text leading-snug mb-4">
            {title}
          </h1>

          {/* Tickers */}
          {tickers.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {tickers.map(t => (
                <button
                  key={t}
                  onClick={() => navigate(`/stocks/${t}`, { ticker: t })}
                  className="text-xs font-mono px-2 py-1 rounded bg-terminal-accent/10 text-terminal-accent hover:bg-terminal-accent/20 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Story content — rendered as markdown */}
          {content && (
            <div className="border-t border-terminal-border/20 pt-4">
              <ReactMarkdown components={markdownComponents}>
                {content.replace(/\\n/g, '\n')}
              </ReactMarkdown>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-terminal-muted/30 text-[10px] font-mono mt-6">
            AI-generated content. Not financial advice.
          </p>
        </div>
      )}
    </div>
  )
}
