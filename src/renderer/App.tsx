import React from 'react'
import { TerminalLayout } from './components/Layout/TerminalLayout'
import { CommandBar } from './components/CommandBar/CommandBar'
import { AIProviderConfig } from './components/Claude/AIProviderConfig'
import { Dashboard } from './components/Terminal/Dashboard'
import { StockView } from './components/Terminal/StockView'
import { NewsStories } from './components/Terminal/NewsStories'
import { InstitutionalFlows, HedgeFundMovesView, ActivistWatchView, IndexFundActivityView } from './components/Terminal/InstitutionalFlows'
import { MarketOverview } from './components/Terminal/MarketOverview'
import { useCommandBar } from './hooks/useCommandBar'
import { useAppStore } from './store'

function Router() {
  const { currentRoute } = useAppStore()

  // Stock routes
  if (currentRoute.startsWith('/stocks/')) return <StockView />

  // Flow routes
  if (currentRoute === '/flows/market') return <InstitutionalFlows />
  if (currentRoute === '/flows/hedge-funds') return <HedgeFundMovesView />
  if (currentRoute === '/flows/activist') return <ActivistWatchView />
  if (currentRoute === '/flows/index-funds') return <IndexFundActivityView />

  // Other routes
  if (currentRoute === '/stories') return <NewsStories />
  if (currentRoute === '/market') return <MarketOverview />

  // Default
  return <Dashboard />
}

export default function App() {
  useCommandBar()
  const { settingsOpen, setSettingsOpen } = useAppStore()

  return (
    <>
      <TerminalLayout>
        <Router />
      </TerminalLayout>
      <CommandBar />
      {settingsOpen && <AIProviderConfig onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
