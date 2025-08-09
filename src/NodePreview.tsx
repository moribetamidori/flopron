import React, { useEffect, useState } from "react";
import { DataLogWithRelations } from "./database/types";

interface NodePreviewProps {
  dataLog: DataLogWithRelations;
  isSelected: boolean;
  onClick: () => void;
}

export default function NodePreview({
  dataLog,
  isSelected,
  onClick,
}: NodePreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      setImageError(false);
      const first = dataLog.images?.[0];
      if (!first) {
        setResolvedSrc(null);
        return;
      }
      try {
        if ((window as any).electronAPI?.files?.getImagePath) {
          const full = await (window as any).electronAPI.files.getImagePath(first);
          if (full) {
            setResolvedSrc(`file://${full}`);
            return;
          }
        }
        setResolvedSrc(first);
      } catch {
        setResolvedSrc(first);
      }
    };
    resolve();
  }, [dataLog.images]);

  const renderContent = () => {
    // If there are images, show the first image
    if (dataLog.images.length > 0 && !imageError && resolvedSrc) {
      return (
        <img
          src={resolvedSrc}
          alt="Node content"
          className="w-full h-full object-cover rounded"
          onError={() => setImageError(true)}
        />
      );
    }

    // If no images or image failed to load, show text characters
    const text = dataLog.content;
    const maxChars = 40; // Limit to first 40 characters
    const displayText =
      text.length > maxChars ? text.substring(0, maxChars) + "..." : text;

    return (
      <div className="w-full h-full flex items-center justify-center p-2">
        <div className="text-[8px] text-cyan-400 font-mono leading-tight text-center overflow-hidden">
          {displayText}
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`w-16 h-16 border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
        isSelected
          ? "border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-400/50"
          : "border-cyan-400/50 bg-black/50 hover:border-cyan-400/80 hover:bg-cyan-400/10"
      }`}
      title={dataLog.content}
    >
      {renderContent()}
    </div>
  );
}
