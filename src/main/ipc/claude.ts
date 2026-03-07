import type { IpcMain } from 'electron'
import { execSync } from 'child_process'

const SYSTEM_PROMPT = `You are the AI assistant of SentiSense Terminal, an open-source financial intelligence terminal powered by SentiSense.

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

function detectClaudeCode(): boolean {
  try {
    execSync('claude --version', { stdio: 'pipe', timeout: 3000 })
    return true
  } catch {
    return false
  }
}

let claudeCodeAvailable: boolean | null = null

function getCleanEnv(): Record<string, string | undefined> {
  const env = { ...process.env }
  // Remove Claude Code session markers so the Agent SDK can spawn a fresh instance
  delete env.CLAUDECODE
  delete env.CLAUDE_CODE_ENTRYPOINT
  return env
}

async function chatViaAgentSDK(message: string, history: ChatMessage[]): Promise<string> {
  const { query } = await import('@anthropic-ai/claude-agent-sdk')

  const fullPrompt = history.length > 0
    ? [...history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`), `User: ${message}`].join('\n\n')
    : message

  const conversation = query({
    prompt: fullPrompt,
    options: {
      systemPrompt: SYSTEM_PROMPT,
      maxTurns: 1,
      env: getCleanEnv(),
    }
  })

  let result = ''
  for await (const msg of conversation) {
    if (msg.type === 'assistant' && msg.message?.content) {
      for (const block of msg.message.content) {
        if (block.type === 'text') result += block.text
      }
    }
  }

  return result || 'No response generated.'
}

async function chatViaAPIKey(message: string, history: ChatMessage[], apiKey: string, model: string): Promise<string> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message }
    ]
  })

  const textBlock = response.content.find(b => b.type === 'text')
  return textBlock?.text || 'No response generated.'
}

export function setupClaudeIPC(ipcMain: IpcMain): void {
  ipcMain.handle('claude:hasEnvKey', () => {
    return !!process.env.ANTHROPIC_API_KEY
  })

  ipcMain.handle('claude:hasClaudeCode', () => {
    if (claudeCodeAvailable === null) {
      claudeCodeAvailable = detectClaudeCode()
    }
    return claudeCodeAvailable
  })

  ipcMain.handle('claude:chat', async (_event, { message, history, apiKey, keySource, model }: {
    message: string
    history: ChatMessage[]
    apiKey?: string
    keySource?: 'manual' | 'env' | 'claude-code' | 'none'
    model?: string
  }) => {
    try {
      if (keySource === 'claude-code') {
        const content = await chatViaAgentSDK(message, history)
        return { role: 'assistant', content }
      }

      const resolvedKey = keySource === 'env' ? process.env.ANTHROPIC_API_KEY : apiKey
      if (!resolvedKey) {
        return {
          role: 'assistant',
          content: 'No Claude API key configured. Go to Settings to choose how to connect to Claude.\n\nThe terminal works without AI — use Cmd+K to navigate with commands like "AAPL", "NVDA SENT", or "market flows".'
        }
      }

      const content = await chatViaAPIKey(message, history, resolvedKey, model || 'claude-sonnet-4-5-20250929')
      return { role: 'assistant', content }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return { role: 'assistant', content: `Error calling AI: ${errorMessage}` }
    }
  })

  ipcMain.handle('claude:parseIntent', async (_event, { query: userQuery, apiKey, keySource, model }: {
    query: string
    apiKey?: string
    keySource?: 'manual' | 'env' | 'claude-code' | 'none'
    model?: string
  }) => {
    if (keySource === 'none') return null

    const parsePrompt = `Parse the user query into a terminal command. Respond with JSON only: {"route": "/path", "params": {}}. Valid routes: / (dashboard), /stocks/:ticker, /stocks/:ticker/sentiment, /stocks/:ticker/holders, /stocks/:ticker/news, /stories, /flows/market, /flows/index-funds, /flows/hedge-funds, /flows/activist. If you cannot parse, respond with null.\n\nQuery: ${userQuery}`

    try {
      if (keySource === 'claude-code') {
        const { query } = await import('@anthropic-ai/claude-agent-sdk')
        const conversation = query({ prompt: parsePrompt, options: { maxTurns: 1, env: getCleanEnv() } })
        let result = ''
        for await (const msg of conversation) {
          if (msg.type === 'assistant' && msg.message?.content) {
            for (const block of msg.message.content) {
              if (block.type === 'text') result += block.text
            }
          }
        }
        if (!result) return null
        return JSON.parse(result)
      }

      const resolvedKey = keySource === 'env' ? process.env.ANTHROPIC_API_KEY : apiKey
      if (!resolvedKey) return null

      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey: resolvedKey })
      const response = await client.messages.create({
        model: model || 'claude-sonnet-4-5-20250929',
        max_tokens: 256,
        system: parsePrompt,
        messages: [{ role: 'user', content: userQuery }]
      })
      const textBlock = response.content.find(b => b.type === 'text')
      if (!textBlock?.text) return null
      return JSON.parse(textBlock.text)
    } catch {
      return null
    }
  })
}
