import React, { useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onArrowDown: () => void
  onArrowUp: () => void
}

export function CommandInput({ value, onChange, onSubmit, onArrowDown, onArrowUp }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onArrowDown()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      onArrowUp()
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-terminal-border">
      <span className="text-terminal-accent font-mono text-sm">{'\u2318'}K</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Type a command... "AAPL", "flows", "who is buying NVDA"'
        className="flex-1 bg-transparent outline-none text-terminal-text font-mono text-sm placeholder-terminal-muted/50"
      />
    </div>
  )
}
