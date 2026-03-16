import React from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { fetchMarketOverview, fetchMarketMood } from '../../lib/api'
import type { TerminalMarketOverview, TerminalMarketSummary } from '../../lib/types'

export function MarketOverview() {
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { data: overview } = useSentiSenseQuery<TerminalMarketOverview>(
    async () => fetchMarketOverview(apiKey), [apiKey]
  )
  const { data: summary } = useSentiSenseQuery<TerminalMarketSummary>(
    async () => fetchMarketMood(apiKey), [apiKey]
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-terminal-text">Market Overview</h1>
        {overview && (
          <span className={`flex items-center gap-1.5 text-xs font-mono ${overview.marketStatus === 'open' ? 'text-terminal-bull' : 'text-terminal-red'}`}>
            <span className={`w-2 h-2 rounded-full ${overview.marketStatus === 'open' ? 'bg-terminal-bull animate-pulse' : 'bg-terminal-red'}`} />
            Market {overview.marketStatus}
          </span>
        )}
      </div>

      {overview && (
        <div className="grid grid-cols-3 gap-4">
          {overview.indices.map(idx => {
            const isPositive = idx.changePercent >= 0
            return (
              <div key={idx.symbol} className="terminal-card p-4">
                <div className="flex items-center justify-between mb-2"><span className="data-label">{idx.name}</span><span className="text-terminal-muted text-xs font-mono">{idx.symbol}</span></div>
                <div className="text-2xl font-mono font-bold text-terminal-text">{idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={`text-sm font-mono mt-1 ${isPositive ? 'positive' : 'negative'}`}>{isPositive ? '+' : ''}{idx.change.toFixed(2)} ({isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%)</div>
              </div>
            )
          })}
        </div>
      )}

      {summary && (
        <div className="terminal-card p-4">
          <div className="flex items-center gap-2 mb-3"><span className="data-label">Market Mood</span><span className="text-terminal-accent text-[10px] font-mono">SENTISENSE</span></div>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-2xl font-mono font-bold text-terminal-text">{summary.score}</div>
            <div className="text-sm font-mono font-semibold text-terminal-amber">{summary.phase}</div>
            <div className="flex-1 h-2 bg-terminal-bg rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${summary.score >= 70 ? 'bg-terminal-bull' : summary.score >= 40 ? 'bg-terminal-amber' : 'bg-terminal-red'}`} style={{ width: `${summary.score}%` }} />
            </div>
          </div>
          <p className="text-terminal-text text-sm leading-relaxed">{summary.summary}</p>
        </div>
      )}

      {summary && (
        <div className="terminal-card p-4">
          <div className="data-label mb-3">Sector Performance</div>
          <div className="space-y-2">
            {summary.sectorPerformance.map(s => {
              const maxChange = Math.max(...summary.sectorPerformance.map(x => Math.abs(x.change)))
              const barWidth = Math.abs(s.change) / maxChange * 100
              return (
                <div key={s.sector} className="flex items-center gap-3">
                  <span className="text-xs text-terminal-muted w-[180px] shrink-0">{s.sector}</span>
                  <div className="flex-1 flex items-center h-5">
                    <div className="w-1/2 flex justify-end">{s.change < 0 && <div className="bg-terminal-red/30 h-3 rounded-l" style={{ width: `${barWidth}%` }} />}</div>
                    <div className="w-px h-5 bg-terminal-border shrink-0" />
                    <div className="w-1/2">{s.change >= 0 && <div className="bg-terminal-bull/30 h-3 rounded-r" style={{ width: `${barWidth}%` }} />}</div>
                  </div>
                  <span className={`text-xs font-mono w-16 text-right ${s.change >= 0 ? 'positive' : 'negative'}`}>{s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
