# List

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.List(...children) | _.List(props, ...children)",
  "props": {
    "items": {"type": "Array<Node|Object|string>", "description": "Array of items or nodes to render.", "default": null, "values": null, "category": "data"},
    "ordered": {"type": "boolean", "description": "Component configuration for \"ordered\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "number": {"type": "boolean", "description": "Forces numeric input/formatting where supported.", "default": null, "values": null, "category": "general"},
    "marker": {"type": "boolean|string", "description": "Component configuration for \"marker\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "divider": {"type": "boolean", "description": "Shows dividers between items or sections.", "default": null, "values": null, "category": "general"},
    "gap": {"type": "string|number", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "empty": {"type": "String|Node|Function|Array", "description": "Component configuration for \"empty\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "itemClass": {"type": "string", "description": "Component configuration for \"itemClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "itemStyle": {"type": "object", "description": "Component configuration for \"itemStyle\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "itemProps": {"type": "object", "description": "Component configuration for \"itemProps\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ default?, item?, empty? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "default": {"type": "List content fallback", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "item": {"type": "Render custom di ogni item ({ item, index, count, first, last })", "description": "Slot for custom item rendering.", "default": null, "values": null, "category": "slot"},
    "empty": {"type": "Empty state content", "description": "Slot for empty-state content.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLUListElement|HTMLOListElement",
  "description": "Lista dichiarativa con supporto items, slot item, ordered/marker ed empty state.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

Colored lists use a subtle theme surface tint with readable theme text and accent-colored markers/dividers. Uncolored lists follow the theme background. Dense reduces spacing; Flat removes the surface; Outline uses a transparent surface with an accent border.

Size tokens adjust font size, padding and item gaps. Numeric or CSS-length size sets the font size; items inherit it.
