import { useEffect, useState, useCallback } from "react";
import { DatabaseService } from "../database/databaseService";
import {
  DataLogWithRelations,
  MemoryNodeWithRelations,
  ConnectionWithSharedTags,
} from "../database/types";

export interface MemoryNode {
  id: string;
  x: number;
  y: number;
  z: number;
  connections: string[];
  glitchIntensity: number;
  pulsePhase: number;
  dataLog?: DataLogWithRelations | null;
}

export interface Connection {
  from: string;
  to: string;
  glitchOffset: number;
  sharedTags: string[]; // Track which tags are shared
}

export const useDatabaseMemoryTree = () => {
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const databaseService = DatabaseService.getInstance();

  // Convert database memory node to UI memory node format
  const convertToUINode = useCallback(
    (dbNode: MemoryNodeWithRelations): MemoryNode => {
      return {
        id: dbNode.id,
        x: dbNode.x,
        y: dbNode.y,
        z: dbNode.z,
        connections: dbNode.connections,
        glitchIntensity: dbNode.glitch_intensity,
        pulsePhase: dbNode.pulse_phase,
        dataLog: dbNode.dataLog,
      };
    },
    []
  );

  // Convert database connection to UI connection format
  const convertToUIConnection = useCallback(
    (dbConnection: ConnectionWithSharedTags): Connection => {
      return {
        from: dbConnection.from_node_id,
        to: dbConnection.to_node_id,
        glitchOffset: dbConnection.glitch_offset,
        sharedTags: dbConnection.sharedTags,
      };
    },
    []
  );

  // Load data from database
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load memory nodes with their data logs
      const dbNodes = await databaseService.getAllMemoryNodes();
      const uiNodes = dbNodes.map(convertToUINode);

      // Load connections
      const dbConnections = await databaseService.getAllConnections();
      const uiConnections = dbConnections.map(convertToUIConnection);

      setNodes(uiNodes);
      setConnections(uiConnections);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load data from database";
      setError(errorMessage);
      console.error("Error loading memory tree data:", err);
    } finally {
      setLoading(false);
    }
  }, [databaseService, convertToUINode, convertToUIConnection]);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Function to add a new node and automatically generate connections
  const addNode = useCallback(
    async (dataLog: DataLogWithRelations): Promise<void> => {
      try {
        // Create memory node input
        const memoryNodeInput =
          databaseService.createMemoryNodeFromDataLog(dataLog);

        // Create the memory node in database
        const dbNode = await databaseService.createMemoryNode(memoryNodeInput);
        const newUINode = convertToUINode(dbNode);

        // Generate connections with existing nodes based on shared tags
        const existingNodes = await databaseService.getAllMemoryNodes();
        const newConnections: Connection[] = [];

        for (const existingNode of existingNodes) {
          if (
            existingNode.id === dbNode.id ||
            !existingNode.dataLog?.tags ||
            !dataLog.tags
          )
            continue;

          // Find shared tags
          const sharedTags = dataLog.tags.filter((tag) =>
            existingNode.dataLog!.tags.includes(tag)
          );

          if (sharedTags.length > 0) {
            // Create connection in database
            const dbConnection = await databaseService.createConnection(
              dbNode.id,
              existingNode.id,
              sharedTags,
              Math.random() * 10
            );

            const uiConnection = convertToUIConnection(dbConnection);
            newConnections.push(uiConnection);

            // Update node connections lists
            if (!newUINode.connections.includes(existingNode.id)) {
              newUINode.connections.push(existingNode.id);
            }
          }
        }

        // Update UI state
        setNodes((prevNodes) => {
          const updatedNodes = [...prevNodes, newUINode];

          // Update existing nodes' connection lists
          return updatedNodes.map((node) => {
            const additionalConnections = newConnections
              .filter((conn) => conn.from === node.id || conn.to === node.id)
              .map((conn) => (conn.from === node.id ? conn.to : conn.from))
              .filter((connId) => !node.connections.includes(connId));

            if (additionalConnections.length > 0) {
              return {
                ...node,
                connections: [...node.connections, ...additionalConnections],
              };
            }
            return node;
          });
        });

        setConnections((prevConnections) => [
          ...prevConnections,
          ...newConnections,
        ]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add node";
        setError(errorMessage);
        console.error("Error adding node:", err);
        throw err;
      }
    },
    [databaseService, convertToUINode, convertToUIConnection]
  );

  // Function to update a node's position or properties
  const updateNode = useCallback(
    async (
      nodeId: string,
      updates: {
        x?: number;
        y?: number;
        z?: number;
        glitchIntensity?: number;
        pulsePhase?: number;
      }
    ): Promise<void> => {
      try {
        // Update in database
        const updatedDbNode = await databaseService.updateMemoryNode(nodeId, {
          x: updates.x,
          y: updates.y,
          z: updates.z,
          glitch_intensity: updates.glitchIntensity,
          pulse_phase: updates.pulsePhase,
        });

        if (updatedDbNode) {
          const updatedUINode = convertToUINode(updatedDbNode);

          // Update UI state
          setNodes((prevNodes) =>
            prevNodes.map((node) => (node.id === nodeId ? updatedUINode : node))
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update node";
        setError(errorMessage);
        console.error("Error updating node:", err);
        throw err;
      }
    },
    [databaseService, convertToUINode]
  );

  // Function to delete a node
  const deleteNode = useCallback(
    async (nodeId: string): Promise<void> => {
      try {
        // Delete from database (this will cascade delete connections)
        const success = await databaseService.deleteMemoryNode(nodeId);

        if (success) {
          // Update UI state
          setNodes((prevNodes) =>
            prevNodes.filter((node) => node.id !== nodeId)
          );
          setConnections((prevConnections) =>
            prevConnections.filter(
              (conn) => conn.from !== nodeId && conn.to !== nodeId
            )
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete node";
        setError(errorMessage);
        console.error("Error deleting node:", err);
        throw err;
      }
    },
    [databaseService]
  );

  // Function to search nodes
  const searchNodes = useCallback(
    async (query: string): Promise<MemoryNode[]> => {
      try {
        const searchResults = await databaseService.searchDataLogs(query);

        // Convert search results to nodes
        const searchNodes: MemoryNode[] = [];

        for (const dataLog of searchResults) {
          const existingNode = nodes.find(
            (node) => node.dataLog?.id === dataLog.id
          );
          if (existingNode) {
            searchNodes.push(existingNode);
          }
        }

        return searchNodes;
      } catch (err) {
        console.error("Error searching nodes:", err);
        return [];
      }
    },
    [databaseService, nodes]
  );

  // Function to get all unique tags
  const getAllTags = useCallback(async (): Promise<string[]> => {
    try {
      return await databaseService.getAllTags();
    } catch (err) {
      console.error("Error getting tags:", err);
      return [];
    }
  }, [databaseService]);

  // Function to refresh data (useful after external changes)
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    nodes,
    connections,
    loading,
    error,
    addNode,
    updateNode,
    deleteNode,
    searchNodes,
    getAllTags,
    refreshData,
  };
};
