import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { MemoryNode, Connection } from "../hooks/useDatabaseMemoryTree";
import { appStateService } from "../services/appStateService";

interface TagCentricViewProps {
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

interface TagHub {
  name: string;
  nodes: MemoryNode[];
  x: number;
  y: number;
  radius: number;
  color: string;
  strength: number;
}

export const TagCentricView: React.FC<TagCentricViewProps> = ({
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredHub, setHoveredHub] = useState<string | null>(null);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load saved state on mount
  useEffect(() => {
    const savedState = appStateService.loadState();
    if (savedState) {
      if (savedState.zoom !== undefined) setZoom(savedState.zoom);
      if (savedState.panX !== undefined) setPanX(savedState.panX);
      if (savedState.panY !== undefined) setPanY(savedState.panY);
      if (savedState.showNodeDetails !== undefined)
        setShowNodeDetails(savedState.showNodeDetails);
      if (savedState.tagFilter !== undefined)
        setTagFilter(savedState.tagFilter);
    }
  }, []);

  // Extract all unique tags and create tag hubs
  const tagHubs = useMemo(() => {
    const tagMap = new Map<string, MemoryNode[]>();

    // Group nodes by tags
    nodes.forEach((node) => {
      if (node.dataLog?.tags) {
        node.dataLog.tags.forEach((tag) => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, []);
          }
          tagMap.get(tag)!.push(node);
        });
      }
    });

    // Convert to tag hubs with positioning
    const hubs: TagHub[] = [];
    const canvasWidth = window.innerWidth - (sidebarCollapsed ? 0 : 300);
    const canvasHeight = window.innerHeight;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Sort tags by number of nodes (most popular first)
    const sortedTags = Array.from(tagMap.entries()).sort(
      (a, b) => b[1].length - a[1].length
    );

    sortedTags.forEach(([tagName, tagNodes], index) => {
      // Calculate hub position in a spiral pattern
      const angle = index * 137.5 * (Math.PI / 180); // Golden angle
      const distance = 100 + index * 20;
      const x = (centerX + Math.cos(angle) * distance) * zoom + panX;
      const y = (centerY + Math.sin(angle) * distance) * zoom + panY;

      // Calculate hub radius based on number of nodes
      const radius = Math.max(20, Math.min(60, 20 + tagNodes.length * 3));

      // Calculate hub strength (average connection strength)
      const hubConnections = connections.filter((conn) =>
        tagNodes.some((node) => node.id === conn.from || node.id === conn.to)
      );
      const avgStrength =
        hubConnections.length > 0
          ? hubConnections.reduce(
              (sum, conn) => sum + conn.sharedTags.length,
              0
            ) / hubConnections.length
          : 0;

      // Generate color based on tag name
      const hue = (tagName.charCodeAt(0) * 137.5) % 360;
      const color = `hsl(${hue}, 70%, 60%)`;

      hubs.push({
        name: tagName,
        nodes: tagNodes,
        x,
        y,
        radius,
        color,
        strength: avgStrength,
      });
    });

    return hubs;
  }, [nodes, connections, sidebarCollapsed, zoom, panX, panY]);

  // Filter hubs based on search
  const filteredHubs = useMemo(() => {
    if (!tagFilter) return tagHubs;
    return tagHubs.filter((hub) =>
      hub.name.toLowerCase().includes(tagFilter.toLowerCase())
    );
  }, [tagHubs, tagFilter]);

  // Render tag hub
  const renderTagHub = useCallback(
    (hub: TagHub, ctx: CanvasRenderingContext2D) => {
      const isSelected = selectedTags.includes(hub.name);
      const isHubHovered = hoveredHub === hub.name;
      const isNodeHovered = hub.nodes.some((node) => node.id === hoveredNode);

      ctx.save();

      // Hub background with glow effect
      const gradient = ctx.createRadialGradient(
        hub.x,
        hub.y,
        0,
        hub.x,
        hub.y,
        hub.radius * 1.5
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

      gradient.addColorStop(0, hslToRgba(hub.color, 0.4));
      gradient.addColorStop(0.7, hslToRgba(hub.color, 0.2));
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, hub.radius * 1.5 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // Hub border
      ctx.strokeStyle = hub.color;
      ctx.lineWidth = isSelected || isHubHovered ? 4 : 2;
      ctx.globalAlpha = isSelected || isHubHovered ? 0.9 : 0.7;
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, hub.radius * zoom, 0, Math.PI * 2);
      ctx.stroke();

      // Hub label - use white text for better visibility
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.globalAlpha = 0.9;

      // Tag name
      ctx.fillText(hub.name, hub.x, hub.y - 5 * zoom);

      // Node count
      ctx.font = "10px monospace";
      ctx.fillStyle = "#cccccc";
      ctx.fillText(`${hub.nodes.length} nodes`, hub.x, hub.y + 10 * zoom);

      // Strength indicator
      if (hub.strength > 0) {
        ctx.fillStyle = "#00ff00";
        ctx.fillText(
          `strength: ${hub.strength.toFixed(1)}`,
          hub.x,
          hub.y + 25 * zoom
        );
      }

      ctx.restore();

      // Render connected nodes if hub is selected, hub is hovered, or show all nodes is enabled
      if (isSelected || isHubHovered || showNodeDetails) {
        hub.nodes.forEach((node, nodeIndex) => {
          renderConnectedNode(node, hub, nodeIndex, ctx);
        });
      }
    },
    [selectedTags, hoveredNode, hoveredHub, showNodeDetails, zoom]
  );

  // Render node connected to a hub
  const renderConnectedNode = useCallback(
    (
      node: MemoryNode,
      hub: TagHub,
      nodeIndex: number,
      ctx: CanvasRenderingContext2D
    ) => {
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode?.id === node.id;
      const isArrowSelected =
        hoveredHub === hub.name && selectedNodeIndex === nodeIndex;

      // Calculate node position around the hub
      const angle = ((nodeIndex * 360) / hub.nodes.length) * (Math.PI / 180);
      const distance = hub.radius + 30;
      const nodeX = hub.x + Math.cos(angle) * distance * zoom;
      const nodeY = hub.y + Math.sin(angle) * distance * zoom;

      ctx.save();

      // Connection line from hub to node
      ctx.strokeStyle = hub.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(nodeX, nodeY);
      ctx.stroke();

      // Node circle
      const nodeRadius = isHovered || isArrowSelected ? 6 : 4;
      ctx.fillStyle = isSelected || isArrowSelected ? "#ffff00" : hub.color;
      ctx.globalAlpha = isHovered || isArrowSelected ? 0.9 : 0.7;
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, nodeRadius * zoom, 0, Math.PI * 2);
      ctx.fill();

      // Node border
      ctx.strokeStyle = isSelected || isArrowSelected ? "#ffff00" : "#ffffff";
      ctx.lineWidth = isHovered || isArrowSelected ? 2 : 1;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, nodeRadius * zoom, 0, Math.PI * 2);
      ctx.stroke();

      // Node label (if hovered, selected, or arrow-selected)
      if (isHovered || isSelected || isArrowSelected) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.9;

        const title = node.dataLog?.title || "Untitled";
        const truncatedTitle =
          title.length > 15 ? title.substring(0, 15) + "..." : title;
        ctx.fillText(truncatedTitle, nodeX, nodeY - nodeRadius * zoom - 8);
      }

      ctx.restore();
    },
    [hoveredNode, selectedNode, hoveredHub, selectedNodeIndex, zoom]
  );

  // Render connections between hubs
  const renderHubConnections = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const hubMap = new Map<string, TagHub>();
      filteredHubs.forEach((hub) => {
        hub.nodes.forEach((node) => {
          hubMap.set(node.id, hub);
        });
      });

      connections.forEach((connection) => {
        const fromHub = hubMap.get(connection.from);
        const toHub = hubMap.get(connection.to);

        if (fromHub && toHub && fromHub.name !== toHub.name) {
          const strength = connection.sharedTags.length;
          const alpha = Math.min(0.2 + strength * 0.05, 0.6);
          const width = Math.min(strength * 0.5, 2);

          ctx.save();
          ctx.strokeStyle = "#00ffff";
          ctx.lineWidth = width;
          ctx.globalAlpha = alpha;
          ctx.setLineDash([8, 4]);

          ctx.beginPath();
          ctx.moveTo(fromHub.x, fromHub.y);
          ctx.lineTo(toHub.x, toHub.y);
          ctx.stroke();

          ctx.restore();
        }
      });
    },
    [filteredHubs, connections]
  );

  // Handle tag selection
  const handleTagClick = useCallback((tagName: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagName)) {
        return prev.filter((tag) => tag !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  }, []);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render hub connections
    renderHubConnections(ctx);

    // Render tag hubs
    filteredHubs.forEach((hub) => renderTagHub(hub, ctx));
  }, [filteredHubs, renderHubConnections, renderTagHub, selectedNodeIndex]);

  // Set canvas size and trigger initial render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Force a re-render after setting canvas size
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderHubConnections(ctx);
        filteredHubs.forEach((hub) => renderTagHub(hub, ctx));
      }
    }
  }, [filteredHubs, renderHubConnections, renderTagHub]);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("Key pressed:", e.key, "Hovered hub:", hoveredHub);

      if (!hoveredHub) return;

      const hub = filteredHubs.find((h) => h.name === hoveredHub);
      if (!hub || hub.nodes.length === 0) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        console.log(
          "Moving right, current index:",
          selectedNodeIndex,
          "total nodes:",
          hub.nodes.length
        );
        setSelectedNodeIndex((prev) => (prev + 1) % hub.nodes.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        console.log(
          "Moving left, current index:",
          selectedNodeIndex,
          "total nodes:",
          hub.nodes.length
        );
        setSelectedNodeIndex(
          (prev) => (prev - 1 + hub.nodes.length) % hub.nodes.length
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hoveredHub, filteredHubs, selectedNodeIndex]);

  // Update hovered node (small info panel) when arrow navigation changes
  // Do NOT trigger onNodeClick to avoid opening the big modal
  useEffect(() => {
    if (hoveredHub && selectedNodeIndex >= 0) {
      const hub = filteredHubs.find((h) => h.name === hoveredHub);
      if (hub && hub.nodes[selectedNodeIndex]) {
        onNodeHover(hub.nodes[selectedNodeIndex].id);
      }
    }
  }, [hoveredHub, selectedNodeIndex, filteredHubs, onNodeHover]);

  // Save state when relevant values change
  useEffect(() => {
    const currentState = appStateService.loadState() || {
      currentView: "tag-centric",
    };
    const newState = {
      ...currentState,
      zoom,
      panX,
      panY,
      showNodeDetails,
      tagFilter,
    };
    appStateService.saveState(newState);
  }, [zoom, panX, panY, showNodeDetails, tagFilter]);

  return (
    <div className="relative w-full h-full">
      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/80 p-3 rounded border border-cyan-400/50 w-80">
        <div className="space-y-2">
          <div>
            <label className="text-cyan-400 text-xs">Search Tags</label>
            <input
              type="text"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="Filter tags..."
              className="w-full bg-black text-cyan-400 border border-cyan-400/50 rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showNodeDetails"
              checked={showNodeDetails}
              onChange={(e) => setShowNodeDetails(e.target.checked)}
              className="text-cyan-400"
            />
            <label htmlFor="showNodeDetails" className="text-cyan-400 text-xs">
              Show All Nodes
            </label>
          </div>

          <div>
            <label className="text-cyan-400 text-xs">
              Zoom: {zoom.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.01"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        className="w-full h-full"
        ref={canvasRef}
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

          // Use screen-space coordinates for hit-testing
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;

          // Find hovered node and hub
          let hoveredNodeId: string | null = null;
          let hoveredHubName: string | null = null;

          filteredHubs.forEach((hub) => {
            // Check if hovering over hub (consider zoomed radius)
            const hubDistance = Math.sqrt(
              (mx - hub.x) ** 2 + (my - hub.y) ** 2
            );
            const hubRadiusOnScreen = hub.radius * zoom;
            const hubIsHovered = hubDistance <= hubRadiusOnScreen;
            if (hubIsHovered) {
              hoveredHubName = hub.name;
              // If hovering over hub, show first node
              if (hub.nodes.length > 0) {
                hoveredNodeId = hub.nodes[0].id;
              }
            }

            // Check if hovering over connected nodes
            if (
              selectedTags.includes(hub.name) ||
              hubIsHovered ||
              showNodeDetails
            ) {
              hub.nodes.forEach((node, nodeIndex) => {
                const angle =
                  ((nodeIndex * 360) / hub.nodes.length) * (Math.PI / 180);
                const distance = hub.radius + 30;
                const nodeX = hub.x + Math.cos(angle) * distance * zoom;
                const nodeY = hub.y + Math.sin(angle) * distance * zoom;

                const nodeDistance = Math.sqrt(
                  (mx - nodeX) ** 2 + (my - nodeY) ** 2
                );
                if (nodeDistance <= 6 * zoom) {
                  hoveredNodeId = node.id;
                }
              });
            }
          });

          setHoveredHub(hoveredHubName);
          // Reset selected node index when hovering over a different hub
          if (hoveredHubName !== hoveredHub) {
            setSelectedNodeIndex(0);
          }
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

          const rect = e.currentTarget.getBoundingClientRect();
          const mx = e.clientX - rect.left;
          const my = e.clientY - rect.top;

          // Check for hub clicks
          filteredHubs.forEach((hub) => {
            const hubDistance = Math.sqrt(
              (mx - hub.x) ** 2 + (my - hub.y) ** 2
            );
            if (hubDistance <= hub.radius * zoom) {
              handleTagClick(hub.name);
              return;
            }
          });

          // Check for node clicks
          filteredHubs.forEach((hub) => {
            const hubDistance = Math.sqrt(
              (mx - hub.x) ** 2 + (my - hub.y) ** 2
            );
            const hubIsHovered = hubDistance <= hub.radius * zoom;
            if (
              selectedTags.includes(hub.name) ||
              hubIsHovered ||
              showNodeDetails
            ) {
              hub.nodes.forEach((node, nodeIndex) => {
                const angle =
                  ((nodeIndex * 360) / hub.nodes.length) * (Math.PI / 180);
                const distance = hub.radius + 30;
                const nodeX = hub.x + Math.cos(angle) * distance * zoom;
                const nodeY = hub.y + Math.sin(angle) * distance * zoom;

                const nodeDistance = Math.sqrt(
                  (mx - nodeX) ** 2 + (my - nodeY) ** 2
                );
                if (nodeDistance <= 6 * zoom) {
                  onNodeClick(node);
                }
              });
            }
          });
        }}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          setZoom((prev) => Math.max(0.01, Math.min(3, prev * delta)));
        }}
      />
    </div>
  );
};
