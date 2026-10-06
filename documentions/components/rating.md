# Rating

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Rating(...children) | _.Rating(props, ...children)",
  "props": {
    "max": {"type": "number", "description": "Maximum value for range-based controls.", "default": null, "values": null, "category": "general"},
    "value": {"type": "number | rod | [get,set] signal", "description": "Current value (controlled).", "default": null, "values": null, "category": "data"},
    "model": {"type": "rod | [get,set] signal", "description": "Two-way bound value (alias to value in some components).", "default": null, "values": null, "category": "data"},
    "name": {"type": "string", "description": "HTML name attribute for form submission.", "default": null, "values": null, "category": "general"},
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "clearable": {"type": "boolean", "description": "Shows a clear action to reset the current value.", "default": null, "values": null, "category": "general"},
    "half": {"type": "boolean", "description": "Component configuration for \"half\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "allowHalf": {"type": "Alias of half", "description": "Component configuration for \"allowHalf\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "noDimming": {"type": "boolean", "description": "Component configuration for \"noDimming\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "readonly": {"type": "boolean", "description": "Prevents editing while keeping focus and selection.", "default": false, "values": null, "category": "state"},
    "disabled": {"type": "boolean", "description": "Disables interaction and applies disabled styling/ARIA.", "default": false, "values": null, "category": "state"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "iconSelected": {"type": "Alias of checkedIcon", "description": "Component configuration for \"iconSelected\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "checkedIcon": {"type": "String|Node|Function|Array", "description": "Component configuration for \"checkedIcon\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "uncheckedIcon": {"type": "String|Node|Function|Array", "description": "Component configuration for \"uncheckedIcon\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "iconHalf": {"type": "Alias of halfIcon", "description": "Component configuration for \"iconHalf\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "halfIcon": {"type": "String|Node|Function|Array", "description": "Component configuration for \"halfIcon\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "iconHovered": {"type": "Alias of hoveredIcon", "description": "Component configuration for \"iconHovered\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "hoveredIcon": {"type": "String|Node|Function|Array", "description": "Component configuration for \"hoveredIcon\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "colorSelected": {"type": "string", "description": "Component configuration for \"colorSelected\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "colorHalf": {"type": "string", "description": "Component configuration for \"colorHalf\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "colorHovered": {"type": "string", "description": "Component configuration for \"colorHovered\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "colorInactive": {"type": "string", "description": "Component configuration for \"colorInactive\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "iconSize": {"type": "string|number", "description": "Component configuration for \"iconSize\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "gap": {"type": "string|number", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ label?, icon?, checkedIcon?, uncheckedIcon?, halfIcon?, hoveredIcon?, item?, star? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "label": {"type": "Label content", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Base icon content per item", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "checkedIcon": {"type": "Icon when item is selected", "description": "Slot content for \"checkedIcon\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "uncheckedIcon": {"type": "Icon when item is empty", "description": "Slot content for \"uncheckedIcon\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "halfIcon": {"type": "Icon when item is half-selected", "description": "Slot content for \"halfIcon\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "hoveredIcon": {"type": "Icon while hovering selected items", "description": "Slot content for \"hoveredIcon\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "item": {"type": "Custom item renderer", "description": "Slot for custom item rendering.", "default": null, "values": null, "category": "slot"},
    "star": {"type": "Alias of item/icon", "description": "Slot for custom star icon/content in rating.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Base icon content per item", "description": "Slot for right-aligned icon content."}
  },
  "events": {
    "onChange": "(value, event)",
    "onInput": "(value, event)",
    "onHover": "(value, event)"
  },
  "keyboard": ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter", "Space", "Delete", "Backspace", "0"],
  "returns": "HTMLLabelElement (with ._input, ._rating, ._getValue(), ._setValue(value))",
  "description": "Reactive rating with label, custom icons, half rating, clearable behavior, and model support.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
