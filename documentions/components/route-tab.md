# RouteTab

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.RouteTab(...children) | UI.RouteTab(props, ...children)",
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
    "label": {
      "type": "String|Node|Function|Array",
      "description": "Label text or node for the component.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "to": {
      "type": "string",
      "description": "Navigation target/route to open on click.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "href": {
      "type": "string",
      "description": "Component configuration for \"href\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "active": {
      "type": "boolean",
      "description": "Marks the item as active/selected and applies active styling/ARIA when relevant.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "selected": {
      "type": "Alias of active",
      "description": "Component configuration for \"selected\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "match": {
      "type": "\"exact\"|\"startsWith\"|RegExp|Function|string",
      "description": "Component configuration for \"match\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "matchMode": {
      "type": "\"exact\"|\"startsWith\"",
      "description": "Component configuration for \"matchMode\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "exact": {
      "type": "boolean",
      "description": "Component configuration for \"exact\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "startsWith": {
      "type": "boolean",
      "description": "Component configuration for \"startsWith\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "note": {
      "type": "String|Node|Function|Array",
      "description": "Secondary note text.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "badge": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"badge\". When not handled internally, it is forwarded to the root element.",
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
    "aside": {
      "type": "Node|Function|Array",
      "description": "Content or configuration for the aside/secondary region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "variant": {
      "type": "\"line\"|\"pills\"|\"soft\"",
      "description": "Component configuration for \"variant\". When not handled internally, it is forwarded to the root element.",
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
    "block": {
      "type": "boolean",
      "description": "Component configuration for \"block\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "state": {
      "type": "string",
      "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ icon?, label?, note?, badge?, aside?, default? }",
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
      "type": "Leading icon content",
      "description": "Slot for icon content.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "slot"
    },
    "label": {
      "type": "Main label content",
      "description": "Slot for label content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "note": {
      "type": "Secondary note/caption",
      "description": "Slot for note/secondary text.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "badge": {
      "type": "Badge / counter area",
      "description": "Slot content for \"badge\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "aside": {
      "type": "Trailing visual/action area",
      "description": "Slot for aside/secondary content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "default": {
      "type": "Extra content under the note",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "iconRight": {
      "type": "Leading icon content",
      "description": "Slot for right-aligned icon content."
    }
  },
  "events": {
    "onClick": "MouseEvent",
    "onNavigate": "(to, event)"
  },
  "returns": "HTMLAnchorElement con ._isActive(), ._setActive(boolean|null), ._navigate(event?)",
  "description": "Standardized tab/link for router or href navigation, with structured slots, states, and badges."
}
```
