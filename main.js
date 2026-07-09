const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
if (!app.isPackaged) {
  try {
    require("electron-reloader")(module);
  } catch {}
}

let mainWindow = null;
let loadingWindow = null;
let updateWindow = null;
let updateDeclined = false;
let latestUpdateStatus = "";

function sendUpdateStatus(message) {
  latestUpdateStatus = message;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("update-status", message);
  }
}
function clearUpdateStatusAfter(delay = 5000) {
  setTimeout(() => {
    latestUpdateStatus = "";

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-status", "");
    }
  }, delay);
}

autoUpdater.autoDownload = false;

autoUpdater.on("checking-for-update", () => {
  sendUpdateStatus("Checking for updates...");
});
autoUpdater.on("update-available", (info) => {
  if (!updateDeclined) {
    createUpdateWindow(info.version);
  }
});
autoUpdater.on("update-not-available", () => {
  sendUpdateStatus("You're up to date.");
  clearUpdateStatusAfter();
});
autoUpdater.on("download-progress", (progress) => {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.webContents.send(
      "update-progress",
      Math.round(progress.percent),
    );
  }
});
autoUpdater.on("update-downloaded", () => {
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.webContents.send("update-ready");
  }
});
autoUpdater.on("error", (error) => {
  sendUpdateStatus("Error checking for updates.");
  clearUpdateStatusAfter();

  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.webContents.send("update-error", "Unable to download update.");
  }

  console.error("Update error:", error);
});

ipcMain.handle("get-update-status", () => latestUpdateStatus);

function createWindow() {
  // Create loading window
  loadingWindow = new BrowserWindow({
    width: 600,
    height: 450,
    frame: false,
    transparent: false,
    backgroundColor: "#0b0f14",
    alwaysOnTop: true,
    resizable: false,
  });

  loadingWindow.loadFile(path.join(__dirname, "pages/loading.html"));

  // Create main app window
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
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
    if (app.isPackaged) {
      autoUpdater.allowPrerelease = true;
      autoUpdater.checkForUpdates();
    } else {
      sendUpdateStatus("Update checks are disabled in development.");
      clearUpdateStatusAfter();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

function createUpdateWindow(version) {
  updateWindow = new BrowserWindow({
    width: 600,
    height: 450,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    modal: true,
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  updateWindow.center();

  updateWindow.loadFile(path.join(__dirname, "pages/update.html"));

  updateWindow.on("closed", () => {
    updateWindow = null;
  });

  updateWindow.webContents.once("did-finish-load", () => {
    updateWindow.webContents.send("update-version", version);
  });
}

ipcMain.on("start-update-download", () => {
  autoUpdater.downloadUpdate();
});
ipcMain.on("install-update", () => {
  autoUpdater.quitAndInstall(true, true);
});
ipcMain.on("close-update-window", () => {
  updateDeclined = true;
  if (updateWindow && !updateWindow.isDestroyed()) {
    updateWindow.close();
  }
});

app.whenReady().then(() => {
  createWindow();

  if (!app.isPackaged) {
    globalShortcut.register("Ctrl+Shift+U", () => {
      if (!updateWindow || updateWindow.isDestroyed()) {
        createUpdateWindow("99.9.9");
      }
    });
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  globalShortcut.unregisterAll();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
