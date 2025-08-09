import { useEffect, useState } from "react";
export const useImageCache = ({ nodes }) => {
    const [imageCache, setImageCache] = useState(new Map());
    useEffect(() => {
        const loadImages = async () => {
            const newCache = new Map();
            for (const node of nodes) {
                if (node.dataLog?.images) {
                    for (const imageSrc of node.dataLog.images) {
                        if (!newCache.has(imageSrc)) {
                            try {
                                // Use Electron API to resolve the image path
                                let resolvedPath = imageSrc;
                                if (window.electronAPI?.files?.getImagePath) {
                                    const fullPath = await window.electronAPI.files.getImagePath(imageSrc);
                                    if (fullPath) {
                                        resolvedPath = `file://${fullPath}`;
                                    }
                                }
                                const img = new window.Image();
                                img.crossOrigin = "anonymous";
                                await new Promise((resolve, reject) => {
                                    img.onload = () => {
                                        newCache.set(imageSrc, img);
                                        resolve();
                                    };
                                    img.onerror = (error) => {
                                        console.warn(`Failed to load image: ${imageSrc}`, error);
                                        reject(error);
                                    };
                                    img.src = resolvedPath;
                                });
                            }
                            catch (error) {
                                console.warn(`Error loading image ${imageSrc}:`, error);
                            }
                        }
                    }
                }
            }
            setImageCache(newCache);
        };
        if (nodes.length > 0) {
            loadImages();
        }
    }, [nodes]);
    return { imageCache };
};
