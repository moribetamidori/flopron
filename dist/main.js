import { app, BrowserWindow, ipcMain } from "electron/main";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function createMainWindow() {
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
    createMainWindow();
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
ipcMain.handle("ping", async () => {
    return "pong";
});
