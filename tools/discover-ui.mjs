import fs from 'node:fs/promises';
import path from 'node:path';
import { transform } from 'esbuild';
import { parseAst } from 'rolldown/parseAst';
import { componentNames, member, walk } from './select-ui.mjs';

const excluded = new Set(['node_modules', 'dist', 'dist-runtime', 'coverage', '.git']);
const extensions = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.html']);

export function discoverySource(file, roots) {
  return extensions.has(path.extname(file)) && roots.some(root => {
    const relative = path.relative(root, file);
    return file === root || (!relative.startsWith('..') && !path.isAbsolute(relative) && relative.split(path.sep).every(part => !part.startsWith('.') && !excluded.has(part)));
  });
}

export async function discoverUI(config, projectRoot, sourceRoot, excludedPaths = []) {
  if (!config.ui.auto) return { files: [], roots: [], components: [], services: [] };
  const roots = (config.ui.auto === true ? ['.'] : config.ui.auto).map(file => path.resolve(projectRoot, file));
  const files = [];
  async function collect(file) {
    if (excludedPaths.some(excluded => file === excluded || file.startsWith(excluded + path.sep))) return;
    const stat = await fs.lstat(file);
    if (stat.isSymbolicLink()) return;
    if (stat.isDirectory()) {
      for (const entry of (await fs.readdir(file)).sort()) {
        if (entry.startsWith('.') || excluded.has(entry)) continue;
        await collect(path.join(file, entry));
      }
    } else if (extensions.has(path.extname(file))) files.push(file);
  }
  for (const root of roots) await collect(root);
  const names = await componentNames(sourceRoot);
  const components = new Set();
  const services = new Set();
  const serviceNames = { dialog: 'Dialog', notify: 'Notify', loading: 'Loading', useForm: 'Form' };
  for (const file of [...new Set(files)]) {
    const source = await fs.readFile(file, 'utf8');
    const extension = path.extname(file);
    const snippets = extension === '.html'
      ? [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
        .filter(match => !/\bsrc\s*=/i.test(match[1]) && (!/\btype\s*=/i.test(match[1]) || /\btype\s*=\s*["'](?:module|text\/javascript|application\/javascript)["']/i.test(match[1])))
        .map(match => match[2])
      : [source];
    try {
      for (const snippet of snippets) {
        const loader = extension === '.tsx' ? 'tsx' : extension === '.ts' ? 'ts' : extension === '.jsx' ? 'jsx' : 'js';
        const { code } = await transform(snippet, { loader, sourcefile: file, target: 'esnext', treeShaking: false });
        walk(parseAst(code), node => {
          if (node.type !== 'MemberExpression') return;
          const access = member(node);
          const match = /^(?:_|JSswift\.ui)\.([^.]+)/.exec(access ?? '');
          if (match && names.has(match[1])) components.add(match[1]);
          const service = /^(?:_|JSswift)\.([^.]+)/.exec(access ?? '');
          if (service && serviceNames[service[1]]) services.add(serviceNames[service[1]]);
        });
      }
    } catch (error) { throw new Error(`UI discovery failed in ${file}: ${error.message}`); }
  }
  return { files: [...new Set(files)], roots, components: [...components].sort(), services: [...services].sort() };
}

export async function resolveDiscovery(config, projectRoot, sourceRoot, excludedPaths = []) {
  const discovery = await discoverUI(config, projectRoot, sourceRoot, excludedPaths);
  config.ui.components = [...new Set([...config.ui.components, ...discovery.components])];
  config.ui.services = [...new Set([...config.ui.services, ...discovery.services])];
  return discovery;
}
