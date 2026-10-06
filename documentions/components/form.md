# Form

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Form({ form, onSubmit, ...props }, ...children)",
  "props": {
    "form": {"type": "useForm() instance", "description": "HTML form attribute to associate controls with a form.", "default": null, "values": null, "category": "general"},
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
