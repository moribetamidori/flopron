import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { ColorPicker } from "./ColorPicker";
export const ClusterSettingsModal = ({ cluster, onClose, onUpdate, }) => {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#ff6b6b");
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        if (cluster) {
            setName(cluster.name);
            setColor(cluster.color || "#ff6b6b");
        }
    }, [cluster]);
    const handleSave = async () => {
        if (!cluster || !name.trim())
            return;
        setIsLoading(true);
        try {
            await onUpdate({ name: name.trim(), color });
            onClose();
        }
        catch (error) {
            console.error("Failed to update cluster:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleCancel = () => {
        // Reset to original values
        if (cluster) {
            setName(cluster.name);
            setColor(cluster.color || "#ff6b6b");
        }
        onClose();
    };
    if (!cluster)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-black/95 border border-cyan-400/40 rounded-lg p-6 max-w-md w-full mx-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-mono font-bold text-cyan-400", children: "Cluster Settings" }), _jsx("button", { onClick: onClose, className: "text-cyan-400 hover:text-white transition-colors text-lg", children: "\u2715" })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-cyan-300 text-sm font-semibold mb-2", children: "Cluster Name" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), className: "w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400", placeholder: "Enter cluster name" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-cyan-300 text-sm font-semibold mb-2", children: "Cluster Color" }), _jsx(ColorPicker, { selectedColor: color, onColorChange: setColor, className: "w-full" }), _jsx("p", { className: "text-cyan-400/60 text-xs mt-2", children: "This color will be used for nodes and connections in this cluster" })] }), _jsxs("div", { className: "flex items-center gap-3 p-3 bg-black/40 border border-cyan-400/20 rounded", children: [_jsx("div", { className: "w-8 h-8 rounded border border-cyan-400/30", style: { backgroundColor: color } }), _jsxs("div", { children: [_jsx("p", { className: "text-cyan-300 text-sm font-semibold", children: name || "Cluster Name" }), _jsx("p", { className: "text-cyan-400/60 text-xs", children: color })] })] })] }), _jsxs("div", { className: "flex justify-end gap-3 mt-6 pt-4 border-t border-cyan-400/20", children: [_jsx("button", { onClick: handleCancel, disabled: isLoading, className: "px-4 py-2 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/10 transition-colors disabled:opacity-50", children: "Cancel" }), _jsx("button", { onClick: handleSave, disabled: isLoading || !name.trim(), className: "px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: isLoading ? "Saving..." : "Save Changes" })] })] }) }));
};
