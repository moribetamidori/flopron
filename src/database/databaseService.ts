// Database service for renderer process
// This provides the interface between React components and the database
import { DataLog } from "../data.js";
import {
  DataLogWithRelations,
  MemoryNodeWithRelations,
  ConnectionWithSharedTags,
  CreateDataLogInput,
  UpdateDataLogInput,
  CreateMemoryNodeInput,
  UpdateMemoryNodeInput,
  DatabaseNeuronCluster,
  CreateNeuronClusterInput,
  UpdateNeuronClusterInput,
} from "./types.js";

// Since we're in an Electron app, we'll communicate with the main process
// for database operations via IPC (Inter-Process Communication)

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Neuron Cluster operations
  async createNeuronCluster(
    input: CreateNeuronClusterInput
  ): Promise<DatabaseNeuronCluster> {
    return window.electronAPI.database.createNeuronCluster(input);
  }

  async getNeuronClusterById(
    id: string
  ): Promise<DatabaseNeuronCluster | null> {
    return window.electronAPI.database.getNeuronClusterById(id);
  }

  async getAllNeuronClusters(): Promise<DatabaseNeuronCluster[]> {
    return window.electronAPI.database.getAllNeuronClusters();
  }

  async updateNeuronCluster(
    id: string,
    updates: UpdateNeuronClusterInput
  ): Promise<DatabaseNeuronCluster | null> {
    return window.electronAPI.database.updateNeuronCluster(id, updates);
  }

  async deleteNeuronCluster(id: string): Promise<boolean> {
    return window.electronAPI.database.deleteNeuronCluster(id);
  }

  // Data Log operations
  async createDataLog(
    input: CreateDataLogInput
  ): Promise<DataLogWithRelations> {
    return window.electronAPI.database.createDataLog(input);
  }

  async getDataLogById(id: string): Promise<DataLogWithRelations | null> {
    return window.electronAPI.database.getDataLogById(id);
  }

  async getAllDataLogs(): Promise<DataLogWithRelations[]> {
    return window.electronAPI.database.getAllDataLogs();
  }

  async getDataLogsByCluster(
    clusterId: string
  ): Promise<DataLogWithRelations[]> {
    return window.electronAPI.database.getDataLogsByCluster(clusterId);
  }

  async updateDataLog(
    id: string,
    updates: UpdateDataLogInput
  ): Promise<DataLogWithRelations | null> {
    return window.electronAPI.database.updateDataLog(id, updates);
  }

  async deleteDataLog(id: string): Promise<boolean> {
    return window.electronAPI.database.deleteDataLog(id);
  }

  // Memory Node operations
  async createMemoryNode(
    input: CreateMemoryNodeInput
  ): Promise<MemoryNodeWithRelations> {
    return window.electronAPI.database.createMemoryNode(input);
  }

  async getMemoryNodeById(id: string): Promise<MemoryNodeWithRelations | null> {
    return window.electronAPI.database.getMemoryNodeById(id);
  }

  async getMemoryNodesByDataLogId(
    dataLogId: string
  ): Promise<MemoryNodeWithRelations[]> {
    return window.electronAPI.database.getMemoryNodesByDataLogId(dataLogId);
  }

  async getAllMemoryNodes(): Promise<MemoryNodeWithRelations[]> {
    return window.electronAPI.database.getAllMemoryNodes();
  }

  async updateMemoryNode(
    id: string,
    updates: UpdateMemoryNodeInput
  ): Promise<MemoryNodeWithRelations | null> {
    return window.electronAPI.database.updateMemoryNode(id, updates);
  }

  async deleteMemoryNode(id: string): Promise<boolean> {
    return window.electronAPI.database.deleteMemoryNode(id);
  }

  // Connection operations
  async createConnection(
    fromNodeId: string,
    toNodeId: string,
    sharedTags: string[],
    glitchOffset?: number
  ): Promise<ConnectionWithSharedTags> {
    return window.electronAPI.database.createConnection(
      fromNodeId,
      toNodeId,
      sharedTags,
      glitchOffset
    );
  }

  async getAllConnections(): Promise<ConnectionWithSharedTags[]> {
    return window.electronAPI.database.getAllConnections();
  }

  async deleteConnection(id: number): Promise<boolean> {
    return window.electronAPI.database.deleteConnection(id);
  }

  async regenerateConnectionsForNode(nodeId: string): Promise<void> {
    return window.electronAPI.database.regenerateConnectionsForNode(nodeId);
  }

  // Search and utility operations
  async searchDataLogs(query: string): Promise<DataLogWithRelations[]> {
    return window.electronAPI.database.searchDataLogs(query);
  }

  async getAllTags(): Promise<string[]> {
    return window.electronAPI.database.getAllTags();
  }

  // Migration helper - convert from old DataLog format to new format
  convertDataLogToDatabase(dataLog: DataLog): CreateDataLogInput {
    // Generate title from content if not present
    let title: string;
    if (
      "title" in dataLog &&
      typeof (dataLog as any).title === "string" &&
      (dataLog as any).title
    ) {
      title = (dataLog as any).title;
    } else {
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
  createMemoryNodeFromDataLog(
    dataLog: DataLogWithRelations,
    position?: { x: number; y: number; z: number }
  ): CreateMemoryNodeInput {
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

// Global interface extension for Electron API
declare global {
  interface Window {
    electronAPI: {
      database: {
        // Neuron Cluster operations
        createNeuronCluster: (
          input: CreateNeuronClusterInput
        ) => Promise<DatabaseNeuronCluster>;
        getNeuronClusterById: (
          id: string
        ) => Promise<DatabaseNeuronCluster | null>;
        getAllNeuronClusters: () => Promise<DatabaseNeuronCluster[]>;
        updateNeuronCluster: (
          id: string,
          updates: UpdateNeuronClusterInput
        ) => Promise<DatabaseNeuronCluster | null>;
        deleteNeuronCluster: (id: string) => Promise<boolean>;

        // Data Log operations
        createDataLog: (
          input: CreateDataLogInput
        ) => Promise<DataLogWithRelations>;
        getDataLogById: (id: string) => Promise<DataLogWithRelations | null>;
        getAllDataLogs: () => Promise<DataLogWithRelations[]>;
        getDataLogsByCluster: (
          clusterId: string
        ) => Promise<DataLogWithRelations[]>;
        updateDataLog: (
          id: string,
          updates: UpdateDataLogInput
        ) => Promise<DataLogWithRelations | null>;
        deleteDataLog: (id: string) => Promise<boolean>;

        // Memory Node operations
        createMemoryNode: (
          input: CreateMemoryNodeInput
        ) => Promise<MemoryNodeWithRelations>;
        getMemoryNodeById: (
          id: string
        ) => Promise<MemoryNodeWithRelations | null>;
        getMemoryNodesByDataLogId: (
          dataLogId: string
        ) => Promise<MemoryNodeWithRelations[]>;
        getAllMemoryNodes: () => Promise<MemoryNodeWithRelations[]>;
        updateMemoryNode: (
          id: string,
          updates: UpdateMemoryNodeInput
        ) => Promise<MemoryNodeWithRelations | null>;
        deleteMemoryNode: (id: string) => Promise<boolean>;

        // Connection operations
        createConnection: (
          fromNodeId: string,
          toNodeId: string,
          sharedTags: string[],
          glitchOffset?: number
        ) => Promise<ConnectionWithSharedTags>;
        getAllConnections: () => Promise<ConnectionWithSharedTags[]>;
        deleteConnection: (id: number) => Promise<boolean>;
        regenerateConnectionsForNode: (nodeId: string) => Promise<void>;

        // Search and utility operations
        searchDataLogs: (query: string) => Promise<DataLogWithRelations[]>;
        getAllTags: () => Promise<string[]>;
        runMigration: () => Promise<void>;
      };
      files: {
        saveImage: (
          imageData: ArrayBuffer,
          filename: string
        ) => Promise<string>;
        getImagePath: (relativePath: string) => Promise<string | null>;
      };
    };
  }
}
