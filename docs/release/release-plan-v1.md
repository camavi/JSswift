# JSswift v1 Pre-release Checklist

Historical note:

- this document describes the original gate toward `v1.0.0`
- the first actual npm publish for this repository was `v1.0.1`
- keep this file as a historical checklist and as a base for future release gates

This document records the minimum release discipline required before calling JSswift a `v1` product.

## Goals

- separate real release blockers from nice-to-have work
- mark unstable areas clearly
- freeze critical surfaces before release
- keep the release decision technical and explicit

## Practical Rule

- if an item is `BLOCKER`, `v1` does not ship
- if an item is `UNSTABLE`, it ships only when labeled clearly
- if an item is `FROZEN`, touch it only for real bugs or regressions

## Historical Snapshot

Reference state at the time of the first public release cycle:

- public README: present
- stability and compatibility policy: present
- LICENSE: present
- original target version: `1.0.0`
- first actual published version: `1.0.1`
- changelog and release notes: present
- runtime build: green
- core automated tests: green
- browser smoke release pass: recorded
- stable vs unstable decision for advanced UI areas: closed

## 1. Blockers

### 1.1 Public Positioning And Contract

Status: `PARTIAL`

What had to be clear before release:

- what JSswift is
- who it is for
- what the core covers
- what the UI layer covers
- what is officially supported
- what is explicitly outside the support contract

Required artifacts:

- a product-facing `README`
- a `Quick start` section
- a `Stable API surface` section
- a `Known limits` section

Historical closure:

- initial public `README.md` was created
- core installation and runtime entry points were documented

### 1.2 Versioning And Compatibility Policy

Status: `PARTIAL`

What had to be decided:

- what counts as breaking
- what `v1` promises
- whether meta and UI helper surfaces are stable
- how `rod` and `reactive` are positioned publicly

Required artifacts:

- semver policy
- breaking-change policy
- deprecation policy

Historical closure:

- baseline policy landed in `docs/policy/stability.md`
- stable vs unstable boundaries were fixed for the initial baseline

### 1.3 Browser Release Smoke

Status: `READY`

Required before release:

- a minimum manual smoke pass on key demos
- verification of `cms.js`, `min-cms.js`, `ui.js`, and `min-ui.js`
- verification of main demo routes
- verification of overlays, router, form, table, and layout flows

Historical closure:

- smoke checklist created in `docs/release/smoke-v1.md`
- local HTTP preflight was executed outside sandbox
- manual browser smoke was recorded as passed

### 1.4 Production Entry Points

Status: `READY`

Official entry points had to be explicit:

- `packages/core/dist/cms.js`
- `packages/core/dist/min-cms.js`
- `packages/ui/dist/ui.js`
- `packages/ui/dist/min-ui.js`
- `packages/jsswift/dist/jsswift.js`
- `packages/jsswift/dist/min-jsswift.js`

Required before release:

- document which file to use in development
- document which file to use in production
- document whether minified bundles are the recommended default

Historical closure:

- runtime entry points were documented in `README.md`
- standard and minified outputs were aligned

### 1.5 License And Publish Metadata

Status: `PARTIAL`

Required before release:

- `LICENSE`
- clear ownership metadata
- official release version
- initial changelog or release notes

Historical closure:

- `LICENSE` added as `MIT`
- authorship documented as `Carlos Malleux`
- baseline release notes added for `v1.0.0`
- changelog initialized

## 2. Unstable Areas

These areas can ship only when explicitly labeled.

### 2.1 Advanced Overlays

Status: `UNSTABLE`

Components:

- `Tooltip`
- `Dialog`
- `Menu`
- `Popover`
- `ContextMenu`

Why:

- large interactive surface
- anchor logic, focus behavior, closing rules, and runtime overrides are sensitive areas

Recommended handling:

- promote to `stable` only after dedicated smoke coverage
- otherwise keep them `experimental` or `unstable`

### 2.2 Date / Time

Status: `UNSTABLE`

Why:

- many natural edge cases
- parsing, UX, keyboard behavior, and confirmation flows are easy to regress

Recommended handling:

- do not promise full `v1` stability

### 2.3 `rod` vs `reactive`

Status: `UNSTABLE` in public messaging

Why:

- both work technically
- product messaging can still confuse them as equivalent instead of complementary

Recommended handling:

- choose one primary narrative model
- describe the other as an advanced or adjacent layer

### 2.4 UI Meta / Dev Helpers

Status: `UNSTABLE`

Why:

- highly useful internally and for tooling
- not appropriate as stable public contract yet

Recommended handling:

- mark `UI.meta`, inspect helpers, and doc helpers as `dev-only` or `subject to change`

## 3. Frozen Areas

These areas should stay frozen until release, except for real bug fixes.

### 3.1 Core Renderer

Status: `FROZEN`

Do not change casually:

- `props -> DOM` bridge
- `class` semantics
- `style` semantics
- dynamic children behavior
- event binding

Reason:

- this is the foundation of the framework
- broad refactors here carry cross-cutting regression risk

### 3.2 Reactive Core

Status: `FROZEN`

Do not change casually:

- `signal`
- `effect`
- `computed`
- `untracked`
- `batch`

Reason:

- this contract feeds renderer, `rod`, and store behavior

### 3.3 Rod Bridge

Status: `FROZEN`

Do not change casually:

- `rodBind`
- `rodModel`
- `rodFromSignal`
- form-control binding behavior

Reason:

- this area had already closed several real edge cases
- it needed stabilization more than reinvention

### 3.4 Build Outputs

Status: `FROZEN`

Do not change casually:

- `build:cms`
- `build:ui`
- runtime output names
- publish paths

Reason:

- release pipelines must be reliable, not creative

## 4. Minimum Checklist

This is the minimum bar before saying “ship v1”.

- public README exists
- stability policy exists
- LICENSE exists
- changelog and release notes exist
- runtime build passes
- standard and minified outputs are verified
- core automated tests pass
- browser smoke passes
- frozen areas are not under active refactor
- unstable areas are labeled honestly

## 5. What Was Intentionally Left Out Of v1

The following were not required to block the first public package release:

- advanced design system polish
- perfect documentation parity for every UI component
- promotion of all overlays to stable
- promotion of meta/devtools as public stable API

## 6. Final Historical Assessment

At the time of the original gate:

- the framework no longer needed a structural rewrite
- the remaining work was product-contract and release-discipline work
- the real publication baseline ultimately landed as `v1.0.1`
