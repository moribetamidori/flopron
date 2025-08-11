import { contextBridge, ipcRenderer } from "electron";
import {
  CreateDataLogInput,
  UpdateDataLogInput,
  CreateMemoryNodeInput,
  UpdateMemoryNodeInput,
  DataLogWithRelations,
  MemoryNodeWithRelations,
  ConnectionWithSharedTags,
  DatabaseNeuronCluster,
  CreateNeuronClusterInput,
  UpdateNeuronClusterInput,
} from "./database/types.js";

type AppInfo = {
  platform: NodeJS.Platform;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
};

const api = {
  getAppInfo(): AppInfo {
    return {
      platform: process.platform,
      versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron,
      },
    };
  },
  async ping(): Promise<string> {
    return ipcRenderer.invoke("ping");
  },
  database: {
    // Neuron Cluster operations
    async createNeuronCluster(
      input: CreateNeuronClusterInput
    ): Promise<DatabaseNeuronCluster> {
      return ipcRenderer.invoke("database:createNeuronCluster", input);
    },
    async getNeuronClusterById(
      id: string
    ): Promise<DatabaseNeuronCluster | null> {
      return ipcRenderer.invoke("database:getNeuronClusterById", id);
    },
    async getAllNeuronClusters(): Promise<DatabaseNeuronCluster[]> {
      return ipcRenderer.invoke("database:getAllNeuronClusters");
    },
    async updateNeuronCluster(
      id: string,
      updates: UpdateNeuronClusterInput
    ): Promise<DatabaseNeuronCluster | null> {
      return ipcRenderer.invoke("database:updateNeuronCluster", id, updates);
    },
    async deleteNeuronCluster(id: string): Promise<boolean> {
      return ipcRenderer.invoke("database:deleteNeuronCluster", id);
    },

    // Data Log operations
    async createDataLog(
      input: CreateDataLogInput
    ): Promise<DataLogWithRelations> {
      return ipcRenderer.invoke("database:createDataLog", input);
    },
    async getDataLogById(id: string): Promise<DataLogWithRelations | null> {
      return ipcRenderer.invoke("database:getDataLogById", id);
    },
    async getAllDataLogs(): Promise<DataLogWithRelations[]> {
      return ipcRenderer.invoke("database:getAllDataLogs");
    },
    async getDataLogsByCluster(
      clusterId: string
    ): Promise<DataLogWithRelations[]> {
      return ipcRenderer.invoke("database:getDataLogsByCluster", clusterId);
    },
    async updateDataLog(
      id: string,
      updates: UpdateDataLogInput
    ): Promise<DataLogWithRelations | null> {
      return ipcRenderer.invoke("database:updateDataLog", id, updates);
    },
    async deleteDataLog(id: string): Promise<boolean> {
      return ipcRenderer.invoke("database:deleteDataLog", id);
    },

    // Memory Node operations
    async createMemoryNode(
      input: CreateMemoryNodeInput
    ): Promise<MemoryNodeWithRelations> {
      return ipcRenderer.invoke("database:createMemoryNode", input);
    },
    async getMemoryNodeById(
      id: string
    ): Promise<MemoryNodeWithRelations | null> {
      return ipcRenderer.invoke("database:getMemoryNodeById", id);
    },
    async getMemoryNodesByDataLogId(
      dataLogId: string
    ): Promise<MemoryNodeWithRelations[]> {
      return ipcRenderer.invoke(
        "database:getMemoryNodesByDataLogId",
        dataLogId
      );
    },
    async getAllMemoryNodes(): Promise<MemoryNodeWithRelations[]> {
      return ipcRenderer.invoke("database:getAllMemoryNodes");
    },
    async updateMemoryNode(
      id: string,
      updates: UpdateMemoryNodeInput
    ): Promise<MemoryNodeWithRelations | null> {
      return ipcRenderer.invoke("database:updateMemoryNode", id, updates);
    },
    async deleteMemoryNode(id: string): Promise<boolean> {
      return ipcRenderer.invoke("database:deleteMemoryNode", id);
    },

    // Connection operations
    async createConnection(
      fromNodeId: string,
      toNodeId: string,
      sharedTags: string[],
      glitchOffset?: number
    ): Promise<ConnectionWithSharedTags> {
      return ipcRenderer.invoke(
        "database:createConnection",
        fromNodeId,
        toNodeId,
        sharedTags,
        glitchOffset
      );
    },
    async getAllConnections(): Promise<ConnectionWithSharedTags[]> {
      return ipcRenderer.invoke("database:getAllConnections");
    },
    async deleteConnection(id: number): Promise<boolean> {
      return ipcRenderer.invoke("database:deleteConnection", id);
    },
    async regenerateConnectionsForNode(nodeId: string): Promise<void> {
      return ipcRenderer.invoke(
        "database:regenerateConnectionsForNode",
        nodeId
      );
    },

    // Search and utility operations
    async searchDataLogs(query: string): Promise<DataLogWithRelations[]> {
      return ipcRenderer.invoke("database:searchDataLogs", query);
    },
    async getAllTags(): Promise<string[]> {
      return ipcRenderer.invoke("database:getAllTags");
    },

    // Migration operations
    async runMigration(): Promise<void> {
      return ipcRenderer.invoke("database:runMigration");
    },
  },
  files: {
    async saveImage(imageData: ArrayBuffer, filename: string): Promise<string> {
      return ipcRenderer.invoke(
        "file:saveImage",
        Buffer.from(imageData),
        filename
      );
    },
    async getImagePath(relativePath: string): Promise<string | null> {
      return ipcRenderer.invoke("file:getImagePath", relativePath);
    },
  },
  settings: {
    async get(key: string): Promise<unknown> {
      return ipcRenderer.invoke("settings:get", key);
    },
    async set(key: string, value: unknown): Promise<boolean> {
      return ipcRenderer.invoke("settings:set", key, value);
    },
  },
} as const;

contextBridge.exposeInMainWorld("electronAPI", api);
// Helpful debug to verify preload executed and API is exposed
try {
  // eslint-disable-next-line no-console
  console.log("[preload] exposed electronAPI with keys:", Object.keys(api));
} catch {}
