import React, { useEffect, useRef } from "react";
import { MemoryNode, Connection } from "../hooks/useDatabaseMemoryTree";
import { renderNormalView } from "./NormalView";
import { renderPreviewView } from "./PreviewView";

interface CanvasRendererProps {
  nodes: MemoryNode[];
  connections: Connection[];
  hoveredNode: string | null;
  selectedNode: MemoryNode | null;
  sidebarCollapsed: boolean;
  previewMode: boolean;
  imageCache: Map<string, HTMLImageElement>;
  time: number;
  rotationX: number;
  rotationY: number;
  zoom: number;
  onDotHover?: (sharedTags: string[], x: number, y: number) => void;
  onDotLeave?: () => void;
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

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  nodes,
  connections,
  hoveredNode,
  selectedNode,
  sidebarCollapsed,
  previewMode,
  imageCache,
  time,
  rotationX,
  rotationY,
  zoom,
  onDotHover,
  onDotLeave,
  rotateX,
  rotateY,
  project3D,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Clear canvas
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sort nodes by Z-depth for proper 3D rendering
    const sortedNodes = [...nodes].sort((a, b) => {
      let rotatedA = rotateX(a.x, a.y, a.z, rotationX);
      rotatedA = rotateY(rotatedA.x, rotatedA.y, rotatedA.z, rotationY);
      let rotatedB = rotateX(b.x, b.y, b.z, rotationX);
      rotatedB = rotateY(rotatedB.x, rotatedB.y, rotatedB.z, rotationY);
      return rotatedB.z - rotatedA.z;
    });

    // Track if mouse is hovering over any dots
    let isHoveringOverDot = false;

    // Draw connections with glitch effect
    connections.forEach((connection) => {
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
        rotatedFrom.x,
        rotatedFrom.y,
        rotatedFrom.z,
        sidebarCollapsed
      );
      const projectedTo = project3D(
        rotatedTo.x,
        rotatedTo.y,
        rotatedTo.z,
        sidebarCollapsed
      );

      // Color and intensity based on number of shared tags
      const sharedTagCount = connection.sharedTags?.length || 0;

      // Dynamic color generation based on shared tag count
      const getConnectionColor = (tagCount: number): string => {
        if (tagCount === 0) return "#00ffff"; // Cyan for no shared tags

        // Color palette for different tag counts
        const colors = [
          "#00ffff", // Cyan - 1 shared tag
          "#ffff00", // Yellow - 2 shared tags
          "#ff00ff", // Magenta - 3 shared tags
          "#ff8800", // Orange - 4 shared tags
          "#8800ff", // Purple - 5 shared tags
          "#00ff88", // Green - 6 shared tags
          "#ff0088", // Pink - 7 shared tags
          "#0088ff", // Blue - 8 shared tags
          "#88ff00", // Lime - 9 shared tags
          "#ff8800", // Orange - 10+ shared tags
        ];

        // Use modulo to cycle through colors for very high tag counts
        return colors[Math.min(tagCount - 1, colors.length - 1)];
      };

      // Dynamic line width and alpha based on tag count
      const getConnectionStyle = (tagCount: number) => {
        const baseAlpha = 0.6;
        const alphaIncrement = 0.1;
        const maxAlpha = 0.9;

        const lineWidth = Math.min(tagCount * 1.5, 6); // Increased multiplier and max width
        const alpha = Math.min(
          baseAlpha + (tagCount - 1) * alphaIncrement,
          maxAlpha
        );

        return { lineWidth, alpha };
      };

      const strokeColor = getConnectionColor(sharedTagCount);
      const { lineWidth, alpha } = getConnectionStyle(sharedTagCount);
      const finalAlpha =
        alpha + Math.sin(time * 2 + connection.glitchOffset) * 0.2;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = finalAlpha;

      // Glitch effect on connections
      const glitchAmount = Math.sin(time * 10 + connection.glitchOffset) * 3;

      ctx.beginPath();
      ctx.moveTo(projectedFrom.x + glitchAmount, projectedFrom.y);
      ctx.lineTo(projectedTo.x - glitchAmount, projectedTo.y);
      ctx.stroke();

      // Draw connection strength indicator (dots along the connection line)
      if (sharedTagCount > 0) {
        ctx.fillStyle = strokeColor;
        ctx.globalAlpha = 0.8;

        // Calculate spacing and size for dots
        const dotRadius = 5;
        const maxDots = Math.min(sharedTagCount, 8); // Cap at 8 dots to avoid overcrowding

        // Calculate the direction vector of the connection line
        const dx = projectedTo.x - projectedFrom.x;
        const dy = projectedTo.y - projectedFrom.y;
        const lineLength = Math.sqrt(dx * dx + dy * dy);

        // Normalize the direction vector
        const unitDx = dx / lineLength;
        const unitDy = dy / lineLength;

        // Calculate spacing between dots along the line
        const spacing = lineLength / (maxDots + 1); // +1 to avoid dots at endpoints

        // Draw dots along the connection line
        for (let i = 1; i <= maxDots; i++) {
          const distance = i * spacing;
          const dotX = projectedFrom.x + unitDx * distance;
          const dotY = projectedFrom.y + unitDy * distance;

          ctx.beginPath();
          ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
          ctx.fill();

          // Store dot information for hover detection
          if (onDotHover) {
            // Create a simple hover area around the dot
            const hoverRadius = dotRadius + 3;

            // Get mouse position from global state
            const mouseX = (window as any).mouseX || 0;
            const mouseY = (window as any).mouseY || 0;

            if (mouseX > 0 && mouseY > 0) {
              const distanceToMouse = Math.sqrt(
                Math.pow(mouseX - dotX, 2) + Math.pow(mouseY - dotY, 2)
              );

              if (distanceToMouse <= hoverRadius) {
                isHoveringOverDot = true;
                // Use requestAnimationFrame to throttle the callback
                if (!(window as any).dotHoverThrottle) {
                  (window as any).dotHoverThrottle = requestAnimationFrame(
                    () => {
                      onDotHover(connection.sharedTags || [], dotX, dotY);
                      (window as any).dotHoverThrottle = null;
                    }
                  );
                }
              }
            }
          }
        }

        ctx.globalAlpha = finalAlpha; // Reset alpha
      }
    });

    // If not hovering over any dots, hide the tooltip
    if (!isHoveringOverDot && onDotLeave) {
      onDotLeave();
    }

    // Draw nodes
    sortedNodes.forEach((node) => {
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

      const glitchX = Math.sin(time * 20 + node.glitchIntensity * 10) * 2;
      const glitchY = Math.cos(time * 15 + node.glitchIntensity * 8) * 2;

      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode?.id === node.id;

      if (previewMode && node.dataLog) {
        renderPreviewView({
          node,
          projected,
          isHovered,
          isSelected,
          time,
          glitchX,
          glitchY,
          ctx,
          imageCache,
        });
      } else {
        renderNormalView({
          node,
          projected,
          isHovered,
          isSelected,
          time,
          glitchX,
          glitchY,
          ctx,
        });
      }
    });

    // Draw growing light effect from ground
    const groundGradient = ctx.createLinearGradient(
      0,
      canvas.height,
      0,
      canvas.height * 0.3
    );
    groundGradient.addColorStop(0, "rgba(0, 255, 255, 0.3)");
    groundGradient.addColorStop(0.5, "rgba(0, 255, 255, 0.1)");
    groundGradient.addColorStop(1, "transparent");

    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.7);
  }, [
    nodes,
    connections,
    time,
    hoveredNode,
    rotationX,
    rotationY,
    zoom,
    sidebarCollapsed,
    previewMode,
    imageCache,
    rotateX,
    rotateY,
    project3D,
    selectedNode,
  ]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-pointer"
      style={{ touchAction: "none" }}
    />
  );
};
