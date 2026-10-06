# Slider

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Slider(...children) | _.Slider(props, ...children)",
  "props": {
    "min": {"type": "number", "description": "Minimum value for range-based controls.", "default": null, "values": null, "category": "general"},
    "max": {"type": "number", "description": "Maximum value for range-based controls.", "default": null, "values": null, "category": "general"},
    "step": {"type": "number|\"any\"", "description": "Step increment for numeric controls.", "default": null, "values": null, "category": "general"},
    "value": {"type": "number | rod | [get,set] signal", "description": "Current value (controlled).", "default": null, "values": null, "category": "data"},
    "model": {"type": "rod | [get,set] signal", "description": "Two-way bound value (alias to value in some components).", "default": null, "values": null, "category": "data"},
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "thumbIcon": {"type": "String|Node|Function|Array", "description": "Component configuration for \"thumbIcon\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "iconThumb": {"type": "Alias of thumbIcon", "description": "Component configuration for \"iconThumb\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "pointIcon": {"type": "Alias of thumbIcon", "description": "Component configuration for \"pointIcon\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "thumbLabel": {"type": "String|Node|Function|Array", "description": "Component configuration for \"thumbLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "showValue": {"type": "boolean", "description": "Component configuration for \"showValue\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "labelValue": {"type": "String|Node|Function|Array", "description": "Component configuration for \"labelValue\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "markers": {"type": "boolean|number|Array|Object", "description": "Component configuration for \"markers\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "markerLabels": {"type": "boolean", "description": "Component configuration for \"markerLabels\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "labelMarks": {"type": "Alias of markerLabels", "description": "Component configuration for \"labelMarks\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "startLabel": {"type": "String|Node|Function|Array", "description": "Component configuration for \"startLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "endLabel": {"type": "String|Node|Function|Array", "description": "Component configuration for \"endLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "leftLabel": {"type": "Alias of startLabel", "description": "Component configuration for \"leftLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "rightLabel": {"type": "Alias of endLabel", "description": "Component configuration for \"rightLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "minLabel": {"type": "Alias of startLabel", "description": "Component configuration for \"minLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "maxLabel": {"type": "Alias of endLabel", "description": "Component configuration for \"maxLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "withQItem": {"type": "boolean", "description": "Component configuration for \"withQItem\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "qitem": {"type": "Alias of withQItem", "description": "Component configuration for \"qitem\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "item": {"type": "boolean", "description": "Component configuration for \"item\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "itemClass": {"type": "string", "description": "Component configuration for \"itemClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "itemStyle": {"type": "object", "description": "Component configuration for \"itemStyle\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "selectionColor": {"type": "string", "description": "Component configuration for \"selectionColor\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "trackColor": {"type": "string", "description": "Component configuration for \"trackColor\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "thumbColor": {"type": "string", "description": "Component configuration for \"thumbColor\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "readonly": {"type": "boolean", "description": "Prevents editing while keeping focus and selection.", "default": false, "values": null, "category": "state"},
    "inputClass": {"type": "string", "description": "Component configuration for \"inputClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ label?, default?, value?, icon?, iconRight?, thumbIcon?, thumbLabel?, marker?, markerLabel?, startLabel?, endLabel? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "label": {"type": "Label content", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback label content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "value": {"type": "Header value content", "description": "Slot content for \"value\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "data"},
    "icon": {"type": "Left icon content", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "iconRight": {"type": "Right icon content", "description": "Slot for right-aligned icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "thumbIcon": {"type": "Thumb icon content", "description": "Slot content for \"thumbIcon\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "thumbLabel": {"type": "Thumb label content", "description": "Slot content for \"thumbLabel\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "marker": {"type": "Marker content", "description": "Slot content for \"marker\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "markerLabel": {"type": "Marker label content", "description": "Slot content for \"markerLabel\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "startLabel": {"type": "Label on the left/start of the track", "description": "Slot content for \"startLabel\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "endLabel": {"type": "Label on the right/end of the track", "description": "Slot content for \"endLabel\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"}
  },
  "events": {
    "onChange": "(value, event)",
    "onInput": "(value, event)"
  },
  "returns": "HTMLLabelElement | HTMLLIElement (with ._input = HTMLInputElement)",
  "description": "Reactive slider with label, icons, custom thumb, markers, and model/QItem support.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
