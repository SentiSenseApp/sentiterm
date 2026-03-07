import React, { useState } from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { DataTable } from '../Common/DataTable'
import {
  fetchQuarters, fetchFlows, fetchHolders, fetchHedgeFundActivity,
  fetchActivists, fetchIndexFundActivity
} from '../../lib/api'
import type {
  TerminalMarketFlows, TerminalInstitutionalHolders,
  TerminalHedgeFundMoves, TerminalActivistStake, TerminalIndexFundActivity
} from '../../lib/types'

interface Props { ticker?: string }

function formatValue(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  return `$${value.toLocaleString()}`
}

function formatShares(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `${(value / 1e3).toFixed(0)}K`
  return value.toLocaleString()
}

function useQuarterSelector() {
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { data: quarters } = useSentiSenseQuery(
    async () => fetchQuarters(apiKey), [apiKey]
  )
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null)
  const reportDate = selectedQuarter ?? quarters?.[0]?.reportDate ?? ''
  return { quarters, reportDate, selectedQuarter, setSelectedQuarter }
}

function QuarterSelect({ quarters, value, onChange }: {
  quarters: Array<{ value: string; label: string; reportDate: string }> | null
  value: string; onChange: (v: string) => void
}) {
  if (!quarters?.length) return null
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="terminal-input text-xs py-1 px-2">
      {quarters.map(q => <option key={q.reportDate} value={q.reportDate}>{q.label}</option>)}
    </select>
  )
}

export function InstitutionalFlows({ ticker }: Props) {
  if (ticker) return <StockHoldersView ticker={ticker} />
  return <MarketFlowsView />
}

function MarketFlowsView() {
  const { navigate } = useAppStore()
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { quarters, reportDate, setSelectedQuarter } = useQuarterSelector()
  const { data: flows } = useSentiSenseQuery<TerminalMarketFlows>(
    async () => reportDate ? fetchFlows(apiKey, reportDate) : { quarter: '', topInflows: [], topOutflows: [] },
    [apiKey, reportDate]
  )
  if (!flows) return <div className="text-terminal-muted p-4">Loading...</div>
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-terminal-text">Institutional Flows</h1>
        <QuarterSelect quarters={quarters ?? null} value={reportDate} onChange={setSelectedQuarter} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="terminal-card p-4">
          <div className="data-label mb-3 text-terminal-bull">Top Inflows</div>
          <DataTable columns={[
            { key: 'ticker', header: 'Ticker', render: (r) => <span className="text-terminal-accent font-semibold">{r.ticker}</span> },
            { key: 'name', header: 'Name', render: (r) => <span className="text-terminal-muted text-xs truncate block max-w-[140px]">{r.name}</span> },
            { key: 'netValue', header: 'Net Value', align: 'right', render: (r) => <span className="positive">{formatValue(r.netValue)}</span> },
            { key: 'buyers', header: 'Buy/Sell', align: 'right', render: (r) => <span>{r.buyerCount}/{r.sellerCount}</span> }
          ]} data={flows.topInflows} onRowClick={(r) => navigate(`/stocks/${r.ticker}`, { ticker: r.ticker })} />
        </div>
        <div className="terminal-card p-4">
          <div className="data-label mb-3 text-terminal-red">Top Outflows</div>
          <DataTable columns={[
            { key: 'ticker', header: 'Ticker', render: (r) => <span className="text-terminal-red font-semibold">{r.ticker}</span> },
            { key: 'name', header: 'Name', render: (r) => <span className="text-terminal-muted text-xs truncate block max-w-[140px]">{r.name}</span> },
            { key: 'netValue', header: 'Net Value', align: 'right', render: (r) => <span className="negative">{formatValue(r.netValue)}</span> },
            { key: 'buyers', header: 'Buy/Sell', align: 'right', render: (r) => <span>{r.buyerCount}/{r.sellerCount}</span> }
          ]} data={flows.topOutflows} onRowClick={(r) => navigate(`/stocks/${r.ticker}`, { ticker: r.ticker })} />
        </div>
      </div>
    </div>
  )
}

function StockHoldersView({ ticker }: { ticker: string }) {
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { quarters, reportDate } = useQuarterSelector()
  const { data: holders } = useSentiSenseQuery<TerminalInstitutionalHolders>(
    async () => reportDate ? fetchHolders(apiKey, ticker, reportDate) : { ticker, totalInstitutional: 0, holders: [] },
    [apiKey, ticker, reportDate]
  )
  if (!holders) return <div className="text-terminal-muted p-4">Loading...</div>
  return (
    <div className="space-y-4">
      <div className="terminal-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="data-label">Institutional Holders</div>
          <QuarterSelect quarters={quarters ?? null} value={reportDate} onChange={() => {}} />
        </div>
        <DataTable columns={[
          { key: 'name', header: 'Holder', render: (r) => <span className="text-terminal-text font-medium">{r.name}</span>, width: '200px' },
          { key: 'shares', header: 'Shares', align: 'right', render: (r) => formatShares(r.shares) },
          { key: 'value', header: 'Value', align: 'right', render: (r) => formatValue(r.value) },
          { key: 'change', header: 'Change', align: 'right', render: (r) => <span className={r.changePercent >= 0 ? 'positive' : 'negative'}>{r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%</span> },
          { key: 'portfolio', header: '% Portfolio', align: 'right', render: (r) => `${r.portfolioPercent.toFixed(1)}%` }
        ]} data={holders.holders} />
      </div>
    </div>
  )
}

export function HedgeFundMovesView() {
  const { navigate } = useAppStore()
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { quarters, reportDate, setSelectedQuarter } = useQuarterSelector()
  const { data } = useSentiSenseQuery<TerminalHedgeFundMoves>(
    async () => reportDate ? fetchHedgeFundActivity(apiKey, reportDate) : { quarter: '', moves: [] },
    [apiKey, reportDate]
  )
  if (!data) return <div className="text-terminal-muted p-4">Loading...</div>
  const actionColor = (action: string) => action === 'new_position' || action === 'increased' ? 'text-terminal-bull' : action === 'exited' || action === 'decreased' ? 'text-terminal-red' : 'text-terminal-muted'
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-terminal-text">Hedge Fund Moves</h1>
        <QuarterSelect quarters={quarters ?? null} value={reportDate} onChange={setSelectedQuarter} />
      </div>
      <div className="terminal-card p-4">
        <DataTable columns={[
          { key: 'ticker', header: 'Ticker', render: (r) => <span className="text-terminal-accent font-mono font-semibold">{r.ticker}</span> },
          { key: 'name', header: 'Name', render: (r) => <span className="text-terminal-muted">{r.name}</span>, width: '180px' },
          { key: 'action', header: 'Action', render: (r) => <span className={`text-xs font-mono uppercase ${actionColor(r.action)}`}>{r.action.replace('_', ' ')}</span> },
          { key: 'shares', header: 'Shares', align: 'right', render: (r) => formatShares(r.shares) },
          { key: 'change', header: 'Change', align: 'right', render: (r) => <span className={r.changePercent >= 0 ? 'positive' : 'negative'}>{r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(1)}%</span> }
        ]} data={data.moves} onRowClick={(r) => navigate(`/stocks/${r.ticker}`, { ticker: r.ticker })} />
      </div>
    </div>
  )
}

export function ActivistWatchView() {
  const { navigate } = useAppStore()
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { quarters, reportDate, setSelectedQuarter } = useQuarterSelector()
  const { data } = useSentiSenseQuery<TerminalActivistStake[]>(
    async () => reportDate ? fetchActivists(apiKey, reportDate) : [],
    [apiKey, reportDate]
  )
  if (!data) return <div className="text-terminal-muted p-4">Loading...</div>
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-terminal-text">Activist Watch</h1>
        <QuarterSelect quarters={quarters ?? null} value={reportDate} onChange={setSelectedQuarter} />
      </div>
      <div className="terminal-card p-4">
        <DataTable columns={[
          { key: 'fund', header: 'Filer', render: (r) => <span className="text-terminal-amber font-medium">{r.fund}</span>, width: '200px' },
          { key: 'value', header: 'Value', align: 'right', render: (r) => formatValue(r.value) },
          { key: 'filing', header: 'Filing', render: (r) => <span className="text-terminal-amber font-mono text-xs">{r.filingType}</span> },
          { key: 'intent', header: 'Action', render: (r) => <span className="text-terminal-muted text-xs truncate block max-w-[240px]">{r.intent}</span> }
        ]} data={data} onRowClick={(r) => r.ticker && navigate(`/stocks/${r.ticker}`, { ticker: r.ticker })} />
      </div>
    </div>
  )
}

export function IndexFundActivityView() {
  const { navigate } = useAppStore()
  const apiKey = useAppStore().settings.sentiSenseApiKey
  const { quarters, reportDate, setSelectedQuarter } = useQuarterSelector()
  const { data } = useSentiSenseQuery<TerminalIndexFundActivity>(
    async () => reportDate ? fetchIndexFundActivity(apiKey, reportDate) : { quarter: '', entries: [] },
    [apiKey, reportDate]
  )
  if (!data) return <div className="text-terminal-muted p-4">Loading...</div>
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-terminal-text">Index Fund Activity</h1>
        <QuarterSelect quarters={quarters ?? null} value={reportDate} onChange={setSelectedQuarter} />
      </div>
      <div className="terminal-card p-4">
        <DataTable columns={[
          { key: 'ticker', header: 'Ticker', render: (r) => <span className="text-terminal-accent font-mono font-semibold">{r.ticker}</span> },
          { key: 'name', header: 'Name', render: (r) => <span className="text-terminal-muted">{r.name}</span> },
          { key: 'netChange', header: 'Net Change', align: 'right', render: (r) => <span className={r.netChange >= 0 ? 'positive' : 'negative'}>{r.netChange >= 0 ? '+' : ''}{formatShares(r.netChange)}</span> }
        ]} data={data.entries} onRowClick={(r) => navigate(`/stocks/${r.ticker}`, { ticker: r.ticker })} />
      </div>
    </div>
  )
}
