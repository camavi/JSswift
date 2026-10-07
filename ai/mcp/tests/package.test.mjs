import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { resolveProject, parseArgs } from '../src/project.mjs';

const run = promisify(execFile);
const checkout = fileURLToPath(new URL('../../../', import.meta.url));

test('packed MCP reads only the installed framework documentation and reports its version', { timeout: 30000 }, async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'jsswift-packages-'));
  const client = new Client({ name: 'package-test', version: '1.0.0' });
  try {
    const app = path.join(temp, 'app');
    const framework = path.join(app, 'node_modules/jsswift');
    const mcp = path.join(temp, 'mcp');
    for (const [source, target] of [['packages/jsswift', framework], ['ai/mcp', mcp]]) {
      const { stdout } = await run('npm', ['pack', `./${source}`, '--ignore-scripts', '--json', '--cache', path.join(temp, 'npm-cache'), '--pack-destination', temp], { cwd: checkout });
      const [packed] = JSON.parse(stdout);
      await mkdir(target, { recursive: true });
      await run('tar', ['-xzf', path.join(temp, packed.filename), '--strip-components=1', '-C', target]);
    }
    // Dependencies are shared; code and documentation must come from the tarballs.
    await symlink(path.join(checkout, 'ai/mcp/node_modules'), path.join(mcp, 'node_modules'));
    const manifest = JSON.parse(await readFile(path.join(framework, 'package.json'), 'utf8'));
    const shortGuide = await readFile(path.join(framework, manifest.jsswiftDocumentation.start), 'utf8');
    assert.equal(shortGuide, await readFile(path.join(framework, 'dist/documentions/AI.md'), 'utf8'));
    assert.match(await readFile(path.join(framework, 'README.md'), 'utf8'), /AI\.md/);
    const discoveryMap = JSON.parse(await readFile(path.join(framework, manifest.jsswiftDocumentation.map), 'utf8'));
    assert.equal(discoveryMap.entrypoint, 'AI.md');
    const mcpManifest = JSON.parse(await readFile(path.join(mcp, 'package.json'), 'utf8'));
    assert.equal(mcpManifest.bin['jsswift-mcp'], 'dist/server.mjs');
    const nested = path.join(app, 'src/screens');
    await mkdir(nested, { recursive: true });
    assert.equal((await resolveProject(nested)).version, manifest.version);
    await client.connect(new StdioClientTransport({
      command: process.execPath, args: [path.join(mcp, 'dist/server.mjs'), '--project', app], cwd: temp
    }));
    const result = await client.callTool({ name: 'jsswift_search', arguments: { query: '_.Toggle' } });
    assert.equal(result.structuredContent.version, manifest.version);
    assert.equal(result.structuredContent.results[0].id, 'component:toggle');
    const doc = await client.callTool({ name: 'jsswift_read', arguments: { id: 'guide:reactivity' } });
    assert.match(doc.structuredContent.text, /_\.signal\(initial\)/);
    assert.equal(doc.structuredContent.version, manifest.version);
    await assert.rejects(resolveProject(temp), /No JSswift package/);
    const mapFile = path.join(framework, 'dist/documentions/knowledge-map.json');
    const map = JSON.parse(await readFile(mapFile, 'utf8'));
    map.packageVersion = '0.0.0';
    await writeFile(mapFile, JSON.stringify(map));
    await assert.rejects(resolveProject(app), /does not match/);
    assert.throws(() => parseArgs(['--project']), /Usage/);
  } finally { await client.close(); await rm(temp, { recursive: true, force: true }); }
});
