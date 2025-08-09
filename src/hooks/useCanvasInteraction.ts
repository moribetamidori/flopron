import { useState, useRef } from "react";
import { MemoryNode } from "./useDatabaseMemoryTree";

interface UseCanvasInteractionProps {
  nodes: MemoryNode[];
  previewMode: boolean;
  rotationX: number;
  rotationY: number;
  sidebarCollapsed: boolean;
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
  updateRotation: (deltaX: number, deltaY: number) => void;
  updateZoom: (delta: number) => void;
  onNodeClick: (node: MemoryNode) => void;
  onNodeHover: (nodeId: string | null) => void;
  playNodeSound: (node: MemoryNode) => Promise<void>;
}

export const useCanvasInteraction = ({
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
  onNodeClick,
  onNodeHover,
  playNodeSound,
}: UseCanvasInteractionProps) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(
    null
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (isDragging) {
      const deltaX = x - lastMousePos.x;
      const deltaY = y - lastMousePos.y;

      updateRotation(deltaX, deltaY);
      setLastMousePos({ x, y });
    }

    // Check for node hover (using projected coordinates)
    const projectedNodes = nodes.map((node) => {
      let rotated = rotateX(node.x, node.y, node.z, rotationX);
      rotated = rotateY(rotated.x, rotated.y, rotated.z, rotationY);
      const projected = project3D(
        rotated.x,
        rotated.y,
        rotated.z,
        sidebarCollapsed
      );
      return { ...node, projectedX: projected.x, projectedY: projected.y };
    });

    const hovered = projectedNodes.find((node) => {
      if (previewMode && node.dataLog) {
        // Square preview mode hover detection
        const size = 60; // Default size for hover detection
        const halfSize = size / 2;
        return (
          x >= node.projectedX - halfSize &&
          x <= node.projectedX + halfSize &&
          y >= node.projectedY - halfSize &&
          y <= node.projectedY + halfSize
        );
      } else {
        // Circular node hover detection
        const distance = Math.sqrt(
          (x - node.projectedX) ** 2 + (y - node.projectedY) ** 2
        );
        return distance < 30;
      }
    });

    if (hovered) {
      onNodeHover(hovered.id);
      playNodeSound(hovered).catch(console.error);
    } else {
      onNodeHover(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return; // Don't trigger click if we were dragging

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check for node click (using projected coordinates)
    const projectedNodes = nodes.map((node) => {
      let rotated = rotateX(node.x, node.y, node.z, rotationX);
      rotated = rotateY(rotated.x, rotated.y, rotated.z, rotationY);
      const projected = project3D(
        rotated.x,
        rotated.y,
        rotated.z,
        sidebarCollapsed
      );
      return { ...node, projectedX: projected.x, projectedY: projected.y };
    });

    const clicked = projectedNodes.find((node) => {
      if (previewMode && node.dataLog) {
        // Square preview mode click detection
        const size = 60; // Default size for click detection
        const halfSize = size / 2;
        return (
          x >= node.projectedX - halfSize &&
          x <= node.projectedX + halfSize &&
          y >= node.projectedY - halfSize &&
          y <= node.projectedY + halfSize
        );
      } else {
        // Circular node click detection
        const distance = Math.sqrt(
          (x - node.projectedX) ** 2 + (y - node.projectedY) ** 2
        );
        return distance < 30;
      }
    });

    if (clicked) {
      onNodeClick(clicked);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    // Avoid calling preventDefault on passive listeners
    if (e.nativeEvent.cancelable) {
      e.preventDefault();
    }
    const zoomSpeed = 0.1;
    const zoomDelta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    updateZoom(zoomDelta);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch1.clientX - touch2.clientX, 2) +
          Math.pow(touch1.clientY - touch2.clientY, 2)
      );
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Avoid calling preventDefault on passive listeners
    if (e.nativeEvent.cancelable) {
      e.preventDefault();
    }

    if (e.touches.length === 2 && lastTouchDistance !== null) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch1.clientX - touch2.clientX, 2) +
          Math.pow(touch1.clientY - touch2.clientY, 2)
      );

      const zoomDelta = (distance - lastTouchDistance) * 0.01;
      updateZoom(zoomDelta);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      // Single touch for mouse position
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        });
      }
    }
  };

  const handleTouchEnd = () => {
    setLastTouchDistance(null);
  };

  return {
    canvasRef,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleCanvasClick,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
