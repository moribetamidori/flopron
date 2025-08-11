import React from "react";
import { MemoryNode } from "../hooks/useDatabaseMemoryTree";
import { DatabaseNeuronCluster } from "../database/types";
import { getRelativeTime } from "../utils/timeUtils";
import NodePreview from "../NodePreview";
import { ClusterDropdown } from "./ClusterDropdown";

interface SidebarProps {
  nodes: MemoryNode[];
  selectedNode: MemoryNode | null;
  sidebarCollapsed: boolean;
  previewMode: boolean;
  selectedTags: string[];
  clusters: DatabaseNeuronCluster[];
  selectedClusterId: string | null;
  onNodeClick: (node: MemoryNode) => void;
  onSidebarToggle: () => void;
  onTagClick: (tag: string) => void;
  onAddClick?: () => void;
  onImageDropClick?: () => void;
  onClusterSelect: (clusterId: string | null) => void;
  onCreateNewCluster: () => void;
  onShowAllClusters: () => void;
  onSettingsClick: () => void;
  onDeleteNodes?: (nodeIds: string[]) => void | Promise<void>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  nodes,
  selectedNode,
  sidebarCollapsed,
  previewMode,
  selectedTags,
  clusters,
  selectedClusterId,
  onNodeClick,
  onSidebarToggle,
  onTagClick,
  onAddClick,
  onImageDropClick,
  onClusterSelect,
  onCreateNewCluster,
  onShowAllClusters,
  onSettingsClick,
  onDeleteNodes,
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

  // Multi-select state and selection rectangle logic
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [startPoint, setStartPoint] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const [currentPoint, setCurrentPoint] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const clearSelection = () => setSelectedIds(new Set());

  const isNoSelectTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest('[data-no-select="true"]');
  };

  const getSelectionRect = () => {
    if (!startPoint || !currentPoint || !containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const x1 = Math.min(startPoint.x, currentPoint.x);
    const y1 = Math.min(startPoint.y, currentPoint.y);
    const x2 = Math.max(startPoint.x, currentPoint.x);
    const y2 = Math.max(startPoint.y, currentPoint.y);
    return {
      left: x1,
      top: y1,
      width: x2 - x1,
      height: y2 - y1,
      containerLeft: rect.left,
      containerTop: rect.top,
    };
  };

  const intersects = (
    a: DOMRect,
    b: { left: number; top: number; width: number; height: number }
  ) => {
    const aRight = a.left + a.width;
    const aBottom = a.top + a.height;
    const bRight = b.left + b.width;
    const bBottom = b.top + b.height;
    return !(
      aRight < b.left ||
      bRight < a.left ||
      aBottom < b.top ||
      bBottom < a.top
    );
  };

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // Only left button and within container
    if (e.button !== 0) return;
    if (!containerRef.current) return;
    // Ignore clicks on UI controls (add/delete buttons, etc.)
    if (isNoSelectTarget(e.target)) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setIsSelecting(true);
    setStartPoint({ x: e.clientX, y: e.clientY });
    setCurrentPoint({ x: e.clientX, y: e.clientY });
    // Prevent text selection while dragging
    e.preventDefault();
    // If user didn't hold a modifier, start a new selection
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
      clearSelection();
    }
  };

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isSelecting) return;
    setCurrentPoint({ x: e.clientX, y: e.clientY });

    const sel = getSelectionRect();
    if (!sel) return;

    const newlySelected = new Set<string>(selectedIds);

    Object.entries(itemRefs.current).forEach(([id, el]) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (
        intersects(r, {
          left: sel.left,
          top: sel.top,
          width: sel.width,
          height: sel.height,
        })
      ) {
        newlySelected.add(id);
      }
    });

    setSelectedIds(newlySelected);
  };

  const handleMouseUp: React.MouseEventHandler<HTMLDivElement> = async () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  const handleDeleteSelected = async () => {
    if (!onDeleteNodes || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const confirmed = window.confirm(
      `Are you sure you want to delete ${ids.length} node${
        ids.length > 1 ? "s" : ""
      }?`
    );
    if (!confirmed) return;
    await onDeleteNodes(ids);
    setSelectedIds(new Set());
  };

  const selectionVisual = () => {
    if (!isSelecting || !startPoint || !currentPoint) return null;
    const sel = getSelectionRect();
    if (!sel || !containerRef.current) return null;
    const style: React.CSSProperties = {
      position: "fixed",
      left: sel.left,
      top: sel.top,
      width: sel.width,
      height: sel.height,
      border: "1px solid rgba(34,211,238,0.6)",
      background: "rgba(34,211,238,0.1)",
      pointerEvents: "none",
      zIndex: 10,
    };
    return <div style={style} />;
  };

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
                <ClusterDropdown
                  clusters={clusters}
                  selectedClusterId={selectedClusterId}
                  onClusterSelect={onClusterSelect}
                  onCreateNewCluster={onCreateNewCluster}
                  onShowAllClusters={onShowAllClusters}
                  onSettingsClick={onSettingsClick}
                />
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
        <div
          className="flex-1 overflow-y-auto"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Journal Entries Section */}
          <div className="h-full relative">
            {selectionVisual()}
            {previewMode ? (
              // Grid view for preview mode
              <div className="p-4 space-y-2">
                {/* Add buttons in preview mode when a cluster is selected */}
                {selectedClusterId && (onAddClick || onImageDropClick) && (
                  <div className="space-y-2" data-no-select="true">
                    {onAddClick && (
                      <button
                        onClick={onAddClick}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                        title="Add new entry"
                      >
                        +
                      </button>
                    )}
                    {onImageDropClick && (
                      <button
                        onClick={onImageDropClick}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                        title="AI Image Node Generator"
                      >
                        +++
                      </button>
                    )}
                  </div>
                )}

                {/* Bulk actions */}
                {selectedIds.size > 0 && (
                  <div
                    className="flex items-center justify-between py-1"
                    data-no-select="true"
                  >
                    <div className="text-xs text-cyan-300/80">
                      Selected: {selectedIds.size}
                    </div>
                    {onDeleteNodes && (
                      <button
                        onClick={handleDeleteSelected}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="px-3 py-1 border border-red-400/60 text-red-300 rounded hover:bg-red-400/10"
                        title="Delete selected"
                      >
                        Delete Selected
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3 select-none">
                  {nodesByNewest.map((node) => (
                    <div
                      key={node.id}
                      ref={(el) => {
                        itemRefs.current[node.id] = el;
                      }}
                      data-node-id={node.id}
                      className={`flex justify-center rounded ${
                        selectedIds.has(node.id)
                          ? "outline outline-2 outline-cyan-400/80"
                          : ""
                      }`}
                      onClick={() => onNodeClick(node)}
                    >
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
              <div className="p-4 space-y-2 select-none">
                {/* Add New Entry Button - Only show when a cluster is selected */}
                {selectedClusterId && onAddClick ? (
                  <div className="space-y-2" data-no-select="true">
                    <button
                      onClick={onAddClick}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-full px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                      title="Add new entry"
                    >
                      +
                    </button>
                    <button
                      onClick={onImageDropClick}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-full px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer"
                      title="AI Image Node Generator"
                    >
                      +++
                    </button>
                  </div>
                ) : (
                  <div className="w-full px-3 py-2 border border-cyan-400/20 text-cyan-400/50 rounded text-center text-sm">
                    Select a cluster to add entries
                  </div>
                )}

                {/* Bulk actions */}
                {selectedIds.size > 0 && (
                  <div
                    className="flex items-center justify-between py-1"
                    data-no-select="true"
                  >
                    <div className="text-xs text-cyan-300/80">
                      Selected: {selectedIds.size}
                    </div>
                    {onDeleteNodes && (
                      <button
                        onClick={handleDeleteSelected}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="px-3 py-1 border border-red-400/60 text-red-300 rounded hover:bg-red-400/10"
                        title="Delete selected"
                      >
                        Delete Selected
                      </button>
                    )}
                  </div>
                )}

                {nodesByNewest.map((node) => (
                  <div
                    key={node.id}
                    ref={(el) => {
                      itemRefs.current[node.id] = el;
                    }}
                    data-node-id={node.id}
                    onClick={() => onNodeClick(node)}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedNode?.id === node.id
                        ? "bg-cyan-400/20 border-cyan-400 text-white"
                        : "bg-black/50 border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
                    } ${
                      selectedIds.has(node.id)
                        ? "outline outline-2 outline-cyan-400/80"
                        : ""
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
