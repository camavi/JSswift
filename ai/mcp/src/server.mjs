import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { loadKnowledge } from '../../knowledge.mjs';
import { parseArgs, resolveProject } from './project.mjs';

const options = parseArgs(process.argv.slice(2));
const context = options.docs ? { project: options.project, version: 'development', docsRoot: options.docs } : await resolveProject(options.project);
const knowledge = await loadKnowledge(context.docsRoot);
const server = new McpServer({ name: 'jsswift-knowledge', version: '0.1.2' }, {
  instructions: `Serving JSswift ${context.version} from project ${context.project}. Prefer _.Button for buttons. Use _.Component; prefer _.rod for bidirectional field models and _.useForm for structured forms. Signals remain supported for getter/setter state. Start with guide:AI for a basic page and its supported examples. Search and read component contracts only for additional APIs; read guide:ui/common-props once when styling. JSswift includes component CSS; read application-rules and prefer documented styling props and theme variables before custom overrides. Fonts and the Tabler catalog are optional; read getting-started for imports. This server covers application development only.`
});
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const jsonResult = value => ({ content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value });

server.registerTool('jsswift_search', {
  title: 'Find JSswift application documentation',
  description: 'Find focused guides and component contracts by feature, API name, or Italian/English keywords. Returns document IDs and paths. Read matching documents with jsswift_read before using APIs; no results means no indexed match, not permission to invent an API.',
  inputSchema: z.object({ query: z.string().trim().min(1).max(500), limit: z.number().int().min(1).max(20).default(6) }),
  annotations
}, async ({ query, limit }) => jsonResult({ project: context.project, version: context.version, results: knowledge.search(query, limit) }));

server.registerTool('jsswift_read', {
  title: 'Read a JSswift guide or exact component contract',
  description: 'Read an indexed document, or only a component section and named keys. Prefer section/keys for missing APIs; inherited props are resolved. Does not accept filesystem paths.',
  inputSchema: z.object({ id: z.string().min(1).max(200), section: z.enum(['props','events','methods','slots']).optional(), keys: z.array(z.string().min(1).max(100)).min(1).max(30).optional() }),
  annotations
}, async ({ id, section, keys }) => {
  try { return jsonResult({ project: context.project, version: context.version, ...await knowledge.read(id, {section, keys}) }); }
  catch { return { isError: true, content: [{ type: 'text', text: 'Document, section or keys unavailable. Use jsswift_search to select a document; omit section/keys for the full contract.' }] }; }
});

server.registerResource('knowledge-map', 'jsswift://knowledge/map', {
  title: 'JSswift application knowledge map', mimeType: 'application/json'
}, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(knowledge.map) }] }));

for (const document of knowledge.list()) {
  server.registerResource(document.id, `jsswift://docs/${encodeURIComponent(document.id)}`, {
    title: document.title, description: document.summary ?? document.path, mimeType: 'text/markdown'
  }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: (await knowledge.read(document.id)).text }] }));
}

await server.connect(new StdioServerTransport());
