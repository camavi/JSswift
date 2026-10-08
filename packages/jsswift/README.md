# JSswift

**First read only [AI.md](AI.md), in a separate read operation.** It covers imports, rod field models, Input, Select, Button, Card, Table and Dialog. Implement its supported examples before opening additional contracts.

For an API absent from that guide, use [knowledge-map.json](dist/documentions/knowledge-map.json) to locate the exact document. Read only the relevant contract; avoid concatenating the component catalog or searching runtime bundles for documentation.

Import `jsswift` and `jsswift/css/ui-light.css`; add `jsswift/css/responsive.css` when using breakpoint props. `ui.css` remains the complete alternative. Component CSS is included; fonts and Tabler are optional. The read-only `@jsswift/knowledge-mcp` is an optional discovery interface when configured in your AI client.

For configured builds, see [configured-runtime.md](dist/documentions/configured-runtime.md). Import `jssRuntime` from `jsswift/vite` in Vite config and `jss:runtime` in the application entry. Or use `npx jss-build` to generate standalone assets. Set `ui.all: true` for the complete UI, or list components/services for a selective build. Tooling requires Node.js 20.19.x or >=22.12.0; Vite is optional for standalone builds.
