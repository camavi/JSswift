import fs from "node:fs/promises";
import path from "node:path";
import { transform } from "esbuild";
import { loadKnowledge } from '../ai/knowledge.mjs';

const coreFile = path.resolve("packages/core/dist/cms.js");
const uiFile = path.resolve("packages/ui/dist/ui.js");
const uiDistDir = path.resolve("packages/ui/dist");
const jsswiftDistDir = path.resolve("packages/jsswift/dist");
const outputFile = path.join(jsswiftDistDir, "jsswift.js");
const minOutputFile = path.join(jsswiftDistDir, "min-jsswift.js");
const minAliasOutputFile = path.join(jsswiftDistDir, "jsswift.min.js");

async function main() {
  const knowledge = await loadKnowledge();
  const [core, ui] = await Promise.all([
    fs.readFile(coreFile, "utf8"),
    fs.readFile(uiFile, "utf8"),
  ]);

  const stripped = await transform(`${core}\n\n${ui}\n`, {loader:"js", minifyWhitespace:true, legalComments:"none", ignoreAnnotations:true, target:"es2018"});
  const readable = await transform(stripped.code, {loader:"js", legalComments:"none", ignoreAnnotations:true, target:"es2018"});
  const output = readable.code;
  const minified = await transform(output, {
    loader: "js",
    minify: true,
    legalComments: "none",
    target: "es2018",
  });

  await fs.mkdir(jsswiftDistDir, { recursive: true });
  await fs.writeFile(outputFile, output, "utf8");
  await fs.writeFile(minOutputFile, minified.code, "utf8");
  await fs.writeFile(minAliasOutputFile, minified.code, "utf8");
  await fs.copyFile(path.join(uiDistDir, "tabler.js"), path.join(jsswiftDistDir, "tabler.js"));
  await copyDir(path.join(uiDistDir, "css"), path.join(jsswiftDistDir, "css"));
  await copyDir(path.join(uiDistDir, "fonts"), path.join(jsswiftDistDir, "fonts"));
  await copyDir(path.join(uiDistDir, "img"), path.join(jsswiftDistDir, "img"));
  await copyDir(path.resolve('documentions'), path.join(jsswiftDistDir, 'documentions'));
  await fs.copyFile(path.resolve('documentions/AI.md'), path.resolve('packages/jsswift/AI.md'));
  const manifest = JSON.parse(await fs.readFile('packages/jsswift/package.json', 'utf8'));
  await fs.writeFile(path.join(jsswiftDistDir, 'documentions/knowledge-map.json'),
    JSON.stringify({ ...knowledge.map, packageVersion: manifest.version }, null, 2) + '\n');
  process.stdout.write(
    `[build:jsswift] wrote ${path.relative(process.cwd(), outputFile)}, ${path.relative(process.cwd(), minOutputFile)} and ${path.relative(process.cwd(), minAliasOutputFile)} (with css/fonts/img)\n`,
  );
}

async function copyDir(source, destination) {
  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, { recursive: true });
}

main().catch((error) => {
  console.error("[build:jsswift] failed:", error);
  process.exitCode = 1;
});
