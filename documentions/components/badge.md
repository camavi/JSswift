# Badge

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Badge(...children) | _.Badge(props, ...children)",
  "props": {
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "notification": {"type": "string|number|Node|Function|[get,set] signal", "description": "Component configuration for \"notification\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "iconSize": {"type": "string|number", "description": "Component configuration for \"iconSize\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "topLeft": {"type": "String|Node|Function|Array", "description": "Component configuration for \"topLeft\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "topRight": {"type": "String|Node|Function|Array", "description": "Component configuration for \"topRight\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "bottomLeft": {"type": "String|Node|Function|Array", "description": "Component configuration for \"bottomLeft\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "bottomRight": {"type": "String|Node|Function|Array", "description": "Component configuration for \"bottomRight\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "centerLeft": {"type": "String|Node|Function|Array", "description": "Component configuration for \"centerLeft\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "centerRight": {"type": "String|Node|Function|Array", "description": "Component configuration for \"centerRight\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "left": {"type": "String|Node|Function|Array", "description": "Content or configuration for the left region.", "default": null, "values": null, "category": "general"},
    "right": {"type": "String|Node|Function|Array", "description": "Content or configuration for the right region.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ label?, default?, notification?, topLeft?, topRight?, bottomLeft?, bottomRight?, left?, right? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "label": {"type": "Badge label content", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "notification": {"type": "Notification badge content", "description": "Slot content for \"notification\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "topLeft": {"type": "Icon anchored top-left", "description": "Slot content for \"topLeft\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "topRight": {"type": "Icon anchored top-right", "description": "Slot content for \"topRight\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "bottomLeft": {"type": "Icon anchored bottom-left", "description": "Slot content for \"bottomLeft\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "bottomRight": {"type": "Icon anchored bottom-right", "description": "Slot content for \"bottomRight\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "centerLeft": {"type": "Icon anchored center-left", "description": "Slot content for \"centerLeft\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "centerRight": {"type": "Icon anchored center-right", "description": "Slot content for \"centerRight\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "left": {"type": "Icon anchored left", "description": "Slot for left-aligned content.", "default": null, "values": null, "category": "slot"},
    "right": {"type": "Icon anchored right", "description": "Slot for right-aligned content.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLSpanElement",
  "description": "Inline badge with reactive notification and 6 positionable icon slots.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
