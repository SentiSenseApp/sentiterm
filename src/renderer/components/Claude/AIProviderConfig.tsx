import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../store'

interface Props {
  onClose: () => void
}

export function AIProviderConfig({ onClose }: Props) {
  const { settings, updateSettings } = useAppStore()
  const [hasEnvKey, setHasEnvKey] = useState(false)

  useEffect(() => {
    window.api?.claude.hasEnvKey().then(setHasEnvKey)
  }, [])

  const selectEnv = () => updateSettings({ aiKeySource: 'env', aiApiKey: '' })
  const selectManual = () => updateSettings({ aiKeySource: 'manual' })
  const selectNone = () => updateSettings({ aiKeySource: 'none', aiApiKey: '' })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="terminal-card w-[480px] p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-terminal-text font-semibold text-lg mb-6">Settings</h2>

        {/* SentiSense API Key */}
        <div className="mb-6">
          <label className="data-label block mb-2">SentiSense API Key</label>
          <input
            type="password"
            value={settings.sentiSenseApiKey}
            onChange={e => updateSettings({ sentiSenseApiKey: e.target.value })}
            placeholder="ss_live_..."
            className="terminal-input w-full"
          />
          <p className="text-terminal-muted text-xs mt-1">
            Get your key at app.sentisense.ai/settings/developer
          </p>
        </div>

        {/* Claude AI Key Source */}
        <div className="mb-5">
          <label className="data-label block mb-3">Claude AI Assistant</label>
          <div className="space-y-2">
            {/* Option: Use environment variable */}
            {hasEnvKey && (
              <button
                onClick={selectEnv}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  settings.aiKeySource === 'env'
                    ? 'border-terminal-accent bg-terminal-accent/5'
                    : 'border-terminal-border hover:border-terminal-muted'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  settings.aiKeySource === 'env' ? 'border-terminal-accent' : 'border-terminal-muted'
                }`}>
                  {settings.aiKeySource === 'env' && <div className="w-2 h-2 rounded-full bg-terminal-accent" />}
                </div>
                <div>
                  <div className="text-sm text-terminal-text font-medium">Use environment variable</div>
                  <div className="text-xs text-terminal-muted mt-0.5">ANTHROPIC_API_KEY detected. Uses your existing API key.</div>
                </div>
              </button>
            )}

            {/* Option: Enter key manually */}
            <button
              onClick={selectManual}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                settings.aiKeySource === 'manual'
                  ? 'border-terminal-accent bg-terminal-accent/5'
                  : 'border-terminal-border hover:border-terminal-muted'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                settings.aiKeySource === 'manual' ? 'border-terminal-accent' : 'border-terminal-muted'
              }`}>
                {settings.aiKeySource === 'manual' && <div className="w-2 h-2 rounded-full bg-terminal-accent" />}
              </div>
              <div>
                <div className="text-sm text-terminal-text font-medium">Enter API key manually</div>
                <div className="text-xs text-terminal-muted mt-0.5">Paste your Anthropic API key from console.anthropic.com</div>
              </div>
            </button>

            {/* Option: Disable AI */}
            <button
              onClick={selectNone}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                settings.aiKeySource === 'none'
                  ? 'border-terminal-accent bg-terminal-accent/5'
                  : 'border-terminal-border hover:border-terminal-muted'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                settings.aiKeySource === 'none' ? 'border-terminal-accent' : 'border-terminal-muted'
              }`}>
                {settings.aiKeySource === 'none' && <div className="w-2 h-2 rounded-full bg-terminal-accent" />}
              </div>
              <div>
                <div className="text-sm text-terminal-text font-medium">Disable AI assistant</div>
                <div className="text-xs text-terminal-muted mt-0.5">Terminal-only mode. Use Cmd+K for navigation.</div>
              </div>
            </button>
          </div>
        </div>

        {/* Manual key input */}
        {settings.aiKeySource === 'manual' && (
          <div className="mb-5">
            <input
              type="password"
              value={settings.aiApiKey}
              onChange={e => updateSettings({ aiApiKey: e.target.value })}
              placeholder="sk-ant-..."
              className="terminal-input w-full"
            />
          </div>
        )}

        {/* Cost warning */}
        {settings.aiKeySource !== 'none' && (
          <div className="mb-5 p-3 rounded-lg bg-terminal-amber/5 border border-terminal-amber/20">
            <p className="text-terminal-amber text-xs font-mono">
              AI assistant uses Claude API which has per-request costs. Usage is billed to your Anthropic account.
            </p>
          </div>
        )}

        {/* Model */}
        {settings.aiKeySource !== 'none' && (
          <div className="mb-5">
            <label className="data-label block mb-2">Claude Model</label>
            <select
              value={settings.aiModel}
              onChange={e => updateSettings({ aiModel: e.target.value })}
              className="terminal-input w-full"
            >
              <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5</option>
              <option value="claude-opus-4-5-20250929">Claude Opus 4.5</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-terminal-accent/10 text-terminal-accent rounded-md text-sm font-mono hover:bg-terminal-accent/20 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
