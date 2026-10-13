## UI Source Modules

This folder contains the modular source structure of the JSswift UI layer.

Current status:

- a dedicated build exists: `npm run build:ui`
- source modules and extracted component files live under `packages/ui/src/`
- `99-legacy-ui.js` is no longer used in the build
- public runtime output is generated into `packages/ui/dist/`
- a compatibility mirror remains in `pages/_jsswift-fe/js/`

Manifest:

- `modules.json`

Build command:

```bash
npm run build:ui
```

Responsive CSS command:

```bash
node cms-dev/make-responsive-css.mjs
```

Generated output:

- `packages/ui/dist/ui.js`
- `packages/ui/dist/min-ui.js`
- CSS, font, and image assets in `packages/ui/dist/`

Responsive source of truth:

- responsive CSS is generated, not edited by hand
- edit `cms-dev/make-responsive-css.mjs`
- run `node cms-dev/make-responsive-css.mjs`
- then run `npm run build:ui` and `npm run build:jsswift`
- generated package files:
  - `packages/ui/dist/css/responsive.css`
  - `packages/jsswift/dist/css/responsive.css`

Responsive component contract:

- mobile/default values live at the root of the props object
- `mobile`, `tablet`, and `pc` objects override only the props they contain
- `tablet` starts at `768px`
- `pc` starts at `1024px`
- responsive props are omitted from DOM attributes by the shared `JSswift.omit`
  helper

Examples:

```js
_.Row({
  direction: "column",
  gap: "sm",
  tablet: { direction: "row", gap: "md" },
  pc: { justify: "space-between" }
})

_.Col({
  col: 24,
  tablet: { col: 12 },
  pc: { col: 6 }
})

_.Btn({
  width: "100%",
  tablet: { width: "220px" },
  pc: { width: "320px" }
})
```

Implementation notes:

- token values become generated classes such as `cms-tablet-row`,
  `cms-pc-col-6`, or `cms-tablet-gap-md`
- arbitrary values become `.cms-rsp` custom properties such as
  `--cms-rsp-tablet-width`
- `.cms-rsp-*` activation classes are emitted per property and breakpoint; this
  keeps undefined custom properties out of the cascade and still lets responsive
  values override defaults from `ui-components.css`
- grid child rules use `.cms-grid.cms-grid > .cms-grid-col` for the same reason
- layout primitives use `JSswift.uiResponsiveStyleRules`
- generic/shared props use `JSswift.uiResponsiveCommonStyleRules` through
  `setPropertyProps`

## Source organization

- `modules.json.buildOrder` is the exact initialization order. All source fragments remain inside the original UI IIFE; applications consume generated builds.
- `components/` contains one implementation file per canonical component: 63 entries cover all 66 public UI names, including Button/Btn and Upload/BoxUpload/boxUpload.
- `helpers/` contains shared rendering/reactivity, field, choice, date/time, notification, drawer, overlay, layout and table support.
- `services/` contains Notify, Form/useForm, Dialog initialization/shortcuts and Loading.
- `00-bootstrap.js`, `01-foundation-helpers.js` and `99-footer.js` retain the shared runtime envelope/foundation. The previous numbered component-family files have been removed.

`modules.json.components` registers JS, aliases, CSS sections, helper sources and conservative transitive component dependencies. `services` registers service entry files and their dependencies; `styles` registers the CSS entry and shared sections. `cssOwnership` is the single selector-ownership table used by the selective CSS builder. `uiSourceFiles` enumerates assets consistently for validation and package copying.

Runtime dependencies continue to be resolved from the JavaScript AST for both configured CLI and Vite builds. The cached registry dependencies/helpers are derived from that same resolver, including optional branches; they are not a manually maintained alternative graph. Dependency cycles from valid references are handled by the resolver's visited set. CSS import cycles fail the build.

After changing component exports/dependencies, run:

```bash
npm run ui:registry:refresh
npm run ui:registry:check
npm run build:ui
npm run build:jsswift
```

`ui:registry:refresh` updates derived dependency/helper lists. Add or remove component/service entries and actual assets in the manifest when implementing APIs; the refresh command rejects missing or stale public names. The source registry test checks every public definition's owning file and all extracted assets, while packaging tests verify their presence in the installed tarball.

Component-specific CSS sections live in `css/components/`, shared selectors/utilities/effects in `css/shared/`. Read [css/README.md](css/README.md) before moving styles; CSS source import order preserves the approved cascade.
