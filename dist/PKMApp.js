import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { useAudioContext } from "./hooks/useAudioContext";
import { useImageCache } from "./hooks/useImageCache";
import { useMemoryTree } from "./hooks/useMemoryTree";
import { use3DRendering } from "./hooks/use3DRendering";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { CanvasRenderer } from "./components/CanvasRenderer";
import { Sidebar } from "./components/Sidebar";
import { NodeDetailsModal } from "./components/NodeDetailsModal";
import { UIOverlay } from "./components/UIOverlay";
export default function PKMApp() {
    // Custom hooks
    const { playNodeSound } = useAudioContext();
    const { imageCache } = useImageCache();
    const { nodes, connections, addNode } = useMemoryTree();
    const { time, rotationX, rotationY, zoom, rotateX, rotateY, project3D, updateRotation, updateZoom, } = use3DRendering();
    // State
    const [hoveredNode, setHoveredNode] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [dotTooltip, setDotTooltip] = useState(null);
    // Event handlers
    const handleNodeClick = (node) => {
        if (selectedNode?.id === node.id) {
            setSelectedNode(null);
        }
        else {
            setSelectedNode(node);
        }
    };
    const handleNodeHover = (nodeId) => {
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
    const currentTooltipRef = useRef(null);
    const handleDotHover = (sharedTags, x, y) => {
        // Only update if the tooltip content has actually changed
        const newTooltip = { tags: sharedTags, x, y };
        const current = currentTooltipRef.current;
        if (!current ||
            current.x !== x ||
            current.y !== y ||
            JSON.stringify(current.tags) !== JSON.stringify(sharedTags)) {
            currentTooltipRef.current = newTooltip;
            setDotTooltip(newTooltip);
        }
    };
    const handleDotLeave = () => {
        currentTooltipRef.current = null;
        setDotTooltip(null);
    };
    // Filter nodes based on selected tags
    const filteredNodes = selectedTags.length > 0
        ? nodes.filter((node) => node.dataLog?.tags?.some((tag) => selectedTags.includes(tag)))
        : nodes;
    // Handle tag selection/deselection
    const handleTagClick = (tag) => {
        setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    };
    // Canvas interaction hook
    const { canvasRef, handleMouseMove, handleMouseDown, handleMouseUp, handleCanvasClick, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, } = useCanvasInteraction({
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
    return (_jsxs("div", { className: "relative w-full h-screen overflow-hidden bg-black", style: { touchAction: "none" }, children: [_jsxs("div", { className: "absolute inset-0", children: [_jsx(CanvasRenderer, { nodes: filteredNodes, connections: connections, hoveredNode: hoveredNode, selectedNode: selectedNode, sidebarCollapsed: sidebarCollapsed, previewMode: previewMode, imageCache: imageCache, time: time, rotationX: rotationX, rotationY: rotationY, zoom: zoom, onDotHover: handleDotHover, onDotLeave: handleDotLeave, rotateX: rotateX, rotateY: rotateY, project3D: project3D }), _jsx("canvas", { ref: canvasRef, className: "w-full h-full cursor-pointer absolute inset-0", style: { touchAction: "none" }, onMouseMove: (e) => {
                            // Track mouse position for dot hover detection
                            window.mouseX = e.clientX;
                            window.mouseY = e.clientY;
                            handleMouseMove(e);
                        }, onMouseDown: handleMouseDown, onMouseUp: handleMouseUp, onMouseLeave: () => {
                            window.mouseX = 0;
                            window.mouseY = 0;
                            handleMouseUp();
                            handleDotLeave();
                        }, onClick: handleCanvasClick, onWheel: handleWheel, onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd })] }), _jsx(Sidebar, { nodes: filteredNodes, selectedNode: selectedNode, sidebarCollapsed: sidebarCollapsed, previewMode: previewMode, selectedTags: selectedTags, onNodeClick: handleNodeClick, onSidebarToggle: handleSidebarToggle, onTagClick: handleTagClick }), _jsx(UIOverlay, { sidebarCollapsed: sidebarCollapsed, previewMode: previewMode, zoom: zoom, hoveredNode: hoveredNode, selectedNode: selectedNode, nodes: nodes, rotationX: rotationX, rotationY: rotationY, onPreviewModeToggle: handlePreviewModeToggle, rotateX: rotateX, rotateY: rotateY, project3D: project3D }), _jsx(NodeDetailsModal, { selectedNode: selectedNode, sidebarCollapsed: sidebarCollapsed, onClose: handleCloseModal }), dotTooltip && (_jsx("div", { className: "fixed z-50 bg-black/90 text-cyan-400 font-mono text-xs p-2 rounded border border-cyan-400/50 pointer-events-none", style: {
                    left: dotTooltip.x + 10,
                    top: dotTooltip.y - 10,
                    transform: "translateY(-100%)",
                }, children: _jsx("div", { className: "space-y-1", children: dotTooltip.tags.map((tag, index) => (_jsxs("div", { className: "text-cyan-300", children: ["\u2022 ", tag] }, index))) }) }))] }));
}
