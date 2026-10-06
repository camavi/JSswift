# Application composition rules

Use documented `_.Component` UI components for layout, content, forms, navigation, feedback, data, and overlays. Components carry visual, responsive, interaction, and accessibility behavior; do not rebuild their internals in raw DOM.

The common call shape is _.Component(props?, ...children). Use named slots only when the exact component file documents them. Children and many text slots accept nodes, arrays, and functions.

Open [components/README.md](components/README.md) to choose a family, then open the one needed component file.

## Use the existing CSS first

Import `jsswift/css/ui.css` once. JSswift already supplies component styles, theme variables, and responsive layout rules. Start with the native appearance. Use documented props such as `color`, `dense`, `padding`, `radius`, `shadow`, and responsive overrides before writing custom CSS. Prefer theme variables from the installed stylesheet for shared colors and typography.

Custom CSS is appropriate for page-specific visuals or requirements the documented props do not cover. Keep it scoped to application classes; avoid recreating buttons, fields, cards, table cells, pagination, or dialog internals. Read the exact component contract before choosing a prop.

## Keep discovery focused

Read the index and only the contracts for components you will use. Batch independent file reads; do not concatenate the whole catalog, extract it with Python, or search the framework source when the documented contract already answers the question. When a contract is missing or ambiguous, inspect only the relevant implementation and report the gap. Build after the first complete implementation, then correct concrete failures.

Run comparative benchmarks in an isolated workspace, with equivalent instructions for every stack.
