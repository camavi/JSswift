# Time

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Time(props)",
  "props": {
    "value": {"type": "string|Date", "description": "Current value (controlled).", "default": null, "values": null, "category": "data"},
    "model": {"type": "rod | [get,set] signal", "description": "Two-way bound value (alias to value in some components).", "default": null, "values": null, "category": "data"},
    "min": {"type": "string", "description": "Minimum value for range-based controls.", "default": null, "values": null, "category": "general"},
    "max": {"type": "string", "description": "Maximum value for range-based controls.", "default": null, "values": null, "category": "general"},
    "minuteStep": {"type": "number", "description": "Component configuration for \"minuteStep\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "secondStep": {"type": "number", "description": "Component configuration for \"secondStep\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "withSeconds": {"type": "boolean", "description": "Component configuration for \"withSeconds\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "manualInput": {"type": "boolean", "description": "Component configuration for \"manualInput\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "clearable": {"type": "boolean", "description": "Shows a clear action to reset the current value.", "default": null, "values": null, "category": "general"},
    "confirm": {"type": "boolean", "description": "Component configuration for \"confirm\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "pointIcon": {"type": "String|Node|Function|Array", "description": "Component configuration for \"pointIcon\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "shortcuts": {"type": "Array<{ label, value }>", "description": "Component configuration for \"shortcuts\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "name": {"type": "string", "description": "HTML name attribute for form submission.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "option": {"type": "Renderer for a time option ({ part, value, label, selected, timeValue })", "description": "Slot for custom option rendering.", "default": null, "values": null, "category": "slot"},
    "point": {"type": "Point/icon in the selected time option", "description": "Slot content for \"point\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "shortcut": {"type": "Shortcut renderer", "description": "Slot content for \"shortcut\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "value": {"type": "Footer value renderer ({ value, displayValue })", "description": "Slot content for \"value\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "data"},
    "label": {"type": "Floating label", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "topLabel": {"type": "Top label", "description": "Slot for top label content.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Left icon", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "iconRight": {"type": "Right icon", "description": "Slot for right-aligned icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "default": {"type": "Fallback value content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "events": {
    "onChange": "(value, event)",
    "onInput": "(value, event)",
    "onOpen": "void",
    "onClose": "void"
  },
  "returns": "HTMLDivElement (field wrapper) con ._input, ._open(), ._close(), ._getValue(), ._setValue(value)",
  "description": "Reactive time picker with fixed overlay, label/icon slots, point icon, shortcuts, confirm, and model.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```


Readonly/disabled blocks keyboard deletion, manual commits and time actions. Programmatic model updates remain available. JSswift lifecycle cleanup removes model/render subscriptions and closes the field’s overlay without disposing caller-owned models.
