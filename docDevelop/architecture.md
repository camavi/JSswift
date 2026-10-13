# Architecture and source of truth

## Core

- Source: packages/core/src
- Module order: packages/core/src/modules.json
- Build: npm run build:cms
- Outputs: packages/core/dist and pages/_jsswift-fe/js

Core owns rendering, reactivity, rod, lifecycle, overlay, store, auth, HTTP, router, themes, and shared UI metadata.

## UI

- Source: packages/ui/src
- Module order: packages/ui/src/modules.json
- Build: npm run build:ui
- Outputs: packages/ui/dist and pages/_jsswift-fe

Extracted component JS lives in `packages/ui/src/components`, shared helpers in `packages/ui/src/helpers`, and component CSS sections in `packages/ui/src/css/components`. `modules.json.components` registers every component’s assets, aliases and AST-derived dependency/helper inventory; `services` and `styles` register services/shared CSS; `cssOwnership` drives selective pruning; `buildOrder` preserves lexical initialization. Source-only CSS imports are expanded at their original position during the CSS build. Every UI component has an individual implementation file, all component CSS is extracted, and shared CSS lives in `css/shared`; service implementations live in `services`. Row/Col retain generated utility styling. Full and selective runtimes continue to use the same source/dependency resolver.

UI owns components, responsive behavior, forms, navigation, feedback, shells, overlays, and component implementations. Component contracts live separately in documentions/components.

## Website and package

- Website source: pages; production build: npm run build
- Umbrella package: packages/jsswift; build: npm run build:jsswift

Never edit generated dist directories directly; regenerate them.
