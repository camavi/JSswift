# Progress

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Progress(...children) | _.Progress(props, ...children)",
  "props": {
    "value": {"type": "number|rod|[get,set] signal", "description": "Current value (controlled).", "default": null, "values": null, "category": "data"},
    "model": {"type": "rod|[get,set] signal", "description": "Two-way bound value (alias to value in some components).", "default": null, "values": null, "category": "data"},
    "min": {"type": "number", "description": "Minimum value for range-based controls.", "default": null, "values": null, "category": "general"},
    "max": {"type": "number", "description": "Maximum value for range-based controls.", "default": null, "values": null, "category": "general"},
    "buffer": {"type": "number|rod|[get,set] signal", "description": "Component configuration for \"buffer\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "note": {"type": "String|Node|Function|Array", "description": "Secondary note text.", "default": null, "values": null, "category": "state"},
    "showValue": {"type": "boolean|\"inside\"", "description": "Component configuration for \"showValue\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "valueLabel": {"type": "String|Node|Function|Array", "description": "Component configuration for \"valueLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "insideLabel": {"type": "String|Node|Function|Array", "description": "Component configuration for \"insideLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "formatValue": {"type": "function(value, percent, ctx)", "description": "Component configuration for \"formatValue\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "startLabel": {"type": "String|Node|Function|Array", "description": "Component configuration for \"startLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "endLabel": {"type": "String|Node|Function|Array", "description": "Component configuration for \"endLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "leftLabel": {"type": "Alias of startLabel", "description": "Component configuration for \"leftLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "rightLabel": {"type": "Alias of endLabel", "description": "Component configuration for \"rightLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "thickness": {"type": "Alias of height", "description": "Stroke/line thickness for progress indicators.", "default": null, "values": null, "category": "general"},
    "state": {"type": "primary|secondary|success|warning|danger|info|light|dark", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "trackColor": {"type": "string", "description": "Component configuration for \"trackColor\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "bufferColor": {"type": "string", "description": "Component configuration for \"bufferColor\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "striped": {"type": "boolean", "description": "Applies striped row styling.", "default": null, "values": null, "category": "general"},
    "animated": {"type": "boolean", "description": "Component configuration for \"animated\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "indeterminate": {"type": "boolean", "description": "Component configuration for \"indeterminate\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "reverse": {"type": "boolean", "description": "Component configuration for \"reverse\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ icon?, label?, note?, value?, inside?, startLabel?, endLabel?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "icon": {"type": "Icon before the label", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "label": {"type": "Main progress content", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "note": {"type": "Secondary content below the label", "description": "Slot for note/secondary text.", "default": null, "values": null, "category": "state"},
    "value": {"type": "External value on the right", "description": "Slot content for \"value\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "data"},
    "inside": {"type": "Content inside the bar", "description": "Slot content for \"inside\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "startLabel": {"type": "Label on the left of the bar", "description": "Slot content for \"startLabel\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "endLabel": {"type": "Label on the right of the bar", "description": "Slot content for \"endLabel\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback label content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Icon before the label", "description": "Slot for right-aligned icon content."}
  },
  "returns": "HTMLDivElement",
  "description": "Standardized progress bar with optional header, buffer, semantic state, and reactive support.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
