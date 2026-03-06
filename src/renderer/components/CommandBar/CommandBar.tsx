import React, { useState, useMemo } from 'react'
import { CommandInput } from './CommandInput'
import { SuggestionList } from './SuggestionList'
import { FUNCTION_REGISTRY, type FunctionDef } from './registry'
import { parseIntent } from '../../lib/intentParser'
import { useAppStore } from '../../store'

export function CommandBar() {
  const { commandBarOpen, setCommandBarOpen, navigate } = useAppStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = useMemo(() => {
    if (!query.trim()) return FUNCTION_REGISTRY
    const lower = query.toLowerCase()
    return FUNCTION_REGISTRY.filter(fn =>
      fn.name.toLowerCase().includes(lower) ||
      fn.description.toLowerCase().includes(lower) ||
      fn.aliases.some(a => a.toLowerCase().includes(lower))
    )
  }, [query])

  const handleSubmit = () => {
    // Try rule-based parsing first
    const intent = parseIntent(query)
    if (intent) {
      navigate(intent.route, intent.params)
      close()
      return
    }

    // If there's a selected suggestion, use it
    if (filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex])
      return
    }

    // No match — could fall back to AI intent parsing here
    close()
  }

  const handleSelect = (fn: FunctionDef) => {
    const intent = parseIntent(query)
    if (intent) {
      navigate(intent.route, intent.params)
    } else {
      navigate(fn.route)
    }
    close()
  }

  const close = () => {
    setQuery('')
    setSelectedIndex(0)
    setCommandBarOpen(false)
  }

  if (!commandBarOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center pt-[20vh] z-50" onClick={close}>
      <div
        className="w-[560px] terminal-card shadow-2xl shadow-black/50 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <CommandInput
          value={query}
          onChange={(v) => { setQuery(v); setSelectedIndex(0) }}
          onSubmit={handleSubmit}
          onArrowDown={() => setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))}
          onArrowUp={() => setSelectedIndex(i => Math.max(i - 1, 0))}
        />
        <SuggestionList
          items={filtered}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
        />
        <div className="px-4 py-2 border-t border-terminal-border flex gap-4 text-[10px] font-mono text-terminal-muted/50">
          <span>{'\u2191\u2193'} navigate</span>
          <span>{'\u21B5'} select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}
