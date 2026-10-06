# JSswift knowledge for application development

Start with [AI.md](AI.md), available through MCP as `guide:AI` and through the package export `jsswift/AI.md`. It covers a supported subset; read additional contracts only as needed. Shared property definitions are in [common props](ui/common-props.md).

The [knowledge map](knowledge-map.json), Skill, and local MCP all route to these application documents. Component files remain the exact API contracts. Component descriptions are not embedded in the UI runtime; use these files instead of looking for UI.meta registrations. Search results and keywords are discovery aids, not replacement APIs.

## Skill

The source Skill is [ai/skills/jsswift-app/SKILL.md](../ai/skills/jsswift-app/SKILL.md). To build a portable Skill with its indexed application documentation:

```sh
npm run knowledge:skill
```

Copy the generated `ai/dist/jsswift-app` folder into your agent's skills directory. The source Skill can also be used with this checkout available. The portable output includes a documentation snapshot: regenerate it when contracts change. It does not require MCP or an application-specific AGENTS.md.

## Project-aware MCP

The `jsswift` package build includes this application documentation and Knowledge Map in `dist/documentions`. The map records the framework version. A separate `@jsswift/knowledge-mcp` package reads these files from the application's installed `jsswift`, without loading its browser runtime. Requires Node.js 20+.

Bundled documentation is available starting with JSswift 1.0.44. Install `jsswift@^1.0.44` and configure the MCP client:

```json
{
  "mcpServers": {
    "jsswift": {
      "command": "npx",
      "args": ["-y", "--fetch-retries=0", "@jsswift/knowledge-mcp@latest"]
    }
  }
}
```

The client starts the server in the application directory. If it starts elsewhere, append `"--project", "/absolute/path/to/app"` to `args`. Package resolution follows Node's ancestor lookup and package symlinks, including hoisted installations. In a monorepo, choose the app with `--project`; each connection serves one app and its installed version. No automatic multi-app scanning is implemented.

The server uses the [official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) over stdio. The client launches it; no separately running terminal server or localhost URL is needed. Once dependencies are installed or cached, document reads work offline. Initial `npx` use needs a download.

- `jsswift_search({ query, limit? })`: ranked references, default 6 results, maximum 20.
- `jsswift_read({ id })`: one complete indexed guide or component contract.
- Both tool results include the project path and installed framework version.
- `jsswift://knowledge/map` and document resources expose the same installed contracts.

Example: search `form con validazione`, read `guide:ui/forms` and `guide:reactivity`, then read `component:form`, `component:input`, and `component:btn` before implementing those controls. No match means refine the search or inspect the index; do not invent an API.

The server only reads documentation, and rejects missing documentation or mismatched package/document versions. Reconnect after upgrading `jsswift`. Client configuration is not modified automatically.

## Testing before publication

From the JSswift source checkout:

```sh
npm ci --prefix ai/mcp
npm run test:knowledge
```

This builds both distributions and tests an MCP process reading framework documentation from extracted npm tarballs in a temporary app. To connect your own client before publication, use `node` with the absolute path to `ai/mcp/dist/server.mjs` and `--project /path/to/app` where the newly built framework package has been installed.

For documentation development in the source checkout, use `node` with the absolute path to `ai/mcp/src/server.mjs` and `--docs /absolute/path/to/JSswift/documentions`. This explicit development mode reports `development`, not an installed framework version.

## Keeping discovery current

```sh
npm run knowledge:check
npm run knowledge:refresh
npm run test:knowledge
```

`knowledge:check` verifies document references, component coverage, names, and metadata descriptions. `knowledge:refresh` rebuilds component entries from their Markdown metadata, preserving curated keywords and topic assignments. Maintain topic paths and keywords in `knowledge-map.json`; review routing when adding a new component, then regenerate the portable Skill. Restart the MCP after updating documentation so its map is reloaded.

For framework maintenance use [docDevelop/README.md](../docDevelop/README.md).
