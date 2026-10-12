# Container

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Container(...children) | _.Container(props, ...children)",
  "props": {
    "padding": {"type": "number|string", "description": "Padding applied to the component root element.", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "layout"},
    "width": {"type": "number|string", "description": "Explicit width (number interpreted as px or CSS length).", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "layout"},
    "minWidth": {"type": "number|string", "description": "Minimum width constraint (number interpreted as px or CSS length).", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "layout"},
    "maxWidth": {"type": "number|string", "description": "Maximum width constraint (number interpreted as px or CSS length).", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "layout"},
    "tag": {"type": "string", "description": "Component configuration for \"tag\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "fluid": {"type": "boolean", "description": "Component configuration for \"fluid\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "paddingX": {"type": "number|string", "description": "Component configuration for \"paddingX\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "paddingY": {"type": "number|string", "description": "Component configuration for \"paddingY\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "gap": {"type": "number|string", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "sectionGap": {"type": "number|string", "description": "Component configuration for \"sectionGap\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "layout": {"type": "\"block|flex|grid|stack|inline\"", "description": "Component configuration for \"layout\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "direction": {"type": "\"row|column\"", "description": "Component configuration for \"direction\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "wrap": {"type": "boolean|string", "description": "Allows children to wrap to new lines.", "default": null, "values": null, "category": "general"},
    "align": {"type": "string", "description": "Alignment of content along the cross axis (e.g. left/center/right).", "default": null, "values": ["left", "center", "right"], "category": "general"},
    "justify": {"type": "string", "description": "Justification of items along the main axis.", "default": null, "values": ["start", "center", "end", "space-between", "space-around", "space-evenly"], "category": "general"},
    "cols": {"type": "number|string", "description": "Number of columns for grid layouts.", "default": null, "values": null, "category": "general"},
    "before": {"type": "String|Node|Function|Array", "description": "Component configuration for \"before\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "header": {"type": "String|Node|Function|Array", "description": "Header content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "start": {"type": "String|Node|Function|Array", "description": "Component configuration for \"start\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "body": {"type": "String|Node|Function|Array", "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "content": {"type": "String|Node|Function|Array", "description": "Main content node(s) or render function for the component body.", "default": null, "values": null, "category": "general"},
    "end": {"type": "String|Node|Function|Array", "description": "Component configuration for \"end\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "footer": {"type": "String|Node|Function|Array", "description": "Footer content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "after": {"type": "String|Node|Function|Array", "description": "Component configuration for \"after\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ before?, header?, left?, start?, body?, content?, default?, right?, end?, footer?, after? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "before": {"type": "Top content before the main container body", "description": "Slot content for \"before\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "header": {"type": "Structured header area", "description": "Slot for header content.", "default": null, "values": null, "category": "slot"},
    "left": {"type": "Alias for start", "description": "Slot for left-aligned content.", "default": null, "values": null, "category": "slot"},
    "start": {"type": "Leading area inside the main body", "description": "Slot content for \"start\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "body": {"type": "Custom body renderer overriding start/content/end wrappers", "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "content": {"type": "Explicit main content", "description": "Slot for the main body content.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback content from children", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "right": {"type": "Alias for end", "description": "Slot for right-aligned content.", "default": null, "values": null, "category": "slot"},
    "end": {"type": "Trailing area inside the main body", "description": "Slot content for \"end\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "footer": {"type": "Structured footer area", "description": "Slot for footer content.", "default": null, "values": null, "category": "slot"},
    "after": {"type": "Bottom content after the main container body", "description": "Slot content for \"after\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLDivElement",
  "description": "Composable container with max-width, spacing, layout props, and optional sections.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "margin", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

An explicit `body` remains the central content when `start`/`left` or `end`/`right` are also provided; side regions are preserved. Header and footer remain separate sections. Without side regions, body nodes keep their direct placement.
