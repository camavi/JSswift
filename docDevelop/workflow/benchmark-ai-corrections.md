# Benchmark-driven AI setup and CRUD corrections

- New Vite apps now start with explicit selective jss.config.js, the Vite plugin and jss:runtime in AI.md. Existing imports remain supported. Selection does not infer application calls automatically.
- The executable CRUD example disposes the eight caller-owned editor rods on close, capturing ownership per opening. Shared models are preserved. It allocates the first free positive ID rather than overflowing a stored maximum safe ID.
- Table adds opt-in embedded:true for application-owned panels: removes outer/inner frames and body padding while preserving scrolling and row separators. Default appearance is unchanged.
- Verified: 72 unit/integration tests, 4 knowledge and 2 MCP tests. Browser suite: 25 unaffected checks passed; corrected CRUD check passed on rerun, including repeated cleanup, safe IDs and existing interactions. Production build passes with existing classic-script warnings.
- The initial package test required access to the npm cache; Chrome rerun required DevTools access outside the sandbox. These are environment restrictions, not application failures.
- Benchmark artifacts were not modified. No new performance, token-saving or package-weight claims are made without another controlled run. Release prepared: jsswift 2.1.1, @jsswift/ui 2.0.2 and @jsswift/knowledge-mcp 0.1.14. Core stays at 2.0.1.
