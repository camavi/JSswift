# FormField

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.FormField(props)",
  "description": "Wrapper field con label floating, hint/error/success/warning/note, clear e addons slot-based.",
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
      "type": "String|Node|Function",
      "description": "Label text or node for the component.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "topLabel": {
      "type": "String|Node|Function",
      "description": "Label displayed above the control.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "hint": {
      "type": "String|Node|Function",
      "description": "Helper text shown near the control.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "error": {
      "type": "String|Node|Function",
      "description": "Error state or message displayed with the component.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "success": {
      "type": "String|Node|Function",
      "description": "Marks the component with success state styling.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "warning": {
      "type": "String|Node|Function",
      "description": "Marks the component with warning state styling.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "note": {
      "type": "String|Node|Function",
      "description": "Secondary note text.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "icon": {
      "type": "String|Node|Function",
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
      "type": "String|Node|Function",
      "description": "Icon name or node rendered on the right side of the component.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "general"
    },
    "prefix": {
      "type": "String|Node|Function",
      "description": "Content rendered before the main control.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "suffix": {
      "type": "String|Node|Function",
      "description": "Content rendered after the main control.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "clearable": {
      "type": "boolean",
      "description": "Shows a clear action to reset the current value.",
      "default": null,
      "values": null,
      "category": "general"
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
    "disabled": {
      "type": "boolean",
      "description": "Disables interaction and applies disabled styling/ARIA.",
      "default": false,
      "values": null,
      "category": "state"
    },
    "readonly": {
      "type": "boolean",
      "description": "Prevents editing while keeping focus and selection.",
      "default": false,
      "values": null,
      "category": "state"
    },
    "control": {
      "type": "Node|Function",
      "description": "Custom control element or render function for the input area.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "getValue": {
      "type": "() => any",
      "description": "Function to extract a value from an item object.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "onClear": {
      "type": "() => void",
      "description": "Callback fired when the clear action is used.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "onFocus": {
      "type": "() => void",
      "description": "Callback fired when the control gains focus.",
      "default": null,
      "values": null,
      "category": "events"
    },
    "wrapClass": {
      "type": "string",
      "description": "Additional CSS classes applied to the outer wrapper.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ label?, topLabel?, prefix?, suffix?, shortcode?, icon?, iconRight?, clear?, hint?, error?, control? }",
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
    "label": {
      "type": "Floating label content",
      "description": "Slot for label content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "topLabel": {
      "type": "Top label content",
      "description": "Slot for top label content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "prefix": {
      "type": "Left addon content",
      "description": "Slot for prefix content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "suffix": {
      "type": "Right addon content",
      "description": "Slot for suffix content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "icon": {
      "type": "Left icon content",
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
      "type": "Right icon content",
      "description": "Slot for right-aligned icon content.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "slot"
    },
    "shortcode": {
      "type": "Shortcut badge content",
      "description": "Slot content for \"shortcode\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "clear": {
      "type": "Clear button slot (ctx: { clear, disabled, readonly, hasValue })",
      "description": "Slot for the clear control/content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "hint": {
      "type": "Hint content",
      "description": "Slot for helper/hint text.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "errorMessage": {
      "type": "Error content",
      "description": "Slot for custom error message rendering.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "success": {
      "type": "Success content",
      "description": "Slot for success message/content.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "warning": {
      "type": "Warning content",
      "description": "Slot for warning message/content.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "note": {
      "type": "Note content",
      "description": "Slot for note/secondary text.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "control": {
      "type": "Override control wrapper (ctx: { control, clear, disabled, readonly, hasValue })",
      "description": "Slot for custom control/input rendering.",
      "default": null,
      "values": null,
      "category": "slot"
    }
  },
  "returns": "HTMLDivElement (wrapper) con ._refresh()"
}
```
