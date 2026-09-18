# VS Code Autocomplete for JSswift UI

This project generates a global `UI` namespace definition so VS Code can provide IntelliSense for the JSswift UI library.

## How to generate

Run once:

```sh
npm run gen:ui-dts
```

Run in watch mode:

```sh
npm run gen:ui-dts:watch
```

## How it works

- `cms-dev/generate-ui-dts.mjs` generates `types/jsswift-ui.d.ts`.
- By default it scans JS sources under `src/`, `_jsswift/`, and `pages/_jsswift-fe/js` when those directories exist.
- In this repository the practical runtime source for autocomplete is the generated mirror under `pages/_jsswift-fe/js`.
- It looks for `UI.X = ...`, `export function X`, and `export const X = ...` patterns.
- It extracts JSDoc, destructured prop keys, and basic defaults to build prop types.
- Output goes to `types/jsswift-ui.d.ts` and is included by `jsconfig.json`.
