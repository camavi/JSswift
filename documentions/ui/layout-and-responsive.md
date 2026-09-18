# Layout and responsive UI

Use Container, Grid, GridCol, Row, Col, Spacer, Toolbar, Card, Layout, Page, Header, Drawer, Footer, and AppShell before raw CSS layout.

- Root props: mobile/default
- tablet: from 768px
- pc: from 1024px

    JSswift.ui.Row({
      direction: "column", gap: "sm",
      tablet: { direction: "row", gap: "md" },
      pc: { justify: "space-between" }
    }, left, right);

Read exact Grid, GridCol, and shell contracts before using spans, tracks, placement, or shell slots.
