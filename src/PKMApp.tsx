import React, { useState, useRef, useEffect } from "react";

// Extend Window interface to include mouse position
declare global {
  interface Window {
    mouseX: number;
    mouseY: number;
    dotHoverThrottle: number | null;
  }
}

import { useAudioContext } from "./hooks/useAudioContext";
import { useImageCache } from "./hooks/useImageCache";
import {
  useDatabaseMemoryTree,
  MemoryNode,
  Connection,
} from "./hooks/useDatabaseMemoryTree";
import { use3DRendering } from "./hooks/use3DRendering";
import { useCanvasInteraction } from "./hooks/useCanvasInteraction";
import { CanvasRenderer } from "./components/CanvasRenderer";
import { Sidebar } from "./components/Sidebar";
import { NodeDetailsModal } from "./components/NodeDetailsModal";
import { UIOverlay } from "./components/UIOverlay";
import { AddNodeModal } from "./components/AddNodeModal";
import { ClusterSettingsModal } from "./components/ClusterSettingsModal";
import { CreateClusterModal } from "./components/CreateClusterModal";
import { AllClustersGrid } from "./components/AllClustersGrid";
import { ImageDropModal } from "./components/ImageDropModal";
import { GeminiSettingsModal } from "./components/GeminiSettingsModal";
import { DatabaseService } from "./database/databaseService";
import {
  DatabaseNeuronCluster,
  CreateNeuronClusterInput,
  UpdateNeuronClusterInput,
  DataLogWithRelations,
} from "./database/types";

export default function PKMApp() {
  // Custom hooks
  const { playNodeSound } = useAudioContext();
  const { nodes, connections, addNode, deleteNode, refreshData } =
    useDatabaseMemoryTree();
  const { imageCache } = useImageCache({ nodes });
  const {
    time,
    rotationX,
    rotationY,
    zoom,
    rotateX,
    rotateY,
    project3D,
    updateRotation,
    updateZoom,
  } = use3DRendering();

  // State
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [clusters, setClusters] = useState<DatabaseNeuronCluster[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    null
  );
  const [showClusterSettings, setShowClusterSettings] = useState(false);
  const [showCreateCluster, setShowCreateCluster] = useState(false);
  const [showAllClustersGrid, setShowAllClustersGrid] = useState(false);
  const [filteredNodes, setFilteredNodes] = useState<MemoryNode[]>([]);
  const [filteredConnections, setFilteredConnections] = useState<Connection[]>(
    []
  );
  const [editingCluster, setEditingCluster] =
    useState<DatabaseNeuronCluster | null>(null);
  const [showImageDropModal, setShowImageDropModal] = useState(false);
  const [showGeminiSettings, setShowGeminiSettings] = useState(false);

  const [dotTooltip, setDotTooltip] = useState<{
    tags: string[];
    x: number;
    y: number;
  } | null>(null);

  // Database service
  const databaseService = DatabaseService.getInstance();

  // Load clusters on mount
  useEffect(() => {
    loadClusters();
  }, []);

  // Function to generate connections based on shared tags for given nodes
  const generateSharedTagConnections = (
    nodeList: MemoryNode[]
  ): Connection[] => {
    const generatedConnections: Connection[] = [];

    // Generate connections between all pairs of nodes
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const nodeA = nodeList[i];
        const nodeB = nodeList[j];

        if (nodeA.dataLog?.tags && nodeB.dataLog?.tags) {
          // Find shared tags
          const sharedTags = nodeA.dataLog.tags.filter((tag) =>
            nodeB.dataLog!.tags.includes(tag)
          );

          if (sharedTags.length > 0) {
            // Check if this connection already exists in database connections
            const existingConnection = connections.find(
              (conn) =>
                (conn.from === nodeA.id && conn.to === nodeB.id) ||
                (conn.from === nodeB.id && conn.to === nodeA.id)
            );

            if (!existingConnection) {
              generatedConnections.push({
                from: nodeA.id,
                to: nodeB.id,
                glitchOffset: Math.random() * 10,
                sharedTags: sharedTags,
              });
            }
          }
        }
      }
    }

    return generatedConnections;
  };

  // Filter nodes and connections based on selected cluster and tags
  useEffect(() => {
    let filteredNodes = nodes;

    // Filter by cluster
    if (selectedClusterId) {
      filteredNodes = filteredNodes.filter(
        (node) => node.dataLog?.cluster?.id === selectedClusterId
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filteredNodes = filteredNodes.filter((node) =>
        node.dataLog?.tags?.some((tag) => selectedTags.includes(tag))
      );
    }

    setFilteredNodes(filteredNodes);

    // Filter existing connections to only include connections between filtered nodes
    const filteredNodeIds = filteredNodes.map((node) => node.id);
    const filteredExistingConnections = connections.filter(
      (connection) =>
        filteredNodeIds.includes(connection.from) &&
        filteredNodeIds.includes(connection.to)
    );

    // Generate shared tag connections for the filtered nodes
    const generatedConnections = generateSharedTagConnections(filteredNodes);

    // Combine existing and generated connections
    const allFilteredConnections = [
      ...filteredExistingConnections,
      ...generatedConnections,
    ];

    setFilteredConnections(allFilteredConnections);
  }, [nodes, connections, selectedClusterId, selectedTags]);

  const loadClusters = async () => {
    try {
      const allClusters = await databaseService.getAllNeuronClusters();
      console.log(`🔍 Found ${allClusters.length} existing clusters`);

      // If no clusters exist, create a default cluster
      if (allClusters.length === 0) {
        console.log("🚀 No clusters found - creating default cluster...");
        const defaultClusterInput = {
          id: "default-cluster",
          name: "Default Cluster",
          description: "Your default knowledge cluster",
          color: "#00ffff", // cyan color
        };

        try {
          await databaseService.createNeuronCluster(defaultClusterInput);
          console.log("✅ Default cluster created successfully");

          // Reload clusters after creating the default one
          const updatedClusters = await databaseService.getAllNeuronClusters();
          setClusters(updatedClusters);
          console.log(
            `📊 Updated clusters list: ${updatedClusters.length} clusters`
          );

          // Set the default cluster as selected
          setSelectedClusterId("default-cluster");
          console.log("🎯 Default cluster selected");
        } catch (error) {
          console.error("❌ Failed to create default cluster:", error);
        }
      } else {
        console.log("📋 Using existing clusters");
        setClusters(allClusters);

        // Set default cluster if none selected
        if (!selectedClusterId) {
          const defaultCluster = allClusters.find(
            (c) => c.id === "default-cluster"
          );
          const selectedId = defaultCluster?.id || allClusters[0]?.id || null;
          setSelectedClusterId(selectedId);
          console.log(`🎯 Selected cluster: ${selectedId}`);
        }
      }
    } catch (error) {
      console.error("❌ Failed to load clusters:", error);
    }
  };

  // Event handlers
  const handleNodeClick = (node: MemoryNode) => {
    if (selectedNode?.id === node.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode(node);
    }
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNode(nodeId);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handlePreviewModeToggle = () => {
    setPreviewMode(!previewMode);
  };

  const handleCloseModal = () => {
    setSelectedNode(null);
  };

  // Cluster handlers
  const handleClusterSelect = (clusterId: string | null) => {
    setSelectedClusterId(clusterId);
  };

  const handleCreateNewCluster = () => {
    setShowCreateCluster(true);
  };

  const handleShowAllClusters = () => {
    setShowAllClustersGrid(true);
  };

  const handleClusterSelectFromGrid = (clusterId: string) => {
    setSelectedClusterId(clusterId);
    setShowAllClustersGrid(false);
  };

  const handleBackFromAllClusters = () => {
    setShowAllClustersGrid(false);
  };

  const handleSettingsClick = (clusterId?: string) => {
    if (clusterId) {
      const cluster = clusters.find((c) => c.id === clusterId);
      if (cluster) {
        setEditingCluster(cluster);
        setShowClusterSettings(true);
      }
    } else {
      // Show settings for currently selected cluster
      const cluster = clusters.find((c) => c.id === selectedClusterId);
      if (cluster) {
        setEditingCluster(cluster);
        setShowClusterSettings(true);
      }
    }
  };

  const handleCreateCluster = async (input: CreateNeuronClusterInput) => {
    try {
      await databaseService.createNeuronCluster(input);
      await loadClusters();
      // Select the newly created cluster
      setSelectedClusterId(input.id);
    } catch (error) {
      console.error("Failed to create cluster:", error);
      throw error;
    }
  };

  const handleUpdateCluster = async (
    id: string,
    updates: UpdateNeuronClusterInput
  ) => {
    try {
      await databaseService.updateNeuronCluster(id, updates);
      await loadClusters();
    } catch (error) {
      console.error("Failed to update cluster:", error);
      throw error;
    }
  };

  const handleDeleteCluster = async (id: string) => {
    try {
      await databaseService.deleteNeuronCluster(id);
      await loadClusters();
      // If the deleted cluster was selected, switch to default cluster
      if (selectedClusterId === id) {
        const defaultCluster = clusters.find((c) => c.id === "default-cluster");
        setSelectedClusterId(defaultCluster?.id || null);
      }
    } catch (error) {
      console.error("Failed to delete cluster:", error);
      throw error;
    }
  };

  // Use ref to track current tooltip to prevent infinite loops
  const currentTooltipRef = useRef<{
    tags: string[];
    x: number;
    y: number;
  } | null>(null);

  const handleDotHover = (sharedTags: string[], x: number, y: number) => {
    // Only update if the tooltip content has actually changed
    const newTooltip = { tags: sharedTags, x, y };
    const current = currentTooltipRef.current;

    if (
      !current ||
      current.x !== x ||
      current.y !== y ||
      JSON.stringify(current.tags) !== JSON.stringify(sharedTags)
    ) {
      currentTooltipRef.current = newTooltip;
      setDotTooltip(newTooltip);
    }
  };

  const handleDotLeave = () => {
    currentTooltipRef.current = null;
    setDotTooltip(null);
  };

  // Handle tag selection/deselection
  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleImageDropClick = () => {
    setShowImageDropModal(true);
  };

  const handleDeleteMultiple = async (ids: string[]) => {
    // Delete sequentially to keep DB consistent
    for (const id of ids) {
      try {
        await deleteNode(id);
      } catch (err) {
        console.error("Failed to delete node", id, err);
      }
    }
    refreshData();
  };

  const handleOpenGeminiSettings = () => {
    setShowGeminiSettings(true);
  };

  const handleNodesGenerated = async (
    nodesData: Array<{
      title: string;
      content: string;
      tags: string[];
      imagePath: string;
      clusterId: string | null;
    }>
  ) => {
    try {
      for (const nodeData of nodesData) {
        // 1) Create a new DataLog in the database
        const generatedId = `memory-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}`;

        const createInput = {
          id: generatedId,
          title: nodeData.title,
          timestamp: new Date(),
          content: nodeData.content,
          tags: nodeData.tags,
          images: [nodeData.imagePath],
          links: [],
          cluster_id: nodeData.clusterId || selectedClusterId || undefined,
        };

        const createdDataLog = await databaseService.createDataLog(createInput);

        // 2) Create the corresponding memory node
        const memoryNodeInput =
          databaseService.createMemoryNodeFromDataLog(createdDataLog);
        await databaseService.createMemoryNode(memoryNodeInput);
      }

      // Refresh data to show new nodes
      refreshData();
    } catch (error) {
      console.error("Error creating nodes from images:", error);
      alert("Error creating nodes from images. Please try again.");
    }
  };

  // Canvas interaction hook
  const {
    canvasRef,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleCanvasClick,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useCanvasInteraction({
    nodes: filteredNodes,
    previewMode,
    rotationX,
    rotationY,
    sidebarCollapsed,
    rotateX,
    rotateY,
    project3D,
    updateRotation,
    updateZoom,
    onNodeClick: handleNodeClick,
    onNodeHover: handleNodeHover,
    playNodeSound,
  });

  // Show All Clusters Grid if requested
  if (showAllClustersGrid) {
    return (
      <AllClustersGrid
        clusters={clusters}
        onClusterSelect={handleClusterSelectFromGrid}
        onBack={handleBackFromAllClusters}
      />
    );
  }

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ touchAction: "none" }}
    >
      {/* Canvas container */}
      <div className="absolute inset-0">
        <CanvasRenderer
          nodes={filteredNodes}
          connections={filteredConnections}
          hoveredNode={hoveredNode}
          selectedNode={selectedNode}
          sidebarCollapsed={sidebarCollapsed}
          previewMode={previewMode}
          imageCache={imageCache}
          time={time}
          rotationX={rotationX}
          rotationY={rotationY}
          zoom={zoom}
          selectedClusterColor={
            clusters.find((c) => c.id === selectedClusterId)?.color
          }
          onDotHover={handleDotHover}
          onDotLeave={handleDotLeave}
          rotateX={rotateX}
          rotateY={rotateY}
          project3D={project3D}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer absolute inset-0"
          style={{ touchAction: "none" }}
          onMouseMove={(e) => {
            // Track mouse position for dot hover detection
            window.mouseX = e.clientX;
            window.mouseY = e.clientY;
            handleMouseMove(e);
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            window.mouseX = 0;
            window.mouseY = 0;
            handleMouseUp();
            handleDotLeave();
          }}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>

      {/* Sidebar */}
      <Sidebar
        nodes={filteredNodes}
        selectedNode={selectedNode}
        sidebarCollapsed={sidebarCollapsed}
        previewMode={previewMode}
        selectedTags={selectedTags}
        clusters={clusters}
        selectedClusterId={selectedClusterId}
        onNodeClick={handleNodeClick}
        onSidebarToggle={handleSidebarToggle}
        onTagClick={handleTagClick}
        onAddClick={() => setShowAddModal(true)}
        onImageDropClick={handleImageDropClick}
        onClusterSelect={handleClusterSelect}
        onCreateNewCluster={handleCreateNewCluster}
        onShowAllClusters={handleShowAllClusters}
        onSettingsClick={handleSettingsClick}
        onDeleteNodes={handleDeleteMultiple}
      />

      {/* UI Overlay */}
      <UIOverlay
        sidebarCollapsed={sidebarCollapsed}
        previewMode={previewMode}
        zoom={zoom}
        hoveredNode={hoveredNode}
        selectedNode={selectedNode}
        nodes={filteredNodes}
        rotationX={rotationX}
        rotationY={rotationY}
        onPreviewModeToggle={handlePreviewModeToggle}
        rotateX={rotateX}
        rotateY={rotateY}
        project3D={project3D}
      />

      {/* Node Details Modal */}
      <NodeDetailsModal
        selectedNode={selectedNode}
        sidebarCollapsed={sidebarCollapsed}
        onClose={handleCloseModal}
        onUpdated={({ title, content, tags, images, links }) => {
          // Update selectedNode in place for immediate UI reflection
          setSelectedNode((prev) =>
            prev && prev.dataLog
              ? {
                  ...prev,
                  dataLog: {
                    ...prev.dataLog,
                    title,
                    content,
                    tags,
                    images,
                    links,
                  },
                }
              : prev
          );
          // Also refresh underlying data
          refreshData();
        }}
        onDeleted={async (nodeId) => {
          try {
            await deleteNode(nodeId);
            setSelectedNode(null);
          } finally {
            refreshData();
          }
        }}
      />

      {/* Add Entry Modal */}
      <AddNodeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onNodeAdded={(dataLog) => {
          addNode(dataLog);
          setShowAddModal(false);
        }}
        selectedClusterId={selectedClusterId}
      />

      {/* Cluster Settings Modal */}
      <ClusterSettingsModal
        cluster={editingCluster}
        onClose={() => {
          setShowClusterSettings(false);
          setEditingCluster(null);
        }}
        onUpdate={async ({ name, color }) => {
          if (editingCluster) {
            await handleUpdateCluster(editingCluster.id, { name, color });
            setShowClusterSettings(false);
            setEditingCluster(null);
          }
        }}
      />

      {/* Create Cluster Modal */}
      <CreateClusterModal
        isOpen={showCreateCluster}
        onClose={() => setShowCreateCluster(false)}
        onCreateCluster={handleCreateCluster}
        existingClusters={clusters}
      />

      {/* Image Drop Modal */}
      <ImageDropModal
        isOpen={showImageDropModal}
        onClose={() => setShowImageDropModal(false)}
        onNodesGenerated={handleNodesGenerated}
        selectedClusterId={selectedClusterId}
        clusters={clusters}
        existingNodes={filteredNodes}
        onOpenSettings={handleOpenGeminiSettings}
      />

      {/* Gemini Settings Modal */}
      <GeminiSettingsModal
        isOpen={showGeminiSettings}
        onClose={() => setShowGeminiSettings(false)}
      />

      {/* Dot Tooltip */}
      {dotTooltip && (
        <div
          className="fixed z-50 bg-black/90 text-cyan-400 font-mono text-xs p-2 rounded border border-cyan-400/50 pointer-events-none"
          style={{
            left: dotTooltip.x + 10,
            top: dotTooltip.y - 10,
            transform: "translateY(-100%)",
          }}
        >
          <div className="space-y-1">
            {dotTooltip.tags.map((tag, index) => (
              <div key={index} className="text-cyan-300">
                • {tag}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
