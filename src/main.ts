import { app, BrowserWindow, ipcMain, dialog } from "electron";
import pkg from "electron-updater";
const { autoUpdater } = pkg;
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import convert from "heic-convert";
// Explicitly load native dependency to ensure Electron rebuild picks it up
import "better-sqlite3";
import { PKMDatabase } from "./database/database.js";
import {
  CreateDataLogInput,
  UpdateDataLogInput,
  CreateMemoryNodeInput,
  UpdateMemoryNodeInput,
  CreateNeuronClusterInput,
  UpdateNeuronClusterInput,
} from "./database/types.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment flags
const isDevelopment = !app.isPackaged;

// Database instance
let database: PKMDatabase;

// Ensure database is initialized before use
function ensureDatabase(): PKMDatabase {
  if (!database) {
    try {
      database = PKMDatabase.getInstance();
      console.log("Database initialized via ensureDatabase()");
    } catch (error) {
      console.error(
        "Failed to initialize database in ensureDatabase():",
        error
      );
      throw error;
    }
  }
  return database;
}

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    title: "Neuppy • Cuttie's Floppy Neurons",
    icon: path.join(__dirname, "../assets/icon.png"), // Add icon if available
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Disabled sandbox for React to work properly
      webSecurity: true,
    },
    show: false, // Don't show until ready
    backgroundColor: "#000000", // Black background to match PKM theme
    titleBarStyle: "default",
    // vibrancy: 'dark', // macOS vibrancy effect (commented out for compatibility)
    frame: true,
  });

  // Show window when ready to prevent visual flash
  win.once("ready-to-show", () => {
    win.show();

    // Focus the window
    if (process.platform === "darwin") {
      win.focus();
    }
  });

  win.loadFile(path.join(__dirname, "../index.html"));

  // Open DevTools in development only
  if (isDevelopment) {
    win.webContents.openDevTools();
  }

  return win;
}

app.whenReady().then(() => {
  try {
    // Initialize database
    database = PKMDatabase.getInstance();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }

  // Set up IPC handlers for database operations regardless of init outcome
  // Handlers use ensureDatabase() and will try again if needed
  setupDatabaseIPC();

  // Always create the window
  createMainWindow();

  // Configure and check for updates in production
  if (!isDevelopment) {
    try {
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.allowPrerelease = false;

      autoUpdater.on("error", (error) => {
        console.error("AutoUpdater error:", error);
      });

      autoUpdater.on("update-available", (info) => {
        console.log("Update available:", info?.version);
      });

      autoUpdater.on("update-not-available", () => {
        console.log("No updates available");
      });

      autoUpdater.on("update-downloaded", async () => {
        // Prompt the user to install now or later
        const result = await dialog.showMessageBox({
          type: "question",
          buttons: ["Restart now", "Later"],
          defaultId: 0,
          cancelId: 1,
          message: "A new version of Neuppy has been downloaded.",
          detail: "Restart to apply the update.",
        });
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });

      // Trigger the check
      void autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      console.error("Failed to initialize auto-updates:", error);
    }
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  // Close database connection only when app is actually quitting
  if (database) {
    database.close();
  }
});

// Setup database IPC handlers
function setupDatabaseIPC() {
  // Neuron Cluster operations
  ipcMain.handle(
    "database:createNeuronCluster",
    async (_, input: CreateNeuronClusterInput) => {
      try {
        const db = ensureDatabase();
        return db.createNeuronCluster(input);
      } catch (error) {
        console.error(
          "Error occurred in handler for 'database:createNeuronCluster':",
          error
        );
        throw error;
      }
    }
  );

  ipcMain.handle("database:getNeuronClusterById", async (_, id: string) => {
    try {
      const db = ensureDatabase();
      return db.getNeuronClusterById(id);
    } catch (error) {
      console.error(
        "Error occurred in handler for 'database:getNeuronClusterById':",
        error
      );
      throw error;
    }
  });

  ipcMain.handle("database:getAllNeuronClusters", async () => {
    try {
      const db = ensureDatabase();
      return db.getAllNeuronClusters();
    } catch (error) {
      console.error(
        "Error occurred in handler for 'database:getAllNeuronClusters':",
        error
      );
      throw error;
    }
  });

  ipcMain.handle(
    "database:updateNeuronCluster",
    async (_, id: string, updates: UpdateNeuronClusterInput) => {
      try {
        const db = ensureDatabase();
        return db.updateNeuronCluster(id, updates);
      } catch (error) {
        console.error(
          "Error occurred in handler for 'database:updateNeuronCluster':",
          error
        );
        throw error;
      }
    }
  );

  ipcMain.handle("database:deleteNeuronCluster", async (_, id: string) => {
    try {
      const db = ensureDatabase();
      return db.deleteNeuronCluster(id);
    } catch (error) {
      console.error(
        "Error occurred in handler for 'database:deleteNeuronCluster':",
        error
      );
      throw error;
    }
  });

  // Data Log operations
  ipcMain.handle(
    "database:createDataLog",
    async (_, input: CreateDataLogInput) => {
      try {
        const db = ensureDatabase();
        return db.createDataLog(input);
      } catch (error) {
        console.error(
          "Error occurred in handler for 'database:createDataLog':",
          error
        );
        throw error;
      }
    }
  );

  ipcMain.handle("database:getDataLogById", async (_, id: string) => {
    try {
      const db = ensureDatabase();
      return db.getDataLogById(id);
    } catch (error) {
      console.error(
        "Error occurred in handler for 'database:getDataLogById':",
        error
      );
      throw error;
    }
  });

  ipcMain.handle("database:getAllDataLogs", async () => {
    try {
      const db = ensureDatabase();
      return db.getAllDataLogs();
    } catch (error) {
      console.error(
        "Error occurred in handler for 'database:getAllDataLogs':",
        error
      );
      throw error;
    }
  });

  ipcMain.handle(
    "database:getDataLogsByCluster",
    async (_, clusterId: string) => {
      try {
        const db = ensureDatabase();
        return db.getDataLogsByCluster(clusterId);
      } catch (error) {
        console.error(
          "Error occurred in handler for 'database:getDataLogsByCluster':",
          error
        );
        throw error;
      }
    }
  );

  ipcMain.handle(
    "database:updateDataLog",
    async (_, id: string, updates: UpdateDataLogInput) => {
      const db = ensureDatabase();
      return db.updateDataLog(id, updates);
    }
  );

  ipcMain.handle("database:deleteDataLog", async (_, id: string) => {
    const db = ensureDatabase();
    return db.deleteDataLog(id);
  });

  // Memory Node operations
  ipcMain.handle(
    "database:createMemoryNode",
    async (_, input: CreateMemoryNodeInput) => {
      const db = ensureDatabase();
      return db.createMemoryNode(input);
    }
  );

  ipcMain.handle("database:getMemoryNodeById", async (_, id: string) => {
    const db = ensureDatabase();
    return db.getMemoryNodeById(id);
  });

  ipcMain.handle("database:getAllMemoryNodes", async () => {
    try {
      const db = ensureDatabase();
      return db.getAllMemoryNodes();
    } catch (error) {
      console.error(
        "Error occurred in handler for 'database:getAllMemoryNodes':",
        error
      );
      throw error;
    }
  });

  ipcMain.handle(
    "database:getMemoryNodesByDataLogId",
    async (_, dataLogId: string) => {
      try {
        const db = ensureDatabase();
        return db.getMemoryNodesByDataLogId(dataLogId);
      } catch (error) {
        console.error(
          "Error occurred in handler for 'database:getMemoryNodesByDataLogId':",
          error
        );
        throw error;
      }
    }
  );

  ipcMain.handle(
    "database:updateMemoryNode",
    async (_, id: string, updates: UpdateMemoryNodeInput) => {
      const db = ensureDatabase();
      return db.updateMemoryNode(id, updates);
    }
  );

  ipcMain.handle("database:deleteMemoryNode", async (_, id: string) => {
    const db = ensureDatabase();
    return db.deleteMemoryNode(id);
  });

  // Connection operations
  ipcMain.handle(
    "database:createConnection",
    async (
      _,
      fromNodeId: string,
      toNodeId: string,
      sharedTags: string[],
      glitchOffset?: number
    ) => {
      const db = ensureDatabase();
      return db.createConnection(
        fromNodeId,
        toNodeId,
        sharedTags,
        glitchOffset
      );
    }
  );

  ipcMain.handle("database:getAllConnections", async () => {
    const db = ensureDatabase();
    return db.getAllConnections();
  });

  ipcMain.handle("database:deleteConnection", async (_, id: number) => {
    const db = ensureDatabase();
    return db.deleteConnection(id);
  });

  ipcMain.handle(
    "database:regenerateConnectionsForNode",
    async (_, nodeId: string) => {
      const db = ensureDatabase();
      return db.regenerateConnectionsForNode(nodeId);
    }
  );

  // Search and utility operations
  ipcMain.handle("database:searchDataLogs", async (_, query: string) => {
    const db = ensureDatabase();
    return db.searchDataLogs(query);
  });

  ipcMain.handle("database:getAllTags", async () => {
    try {
      const db = ensureDatabase();
      return db.getAllTags();
    } catch (error) {
      console.error(
        "Error occurred in handler for 'database:getAllTags':",
        error
      );
      throw error;
    }
  });

  // Migration operations
  ipcMain.handle("database:runMigration", async () => {
    const { DataMigration } = await import("./database/migration.js");
    const migration = new DataMigration();
    return migration.migrateExistingData();
  });

  // File operations
  ipcMain.handle(
    "file:saveImage",
    async (_, imageData: Buffer, filename: string) => {
      try {
        const userDataPath = app.getPath("userData");
        const imagesDir = path.join(userDataPath, "images", "memories");

        // Ensure directory exists
        fs.mkdirSync(imagesDir, { recursive: true });

        // Check if file is HEIC and convert to PNG
        const originalExt = path.extname(filename).toLowerCase();
        let finalFilename = filename;
        let finalImageData = imageData;

        if (originalExt === ".heic" || originalExt === ".heif") {
          console.log(`Converting HEIC file: ${filename}`);

          try {
            // Convert HEIC to PNG
            // Convert Buffer -> ArrayBuffer for heic-convert
            const arrayBuffer = imageData.buffer.slice(
              imageData.byteOffset,
              imageData.byteOffset + imageData.byteLength
            );
            const convertedBuffer = await convert({
              buffer: arrayBuffer as ArrayBuffer,
              format: "PNG",
              quality: 1, // Maximum quality
            });

            // Update filename to .png
            const nameWithoutExt = path.parse(filename).name;
            finalFilename = `${nameWithoutExt}.png`;
            finalImageData = Buffer.from(convertedBuffer);

            console.log(
              `Successfully converted ${filename} to ${finalFilename}`
            );
          } catch (conversionError) {
            console.error("HEIC conversion failed:", conversionError);
            // Fall back to saving original file
            console.log("Falling back to saving original HEIC file");
          }
        }

        const filePath = path.join(imagesDir, finalFilename);

        // Write the file
        fs.writeFileSync(filePath, finalImageData);

        console.log(`Saved image: ${finalFilename}`);

        // Return the relative path from assets
        return `./assets/images/memories/${finalFilename}`;
      } catch (error) {
        console.error("Error saving image:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("file:getImagePath", async (_, relativePath: string) => {
    try {
      const userDataPath = app.getPath("userData");
      const fullPath = path.join(
        userDataPath,
        relativePath.replace("./assets/", "")
      );

      if (fs.existsSync(fullPath)) {
        return fullPath;
      }

      // Fallback to project assets for existing images
      const projectPath = path.join(__dirname, "..", relativePath);
      if (fs.existsSync(projectPath)) {
        return projectPath;
      }

      return null;
    } catch (error) {
      console.error("Error getting image path:", error);
      return null;
    }
  });
}

ipcMain.handle("ping", async () => {
  return "pong";
});
