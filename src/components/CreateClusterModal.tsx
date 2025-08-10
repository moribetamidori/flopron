import React, { useState } from "react";
import {
  CreateNeuronClusterInput,
  DatabaseNeuronCluster,
} from "../database/types";

interface CreateClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCluster: (input: CreateNeuronClusterInput) => Promise<void>;
  existingClusters: DatabaseNeuronCluster[];
}

export const CreateClusterModal: React.FC<CreateClusterModalProps> = ({
  isOpen,
  onClose,
  onCreateCluster,
  existingClusters,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a unique color that's different from existing clusters
  const generateUniqueColor = (): string => {
    const predefinedColors = [
      "#ff6b6b", // Red
      "#4ecdc4", // Teal
      "#45b7d1", // Blue
      "#96ceb4", // Green
      "#feca57", // Yellow
      "#ff9ff3", // Pink
      "#54a0ff", // Light Blue
      "#5f27cd", // Purple
      "#00d2d3", // Cyan
      "#ff9f43", // Orange
      "#ff3838", // Bright Red
      "#2ed573", // Bright Green
      "#3742fa", // Bright Blue
      "#ffa502", // Bright Orange
      "#ff6348", // Tomato
      "#5352ed", // Indigo
      "#2f3542", // Dark Gray
      "#747d8c", // Gray
      "#a4b0be", // Light Gray
      "#f1f2f6", // Very Light Gray
    ];

    const usedColors = existingClusters.map((c) => c.color).filter(Boolean);
    const availableColors = predefinedColors.filter(
      (color) => !usedColors.includes(color)
    );

    if (availableColors.length > 0) {
      return availableColors[0];
    }

    // If all predefined colors are used, generate a random one
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70 + Math.floor(Math.random() * 30); // 70-100%
    const lightness = 50 + Math.floor(Math.random() * 20); // 50-70%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a cluster name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const clusterId = `cluster-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      await onCreateCluster({
        id: clusterId,
        name: name.trim(),
        description: description.trim() || undefined,
        color: generateUniqueColor(),
      });

      // Reset form
      setName("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Failed to create cluster:", error);
      alert("Failed to create cluster. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black/95 border border-cyan-400/50 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-cyan-400 font-mono font-bold text-lg">
            CREATE NEW CLUSTER
          </h2>
          <button
            onClick={handleCancel}
            className="text-cyan-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-cyan-400 text-sm font-mono mb-2">
              CLUSTER NAME *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-cyan-400/50 rounded text-cyan-400 focus:outline-none focus:border-cyan-400"
              placeholder="Enter cluster name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-cyan-400 text-sm font-mono mb-2">
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-cyan-400/50 rounded text-cyan-400 focus:outline-none focus:border-cyan-400 resize-none"
              placeholder="Optional description"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-4 py-2 bg-cyan-400/20 border border-cyan-400/50 rounded text-cyan-400 hover:bg-cyan-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSubmitting ? "Creating..." : "Create Cluster"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-black/50 border border-cyan-400/50 rounded text-cyan-400 hover:bg-cyan-400/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-cyan-400/30">
          <p className="text-cyan-400/70 text-xs">
            Clusters help organize your neuron entries into logical groups. Each
            cluster can contain multiple memory nodes.
          </p>
        </div>
      </div>
    </div>
  );
};
