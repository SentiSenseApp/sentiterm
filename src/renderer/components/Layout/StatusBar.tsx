import React from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { fetchMarketOverview } from '../../lib/api'
import type { TerminalMarketOverview } from '../../lib/types'

export function StatusBar() {
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { data } = useSentiSenseQuery<TerminalMarketOverview | null>(
    async () => apiKey ? fetchMarketOverview(apiKey) : null, [apiKey]
  )

  return (
    <div className="h-7 bg-terminal-panel border-t border-terminal-border flex items-center px-4 text-xs font-mono text-terminal-muted gap-6 shrink-0">
      <span className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${data?.marketStatus === 'open' ? 'bg-terminal-bull' : 'bg-terminal-red'}`} />
        {data?.marketStatus === 'open' ? 'Market Open' : 'Market Closed'}
      </span>

      {data?.indices.slice(0, 4).map((idx) => (
        <span key={idx.symbol} className="flex items-center gap-1.5">
          <span className="text-terminal-text">{idx.symbol}</span>
          <span className={idx.changePercent >= 0 ? 'text-terminal-bull' : 'text-terminal-red'}>
            {idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {' '}
            {idx.changePercent >= 0 ? '\u25B2' : '\u25BC'}
            {Math.abs(idx.changePercent).toFixed(2)}%
          </span>
        </span>
      ))}

      <span className="ml-auto text-terminal-muted/60">
        sentisense.ai
      </span>
    </div>
  )
}
