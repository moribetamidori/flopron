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
        createDataLog: (
          input: CreateDataLogInput
        ) => Promise<DataLogWithRelations>;
        getDataLogById: (id: string) => Promise<DataLogWithRelations | null>;
        getAllDataLogs: () => Promise<DataLogWithRelations[]>;
        updateDataLog: (
          id: string,
          updates: UpdateDataLogInput
        ) => Promise<DataLogWithRelations | null>;
        deleteDataLog: (id: string) => Promise<boolean>;

        createMemoryNode: (
          input: CreateMemoryNodeInput
        ) => Promise<MemoryNodeWithRelations>;
        getMemoryNodeById: (
          id: string
        ) => Promise<MemoryNodeWithRelations | null>;
        getAllMemoryNodes: () => Promise<MemoryNodeWithRelations[]>;
        updateMemoryNode: (
          id: string,
          updates: UpdateMemoryNodeInput
        ) => Promise<MemoryNodeWithRelations | null>;
        deleteMemoryNode: (id: string) => Promise<boolean>;

        createConnection: (
          fromNodeId: string,
          toNodeId: string,
          sharedTags: string[],
          glitchOffset?: number
        ) => Promise<ConnectionWithSharedTags>;
        getAllConnections: () => Promise<ConnectionWithSharedTags[]>;
        deleteConnection: (id: number) => Promise<boolean>;

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
