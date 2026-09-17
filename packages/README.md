# JSswift Packages

This folder contains the package-oriented structure of the framework.

## Packages

- `packages/core`
  renderer, reactive core, `rod`, lifecycle, and platform modules
- `packages/ui`
  UI components and CSS, font, and image assets built on top of `@jsswift/core`
- `packages/jsswift`
  umbrella package for users who want everything loaded together

## Rules

- the framework source of truth lives in `packages/*/src`
- publishable outputs are generated into `packages/*/dist`
- `pages/_jsswift-fe/` remains only as a compatible runtime mirror for local demos

## Documentation

- `../README.md`
- `../docs/reference/core.md`
- `../docs/reference/ui.md`
- `../docs/policy/stability.md`
