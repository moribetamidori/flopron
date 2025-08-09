import Database from "better-sqlite3";
import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import {
  DatabaseDataLog,
  DatabaseTag,
  DatabaseImage,
  DatabaseLink,
  DatabaseMemoryNode,
  DatabaseNodeConnection,
  DataLogWithRelations,
  MemoryNodeWithRelations,
  ConnectionWithSharedTags,
  CreateDataLogInput,
  UpdateDataLogInput,
  CreateMemoryNodeInput,
  UpdateMemoryNodeInput,
} from "./types.js";
import { fileURLToPath } from "url";

// __dirname is not defined in ESM; define ESM-safe equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PKMDatabase {
  private db: Database.Database;
  private static instance: PKMDatabase;

  private constructor() {
    // Initialize database in user data directory
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "pkm-data.db");

    // Ensure directory exists
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL"); // Better performance for concurrent reads
    this.db.pragma("foreign_keys = ON"); // Enable foreign key constraints

    this.initializeDatabase();
  }

  static getInstance(): PKMDatabase {
    if (!PKMDatabase.instance) {
      PKMDatabase.instance = new PKMDatabase();
    }
    return PKMDatabase.instance;
  }

  private initializeDatabase(): void {
    // Read and execute schema
    const schemaPath = path.join(__dirname, "schema.sql");

    // Check if schema file exists, if not try alternative paths
    let schemaContent: string;
    try {
      schemaContent = fs.readFileSync(schemaPath, "utf8");
    } catch (error) {
      // Try relative to project root for development
      const fallbackPath = path.join(
        process.cwd(),
        "src",
        "database",
        "schema.sql"
      );
      try {
        schemaContent = fs.readFileSync(fallbackPath, "utf8");
      } catch (fallbackError) {
        throw new Error(
          `Could not find schema.sql at ${schemaPath} or ${fallbackPath}`
        );
      }
    }

    this.db.exec(schemaContent);

    // Run migrations
    this.runMigrations();
  }

  private runMigrations(): void {
    // Get the current user version (schema version)
    const currentVersion = this.db.pragma("user_version", {
      simple: true,
    }) as number;

    console.log(`Current database schema version: ${currentVersion}`);

    // Check if any migrations need to be run
    const needsMigration = currentVersion < 2; // Update this as you add more migrations

    if (needsMigration) {
      // Create backup before running any migrations
      try {
        console.log("Creating backup before migration...");
        this.createBackup();
      } catch (error) {
        console.warn(
          "Failed to create backup, but continuing with migration:",
          error
        );
      }
    }

    // Run migrations based on current version
    if (currentVersion < 1) {
      this.migrateToVersion1();
    }
    if (currentVersion < 2) {
      this.migrateToVersion2();
    }

    // Future migrations would be added here like:
    // if (currentVersion < 2) {
    //   this.migrateToVersion2();
    // }

    if (needsMigration) {
      console.log("All database migrations completed successfully.");
    }
  }

  private migrateToVersion1(): void {
    console.log("Running migration to version 1: Adding title column...");

    // Check if title column already exists (safety check)
    const columns = this.db
      .prepare(`PRAGMA table_info(data_logs)`)
      .all() as Array<{ name: string }>;
    const hasTitleColumn = columns.some((col) => col.name === "title");

    if (!hasTitleColumn) {
      // Backup existing data first
      console.log("Backing up existing data...");

      // Start transaction for data safety
      const migration = this.db.transaction(() => {
        // Add title column with default value
        this.db.exec(`ALTER TABLE data_logs ADD COLUMN title TEXT DEFAULT ''`);

        // Get all existing records
        const existingLogs = this.db
          .prepare(
            `SELECT id, content FROM data_logs WHERE title = '' OR title IS NULL`
          )
          .all() as Array<{ id: string; content: string }>;

        if (existingLogs.length > 0) {
          console.log(
            `Updating ${existingLogs.length} existing records with generated titles...`
          );

          const updateStmt = this.db.prepare(
            `UPDATE data_logs SET title = ? WHERE id = ?`
          );

          for (const log of existingLogs) {
            // Generate title from ID, but fall back to content if ID is not descriptive
            let title = log.id
              .replace(/[[\]()-]/g, " ")
              .replace(/-/g, " ")
              .split(" ")
              .filter((word) => word.length > 0)
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            // If the generated title is not very descriptive, use first part of content
            if (title.length < 5 || title.includes("Memory")) {
              title = log.content.substring(0, 50).trim();
              if (log.content.length > 50) {
                title += "...";
              }
            }

            updateStmt.run(title, log.id);
          }
        }

        // Set schema version to 1
        this.db.pragma("user_version = 1");
      });

      migration();
      console.log("Migration to version 1 completed successfully.");
    } else {
      // Column already exists, just update schema version
      console.log("Title column already exists, updating schema version...");
      this.db.pragma("user_version = 1");
    }
  }

  private migrateToVersion2(): void {
    console.log(
      "Running migration to version 2: Adding modified_at columns and triggers..."
    );

    const migration = this.db.transaction(() => {
      // Helper to check column existence
      const tableHasColumn = (table: string, col: string): boolean => {
        const cols = this.db
          .prepare(`PRAGMA table_info(${table})`)
          .all() as Array<{ name: string }>;
        return cols.some((c) => c.name === col);
      };

      // Add modified_at to data_logs
      if (!tableHasColumn("data_logs", "modified_at")) {
        this.db.exec(`ALTER TABLE data_logs ADD COLUMN modified_at DATETIME`);
        // Backfill nulls (if any) using created_at per requirement
        this.db.exec(
          `UPDATE data_logs SET modified_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE modified_at IS NULL`
        );
      }

      // Add modified_at to memory_nodes
      if (!tableHasColumn("memory_nodes", "modified_at")) {
        this.db.exec(
          `ALTER TABLE memory_nodes ADD COLUMN modified_at DATETIME`
        );
        this.db.exec(
          `UPDATE memory_nodes SET modified_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE modified_at IS NULL`
        );
      }

      // Create triggers to keep modified_at current
      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_data_logs_modified_at 
        AFTER UPDATE ON data_logs
        BEGIN
          UPDATE data_logs SET modified_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
      `);

      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS set_data_logs_modified_at_on_insert
        AFTER INSERT ON data_logs
        BEGIN
          UPDATE data_logs
          SET modified_at = COALESCE(NEW.modified_at, NEW.created_at, CURRENT_TIMESTAMP)
          WHERE id = NEW.id;
        END;
      `);

      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_memory_nodes_modified_at 
        AFTER UPDATE ON memory_nodes
        BEGIN
          UPDATE memory_nodes SET modified_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
      `);

      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS set_memory_nodes_modified_at_on_insert
        AFTER INSERT ON memory_nodes
        BEGIN
          UPDATE memory_nodes
          SET modified_at = COALESCE(NEW.modified_at, NEW.created_at, CURRENT_TIMESTAMP)
          WHERE id = NEW.id;
        END;
      `);

      // Bump schema version
      this.db.pragma("user_version = 2");
    });

    migration();
    console.log("Migration to version 2 completed successfully.");
  }

  // Data Log CRUD Operations
  createDataLog(input: CreateDataLogInput): DataLogWithRelations {
    const transaction = this.db.transaction(() => {
      // Insert data log
      const insertDataLog = this.db.prepare(`
        INSERT INTO data_logs (id, title, timestamp, content)
        VALUES (?, ?, ?, ?)
      `);
      insertDataLog.run(
        input.id,
        input.title,
        input.timestamp.toISOString(),
        input.content
      );

      // Handle tags
      this.setDataLogTags(input.id, input.tags);

      // Handle images
      this.setDataLogImages(input.id, input.images);

      // Handle links
      this.setDataLogLinks(input.id, input.links);

      return this.getDataLogById(input.id)!;
    });

    return transaction();
  }

  getDataLogById(id: string): DataLogWithRelations | null {
    const dataLog = this.db
      .prepare(
        `
      SELECT * FROM data_logs WHERE id = ?
    `
      )
      .get(id) as DatabaseDataLog | undefined;

    if (!dataLog) return null;

    return {
      ...dataLog,
      timestamp: new Date(dataLog.timestamp),
      created_at: new Date(dataLog.created_at),
      updated_at: new Date(dataLog.updated_at),
      modified_at: new Date(
        (dataLog as any).modified_at || dataLog.updated_at || dataLog.created_at
      ),
      tags: this.getDataLogTags(id),
      images: this.getDataLogImages(id),
      links: this.getDataLogLinks(id),
    };
  }

  getAllDataLogs(): DataLogWithRelations[] {
    const dataLogs = this.db
      .prepare(
        `
      SELECT * FROM data_logs ORDER BY timestamp DESC
    `
      )
      .all() as DatabaseDataLog[];

    return dataLogs.map((dataLog) => ({
      ...dataLog,
      timestamp: new Date(dataLog.timestamp),
      created_at: new Date(dataLog.created_at),
      updated_at: new Date(dataLog.updated_at),
      modified_at: new Date(
        (dataLog as any).modified_at || dataLog.updated_at || dataLog.created_at
      ),
      tags: this.getDataLogTags(dataLog.id),
      images: this.getDataLogImages(dataLog.id),
      links: this.getDataLogLinks(dataLog.id),
    }));
  }

  updateDataLog(
    id: string,
    updates: UpdateDataLogInput
  ): DataLogWithRelations | null {
    const transaction = this.db.transaction(() => {
      const existing = this.getDataLogById(id);
      if (!existing) return null;

      // Update data log if title, content or timestamp changed
      if (
        updates.title !== undefined ||
        updates.content !== undefined ||
        updates.timestamp !== undefined
      ) {
        const updateDataLog = this.db.prepare(`
          UPDATE data_logs 
          SET title = COALESCE(?, title),
              content = COALESCE(?, content),
              timestamp = COALESCE(?, timestamp)
          WHERE id = ?
        `);
        updateDataLog.run(
          updates.title,
          updates.content,
          updates.timestamp?.toISOString(),
          id
        );
      }

      // Update tags if provided
      if (updates.tags !== undefined) {
        this.setDataLogTags(id, updates.tags);
      }

      // Update images if provided
      if (updates.images !== undefined) {
        this.setDataLogImages(id, updates.images);
      }

      // Update links if provided
      if (updates.links !== undefined) {
        this.setDataLogLinks(id, updates.links);
      }

      return this.getDataLogById(id)!;
    });

    return transaction();
  }

  deleteDataLog(id: string): boolean {
    const result = this.db
      .prepare(
        `
      DELETE FROM data_logs WHERE id = ?
    `
      )
      .run(id);

    return result.changes > 0;
  }

  // Memory Node CRUD Operations
  createMemoryNode(input: CreateMemoryNodeInput): MemoryNodeWithRelations {
    const insertNode = this.db.prepare(`
      INSERT OR REPLACE INTO memory_nodes (id, data_log_id, x, y, z, glitch_intensity, pulse_phase)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertNode.run(
      input.id,
      input.data_log_id,
      input.x,
      input.y,
      input.z,
      input.glitch_intensity || 0,
      input.pulse_phase || 0
    );

    return this.getMemoryNodeById(input.id)!;
  }

  getMemoryNodeById(id: string): MemoryNodeWithRelations | null {
    const node = this.db
      .prepare(
        `
      SELECT * FROM memory_nodes WHERE id = ?
    `
      )
      .get(id) as DatabaseMemoryNode | undefined;

    if (!node) return null;

    return {
      ...node,
      created_at: new Date(node.created_at),
      updated_at: new Date(node.updated_at),
      modified_at: new Date(
        (node as any).modified_at || node.updated_at || node.created_at
      ),
      connections: this.getNodeConnections(id),
      dataLog: this.getDataLogById(node.data_log_id),
    };
  }

  getAllMemoryNodes(): MemoryNodeWithRelations[] {
    const nodes = this.db
      .prepare(
        `
      SELECT * FROM memory_nodes ORDER BY created_at DESC
    `
      )
      .all() as DatabaseMemoryNode[];

    return nodes.map((node) => ({
      ...node,
      created_at: new Date(node.created_at),
      updated_at: new Date(node.updated_at),
      modified_at: new Date(
        (node as any).modified_at || node.updated_at || node.created_at
      ),
      connections: this.getNodeConnections(node.id),
      dataLog: this.getDataLogById(node.data_log_id),
    }));
  }

  updateMemoryNode(
    id: string,
    updates: UpdateMemoryNodeInput
  ): MemoryNodeWithRelations | null {
    const existing = this.getMemoryNodeById(id);
    if (!existing) return null;

    const updateNode = this.db.prepare(`
      UPDATE memory_nodes 
      SET x = COALESCE(?, x),
          y = COALESCE(?, y),
          z = COALESCE(?, z),
          glitch_intensity = COALESCE(?, glitch_intensity),
          pulse_phase = COALESCE(?, pulse_phase)
      WHERE id = ?
    `);

    updateNode.run(
      updates.x,
      updates.y,
      updates.z,
      updates.glitch_intensity,
      updates.pulse_phase,
      id
    );

    return this.getMemoryNodeById(id)!;
  }

  deleteMemoryNode(id: string): boolean {
    const result = this.db
      .prepare(
        `
      DELETE FROM memory_nodes WHERE id = ?
    `
      )
      .run(id);

    return result.changes > 0;
  }

  // Connection CRUD Operations
  createConnection(
    fromNodeId: string,
    toNodeId: string,
    sharedTags: string[],
    glitchOffset: number = 0
  ): ConnectionWithSharedTags {
    const transaction = this.db.transaction(() => {
      // Insert connection
      const insertConnection = this.db.prepare(`
        INSERT INTO node_connections (from_node_id, to_node_id, glitch_offset)
        VALUES (?, ?, ?)
      `);
      const result = insertConnection.run(fromNodeId, toNodeId, glitchOffset);
      const connectionId = result.lastInsertRowid as number;

      // Insert shared tags
      if (sharedTags.length > 0) {
        const insertSharedTag = this.db.prepare(`
          INSERT INTO connection_shared_tags (connection_id, tag_id)
          SELECT ?, id FROM tags WHERE name = ?
        `);

        for (const tagName of sharedTags) {
          this.ensureTagExists(tagName);
          insertSharedTag.run(connectionId, tagName);
        }
      }

      return this.getConnectionById(connectionId)!;
    });

    return transaction();
  }

  getConnectionById(id: number): ConnectionWithSharedTags | null {
    const connection = this.db
      .prepare(
        `
      SELECT * FROM node_connections WHERE id = ?
    `
      )
      .get(id) as DatabaseNodeConnection | undefined;

    if (!connection) return null;

    const sharedTags = this.db
      .prepare(
        `
      SELECT t.name 
      FROM connection_shared_tags cst
      JOIN tags t ON cst.tag_id = t.id
      WHERE cst.connection_id = ?
    `
      )
      .all(id)
      .map((row: any) => row.name);

    return {
      ...connection,
      created_at: new Date(connection.created_at),
      sharedTags,
    };
  }

  getAllConnections(): ConnectionWithSharedTags[] {
    const connections = this.db
      .prepare(
        `
      SELECT * FROM node_connections ORDER BY created_at
    `
      )
      .all() as DatabaseNodeConnection[];

    return connections.map((connection) => {
      const sharedTags = this.db
        .prepare(
          `
        SELECT t.name 
        FROM connection_shared_tags cst
        JOIN tags t ON cst.tag_id = t.id
        WHERE cst.connection_id = ?
      `
        )
        .all(connection.id)
        .map((row: any) => row.name);

      return {
        ...connection,
        created_at: new Date(connection.created_at),
        sharedTags,
      };
    });
  }

  deleteConnection(id: number): boolean {
    const result = this.db
      .prepare(
        `
      DELETE FROM node_connections WHERE id = ?
    `
      )
      .run(id);

    return result.changes > 0;
  }

  // Utility methods
  private getDataLogTags(dataLogId: string): string[] {
    return this.db
      .prepare(
        `
      SELECT t.name 
      FROM data_log_tags dlt
      JOIN tags t ON dlt.tag_id = t.id
      WHERE dlt.data_log_id = ?
    `
      )
      .all(dataLogId)
      .map((row: any) => row.name);
  }

  private getDataLogImages(dataLogId: string): string[] {
    return this.db
      .prepare(
        `
      SELECT path FROM images WHERE data_log_id = ? ORDER BY created_at
    `
      )
      .all(dataLogId)
      .map((row: any) => row.path);
  }

  private getDataLogLinks(dataLogId: string): string[] {
    return this.db
      .prepare(
        `
      SELECT url FROM links WHERE data_log_id = ? ORDER BY created_at
    `
      )
      .all(dataLogId)
      .map((row: any) => row.url);
  }

  private getNodeConnections(nodeId: string): string[] {
    return this.db
      .prepare(
        `
      SELECT 
        CASE 
          WHEN from_node_id = ? THEN to_node_id
          ELSE from_node_id
        END as connected_node_id
      FROM node_connections 
      WHERE from_node_id = ? OR to_node_id = ?
    `
      )
      .all(nodeId, nodeId, nodeId)
      .map((row: any) => row.connected_node_id);
  }

  private ensureTagExists(tagName: string): void {
    this.db
      .prepare(
        `
      INSERT OR IGNORE INTO tags (name) VALUES (?)
    `
      )
      .run(tagName);
  }

  private setDataLogTags(dataLogId: string, tags: string[]): void {
    // Remove existing tags
    this.db
      .prepare(
        `
      DELETE FROM data_log_tags WHERE data_log_id = ?
    `
      )
      .run(dataLogId);

    // Insert new tags
    if (tags.length > 0) {
      const insertTag = this.db.prepare(`
        INSERT INTO data_log_tags (data_log_id, tag_id)
        SELECT ?, id FROM tags WHERE name = ?
      `);

      for (const tagName of tags) {
        this.ensureTagExists(tagName);
        insertTag.run(dataLogId, tagName);
      }
    }
  }

  private setDataLogImages(dataLogId: string, images: string[]): void {
    // Remove existing images
    this.db
      .prepare(
        `
      DELETE FROM images WHERE data_log_id = ?
    `
      )
      .run(dataLogId);

    // Insert new images
    if (images.length > 0) {
      const insertImage = this.db.prepare(`
        INSERT INTO images (data_log_id, path) VALUES (?, ?)
      `);

      for (const imagePath of images) {
        insertImage.run(dataLogId, imagePath);
      }
    }
  }

  private setDataLogLinks(dataLogId: string, links: string[]): void {
    // Remove existing links
    this.db
      .prepare(
        `
      DELETE FROM links WHERE data_log_id = ?
    `
      )
      .run(dataLogId);

    // Insert new links
    if (links.length > 0) {
      const insertLink = this.db.prepare(`
        INSERT INTO links (data_log_id, url) VALUES (?, ?)
      `);

      for (const linkUrl of links) {
        insertLink.run(dataLogId, linkUrl);
      }
    }
  }

  // Search methods
  searchDataLogs(query: string): DataLogWithRelations[] {
    const dataLogs = this.db
      .prepare(
        `
      SELECT DISTINCT dl.* 
      FROM data_logs dl
      LEFT JOIN data_log_tags dlt ON dl.id = dlt.data_log_id
      LEFT JOIN tags t ON dlt.tag_id = t.id
      WHERE dl.title LIKE ? OR dl.content LIKE ? OR t.name LIKE ?
      ORDER BY dl.timestamp DESC
    `
      )
      .all(`%${query}%`, `%${query}%`, `%${query}%`) as DatabaseDataLog[];

    return dataLogs.map((dataLog) => ({
      ...dataLog,
      timestamp: new Date(dataLog.timestamp),
      created_at: new Date(dataLog.created_at),
      updated_at: new Date(dataLog.updated_at),
      modified_at: new Date(
        (dataLog as any).modified_at || dataLog.updated_at || dataLog.created_at
      ),
      tags: this.getDataLogTags(dataLog.id),
      images: this.getDataLogImages(dataLog.id),
      links: this.getDataLogLinks(dataLog.id),
    }));
  }

  getAllTags(): string[] {
    return this.db
      .prepare(
        `
      SELECT name FROM tags ORDER BY name
    `
      )
      .all()
      .map((row: any) => row.name);
  }

  // Database maintenance
  close(): void {
    this.db.close();
  }

  backup(backupPath: string): void {
    try {
      // Handle promise rejection to avoid unhandled rejection warnings
      const p = this.db.backup(backupPath) as unknown as Promise<void>;
      if (p && typeof (p as any).then === "function") {
        (p as Promise<void>)
          .then(() => {
            console.log(`Database backup completed: ${backupPath}`);
          })
          .catch((error) => {
            console.warn(
              "Database backup failed (continuing without backup):",
              error
            );
          });
      }
    } catch (error) {
      console.warn("Database backup threw synchronously (continuing):", error);
    }
  }

  // Create automatic backup before migrations
  createBackup(): string {
    const userDataPath = app.getPath("userData");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(
      userDataPath,
      `pkm-data-backup-${timestamp}.db`
    );

    // Fire-and-forget backup to avoid blocking startup; errors are handled inside backup()
    this.backup(backupPath);
    console.log(`Database backup initiated at: ${backupPath}`);
    return backupPath;
  }

  // Get current schema version
  getSchemaVersion(): number {
    return this.db.pragma("user_version", { simple: true }) as number;
  }
}
