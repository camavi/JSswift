# Breadcrumbs

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Breadcrumbs(props)",
  "props": {
    "items": {"type": "Array<string|number|Node|Function|{ label?, to?, href?, icon?, note?, badge?, current?, disabled?, hidden?, slots? }>", "description": "Array of items or nodes to render.", "default": null, "values": null, "category": "data"},
    "model": {"type": "[get,set] signal|Array", "description": "Two-way bound value (alias to value in some components).", "default": null, "values": null, "category": "data"},
    "home": {"type": "boolean|Object", "description": "Component configuration for \"home\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "separator": {"type": "string|Node|Function", "description": "Separator string/node between items.", "default": null, "values": null, "category": "general"},
    "before": {"type": "Node|Function|Array", "description": "Component configuration for \"before\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "after": {"type": "Node|Function|Array", "description": "Component configuration for \"after\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "empty": {"type": "Node|Function|Array", "description": "Component configuration for \"empty\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "variant": {"type": "\"line\"|\"pills\"|\"soft\"", "description": "Component configuration for \"variant\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "max": {"type": "number", "description": "Maximum value for range-based controls.", "default": null, "values": null, "category": "general"},
    "leadingCount": {"type": "number", "description": "Component configuration for \"leadingCount\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "trailingCount": {"type": "number", "description": "Component configuration for \"trailingCount\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "wrap": {"type": "boolean", "description": "Allows children to wrap to new lines.", "default": null, "values": null, "category": "general"},
    "nowrap": {"type": "boolean", "description": "Component configuration for \"nowrap\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "linkCurrent": {"type": "boolean", "description": "Component configuration for \"linkCurrent\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "state": {"type": "string", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "itemSize": {"type": "string|number", "description": "Component configuration for \"itemSize\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "ariaLabel": {"type": "string", "description": "Component configuration for \"ariaLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "before": {"type": "Content before breadcrumb list", "description": "Slot content for \"before\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "after": {"type": "Content after breadcrumb list", "description": "Slot content for \"after\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "item": {"type": "Full renderer for a breadcrumb entry", "description": "Slot for custom item rendering.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Leading icon for each breadcrumb", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "label": {"type": "Main breadcrumb label", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "note": {"type": "Secondary line for the breadcrumb", "description": "Slot for note/secondary text.", "default": null, "values": null, "category": "state"},
    "badge": {"type": "Badge/counter area", "description": "Slot content for \"badge\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "aside": {"type": "Trailing area", "description": "Slot for aside/secondary content.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Extra content under note", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "separator": {"type": "Separator renderer", "description": "Slot for separator rendering between items.", "default": null, "values": null, "category": "slot"},
    "collapsed": {"type": "Renderer for collapsed middle items", "description": "Slot content for \"collapsed\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "empty": {"type": "Renderer for empty state", "description": "Slot for empty-state content.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Leading icon for each breadcrumb", "description": "Slot for right-aligned icon content."}
  },
  "events": {
    "onItemClick": "(item, ctx, event)",
    "onNavigate": "(toOrHref, item, event)"
  },
  "returns": "HTMLElement <nav> con .getItems(), .getVisibleItems(), .refresh(), .setItems(items)",
  "description": "Breadcrumbs standardizzati con item strutturati, slot completi, collapse automatico e supporto a link/router.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
