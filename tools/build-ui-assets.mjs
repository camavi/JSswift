import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const targets = [
  {
    from: path.join(ROOT, "pages", "_jsswift-fe", "fonts"),
    to: path.join(ROOT, "packages", "ui", "dist", "fonts"),
  },
  {
    from: path.join(ROOT, "pages", "_jsswift-fe", "img"),
    to: path.join(ROOT, "packages", "ui", "dist", "img"),
  },
];

for (const target of targets) {
  fs.mkdirSync(path.dirname(target.to), { recursive: true });
  fs.cpSync(target.from, target.to, { recursive: true, force: true });
  console.log(
    `ui-assets: ${path.relative(ROOT, target.from)} -> ${path.relative(ROOT, target.to)}`,
  );
}
