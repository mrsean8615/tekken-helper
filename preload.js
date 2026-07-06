const { contextBridge } = require("electron");
const fs = require("fs/promises");
const path = require("path");

async function readJson(relativePath) {
  const filePath = path.join(__dirname, relativePath);
  const contents = await fs.readFile(filePath, "utf8");
  return JSON.parse(contents);
}

contextBridge.exposeInMainWorld("tekkenHelper", {
  readJson
});
