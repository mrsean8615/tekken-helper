const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs/promises");
const path = require("path");

async function readJson(relativePath) {
  const filePath = path.join(__dirname, relativePath);
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

function onUpdateStatus(callback) {
  const listener = (_event, message) => {
    callback(message);
  };

  ipcRenderer.on("update-status", listener);

  return () => {
    ipcRenderer.removeListener("update-status", listener);
  };
}

async function getUpdateStatus() {
  return ipcRenderer.invoke("get-update-status");
}

function onUpdateVersion(callback) {
  ipcRenderer.on("update-version", (_event, ver) => callback(ver));
}
function onUpdateProgress(callback) {
  ipcRenderer.on("update-progress", (_event, percent) => callback(percent));
}
function onUpdateReady(callback) {
  ipcRenderer.on("update-ready", () => callback());
}
function onUpdateError(callback) {
  ipcRenderer.on("update-error", (_event, message) => callback(message));
}

contextBridge.exposeInMainWorld("tekkenHelper", {
  readJson,
  onUpdateStatus,
  getUpdateStatus,
  closeUpdateWindow: () => ipcRenderer.send("close-update-window"),
  startUpdateDownload: () => ipcRenderer.send("start-update-download"),
  installUpdate: () => ipcRenderer.send("install-update"),
  onUpdateVersion,
  onUpdateProgress,
  onUpdateReady,
  onUpdateError,
});
