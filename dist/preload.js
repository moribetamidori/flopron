"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
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
        return electron_1.ipcRenderer.invoke('ping');
    }
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', api);
