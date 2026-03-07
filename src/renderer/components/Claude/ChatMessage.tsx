import React from 'react'

interface Props {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function ChatMessage({ role, content, timestamp }: Props) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
        isUser
          ? 'bg-terminal-accent/10 text-terminal-accent'
          : 'bg-terminal-surface text-terminal-text'
      }`}>
        {!isUser && (
          <div className="text-terminal-accent text-xs font-mono mb-1 opacity-60">AI</div>
        )}
        <div className="whitespace-pre-wrap font-sans leading-relaxed">
          {content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="text-terminal-text font-semibold">{part.slice(2, -2)}</strong>
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={i} className="bg-terminal-bg px-1 py-0.5 rounded text-terminal-amber font-mono text-xs">{part.slice(1, -1)}</code>
            }
            return part
          })}
        </div>
        <div className="text-[10px] text-terminal-muted/40 mt-1 font-mono">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
