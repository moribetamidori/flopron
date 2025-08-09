import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { getRelativeTime } from "../utils/timeUtils";
import NodePreview from "../NodePreview";
export const Sidebar = ({ nodes, selectedNode, sidebarCollapsed, previewMode, selectedTags, onNodeClick, onSidebarToggle, onTagClick, onAddClick, }) => {
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
    return (_jsxs("div", { className: `absolute left-0 top-0 bottom-0 bg-black/90 border-r border-cyan-400/30 pointer-events-auto transition-all duration-300 flex flex-col ${sidebarCollapsed ? "w-12" : "w-80"}`, children: [_jsxs("div", { className: "p-4 border-b border-cyan-400/30", children: [_jsxs("div", { className: "flex justify-between items-center", children: [!sidebarCollapsed && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h2", { className: "text-cyan-400 font-mono font-bold text-lg", children: "JOURNAL ENTRIES" }), _jsx("button", { onClick: onAddClick, className: "px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer", title: "Add new entry", children: "+" })] }), _jsx("button", { onClick: onSidebarToggle, className: "text-cyan-400 hover:text-white transition-colors cursor-pointer", title: "Collapse sidebar", children: "\u25C0" })] })), sidebarCollapsed && (_jsx("button", { onClick: onSidebarToggle, className: "text-cyan-400 hover:text-white transition-colors text-lg cursor-pointer", title: "Expand sidebar", children: "\u25B6" }))] }), !sidebarCollapsed && (_jsxs("p", { className: "text-cyan-400/70 text-xs mt-2", children: ["Click to select \u2022 ", nodes.length, " total entries"] }))] }), !sidebarCollapsed && (_jsxs("div", { className: "border-b border-cyan-400/30 p-3 flex-shrink-0", children: [_jsxs("div", { className: "mb-2", children: [_jsx("h3", { className: "text-cyan-400 font-mono text-sm font-bold mb-2", children: "FILTER BY TAGS" }), selectedTags.length > 0 && (_jsxs("div", { className: "mb-2", children: [_jsx("span", { className: "text-cyan-400/70 text-xs", children: "Active filters:" }), _jsx("div", { className: "flex flex-wrap gap-1 mt-1", children: selectedTags.map((tag) => (_jsxs("span", { className: "px-2 py-1 bg-cyan-400/30 border border-cyan-400/50 rounded text-xs text-cyan-300 cursor-pointer hover:bg-cyan-400/50", onClick: () => onTagClick(tag), children: [tag, " \u00D7"] }, tag))) })] }))] }), _jsx("div", { className: "flex flex-wrap gap-1 max-h-20 overflow-y-auto", children: (() => {
                            const allTags = new Set();
                            nodes.forEach((node) => {
                                node.dataLog?.tags?.forEach((tag) => allTags.add(tag));
                            });
                            return Array.from(allTags).sort();
                        })().map((tag) => (_jsx("span", { className: `px-2 py-1 rounded text-xs cursor-pointer transition-all inline-block ${selectedTags.includes(tag)
                                ? "bg-cyan-400/50 border border-cyan-400 text-white"
                                : "bg-black/50 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20"}`, onClick: () => onTagClick(tag), children: tag }, tag))) })] })), !sidebarCollapsed && (_jsx("div", { className: "flex-1 overflow-y-auto", children: _jsx("div", { className: "h-full", children: previewMode ? (
                    // Grid view for preview mode
                    _jsx("div", { className: "p-4", children: _jsx("div", { className: "grid grid-cols-4 gap-3", children: nodesByNewest.map((node) => (_jsx("div", { className: "flex justify-center", children: node.dataLog && (_jsx(NodePreview, { dataLog: node.dataLog, isSelected: selectedNode?.id === node.id, onClick: () => onNodeClick(node) })) }, node.id))) }) })) : (
                    // List view for normal mode
                    _jsx("div", { className: "p-4 space-y-2", children: nodesByNewest.map((node) => (_jsxs("div", { onClick: () => onNodeClick(node), className: `p-3 rounded border cursor-pointer transition-all ${selectedNode?.id === node.id
                                ? "bg-cyan-400/20 border-cyan-400 text-white"
                                : "bg-black/50 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono text-sm font-bold", children: node.dataLog?.title && node.dataLog.title.length > 15
                                                        ? `${node.dataLog.title.substring(0, 15)}...`
                                                        : node.dataLog?.title || node.id }), node.dataLog && (_jsx("span", { className: "text-xs text-cyan-300/70", children: getRelativeTime(node.dataLog.timestamp) }))] }), node.dataLog &&
                                            getRelativeTime(node.dataLog.timestamp) === null && (_jsx("span", { className: "text-xs opacity-70", children: node.dataLog.timestamp.toLocaleDateString("en-US", {
                                                month: "2-digit",
                                                day: "2-digit",
                                                year: "numeric",
                                            }) }))] }), _jsx("div", { className: "text-xs opacity-80 line-clamp-2 overflow-hidden", children: _jsxs("div", { className: "break-words", children: [node.dataLog?.content?.substring(0, 10), node.dataLog?.content &&
                                                node.dataLog.content.length > 10 &&
                                                "..."] }) }), _jsxs("div", { className: "flex flex-wrap gap-1 mt-2", children: [node.dataLog?.tags.slice(0, 2).map((tag, index) => (_jsx("span", { className: "px-1.5 py-0.5 bg-cyan-400/20 border border-cyan-400/50 rounded text-xs", children: tag }, index))), node.dataLog && node.dataLog.tags.length > 2 && (_jsxs("span", { className: "px-1.5 py-0.5 bg-cyan-400/20 border border-cyan-400/50 rounded text-xs", children: ["+", node.dataLog.tags.length - 2] }))] })] }, node.id))) })) }) }))] }));
};
