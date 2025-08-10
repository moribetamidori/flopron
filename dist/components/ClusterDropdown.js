import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
export const ClusterDropdown = ({ clusters, selectedClusterId, onClusterSelect, onCreateNewCluster, onShowAllClusters, onSettingsClick, }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCluster, setSelectedCluster] = useState(null);
    useEffect(() => {
        if (selectedClusterId) {
            const cluster = clusters.find((c) => c.id === selectedClusterId);
            setSelectedCluster(cluster || null);
        }
        else {
            setSelectedCluster(null);
        }
    }, [selectedClusterId, clusters]);
    const handleClusterClick = (clusterId) => {
        onClusterSelect(clusterId);
        setIsOpen(false);
    };
    const handleAllClustersClick = () => {
        onShowAllClusters();
        setIsOpen(false);
    };
    const handleCreateNewClick = () => {
        onCreateNewCluster();
        setIsOpen(false);
    };
    const handleSettingsClick = (e, clusterId) => {
        e.stopPropagation();
        onSettingsClick(clusterId);
    };
    return (_jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "flex items-center gap-2 px-3 py-2 bg-black/50 border border-cyan-400/50 rounded text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400 transition-all duration-200", children: [_jsx("span", { className: "font-mono font-bold text-md", children: selectedCluster?.name || "JOURNAL ENTRIES" }), _jsx("span", { className: "text-xs", children: "\u25BC" })] }), _jsx("button", { onClick: (e) => handleSettingsClick(e, selectedClusterId || undefined), className: "px-4 py-2 bg-black/50 border border-cyan-400/50 rounded text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400 transition-all duration-200", title: "Cluster settings", children: "\u2699\uFE0F" })] }), isOpen && (_jsx("div", { className: "absolute top-full left-0 mt-1 w-64 bg-black/95 border border-cyan-400/50 rounded shadow-lg z-50", children: _jsxs("div", { className: "p-2", children: [clusters.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-xs text-cyan-400/70 mb-2 px-2", children: "OTHER CLUSTERS" }), clusters.map((cluster) => (_jsxs("div", { className: `flex items-center justify-between px-2 py-1 rounded text-sm transition-colors ${selectedClusterId === cluster.id
                                        ? "bg-cyan-400/20 text-cyan-300"
                                        : "text-cyan-400 hover:bg-cyan-400/10"}`, children: [_jsxs("button", { onClick: () => handleClusterClick(cluster.id), className: "flex items-center gap-2 flex-1 text-left", children: [_jsx("div", { className: "w-3 h-3 rounded border border-cyan-400/30", style: { backgroundColor: cluster.color || "#ff6b6b" } }), cluster.name] }), _jsx("button", { onClick: (e) => handleSettingsClick(e, cluster.id), className: "px-1 py-1 text-cyan-400/60 hover:text-cyan-400 transition-colors", title: `Settings for ${cluster.name}`, children: "\u2699\uFE0F" })] }, cluster.id)))] })), _jsx("div", { className: "border-t border-cyan-400/30 my-2" }), _jsx("button", { onClick: handleAllClustersClick, className: "w-full text-left px-2 py-1 rounded text-sm text-cyan-400 hover:bg-cyan-400/10 transition-colors", children: "All Clusters" }), _jsx("div", { className: "border-t border-cyan-400/30 my-2" }), _jsx("button", { onClick: handleCreateNewClick, className: "w-full text-left px-2 py-1 rounded text-sm text-cyan-400 hover:bg-cyan-400/10 transition-colors", children: "Create New Cluster" })] }) })), isOpen && (_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setIsOpen(false) }))] }));
};
