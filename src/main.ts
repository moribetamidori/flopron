import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import convert from "heic-convert";
import { PKMDatabase } from "./database/database.js";
import {
  CreateDataLogInput,
  UpdateDataLogInput,
  CreateMemoryNodeInput,
  UpdateMemoryNodeInput,
} from "./database/types.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database instance
let database: PKMDatabase;

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    title: "Flopron • Cuttie's Floppy Neurons",
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

  // Open DevTools for debugging
  win.webContents.openDevTools();

  return win;
}

app.whenReady().then(() => {
  // Initialize database
  database = PKMDatabase.getInstance();

  // Set up IPC handlers for database operations
  setupDatabaseIPC();

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Close database connection
  if (database) {
    database.close();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Setup database IPC handlers
function setupDatabaseIPC() {
  // Data Log operations
  ipcMain.handle(
    "database:createDataLog",
    async (_, input: CreateDataLogInput) => {
      return database.createDataLog(input);
    }
  );

  ipcMain.handle("database:getDataLogById", async (_, id: string) => {
    return database.getDataLogById(id);
  });

  ipcMain.handle("database:getAllDataLogs", async () => {
    return database.getAllDataLogs();
  });

  ipcMain.handle(
    "database:updateDataLog",
    async (_, id: string, updates: UpdateDataLogInput) => {
      return database.updateDataLog(id, updates);
    }
  );

  ipcMain.handle("database:deleteDataLog", async (_, id: string) => {
    return database.deleteDataLog(id);
  });

  // Memory Node operations
  ipcMain.handle(
    "database:createMemoryNode",
    async (_, input: CreateMemoryNodeInput) => {
      return database.createMemoryNode(input);
    }
  );

  ipcMain.handle("database:getMemoryNodeById", async (_, id: string) => {
    return database.getMemoryNodeById(id);
  });

  ipcMain.handle("database:getAllMemoryNodes", async () => {
    return database.getAllMemoryNodes();
  });

  ipcMain.handle(
    "database:updateMemoryNode",
    async (_, id: string, updates: UpdateMemoryNodeInput) => {
      return database.updateMemoryNode(id, updates);
    }
  );

  ipcMain.handle("database:deleteMemoryNode", async (_, id: string) => {
    return database.deleteMemoryNode(id);
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
      return database.createConnection(
        fromNodeId,
        toNodeId,
        sharedTags,
        glitchOffset
      );
    }
  );

  ipcMain.handle("database:getAllConnections", async () => {
    return database.getAllConnections();
  });

  ipcMain.handle("database:deleteConnection", async (_, id: number) => {
    return database.deleteConnection(id);
  });

  // Search and utility operations
  ipcMain.handle("database:searchDataLogs", async (_, query: string) => {
    return database.searchDataLogs(query);
  });

  ipcMain.handle("database:getAllTags", async () => {
    return database.getAllTags();
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
