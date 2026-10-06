import { cp, mkdir, rm } from 'node:fs/promises';
import { loadKnowledge } from '../ai/knowledge.mjs';

const knowledge = await loadKnowledge();
const output = new URL('../ai/dist/jsswift-app/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(new URL('references/documentions/', output), { recursive: true });
await cp(new URL('../ai/skills/jsswift-app/SKILL.md', import.meta.url), new URL('SKILL.md', output));
// Copy only the indexed application contracts, never the framework tree.
const paths = new Set(['knowledge-map.json', ...knowledge.list().map(entry => entry.path)]);
for (const docPath of paths) {
  const destination = new URL(`references/documentions/${docPath}`, output);
  await mkdir(new URL('.', destination), { recursive: true });
  await cp(new URL(`../documentions/${docPath}`, import.meta.url), destination);
}
console.log('Portable Skill built in ai/dist/jsswift-app. Rebuild after documentation changes.');
