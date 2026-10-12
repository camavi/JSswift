# Form

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Form({ form, onSubmit, ...props }, ...children)",
  "props": {
    "form": {"type": "useForm() instance", "description": "Instance returned by _.useForm({ model, rules, initial, validateOn }).", "default": null, "values": null, "category": "general"},
    "onSubmit": {"type": "async (model, form) => any", "description": "Callback fired when a form is submitted.", "default": null, "values": null, "category": "events"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "default": {"type": "(form) => Node|Array|Node", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLFormElement",
  "description": "Form component meta definition.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

Form handles native submit/reset, supports children or slots.default(form), and applies common sizing/spacing props. Its submitting effect stops on JSswift lifecycle cleanup. See [forms](../ui/forms.md) for binding, validation, reset and submit behavior.
