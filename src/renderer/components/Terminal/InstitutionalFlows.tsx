import React from 'react'
import { useAppStore } from '../../store'
import { useSentiSenseQuery } from '../../hooks/useSentiSense'
import { DataTable } from '../Common/DataTable'
import {
  MOCK_FLOWS, MOCK_HOLDERS, MOCK_HF_MOVES, MOCK_ACTIVIST, MOCK_INDEX_FUND,
  type TerminalMarketFlows, type TerminalInstitutionalHolders,
  type TerminalHedgeFundMoves, type TerminalActivistStake, type TerminalIndexFundActivity
} from '../../lib/mockData'

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

export function InstitutionalFlows({ ticker }: Props) {
  if (ticker) return <StockHoldersView ticker={ticker} />
  return <MarketFlowsView />
}

function MarketFlowsView() {
  const { navigate } = useAppStore()
  const { data: flows } = useSentiSenseQuery<TerminalMarketFlows>(async () => MOCK_FLOWS)
  if (!flows) return <div className="text-terminal-muted p-4">Loading...</div>
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-terminal-text">Institutional Flows</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="terminal-card p-4">
          <div className="data-label mb-3 text-terminal-green">Top Inflows</div>
          <DataTable columns={[
            { key: 'ticker', header: 'Ticker', render: (r) => <span className="text-terminal-green font-semibold">{r.ticker}</span> },
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
  const { data: holders } = useSentiSenseQuery<TerminalInstitutionalHolders>(
    async () => {
      if (MOCK_HOLDERS.ticker === ticker) return MOCK_HOLDERS
      return { ...MOCK_HOLDERS, ticker, holders: MOCK_HOLDERS.holders.map(h => ({ ...h, changeShares: Math.floor(Math.random() * 2_000_000 - 1_000_000), changePercent: Math.random() * 4 - 2 })) }
    }, [ticker]
  )
  if (!holders) return <div className="text-terminal-muted p-4">Loading...</div>
  return (
    <div className="space-y-4">
      <div className="terminal-card p-4">
        <div className="flex items-center justify-between mb-4"><div className="data-label">Institutional Ownership</div><span className="text-lg font-mono font-semibold text-terminal-text">{holders.totalInstitutional.toFixed(1)}%</span></div>
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
  const { data } = useSentiSenseQuery<TerminalHedgeFundMoves>(async () => MOCK_HF_MOVES)
  if (!data) return <div className="text-terminal-muted p-4">Loading...</div>
  const actionColor = (action: string) => action === 'new_position' || action === 'increased' ? 'text-terminal-green' : action === 'exited' || action === 'decreased' ? 'text-terminal-red' : 'text-terminal-muted'
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-terminal-text">Hedge Fund Moves</h1>
      <div className="terminal-card p-4">
        <DataTable columns={[
          { key: 'fund', header: 'Fund', render: (r) => <span className="text-terminal-text font-medium">{r.fund}</span>, width: '180px' },
          { key: 'ticker', header: 'Ticker', render: (r) => <span className="text-terminal-green font-mono font-semibold">{r.ticker}</span> },
          { key: 'action', header: 'Action', render: (r) => <span className={`text-xs font-mono uppercase ${actionColor(r.action)}`}>{r.action.replace('_', ' ')}</span> },
          { key: 'value', header: 'Value', align: 'right', render: (r) => formatValue(r.value) },
          { key: 'change', header: 'Change', align: 'right', render: (r) => <span className={r.changePercent >= 0 ? 'positive' : 'negative'}>{r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(1)}%</span> }
        ]} data={data.moves} onRowClick={(r) => navigate(`/stocks/${r.ticker}`, { ticker: r.ticker })} />
      </div>
    </div>
  )
}

export function ActivistWatchView() {
  const { navigate } = useAppStore()
  const { data } = useSentiSenseQuery<TerminalActivistStake[]>(async () => MOCK_ACTIVIST)
  if (!data) return <div className="text-terminal-muted p-4">Loading...</div>
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-terminal-text">Activist Watch</h1>
      <div className="terminal-card p-4">
        <DataTable columns={[
          { key: 'fund', header: 'Fund', render: (r) => <span className="text-terminal-amber font-medium">{r.fund}</span>, width: '160px' },
          { key: 'ticker', header: 'Ticker', render: (r) => <span className="text-terminal-green font-mono font-semibold">{r.ticker}</span> },
          { key: 'stake', header: 'Stake', align: 'right', render: (r) => `${r.stake.toFixed(1)}%` },
          { key: 'value', header: 'Value', align: 'right', render: (r) => formatValue(r.value) },
          { key: 'filing', header: 'Filing', render: (r) => <span className="text-terminal-amber font-mono text-xs">{r.filingType}</span> },
          { key: 'intent', header: 'Intent', render: (r) => <span className="text-terminal-muted text-xs truncate block max-w-[240px]">{r.intent}</span> }
        ]} data={data} onRowClick={(r) => navigate(`/stocks/${r.ticker}`, { ticker: r.ticker })} />
      </div>
    </div>
  )
}

export function IndexFundActivityView() {
  const { navigate } = useAppStore()
  const { data } = useSentiSenseQuery<TerminalIndexFundActivity>(async () => MOCK_INDEX_FUND)
  if (!data) return <div className="text-terminal-muted p-4">Loading...</div>
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold text-terminal-text">Index Fund Activity</h1>
      <div className="terminal-card p-4">
        <DataTable columns={[
          { key: 'ticker', header: 'Ticker', render: (r) => <span className="text-terminal-green font-mono font-semibold">{r.ticker}</span> },
          { key: 'name', header: 'Name', render: (r) => <span className="text-terminal-muted">{r.name}</span> },
          { key: 'netChange', header: 'Net Change', align: 'right', render: (r) => <span className={r.netChange >= 0 ? 'positive' : 'negative'}>{r.netChange >= 0 ? '+' : ''}{formatShares(r.netChange)}</span> },
          { key: 'funds', header: 'Funds', render: (r) => <span className="text-terminal-muted text-xs">{r.funds.join(', ')}</span> }
        ]} data={data.entries} onRowClick={(r) => navigate(`/stocks/${r.ticker}`, { ticker: r.ticker })} />
      </div>
    </div>
  )
}
