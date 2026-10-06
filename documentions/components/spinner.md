# Spinner

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Spinner(...children) | _.Spinner(props, ...children)",
  "props": {
    "size": {"type": "number|string", "description": "Size token, number, or CSS length for sizing.", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "style"},
    "thickness": {"type": "number|string", "description": "Stroke/line thickness for progress indicators.", "default": null, "values": null, "category": "general"},
    "trackColor": {"type": "string", "description": "Component configuration for \"trackColor\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "speed": {"type": "number|string", "description": "Animation speed or duration in milliseconds.", "default": null, "values": null, "category": "general"},
    "state": {"type": "primary|secondary|success|warning|danger|info|light|dark", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "note": {"type": "String|Node|Function|Array", "description": "Secondary note text.", "default": null, "values": null, "category": "state"},
    "vertical": {"type": "boolean", "description": "Vertical orientation instead of horizontal.", "default": null, "values": null, "category": "general"},
    "reverse": {"type": "boolean", "description": "Component configuration for \"reverse\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "center": {"type": "boolean", "description": "Component configuration for \"center\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "block": {"type": "boolean", "description": "Component configuration for \"block\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "pause": {"type": "boolean", "description": "Component configuration for \"pause\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "paused": {"type": "boolean", "description": "Component configuration for \"paused\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "ariaLabel": {"type": "string", "description": "Component configuration for \"ariaLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "indicatorClass": {"type": "string", "description": "Component configuration for \"indicatorClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "indicatorStyle": {"type": "object", "description": "Component configuration for \"indicatorStyle\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ indicator?, label?, note?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "indicator": {"type": "Custom spinner indicator", "description": "Slot content for \"indicator\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "label": {"type": "Primary label/content near the spinner", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "note": {"type": "Secondary supporting text", "description": "Slot for note/secondary text.", "default": null, "values": null, "category": "state"},
    "default": {"type": "Extra content rendered near the spinner", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLDivElement",
  "description": "Animated spinner with flexible layout, optional content, and controls for size, speed, and track.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
