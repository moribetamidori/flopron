import { MemoryNode } from "../hooks/useDatabaseMemoryTree";

interface NormalViewProps {
  node: MemoryNode;
  projected: { x: number; y: number };
  isHovered: boolean;
  isSelected: boolean;
  time: number;
  glitchX: number;
  glitchY: number;
  ctx: CanvasRenderingContext2D;
  clusterColor?: string;
}

export const renderNormalView = ({
  node,
  projected,
  isHovered,
  isSelected,
  time,
  glitchX,
  glitchY,
  ctx,
  clusterColor,
}: NormalViewProps) => {
  const pulse = Math.sin(time * 3 + node.pulsePhase) * 0.3 + 0.7;
  const radius = isSelected ? 20 : isHovered ? 15 : 8 + pulse * 5;

  // Use the provided cluster color or fall back to node's data log or default
  const nodeColor = clusterColor || node.dataLog?.cluster?.color || "#00ff88";

  // Node glow
  const gradient = ctx.createRadialGradient(
    projected.x + glitchX,
    projected.y + glitchY,
    0,
    projected.x + glitchX,
    projected.y + glitchY,
    radius * 2
  );
  gradient.addColorStop(
    0,
    isSelected ? "#ff00ff" : isHovered ? "#00ffff" : nodeColor
  );
  gradient.addColorStop(
    0.5,
    isSelected ? "#ff0088" : isHovered ? "#0088ff" : nodeColor + "88"
  );
  gradient.addColorStop(1, "transparent");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(
    projected.x + glitchX,
    projected.y + glitchY,
    radius * 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Node core
  ctx.fillStyle = isSelected ? "#ffffff" : isHovered ? "#ffffff" : nodeColor;
  ctx.beginPath();
  ctx.arc(projected.x + glitchX, projected.y + glitchY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Wireframe effect
  ctx.strokeStyle = nodeColor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(
    projected.x + glitchX,
    projected.y + glitchY,
    radius + 5,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.globalAlpha = 1;
};
