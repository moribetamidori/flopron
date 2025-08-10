import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { DatabaseService } from "../database/databaseService";
export const TagInput = ({ tags, onTagsChange, availableTags, }) => {
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const inputRef = useRef(null);
    useEffect(() => {
        if (inputValue.trim()) {
            const filtered = availableTags.filter((tag) => tag.toLowerCase().includes(inputValue.toLowerCase()) &&
                !tags.includes(tag));
            setFilteredSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        }
        else {
            setShowSuggestions(false);
            setFilteredSuggestions([]);
        }
        setSelectedSuggestionIndex(-1);
    }, [inputValue, availableTags, tags]);
    const addTag = (tag) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            onTagsChange([...tags, trimmedTag]);
        }
        setInputValue("");
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
    };
    const removeTag = (indexToRemove) => {
        onTagsChange(tags.filter((_, index) => index !== indexToRemove));
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (selectedSuggestionIndex >= 0 &&
                filteredSuggestions[selectedSuggestionIndex]) {
                addTag(filteredSuggestions[selectedSuggestionIndex]);
            }
            else if (inputValue.trim()) {
                addTag(inputValue);
            }
        }
        else if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedSuggestionIndex((prev) => prev < filteredSuggestions.length - 1 ? prev + 1 : prev);
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        }
        else if (e.key === "Escape") {
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
        }
        else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };
    const handleSuggestionClick = (tag) => {
        addTag(tag);
        inputRef.current?.focus();
    };
    return (_jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex flex-wrap gap-2 p-3 bg-black/60 border border-cyan-400/40 rounded min-h-[42px] focus-within:border-cyan-400", children: [tags.map((tag, index) => (_jsxs("span", { className: "inline-flex items-center px-2 py-1 bg-cyan-400/30 border border-cyan-400/50 rounded text-xs text-cyan-300", children: [tag, _jsx("button", { type: "button", onClick: () => removeTag(index), className: "ml-1 text-cyan-200 hover:text-white focus:outline-none", children: "\u00D7" })] }, index))), _jsx("input", { ref: inputRef, type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyDown: handleKeyDown, placeholder: tags.length === 0
                            ? "Type a tag and press Enter..."
                            : "Add another tag...", className: "flex-1 min-w-[120px] bg-transparent text-cyan-100 placeholder-cyan-300/50 focus:outline-none" })] }), showSuggestions && (_jsx("div", { className: "absolute z-10 w-full mt-1 bg-black/80 border border-cyan-400/40 rounded shadow-lg max-h-40 overflow-y-auto", children: filteredSuggestions.map((tag, index) => (_jsx("button", { type: "button", onClick: () => handleSuggestionClick(tag), className: `w-full px-3 py-2 text-left text-cyan-100 hover:bg-cyan-400/20 focus:bg-cyan-400/20 focus:outline-none ${selectedSuggestionIndex === index ? "bg-cyan-400/20" : ""}`, children: tag }, tag))) }))] }));
};
export const ImageDropzone = ({ images, onImagesChange, }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingFiles, setProcessingFiles] = useState([]);
    const fileInputRef = useRef(null);
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };
    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
        if (files.length > 0) {
            await handleFiles(files);
        }
    };
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            await handleFiles(files);
        }
    };
    const handleFiles = async (files) => {
        setIsProcessing(true);
        const newImagePaths = [];
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
                const savedPath = await window.electronAPI.files.saveImage(arrayBuffer, filename);
                newImagePaths.push(savedPath);
                if (isHeic) {
                    console.log(`HEIC file ${file.name} converted and saved successfully`);
                }
                else {
                    console.log(`Saved ${file.name} to ${savedPath}`);
                }
            }
            catch (error) {
                console.error(`Failed to process ${file.name}:`, error);
            }
        }
        onImagesChange([...images, ...newImagePaths]);
        setIsProcessing(false);
        setProcessingFiles([]);
    };
    const removeImage = (indexToRemove) => {
        onImagesChange(images.filter((_, index) => index !== indexToRemove));
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { onDragOver: isProcessing ? undefined : handleDragOver, onDragLeave: isProcessing ? undefined : handleDragLeave, onDrop: isProcessing ? undefined : handleDrop, className: `border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isProcessing
                    ? "border-gray-700 bg-gray-800/50 cursor-not-allowed"
                    : isDragOver
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-gray-600 hover:border-gray-500"}`, children: [_jsx("input", { ref: fileInputRef, type: "file", multiple: true, accept: "image/*,.heic,.heif", onChange: handleFileSelect, className: "hidden" }), _jsxs("div", { className: "text-gray-400", children: [_jsx("div", { className: "text-2xl mb-2", children: isProcessing ? "⏳" : "📁" }), isProcessing ? (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "mb-2 text-blue-400", children: "Processing images..." }), processingFiles.map((fileName, index) => (_jsx("div", { className: "text-xs text-gray-500 mb-1", children: fileName.toLowerCase().endsWith(".heic") ||
                                            fileName.toLowerCase().endsWith(".heif")
                                            ? `Converting ${fileName} to PNG...`
                                            : `Processing ${fileName}...` }, index)))] })) : (_jsxs("div", { children: [_jsx("p", { className: "mb-2", children: "Drag and drop images here, or click to select" }), _jsxs("p", { className: "text-xs text-gray-500 mb-3", children: ["Supports: JPEG, PNG, GIF, WebP, HEIC, HEIF", _jsx("br", {}), _jsx("span", { className: "text-blue-400", children: "HEIC files will be automatically converted to PNG" })] }), _jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), disabled: isProcessing, className: "px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: "Choose Files" })] }))] })] }), images.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "block text-sm font-medium text-gray-300", children: ["Selected Images (", images.length, ")"] }), _jsx("div", { className: "space-y-1 max-h-32 overflow-y-auto", children: images.map((imagePath, index) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-800 rounded text-sm", children: [_jsx("span", { className: "text-gray-300 truncate", children: imagePath }), _jsx("button", { type: "button", onClick: () => removeImage(index), className: "ml-2 text-red-400 hover:text-red-300 focus:outline-none", children: "\u00D7" })] }, index))) })] }))] }));
};
export const AddNodeModal = ({ isOpen, onClose, onNodeAdded, selectedClusterId, }) => {
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        tags: [],
        images: [],
        links: [],
        clusterId: selectedClusterId || null,
    });
    const [linkInput, setLinkInput] = useState("");
    const [availableTags, setAvailableTags] = useState([]);
    const [clusters, setClusters] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const databaseService = DatabaseService.getInstance();
    // Load available tags and clusters when modal opens
    useEffect(() => {
        if (isOpen) {
            loadAvailableTags();
            loadClusters();
        }
    }, [isOpen]);
    // Update cluster ID when selectedClusterId prop changes
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            clusterId: selectedClusterId || null,
        }));
    }, [selectedClusterId]);
    const loadAvailableTags = async () => {
        try {
            const tags = await databaseService.getAllTags();
            setAvailableTags(tags);
        }
        catch (error) {
            console.error("Failed to load tags:", error);
        }
    };
    const loadClusters = async () => {
        try {
            const allClusters = await databaseService.getAllNeuronClusters();
            setClusters(allClusters);
        }
        catch (error) {
            console.error("Failed to load clusters:", error);
        }
    };
    const handleInputChange = (e) => {
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
    const removeLink = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            links: prev.links.filter((_, index) => index !== indexToRemove),
        }));
    };
    const handleLinkKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addLink();
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            if (!window.electronAPI?.database) {
                throw new Error("Preload bridge not available. Please fully rebuild and restart the app (pnpm build && pnpm start).");
            }
            // Auto-generate ID
            const id = generateId();
            const input = {
                id,
                title: formData.title.trim(),
                timestamp: new Date(),
                content: formData.content.trim(),
                tags: formData.tags,
                images: formData.images,
                links: formData.links,
                cluster_id: formData.clusterId || undefined,
            };
            // Create the data log
            const createdDataLog = await databaseService.createDataLog(input);
            // Create corresponding memory node
            const memoryNodeInput = databaseService.createMemoryNodeFromDataLog(createdDataLog);
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
                clusterId: selectedClusterId || null,
            });
            setLinkInput("");
            onClose();
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create memory node";
            setError(errorMessage);
            console.error("Error creating node:", err);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-black/95 border border-cyan-400/50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto text-cyan-400 font-mono", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-cyan-400", children: "Add New Memory Node" }), _jsx("button", { onClick: onClose, className: "text-cyan-400 hover:text-white text-2xl leading-none", disabled: isSubmitting, children: "\u00D7" })] }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-900/70 border border-red-700 rounded text-red-200 text-sm", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-cyan-300 mb-2", children: "Title *" }), _jsx("input", { type: "text", name: "title", value: formData.title, onChange: handleInputChange, required: true, className: "w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 placeholder-cyan-300/50", placeholder: "Enter a descriptive title for this memory...", disabled: isSubmitting })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-cyan-300 mb-2", children: "Content *" }), _jsx("textarea", { name: "content", value: formData.content, onChange: handleInputChange, required: true, rows: 4, className: "w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 placeholder-cyan-300/50", placeholder: "Describe your memory or thought in detail...", disabled: isSubmitting })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-cyan-300 mb-2", children: "Cluster" }), _jsxs("select", { name: "clusterId", value: formData.clusterId || "", onChange: handleInputChange, className: "w-full px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400", disabled: isSubmitting, children: [_jsx("option", { value: "", children: "Select a cluster (optional)" }), clusters.map((cluster) => (_jsx("option", { value: cluster.id, children: cluster.name }, cluster.id)))] }), _jsx("p", { className: "text-xs text-cyan-300/60 mt-1", children: "Choose which cluster this memory belongs to. Leave empty to use the default cluster." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-cyan-300 mb-2", children: "Tags" }), _jsx(TagInput, { tags: formData.tags, onTagsChange: (tags) => setFormData((prev) => ({ ...prev, tags })), availableTags: availableTags }), _jsx("p", { className: "text-xs text-cyan-300/60 mt-1", children: "Type a tag and press Enter to add it. Click existing tags to add them quickly." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-cyan-300 mb-2", children: "Images" }), _jsx(ImageDropzone, { images: formData.images, onImagesChange: (images) => setFormData((prev) => ({ ...prev, images })) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-cyan-300 mb-2", children: "Links" }), _jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "flex gap-2", children: _jsx("input", { type: "url", value: linkInput, onChange: (e) => setLinkInput(e.target.value), onKeyDown: handleLinkKeyDown, className: "flex-1 px-3 py-2 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 focus:outline-none focus:border-cyan-400 placeholder-cyan-300/50", placeholder: "https://example.com (press Enter to add)", disabled: isSubmitting }) }), formData.links.length > 0 && (_jsx("div", { className: "space-y-1 max-h-32 overflow-y-auto", children: formData.links.map((link, index) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-black/60 border border-cyan-400/30 rounded text-sm", children: [_jsx("span", { className: "text-cyan-300 truncate", children: link }), _jsx("button", { type: "button", onClick: () => removeLink(index), className: "ml-2 text-red-400 hover:text-red-300 focus:outline-none", children: "\u00D7" })] }, index))) }))] })] }), _jsxs("div", { className: "flex justify-end space-x-3 pt-4", children: [_jsx("button", { type: "button", onClick: onClose, className: "px-4 py-2 border border-cyan-400/50 text-cyan-300 rounded hover:text-white hover:border-cyan-400 transition-colors", disabled: isSubmitting, children: "Cancel" }), _jsx("button", { type: "submit", className: "px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", disabled: isSubmitting ||
                                            !formData.title.trim() ||
                                            !formData.content.trim(), children: isSubmitting ? "Creating..." : "Create Memory Node" })] })] })] }) }) }));
};
