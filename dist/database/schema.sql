-- PKM Database Schema
-- SQLite database for Personal Knowledge Management app

-- Neuron clusters table for organizing memory nodes into clusters
CREATE TABLE IF NOT EXISTS neuron_clusters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME
);

-- DataLogs table for storing memory entries
CREATE TABLE IF NOT EXISTS data_logs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    content TEXT NOT NULL,
    cluster_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME,
    FOREIGN KEY (cluster_id) REFERENCES neuron_clusters(id) ON DELETE SET NULL
);

-- Tags table for normalized tag storage
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for many-to-many relationship between data_logs and tags
CREATE TABLE IF NOT EXISTS data_log_tags (
    data_log_id TEXT NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (data_log_id, tag_id),
    FOREIGN KEY (data_log_id) REFERENCES data_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Images table for storing image paths associated with data logs
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_log_id TEXT NOT NULL,
    path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (data_log_id) REFERENCES data_logs(id) ON DELETE CASCADE
);

-- Links table for storing external links associated with data logs
CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_log_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (data_log_id) REFERENCES data_logs(id) ON DELETE CASCADE
);

-- Memory nodes table for storing 3D visualization data
CREATE TABLE IF NOT EXISTS memory_nodes (
    id TEXT PRIMARY KEY,
    data_log_id TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    z REAL NOT NULL,
    glitch_intensity REAL NOT NULL DEFAULT 0,
    pulse_phase REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME,
    FOREIGN KEY (data_log_id) REFERENCES data_logs(id) ON DELETE CASCADE
);

-- Node connections table for storing relationships between memory nodes
CREATE TABLE IF NOT EXISTS node_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_node_id TEXT NOT NULL,
    to_node_id TEXT NOT NULL,
    glitch_offset REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_node_id) REFERENCES memory_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (to_node_id) REFERENCES memory_nodes(id) ON DELETE CASCADE,
    UNIQUE(from_node_id, to_node_id)
);

-- Connection tags junction table to track which tags create connections
CREATE TABLE IF NOT EXISTS connection_shared_tags (
    connection_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (connection_id, tag_id),
    FOREIGN KEY (connection_id) REFERENCES node_connections(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_neuron_clusters_name ON neuron_clusters(name);
CREATE INDEX IF NOT EXISTS idx_data_logs_cluster_id ON data_logs(cluster_id);
CREATE INDEX IF NOT EXISTS idx_data_logs_timestamp ON data_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_data_log_tags_data_log_id ON data_log_tags(data_log_id);
CREATE INDEX IF NOT EXISTS idx_data_log_tags_tag_id ON data_log_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_images_data_log_id ON images(data_log_id);
CREATE INDEX IF NOT EXISTS idx_links_data_log_id ON links(data_log_id);
CREATE INDEX IF NOT EXISTS idx_memory_nodes_data_log_id ON memory_nodes(data_log_id);
CREATE INDEX IF NOT EXISTS idx_node_connections_from_node_id ON node_connections(from_node_id);
CREATE INDEX IF NOT EXISTS idx_node_connections_to_node_id ON node_connections(to_node_id);

-- Triggers to automatically update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_neuron_clusters_updated_at 
    AFTER UPDATE ON neuron_clusters
    BEGIN
        UPDATE neuron_clusters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_neuron_clusters_modified_at 
  AFTER UPDATE ON neuron_clusters
  BEGIN
    UPDATE neuron_clusters SET modified_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS set_neuron_clusters_modified_at_on_insert
  AFTER INSERT ON neuron_clusters
  BEGIN
    UPDATE neuron_clusters
    SET modified_at = COALESCE(NEW.modified_at, NEW.created_at, CURRENT_TIMESTAMP)
    WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_data_logs_updated_at 
    AFTER UPDATE ON data_logs
    BEGIN
        UPDATE data_logs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_data_logs_modified_at 
  AFTER UPDATE ON data_logs
  BEGIN
    UPDATE data_logs SET modified_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS set_data_logs_modified_at_on_insert
  AFTER INSERT ON data_logs
  BEGIN
    UPDATE data_logs
    SET modified_at = COALESCE(NEW.modified_at, NEW.created_at, CURRENT_TIMESTAMP)
    WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_memory_nodes_updated_at 
    AFTER UPDATE ON memory_nodes
    BEGIN
        UPDATE memory_nodes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_memory_nodes_modified_at 
  AFTER UPDATE ON memory_nodes
  BEGIN
    UPDATE memory_nodes SET modified_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS set_memory_nodes_modified_at_on_insert
  AFTER INSERT ON memory_nodes
  BEGIN
    UPDATE memory_nodes
    SET modified_at = COALESCE(NEW.modified_at, NEW.created_at, CURRENT_TIMESTAMP)
    WHERE id = NEW.id;
  END;
