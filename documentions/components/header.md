# Header

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Header(...children) | _.Header(props, ...children)",
  "props": {
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "subtitle": {"type": "String|Node|Function|Array", "description": "Subtitle text or node.", "default": null, "values": null, "category": "general"},
    "eyebrow": {"type": "String|Node|Function|Array", "description": "Component configuration for \"eyebrow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "content": {"type": "Node|Function|Array", "description": "Main content node(s) or render function for the component body.", "default": null, "values": null, "category": "general"},
    "meta": {"type": "Node|Function|Array", "description": "Component configuration for \"meta\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "left": {"type": "Node|Function|Array|false", "description": "Content or configuration for the left region.", "default": null, "values": null, "category": "general"},
    "right": {"type": "Node|Function|Array", "description": "Content or configuration for the right region.", "default": null, "values": null, "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "drawerOpenIcon": {"type": "string|Node", "description": "Icon used for the drawer open control.", "default": null, "values": null, "category": "general"},
    "drawerCloseIcon": {"type": "string|Node", "description": "Icon used for the drawer close control.", "default": null, "values": null, "category": "general"},
    "drawerStateKey": {"type": "string", "description": "Storage key used to persist drawer open state.", "default": null, "values": null, "category": "general"},
    "sticky": {"type": "boolean", "description": "Makes the component sticky within its container.", "default": null, "values": null, "category": "general"},
    "stack": {"type": "boolean", "description": "Component configuration for \"stack\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "elevated": {"type": "boolean", "description": "Applies elevated shadow/raised styling.", "default": false, "values": null, "category": "style"},
    "divider": {"type": "boolean", "description": "Shows dividers between items or sections.", "default": null, "values": null, "category": "general"},
    "gap": {"type": "string|number", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ left?, start?, right?, end?, center?, body?, icon?, eyebrow?, title?, subtitle?, meta?, content?, actions? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "left": {"type": "Left area, falls back to the drawer toggle", "description": "Slot for left-aligned content.", "default": null, "values": null, "category": "slot"},
    "start": {"type": "Alias/addon for the left area", "description": "Slot content for \"start\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "right": {"type": "Main right area", "description": "Slot for right-aligned content.", "default": null, "values": null, "category": "slot"},
    "end": {"type": "Alias/addon for the right area", "description": "Slot content for \"end\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "center": {"type": "Full override for the central body", "description": "Slot for centered content within a toolbar/row.", "default": null, "values": null, "category": "slot"},
    "body": {"type": "Alias of center", "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Leading icon", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "eyebrow": {"type": "Eyebrow / kicker", "description": "Slot content for \"eyebrow\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "title": {"type": "Title", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "subtitle": {"type": "Subtitle", "description": "Slot for subtitle content.", "default": null, "values": null, "category": "slot"},
    "meta": {"type": "Meta info next to the central content", "description": "Slot content for \"meta\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "content": {"type": "Extra content below the subtitle", "description": "Slot for the main body content.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Actions grouped in the right area", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Leading icon", "description": "Slot for right-aligned icon content."}
  },
  "returns": "HTMLDivElement",
  "description": "Structured header with start/body/end regions, integrated drawer toggle, metadata, and composable slots.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```
