import React, { useState, useEffect } from "react";
import { DatabaseNeuronCluster } from "../database/types";
import { ColorPicker } from "./ColorPicker";

interface ClusterSettingsModalProps {
  cluster: DatabaseNeuronCluster | null;
  onClose: () => void;
  onUpdate: (updates: { name: string; color: string }) => void;
}

export const ClusterSettingsModal: React.FC<ClusterSettingsModalProps> = ({
  cluster,
  onClose,
  onUpdate,
}) => {
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
    if (!cluster || !name.trim()) return;

    setIsLoading(true);
    try {
      await onUpdate({ name: name.trim(), color });
      onClose();
    } catch (error) {
      console.error("Failed to update cluster:", error);
    } finally {
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

  if (!cluster) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black/95 border border-cyan-400/40 rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-mono font-bold text-cyan-400">
            Cluster Settings
          </h2>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Cluster name */}
          <div>
            <label className="block text-cyan-300 text-sm font-semibold mb-2">
              Cluster Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400"
              placeholder="Enter cluster name"
            />
          </div>

          {/* Cluster color */}
          <div>
            <label className="block text-cyan-300 text-sm font-semibold mb-2">
              Cluster Color
            </label>
            <ColorPicker
              selectedColor={color}
              onColorChange={setColor}
              className="w-full"
            />
            <p className="text-cyan-400/60 text-xs mt-2">
              This color will be used for nodes and connections in this cluster
            </p>
          </div>

          {/* Color preview */}
          <div className="flex items-center gap-3 p-3 bg-black/40 border border-cyan-400/20 rounded">
            <div
              className="w-8 h-8 rounded border border-cyan-400/30"
              style={{ backgroundColor: color }}
            />
            <div>
              <p className="text-cyan-300 text-sm font-semibold">
                {name || "Cluster Name"}
              </p>
              <p className="text-cyan-400/60 text-xs">{color}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-cyan-400/20">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !name.trim()}
            className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
