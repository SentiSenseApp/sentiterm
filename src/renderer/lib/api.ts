import type {
  TerminalStockData, TerminalStockMetrics, TerminalSentimentData,
  TerminalBullBearAnalysis, TerminalMarketOverview, TerminalMarketSummary,
  TerminalStory, TerminalMarketFlows, TerminalFlowEntry,
  TerminalInstitutionalHolders, TerminalHedgeFundMoves, TerminalActivistStake,
  TerminalIndexFundActivity, StockSearchResult, TerminalChartData
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
    // Use v2 metrics API (v1 getSentiment is retired)
    const metrics = await call<Array<{ timestamp: number; value: number; [k: string]: unknown }>>(
      apiKey, 'entityMetrics.getMetrics', ticker, { metricType: 'sentiment', maxDataPoints: 10 }
    )

    // v2 returns time-series — take the latest data point
    const latest = Array.isArray(metrics) && metrics.length > 0 ? metrics[metrics.length - 1] : null
    const overall = latest ? num(latest.value, 0) : 0

    // Derive bull/bear from sentiment score (-1 to 1 range → 0-100)
    const bull = Math.round(50 + overall * 50)
    const bear = 100 - bull

    // Calculate trend from last few points
    let trend: 'rising' | 'falling' | 'stable' = 'stable'
    if (Array.isArray(metrics) && metrics.length >= 3) {
      const recent = metrics.slice(-3).map(m => num(m.value))
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length
      if (avg > overall + 0.05) trend = 'falling'
      else if (avg < overall - 0.05) trend = 'rising'
    }

    // Get mention count from mentions metric
    let volume = 0
    try {
      const mentions = await call<Array<{ timestamp: number; value: number }>>(
        apiKey, 'entityMetrics.getMetrics', ticker, { metricType: 'mentions', maxDataPoints: 1 }
      )
      if (Array.isArray(mentions) && mentions.length > 0) {
        volume = num(mentions[mentions.length - 1].value)
      }
    } catch {
      // Mentions might not be available
    }

    return {
      ticker,
      overall,
      bullScore: bull,
      bearScore: bear,
      confidence: 0.5, // v2 doesn't expose confidence
      volume,
      trend,
      updatedAt: latest ? new Date(latest.timestamp).toISOString() : new Date().toISOString(),
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
  displayTickers: string[]; tickers: string[]; impactScore: number; brokeAt: number
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
    tickers: s.tickers?.length ? s.tickers : (s.displayTickers ?? []).map(dt => { const m = dt.match(/\(([A-Z0-9.]+)\)$/); return m ? m[1] : dt }),
    sourceCount: s.cluster.clusterSize,
    publishedAt: new Date(s.brokeAt * 1000).toISOString(),
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

export async function fetchStoryDetail(apiKey: string, clusterId: string): Promise<Record<string, unknown>> {
  return cached(`storyDetail:${clusterId}`, TTL.stories, async () => {
    return call<Record<string, unknown>>(apiKey, 'documents.getStoryDetail', clusterId)
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

interface MarketMoodResponse {
  market: {
    currentScore: number
    phase: string
    weeklyChange: number
    signals: Array<{ key: string; label: string; value: number; change: number }>
  }
  sectors: Record<string, { currentScore: number; phase: string; weeklyChange: number }>
}

export async function fetchMarketMood(apiKey: string): Promise<TerminalMarketSummary> {
  return cached('marketMood', TTL.sentiment, async () => {
    const mood = await call<MarketMoodResponse>(apiKey, 'marketMood.get')
    const market = mood.market
    const phase = market.phase ?? 'Unknown'
    const score = Math.round(market.currentScore ?? 0)
    const weeklyChange = market.weeklyChange ?? 0

    // Build summary from market mood data
    const direction = weeklyChange > 0 ? 'improving' : weeklyChange < 0 ? 'declining' : 'stable'
    const summary = `Market sentiment is in a ${phase} phase (score: ${score}/100, ${direction} ${Math.abs(weeklyChange).toFixed(1)}% this week).`

    // Build key themes from signals
    const keyThemes = (market.signals ?? []).map(s => {
      const dir = s.change > 0 ? '\u2191' : s.change < 0 ? '\u2193' : '\u2194'
      return `${s.label}: ${s.value.toFixed(1)} (${dir}${Math.abs(s.change).toFixed(1)}%)`
    })

    // Build sector performance from sectors map
    const sectorPerformance = Object.entries(mood.sectors ?? {}).map(([sector, data]) => ({
      sector,
      change: data.weeklyChange ?? 0,
    }))

    return {
      score,
      phase,
      weeklyChange,
      summary,
      keyThemes,
      sectorPerformance,
      topMovers: [],
      generatedAt: new Date().toISOString(),
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

// ── AI Market Summary ───────────────────────────────────

export interface AIMarketSummaryData {
  totalMentions: number
  topActiveStocks: string[]
  lastUpdated: number
  headline: string | null
  expandedContent: string | null
  generatedAt: number | null
}

export async function fetchAIMarketSummary(apiKey: string): Promise<AIMarketSummaryData> {
  return cached('aiMarketSummary', TTL.sentiment, async () => {
    return call<AIMarketSummaryData>(apiKey, 'marketSummary.get')
  })
}

// ── Chart ───────────────────────────────────────────────

export async function fetchChart(apiKey: string, ticker: string, timeframe: '1M' | '3M' | '6M' | '1Y' = '3M'): Promise<TerminalChartData> {
  return cached(`chart:${ticker}:${timeframe}`, TTL.price, async () => {
    const chart = await call<{ ticker: string; timeframe: string; data: Array<{ date: string; close: number }> }>(
      apiKey, 'stocks.getChart', ticker, { timeframe }
    )
    return {
      ticker: chart.ticker,
      timeframe: chart.timeframe,
      data: (chart.data ?? []).map(d => ({ date: d.date, close: num(d.close) })),
    }
  })
}

// ── Stock Images ────────────────────────────────────────

export async function fetchStockImage(apiKey: string, ticker: string): Promise<{ iconUrl: string | null; logoUrl: string | null }> {
  return cached(`image:${ticker}`, TTL.profile, async () => {
    const images = await call<Record<string, { iconUrl: string | null; logoUrl: string | null }>>(
      apiKey, 'stocks.getImages', [ticker]
    )
    return images[ticker] ?? { iconUrl: null, logoUrl: null }
  })
}

// ── Similar Stocks ──────────────────────────────────────

export async function fetchSimilarStocks(apiKey: string, ticker: string): Promise<StockSearchResult[]> {
  return cached(`similar:${ticker}`, TTL.profile, async () => {
    const similar = await call<Array<{ ticker: string; name: string }>>(
      apiKey, 'stocks.getSimilar', ticker, { limit: 5 }
    )
    return similar.map(s => ({ ticker: s.ticker, name: s.name }))
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
