export interface AppState {
  currentView: string;
  selectedCluster?: string;
  zoom?: number;
  panX?: number;
  panY?: number;
  showNodeDetails?: boolean;
  connectionStrength?: number;
  timeRange?: string;
  tagFilter?: string;
}

const APP_STATE_KEY = "neuppy_app_state";

export const appStateService = {
  saveState: (state: AppState) => {
    try {
      localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Failed to save app state:", error);
    }
  },

  loadState: (): AppState | null => {
    try {
      const saved = localStorage.getItem(APP_STATE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Failed to load app state:", error);
      return null;
    }
  },

  clearState: () => {
    try {
      localStorage.removeItem(APP_STATE_KEY);
    } catch (error) {
      console.warn("Failed to clear app state:", error);
    }
  },
};
