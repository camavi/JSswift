# Kpi

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Kpi(...children) | _.Kpi(props, ...children)",
  "props": {
    "eyebrow": {"type": "String|Node|Function|Array", "description": "Component configuration for \"eyebrow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "label": {"type": "Alias of title", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "value": {"type": "String|Number|Node|Function|Array", "description": "Current value (controlled).", "default": null, "values": null, "category": "data"},
    "delta": {"type": "String|Node|Function|Array", "description": "Component configuration for \"delta\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "trend": {"type": "up|down|flat|positive|negative|neutral", "description": "Component configuration for \"trend\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "note": {"type": "String|Node|Function|Array", "description": "Secondary note text.", "default": null, "values": null, "category": "state"},
    "subtitle": {"type": "Alias of note", "description": "Subtitle text or node.", "default": null, "values": null, "category": "general"},
    "meta": {"type": "Node|Function|Array", "description": "Component configuration for \"meta\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "media": {"type": "Node|Function|Array", "description": "Component configuration for \"media\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "aside": {"type": "Node|Function|Array", "description": "Content or configuration for the aside/secondary region.", "default": null, "values": null, "category": "general"},
    "footer": {"type": "Node|Function|Array", "description": "Footer content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "state": {"type": "primary|secondary|success|warning|danger|info|light|dark", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ eyebrow?, title?, value?, delta?, note?, meta?, media?, icon?, aside?, footer?, actions?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "eyebrow": {"type": "Kicker content", "description": "Slot content for \"eyebrow\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "title": {"type": "KPI title content", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "value": {"type": "Primary KPI value", "description": "Slot content for \"value\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "data"},
    "delta": {"type": "Delta/trend content", "description": "Slot content for \"delta\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "note": {"type": "Supporting note", "description": "Slot for note/secondary text.", "default": null, "values": null, "category": "state"},
    "meta": {"type": "Extra meta badges or inline info", "description": "Slot content for \"meta\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "media": {"type": "Secondary data view or mini-visual content", "description": "Slot content for \"media\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Leading icon or avatar", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "aside": {"type": "Top-right support content", "description": "Slot for aside/secondary content.", "default": null, "values": null, "category": "slot"},
    "footer": {"type": "Bottom support content", "description": "Slot for footer content.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Footer actions cluster", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Extra body content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Leading icon or avatar", "description": "Slot for right-aligned icon content."}
  },
  "returns": "HTMLElement",
  "description": "Richer surface for KPIs, headline metrics, and mini dashboard summaries.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
