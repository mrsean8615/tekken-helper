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

contextBridge.exposeInMainWorld("tekkenHelper", {
  readJson,
  onUpdateStatus,
  getUpdateStatus,
});
