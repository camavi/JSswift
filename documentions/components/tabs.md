# Tabs

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Tabs(props) | _.Tabs(props, ...children)",
  "props": {
    "tabs": {"type": "Array<{ value|name|id|key, label|title, note|subtitle|description, icon, badge|counter, disabled, hidden, onClick }>", "description": "Tab definitions array.", "default": null, "values": null, "category": "general"},
    "items": {"type": "Alias of tabs", "description": "Array of items or nodes to render.", "default": null, "values": null, "category": "data"},
    "value": {"type": "any", "description": "Current value (controlled).", "default": null, "values": null, "category": "data"},
    "defaultValue": {"type": "any", "description": "Component configuration for \"defaultValue\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "default": {"type": "Alias of defaultValue", "description": "Component configuration for \"default\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "model": {"type": "[get,set] signal", "description": "Two-way bound value (alias to value in some components).", "default": null, "values": null, "category": "data"},
    "orientation": {"type": "horizontal|vertical", "description": "Component configuration for \"orientation\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "variant": {"type": "line|pills|soft", "description": "Component configuration for \"variant\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "fill": {"type": "boolean", "description": "Component configuration for \"fill\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "wrap": {"type": "boolean", "description": "Allows children to wrap to new lines.", "default": null, "values": null, "category": "general"},
    "disabled": {"type": "boolean", "description": "Disables interaction and applies disabled styling/ARIA.", "default": false, "values": null, "category": "state"},
    "state": {"type": "string", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "gap": {"type": "string|number", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "tabGap": {"type": "string|number", "description": "Component configuration for \"tabGap\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "align": {"type": "string", "description": "Alignment of content along the cross axis (e.g. left/center/right).", "default": null, "values": ["left", "center", "right"], "category": "general"},
    "justify": {"type": "string", "description": "Justification of items along the main axis.", "default": null, "values": ["start", "center", "end", "space-between", "space-around", "space-evenly"], "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "navClass": {"type": "string", "description": "Component configuration for \"navClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "tabClass": {"type": "string", "description": "Component configuration for \"tabClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "itemClass": {"type": "string", "description": "Component configuration for \"itemClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ nav?, tab?, label?, icon?, note?, badge?, extra?, empty?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "nav": {"type": "Full nav renderer", "description": "Slot content for \"nav\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "tab": {"type": "Single tab renderer", "description": "Slot for custom tab label/content.", "default": null, "values": null, "category": "slot"},
    "label": {"type": "Label renderer", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Icon renderer", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "note": {"type": "Note renderer", "description": "Slot for note/secondary text.", "default": null, "values": null, "category": "state"},
    "badge": {"type": "Badge/counter renderer", "description": "Slot content for \"badge\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "extra": {"type": "Extra area next to the nav", "description": "Slot content for \"extra\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "empty": {"type": "Fallback when tabs/items are empty", "description": "Slot for empty-state content.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Children / extra content fallback", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Icon renderer", "description": "Slot for right-aligned icon content."}
  },
  "events": {
    "onChange": "(value, tab, event, index)"
  },
  "keyboard": ["Enter/Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"],
  "returns": "HTMLDivElement con ._getValue(), ._setValue(value), ._select(value), ._next(), ._prev(), ._getTabs()",
  "description": "Standardized tab bar with controlled/uncontrolled support, structured slots, badge/note/icon, and keyboard navigation.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
