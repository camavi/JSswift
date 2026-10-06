# Item

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Item(...children) | _.Item(props, ...children)",
  "props": {
    "shadow": {"type": "boolean|string", "description": "Shadow token or CSS box-shadow string applied to the component.", "default": null, "values": ["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "style"},
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "subtitle": {"type": "String|Node|Function|Array", "description": "Subtitle text or node.", "default": null, "values": null, "category": "general"},
    "meta": {"type": "String|Node|Function|Array", "description": "Component configuration for \"meta\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "body": {"type": "String|Node|Function|Array", "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "aside": {"type": "Node|Function|Array", "description": "Content or configuration for the aside/secondary region.", "default": null, "values": null, "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "to": {"type": "string", "description": "Navigation target/route to open on click.", "default": null, "values": null, "category": "general"},
    "active": {"type": "boolean", "description": "Marks the item as active/selected and applies active styling/ARIA when relevant.", "default": null, "values": null, "category": "state"},
    "selected": {"type": "boolean", "description": "Component configuration for \"selected\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "disabled": {"type": "boolean", "description": "Disables interaction and applies disabled styling/ARIA.", "default": false, "values": null, "category": "state"},
    "state": {"type": "Alias of color", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "lightShadow": {"type": "boolean", "description": "Component configuration for \"lightShadow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "border": {"type": "boolean", "description": "Component configuration for \"border\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "glossy": {"type": "boolean", "description": "Component configuration for \"glossy\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "glow": {"type": "boolean", "description": "Component configuration for \"glow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "glass": {"type": "boolean", "description": "Component configuration for \"glass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "gradient": {"type": "boolean|number", "description": "Component configuration for \"gradient\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "textGradient": {"type": "boolean", "description": "Component configuration for \"textGradient\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "divider": {"type": "boolean", "description": "Shows dividers between items or sections.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ icon?, title?, subtitle?, meta?, body?, aside?, actions?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "icon": {"type": "Leading visual/icon", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "title": {"type": "Main title content", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "subtitle": {"type": "Secondary text", "description": "Slot for subtitle content.", "default": null, "values": null, "category": "slot"},
    "meta": {"type": "Top meta content", "description": "Slot content for \"meta\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "body": {"type": "Body content", "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "aside": {"type": "Trailing content", "description": "Slot for aside/secondary content.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Actions row", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback body content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Leading visual/icon", "description": "Slot for right-aligned icon content."}
  },
  "returns": "HTMLLIElement",
  "description": "Structured item for simple lists, feeds, task lists, and clickable rows.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "mobile", "tablet", "pc", "class", "style"]}
}
```
