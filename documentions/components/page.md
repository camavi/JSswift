# Page

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Page(...children) | _.Page(props, ...children)",
  "props": {
    "hero": {"type": "Node|Function|Array", "description": "Component configuration for \"hero\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "eyebrow": {"type": "String|Node|Function|Array", "description": "Component configuration for \"eyebrow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "subtitle": {"type": "String|Node|Function|Array", "description": "Subtitle text or node.", "default": null, "values": null, "category": "general"},
    "header": {"type": "String|Node|Function|Array", "description": "Header content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "aside": {"type": "Node|Function|Array", "description": "Content or configuration for the aside/secondary region.", "default": null, "values": null, "category": "general"},
    "body": {"type": "Node|Function|Array", "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "footer": {"type": "Node|Function|Array", "description": "Footer content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "flat": {"type": "boolean", "description": "Removes elevation/border for a flat look.", "default": false, "values": null, "category": "style"},
    "centered": {"type": "boolean", "description": "Component configuration for \"centered\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "narrow": {"type": "boolean", "description": "Component configuration for \"narrow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "gap": {"type": "string|number", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "heroPadding": {"type": "string|number", "description": "Component configuration for \"heroPadding\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "headerGap": {"type": "string|number", "description": "Component configuration for \"headerGap\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ hero?, icon?, eyebrow?, title?, subtitle?, header?, aside?, body?, footer?, actions?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "hero": {"type": "Top hero/banner area", "description": "Slot content for \"hero\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Page icon/visual", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "eyebrow": {"type": "Eyebrow/kicker content", "description": "Slot content for \"eyebrow\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "title": {"type": "Page title content", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "subtitle": {"type": "Page subtitle/description content", "description": "Slot for subtitle content.", "default": null, "values": null, "category": "slot"},
    "header": {"type": "Header support content under title", "description": "Slot for header content.", "default": null, "values": null, "category": "slot"},
    "aside": {"type": "Top-right header content", "description": "Slot for aside/secondary content.", "default": null, "values": null, "category": "slot"},
    "body": {"type": "Structured body content", "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "footer": {"type": "Footer meta/content", "description": "Slot for footer content.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Footer actions content", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback body content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Page icon/visual", "description": "Slot for right-aligned icon content."}
  },
  "returns": "HTMLDivElement",
  "description": "Structured page container with hero, header, body, footer, and configurable layout.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

## Visual surfaces

Page uses the subtle semantic background tint shared with Drawer. Light and Dark colors preserve their surface identity in either theme; Outline and Flat adapt neutral text to the page theme. Outer borders are enabled by Border or Outline, and radius follows the common default or user setting.

Glass and Glossy decorate the structured header rather than the whole content surface. Glass uses the shared Button reflections with reduced brightness in dark mode, except Light. Shadow, Light Shadow, Glow, Gradient and Text Gradient are supported; Dense tightens padding and gaps. Uncolored action buttons use a visible neutral surface and readable local text.
