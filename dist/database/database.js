import Database from "better-sqlite3";
import { app } from "electron";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
// __dirname is not defined in ESM; define ESM-safe equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export class PKMDatabase {
    constructor() {
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
    static getInstance() {
        if (!PKMDatabase.instance) {
            PKMDatabase.instance = new PKMDatabase();
        }
        return PKMDatabase.instance;
    }
    initializeDatabase() {
        // Read and execute schema
        const schemaPath = path.join(__dirname, "schema.sql");
        // Check if schema file exists, if not try alternative paths
        let schemaContent;
        try {
            schemaContent = fs.readFileSync(schemaPath, "utf8");
        }
        catch (error) {
            // Try relative to project root for development
            const fallbackPath = path.join(process.cwd(), "src", "database", "schema.sql");
            try {
                schemaContent = fs.readFileSync(fallbackPath, "utf8");
            }
            catch (fallbackError) {
                throw new Error(`Could not find schema.sql at ${schemaPath} or ${fallbackPath}`);
            }
        }
        this.db.exec(schemaContent);
        // Run migrations
        this.runMigrations();
    }
    runMigrations() {
        // Get the current user version (schema version)
        const currentVersion = this.db.pragma("user_version", {
            simple: true,
        });
        console.log(`Current database schema version: ${currentVersion}`);
        // Check if any migrations need to be run
        const needsMigration = currentVersion < 4; // Update this as you add more migrations
        if (needsMigration) {
            // Create backup before running any migrations
            try {
                console.log("Creating backup before migration...");
                this.createBackup();
            }
            catch (error) {
                console.warn("Failed to create backup, but continuing with migration:", error);
            }
        }
        // Run migrations based on current version
        if (currentVersion < 1) {
            this.migrateToVersion1();
        }
        if (currentVersion < 2) {
            this.migrateToVersion2();
        }
        if (currentVersion < 3) {
            this.migrateToVersion3();
        }
        if (currentVersion < 4) {
            this.migrateToVersion4();
        }
        // Future migrations would be added here like:
        // if (currentVersion < 2) {
        //   this.migrateToVersion2();
        // }
        if (needsMigration) {
            console.log("All database migrations completed successfully.");
        }
    }
    migrateToVersion1() {
        console.log("Running migration to version 1: Adding title column...");
        // Check if title column already exists (safety check)
        const columns = this.db
            .prepare(`PRAGMA table_info(data_logs)`)
            .all();
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
                    .prepare(`SELECT id, content FROM data_logs WHERE title = '' OR title IS NULL`)
                    .all();
                if (existingLogs.length > 0) {
                    console.log(`Updating ${existingLogs.length} existing records with generated titles...`);
                    const updateStmt = this.db.prepare(`UPDATE data_logs SET title = ? WHERE id = ?`);
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
        }
        else {
            // Column already exists, just update schema version
            console.log("Title column already exists, updating schema version...");
            this.db.pragma("user_version = 1");
        }
    }
    migrateToVersion2() {
        console.log("Running migration to version 2: Adding modified_at columns and triggers...");
        const migration = this.db.transaction(() => {
            // Helper to check column existence
            const tableHasColumn = (table, col) => {
                const cols = this.db
                    .prepare(`PRAGMA table_info(${table})`)
                    .all();
                return cols.some((c) => c.name === col);
            };
            // Add modified_at to data_logs
            if (!tableHasColumn("data_logs", "modified_at")) {
                this.db.exec(`ALTER TABLE data_logs ADD COLUMN modified_at DATETIME`);
                // Backfill nulls (if any) using created_at per requirement
                this.db.exec(`UPDATE data_logs SET modified_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE modified_at IS NULL`);
            }
            // Add modified_at to memory_nodes
            if (!tableHasColumn("memory_nodes", "modified_at")) {
                this.db.exec(`ALTER TABLE memory_nodes ADD COLUMN modified_at DATETIME`);
                this.db.exec(`UPDATE memory_nodes SET modified_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE modified_at IS NULL`);
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
    migrateToVersion3() {
        console.log("Running migration to version 3: Adding neuron clusters support...");
        const migration = this.db.transaction(() => {
            // Helper to check table existence
            const tableExists = (table) => {
                const tables = this.db
                    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
                    .all(table);
                return tables.length > 0;
            };
            // Create neuron_clusters table if it doesn't exist
            if (!tableExists("neuron_clusters")) {
                this.db.exec(`
          CREATE TABLE neuron_clusters (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            modified_at DATETIME
          )
        `);
                // Create indexes
                this.db.exec(`CREATE INDEX idx_neuron_clusters_name ON neuron_clusters(name)`);
                // Create triggers
                this.db.exec(`
          CREATE TRIGGER update_neuron_clusters_updated_at 
          AFTER UPDATE ON neuron_clusters
          BEGIN
            UPDATE neuron_clusters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END
        `);
                this.db.exec(`
          CREATE TRIGGER update_neuron_clusters_modified_at 
          AFTER UPDATE ON neuron_clusters
          BEGIN
            UPDATE neuron_clusters SET modified_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
          END
        `);
                this.db.exec(`
          CREATE TRIGGER set_neuron_clusters_modified_at_on_insert
          AFTER INSERT ON neuron_clusters
          BEGIN
            UPDATE neuron_clusters
            SET modified_at = COALESCE(NEW.modified_at, NEW.created_at, CURRENT_TIMESTAMP)
            WHERE id = NEW.id;
          END
        `);
                // Create default cluster for existing data
                this.db.exec(`
          INSERT INTO neuron_clusters (id, name, description)
          VALUES ('default-cluster', 'Default Cluster', 'Default cluster for existing data')
        `);
            }
            // Add cluster_id column to data_logs if it doesn't exist
            const columns = this.db
                .prepare(`PRAGMA table_info(data_logs)`)
                .all();
            const hasClusterIdColumn = columns.some((col) => col.name === "cluster_id");
            if (!hasClusterIdColumn) {
                this.db.exec(`ALTER TABLE data_logs ADD COLUMN cluster_id TEXT`);
                this.db.exec(`CREATE INDEX idx_data_logs_cluster_id ON data_logs(cluster_id)`);
                // Set all existing data logs to the default cluster
                this.db.exec(`UPDATE data_logs SET cluster_id = 'default-cluster' WHERE cluster_id IS NULL`);
            }
            // Bump schema version
            this.db.pragma("user_version = 3");
        });
        migration();
        console.log("Migration to version 3 completed successfully.");
    }
    migrateToVersion4() {
        console.log("Running migration to version 4: Adding color column to neuron_clusters...");
        const migration = this.db.transaction(() => {
            // Check if color column already exists
            const columns = this.db
                .prepare(`PRAGMA table_info(neuron_clusters)`)
                .all();
            const hasColorColumn = columns.some((col) => col.name === "color");
            if (!hasColorColumn) {
                // Add color column
                this.db.exec(`ALTER TABLE neuron_clusters ADD COLUMN color TEXT`);
                // Set default colors for existing clusters
                const clusters = this.db
                    .prepare(`SELECT id FROM neuron_clusters`)
                    .all();
                const defaultColors = [
                    "#ff6b6b", // Red
                    "#4ecdc4", // Teal
                    "#45b7d1", // Blue
                    "#96ceb4", // Green
                    "#feca57", // Yellow
                    "#ff9ff3", // Pink
                    "#54a0ff", // Light Blue
                    "#5f27cd", // Purple
                    "#00d2d3", // Cyan
                    "#ff9f43", // Orange
                ];
                const updateColor = this.db.prepare(`UPDATE neuron_clusters SET color = ? WHERE id = ?`);
                clusters.forEach((cluster, index) => {
                    const color = defaultColors[index % defaultColors.length];
                    updateColor.run(color, cluster.id);
                });
                console.log(`Updated ${clusters.length} clusters with default colors.`);
            }
            // Set schema version to 4
            this.db.pragma("user_version = 4");
        });
        migration();
        console.log("Migration to version 4 completed successfully.");
    }
    // Neuron Cluster CRUD Operations
    createNeuronCluster(input) {
        const insertCluster = this.db.prepare(`
      INSERT INTO neuron_clusters (id, name, description, color)
      VALUES (?, ?, ?, ?)
    `);
        insertCluster.run(input.id, input.name, input.description || null, input.color || null);
        return this.getNeuronClusterById(input.id);
    }
    getNeuronClusterById(id) {
        const cluster = this.db
            .prepare(`
      SELECT * FROM neuron_clusters WHERE id = ?
    `)
            .get(id);
        if (!cluster)
            return null;
        return {
            ...cluster,
            created_at: new Date(cluster.created_at),
            updated_at: new Date(cluster.updated_at),
            modified_at: new Date(cluster.modified_at || cluster.updated_at || cluster.created_at),
        };
    }
    getAllNeuronClusters() {
        const clusters = this.db
            .prepare(`
      SELECT * FROM neuron_clusters ORDER BY name
    `)
            .all();
        return clusters.map((cluster) => ({
            ...cluster,
            created_at: new Date(cluster.created_at),
            updated_at: new Date(cluster.updated_at),
            modified_at: new Date(cluster.modified_at || cluster.updated_at || cluster.created_at),
        }));
    }
    updateNeuronCluster(id, updates) {
        const existing = this.getNeuronClusterById(id);
        if (!existing)
            return null;
        const updateCluster = this.db.prepare(`
      UPDATE neuron_clusters 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          color = COALESCE(?, color)
      WHERE id = ?
    `);
        updateCluster.run(updates.name, updates.description, updates.color, id);
        return this.getNeuronClusterById(id);
    }
    deleteNeuronCluster(id) {
        // Don't allow deletion of the default cluster
        if (id === "default-cluster") {
            return false;
        }
        const transaction = this.db.transaction(() => {
            // Move all data logs from this cluster to the default cluster
            this.db
                .prepare(`
        UPDATE data_logs SET cluster_id = 'default-cluster' WHERE cluster_id = ?
      `)
                .run(id);
            // Delete the cluster
            const result = this.db
                .prepare(`
        DELETE FROM neuron_clusters WHERE id = ?
      `)
                .run(id);
            return result.changes > 0;
        });
        return transaction();
    }
    // Data Log CRUD Operations
    createDataLog(input) {
        const transaction = this.db.transaction(() => {
            // Insert data log
            const insertDataLog = this.db.prepare(`
        INSERT INTO data_logs (id, title, timestamp, content, cluster_id)
        VALUES (?, ?, ?, ?, ?)
      `);
            insertDataLog.run(input.id, input.title, input.timestamp.toISOString(), input.content, input.cluster_id || "default-cluster");
            // Handle tags
            this.setDataLogTags(input.id, input.tags);
            // Handle images
            this.setDataLogImages(input.id, input.images);
            // Handle links
            this.setDataLogLinks(input.id, input.links);
            return this.getDataLogById(input.id);
        });
        return transaction();
    }
    getDataLogById(id) {
        const dataLog = this.db
            .prepare(`
      SELECT dl.*, nc.name as cluster_name, nc.description as cluster_description
      FROM data_logs dl
      LEFT JOIN neuron_clusters nc ON dl.cluster_id = nc.id
      WHERE dl.id = ?
    `)
            .get(id);
        if (!dataLog)
            return null;
        const cluster = dataLog.cluster_id
            ? {
                id: dataLog.cluster_id,
                name: dataLog.cluster_name || "Unknown Cluster",
                description: dataLog.cluster_description,
                created_at: new Date(),
                updated_at: new Date(),
                modified_at: new Date(),
            }
            : null;
        return {
            ...dataLog,
            timestamp: new Date(dataLog.timestamp),
            created_at: new Date(dataLog.created_at),
            updated_at: new Date(dataLog.updated_at),
            modified_at: new Date(dataLog.modified_at || dataLog.updated_at || dataLog.created_at),
            tags: this.getDataLogTags(id),
            images: this.getDataLogImages(id),
            links: this.getDataLogLinks(id),
            cluster,
        };
    }
    getAllDataLogs() {
        const dataLogs = this.db
            .prepare(`
      SELECT dl.*, nc.name as cluster_name, nc.description as cluster_description
      FROM data_logs dl
      LEFT JOIN neuron_clusters nc ON dl.cluster_id = nc.id
      ORDER BY dl.timestamp DESC
    `)
            .all();
        return dataLogs.map((dataLog) => {
            const cluster = dataLog.cluster_id
                ? {
                    id: dataLog.cluster_id,
                    name: dataLog.cluster_name || "Unknown Cluster",
                    description: dataLog.cluster_description,
                    created_at: new Date(),
                    updated_at: new Date(),
                    modified_at: new Date(),
                }
                : null;
            return {
                ...dataLog,
                timestamp: new Date(dataLog.timestamp),
                created_at: new Date(dataLog.created_at),
                updated_at: new Date(dataLog.updated_at),
                modified_at: new Date(dataLog.modified_at ||
                    dataLog.updated_at ||
                    dataLog.created_at),
                tags: this.getDataLogTags(dataLog.id),
                images: this.getDataLogImages(dataLog.id),
                links: this.getDataLogLinks(dataLog.id),
                cluster,
            };
        });
    }
    getDataLogsByCluster(clusterId) {
        const dataLogs = this.db
            .prepare(`
      SELECT dl.*, nc.name as cluster_name, nc.description as cluster_description
      FROM data_logs dl
      LEFT JOIN neuron_clusters nc ON dl.cluster_id = nc.id
      WHERE dl.cluster_id = ?
      ORDER BY dl.timestamp DESC
    `)
            .all(clusterId);
        return dataLogs.map((dataLog) => {
            const cluster = dataLog.cluster_id
                ? {
                    id: dataLog.cluster_id,
                    name: dataLog.cluster_name || "Unknown Cluster",
                    description: dataLog.cluster_description,
                    created_at: new Date(),
                    updated_at: new Date(),
                    modified_at: new Date(),
                }
                : null;
            return {
                ...dataLog,
                timestamp: new Date(dataLog.timestamp),
                created_at: new Date(dataLog.created_at),
                updated_at: new Date(dataLog.updated_at),
                modified_at: new Date(dataLog.modified_at ||
                    dataLog.updated_at ||
                    dataLog.created_at),
                tags: this.getDataLogTags(dataLog.id),
                images: this.getDataLogImages(dataLog.id),
                links: this.getDataLogLinks(dataLog.id),
                cluster,
            };
        });
    }
    updateDataLog(id, updates) {
        const transaction = this.db.transaction(() => {
            const existing = this.getDataLogById(id);
            if (!existing)
                return null;
            // Update data log if title, content, timestamp, or cluster_id changed
            if (updates.title !== undefined ||
                updates.content !== undefined ||
                updates.timestamp !== undefined ||
                updates.cluster_id !== undefined) {
                const updateDataLog = this.db.prepare(`
          UPDATE data_logs 
          SET title = COALESCE(?, title),
              content = COALESCE(?, content),
              timestamp = COALESCE(?, timestamp),
              cluster_id = COALESCE(?, cluster_id)
          WHERE id = ?
        `);
                updateDataLog.run(updates.title, updates.content, updates.timestamp?.toISOString(), updates.cluster_id, id);
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
            return this.getDataLogById(id);
        });
        return transaction();
    }
    deleteDataLog(id) {
        const result = this.db
            .prepare(`
      DELETE FROM data_logs WHERE id = ?
    `)
            .run(id);
        return result.changes > 0;
    }
    // Memory Node CRUD Operations
    createMemoryNode(input) {
        const insertNode = this.db.prepare(`
      INSERT OR REPLACE INTO memory_nodes (id, data_log_id, x, y, z, glitch_intensity, pulse_phase)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        insertNode.run(input.id, input.data_log_id, input.x, input.y, input.z, input.glitch_intensity || 0, input.pulse_phase || 0);
        return this.getMemoryNodeById(input.id);
    }
    getMemoryNodeById(id) {
        const node = this.db
            .prepare(`
      SELECT * FROM memory_nodes WHERE id = ?
    `)
            .get(id);
        if (!node)
            return null;
        return {
            ...node,
            created_at: new Date(node.created_at),
            updated_at: new Date(node.updated_at),
            modified_at: new Date(node.modified_at || node.updated_at || node.created_at),
            connections: this.getNodeConnections(id),
            dataLog: this.getDataLogById(node.data_log_id),
        };
    }
    getAllMemoryNodes() {
        const nodes = this.db
            .prepare(`
      SELECT * FROM memory_nodes ORDER BY created_at DESC
    `)
            .all();
        return nodes.map((node) => ({
            ...node,
            created_at: new Date(node.created_at),
            updated_at: new Date(node.updated_at),
            modified_at: new Date(node.modified_at || node.updated_at || node.created_at),
            connections: this.getNodeConnections(node.id),
            dataLog: this.getDataLogById(node.data_log_id),
        }));
    }
    getMemoryNodesByDataLogId(dataLogId) {
        const nodes = this.db
            .prepare(`
      SELECT * FROM memory_nodes WHERE data_log_id = ? ORDER BY created_at DESC
    `)
            .all(dataLogId);
        return nodes.map((node) => ({
            ...node,
            created_at: new Date(node.created_at),
            updated_at: new Date(node.updated_at),
            modified_at: new Date(node.modified_at || node.updated_at || node.created_at),
            connections: this.getNodeConnections(node.id),
            dataLog: this.getDataLogById(node.data_log_id),
        }));
    }
    updateMemoryNode(id, updates) {
        const existing = this.getMemoryNodeById(id);
        if (!existing)
            return null;
        const updateNode = this.db.prepare(`
      UPDATE memory_nodes 
      SET x = COALESCE(?, x),
          y = COALESCE(?, y),
          z = COALESCE(?, z),
          glitch_intensity = COALESCE(?, glitch_intensity),
          pulse_phase = COALESCE(?, pulse_phase)
      WHERE id = ?
    `);
        updateNode.run(updates.x, updates.y, updates.z, updates.glitch_intensity, updates.pulse_phase, id);
        return this.getMemoryNodeById(id);
    }
    deleteMemoryNode(id) {
        const result = this.db
            .prepare(`
      DELETE FROM memory_nodes WHERE id = ?
    `)
            .run(id);
        return result.changes > 0;
    }
    // Function to regenerate connections for a specific node based on updated tags
    regenerateConnectionsForNode(nodeId) {
        // Get the updated node and its data log with tags
        const node = this.getMemoryNodeById(nodeId);
        if (!node || !node.dataLog?.tags || node.dataLog.tags.length === 0) {
            return;
        }
        // Remove all existing connections for this node
        this.db
            .prepare(`
      DELETE FROM node_connections 
      WHERE from_node_id = ? OR to_node_id = ?
    `)
            .run(nodeId, nodeId);
        // Get all other nodes to check for shared tags
        const allNodes = this.getAllMemoryNodes();
        for (const otherNode of allNodes) {
            if (otherNode.id === nodeId || !otherNode.dataLog?.tags)
                continue;
            // Find shared tags
            const sharedTags = node.dataLog.tags.filter((tag) => otherNode.dataLog.tags.includes(tag));
            if (sharedTags.length > 0) {
                // Create new connection
                this.createConnection(nodeId, otherNode.id, sharedTags, Math.random() * 10);
            }
        }
    }
    // Connection CRUD Operations
    createConnection(fromNodeId, toNodeId, sharedTags, glitchOffset = 0) {
        const transaction = this.db.transaction(() => {
            // Insert connection
            const insertConnection = this.db.prepare(`
        INSERT INTO node_connections (from_node_id, to_node_id, glitch_offset)
        VALUES (?, ?, ?)
      `);
            const result = insertConnection.run(fromNodeId, toNodeId, glitchOffset);
            const connectionId = result.lastInsertRowid;
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
            return this.getConnectionById(connectionId);
        });
        return transaction();
    }
    getConnectionById(id) {
        const connection = this.db
            .prepare(`
      SELECT * FROM node_connections WHERE id = ?
    `)
            .get(id);
        if (!connection)
            return null;
        const sharedTags = this.db
            .prepare(`
      SELECT t.name 
      FROM connection_shared_tags cst
      JOIN tags t ON cst.tag_id = t.id
      WHERE cst.connection_id = ?
    `)
            .all(id)
            .map((row) => row.name);
        return {
            ...connection,
            created_at: new Date(connection.created_at),
            sharedTags,
        };
    }
    getAllConnections() {
        const connections = this.db
            .prepare(`
      SELECT * FROM node_connections ORDER BY created_at
    `)
            .all();
        return connections.map((connection) => {
            const sharedTags = this.db
                .prepare(`
        SELECT t.name 
        FROM connection_shared_tags cst
        JOIN tags t ON cst.tag_id = t.id
        WHERE cst.connection_id = ?
      `)
                .all(connection.id)
                .map((row) => row.name);
            return {
                ...connection,
                created_at: new Date(connection.created_at),
                sharedTags,
            };
        });
    }
    deleteConnection(id) {
        const result = this.db
            .prepare(`
      DELETE FROM node_connections WHERE id = ?
    `)
            .run(id);
        return result.changes > 0;
    }
    // Utility methods
    getDataLogTags(dataLogId) {
        return this.db
            .prepare(`
      SELECT t.name 
      FROM data_log_tags dlt
      JOIN tags t ON dlt.tag_id = t.id
      WHERE dlt.data_log_id = ?
    `)
            .all(dataLogId)
            .map((row) => row.name);
    }
    getDataLogImages(dataLogId) {
        return this.db
            .prepare(`
      SELECT path FROM images WHERE data_log_id = ? ORDER BY created_at
    `)
            .all(dataLogId)
            .map((row) => row.path);
    }
    getDataLogLinks(dataLogId) {
        return this.db
            .prepare(`
      SELECT url FROM links WHERE data_log_id = ? ORDER BY created_at
    `)
            .all(dataLogId)
            .map((row) => row.url);
    }
    getNodeConnections(nodeId) {
        return this.db
            .prepare(`
      SELECT 
        CASE 
          WHEN from_node_id = ? THEN to_node_id
          ELSE from_node_id
        END as connected_node_id
      FROM node_connections 
      WHERE from_node_id = ? OR to_node_id = ?
    `)
            .all(nodeId, nodeId, nodeId)
            .map((row) => row.connected_node_id);
    }
    ensureTagExists(tagName) {
        this.db
            .prepare(`
      INSERT OR IGNORE INTO tags (name) VALUES (?)
    `)
            .run(tagName);
    }
    setDataLogTags(dataLogId, tags) {
        // Remove existing tags
        this.db
            .prepare(`
      DELETE FROM data_log_tags WHERE data_log_id = ?
    `)
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
    setDataLogImages(dataLogId, images) {
        // Remove existing images
        this.db
            .prepare(`
      DELETE FROM images WHERE data_log_id = ?
    `)
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
    setDataLogLinks(dataLogId, links) {
        // Remove existing links
        this.db
            .prepare(`
      DELETE FROM links WHERE data_log_id = ?
    `)
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
    searchDataLogs(query) {
        const dataLogs = this.db
            .prepare(`
      SELECT DISTINCT dl.* 
      FROM data_logs dl
      LEFT JOIN data_log_tags dlt ON dl.id = dlt.data_log_id
      LEFT JOIN tags t ON dlt.tag_id = t.id
      WHERE dl.title LIKE ? OR dl.content LIKE ? OR t.name LIKE ?
      ORDER BY dl.timestamp DESC
    `)
            .all(`%${query}%`, `%${query}%`, `%${query}%`);
        return dataLogs.map((dataLog) => ({
            ...dataLog,
            timestamp: new Date(dataLog.timestamp),
            created_at: new Date(dataLog.created_at),
            updated_at: new Date(dataLog.updated_at),
            modified_at: new Date(dataLog.modified_at || dataLog.updated_at || dataLog.created_at),
            tags: this.getDataLogTags(dataLog.id),
            images: this.getDataLogImages(dataLog.id),
            links: this.getDataLogLinks(dataLog.id),
        }));
    }
    getAllTags() {
        return this.db
            .prepare(`
      SELECT name FROM tags ORDER BY name
    `)
            .all()
            .map((row) => row.name);
    }
    // Database maintenance
    close() {
        this.db.close();
    }
    backup(backupPath) {
        try {
            // Handle promise rejection to avoid unhandled rejection warnings
            const p = this.db.backup(backupPath);
            if (p && typeof p.then === "function") {
                p
                    .then(() => {
                    console.log(`Database backup completed: ${backupPath}`);
                })
                    .catch((error) => {
                    console.warn("Database backup failed (continuing without backup):", error);
                });
            }
        }
        catch (error) {
            console.warn("Database backup threw synchronously (continuing):", error);
        }
    }
    // Create automatic backup before migrations
    createBackup() {
        const userDataPath = app.getPath("userData");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = path.join(userDataPath, `pkm-data-backup-${timestamp}.db`);
        // Fire-and-forget backup to avoid blocking startup; errors are handled inside backup()
        this.backup(backupPath);
        console.log(`Database backup initiated at: ${backupPath}`);
        return backupPath;
    }
    // Get current schema version
    getSchemaVersion() {
        return this.db.pragma("user_version", { simple: true });
    }
}
