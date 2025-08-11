import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { getRelativeTime } from "../utils/timeUtils";
import NodePreview from "../NodePreview";
import { ClusterDropdown } from "./ClusterDropdown";
export const Sidebar = ({ nodes, selectedNode, sidebarCollapsed, previewMode, selectedTags, clusters, selectedClusterId, onNodeClick, onSidebarToggle, onTagClick, onAddClick, onImageDropClick, onClusterSelect, onCreateNewCluster, onShowAllClusters, onSettingsClick, onDeleteNodes, }) => {
    const nodesByNewest = React.useMemo(() => {
        return [...nodes].sort((a, b) => {
            const ta = a.dataLog?.timestamp instanceof Date
                ? a.dataLog.timestamp.getTime()
                : 0;
            const tb = b.dataLog?.timestamp instanceof Date
                ? b.dataLog.timestamp.getTime()
                : 0;
            return tb - ta; // newest first
        });
    }, [nodes]);
    // Multi-select state and selection rectangle logic
    const [selectedIds, setSelectedIds] = React.useState(new Set());
    const [isSelecting, setIsSelecting] = React.useState(false);
    const [startPoint, setStartPoint] = React.useState(null);
    const [currentPoint, setCurrentPoint] = React.useState(null);
    const containerRef = React.useRef(null);
    const itemRefs = React.useRef({});
    const clearSelection = () => setSelectedIds(new Set());
    const isNoSelectTarget = (target) => {
        if (!(target instanceof HTMLElement))
            return false;
        return !!target.closest('[data-no-select="true"]');
    };
    const getSelectionRect = () => {
        if (!startPoint || !currentPoint || !containerRef.current)
            return null;
        const rect = containerRef.current.getBoundingClientRect();
        const x1 = Math.min(startPoint.x, currentPoint.x);
        const y1 = Math.min(startPoint.y, currentPoint.y);
        const x2 = Math.max(startPoint.x, currentPoint.x);
        const y2 = Math.max(startPoint.y, currentPoint.y);
        return {
            left: x1,
            top: y1,
            width: x2 - x1,
            height: y2 - y1,
            containerLeft: rect.left,
            containerTop: rect.top,
        };
    };
    const intersects = (a, b) => {
        const aRight = a.left + a.width;
        const aBottom = a.top + a.height;
        const bRight = b.left + b.width;
        const bBottom = b.top + b.height;
        return !(aRight < b.left ||
            bRight < a.left ||
            aBottom < b.top ||
            bBottom < a.top);
    };
    const handleMouseDown = (e) => {
        // Only left button and within container
        if (e.button !== 0)
            return;
        if (!containerRef.current)
            return;
        // Ignore clicks on UI controls (add/delete buttons, etc.)
        if (isNoSelectTarget(e.target))
            return;
        const containerRect = containerRef.current.getBoundingClientRect();
        setIsSelecting(true);
        setStartPoint({ x: e.clientX, y: e.clientY });
        setCurrentPoint({ x: e.clientX, y: e.clientY });
        // Prevent text selection while dragging
        e.preventDefault();
        // If user didn't hold a modifier, start a new selection
        if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
            clearSelection();
        }
    };
    const handleMouseMove = (e) => {
        if (!isSelecting)
            return;
        setCurrentPoint({ x: e.clientX, y: e.clientY });
        const sel = getSelectionRect();
        if (!sel)
            return;
        const newlySelected = new Set(selectedIds);
        Object.entries(itemRefs.current).forEach(([id, el]) => {
            if (!el)
                return;
            const r = el.getBoundingClientRect();
            if (intersects(r, {
                left: sel.left,
                top: sel.top,
                width: sel.width,
                height: sel.height,
            })) {
                newlySelected.add(id);
            }
        });
        setSelectedIds(newlySelected);
    };
    const handleMouseUp = async () => {
        if (!isSelecting)
            return;
        setIsSelecting(false);
        setStartPoint(null);
        setCurrentPoint(null);
    };
    const handleDeleteSelected = async () => {
        if (!onDeleteNodes || selectedIds.size === 0)
            return;
        const ids = Array.from(selectedIds);
        const confirmed = window.confirm(`Are you sure you want to delete ${ids.length} node${ids.length > 1 ? "s" : ""}?`);
        if (!confirmed)
            return;
        await onDeleteNodes(ids);
        setSelectedIds(new Set());
    };
    const selectionVisual = () => {
        if (!isSelecting || !startPoint || !currentPoint)
            return null;
        const sel = getSelectionRect();
        if (!sel || !containerRef.current)
            return null;
        const style = {
            position: "fixed",
            left: sel.left,
            top: sel.top,
            width: sel.width,
            height: sel.height,
            border: "1px solid rgba(34,211,238,0.6)",
            background: "rgba(34,211,238,0.1)",
            pointerEvents: "none",
            zIndex: 10,
        };
        return _jsx("div", { style: style });
    };
    return (_jsxs("div", { className: `absolute left-0 top-0 bottom-0 bg-black/90 border-r border-cyan-400/30 pointer-events-auto transition-all duration-300 flex flex-col ${sidebarCollapsed ? "w-12" : "w-80"}`, children: [_jsxs("div", { className: "p-4 border-b border-cyan-400/30", children: [_jsxs("div", { className: "flex justify-between items-center", children: [!sidebarCollapsed && (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex items-center gap-3", children: _jsx(ClusterDropdown, { clusters: clusters, selectedClusterId: selectedClusterId, onClusterSelect: onClusterSelect, onCreateNewCluster: onCreateNewCluster, onShowAllClusters: onShowAllClusters, onSettingsClick: onSettingsClick }) }), _jsx("button", { onClick: onSidebarToggle, className: "text-cyan-400 hover:text-white transition-colors cursor-pointer", title: "Collapse sidebar", children: "\u25C0" })] })), sidebarCollapsed && (_jsx("button", { onClick: onSidebarToggle, className: "text-cyan-400 hover:text-white transition-colors text-lg cursor-pointer", title: "Expand sidebar", children: "\u25B6" }))] }), !sidebarCollapsed && (_jsxs("p", { className: "text-cyan-400/70 text-xs mt-2", children: ["Click to select \u2022 ", nodes.length, " total entries"] }))] }), !sidebarCollapsed && (_jsxs("div", { className: "border-b border-cyan-400/30 p-3 flex-shrink-0", children: [_jsxs("div", { className: "mb-2", children: [_jsx("h3", { className: "text-cyan-400 font-mono text-sm font-bold mb-2", children: "FILTER BY TAGS" }), selectedTags.length > 0 && (_jsxs("div", { className: "mb-2", children: [_jsx("span", { className: "text-cyan-400/70 text-xs", children: "Active filters:" }), _jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: selectedTags.map((tag) => (_jsxs("span", { className: "px-2 py-1 bg-cyan-400/30 border border-cyan-400/50 rounded text-xs text-cyan-300 cursor-pointer hover:bg-cyan-400/50", onClick: () => onTagClick(tag), children: [tag, " \u00D7"] }, tag))) })] }))] }), _jsx("div", { className: "flex flex-wrap gap-1 max-h-20 overflow-y-auto", children: (() => {
                            const allTags = new Set();
                            nodes.forEach((node) => {
                                node.dataLog?.tags?.forEach((tag) => allTags.add(tag));
                            });
                            return Array.from(allTags).sort();
                        })().map((tag) => (_jsx("span", { className: `px-2 py-1 rounded text-xs cursor-pointer transition-all inline-block ${selectedTags.includes(tag)
                                ? "bg-cyan-400/50 border border-cyan-400 text-white"
                                : "bg-black/50 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20"}`, onClick: () => onTagClick(tag), children: tag }, tag))) })] })), !sidebarCollapsed && (_jsx("div", { className: "flex-1 overflow-y-auto", ref: containerRef, onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, children: _jsxs("div", { className: "h-full relative", children: [selectionVisual(), previewMode ? (
                        // Grid view for preview mode
                        _jsxs("div", { className: "p-4 space-y-2", children: [selectedClusterId && (onAddClick || onImageDropClick) && (_jsxs("div", { className: "space-y-2", "data-no-select": "true", children: [onAddClick && (_jsx("button", { onClick: onAddClick, onMouseDown: (e) => e.stopPropagation(), className: "w-full px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer", title: "Add new entry", children: "+" })), onImageDropClick && (_jsx("button", { onClick: onImageDropClick, onMouseDown: (e) => e.stopPropagation(), className: "w-full px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer", title: "AI Image Node Generator", children: "+++" }))] })), selectedIds.size > 1 && (_jsxs("div", { className: "flex items-center justify-between py-1", "data-no-select": "true", children: [_jsxs("div", { className: "text-xs text-cyan-300/80", children: ["Selected: ", selectedIds.size] }), onDeleteNodes && (_jsx("button", { onClick: handleDeleteSelected, onMouseDown: (e) => e.stopPropagation(), className: "px-3 py-1 border border-red-400/60 text-red-300 rounded hover:bg-red-400/10", title: "Delete selected", children: "Delete Selected" }))] })), _jsx("div", { className: "grid grid-cols-4 gap-3 select-none", children: nodesByNewest.map((node) => (_jsx("div", { ref: (el) => {
                                            itemRefs.current[node.id] = el;
                                        }, "data-node-id": node.id, className: `flex justify-center rounded ${selectedIds.has(node.id)
                                            ? "outline outline-2 outline-cyan-400/80"
                                            : ""}`, onClick: () => onNodeClick(node), children: node.dataLog && (_jsx(NodePreview, { dataLog: node.dataLog, isSelected: selectedNode?.id === node.id, onClick: () => onNodeClick(node) })) }, node.id))) })] })) : (
                        // List view for normal mode
                        _jsxs("div", { className: "p-4 space-y-2 select-none", children: [selectedClusterId && onAddClick ? (_jsxs("div", { className: "space-y-2", "data-no-select": "true", children: [_jsx("button", { onClick: onAddClick, onMouseDown: (e) => e.stopPropagation(), className: "w-full px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer", title: "Add new entry", children: "+" }), _jsx("button", { onClick: onImageDropClick, onMouseDown: (e) => e.stopPropagation(), className: "w-full px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer", title: "AI Image Node Generator", children: "+++" })] })) : (_jsx("div", { className: "w-full px-3 py-2 border border-cyan-400/20 text-cyan-400/50 rounded text-center text-sm", children: "Select a cluster to add entries" })), selectedIds.size > 1 && (_jsxs("div", { className: "flex items-center justify-between py-1", "data-no-select": "true", children: [_jsxs("div", { className: "text-xs text-cyan-300/80", children: ["Selected: ", selectedIds.size] }), onDeleteNodes && (_jsx("button", { onClick: handleDeleteSelected, onMouseDown: (e) => e.stopPropagation(), className: "px-3 py-1 border border-red-400/60 text-red-300 rounded hover:bg-red-400/10", title: "Delete selected", children: "Delete Selected" }))] })), nodesByNewest.map((node) => (_jsxs("div", { ref: (el) => {
                                        itemRefs.current[node.id] = el;
                                    }, "data-node-id": node.id, onClick: () => onNodeClick(node), className: `p-3 rounded border cursor-pointer transition-all ${selectedNode?.id === node.id
                                        ? "bg-cyan-400/20 border-cyan-400 text-white"
                                        : "bg-black/50 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"} ${selectedIds.has(node.id)
                                        ? "outline outline-2 outline-cyan-400/80"
                                        : ""}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono text-sm font-bold", children: node.dataLog?.title && node.dataLog.title.length > 15
                                                                ? `${node.dataLog.title.substring(0, 15)}...`
                                                                : node.dataLog?.title || node.id }), node.dataLog && (_jsx("span", { className: "text-xs text-cyan-300/70", children: getRelativeTime(node.dataLog.timestamp) }))] }), node.dataLog &&
                                                    getRelativeTime(node.dataLog.timestamp) === null && (_jsx("span", { className: "text-xs opacity-70", children: node.dataLog.timestamp.toLocaleDateString("en-US", {
                                                        month: "2-digit",
                                                        day: "2-digit",
                                                        year: "numeric",
                                                    }) }))] }), _jsx("div", { className: "text-xs opacity-80 line-clamp-2 overflow-hidden", children: _jsxs("div", { className: "break-words", children: [node.dataLog?.content?.substring(0, 10), node.dataLog?.content &&
                                                        node.dataLog.content.length > 10 &&
                                                        "..."] }) }), _jsxs("div", { className: "flex flex-wrap gap-1 mt-2", children: [node.dataLog?.tags.slice(0, 2).map((tag, index) => (_jsx("span", { className: "px-1.5 py-0.5 bg-cyan-400/20 border border-cyan-400/50 rounded text-xs", children: tag }, index))), node.dataLog && node.dataLog.tags.length > 2 && (_jsxs("span", { className: "px-1.5 py-0.5 bg-cyan-400/20 border border-cyan-400/50 rounded text-xs", children: ["+", node.dataLog.tags.length - 2] }))] })] }, node.id)))] }))] }) }))] }));
};
