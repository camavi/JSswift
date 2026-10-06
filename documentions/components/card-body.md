# cardBody

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.cardBody(...children) | _.cardBody(props, ...children)",
  "props": {
    "mobile": {"type": "{ padding?, gap?, direction?, width? }", "description": "Responsive overrides applied at the base/mobile viewport.", "default": null, "values": null, "category": "layout"},
    "tablet": {"type": "{ padding?, gap?, direction?, width? }", "description": "Responsive overrides applied from the tablet breakpoint upward.", "default": null, "values": null, "category": "layout"},
    "pc": {"type": "{ padding?, gap?, direction?, width? }", "description": "Responsive overrides applied from the desktop breakpoint upward.", "default": null, "values": null, "category": "layout"},
    "gap": {"type": "string|number", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "direction": {"type": "row|column|string", "description": "Component configuration for \"direction\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "default": {"type": "Card body content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLDivElement",
  "description": "Body della card.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "class", "style"]}
}
```
