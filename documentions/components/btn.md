# Button

Preferred application name: `_.Button`. `_.Btn` is a compatible alias; the contract ID remains `component:btn`.

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Button(...children) | _.Button(props, ...children)",
  "props": {
    "color": {"type": "primary|secondary|warning|danger|success|info|light|dark", "description": "Semantic color name used to style the component.", "default": null, "values": ["primary", "secondary", "success", "warning", "danger", "info", "light", "dark"], "category": "style"},
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "iconAlign": {"type": "before|after|left|right", "description": "Position of the icon relative to the label.", "default": null, "values": ["left", "right", "before", "after"], "category": "general"},
    "loading": {"type": "boolean", "description": "Shows loading state and disables interactions where appropriate.", "default": null, "values": null, "category": "state"},
    "disabled": {"type": "boolean", "description": "Disables interaction and applies disabled styling/ARIA.", "default": false, "values": null, "category": "state"},
    "shortcode": {"type": "string|Array<string>|object", "description": "Keyboard shortcut string, object, or array bound to the component action.", "default": null, "values": null, "category": "general"},
    "showShortcode": {"type": "boolean", "description": "Displays the configured keyboard shortcut badge when the component supports it.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ icon?, label?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "icon": {"type": "Icon slot", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "iconRight": {"type": "Right icon slot", "description": "Slot for right-aligned icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "label": {"type": "Label slot", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Button content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "events": ["click", "pointerdown", "focus", "blur"],
  "returns": "HTMLButtonElement",
  "description": "Button component meta definition.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

Button feedback transitions exclude layout properties (width, padding and flex), so responsive resizing does not animate through clipped labels. External pagers should give text and icons sufficient space; see the AI mobile pager example.
