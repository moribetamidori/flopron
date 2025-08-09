import { useEffect, useState } from "react";
import { dataLogs } from "../data";
export const useImageCache = () => {
    const [imageCache, setImageCache] = useState(new Map());
    useEffect(() => {
        const loadImages = async () => {
            const newCache = new Map();
            for (const dataLog of dataLogs) {
                for (const imageSrc of dataLog.images) {
                    if (!newCache.has(imageSrc)) {
                        const img = new window.Image();
                        img.crossOrigin = "anonymous";
                        await new Promise((resolve, reject) => {
                            img.onload = () => resolve();
                            img.onerror = () => reject();
                            img.src = imageSrc;
                        });
                        newCache.set(imageSrc, img);
                    }
                }
            }
            setImageCache(newCache);
        };
        loadImages();
    }, []);
    return { imageCache };
};
