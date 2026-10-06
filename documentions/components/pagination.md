# Pagination

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Pagination(props)",
  "props": {
    "size": {"type": "xxs|xs|sm|md|lg|xl|xxl|xxxl", "description": "Size token, number, or CSS length for sizing.", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "style"},
    "color": {"type": "primary|secondary|warning|danger|success|info|light|dark", "description": "Semantic color name used to style the component.", "default": null, "values": ["primary", "secondary", "success", "warning", "danger", "info", "light", "dark"], "category": "style"},
    "max": {"type": "number", "description": "Maximum value for range-based controls.", "default": null, "values": null, "category": "general"},
    "pages": {"type": "number", "description": "Component configuration for \"pages\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "total": {"type": "number", "description": "Component configuration for \"total\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "pageSize": {"type": "number", "description": "Number of items per page.", "default": null, "values": null, "category": "general"},
    "value": {"type": "number", "description": "Current value (controlled).", "default": null, "values": null, "category": "data"},
    "page": {"type": "number", "description": "Current page index (1-based unless documented otherwise).", "default": null, "values": null, "category": "general"},
    "model": {"type": "[get,set] signal", "description": "Two-way bound value (alias to value in some components).", "default": null, "values": null, "category": "data"},
    "showPages": {"type": "boolean", "description": "Component configuration for \"showPages\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "showSummary": {"type": "boolean", "description": "Component configuration for \"showSummary\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "showLabel": {"type": "boolean", "description": "Whether to render the label text.", "default": null, "values": null, "category": "general"},
    "showPrev": {"type": "boolean", "description": "Component configuration for \"showPrev\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "showNext": {"type": "boolean", "description": "Component configuration for \"showNext\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "showFirst": {"type": "boolean", "description": "Component configuration for \"showFirst\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "showLast": {"type": "boolean", "description": "Component configuration for \"showLast\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "showEdges": {"type": "boolean", "description": "Component configuration for \"showEdges\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "siblings": {"type": "number", "description": "Component configuration for \"siblings\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "boundaryCount": {"type": "number", "description": "Component configuration for \"boundaryCount\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "hideOnSinglePage": {"type": "boolean", "description": "Component configuration for \"hideOnSinglePage\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "simple": {"type": "boolean", "description": "Component configuration for \"simple\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "state": {"type": "primary|secondary|warning|danger|success|info|light|dark", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ start?, end?, first?, prev?, page?, item?, ellipsis?, next?, last?, summary?, label? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "start": {"type": "Content before the controls", "description": "Slot content for \"start\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "end": {"type": "Content after the controls", "description": "Slot content for \"end\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "first": {"type": "First button content", "description": "Slot content for \"first\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "prev": {"type": "Prev button content", "description": "Slot for the previous-page control.", "default": null, "values": null, "category": "slot"},
    "page": {"type": "Page item content (ctx: { page, active, pages })", "description": "Slot for page indicator/content.", "default": null, "values": null, "category": "slot"},
    "item": {"type": "Alias of page", "description": "Slot for custom item rendering.", "default": null, "values": null, "category": "slot"},
    "ellipsis": {"type": "Ellipsis content", "description": "Slot content for \"ellipsis\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "next": {"type": "Next button content", "description": "Slot for the next-page control.", "default": null, "values": null, "category": "slot"},
    "last": {"type": "Last button content", "description": "Slot content for \"last\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "summary": {"type": "Summary content", "description": "Slot content for \"summary\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "label": {"type": "Alias legacy di summary", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"}
  },
  "events": {
    "onChange": "(page, ctx, event)",
    "onPageChange": "(page, ctx, event)"
  },
  "returns": "HTMLElement <nav>",
  "description": "Paginazione standard con controlli edge, numeri, ellissi, summary e supporto total/pageSize.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
