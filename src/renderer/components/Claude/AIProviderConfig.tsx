import React, { useEffect, useState } from 'react'
import { useAppStore } from '../../store'

interface Props {
  onClose: () => void
}

export function AIProviderConfig({ onClose }: Props) {
  const { settings, updateSettings } = useAppStore()
  const [hasEnvKey, setHasEnvKey] = useState(false)
  const [hasClaudeCode, setHasClaudeCode] = useState(false)
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    Promise.all([
      window.api?.claude.hasEnvKey() ?? Promise.resolve(false),
      window.api?.claude.hasClaudeCode() ?? Promise.resolve(false),
    ]).then(([env, cc]) => {
      setHasEnvKey(env)
      setHasClaudeCode(cc)
      setDetected(true)
      // Auto-select Claude Code if available and user hasn't chosen yet
      if (cc && settings.aiKeySource === 'none') {
        updateSettings({ aiKeySource: 'claude-code' })
      }
    })
  }, [])

  const selectClaudeCode = () => updateSettings({ aiKeySource: 'claude-code', aiApiKey: '' })
  const selectEnv = () => updateSettings({ aiKeySource: 'env', aiApiKey: '' })
  const selectManual = () => updateSettings({ aiKeySource: 'manual' })
  const selectNone = () => updateSettings({ aiKeySource: 'none', aiApiKey: '' })

  function RadioOption({ selected, onClick, title, subtitle, badge }: {
    selected: boolean; onClick: () => void; title: string; subtitle: string; badge?: React.ReactNode
  }) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
          selected ? 'border-terminal-accent bg-terminal-accent/5' : 'border-terminal-border hover:border-terminal-muted'
        }`}
      >
        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          selected ? 'border-terminal-accent' : 'border-terminal-muted'
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-terminal-accent" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-terminal-text font-medium">{title}</span>
            {badge}
          </div>
          <div className="text-xs text-terminal-muted mt-0.5">{subtitle}</div>
        </div>
      </button>
    )
  }

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
            {/* Option: Claude Code (local) */}
            {hasClaudeCode && (
              <RadioOption
                selected={settings.aiKeySource === 'claude-code'}
                onClick={selectClaudeCode}
                title="Use Claude Code"
                subtitle="Uses your local Claude Code installation. No additional API key needed."
                badge={<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-terminal-bull/15 text-terminal-bull">DETECTED</span>}
              />
            )}

            {/* Option: Use environment variable */}
            {hasEnvKey && (
              <RadioOption
                selected={settings.aiKeySource === 'env'}
                onClick={selectEnv}
                title="Use environment variable"
                subtitle="ANTHROPIC_API_KEY detected. Billed to your Anthropic account."
              />
            )}

            {/* Option: Enter key manually */}
            <RadioOption
              selected={settings.aiKeySource === 'manual'}
              onClick={selectManual}
              title="Enter API key manually"
              subtitle="Paste your Anthropic API key from console.anthropic.com"
            />

            {/* Option: Disable AI */}
            <RadioOption
              selected={settings.aiKeySource === 'none'}
              onClick={selectNone}
              title="Disable AI assistant"
              subtitle="Terminal-only mode. Use Cmd+K for navigation."
            />
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

        {/* Cost warning for API key modes */}
        {(settings.aiKeySource === 'env' || settings.aiKeySource === 'manual') && (
          <div className="mb-5 p-3 rounded-lg bg-terminal-amber/5 border border-terminal-amber/20">
            <p className="text-terminal-amber text-xs font-mono">
              AI assistant uses Claude API which has per-request costs. Usage is billed to your Anthropic account.
            </p>
          </div>
        )}

        {/* Model selector — only for API key modes */}
        {(settings.aiKeySource === 'env' || settings.aiKeySource === 'manual') && (
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
