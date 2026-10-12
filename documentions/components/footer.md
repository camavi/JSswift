# Footer

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Footer(...children) | _.Footer(props, ...children)",
  "props": {
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "subtitle": {"type": "String|Node|Function|Array", "description": "Subtitle text or node.", "default": null, "values": null, "category": "general"},
    "eyebrow": {"type": "String|Node|Function|Array", "description": "Component configuration for \"eyebrow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "content": {"type": "Node|Function|Array", "description": "Main content node(s) or render function for the component body.", "default": null, "values": null, "category": "general"},
    "meta": {"type": "Node|Function|Array", "description": "Component configuration for \"meta\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "left": {"type": "Node|Function|Array", "description": "Content or configuration for the left region.", "default": null, "values": null, "category": "general"},
    "start": {"type": "Alias of left", "description": "Component configuration for \"start\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "right": {"type": "Node|Function|Array", "description": "Content or configuration for the right region.", "default": null, "values": null, "category": "general"},
    "end": {"type": "Alias of right", "description": "Component configuration for \"end\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "body": {"type": "Alias of content", "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "sticky": {"type": "boolean", "description": "Makes the component sticky within its container.", "default": null, "values": null, "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "elevated": {"type": "boolean", "description": "Applies elevated shadow/raised styling.", "default": false, "values": null, "category": "style"},
    "divider": {"type": "boolean", "description": "Shows dividers between items or sections.", "default": null, "values": null, "category": "general"},
    "align": {"type": "left|center|right", "description": "Alignment of content along the cross axis (e.g. left/center/right).", "default": null, "values": ["left", "center", "right"], "category": "general"},
    "justify": {"type": "flex-start|center|flex-end|space-between|space-around|space-evenly", "description": "Justification of items along the main axis.", "default": null, "values": ["start", "center", "end", "space-between", "space-around", "space-evenly"], "category": "general"},
    "wrap": {"type": "boolean", "description": "Allows children to wrap to new lines.", "default": null, "values": null, "category": "general"},
    "stack": {"type": "boolean", "description": "Component configuration for \"stack\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "gap": {"type": "string|number", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ left?, start?, right?, end?, center?, body?, icon?, eyebrow?, title?, subtitle?, meta?, content?, actions?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "left": {"type": "Footer leading area", "description": "Slot for left-aligned content.", "default": null, "values": null, "category": "slot"},
    "start": {"type": "Alias/addon for the leading area", "description": "Slot content for \"start\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "right": {"type": "Footer trailing area", "description": "Slot for right-aligned content.", "default": null, "values": null, "category": "slot"},
    "end": {"type": "Alias/addon for the trailing area", "description": "Slot content for \"end\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "center": {"type": "Full override for the central body", "description": "Slot for centered content within a toolbar/row.", "default": null, "values": null, "category": "slot"},
    "body": {"type": "Alias of center", "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "icon": {"type": "Leading icon", "description": "Slot for icon content.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "slot"},
    "eyebrow": {"type": "Eyebrow / kicker", "description": "Slot content for \"eyebrow\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "title": {"type": "Main title", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "subtitle": {"type": "Subtitle or note", "description": "Slot for subtitle content.", "default": null, "values": null, "category": "slot"},
    "meta": {"type": "Meta info next to the central content", "description": "Slot content for \"meta\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "content": {"type": "Extra content or children fallback", "description": "Slot for the main body content.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Actions grouped in the trailing area", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback content for the body area", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "iconRight": {"type": "Leading icon", "description": "Slot for right-aligned icon content."}
  },
  "returns": "HTMLElement <footer>",
  "description": "Structured footer with start/body/end regions, optional copy, actions, and composable slots.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

## Visual treatment

Footer follows Header semantic surfaces, shadows, softened Glow and dark Glass reflections (brightness .6, except Light). Supporting text inherits the local foreground and uncolored actions use a visible button surface. Dense reduces padding, typography and action size. Neutral Outline adapts foreground to the page theme. Flat retains the filled surface foreground, including light text on Dark. Text Gradient applies to the title; Stack keeps natural content height. The default top divider remains subtle; use `divider: false` to hide it.

Text Gradient uses a subtle theme-adapted tinted background, applying the gradient to the title while supporting copy and actions keep the theme foreground. Outline remains transparent.

Light with Outline + Text Gradient retains a pale translucent surface, dark foreground and a light contour in both themes.
