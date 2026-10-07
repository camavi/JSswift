import { readFile, realpath, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const defaultRoot = fileURLToPath(new URL('../documentions/', import.meta.url));
const tokens = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9]+/g) ?? [];

export async function loadKnowledge(root = defaultRoot) {
  const docsRoot = await realpath(root);
  const map = JSON.parse(await readFile(path.join(docsRoot, 'knowledge-map.json'), 'utf8'));
  if (map.schemaVersion !== 1 || map.scope !== 'application-development') throw new Error('Unsupported knowledge map');
  if (!Array.isArray(map.topics) || !Array.isArray(map.components)) throw new Error('Invalid knowledge collections');
  const topicIds = new Set();
  for (const topic of map.topics) {
    if (typeof topic.id !== 'string' || topicIds.has(topic.id) || typeof topic.title !== 'string' ||
      !Array.isArray(topic.paths) || !topic.paths.length || !Array.isArray(topic.keywords) ||
      topic.keywords.some(word => typeof word !== 'string')) throw new Error('Invalid or duplicate topic');
    topicIds.add(topic.id);
  }
  for (const component of map.components) {
    if (typeof component.id !== 'string' || typeof component.name !== 'string' ||
      typeof component.summary !== 'string' || !Array.isArray(component.keywords) ||
      component.keywords.some(word => typeof word !== 'string') || !Array.isArray(component.topics) ||
      !component.topics.length || component.topics.some(id => !topicIds.has(id))) throw new Error('Invalid component entry');
  }
  const entries = new Map();
  const add = entry => {
    if (entries.has(entry.id)) throw new Error(`Duplicate document ID: ${entry.id}`);
    entries.set(entry.id, entry);
  };
  add({ id: 'guide:index', kind: 'guide', title: 'Application documentation', path: map.entrypoint, keywords: ['start', 'index'] });
  for (const topic of map.topics) {
    for (const docPath of topic.paths) {
      const id = `guide:${docPath.replace(/\.md$/, '')}`;
      const existing = entries.get(id);
      if (existing) existing.keywords.push(...topic.keywords);
      else add({ id, kind: 'guide', title: topic.title, path: docPath, keywords: [...topic.keywords] });
    }
  }
  for (const component of map.components) {
    add({ id: `component:${component.id}`, kind: 'component', title: component.name,
      path: component.path, summary: component.summary, keywords: component.keywords, topics: component.topics });
  }

  async function safePath(relativePath) {
    if (typeof relativePath !== 'string' || path.isAbsolute(relativePath) || relativePath.split(/[\\/]/).includes('..')) {
      throw new Error('Invalid documentation path');
    }
    const resolved = await realpath(path.join(docsRoot, relativePath));
    if (!resolved.startsWith(docsRoot + path.sep)) throw new Error('Document outside documentation root');
    return resolved;
  }

  // Validate all references at startup, including symlinks and component coverage.
  for (const entry of entries.values()) {
    if (!entry.path.endsWith('.md')) throw new Error(`Invalid document extension: ${entry.path}`);
    const text = await readFile(await safePath(entry.path), 'utf8');
    if (entry.kind === 'guide') entry.title = text.split('\n')[0].replace(/^# /, '');
    if (entry.kind === 'component') {
      const block = text.match(/```json\s*([\s\S]*?)```/);
      if (!block) throw new Error(`Missing component metadata: ${entry.path}`);
      const metadata = JSON.parse(block[1]);
      if (metadata.commonProps) {
        const shared = metadata.commonProps;
        if (!Array.isArray(shared.keys) || shared.keys.some(key => typeof key !== 'string') ||
            !entries.has(`guide:${String(shared.path).replace(/\.md$/, '')}`)) {
          throw new Error(`Invalid common props reference: ${entry.path}`);
        }
        const sharedText = await readFile(await safePath(shared.path), 'utf8');
        const sharedBlock = sharedText.match(/```json\s*([\s\S]*?)```/);
        const sharedMetadata = sharedBlock ? JSON.parse(sharedBlock[1]) : null;
        if (shared.keys.some(key => !Object.hasOwn(sharedMetadata?.props ?? {}, key) || Object.hasOwn(metadata.props ?? {}, key))) {
          throw new Error(`Invalid inherited property: ${entry.path}`);
        }
      }

      if (!metadata.signature?.startsWith(`_.${entry.title}(`) ||
        !entry.keywords.includes(`_.${entry.title}`) || entry.keywords.some(word => word.startsWith('JSswift.'))) {
        throw new Error(`Noncanonical application API: ${entry.path}; use _.${entry.title}`);
      }
      if (text.split('\n')[0] !== `# ${entry.title}` || (metadata.description ?? '') !== entry.summary) {
        throw new Error(`Stale component map: ${entry.path}; run npm run knowledge:refresh`);
      }
    }
  }
  const aliases = map.documentAliases ?? {};
  for (const [alias, target] of Object.entries(aliases)) {
    if (!alias.endsWith('.md') || !map.components.some(component => component.path === target)) {
      throw new Error('Invalid documentation alias');
    }
    await safePath(alias);
    await safePath(target);
  }
  const files = (await readdir(path.join(docsRoot, 'components'))).filter(name => name.endsWith('.md') && name !== 'README.md' && !Object.hasOwn(aliases, `components/${name}`));
  const indexed = new Set(map.components.map(component => component.path));
  if (files.length !== indexed.size || files.some(name => !indexed.has(`components/${name}`))) {
    throw new Error('Component map coverage mismatch; run npm run knowledge:refresh');
  }

  return {
    map,
    list: () => [...entries.values()].map(({ keywords, ...entry }) => entry),
    search(query, limit = 6) {
      if (typeof query !== 'string' || query.length > 500) throw new Error('Query must be a string of at most 500 characters');
      if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error('Limit must be from 1 to 20');
      const words = tokens(query);
      if (!words.length) return [];
      const ranked = [...entries.values()].map(entry => {
        const names = tokens(`${entry.id} ${entry.title}`);
        const keywords = tokens(entry.keywords.join(' '));
        const summary = tokens(entry.summary ?? '');
        const score = words.reduce((sum, word) => sum + (names.includes(word) ? 12 : keywords.includes(word) ? 6 : summary.includes(word) ? 1 : 0), 0);
        const { keywords: ignored, ...result } = entry;
        return { ...result, score };
      }).filter(entry => entry.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
      return ranked.slice(0, limit);
    },
    async read(id, selection = {}) {
      const entry = entries.get(id);
      if (!entry) throw new Error('Unknown document ID; use jsswift_search to find a documented ID');
      const text = await readFile(await safePath(entry.path), 'utf8');
      if (selection.keys && !selection.section) throw new Error('keys requires a section');
      if (!selection.section) return { id, path: entry.path, text };
      if (entry.kind !== 'component' || !['props', 'events', 'methods', 'slots'].includes(selection.section)) throw new Error('Select a component contract section');
      const metadata = JSON.parse(text.match(/```json\s*([\s\S]*?)```/)[1]);
      let values = { ...(metadata[selection.section] ?? {}) };
      if (selection.section === 'props' && metadata.commonProps) {
        const sharedText = await readFile(await safePath(metadata.commonProps.path), 'utf8');
        const shared = JSON.parse(sharedText.match(/```json\s*([\s\S]*?)```/)[1]);
        values = { ...Object.fromEntries(metadata.commonProps.keys.map(key => [key, shared.props[key]])), ...values };
      }
      if (selection.keys) {
        if (!Array.isArray(selection.keys) || !selection.keys.length || selection.keys.length > 30 || selection.keys.some(key => typeof key !== 'string' || !Object.hasOwn(values, key))) throw new Error('Unknown or invalid contract keys');
        values = Object.fromEntries(selection.keys.map(key => [key, values[key]]));
      }
      return { id, path: entry.path, section: selection.section, text: JSON.stringify({signature:metadata.signature, [selection.section]:values}, null, 2) };

    }
  };
}
