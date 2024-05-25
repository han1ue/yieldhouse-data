// updateData.js
import fs from "fs";
import path from "path";
import { adapterRegistry } from "./adapters/adapterRegistry.js";

const dataPath = "./data";
const yieldsFile = "yields.json";
const lastUpdateFile = "lastUpdate.json";

async function updateYields(fileName) {
  const filePath = path.join(dataPath, fileName);
  const yields = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (let i = 13; i < yields.length; i++) {
    const protocolName = yields[i].protocol.toLowerCase();
    const adapter = adapterRegistry[protocolName];

    if (adapter && typeof adapter.updateYield === "function") {
      yields[i] = await adapter.updateYield(yields[i]);
      console.log(" yields[i]", yields[i]);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(yields, null, 2));
}

function updateLastUpdateFile() {
  const timestamp = Math.floor(Date.now() / 1000);
  const protocols = Object.keys(adapterRegistry);

  const lastUpdate = {
    timestamp,
    protocols,
  };

  const filePath = path.join(dataPath, lastUpdateFile);
  fs.writeFileSync(filePath, JSON.stringify(lastUpdate, null, 2));
}

await updateYields(yieldsFile);

updateLastUpdateFile();

console.log("Data updated successfully.");
