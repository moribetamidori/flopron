import React, { useMemo, useState, useCallback } from "react";
import { MemoryNode, Connection } from "../hooks/useDatabaseMemoryTree";

interface TimelineViewProps {
  nodes: MemoryNode[];
  connections: Connection[];
  hoveredNode: string | null;
  selectedNode: MemoryNode | null;
  sidebarCollapsed: boolean;
  imageCache: Map<string, HTMLImageElement>;
  time: number;
  onNodeClick: (node: MemoryNode) => void;
  onNodeHover: (nodeId: string | null) => void;
}

interface TimelineNode {
  node: MemoryNode;
  x: number;
  y: number;
  timestamp: Date;
  connections: Connection[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  nodes,
  connections,
  hoveredNode,
  selectedNode,
  sidebarCollapsed,
  imageCache,
  time,
  onNodeClick,
  onNodeHover,
}) => {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [showConnections, setShowConnections] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year" | "all">(
    "month"
  );

  // Process nodes for timeline view
  const timelineNodes = useMemo(() => {
    const timelineData: TimelineNode[] = [];

    nodes.forEach((node) => {
      // Use timestamp if available, otherwise use current time
      const timestamp = node.dataLog?.timestamp
        ? new Date(node.dataLog.timestamp)
        : new Date();
      const nodeConnections = connections.filter(
        (conn) => conn.from === node.id || conn.to === node.id
      );

      timelineData.push({
        node,
        x: 0, // Will be calculated based on timestamp
        y: 0, // Will be calculated based on connections
        timestamp,
        connections: nodeConnections,
      });
    });

    // Sort by timestamp
    timelineData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Calculate x positions based on time
    const now = new Date();
    const timeRanges = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
      all: Math.max(
        ...timelineData.map((n) => now.getTime() - n.timestamp.getTime())
      ),
    };

    const range = timeRanges[timeRange];
    const canvasWidth = window.innerWidth - (sidebarCollapsed ? 0 : 300);

    timelineData.forEach((timelineNode) => {
      const timeDiff = now.getTime() - timelineNode.timestamp.getTime();
      timelineNode.x = (timeDiff / range) * canvasWidth * zoom + panX;
    });

    // Calculate y positions to avoid overlaps
    timelineData.forEach((timelineNode, index) => {
      let y = 100 + index * 80;

      // Check for overlaps with previous nodes
      for (let i = 0; i < index; i++) {
        const prevNode = timelineData[i];
        const xDiff = Math.abs(timelineNode.x - prevNode.x);
        if (xDiff < 100) {
          y = Math.max(y, prevNode.y + 100);
        }
      }

      timelineNode.y = y;
    });

    return timelineData;
  }, [nodes, connections, timeRange, zoom, panX, sidebarCollapsed]);

  // Render timeline node
  const renderTimelineNode = useCallback(
    (timelineNode: TimelineNode, ctx: CanvasRenderingContext2D) => {
      const { node, x, y } = timelineNode;
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode?.id === node.id;

      ctx.save();

      // Node background
      const nodeRadius = isHovered ? 12 : 8;
      ctx.fillStyle = isSelected ? "#ffff00" : "#00ffff";
      ctx.globalAlpha = isHovered ? 0.9 : 0.7;
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fill();

      // Node border
      ctx.strokeStyle = isSelected ? "#ffff00" : "#ffffff";
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Node label
      if (isHovered || isSelected) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.9;

        const title = node.dataLog?.title || "Untitled";
        const truncatedTitle =
          title.length > 25 ? title.substring(0, 25) + "..." : title;
        ctx.fillText(truncatedTitle, x, y - nodeRadius - 10);

        // Show timestamp
        const dateStr = timelineNode.timestamp.toLocaleDateString();
        ctx.font = "10px monospace";
        ctx.fillStyle = "#888888";
        ctx.fillText(dateStr, x, y - nodeRadius - 25);

        // Show tag count
        const tagCount = node.dataLog?.tags?.length || 0;
        ctx.fillStyle = "#00ff00";
        ctx.fillText(`${tagCount} tags`, x, y - nodeRadius - 40);
      }

      // Connection count indicator
      const connectionCount = timelineNode.connections.length;
      if (connectionCount > 0) {
        ctx.fillStyle = "#ff00ff";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${connectionCount}`, x, y + nodeRadius + 15);
      }

      ctx.restore();
    },
    [hoveredNode, selectedNode]
  );

  // Render connections between timeline nodes
  const renderTimelineConnections = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!showConnections) return;

      const nodeMap = new Map<string, TimelineNode>();
      timelineNodes.forEach((tn) => nodeMap.set(tn.node.id, tn));

      connections.forEach((connection) => {
        const fromTimelineNode = nodeMap.get(connection.from);
        const toTimelineNode = nodeMap.get(connection.to);

        if (fromTimelineNode && toTimelineNode) {
          const strength = connection.sharedTags.length;
          const alpha = Math.min(0.3 + strength * 0.1, 0.8);
          const width = Math.min(strength * 1.5, 4);

          ctx.save();
          ctx.strokeStyle = "#00ffff";
          ctx.lineWidth = width;
          ctx.globalAlpha = alpha;
          ctx.setLineDash([5, 5]);

          ctx.beginPath();
          ctx.moveTo(fromTimelineNode.x, fromTimelineNode.y);
          ctx.lineTo(toTimelineNode.x, toTimelineNode.y);
          ctx.stroke();

          // Draw connection strength indicator
          if (strength > 0) {
            const midX = (fromTimelineNode.x + toTimelineNode.x) / 2;
            const midY = (fromTimelineNode.y + toTimelineNode.y) / 2;

            ctx.fillStyle = "#00ffff";
            ctx.globalAlpha = 0.8;
            ctx.font = "8px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`${strength}`, midX, midY - 5);
          }

          ctx.restore();
        }
      });
    },
    [connections, timelineNodes, showConnections]
  );

  // Render timeline axis
  const renderTimelineAxis = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const canvasHeight = window.innerHeight;
      const canvasWidth = window.innerWidth - (sidebarCollapsed ? 0 : 300);

      ctx.save();
      ctx.strokeStyle = "#444444";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;

      // Main timeline line
      ctx.beginPath();
      ctx.moveTo(0, 50);
      ctx.lineTo(canvasWidth, 50);
      ctx.stroke();

      // Time markers
      const now = new Date();
      const timeRanges = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000,
        all: Math.max(
          ...timelineNodes.map((n) => now.getTime() - n.timestamp.getTime())
        ),
      };

      const range = timeRanges[timeRange];
      const markerCount =
        timeRange === "week"
          ? 7
          : timeRange === "month"
          ? 4
          : timeRange === "year"
          ? 12
          : 10;

      for (let i = 0; i <= markerCount; i++) {
        const x = (i / markerCount) * canvasWidth * zoom + panX;
        const timeOffset = (i / markerCount) * range;
        const markerDate = new Date(now.getTime() - timeOffset);

        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, 60);
        ctx.stroke();

        // Date label
        ctx.fillStyle = "#888888";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.7;

        let dateStr = "";
        if (timeRange === "week") {
          dateStr = markerDate.toLocaleDateString("en-US", {
            weekday: "short",
          });
        } else if (timeRange === "month") {
          dateStr = markerDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        } else if (timeRange === "year") {
          dateStr = markerDate.toLocaleDateString("en-US", { month: "short" });
        } else {
          dateStr = markerDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
        }

        ctx.fillText(dateStr, x, 80);
      }

      ctx.restore();
    },
    [timeRange, zoom, panX, sidebarCollapsed, timelineNodes]
  );

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/80 p-3 rounded border border-cyan-400/50">
        <div className="space-y-2">
          <div>
            <label className="text-cyan-400 text-xs">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full bg-black text-cyan-400 border border-cyan-400/50 rounded px-2 py-1 text-xs"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="text-cyan-400 text-xs">
              Zoom: {zoom.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showConnections"
              checked={showConnections}
              onChange={(e) => setShowConnections(e.target.checked)}
              className="text-cyan-400"
            />
            <label htmlFor="showConnections" className="text-cyan-400 text-xs">
              Show Connections
            </label>
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

              // Render timeline axis
              renderTimelineAxis(ctx);

              // Render connections
              renderTimelineConnections(ctx);

              // Render nodes
              timelineNodes.forEach((timelineNode) =>
                renderTimelineNode(timelineNode, ctx)
              );
            }
          }
        }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Find hovered node
          let hoveredNodeId: string | null = null;
          timelineNodes.forEach((timelineNode) => {
            const distance = Math.sqrt(
              (x - timelineNode.x) ** 2 + (y - timelineNode.y) ** 2
            );
            if (distance <= 12) {
              hoveredNodeId = timelineNode.node.id;
            }
          });

          onNodeHover(hoveredNodeId);
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Find clicked node
          timelineNodes.forEach((timelineNode) => {
            const distance = Math.sqrt(
              (x - timelineNode.x) ** 2 + (y - timelineNode.y) ** 2
            );
            if (distance <= 12) {
              onNodeClick(timelineNode.node);
            }
          });
        }}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          setZoom((prev) => Math.max(0.5, Math.min(3, prev * delta)));
        }}
      />
    </div>
  );
};
