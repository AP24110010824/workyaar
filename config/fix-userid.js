"use strict";

const fs = require("fs");
const path = require("path");

const projectDir = path.join(__dirname); // root of workyaar project

let filesChanged = 0;
let occurrencesReplaced = 0;

function scanDir(dir) {
  const items = fs.readdirSync(dir);
  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      scanDir(fullPath);
    } else if (stats.isFile() && fullPath.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf8");
      let original = content;

      // Replace all variations
      content = content.replace(/\breq\.user\.userId\b/g, "req.user.id");
      content = content.replace(/\breq\.user\.user_id\b/g, "req.user.id");

      if (content !== original) {
        fs.writeFileSync(fullPath, content, "utf8");
        filesChanged++;
        occurrencesReplaced += (original.match(/\breq\.user\.userId\b/g) || []).length;
        occurrencesReplaced += (original.match(/\breq\.user\.user_id\b/g) || []).length;
        console.log(`✅ Fixed: ${fullPath}`);
      }
    }
  });
}

scanDir(projectDir);

console.log("\n=== FIX USERID SUMMARY ===");
console.log("Files changed:", filesChanged);
console.log("Occurrences replaced:", occurrencesReplaced);
console.log("==========================\n");