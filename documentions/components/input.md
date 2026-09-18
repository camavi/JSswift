# Input

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Input(props)",
  "description": "Input field with floating label, hint/error/success/warning/note, clearable control, icon, prefix/suffix, and reactive support (rod/signal).",
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
      "type": "string (applicata all'input)",
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
    "model": {
      "type": "rod | [get,set] signal",
      "description": "Two-way bound value (alias to value in some components).",
      "default": null,
      "values": null,
      "category": "data"
    },
    "value": {
      "type": "string",
      "description": "Current value (controlled).",
      "default": null,
      "values": null,
      "category": "data"
    },
    "type": {
      "type": "string (default: 'text')",
      "description": "Variant or native input type.",
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
      "category": "general"
    },
    "name": {
      "type": "string",
      "description": "HTML name attribute for form submission.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "autocomplete": {
      "type": "string",
      "description": "Native autocomplete attribute for input elements.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "inputmode": {
      "type": "string",
      "description": "Native inputmode attribute hint for virtual keyboards.",
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
    "label": {
      "type": "String|Node|Function (floating label)",
      "description": "Label text or node for the component.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "topLabel": {
      "type": "String|Node|Function (label above, not floating)",
      "description": "Label displayed above the control.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "placeholder": {
      "type": "string (fallback when label is not used)",
      "description": "Placeholder text for inputs.",
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
    "clearable": {
      "type": "boolean",
      "description": "Shows a clear action to reset the current value.",
      "default": null,
      "values": null,
      "category": "general"
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
    "wrapClass": {
      "type": "string (applicata al field wrapper)",
      "description": "Additional CSS classes applied to the outer wrapper.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "onInput": {
      "type": "(value:string) => void",
      "description": "Callback fired on input events or while typing.",
      "default": null,
      "values": null,
      "category": "events"
    },
    "onChange": {
      "type": "(value:string) => void",
      "description": "Callback fired when the value or selection changes.",
      "default": null,
      "values": null,
      "category": "events"
    },
    "onFocus": {
      "type": "(event) => void",
      "description": "Callback fired when the control gains focus.",
      "default": null,
      "values": null,
      "category": "events"
    },
    "onBlur": {
      "type": "(event) => void",
      "description": "Callback fired when the control loses focus.",
      "default": null,
      "values": null,
      "category": "events"
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
      "type": "Floating label (via FormField slots.label)",
      "description": "Slot for label content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "topLabel": {
      "type": "Top label (via FormField slots.topLabel)",
      "description": "Slot for top label content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "prefix": {
      "type": "Left addon (via FormField slots.prefix)",
      "description": "Slot for prefix content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "suffix": {
      "type": "Right addon (via FormField slots.suffix)",
      "description": "Slot for suffix content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "shortcode": {
      "type": "Shortcut badge (via FormField slots.shortcode)",
      "description": "Slot content for \"shortcode\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "icon": {
      "type": "Left icon (via FormField slots.icon)",
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
      "type": "Right icon (via FormField slots.iconRight)",
      "description": "Slot for right-aligned icon content.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "slot"
    },
    "clear": {
      "type": "Clear button (via FormField slots.clear)",
      "description": "Slot for the clear control/content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "hint": {
      "type": "Hint content (via FormField slots.hint)",
      "description": "Slot for helper/hint text.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "errorMessage": {
      "type": "Error content (via FormField slots.errorMessage)",
      "description": "Slot for custom error message rendering.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "success": {
      "type": "Success content (via FormField slots.success)",
      "description": "Slot for success message/content.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "warning": {
      "type": "Warning content (via FormField slots.warning)",
      "description": "Slot for warning message/content.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "note": {
      "type": "Note content (via FormField slots.note)",
      "description": "Slot for note/secondary text.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "input": {
      "type": "Custom input node (ctx: { input, props })",
      "description": "Slot for custom input element/content.",
      "default": null,
      "values": null,
      "category": "slot"
    }
  },
  "returns": "HTMLDivElement (field wrapper) con ._input = HTMLInputElement"
}
```
