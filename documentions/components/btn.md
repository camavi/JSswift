# Btn

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Btn(...children) | UI.Btn(props, ...children)",
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
      "type": "primary|secondary|warning|danger|success|info|light|dark",
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
    "label": {
      "type": "String|Node|Function|Array",
      "description": "Label text or node for the component.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "icon": {
      "type": "String|Node|Function|Array",
      "description": "Icon name or node rendered with the component.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "general"
    },
    "iconRight": {
      "type": "String|Node|Function|Array",
      "description": "Icon name or node rendered on the right side of the component.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "general"
    },
    "iconAlign": {
      "type": "before|after|left|right",
      "description": "Position of the icon relative to the label.",
      "default": null,
      "values": [
        "left",
        "right",
        "before",
        "after"
      ],
      "category": "general"
    },
    "loading": {
      "type": "boolean",
      "description": "Shows loading state and disables interactions where appropriate.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "disabled": {
      "type": "boolean",
      "description": "Disables interaction and applies disabled styling/ARIA.",
      "default": false,
      "values": null,
      "category": "state"
    },
    "shortcode": {
      "type": "string|Array<string>|object",
      "description": "Keyboard shortcut string, object, or array bound to the component action.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "showShortcode": {
      "type": "boolean",
      "description": "Displays the configured keyboard shortcut badge when the component supports it.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ icon?, label?, default? }",
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
    "icon": {
      "type": "Icon slot",
      "description": "Slot for icon content.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "slot"
    },
    "iconRight": {
      "type": "Right icon slot",
      "description": "Slot for right-aligned icon content.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "slot"
    },
    "label": {
      "type": "Label slot",
      "description": "Slot for label content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "default": {
      "type": "Button content",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    }
  },
  "events": [
    "click",
    "pointerdown",
    "focus",
    "blur"
  ],
  "returns": "HTMLButtonElement",
  "description": "Btn component meta definition."
}
```
