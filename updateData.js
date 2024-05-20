const fs = require("fs");

function updateTextFile() {
  const now = new Date();
  const content = `Updated on ${now}\n`;
  fs.appendFileSync("update.txt", content);
}

updateTextFile();
