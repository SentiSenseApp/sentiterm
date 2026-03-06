import React, { useState } from 'react'
import { MOCK_STOCKS } from '../../lib/mockData'

interface StockSearchResult {
  ticker: string
  name: string
  exchange: string
  sector: string
}

const ALL_STOCKS: StockSearchResult[] = Object.values(MOCK_STOCKS).map(s => ({
  ticker: s.ticker, name: s.name, exchange: s.exchange, sector: s.sector
}))

interface Props {
  onSelect: (ticker: string) => void
}

export function TickerSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const results = query.length >= 1
    ? ALL_STOCKS.filter(s => s.ticker.includes(query.toUpperCase()) || s.name.toUpperCase().includes(query.toUpperCase()))
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
