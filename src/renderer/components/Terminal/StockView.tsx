import React, { useState } from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { SentimentView } from './SentimentView'
import { InstitutionalFlows } from './InstitutionalFlows'
import { NewsStories } from './NewsStories'
import {
  MOCK_STOCKS, MOCK_METRICS, MOCK_SENTIMENT,
  type TerminalStockData, type TerminalStockMetrics, type TerminalSentimentData
} from '../../lib/mockData'

type Tab = 'overview' | 'sentiment' | 'holders' | 'news'

export function StockView() {
  const { routeParams, currentRoute, navigate, watchlist, addToWatchlist, removeFromWatchlist } = useAppStore()
  const ticker = routeParams.ticker || 'AAPL'

  let initialTab: Tab = 'overview'
  if (currentRoute.endsWith('/sentiment')) initialTab = 'sentiment'
  else if (currentRoute.endsWith('/holders')) initialTab = 'holders'
  else if (currentRoute.endsWith('/news')) initialTab = 'news'

  const [tab, setTab] = useState<Tab>(initialTab)

  const { data: stock } = useSentiSenseQuery<TerminalStockData>(
    async () => MOCK_STOCKS[ticker] ?? { ticker, name: ticker, price: 100, change: 0, changePercent: 0, volume: 0, marketCap: 0, sector: 'Unknown', exchange: 'UNKNOWN' },
    [ticker]
  )
  const { data: metrics } = useSentiSenseQuery<TerminalStockMetrics>(
    async () => MOCK_METRICS[ticker] ?? { ticker, pe: 0, eps: 0, dividend: 0, dividendYield: 0, beta: 1, week52High: 0, week52Low: 0, avgVolume: 0, sharesOutstanding: 0 },
    [ticker]
  )
  const { data: sentiment } = useSentiSenseQuery<TerminalSentimentData>(
    async () => MOCK_SENTIMENT[ticker] ?? { ticker, overall: 0, bullScore: 50, bearScore: 50, confidence: 0.5, volume: 0, trend: 'stable' as const, updatedAt: new Date().toISOString() },
    [ticker]
  )

  const isWatching = watchlist.includes(ticker)
  const isPositive = (stock?.changePercent ?? 0) >= 0

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    if (newTab === 'overview') navigate(`/stocks/${ticker}`, { ticker })
    else navigate(`/stocks/${ticker}/${newTab}`, { ticker })
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-mono font-bold text-terminal-green">{ticker}</h1>
            {sentiment && (
              <span className={`text-xs font-mono px-2 py-1 rounded ${
                sentiment.overall > 0.3 ? 'badge-bullish' : sentiment.overall < -0.3 ? 'badge-bearish' : 'badge-neutral'
              }`}>
                {sentiment.bullScore}/{sentiment.bearScore} Bull/Bear
              </span>
            )}
          </div>
          <p className="text-terminal-muted text-sm mt-1">{stock?.name} {'\u2022'} {stock?.exchange} {'\u2022'} {stock?.sector}</p>
        </div>
        <button
          onClick={() => isWatching ? removeFromWatchlist(ticker) : addToWatchlist(ticker)}
          className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
            isWatching ? 'bg-terminal-amber/10 text-terminal-amber hover:bg-terminal-amber/20' : 'bg-terminal-surface text-terminal-muted hover:text-terminal-text'
          }`}
        >
          {isWatching ? '\u2605 Watching' : '\u2606 Watch'}
        </button>
      </div>

      {stock && (
        <div className="terminal-card p-4 mb-6">
          <div className="flex items-end gap-6">
            <div>
              <div className="data-label mb-1">Price</div>
              <div className="text-3xl font-mono font-bold text-terminal-text">${stock.price.toFixed(2)}</div>
              <div className={`text-sm font-mono mt-1 ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </div>
            </div>
            {metrics && (<>
              <div><div className="data-label mb-1">P/E</div><div className="text-lg font-mono text-terminal-text">{metrics.pe.toFixed(1)}</div></div>
              <div><div className="data-label mb-1">EPS</div><div className="text-lg font-mono text-terminal-text">${metrics.eps.toFixed(2)}</div></div>
              <div><div className="data-label mb-1">Beta</div><div className="text-lg font-mono text-terminal-text">{metrics.beta.toFixed(2)}</div></div>
              <div><div className="data-label mb-1">52W Range</div><div className="text-lg font-mono text-terminal-text">${metrics.week52Low.toFixed(0)} - ${metrics.week52High.toFixed(0)}</div></div>
              <div><div className="data-label mb-1">Avg Vol</div><div className="text-lg font-mono text-terminal-text">{(metrics.avgVolume / 1e6).toFixed(1)}M</div></div>
            </>)}
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-terminal-border">
        {(['overview', 'sentiment', 'holders', 'news'] as Tab[]).map(t => (
          <button key={t} onClick={() => handleTabChange(t)}
            className={`px-4 py-2 text-sm font-mono capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'text-terminal-green border-terminal-green' : 'text-terminal-muted border-transparent hover:text-terminal-text'
            }`}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && <StockOverviewTab metrics={metrics} sentiment={sentiment} />}
      {tab === 'sentiment' && <SentimentView ticker={ticker} />}
      {tab === 'holders' && <InstitutionalFlows ticker={ticker} />}
      {tab === 'news' && <NewsStories ticker={ticker} />}
    </div>
  )
}

function StockOverviewTab({ metrics, sentiment }: { metrics: TerminalStockMetrics | null; sentiment: TerminalSentimentData | null }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {sentiment && (
        <div className="terminal-card p-4">
          <div className="data-label mb-3">Sentiment Overview</div>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-terminal-green">Bull {sentiment.bullScore}%</span>
                <span className="text-terminal-red">Bear {sentiment.bearScore}%</span>
              </div>
              <div className="h-2 bg-terminal-bg rounded-full overflow-hidden flex">
                <div className="bg-terminal-green/70 h-full" style={{ width: `${sentiment.bullScore}%` }} />
                <div className="bg-terminal-red/70 h-full" style={{ width: `${sentiment.bearScore}%` }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><div className="data-label">Confidence</div><div className="text-sm font-mono text-terminal-text">{(sentiment.confidence * 100).toFixed(0)}%</div></div>
            <div><div className="data-label">Volume</div><div className="text-sm font-mono text-terminal-text">{sentiment.volume.toLocaleString()}</div></div>
            <div><div className="data-label">Trend</div><div className={`text-sm font-mono ${sentiment.trend === 'rising' ? 'text-terminal-green' : sentiment.trend === 'falling' ? 'text-terminal-red' : 'text-terminal-muted'}`}>{sentiment.trend === 'rising' ? '\u2191' : sentiment.trend === 'falling' ? '\u2193' : '\u2194'} {sentiment.trend}</div></div>
          </div>
        </div>
      )}
      {metrics && (
        <div className="terminal-card p-4">
          <div className="data-label mb-3">Key Metrics</div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            {[
              ['P/E Ratio', metrics.pe.toFixed(1)], ['EPS', `$${metrics.eps.toFixed(2)}`],
              ['Dividend Yield', `${(metrics.dividendYield * 100).toFixed(2)}%`], ['Beta', metrics.beta.toFixed(2)],
              ['52W High', `$${metrics.week52High.toFixed(2)}`], ['52W Low', `$${metrics.week52Low.toFixed(2)}`],
              ['Shares Out', `${(metrics.sharesOutstanding / 1e9).toFixed(2)}B`], ['Avg Volume', `${(metrics.avgVolume / 1e6).toFixed(1)}M`]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between"><span className="text-terminal-muted text-xs">{label}</span><span className="text-terminal-text text-xs font-mono">{value}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
