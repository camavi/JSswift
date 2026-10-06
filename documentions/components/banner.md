# Banner

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Banner(...children) | _.Banner(props, ...children)",
  "props": {
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "message": {"type": "String|Node|Function|Array", "description": "Message text shown in banners/alerts.", "default": null, "values": null, "category": "general"},
    "description": {"type": "String|Node|Function|Array", "description": "Component configuration for \"description\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "meta": {"type": "String|Node|Function|Array", "description": "Component configuration for \"meta\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array|false", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "aside": {"type": "Node|Function|Array", "description": "Content or configuration for the aside/secondary region.", "default": null, "values": null, "category": "general"},
    "body": {"type": "Node|Function|Array", "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dismissible": {"type": "boolean", "description": "Component configuration for \"dismissible\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dismiss": {"type": "Node|Function|Array", "description": "Component configuration for \"dismiss\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "onDismiss": {"type": "function", "description": "Component configuration for \"onDismiss\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "closeLabel": {"type": "string", "description": "Component configuration for \"closeLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "type": {"type": "success|warning|danger|error|info|primary|secondary|light|dark", "description": "Variant or native input type.", "default": null, "values": ["primary", "secondary", "success", "warning", "danger", "info", "light", "dark"], "category": "general"},
    "state": {"type": "success|warning|danger|error|info|primary|secondary|light|dark", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "accent": {"type": "string", "description": "Component configuration for \"accent\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "variant": {"type": "soft|solid|outline|ghost", "description": "Component configuration for \"variant\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "actionsPlacement": {"type": "end|bottom", "description": "Component configuration for \"actionsPlacement\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "stack": {"type": "boolean", "description": "Component configuration for \"stack\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ icon?, title?, message?, description?, meta?, actions?, aside?, dismiss?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array|false", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "icon": {"type": "Leading visual/icon content", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "title": {"type": "Banner title content", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "message": {"type": "Primary message content", "description": "Slot for message/alert content.", "default": null, "values": null, "category": "slot"},
    "description": {"type": "Secondary/supporting text", "description": "Slot content for \"description\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "meta": {"type": "Meta information content", "description": "Slot content for \"meta\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Actions area content", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "aside": {"type": "Right side support content", "description": "Slot for aside/secondary content.", "default": null, "values": null, "category": "slot"},
    "dismiss": {"type": "Custom dismiss control", "description": "Slot content for \"dismiss\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Extra banner body content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Leading visual/icon content", "description": "Slot for right-aligned icon content."}
  },
  "returns": "HTMLDivElement",
  "description": "Structured banner with tone, actions, dismiss, and composable slots.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
