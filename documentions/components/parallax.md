# Parallax

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Parallax(...children) | _.Parallax(props, ...children)",
  "props": {
    "src": {"type": "string", "description": "Image source URL.", "default": null, "values": null, "category": "general"},
    "image": {"type": "string", "description": "Component configuration for \"image\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "background": {"type": "string", "description": "Component configuration for \"background\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "backgroundContent": {"type": "Node|Function|Array", "description": "Component configuration for \"backgroundContent\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "textColor": {"type": "string|Function", "description": "Explicit foreground color; color selects the semantic surface.", "default": null, "values": null, "category": "style"},
    "speed": {"type": "number", "description": "Scroll displacement multiplier (default 0.18).", "default": null, "values": null, "category": "general"},
    "maxOffset": {"type": "number", "description": "Component configuration for \"maxOffset\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "startTop": {"type": "number", "description": "Starting scroll offset for parallax effects.", "default": null, "values": null, "category": "general"},
    "state": {"type": "success|warning|danger|info|primary|secondary|dark|light|string", "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "overlay": {"type": "string", "description": "Renders content in an overlay layer or portal.", "default": null, "values": null, "category": "general"},
    "bgPosition": {"type": "string", "description": "CSS background-position value for the background image/layer.", "default": null, "values": null, "category": "general"},
    "bgSize": {"type": "string", "description": "CSS background-size value for the background image/layer.", "default": null, "values": null, "category": "general"},
    "bgRepeat": {"type": "string", "description": "Component configuration for \"bgRepeat\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "gap": {"type": "string|number", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "justify": {"type": "string", "description": "Justification of items along the main axis.", "default": null, "values": ["start", "center", "end", "space-between", "space-around", "space-evenly"], "category": "general"},
    "align": {"type": "string", "description": "Alignment of content along the cross axis (e.g. left/center/right).", "default": null, "values": ["left", "center", "right"], "category": "general"},
    "contentMaxWidth": {"type": "string|number", "description": "Component configuration for \"contentMaxWidth\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "disabled": {"type": "boolean", "description": "Disables interaction and applies disabled styling/ARIA.", "default": false, "values": null, "category": "state"},
    "badge": {"type": "Node|Function|Array", "description": "Component configuration for \"badge\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "eyebrow": {"type": "String|Node|Function|Array", "description": "Component configuration for \"eyebrow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "subtitle": {"type": "String|Node|Function|Array", "description": "Subtitle text or node.", "default": null, "values": null, "category": "general"},
    "header": {"type": "Node|Function|Array", "description": "Header content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "aside": {"type": "Node|Function|Array", "description": "Content or configuration for the aside/secondary region.", "default": null, "values": null, "category": "general"},
    "media": {"type": "Node|Function|Array", "description": "Component configuration for \"media\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "content": {"type": "Node|Function|Array", "description": "Main content node(s) or render function for the component body.", "default": null, "values": null, "category": "general"},
    "footer": {"type": "Node|Function|Array", "description": "Footer content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "bgClass": {"type": "string", "description": "Additional CSS classes applied to the background layer.", "default": null, "values": null, "category": "general"},
    "badgeClass": {"type": "string", "description": "Component configuration for \"badgeClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "headerClass": {"type": "string", "description": "Component configuration for \"headerClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "bodyClass": {"type": "string", "description": "Component configuration for \"bodyClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "footerClass": {"type": "string", "description": "Component configuration for \"footerClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "contentClass": {"type": "string", "description": "Additional CSS classes applied to the content container.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ background?, badge?, eyebrow?, title?, subtitle?, header?, aside?, media?, content?, footer?, actions?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "background": {"type": "Decorative content inside the background layer", "description": "Slot content for \"background\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "badge": {"type": "Meta badge/chip above the main content", "description": "Slot content for \"badge\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "eyebrow": {"type": "Eyebrow/kicker", "description": "Slot content for \"eyebrow\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "title": {"type": "Main title", "description": "Slot for title content.", "default": null, "values": null, "category": "slot"},
    "subtitle": {"type": "Subtitle or supporting text", "description": "Slot for subtitle content.", "default": null, "values": null, "category": "slot"},
    "header": {"type": "Additional header content", "description": "Slot for header content.", "default": null, "values": null, "category": "slot"},
    "aside": {"type": "Header side area", "description": "Slot for aside/secondary content.", "default": null, "values": null, "category": "slot"},
    "media": {"type": "Media content or foreground card", "description": "Slot content for \"media\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "content": {"type": "Main body", "description": "Slot for the main body content.", "default": null, "values": null, "category": "slot"},
    "footer": {"type": "Informational footer", "description": "Slot for footer content.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Actions area", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback body content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLDivElement with refresh/update/destroy methods",
  "description": "Standardized parallax hero/section with structured header, body, actions, slots, and minimal refresh API.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

## Semantic surfaces and moving media

`color` selects the semantic surface, following Stat colors and effects. Use `textColor` for an explicit foreground override. Without an image, the background uses the selected surface; without a color, it uses a subtle neutral surface. Light and Dark retain dedicated filled surfaces, while their Outline/Flat text adapts to the page theme.

`src`, `image`, `background` and `backgroundContent` belong to the independently moving background layer. With media present, content defaults to a light foreground and the background receives a translucent semantic tint above the image and a readability gradient (neutral dark when no color is set). Light uses a pale veil with dark text; override these through `textColor` and `overlay` for your image. Glass uses the shared optical reflection, with darker reflections in the dark theme except for Light.

Dense reduces padding, gaps and title size. Height is a minimum so long content can grow without clipping. Text Gradient applies to the title. Shadow, Light Shadow, Glow and optional Border follow the Stat treatment. Background movement is disabled when the user requests reduced motion; foreground content remains stationary.

With media, Glass, Glossy, Gradient and Light Shadow are stationary translucent veils above the moving background and below the content. Their reflections and shading remain visible over the image; combined effects compose on separate layers.
