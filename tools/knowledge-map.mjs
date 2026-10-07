import { readFile, writeFile, readdir } from 'node:fs/promises';
import { loadKnowledge } from '../ai/knowledge.mjs';

const root = new URL('../documentions/', import.meta.url);
const mapPath = new URL('knowledge-map.json', root);
if (process.argv.includes('--refresh')) {
  const map = JSON.parse(await readFile(mapPath, 'utf8'));
  const previous = new Map(map.components.map(entry => [entry.id, entry]));
  const files = (await readdir(new URL('components/', root))).filter(name => name.endsWith('.md') && name !== 'README.md' && !Object.hasOwn(map.documentAliases ?? {}, `components/${name}`)).sort();
  map.components = await Promise.all(files.map(async file => {
    const text = await readFile(new URL(`components/${file}`, root), 'utf8');
    const metadata = JSON.parse(text.match(/```json\s*([\s\S]*?)```/)[1]);
    const id = file.replace(/\.md$/, '');
    const name = text.split('\n')[0].replace(/^# /, '');
    return { id, name, path: `components/${file}`, summary: metadata.description ?? '',
      keywords: [...new Set([name, `_.${name}`, ...(previous.get(id)?.keywords ?? []).map(keyword => keyword.replace(/^JSswift\.(?:ui\.)?/, '_.'))])],
      topics: previous.get(id)?.topics ?? ['composition'] };
  }));
  await writeFile(mapPath, JSON.stringify(map, null, 2) + '\n');
}
const knowledge = await loadKnowledge();
console.log(`Knowledge map valid: ${knowledge.map.topics.length} topics, ${knowledge.map.components.length} components.`);
