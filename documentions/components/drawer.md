# Drawer

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Drawer(props)",
  "props": {
    "items": {"type": "Array", "description": "Array of items or nodes to render.", "default": null, "values": null, "category": "data"},
    "header": {"type": "Node|Function|Array", "description": "Header content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "footer": {"type": "Node|Function|Array", "description": "Footer content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "before": {"type": "Node|Function|Array", "description": "Component configuration for \"before\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "after": {"type": "Node|Function|Array", "description": "Component configuration for \"after\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "title": {"type": "String|Node|Function|Array", "description": "Title text or node.", "default": null, "values": null, "category": "general"},
    "subtitle": {"type": "String|Node|Function|Array", "description": "Subtitle text or node.", "default": null, "values": null, "category": "general"},
    "eyebrow": {"type": "String|Node|Function|Array", "description": "Component configuration for \"eyebrow\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "icon": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered with the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"},
    "content": {"type": "Node|Function|Array", "description": "Main content node(s) or render function for the component body.", "default": null, "values": null, "category": "general"},
    "meta": {"type": "Node|Function|Array", "description": "Component configuration for \"meta\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "actions": {"type": "Node|Function|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "empty": {"type": "Node|Function|Array", "description": "Component configuration for \"empty\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "emptyText": {"type": "string", "description": "Text shown when there is no data to display.", "default": null, "values": null, "category": "general"},
    "stateKey": {"type": "string", "description": "Storage key used to persist component state.", "default": null, "values": null, "category": "general"},
    "closeOnSelect": {"type": "boolean", "description": "Closes the menu/popover after selecting an item.", "default": null, "values": null, "category": "general"},
    "groupOpenIcon": {"type": "String|Node|Function|Array", "description": "Icon used to expand grouped items.", "default": null, "values": null, "category": "general"},
    "groupCloseIcon": {"type": "String|Node|Function|Array", "description": "Icon used to collapse grouped items.", "default": null, "values": null, "category": "general"},
    "itemIconSize": {"type": "string|number", "description": "Component configuration for \"itemIconSize\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "gap": {"type": "string|number", "description": "Gap/spacing between child elements.", "default": null, "values": null, "category": "general"},
    "indent": {"type": "string|number", "description": "Component configuration for \"indent\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "onSelect": {"type": "function(item, ctx, event)", "description": "Component configuration for \"onSelect\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "sticky": {"type": "boolean", "description": "Makes the component sticky within its container.", "default": null, "values": null, "category": "general"},
    "slots": {"type": "{ header?, body?, footer?, before?, after?, empty?, item?, itemLabel?, itemNote?, itemBadge?, itemAside?, itemContent?, group?, groupLabel?, groupNote?, groupBadge?, groupAside?, groupContent?, sectionLabel? }", "description": "Named slots map for render overrides.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"},
    "iconRight": {"type": "String|Node|Function|Array", "description": "Icon name or node rendered on the right side of the component.", "default": null, "values": ["#name_tabler", "name_material", "class"], "category": "general"}
  },
  "slots": {
    "header": {"type": "Drawer header, full override", "description": "Slot for header content.", "default": null, "values": null, "category": "slot"},
    "body": {"type": "Full body override", "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "footer": {"type": "Drawer footer", "description": "Slot for footer content.", "default": null, "values": null, "category": "slot"},
    "before": {"type": "Content before the item list", "description": "Slot content for \"before\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "after": {"type": "Content after the item list", "description": "Slot content for \"after\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "empty": {"type": "Empty state when there is no content", "description": "Slot for empty-state content.", "default": null, "values": null, "category": "slot"},
    "item": {"type": "Full override for a simple item", "description": "Slot for custom item rendering.", "default": null, "values": null, "category": "slot"},
    "itemLabel": {"type": "Item label (ctx: { item, label, note, badge, aside, content })", "description": "Slot for item label rendering.", "default": null, "values": null, "category": "slot"},
    "itemNote": {"type": "Item note/subtitle", "description": "Slot content for \"itemNote\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "itemBadge": {"type": "Item badge", "description": "Slot content for \"itemBadge\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "itemAside": {"type": "Item aside/meta", "description": "Slot content for \"itemAside\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "itemContent": {"type": "Extra item content", "description": "Slot content for \"itemContent\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "group": {"type": "Full override for a group header (ctx includes toggle/isOpen)", "description": "Slot for grouped content container.", "default": null, "values": null, "category": "slot"},
    "groupLabel": {"type": "Group label", "description": "Slot for group label content.", "default": null, "values": null, "category": "slot"},
    "groupNote": {"type": "Group note", "description": "Slot content for \"groupNote\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "groupBadge": {"type": "Group badge", "description": "Slot content for \"groupBadge\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "groupAside": {"type": "Group aside/meta", "description": "Slot content for \"groupAside\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "groupContent": {"type": "Extra group content", "description": "Slot content for \"groupContent\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "sectionLabel": {"type": "Label for section/heading items", "description": "Slot content for \"sectionLabel\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"}
  },
  "returns": "HTMLDivElement with openDrawer/closeDrawer/toggleDrawer/isDrawerOpen methods",
  "description": "Structured, backward-compatible drawer with header/footer, groups, extended slots, empty state, and persistent state.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

## Visual surfaces and group navigation

Drawer uses a neutral navigation surface; `color` sets the accent for selected items, hover and focus. `light` and `dark` retain their surface identity in either theme. Glass and Glossy decorate the selected navigation entry; the surrounding Drawer retains its normal surface. Other common effects and user/default radius apply to the Drawer, while the header, footer and nested groups use subtle separators. Border and Outline explicitly enable an outer contour; Dense reduces navigation spacing.

Default group arrows are inline SVG and do not require an icon font. Custom `groupOpenIcon`, `groupCloseIcon` and per-item icons remain supported. Disclosure buttons expose `aria-expanded` and `aria-controls`; collapsed groups are hidden from keyboard navigation. Selecting a leaf updates the active item and its `aria-current` state.
