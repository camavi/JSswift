import fs from "node:fs/promises";
import path from "node:path";
import { transform } from "esbuild";

const coreFile = path.resolve("packages/core/dist/cms.js");
const uiFile = path.resolve("packages/ui/dist/ui.js");
const uiDistDir = path.resolve("packages/ui/dist");
const jsswiftDistDir = path.resolve("packages/jsswift/dist");
const outputFile = path.join(jsswiftDistDir, "jsswift.js");
const minOutputFile = path.join(jsswiftDistDir, "min-jsswift.js");
const minAliasOutputFile = path.join(jsswiftDistDir, "jsswift.min.js");

async function main() {
  const [core, ui] = await Promise.all([
    fs.readFile(coreFile, "utf8"),
    fs.readFile(uiFile, "utf8"),
  ]);

  const output = `${core}\n\n${ui}\n`;
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
  await copyDir(path.join(uiDistDir, "css"), path.join(jsswiftDistDir, "css"));
  await copyDir(path.join(uiDistDir, "fonts"), path.join(jsswiftDistDir, "fonts"));
  await copyDir(path.join(uiDistDir, "img"), path.join(jsswiftDistDir, "img"));
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
