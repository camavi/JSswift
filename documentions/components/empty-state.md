# EmptyState

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.EmptyState(...children) | _.EmptyState(props, ...children)",
  "props": {
    "dense": {"type": "boolean", "description": "Compact padding, title, icon surface and actions.", "default": false, "values": [true, false], "category": "layout"},
    "gap": {"type": "number|string", "description": "Spacing between content regions.", "default": null, "values": null, "category": "layout"},
    "elevated": {"type": "boolean", "description": "Use Alert medium elevation.", "default": false, "values": [true, false], "category": "style"},
    "iconSize": {"type": "number|string", "description": "Leading icon size override; otherwise uses size or xl.", "default": null, "values": null, "category": "style"},
    "flat": {"type": "boolean", "description": "Remove border and shadow.", "default": false, "values": [true, false], "category": "style"},
    "border": {"type": "boolean", "description": "Draw an explicit contour.", "default": false, "values": [true, false], "category": "style"},
    "glossy": {"type": "boolean", "description": "Apply the shared reflective surface.", "default": false, "values": [true, false], "category": "style"},
    "glow": {"type": "boolean", "description": "Apply the shared colored halo.", "default": false, "values": [true, false], "category": "style"},
    "glass": {"type": "boolean", "description": "Apply the shared translucent surface.", "default": false, "values": [true, false], "category": "style"},
    "gradient": {"type": "boolean", "description": "Apply a palette gradient surface.", "default": false, "values": [true, false], "category": "style"},
    "textGradient": {"type": "boolean", "description": "Apply a gradient to the title only.", "default": false, "values": [true, false], "category": "style"},
    "lightShadow": {"type": "boolean", "description": "Apply shared light shadow treatment.", "default": false, "values": [true, false], "category": "style"},
    "eyebrow": {"type": "String|Node|Function|Array", "description": "Component configuration for \"eyebrow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "message": {"type": "String|Node|Function|Array", "description": "Message text shown in banners/alerts.", "default": null, "values": null, "category": "general"},
    "description": {"type": "String|Node|Function|Array", "description": "Component configuration for \"description\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "meta": {"type": "Node|Function|Array", "description": "Component configuration for \"meta\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array|false", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "illustration": {"type": "Node|Function|Array", "description": "Component configuration for \"illustration\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "media": {"type": "Alias of illustration", "description": "Component configuration for \"media\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "compact": {"type": "boolean", "description": "Component configuration for \"compact\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "inline": {"type": "boolean", "description": "Component configuration for \"inline\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "state": {"type": "primary|secondary|success|warning|danger|info|light|dark", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ illustration?, icon?, eyebrow?, title?, message?, description?, meta?, actions?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array|false", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "illustration": {"type": "Top visual / illustration content", "description": "Slot content for \"illustration\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Leading empty-state icon", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "eyebrow": {"type": "Small kicker content", "description": "Slot content for \"eyebrow\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "title": {"type": "Primary empty-state heading", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "message": {"type": "Primary message content", "description": "Slot for message/alert content.", "default": null, "values": null, "category": "slot"},
    "description": {"type": "Secondary supporting text", "description": "Slot content for \"description\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "meta": {"type": "Meta badges or summary content", "description": "Slot content for \"meta\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Actions cluster", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Extra empty-state body content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Leading empty-state icon", "description": "Slot for right-aligned icon content."}
  },
  "returns": "HTMLElement",
  "description": "Surface per zero-results, onboarding vuoti e pannelli senza dati con CTA di recupero.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

EmptyState uses the approved Alert/Header surface and effect contract, with readable supporting copy and uncolored action buttons. Text Gradient affects only the title. Light/Dark Glass retain dedicated surface/foreground colors. `state` takes precedence over `color`; without either it uses the theme-neutral surface. State/color and effect getters are reactive.

The centered vertical composition remains intact: `compact` reduces its padding/gap; `inline` uses smaller insets; `dense` also tightens title, icon surface and action buttons. `size` scales text and the default leading icon; `iconSize` overrides that icon. `gap`, `radius`, root spacing/dimensions and responsive overrides are supported. Illustration/media, icon:false, content slots, default children and reactive messages/actions remain available.
