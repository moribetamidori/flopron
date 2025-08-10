import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
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
export const ColorPicker = ({ selectedColor, onColorChange, className = "", }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [customColor, setCustomColor] = useState(selectedColor);
    const handleColorSelect = (color) => {
        onColorChange(color);
        setIsOpen(false);
    };
    const handleCustomColorChange = (e) => {
        const color = e.target.value;
        setCustomColor(color);
        onColorChange(color);
    };
    return (_jsxs("div", { className: `relative ${className}`, children: [_jsxs("button", { type: "button", onClick: () => setIsOpen(!isOpen), className: "flex items-center gap-2 px-3 py-2 border border-cyan-400/50 rounded text-cyan-300 hover:border-cyan-400 transition-colors", children: [_jsx("div", { className: "w-6 h-6 rounded border border-cyan-400/30", style: { backgroundColor: selectedColor } }), _jsx("span", { className: "text-sm", children: "Pick Color" }), _jsx("span", { className: "text-xs", children: "\u25BC" })] }), isOpen && (_jsxs("div", { className: "absolute top-full left-0 mt-2 p-4 bg-black/95 border border-cyan-400/40 rounded-lg shadow-lg z-50 min-w-64", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h4", { className: "text-cyan-300 text-sm font-semibold mb-2", children: "Predefined Colors" }), _jsx("div", { className: "grid grid-cols-5 gap-2", children: predefinedColors.map((color) => (_jsx("button", { type: "button", onClick: () => handleColorSelect(color), className: `w-8 h-8 rounded border-2 transition-all hover:scale-110 ${selectedColor === color
                                        ? "border-cyan-400 scale-110"
                                        : "border-cyan-400/30 hover:border-cyan-400/60"}`, style: { backgroundColor: color }, title: color }, color))) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("h4", { className: "text-cyan-300 text-sm font-semibold mb-2", children: "Custom Color" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: customColor, onChange: handleCustomColorChange, className: "w-10 h-10 border border-cyan-400/30 rounded cursor-pointer" }), _jsx("input", { type: "text", value: customColor, onChange: (e) => {
                                            const color = e.target.value;
                                            setCustomColor(color);
                                            if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                                                onColorChange(color);
                                            }
                                        }, placeholder: "#ff0000", className: "flex-1 px-2 py-1 bg-black/60 border border-cyan-400/40 rounded text-cyan-100 text-sm focus:outline-none focus:border-cyan-400" })] })] }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { type: "button", onClick: () => setIsOpen(false), className: "px-3 py-1 text-sm border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/10 transition-colors", children: "Close" }) })] })), isOpen && (_jsx("div", { className: "fixed inset-0 z-40", onClick: () => setIsOpen(false) }))] }));
};
