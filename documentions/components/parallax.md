# Parallax

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Parallax(...children) | UI.Parallax(props, ...children)",
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
      "type": "object",
      "description": "Responsive overrides applied at the base/mobile viewport.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "tablet": {
      "type": "object",
      "description": "Responsive overrides applied from the tablet breakpoint upward.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "pc": {
      "type": "object",
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
    "src": {
      "type": "string",
      "description": "Image source URL.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "image": {
      "type": "string",
      "description": "Component configuration for \"image\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "background": {
      "type": "string",
      "description": "Component configuration for \"background\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "backgroundContent": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"backgroundContent\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "speed": {
      "type": "number",
      "description": "Animation speed or duration in milliseconds.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "maxOffset": {
      "type": "number",
      "description": "Component configuration for \"maxOffset\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "startTop": {
      "type": "number",
      "description": "Starting scroll offset for parallax effects.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "state": {
      "type": "success|warning|danger|info|primary|secondary|dark|light|string",
      "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "overlay": {
      "type": "string",
      "description": "Renders content in an overlay layer or portal.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "bgPosition": {
      "type": "string",
      "description": "CSS background-position value for the background image/layer.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "bgSize": {
      "type": "string",
      "description": "CSS background-size value for the background image/layer.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "bgRepeat": {
      "type": "string",
      "description": "Component configuration for \"bgRepeat\". When not handled internally, it is forwarded to the root element.",
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
    "contentMaxWidth": {
      "type": "string|number",
      "description": "Component configuration for \"contentMaxWidth\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "disabled": {
      "type": "boolean",
      "description": "Disables interaction and applies disabled styling/ARIA.",
      "default": false,
      "values": null,
      "category": "state"
    },
    "badge": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"badge\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "eyebrow": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"eyebrow\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "title": {
      "type": "String|Node|Function|Array",
      "description": "Title text or node.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "subtitle": {
      "type": "String|Node|Function|Array",
      "description": "Subtitle text or node.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "header": {
      "type": "Node|Function|Array",
      "description": "Header content node(s) or render function.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "aside": {
      "type": "Node|Function|Array",
      "description": "Content or configuration for the aside/secondary region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "media": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"media\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "content": {
      "type": "Node|Function|Array",
      "description": "Main content node(s) or render function for the component body.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "footer": {
      "type": "Node|Function|Array",
      "description": "Footer content node(s) or render function.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "actions": {
      "type": "Node|Function|Array",
      "description": "Content rendered in the action area, typically in a footer or trailing region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "bgClass": {
      "type": "string",
      "description": "Additional CSS classes applied to the background layer.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "badgeClass": {
      "type": "string",
      "description": "Component configuration for \"badgeClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "headerClass": {
      "type": "string",
      "description": "Component configuration for \"headerClass\". When not handled internally, it is forwarded to the root element.",
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
    "footerClass": {
      "type": "string",
      "description": "Component configuration for \"footerClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "contentClass": {
      "type": "string",
      "description": "Additional CSS classes applied to the content container.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ background?, badge?, eyebrow?, title?, subtitle?, header?, aside?, media?, content?, footer?, actions?, default? }",
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
    "background": {
      "type": "Decorative content inside the background layer",
      "description": "Slot content for \"background\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "badge": {
      "type": "Meta badge/chip above the main content",
      "description": "Slot content for \"badge\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "eyebrow": {
      "type": "Eyebrow/kicker",
      "description": "Slot content for \"eyebrow\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "title": {
      "type": "Main title",
      "description": "Slot for title content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "subtitle": {
      "type": "Subtitle or supporting text",
      "description": "Slot for subtitle content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "header": {
      "type": "Additional header content",
      "description": "Slot for header content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "aside": {
      "type": "Header side area",
      "description": "Slot for aside/secondary content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "media": {
      "type": "Media content or foreground card",
      "description": "Slot content for \"media\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "content": {
      "type": "Main body",
      "description": "Slot for the main body content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "footer": {
      "type": "Informational footer",
      "description": "Slot for footer content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "actions": {
      "type": "Actions area",
      "description": "Slot for action buttons or links.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "default": {
      "type": "Fallback body content",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    }
  },
  "returns": "HTMLDivElement with refresh/update/destroy methods",
  "description": "Standardized parallax hero/section with structured header, body, actions, slots, and minimal refresh API."
}
```
