import React, { useState } from "react";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

const predefinedColors = [
  "#ff6b6b", // Red
  "#4ecdc4", // Teal
  "#45b7d1", // Blue
  "#96ceb4", // Green
  "#feca57", // Yellow
  "#ff9ff3", // Pink
  "#54a0ff", // Light Blue
  "#5f27cd", // Purple
  "#00d2d3", // Cyan
  "#ff9f43", // Orange
  "#ff3838", // Bright Red
  "#2ed573", // Bright Green
  "#3742fa", // Bright Blue
  "#ffa502", // Bright Orange
  "#ff6348", // Tomato
  "#5352ed", // Indigo
  "#2f3542", // Dark Gray
  "#747d8c", // Gray
  "#a4b0be", // Light Gray
  "#f1f2f6", // Very Light Gray
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorChange,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(selectedColor);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorChange(color);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Color preview button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border border-cyan-400/50 rounded text-cyan-300 hover:border-cyan-400 transition-colors"
      >
        <div
          className="w-6 h-6 rounded border border-cyan-400/30"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="text-sm">Pick Color</span>
        <span className="text-xs">▼</span>
      </button>

      {/* Color picker dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-black/95 border border-cyan-400/40 rounded-lg shadow-lg z-50 min-w-64">
          {/* Predefined colors */}
          <div className="mb-4">
            <h4 className="text-cyan-300 text-sm font-semibold mb-2">
              Predefined Colors
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                    selectedColor === color
                      ? "border-cyan-400 scale-110"
                      : "border-cyan-400/30 hover:border-cyan-400/60"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Custom color picker */}
          <div className="mb-4">
            <h4 className="text-cyan-300 text-sm font-semibold mb-2">
              Custom Color
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-10 h-10 border border-cyan-400/30 rounded cursor-pointer"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  const color = e.target.value;
                  setCustomColor(color);
                  if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                    onColorChange(color);
                  }
                }}
                placeholder="#ff0000"
                className="flex-1 px-2 py-1 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Close button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close picker */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
