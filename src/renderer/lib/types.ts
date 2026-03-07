export interface TerminalStockData {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  sector: string
  exchange: string
}

export interface TerminalStockMetrics {
  ticker: string
  pe: number
  eps: number
  dividend: number
  dividendYield: number
  beta: number
  week52High: number
  week52Low: number
  avgVolume: number
  sharesOutstanding: number
}

export interface TerminalSentimentData {
  ticker: string
  overall: number
  bullScore: number
  bearScore: number
  confidence: number
  volume: number
  trend: 'rising' | 'falling' | 'stable'
  updatedAt: string
}

export interface TerminalBullBearAnalysis {
  ticker: string
  bullCase: string[]
  bearCase: string[]
  consensus: 'bullish' | 'bearish' | 'mixed'
  analystRating: number
}

export interface TerminalMarketOverview {
  indices: Array<{
    name: string
    symbol: string
    value: number
    change: number
    changePercent: number
  }>
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours'
  lastUpdated: string
}

export interface TerminalMarketSummary {
  summary: string
  keyThemes: string[]
  sectorPerformance: Array<{ sector: string; change: number }>
  topMovers: Array<{ ticker: string; name: string; change: number }>
  generatedAt: string
}

export interface TerminalStory {
  id: string
  title: string
  summary: string
  sentiment: number
  sentimentLabel: 'bullish' | 'bearish' | 'neutral'
  tickers: string[]
  sourceCount: number
  publishedAt: string
  category: string
}

export interface TerminalMarketFlows {
  quarter: string
  topInflows: TerminalFlowEntry[]
  topOutflows: TerminalFlowEntry[]
}

export interface TerminalFlowEntry {
  ticker: string
  name: string
  netShares: number
  netValue: number
  buyerCount: number
  sellerCount: number
}

export interface TerminalInstitutionalHolders {
  ticker: string
  totalInstitutional: number
  holders: Array<{
    name: string
    shares: number
    value: number
    changeShares: number
    changePercent: number
    portfolioPercent: number
    reportDate: string
  }>
}

export interface TerminalHedgeFundMoves {
  quarter: string
  moves: Array<{
    fund: string
    ticker: string
    name: string
    action: 'new_position' | 'increased' | 'decreased' | 'exited'
    shares: number
    value: number
    changePercent: number
  }>
}

export interface TerminalActivistStake {
  fund: string
  ticker: string
  name: string
  stake: number
  value: number
  filingType: string
  filingDate: string
  intent: string
}

export interface TerminalIndexFundActivity {
  quarter: string
  entries: Array<{
    ticker: string
    name: string
    netChange: number
    funds: string[]
  }>
}

export interface StockSearchResult {
  ticker: string
  name: string
}
