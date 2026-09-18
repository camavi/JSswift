# Popover

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Popover(props) | UI.Popover(props, ...children) -> { open, close, show, hide, toggle, update, bind, isOpen }",
  "props": {
    "size": {
      "type": "xs|sm|md|lg|xl",
      "description": "Size token, number, or CSS length for sizing.",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "style"
    },
    "color": {
      "type": "Alias of state",
      "description": "Semantic color name used to style the component.",
      "default": null,
      "values": [
        "primary",
        "secondary",
        "success",
        "warning",
        "danger",
        "info",
        "light",
        "dark"
      ],
      "category": "style"
    },
    "outline": {
      "type": "boolean",
      "description": "Uses outlined visual style.",
      "default": false,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "style"
    },
    "clickable": {
      "type": "boolean",
      "description": "Enables pointer/hover styles and click handling on the component.",
      "default": false,
      "values": null,
      "category": "behavior"
    },
    "padding": {
      "type": "string|number",
      "description": "Padding applied to the component root element.",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "margin": {
      "type": "string|number",
      "description": "Margin applied to the component root element.",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "width": {
      "type": "string|number",
      "description": "Explicit width (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "minWidth": {
      "type": "string|number",
      "description": "Minimum width constraint (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "maxWidth": {
      "type": "string|number",
      "description": "Maximum width constraint (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "height": {
      "type": "string|number",
      "description": "Explicit height (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "minHeight": {
      "type": "string|number",
      "description": "Minimum height constraint (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "maxHeight": {
      "type": "string|number",
      "description": "Maximum height constraint (number interpreted as px or CSS length).",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "layout"
    },
    "radius": {
      "type": "string|number",
      "description": "Border radius token or CSS length applied to the component.",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "style"
    },
    "borderRadius": {
      "type": "string|number",
      "description": "Border radius token or CSS length applied to the component.",
      "default": null,
      "values": [
        "number",
        "CSS units",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "style"
    },
    "shadow": {
      "type": "string|boolean",
      "description": "Shadow token or CSS box-shadow string applied to the component.",
      "default": null,
      "values": [
        "none",
        "xxs",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "xxl",
        "xxxl"
      ],
      "category": "style"
    },
    "mobile": {
      "type": "object",
      "description": "Responsive overrides applied at the base/mobile viewport.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "tablet": {
      "type": "object",
      "description": "Responsive overrides applied from the tablet breakpoint upward.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "pc": {
      "type": "object",
      "description": "Responsive overrides applied from the desktop breakpoint upward.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "class": {
      "type": "string",
      "description": "Additional CSS classes applied to the component root element.",
      "default": null,
      "values": null,
      "category": "style"
    },
    "style": {
      "type": "object",
      "description": "Inline styles applied to the component root element.",
      "default": null,
      "values": null,
      "category": "style"
    },
    "title": {
      "type": "String|Node|Function|Array|({ close })=>Node",
      "description": "Title text or node.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "subtitle": {
      "type": "String|Node|Function|Array|({ close })=>Node",
      "description": "Subtitle text or node.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "eyebrow": {
      "type": "String|Node|Function|Array|({ close })=>Node",
      "description": "Component configuration for \"eyebrow\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "icon": {
      "type": "String|Node|Function|Array",
      "description": "Icon name or node rendered with the component.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "general"
    },
    "content": {
      "type": "Node|Function|Array|({ close })=>Node",
      "description": "Main content node(s) or render function for the component body.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "body": {
      "type": "Alias of content",
      "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "actions": {
      "type": "Node|Function|Array|({ close })=>Node",
      "description": "Content rendered in the action area, typically in a footer or trailing region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "footer": {
      "type": "Alias of actions",
      "description": "Footer content node(s) or render function.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "state": {
      "type": "primary|secondary|warning|danger|success|info|light|dark",
      "description": "Component configuration for \"state\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "trigger": {
      "type": "click|hover|focus|manual|Array",
      "description": "Component configuration for \"trigger\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "placement": {
      "type": "string",
      "description": "Overlay placement relative to the target/anchor.",
      "default": null,
      "values": [
        "top",
        "bottom",
        "left",
        "right",
        "top-start",
        "top-end",
        "bottom-start",
        "bottom-end"
      ],
      "category": "general"
    },
    "offsetX": {
      "type": "number",
      "description": "Horizontal offset for overlay placement in pixels.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "offsetY": {
      "type": "number",
      "description": "Vertical offset for overlay placement in pixels.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "offset": {
      "type": "Alias of offsetY",
      "description": "General offset for positioning.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "bodyMaxHeight": {
      "type": "string|number",
      "description": "Component configuration for \"bodyMaxHeight\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "contentMaxHeight": {
      "type": "Alias of bodyMaxHeight",
      "description": "Component configuration for \"contentMaxHeight\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "backdrop": {
      "type": "boolean",
      "description": "Whether to render a backdrop overlay behind the component.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "lockScroll": {
      "type": "boolean",
      "description": "Prevents body scroll while an overlay is open.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "trapFocus": {
      "type": "boolean",
      "description": "Keeps focus trapped inside the dialog/popover.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "autoFocus": {
      "type": "boolean",
      "description": "Component configuration for \"autoFocus\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "closeButton": {
      "type": "boolean",
      "description": "Component configuration for \"closeButton\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "closable": {
      "type": "boolean",
      "description": "Component configuration for \"closable\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "closeOnSelect": {
      "type": "boolean",
      "description": "Closes the menu/popover after selecting an item.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "closeOnOutside": {
      "type": "boolean",
      "description": "Closes the component when clicking outside its bounds.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "closeOnBackdrop": {
      "type": "boolean",
      "description": "Component configuration for \"closeOnBackdrop\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "closeOnEsc": {
      "type": "boolean",
      "description": "Closes the component when the Escape key is pressed.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "open": {
      "type": "boolean|rod|signal",
      "description": "Controls open/visible state (controlled).",
      "default": null,
      "values": null,
      "category": "general"
    },
    "anchorEl": {
      "type": "HTMLElement|VirtualAnchor",
      "description": "Component configuration for \"anchorEl\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "triggerEl": {
      "type": "Alias of anchorEl",
      "description": "Component configuration for \"triggerEl\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "target": {
      "type": "Alias of anchorEl",
      "description": "Target element or anchor used for positioning.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ icon?, eyebrow?, title?, subtitle?, header?, content?, body?, footer?, actions?, close?, default? }",
      "description": "Named slots map for render overrides.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "panelClass": {
      "type": "string",
      "description": "Component configuration for \"panelClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "overlayClass": {
      "type": "string",
      "description": "Component configuration for \"overlayClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "onOpen": {
      "type": "function",
      "description": "Callback fired when the component opens.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "onClose": {
      "type": "function",
      "description": "Callback fired when the component closes.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "onTriggerClick": {
      "type": "function",
      "description": "Component configuration for \"onTriggerClick\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "children": {
      "type": "Node|Array|Function",
      "description": "Default child content (nodes, arrays, or render function).",
      "default": null,
      "values": null,
      "category": "general"
    },
    "iconRight": {
      "type": "String|Node|Function|Array",
      "description": "Icon name or node rendered on the right side of the component.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "general"
    }
  },
  "slots": {
    "icon": {
      "type": "Popover icon",
      "description": "Slot for icon content.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "slot"
    },
    "eyebrow": {
      "type": "Popover eyebrow ({ close })",
      "description": "Slot content for \"eyebrow\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "title": {
      "type": "Popover title ({ close })",
      "description": "Slot for title content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "subtitle": {
      "type": "Popover subtitle ({ close })",
      "description": "Slot for subtitle content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "header": {
      "type": "Header custom ({ close })",
      "description": "Slot for header content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "content": {
      "type": "Popover body ({ close })",
      "description": "Slot for the main body content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "body": {
      "type": "Alias of content ({ close })",
      "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "footer": {
      "type": "Popover footer ({ close })",
      "description": "Slot for footer content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "actions": {
      "type": "Alias of footer ({ close })",
      "description": "Slot for action buttons or links.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "close": {
      "type": "Close button slot ({ close })",
      "description": "Slot content for \"close\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "default": {
      "type": "Fallback body ({ close })",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "iconRight": {
      "type": "Popover icon",
      "description": "Slot for right-aligned icon content."
    }
  },
  "events": {
    "onOpen": "void",
    "onClose": "void"
  },
  "returns": "Object { open(), close(), show(), hide(), toggle(), update(), bind(), isOpen() }",
  "description": "Standardized anchored popover with rich layout, complete slots, bindable triggers, and imperative API."
}
```
