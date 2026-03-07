import type { IpcMain } from 'electron'
import Store from 'electron-store'

interface PersistedState {
  settings: {
    sentiSenseApiKey: string
    aiApiKey: string
    aiKeySource: 'manual' | 'env' | 'none'
    aiModel: string
    showSetupWizard: boolean
  }
  watchlist: string[]
}

const store = new Store<PersistedState>({
  name: 'sentiterm',
  defaults: {
    settings: {
      sentiSenseApiKey: '',
      aiApiKey: '',
      aiKeySource: 'none',
      aiModel: 'claude-sonnet-4-5-20250929',
      showSetupWizard: true,
    },
    watchlist: ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOG', 'META'],
  },
  encryptionKey: 'sentiterm-v1',
})

export function setupStoreIPC(ipcMain: IpcMain): void {
  ipcMain.handle('store:get', (_event, key: string) => {
    return store.get(key)
  })

  ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
    store.set(key, value)
  })

  ipcMain.handle('store:getAll', () => {
    return store.store
  })
}
