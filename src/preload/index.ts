import { contextBridge, ipcRenderer } from 'electron'

const api = {
  claude: {
    chat: (params: { message: string; history: Array<{ role: string; content: string }>; apiKey?: string; model?: string }) =>
      ipcRenderer.invoke('claude:chat', params),
    parseIntent: (params: { query: string; apiKey?: string; model?: string }) =>
      ipcRenderer.invoke('claude:parseIntent', params)
  },
  sentisense: {
    call: (method: string, ...args: unknown[]) =>
      ipcRenderer.invoke('sentisense:call', { method, args }),
    callWithKey: (method: string, apiKey: string, ...args: unknown[]) =>
      ipcRenderer.invoke('sentisense:call', { method, args, apiKey })
  },
  platform: process.platform
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
