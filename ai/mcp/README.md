# JSswift knowledge MCP

Read the documentation of the `jsswift` package installed in your application. Requires Node.js 20+ and a JSswift release containing bundled documentation. No browser runtime is executed.

Requires JSswift 1.0.44 or newer for bundled documentation. Configure an MCP stdio client with:

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

The client must start the server in the app directory. Otherwise append `--project`, `/absolute/path/to/app` to `args`. Node package resolution supports ancestor node_modules, hoisted dependencies and package symlinks; for a monorepo with different app versions, point to the desired app. Each server connection serves one app.

Search with `jsswift_search`, then read the returned IDs with `jsswift_read`. Both tools report the installed framework version. Resources expose the shared map and all indexed documents. Application APIs use `_.Toggle`, `_.signal`, `_.effect`, `_.computed`, `_.untracked`, and `_.batch`.

Once the MCP package and its dependencies are cached or installed locally, documentation reads work offline. Initial `npx` execution requires downloading the package. Reconnect after upgrading JSswift. Missing documentation and version mismatches cause startup errors instead of silently using another release's documentation.

For framework documentation development only, use `--docs /path/to/JSswift/documentions`; responses explicitly report `development` rather than an installed release.
