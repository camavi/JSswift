# Runtime JS Mirror

This folder only contains a compatible mirror of the runtime outputs used by the local demo under `pages/`.

## Source Of Truth

- core source: [packages/core/src](../../../packages/core/src)
- UI source: [packages/ui/src](../../../packages/ui/src)
- built runtimes: [packages/core/dist](../../../packages/core/dist), [packages/ui/dist](../../../packages/ui/dist), [packages/jsswift/dist](../../../packages/jsswift/dist)

## Rules

- do not recreate legacy source files in this folder
- this tree remains only as a compatibility mirror of built files
- `packages/*/dist` remains the source of truth for publishable bundles
