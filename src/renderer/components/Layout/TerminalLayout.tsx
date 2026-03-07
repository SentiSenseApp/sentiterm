import React, { useState, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { ClaudePanel } from '../Claude/ClaudePanel'

interface Props {
  children: React.ReactNode
}

export function TerminalLayout({ children }: Props) {
  const [claudeWidth, setClaudeWidth] = useState(320)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)

    const handleMouseMove = (e: MouseEvent) => {
      // 12px sidebar + claude panel
      const newWidth = Math.min(Math.max(e.clientX - 48, 240), 600)
      setClaudeWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div className="h-screen flex flex-col">
      {/* Title bar drag region */}
      <div className="h-10 bg-terminal-panel border-b border-terminal-border flex items-center justify-between px-4 shrink-0"
           style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="w-20" /> {/* Space for traffic lights on macOS */}
        <div className="flex items-center gap-2 text-sm text-terminal-muted" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <span className="font-mono text-terminal-accent font-semibold">SentiSense Terminal</span>
          <button
            onClick={() => {
              const { setCommandBarOpen } = (window as any).__appStore?.getState?.() || {}
              setCommandBarOpen?.(true)
            }}
            className="ml-4 px-3 py-1 rounded-md bg-terminal-bg border border-terminal-border text-xs text-terminal-muted hover:text-terminal-text transition-colors font-mono"
          >
            {'\u2318'}K Search
          </button>
        </div>
        <div className="w-20" />
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Claude panel */}
        <div style={{ width: claudeWidth }} className="shrink-0 border-r border-terminal-border">
          <ClaudePanel />
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1 cursor-col-resize hover:bg-terminal-accent/30 transition-colors shrink-0 ${isDragging ? 'bg-terminal-accent/30' : ''}`}
        />

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>

      <StatusBar />
    </div>
  )
}
