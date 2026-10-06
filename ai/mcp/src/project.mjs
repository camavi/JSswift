import { createRequire } from 'node:module';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

export async function resolveProject(project = process.cwd()) {
  const root = await realpath(path.resolve(project));
  const require = createRequire(path.join(root, 'package.json'));
  let mapPath, manifestPath;
  try {
    mapPath = require.resolve('jsswift/knowledge-map.json');
    manifestPath = require.resolve('jsswift/package.json');
  } catch {
    throw new Error(`No JSswift package with bundled documentation found from ${root}. Install a release containing knowledge-map.json, or use --project /path/to/app.`);
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const map = JSON.parse(await readFile(mapPath, 'utf8'));
  if (manifest.name !== 'jsswift' || map.packageVersion !== manifest.version) {
    throw new Error('JSswift documentation version does not match the installed package');
  }
  return { project: root, version: manifest.version, docsRoot: path.dirname(mapPath) };
}

export function parseArgs(args) {
  const options = { project: process.cwd() };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!['--project', '--docs'].includes(key) || !args[i + 1] || args[i + 1].startsWith('--')) {
      throw new Error('Usage: jsswift-mcp [--project /path/to/app] [--docs /path/to/development/documentions]');
    }
    options[key.slice(2)] = path.resolve(args[++i]);
  }
  return options;
}
