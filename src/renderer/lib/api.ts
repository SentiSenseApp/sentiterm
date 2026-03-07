import type {
  TerminalStockData, TerminalStockMetrics, TerminalSentimentData,
  TerminalBullBearAnalysis, TerminalMarketOverview, TerminalMarketSummary,
  TerminalStory, TerminalMarketFlows, TerminalFlowEntry,
  TerminalInstitutionalHolders, TerminalHedgeFundMoves, TerminalActivistStake,
  TerminalIndexFundActivity, StockSearchResult
} from './types'

// ── Cache ───────────────────────────────────────────────────

const cache = new Map<string, { data: unknown; ts: number }>()

const TTL = {
  price: 60_000,
  profile: 300_000,
  sentiment: 120_000,
  stories: 120_000,
  institutional: 600_000,
  market: 60_000,
  list: 300_000,
}

async function cached<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < ttl) return entry.data as T
  const data = await fetcher()
  cache.set(key, { data, ts: Date.now() })
  return data
}

export function clearCache(): void {
  cache.clear()
}

// ── IPC wrapper ─────────────────────────────────────────────

async function call<T>(apiKey: string, method: string, ...args: unknown[]): Promise<T> {
  if (!window.api) throw new Error('Not running in Electron')
  return window.api.sentisense.callWithKey(method, apiKey, ...args) as Promise<T>
}

// ── Helper ──────────────────────────────────────────────────

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

// ── Index ETF → name mapping ────────────────────────────────

const INDEX_NAMES: Record<string, string> = {
  SPY: 'S&P 500', QQQ: 'NASDAQ', DIA: 'Dow Jones', IWM: 'Russell 2000'
}
const INDEX_TICKERS = Object.keys(INDEX_NAMES)

// ── Stocks ──────────────────────────────────────────────────

interface SDKStockPrice {
  ticker: string; price: number; change: number; changePercent: number
  previousClose: number; timestamp: number
}

interface SDKStockProfile {
  ticker: string; name: string; sector?: string; industry?: string
  marketCap?: number; [k: string]: unknown
}

export async function fetchStockData(apiKey: string, ticker: string): Promise<TerminalStockData> {
  return cached(`stock:${ticker}`, TTL.price, async () => {
    const [price, profile] = await Promise.all([
      call<SDKStockPrice>(apiKey, 'stocks.getPrice', ticker),
      call<SDKStockProfile>(apiKey, 'stocks.getProfile', ticker),
    ])
    return {
      ticker: price.ticker,
      name: str(profile.name, ticker),
      price: num(price.price),
      change: num(price.change),
      changePercent: num(price.changePercent),
      volume: num(profile['volume']),
      marketCap: num(profile.marketCap),
      sector: str(profile.sector, 'Unknown'),
      exchange: str(profile['exchange'], 'Unknown'),
    }
  })
}

export async function fetchStockPrices(apiKey: string, tickers: string[]): Promise<Record<string, TerminalStockData>> {
  if (!tickers.length) return {}
  return cached(`prices:${tickers.sort().join(',')}`, TTL.price, async () => {
    const [prices, profiles] = await Promise.all([
      call<Record<string, SDKStockPrice>>(apiKey, 'stocks.getPrices', tickers),
      call<Record<string, SDKStockProfile>>(apiKey, 'stocks.getDescriptions', tickers),
    ])
    const result: Record<string, TerminalStockData> = {}
    for (const t of tickers) {
      const p = prices[t]
      const prof = profiles[t]
      if (!p) continue
      result[t] = {
        ticker: t,
        name: str(prof?.name, t),
        price: num(p.price),
        change: num(p.change),
        changePercent: num(p.changePercent),
        volume: num(prof?.['volume']),
        marketCap: num(prof?.marketCap),
        sector: str(prof?.sector, 'Unknown'),
        exchange: str(prof?.['exchange'], 'Unknown'),
      }
    }
    return result
  })
}

export async function fetchStockMetrics(apiKey: string, ticker: string): Promise<TerminalStockMetrics> {
  return cached(`metrics:${ticker}`, TTL.profile, async () => {
    const f = await call<Record<string, unknown>>(apiKey, 'stocks.getCurrentFundamentals', ticker)
    return {
      ticker,
      pe: num(f['pe'] ?? f['peRatio'] ?? f['priceToEarnings']),
      eps: num(f['eps'] ?? f['earningsPerShare']),
      dividend: num(f['dividend'] ?? f['dividendPerShare']),
      dividendYield: num(f['dividendYield']),
      beta: num(f['beta'], 1),
      week52High: num(f['week52High'] ?? f['fiftyTwoWeekHigh']),
      week52Low: num(f['week52Low'] ?? f['fiftyTwoWeekLow']),
      avgVolume: num(f['avgVolume'] ?? f['averageVolume']),
      sharesOutstanding: num(f['sharesOutstanding']),
    }
  })
}

export async function fetchStockList(apiKey: string): Promise<StockSearchResult[]> {
  return cached('stockList', TTL.list, async () => {
    const stocks = await call<Array<{ ticker: string; name: string }>>(apiKey, 'stocks.listDetailed')
    return stocks.map(s => ({ ticker: s.ticker, name: s.name }))
  })
}

// ── Sentiment ───────────────────────────────────────────────

export async function fetchSentiment(apiKey: string, ticker: string): Promise<TerminalSentimentData> {
  return cached(`sentiment:${ticker}`, TTL.sentiment, async () => {
    const s = await call<Record<string, unknown>>(apiKey, 'entityMetrics.getSentiment', ticker)
    const overall = num(s['overall'] ?? s['averageSentiment'] ?? s['score'], 0)
    const bull = num(s['bullScore'] ?? s['positive'], overall > 0 ? 50 + overall * 50 : 50 + overall * 50)
    const bear = 100 - bull
    return {
      ticker,
      overall,
      bullScore: Math.round(bull),
      bearScore: Math.round(bear),
      confidence: num(s['confidence'], 0.5),
      volume: num(s['volume'] ?? s['mentionCount'] ?? s['totalMentions']),
      trend: (str(s['trend'], 'stable') as 'rising' | 'falling' | 'stable'),
      updatedAt: str(s['updatedAt'] ?? s['timestamp'], new Date().toISOString()),
    }
  })
}

export async function fetchAISummary(apiKey: string, ticker: string): Promise<TerminalBullBearAnalysis> {
  return cached(`aiSummary:${ticker}`, TTL.profile, async () => {
    const s = await call<Record<string, unknown>>(apiKey, 'stocks.getAISummary', ticker)
    const bullCase = Array.isArray(s['bullCase']) ? s['bullCase'] as string[]
      : Array.isArray(s['strengths']) ? s['strengths'] as string[]
      : typeof s['summary'] === 'string' ? [s['summary'] as string]
      : ['AI summary not available']
    const bearCase = Array.isArray(s['bearCase']) ? s['bearCase'] as string[]
      : Array.isArray(s['risks']) ? s['risks'] as string[]
      : ['Risk analysis not available']
    const consensus = str(s['consensus'] ?? s['outlook'], 'mixed') as 'bullish' | 'bearish' | 'mixed'
    return {
      ticker,
      bullCase,
      bearCase,
      consensus: ['bullish', 'bearish', 'mixed'].includes(consensus) ? consensus : 'mixed',
      analystRating: num(s['analystRating'] ?? s['rating']),
    }
  })
}

// ── News Stories ────────────────────────────────────────────

interface SDKStory {
  cluster: { id: string; title: string; summarizedContent: string; clusterSize: number; averageSentiment: number; createdAt: number }
  displayTickers: string[]; tickers: string[]; impactScore: number; representativeTimestamp: number
}

function sentimentLabel(score: number): 'bullish' | 'bearish' | 'neutral' {
  if (score > 0.2) return 'bullish'
  if (score < -0.2) return 'bearish'
  return 'neutral'
}

function transformStory(s: SDKStory): TerminalStory {
  return {
    id: s.cluster.id,
    title: s.cluster.title,
    summary: s.cluster.summarizedContent,
    sentiment: s.cluster.averageSentiment,
    sentimentLabel: sentimentLabel(s.cluster.averageSentiment),
    tickers: s.displayTickers?.length ? s.displayTickers : (s.tickers ?? []),
    sourceCount: s.cluster.clusterSize,
    publishedAt: new Date(s.representativeTimestamp).toISOString(),
    category: 'News',
  }
}

export async function fetchStories(apiKey: string): Promise<TerminalStory[]> {
  return cached('stories', TTL.stories, async () => {
    const stories = await call<SDKStory[]>(apiKey, 'documents.getStories')
    return stories.map(transformStory)
  })
}

export async function fetchStoriesByTicker(apiKey: string, ticker: string): Promise<TerminalStory[]> {
  return cached(`stories:${ticker}`, TTL.stories, async () => {
    const stories = await call<SDKStory[]>(apiKey, 'documents.getStoriesByTicker', ticker)
    return stories.map(transformStory)
  })
}

// ── Market Overview ─────────────────────────────────────────

export async function fetchMarketOverview(apiKey: string): Promise<TerminalMarketOverview> {
  return cached('marketOverview', TTL.market, async () => {
    const [prices, status] = await Promise.all([
      call<Record<string, SDKStockPrice>>(apiKey, 'stocks.getPrices', INDEX_TICKERS),
      call<{ status: string }>(apiKey, 'stocks.getMarketStatus'),
    ])
    const indices = INDEX_TICKERS.map(t => {
      const p = prices[t]
      return {
        name: INDEX_NAMES[t],
        symbol: t,
        value: num(p?.price),
        change: num(p?.change),
        changePercent: num(p?.changePercent),
      }
    }).filter(i => i.value > 0)

    const rawStatus = str(status.status, 'closed').toLowerCase()
    const marketStatus = (['open', 'closed', 'pre-market', 'after-hours'].includes(rawStatus)
      ? rawStatus : 'closed') as TerminalMarketOverview['marketStatus']

    return { indices, marketStatus, lastUpdated: new Date().toISOString() }
  })
}

// ── Market Mood / Summary ───────────────────────────────────

export async function fetchMarketMood(apiKey: string): Promise<TerminalMarketSummary> {
  return cached('marketMood', TTL.sentiment, async () => {
    const mood = await call<Record<string, unknown>>(apiKey, 'marketMood.get')
    const summary = str(mood['summary'] ?? mood['narrative'],
      'Market mood data is loading. Check back shortly for AI-generated market analysis.')
    const keyThemes = Array.isArray(mood['keyThemes']) ? mood['keyThemes'] as string[]
      : Array.isArray(mood['themes']) ? mood['themes'] as string[] : []
    const sectorPerformance = Array.isArray(mood['sectorPerformance'])
      ? (mood['sectorPerformance'] as Array<{ sector: string; change: number }>)
      : Array.isArray(mood['sectors'])
        ? (mood['sectors'] as Array<{ sector: string; change: number }>)
        : []
    const topMovers = Array.isArray(mood['topMovers'])
      ? (mood['topMovers'] as Array<{ ticker: string; name: string; change: number }>)
      : []
    return {
      summary,
      keyThemes,
      sectorPerformance,
      topMovers,
      generatedAt: str(mood['generatedAt'] ?? mood['timestamp'], new Date().toISOString()),
    }
  })
}

// ── Institutional ───────────────────────────────────────────

interface SDKQuarter { value: string; label: string; reportDate: string }

interface SDKInstitutionalFlow {
  ticker: string; companyName: string
  totalSharesBought: number; totalSharesSold: number; netSharesChange: number
  newPositions: number; increasedPositions: number; decreasedPositions: number; soldOutPositions: number
  indexFundNetChange: number; hedgeFundNetChange: number; activistActivity: boolean
  reportDate: string
}

interface SDKHolder {
  filerCik: string; filerName: string; filerCategory: string
  shares: number; valueUsd: number
  changeType: 'NEW' | 'INCREASED' | 'DECREASED' | 'SOLD_OUT' | 'UNCHANGED'
  sharesChange: number; sharesChangePct: number
}

export async function fetchQuarters(apiKey: string): Promise<SDKQuarter[]> {
  return cached('quarters', TTL.institutional, async () => {
    return call<SDKQuarter[]>(apiKey, 'institutional.getQuarters')
  })
}

export async function fetchFlows(apiKey: string, reportDate: string): Promise<TerminalMarketFlows> {
  return cached(`flows:${reportDate}`, TTL.institutional, async () => {
    const flows = await call<SDKInstitutionalFlow[]>(apiKey, 'institutional.getFlows', reportDate)
    const sorted = [...flows].sort((a, b) => b.netSharesChange - a.netSharesChange)
    const toEntry = (f: SDKInstitutionalFlow): TerminalFlowEntry => ({
      ticker: f.ticker,
      name: f.companyName,
      netShares: f.netSharesChange,
      netValue: (f.totalSharesBought - f.totalSharesSold),
      buyerCount: f.newPositions + f.increasedPositions,
      sellerCount: f.decreasedPositions + f.soldOutPositions,
    })
    const topInflows = sorted.filter(f => f.netSharesChange > 0).slice(0, 10).map(toEntry)
    const topOutflows = sorted.filter(f => f.netSharesChange < 0).slice(-10).reverse().map(toEntry)
    return { quarter: reportDate, topInflows, topOutflows }
  })
}

export async function fetchHolders(apiKey: string, ticker: string, reportDate: string): Promise<TerminalInstitutionalHolders> {
  return cached(`holders:${ticker}:${reportDate}`, TTL.institutional, async () => {
    const holders = await call<SDKHolder[]>(apiKey, 'institutional.getHolders', ticker, reportDate)
    const totalShares = holders.reduce((sum, h) => sum + h.shares, 0)
    return {
      ticker,
      totalInstitutional: 0, // percentage not available from SDK; sum could be misleading
      holders: holders.map(h => ({
        name: h.filerName,
        shares: h.shares,
        value: h.valueUsd,
        changeShares: h.sharesChange,
        changePercent: h.sharesChangePct,
        portfolioPercent: totalShares > 0 ? (h.shares / totalShares) * 100 : 0,
        reportDate,
      }))
    }
  })
}

export async function fetchHedgeFundActivity(apiKey: string, reportDate: string): Promise<TerminalHedgeFundMoves> {
  return cached(`hfMoves:${reportDate}`, TTL.institutional, async () => {
    const flows = await call<SDKInstitutionalFlow[]>(apiKey, 'institutional.getFlows', reportDate)
    const hfFlows = flows.filter(f => f.hedgeFundNetChange !== 0)
      .sort((a, b) => Math.abs(b.hedgeFundNetChange) - Math.abs(a.hedgeFundNetChange))
      .slice(0, 15)
    return {
      quarter: reportDate,
      moves: hfFlows.map(f => ({
        fund: 'Hedge Funds',
        ticker: f.ticker,
        name: f.companyName,
        action: f.hedgeFundNetChange > 0
          ? ('increased' as const)
          : ('decreased' as const),
        shares: Math.abs(f.hedgeFundNetChange),
        value: 0,
        changePercent: f.netSharesChange !== 0
          ? (f.hedgeFundNetChange / Math.abs(f.netSharesChange)) * 100 : 0,
      }))
    }
  })
}

export async function fetchActivists(apiKey: string, reportDate: string): Promise<TerminalActivistStake[]> {
  return cached(`activists:${reportDate}`, TTL.institutional, async () => {
    const holders = await call<SDKHolder[]>(apiKey, 'institutional.getActivists', reportDate)
    return holders.map(h => ({
      fund: h.filerName,
      ticker: '', // SDK returns holder-level data, ticker comes from context
      name: h.filerName,
      stake: h.sharesChangePct,
      value: h.valueUsd,
      filingType: '13F',
      filingDate: reportDate,
      intent: h.changeType === 'NEW' ? 'New position' : 'Increased stake',
    }))
  })
}

export async function fetchIndexFundActivity(apiKey: string, reportDate: string): Promise<TerminalIndexFundActivity> {
  return cached(`indexFund:${reportDate}`, TTL.institutional, async () => {
    const flows = await call<SDKInstitutionalFlow[]>(apiKey, 'institutional.getFlows', reportDate)
    const idxFlows = flows.filter(f => f.indexFundNetChange !== 0)
      .sort((a, b) => Math.abs(b.indexFundNetChange) - Math.abs(a.indexFundNetChange))
      .slice(0, 15)
    return {
      quarter: reportDate,
      entries: idxFlows.map(f => ({
        ticker: f.ticker,
        name: f.companyName,
        netChange: f.indexFundNetChange,
        funds: [],
      }))
    }
  })
}

// ── Validation ──────────────────────────────────────────────

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await call<unknown>(apiKey, 'stocks.getMarketStatus')
    return true
  } catch {
    return false
  }
}
