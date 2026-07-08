const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
try {
  require("electron-reloader")(module);
} catch {}

let mainWindow = null;
let loadingWindow = null;
let latestUpdateStatus = "Checking for updates...";

function sendUpdateStatus(message) {
  latestUpdateStatus = message;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-status", message);
  }
}

autoUpdater.on("checking-for-update", () => {
  sendUpdateStatus("Checking for updates...");
});
autoUpdater.on("update-available", () => {
  sendUpdateStatus("Update found. Downloading...");
});
autoUpdater.on("update-not-available", () => {
  sendUpdateStatus("You're up to date.");
});
autoUpdater.on("update-downloaded", () => {
  sendUpdateStatus("Update downloaded. Restarting...");
  autoUpdater.quitAndInstall();
});
autoUpdater.on("error", (error) => {
  sendUpdateStatus("Error checking for updates.");
  console.error("Update error:", error);
});

ipcMain.handle("get-update-status", () => latestUpdateStatus);

function createWindow() {
  // Create loading window
  loadingWindow = new BrowserWindow({
    width: 500,
    height: 300,
    frame: false,
    transparent: false,
    backgroundColor: "#0b0f14",
    alwaysOnTop: true,
    resizable: false,
  });

  loadingWindow.loadFile(path.join(__dirname, "loading.html"));

  // Create main app window
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: "#0b0f14",
    title: "Tekken 8 Helper",
    show: false, // Don't show until loaded
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    if (loadingWindow && !loadingWindow.isDestroyed()) {
      loadingWindow.close();
      loadingWindow = null;
    }
  });

  mainWindow.webContents.once("did-finish-load", () => {
    sendUpdateStatus("Checking for updates...");

    if (app.isPackaged) {
      autoUpdater.checkForUpdates();
    } else {
      sendUpdateStatus("Update checks are disabled in development.");
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
