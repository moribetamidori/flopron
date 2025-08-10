import React, { useState, useEffect } from "react";
import { DatabaseNeuronCluster } from "../database/types";

interface ClusterDropdownProps {
  clusters: DatabaseNeuronCluster[];
  selectedClusterId: string | null;
  onClusterSelect: (clusterId: string | null) => void;
  onCreateNewCluster: () => void;
  onShowAllClusters: () => void;
  onSettingsClick: (clusterId?: string) => void;
}

export const ClusterDropdown: React.FC<ClusterDropdownProps> = ({
  clusters,
  selectedClusterId,
  onClusterSelect,
  onCreateNewCluster,
  onShowAllClusters,
  onSettingsClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] =
    useState<DatabaseNeuronCluster | null>(null);

  useEffect(() => {
    if (selectedClusterId) {
      const cluster = clusters.find((c) => c.id === selectedClusterId);
      setSelectedCluster(cluster || null);
    } else {
      setSelectedCluster(null);
    }
  }, [selectedClusterId, clusters]);

  const handleClusterClick = (clusterId: string) => {
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

  const handleSettingsClick = (e: React.MouseEvent, clusterId?: string) => {
    e.stopPropagation();
    onSettingsClick(clusterId);
  };

  return (
    <div className="relative">
      {/* Main button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-black/50 border border-cyan-400/50 rounded text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400 transition-all duration-200"
        >
          <span className="font-mono font-bold text-md">
            {selectedCluster?.name || "JOURNAL ENTRIES"}
          </span>
          {/* <span className="text-xs opacity-70">
            • {clusters.length} total clusters
          </span> */}
          <span className="text-xs">▼</span>
        </button>

        {/* Settings button */}
        <button
          onClick={(e) =>
            handleSettingsClick(e, selectedClusterId || undefined)
          }
          className="px-4 py-2 bg-black/50 border border-cyan-400/50 rounded text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400 transition-all duration-200"
          title="Cluster settings"
        >
          ⚙️
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-black/95 border border-cyan-400/50 rounded shadow-lg z-50">
          <div className="p-2">
            {/* Other clusters */}
            {clusters.length > 0 && (
              <>
                <div className="text-xs text-cyan-400/70 mb-2 px-2">
                  OTHER CLUSTERS
                </div>
                {clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className={`flex items-center justify-between px-2 py-1 rounded text-sm transition-colors ${
                      selectedClusterId === cluster.id
                        ? "bg-cyan-400/20 text-cyan-300"
                        : "text-cyan-400 hover:bg-cyan-400/10"
                    }`}
                  >
                    <button
                      onClick={() => handleClusterClick(cluster.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <div
                        className="w-3 h-3 rounded border border-cyan-400/30"
                        style={{ backgroundColor: cluster.color || "#ff6b6b" }}
                      />
                      {cluster.name}
                    </button>
                    <button
                      onClick={(e) => handleSettingsClick(e, cluster.id)}
                      className="px-1 py-1 text-cyan-400/60 hover:text-cyan-400 transition-colors"
                      title={`Settings for ${cluster.name}`}
                    >
                      ⚙️
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Divider */}
            <div className="border-t border-cyan-400/30 my-2"></div>

            {/* All Clusters option */}
            <button
              onClick={handleAllClustersClick}
              className="w-full text-left px-2 py-1 rounded text-sm text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              All Clusters
            </button>

            {/* Divider */}
            <div className="border-t border-cyan-400/30 my-2"></div>

            {/* Create New Cluster */}
            <button
              onClick={handleCreateNewClick}
              className="w-full text-left px-2 py-1 rounded text-sm text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              Create New Cluster
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
