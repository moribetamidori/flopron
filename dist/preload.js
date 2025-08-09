import { contextBridge, ipcRenderer } from 'electron';
const api = {
    getAppInfo() {
        return {
            platform: process.platform,
            versions: {
                node: process.versions.node,
                chrome: process.versions.chrome,
                electron: process.versions.electron
            }
        };
    },
    async ping() {
        return ipcRenderer.invoke('ping');
    }
};
contextBridge.exposeInMainWorld('electronAPI', api);
