// Since we're in an Electron app, we'll communicate with the main process
// for database operations via IPC (Inter-Process Communication)
export class DatabaseService {
    constructor() { }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    // Data Log operations
    async createDataLog(input) {
        return window.electronAPI.database.createDataLog(input);
    }
    async getDataLogById(id) {
        return window.electronAPI.database.getDataLogById(id);
    }
    async getAllDataLogs() {
        return window.electronAPI.database.getAllDataLogs();
    }
    async updateDataLog(id, updates) {
        return window.electronAPI.database.updateDataLog(id, updates);
    }
    async deleteDataLog(id) {
        return window.electronAPI.database.deleteDataLog(id);
    }
    // Memory Node operations
    async createMemoryNode(input) {
        return window.electronAPI.database.createMemoryNode(input);
    }
    async getMemoryNodeById(id) {
        return window.electronAPI.database.getMemoryNodeById(id);
    }
    async getAllMemoryNodes() {
        return window.electronAPI.database.getAllMemoryNodes();
    }
    async updateMemoryNode(id, updates) {
        return window.electronAPI.database.updateMemoryNode(id, updates);
    }
    async deleteMemoryNode(id) {
        return window.electronAPI.database.deleteMemoryNode(id);
    }
    // Connection operations
    async createConnection(fromNodeId, toNodeId, sharedTags, glitchOffset) {
        return window.electronAPI.database.createConnection(fromNodeId, toNodeId, sharedTags, glitchOffset);
    }
    async getAllConnections() {
        return window.electronAPI.database.getAllConnections();
    }
    async deleteConnection(id) {
        return window.electronAPI.database.deleteConnection(id);
    }
    // Search and utility operations
    async searchDataLogs(query) {
        return window.electronAPI.database.searchDataLogs(query);
    }
    async getAllTags() {
        return window.electronAPI.database.getAllTags();
    }
    // Migration helper - convert from old DataLog format to new format
    convertDataLogToDatabase(dataLog) {
        // Generate title from content if not present
        let title;
        if ("title" in dataLog &&
            typeof dataLog.title === "string" &&
            dataLog.title) {
            title = dataLog.title;
        }
        else {
            // Use ID as title, removing special chars and capitalizing
            title = dataLog.id
                .replace(/[[\]()-]/g, " ")
                .replace(/-/g, " ")
                .split(" ")
                .filter((word) => word.length > 0)
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
        }
        return {
            id: dataLog.id,
            title,
            timestamp: dataLog.timestamp,
            content: dataLog.content,
            tags: dataLog.tags,
            images: dataLog.images,
            links: dataLog.links,
        };
    }
    // Utility to generate memory node from data log
    createMemoryNodeFromDataLog(dataLog, position) {
        return {
            id: dataLog.id,
            data_log_id: dataLog.id,
            x: position?.x || (Math.random() - 0.5) * 800,
            y: position?.y || (Math.random() - 0.5) * 800,
            z: position?.z || (Math.random() - 0.5) * 400,
            glitch_intensity: Math.random(),
            pulse_phase: Math.random() * Math.PI * 2,
        };
    }
}
