import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 3022;

// Se esiste /public, serviamo quello. Altrimenti la root del progetto.
const PROJECT_ROOT = process.cwd();
const PUBLIC_ROOT = fs.existsSync(path.join(PROJECT_ROOT, "public"))
  ? path.join(PROJECT_ROOT, "public")
  : PROJECT_ROOT;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function safeJoin(base, target) {
  // evita path traversal
  const targetPath = path.normalize(target).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(base, targetPath);
}

http
  .createServer((req, res) => {
    try {
      // 1) togli querystring (?v=123)
      const urlObj = new URL(req.url, `http://${req.headers.host}`);
      let pathname = decodeURIComponent(urlObj.pathname);

      // 2) default index.html
      if (pathname === "/") pathname = "/index.html";

      // 3) se chiedono una directory, prova /index.html dentro
      let filePath = safeJoin(PUBLIC_ROOT, pathname);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        console.log("404", pathname, "=>", filePath);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const type = mime[ext] || "application/octet-stream";

      const content = fs.readFileSync(filePath);
      res.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "no-cache",
      });
      res.end(content);
    } catch (e) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Server error");
      console.error(e);
    }
  })
  .listen(PORT, () => {
    console.log(`🚀 JSswift DEV → http://localhost:${PORT}`);
    console.log(`📁 Serving static from: ${PUBLIC_ROOT}`);
  });