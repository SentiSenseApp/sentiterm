import { contextBridge, ipcRenderer } from 'electron'

const api = {
  claude: {
    chat: (params: { message: string; history: Array<{ role: string; content: string }>; apiKey?: string; model?: string }) =>
      ipcRenderer.invoke('claude:chat', params),
    parseIntent: (params: { query: string; apiKey?: string; model?: string }) =>
      ipcRenderer.invoke('claude:parseIntent', params),
    hasEnvKey: () => ipcRenderer.invoke('claude:hasEnvKey') as Promise<boolean>,
    hasClaudeCode: () => ipcRenderer.invoke('claude:hasClaudeCode') as Promise<boolean>
  },
  sentisense: {
    call: (method: string, ...args: unknown[]) =>
      ipcRenderer.invoke('sentisense:call', { method, args }),
    callWithKey: (method: string, apiKey: string, ...args: unknown[]) =>
      ipcRenderer.invoke('sentisense:call', { method, args, apiKey })
  },
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
    getAll: () => ipcRenderer.invoke('store:getAll')
  },
  titles: {
    resolve: (url: string) => ipcRenderer.invoke('titles:resolve', url) as Promise<string>,
    resolveBatch: (urls: string[]) => ipcRenderer.invoke('titles:resolveBatch', urls) as Promise<Record<string, string>>,
    oembed: (url: string) => ipcRenderer.invoke('titles:oembed', url) as Promise<string | null>,
    proxyImage: (url: string) => ipcRenderer.invoke('titles:proxyImage', url) as Promise<string | null>,
  },
  platform: process.platform
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
