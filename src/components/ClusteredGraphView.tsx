import React, { useMemo, useState, useCallback } from "react";
import { MemoryNode, Connection } from "../hooks/useDatabaseMemoryTree";

interface Cluster {
  id: string;
  nodes: MemoryNode[];
  center: { x: number; y: number; z: number };
  tags: string[];
  strength: number;
  color: string;
}

interface ClusteredGraphViewProps {
  nodes: MemoryNode[];
  connections: Connection[];
  hoveredNode: string | null;
  selectedNode: MemoryNode | null;
  sidebarCollapsed: boolean;
  imageCache: Map<string, HTMLImageElement>;
  time: number;
  rotationX: number;
  rotationY: number;
  zoom: number;
  selectedClusterColor?: string;
  onNodeClick: (node: MemoryNode) => void;
  onNodeHover: (nodeId: string | null) => void;
  rotateX: (
    x: number,
    y: number,
    z: number,
    angle: number
  ) => { x: number; y: number; z: number };
  rotateY: (
    x: number,
    y: number,
    z: number,
    angle: number
  ) => { x: number; y: number; z: number };
  project3D: (
    x: number,
    y: number,
    z: number,
    sidebarCollapsed: boolean
  ) => { x: number; y: number };
}

// Community detection algorithm (simplified Louvain)
const detectCommunities = (
  nodes: MemoryNode[],
  connections: Connection[]
): Cluster[] => {
  const clusters: Cluster[] = [];
  const nodeToCluster = new Map<string, number>();

  // Initialize each node as its own cluster
  nodes.forEach((node, index) => {
    nodeToCluster.set(node.id, index);
    clusters.push({
      id: `cluster-${index}`,
      nodes: [node],
      center: { x: node.x, y: node.y, z: node.z },
      tags: node.dataLog?.tags || [],
      strength: 0,
      color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
    });
  });

  // Merge clusters based on strong connections
  let merged = true;
  while (merged) {
    merged = false;

    for (const connection of connections) {
      const clusterA = nodeToCluster.get(connection.from);
      const clusterB = nodeToCluster.get(connection.to);

      if (
        clusterA !== undefined &&
        clusterB !== undefined &&
        clusterA !== clusterB
      ) {
        const strength = connection.sharedTags.length;

        // Only merge if connection is strong (3+ shared tags)
        if (strength >= 3) {
          // Merge cluster B into cluster A
          const clusterAObj = clusters[clusterA];
          const clusterBObj = clusters[clusterB];

          clusterAObj.nodes.push(...clusterBObj.nodes);
          clusterAObj.tags = [
            ...new Set([...clusterAObj.tags, ...clusterBObj.tags]),
          ];
          clusterAObj.strength = Math.max(
            clusterAObj.strength,
            clusterBObj.strength,
            strength
          );

          // Update cluster centers
          const totalX = clusterAObj.nodes.reduce((sum, n) => sum + n.x, 0);
          const totalY = clusterAObj.nodes.reduce((sum, n) => sum + n.y, 0);
          const totalZ = clusterAObj.nodes.reduce((sum, n) => sum + n.z, 0);
          clusterAObj.center = {
            x: totalX / clusterAObj.nodes.length,
            y: totalY / clusterAObj.nodes.length,
            z: totalZ / clusterAObj.nodes.length,
          };

          // Update node mappings
          clusterBObj.nodes.forEach((node) => {
            nodeToCluster.set(node.id, clusterA);
          });

          // Remove cluster B
          clusters.splice(clusterB, 1);

          // Update remaining cluster indices
          for (let i = clusterB; i < clusters.length; i++) {
            clusters[i].nodes.forEach((node) => {
              nodeToCluster.set(node.id, i);
            });
          }

          merged = true;
          break;
        }
      }
    }
  }

  return clusters;
};

// Filter connections by strength
const filterConnections = (
  connections: Connection[],
  minStrength: number
): Connection[] => {
  return connections.filter((conn) => conn.sharedTags.length >= minStrength);
};

export const ClusteredGraphView: React.FC<ClusteredGraphViewProps> = ({
  nodes,
  connections,
  hoveredNode,
  selectedNode,
  sidebarCollapsed,
  imageCache,
  time,
  rotationX,
  rotationY,
  zoom,
  selectedClusterColor,
  onNodeClick,
  onNodeHover,
  rotateX,
  rotateY,
  project3D,
}) => {
  const [connectionStrength, setConnectionStrength] = useState(2);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(
    new Set()
  );
  const [showClusterLabels, setShowClusterLabels] = useState(true);
  const [localZoom, setLocalZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Detect clusters
  const clusters = useMemo(
    () => detectCommunities(nodes, connections),
    [nodes, connections]
  );

  // Filter connections based on strength
  const filteredConnections = useMemo(
    () => filterConnections(connections, connectionStrength),
    [connections, connectionStrength]
  );

  // Handle cluster expansion
  const toggleClusterExpansion = useCallback((clusterId: string) => {
    setExpandedClusters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clusterId)) {
        newSet.delete(clusterId);
      } else {
        newSet.add(clusterId);
      }
      return newSet;
    });
  }, []);

  // Render cluster as a bubble
  const renderCluster = useCallback(
    (cluster: Cluster, ctx: CanvasRenderingContext2D) => {
      const isExpanded = expandedClusters.has(cluster.id);
      const isHovered = cluster.nodes.some((node) => node.id === hoveredNode);

      // Apply 3D rotation to cluster center
      let rotatedCenter = rotateX(
        cluster.center.x,
        cluster.center.y,
        cluster.center.z,
        rotationX
      );
      rotatedCenter = rotateY(
        rotatedCenter.x,
        rotatedCenter.y,
        rotatedCenter.z,
        rotationY
      );

      // Project to 2D
      const projectedCenter = project3D(
        rotatedCenter.x,
        rotatedCenter.y,
        rotatedCenter.z,
        sidebarCollapsed
      );

      // Apply zoom and pan
      const scaledX = projectedCenter.x * localZoom + panX;
      const scaledY = projectedCenter.y * localZoom + panY;

      // Calculate cluster radius based on number of nodes
      const baseRadius = 30;
      const radius = baseRadius + cluster.nodes.length * 5;

      // Draw cluster bubble
      ctx.save();

      // Cluster background with glow effect
      const gradient = ctx.createRadialGradient(
        scaledX,
        scaledY,
        0,
        scaledX,
        scaledY,
        radius * 1.5 * localZoom
      );

      // Convert HSL to RGBA for gradient
      const hslToRgba = (hsl: string, alpha: number) => {
        // Extract HSL values from string like "hsl(0, 70%, 60%)"
        const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return hsl;

        const h = parseInt(match[1]);
        const s = parseInt(match[2]);
        const l = parseInt(match[3]);

        // Convert HSL to RGB
        const hue = h / 360;
        const sat = s / 100;
        const light = l / 100;

        const c = (1 - Math.abs(2 * light - 1)) * sat;
        const x = c * (1 - Math.abs(((hue * 6) % 2) - 1));
        const m = light - c / 2;

        let r = 0,
          g = 0,
          b = 0;

        if (hue < 1 / 6) {
          r = c;
          g = x;
          b = 0;
        } else if (hue < 2 / 6) {
          r = x;
          g = c;
          b = 0;
        } else if (hue < 3 / 6) {
          r = 0;
          g = c;
          b = x;
        } else if (hue < 4 / 6) {
          r = 0;
          g = x;
          b = c;
        } else if (hue < 5 / 6) {
          r = x;
          g = 0;
          b = c;
        } else {
          r = c;
          g = 0;
          b = x;
        }

        return `rgba(${Math.round((r + m) * 255)}, ${Math.round(
          (g + m) * 255
        )}, ${Math.round((b + m) * 255)}, ${alpha})`;
      };

      gradient.addColorStop(0, hslToRgba(cluster.color, 0.4));
      gradient.addColorStop(0.7, hslToRgba(cluster.color, 0.2));
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, radius * 1.5 * localZoom, 0, Math.PI * 2);
      ctx.fill();

      // Cluster border
      ctx.strokeStyle = cluster.color;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.globalAlpha = isHovered ? 0.8 : 0.6;
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, radius * localZoom, 0, Math.PI * 2);
      ctx.stroke();

      // Cluster label
      if (showClusterLabels) {
        ctx.fillStyle = cluster.color;
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.9;

        const label = `${cluster.nodes.length} nodes`;
        ctx.fillText(label, scaledX, scaledY + radius * localZoom + 20);

        // Show main tags
        const mainTags = cluster.tags.slice(0, 3);
        ctx.font = "10px monospace";
        ctx.fillText(
          mainTags.join(", "),
          scaledX,
          scaledY + radius * localZoom + 35
        );
      }

      ctx.restore();

      // Render individual nodes if expanded or if cluster is small
      if (isExpanded || cluster.nodes.length <= 3) {
        cluster.nodes.forEach((node) => {
          renderNode(node, ctx, cluster.color);
        });
      }
    },
    [
      expandedClusters,
      hoveredNode,
      rotationX,
      rotationY,
      sidebarCollapsed,
      showClusterLabels,
      rotateX,
      rotateY,
      project3D,
    ]
  );

  // Render individual node
  const renderNode = useCallback(
    (
      node: MemoryNode,
      ctx: CanvasRenderingContext2D,
      clusterColor?: string
    ) => {
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode?.id === node.id;

      // Apply 3D rotation
      let rotated = rotateX(node.x, node.y, node.z, rotationX);
      rotated = rotateY(rotated.x, rotated.y, rotated.z, rotationY);

      // Project to 2D
      const projected = project3D(
        rotated.x,
        rotated.y,
        rotated.z,
        sidebarCollapsed
      );

      // Apply zoom and pan
      const scaledX = projected.x * localZoom + panX;
      const scaledY = projected.y * localZoom + panY;

      // Glitch effect
      const glitchX = Math.sin(time * 20 + node.glitchIntensity * 10) * 2;
      const glitchY = Math.cos(time * 15 + node.glitchIntensity * 8) * 2;

      ctx.save();

      // Node background
      const nodeRadius = isHovered ? 8 : 6;
      ctx.fillStyle = isSelected ? "#ffff00" : clusterColor || "#00ffff";
      ctx.globalAlpha = isHovered ? 0.9 : 0.7;
      ctx.beginPath();
      ctx.arc(
        scaledX + glitchX * localZoom,
        scaledY + glitchY * localZoom,
        nodeRadius * localZoom,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Node border
      ctx.strokeStyle = isSelected ? "#ffff00" : "#ffffff";
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(
        scaledX + glitchX * localZoom,
        scaledY + glitchY * localZoom,
        nodeRadius * localZoom,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Node label (if hovered or selected)
      if (isHovered || isSelected) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.9;

        const title = node.dataLog?.title || "Untitled";
        const truncatedTitle =
          title.length > 20 ? title.substring(0, 20) + "..." : title;
        ctx.fillText(
          truncatedTitle,
          scaledX + glitchX * localZoom,
          scaledY + glitchY * localZoom - nodeRadius * localZoom - 10
        );
      }

      ctx.restore();
    },
    [
      hoveredNode,
      selectedNode,
      rotationX,
      rotationY,
      sidebarCollapsed,
      time,
      rotateX,
      rotateY,
      project3D,
    ]
  );

  // Render connections between clusters
  const renderClusterConnections = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const clusterMap = new Map<string, Cluster>();
      clusters.forEach((cluster) => {
        cluster.nodes.forEach((node) => {
          clusterMap.set(node.id, cluster);
        });
      });

      filteredConnections.forEach((connection) => {
        const clusterA = clusterMap.get(connection.from);
        const clusterB = clusterMap.get(connection.to);

        if (clusterA && clusterB && clusterA.id !== clusterB.id) {
          // Apply 3D rotation to cluster centers
          let rotatedA = rotateX(
            clusterA.center.x,
            clusterA.center.y,
            clusterA.center.z,
            rotationX
          );
          rotatedA = rotateY(rotatedA.x, rotatedA.y, rotatedA.z, rotationY);
          let rotatedB = rotateX(
            clusterB.center.x,
            clusterB.center.y,
            clusterB.center.z,
            rotationX
          );
          rotatedB = rotateY(rotatedB.x, rotatedB.y, rotatedB.z, rotationY);

          // Project to 2D
          const projectedA = project3D(
            rotatedA.x,
            rotatedA.y,
            rotatedA.z,
            sidebarCollapsed
          );
          const projectedB = project3D(
            rotatedB.x,
            rotatedB.y,
            rotatedB.z,
            sidebarCollapsed
          );

          // Apply zoom and pan
          const scaledAX = projectedA.x * localZoom + panX;
          const scaledAY = projectedA.y * localZoom + panY;
          const scaledBX = projectedB.x * localZoom + panX;
          const scaledBY = projectedB.y * localZoom + panY;

          // Connection styling
          const strength = connection.sharedTags.length;
          const alpha = Math.min(0.3 + strength * 0.1, 0.8);
          const width = Math.min(strength * 1.5, 4);

          ctx.save();
          ctx.strokeStyle = "#00ffff";
          ctx.lineWidth = width;
          ctx.globalAlpha = alpha;
          ctx.setLineDash([5, 5]);

          ctx.beginPath();
          ctx.moveTo(scaledAX, scaledAY);
          ctx.lineTo(scaledBX, scaledBY);
          ctx.stroke();

          ctx.restore();
        }
      });
    },
    [
      clusters,
      filteredConnections,
      rotationX,
      rotationY,
      sidebarCollapsed,
      rotateX,
      rotateY,
      project3D,
    ]
  );

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/80 p-3 rounded border border-cyan-400/50">
        <div className="space-y-2">
          <div>
            <label className="text-cyan-400 text-xs">
              Connection Strength: {connectionStrength}+
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={connectionStrength}
              onChange={(e) => setConnectionStrength(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showLabels"
              checked={showClusterLabels}
              onChange={(e) => setShowClusterLabels(e.target.checked)}
              className="text-cyan-400"
            />
            <label htmlFor="showLabels" className="text-cyan-400 text-xs">
              Show Labels
            </label>
          </div>
          <div>
            <label className="text-cyan-400 text-xs">
              Zoom: {localZoom.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={localZoom}
              onChange={(e) => setLocalZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        className="w-full h-full"
        ref={(canvas) => {
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              // Set canvas size
              canvas.width = window.innerWidth;
              canvas.height = window.innerHeight;

              // Clear canvas
              ctx.fillStyle = "#000";
              ctx.fillRect(0, 0, canvas.width, canvas.height);

              // Render connections first
              renderClusterConnections(ctx);

              // Render clusters
              clusters.forEach((cluster) => renderCluster(cluster, ctx));
            }
          }
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();

          if (isDragging) {
            // Handle panning
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;
            setPanX((prev) => prev + deltaX);
            setPanY((prev) => prev + deltaY);
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
          }

          // Handle hover detection
          const x = (e.clientX - rect.left - panX) / localZoom;
          const y = (e.clientY - rect.top - panY) / localZoom;

          // Find hovered node
          let hoveredNodeId: string | null = null;
          clusters.forEach((cluster) => {
            if (expandedClusters.has(cluster.id) || cluster.nodes.length <= 3) {
              cluster.nodes.forEach((node) => {
                let rotated = rotateX(node.x, node.y, node.z, rotationX);
                rotated = rotateY(rotated.x, rotated.y, rotated.z, rotationY);
                const projected = project3D(
                  rotated.x,
                  rotated.y,
                  rotated.z,
                  sidebarCollapsed
                );

                const distance = Math.sqrt(
                  (x - projected.x) ** 2 + (y - projected.y) ** 2
                );
                if (distance <= 10) {
                  hoveredNodeId = node.id;
                }
              });
            }
          });

          onNodeHover(hoveredNodeId);
        }}
        onMouseDown={(e) => {
          if (e.button === 0) {
            // Left mouse button
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseUp={(e) => {
          if (e.button === 0) {
            // Left mouse button
            setIsDragging(false);
          }
        }}
        onClick={(e) => {
          // Only handle clicks if not dragging
          if (isDragging) return;

          // Handle cluster expansion
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left - panX) / localZoom;
          const y = (e.clientY - rect.top - panY) / localZoom;

          clusters.forEach((cluster) => {
            let rotatedCenter = rotateX(
              cluster.center.x,
              cluster.center.y,
              cluster.center.z,
              rotationX
            );
            rotatedCenter = rotateY(
              rotatedCenter.x,
              rotatedCenter.y,
              rotatedCenter.z,
              rotationY
            );
            const projectedCenter = project3D(
              rotatedCenter.x,
              rotatedCenter.y,
              rotatedCenter.z,
              sidebarCollapsed
            );

            const radius = 30 + cluster.nodes.length * 5;
            const distance = Math.sqrt(
              (x - projectedCenter.x) ** 2 + (y - projectedCenter.y) ** 2
            );

            if (distance <= radius) {
              toggleClusterExpansion(cluster.id);
            }
          });
        }}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          setLocalZoom((prev) => Math.max(0.5, Math.min(3, prev * delta)));
        }}
      />
    </div>
  );
};
