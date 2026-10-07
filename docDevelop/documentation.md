# Maintaining documentation

The documentions folder is optimized for selective reading. AI.md is the short supported entrypoint; keep its examples verified against the runtime. Shared exact property definitions live in ui/common-props.md, and component JSON inherits only names listed in commonProps.keys. Retain component-specific overrides and all additional API contracts. Keep its index current, document exact component contracts in documentions/components/<component>.md, and never recreate a monolithic catalog.

Application documentation and AI-generated app code use `_` as the single public namespace: `_.Toggle`, `_.signal`, `_.mount`, and `_.http.getJSON`. Present component metadata signatures and examples with this application alias; implementation source may spell the same component `UI.Toggle` internally. Preserve props, slots, events, and methods when normalizing the namespace.

Use `_.Button` as the standard application button name. `_.Btn` remains compatible; keep the existing `components/btn.md` path and `component:btn` discovery ID stable, with `Button` as the documented name.

When a public component contract changes, update its split component document against the implementation source. Update reference/core.md or reference/ui.md for framework-level contracts. The component files in documentions/components are the documentation source for props, slots, events, and methods; runtime bundles do not register component metadata. Keep knowledge-map.json synchronized and verify contracts against implementation and tests.

Application AI discovery uses `documentions/knowledge-map.json`. After changing component documentation, run `npm run knowledge:refresh` and review keywords and topics, then `npm run knowledge:check` and `npm run test:knowledge` (install MCP dependencies with `npm ci --prefix ai/mcp` first). Regenerate the portable Skill with `npm run knowledge:skill`. Do not copy API contracts into handwritten Skill instructions or MCP handlers. Setup is documented in `documentions/ai-development.md`.

`build:jsswift` bundles application documents under `dist/documentions` and stamps the map with the package version. Public exports expose `jsswift/knowledge-map.json` and `jsswift/package.json` for project resolution. The separate MCP builds a self-contained server entrypoint with external SDK dependencies; it resolves the installed app package, not checkout documentation, unless `--docs` is explicitly supplied. Package integration tests require both builds and verify tarball contents, project resolution, and version mismatch rejection.

The umbrella npm package includes a short root README and a generated root AI.md copied from documentions/AI.md. Maintain the guide at its source, never the generated copy. package.json jsswiftDocumentation exposes installed discovery paths; the map entrypoint is AI.md. Packed-package tests verify guide equality and discoverability.
