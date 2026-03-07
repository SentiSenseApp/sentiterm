import React from 'react'
import type { FunctionDef } from './registry'

interface Props {
  items: FunctionDef[]
  selectedIndex: number
  onSelect: (item: FunctionDef) => void
}

export function SuggestionList({ items, selectedIndex, onSelect }: Props) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-terminal-muted text-sm font-mono">
        No matches. Press Enter to ask AI.
      </div>
    )
  }

  return (
    <div className="max-h-[320px] overflow-y-auto py-1">
      {items.map((item, i) => (
        <button
          key={item.id}
          onClick={() => onSelect(item)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
            i === selectedIndex
              ? 'bg-terminal-accent/10 text-terminal-accent'
              : 'text-terminal-text hover:bg-terminal-surface'
          }`}
        >
          <div className="flex-1">
            <div className="text-sm font-medium">{item.name}</div>
            <div className="text-xs text-terminal-muted">{item.description}</div>
          </div>
          <div className="flex gap-1">
            {item.aliases.slice(0, 2).map(a => (
              <span key={a} className="text-[10px] font-mono bg-terminal-bg px-1.5 py-0.5 rounded text-terminal-muted">
                {a}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}
