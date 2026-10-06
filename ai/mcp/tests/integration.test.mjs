import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

test('stdio client discovers, searches and reads application contracts', { timeout: 15000 }, async () => {
  const client = new Client({ name: 'jsswift-test', version: '1.0.0' });
  try {
    await client.connect(new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL('../src/server.mjs', import.meta.url)), '--docs', fileURLToPath(new URL('../../../documentions/', import.meta.url))],
      cwd: '/tmp'
    }));
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(tool => tool.name).sort(), ['jsswift_read', 'jsswift_search']);
    assert.ok(tools.every(tool => tool.annotations.readOnlyHint));
    const search = await client.callTool({ name: 'jsswift_search', arguments: { query: '_.Input' } });
    assert.equal(search.structuredContent.results[0].id, 'component:input');
    const doc = await client.callTool({ name: 'jsswift_read', arguments: { id: 'component:input' } });
    assert.match(doc.structuredContent.text, /"signature": "_.Input\(props\)"/);
    const invalid = await client.callTool({ name: 'jsswift_read', arguments: { id: '../../../package.json' } });
    assert.equal(invalid.isError, true);
    const invalidQuery = await client.callTool({ name: 'jsswift_search', arguments: { query: 'form', limit: 1000 } });
    assert.equal(invalidQuery.isError, true);
    const { resources } = await client.listResources();
    const input = resources.find(resource => resource.name === 'component:input');
    assert.ok(input);
    const resource = await client.readResource({ uri: input.uri });
    assert.equal(resource.contents[0].text, doc.structuredContent.text);
    const map = await client.readResource({ uri: 'jsswift://knowledge/map' });
    assert.equal(JSON.parse(map.contents[0].text).scope, 'application-development');
  } finally { await client.close(); }
});
