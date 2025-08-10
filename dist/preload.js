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
        // Neuron Cluster operations
        async createNeuronCluster(input) {
            return ipcRenderer.invoke("database:createNeuronCluster", input);
        },
        async getNeuronClusterById(id) {
            return ipcRenderer.invoke("database:getNeuronClusterById", id);
        },
        async getAllNeuronClusters() {
            return ipcRenderer.invoke("database:getAllNeuronClusters");
        },
        async updateNeuronCluster(id, updates) {
            return ipcRenderer.invoke("database:updateNeuronCluster", id, updates);
        },
        async deleteNeuronCluster(id) {
            return ipcRenderer.invoke("database:deleteNeuronCluster", id);
        },
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
        async getDataLogsByCluster(clusterId) {
            return ipcRenderer.invoke("database:getDataLogsByCluster", clusterId);
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
        async getMemoryNodesByDataLogId(dataLogId) {
            return ipcRenderer.invoke("database:getMemoryNodesByDataLogId", dataLogId);
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
        async regenerateConnectionsForNode(nodeId) {
            return ipcRenderer.invoke("database:regenerateConnectionsForNode", nodeId);
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
