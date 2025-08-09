export const renderNormalView = ({ node, projected, isHovered, isSelected, time, glitchX, glitchY, ctx, }) => {
    const pulse = Math.sin(time * 3 + node.pulsePhase) * 0.3 + 0.7;
    const radius = isSelected ? 20 : isHovered ? 15 : 8 + pulse * 5;
    // Node glow
    const gradient = ctx.createRadialGradient(projected.x + glitchX, projected.y + glitchY, 0, projected.x + glitchX, projected.y + glitchY, radius * 2);
    gradient.addColorStop(0, isSelected ? "#ff00ff" : isHovered ? "#00ffff" : "#00ff88");
    gradient.addColorStop(0.5, isSelected ? "#ff0088" : isHovered ? "#0088ff" : "#00ff44");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(projected.x + glitchX, projected.y + glitchY, radius * 2, 0, Math.PI * 2);
    ctx.fill();
    // Node core
    ctx.fillStyle = isSelected ? "#ffffff" : isHovered ? "#ffffff" : "#00ffff";
    ctx.beginPath();
    ctx.arc(projected.x + glitchX, projected.y + glitchY, radius, 0, Math.PI * 2);
    ctx.fill();
    // Wireframe effect
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(projected.x + glitchX, projected.y + glitchY, radius + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
};
