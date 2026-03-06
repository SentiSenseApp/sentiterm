import type { IpcMain } from 'electron'

const SYSTEM_PROMPT = `You are the AI director of SentiTerm, an open-source financial intelligence terminal powered by SentiSense.

You help users:
- Analyze stocks, sentiment, and market trends
- Navigate the terminal (suggest commands like "AAPL HDS" or "NVDA SENT")
- Understand institutional flows and who's buying/selling
- Interpret AI-clustered news stories and their market impact
- Make sense of financial data

You have access to SentiSense data. When users ask about a stock, sentiment, or flows, suggest terminal commands they can use.

Always include disclaimers when discussing specific investments. You provide analysis, not financial advice.

Be concise and data-driven. Format responses for readability with bullets and key metrics highlighted.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function setupClaudeIPC(ipcMain: IpcMain): void {
  ipcMain.handle('claude:chat', async (_event, { message, history, apiKey, model }: {
    message: string
    history: ChatMessage[]
    apiKey?: string
    model?: string
  }) => {
    if (!apiKey) {
      return {
        role: 'assistant',
        content: 'No AI API key configured. Go to Settings to add your Claude or OpenAI API key.\n\nThe terminal works without AI — use Cmd+K to navigate with commands like "AAPL", "NVDA SENT", or "market flows".'
      }
    }

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey })

      const response = await client.messages.create({
        model: model || 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user', content: message }
        ]
      })

      const textBlock = response.content.find(b => b.type === 'text')
      return {
        role: 'assistant',
        content: textBlock?.text || 'No response generated.'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return {
        role: 'assistant',
        content: `Error calling AI: ${errorMessage}`
      }
    }
  })

  ipcMain.handle('claude:parseIntent', async (_event, { query, apiKey, model }: {
    query: string
    apiKey?: string
    model?: string
  }) => {
    if (!apiKey) return null

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey })

      const response = await client.messages.create({
        model: model || 'claude-sonnet-4-5-20250929',
        max_tokens: 256,
        system: 'Parse the user query into a terminal command. Respond with JSON only: {"route": "/path", "params": {}}. Valid routes: / (dashboard), /stocks/:ticker, /stocks/:ticker/sentiment, /stocks/:ticker/holders, /stocks/:ticker/news, /stories, /flows/market, /flows/index-funds, /flows/hedge-funds, /flows/activist. If you cannot parse, respond with null.',
        messages: [{ role: 'user', content: query }]
      })

      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock?.text) return null
      return JSON.parse(textBlock.text)
    } catch {
      return null
    }
  })
}
