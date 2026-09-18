# Application composition rules

Use JSswift.ui.* for layout, content, forms, navigation, feedback, data, and overlays. Components carry visual, responsive, interaction, and accessibility behavior; do not rebuild their internals in raw DOM.

The common call shape is JSswift.ui.Component(props?, ...children). Use named slots only when the exact component file documents them. Children and many text slots accept nodes, arrays, and functions.

Open [components/README.md](components/README.md) to choose a family, then open the one needed component file.
