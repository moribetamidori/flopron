import React, { useEffect, useMemo, useState } from "react";
import { MemoryNode } from "../hooks/useDatabaseMemoryTree";
import { DatabaseService } from "../database/databaseService";
import { TagInput, ImageDropzone } from "./AddNodeModal";

interface NodeDetailsModalProps {
  selectedNode: MemoryNode | null;
  sidebarCollapsed: boolean;
  onClose: () => void;
  onUpdated?: (updates: {
    title: string;
    content: string;
    tags: string[];
    images: string[];
    links: string[];
  }) => void;
  onDeleted?: (nodeId: string) => void;
}

interface ImageDisplayProps {
  imagePath: string;
  alt: string;
  className: string;
  onClick?: () => void;
  onError?: () => void;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({
  imagePath,
  alt,
  className,
  onClick,
  onError,
}) => {
  const [resolvedPath, setResolvedPath] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const resolveImagePath = async () => {
      try {
        if ((window as any).electronAPI?.files?.getImagePath) {
          const fullPath = await (window as any).electronAPI.files.getImagePath(
            imagePath
          );
          if (fullPath) {
            setResolvedPath(`file://${fullPath}`);
          } else {
            // Fallback to direct path (for existing project images)
            setResolvedPath(imagePath);
          }
        } else {
          // Fallback if API not available
          setResolvedPath(imagePath);
        }
      } catch (err) {
        console.error("Error resolving image path:", err);
        setResolvedPath(imagePath);
      }
    };

    if (imagePath) {
      resolveImagePath();
    }
  }, [imagePath]);

  if (error || !resolvedPath) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-800 text-gray-400`}
      >
        <div className="text-center">
          <div className="text-2xl mb-2">🖼️</div>
          <div className="text-xs">Image not found</div>
          <div className="text-xs mt-1 opacity-70">{imagePath}</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={resolvedPath}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={() => {
        setError(true);
        if (onError) onError();
      }}
    />
  );
};

export const NodeDetailsModal: React.FC<NodeDetailsModalProps> = ({
  selectedNode,
  sidebarCollapsed,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const databaseService = useMemo(() => DatabaseService.getInstance(), []);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const all = await databaseService.getAllTags();
        setAvailableTags(all);
      } catch {}
    })();
  }, [databaseService]);

  useEffect(() => {
    if (!selectedNode?.dataLog) return;
    setTitle(selectedNode.dataLog.title || "");
    setContent(selectedNode.dataLog.content || "");
    setTags(selectedNode.dataLog.tags || []);
    setImages(selectedNode.dataLog.images || []);
    setLinks(selectedNode.dataLog.links || []);
  }, [selectedNode]);

  if (!selectedNode || !selectedNode.dataLog) return null;

  const sidebarWidth = sidebarCollapsed ? 48 : 320; // w-12 vs w-80

  return (
    <div
      className={
        "absolute inset-0 z-40 flex pointer-events-none " +
        (isExpanded
          ? "items-stretch justify-end"
          : "items-center justify-center")
      }
    >
      <div
        className={
          "bg-black/95 border border-cyan-400/50 text-cyan-400 font-mono transition-all duration-300 pointer-events-auto " +
          (isExpanded
            ? "p-6 max-w-none w-full h-full overflow-y-auto rounded-none"
            : "rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto")
        }
        style={{
          transform: isExpanded
            ? "none"
            : sidebarCollapsed
            ? "translateX(0)"
            : "translateX(160px)",
          width: isExpanded ? `calc(100% - ${sidebarWidth}px)` : undefined,
          height: isExpanded ? "100%" : undefined,
          margin: isExpanded ? 0 : undefined,
        }}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400"
              />
            ) : (
              <h3 className="text-xl font-bold">
                {selectedNode.dataLog?.title || selectedNode.id}
              </h3>
            )}
            {/* <span className="text-sm text-cyan-300/70">
              ID: {selectedNode.id}
            </span> */}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                className="px-2 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors"
                onClick={async () => {
                  if (isEditing) {
                    // Save changes when clicking "Done"
                    const updated = await databaseService.updateDataLog(
                      selectedNode.dataLog!.id,
                      { title, content, tags, images, links }
                    );
                    if (updated) {
                      // Regenerate connections for this memory node since tags may have changed
                      await databaseService.regenerateConnectionsForNode(
                        selectedNode.id
                      );

                      if (onUpdated) {
                        onUpdated({ title, content, tags, images, links });
                      }
                      setIsEditing(false);
                    }
                  } else {
                    // Toggle to edit mode when clicking "Edit"
                    setIsEditing(true);
                  }
                }}
              >
                {isEditing ? "Done" : "Edit"}
              </button>
            </div>
            <div className="relative">
              <details className="group">
                <summary className="list-none px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors cursor-pointer">
                  ⋯
                </summary>
                <div className="absolute right-0 mt-2 w-40 bg-black/95 border border-cyan-400/40 rounded shadow-lg z-10">
                  <button
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-900/30"
                    onClick={async () => {
                      if (confirm("Delete this node? This cannot be undone.")) {
                        try {
                          if (onDeleted) {
                            onDeleted(selectedNode.id);
                          } else {
                            await DatabaseService.getInstance().deleteMemoryNode(
                              selectedNode.id
                            );
                          }
                          onClose();
                        } catch (e) {
                          console.error(e);
                        }
                      }
                    }}
                  >
                    Delete Node
                  </button>
                </div>
              </details>
            </div>
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="px-3 py-1 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors"
              title={isExpanded ? "Shrink" : "Expand to right side"}
            >
              {isExpanded ? "⤡" : "⤢"}
            </button>
            <button
              onClick={onClose}
              className="text-cyan-400 hover:text-white transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div
            className={
              "flex flex-wrap items-center gap-x-4 gap-y-1 " +
              (isEditing ? "mt-2" : "")
            }
          >
            <span className="text-xs text-cyan-300/70">
              <span className="opacity-80">Created</span>:
              <span className="ml-1 text-cyan-200/80">
                {selectedNode.dataLog.timestamp.toLocaleString()}
              </span>
            </span>
            <span className="text-xs text-cyan-300/70">
              <span className="opacity-80">Modified</span>:
              <span className="ml-1 text-cyan-200/80">
                {(selectedNode.dataLog as any).modified_at
                  ? (selectedNode.dataLog as any).modified_at.toLocaleString()
                  : selectedNode.dataLog.updated_at
                  ? selectedNode.dataLog.updated_at.toLocaleString()
                  : selectedNode.dataLog.timestamp.toLocaleString()}
              </span>
            </span>
          </div>

          <div>
            <span className="text-cyan-300 font-semibold">Tags:</span>
            <div className="mt-2">
              {isEditing ? (
                <TagInput
                  tags={tags}
                  onTagsChange={setTags}
                  availableTags={availableTags}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-400/20 border border-cyan-400/50 rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-cyan-300 font-semibold">Content:</span>
            {isEditing ? (
              <textarea
                className="mt-2 w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400"
                rows={12}
                style={{ minHeight: "24rem" }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <p className="mt-2 text-white text-sm leading-relaxed">
                {content}
              </p>
            )}
          </div>

          <div>
            <span className="text-cyan-300 font-semibold">Images:</span>
            {isEditing ? (
              <div className="mt-2">
                <ImageDropzone images={images} onImagesChange={setImages} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 mt-2">
                {images.map((image, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <ImageDisplay
                      imagePath={image}
                      alt={`Image ${index + 1}`}
                      className="w-32 h-32 object-cover rounded border border-purple-400/50 bg-purple-400/10 cursor-pointer hover:border-purple-400/80 transition-colors"
                      onClick={() => setEnlargedImage(image)}
                    />
                    <span className="text-xs text-purple-300 mt-1 text-center max-w-32 truncate">
                      {image.split("/").pop() || image}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="text-cyan-300 font-semibold">Links:</span>
            {isEditing ? (
              <div className="space-y-3 mt-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = linkInput.trim();
                      if (v && !links.includes(v)) setLinks([...links, v]);
                      setLinkInput("");
                    }
                  }}
                  className="w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400"
                  placeholder="https://example.com (press Enter to add)"
                />
                {links.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {links.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-black/60 border border-cyan-400/30 rounded text-sm"
                      >
                        <span className="text-cyan-300 truncate">{link}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setLinks(links.filter((_, i) => i !== index))
                          }
                          className="ml-2 text-red-400 hover:text-red-300 focus:outline-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {links.map((link, index) => (
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
            )}
          </div>

          {/* Enlarged Image Overlay - Inside Modal */}
          {enlargedImage && (
            <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none bg-black/90 z-10">
              <div className="relative max-w-[70%] max-h-[60%] pointer-events-auto">
                <ImageDisplay
                  imagePath={enlargedImage}
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
          {isEditing && (
            <div className="pt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors"
                onClick={() => setIsEditing(false)}
              >
                Cancel Edit
              </button>
              <button
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500"
                onClick={async () => {
                  const updated = await databaseService.updateDataLog(
                    selectedNode.dataLog!.id,
                    { title, content, tags, images, links }
                  );
                  if (updated) {
                    // Regenerate connections for this memory node since tags may have changed
                    await databaseService.regenerateConnectionsForNode(
                      selectedNode.id
                    );

                    if (onUpdated) {
                      onUpdated({ title, content, tags, images, links });
                    }
                    setIsEditing(false);
                  }
                }}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
