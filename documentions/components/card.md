# Card

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Card(...children) | UI.Card(props, ...children)",
  "description": "Sectioned card with structured header, cover/media, body, and footer/actions.",
  "props": {
    "size": {
      "type": "string|number",
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
      "type": "string",
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
      "type": "{ display?, direction?, gap?, cols? }",
      "description": "Responsive overrides applied at the base/mobile viewport.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "tablet": {
      "type": "{ display?, direction?, gap?, cols? }",
      "description": "Responsive overrides applied from the tablet breakpoint upward.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "pc": {
      "type": "{ display?, direction?, gap?, cols? }",
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
      "type": "String|Node|Function|Array",
      "description": "Title text or node.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "subtitle": {
      "type": "String|Node|Function|Array",
      "description": "Subtitle text or node.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "eyebrow": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"eyebrow\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "header": {
      "type": "String|Node|Function|Array",
      "description": "Header content node(s) or render function.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "body": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "footer": {
      "type": "String|Node|Function|Array",
      "description": "Footer content node(s) or render function.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "actions": {
      "type": "Node|Function|Array",
      "description": "Content rendered in the action area, typically in a footer or trailing region.",
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
    "aside": {
      "type": "Node|Function|Array",
      "description": "Content or configuration for the aside/secondary region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "identifier": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"identifier\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "media": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"media\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "cover": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"cover\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "image": {
      "type": "string",
      "description": "Component configuration for \"image\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "imageAlt": {
      "type": "string",
      "description": "Component configuration for \"imageAlt\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "coverHeight": {
      "type": "string|number",
      "description": "Component configuration for \"coverHeight\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "to": {
      "type": "string",
      "description": "Navigation target/route to open on click.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "dense": {
      "type": "boolean",
      "description": "Uses compact spacing and sizing.",
      "default": false,
      "values": null,
      "category": "layout"
    },
    "flat": {
      "type": "boolean",
      "description": "Removes elevation/border for a flat look.",
      "default": false,
      "values": null,
      "category": "style"
    },
    "display": {
      "type": "string",
      "description": "Component configuration for \"display\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "direction": {
      "type": "row|column|string",
      "description": "Component configuration for \"direction\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "gap": {
      "type": "string|number",
      "description": "Gap/spacing between child elements.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "cols": {
      "type": "number|string",
      "description": "Number of columns for grid layouts.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "headerClass": {
      "type": "string",
      "description": "Component configuration for \"headerClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "bodyClass": {
      "type": "string",
      "description": "Component configuration for \"bodyClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "footerClass": {
      "type": "string",
      "description": "Component configuration for \"footerClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ identifier?, cover?, media?, icon?, eyebrow?, title?, subtitle?, header?, aside?, body?, footer?, actions?, default? }",
      "description": "Named slots map for render overrides.",
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
    "identifier": {
      "type": "Badge/top identifier content",
      "description": "Slot content for \"identifier\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "cover": {
      "type": "Top visual/cover content",
      "description": "Slot content for \"cover\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "media": {
      "type": "Media section above header/body",
      "description": "Slot content for \"media\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "icon": {
      "type": "Header icon content",
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
      "type": "Eyebrow/kicker content",
      "description": "Slot content for \"eyebrow\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "title": {
      "type": "Card title content",
      "description": "Slot for title content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "subtitle": {
      "type": "Card subtitle content",
      "description": "Slot for subtitle content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "header": {
      "type": "Header support content",
      "description": "Slot for header content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "aside": {
      "type": "Right side header content",
      "description": "Slot for aside/secondary content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "body": {
      "type": "Body content",
      "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "footer": {
      "type": "Footer content",
      "description": "Slot for footer content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "actions": {
      "type": "Footer actions slot",
      "description": "Slot for action buttons or links.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "default": {
      "type": "Fallback body content or raw card sections",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "iconRight": {
      "type": "Header icon content",
      "description": "Slot for right-aligned icon content."
    }
  },
  "returns": "HTMLDivElement"
}
```
