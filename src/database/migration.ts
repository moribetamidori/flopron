// Migration script to transfer existing data from data.ts to SQLite database
import { dataLogs } from "../data.js";
import { DatabaseService } from "./databaseService.js";

export class DataMigration {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  async migrateExistingData(): Promise<void> {
    console.log("Starting data migration...");

    try {
      // Check if data already exists in database
      const existingDataLogs = await this.databaseService.getAllDataLogs();

      if (existingDataLogs.length > 0) {
        console.log(
          `Found ${existingDataLogs.length} existing data logs in database. Skipping migration.`
        );
        return;
      }

      // Migrate each data log
      for (const dataLog of dataLogs) {
        console.log(`Migrating data log: ${dataLog.id}`);

        // Convert to database format
        const input = this.databaseService.convertDataLogToDatabase(dataLog);

        // Create data log in database
        const createdDataLog = await this.databaseService.createDataLog(input);

        // Create corresponding memory node
        const memoryNodeInput =
          this.databaseService.createMemoryNodeFromDataLog(createdDataLog);
        await this.databaseService.createMemoryNode(memoryNodeInput);

        console.log(`Successfully migrated: ${dataLog.id}`);
      }

      // Generate connections based on shared tags
      await this.generateConnections();

      console.log("Data migration completed successfully!");
    } catch (error) {
      console.error("Error during data migration:", error);
      throw error;
    }
  }

  private async generateConnections(): Promise<void> {
    console.log("Generating connections based on shared tags...");

    const memoryNodes = await this.databaseService.getAllMemoryNodes();
    const connectionSet = new Set<string>(); // Prevent duplicate connections

    for (let i = 0; i < memoryNodes.length; i++) {
      const nodeA = memoryNodes[i];
      if (!nodeA.dataLog?.tags) continue;

      for (let j = i + 1; j < memoryNodes.length; j++) {
        const nodeB = memoryNodes[j];
        if (!nodeB.dataLog?.tags) continue;

        // Find shared tags
        const sharedTags = nodeA.dataLog.tags.filter((tag) =>
          nodeB.dataLog!.tags.includes(tag)
        );

        if (sharedTags.length > 0) {
          const connectionKey = [nodeA.id, nodeB.id].sort().join("-");

          if (!connectionSet.has(connectionKey)) {
            connectionSet.add(connectionKey);

            await this.databaseService.createConnection(
              nodeA.id,
              nodeB.id,
              sharedTags,
              Math.random() * 10 // glitch offset
            );

            console.log(
              `Created connection between ${nodeA.id} and ${
                nodeB.id
              } with shared tags: ${sharedTags.join(", ")}`
            );
          }
        }
      }
    }

    console.log(`Generated ${connectionSet.size} connections`);
  }

  async resetDatabase(): Promise<void> {
    console.log("Resetting database...");

    try {
      // Delete all data (in correct order due to foreign keys)
      const connections = await this.databaseService.getAllConnections();
      for (const connection of connections) {
        await this.databaseService.deleteConnection(connection.id);
      }

      const memoryNodes = await this.databaseService.getAllMemoryNodes();
      for (const node of memoryNodes) {
        await this.databaseService.deleteMemoryNode(node.id);
      }

      const dataLogs = await this.databaseService.getAllDataLogs();
      for (const dataLog of dataLogs) {
        await this.databaseService.deleteDataLog(dataLog.id);
      }

      console.log("Database reset completed");
    } catch (error) {
      console.error("Error during database reset:", error);
      throw error;
    }
  }

  async checkDataIntegrity(): Promise<boolean> {
    try {
      const dataLogs = await this.databaseService.getAllDataLogs();
      const memoryNodes = await this.databaseService.getAllMemoryNodes();
      const connections = await this.databaseService.getAllConnections();

      console.log(`Database contains:
        - Data Logs: ${dataLogs.length}
        - Memory Nodes: ${memoryNodes.length}
        - Connections: ${connections.length}`);

      // Check that each data log has a corresponding memory node
      for (const dataLog of dataLogs) {
        const correspondingNode = memoryNodes.find(
          (node) => node.data_log_id === dataLog.id
        );
        if (!correspondingNode) {
          console.error(
            `Data log ${dataLog.id} has no corresponding memory node`
          );
          return false;
        }
      }

      // Check that each connection references valid nodes
      for (const connection of connections) {
        const fromNodeExists = memoryNodes.some(
          (node) => node.id === connection.from_node_id
        );
        const toNodeExists = memoryNodes.some(
          (node) => node.id === connection.to_node_id
        );

        if (!fromNodeExists || !toNodeExists) {
          console.error(`Connection ${connection.id} references invalid nodes`);
          return false;
        }
      }

      console.log("Data integrity check passed");
      return true;
    } catch (error) {
      console.error("Error during data integrity check:", error);
      return false;
    }
  }
}

// Export a function that can be called from the renderer process
export async function runMigration(): Promise<void> {
  const migration = new DataMigration();
  await migration.migrateExistingData();
}
