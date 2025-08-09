import React from "react";
import { MemoryNode } from "../hooks/useDatabaseMemoryTree";
import { getRelativeTime } from "../utils/timeUtils";
import NodePreview from "../NodePreview";

interface SidebarProps {
  nodes: MemoryNode[];
  selectedNode: MemoryNode | null;
  sidebarCollapsed: boolean;
  previewMode: boolean;
  selectedTags: string[];
  onNodeClick: (node: MemoryNode) => void;
  onSidebarToggle: () => void;
  onTagClick: (tag: string) => void;
  onAddClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  selectedNode,
  sidebarCollapsed,
  previewMode,
  selectedTags,
  onNodeClick,
  onSidebarToggle,
  onTagClick,
  onAddClick,
}) => {
  const nodesByNewest = React.useMemo(() => {
    return [...nodes].sort((a, b) => {
      const ta =
        a.dataLog?.timestamp instanceof Date
          ? a.dataLog.timestamp.getTime()
          : 0;
      const tb =
        b.dataLog?.timestamp instanceof Date
          ? b.dataLog.timestamp.getTime()
          : 0;
      return tb - ta; // newest first
    });
  }, [nodes]);

  return (
    <div
      className={`absolute left-0 top-0 bottom-0 bg-black/90 border-r border-cyan-400/30 pointer-events-auto transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? "w-12" : "w-80"
      }`}
    >
      <div className="p-4 border-b border-cyan-400/30">
        <div className="flex justify-between items-center">
          {!sidebarCollapsed && (
            <>
              <div className="flex items-center gap-3">
                <h2 className="text-cyan-400 font-mono font-bold text-lg">
                  JOURNAL ENTRIES
                </h2>
                <button
                  onClick={onAddClick}
                  className="px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                  title="Add new entry"
                >
                  +
                </button>
              </div>
              <button
                onClick={onSidebarToggle}
                className="text-cyan-400 hover:text-white transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                ◀
              </button>
            </>
          )}
          {sidebarCollapsed && (
            <button
              onClick={onSidebarToggle}
              className="text-cyan-400 hover:text-white transition-colors text-lg cursor-pointer"
              title="Expand sidebar"
            >
              ▶
            </button>
          )}
        </div>
        {!sidebarCollapsed && (
          <p className="text-cyan-400/70 text-xs mt-2">
            Click to select • {nodes.length} total entries
          </p>
        )}
      </div>

      {/* Tag Filter Section - At the top */}
      {!sidebarCollapsed && (
        <div className="border-b border-cyan-400/30 p-3 flex-shrink-0">
          <div className="mb-2">
            <h3 className="text-cyan-400 font-mono text-sm font-bold mb-2">
              FILTER BY TAGS
            </h3>
            {selectedTags.length > 0 && (
              <div className="mb-2">
                <span className="text-cyan-400/70 text-xs">
                  Active filters:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-cyan-400/30 border border-cyan-400/50 rounded text-xs text-cyan-300 cursor-pointer hover:bg-cyan-400/50"
                      onClick={() => onTagClick(tag)}
                    >
                      {tag} ×
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* All unique tags */}
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {(() => {
              const allTags = new Set<string>();
              nodes.forEach((node) => {
                node.dataLog?.tags?.forEach((tag) => allTags.add(tag));
              });
              return Array.from(allTags).sort();
            })().map((tag) => (
              <span
                key={tag}
                className={`px-2 py-1 rounded text-xs cursor-pointer transition-all inline-block ${
                  selectedTags.includes(tag)
                    ? "bg-cyan-400/50 border border-cyan-400 text-white"
                    : "bg-black/50 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/20"
                }`}
                onClick={() => onTagClick(tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {!sidebarCollapsed && (
        <div className="flex-1 overflow-y-auto">
          {/* Journal Entries Section */}
          <div className="h-full">
            {previewMode ? (
              // Grid view for preview mode
              <div className="p-4">
                <div className="grid grid-cols-4 gap-3">
                  {nodesByNewest.map((node) => (
                    <div key={node.id} className="flex justify-center">
                      {node.dataLog && (
                        <NodePreview
                          dataLog={node.dataLog}
                          isSelected={selectedNode?.id === node.id}
                          onClick={() => onNodeClick(node)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // List view for normal mode
              <div className="p-4 space-y-2">
                {nodesByNewest.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => onNodeClick(node)}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedNode?.id === node.id
                        ? "bg-cyan-400/20 border-cyan-400 text-white"
                        : "bg-black/50 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold">
                          {node.dataLog?.title && node.dataLog.title.length > 15
                            ? `${node.dataLog.title.substring(0, 15)}...`
                            : node.dataLog?.title || node.id}
                        </span>
                        {node.dataLog && (
                          <span className="text-xs text-cyan-300/70">
                            {getRelativeTime(node.dataLog.timestamp)}
                          </span>
                        )}
                      </div>
                      {node.dataLog &&
                        getRelativeTime(node.dataLog.timestamp) === null && (
                          <span className="text-xs opacity-70">
                            {node.dataLog.timestamp.toLocaleDateString(
                              "en-US",
                              {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </span>
                        )}
                    </div>
                    <div className="text-xs opacity-80 line-clamp-2 overflow-hidden">
                      <div className="break-words">
                        {node.dataLog?.content?.substring(0, 10)}
                        {node.dataLog?.content &&
                          node.dataLog.content.length > 10 &&
                          "..."}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {node.dataLog?.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="px-1.5 py-0.5 bg-cyan-400/20 border border-cyan-400/50 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {node.dataLog && node.dataLog.tags.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-cyan-400/20 border border-cyan-400/50 rounded text-xs">
                          +{node.dataLog.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
