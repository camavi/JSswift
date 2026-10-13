import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectUI, componentNames } from './select-ui.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'packages/ui/src');
const filename = path.join(directory, 'modules.json');
const manifest = JSON.parse(await fs.readFile(filename, 'utf8'));
const aliases = new Map();
for (const [name, entry] of Object.entries(manifest.components)) {
  for (const exported of [name, ...entry.aliases]) aliases.set(exported, name);
}
const discovered = await componentNames(root);
if ([...discovered].some(name => !aliases.has(name)) || [...aliases.keys()].some(name => !discovered.has(name))) throw new Error('UI component registry does not match the public exports');
let changed = false;
for (const [kind, entries] of Object.entries({ components: manifest.components, services: manifest.services })) {
  for (const [name, entry] of Object.entries(entries)) {
    const selected = await selectUI(root, kind === 'components' ? [name] : [], kind === 'services' ? [name] : []);
    const helpers = selected.sources.map(file => path.relative(directory, path.join(root, file))).filter(file => file.startsWith('helpers/'));
    const dependencies = [...new Set(selected.components.map(component => aliases.get(component)).filter(component => kind === 'services' || component !== name))];
    if (JSON.stringify(entry.helpers) !== JSON.stringify(helpers) || JSON.stringify(entry.dependencies) !== JSON.stringify(dependencies)) changed = true;
    Object.assign(entry, { helpers, dependencies });
  }
}
if (process.argv.includes('--write')) {
  if (changed) await fs.writeFile(filename, JSON.stringify(manifest, null, 2) + '\n');
} else if (changed) throw new Error('UI dependency registry is stale; run npm run ui:registry:refresh');
console.log(`UI registry valid: ${discovered.size} public exports, ${Object.keys(manifest.services).length} services`);
