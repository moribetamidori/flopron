import { contextBridge, ipcRenderer } from 'electron'

type AppInfo = {
  platform: NodeJS.Platform
  versions: {
    node: string
    chrome: string
    electron: string
  }
}

const api = {
  getAppInfo(): AppInfo {
    return {
      platform: process.platform,
      versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
      }
    }
  },
  async ping(): Promise<string> {
    return ipcRenderer.invoke('ping')
  }
} as const

contextBridge.exposeInMainWorld('electronAPI', api)
