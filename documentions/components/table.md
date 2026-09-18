# Table

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Table(props)",
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
    "columns": {
      "type": "Array<{ key, label?, sortable?, get?, value?, render?, format?, width?, minWidth?, maxWidth?, align?, compare?, style?, headerStyle?, thStyle?, cellStyle?, tdStyle?, cellClass?, headerClass?, nowrap?, searchable? }>",
      "description": "Column definitions for table-like components.",
      "default": null,
      "values": null,
      "category": "data"
    },
    "rows": {
      "type": "Array|() => Array",
      "description": "Row data array for table-like components.",
      "default": null,
      "values": null,
      "category": "data"
    },
    "rowKey": {
      "type": "string|((row)=>string)",
      "description": "Key or function used to derive unique row IDs.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "loading": {
      "type": "boolean|() => boolean",
      "description": "Shows loading state and disables interactions where appropriate.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "page": {
      "type": "number",
      "description": "Current page index (1-based unless documented otherwise).",
      "default": null,
      "values": null,
      "category": "general"
    },
    "pageSize": {
      "type": "number",
      "description": "Number of items per page.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "pageSizeOptions": {
      "type": "number[]",
      "description": "Component configuration for \"pageSizeOptions\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "pagination": {
      "type": "boolean",
      "description": "Component configuration for \"pagination\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "initialSort": {
      "type": "{ key, dir: 'asc'|'desc' }",
      "description": "Initial sort configuration for table data.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "search": {
      "type": "string",
      "description": "Component configuration for \"search\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "query": {
      "type": "string",
      "description": "Component configuration for \"query\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "searchable": {
      "type": "boolean|string",
      "description": "Component configuration for \"searchable\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "searchPlaceholder": {
      "type": "string",
      "description": "Component configuration for \"searchPlaceholder\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "searchKeys": {
      "type": "Array<string|function>",
      "description": "Component configuration for \"searchKeys\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "searchModel": {
      "type": "[get,set] signal",
      "description": "Component configuration for \"searchModel\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "filter": {
      "type": "(row, ctx)=>boolean",
      "description": "Component configuration for \"filter\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "actions": {
      "type": "(row, ctx)=>Node|Array",
      "description": "Content rendered in the action area, typically in a footer or trailing region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "actionsLabel": {
      "type": "string|Node|Function|Array",
      "description": "Component configuration for \"actionsLabel\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "emptyText": {
      "type": "string|Node|Function|Array",
      "description": "Text shown when there is no data to display.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "loadingText": {
      "type": "string|Node|Function|Array",
      "description": "Text displayed while loading.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "toolbar": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"toolbar\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "toolbarStart": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"toolbarStart\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "toolbarEnd": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"toolbarEnd\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "caption": {
      "type": "string|Node|Function|Array",
      "description": "Component configuration for \"caption\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "footer": {
      "type": "Node|Function|Array",
      "description": "Footer content node(s) or render function.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "status": {
      "type": "string|Node|Function|Array",
      "description": "Component configuration for \"status\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "rowClass": {
      "type": "string|((row,ctx)=>string)",
      "description": "Component configuration for \"rowClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "rowAttrs": {
      "type": "object|((row,ctx)=>object)",
      "description": "Component configuration for \"rowAttrs\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "minTableWidth": {
      "type": "string|number",
      "description": "Component configuration for \"minTableWidth\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "stickyHeader": {
      "type": "boolean",
      "description": "Keeps the header region sticky during scroll.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "hideHeader": {
      "type": "boolean",
      "description": "Component configuration for \"hideHeader\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "hideFooter": {
      "type": "boolean",
      "description": "Component configuration for \"hideFooter\". When not handled internally, it is forwarded to the root element.",
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
    "striped": {
      "type": "boolean",
      "description": "Applies striped row styling.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "hover": {
      "type": "boolean",
      "description": "Component configuration for \"hover\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "tableClass": {
      "type": "string",
      "description": "Additional CSS classes applied to the table element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "cardClass": {
      "type": "string",
      "description": "Additional CSS classes applied to the card container.",
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
    "default": {
      "type": "Introductory content above the table",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "toolbarStart": {
      "type": "Toolbar left area",
      "description": "Slot content for \"toolbarStart\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "toolbar": {
      "type": "Central/custom toolbar",
      "description": "Slot content for \"toolbar\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "toolbarEnd": {
      "type": "Toolbar right area",
      "description": "Slot content for \"toolbarEnd\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "search": {
      "type": "Replaces the built-in search box",
      "description": "Slot content for \"search\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "header": {
      "type": "Custom column header",
      "description": "Slot for header content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "cell": {
      "type": "Global cell renderer",
      "description": "Slot content for \"cell\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "actions": {
      "type": "Global row actions renderer",
      "description": "Slot for action buttons or links.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "actionsHeader": {
      "type": "Actions column header",
      "description": "Slot content for \"actionsHeader\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "caption": {
      "type": "Caption above the table",
      "description": "Slot content for \"caption\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "status": {
      "type": "Extra content in the status row",
      "description": "Slot content for \"status\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "loading": {
      "type": "Loading state",
      "description": "Slot for loading state content.",
      "default": null,
      "values": null,
      "category": "state"
    },
    "empty": {
      "type": "Empty state",
      "description": "Slot for empty-state content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "footer": {
      "type": "Extra content in the footer",
      "description": "Slot for footer content.",
      "default": null,
      "values": null,
      "category": "slot"
    }
  },
  "events": {
    "onRowClick": "(row, ctx, event) => void",
    "onRowDblClick": "(row, ctx, event) => void"
  },
  "returns": "HTMLDivElement",
  "description": "Standardized table with toolbar, search, sorting, pagination, states, and flexible rendering."
}
```
