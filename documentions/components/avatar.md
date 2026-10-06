# Avatar

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Avatar(...children) | _.Avatar(props, ...children)",
  "props": {
    "size": {"type": "number|string", "description": "Size token, number, or CSS length for sizing.", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "style"},
    "radius": {"type": "number|string", "description": "Border radius token or CSS length applied to the component.", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "style"},
    "mobile": {"type": "{ width?, height?, minWidth?, maxWidth?, padding?, margin?, radius? }", "description": "Responsive overrides applied at the base/mobile viewport.", "default": null, "values": null, "category": "layout"},
    "tablet": {"type": "{ width?, height?, minWidth?, maxWidth?, padding?, margin?, radius? }", "description": "Responsive overrides applied from the tablet breakpoint upward.", "default": null, "values": null, "category": "layout"},
    "pc": {"type": "{ width?, height?, minWidth?, maxWidth?, padding?, margin?, radius? }", "description": "Responsive overrides applied from the desktop breakpoint upward.", "default": null, "values": null, "category": "layout"},
    "src": {"type": "string", "description": "Image source URL.", "default": null, "values": null, "category": "general"},
    "srcset": {"type": "string", "description": "Component configuration for \"srcset\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "sizes": {"type": "string", "description": "Component configuration for \"sizes\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "alt": {"type": "string", "description": "Component configuration for \"alt\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "label": {"type": "String|Node|Function|Array", "description": "Label text or node for the component.", "default": null, "values": null, "category": "general"},
    "name": {"type": "string", "description": "HTML name attribute for form submission.", "default": null, "values": null, "category": "general"},
    "initials": {"type": "string|Node|Function|Array", "description": "Component configuration for \"initials\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "text": {"type": "string|Node|Function|Array", "description": "Text content for simple components.", "default": null, "values": null, "category": "general"},
    "fontSize": {"type": "number|string", "description": "Component configuration for \"fontSize\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "square": {"type": "boolean", "description": "Use square corners instead of rounded.", "default": null, "values": null, "category": "general"},
    "elevated": {"type": "boolean", "description": "Applies elevated shadow/raised styling.", "default": false, "values": null, "category": "style"},
    "state": {"type": "string", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "string|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "iconSize": {"type": "number|string", "description": "Component configuration for \"iconSize\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "media": {"type": "Node|Function|Array", "description": "Component configuration for \"media\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "fit": {"type": "cover|contain|fill|scale-down|none", "description": "Component configuration for \"fit\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "badge": {"type": "string|number|Node|Function|Array", "description": "Component configuration for \"badge\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "notification": {"type": "string|number|Node|Function|Array", "description": "Component configuration for \"notification\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "status": {"type": "boolean|string|number|Node|Function|Array", "description": "Component configuration for \"status\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "statusColor": {"type": "success|warning|danger|info|primary|secondary|dark|light|string", "description": "Component configuration for \"statusColor\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "topLeft": {"type": "Node|Function|Array", "description": "Component configuration for \"topLeft\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "topRight": {"type": "Node|Function|Array", "description": "Component configuration for \"topRight\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "bottomLeft": {"type": "Node|Function|Array", "description": "Component configuration for \"bottomLeft\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "bottomRight": {"type": "Node|Function|Array", "description": "Component configuration for \"bottomRight\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ media?, default?, fallback?, label?, icon?, badge?, status?, topLeft?, topRight?, bottomLeft?, bottomRight? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "string|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "media": {"type": "Custom main media", "description": "Slot content for \"media\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Custom main content instead of image or fallback", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "fallback": {"type": "Fallback custom quando non c'e immagine", "description": "Slot content for \"fallback\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "label": {"type": "Fallback testuale / initials", "description": "Slot for label content.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Fallback icon", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "badge": {"type": "Badge overlay, di default top-right", "description": "Slot content for \"badge\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "status": {"type": "Presence dot or overlay content, bottom-right by default", "description": "Slot content for \"status\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "topLeft": {"type": "Top-left overlay content", "description": "Slot content for \"topLeft\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "topRight": {"type": "Top-right overlay content", "description": "Slot content for \"topRight\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "bottomLeft": {"type": "Bottom-left overlay content", "description": "Slot content for \"bottomLeft\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "bottomRight": {"type": "Bottom-right overlay content", "description": "Slot content for \"bottomRight\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Fallback icon", "description": "Slot for right-aligned icon content."}
  },
  "returns": "HTMLDivElement",
  "description": "Flexible avatar with image, smart fallbacks, states, badge, and overlay slots.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "borderRadius", "shadow", "class", "style"]}
}
```
