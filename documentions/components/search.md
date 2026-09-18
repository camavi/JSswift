# Search

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Search(props)",
  "description": "Professional search with FormField, GET fetch, debounce, AbortController, overlay results, optional cache, reactive binding, and keyboard navigation.",
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
    "model": {
      "type": "rod | [get,set] signal",
      "description": "Two-way bound value (alias to value in some components).",
      "default": null,
      "values": null,
      "category": "data"
    },
    "value": {
      "type": "string | rod | [get,set] signal",
      "description": "Current value (controlled).",
      "default": null,
      "values": null,
      "category": "data"
    },
    "endpoint": {
      "type": "string | (query, ctx) => string",
      "description": "Component configuration for \"endpoint\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "url": {
      "type": "Alias of endpoint",
      "description": "Component configuration for \"url\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "method": {
      "type": "'GET' (internal)",
      "description": "Component configuration for \"method\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "queryParam": {
      "type": "string (default: 'q')",
      "description": "Component configuration for \"queryParam\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "params": {
      "type": "object | (query, ctx) => object",
      "description": "Component configuration for \"params\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "headers": {
      "type": "object",
      "description": "Component configuration for \"headers\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "credentials": {
      "type": "RequestCredentials",
      "description": "Component configuration for \"credentials\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "parseResponse": {
      "type": "(Response) => Promise<any>",
      "description": "Component configuration for \"parseResponse\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "mapResponse": {
      "type": "(payload, query) => Array",
      "description": "Component configuration for \"mapResponse\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "items": {
      "type": "Array | (query, ctx) => Array|Promise<Array>",
      "description": "Array of items or nodes to render.",
      "default": null,
      "values": null,
      "category": "data"
    },
    "options": {
      "type": "Local alias of items",
      "description": "Array of selectable options or option groups.",
      "default": null,
      "values": null,
      "category": "data"
    },
    "suggestions": {
      "type": "Local alias of items",
      "description": "Component configuration for \"suggestions\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "filter": {
      "type": "(item, query) => boolean",
      "description": "Component configuration for \"filter\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "getLabel": {
      "type": "(item) => string",
      "description": "Component configuration for \"getLabel\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "getValue": {
      "type": "(item) => any",
      "description": "Function to extract a value from an item object.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "minLength": {
      "type": "number (default: endpoint ? 1 : 0)",
      "description": "Component configuration for \"minLength\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "debounce": {
      "type": "number ms (default: 250)",
      "description": "Component configuration for \"debounce\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "cache": {
      "type": "boolean (default: true)",
      "description": "Component configuration for \"cache\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "highlight": {
      "type": "boolean (default: true)",
      "description": "Component configuration for \"highlight\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "clearable": {
      "type": "boolean",
      "description": "Shows a clear action to reset the current value.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "label": {
      "type": "String|Node|Function",
      "description": "Label text or node for the component.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "topLabel": {
      "type": "String|Node|Function",
      "description": "Label displayed above the control.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "placeholder": {
      "type": "string",
      "description": "Placeholder text for inputs.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "icon": {
      "type": "String|Node|Function (default: 'search')",
      "description": "Icon name or node rendered with the component.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "general"
    },
    "iconRight": {
      "type": "String|Node|Function",
      "description": "Icon name or node rendered on the right side of the component.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "general"
    },
    "shortcode": {
      "type": "string|Array<string>|object",
      "description": "Keyboard shortcut string, object, or array bound to the component action.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "showShortcode": {
      "type": "boolean",
      "description": "Displays the configured keyboard shortcut badge when the component supports it.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "openOnFocus": {
      "type": "boolean",
      "description": "Component configuration for \"openOnFocus\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "searchOnFocus": {
      "type": "boolean",
      "description": "Component configuration for \"searchOnFocus\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "searchOnInput": {
      "type": "boolean",
      "description": "Component configuration for \"searchOnInput\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "searchOnMount": {
      "type": "boolean",
      "description": "Component configuration for \"searchOnMount\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "autoSearch": {
      "type": "Alias of searchOnMount",
      "description": "Component configuration for \"autoSearch\". When not handled internally, it is forwarded to the root element.",
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
    "commitValue": {
      "type": "'label'|'value'|false",
      "description": "Component configuration for \"commitValue\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "disabled": {
      "type": "boolean|Function|rod",
      "description": "Disables interaction and applies disabled styling/ARIA.",
      "default": false,
      "values": null,
      "category": "state"
    },
    "readonly": {
      "type": "boolean|Function|rod",
      "description": "Prevents editing while keeping focus and selection.",
      "default": false,
      "values": null,
      "category": "state"
    },
    "loadingText": {
      "type": "string",
      "description": "Text displayed while loading.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "emptyText": {
      "type": "string",
      "description": "Text shown when there is no data to display.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "errorText": {
      "type": "string",
      "description": "Component configuration for \"errorText\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "startText": {
      "type": "string",
      "description": "Component configuration for \"startText\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "inputClass": {
      "type": "string",
      "description": "Component configuration for \"inputClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "menuClass": {
      "type": "string",
      "description": "Component configuration for \"menuClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "wrapClass": {
      "type": "string",
      "description": "Additional CSS classes applied to the outer wrapper.",
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
    "result": {
      "type": "Result renderer ({ item, index, active, label, value, query, select })",
      "description": "Slot content for \"result\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "empty": {
      "type": "Empty state ({ query })",
      "description": "Slot for empty-state content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "loading": {
      "type": "Loading state ({ query })",
      "description": "Slot for loading state content.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "error": {
      "type": "Error state ({ error, query })",
      "description": "Slot content for \"error\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "label": {
      "type": "Floating label",
      "description": "Slot for label content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "topLabel": {
      "type": "Top label",
      "description": "Slot for top label content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "prefix": {
      "type": "Left addon",
      "description": "Slot for prefix content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "suffix": {
      "type": "Right addon",
      "description": "Slot for suffix content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "icon": {
      "type": "Left icon",
      "description": "Slot for icon content.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "slot"
    },
    "iconRight": {
      "type": "Right icon",
      "description": "Slot for right-aligned icon content.",
      "default": null,
      "values": [
        "#name_tabler",
        "name_material",
        "class"
      ],
      "category": "slot"
    },
    "shortcode": {
      "type": "Shortcut badge",
      "description": "Slot content for \"shortcode\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "clear": {
      "type": "Clear button",
      "description": "Slot for the clear control/content.",
      "default": null,
      "values": null,
      "category": "slot"
    }
  },
  "events": {
    "onInput": "(query, event)",
    "onChange": "(query, event)",
    "onSearch": "(query)",
    "onResults": "(results, query)",
    "onSelect": "(item, { value, label, query, event })",
    "onSubmit": "(query, event)",
    "onClear": "()",
    "onError": "(error, query)",
    "onFocus": "(event)",
    "onBlur": "(event)"
  },
  "keyboard": {
    "ArrowDown": "Opens/moves to the next result",
    "ArrowUp": "Moves to the previous result",
    "Enter": "Selects the active result or submits the query",
    "Escape": "Closes the overlay",
    "Cmd/Ctrl+Home": "First result",
    "Cmd/Ctrl+End": "Last result"
  },
  "returns": "HTMLDivElement (field wrapper) with ._input, ._open(), ._close(), ._searchNow(), ._getResults(), ._setValue(value), ._dispose()"
}
```
