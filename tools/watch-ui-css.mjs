import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(rootDir, "packages", "ui", "src", "css");
const buildScript = path.join(rootDir, "tools", "build-ui-css.mjs");

let rebuilding = false;
let rebuildQueued = false;
let timer;
let sourceFingerprint = getSourceFingerprint();

function build() {
  if (rebuilding) {
    rebuildQueued = true;
    return;
  }

  rebuilding = true;
  execFile(process.execPath, [buildScript], { cwd: rootDir }, (error, stdout, stderr) => {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    rebuilding = false;

    if (error) {
      console.error(`ui-css: build failed (${error.message})`);
    }

    if (rebuildQueued) {
      rebuildQueued = false;
      build();
    }
  });
}

function scheduleBuild() {
  clearTimeout(timer);
  timer = setTimeout(build, 80);
}

build();
setInterval(() => {
  const nextFingerprint = getSourceFingerprint();
  if (nextFingerprint === sourceFingerprint) return;
  sourceFingerprint = nextFingerprint;
  scheduleBuild();
}, 250);

console.log(`ui-css: watching ${path.relative(rootDir, sourceDir)} (polling every 250ms)`);

function getSourceFingerprint() {
  function collect(directory) {
    return fs.readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap(entry => {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) return collect(file);
        if (!entry.isFile() || !entry.name.endsWith('.css')) return [];
        const stat = fs.statSync(file);
        return [`${path.relative(sourceDir, file)}:${stat.mtimeMs}:${stat.size}`];
      });
  }
  return collect(sourceDir).join('|');
}

function stop() {
  clearTimeout(timer);
  process.exit();
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
