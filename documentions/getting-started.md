# Getting started with JSswift

- Global runtime: window.JSswift
- window._ is an alias; prefer JSswift in generated application code.
- Prefer JSswift.ui.* for UI components.
- HTML/SVG helpers are functions on JSswift, for example JSswift.div(...).

Example:

    JSswift.ready(() => JSswift.mount("#app", App()));
    function App() {
      return JSswift.ui.Page({},
        JSswift.ui.Card({ title: "Hello" },
          JSswift.ui.Btn({ color: "primary" }, "Continue")
        )
      );
    }

A view may return a DOM node, array, fragment, JSswift UI component, or reactive render function. Start with shell (AppShell, Layout, Page), layout (Container, Grid, Row, Card), then focused UI components.
