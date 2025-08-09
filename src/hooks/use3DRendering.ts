import { useState, useEffect } from "react";
import { MemoryNode } from "./useDatabaseMemoryTree";

export const use3DRendering = () => {
  const [time, setTime] = useState(0);
  const [rotationX, setRotationX] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [zoom, setZoom] = useState(1);

  // Animation loop
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      setTime((prev) => prev + 0.016);
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // 3D rotation matrix functions
  const rotateX = (x: number, y: number, z: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x,
      y: y * cos - z * sin,
      z: y * sin + z * cos,
    };
  };

  const rotateY = (x: number, y: number, z: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x * cos + z * sin,
      y: y,
      z: -x * sin + z * cos,
    };
  };

  // Project 3D to 2D
  const project3D = (
    x: number,
    y: number,
    z: number,
    sidebarCollapsed: boolean
  ) => {
    const distance = 1000;
    const scale = distance / (distance + z);
    const sidebarWidth = sidebarCollapsed ? 0 : 320; // 320px when expanded
    const centerX = sidebarWidth + (window.innerWidth - sidebarWidth) / 2;
    return {
      x: x * scale * zoom + centerX,
      y: y * scale * zoom + window.innerHeight / 2,
    };
  };

  const updateRotation = (deltaX: number, deltaY: number) => {
    setRotationY((prev) => prev + deltaX * 0.01);
    setRotationX((prev) => prev + deltaY * 0.01);
  };

  const updateZoom = (delta: number) => {
    setZoom((prevZoom) => Math.max(0.1, Math.min(5, prevZoom + delta)));
  };

  return {
    time,
    rotationX,
    rotationY,
    zoom,
    rotateX,
    rotateY,
    project3D,
    updateRotation,
    updateZoom,
  };
};
