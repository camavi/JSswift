import fs from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve("outline");
const OUT_FILE = path.resolve("../../src/_jsswift-fe/css/tabler-icons-out.css");

// sprite SVG che userai nel CSS
const SPRITE_URL = "../img/svg/tabler-icons-outline-sprite.svg";

// prefisso classe
const CLASS_PREFIX = ".";

// dimensione default (puoi toglierla se preferisci solo background)
const DEFAULT_SIZE = "24px";

function walkSvgFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkSvgFiles(p));
    else if (entry.isFile() && entry.name.endsWith(".svg")) out.push(p);
  }
  return out;
}

function safeName(file) {
  return file
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error("❌ Cartella sorgente non trovata:", SRC_DIR);
    process.exit(1);
  }

  const files = walkSvgFiles(SRC_DIR).sort();
  if (!files.length) {
    console.error("❌ Nessun SVG trovato");
    process.exit(1);
  }

  const lines = [];
  lines.push("/* AUTO-GENERATED FILE – DO NOT EDIT */");
  lines.push("/* Tabler Icons – CSS classes */");
  lines.push("");

  for (const file of files) {
    const name = safeName(path.basename(file, ".svg"));
    const cls = `${CLASS_PREFIX}${name}`;

    lines.push(`.cms-icon${cls} {`);
    lines.push(
      `  background-image: url("${SPRITE_URL}#${name}");`
    );
    lines.push("}");
    lines.push("");
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, lines.join("\n"), "utf8");

  console.log(`✅ CSS generato: ${OUT_FILE}`);
  console.log(`   Classi create: ${files.length}`);
}

main();