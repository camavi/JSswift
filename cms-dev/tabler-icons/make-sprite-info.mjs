import fs from "node:fs";
import path from "node:path";

const SRC_DIR_OUT = path.resolve("outline");
const SRC_DIR_FILL = path.resolve("filled");
const OUT_FILE = path.resolve("../../src/_jsswift-fe/js/tabler-icons-info.json");

// Personalizza come vuoi:
const ID_PREFIX = "";         // es. "tabler-" oppure "" se vuoi solo nomefile
const REMOVE_FILL_ATTRS = true;      // toglie fill="..." se vuoi sempre fill via CSS
const REMOVE_STROKE_ATTRS = false;   // di solito Tabler usa stroke=currentColor; lascialo pure

function walkSvgFiles(dir) {
  const out = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const p = path.join(dir, it.name);
    if (it.isDirectory()) out.push(...walkSvgFiles(p));
    else if (it.isFile() && it.name.toLowerCase().endsWith(".svg")) out.push(p);
  }
  return out;
}

function stripComments(s) {
  // HTML/XML comments
  return s.replace(/<!--[\s\S]*?-->/g, "");
}

function normalizeWhitespace(s) {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function getViewBox(svg) {
  const m = svg.match(/\bviewBox\s*=\s*["']([^"']+)["']/i);
  return m ? m[1].trim() : "0 0 24 24";
}

function extractInner(svg) {
  // rimuove wrapper <svg ...> ... </svg>
  // e lascia solo il contenuto interno (path, line, polyline, ecc.)
  const m = svg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
  return m ? m[1] : svg; // fallback
}

function cleanupInner(inner) {
  let s = inner;

  // rimuove eventuali <title>, <desc>, <metadata>
  s = s.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "");
  s = s.replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/gi, "");
  s = s.replace(/<metadata\b[^>]*>[\s\S]*?<\/metadata>/gi, "");

  // (opzionale) rimuove fill attr (utile se vuoi sempre fill:none e stroke via CSS)
  if (REMOVE_FILL_ATTRS) {
    s = s.replace(/\sfill\s*=\s*["'][^"']*["']/gi, "");
  }
  if (REMOVE_STROKE_ATTRS) {
    s = s.replace(/\sstroke\s*=\s*["'][^"']*["']/gi, "");
  }

  return normalizeWhitespace(s);
}

function fileIdFromPath(filePath) {
  const base = path.basename(filePath, ".svg");
  // id sicuro: solo [a-z0-9-_]
  const safe = base
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return ID_PREFIX + safe;
}

function main() {
  if (!fs.existsSync(SRC_DIR_OUT)) {
    console.error(`❌ SRC_DIR_OUT non esiste: ${SRC_DIR_OUT}`);
    process.exit(1);
  }

  if (!fs.existsSync(SRC_DIR_FILL)) {
    console.error(`❌ SRC_DIR_FILL non esiste: ${SRC_DIR_FILL}`);
    process.exit(1);
  }

  const files_out = walkSvgFiles(SRC_DIR_OUT).sort();
  if (files_out.length === 0) {
    console.error(`❌ Nessun .svg trovato in: ${SRC_DIR_OUT}`);
    process.exit(1);
  }

  const files_fill = walkSvgFiles(SRC_DIR_FILL).sort();
  if (files_fill.length === 0) {
    console.error(`❌ Nessun .svg trovato in: ${SRC_DIR_FILL}`);
    process.exit(1);
  }

  const symbols = [];
  const seen = new Set();
  symbols.push(`[`);

  for (const f of files_out) {
    const raw = fs.readFileSync(f, "utf8");
    const noComments = stripComments(raw);
    const inner = cleanupInner(extractInner(noComments));
    if (!inner) continue;

    const id = fileIdFromPath(f);
    if (seen.has(id)) continue;
    seen.add(id);

    symbols.push(`"${id}",`);
  }/**/


  for (const f of files_fill) {
    const raw = fs.readFileSync(f, "utf8");
    const noComments = stripComments(raw);
    const inner = cleanupInner(extractInner(noComments));
    if (!inner) continue;

    const id = fileIdFromPath(f.replace('svg', '') + "-fill");
    if (seen.has(id)) continue;
    seen.add(id);

    symbols.push(`"${id}",`);
  }/**/

  //leviamo del ultimo ","
  symbols[symbols.length - 1] = symbols[symbols.length - 1].slice(0, -1);

  symbols.push(`]`);

  const sprite = symbols.join("\n");

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, sprite, "utf8");

  console.log(`✅ Sprite generato: ${OUT_FILE}`);
  console.log(`   Icone incluse: ${symbols.length}`);
}

main();