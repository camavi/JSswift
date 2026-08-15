import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "packages", "ui", "src", "css");
const LEGACY_SOURCE_DIR = path.join(ROOT, "pages", "_cmswift-fe", "css");
const DIST_DIR = path.join(ROOT, "packages", "ui", "dist", "css");
const FALLBACK_SOURCE_DIR = DIST_DIR;
const CSS_SOURCE_DIR = fs.existsSync(path.join(SOURCE_DIR, "base.css"))
  ? SOURCE_DIR
  : fs.existsSync(path.join(LEGACY_SOURCE_DIR, "base.css"))
  ? LEGACY_SOURCE_DIR
  : FALLBACK_SOURCE_DIR;
const LEGACY_DIR = LEGACY_SOURCE_DIR;

const COPY_FILES = [
  "base.css",
  "responsive.css",
  "animation.css",
  "docs.css",
  "ui-components.css",
];

const BUNDLE_FILES = [
  "base.css",
  "responsive.css",
  "animation.css",
  "ui-components.css",
];

fs.mkdirSync(DIST_DIR, { recursive: true });
fs.mkdirSync(LEGACY_DIR, { recursive: true });

for (const fileName of COPY_FILES) {
  const sourceFile = path.join(CSS_SOURCE_DIR, fileName);
  const distFile = path.join(DIST_DIR, fileName);
  fs.copyFileSync(sourceFile, distFile);
}

const bundle = BUNDLE_FILES.map((fileName) => {
  const sourceFile = path.join(CSS_SOURCE_DIR, fileName);
  const content = fs.readFileSync(sourceFile, "utf8").replace(/\r\n/g, "\n").trim();
  return `/* >>> ${fileName} */\n${content}\n`;
}).join("\n");

const minifiedBundle = minifyCss(bundle);

const outputs = [
  { fileName: "ui.css", content: bundle },
  { fileName: "min-ui.css", content: minifiedBundle },
  { fileName: "ui.min.css", content: minifiedBundle },
];

for (const output of outputs) {
  fs.writeFileSync(path.join(DIST_DIR, output.fileName), `${output.content.trim()}\n`, "utf8");
  fs.writeFileSync(path.join(LEGACY_DIR, output.fileName), `${output.content.trim()}\n`, "utf8");
}

const allowedOutputFiles = new Set([
  ...COPY_FILES,
  ...outputs.map((output) => output.fileName),
]);
cleanupExtraCss(DIST_DIR, allowedOutputFiles);
cleanupExtraCss(LEGACY_DIR, allowedOutputFiles);

console.log(
  `ui-css: built ${BUNDLE_FILES.length} sources -> ${path.relative(ROOT, path.join(DIST_DIR, "ui.css"))}`,
);
console.log(
  `ui-css: built minified bundle -> ${path.relative(ROOT, path.join(DIST_DIR, "min-ui.css"))}`,
);
console.log(
  `ui-css: built minified CDN alias -> ${path.relative(ROOT, path.join(DIST_DIR, "ui.min.css"))}`,
);
console.log(`ui-css: source directory -> ${path.relative(ROOT, CSS_SOURCE_DIR)}`);

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function cleanupExtraCss(dir, allowedFiles) {
  for (const fileName of fs.readdirSync(dir)) {
    if (!fileName.endsWith(".css") || allowedFiles.has(fileName)) continue;
    fs.rmSync(path.join(dir, fileName), { force: true });
  }
}
