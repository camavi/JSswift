# Col

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Col(...children) | UI.Col(props, ...children)",
  "props": {
    "size": {
      "type": "Alias of width",
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
      "type": "number|string",
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
      "type": "number|string",
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
      "type": "number|string",
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
      "type": "number|string",
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
      "type": "number|string",
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
      "type": "number|string",
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
      "type": "{ col?, span?, gap?, direction?, align?, justify?, width?, height? }",
      "description": "Responsive overrides applied at the base/mobile viewport.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "tablet": {
      "type": "{ col?, span?, gap?, direction?, align?, justify?, width?, height? }",
      "description": "Responsive overrides applied from the tablet breakpoint upward.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "pc": {
      "type": "{ col?, span?, gap?, direction?, align?, justify?, width?, height? }",
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
    "col": {
      "type": "number|string",
      "description": "Component configuration for \"col\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "span": {
      "type": "Alias of col",
      "description": "Column span within a grid.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "sm": {
      "type": "number|string",
      "description": "Column span at small breakpoint.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "md": {
      "type": "number|string",
      "description": "Column span at medium breakpoint.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "lg": {
      "type": "number|string",
      "description": "Column span at large breakpoint.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "auto": {
      "type": "boolean",
      "description": "Enables automatic sizing or layout behavior instead of fixed sizing.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "gap": {
      "type": "number|string",
      "description": "Gap/spacing between child elements.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "rowGap": {
      "type": "number|string",
      "description": "Component configuration for \"rowGap\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "columnGap": {
      "type": "number|string",
      "description": "Component configuration for \"columnGap\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "align": {
      "type": "string",
      "description": "Alignment of content along the cross axis (e.g. left/center/right).",
      "default": null,
      "values": [
        "left",
        "center",
        "right"
      ],
      "category": "general"
    },
    "justify": {
      "type": "string",
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
    "inline": {
      "type": "boolean",
      "description": "Component configuration for \"inline\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "stack": {
      "type": "boolean",
      "description": "Component configuration for \"stack\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "center": {
      "type": "boolean",
      "description": "Component configuration for \"center\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "flex": {
      "type": "string",
      "description": "Component configuration for \"flex\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "fill": {
      "type": "boolean",
      "description": "Component configuration for \"fill\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "grow": {
      "type": "number",
      "description": "Component configuration for \"grow\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "shrink": {
      "type": "number",
      "description": "Component configuration for \"shrink\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "basis": {
      "type": "number|string",
      "description": "Component configuration for \"basis\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "self": {
      "type": "string",
      "description": "Component configuration for \"self\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "order": {
      "type": "number|string",
      "description": "Component configuration for \"order\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "scroll": {
      "type": "boolean",
      "description": "Component configuration for \"scroll\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "start": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"start\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "top": {
      "type": "Alias of start",
      "description": "Component configuration for \"top\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "header": {
      "type": "Alias of start",
      "description": "Header content node(s) or render function.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "body": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "content": {
      "type": "Alias of body",
      "description": "Main content node(s) or render function for the component body.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "end": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"end\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "bottom": {
      "type": "Alias of end",
      "description": "Component configuration for \"bottom\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "footer": {
      "type": "Alias of end",
      "description": "Footer content node(s) or render function.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "startClass": {
      "type": "string",
      "description": "Component configuration for \"startClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "bodyClass": {
      "type": "string",
      "description": "Component configuration for \"bodyClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "endClass": {
      "type": "string",
      "description": "Component configuration for \"endClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ start?, top?, header?, body?, content?, end?, bottom?, footer?, default? }",
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
    "start": {
      "type": "Column leading area",
      "description": "Slot content for \"start\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "top": {
      "type": "Alias of start",
      "description": "Slot content for \"top\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "header": {
      "type": "Alias of start",
      "description": "Slot for header content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "body": {
      "type": "Column main area",
      "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "content": {
      "type": "Alias of body",
      "description": "Slot for the main body content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "end": {
      "type": "Column trailing area",
      "description": "Slot content for \"end\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "bottom": {
      "type": "Alias of end",
      "description": "Slot content for \"bottom\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "footer": {
      "type": "Alias of end",
      "description": "Slot for footer content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "default": {
      "type": "Column fallback content",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    }
  },
  "returns": "HTMLDivElement",
  "description": "Responsive 24-column wrapper. By default it behaves like a regular container and enables vertical flex layout when using gap/alignment, structured regions, or `stack`."
}
```
