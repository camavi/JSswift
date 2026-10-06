# Notify

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Notify(message, title?, opts?) | _.Notify(opts, ...children)",
  "props": {
    "color": {"type": "Alias of type", "description": "Semantic color name used to style the component.", "default": null, "values": ["primary", "secondary", "success", "warning", "danger", "info", "light", "dark"], "category": "style"},
    "id": {"type": "string", "description": "Component configuration for \"id\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "type": {"type": "success|warning|danger|error|info|primary|secondary|light|dark", "description": "Variant or native input type.", "default": null, "values": ["primary", "secondary", "success", "warning", "danger", "info", "light", "dark"], "category": "general"},
    "state": {"type": "Alias of type", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "title": {"type": "String|Node|Function|Array|false", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "message": {"type": "String|Node|Function|Array", "description": "Message text shown in banners/alerts.", "default": null, "values": null, "category": "general"},
    "description": {"type": "String|Node|Function|Array", "description": "Component configuration for \"description\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "meta": {"type": "String|Node|Function|Array", "description": "Component configuration for \"meta\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "body": {"type": "Node|Function|Array", "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array|false", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "dismiss": {"type": "Node|Function|Array", "description": "Component configuration for \"dismiss\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "timeout": {"type": "number|false", "description": "Component configuration for \"timeout\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "duration": {"type": "Alias of timeout", "description": "Component configuration for \"duration\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "closable": {"type": "boolean", "description": "Component configuration for \"closable\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dismissLabel": {"type": "string", "description": "Component configuration for \"dismissLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "position": {"type": "top-left|top-center|top-right|bottom-left|bottom-center|bottom-right", "description": "Component configuration for \"position\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "variant": {"type": "soft|solid|outline", "description": "Component configuration for \"variant\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ icon?, title?, message?, description?, meta?, actions?, dismiss?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array|false", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "icon": {"type": "Leading visual/icon content", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "title": {"type": "Toast title content", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "message": {"type": "Primary message content", "description": "Slot for message/alert content.", "default": null, "values": null, "category": "slot"},
    "description": {"type": "Secondary/supporting text", "description": "Slot content for \"description\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "meta": {"type": "Meta info or badges", "description": "Slot content for \"meta\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Actions area content", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "dismiss": {"type": "Custom dismiss control", "description": "Slot content for \"dismiss\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Extra body content under the message", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Leading visual/icon content", "description": "Slot for right-aligned icon content."}
  },
  "methods": {"show": "Alias of _.Notify(...)", "success": "_.Notify.success(message|opts, title?)", "error": "_.Notify.error(message|opts, title?)", "warning": "_.Notify.warning(message|opts, title?)", "info": "_.Notify.info(message|opts, title?)", "update": "_.Notify.update(id, patch)", "remove": "_.Notify.remove(id)", "clear": "_.Notify.clear()", "promise": "_.Notify.promise(promise|fn, { loading?, success?, error? })"},
  "returns": "string|null (toast id)",
  "description": "Standardized notify service with structured payloads, semantic shortcuts, update/remove/clear, and promise support.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
