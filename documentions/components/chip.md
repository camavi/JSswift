# Chip

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Chip(...children) | _.Chip(props, ...children)",
  "props": {
    "outline": {"type": "boolean|string|number", "description": "Uses outlined visual style.", "default": false, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "style"},
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "removable": {"type": "boolean", "description": "Shows a remove affordance for chips/items.", "default": null, "values": null, "category": "general"},
    "onRemove": {"type": "function", "description": "Callback fired when an item is removed.", "default": null, "values": null, "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "slots": {"type": "{ icon?, label?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "icon": {"type": "Chip icon content", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "iconRight": {"type": "Chip right icon content", "description": "Slot for right-aligned icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "label": {"type": "Chip label content", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "events": {
    "onRemove": "MouseEvent"
  },
  "returns": "HTMLSpanElement",
  "description": "Chip with optional icon and removal.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
