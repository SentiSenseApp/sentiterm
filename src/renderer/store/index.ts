import { create } from 'zustand'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface Settings {
  sentiSenseApiKey: string
  aiApiKey: string
  aiKeySource: 'manual' | 'env' | 'claude-code' | 'none'
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

  // Hydration
  hydrated: boolean
  hydrate: () => Promise<void>
}

const DEFAULT_SETTINGS: Settings = {
  sentiSenseApiKey: '',
  aiApiKey: '',
  aiKeySource: 'none',
  aiModel: 'claude-sonnet-4-5-20250929',
  showSetupWizard: true,
}

const DEFAULT_WATCHLIST = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOG', 'META']

function persistSettings(settings: Settings): void {
  window.api?.store?.set('settings', settings)
}

function persistWatchlist(watchlist: string[]): void {
  window.api?.store?.set('watchlist', watchlist)
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRoute: '/',
  routeParams: {},
  navigate: (route, params = {}) => set({ currentRoute: route, routeParams: params }),

  watchlist: DEFAULT_WATCHLIST,
  addToWatchlist: (ticker) => set((s) => {
    const watchlist = s.watchlist.includes(ticker) ? s.watchlist : [...s.watchlist, ticker]
    persistWatchlist(watchlist)
    return { watchlist }
  }),
  removeFromWatchlist: (ticker) => set((s) => {
    const watchlist = s.watchlist.filter(t => t !== ticker)
    persistWatchlist(watchlist)
    return { watchlist }
  }),

  chatHistory: [],
  addChatMessage: (msg) => set((s) => ({
    chatHistory: [...s.chatHistory, { ...msg, timestamp: Date.now() }]
  })),
  clearChat: () => set({ chatHistory: [] }),

  commandBarOpen: false,
  setCommandBarOpen: (open) => set({ commandBarOpen: open }),

  settings: DEFAULT_SETTINGS,
  updateSettings: (partial) => set((s) => {
    const settings = { ...s.settings, ...partial }
    persistSettings(settings)
    return { settings }
  }),

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return
    try {
      const persisted = await window.api?.store?.getAll()
      if (persisted) {
        set({
          settings: { ...DEFAULT_SETTINGS, ...(persisted.settings ?? {}) },
          watchlist: Array.isArray(persisted.watchlist) ? persisted.watchlist : DEFAULT_WATCHLIST,
          hydrated: true,
        })
      } else {
        set({ hydrated: true })
      }
    } catch {
      set({ hydrated: true })
    }
  },
}))
