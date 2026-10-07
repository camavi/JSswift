# Input

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Input(props)",
  "description": "Input field with floating label, hint/error/success/warning/note, clearable control, icon, prefix/suffix, and reactive support (rod/signal).",
  "props": {
    "class": {
      "type": "string (applicata all'input)",
      "description": "Additional CSS classes applied to the component root element.",
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
    },
    "ariaLabel": {
      "type": "string|number|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
      "default": null,
      "values": null,
      "category": "accessibility"
    },
    "ariaLabelledBy": {
      "type": "string|number|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
      "default": null,
      "values": null,
      "category": "accessibility"
    },
    "ariaDescribedBy": {
      "type": "string|number|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
      "default": null,
      "values": null,
      "category": "accessibility"
    },
    "ariaInvalid": {
      "type": "boolean|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
      "default": null,
      "values": null,
      "category": "accessibility"
    },
    "required": {
      "type": "boolean|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "min": {
      "type": "string|number|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "max": {
      "type": "string|number|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "step": {
      "type": "string|number|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "pattern": {
      "type": "string|number|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "minLength": {
      "type": "string|number|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "maxLength": {
      "type": "string|number|reactive",
      "description": "Applied to the interactive control; see public control accessibility and focus.",
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
  "returns": "HTMLDivElement (field wrapper) con ._input = HTMLInputElement",
  "commonProps": {
    "path": "ui/common-props.md",
    "keys": [
      "size",
      "color",
      "outline",
      "clickable",
      "padding",
      "margin",
      "width",
      "minWidth",
      "maxWidth",
      "height",
      "minHeight",
      "maxHeight",
      "radius",
      "borderRadius",
      "shadow",
      "mobile",
      "tablet",
      "pc",
      "style"
    ]
  },
  "methods": {
    "focus": {
      "signature": "focus(options?)",
      "description": "Focus the native input or Select combobox without opening Select."
    }
  }
}
```

## Value callback

`onInput(value)` and `onChange(value)` receive the value only; Input does not pass a DOM event argument. For a text field:

```js
_.Input({ label: 'Cerca per nome', onInput: value => console.log(value) });
```

Use the documented `model` binding for reactive state. Verify the rendered control's accessible name; a visible label alone does not prove that it is associated with the input.

## Public control accessibility and focus

`focus(options?)` on the returned field focuses the interactive input/combobox (it does not open Select). Prefer this method over private DOM references.

`ariaLabel` sets the control's accessible name; a string `label` supplies the default. Use `ariaLabelledBy` for an external label ID and `ariaDescribedBy` for hint/error IDs. `ariaInvalid` overrides the invalid state; otherwise a truthy `error` marks the control invalid. `required` sets `aria-required` (and native required for Input). These props accept reactive values.

Input forwards `min`, `max`, `step`, `pattern`, `minLength` and `maxLength` to the native input, including zero values. Native constraints do not replace application validation.

Rendered field messages (error, warning, success, note or hint) receive a stable ID and are automatically associated with the interactive control through `aria-describedby`. External `ariaDescribedBy` IDs are preserved; the generated ID is removed when its message disappears.
