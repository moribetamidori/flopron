import { contextBridge, ipcRenderer } from "electron";
const api = {
    getAppInfo() {
        return {
            platform: process.platform,
            versions: {
                node: process.versions.node,
                chrome: process.versions.chrome,
                electron: process.versions.electron,
            },
        };
    },
    async ping() {
        return ipcRenderer.invoke("ping");
    },
    database: {
        // Data Log operations
        async createDataLog(input) {
            return ipcRenderer.invoke("database:createDataLog", input);
        },
        async getDataLogById(id) {
            return ipcRenderer.invoke("database:getDataLogById", id);
        },
        async getAllDataLogs() {
            return ipcRenderer.invoke("database:getAllDataLogs");
        },
        async updateDataLog(id, updates) {
            return ipcRenderer.invoke("database:updateDataLog", id, updates);
        },
        async deleteDataLog(id) {
            return ipcRenderer.invoke("database:deleteDataLog", id);
        },
        // Memory Node operations
        async createMemoryNode(input) {
            return ipcRenderer.invoke("database:createMemoryNode", input);
        },
        async getMemoryNodeById(id) {
            return ipcRenderer.invoke("database:getMemoryNodeById", id);
        },
        async getAllMemoryNodes() {
            return ipcRenderer.invoke("database:getAllMemoryNodes");
        },
        async updateMemoryNode(id, updates) {
            return ipcRenderer.invoke("database:updateMemoryNode", id, updates);
        },
        async deleteMemoryNode(id) {
            return ipcRenderer.invoke("database:deleteMemoryNode", id);
        },
        // Connection operations
        async createConnection(fromNodeId, toNodeId, sharedTags, glitchOffset) {
            return ipcRenderer.invoke("database:createConnection", fromNodeId, toNodeId, sharedTags, glitchOffset);
        },
        async getAllConnections() {
            return ipcRenderer.invoke("database:getAllConnections");
        },
        async deleteConnection(id) {
            return ipcRenderer.invoke("database:deleteConnection", id);
        },
        // Search and utility operations
        async searchDataLogs(query) {
            return ipcRenderer.invoke("database:searchDataLogs", query);
        },
        async getAllTags() {
            return ipcRenderer.invoke("database:getAllTags");
        },
        // Migration operations
        async runMigration() {
            return ipcRenderer.invoke("database:runMigration");
        },
    },
    files: {
        async saveImage(imageData, filename) {
            return ipcRenderer.invoke("file:saveImage", Buffer.from(imageData), filename);
        },
        async getImagePath(relativePath) {
            return ipcRenderer.invoke("file:getImagePath", relativePath);
        },
    },
};
contextBridge.exposeInMainWorld("electronAPI", api);
// Helpful debug to verify preload executed and API is exposed
try {
    // eslint-disable-next-line no-console
    console.log("[preload] exposed electronAPI with keys:", Object.keys(api));
}
catch { }
