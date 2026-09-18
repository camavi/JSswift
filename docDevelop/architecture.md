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

UI owns components, responsive behavior, forms, navigation, feedback, shells, overlays, and JSswift.ui.meta contracts.

## Website and package

- Website source: pages; production build: npm run build
- Umbrella package: packages/jsswift; build: npm run build:jsswift

Never edit generated dist directories directly; regenerate them.
