# AppShell

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.AppShell(...children) | _.AppShell(props, ...children)",
  "props": {
    "padding": {"type": "number|string", "description": "Padding applied to the component root element.", "default": null, "values": ["number", "CSS units", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"], "category": "layout"},
    "header": {"type": "Node|Function|Array|false", "description": "Header content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "drawer": {"type": "Node|Function|Array|false", "description": "Content or configuration for the drawer region.", "default": null, "values": null, "category": "general"},
    "page": {"type": "Node|Function|Array|false", "description": "Current page index (1-based unless documented otherwise).", "default": null, "values": null, "category": "general"},
    "footer": {"type": "Node|Function|Array|false", "description": "Footer content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "title": {"type": "string|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "subtitle": {"type": "string|Node|Function|Array", "description": "Subtitle text or node.", "default": null, "values": null, "category": "general"},
    "left": {"type": "Node|Function|Array|false", "description": "Content or configuration for the left region.", "default": null, "values": null, "category": "general"},
    "right": {"type": "Node|Function|Array", "description": "Content or configuration for the right region.", "default": null, "values": null, "category": "general"},
    "items": {"type": "Array", "description": "Array of items or nodes to render.", "default": null, "values": null, "category": "data"},
    "drawerItems": {"type": "Array", "description": "Component configuration for \"drawerItems\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "drawerHeader": {"type": "Node|Function|Array", "description": "Component configuration for \"drawerHeader\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "content": {"type": "Node|Function|Array", "description": "Main content node(s) or render function for the component body.", "default": null, "values": null, "category": "general"},
    "headerProps": {"type": "object", "description": "Component configuration for \"headerProps\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "drawerProps": {"type": "object", "description": "Component configuration for \"drawerProps\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "pageProps": {"type": "object", "description": "Component configuration for \"pageProps\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "footerProps": {"type": "object", "description": "Component configuration for \"footerProps\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "footerContent": {"type": "Node|Function|Array", "description": "Component configuration for \"footerContent\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "noDrawer": {"type": "boolean", "description": "Disables rendering of the drawer region.", "default": null, "values": null, "category": "general"},
    "reverse": {"type": "boolean", "description": "Component configuration for \"reverse\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "stack": {"type": "boolean", "description": "Component configuration for \"stack\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "flush": {"type": "boolean", "description": "Component configuration for \"flush\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "divider": {"type": "boolean", "description": "Shows dividers between items or sections.", "default": null, "values": null, "category": "general"},
    "drawerStateKey": {"type": "string", "description": "Storage key used to persist drawer open state.", "default": null, "values": null, "category": "general"},
    "stateKey": {"type": "string", "description": "Storage key used to persist component state.", "default": null, "values": null, "category": "general"},
    "drawerWidth": {"type": "number|string", "description": "Drawer width (number interpreted as px or CSS length).", "default": null, "values": null, "category": "general"},
    "gap": {"type": "number|string", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ header?, drawer?, page?, footer?, default? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "header": {"type": "Header content", "description": "Slot for header content.", "default": null, "values": null, "category": "slot"},
    "drawer": {"type": "Drawer content", "description": "Slot for drawer content.", "default": null, "values": null, "category": "slot"},
    "page": {"type": "Page content", "description": "Slot for page indicator/content.", "default": null, "values": null, "category": "slot"},
    "footer": {"type": "Footer content", "description": "Slot for footer content.", "default": null, "values": null, "category": "slot"},
    "default": {"type": "Fallback page content", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLDivElement con methods openDrawer/closeDrawer/toggleDrawer/isDrawerOpen",
  "description": "Shell applicazione composabile con shortcut per Header/Drawer/Page/Footer e gestione drawer.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

## Color inheritance and composition

`color` supplies the default color for the Header, Drawer, Page and Footer created by AppShell. Each generated component keeps its own visual treatment: for example, Page and Drawer use subtle semantic surfaces while Header uses its normal filled surface.

An explicit `color` or `state` in `headerProps`, `drawerProps`, `pageProps` or `footerProps` takes priority. Use `color: null` to opt out of inheritance. A reactive color getter is passed through, so generated components update when its value changes.

Custom nodes supplied through `header`, `drawer`, `page`, `footer` or named slots retain their own props. Color does not recursively overwrite components inside the page, and effects such as Glass or Outline are configured on the individual generated components through their props objects.

`reverse` places the drawer after the page; `stack` gives both regions the full available width. On mobile, the drawer remains hidden until opened through the header control or `openDrawer()`.
