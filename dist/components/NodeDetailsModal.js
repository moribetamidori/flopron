import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { DatabaseService } from "../database/databaseService";
import { TagInput, ImageDropzone } from "./AddNodeModal";
const ImageDisplay = ({ imagePath, alt, className, onClick, onError, }) => {
    const [resolvedPath, setResolvedPath] = useState(null);
    const [error, setError] = useState(false);
    useEffect(() => {
        const resolveImagePath = async () => {
            try {
                if (window.electronAPI?.files?.getImagePath) {
                    const fullPath = await window.electronAPI.files.getImagePath(imagePath);
                    if (fullPath) {
                        setResolvedPath(`file://${fullPath}`);
                    }
                    else {
                        // Fallback to direct path (for existing project images)
                        setResolvedPath(imagePath);
                    }
                }
                else {
                    // Fallback if API not available
                    setResolvedPath(imagePath);
                }
            }
            catch (err) {
                console.error("Error resolving image path:", err);
                setResolvedPath(imagePath);
            }
        };
        if (imagePath) {
            resolveImagePath();
        }
    }, [imagePath]);
    if (error || !resolvedPath) {
        return (_jsx("div", { className: `${className} flex items-center justify-center bg-gray-800 text-gray-400`, children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl mb-2", children: "\uD83D\uDDBC\uFE0F" }), _jsx("div", { className: "text-xs", children: "Image not found" }), _jsx("div", { className: "text-xs mt-1 opacity-70", children: imagePath })] }) }));
    }
    return (_jsx("img", { src: resolvedPath, alt: alt, className: className, onClick: onClick, onError: () => {
            setError(true);
            if (onError)
                onError();
        } }));
};
export const NodeDetailsModal = ({ selectedNode, sidebarCollapsed, onClose, onUpdated, onDeleted, }) => {
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const databaseService = useMemo(() => DatabaseService.getInstance(), []);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState([]);
    const [images, setImages] = useState([]);
    const [links, setLinks] = useState([]);
    const [linkInput, setLinkInput] = useState("");
    const [availableTags, setAvailableTags] = useState([]);
    const [clusters, setClusters] = useState([]);
    const [clusterId, setClusterId] = useState(null);
    useEffect(() => {
        (async () => {
            try {
                const [allTags, allClusters] = await Promise.all([
                    databaseService.getAllTags(),
                    databaseService.getAllNeuronClusters(),
                ]);
                setAvailableTags(allTags);
                setClusters(allClusters);
            }
            catch { }
        })();
    }, [databaseService]);
    // Ensure the tag suggestions are always fresh when switching nodes or entering edit mode
    useEffect(() => {
        (async () => {
            try {
                const allTags = await databaseService.getAllTags();
                setAvailableTags(allTags);
            }
            catch { }
        })();
    }, [databaseService, selectedNode, isEditing]);
    useEffect(() => {
        if (!selectedNode?.dataLog)
            return;
        setTitle(selectedNode.dataLog.title || "");
        setContent(selectedNode.dataLog.content || "");
        setTags(selectedNode.dataLog.tags || []);
        setImages(selectedNode.dataLog.images || []);
        setLinks(selectedNode.dataLog.links || []);
        // If no cluster, default to first available cluster when clusters are loaded
        const nodeClusterId = selectedNode.dataLog.cluster?.id;
        if (nodeClusterId) {
            setClusterId(nodeClusterId);
        }
        else if (clusters.length > 0) {
            setClusterId(clusters[0].id);
        }
    }, [selectedNode, clusters]);
    if (!selectedNode || !selectedNode.dataLog)
        return null;
    const sidebarWidth = sidebarCollapsed ? 48 : 320; // w-12 vs w-80
    return (_jsx("div", { className: "absolute inset-0 z-40 flex pointer-events-none " +
            (isExpanded
                ? "items-stretch justify-end"
                : "items-center justify-center"), children: _jsxs("div", { className: "bg-black/95 border border-cyan-400/50 text-cyan-400 font-mono transition-all duration-300 pointer-events-auto " +
                (isExpanded
                    ? "p-6 max-w-none w-full h-full overflow-y-auto rounded-none"
                    : "rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"), style: {
                transform: isExpanded
                    ? "none"
                    : sidebarCollapsed
                        ? "translateX(0)"
                        : "translateX(160px)",
                width: isExpanded ? `calc(100% - ${sidebarWidth}px)` : undefined,
                height: isExpanded ? "100%" : undefined,
                margin: isExpanded ? 0 : undefined,
            }, children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("div", { className: "flex items-center gap-3", children: isEditing ? (_jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), className: "px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400" })) : (_jsx("h3", { className: "text-xl font-bold", children: selectedNode.dataLog?.title || selectedNode.id })) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "relative", children: _jsx("button", { className: "px-2 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors", onClick: async () => {
                                            if (isEditing) {
                                                // Save changes when clicking "Done"
                                                const updated = await databaseService.updateDataLog(selectedNode.dataLog.id, {
                                                    title,
                                                    content,
                                                    tags,
                                                    images,
                                                    links,
                                                    cluster_id: clusterId || undefined,
                                                });
                                                if (updated) {
                                                    // Regenerate connections for this memory node since tags may have changed
                                                    await databaseService.regenerateConnectionsForNode(selectedNode.id);
                                                    if (onUpdated) {
                                                        onUpdated({ title, content, tags, images, links });
                                                    }
                                                    setIsEditing(false);
                                                }
                                            }
                                            else {
                                                // Toggle to edit mode when clicking "Edit"
                                                setIsEditing(true);
                                            }
                                        }, children: isEditing ? "Done" : "Edit" }) }), _jsx("div", { className: "relative", children: _jsxs("details", { className: "group", children: [_jsx("summary", { className: "list-none px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer", children: "\u22EF" }), _jsx("div", { className: "absolute right-0 mt-2 w-40 bg-black/95 border border-cyan-400/40 rounded shadow-lg z-10", children: _jsx("button", { className: "w-full text-left px-3 py-2 text-red-400 hover:bg-red-900/30", onClick: async () => {
                                                        if (confirm("Delete this node? This cannot be undone.")) {
                                                            try {
                                                                if (onDeleted) {
                                                                    onDeleted(selectedNode.id);
                                                                }
                                                                else {
                                                                    await DatabaseService.getInstance().deleteMemoryNode(selectedNode.id);
                                                                }
                                                                onClose();
                                                            }
                                                            catch (e) {
                                                                console.error(e);
                                                            }
                                                        }
                                                    }, children: "Delete Node" }) })] }) }), _jsx("button", { onClick: () => setIsExpanded((v) => !v), className: "px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors", title: isExpanded ? "Shrink" : "Expand to right side", children: isExpanded ? "⤡" : "⤢" }), _jsx("button", { onClick: onClose, className: "text-cyan-400 hover:text-white transition-colors text-lg", children: "\u2715" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-x-4 gap-y-1 " +
                                (isEditing ? "mt-2" : ""), children: [_jsxs("span", { className: "text-xs text-cyan-300/70", children: [_jsx("span", { className: "opacity-80", children: "Created" }), ":", _jsx("span", { className: "ml-1 text-cyan-200/80", children: selectedNode.dataLog.timestamp.toLocaleString() })] }), _jsxs("span", { className: "text-xs text-cyan-300/70", children: [_jsx("span", { className: "opacity-80", children: "Modified" }), ":", _jsx("span", { className: "ml-1 text-cyan-200/80", children: selectedNode.dataLog.modified_at
                                                ? selectedNode.dataLog.modified_at.toLocaleString()
                                                : selectedNode.dataLog.updated_at
                                                    ? selectedNode.dataLog.updated_at.toLocaleString()
                                                    : selectedNode.dataLog.timestamp.toLocaleString() })] })] }), _jsxs("div", { children: [_jsx("span", { className: "text-cyan-300 font-semibold", children: "Tags:" }), _jsx("div", { className: "mt-2", children: isEditing ? (_jsx(TagInput, { tags: tags, onTagsChange: setTags, availableTags: availableTags })) : (_jsx("div", { className: "flex flex-wrap gap-2", children: tags.map((tag, index) => (_jsx("span", { className: "px-3 py-1 bg-cyan-400/20 border border-cyan-400/50 rounded text-sm", children: tag }, index))) })) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-cyan-300 font-semibold", children: "Cluster:" }), _jsx("div", { className: "mt-2", children: isEditing ? (_jsx("select", { value: clusterId || "", onChange: (e) => setClusterId(e.target.value || null), className: "w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400", children: clusters.map((cluster) => (_jsx("option", { value: cluster.id, children: cluster.name }, cluster.id))) })) : (_jsx("span", { className: "text-white text-sm", children: clusters.find((c) => c.id === clusterId)?.name ||
                                            (clusters.length > 0 ? clusters[0].name : "Loading...") })) })] }), _jsxs("div", { children: [_jsx("span", { className: "text-cyan-300 font-semibold", children: "Content:" }), isEditing ? (_jsx("textarea", { className: "mt-2 w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400", rows: 12, style: { minHeight: "24rem" }, value: content, onChange: (e) => setContent(e.target.value) })) : (_jsx("p", { className: "mt-2 text-white text-sm leading-relaxed", children: content }))] }), _jsxs("div", { children: [_jsx("span", { className: "text-cyan-300 font-semibold", children: "Images:" }), isEditing ? (_jsx("div", { className: "mt-2", children: _jsx(ImageDropzone, { images: images, onImagesChange: setImages }) })) : (_jsx("div", { className: "flex flex-wrap gap-4 mt-2", children: images.map((image, index) => (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx(ImageDisplay, { imagePath: image, alt: `Image ${index + 1}`, className: "w-32 h-32 object-cover rounded border border-purple-400/50 bg-purple-400/10 cursor-pointer hover:border-purple-400/80 transition-colors", onClick: () => setEnlargedImage(image) }), _jsx("span", { className: "text-xs text-purple-300 mt-1 text-center max-w-32 truncate", children: image.split("/").pop() || image })] }, index))) }))] }), _jsxs("div", { children: [_jsx("span", { className: "text-cyan-300 font-semibold", children: "Links:" }), isEditing ? (_jsxs("div", { className: "space-y-3 mt-2", children: [_jsx("input", { type: "url", value: linkInput, onChange: (e) => setLinkInput(e.target.value), onKeyDown: (e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    const v = linkInput.trim();
                                                    if (v && !links.includes(v))
                                                        setLinks([...links, v]);
                                                    setLinkInput("");
                                                }
                                            }, className: "w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400", placeholder: "https://example.com (press Enter to add)" }), links.length > 0 && (_jsx("div", { className: "space-y-1 max-h-32 overflow-y-auto", children: links.map((link, index) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-black/60 border border-cyan-400/30 rounded text-sm", children: [_jsx("span", { className: "text-cyan-300 truncate", children: link }), _jsx("button", { type: "button", onClick: () => setLinks(links.filter((_, i) => i !== index)), className: "ml-2 text-red-400 hover:text-red-300 focus:outline-none", children: "\u00D7" })] }, index))) }))] })) : (_jsx("div", { className: "flex flex-wrap gap-2 mt-2", children: links.map((link, index) => (_jsx("a", { href: link, target: "_blank", rel: "noopener noreferrer", className: "px-3 py-1 bg-blue-400/20 border border-blue-400/50 rounded text-sm text-blue-300 hover:bg-blue-400/30 transition-colors", children: link }, index))) }))] }), enlargedImage && (_jsx("div", { className: "absolute inset-0 flex items-start justify-center pt-8 pointer-events-none bg-black/90 z-10", children: _jsxs("div", { className: "relative max-w-[70%] max-h-[60%] pointer-events-auto", children: [_jsx(ImageDisplay, { imagePath: enlargedImage, alt: "Enlarged image", className: "max-w-full max-h-full object-contain rounded border border-purple-400/50" }), _jsx("button", { onClick: () => setEnlargedImage(null), className: "absolute -top-2 -right-2 text-purple-400 hover:text-white transition-colors text-sm bg-black/90 rounded-full w-6 h-6 flex items-center justify-center border border-purple-400/50 cursor-pointer", children: "\u2715" })] }) })), isEditing && (_jsxs("div", { className: "pt-4 flex justify-end gap-2", children: [_jsx("button", { className: "px-4 py-2 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors", onClick: () => setIsEditing(false), children: "Cancel Edit" }), _jsx("button", { className: "px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500", onClick: async () => {
                                        const updated = await databaseService.updateDataLog(selectedNode.dataLog.id, { title, content, tags, images, links });
                                        if (updated) {
                                            // Regenerate connections for this memory node since tags may have changed
                                            await databaseService.regenerateConnectionsForNode(selectedNode.id);
                                            if (onUpdated) {
                                                onUpdated({ title, content, tags, images, links });
                                            }
                                            setIsEditing(false);
                                        }
                                    }, children: "Save Changes" })] }))] })] }) }));
};
