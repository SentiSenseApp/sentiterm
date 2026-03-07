import React from 'react'
import { useAppStore } from '../../store'

interface Props {
  onClose: () => void
}

export function AIProviderConfig({ onClose }: Props) {
  const { settings, updateSettings } = useAppStore()

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="terminal-card w-[480px] p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-terminal-text font-semibold text-lg mb-6">Settings</h2>

        {/* SentiSense API Key */}
        <div className="mb-5">
          <label className="data-label block mb-2">SentiSense API Key</label>
          <input
            type="password"
            value={settings.sentiSenseApiKey}
            onChange={e => updateSettings({ sentiSenseApiKey: e.target.value })}
            placeholder="Enter your SentiSense API key"
            className="terminal-input w-full"
          />
          <p className="text-terminal-muted text-xs mt-1">
            Get your key at app.sentisense.ai/settings/developer
          </p>
        </div>

        {/* AI Provider */}
        <div className="mb-5">
          <label className="data-label block mb-2">AI Provider</label>
          <select
            value={settings.aiProvider}
            onChange={e => updateSettings({ aiProvider: e.target.value as 'claude' | 'openai' | 'none' })}
            className="terminal-input w-full"
          >
            <option value="claude">Claude (Anthropic)</option>
            <option value="openai">OpenAI</option>
            <option value="none">None (terminal only)</option>
          </select>
        </div>

        {/* AI API Key */}
        {settings.aiProvider !== 'none' && (
          <div className="mb-5">
            <label className="data-label block mb-2">
              {settings.aiProvider === 'claude' ? 'Anthropic' : 'OpenAI'} API Key
            </label>
            <input
              type="password"
              value={settings.aiApiKey}
              onChange={e => updateSettings({ aiApiKey: e.target.value })}
              placeholder={`Enter your ${settings.aiProvider === 'claude' ? 'Anthropic' : 'OpenAI'} API key`}
              className="terminal-input w-full"
            />
          </div>
        )}

        {/* Model */}
        {settings.aiProvider === 'claude' && (
          <div className="mb-5">
            <label className="data-label block mb-2">Model</label>
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
            className="px-4 py-2 text-sm text-terminal-muted hover:text-terminal-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-terminal-green/10 text-terminal-green rounded-md text-sm font-mono hover:bg-terminal-green/20 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
