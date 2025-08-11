import React, { useState, useRef, useCallback, useEffect } from "react";
import { MemoryNode } from "../hooks/useDatabaseMemoryTree";
import { DatabaseNeuronCluster } from "../database/types";
import { GeminiService } from "../services/geminiService";

interface ImageDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNodesGenerated: (
    nodes: Array<{
      title: string;
      content: string;
      tags: string[];
      imagePath: string;
      clusterId: string | null;
    }>
  ) => void;
  selectedClusterId: string | null;
  clusters: DatabaseNeuronCluster[];
  existingNodes: MemoryNode[];
  onOpenSettings?: () => void;
}

interface ProcessingImage {
  file: File;
  id: string;
  status: "processing" | "completed" | "error";
  result?: {
    title: string;
    content: string;
    tags: string[];
  };
  error?: string;
}

export const ImageDropModal: React.FC<ImageDropModalProps> = ({
  isOpen,
  onClose,
  onNodesGenerated,
  selectedClusterId,
  clusters,
  existingNodes,
  onOpenSettings,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingImages, setProcessingImages] = useState<ProcessingImage[]>(
    []
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentClusterId, setCurrentClusterId] = useState<string | null>(
    selectedClusterId
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure we have a cluster selected when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (!currentClusterId) {
      const fallback = selectedClusterId || clusters[0]?.id || null;
      setCurrentClusterId(fallback);
    }
  }, [isOpen, currentClusterId, selectedClusterId, clusters]);

  // Sync cluster when parent selection changes
  useEffect(() => {
    if (isOpen && selectedClusterId) {
      setCurrentClusterId(selectedClusterId);
    }
  }, [isOpen, selectedClusterId]);

  // Get existing tags and content for AI context
  const existingTags = React.useMemo(() => {
    const tags = new Set<string>();
    existingNodes.forEach((node) => {
      node.dataLog?.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [existingNodes]);

  const existingContent = React.useMemo(() => {
    return existingNodes
      .map((node) => node.dataLog?.content || "")
      .filter(Boolean)
      .join(" ");
  }, [existingNodes]);

  const generateNodeFromImage = useCallback(
    async (
      file: File
    ): Promise<{ title: string; content: string; tags: string[] }> => {
      try {
        // Convert image to base64
        const base64 = await fileToBase64(file);

        // Use GeminiService
        const geminiService = GeminiService.getInstance();
        const currentCluster = clusters.find((c) => c.id === currentClusterId);
        const result = await geminiService.generateNodeFromImage({
          image: base64,
          clusterName: currentCluster?.name || "General",
          existingTags,
          existingContent: existingContent.substring(0, 1000), // Limit context size
        });

        return result;
      } catch (error) {
        console.error("Error generating node from image:", error);

        // Return fallback content if AI generation fails
        return {
          title: `Image: ${file.name}`,
          content: `AI analysis failed for this image. Please review and edit the content manually. Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          tags: ["image", "analysis-failed", "needs-review"],
        };
      }
    },
    [clusters, currentClusterId, existingTags, existingContent]
  );

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/...;base64, prefix
        resolve(base64.split(",")[1]);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const processImages = useCallback(
    async (files: File[]) => {
      // Re-check using freshest state
      if (!currentClusterId) {
        alert("Please select a cluster first");
        return;
      }

      setIsProcessing(true);

      const newProcessingImages: ProcessingImage[] = files.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: "processing",
      }));

      setProcessingImages(newProcessingImages);

      // Process each image with AI
      for (const processingImage of newProcessingImages) {
        try {
          const result = await generateNodeFromImage(processingImage.file);

          setProcessingImages((prev) =>
            prev.map((img) =>
              img.id === processingImage.id
                ? { ...img, status: "completed", result }
                : img
            )
          );
        } catch (error) {
          setProcessingImages((prev) =>
            prev.map((img) =>
              img.id === processingImage.id
                ? {
                    ...img,
                    status: "error",
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  }
                : img
            )
          );
        }
      }

      setIsProcessing(false);
    },
    [currentClusterId, generateNodeFromImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        processImages(imageFiles);
      }
    },
    [processImages]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        processImages(imageFiles);
      }
    },
    [processImages]
  );

  const handleGenerateNodes = async () => {
    const completedImages = processingImages.filter(
      (img) => img.status === "completed"
    );

    if (completedImages.length === 0) {
      alert("No images have been processed successfully");
      return;
    }

    setIsSaving(true);

    try {
      // Save all images first
      const nodesData = [];
      for (const img of completedImages) {
        try {
          // Generate a unique filename
          const timestamp = Date.now();
          const ext = img.file.name.split(".").pop()?.toLowerCase() || "jpg";
          const filename = `${timestamp}-${Math.random()
            .toString(36)
            .substring(2)}.${ext}`;

          // Convert file to ArrayBuffer
          const arrayBuffer = await img.file.arrayBuffer();

          // Save the file via Electron IPC
          const savedPath = await (window as any).electronAPI.files.saveImage(
            arrayBuffer,
            filename
          );

          nodesData.push({
            title: img.result!.title,
            content: img.result!.content,
            tags: img.result!.tags,
            imagePath: savedPath,
            clusterId: currentClusterId,
          });
        } catch (error) {
          console.error(`Failed to save image ${img.file.name}:`, error);
          // Still create the node but without the image
          nodesData.push({
            title: img.result!.title,
            content: img.result!.content,
            tags: img.result!.tags,
            imagePath: "",
            clusterId: currentClusterId,
          });
        }
      }

      onNodesGenerated(nodesData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = (imageId: string) => {
    const image = processingImages.find((img) => img.id === imageId);
    if (image) {
      processImages([image.file]);
    }
  };

  const handleRemove = (imageId: string) => {
    setProcessingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-black border border-cyan-400/50 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-cyan-400 font-mono text-lg font-bold">
            AI Image Node Generator
          </h2>
          <div className="flex gap-2">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="text-cyan-400 hover:text-white transition-colors text-sm"
                title="Gemini API Settings"
              >
                ⚙️
              </button>
            )}
            <button
              onClick={onClose}
              className="text-cyan-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cluster Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-cyan-300 mb-2">
            Cluster
          </label>
          <select
            value={currentClusterId || ""}
            onChange={(e) => setCurrentClusterId(e.target.value || null)}
            className="w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400"
          >
            <option value="">Select a cluster</option>
            {clusters.map((cluster) => (
              <option key={cluster.id} value={cluster.id}>
                {cluster.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-cyan-300/60 mt-1">
            Choose which cluster these images will be added to.
          </p>
        </div>

        {!currentClusterId ? (
          <div className="text-red-400 text-center py-8">
            <div className="text-2xl mb-4">⚠️</div>
            <div className="text-lg font-bold mb-2">No Cluster Selected</div>
            <div className="text-sm">
              Please select a cluster from the sidebar before using the AI Image
              Generator.
            </div>
          </div>
        ) : (
          <>
            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-cyan-400/50 hover:border-cyan-400/70"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="text-cyan-400 mb-4">
                <div className="text-4xl mb-2">📸</div>
                <div className="text-lg font-bold mb-2">Drop Images Here</div>
                <div className="text-sm text-cyan-400/70">
                  Or click to select files
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/30 transition-colors"
              >
                Select Images
              </button>
            </div>

            {/* Processing Status */}
            {processingImages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-cyan-400 font-mono text-sm font-bold mb-3">
                  Processing Images (
                  {
                    processingImages.filter((img) => img.status === "completed")
                      .length
                  }
                  /{processingImages.length})
                </h3>

                <div className="space-y-3">
                  {processingImages.map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center gap-3 p-3 border border-cyan-400/30 rounded"
                    >
                      <div className="w-12 h-12 bg-cyan-400/20 rounded flex items-center justify-center">
                        {img.status === "processing" && (
                          <div className="animate-spin text-cyan-400">⏳</div>
                        )}
                        {img.status === "completed" && (
                          <div className="text-green-400">✓</div>
                        )}
                        {img.status === "error" && (
                          <div className="text-red-400">✗</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-cyan-300 text-sm truncate">
                          {img.file.name}
                        </div>
                        {img.status === "completed" && img.result && (
                          <div className="text-xs text-cyan-400/70 mt-1">
                            <div className="truncate">
                              Title: {img.result.title}
                            </div>
                            <div className="truncate">
                              Tags: {img.result.tags.join(", ")}
                            </div>
                          </div>
                        )}
                        {img.status === "error" && (
                          <div className="text-xs text-red-400 mt-1">
                            {img.error}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {img.status === "error" && (
                          <button
                            onClick={() => handleRetry(img.id)}
                            className="px-2 py-1 text-xs bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/30"
                          >
                            Retry
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(img.id)}
                          className="px-2 py-1 text-xs bg-red-400/20 border border-red-400/50 text-red-300 rounded hover:bg-red-400/30"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateNodes}
                disabled={
                  isProcessing ||
                  isSaving ||
                  processingImages.filter((img) => img.status === "completed")
                    .length === 0
                }
                className="px-4 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing
                  ? "Processing..."
                  : isSaving
                  ? "Saving..."
                  : "Generate Nodes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
