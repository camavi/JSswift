# JSswift 1.0.44 and knowledge MCP 0.1.0

Application documentation and the Knowledge Map now ship with the `jsswift` package. The map identifies the installed framework version; agents read its contracts through the separate `@jsswift/knowledge-mcp` server.

Application examples consistently use `_`, direct reactive primitives (`_.signal`, `_.effect`, `_.computed`, `_.untracked`, `_.batch`), and the preferred button name `_.Button`. Existing aliases remain available.

## Install and configure

```sh
npm install jsswift@^1.0.44
```

For Codex, configure `~/.codex/config.toml`:

```toml
[mcp_servers.jsswift]
command = "npx"
args = ["-y", "--fetch-retries=0", "@jsswift/knowledge-mcp@0.1.0", "--project", "/absolute/path/to/app"]
```

Clients accepting MCP JSON can use:

```json
{
  "mcpServers": {
    "jsswift": {
      "command": "npx",
      "args": ["-y", "--fetch-retries=0", "@jsswift/knowledge-mcp@0.1.0", "--project", "/absolute/path/to/app"]
    }
  }
}
```

Requires Node.js 20+. Each connection serves one app. The server reads installed documentation without executing browser code and rejects missing documents or mismatched versions. Initial npx use downloads dependencies; cached or locally installed dependencies support offline documentation reads.

## Verification

- Runtime and production builds completed.
- 58 project tests and 10 browser tests passed.
- Knowledge validation, source MCP integration, and extracted npm package integration passed.
- Framework tarball includes 71 documentation files; MCP tarball contains the standalone executable and its license.
- Portable Skill rebuilt; package contents and whitespace reviewed.

The scoped runtime packages `@jsswift/core` and `@jsswift/ui` remain aligned at 1.0.44. Older npm framework versions without bundled documentation cannot supply the documents to this MCP.
