# JSswift UI Reference

This document describes the JSswift UI layer as a practical reference for developers and AI tooling.

The canonical runtime source remains:

- `packages/ui/dist/ui.js`
- `documentions/components/*.md`

Component API contracts live in documentions/components and are verified against implementation source. They are not embedded in the UI runtime.

## Purpose

- provide a readable map of the UI layer
- explain naming, composition, and runtime conventions
- summarize the main component families
- document how the UI layer is meant to be consumed with `children`, slots, props, routing, and reactive models

## Source Of Truth

- generated runtime: `packages/ui/dist/ui.js`
- minified runtime: `packages/ui/dist/min-ui.js`
- modular source: `packages/ui/src/`
- module manifest: `packages/ui/src/modules.json`

Maintenance rules:

- edit extracted modules in `packages/ui/src/`
- rebuild with `npm run build:ui`
- update this document when the public UI contract changes

## Runtime Conventions

- both `UI.Component` and `_.Component` are available at runtime
- card section helpers are intentionally lower camel case:
  - `UI.cardHeader`
  - `UI.cardBody`
  - `UI.cardFooter`
- the common call shape is `_.Component(props?, ...children)`
- some overlay components return an imperative API instead of only a DOM node
- many components accept both semantic slot aliases such as `start/left`, `body/content`, and `end/right/actions`

## Reactivity Conventions

- many form controls support `model` as either a `rod` or a `[get, set]` signal tuple
- textual and visual slots often accept `Node | Array | Function`
- text-oriented props commonly accept `String | Node | Function | Array`

## Routing Conventions

- some components accept `to`
- when router support is available they call `JSswift.router.navigate(...)`

## Component documentation

Read documentions/components/<component>.md or use the knowledge MCP to search and read the installed contracts. The UI runtime does not register a component catalog or normalize descriptive metadata. Core docTable/inspect helpers remain compatible with metadata supplied explicitly by an application; bundled component descriptions are absent.

## Responsive System

JSswift UI components are responsive by default through a shared prop contract.

Breakpoints:

- mobile/default: base props outside a breakpoint object
- `mobile`: explicit mobile override, applied without a media query
- `tablet`: applied from `768px`
- `pc`: applied from `1024px`

The default rule is: write the mobile value at the root, then override only the
values that change inside `tablet` or `pc`.

```js
_.Row({
  gap: "sm",
  direction: "column",
  tablet: { direction: "row", gap: "md" },
  pc: { justify: "space-between" }
})

_.Col({
  col: 24,
  tablet: { col: 12 },
  pc: { col: 6 }
})
```

The responsive engine supports both token classes and arbitrary CSS values.

- token values map to generated utility classes, for example `cms-tablet-row`,
  `cms-pc-col-6`, `cms-tablet-gap-md`
- arbitrary values are stored as CSS custom properties on `.cms-rsp`, for
  example `tablet: { width: "min(50vw, 420px)" }`
- unsupported responsive props are ignored by the responsive engine and remain
  available to the component implementation

Common responsive props available across UI components:

- layout: `display`, `direction`, `wrap`, `align`, `justify`, `place`, `items`
- grid: `columns`, `rows`, `autoFlow`, `autoRows`, `gridColumn`, `gridRow`,
  `gridArea`
- spacing and sizing: `gap`, `rowGap`, `columnGap`, `width`, `minWidth`,
  `maxWidth`, `height`, `minHeight`, `maxHeight`, `padding`, `margin`
- typography and shape: `fontSize`, `fontWeight`, `lineHeight`,
  `letterSpacing`, `radius`
- behavior/layout order: `overflow`, `order`, `col`

Layout primitives (`Row`, `Col`, `Container`, `Footer`, `Toolbar`, `Grid`, and
`GridCol`) use the complete responsive rule set. Other components receive the
common rule set through `setPropertyProps`, so controls such as `Btn`, `Card`,
`Input`, and content components can still respond to sizing, spacing,
typography, display, and layout props.

CSS source rules:

- edit `cms-dev/make-responsive-css.mjs`, not generated responsive CSS files
- generated CSS entry: `packages/ui/dist/css/responsive.css`
- umbrella generated CSS entry: `packages/jsswift/dist/css/responsive.css`
- bundled UI CSS places component rules before responsive rules, so documented
  responsive values win over component defaults when normal cascade rules apply
- responsive custom-property selectors are activated per property and breakpoint,
  so an undefined responsive variable never resets component defaults

## Canonical Usage Patterns

### 1. App Shell Layout

Use this pattern when building a full shell with header, drawer, page content, and footer.

Typical stack:

- `Layout`
- `Header`
- `Drawer`
- `Page`
- `Footer`

### 2. Reactive Form

Use this pattern when a flow is driven by reactive state and validation.

Typical stack:

- `JSswift.useForm()`
- `Form`
- `Input`
- `Select`
- `Checkbox`
- `Radio`
- `Toggle`
- `cardHeader`, `cardBody`, `cardFooter`

### 3. Data Table With Toolbar

Use this when showing operational data with filtering, searching, sorting, per-row actions, and paging.

Typical stack:

- `Table`
- `toolbarStart`
- `toolbarEnd`
- `actions(row)`

### 4. Anchored Rich Overlay

Use this when an action needs a richer interaction layer without changing page.

Typical stack:

- `Popover`
- `Menu`
- `Tooltip`
- imperative `open`, `close`, `toggle`, or `bind` when needed

## Accessibility And Behavior Rules

General reading rules:

- if a component renders a native HTML control, native semantics come first
- if metadata documents `keyboard`, `trigger`, `trapFocus`, `autoFocus`, `closeOnEsc`, or `closeOnOutside`, treat those as real UX contract, not decorative details
- if accessibility behavior is not documented in component documentation, do not invent it

Practical generation rules:

- use `disabled` when the control should not receive input or activation
- use `readonly` when the control should remain focusable but not editable
- if a component does not document `readonly`, do not assume it works by analogy
- for composite widgets such as `Select`, `Tabs`, `Pagination`, `Menu`, or `Popover`, `disabled` is a behavioral contract, not just native HTML semantics

## Main Component Families

### Layout

- `Layout`
- `Row`
- `Col`
- `Spacer`
- `Container`
- `Card`
- `Footer`
- `Toolbar`
- `Grid`
- `GridCol`
- `Page`
- `Header`
- `Drawer`
- `AppShell`
- `Parallax`

### Content

- `Icon`
  - supports `tooltip` shorthand, e.g. `_.Icon({ name: "home", tooltip: "Home" })`
- `Badge`
- `Avatar`
- `Chip`
- `List`
- `Item`
- `Separator`
- `Banner`

### Form

- `FormField`
- `InputRaw`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `Radio`
- `Toggle`
- `Slider`
- `Rating`
- `Date`
- `Time`
- `Form`
- `JSswift.form`
- `JSswift.useForm`

### Navigation

- `Tabs`
- `RouteTab`
- `Breadcrumbs`
- `Pagination`
- `TabPanel`

### Feedback

- `Spinner`
- `Progress`
- `LoadingBar`
- `Notify`

### Overlays

- `Tooltip`
- `Dialog`
- `Menu`
- `Popover`
- `ContextMenu`

### Data

- `Table`

## Stability Reading For UI

Reasonably safe surfaces:

- layout primitives
- base input components
- base select
- checkbox, radio, and toggle
- base navigation
- feedback primitives
- table baseline

Treat more carefully:

- advanced overlays
- `Date`
- `Time`
- component documentation as public product contract

## Naming Notes

- `cardHeader`, `cardBody`, and `cardFooter` are the canonical exported names
- do not assume PascalCase aliases exist unless component documentation confirms them

## Overlay Notes

For overlays, always distinguish:

- declarative trigger and configuration props
- imperative control APIs such as `open`, `close`, `toggle`, `update`, or `bind`

Flags such as:

- `closeOnEsc`
- `closeOnOutside`
- `closeOnBackdrop`
- `persistent`
- `closable`
- `autoFocus`
- `trapFocus`

are behavior contract, not just cosmetic options.

## Form Notes

For form generation:

- prefer `model` when generating reactive UI
- use `value` for static or uncontrolled state
- keep `FormField` as visual and structural wrapper, not as a replacement for native input semantics

## Maintenance Workflow

When changing the UI layer:

1. edit the relevant files in `packages/ui/src/*`
2. rebuild with `npm run build:ui`
3. verify against the local demos or the external docs site
4. update this document if the public contract changed

## Build Command

```bash
npm run build:ui
```

## External Docs Note

Long-form tutorials and richer examples belong in the external docs site repository.

This repository keeps the framework-focused reference.

## Optional fonts and icons

`jsswift/css/ui.css` includes component styles and uses system fonts. It does not load font files or activate the Tabler catalog. Existing applications that need Nunito or Material Symbols must now opt in explicitly:

```js
import 'jsswift';
import 'jsswift/css/ui.css';
// Optional: Nunito, including its theme font variables.
import 'jsswift/css/fonts-nunito.css';
// Optional: Material Symbols (downloads a font from Google).
import 'jsswift/css/fonts-material.css';
// Optional: configures the bundled Tabler SVG sprite for _.Icon('#name').
import 'jsswift/tabler';
```

The same entries exist under `@jsswift/ui`; load the core and UI runtime first. Tabler can also be configured manually with `_.config.iconSpriteUrl` or the Icon `spriteUrl` prop. Inline SVG nodes and the built-in chevron remain available without the catalog. Import only the optional assets actually needed. The npm package still ships these assets; opting out reduces application build assets, not installation size. For CDN usage, load the runtime first, then import the optional `dist/tabler.js` module and/or link the optional CSS after `ui.css`.

## Public Input and Select controls

Returned fields expose focus(options?) for their interactive control; Select focus does not open its menu. Both accept ariaLabel (defaulting to a string label), ariaLabelledBy, ariaDescribedBy, ariaInvalid and required. Error marks aria-invalid unless explicitly overridden. Input forwards min, max, step, pattern, minLength and maxLength to its native input. Model values remain accessible through rod.value; there is no separate getValue/setValue API.
