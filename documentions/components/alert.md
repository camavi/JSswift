# Alert

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Alert(...children) | _.Alert(props, ...children)",
  "props": {
    "flat": {"type": "boolean", "description": "Remove border and elevation.", "default": false, "values": [true, false], "category": "style"},
    "border": {"type": "boolean", "description": "Draw an explicit contour.", "default": false, "values": [true, false], "category": "style"},
    "glossy": {"type": "boolean", "description": "Apply the Header reflective surface.", "default": false, "values": [true, false], "category": "style"},
    "glow": {"type": "boolean", "description": "Apply the Header colored halo.", "default": false, "values": [true, false], "category": "style"},
    "glass": {"type": "boolean", "description": "Apply the Header translucent glass surface.", "default": false, "values": [true, false], "category": "style"},
    "gradient": {"type": "boolean", "description": "Apply a palette gradient surface.", "default": false, "values": [true, false], "category": "style"},
    "textGradient": {"type": "boolean", "description": "Apply the gradient to the title only.", "default": false, "values": [true, false], "category": "style"},
    "lightShadow": {"type": "boolean", "description": "Apply the Header light shadow treatment.", "default": false, "values": [true, false], "category": "style"},
    "dense": {"type": "boolean", "description": "Compact padding, content gaps, title and action buttons.", "default": false, "values": [true, false], "category": "layout"},
    "stack": {"type": "boolean", "description": "Place the aside/dismiss region on its own row.", "default": false, "values": [true, false], "category": "layout"},
    "gap": {"type": "number|string", "description": "Spacing between the icon, body and aside.", "default": null, "values": null, "category": "layout"},
    "elevated": {"type": "boolean", "description": "Use the Header-style medium elevation.", "default": false, "values": [true, false], "category": "style"},
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "message": {"type": "String|Node|Function|Array", "description": "Message text shown in banners/alerts.", "default": null, "values": null, "category": "general"},
    "description": {"type": "String|Node|Function|Array", "description": "Component configuration for \"description\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "meta": {"type": "Node|Function|Array", "description": "Component configuration for \"meta\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array|false", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "aside": {"type": "Node|Function|Array", "description": "Content or configuration for the aside/secondary region.", "default": null, "values": null, "category": "general"},
    "dismissible": {"type": "boolean", "description": "Component configuration for \"dismissible\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dismiss": {"type": "Node|Function|Array", "description": "Component configuration for \"dismiss\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "onDismiss": {"type": "function", "description": "Component configuration for \"onDismiss\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "closeLabel": {"type": "string", "description": "Component configuration for \"closeLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "type": {"type": "success|warning|danger|error|info|primary|secondary|light|dark", "description": "Variant or native input type.", "default": null, "values": ["primary", "secondary", "success", "warning", "danger", "info", "light", "dark"], "category": "general"},
    "state": {"type": "success|warning|danger|error|info|primary|secondary|light|dark", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ icon?, title?, message?, description?, meta?, actions?, aside?, dismiss?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array|false", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "icon": {"type": "Leading alert icon content", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "title": {"type": "Alert title content", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "message": {"type": "Primary alert copy", "description": "Slot for message/alert content.", "default": null, "values": null, "category": "slot"},
    "description": {"type": "Secondary/supporting text", "description": "Slot content for \"description\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "meta": {"type": "Inline meta content", "description": "Slot content for \"meta\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Alert actions cluster", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "aside": {"type": "Right side support content", "description": "Slot for aside/secondary content.", "default": null, "values": null, "category": "slot"},
    "dismiss": {"type": "Custom dismiss control", "description": "Slot content for \"dismiss\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback alert message content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Leading alert icon content", "description": "Slot for right-aligned icon content."}
  },
  "returns": "HTMLDivElement",
  "description": "Alert compatto per warning inline, policy note e feedback persistente dentro page o card.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

Alert uses the Header palette/surface contract: `flat`, `border`, `shadow`, `lightShadow`, `glow`, `glossy`, `glass`, `gradient`, `textGradient` and `outline` support the same shared effects. Semantic tone precedence is `type`, then `state`, then `color`; the default is warning. Tone/effect getters are reactive. `size` scales text and the default leading icon; `iconSize` overrides icon sizing. Common spacing, radius and responsive properties apply to the root.

Supporting text and uncolored action/dismiss buttons inherit the surface foreground. Text Gradient affects the title only, with a quiet tinted surface; Light/Dark Glass use dedicated readable foregrounds. Explicit Outline/Border encloses the surface. Dismissal remains cancellable with `event.preventDefault()`, and an explicit `role` takes precedence over the tone-derived alert/status role.
