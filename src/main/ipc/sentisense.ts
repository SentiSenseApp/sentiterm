import type { IpcMain } from 'electron'
import { SentiSense } from 'sentisense'

let client: SentiSense | null = null

function getClient(apiKey?: string): SentiSense {
  if (!client || apiKey) {
    client = new SentiSense({ apiKey })
  }
  return client
}

export function setupSentiSenseIPC(ipcMain: IpcMain): void {
  ipcMain.handle('sentisense:call', async (_event, { method, args, apiKey }: {
    method: string
    args: unknown[]
    apiKey?: string
  }) => {
    const c = getClient(apiKey)

    // Navigate the namespaced methods: "stocks.getPrice", "documents.getStories", etc.
    const [namespace, fn] = method.split('.')
    const ns = c[namespace as keyof SentiSense]
    if (!ns || typeof ns !== 'object') {
      throw new Error(`Unknown namespace: ${namespace}`)
    }

    const handler = (ns as unknown as Record<string, Function>)[fn]
    if (typeof handler !== 'function') {
      throw new Error(`Unknown method: ${method}`)
    }

    return handler.apply(ns, args)
  })

  ipcMain.handle('sentisense:resetClient', async () => {
    client = null
  })
}
