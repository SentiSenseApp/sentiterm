import React, { useState, useRef, useEffect } from 'react'

interface Props {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [value])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-3 border-t border-terminal-border">
      <div className="flex gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any stock or market..."
          className="terminal-input flex-1 resize-none min-h-[36px] max-h-[120px]"
          rows={1}
          disabled={disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="px-3 py-1.5 bg-terminal-accent/10 text-terminal-accent rounded-md text-sm font-mono hover:bg-terminal-accent/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {'\u21B5'}
        </button>
      </div>
    </div>
  )
}
