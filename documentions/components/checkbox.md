# Checkbox

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Checkbox(...children) | _.Checkbox(props, ...children)",
  "props": {
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "checked": {"type": "boolean|null", "description": "Checked state for toggleable controls (controlled).", "default": null, "values": null, "category": "general"},
    "model": {"type": "[get,set] signal", "description": "Two-way bound value (alias to value in some components).", "default": null, "values": null, "category": "data"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "iconOn": {"type": "Alias of icon/checkedIcon", "description": "Component configuration for \"iconOn\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "iconOff": {"type": "Alias of uncheckedIcon", "description": "Component configuration for \"iconOff\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "iconStandby": {"type": "Icon for null/indeterminate state", "description": "Component configuration for \"iconStandby\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "checkedIcon": {"type": "String|Node|Function|Array", "description": "Component configuration for \"checkedIcon\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "uncheckedIcon": {"type": "String|Node|Function|Array", "description": "Component configuration for \"uncheckedIcon\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "shortcode": {"type": "string|Array<string>|object", "description": "Keyboard shortcut string, object, or array bound to the component action.", "default": null, "values": null, "category": "general"},
    "showShortcode": {"type": "boolean", "description": "Displays the configured keyboard shortcut badge when the component supports it.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ label?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "label": {"type": "Checkbox label", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Base icon content", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "iconStandby": {"type": "Slot for null/indeterminate icon", "description": "Slot content for \"iconStandby\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "checkedIcon": {"type": "Icon when checked", "description": "Slot content for \"checkedIcon\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "uncheckedIcon": {"type": "Icon when unchecked", "description": "Slot content for \"uncheckedIcon\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback label content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Base icon content", "description": "Slot for right-aligned icon content."}
  },
  "events": {
    "onChange": "(checked|null, event)",
    "onInput": "(checked|null, event)"
  },
  "returns": "HTMLLabelElement",
  "description": "Checkbox con label e supporto model.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
