# Grid

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Grid(...children) | UI.Grid(props, ...children)",
  "props": {
    "size": {
      "type": "string|number",
      "description": "Size token, number, or CSS length for sizing.",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "style"
    },
    "color": {
      "type": "string",
      "description": "Semantic color name used to style the component.",
      "default": null,
      "values": [
        "primary",
        "secondary",
        "success",
        "warning",
        "danger",
        "info",
        "light",
        "dark"
      ],
      "category": "style"
    },
    "outline": {
      "type": "boolean",
      "description": "Uses outlined visual style.",
      "default": false,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "style"
    },
    "clickable": {
      "type": "boolean",
      "description": "Enables pointer/hover styles and click handling on the component.",
      "default": false,
      "values": null,
      "category": "behavior"
    },
    "padding": {
      "type": "string|number",
      "description": "Padding applied to the component root element.",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "margin": {
      "type": "string|number",
      "description": "Margin applied to the component root element.",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "width": {
      "type": "string|number",
      "description": "Explicit width (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "minWidth": {
      "type": "string|number",
      "description": "Minimum width constraint (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "maxWidth": {
      "type": "string|number",
      "description": "Maximum width constraint (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "height": {
      "type": "string|number",
      "description": "Explicit height (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "minHeight": {
      "type": "string|number",
      "description": "Minimum height constraint (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "maxHeight": {
      "type": "string|number",
      "description": "Maximum height constraint (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "radius": {
      "type": "string|number",
      "description": "Border radius token or CSS length applied to the component.",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "style"
    },
    "borderRadius": {
      "type": "string|number",
      "description": "Border radius token or CSS length applied to the component.",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "style"
    },
    "shadow": {
      "type": "string|boolean",
      "description": "Shadow token or CSS box-shadow string applied to the component.",
      "default": null,
      "values": [
        "none",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "style"
    },
    "mobile": {
      "type": "{ cols?, gap?, flow?, width?, padding? }",
      "description": "Responsive overrides applied at the base/mobile viewport.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "tablet": {
      "type": "{ cols?, gap?, flow?, width?, padding? }",
      "description": "Responsive overrides applied from the tablet breakpoint upward.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "pc": {
      "type": "{ cols?, gap?, flow?, width?, padding? }",
      "description": "Responsive overrides applied from the desktop breakpoint upward.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "class": {
      "type": "string",
      "description": "Additional CSS classes applied to the component root element.",
      "default": null,
      "values": null,
      "category": "style"
    },
    "style": {
      "type": "object",
      "description": "Inline styles applied to the component root element.",
      "default": null,
      "values": null,
      "category": "style"
    },
    "cols": {
      "type": "number|string",
      "description": "Number of columns for grid layouts.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "columns": {
      "type": "alias di cols",
      "description": "Column definitions for table-like components.",
      "default": null,
      "values": null,
      "category": "data"
    },
    "min": {
      "type": "string|number (auto-fit/auto-fill min width)",
      "description": "Minimum value for range-based controls.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "max": {
      "type": "string|number (max track size, default 1fr)",
      "description": "Maximum value for range-based controls.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "gap": {
      "type": "string|number",
      "description": "Gap/spacing between child elements.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "rowGap": {
      "type": "string|number",
      "description": "Component configuration for \"rowGap\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "columnGap": {
      "type": "string|number",
      "description": "Component configuration for \"columnGap\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "colGap": {
      "type": "alias di columnGap",
      "description": "Component configuration for \"colGap\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "rows": {
      "type": "number|string",
      "description": "Row data array for table-like components.",
      "default": null,
      "values": null,
      "category": "data"
    },
    "autoRows": {
      "type": "string|number",
      "description": "Component configuration for \"autoRows\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "areas": {
      "type": "string|array",
      "description": "Component configuration for \"areas\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "flow": {
      "type": "row|column|dense|row dense|column dense",
      "description": "Component configuration for \"flow\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "align": {
      "type": "stretch|start|center|end",
      "description": "Alignment of content along the cross axis (e.g. left/center/right).",
      "default": null,
      "values": [
        "left",
        "center",
        "right"
      ],
      "category": "general"
    },
    "alignItems": {
      "type": "alias di align",
      "description": "Component configuration for \"alignItems\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "justify": {
      "type": "start|center|end|space-between|space-around|space-evenly",
      "description": "Justification of items along the main axis.",
      "default": null,
      "values": [
        "start",
        "center",
        "end",
        "space-between",
        "space-around",
        "space-evenly"
      ],
      "category": "general"
    },
    "justifyItems": {
      "type": "stretch|start|center|end",
      "description": "Component configuration for \"justifyItems\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "placeItems": {
      "type": "string",
      "description": "Component configuration for \"placeItems\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "placeContent": {
      "type": "string",
      "description": "Component configuration for \"placeContent\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "dense": {
      "type": "boolean",
      "description": "Uses compact spacing and sizing.",
      "default": false,
      "values": null,
      "category": "layout"
    },
    "inline": {
      "type": "boolean",
      "description": "Component configuration for \"inline\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "debug": {
      "type": "boolean",
      "description": "Component configuration for \"debug\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "autoFit": {
      "type": "boolean",
      "description": "Component configuration for \"autoFit\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "autoFill": {
      "type": "boolean",
      "description": "Component configuration for \"autoFill\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "full": {
      "type": "boolean",
      "description": "Component configuration for \"full\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "items": {
      "type": "Array<Node|Object|string>",
      "description": "Array of items or nodes to render.",
      "default": null,
      "values": null,
      "category": "data"
    },
    "itemClass": {
      "type": "string",
      "description": "Component configuration for \"itemClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "itemStyle": {
      "type": "object",
      "description": "Component configuration for \"itemStyle\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "itemProps": {
      "type": "object",
      "description": "Component configuration for \"itemProps\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "empty": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"empty\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ default?, item?, empty? }",
      "description": "Named slots map for render overrides.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "children": {
      "type": "Node|Array|Function",
      "description": "Default child content (nodes, arrays, or render function).",
      "default": null,
      "values": null,
      "category": "general"
    }
  },
  "slots": {
    "default": {
      "type": "Grid content fallback",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "item": {
      "type": "Render custom di ogni item ({ item, index, count, first, last })",
      "description": "Slot for custom item rendering.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "empty": {
      "type": "Empty state della griglia",
      "description": "Slot for empty-state content.",
      "default": null,
      "values": null,
      "category": "slot"
    }
  },
  "returns": "HTMLDivElement",
  "description": "Griglia dichiarativa per layout responsive: supporta children, items/slot item, auto-fit, template custom e empty state."
}
```
