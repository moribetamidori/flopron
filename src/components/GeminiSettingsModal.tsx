import React, { useState, useEffect } from "react";
import { GeminiService } from "../services/geminiService";

interface GeminiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        const geminiService = GeminiService.getInstance();
        const currentKey = geminiService.getApiKey();
        setApiKey(currentKey || "");
        setHasApiKey(!!currentKey);
        setValidationMessage("");
      } catch (error) {
        console.error("Error loading Gemini settings:", error);
        setApiKey("");
        setHasApiKey(false);
        setValidationMessage("Error loading settings. Please try again.");
      }
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setValidationMessage("API key is required");
      return;
    }

    setIsValidating(true);
    setValidationMessage("");

    try {
      const geminiService = GeminiService.getInstance();
      geminiService.setApiKey(apiKey.trim());
      setHasApiKey(true);

      // Test the API key with a simple request
      // Note: In a real implementation, you might want to do a simple validation call
      setValidationMessage("API key saved successfully!");

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving API key:", error);
      setValidationMessage(
        `Error saving API key: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleGetApiKey = () => {
    // Open Gemini API key page in default browser
    window.open("https://aistudio.google.com/welcome", "_blank");
  };

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const getDisplayApiKey = () => {
    if (!hasApiKey) return "";
    if (showApiKey) return apiKey;
    return "•".repeat(Math.min(apiKey.length, 20));
  };

  if (!isOpen) return null;

  try {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-black border border-cyan-400/50 rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-cyan-400 font-mono text-lg font-bold">
              Gemini API Settings
            </h2>
            <button
              onClick={onClose}
              className="text-cyan-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-cyan-400 text-sm font-bold mb-2">
                API Key
              </label>
              {hasApiKey ? (
                <div className="flex items-center gap-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={getDisplayApiKey()}
                    readOnly
                    className="flex-1 px-3 py-2 bg-black border border-cyan-400/50 text-cyan-300 rounded focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    onClick={toggleApiKeyVisibility}
                    className="px-3 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/30 transition-colors"
                    title={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              ) : (
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-3 py-2 bg-black border border-cyan-400/50 text-cyan-300 rounded focus:border-cyan-400 focus:outline-none"
                />
              )}
            </div>

            <div className="text-xs text-cyan-400/70">
              <p>Your API key is stored locally and never shared.</p>
              <p>
                Get your API key from Google AI Studio. Gemini Flash 2.5 is free
                to use{" "}
              </p>
            </div>

            <button
              onClick={handleGetApiKey}
              className="w-full px-4 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/30 transition-colors"
            >
              Get API Key from Google AI Studio
            </button>

            {validationMessage && (
              <div
                className={`text-sm p-2 rounded ${
                  validationMessage.includes("successfully")
                    ? "bg-green-400/20 border border-green-400/50 text-green-300"
                    : "bg-red-400/20 border border-red-400/50 text-red-300"
                }`}
              >
                {validationMessage}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/20 transition-colors"
              >
                {hasApiKey ? "Close" : "Cancel"}
              </button>
              {!hasApiKey ? (
                <button
                  onClick={handleSave}
                  disabled={isValidating}
                  className="px-4 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? "Saving..." : "Save"}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setHasApiKey(false);
                    setApiKey("");
                    setShowApiKey(false);
                  }}
                  className="px-4 py-2 bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 rounded hover:bg-cyan-400/30 transition-colors"
                >
                  Change API Key
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error rendering GeminiSettingsModal:", error);
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-black border border-red-400/50 rounded-lg p-6 w-full max-w-md">
          <div className="text-red-400 text-center">
            <h2 className="font-mono text-lg font-bold mb-4">Error</h2>
            <p>Failed to load settings. Please try again.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 border border-red-400/50 text-red-300 rounded hover:bg-red-400/20 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
};
