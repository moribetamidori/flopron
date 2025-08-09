import { useEffect, useState } from "react";
import { dataLogs, DataLog } from "../data";

export interface MemoryNode {
  id: string;
  x: number;
  y: number;
  z: number;
  connections: string[];
  glitchIntensity: number;
  pulsePhase: number;
  dataLog?: DataLog;
}

export interface Connection {
  from: string;
  to: string;
  glitchOffset: number;
  sharedTags: string[]; // Track which tags are shared
}

export const useMemoryTree = () => {
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  // Function to generate connections based on shared tags
  const generateConnections = (nodeList: MemoryNode[]) => {
    const newConnections: Connection[] = [];
    const connectionSet = new Set<string>(); // Prevent duplicate connections

    nodeList.forEach((node, index) => {
      if (!node.dataLog?.tags) return;

      // Find nodes with shared tags
      nodeList.forEach((otherNode, otherIndex) => {
        if (index === otherIndex || !otherNode.dataLog?.tags) return;

        // Find shared tags
        const sharedTags =
          node.dataLog?.tags?.filter((tag) =>
            otherNode.dataLog?.tags?.includes(tag)
          ) || [];

        // Create connection if there are shared tags
        if (sharedTags.length > 0) {
          const connectionKey = [node.id, otherNode.id].sort().join("-");

          // Prevent duplicate connections
          if (!connectionSet.has(connectionKey)) {
            connectionSet.add(connectionKey);

            newConnections.push({
              from: node.id,
              to: otherNode.id,
              glitchOffset: Math.random() * 10,
              sharedTags,
            });

            // Add to node's connections list
            if (!node.connections.includes(otherNode.id)) {
              node.connections.push(otherNode.id);
            }
            if (!otherNode.connections.includes(node.id)) {
              otherNode.connections.push(node.id);
            }
          }
        }
      });
    });

    return newConnections;
  };

  useEffect(() => {
    const generateTree = () => {
      const newNodes: MemoryNode[] = [];
      const connectionSet = new Set<string>(); // Prevent duplicate connections

      // Cluster parameters
      const centerX = 0;
      const centerY = 0;
      const centerZ = 0;
      const clusterRadius = 400;

      // Create nodes from data logs
      dataLogs.forEach((dataLog, index) => {
        // Determine node type based on index
        let nodeType: "cluster" | "spiral" | "outlier";
        let distributionParams: {
          x: number;
          y: number;
          z: number;
          offset: number;
        };

        if (index < 35) {
          // Cluster nodes (first 35)
          nodeType = "cluster";
          const radius = Math.random() * clusterRadius;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          distributionParams = {
            x: centerX + radius * Math.sin(phi) * Math.cos(theta),
            y: centerY + radius * Math.cos(phi),
            z: centerZ + radius * Math.sin(phi) * Math.sin(theta),
            offset: 50,
          };
        } else if (index < 43) {
          // Spiral nodes (next 8)
          nodeType = "spiral";
          const spiralIndex = index - 35;
          const angle = (spiralIndex / 7) * Math.PI * 4;
          const radius = 200 + spiralIndex * 30;
          distributionParams = {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            z: centerZ + (Math.random() - 0.5) * 100,
            offset: 40,
          };
        } else {
          // Outlier nodes (last 5)
          nodeType = "outlier";
          const angle = Math.random() * Math.PI * 2;
          const radius = clusterRadius * 0.8 + Math.random() * 200;
          distributionParams = {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            z: centerZ + (Math.random() - 0.5) * 150,
            offset: 60,
          };
        }

        newNodes.push({
          id: dataLog.id, // Use the actual ID from data log
          x:
            distributionParams.x +
            (Math.random() - 0.5) * distributionParams.offset,
          y:
            distributionParams.y +
            (Math.random() - 0.5) * distributionParams.offset,
          z: distributionParams.z,
          connections: [],
          glitchIntensity: Math.random(),
          pulsePhase: Math.random() * Math.PI * 2,
          dataLog,
        });
      });

      // Create tag-based connections using the helper function
      const newConnections = generateConnections(newNodes);

      setNodes(newNodes);
      setConnections(newConnections);
    };

    generateTree();
  }, []);

  // Function to add a new node and automatically generate connections
  const addNode = (dataLog: DataLog) => {
    const newNode: MemoryNode = {
      id: dataLog.id,
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 800,
      z: (Math.random() - 0.5) * 400,
      connections: [],
      glitchIntensity: Math.random(),
      pulsePhase: Math.random() * Math.PI * 2,
      dataLog,
    };

    const updatedNodes = [...nodes, newNode];
    const updatedConnections = generateConnections(updatedNodes);

    setNodes(updatedNodes);
    setConnections(updatedConnections);
  };

  return { nodes, connections, addNode };
};
