import React, { useState } from "react";
import { MemoryNode } from "../hooks/useMemoryTree";

interface NodeDetailsModalProps {
  selectedNode: MemoryNode | null;
  sidebarCollapsed: boolean;
  onClose: () => void;
}

export const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({
  selectedNode,
  sidebarCollapsed,
  onClose,
}) => {
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  if (!selectedNode || !selectedNode.dataLog) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="bg-black/95 border border-cyan-400/50 rounded-lg p-8 text-cyan-400 font-mono max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto transition-all duration-300 pointer-events-auto"
        style={{
          transform: sidebarCollapsed ? "translateX(0)" : "translateX(160px)",
        }}
      >
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold">{selectedNode.id}</h3>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-cyan-300 font-semibold">Timestamp:</span>
            <span className="ml-2 text-white">
              {selectedNode.dataLog.timestamp.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-cyan-300 font-semibold">Tags:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedNode.dataLog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-cyan-400/20 border border-cyan-400/50 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-cyan-300 font-semibold">Content:</span>
            <p className="mt-2 text-white text-sm leading-relaxed">
              {selectedNode.dataLog.content}
            </p>
          </div>

          {selectedNode.dataLog.images.length > 0 && (
            <div>
              <span className="text-cyan-300 font-semibold">Images:</span>
              <div className="flex flex-wrap gap-4 mt-2">
                {selectedNode.dataLog.images.map((image, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <img
                      src={image}
                      alt={`Image ${index + 1}`}
                      className="w-32 h-32 object-cover rounded border border-purple-400/50 bg-purple-400/10 cursor-pointer hover:border-purple-400/80 transition-colors"
                      onClick={() => setEnlargedImage(image)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                    <span className="text-xs text-purple-300 mt-1 text-center">
                      {image}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedNode.dataLog.links.length > 0 && (
            <div>
              <span className="text-cyan-300 font-semibold">Links:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedNode.dataLog.links.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-400/20 border border-blue-400/50 rounded text-sm text-blue-300 hover:bg-blue-400/30 transition-colors"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Enlarged Image Overlay - Inside Modal */}
          {enlargedImage && (
            <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none bg-black/90 z-10">
              <div className="relative max-w-[70%] max-h-[60%] pointer-events-auto">
                <img
                  src={enlargedImage}
                  alt="Enlarged image"
                  className="max-w-full max-h-full object-contain rounded border border-purple-400/50"
                />
                <button
                  onClick={() => setEnlargedImage(null)}
                  className="absolute -top-2 -right-2 text-purple-400 hover:text-white transition-colors text-sm bg-black/90 rounded-full w-6 h-6 flex items-center justify-center border border-purple-400/50 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
