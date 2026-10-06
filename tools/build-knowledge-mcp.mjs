import { build } from 'esbuild';
import { mkdir, cp, chmod } from 'node:fs/promises';

await mkdir(new URL('../ai/mcp/dist/', import.meta.url), { recursive: true });
await build({
  entryPoints: [new URL('../ai/mcp/src/server.mjs', import.meta.url).pathname],
  outfile: new URL('../ai/mcp/dist/server.mjs', import.meta.url).pathname,
  bundle: true, platform: 'node', format: 'esm', target: 'node20', packages: 'external',
  banner: { js: '#!/usr/bin/env node' }
});
await chmod(new URL('../ai/mcp/dist/server.mjs', import.meta.url), 0o755);
await cp(new URL('../LICENSE', import.meta.url), new URL('../ai/mcp/dist/LICENSE', import.meta.url));
console.log('Standalone MCP built in ai/mcp/dist/server.mjs');
