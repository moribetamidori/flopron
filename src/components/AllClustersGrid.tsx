import React, { useState, useEffect, useRef } from "react";
import {
  DatabaseNeuronCluster,
  MemoryNodeWithRelations,
  ConnectionWithSharedTags,
} from "../database/types";
import { DatabaseService } from "../database/databaseService";
import { MemoryNode, Connection } from "../hooks/useDatabaseMemoryTree";

interface AllClustersGridProps {
  clusters: DatabaseNeuronCluster[];
  onClusterSelect: (clusterId: string) => void;
  onBack: () => void;
}

interface ClusterPreviewData {
  clusterId: string;
  nodes: MemoryNode[];
  connections: Connection[];
}

export const AllClustersGrid: React.FC<AllClustersGridProps> = ({
  clusters,
  onClusterSelect,
  onBack,
}) => {
  const [viewMode, setViewMode] = useState<"default" | "preview">("default");
  const [clusterPreviews, setClusterPreviews] = useState<ClusterPreviewData[]>(
    []
  );
  const [time, setTime] = useState(0);
  const [hoveredCluster, setHoveredCluster] = useState<string | null>(null);
  const databaseService = DatabaseService.getInstance();
  const animationRef = useRef<number | null>(null);

  // Animation loop for pulsing effects
  useEffect(() => {
    const animate = () => {
      setTime((prev) => prev + 0.016);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Load cluster preview data when in preview mode
  useEffect(() => {
    if (viewMode === "preview") {
      loadClusterPreviews();
    }
  }, [viewMode, clusters]);

  // Update canvas animations when time changes in preview mode
  useEffect(() => {
    if (viewMode === "preview" && clusterPreviews.length > 0) {
      const canvases = document.querySelectorAll("canvas");
      canvases.forEach((canvas, index) => {
        const cluster = clusters[index];
        if (cluster) {
          const clusterData = clusterPreviews.find(
            (c) => c.clusterId === cluster.id
          );
          const color = getClusterColor(cluster.id);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = 200;
            canvas.height = 160;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (clusterData && clusterData.nodes.length > 0) {
              try {
                renderClusterPreview(
                  ctx,
                  clusterData,
                  canvas.width / 2,
                  canvas.height / 2,
                  150,
                  color
                );
              } catch (error) {
                console.error("Error rendering cluster preview:", error);
                // Draw a fallback circle
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(100, 80, 30, 0, Math.PI * 2);
                ctx.fill();
              }
            } else {
              // Draw a placeholder for empty clusters
              ctx.fillStyle = color;
              ctx.globalAlpha = 0.3;
              ctx.beginPath();
              ctx.arc(100, 80, 25, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          }
        }
      });
    }
  }, [time, viewMode, clusterPreviews, clusters]);

  // Convert database memory node to UI memory node format
  const convertToUINode = (dbNode: MemoryNodeWithRelations): MemoryNode => {
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
  };

  // Convert database connection to UI connection format
  const convertToUIConnection = (
    dbConnection: ConnectionWithSharedTags
  ): Connection => {
    return {
      from: dbConnection.from_node_id,
      to: dbConnection.to_node_id,
      glitchOffset: dbConnection.glitch_offset,
      sharedTags: dbConnection.sharedTags,
    };
  };

  const loadClusterPreviews = async () => {
    try {
      const previews: ClusterPreviewData[] = [];

      for (const cluster of clusters) {
        const dataLogs = await databaseService.getDataLogsByCluster(cluster.id);

        const clusterNodes: MemoryNode[] = [];
        const allConnections: Connection[] = [];

        // Get all memory nodes for this cluster
        for (const dataLog of dataLogs) {
          const nodes = await databaseService.getMemoryNodesByDataLogId(
            dataLog.id
          );
          clusterNodes.push(...nodes.map(convertToUINode));
        }

        // Get all connections between nodes in this cluster
        const connections = await databaseService.getAllConnections();
        const clusterNodeIds = clusterNodes.map((node) => node.id);

        // Filter connections that are between nodes in this cluster
        const clusterConnections = connections
          .filter(
            (conn) =>
              clusterNodeIds.includes(conn.from_node_id) &&
              clusterNodeIds.includes(conn.to_node_id)
          )
          .map(convertToUIConnection);

        // Also generate connections based on shared tags (like the main app does)
        const sharedTagConnections: Connection[] = [];
        for (let i = 0; i < clusterNodes.length; i++) {
          for (let j = i + 1; j < clusterNodes.length; j++) {
            const nodeA = clusterNodes[i];
            const nodeB = clusterNodes[j];

            if (nodeA.dataLog?.tags && nodeB.dataLog?.tags) {
              // Find shared tags
              const sharedTags = nodeA.dataLog.tags.filter((tag) =>
                nodeB.dataLog!.tags.includes(tag)
              );

              if (sharedTags.length > 0) {
                // Check if this connection already exists
                const existingConnection = clusterConnections.find(
                  (conn) =>
                    (conn.from === nodeA.id && conn.to === nodeB.id) ||
                    (conn.from === nodeB.id && conn.to === nodeA.id)
                );

                if (!existingConnection) {
                  sharedTagConnections.push({
                    from: nodeA.id,
                    to: nodeB.id,
                    glitchOffset: Math.random() * 10,
                    sharedTags: sharedTags,
                  });
                }
              }
            }
          }
        }

        // Combine existing connections with shared tag connections
        const allClusterConnections = [
          ...clusterConnections,
          ...sharedTagConnections,
        ];

        previews.push({
          clusterId: cluster.id,
          nodes: clusterNodes,
          connections: allClusterConnections,
        });
      }

      setClusterPreviews(previews);
    } catch (error) {
      console.error("Failed to load cluster previews:", error);
    }
  };

  // Generate a color for each cluster
  const getClusterColor = (clusterId: string): string => {
    // Get the cluster to find its color
    const cluster = clusters.find((c) => c.id === clusterId);
    if (cluster?.color) {
      return cluster.color;
    }

    // Fallback to predefined colors
    const colors = [
      "#00ffff", // Cyan
      "#ff00ff", // Magenta
      "#ffff00", // Yellow
      "#00ff00", // Green
      "#ff8800", // Orange
      "#8800ff", // Purple
      "#ff0088", // Pink
      "#0088ff", // Blue
      "#88ff00", // Lime
      "#ff4400", // Red-Orange
    ];

    const index =
      clusterId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  // 3D rendering functions for preview mode
  const rotateX = (x: number, y: number, z: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x,
      y: y * cos - z * sin,
      z: y * sin + z * cos,
    };
  };

  const rotateY = (x: number, y: number, z: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x * cos + z * sin,
      y: y,
      z: -x * sin + z * cos,
    };
  };

  const project3D = (
    x: number,
    y: number,
    z: number,
    centerX: number,
    centerY: number,
    scale: number
  ) => {
    const distance = 200;
    const projectedScale = distance / (distance + z);
    return {
      x: x * projectedScale * scale + centerX,
      y: y * projectedScale * scale + centerY,
    };
  };

  const renderClusterPreview = (
    ctx: CanvasRenderingContext2D,
    clusterData: ClusterPreviewData,
    centerX: number,
    centerY: number,
    size: number,
    clusterColor: string
  ) => {
    if (clusterData.nodes.length === 0) return;

    // Auto-rotation for the cluster
    const rotationSpeed = 0.5;
    const rotationX = time * rotationSpeed * 0.5;
    const rotationY = time * rotationSpeed;

    // Calculate bounds to center the cluster
    const bounds = {
      minX: Math.min(...clusterData.nodes.map((n) => n.x)),
      maxX: Math.max(...clusterData.nodes.map((n) => n.x)),
      minY: Math.min(...clusterData.nodes.map((n) => n.y)),
      maxY: Math.max(...clusterData.nodes.map((n) => n.y)),
      minZ: Math.min(...clusterData.nodes.map((n) => n.z)),
      maxZ: Math.max(...clusterData.nodes.map((n) => n.z)),
    };

    const clusterWidth = bounds.maxX - bounds.minX;
    const clusterHeight = bounds.maxY - bounds.minY;
    const clusterDepth = bounds.maxZ - bounds.minZ;
    const maxDimension = Math.max(clusterWidth, clusterHeight, clusterDepth);

    const scale = maxDimension > 0 ? (size * 0.3) / maxDimension : 1;

    // Sort nodes by Z-depth for proper 3D rendering
    const sortedNodes = [...clusterData.nodes].sort((a, b) => {
      let rotatedA = rotateX(a.x, a.y, a.z, rotationX);
      rotatedA = rotateY(rotatedA.x, rotatedA.y, rotatedA.z, rotationY);
      let rotatedB = rotateX(b.x, b.y, b.z, rotationX);
      rotatedB = rotateY(rotatedB.x, rotatedB.y, rotatedB.z, rotationY);
      return rotatedB.z - rotatedA.z;
    });

    // Draw connections
    ctx.strokeStyle = clusterColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;

    clusterData.connections.forEach((connection) => {
      const fromNode = sortedNodes.find((n) => n.id === connection.from);
      const toNode = sortedNodes.find((n) => n.id === connection.to);

      if (!fromNode || !toNode) return;

      // Apply 3D rotation
      let rotatedFrom = rotateX(fromNode.x, fromNode.y, fromNode.z, rotationX);
      rotatedFrom = rotateY(
        rotatedFrom.x,
        rotatedFrom.y,
        rotatedFrom.z,
        rotationY
      );
      let rotatedTo = rotateX(toNode.x, toNode.y, toNode.z, rotationX);
      rotatedTo = rotateY(rotatedTo.x, rotatedTo.y, rotatedTo.z, rotationY);

      // Project to 2D
      const projectedFrom = project3D(
        rotatedFrom.x - bounds.minX,
        rotatedFrom.y - bounds.minY,
        rotatedFrom.z - bounds.minZ,
        centerX,
        centerY,
        scale
      );
      const projectedTo = project3D(
        rotatedTo.x - bounds.minX,
        rotatedTo.y - bounds.minY,
        rotatedTo.z - bounds.minZ,
        centerX,
        centerY,
        scale
      );

      // Draw connection line
      ctx.beginPath();
      ctx.moveTo(projectedFrom.x, projectedFrom.y);
      ctx.lineTo(projectedTo.x, projectedTo.y);
      ctx.stroke();
    });

    // Draw nodes
    ctx.globalAlpha = 1;
    sortedNodes.forEach((node) => {
      // Apply 3D rotation
      let rotated = rotateX(node.x, node.y, node.z, rotationX);
      rotated = rotateY(rotated.x, rotated.y, rotated.z, rotationY);

      // Project to 2D
      const projected = project3D(
        rotated.x - bounds.minX,
        rotated.y - bounds.minY,
        rotated.z - bounds.minZ,
        centerX,
        centerY,
        scale
      );

      // Pulsing animation
      const pulseIntensity = Math.sin(time * 3 + node.pulsePhase) * 0.3 + 0.7;
      const nodeSize = 4 * pulseIntensity;

      // Draw node
      ctx.fillStyle = clusterColor;
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, nodeSize, 0, Math.PI * 2);
      ctx.fill();

      // Glitch effect
      const glitchX = Math.sin(time * 20 + node.glitchIntensity * 10) * 1;
      const glitchY = Math.cos(time * 15 + node.glitchIntensity * 8) * 1;

      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * pulseIntensity})`;
      ctx.beginPath();
      ctx.arc(
        projected.x + glitchX,
        projected.y + glitchY,
        nodeSize * 0.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  };

  // Load node counts for default mode
  const [nodeCounts, setNodeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadNodeCounts = async () => {
      const counts: Record<string, number> = {};
      for (const cluster of clusters) {
        try {
          const dataLogs = await databaseService.getDataLogsByCluster(
            cluster.id
          );
          let totalNodes = 0;
          for (const dataLog of dataLogs) {
            const nodes = await databaseService.getMemoryNodesByDataLogId(
              dataLog.id
            );
            totalNodes += nodes.length;
          }
          counts[cluster.id] = totalNodes;
        } catch (error) {
          console.error(
            `Error loading node count for cluster ${cluster.name}:`,
            error
          );
          counts[cluster.id] = 0;
        }
      }
      setNodeCounts(counts);
    };

    loadNodeCounts();
  }, [clusters]);

  const renderDefaultMode = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
        {clusters.map((cluster) => {
          const color = getClusterColor(cluster.id);
          const isHovered = hoveredCluster === cluster.id;
          const nodeCount = nodeCounts[cluster.id] || 0;

          return (
            <div
              key={cluster.id}
              className={`relative group cursor-pointer transition-all duration-300 ${
                isHovered ? "scale-105" : "scale-100"
              }`}
              onClick={() => onClusterSelect(cluster.id)}
              onMouseEnter={() => setHoveredCluster(cluster.id)}
              onMouseLeave={() => setHoveredCluster(null)}
            >
              {/* Cluster card */}
              <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-6 h-64 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background glow */}
                <div
                  className="absolute inset-0 opacity-20 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at center, ${color}40 0%, transparent 70%)`,
                  }}
                />

                {/* Pulsing dot */}
                <div className="relative mb-4">
                  <div
                    className="w-8 h-8 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 20px ${color}80`,
                      animation: "pulse 2s infinite",
                    }}
                  />
                  {/* Pulsing ring */}
                  <div
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                      borderColor: color,
                      animation: "customPulse 3s ease-in-out infinite",
                    }}
                  />
                </div>

                {/* Cluster name */}
                <h3 className="text-cyan-400 font-mono text-center text-sm font-bold mb-2">
                  {cluster.name}
                </h3>

                {/* Node count */}
                <p className="text-cyan-400/60 text-xs text-center mb-1">
                  {nodeCount} nodes
                </p>

                {/* Cluster info */}
                <p className="text-cyan-400/60 text-xs text-center">
                  {cluster.description || "No description"}
                </p>

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 bg-cyan-400/10 rounded-lg transition-opacity duration-300 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPreviewMode = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
        {clusters.map((cluster, index) => {
          const color = getClusterColor(cluster.id);
          const isHovered = hoveredCluster === cluster.id;
          const clusterData = clusterPreviews.find(
            (c) => c.clusterId === cluster.id
          );

          return (
            <div
              key={cluster.id}
              className={`relative group cursor-pointer transition-all duration-300 ${
                isHovered ? "scale-105" : "scale-100"
              }`}
              onClick={() => onClusterSelect(cluster.id)}
              onMouseEnter={() => setHoveredCluster(cluster.id)}
              onMouseLeave={() => setHoveredCluster(null)}
            >
              {/* Cluster card */}
              <div className="bg-black/50 border border-cyan-400/30 rounded-lg p-6 h-64 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Canvas for 3D preview */}
                <div className="border-2 border-cyan-400/30 rounded-lg p-2 mb-4 bg-black/20">
                  <canvas
                    ref={(canvas) => {
                      if (canvas) {
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                          canvas.width = 240;
                          canvas.height = 160;
                          ctx.clearRect(0, 0, canvas.width, canvas.height);

                          if (clusterData && clusterData.nodes.length > 0) {
                            try {
                              renderClusterPreview(
                                ctx,
                                clusterData,
                                canvas.width / 2,
                                canvas.height / 2,
                                150,
                                color
                              );
                            } catch (error) {
                              console.error(
                                "Error rendering cluster preview:",
                                error
                              );
                              // Draw a fallback circle
                              ctx.fillStyle = color;
                              ctx.beginPath();
                              ctx.arc(100, 80, 30, 0, Math.PI * 2);
                              ctx.fill();
                            }
                          } else {
                            // Draw a placeholder for empty clusters
                            ctx.fillStyle = color;
                            ctx.globalAlpha = 0.3;
                            ctx.beginPath();
                            ctx.arc(100, 80, 25, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.globalAlpha = 1;
                          }
                        }
                      }
                    }}
                    className="w-[216px] h-40"
                  />
                </div>

                {/* Cluster name */}
                <h3 className="text-cyan-400 font-mono text-center text-sm font-bold mb-2">
                  {cluster.name}
                </h3>

                {/* Node count */}
                <p className="text-cyan-400/60 text-xs text-center">
                  {clusterData?.nodes.length || 0} nodes
                </p>

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 bg-cyan-400/10 rounded-lg transition-opacity duration-300 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-cyan-400">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-cyan-400/30">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-black/50 border border-cyan-400/50 rounded text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400 transition-all duration-200"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-mono font-bold">All Clusters</h1>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">View Mode:</span>
          <div className="flex bg-black/50 border border-cyan-400/50 rounded">
            <button
              onClick={() => setViewMode("default")}
              className={`px-3 py-1 text-sm transition-all duration-200 ${
                viewMode === "default"
                  ? "bg-cyan-400/20 text-cyan-300"
                  : "text-cyan-400 hover:bg-cyan-400/10"
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1 text-sm transition-all duration-200 ${
                viewMode === "preview"
                  ? "bg-cyan-400/20 text-cyan-300"
                  : "text-cyan-400 hover:bg-cyan-400/10"
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Grid content */}
      <div className="flex-1 overflow-auto">
        {viewMode === "default" ? renderDefaultMode() : renderPreviewMode()}
      </div>

      {/* Empty state */}
      {clusters.length === 0 && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-cyan-400/60 text-lg mb-4">No clusters found</p>
            <p className="text-cyan-400/40 text-sm">
              Create your first cluster to get started
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
