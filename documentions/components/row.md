# Row

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Row(...children) | _.Row(props, ...children)",
  "props": {
    "mobile": {"type": "{ gap?, direction?, wrap?, align?, justify?, width?, minWidth?, maxWidth? }", "description": "Responsive overrides applied at the base/mobile viewport.", "default": null, "values": null, "category": "layout"},
    "tablet": {"type": "{ gap?, direction?, wrap?, align?, justify?, width?, minWidth?, maxWidth? }", "description": "Responsive overrides applied from the tablet breakpoint upward.", "default": null, "values": null, "category": "layout"},
    "pc": {"type": "{ gap?, direction?, wrap?, align?, justify?, width?, minWidth?, maxWidth? }", "description": "Responsive overrides applied from the desktop breakpoint upward.", "default": null, "values": null, "category": "layout"},
    "start": {"type": "Node|Function|Array", "description": "Component configuration for \"start\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "left": {"type": "Alias of start", "description": "Content or configuration for the left region.", "default": null, "values": null, "category": "general"},
    "body": {"type": "Node|Function|Array", "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "center": {"type": "Alias of body", "description": "Component configuration for \"center\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "end": {"type": "Node|Function|Array", "description": "Component configuration for \"end\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "right": {"type": "Alias of end", "description": "Content or configuration for the right region.", "default": null, "values": null, "category": "general"},
    "align": {"type": "stretch|flex-start|center|flex-end|baseline", "description": "Alignment of content along the cross axis (e.g. left/center/right).", "default": null, "values": ["left", "center", "right"], "category": "general"},
    "justify": {"type": "flex-start|center|flex-end|space-between|space-around|space-evenly", "description": "Justification of items along the main axis.", "default": null, "values": ["start", "center", "end", "space-between", "space-around", "space-evenly"], "category": "general"},
    "wrap": {"type": "boolean|string", "description": "Allows children to wrap to new lines.", "default": null, "values": null, "category": "general"},
    "direction": {"type": "row|row-reverse|column|column-reverse", "description": "Component configuration for \"direction\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "reverse": {"type": "boolean", "description": "Component configuration for \"reverse\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "gap": {"type": "string|number", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "rowGap": {"type": "string|number", "description": "Component configuration for \"rowGap\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "columnGap": {"type": "string|number", "description": "Component configuration for \"columnGap\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "inline": {"type": "boolean", "description": "Component configuration for \"inline\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "full": {"type": "boolean", "description": "Component configuration for \"full\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "startClass": {"type": "string", "description": "Component configuration for \"startClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "bodyClass": {"type": "string", "description": "Component configuration for \"bodyClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "centerClass": {"type": "Alias of bodyClass", "description": "Component configuration for \"centerClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "endClass": {"type": "string", "description": "Component configuration for \"endClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ start?, left?, body?, center?, end?, right?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "start": {"type": "Leading content area", "description": "Slot content for \"start\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "left": {"type": "Alias of start", "description": "Slot for left-aligned content.", "default": null, "values": null, "category": "slot"},
    "body": {"type": "Main content area", "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "center": {"type": "Alias of body", "description": "Slot for centered content within a toolbar/row.", "default": null, "values": null, "category": "slot"},
    "end": {"type": "Trailing content area", "description": "Slot content for \"end\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "right": {"type": "Alias of end", "description": "Slot for right-aligned content.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback content / children", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLDivElement",
  "description": "Wrapper flex in riga con children, slot strutturati e props di layout per gap, allineamento, wrap e direction.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "class", "style"]}
}
```

When a sized Col is a direct child of Row, its 24-column width accounts for the horizontal gap. For example, two `col: 12` children fit on one row with a gap; three `col: 8` children do likewise. Responsive spans and gaps use the same calculation. Columns outside Row keep their normal percentage widths.
