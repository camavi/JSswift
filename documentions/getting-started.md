# Getting started with JSswift

- Application namespace: `window._`, written `_` in application code.
- `_` exposes both UI components and core APIs directly: `_.Toggle`, `_.mount`, `_.signal`.
- The runtime also exposes `window.JSswift`; application examples and generated code use `_`.
- Call UI components directly on `_`, for example `_.Toggle(...)` and `_.Input(...)`.
- HTML/SVG helpers also use `_`, for example `_.div(...)`.

Minimal Vite imports:

```js
import 'jsswift';
import 'jsswift/css/ui.css';
const _ = window._;
```

Read [application-rules.md](application-rules.md) before styling; the UI stylesheet already contains component styles and responsive rules.

Example:

    _.ready(() => _.mount("#app", App()));
    function App() {
      return _.Page({},
        _.Card({ title: "Hello" },
          _.Button({ color: "primary" }, "Continue")
        )
      );
    }

A view may return a DOM node, array, fragment, JSswift UI component, or reactive render function. Start with shell (AppShell, Layout, Page), layout (Container, Grid, Row, Card), then focused UI components.

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


## Optional breakpoint utilities

The complete `ui.css` entry remains compatible. A page that uses defaults or its own CSS media queries can choose:

```js
import 'jsswift';
import 'jsswift/css/ui-light.css';
// Add only when using tablet/pc/desktop props or breakpoint utility classes:
import 'jsswift/css/responsive.css';
```

The light entry includes base.css, animation.css, component styles and generated unprefixed utilities. It preserves color, dense, outline, tokens, base layout and component-specific mobile styles. Breakpoint props remain in JavaScript; their generated CSS requires the responsive addon. Load the addon after the light entry. Use either full CSS or light plus optional addon, not both full and light. Both new light exports also exist under `@jsswift/ui`. This changes application CSS size, not JavaScript or npm installation size.
