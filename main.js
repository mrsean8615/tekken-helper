const { app, BrowserWindow } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

autoUpdater.on("checking-for-update", () => {
  win.webContents.send("update-status", "Checking for updates...");
});
autoUpdater.on("update-available", () => {
  win.webContents.send("update-status", "Update available");
});
autoUpdater.on("update-downloaded", () => {
  win.webContents.send("update-status", "Update downloaded");
  autoUpdater.quitAndInstall();
});
autoUpdater.on("error", (error) => {
  win.webContents.send("update-status", "Error checking for updates");
  console.error("Update error:", error);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: "#0b0f14",
    title: "Tekken 8 Helper",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.removeMenu();
  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  createWindow();

  if (app.isPackaged) {
    autoUpdater.checkForUpdates();
  }

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
