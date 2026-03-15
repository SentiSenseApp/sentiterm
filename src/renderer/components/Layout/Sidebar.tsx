import React from 'react'
import { useAppStore } from '../../store'

const NAV_ITEMS = [
  { icon: '\u2302', label: 'Dashboard', route: '/' },
  { icon: '\u2637', label: 'Stories', route: '/stories' },
  { icon: '\u25A4', label: 'Feeds', route: '/feeds' },
  { icon: '\u2191\u2193', label: 'Flows', route: '/flows/market' },
  { icon: '\u2609', label: 'Market', route: '/market' },
]

export function Sidebar() {
  const { currentRoute, navigate, setSettingsOpen } = useAppStore()

  return (
    <div className="w-14 bg-terminal-panel border-r border-terminal-border flex flex-col items-center py-3 gap-1.5 shrink-0">
      {/* Logo */}
      <img
        src={new URL('../../assets/logo.png', import.meta.url).href}
        alt="SentiSense"
        className="w-9 h-9 rounded-lg mb-4 cursor-default"
      />

      {NAV_ITEMS.map((item) => (
        <button
          key={item.route}
          onClick={() => navigate(item.route)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-base transition-colors ${
            currentRoute === item.route || currentRoute.startsWith(item.route + '/')
              ? 'bg-terminal-accent/10 text-terminal-accent'
              : 'text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface'
          }`}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}

      <div className="mt-auto">
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-base text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface transition-colors"
          title="Settings"
        >
          {'\u2699'}
        </button>
      </div>
    </div>
  )
}
