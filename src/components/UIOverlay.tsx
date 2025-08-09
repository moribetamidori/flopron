import React from "react";
import { MemoryNode } from "../hooks/useDatabaseMemoryTree";

interface UIOverlayProps {
  sidebarCollapsed: boolean;
  previewMode: boolean;
  zoom: number;
  hoveredNode: string | null;
  selectedNode: MemoryNode | null;
  nodes: MemoryNode[];
  rotationX: number;
  rotationY: number;
  onPreviewModeToggle: () => void;
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

export const UIOverlay: React.FC<UIOverlayProps> = ({
  sidebarCollapsed,
  previewMode,
  zoom,
  hoveredNode,
  selectedNode,
  nodes,
  rotationX,
  rotationY,
  onPreviewModeToggle,
  rotateX,
  rotateY,
  project3D,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Overlay text */}
      <div
        className={`absolute top-8 text-cyan-400 font-mono text-sm transition-all duration-300 ${
          sidebarCollapsed ? "left-20" : "left-96"
        }`}
      >
        <div className="mb-2">CUTTIE&apos;S FLOPPY NEURONS</div>
        <div className="text-xs opacity-70">
          Drag to rotate • Scroll to zoom • Click nodes for details
        </div>
      </div>

      {/* Preview Mode Button */}
      <div className="absolute top-8 right-8 text-cyan-400 font-mono text-sm z-20">
        <button
          onClick={onPreviewModeToggle}
          className={`px-4 py-2 border border-cyan-400/50 rounded transition-all duration-200 pointer-events-auto ${
            previewMode
              ? "bg-cyan-400/20 text-white border-cyan-400"
              : "bg-black/50 text-cyan-400 hover:bg-cyan-400/10"
          }`}
        >
          {previewMode ? "Hide Preview" : "Preview"}
        </button>
      </div>

      {/* FPS counter */}
      <div className="absolute top-20 right-8 text-cyan-400 font-mono text-xs">
        <div>{Math.round(1000 / 16)} FPS</div>
        <div className="opacity-70">Zoom: {Math.round(zoom * 100)}%</div>
      </div>

      {/* Connection Legend */}
      <div className="absolute bottom-8 right-8 text-cyan-400 font-mono text-xs bg-black/50 p-3 rounded border border-cyan-400/30">
        <div className="mb-2 font-semibold">Connection Strength:</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-[#00ffff] mr-2 relative">
              <div className="absolute top-1/2  w-2 h-2 bg-[#00ffff] border border-black rounded-full transform -translate-y-1/2"></div>
            </div>
            <span>1 shared tag </span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-1 bg-[#ffff00] mr-2 relative">
              <div className="absolute top-1/2 w-2 h-2 border border-black bg-yellow-400 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/4 w-2 h-2 border border-black bg-yellow-400 rounded-full transform -translate-y-1/2"></div>
            </div>
            <span>2 shared tags </span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-1.5 bg-[#ff00ff] mr-2 relative">
              <div className="absolute top-1/2 w-2 h-2 border border-black bg-magenta-400 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/4 w-2 h-2 border border-black bg-magenta-400 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-2 h-2 border border-black bg-magenta-400 rounded-full transform -translate-y-1/2"></div>
            </div>
            <span>3 shared tags </span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-2 bg-orange-400 mr-2 relative">
              <div className="absolute top-1/2 w-2 h-2 border border-black bg-orange-400 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/4 w-2 h-2 border border-black bg-orange-400 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-2/4 w-2 h-2 border border-black bg-orange-400 rounded-full transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-3/4 w-2 h-2 border border-black bg-orange-400 rounded-full transform -translate-y-1/2"></div>
            </div>
            <span>4 shared tags </span>
          </div>
        </div>
      </div>

      {/* Hover Node Info */}
      {hoveredNode &&
        !selectedNode &&
        (() => {
          const hoveredNodeData = nodes.find((n) => n.id === hoveredNode);
          if (!hoveredNodeData) return null;

          // Get projected position of the hovered node
          let rotated = rotateX(
            hoveredNodeData.x,
            hoveredNodeData.y,
            hoveredNodeData.z,
            rotationX
          );
          rotated = rotateY(rotated.x, rotated.y, rotated.z, rotationY);
          const projected = project3D(
            rotated.x,
            rotated.y,
            rotated.z,
            sidebarCollapsed
          );

          return (
            <div
              className="absolute bg-black/90 border border-cyan-400/50 pt-2 px-2 rounded-lg text-cyan-400 font-mono text-center min-w-[200px] pointer-events-none"
              style={{
                left: `${projected.x + 40}px`,
                top: `${projected.y - 50}px`,
                transform: "translateY(-50%)",
              }}
            >
              <div className="font-bold mb-2 text-xs">
                {hoveredNode && hoveredNode.length > 25
                  ? `${hoveredNode.substring(0, 25)}...`
                  : hoveredNode}
              </div>
            </div>
          );
        })()}
    </div>
  );
};
