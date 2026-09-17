# JSswift Core Reference

Operational reference for the JSswift core.

## Purpose

- document the structure of the core modules
- record the current technical contract of the runtime
- explain what is stable enough to build on
- define the maintenance workflow for `packages/core/src`

## Source Of Truth

- source modules: `packages/core/src`
- readable runtime: `packages/core/dist/cms.js`
- minified runtime: `packages/core/dist/min-cms.js`
- local compatibility mirror: `pages/_jsswift-fe/js/*`

Update rules:

- when a core module changes, update this document
- when AI or tooling-facing machine metadata changes, update `JSswift.meta` in `packages/core/src/00-bootstrap.js`
- rebuild the runtime with `npm run build:cms`
- run `npm test`

## Current Core Status

- renderer: milestone 3 closed
- reactive core: milestone 2 closed
- `rod`: milestone 2 closed
- lifecycle and mount cleanup: milestone 2 closed
- platform modules: milestone 2 closed
- automated core tests: active

Current product reading:

- the core is structurally usable
- the next steps are mostly product discipline, documentation, and targeted hardening
- the main release gate now lives in `docs/release/release-plan-v1.md`

## Core Areas

### 1. DOM Renderer

Primary surface:

- `createElement`
- `setProp`
- `bindProp`

Responsibilities:

- turn `props` into real DOM behavior
- normalize `class`
- apply `style`
- bind events
- mount and replace children

What the renderer supports:

- `class` as string, nested array, or object map
- `style` as object
- CSS custom properties through `style.setProperty(...)`
- DOM events via `onClick`, `onInput`, and `on:custom-event`
- direct DOM properties when the key exists on the element
- attribute fallback with `setAttribute`
- reactive props through functions
- reactive props through `rod`
- text, arrays, DOM nodes, reactive children, and function children

Value semantics:

- `null` and `undefined` remove an attribute or reset the property when appropriate
- `false` removes normal attributes and disables boolean DOM properties
- `true` enables boolean DOM properties
- `class: null | false | ""` removes classes
- `style: null | false` removes the `style` attribute

Renderer status:

- dynamic `style`, events, children, and special prop keys are covered by the current milestone
- cleanup behavior on node replacement and unmount is substantially better than the original baseline
- event composition works at a basic level

Known limits:

- no advanced listener delegation
- no advanced diffing for multiple listeners
- renderer testing is still lighter than a full browser matrix

### 2. Reactive Core

Primary surface:

- `JSswift.reactive.signal`
- `JSswift.reactive.effect`
- `JSswift.reactive.computed`
- `JSswift.reactive.untracked`
- `JSswift.reactive.batch`

Contract:

- `signal(initial)` returns `[get, set, dispose]`
- `effect(fn)` reruns when tracked dependencies change
- `computed(fn)` derives cached reactive values
- `untracked(fn)` reads without subscribing
- `batch(fn, opts?)` groups updates and can defer flush to a microtask

Current behavior:

- nested effects are tracked with a real stack
- old dependencies are cleaned before collecting new ones
- loop guard exists for synchronous rerun storms
- batch flush can be synchronous or microtask-based

Known limits:

- loop protection is first-level only
- there is no advanced scheduler beyond current batch flush modes
- async transaction primitives are still intentionally minimal

### 3. `rod`

Primary surface:

- `_.rod`
- `JSswift.rodBind`
- `JSswift.rodModel`
- `JSswift.rodFromSignal`

Role:

- ergonomic binding and model layer on top of the renderer and reactive core
- useful for interpolated text, form controls, and app-level reactive wiring

Current status:

- aligned with the shared DOM bridge
- special-key behavior is more consistent
- two-way behavior on form controls is much more reliable than the original baseline

Known limits:

- public messaging still needs to keep `rod` distinct from `reactive`
- advanced model edge cases still exist outside the main covered flows

### 4. Lifecycle, Mount, Cleanup

Primary surface:

- `JSswift.mount`
- `JSswift.component`
- cleanup registry
- auto-cleanup helpers

Responsibilities:

- mount trees into the DOM
- track component disposal
- clean up effects, listeners, and subtree-level resources

Current status:

- cleanup paths are materially improved
- `mount(..., { clear: true })` and `unmount()` now route through cleanup-aware code
- component disposal hooks are usable and coherent enough for real app work

Known limits:

- lifecycle examples are still lighter than the full runtime surface
- clone and multi-mount semantics should stay conservative

### 5. Platform Modules

This group includes:

- overlay
- store
- auth
- http
- router
- theme helper
- `JSswift.ui.meta`

Current status:

- platform milestone 2 is closed
- internal helpers were extracted per module
- the modules are far more maintainable than the original single-file baseline

Module notes:

- `store`: scope, persistence, and watcher behavior are substantially cleaner
- `router`: path, query, and history helpers are better isolated
- `http`: request normalization and state surface are clearer
- `setTheme`: sets `data-theme` on the root `html` element through `JSswift.setTheme(theme)`
- `getTheme`: reads the active theme from the root element with storage fallback
- `toggleTheme`: cycles through a provided or configured theme list and persists the result
- `overlay`: anchored and stacked behavior is more stable
- `auth`: permission and route-protection behavior is workable, though still sensitive
- `ui.meta`: machine-readable UI metadata is available, but still not a stable public contract

Theme helper contract:

- `JSswift.setTheme(theme)` finds the root `html` element, sets `data-theme="<theme>"`, and persists the value in `localStorage`
- `JSswift.getTheme()` reads the current `html[data-theme]`; if missing, it falls back to the saved theme and syncs the DOM
- `JSswift.toggleTheme(themes)` cycles through a theme list; the list can contain any number of themes
- returns the `html` element when available, otherwise `null`
- `JSswift.theme.themes` can hold the default cycle order for `toggleTheme()`
- default storage key: `jsswift:theme`
- on startup, the core restores the saved theme automatically if present
- intended for simple runtime theme switching without introducing extra framework state manager

Example:

```js
JSswift.setTheme("dark");
JSswift.getTheme();
JSswift.toggleTheme(["light", "dark", "sepia"]);
```

Known limits:

- most platform modules still need broader standalone demo coverage
- some modules are validated mainly through the aggregate platform demo rather than isolated suites

## Current Stability Reading

Safe foundations for most application work:

- renderer core
- reactive primitives
- lifecycle base
- base `rod`
- official runtime outputs

Still best treated carefully:

- advanced overlays
- date/time surfaces
- public consumption of `UI.meta` and dev helpers

## Maintenance Workflow

When changing the core:

1. edit `packages/core/src/*`
2. rebuild with `npm run build:cms`
3. run `npm test`
4. update this document if the technical contract changed
5. update `JSswift.meta` when tooling-visible machine metadata changed

## Build And Test Commands

Build:

```bash
npm run build:cms
```

Tests:

```bash
npm test
```

## Historical Notes

Important core milestones reached during the current package-oriented phase:

- core separated into internal modules under `packages/core/src/*`
- initial `JSswift.meta` established for tooling-facing introspection
- renderer semantics hardened around class, style, events, and dynamic children
- reactive core gained `batch(...)`, `untracked`, and stronger cleanup behavior
- `rod` realigned around shared DOM semantics
- lifecycle helpers moved into clearer internal modules
- platform modules were split and cleaned up

This document intentionally focuses on the current contract rather than preserving every intermediate milestone note. Historical release details remain in:

- `docs/release/release-plan-v1.md`
- `docs/release/release-notes-v1.0.0.md`
- `docs/release/release-notes-v1.0.1.md`
