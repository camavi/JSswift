# JSswift Stability And Compatibility Policy

This policy defines how JSswift handles:

- API stability
- cross-version compatibility
- breaking changes
- deprecations

Goal:

- provide a clear contract around `v1`
- remove ambiguity between stable, unstable, experimental, and dev-only APIs

## 1. Versioning

JSswift follows `SemVer`:

- `MAJOR.MINOR.PATCH`

Rules:

- `PATCH`: bug fixes, internal cleanup, and improvements that do not change the public contract
- `MINOR`: backward-compatible features, optional props, new components, or additive APIs
- `MAJOR`: breaking changes to the stable public surface

Examples:

- renderer fix without public API changes: `PATCH`
- adding a new UI component: `MINOR`
- renaming or removing a stable prop: `MAJOR`

## 2. API Classes

JSswift uses four API classes.

### 2.1 Stable

These APIs can be used in production with normal semver expectations.

Rules:

- behavior and signatures do not break in `PATCH` or `MINOR`
- every breaking change requires a `MAJOR`

Currently included here, unless explicitly noted otherwise:

- core renderer
- reactive core
- base lifecycle helpers
- base `rod`
- consolidated primary UI components
- official runtime outputs

### 2.2 Unstable

These APIs exist and can be used, but they do not yet promise a fully stable contract.

Rules:

- they may still change in `MINOR`
- every change must still be documented
- they should not be used as hard contractual foundations unless downstream users accept churn

Currently included here:

- advanced overlays
- `Date`
- `Time`
- areas where the public contract is still not fully fixed

Current `v1` policy:

- `Tooltip`, `Dialog`, `Menu`, `Popover`, and `ContextMenu` remain `unstable`
- `Date` and `Time` remain `unstable`

### 2.3 Experimental

These APIs should be treated as technical experiments or surfaces under active observation.

Rules:

- they may change or disappear without strong semver guarantees
- they must be labeled clearly as experimental

Typical use:

- demos
- internal validation
- fast feedback loops

### 2.4 Dev-only / Internal

These APIs are not part of the stable public contract.

Rules:

- they may change whenever necessary
- they should not be presented as public integration surfaces

Examples:

- `UI.meta`
- inspect and devtool helpers
- build helpers
- undocumented internal wiring

## 3. Guaranteed Compatibility

JSswift guarantees semver compatibility only for:

- APIs classified as `stable`
- official documented runtime entry points

Guaranteed compatibility means:

- same signature, or a compatible extension of that signature
- same documented meaning of existing props
- same role for official runtime files

It does not mean:

- pixel-perfect CSS stability
- zero behavior changes from bug fixes
- stability for undocumented APIs

## 4. Breaking Change Policy

A breaking change is any change that breaks existing code using a `stable` API.

Examples:

- removing a public method or component
- renaming a stable prop
- changing a default with strong behavior impact
- changing the shape of returned values
- renaming or removing official runtime outputs

Rules:

- a breaking change on a `stable` API requires `MAJOR`
- it must be documented in release notes
- when possible, it should be preceded by a deprecation period

## 5. Deprecation Policy

When a `stable` API must be replaced:

- mark it as `deprecated` first
- keep it for at least one `MINOR` cycle before removal, unless a serious technical constraint makes that impossible

Every deprecation should specify:

- what is deprecated
- the correct replacement
- the version where it became deprecated
- the `MAJOR` where it may be removed

Recommended channels:

- README
- release notes
- optional dev-mode warnings where appropriate

## 6. Public Runtime Contract

Official public runtime files:

Readable:

- `packages/core/dist/cms.js`
- `packages/ui/dist/ui.js`
- `packages/jsswift/dist/jsswift.js`

Minified:

- `packages/core/dist/min-cms.js`
- `packages/ui/dist/min-ui.js`
- `packages/jsswift/dist/min-jsswift.js`

Compatible local mirror:

- `pages/_jsswift-fe/js/cms.js`
- `pages/_jsswift-fe/js/min-cms.js`
- `pages/_jsswift-fe/js/ui.js`
- `pages/_jsswift-fe/js/min-ui.js`

Rules:

- these files do not change name or role in `PATCH` or `MINOR`
- changing the naming or distribution strategy requires strong documentation and, if integrations break, a `MAJOR`

## 7. `rod` And `reactive`

Current product policy:

- `reactive` is part of the stable core
- `rod` is supported and stable for application binding
- public messaging should describe them as two distinct tools, not as aliases of the same model

Recommended positioning:

- `reactive`: low-level core primitives
- `rod`: ergonomic binding and model layer for UI and application flows

## 8. UI Component Policy

Recommended `v1` classification:

Stable:

- base layout
- base inputs
- base select
- consolidated checkbox, radio, and toggle components
- base navigation
- base feedback
- base table

Unstable:

- advanced overlays
- date/time inputs
- rich surfaces with more edge-case-sensitive behavior

Dev-only:

- `UI.meta`
- inspect helpers
- AI and tooling helpers

## 9. Release Discipline

Before every public release:

- build standard and minified runtimes
- run automated core tests
- run browser smoke checks on key demos
- update the README
- update release notes
- review active deprecations

## 10. Decision Rule

If a change touches a `stable` API, ask:

1. Does it break existing code?
2. Does it change expected behavior?
3. Does it change official runtime files or their role?

If the answer is `yes`, it is not just an internal refactor:

- either redesign it into a compatible change
- or treat it as a real breaking change
