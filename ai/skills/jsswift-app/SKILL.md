---
name: jsswift-app
description: Build and edit applications using JSswift UI, reactive models, routing, and HTTP. Use for JSswift application work, not framework internals, builds, releases, or unrelated Swift development.
---

# JSswift applications

Use the application documentation as the contract. Do not infer JSswift APIs from React, Vue, native Swift, or component naming conventions.

## Find the contract

If the JSswift knowledge MCP is connected, use `jsswift_search` with the user's feature or component name, then `jsswift_read` for the returned document IDs. Search returns references, not complete API contracts. The `jsswift://knowledge/map` resource exposes the same index.

Without MCP, first check the application’s installed `node_modules/jsswift/dist/documentions/README.md` and `knowledge-map.json`, which match its framework release. For a standalone Skill, use `references/documentions/README.md` and `references/documentions/knowledge-map.json` when present in the distributed Skill. In the source checkout, use `documentions/README.md` and `documentions/knowledge-map.json` three directories above this Skill. If neither is available, locate the JSswift checkout or ask for the documentation location rather than inventing APIs.

Start with `AI.md` (MCP ID `guide:AI`). Its examples and callback table cover a supported subset directly. Read a component's `components/<component>.md` only for additional APIs. Shared properties listed by `commonProps.keys` are defined in `ui/common-props.md`; read that once when styling. Load only guides relevant to the feature; the map routes to contracts rather than replacing them.

## Build the application

- Use `_.Button` as the standard button name. The contract is `components/btn.md` (MCP ID `component:btn`); `_.Btn` is a compatible alias.
- Prefer documented `_.Component` UI components for UI and layout. Use raw HTML/SVG helpers only for small structural gaps, following `reference/html-svg-helpers.md`.
- Start an application with `getting-started.md`; use `application-rules.md` for children and composition. Use `_` as the single application namespace for UI components and core APIs.
- For state or controlled inputs read `reactivity.md`. Prefer `_.rod()` for bidirectional field models and its public `.value` for reads/writes. Use `_.signal()` when getter/setter state is useful; both remain supported according to each control contract. For forms read `ui/forms.md` and each control's contract.
- For layout read `ui/layout-and-responsive.md`: root props are mobile/default, `tablet` begins at 768px, and `pc` at 1024px. Check the exact component contract for responsive props and shell slots.
- For routing, store, HTTP, permissions, or themes read `platform.md`. If a needed operation is absent, identify the documentation gap instead of guessing a method.
- For tables, loading, feedback, dialogs, or menus read `ui/data-feedback-overlays.md` and the selected contracts. Overlay trigger and imperative APIs differ by component.

Follow the application's existing entrypoint, tooling, and checks. Verify the affected user flow using the app's available checks. Do not edit JSswift framework source to solve an application task. If the user explicitly requests framework changes, route that work to `docDevelop/README.md`.
