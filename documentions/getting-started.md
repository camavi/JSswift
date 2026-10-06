# Getting started with JSswift

- Application namespace: `window._`, written `_` in application code.
- `_` exposes both UI components and core APIs directly: `_.Toggle`, `_.mount`, `_.signal`.
- The runtime also exposes `window.JSswift`; application examples and generated code use `_`.
- Call UI components directly on `_`, for example `_.Toggle(...)` and `_.Input(...)`.
- HTML/SVG helpers also use `_`, for example `_.div(...)`.

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
