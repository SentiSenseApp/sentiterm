import React, { useState } from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { AreaChart } from '../Common/Chart'

// ── Types ──────────────────────────────────────────────────────

interface MarketMoodFull {
  market: {
    currentScore: number
    phase: string
    weeklyChange: number
    signals: Array<{ key: string; label: string; value: number; change: number }>
    history: Array<{ date: string; score: number }>
  }
  sectors: Record<string, { currentScore: number; phase: string; weeklyChange: number }>
}

// ── Helpers ────────────────────────────────────────────────────

function phaseColor(phase: string): string {
  const p = phase.toLowerCase()
  if (p.includes('greed') || p.includes('euphoria')) return 'text-terminal-bull'
  if (p.includes('fear') || p.includes('panic')) return 'text-terminal-red'
  return 'text-terminal-amber'
}

function gaugeColor(score: number): string {
  if (score >= 70) return 'bg-terminal-bull'
  if (score >= 40) return 'bg-terminal-amber'
  return 'bg-terminal-red'
}

function sectorPhaseColor(phase: string): string {
  const p = phase.toLowerCase()
  if (p.includes('greed')) return 'text-terminal-bull'
  if (p.includes('fear')) return 'text-terminal-red'
  return 'text-terminal-amber'
}

// ── Market Mood Index Card ─────────────────────────────────────

function MarketMoodIndex({ data }: { data: MarketMoodFull }) {
  const { market, sectors } = data
  const [showSectors, setShowSectors] = useState(false)

  // Prepare history for area chart
  const historyData = (market.history ?? []).map(h => ({
    date: h.date,
    close: h.score,
  }))

  return (
    <div className="space-y-4">
      {/* Score + Gauge */}
      <div className="terminal-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="data-label mb-1">Market Mood Index</div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-mono font-bold text-terminal-text">{Math.round(market.currentScore)}</span>
                <span className={`text-lg font-mono font-semibold ${phaseColor(market.phase)}`}>{market.phase}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="data-label mb-1">Weekly Change</div>
            <div className={`text-lg font-mono font-semibold ${market.weeklyChange >= 0 ? 'text-terminal-bull' : 'text-terminal-red'}`}>
              {market.weeklyChange >= 0 ? '\u2191' : '\u2193'} {Math.abs(market.weeklyChange).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Gauge bar */}
        <div className="relative h-4 bg-terminal-bg rounded-full overflow-hidden mb-1">
          <div
            className={`h-full rounded-full transition-all duration-700 ${gaugeColor(market.currentScore)}`}
            style={{ width: `${market.currentScore}%` }}
          />
          {/* Scale labels */}
          <div className="absolute inset-0 flex items-center justify-between px-2 text-[8px] font-mono text-terminal-muted/40 pointer-events-none">
            <span>FEAR</span>
            <span>NEUTRAL</span>
            <span>GREED</span>
          </div>
        </div>
      </div>

      {/* History Chart */}
      {historyData.length > 2 && (
        <div className="terminal-card p-4">
          <div className="data-label mb-3">Mood History</div>
          <AreaChart data={historyData} height={200} />
        </div>
      )}

      {/* Signals */}
      <div className="terminal-card p-4">
        <div className="data-label mb-3">Signals</div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {market.signals.map(s => (
            <div key={s.key} className="bg-terminal-bg rounded-lg p-3">
              <div className="text-[10px] font-mono text-terminal-muted mb-1">{s.label}</div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-mono font-semibold text-terminal-text">{s.value.toFixed(1)}</span>
                <span className={`text-xs font-mono ${s.change > 0 ? 'text-terminal-bull' : s.change < 0 ? 'text-terminal-red' : 'text-terminal-muted'}`}>
                  {s.change > 0 ? '\u2191' : s.change < 0 ? '\u2193' : '\u2194'}{Math.abs(s.change).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sectors */}
      <div className="terminal-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="data-label">Sector Mood</div>
          <button
            onClick={() => setShowSectors(!showSectors)}
            className="text-[10px] font-mono text-terminal-muted hover:text-terminal-accent transition-colors"
          >
            {showSectors ? 'Collapse' : 'Expand'} {showSectors ? '\u25B4' : '\u25BE'}
          </button>
        </div>
        <div className={`grid ${showSectors ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'} gap-2`}>
          {Object.entries(sectors)
            .sort(([, a], [, b]) => b.currentScore - a.currentScore)
            .slice(0, showSectors ? undefined : 6)
            .map(([name, s]) => (
              <div key={name} className="flex items-center justify-between bg-terminal-bg rounded-lg px-3 py-2">
                <span className="text-xs text-terminal-muted truncate mr-2">{name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-mono font-semibold ${sectorPhaseColor(s.phase)}`}>
                    {Math.round(s.currentScore)}
                  </span>
                  <span className={`text-[10px] font-mono ${s.weeklyChange >= 0 ? 'text-terminal-bull' : 'text-terminal-red'}`}>
                    {s.weeklyChange >= 0 ? '+' : ''}{s.weeklyChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Indexes View ──────────────────────────────────────────

type IndexTab = 'market-mood' | 'all'

export function IndexesView() {
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const [tab, setTab] = useState<IndexTab>('market-mood')

  const { data: moodData, loading, error } = useSentiSenseQuery<MarketMoodFull>(
    async () => {
      const result = await window.api.sentisense.callWithKey('marketMood.get', apiKey)
      return result as MarketMoodFull
    },
    [apiKey]
  )

  const tabs: { key: IndexTab; label: string }[] = [
    { key: 'market-mood', label: 'Market Mood' },
    { key: 'all', label: 'All Indexes' },
  ]

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-terminal-text">Indexes</h1>
          <p className="text-terminal-muted text-xs mt-1">SentiSense proprietary market indexes and indicators</p>
        </div>
        <div className="flex gap-1.5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-mono rounded-lg transition-colors ${
                tab === t.key
                  ? 'bg-terminal-accent/15 text-terminal-accent'
                  : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && !moodData && (
          <div className="terminal-card p-8 text-center">
            <div className="text-terminal-accent text-sm font-mono animate-pulse">Loading indexes...</div>
          </div>
        )}

        {error && (
          <div className="terminal-card p-4">
            <p className="text-terminal-muted text-sm font-mono">{error}</p>
          </div>
        )}

        {tab === 'market-mood' && moodData && (
          <MarketMoodIndex data={moodData} />
        )}

        {tab === 'all' && (
          <div className="space-y-4">
            {moodData && (
              <div
                className="terminal-card p-4 cursor-pointer hover:border-terminal-accent/30 transition-colors"
                onClick={() => setTab('market-mood')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="data-label mb-1">Market Mood Index</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-mono font-bold text-terminal-text">{Math.round(moodData.market.currentScore)}</span>
                      <span className={`text-sm font-mono ${phaseColor(moodData.market.phase)}`}>{moodData.market.phase}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-terminal-accent/10 text-terminal-accent">
                    GAUGE · LIVE
                  </span>
                </div>
              </div>
            )}
            {/* Future indexes will appear here */}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2">
        <p className="text-terminal-muted/30 text-[10px] font-mono text-center">
          Proprietary indexes by SentiSense. Not financial advice.
        </p>
      </div>
    </div>
  )
}
