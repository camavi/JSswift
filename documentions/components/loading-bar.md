# LoadingBar

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.LoadingBar(...children) | UI.LoadingBar(props, ...children)",
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
    "value": {
      "type": "number|rod|[get,set] signal",
      "description": "Current value (controlled).",
      "default": null,
      "values": null,
      "category": "data"
    },
    "model": {
      "type": "rod|[get,set] signal",
      "description": "Two-way bound value (alias to value in some components).",
      "default": null,
      "values": null,
      "category": "data"
    },
    "buffer": {
      "type": "number|rod|[get,set] signal",
      "description": "Component configuration for \"buffer\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "min": {
      "type": "number",
      "description": "Minimum value for range-based controls.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "max": {
      "type": "number",
      "description": "Maximum value for range-based controls.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "thickness": {
      "type": "Alias of height",
      "description": "Stroke/line thickness for progress indicators.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "state": {
      "type": "primary|secondary|success|warning|danger|info|light|dark",
      "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "trackColor": {
      "type": "string",
      "description": "Component configuration for \"trackColor\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "bufferColor": {
      "type": "string",
      "description": "Component configuration for \"bufferColor\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "striped": {
      "type": "boolean",
      "description": "Applies striped row styling.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "animated": {
      "type": "boolean",
      "description": "Component configuration for \"animated\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "indeterminate": {
      "type": "boolean",
      "description": "Component configuration for \"indeterminate\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "reverse": {
      "type": "boolean",
      "description": "Component configuration for \"reverse\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "target": {
      "type": "HTMLElement|string",
      "description": "Target element or anchor used for positioning.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "mount": {
      "type": "boolean",
      "description": "Component configuration for \"mount\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "position": {
      "type": "fixed|absolute|relative|static|sticky",
      "description": "Component configuration for \"position\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "inset": {
      "type": "string|number",
      "description": "Component configuration for \"inset\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "top": {
      "type": "string|number",
      "description": "Component configuration for \"top\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "right": {
      "type": "string|number",
      "description": "Content or configuration for the right region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "bottom": {
      "type": "string|number",
      "description": "Component configuration for \"bottom\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "left": {
      "type": "string|number",
      "description": "Content or configuration for the left region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "zIndex": {
      "type": "number",
      "description": "z-index for overlay stacking.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "visible": {
      "type": "boolean",
      "description": "Component configuration for \"visible\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "autoStart": {
      "type": "boolean",
      "description": "Component configuration for \"autoStart\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "startValue": {
      "type": "number",
      "description": "Component configuration for \"startValue\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "step": {
      "type": "number",
      "description": "Step increment for numeric controls.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "trickle": {
      "type": "boolean",
      "description": "Component configuration for \"trickle\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "trickleStep": {
      "type": "number",
      "description": "Component configuration for \"trickleStep\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "trickleInterval": {
      "type": "number",
      "description": "Component configuration for \"trickleInterval\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "trickleMax": {
      "type": "number",
      "description": "Component configuration for \"trickleMax\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "trickleTo": {
      "type": "Alias of trickleMax",
      "description": "Component configuration for \"trickleTo\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "doneValue": {
      "type": "number",
      "description": "Component configuration for \"doneValue\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "doneDelay": {
      "type": "Alias of hideDelay",
      "description": "Component configuration for \"doneDelay\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "hideDelay": {
      "type": "number",
      "description": "Component configuration for \"hideDelay\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "resetValue": {
      "type": "number",
      "description": "Component configuration for \"resetValue\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "label": {
      "type": "String|Node|Function|Array",
      "description": "Label text or node for the component.",
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
    "showValue": {
      "type": "boolean|\"inside\"",
      "description": "Component configuration for \"showValue\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "valueLabel": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"valueLabel\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "insideLabel": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"insideLabel\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "startLabel": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"startLabel\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "endLabel": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"endLabel\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "progressClass": {
      "type": "string",
      "description": "Component configuration for \"progressClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "progressStyle": {
      "type": "object",
      "description": "Component configuration for \"progressStyle\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ icon?, label?, note?, value?, inside?, startLabel?, endLabel?, default? }",
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
      "type": "Icon before the label",
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
      "type": "Main content",
      "description": "Slot for label content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "note": {
      "type": "Secondary content",
      "description": "Slot for note/secondary text.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "value": {
      "type": "External value on the right",
      "description": "Slot content for \"value\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "data"
    },
    "inside": {
      "type": "Content inside the bar",
      "description": "Slot content for \"inside\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "startLabel": {
      "type": "Label on the left of the bar",
      "description": "Slot content for \"startLabel\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "endLabel": {
      "type": "Label on the right of the bar",
      "description": "Slot content for \"endLabel\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "default": {
      "type": "Fallback content",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "iconRight": {
      "type": "Icon before the label",
      "description": "Slot for right-aligned icon content."
    }
  },
  "returns": "HTMLDivElement with imperative API: .set(), .setBuffer(), .inc(), .start(), .done(), .stop(), .reset(), .show(), .hide(), .destroy()",
  "description": "Loading bar based on UI.Progress, mountable on body or a custom container, controllable via model or imperative API."
}
```
