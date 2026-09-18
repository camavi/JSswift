import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
function getHtmlEntries(dir, base = dir, entries = {}) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) getHtmlEntries(full, base, entries);
    else if (file.endsWith(".html")) {
      const name = path.relative(base, full).replace(/\.html$/, "");
      entries[name] = full;
    }
  }
  return entries;
}

export default defineConfig({
  root: "pages",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: getHtmlEntries(path.resolve("pages")),
    },
  },
});
