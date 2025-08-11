export const renderPreviewView = ({ node, projected, isHovered, isSelected, time, glitchX, glitchY, ctx, imageCache, }) => {
    const size = isSelected ? 80 : isHovered ? 70 : 60;
    const halfSize = size / 2;
    // Draw background
    ctx.fillStyle = isSelected
        ? "rgba(0, 255, 255, 0.3)"
        : isHovered
            ? "rgba(0, 255, 255, 0.2)"
            : "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(projected.x - halfSize + glitchX, projected.y - halfSize + glitchY, size, size);
    // Draw border
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(projected.x - halfSize + glitchX, projected.y - halfSize + glitchY, size, size);
    // Draw content preview
    if (node.dataLog?.images && node.dataLog.images.length > 0) {
        const imageSrc = node.dataLog.images[0];
        const cachedImg = imageCache.get(imageSrc);
        if (cachedImg) {
            // Calculate aspect ratio to maintain image proportions and fill the square
            const boxSize = size - 8;
            const imgAspectRatio = cachedImg.width / cachedImg.height;
            const boxAspectRatio = 1; // Square box
            let drawWidth, drawHeight, sourceX, sourceY, sourceWidth, sourceHeight;
            if (imgAspectRatio > boxAspectRatio) {
                // Image is wider than square - crop from sides to fit height
                drawWidth = boxSize;
                drawHeight = boxSize;
                sourceHeight = cachedImg.height;
                sourceWidth = cachedImg.height; // Square source
                sourceX = (cachedImg.width - sourceWidth) / 2; // Center crop
                sourceY = 0;
            }
            else {
                // Image is taller than square - crop from top/bottom to fit width
                drawWidth = boxSize;
                drawHeight = boxSize;
                sourceWidth = cachedImg.width;
                sourceHeight = cachedImg.width; // Square source
                sourceX = 0;
                sourceY = (cachedImg.height - sourceHeight) / 2; // Center crop
            }
            ctx.drawImage(cachedImg, sourceX, sourceY, sourceWidth, sourceHeight, // Source rectangle
            projected.x - halfSize + 4 + glitchX, projected.y - halfSize + 4 + glitchY, drawWidth, drawHeight // Destination rectangle
            );
        }
        else {
            // Fallback placeholder
            ctx.fillStyle = "#00ff88";
            ctx.fillRect(projected.x - halfSize + 4 + glitchX, projected.y - halfSize + 4 + glitchY, size - 8, size - 8);
            ctx.fillStyle = "#ffffff";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText("IMG", projected.x + glitchX, projected.y + glitchY + 4);
        }
    }
    else if (node.dataLog?.content) {
        // Simple text display
        const text = node.dataLog.content;
        const maxChars = 45;
        const displayText = text.length > maxChars ? text.substring(0, maxChars) + "..." : text;
        // Split text into lines (simple approach)
        const words = displayText.split(" ");
        const lines = [];
        let currentLine = "";
        words.forEach((word) => {
            if ((currentLine + word).length <= 8) {
                currentLine += (currentLine ? " " : "") + word;
            }
            else {
                if (currentLine)
                    lines.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine)
            lines.push(currentLine);
        // Draw text lines
        ctx.fillStyle = "#00ffff";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        lines.slice(0, 4).forEach((line, index) => {
            ctx.fillText(line, projected.x + glitchX, projected.y - halfSize + 12 + index * 10 + glitchY);
        });
    }
};
