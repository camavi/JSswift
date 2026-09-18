import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const viteEntrypoint = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");
const cssWatcher = path.join(rootDir, "tools", "watch-ui-css.mjs");
const children = [
  spawn(process.execPath, [viteEntrypoint, ...process.argv.slice(2)], { cwd: rootDir, stdio: "inherit" }),
  spawn(process.execPath, [cssWatcher], { cwd: rootDir, stdio: "inherit" }),
];

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (!stopping) {
      console.error(`dev: ${signal ? `stopped by ${signal}` : `exited with code ${code}`}`);
      stop(code ?? 1);
    }
  });
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
