## UI Source Modules

This folder contains the modular source structure of the JSswift UI layer.

Current status:

- a dedicated build exists: `npm run build:ui`
- the old `ui.js` monolith has been split into modules under `packages/ui/src/*`
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

Recommended module order:

- `00-bootstrap.js`
- `01-foundation-helpers.js`
- `10-primitives-layout.js`
- `20-display-content.js`
- `21-list-content.js`
- `22-banner-content.js`
- `23-tooltip.js`
- `31-form-advanced.js`
- `40-navigation.js`
- `41-tab-panel.js`
- `50-feedback.js`
- `51-feedback-service.js`
- `60-shell-app.js`
- `61-form-service.js`
- `70-dialog.js`
- `71-menu-overlays.js`
- `80-data.js`

Planned families:

- bootstrap/helpers:
  rod path proxy, argument normalization, shared helpers, meta/dev wrapping
- primitives/layout:
  `Row`, `Col`, `Spacer`, `Container`, `Card`, `Footer`, `Toolbar`, `Grid`, `GridCol`, `FormField`, `InputRaw`, `Input`, `Textarea`, `Select`
- display/content:
  `Icon`, `Badge`, `Avatar`, `Chip`
- list/content:
  `List`, `Item`, `Separator`
- banner/content:
  `Banner`
- tooltip:
  `Tooltip`
- advanced form:
  `Checkbox`, `Radio`, `Toggle`, `Slider`, `Rating`, `Date`, `Time`
- navigation:
  `Tabs`, `RouteTab`, `Breadcrumbs`, `Pagination`
- tab panel:
  `TabPanel`
- docs:
  `ComponentDocs`
- feedback:
  `Spinner`, `Progress`, `LoadingBar`, `Notify`
- feedback service:
  toast root, timers, update/remove/clear, notify shortcuts
- shell/app:
  `Header`, `Drawer`, `Page`, `AppShell`, `Parallax`
- form/service:
  `JSswift.form`, `JSswift.useForm`, `Form`, `cardHeader`, `cardBody`, `cardFooter`, dialog bootstrap
- dialog:
  `Dialog`
- menu/overlays:
  `Menu`, `Popover`, `ContextMenu`
- data:
  `Table`

Rules:

- migrate one family at a time
- rebuild the UI package
- verify against the relevant demos
- update `docs/reference/ui.md`

Notes:

- `packages/ui/src/` is the source of truth
- `99-legacy-ui.js` has been removed; the bundle is built only from the manifest modules
- when a family was not contiguous in the legacy file, the migration followed the real source order
