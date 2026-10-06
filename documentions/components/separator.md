# Separator

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Separator() | _.Separator(props)",
  "props": {
    "vertical": {"type": "boolean", "description": "Vertical orientation instead of horizontal.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "default": {"type": "Unused (separator has no content)", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLHRElement",
  "description": "Separatore orizzontale o verticale.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
