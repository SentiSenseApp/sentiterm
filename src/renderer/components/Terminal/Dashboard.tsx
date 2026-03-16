import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { SparklineChart } from '../Common/Chart'
import { fetchStockData, fetchSentiment, fetchMarketMood, fetchAIMarketSummary } from '../../lib/api'
import type { TerminalStockData, TerminalSentimentData, TerminalMarketSummary } from '../../lib/types'
import type { AIMarketSummaryData } from '../../lib/api'

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  return `$${value}`
}

function formatVolume(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return `${value}`
}

// ── Phase mapping (matches webapp marketMoodUtils.js) ──────────

function getPhase(score: number): { label: string; color: string } {
  if (score <= 15) return { label: 'Extreme Fear', color: '#991B1B' }
  if (score <= 30) return { label: 'Fear', color: '#DC2626' }
  if (score <= 45) return { label: 'Anxiety', color: '#F97316' }
  if (score <= 55) return { label: 'Neutral', color: '#6B7280' }
  if (score <= 70) return { label: 'Optimism', color: '#4ADE80' }
  if (score <= 85) return { label: 'Greed', color: '#22C55E' }
  return { label: 'Extreme Greed', color: '#16A34A' }
}

// ── Terminal-themed markdown components ─────────────────────────

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <p className="text-xs text-terminal-muted leading-relaxed mb-2">{children}</p>,
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-sm font-bold text-terminal-text mt-3 mb-1">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-semibold text-terminal-text mt-3 mb-1">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-xs font-semibold text-terminal-text mt-2 mb-1">{children}</h3>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="pl-4 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="pl-4 mb-2 space-y-1 list-decimal">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="text-xs text-terminal-muted">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="text-terminal-text font-semibold">{children}</strong>,
  em: ({ children }: { children?: React.ReactNode }) => <em className="text-terminal-muted italic">{children}</em>,
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-terminal-accent hover:underline"
      onClick={e => { if (href) { e.preventDefault(); e.stopPropagation(); window.open(href, '_blank') } }}>
      {children}
    </a>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    if (className) {
      return <pre className="bg-terminal-bg p-3 rounded-lg border border-terminal-border my-2 overflow-x-auto"><code className="text-[10px] font-mono text-terminal-text">{children}</code></pre>
    }
    return <code className="bg-terminal-bg px-1 py-0.5 rounded text-terminal-amber font-mono text-[10px]">{children}</code>
  },
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-terminal-border pl-3 my-2 text-terminal-muted/70 italic text-xs">{children}</blockquote>
  ),
  hr: () => <hr className="border-terminal-border/30 my-3" />,
}

// ── Dashboard ──────────────────────────────────────────────────

export function Dashboard() {
  const { watchlist, navigate, settings } = useAppStore()
  const apiKey = settings.sentiSenseApiKey

  const { data: mood } = useSentiSenseQuery<TerminalMarketSummary>(
    async () => fetchMarketMood(apiKey), [apiKey]
  )
  const { data: aiSummary } = useSentiSenseQuery<AIMarketSummaryData>(
    async () => fetchAIMarketSummary(apiKey), [apiKey]
  )

  const [expanded, setExpanded] = useState(false)

  const phase = mood ? getPhase(mood.score) : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-terminal-text">Dashboard</h1>
          <p className="text-terminal-muted text-sm mt-1">Your watchlist and market overview</p>
        </div>
        <div className="text-xs font-mono text-terminal-muted">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* AI Market Summary — compact with expandable markdown */}
      {aiSummary && aiSummary.headline && (
        <div className="terminal-card p-4">
          {/* Header row: icon + title + mood badge */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #9333EA, #7C3AED)', boxShadow: '0 0 12px rgba(147,51,234,0.25)' }}>
              <span className="text-white text-xs">{'\u26A1'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-terminal-text">AI Market Summary</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-terminal-accent/10 text-terminal-accent">AI</span>
                {aiSummary.generatedAt && (
                  <span className="text-[10px] font-mono text-terminal-muted/40">
                    {new Date(aiSummary.generatedAt * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' })} ET
                  </span>
                )}
              </div>
            </div>

            {/* Mood badge — colored dot + phase label, clickable */}
            {phase && (
              <button
                onClick={() => navigate('/indexes')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-terminal-surface transition-colors"
              >
                <span className="text-[10px] text-terminal-muted">Mood:</span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: phase.color, boxShadow: `0 0 6px ${phase.color}40` }} />
                <span className="text-xs font-semibold" style={{ color: phase.color, borderBottom: `1px dashed ${phase.color}60` }}>
                  {phase.label}
                </span>
                <span className="text-terminal-muted/40 text-[10px]">{'\u203A'}</span>
              </button>
            )}
          </div>

          {/* Headline */}
          <p className="text-xs text-terminal-muted leading-relaxed mb-2">{aiSummary.headline}</p>

          {/* Top active stocks */}
          {aiSummary.topActiveStocks.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              {aiSummary.topActiveStocks.slice(0, 6).map(t => (
                <button
                  key={t}
                  onClick={(e) => { e.stopPropagation(); navigate(`/stocks/${t}`, { ticker: t }) }}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-terminal-accent/10 text-terminal-accent hover:bg-terminal-accent/20 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Expand/collapse for full analysis */}
          {aiSummary.expandedContent && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-terminal-accent text-xs font-mono hover:underline"
              >
                {expanded ? 'Show less \u25B4' : 'Read full analysis \u25BE'}
              </button>
              {expanded && (
                <div className="mt-3 pt-3 border-t border-terminal-border/30">
                  <ReactMarkdown components={markdownComponents}>
                    {aiSummary.expandedContent.replace(/\\n/g, '\n')}
                  </ReactMarkdown>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Watchlist */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="data-label">Watchlist</span>
          <span className="text-terminal-muted text-xs font-mono">{watchlist.length} stocks</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {watchlist.map(ticker => (
            <WatchlistCard key={ticker} ticker={ticker} onClick={() => navigate(`/stocks/${ticker}`, { ticker })} />
          ))}
        </div>
      </div>
    </div>
  )
}

function WatchlistCard({ ticker, onClick }: { ticker: string; onClick: () => void }) {
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { data: stock } = useSentiSenseQuery<TerminalStockData>(
    async () => fetchStockData(apiKey, ticker), [apiKey, ticker]
  )
  const { data: sentiment } = useSentiSenseQuery<TerminalSentimentData>(
    async () => fetchSentiment(apiKey, ticker), [apiKey, ticker]
  )

  if (!stock) return <div className="terminal-card p-4 animate-pulse h-[120px]" />

  const isPositive = stock.changePercent >= 0
  const sparkData = Array.from({ length: 20 }, (_, i) =>
    stock.price + (Math.random() - 0.5) * stock.price * 0.02 * (i / 20)
  )

  return (
    <button onClick={onClick} className="terminal-card p-4 text-left hover:border-terminal-accent/30 transition-colors w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-terminal-accent font-mono font-semibold text-sm">{stock.ticker}</span>
        {sentiment && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
            sentiment.overall > 0.3 ? 'badge-bullish' : sentiment.overall < -0.3 ? 'badge-bearish' : 'badge-neutral'
          }`}>
            {sentiment.overall > 0.3 ? 'BULL' : sentiment.overall < -0.3 ? 'BEAR' : 'NEUTRAL'}
          </span>
        )}
      </div>
      <div className="text-xs text-terminal-muted truncate mb-2">{stock.name}</div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-mono font-semibold text-terminal-text">
            ${stock.price.toFixed(2)}
          </div>
          <div className={`text-xs font-mono ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
          </div>
        </div>
        <SparklineChart data={sparkData} color={isPositive ? '#2DD4BF' : '#F87171'} height={32} width={80} />
      </div>
      <div className="flex justify-between mt-2 text-[10px] font-mono text-terminal-muted">
        <span>Vol: {formatVolume(stock.volume)}</span>
        <span>MCap: {formatMarketCap(stock.marketCap)}</span>
      </div>
    </button>
  )
}
