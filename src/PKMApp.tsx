import React, { useState, useRef } from "react";

// Extend Window interface to include mouse position
declare global {
  interface Window {
    mouseX: number;
    mouseY: number;
    dotHoverThrottle: number | null;
  }
}

import { useAudioContext } from "./hooks/useAudioContext";
import { useImageCache } from "./hooks/useImageCache";
import {
  useDatabaseMemoryTree,
  MemoryNode,
} from "./hooks/useDatabaseMemoryTree";
import { use3DRendering } from "./hooks/use3DRendering";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { CanvasRenderer } from "./components/CanvasRenderer";
import { Sidebar } from "./components/Sidebar";
import { NodeDetailsModal } from "./components/NodeDetailsModal";
import { UIOverlay } from "./components/UIOverlay";
import { AddNodeModal } from "./components/AddNodeModal";

export default function PKMApp() {
  // Custom hooks
  const { playNodeSound } = useAudioContext();
  const { nodes, connections, addNode, deleteNode, refreshData } =
    useDatabaseMemoryTree();
  const { imageCache } = useImageCache({ nodes });
  const {
    time,
    rotationX,
    rotationY,
    zoom,
    rotateX,
    rotateY,
    project3D,
    updateRotation,
    updateZoom,
  } = use3DRendering();

  // State
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [dotTooltip, setDotTooltip] = useState<{
    tags: string[];
    x: number;
    y: number;
  } | null>(null);

  // Event handlers
  const handleNodeClick = (node: MemoryNode) => {
    if (selectedNode?.id === node.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode(node);
    }
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNode(nodeId);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handlePreviewModeToggle = () => {
    setPreviewMode(!previewMode);
  };

  const handleCloseModal = () => {
    setSelectedNode(null);
  };

  // Use ref to track current tooltip to prevent infinite loops
  const currentTooltipRef = useRef<{
    tags: string[];
    x: number;
    y: number;
  } | null>(null);

  const handleDotHover = (sharedTags: string[], x: number, y: number) => {
    // Only update if the tooltip content has actually changed
    const newTooltip = { tags: sharedTags, x, y };
    const current = currentTooltipRef.current;

    if (
      !current ||
      current.x !== x ||
      current.y !== y ||
      JSON.stringify(current.tags) !== JSON.stringify(sharedTags)
    ) {
      currentTooltipRef.current = newTooltip;
      setDotTooltip(newTooltip);
    }
  };

  const handleDotLeave = () => {
    currentTooltipRef.current = null;
    setDotTooltip(null);
  };

  // Filter nodes based on selected tags
  const filteredNodes =
    selectedTags.length > 0
      ? nodes.filter((node) =>
          node.dataLog?.tags?.some((tag) => selectedTags.includes(tag))
        )
      : nodes;

  // Handle tag selection/deselection
  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Canvas interaction hook
  const {
    canvasRef,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleCanvasClick,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useCanvasInteraction({
    nodes,
    previewMode,
    rotationX,
    rotationY,
    sidebarCollapsed,
    rotateX,
    rotateY,
    project3D,
    updateRotation,
    updateZoom,
    onNodeClick: handleNodeClick,
    onNodeHover: handleNodeHover,
    playNodeSound,
  });

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ touchAction: "none" }}
    >
      {/* Canvas container */}
      <div className="absolute inset-0">
        <CanvasRenderer
          nodes={filteredNodes}
          connections={connections}
          hoveredNode={hoveredNode}
          selectedNode={selectedNode}
          sidebarCollapsed={sidebarCollapsed}
          previewMode={previewMode}
          imageCache={imageCache}
          time={time}
          rotationX={rotationX}
          rotationY={rotationY}
          zoom={zoom}
          onDotHover={handleDotHover}
          onDotLeave={handleDotLeave}
          rotateX={rotateX}
          rotateY={rotateY}
          project3D={project3D}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer absolute inset-0"
          style={{ touchAction: "none" }}
          onMouseMove={(e) => {
            // Track mouse position for dot hover detection
            window.mouseX = e.clientX;
            window.mouseY = e.clientY;
            handleMouseMove(e);
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            window.mouseX = 0;
            window.mouseY = 0;
            handleMouseUp();
            handleDotLeave();
          }}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* Sidebar */}
      <Sidebar
        nodes={filteredNodes}
        selectedNode={selectedNode}
        sidebarCollapsed={sidebarCollapsed}
        previewMode={previewMode}
        selectedTags={selectedTags}
        onNodeClick={handleNodeClick}
        onSidebarToggle={handleSidebarToggle}
        onTagClick={handleTagClick}
        onAddClick={() => setShowAddModal(true)}
      />

      {/* UI Overlay */}
      <UIOverlay
        sidebarCollapsed={sidebarCollapsed}
        previewMode={previewMode}
        zoom={zoom}
        hoveredNode={hoveredNode}
        selectedNode={selectedNode}
        nodes={nodes}
        rotationX={rotationX}
        rotationY={rotationY}
        onPreviewModeToggle={handlePreviewModeToggle}
        rotateX={rotateX}
        rotateY={rotateY}
        project3D={project3D}
      />

      {/* Node Details Modal */}
      <NodeDetailsModal
        selectedNode={selectedNode}
        sidebarCollapsed={sidebarCollapsed}
        onClose={handleCloseModal}
        onUpdated={({ title, content, tags, images, links }) => {
          // Update selectedNode in place for immediate UI reflection
          setSelectedNode((prev) =>
            prev && prev.dataLog
              ? {
                  ...prev,
                  dataLog: {
                    ...prev.dataLog,
                    title,
                    content,
                    tags,
                    images,
                    links,
                  },
                }
              : prev
          );
          // Also refresh underlying data
          refreshData();
        }}
        onDeleted={async (nodeId) => {
          try {
            await deleteNode(nodeId);
            setSelectedNode(null);
          } finally {
            refreshData();
          }
        }}
      />

      {/* Add Entry Modal */}
      <AddNodeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onNodeAdded={(dataLog) => {
          addNode(dataLog);
          setShowAddModal(false);
        }}
      />

      {/* Dot Tooltip */}
      {dotTooltip && (
        <div
          className="fixed z-50 bg-black/90 text-cyan-400 font-mono text-xs p-2 rounded border border-cyan-400/50 pointer-events-none"
          style={{
            left: dotTooltip.x + 10,
            top: dotTooltip.y - 10,
            transform: "translateY(-100%)",
          }}
        >
          <div className="space-y-1">
            {dotTooltip.tags.map((tag, index) => (
              <div key={index} className="text-cyan-300">
                • {tag}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
