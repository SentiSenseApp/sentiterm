import React, { useState } from 'react'
import { useAppStore } from '../../store'
import { validateApiKey, clearCache } from '../../lib/api'

interface Props { children: React.ReactNode }

export function ApiKeyGate({ children }: Props) {
  const { settings, updateSettings } = useAppStore()
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [validating, setValidating] = useState(false)

  if (settings.sentiSenseApiKey) return <>{children}</>

  async function handleConnect() {
    if (!key.trim()) { setError('Please enter an API key'); return }
    setError('')
    setValidating(true)
    try {
      const valid = await validateApiKey(key.trim())
      if (valid) {
        clearCache()
        updateSettings({ sentiSenseApiKey: key.trim() })
      } else {
        setError('Invalid API key. Check your key and try again.')
      }
    } catch {
      setError('Could not connect to SentiSense. Check your network.')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-full bg-terminal-bg">
      <div className="w-full max-w-md space-y-6 px-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-terminal-green font-mono">SentiTerm</h1>
          <p className="text-terminal-muted text-sm">Connect your SentiSense API key to get started.</p>
        </div>

        <div className="terminal-card p-6 space-y-4">
          <div>
            <label className="data-label mb-1.5 block">API Key</label>
            <input
              type="password"
              value={key}
              onChange={e => { setKey(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
              placeholder="ss_live_..."
              className="terminal-input w-full"
              autoFocus
            />
          </div>

          {error && <p className="text-terminal-red text-xs font-mono">{error}</p>}

          <button
            onClick={handleConnect}
            disabled={validating}
            className="w-full py-2 px-4 bg-terminal-green/20 text-terminal-green font-mono text-sm font-semibold rounded border border-terminal-green/30 hover:bg-terminal-green/30 transition-colors disabled:opacity-50"
          >
            {validating ? 'Connecting...' : 'Connect'}
          </button>

          <p className="text-terminal-muted/60 text-[10px] font-mono text-center">
            Get your API key at{' '}
            <span className="text-terminal-green/80">app.sentisense.ai/settings/developer</span>
          </p>
        </div>
      </div>
    </div>
  )
}
