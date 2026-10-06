# Tooltip

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Tooltip(props, target?) | _.Tooltip(target, content)",
  "props": {
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "content": {"type": "String|Node|Function|Array", "description": "Main content node(s) or render function for the component body.", "default": null, "values": null, "category": "general"},
    "text": {"type": "String|Node|Function|Array", "description": "Text content for simple components.", "default": null, "values": null, "category": "general"},
    "body": {"type": "String|Node|Function|Array", "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "footer": {"type": "String|Node|Function|Array", "description": "Footer content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "target": {"type": "Node|Function|Array", "description": "Target element or anchor used for positioning.", "default": null, "values": null, "category": "general"},
    "trigger": {"type": "\"hover focus\" | \"click\" | \"manual\" | Array", "description": "Component configuration for \"trigger\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "interactive": {"type": "boolean", "description": "Component configuration for \"interactive\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "disabled": {"type": "boolean", "description": "Disables interaction and applies disabled styling/ARIA.", "default": false, "values": null, "category": "state"},
    "open": {"type": "boolean | reactive", "description": "Controls open/visible state (controlled).", "default": null, "values": null, "category": "general"},
    "placement": {"type": "string", "description": "Overlay placement relative to the target/anchor.", "default": null, "values": ["top", "bottom", "left", "right", "top-start", "top-end", "bottom-start", "bottom-end"], "category": "general"},
    "delay": {"type": "number", "description": "Delay in milliseconds before showing or hiding.", "default": null, "values": null, "category": "general"},
    "hideDelay": {"type": "number", "description": "Component configuration for \"hideDelay\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "offset": {"type": "number (legacy)", "description": "General offset for positioning.", "default": null, "values": null, "category": "general"},
    "offsetX": {"type": "number", "description": "Horizontal offset for overlay placement in pixels.", "default": null, "values": null, "category": "general"},
    "offsetY": {"type": "number", "description": "Vertical offset for overlay placement in pixels.", "default": null, "values": null, "category": "general"},
    "closeOnOutside": {"type": "boolean", "description": "Closes the component when clicking outside its bounds.", "default": null, "values": null, "category": "general"},
    "closeOnEsc": {"type": "boolean", "description": "Closes the component when the Escape key is pressed.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ target?, icon?, title?, content?, footer?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "panelClass": {"type": "string", "description": "Component configuration for \"panelClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "wrapClass": {"type": "string", "description": "Additional CSS classes applied to the outer wrapper.", "default": null, "values": null, "category": "general"},
    "targetStyle": {"type": "object", "description": "Component configuration for \"targetStyle\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "target": {"type": "Tooltip trigger content ({ open, show, hide, toggle, isOpen })", "description": "Slot for custom target/anchor element.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Tooltip icon content", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "title": {"type": "Tooltip title content", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "content": {"type": "Tooltip body content ({ close, hide, isOpen, anchorEl })", "description": "Slot for the main body content.", "default": null, "values": null, "category": "slot"},
    "footer": {"type": "Tooltip footer content ({ close, hide, isOpen, anchorEl })", "description": "Slot for footer content.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback tooltip body content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Tooltip icon content", "description": "Slot for right-aligned icon content."}
  },
  "events": {
    "onOpen": "(entry) => void",
    "onClose": "() => void",
    "onTriggerClick": "(event) => void"
  },
  "returns": "Object { bind(), open(), show(), hide(), close(), toggle(), isOpen() } | HTMLSpanElement",
  "description": "Anchored tooltip with hover/focus/click triggers, rich content, and imperative API.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
