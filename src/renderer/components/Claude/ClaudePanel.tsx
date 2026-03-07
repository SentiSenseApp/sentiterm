import React, { useRef, useEffect, useState } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useClaude } from '../../hooks/useClaude'
import { useAppStore } from '../../store'

export function ClaudePanel() {
  const { sendMessage, chatHistory } = useClaude()
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const settings = useAppStore(s => s.settings)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatHistory.length])

  const handleSend = async (message: string) => {
    setSending(true)
    try {
      await sendMessage(message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-terminal-panel">
      {/* Header */}
      <div className="h-10 flex items-center px-4 border-b border-terminal-border shrink-0">
        <span className="text-terminal-accent text-xs font-mono font-semibold">AI ASSISTANT</span>
        {settings.aiKeySource === 'none' && (
          <span className="ml-2 text-terminal-amber text-[10px] font-mono">(NO KEY)</span>
        )}
        {settings.aiKeySource === 'claude-code' && (
          <span className="ml-2 text-terminal-bull text-[10px] font-mono">(CLAUDE CODE)</span>
        )}
        {settings.aiKeySource === 'env' && (
          <span className="ml-2 text-terminal-bull text-[10px] font-mono">(ENV)</span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <img src={new URL('../../assets/logo.png', import.meta.url).href} alt="SentiSense" className="w-10 h-10 rounded-lg mb-3" />
            <p className="text-terminal-muted text-sm mb-4">
              Your AI financial co-pilot
            </p>
            <div className="space-y-2">
              {['What\'s happening with NVDA?', 'Market overview', 'Who is buying AAPL?'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="block w-full text-left px-3 py-2 rounded-md bg-terminal-bg text-terminal-muted text-xs font-mono hover:text-terminal-accent hover:bg-terminal-accent/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
        ))}

        {sending && (
          <div className="flex justify-start mb-3">
            <div className="bg-terminal-surface rounded-lg px-3 py-2 text-sm">
              <span className="text-terminal-accent text-xs font-mono animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  )
}
