# Build and test

Run the smallest relevant verification set.

- npm run ui:registry:check (after changing UI source dependencies/exports; refresh derived lists with npm run ui:registry:refresh)
- npm run build:cms
- npm run build:ui
- npm run build:jsswift
- npm run build:runtime
- npm run build
- npm test
- npm run test:browser

Run npm test for every core or UI behavior change. Run browser tests for responsive, layout, overlay, or real-DOM behavior. If the environment prevents tests from starting, report it separately from test failures. Before handoff run git diff --check and update public contracts when needed.


The package-build integration starts a real Vite dev server from the installed tarball and checks runtime/CSS HTTP responses and discovery updates, including external empty roots. Use `JSS_TEST_VITE_PATH=/absolute/path/to/node_modules/vite` to verify another locked consumer Vite version without changing dependencies. Browser CRUD regressions use Chrome CDP with real Tab/Shift+Tab and Escape input; they cover ownership disposal calls, not a heap-leak audit.
