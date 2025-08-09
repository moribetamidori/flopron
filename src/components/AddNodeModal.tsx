import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { DatabaseService } from "../database/databaseService";
import { CreateDataLogInput } from "../database/types";

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeAdded: (dataLog: any) => void;
}

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags: string[];
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onTagsChange,
  availableTags,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = availableTags.filter(
        (tag) =>
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.includes(tag)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
    setSelectedSuggestionIndex(-1);
  }, [inputValue, availableTags, tags]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
    }
    setInputValue("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const removeTag = (indexToRemove: number) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (
        selectedSuggestionIndex >= 0 &&
        filteredSuggestions[selectedSuggestionIndex]
      ) {
        addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-3 bg-black/60 border border-cyan-400/40 rounded min-h-[42px] focus-within:border-cyan-400">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 bg-cyan-400/30 border border-cyan-400/50 rounded text-xs text-cyan-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="ml-1 text-cyan-200 hover:text-white focus:outline-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            tags.length === 0
              ? "Type a tag and press Enter..."
              : "Add another tag..."
          }
          className="flex-1 min-w-[120px] bg-transparent text-cyan-100 placeholder-cyan-300/50 focus:outline-none"
        />
      </div>

      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-black/80 border border-cyan-400/40 rounded shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map((tag, index) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSuggestionClick(tag)}
              className={`w-full px-3 py-2 text-left text-cyan-100 hover:bg-cyan-400/20 focus:bg-cyan-400/20 focus:outline-none ${
                selectedSuggestionIndex === index ? "bg-cyan-400/20" : ""
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface ImageDropzoneProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  images,
  onImagesChange,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    setIsProcessing(true);
    const newImagePaths: string[] = [];
    const fileNames = files.map((f) => f.name);
    setProcessingFiles(fileNames);

    for (const file of files) {
      try {
        // Check if file is an image
        if (!file.type.startsWith("image/")) {
          console.warn(`Skipping non-image file: ${file.name}`);
          continue;
        }

        // Generate a unique filename
        const timestamp = Date.now();
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const filename = `${timestamp}-${Math.random()
          .toString(36)
          .substring(2)}.${ext}`;

        // Show conversion message for HEIC files
        const isHeic = ext === "heic" || ext === "heif";
        if (isHeic) {
          console.log(`Converting HEIC file: ${file.name}`);
        }

        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Save the file via Electron IPC (conversion happens in main process)
        const savedPath = await (window as any).electronAPI.files.saveImage(
          arrayBuffer,
          filename
        );
        newImagePaths.push(savedPath);

        if (isHeic) {
          console.log(
            `HEIC file ${file.name} converted and saved successfully`
          );
        } else {
          console.log(`Saved ${file.name} to ${savedPath}`);
        }
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    onImagesChange([...images, ...newImagePaths]);
    setIsProcessing(false);
    setProcessingFiles([]);
  };

  const removeImage = (indexToRemove: number) => {
    onImagesChange(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={isProcessing ? undefined : handleDragOver}
        onDragLeave={isProcessing ? undefined : handleDragLeave}
        onDrop={isProcessing ? undefined : handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isProcessing
            ? "border-gray-700 bg-gray-800/50 cursor-not-allowed"
            : isDragOver
            ? "border-blue-500 bg-blue-900/20"
            : "border-gray-600 hover:border-gray-500"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-gray-400">
          <div className="text-2xl mb-2">{isProcessing ? "⏳" : "📁"}</div>
          {isProcessing ? (
            <div className="text-center">
              <p className="mb-2 text-blue-400">Processing images...</p>
              {processingFiles.map((fileName, index) => (
                <div key={index} className="text-xs text-gray-500 mb-1">
                  {fileName.toLowerCase().endsWith(".heic") ||
                  fileName.toLowerCase().endsWith(".heif")
                    ? `Converting ${fileName} to PNG...`
                    : `Processing ${fileName}...`}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="mb-2">
                Drag and drop images here, or click to select
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Supports: JPEG, PNG, GIF, WebP, HEIC, HEIF
                <br />
                <span className="text-blue-400">
                  HEIC files will be automatically converted to PNG
                </span>
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Choose Files
              </button>
            </div>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Selected Images ({images.length})
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {images.map((imagePath, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-800 rounded text-sm"
              >
                <span className="text-gray-300 truncate">{imagePath}</span>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="ml-2 text-red-400 hover:text-red-300 focus:outline-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AddNodeModal: React.FC<AddNodeModalProps> = ({
  isOpen,
  onClose,
  onNodeAdded,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [] as string[],
    images: [] as string[],
    links: [] as string[],
  });
  const [linkInput, setLinkInput] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const databaseService = DatabaseService.getInstance();

  // Load available tags when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableTags();
    }
  }, [isOpen]);

  const loadAvailableTags = async () => {
    try {
      const tags = await databaseService.getAllTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error("Failed to load tags:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `memory-${timestamp}-${random}`;
  };

  const addLink = () => {
    const trimmedLink = linkInput.trim();
    if (trimmedLink && !formData.links.includes(trimmedLink)) {
      setFormData((prev) => ({
        ...prev,
        links: [...prev.links, trimmedLink],
      }));
      setLinkInput("");
    }
  };

  const removeLink = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleLinkKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLink();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!(window as any).electronAPI?.database) {
        throw new Error(
          "Preload bridge not available. Please fully rebuild and restart the app (pnpm build && pnpm start)."
        );
      }

      // Auto-generate ID
      const id = generateId();

      const input: CreateDataLogInput = {
        id,
        title: formData.title.trim(),
        timestamp: new Date(),
        content: formData.content.trim(),
        tags: formData.tags,
        images: formData.images,
        links: formData.links,
      };

      // Create the data log
      const createdDataLog = await databaseService.createDataLog(input);

      // Create corresponding memory node
      const memoryNodeInput =
        databaseService.createMemoryNodeFromDataLog(createdDataLog);
      await databaseService.createMemoryNode(memoryNodeInput);

      // Notify parent component
      onNodeAdded(createdDataLog);

      // Reset form
      setFormData({
        title: "",
        content: "",
        tags: [],
        images: [],
        links: [],
      });
      setLinkInput("");

      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create memory node";
      setError(errorMessage);
      console.error("Error creating node:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-black/95 border border-cyan-400/50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto text-cyan-400 font-mono">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-cyan-400">
              Add New Memory Node
            </h2>
            <button
              onClick={onClose}
              className="text-cyan-400 hover:text-white text-2xl leading-none"
              disabled={isSubmitting}
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/70 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 placeholder-cyan-300/50"
                placeholder="Enter a descriptive title for this memory..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 placeholder-cyan-300/50"
                placeholder="Describe your memory or thought in detail..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Tags
              </label>
              <TagInput
                tags={formData.tags}
                onTagsChange={(tags) =>
                  setFormData((prev) => ({ ...prev, tags }))
                }
                availableTags={availableTags}
              />
              <p className="text-xs text-cyan-300/60 mt-1">
                Type a tag and press Enter to add it. Click existing tags to add
                them quickly.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Images
              </label>
              <ImageDropzone
                images={formData.images}
                onImagesChange={(images) =>
                  setFormData((prev) => ({ ...prev, images }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-300 mb-2">
                Links
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={handleLinkKeyDown}
                    className="flex-1 px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 placeholder-cyan-300/50"
                    placeholder="https://example.com (press Enter to add)"
                    disabled={isSubmitting}
                  />
                </div>

                {formData.links.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {formData.links.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-black/60 border border-cyan-400/30 rounded text-sm"
                      >
                        <span className="text-cyan-300 truncate">{link}</span>
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="ml-2 text-red-400 hover:text-red-300 focus:outline-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  isSubmitting ||
                  !formData.title.trim() ||
                  !formData.content.trim()
                }
              >
                {isSubmitting ? "Creating..." : "Create Memory Node"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
