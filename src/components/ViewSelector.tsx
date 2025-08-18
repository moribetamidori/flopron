import React from "react";

export type ViewMode = "original" | "clustered" | "timeline" | "tag-centric";

interface ViewSelectorProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  previewMode: boolean;
  onPreviewModeToggle: () => void;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({
  currentView,
  onViewChange,
  previewMode,
  onPreviewModeToggle,
}) => {
  const views = [
    {
      id: "original" as ViewMode,
      name: "Original",
      description: "Classic 3D force-directed graph",
      icon: "🔗",
    },
    {
      id: "clustered" as ViewMode,
      name: "Clustered",
      description: "Grouped by shared tags with progressive disclosure",
      icon: "🫧",
    },
    {
      id: "timeline" as ViewMode,
      name: "Timeline",
      description: "Chronological view with temporal relationships",
      icon: "📅",
    },
    {
      id: "tag-centric" as ViewMode,
      name: "Tag-Centric",
      description: "Tags as hubs connecting related nodes",
      icon: "🏷️",
    },
  ];

  return (
    <div className="absolute top-4 right-4 z-20 bg-black/90 p-4 rounded-lg border border-cyan-400/50 min-w-64">
      <div className="text-cyan-400 text-sm font-semibold mb-3">
        Visualization Mode
      </div>

      <div className="space-y-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`w-full text-left p-3 rounded border transition-all duration-200 ${
              currentView === view.id
                ? "bg-cyan-400/20 border-cyan-400 text-cyan-400"
                : "bg-black/50 border-cyan-400/30 text-gray-300 hover:bg-cyan-400/10 hover:border-cyan-400/50"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{view.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{view.name}</div>
                <div className="text-xs opacity-75 mt-1">
                  {view.description}
                </div>
              </div>
              {currentView === view.id && (
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-cyan-400/30">
        <div className="text-cyan-400 text-xs opacity-75">
          <div className="font-medium mb-1">Tips:</div>
          <ul className="space-y-1 text-gray-400">
            <li>
              • Use <strong>Clustered</strong> for overview and discovery
            </li>
            <li>
              • Use <strong>Timeline</strong> for temporal analysis
            </li>
            <li>
              • Use <strong>Tag-Centric</strong> for tag exploration
            </li>
            <li>
              • Use <strong>Original</strong> for detailed connections
            </li>
          </ul>
        </div>
      </div>

      {/* Preview Mode Toggle */}
      <div className="mt-4 pt-3 border-t border-cyan-400/30">
        <div className="flex items-center justify-between">
          <span className="text-cyan-400 text-sm">Preview Mode</span>
          <button
            onClick={onPreviewModeToggle}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              previewMode
                ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400"
                : "bg-black/50 text-gray-300 border border-cyan-400/30 hover:bg-cyan-400/10"
            }`}
          >
            {previewMode ? "ON" : "OFF"}
          </button>
        </div>
      </div>
    </div>
  );
};
