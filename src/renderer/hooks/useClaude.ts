import { useCallback } from 'react'
import { useAppStore } from '../store'

declare global {
  interface Window {
    api?: {
      claude: {
        chat: (params: { message: string; history: Array<{ role: string; content: string }>; apiKey?: string; model?: string }) => Promise<{ role: string; content: string }>
        parseIntent: (params: { query: string; apiKey?: string; model?: string }) => Promise<{ route: string; params: Record<string, string> } | null>
      }
      sentisense: {
        call: (method: string, ...args: unknown[]) => Promise<unknown>
        callWithKey: (method: string, apiKey: string, ...args: unknown[]) => Promise<unknown>
      }
      platform: string
    }
  }
}

export function useClaude() {
  const { chatHistory, addChatMessage, settings } = useAppStore()

  const sendMessage = useCallback(async (message: string) => {
    addChatMessage({ role: 'user', content: message })

    if (window.api) {
      const response = await window.api.claude.chat({
        message,
        history: chatHistory.map(m => ({ role: m.role, content: m.content })),
        apiKey: settings.aiApiKey,
        model: settings.aiModel
      })
      addChatMessage({ role: response.role as 'user' | 'assistant', content: response.content })
      return response.content
    }

    // Fallback for browser dev (no Electron)
    const mockResponse = getMockResponse(message)
    addChatMessage({ role: 'assistant', content: mockResponse })
    return mockResponse
  }, [chatHistory, settings, addChatMessage])

  const parseIntent = useCallback(async (query: string) => {
    if (!window.api || !settings.aiApiKey) return null
    return window.api.claude.parseIntent({
      query,
      apiKey: settings.aiApiKey,
      model: settings.aiModel
    })
  }, [settings])

  return { sendMessage, parseIntent, chatHistory }
}

function getMockResponse(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('aapl') || lower.includes('apple')) {
    return '**AAPL** is showing strong bullish sentiment (78/22 bull/bear ratio) with high confidence.\n\nKey drivers:\n- Services revenue growing 24% YoY\n- AI health platform announcement\n- $90B buyback program\n\nTry `AAPL SENT` for detailed sentiment or `AAPL HDS` for institutional holders.'
  }
  if (lower.includes('nvda') || lower.includes('nvidia')) {
    return '**NVDA** has the highest bullish sentiment in the market right now (91/9 ratio).\n\nBlackwell GPU architecture is ramping ahead of schedule. Data center revenue up 93% YoY.\n\nUse `NVDA HDS` to see who\'s accumulating.'
  }
  if (lower.includes('market') || lower.includes('overview')) {
    return 'Markets are trading higher today:\n- **S&P 500**: +0.55% (5,234)\n- **NASDAQ**: +0.59% (16,742)\n- **VIX**: 14.32 (-5.73%)\n\nKey theme: AI infrastructure spending + dovish Fed. Use `FLOWS` to see institutional money movement.'
  }
  return 'I can help you analyze stocks, sentiment, and market flows. Try asking about a specific ticker like "What\'s happening with NVDA?" or use the command bar (Cmd+K) for quick navigation.\n\nPopular commands: `AAPL`, `NVDA SENT`, `FLOWS`, `HF`, `13D`'
}
