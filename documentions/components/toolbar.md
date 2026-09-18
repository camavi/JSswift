# Toolbar

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Toolbar(...children) | UI.Toolbar(props, ...children)",
  "props": {
    "size": {
      "type": "xxs|xs|sm|md|lg|xl|xxl",
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
    "before": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"before\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "start": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"start\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "left": {
      "type": "Alias of start",
      "description": "Content or configuration for the left region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "center": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"center\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "body": {
      "type": "Alias of center",
      "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "content": {
      "type": "Alias of center",
      "description": "Main content node(s) or render function for the component body.",
      "default": null,
      "values": null,
      "category": "general"
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
    "meta": {
      "type": "String|Node|Function|Array",
      "description": "Component configuration for \"meta\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "end": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"end\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "right": {
      "type": "Alias of end",
      "description": "Content or configuration for the right region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "actions": {
      "type": "Alias of end",
      "description": "Content rendered in the action area, typically in a footer or trailing region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "after": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"after\". When not handled internally, it is forwarded to the root element.",
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
    "divider": {
      "type": "boolean",
      "description": "Shows dividers between items or sections.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "elevated": {
      "type": "boolean",
      "description": "Applies elevated shadow/raised styling.",
      "default": false,
      "values": null,
      "category": "style"
    },
    "sticky": {
      "type": "boolean",
      "description": "Makes the component sticky within its container.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "wrap": {
      "type": "boolean|string",
      "description": "Allows children to wrap to new lines.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "align": {
      "type": "stretch|flex-start|center|flex-end|baseline",
      "description": "Alignment of content along the cross axis (e.g. left/center/right).",
      "default": null,
      "values": [
        "left",
        "center",
        "right"
      ],
      "category": "general"
    },
    "justify": {
      "type": "flex-start|center|flex-end|space-between|space-around|space-evenly",
      "description": "Justification of items along the main axis.",
      "default": null,
      "values": [
        "start",
        "center",
        "end",
        "space-between",
        "space-around",
        "space-evenly"
      ],
      "category": "general"
    },
    "gap": {
      "type": "string|number (e.g. '8px' or 'var(--cms-s-md)')",
      "description": "Gap/spacing between child elements.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "beforeClass": {
      "type": "string",
      "description": "Component configuration for \"beforeClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "startClass": {
      "type": "string",
      "description": "Component configuration for \"startClass\". When not handled internally, it is forwarded to the root element.",
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
    "centerClass": {
      "type": "Alias of bodyClass",
      "description": "Component configuration for \"centerClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "contentClass": {
      "type": "Alias of bodyClass",
      "description": "Additional CSS classes applied to the content container.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "copyClass": {
      "type": "string",
      "description": "Component configuration for \"copyClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "titleClass": {
      "type": "string",
      "description": "Component configuration for \"titleClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "subtitleClass": {
      "type": "string",
      "description": "Component configuration for \"subtitleClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "metaClass": {
      "type": "string",
      "description": "Component configuration for \"metaClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "endClass": {
      "type": "string",
      "description": "Component configuration for \"endClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "afterClass": {
      "type": "string",
      "description": "Component configuration for \"afterClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ before?, start?, left?, center?, body?, content?, title?, subtitle?, meta?, end?, right?, actions?, after?, default? }",
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
    }
  },
  "slots": {
    "before": {
      "type": "Optional top row",
      "description": "Slot content for \"before\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "start": {
      "type": "Leading content area",
      "description": "Slot content for \"start\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "left": {
      "type": "Alias of start",
      "description": "Slot for left-aligned content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "center": {
      "type": "Main content area",
      "description": "Slot for centered content within a toolbar/row.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "body": {
      "type": "Alias of center",
      "description": "Slot content for \"body\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "content": {
      "type": "Alias of center",
      "description": "Slot for the main body content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "title": {
      "type": "Toolbar main title",
      "description": "Slot for title content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "subtitle": {
      "type": "Subtitle or operational note",
      "description": "Slot for subtitle content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "meta": {
      "type": "Meta info/chips above or next to the title",
      "description": "Slot content for \"meta\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "end": {
      "type": "Trailing actions area",
      "description": "Slot content for \"end\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "right": {
      "type": "Alias of end",
      "description": "Slot for right-aligned content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "actions": {
      "type": "Alias of end",
      "description": "Slot for action buttons or links.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "after": {
      "type": "Optional bottom row",
      "description": "Slot content for \"after\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "default": {
      "type": "Fallback content / children",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    }
  },
  "events": {
    "onClick": "MouseEvent"
  },
  "description": "Composable toolbar with before/start/center/end/after regions, optional copy, and fallback compatible with simple flex usage.",
  "returns": "HTMLDivElement"
}
```
