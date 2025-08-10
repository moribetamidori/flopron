// Database types for PKM application
// These types match the database schema and extend the original data types

export interface DatabaseNeuronCluster {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: Date;
  updated_at: Date;
  modified_at: Date;
}

export interface DatabaseDataLog {
  id: string;
  title: string;
  timestamp: Date;
  content: string;
  cluster_id?: string;
  created_at: Date;
  updated_at: Date;
  modified_at: Date;
}

export interface DatabaseTag {
  id: number;
  name: string;
  created_at: Date;
}

export interface DatabaseImage {
  id: number;
  data_log_id: string;
  path: string;
  created_at: Date;
}

export interface DatabaseLink {
  id: number;
  data_log_id: string;
  url: string;
  title?: string;
  created_at: Date;
}

export interface DatabaseMemoryNode {
  id: string;
  data_log_id: string;
  x: number;
  y: number;
  z: number;
  glitch_intensity: number;
  pulse_phase: number;
  created_at: Date;
  updated_at: Date;
  modified_at: Date;
}

export interface DatabaseNodeConnection {
  id: number;
  from_node_id: string;
  to_node_id: string;
  glitch_offset: number;
  created_at: Date;
}

// Extended types that include related data (similar to original DataLog interface)
export interface DataLogWithRelations extends DatabaseDataLog {
  tags: string[];
  images: string[];
  links: string[];
  cluster?: DatabaseNeuronCluster | null;
}

export interface MemoryNodeWithRelations extends DatabaseMemoryNode {
  connections: string[];
  dataLog?: DataLogWithRelations | null;
}

export interface ConnectionWithSharedTags extends DatabaseNodeConnection {
  sharedTags: string[];
}

// Input types for creating new records
export interface CreateNeuronClusterInput {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateNeuronClusterInput {
  name?: string;
  description?: string;
  color?: string;
}

export interface CreateDataLogInput {
  id: string;
  title: string;
  timestamp: Date;
  content: string;
  tags: string[];
  images: string[];
  links: string[];
  cluster_id?: string;
}

export interface UpdateDataLogInput {
  title?: string;
  timestamp?: Date;
  content?: string;
  tags?: string[];
  images?: string[];
  links?: string[];
  cluster_id?: string;
}

export interface CreateMemoryNodeInput {
  id: string;
  data_log_id: string;
  x: number;
  y: number;
  z: number;
  glitch_intensity?: number;
  pulse_phase?: number;
}

export interface UpdateMemoryNodeInput {
  x?: number;
  y?: number;
  z?: number;
  glitch_intensity?: number;
  pulse_phase?: number;
}
