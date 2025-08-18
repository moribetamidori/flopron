import React, { useEffect, useState } from "react";
import { MemoryNode } from "../hooks/useDatabaseMemoryTree";

interface UIOverlayProps {
  sidebarCollapsed: boolean;
  zoom: number;
  hoveredNode: string | null;
  selectedNode: MemoryNode | null;
  nodes: MemoryNode[];
  rotationX: number;
  rotationY: number;
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
  zoom,
  hoveredNode,
  selectedNode,
  nodes,
  rotationX,
  rotationY,
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
        } pointer-events-auto`}
      >
        <div className="text-xs opacity-70">
          Drag to rotate • Scroll to zoom • Click nodes for details
        </div>
      </div>

      {/* FPS counter */}
      <div className="absolute top-20 right-8 text-cyan-400 font-mono text-xs">
        <div>{Math.round(1000 / 16)} FPS</div>
        <div className="opacity-70">Zoom: {Math.round(zoom * 100)}%</div>
      </div>

      {/* Connection Legend */}
      <div className="absolute bottom-8 left-80 text-cyan-400 font-mono text-xs bg-black/50 p-3 rounded border border-cyan-400/30">
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
    </div>
  );
};
