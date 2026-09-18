# Build and test

Run the smallest relevant verification set.

- npm run build:cms
- npm run build:ui
- npm run build:jsswift
- npm run build:runtime
- npm run build
- npm test
- npm run test:browser

Run npm test for every core or UI behavior change. Run browser tests for responsive, layout, overlay, or real-DOM behavior. If the environment prevents tests from starting, report it separately from test failures. Before handoff run git diff --check and update public contracts when needed.
