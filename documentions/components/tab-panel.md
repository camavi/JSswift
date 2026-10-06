# TabPanel

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.TabPanel(props) | _.TabPanel(props, ...children)",
  "props": {
    "tabs": {"type": "Array<{ name?, value?, label?, title?, note?, subtitle?, icon?, badge?, content?, panel?, body?, children?, disabled?, hidden?, tabClass?, panelClass? }>", "description": "Tab definition. Supports multiple aliases for label and content.", "category": "data", "default": null, "values": null},
    "items": {"type": "Array", "description": "Alias of `tabs`.", "category": "data", "default": null, "values": null},
    "value": {"type": "any", "description": "Initial or controlled value of the active tab.", "category": "data", "default": null, "values": null},
    "defaultValue": {"type": "any", "description": "Explicit alias for the initial tab when `model` is not used.", "category": "data", "default": null, "values": null},
    "model": {"type": "[get,set] signal", "description": "Reactive binding for the active tab.", "category": "data", "default": null, "values": null},
    "orientation": {"type": "vertical|horizontal", "description": "Navigation orientation.", "values": ["vertical", "horizontal"], "default": "vertical", "category": "layout"},
    "navPosition": {"type": "before|after", "description": "Tab bar position relative to the panels.", "values": ["before", "after"], "default": "before", "category": "layout"},
    "variant": {"type": "line|pills|soft", "description": "Visual style of the tab navigation.", "values": ["line", "pills", "soft"], "default": "line", "category": "style"},
    "wrap": {"type": "boolean", "description": "Allows the nav to wrap when space is limited.", "default": false, "category": "layout", "values": null},
    "navFill": {"type": "boolean", "description": "Distributes tabs across the available width.", "default": false, "category": "layout", "values": null},
    "swipeable": {"type": "boolean", "description": "Enables swipe gestures on panels.", "default": false, "category": "behavior", "values": null},
    "infinite": {"type": "boolean", "description": "When enabled, next/prev cycles from the first to the last tab.", "default": false, "category": "behavior", "values": null},
    "animated": {"type": "boolean", "description": "Enables the transition between panels.", "default": false, "category": "behavior", "values": null},
    "transitionDuration": {"type": "number", "description": "Animation duration in milliseconds.", "default": 220, "category": "behavior", "values": null},
    "transitionEasing": {"type": "string", "description": "CSS timing function for the animation.", "default": "ease", "category": "behavior", "values": null},
    "transitionPrev": {"type": "string", "description": "Custom classes applied during the transition to the previous tab.", "category": "behavior", "default": null, "values": null},
    "transitionNext": {"type": "string", "description": "Custom classes applied during the transition to the next tab.", "category": "behavior", "default": null, "values": null},
    "tabClass": {"type": "string", "description": "Additional classes for all tab buttons.", "category": "style", "default": null, "values": null},
    "tabStyle": {"type": "object", "description": "Inline style applied to all tab buttons.", "category": "style", "default": null, "values": null},
    "navClass": {"type": "string", "description": "Additional classes for the nav wrapper.", "category": "style", "default": null, "values": null},
    "panelsClass": {"type": "string", "description": "Additional classes for the panels wrapper.", "category": "style", "default": null, "values": null},
    "panelClass": {"type": "string", "description": "Common additional classes for each panel.", "category": "style", "default": null, "values": null},
    "panelStyle": {"type": "object", "description": "Common inline style for each panel.", "category": "style", "default": null, "values": null},
    "empty": {"type": "Node|Function|Array", "description": "Visual fallback when `tabs` and `items` are empty.", "category": "state", "default": null, "values": null},
    "disabled": {"type": "boolean", "description": "Disables the entire component.", "default": false, "category": "state", "values": null},
    "slots": {"type": "{ nav?, tab?, label?, icon?, note?, badge?, panel?, empty?, default? }", "description": "Structured slots for customizing nav, label, badge, and content.", "category": "general", "default": null, "values": null},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "nav": {"type": "Function|Node|Array", "description": "Full navigation renderer. Receives `tabs`, `active()`, `activeTab()`, `select()`, `next()`, `prev()`, `nodes`, `orientation`, `position`, `variant`.", "default": null, "values": null, "category": "slot"},
    "tab": {"type": "Function|Node|Array", "description": "Inner content of the tab button. Receives `tab`, `name`, `index`, `active`, `label`, `icon`, `note`, `badge`, `select()`.", "default": null, "values": null, "category": "slot"},
    "label": {"type": "Function|Node|Array", "description": "Tab label.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Function|Node|Array", "description": "Tab icon.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "note": {"type": "Function|Node|Array", "description": "Note, subtitle, or short description below the label.", "default": null, "values": null, "category": "state"},
    "badge": {"type": "Function|Node|Array", "description": "Badge or counter aligned to the right of the tab.", "default": null, "values": null, "category": "slot"},
    "panel": {"type": "Function|Node|Array", "description": "Active/inactive panel renderer. Receives `tab`, `name`, `index`, `active`, `select()`, `next()`, `prev()`.", "default": null, "values": null, "category": "slot"},
    "empty": {"type": "Function|Node|Array", "description": "Fallback when there are no tabs.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Node|Array|Function", "description": "Extra content appended after the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Function|Node|Array", "description": "Slot for right-aligned icon content."}
  },
  "events": {
    "onChange": "(name, tab, index)"
  },
  "returns": "HTMLDivElement with API `_getValue()`, `_setValue(value)`, `_select(value)`, `_next()`, `_prev()`, `_active()`, `_tabs()`",
  "description": "Standardized tab panel with accessible nav, structured slots, reactive model, swipe, and animations.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
