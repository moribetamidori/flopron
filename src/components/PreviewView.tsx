import { MemoryNode } from "../hooks/useMemoryTree";

interface PreviewViewProps {
  node: MemoryNode;
  projected: { x: number; y: number };
  isHovered: boolean;
  isSelected: boolean;
  time: number;
  glitchX: number;
  glitchY: number;
  ctx: CanvasRenderingContext2D;
  imageCache: Map<string, HTMLImageElement>;
}

export const renderPreviewView = ({
  node,
  projected,
  isHovered,
  isSelected,
  time,
  glitchX,
  glitchY,
  ctx,
  imageCache,
}: PreviewViewProps) => {
  const size = isSelected ? 80 : isHovered ? 70 : 60;
  const halfSize = size / 2;

  // Draw background
  ctx.fillStyle = isSelected
    ? "rgba(0, 255, 255, 0.3)"
    : isHovered
    ? "rgba(0, 255, 255, 0.2)"
    : "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(
    projected.x - halfSize + glitchX,
    projected.y - halfSize + glitchY,
    size,
    size
  );

  // Draw border
  ctx.strokeStyle = "#00ffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    projected.x - halfSize + glitchX,
    projected.y - halfSize + glitchY,
    size,
    size
  );

  // Draw content preview
  if (node.dataLog?.images && node.dataLog.images.length > 0) {
    const imageSrc = node.dataLog.images[0];
    const cachedImg = imageCache.get(imageSrc);

    if (cachedImg) {
      // Simple image display - just draw the image in the box
      const boxSize = size - 8;
      ctx.drawImage(
        cachedImg,
        projected.x - halfSize + 4 + glitchX,
        projected.y - halfSize + 4 + glitchY,
        boxSize,
        boxSize
      );
    } else {
      // Fallback placeholder
      ctx.fillStyle = "#00ff88";
      ctx.fillRect(
        projected.x - halfSize + 4 + glitchX,
        projected.y - halfSize + 4 + glitchY,
        size - 8,
        size - 8
      );

      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("IMG", projected.x + glitchX, projected.y + glitchY + 4);
    }
  } else if (node.dataLog?.content) {
    // Simple text display
    const text = node.dataLog.content;
    const maxChars = 45;
    const displayText =
      text.length > maxChars ? text.substring(0, maxChars) + "..." : text;

    // Split text into lines (simple approach)
    const words = displayText.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length <= 8) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    // Draw text lines
    ctx.fillStyle = "#00ffff";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    lines.slice(0, 4).forEach((line, index) => {
      ctx.fillText(
        line,
        projected.x + glitchX,
        projected.y - halfSize + 12 + index * 10 + glitchY
      );
    });
  }
};
