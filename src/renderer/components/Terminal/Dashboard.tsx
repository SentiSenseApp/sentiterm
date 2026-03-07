import React from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { SparklineChart } from '../Common/Chart'
import { fetchStockData, fetchSentiment, fetchMarketMood } from '../../lib/api'
import type { TerminalStockData, TerminalSentimentData, TerminalMarketSummary } from '../../lib/types'

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

export function Dashboard() {
  const { watchlist, navigate, settings } = useAppStore()
  const apiKey = settings.sentiSenseApiKey

  const { data: summary } = useSentiSenseQuery<TerminalMarketSummary>(
    async () => fetchMarketMood(apiKey), [apiKey]
  )

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

      {summary && (
        <div className="terminal-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="data-label">AI Market Summary</span>
            <span className="text-terminal-accent text-[10px] font-mono">SENTISENSE</span>
          </div>
          <p className="text-terminal-text text-sm leading-relaxed mb-4">{summary.summary}</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {summary.sectorPerformance.map(s => (
              <div key={s.sector} className="flex items-center justify-between text-xs font-mono">
                <span className="text-terminal-muted">{s.sector}</span>
                <span className={s.change >= 0 ? 'text-terminal-bull' : 'text-terminal-red'}>
                  {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {summary && (
        <div className="terminal-card p-4">
          <span className="data-label block mb-3">Key Themes</span>
          <div className="space-y-2">
            {summary.keyThemes.map((theme, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-terminal-accent font-mono shrink-0">{'\u2022'}</span>
                <span className="text-terminal-text/80">{theme}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
