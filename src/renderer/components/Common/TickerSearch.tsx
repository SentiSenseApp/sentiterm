import React, { useState } from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { fetchStockList } from '../../lib/api'
import type { StockSearchResult } from '../../lib/types'

interface Props {
  onSelect: (ticker: string) => void
}

export function TickerSearch({ onSelect }: Props) {
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { data: allStocks } = useSentiSenseQuery<StockSearchResult[]>(
    async () => fetchStockList(apiKey), [apiKey]
  )
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const results = query.length >= 1 && allStocks
    ? allStocks.filter(s => s.ticker.includes(query.toUpperCase()) || s.name.toUpperCase().includes(query.toUpperCase()))
    : []

  return (
    <div className="relative">
      <input type="text" value={query} onChange={e => setQuery(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder="Search ticker..." className="terminal-input w-full" />
      {focused && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 terminal-card shadow-lg z-10 max-h-[200px] overflow-y-auto">
          {results.map(r => (
            <button key={r.ticker} onClick={() => { onSelect(r.ticker); setQuery('') }}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-terminal-surface transition-colors">
              <span className="text-terminal-green font-mono text-sm font-semibold">{r.ticker}</span>
              <span className="text-terminal-muted text-xs truncate">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
