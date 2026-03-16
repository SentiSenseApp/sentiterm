export interface FunctionDef {
  id: string
  name: string
  description: string
  aliases: string[]
  patterns: RegExp[]
  route: string
  params?: (match: RegExpMatchArray) => Record<string, string>
  category: 'navigation' | 'data' | 'action'
}

export const FUNCTION_REGISTRY: FunctionDef[] = [
  {
    id: 'stock_overview',
    name: 'Stock Overview',
    description: 'View stock details and price',
    aliases: ['GO', 'EQUITY'],
    patterns: [
      /^([A-Z]{1,5})$/,
      /^([A-Z]{1,5})\s+(overview|stock)$/i
    ],
    route: '/stocks/:ticker',
    params: (match) => ({ ticker: match[1].toUpperCase() }),
    category: 'navigation'
  },
  {
    id: 'stock_sentiment',
    name: 'Stock Sentiment',
    description: 'Bull/bear sentiment analysis',
    aliases: ['SENT'],
    patterns: [
      /^([A-Z]{1,5})\s+sent(?:iment)?$/i,
      /^sentiment\s+([A-Z]{1,5})$/i
    ],
    route: '/stocks/:ticker/sentiment',
    params: (match) => ({ ticker: (match[1] || match[2]).toUpperCase() }),
    category: 'navigation'
  },
  {
    id: 'stock_holders',
    name: 'Institutional Holders',
    description: 'Who is buying/selling this stock',
    aliases: ['HDS', 'HOLDERS'],
    patterns: [
      /^([A-Z]{1,5})\s+(?:holders?|hds)$/i,
      /^who\s+is\s+(?:buying|selling)\s+([A-Z]{1,5})$/i,
      /^hds\s+([A-Z]{1,5})$/i
    ],
    route: '/stocks/:ticker/holders',
    params: (match) => ({ ticker: (match[2] || match[1]).toUpperCase() }),
    category: 'navigation'
  },
  {
    id: 'stock_news',
    name: 'Stock News',
    description: 'News for a specific stock',
    aliases: ['NEWS', 'CN'],
    patterns: [
      /^([A-Z]{1,5})\s+news$/i,
      /^news\s+([A-Z]{1,5})$/i
    ],
    route: '/stocks/:ticker/news',
    params: (match) => ({ ticker: (match[1] || match[2]).toUpperCase() }),
    category: 'navigation'
  },
  {
    id: 'market_flows',
    name: 'Market Flows',
    description: 'Institutional inflows and outflows',
    aliases: ['FLOWS'],
    patterns: [
      /^(?:market\s+)?flows$/i,
      /^top\s+(?:inflows|outflows)$/i,
      /^institutional\s+flows$/i
    ],
    route: '/flows/market',
    category: 'navigation'
  },
  {
    id: 'index_funds',
    name: 'Index Fund Activity',
    description: 'What are index funds buying',
    aliases: ['IDX'],
    patterns: [
      /^index\s+funds?(?:\s+activity)?$/i,
      /^what\s+(?:is|are)\s+(?:my\s+)?index\s+funds?\s+buying$/i
    ],
    route: '/flows/index-funds',
    category: 'navigation'
  },
  {
    id: 'hedge_funds',
    name: 'Hedge Fund Moves',
    description: 'Smart money positioning',
    aliases: ['HF', 'SMART'],
    patterns: [
      /^hedge\s+funds?(?:\s+moves)?$/i,
      /^smart\s+money$/i
    ],
    route: '/flows/hedge-funds',
    category: 'navigation'
  },
  {
    id: 'activist_watch',
    name: 'Activist Watch',
    description: 'New activist stakes and 13D filings',
    aliases: ['ACT', '13D'],
    patterns: [
      /^activists?(?:\s+watch)?$/i,
      /^13d$/i
    ],
    route: '/flows/activist',
    category: 'navigation'
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Home dashboard with watchlist',
    aliases: ['HOME', 'DASH'],
    patterns: [/^(?:home|dashboard|main)$/i],
    route: '/',
    category: 'navigation'
  },
  {
    id: 'stories',
    name: 'AI News Stories',
    description: 'AI-clustered news stories with sentiment',
    aliases: ['STORIES'],
    patterns: [
      /^(?:news|stories)$/i,
      /^ai\s+(?:news|stories)$/i
    ],
    route: '/stories',
    category: 'navigation'
  },
  {
    id: 'feeds',
    name: 'Live Feed',
    description: 'Raw document feed with sentiment from all sources',
    aliases: ['FEED', 'DOCS'],
    patterns: [
      /^(?:feeds?|live\s+feed)$/i,
      /^(?:docs|documents)$/i,
      /^(?:raw\s+)?feed$/i
    ],
    route: '/feeds',
    category: 'navigation'
  },
  {
    id: 'indexes',
    name: 'Indexes',
    description: 'SentiSense proprietary market indexes',
    aliases: ['IDX', 'MOOD', 'INDEXES'],
    patterns: [
      /^(?:indexes|indices)$/i,
      /^market\s+mood$/i,
      /^(?:fear|greed)\s*(?:index)?$/i
    ],
    route: '/indexes',
    category: 'navigation'
  },
  {
    id: 'market_overview',
    name: 'Market Overview',
    description: 'Market indexes and status',
    aliases: ['MKT', 'MARKET'],
    patterns: [
      /^market(?:\s+overview)?$/i,
      /^indexes$/i
    ],
    route: '/market',
    category: 'navigation'
  }
]
