# Current focus

- Objective: redesign UI for palette-driven light/dark themes, component-owned JS/CSS and automatic application discovery.
- Status: active overall redesign; visual steps Button, Input/FormField, Select, Checkbox, Radio, Toggle, Slider, Rating, Date, Time, Textarea, Search, Card, Chip, Badge, Avatar, Banner, List, Item, Separator, Tabs, RouteTab, Breadcrumbs, Pagination, TabPanel, Spinner, Progress, LoadingBar, Notify, Dialog, Tooltip, Popover, Menu, ContextMenu, Table, Stat, Kpi, Header, Drawer, Page, AppShell, Parallax, Footer, Toolbar, Grid, GridCol, Container, Row, Col, Spacer, Layout and Icon accepted and closed.
- Areas: packages/ui/src, theme tokens, public props, selective builder and Vite.
- Next: Alert visual review; local alert.html covers semantic colors/effects, actions, dismissal and reactive copy in both themes. Icon accepted and closed by user; umbrella build, 72 unit tests and all 47 browser tests passed. Alert fixture smoke checks passed; its visual/props audit is next.
- Blockers: none; dynamic component access requires explicit inclusion.
- Work log: [ui-redesign.md](ui-redesign.md).
