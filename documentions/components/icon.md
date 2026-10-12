# Icon

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Icon(name) | _.Icon(props) | _.Icon(props, ...children)",
  "props": {
    "size": {"type": "number|string", "description": "Size token, number, or CSS length for sizing.", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "style"},
    "fill": {"type": "boolean", "description": "Use the filled Google Material Symbols glyph (FILL axis 1); false uses axis 0. Accepts a reactive getter. Does not alter SVG sprites or custom content.", "default": false, "values": [true, false], "category": "style"},
    "dense": {"type": "boolean", "description": "Compact icon: renders at 75% of the configured size with centered content and no outer margin.", "default": false, "values": [true, false], "category": "layout"},
    "radius": {"type": "number|string", "description": "Border radius token or CSS length applied to the component.", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "style"},
    "shadow": {"type": "boolean|string", "description": "Shadow token or CSS box-shadow string applied to the component.", "default": null, "values": ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "style"},
    "name": {"type": "string|Node|Function", "description": "HTML name attribute for form submission.", "default": null, "values": null, "category": "general"},
    "lightShadow": {"type": "boolean", "description": "Component configuration for \"lightShadow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "border": {"type": "boolean", "description": "Component configuration for \"border\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "glossy": {"type": "boolean", "description": "Component configuration for \"glossy\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "glow": {"type": "boolean", "description": "Component configuration for \"glow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "glass": {"type": "boolean", "description": "Component configuration for \"glass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "gradient": {"type": "boolean|number", "description": "Component configuration for \"gradient\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "textGradient": {"type": "boolean", "description": "Component configuration for \"textGradient\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "default": {"type": "Custom icon content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLSpanElement",
  "description": "Sprite- or text-based icon with configurable size/color.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "borderRadius", "mobile", "tablet", "pc", "class", "style"]}
}
```

Icon effects: `outline` colors the glyph without an outer border; `border: true` explicitly adds a visible 1px border. Glass uses the selected palette color for its glyph and translucent surface. Light and dark glyphs remain distinct. Boolean shadow and glow are sized for icons; explicit shadow tokens/strings retain their own styling.

```js
_.Icon({ name: "home", fill: true, color: "primary", size: 32 });
```
Requires the optional `fonts-material.css` (Material Symbols font with a variable FILL axis). `fill` changes the glyph, independently of visual effects such as `outline`, `glass` and `glow`. Existing SVG `-fill` names retain their behavior.
