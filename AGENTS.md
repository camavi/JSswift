# JSswift instructions for AI agents

Classify the request before reading documentation. Do not load every document.

## Documentation trees

- For an app built with JSswift, read [documentions/README.md](documentions/README.md). It routes to the smallest guide and exact component contract.
- To change JSswift itself—runtime, components, styles, builds, tests, packages, demos, or releases—read [docDevelop/README.md](docDevelop/README.md).
- For work spanning both, read both indexes, then only the affected documents.

The documentions folder is the application contract; docDevelop is the framework-maintenance contract. Do not solve an application task by editing framework internals.

## Before implementation

For a meaningful framework change, update [docDevelop/workflow/focus.md](docDevelop/workflow/focus.md) with objective, areas, next step, and blockers. Keep one active focus. Never store secrets, tokens, cookies, session data, or personal data in documentation.

When building an app:

1. Use JSswift UI components before raw HTML.
2. Read only the needed file under documentions/components before using props, slots, events, or methods.
3. Use JSswift.reactive, model, slots, router, store, and HTTP according to the focused guide.
4. Use raw helpers only for small structural gaps.

## After implementation

- Run checks from the relevant docDevelop guide.
- Update application documentation when a public contract changes.
- Record significant framework results and decisions in docDevelop/workflow and close the active focus.

## Repository map

- packages/core/src: core source
- packages/ui/src: UI source
- packages/*/dist: generated runtime outputs
- pages: website and demos
- tests: automated tests
- documentions: compact app-building documentation
- docDevelop: framework-development documentation
