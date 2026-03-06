import { create } from 'zustand'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface Settings {
  sentiSenseApiKey: string
  aiProvider: 'claude' | 'openai' | 'none'
  aiApiKey: string
  aiModel: string
  showSetupWizard: boolean
}

interface AppState {
  // Navigation
  currentRoute: string
  routeParams: Record<string, string>
  navigate: (route: string, params?: Record<string, string>) => void

  // Watchlist
  watchlist: string[]
  addToWatchlist: (ticker: string) => void
  removeFromWatchlist: (ticker: string) => void

  // Chat
  chatHistory: ChatMessage[]
  addChatMessage: (msg: Omit<ChatMessage, 'timestamp'>) => void
  clearChat: () => void

  // Command bar
  commandBarOpen: boolean
  setCommandBarOpen: (open: boolean) => void

  // Settings
  settings: Settings
  updateSettings: (partial: Partial<Settings>) => void

  // Settings panel
  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRoute: '/',
  routeParams: {},
  navigate: (route, params = {}) => set({ currentRoute: route, routeParams: params }),

  watchlist: ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOG', 'META'],
  addToWatchlist: (ticker) => set((s) => ({
    watchlist: s.watchlist.includes(ticker) ? s.watchlist : [...s.watchlist, ticker]
  })),
  removeFromWatchlist: (ticker) => set((s) => ({
    watchlist: s.watchlist.filter(t => t !== ticker)
  })),

  chatHistory: [],
  addChatMessage: (msg) => set((s) => ({
    chatHistory: [...s.chatHistory, { ...msg, timestamp: Date.now() }]
  })),
  clearChat: () => set({ chatHistory: [] }),

  commandBarOpen: false,
  setCommandBarOpen: (open) => set({ commandBarOpen: open }),

  settings: {
    sentiSenseApiKey: '',
    aiProvider: 'claude',
    aiApiKey: '',
    aiModel: 'claude-sonnet-4-5-20250929',
    showSetupWizard: true
  },
  updateSettings: (partial) => set((s) => ({
    settings: { ...s.settings, ...partial }
  })),

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open })
}))
