import React from "react";
import { MemoryNode } from "../hooks/useDatabaseMemoryTree";

interface NodeSummaryProps {
  node: MemoryNode;
  x?: number;
  y?: number;
  visible: boolean;
  fixedPosition?: boolean;
}

export const NodeSummary: React.FC<NodeSummaryProps> = ({
  node,
  x,
  y,
  visible,
  fixedPosition = false,
}) => {
  if (!visible || !node.dataLog) return null;

  const { dataLog } = node;
  const tagCount = dataLog.tags?.length || 0;
  const imageCount = dataLog.images?.length || 0;
  const linkCount = dataLog.links?.length || 0;

  // Truncate content for preview
  const truncatedContent =
    dataLog.content.length > 150
      ? dataLog.content.substring(0, 150) + "..."
      : dataLog.content;

  // Format timestamp
  const timestamp = dataLog.timestamp
    ? new Date(dataLog.timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No date";

  return (
    <div
      className={`fixed z-50 bg-black/95 text-cyan-400 font-mono text-xs p-4 rounded-lg border border-cyan-400/50 pointer-events-none shadow-2xl ${
        fixedPosition ? "bottom-48 right-4 w-80" : "max-w-80"
      }`}
      style={{
        ...(fixedPosition
          ? {}
          : {
              left: (x || 0) + 15,
              top: (y || 0) - 10,
              transform: "translateY(-50%)",
            }),
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Header */}
      <div className="border-b border-cyan-400/30 pb-2 mb-3">
        <div className="font-semibold text-cyan-300 text-sm mb-1">
          {dataLog.title || "Untitled"}
        </div>
        <div className="text-gray-400 text-xs">{timestamp}</div>
      </div>

      {/* Content Preview */}
      <div className="mb-3">
        <div className="text-gray-300 leading-relaxed">{truncatedContent}</div>
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        {/* Tags */}
        {tagCount > 0 && (
          <div>
            <div className="text-cyan-300 font-medium mb-1">
              Tags ({tagCount})
            </div>
            <div className="flex flex-wrap gap-1">
              {dataLog.tags?.slice(0, 5).map((tag, index) => (
                <span
                  key={index}
                  className="bg-cyan-400/20 text-cyan-300 px-2 py-1 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {tagCount > 5 && (
                <span className="text-gray-500 text-xs">
                  +{tagCount - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Attachments */}
        <div className="flex space-x-4 text-xs text-gray-400">
          {imageCount > 0 && (
            <div className="flex items-center space-x-1">
              <span>🖼️</span>
              <span>
                {imageCount} image{imageCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {linkCount > 0 && (
            <div className="flex items-center space-x-1">
              <span>🔗</span>
              <span>
                {linkCount} link{linkCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Cluster */}
        {dataLog.cluster && (
          <div className="text-xs text-gray-400">
            <span className="text-cyan-300">Cluster:</span>{" "}
            {dataLog.cluster.name}
          </div>
        )}
      </div>

      {/* Quick Actions Hint */}
      <div className="mt-3 pt-2 border-t border-cyan-400/30 text-xs text-gray-500">
        Click to view details • Right-click for options
      </div>
    </div>
  );
};
