import fs from "node:fs/promises";
import path from "node:path";
import { transform } from "esbuild";

const rootDir = path.resolve("packages/core/src");
const outputFile = path.resolve("packages/core/dist/cms.js");
const minOutputFile = path.resolve("packages/core/dist/min-cms.js");
const minAliasOutputFile = path.resolve("packages/core/dist/cms.min.js");
const manifestFile = path.join(rootDir, "modules.json");
const legacyOutputFile = path.resolve("pages/_jsswift-fe/js/cms.js");
const legacyMinOutputFile = path.resolve("pages/_jsswift-fe/js/min-cms.js");
const legacyMinAliasOutputFile = path.resolve("pages/_jsswift-fe/js/cms.min.js");

async function readModule(name) {
  const filename = path.join(rootDir, name);
  return fs.readFile(filename, "utf8");
}

async function main() {
  const modules = JSON.parse(await fs.readFile(manifestFile, "utf8"));
  if (!Array.isArray(modules) || !modules.length) {
    throw new Error("Invalid cms module manifest");
  }
  const chunks = await Promise.all(modules.map(readModule));
  const output = chunks.join("");
  const minified = await transform(output, {
    loader: "js",
    minify: true,
    legalComments: "none",
    target: "es2018"
  });
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.mkdir(path.dirname(legacyOutputFile), { recursive: true });
  await fs.writeFile(outputFile, output, "utf8");
  await fs.writeFile(minOutputFile, minified.code, "utf8");
  await fs.writeFile(minAliasOutputFile, minified.code, "utf8");
  await fs.writeFile(legacyOutputFile, output, "utf8");
  await fs.writeFile(legacyMinOutputFile, minified.code, "utf8");
  await fs.writeFile(legacyMinAliasOutputFile, minified.code, "utf8");
  process.stdout.write(`[build:cms] wrote ${path.relative(process.cwd(), outputFile)}, ${path.relative(process.cwd(), minOutputFile)} and ${path.relative(process.cwd(), minAliasOutputFile)} from ${modules.length} modules (legacy mirror updated)\n`);
}

main().catch((error) => {
  console.error("[build:cms] failed:", error);
  process.exitCode = 1;
});
