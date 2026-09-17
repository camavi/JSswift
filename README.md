# JSswift

<p align="center">
  <img src="pages/_jsswift-fe/img/logo.svg" alt="JSswift logo" width="112" />
</p>

JSswift is a lightweight, browser-first web framework with:

- a custom DOM and reactivity core
- a composable UI layer
- readable and minified bundles
- separate packages for progressive adoption

Published packages:

- `@jsswift/core`
- `@jsswift/ui`
- `jsswift`

Official site:

- https://www.jsswift.com/

## Which Package To Use

- `@jsswift/core`
  if you want the renderer, `signal`, `computed`, `effect`, `rod`, lifecycle helpers, and platform modules without the UI layer
- `@jsswift/ui`
  if you want the UI components on top of `@jsswift/core`
- `jsswift`
  if you want a single package with everything included

## Installation

Core only:

```bash
npm install @jsswift/core
```

Core + UI:

```bash
npm install @jsswift/core @jsswift/ui
```

Single package:

```bash
npm install jsswift
```

## CDN

Single package via jsDelivr:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/jsswift@1.0.25/dist/css/ui.css"
/>
<script src="https://cdn.jsdelivr.net/npm/jsswift@1.0.25/dist/jsswift.js"></script>
```

Minified single package:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/jsswift@1.0.25/dist/css/ui.min.css"
/>
<script src="https://cdn.jsdelivr.net/npm/jsswift@1.0.25/dist/jsswift.min.js"></script>
```

Split core + UI via jsDelivr:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@jsswift/ui@1.0.25/dist/css/ui.css"
/>
<script src="https://cdn.jsdelivr.net/npm/@jsswift/core@1.0.25/dist/cms.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@jsswift/ui@1.0.25/dist/ui.js"></script>
```

Minified split core + UI:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@jsswift/ui@1.0.25/dist/css/ui.min.css"
/>
<script src="https://cdn.jsdelivr.net/npm/@jsswift/core@1.0.25/dist/cms.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@jsswift/ui@1.0.25/dist/ui.min.js"></script>
```

For production:

- pin explicit versions, for example `@1.0.25`
- prefer minified bundles when you do not need readable builds
- use `dist/jsswift.min.js` or `dist/min-jsswift.js` for `jsswift`
- use `dist/cms.min.js` and `dist/ui.min.js` for split core and UI

## Quick Start

Example with the single package:

```js
import "jsswift";
import "jsswift/css/ui.css";

const _ = window._;
const root = document.getElementById("app");

const count = _.rod(0);

_.mount(
  root,
  _.Card(
    _.cardBody(
      _.h1("JSswift"),
      _.Btn(
        {
          color: "primary",
          onClick: () => (count.value += 1),
        },
        "Count +1",
      ),
      _.p(() => `Current count: ${count}`),
    ),
  ),
);
```

Minimal HTML:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JSswift app</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

## Using `@jsswift/core` + `@jsswift/ui`

```js
import "@jsswift/core";
import "@jsswift/ui";
import "@jsswift/ui/css/ui.css";
```

## Theme Helper

Use the theme helpers to control `data-theme` on the root `html` element:

```js
JSswift.setTheme("dark");
JSswift.getTheme();
JSswift.toggleTheme(["light", "dark", "sepia"]);
```

This sets `data-theme` on `<html>`:

```html
<html data-theme="dark">
```

Behavior:

- `JSswift.setTheme(theme)` applies the theme and persists it to `localStorage`
- `JSswift.getTheme()` reads the current theme from `html[data-theme]`, with fallback to the saved value
- `JSswift.toggleTheme(themes)` cycles through any number of themes, not only `light/dark`
- on startup, JSswift restores the saved theme automatically if one exists

If you want multi-theme toggling without passing the list every time, set:

```js
JSswift.theme.themes = ["light", "dark", "sepia", "midnight"];
JSswift.toggleTheme();
```

## Available CSS Exports

With `@jsswift/ui`:

- `@jsswift/ui/css/ui.css`
- `@jsswift/ui/css/min-ui.css`
- `@jsswift/ui/css/ui.min.css`
- `@jsswift/ui/css/base.css`
- `@jsswift/ui/css/responsive.css`
- `@jsswift/ui/css/animation.css`
- `@jsswift/ui/css/ui-components.css`
- `@jsswift/ui/css/docs.css`

With `jsswift`:

- `jsswift/css/ui.css`
- `jsswift/css/min-ui.css`
- `jsswift/css/ui.min.css`
- `jsswift/css/base.css`
- `jsswift/css/responsive.css`
- `jsswift/css/animation.css`
- `jsswift/css/ui-components.css`
- `jsswift/css/docs.css`

## Brand Asset

The official JSswift logo is available as a lightweight SVG:

- local demo/runtime asset: `/_jsswift-fe/img/logo.svg`
- published UI package asset: `@jsswift/ui/img/logo.svg`
- published umbrella package asset: `jsswift/img/logo.svg`

## Repository Structure

- `packages/core`
  renderer, reactive core, `rod`, lifecycle, and platform modules
- `packages/ui`
  UI components plus CSS, font, and image assets
- `packages/jsswift`
  umbrella bundle with JS, CSS, and assets included
- `pages`
  local HTML demos and manual smoke coverage
- `docs`
  technical reference, policy, and release material

## Repository Commands

Runtime build:

```bash
npm run build:runtime
```

Local dev:

```bash
npm run dev
```

Automated tests:

```bash
npm test
```

UI autocomplete generation:

```bash
npm run gen:ui-dts
```

## Runtime Outputs

- `packages/core/dist/cms.js`
- `packages/core/dist/min-cms.js`
- `packages/core/dist/cms.min.js`
- `packages/ui/dist/ui.js`
- `packages/ui/dist/min-ui.js`
- `packages/ui/dist/ui.min.js`
- `packages/ui/dist/css/ui.css`
- `packages/ui/dist/css/min-ui.css`
- `packages/ui/dist/css/ui.min.css`
- `packages/jsswift/dist/jsswift.js`
- `packages/jsswift/dist/min-jsswift.js`
- `packages/jsswift/dist/jsswift.min.js`

## Documentation

- [Docs Index](docs/README.md)
- [Core Reference](docs/reference/core.md)
- [UI Reference](docs/reference/ui.md)
- [Stability Policy](docs/policy/stability.md)
- [Release Notes v1.0.25](docs/release/release-notes-v1.0.25.md)
- [Release Notes v1.0.24](docs/release/release-notes-v1.0.24.md)
- [Release Notes v1.0.23](docs/release/release-notes-v1.0.23.md)
- [Release Notes v1.0.22](docs/release/release-notes-v1.0.22.md)
- [Release Notes v1.0.21](docs/release/release-notes-v1.0.21.md)
- [Release Notes v1.0.20](docs/release/release-notes-v1.0.20.md)
- [Release Notes v1.0.19](docs/release/release-notes-v1.0.19.md)
- [Release Notes v1.0.18](docs/release/release-notes-v1.0.18.md)
- [Release Notes v1.0.17](docs/release/release-notes-v1.0.17.md)
- [Release Notes v1.0.16](docs/release/release-notes-v1.0.16.md)
- [Release Notes v1.0.15](docs/release/release-notes-v1.0.15.md)
- [Release Notes v1.0.14](docs/release/release-notes-v1.0.14.md)
- [Release Notes v1.0.13](docs/release/release-notes-v1.0.13.md)
- [Release Notes v1.0.12](docs/release/release-notes-v1.0.12.md)
- [Release Notes v1.0.11](docs/release/release-notes-v1.0.11.md)
- [Release Notes v1.0.10](docs/release/release-notes-v1.0.10.md)
- [Release Notes v1.0.9](docs/release/release-notes-v1.0.9.md)
- [Release Notes v1.0.8](docs/release/release-notes-v1.0.8.md)
- [Release Notes v1.0.7](docs/release/release-notes-v1.0.7.md)
- [Release Notes v1.0.5](docs/release/release-notes-v1.0.5.md)
- [Release Notes v1.0.4](docs/release/release-notes-v1.0.4.md)
- [Release Notes v1.0.3](docs/release/release-notes-v1.0.3.md)
- [Release Notes v1.0.2](docs/release/release-notes-v1.0.2.md)
- [Release Notes v1.0.1](docs/release/release-notes-v1.0.1.md)
- [Release Plan v1](docs/release/release-plan-v1.md)
- [Release Notes v1.0.0 Archive](docs/release/release-notes-v1.0.0.md)
- [Smoke Checklist v1](docs/release/smoke-v1.md)
- [Changelog](CHANGELOG.md)

## Notes

- `packages/*/src` is the source of truth for framework code
- the packages are browser-first and are meant for browser or Vite-style environments, not pure Node without a DOM
- `pages/` is not editorial documentation; it exists only for local demos and compatibility smoke coverage
