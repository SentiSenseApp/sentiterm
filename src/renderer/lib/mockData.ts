/**
 * Mock data for SentiTerm demo mode.
 * These fill gaps where the real SentiSense SDK doesn't have
 * terminal-specific aggregations (e.g., bull/bear scores, market overview).
 */

// Extended stock data that combines StockPrice + StockProfile for the terminal UI
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
  filingType: '13D' | '13G'
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

// ── Mock Data ────────────────────────────────────────────────

export const MOCK_STOCKS: Record<string, TerminalStockData> = {
  AAPL: { ticker: 'AAPL', name: 'Apple Inc.', price: 187.32, change: 2.45, changePercent: 1.32, volume: 54_230_100, marketCap: 2_890_000_000_000, sector: 'Technology', exchange: 'NASDAQ' },
  NVDA: { ticker: 'NVDA', name: 'NVIDIA Corporation', price: 924.67, change: 18.34, changePercent: 2.02, volume: 42_100_000, marketCap: 2_280_000_000_000, sector: 'Technology', exchange: 'NASDAQ' },
  TSLA: { ticker: 'TSLA', name: 'Tesla, Inc.', price: 178.22, change: -4.56, changePercent: -2.49, volume: 98_400_000, marketCap: 567_000_000_000, sector: 'Consumer Cyclical', exchange: 'NASDAQ' },
  MSFT: { ticker: 'MSFT', name: 'Microsoft Corporation', price: 432.18, change: 5.67, changePercent: 1.33, volume: 22_100_000, marketCap: 3_210_000_000_000, sector: 'Technology', exchange: 'NASDAQ' },
  AMZN: { ticker: 'AMZN', name: 'Amazon.com, Inc.', price: 198.45, change: 3.21, changePercent: 1.64, volume: 35_600_000, marketCap: 2_050_000_000_000, sector: 'Consumer Cyclical', exchange: 'NASDAQ' },
  GOOG: { ticker: 'GOOG', name: 'Alphabet Inc.', price: 176.89, change: -1.23, changePercent: -0.69, volume: 18_900_000, marketCap: 2_180_000_000_000, sector: 'Technology', exchange: 'NASDAQ' },
  META: { ticker: 'META', name: 'Meta Platforms, Inc.', price: 542.33, change: 8.91, changePercent: 1.67, volume: 15_200_000, marketCap: 1_380_000_000_000, sector: 'Technology', exchange: 'NASDAQ' },
  JPM: { ticker: 'JPM', name: 'JPMorgan Chase & Co.', price: 198.76, change: 1.34, changePercent: 0.68, volume: 8_900_000, marketCap: 572_000_000_000, sector: 'Financial Services', exchange: 'NYSE' }
}

export const MOCK_METRICS: Record<string, TerminalStockMetrics> = {
  AAPL: { ticker: 'AAPL', pe: 29.4, eps: 6.37, dividend: 1.00, dividendYield: 0.53, beta: 1.24, week52High: 199.62, week52Low: 164.08, avgVolume: 48_500_000, sharesOutstanding: 15_440_000_000 },
  NVDA: { ticker: 'NVDA', pe: 64.2, eps: 14.41, dividend: 0.04, dividendYield: 0.004, beta: 1.68, week52High: 974.00, week52Low: 473.20, avgVolume: 38_200_000, sharesOutstanding: 2_460_000_000 },
  TSLA: { ticker: 'TSLA', pe: 52.8, eps: 3.37, dividend: 0, dividendYield: 0, beta: 2.05, week52High: 278.98, week52Low: 138.80, avgVolume: 88_100_000, sharesOutstanding: 3_180_000_000 }
}

export const MOCK_SENTIMENT: Record<string, TerminalSentimentData> = {
  AAPL: { ticker: 'AAPL', overall: 0.72, bullScore: 78, bearScore: 22, confidence: 0.85, volume: 14523, trend: 'rising', updatedAt: '2026-03-05T15:30:00Z' },
  NVDA: { ticker: 'NVDA', overall: 0.89, bullScore: 91, bearScore: 9, confidence: 0.92, volume: 28341, trend: 'rising', updatedAt: '2026-03-05T15:30:00Z' },
  TSLA: { ticker: 'TSLA', overall: -0.15, bullScore: 42, bearScore: 58, confidence: 0.71, volume: 31205, trend: 'falling', updatedAt: '2026-03-05T15:30:00Z' },
  MSFT: { ticker: 'MSFT', overall: 0.65, bullScore: 73, bearScore: 27, confidence: 0.88, volume: 9876, trend: 'stable', updatedAt: '2026-03-05T15:30:00Z' },
  AMZN: { ticker: 'AMZN', overall: 0.58, bullScore: 67, bearScore: 33, confidence: 0.79, volume: 11234, trend: 'rising', updatedAt: '2026-03-05T15:30:00Z' },
  GOOG: { ticker: 'GOOG', overall: 0.44, bullScore: 61, bearScore: 39, confidence: 0.74, volume: 8901, trend: 'stable', updatedAt: '2026-03-05T15:30:00Z' },
  META: { ticker: 'META', overall: 0.52, bullScore: 65, bearScore: 35, confidence: 0.81, volume: 10456, trend: 'rising', updatedAt: '2026-03-05T15:30:00Z' }
}

export const MOCK_BULLBEAR: Record<string, TerminalBullBearAnalysis> = {
  AAPL: {
    ticker: 'AAPL', bullCase: ['Strong services revenue growth at 24% YoY', 'AI health platform opens new TAM', 'Share buyback program continues at $90B'],
    bearCase: ['iPhone unit sales declining in China', 'Regulatory pressure in EU (DMA compliance)', 'Premium pricing limits emerging market growth'], consensus: 'bullish', analystRating: 4.2
  },
  NVDA: {
    ticker: 'NVDA', bullCase: ['Monopoly-like position in AI training GPUs', 'Data center revenue growing 93% YoY', 'Blackwell architecture ramping ahead of schedule'],
    bearCase: ['Concentration risk — top 5 customers = 50% revenue', 'Custom silicon from hyperscalers (Google TPU, Amazon Trainium)', 'Valuation stretched at 45x forward earnings'], consensus: 'bullish', analystRating: 4.7
  },
  TSLA: {
    ticker: 'TSLA', bullCase: ['FSD v13 showing significant improvement', 'Energy storage business growing 150% YoY', 'Optimus robot could be transformative long-term'],
    bearCase: ['Auto margins compressed to 14.5%', 'Market share losses in Europe and China', 'Brand perception issues affecting demand'], consensus: 'mixed', analystRating: 3.1
  }
}

export const MOCK_MARKET_OVERVIEW: TerminalMarketOverview = {
  indices: [
    { name: 'S&P 500', symbol: 'SPY', value: 5_234.18, change: 28.45, changePercent: 0.55 },
    { name: 'NASDAQ', symbol: 'QQQ', value: 16_742.39, change: 98.12, changePercent: 0.59 },
    { name: 'Dow Jones', symbol: 'DIA', value: 39_118.76, change: -42.33, changePercent: -0.11 },
    { name: 'Russell 2000', symbol: 'IWM', value: 2_078.54, change: 12.67, changePercent: 0.61 },
    { name: '10Y Treasury', symbol: 'TNX', value: 4.18, change: -0.03, changePercent: -0.71 },
    { name: 'VIX', symbol: 'VIX', value: 14.32, change: -0.87, changePercent: -5.73 }
  ],
  marketStatus: 'open',
  lastUpdated: '2026-03-05T15:45:00Z'
}

export const MOCK_MARKET_SUMMARY: TerminalMarketSummary = {
  summary: 'Markets traded higher on Wednesday as investors digested strong earnings from NVIDIA and dovish Fed commentary. The S&P 500 rose 0.55% to close near session highs, led by technology and semiconductor stocks. Bond yields fell after Fed Chair Powell signaled growing confidence in the inflation trajectory, boosting rate-sensitive sectors.',
  keyThemes: [
    'AI infrastructure spending acceleration — NVDA, AVGO, MRVL leading',
    'Fed pivot expectations pulling forward to June from September',
    'Commercial real estate stress resurfacing in regional banks',
    'European EV competition intensifying against Tesla',
    'Healthcare AI emerging as new investable theme'
  ],
  sectorPerformance: [
    { sector: 'Technology', change: 1.42 }, { sector: 'Communication Services', change: 0.89 },
    { sector: 'Consumer Discretionary', change: 0.34 }, { sector: 'Healthcare', change: 0.28 },
    { sector: 'Industrials', change: 0.15 }, { sector: 'Utilities', change: 0.08 },
    { sector: 'Consumer Staples', change: -0.12 }, { sector: 'Energy', change: -0.34 },
    { sector: 'Financials', change: -0.45 }, { sector: 'Real Estate', change: -0.67 },
    { sector: 'Materials', change: -0.23 }
  ],
  topMovers: [
    { ticker: 'NVDA', name: 'NVIDIA Corporation', change: 2.02 },
    { ticker: 'META', name: 'Meta Platforms', change: 1.67 },
    { ticker: 'AMZN', name: 'Amazon.com', change: 1.64 },
    { ticker: 'TSLA', name: 'Tesla, Inc.', change: -2.49 },
    { ticker: 'NYCB', name: 'NY Community Bancorp', change: -4.12 }
  ],
  generatedAt: '2026-03-05T16:05:00Z'
}

export const MOCK_STORIES: TerminalStory[] = [
  { id: 'story-001', title: 'NVIDIA Surges on Record Data Center Revenue, AI Demand Accelerates', summary: 'NVIDIA reported Q4 earnings that crushed expectations with data center revenue up 93% YoY.', sentiment: 0.87, sentimentLabel: 'bullish', tickers: ['NVDA', 'AMD', 'AVGO'], sourceCount: 24, publishedAt: '2026-03-05T14:30:00Z', category: 'Earnings' },
  { id: 'story-002', title: 'Federal Reserve Signals Potential Rate Cut in June Meeting', summary: 'Fed Chair Powell indicated the central bank is increasingly confident inflation is moving toward the 2% target.', sentiment: 0.62, sentimentLabel: 'bullish', tickers: ['SPY', 'QQQ', 'TLT'], sourceCount: 18, publishedAt: '2026-03-05T11:15:00Z', category: 'Macro' },
  { id: 'story-003', title: 'Tesla Faces Headwinds as European EV Competition Intensifies', summary: 'BYD and legacy automakers are eroding Tesla\'s market share in Europe, with Q1 registrations down 12% YoY.', sentiment: -0.45, sentimentLabel: 'bearish', tickers: ['TSLA', 'BYDDY', 'RIVN'], sourceCount: 15, publishedAt: '2026-03-05T09:45:00Z', category: 'Industry' },
  { id: 'story-004', title: 'Apple Unveils AI-Powered Health Platform at Spring Event', summary: 'Apple announced a comprehensive health monitoring platform leveraging on-device AI.', sentiment: 0.71, sentimentLabel: 'bullish', tickers: ['AAPL', 'GOOG', 'UNH'], sourceCount: 31, publishedAt: '2026-03-04T20:00:00Z', category: 'Product' },
  { id: 'story-005', title: 'Regional Banking Stress Returns as Commercial Real Estate Defaults Rise', summary: 'Several regional banks reported sharp increases in CRE loan delinquencies.', sentiment: -0.68, sentimentLabel: 'bearish', tickers: ['KRE', 'NYCB', 'PNC'], sourceCount: 12, publishedAt: '2026-03-04T16:30:00Z', category: 'Banking' },
  { id: 'story-006', title: 'Microsoft Azure Growth Reaccelerates, Cloud Wars Heat Up', summary: 'Azure revenue grew 35% in the latest quarter, beating estimates and reversing a deceleration trend.', sentiment: 0.74, sentimentLabel: 'bullish', tickers: ['MSFT', 'AMZN', 'GOOG'], sourceCount: 19, publishedAt: '2026-03-04T14:00:00Z', category: 'Cloud' }
]

export const MOCK_FLOWS: TerminalMarketFlows = {
  quarter: '2025-12-31',
  topInflows: [
    { ticker: 'NVDA', name: 'NVIDIA Corporation', netShares: 45_200_000, netValue: 41_800_000_000, buyerCount: 892, sellerCount: 234 },
    { ticker: 'MSFT', name: 'Microsoft Corporation', netShares: 28_100_000, netValue: 12_100_000_000, buyerCount: 654, sellerCount: 312 },
    { ticker: 'AMZN', name: 'Amazon.com, Inc.', netShares: 22_400_000, netValue: 4_440_000_000, buyerCount: 521, sellerCount: 287 },
    { ticker: 'META', name: 'Meta Platforms, Inc.', netShares: 15_800_000, netValue: 8_560_000_000, buyerCount: 432, sellerCount: 198 },
    { ticker: 'AVGO', name: 'Broadcom Inc.', netShares: 12_300_000, netValue: 2_710_000_000, buyerCount: 398, sellerCount: 156 }
  ],
  topOutflows: [
    { ticker: 'TSLA', name: 'Tesla, Inc.', netShares: -18_900_000, netValue: -3_370_000_000, buyerCount: 312, sellerCount: 567 },
    { ticker: 'NYCB', name: 'New York Community Bancorp', netShares: -34_200_000, netValue: -342_000_000, buyerCount: 45, sellerCount: 234 },
    { ticker: 'PFE', name: 'Pfizer Inc.', netShares: -28_100_000, netValue: -730_600_000, buyerCount: 198, sellerCount: 412 },
    { ticker: 'BA', name: 'Boeing Company', netShares: -8_900_000, netValue: -1_780_000_000, buyerCount: 156, sellerCount: 389 },
    { ticker: 'INTC', name: 'Intel Corporation', netShares: -42_100_000, netValue: -842_000_000, buyerCount: 134, sellerCount: 456 }
  ]
}

export const MOCK_HOLDERS: TerminalInstitutionalHolders = {
  ticker: 'AAPL',
  totalInstitutional: 62.3,
  holders: [
    { name: 'Vanguard Group', shares: 1_310_000_000, value: 245_400_000_000, changeShares: 2_100_000, changePercent: 0.16, portfolioPercent: 5.8, reportDate: '2025-12-31' },
    { name: 'BlackRock Inc.', shares: 1_020_000_000, value: 191_100_000_000, changeShares: -1_500_000, changePercent: -0.15, portfolioPercent: 4.2, reportDate: '2025-12-31' },
    { name: 'Berkshire Hathaway', shares: 905_000_000, value: 169_500_000_000, changeShares: -100_000_000, changePercent: -9.95, portfolioPercent: 28.1, reportDate: '2025-12-31' },
    { name: 'State Street Corp', shares: 592_000_000, value: 110_900_000_000, changeShares: 800_000, changePercent: 0.14, portfolioPercent: 3.1, reportDate: '2025-12-31' },
    { name: 'FMR LLC (Fidelity)', shares: 358_000_000, value: 67_100_000_000, changeShares: 5_200_000, changePercent: 1.47, portfolioPercent: 2.4, reportDate: '2025-12-31' }
  ]
}

export const MOCK_HF_MOVES: TerminalHedgeFundMoves = {
  quarter: '2025-12-31',
  moves: [
    { fund: 'Citadel Advisors', ticker: 'NVDA', name: 'NVIDIA Corporation', action: 'increased', shares: 8_900_000, value: 8_230_000_000, changePercent: 34.2 },
    { fund: 'Bridgewater Associates', ticker: 'GLD', name: 'SPDR Gold Shares', action: 'new_position', shares: 12_400_000, value: 2_480_000_000, changePercent: 100 },
    { fund: 'Renaissance Technologies', ticker: 'TSLA', name: 'Tesla, Inc.', action: 'decreased', shares: 2_100_000, value: 374_000_000, changePercent: -42.5 },
    { fund: 'Two Sigma Investments', ticker: 'AMZN', name: 'Amazon.com, Inc.', action: 'increased', shares: 3_400_000, value: 675_000_000, changePercent: 18.7 },
    { fund: 'D.E. Shaw & Co.', ticker: 'META', name: 'Meta Platforms', action: 'new_position', shares: 1_800_000, value: 976_000_000, changePercent: 100 },
    { fund: 'Point72 Asset Management', ticker: 'MSFT', name: 'Microsoft Corporation', action: 'increased', shares: 2_200_000, value: 950_000_000, changePercent: 15.3 },
    { fund: 'Millennium Management', ticker: 'INTC', name: 'Intel Corporation', action: 'exited', shares: 0, value: 0, changePercent: -100 }
  ]
}

export const MOCK_ACTIVIST: TerminalActivistStake[] = [
  { fund: 'Elliott Management', ticker: 'SWK', name: 'Stanley Black & Decker', stake: 5.2, value: 890_000_000, filingType: '13D', filingDate: '2026-02-15', intent: 'Seeking board representation and strategic review of underperforming segments' },
  { fund: 'Starboard Value', ticker: 'PFGC', name: 'Performance Food Group', stake: 6.8, value: 1_200_000_000, filingType: '13D', filingDate: '2026-01-28', intent: 'Pushing for margin improvement and potential asset sales' },
  { fund: 'Third Point LLC', ticker: 'BURL', name: 'Burlington Stores', stake: 4.1, value: 670_000_000, filingType: '13D', filingDate: '2026-02-03', intent: 'Advocating for accelerated store expansion strategy' }
]

export const MOCK_INDEX_FUND: TerminalIndexFundActivity = {
  quarter: '2025-12-31',
  entries: [
    { ticker: 'NVDA', name: 'NVIDIA Corporation', netChange: 12_300_000, funds: ['Vanguard S&P 500 ETF', 'iShares Core S&P 500', 'SPDR S&P 500 ETF'] },
    { ticker: 'LLY', name: 'Eli Lilly and Company', netChange: 4_500_000, funds: ['Vanguard Total Stock Market', 'iShares Russell 1000'] },
    { ticker: 'AVGO', name: 'Broadcom Inc.', netChange: 3_200_000, funds: ['Vanguard S&P 500 ETF', 'Schwab U.S. Large-Cap'] }
  ]
}
