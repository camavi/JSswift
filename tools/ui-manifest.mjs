import fs from 'node:fs/promises';
import path from 'node:path';

export function uiSourceFiles(manifest) {
  const files = new Set(['modules.json', ...manifest.buildOrder]);
  for (const entry of [...Object.values(manifest.components ?? {}), ...Object.values(manifest.services ?? {})]) {
    for (const file of [...(Array.isArray(entry.js) ? entry.js : [entry.js]), ...(entry.css ?? []), ...(entry.helpers ?? [])]) files.add(file);
  }
  if (manifest.styles?.entry) files.add(manifest.styles.entry);
  for (const file of manifest.styles?.shared ?? []) files.add(file);
  return [...files];
}

export async function readUIManifest(directory) {
  const manifest = JSON.parse(await fs.readFile(path.join(directory, 'modules.json'), 'utf8'));
  const order = manifest.buildOrder;
  if (!Array.isArray(order) || !order.length || new Set(order).size !== order.length) throw new Error('Invalid UI module buildOrder');
  const names = new Set(Object.keys(manifest.components ?? {}));
  for (const [name, component] of Object.entries(manifest.components ?? {})) {
    if (!order.includes(component.js)) throw new Error(`UI component ${name} JS is absent from buildOrder`);
    for (const alias of component.aliases ?? []) {
      if (names.has(alias)) throw new Error(`Duplicate UI component alias: ${alias}`);
      names.add(alias);
    }
  }
  for (const [name, service] of Object.entries(manifest.services ?? {})) {
    if (!Array.isArray(service.js) || !service.js.length || service.js.some(file => !order.includes(file))) throw new Error(`UI service ${name} JS is absent from buildOrder`);
  }
  for (const [name, entry] of [...Object.entries(manifest.components ?? {}), ...Object.entries(manifest.services ?? {})]) {
    for (const dependency of entry.dependencies ?? []) if (!names.has(dependency)) throw new Error(`Unknown UI dependency ${dependency} in ${name}`);
    for (const helper of entry.helpers ?? []) if (!order.includes(helper)) throw new Error(`UI helper ${helper} is absent from buildOrder`);
  }
  for (const [prefix, owners] of Object.entries(manifest.cssOwnership ?? {})) {
    if (!Array.isArray(owners) || !owners.length || owners.some(name => !names.has(name) && !Object.hasOwn(manifest.services ?? {}, name.replace(/^\$/, '')))) throw new Error(`Invalid UI CSS ownership: ${prefix}`);
  }
  await Promise.all(uiSourceFiles(manifest).map(async file => {
    if (typeof file !== 'string' || !file || path.isAbsolute(file) || file.split(/[\\/]/).includes('..')) throw new Error(`Invalid UI source path: ${file}`);
    if (!(await fs.stat(path.join(directory, file))).isFile()) throw new Error(`UI source is not a file: ${file}`);
  }));
  return manifest;
}
