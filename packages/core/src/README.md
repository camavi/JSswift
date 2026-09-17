## CMS Source Modules

This folder contains the internal source modules of the JSswift core.

Manifest:

- `modules.json`

Current build order:

- `00-bootstrap.js`
- `09-overlay-shared.js`
- `10-overlay.js`
- `15-dom-props.js`
- `16-renderer-shared.js`
- `17-renderer-children.js`
- `18-renderer-args.js`
- `20-renderer.js`
- `30-rod-core.js`
- `31-rod-model.js`
- `32-lifecycle-helpers.js`
- `32-lifecycle.js`
- `33-debug-perf.js`
- `34-rod-devtools.js`
- `39-store-shared.js`
- `40-store-core.js`
- `41-store-extensions.js`
- `42-plugins.js`
- `42a-auth-shared.js`
- `43-auth.js`
- `43a-http-shared.js`
- `44-http.js`
- `45-route-hooks.js`
- `49-router-shared.js`
- `49a-ui-meta-shared.js`
- `50-ui-meta.js`
- `51-can.js`
- `52-router.js`
- `53-footer.js`

Build command:

```bash
npm run build:cms
```

Generated outputs:

- `packages/core/dist/cms.js`
- `packages/core/dist/min-cms.js`
- compatibility mirror in `pages/_jsswift-fe/js/`

Rules:

- edit files in `packages/core/src/`
- rebuild the core package
- run `npm test`
- update `docs/reference/core.md` if the technical contract changes
