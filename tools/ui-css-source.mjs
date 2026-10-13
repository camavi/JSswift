import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

// Source-only imports are expanded in place, preserving the established cascade
// and exact bytes. Generated CSS never exposes these internal imports.
export function readCSSSource(filename, stack = []) {
  const file = path.resolve(filename);
  if (stack.includes(file)) throw new Error(`UI CSS import cycle: ${[...stack, file].join(' -> ')}`);
  const source = fs.readFileSync(file, 'utf8');
  const imports = [];
  postcss.parse(source, { from: file }).walkAtRules('import', node => {
    const match = /^(["'])(\.\.?\/[^"']+)\1$/.exec(node.params);
    if (!match || node.parent.type !== 'root') throw new Error(`Unsupported UI CSS source import in ${file}: ${node.params}`);
    imports.push({ start: node.source.start.offset, end: node.source.end.offset,
      text: readCSSSource(path.resolve(path.dirname(file), match[2]), [...stack, file]) });
  });
  let result = source;
  for (const { start, end, text } of imports.reverse()) result = result.slice(0, start) + text + result.slice(end);
  return result;
}
