# Layout

Exact JSswift UI metadata contract. Use only the props, slots, events, and methods documented below.

```json
{
  "signature": "UI.Layout(...children) | UI.Layout(props, ...children)",
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
      "type": "number|string",
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
      "type": "{ disposition?, mode?, gap?, minHeight?, areas?, gridTemplateAreas?, drawerWidth?, navWidth?, drawerFloating?, navFloating?, noDrawer?, noNav? }",
      "description": "Responsive overrides applied at the base/mobile viewport.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "tablet": {
      "type": "{ disposition?, mode?, gap?, minHeight?, areas?, gridTemplateAreas?, drawerWidth?, navWidth?, drawerFloating?, navFloating?, noDrawer?, noNav? }",
      "description": "Responsive overrides applied from the tablet breakpoint upward.",
      "default": null,
      "values": null,
      "category": "layout"
    },
    "pc": {
      "type": "{ disposition?, mode?, gap?, minHeight?, areas?, gridTemplateAreas?, drawerWidth?, navWidth?, drawerFloating?, navFloating?, noDrawer?, noNav? }",
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
    "header": {
      "type": "Node|Function|Array",
      "description": "Header content node(s) or render function.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "headerContent": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"headerContent\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "aside": {
      "type": "Node|Function|Array|false",
      "description": "Content or configuration for the aside/secondary region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawer": {
      "type": "Node|Function|Array|false",
      "description": "Content or configuration for the drawer region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "nav": {
      "type": "Node|Function|Array|false",
      "description": "Component configuration for \"nav\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "asideRight": {
      "type": "Node|Function|Array|false",
      "description": "Component configuration for \"asideRight\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawerRight": {
      "type": "Node|Function|Array|false",
      "description": "Component configuration for \"drawerRight\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "page": {
      "type": "Node|Function|Array",
      "description": "Current page index (1-based unless documented otherwise).",
      "default": null,
      "values": null,
      "category": "general"
    },
    "main": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"main\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "content": {
      "type": "Node|Function|Array",
      "description": "Main content node(s) or render function for the component body.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "body": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"body\". When not handled internally, it is forwarded to the root element.",
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
    "footerContent": {
      "type": "Node|Function|Array",
      "description": "Component configuration for \"footerContent\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "noDrawer": {
      "type": "boolean",
      "description": "Disables rendering of the drawer region.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawerEnabled": {
      "type": "boolean",
      "description": "Component configuration for \"drawerEnabled\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "asideEnabled": {
      "type": "boolean",
      "description": "Component configuration for \"asideEnabled\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "noNav": {
      "type": "boolean",
      "description": "Component configuration for \"noNav\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "navEnabled": {
      "type": "boolean",
      "description": "Component configuration for \"navEnabled\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "asideRightEnabled": {
      "type": "boolean",
      "description": "Component configuration for \"asideRightEnabled\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawerOpen": {
      "type": "rod | [get,set] signal | boolean",
      "description": "Controls whether the drawer is open (controlled).",
      "default": null,
      "values": null,
      "category": "general"
    },
    "navOpen": {
      "type": "rod | [get,set] signal | boolean",
      "description": "Component configuration for \"navOpen\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "layoutBreakpoint": {
      "type": "number(px)",
      "description": "Component configuration for \"layoutBreakpoint\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawerBreakpoint": {
      "type": "number(px)",
      "description": "Viewport width where the drawer switches behavior (overlay vs persistent).",
      "default": null,
      "values": null,
      "category": "general"
    },
    "navBreakpoint": {
      "type": "number(px)",
      "description": "Component configuration for \"navBreakpoint\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawerWidth": {
      "type": "number|string",
      "description": "Drawer width (number interpreted as px or CSS length).",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawerResizable": {
      "type": "boolean",
      "description": "Component configuration for \"drawerResizable\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawerMinWidth": {
      "type": "number|string",
      "description": "Component configuration for \"drawerMinWidth\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawerMaxWidth": {
      "type": "number|string",
      "description": "Component configuration for \"drawerMaxWidth\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "navWidth": {
      "type": "number|string",
      "description": "Component configuration for \"navWidth\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "navResizable": {
      "type": "boolean",
      "description": "Component configuration for \"navResizable\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "navMinWidth": {
      "type": "number|string",
      "description": "Component configuration for \"navMinWidth\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "navMaxWidth": {
      "type": "number|string",
      "description": "Component configuration for \"navMaxWidth\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "asideRightWidth": {
      "type": "number|string",
      "description": "Component configuration for \"asideRightWidth\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawerPeek": {
      "type": "number|string",
      "description": "Component configuration for \"drawerPeek\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "navPeek": {
      "type": "number|string",
      "description": "Component configuration for \"navPeek\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "asideRightPeek": {
      "type": "number|string",
      "description": "Component configuration for \"asideRightPeek\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "drawerFloating": {
      "type": "boolean",
      "description": "Component configuration for \"drawerFloating\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "navFloating": {
      "type": "boolean",
      "description": "Component configuration for \"navFloating\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "overlayClose": {
      "type": "boolean",
      "description": "Closes the overlay when the backdrop is clicked.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "escClose": {
      "type": "boolean",
      "description": "Alias for close-on-escape behavior.",
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
    "stickyFooter": {
      "type": "boolean",
      "description": "Keeps the footer region sticky during scroll.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "stickyAside": {
      "type": "boolean",
      "description": "Keeps the aside region sticky during scroll.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "stickyNav": {
      "type": "boolean",
      "description": "Component configuration for \"stickyNav\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "tagPage": {
      "type": "boolean",
      "description": "Query parameter name used to read/write the current page.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "mode": {
      "type": "local|global",
      "description": "Component configuration for \"mode\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "layoutMode": {
      "type": "alias di mode",
      "description": "Component configuration for \"layoutMode\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "disposition": {
      "type": "classic|classicRight|sidebarFullLeft|sidebarFullRight|appShell|dashboard|website|documentation|landing",
      "description": "Component configuration for \"disposition\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "layoutDisposition": {
      "type": "alias di disposition",
      "description": "Component configuration for \"layoutDisposition\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "layout": {
      "type": "alias di disposition",
      "description": "Component configuration for \"layout\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "gap": {
      "type": "number|string",
      "description": "Gap/spacing between child elements.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "headerOffset": {
      "type": "number|string",
      "description": "Component configuration for \"headerOffset\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "areas": {
      "type": "string|array",
      "description": "Component configuration for \"areas\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "gridTemplateAreas": {
      "type": "string|array",
      "description": "Component configuration for \"gridTemplateAreas\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "templateAreas": {
      "type": "string|array",
      "description": "Component configuration for \"templateAreas\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "shellClass": {
      "type": "string",
      "description": "Component configuration for \"shellClass\". When not handled internally, it is forwarded to the root element.",
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
    "asideClass": {
      "type": "string",
      "description": "Component configuration for \"asideClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "navClass": {
      "type": "string",
      "description": "Component configuration for \"navClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "pageClass": {
      "type": "string",
      "description": "Component configuration for \"pageClass\". When not handled internally, it is forwarded to the root element.",
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
    "overlayClass": {
      "type": "string",
      "description": "Component configuration for \"overlayClass\". When not handled internally, it is forwarded to the root element.",
      "default": null,
      "values": null,
      "category": "general"
    },
    "slots": {
      "type": "{ header?, aside?, drawer?, nav?, asideRight?, drawerRight?, page?, main?, footer?, default? }",
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
    "header": {
      "type": "Header content",
      "description": "Slot for header content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "aside": {
      "type": "Aside / drawer content",
      "description": "Slot for aside/secondary content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "drawer": {
      "type": "Alias of aside",
      "description": "Slot for drawer content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "nav": {
      "type": "Right-side panel content",
      "description": "Slot content for \"nav\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "asideRight": {
      "type": "Alias of nav",
      "description": "Slot content for \"asideRight\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "drawerRight": {
      "type": "Alias of nav",
      "description": "Slot content for \"drawerRight\". Accepts nodes, arrays, or render functions.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "page": {
      "type": "Page content",
      "description": "Slot for page indicator/content.",
      "default": null,
      "values": null,
      "category": "slot"
    },
    "main": {
      "type": "Alias of page",
      "description": "Slot content for \"main\". Accepts nodes, arrays, or render functions.",
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
    "default": {
      "type": "Fallback page content",
      "description": "Primary content for the component.",
      "default": null,
      "values": null,
      "category": "slot"
    }
  },
  "returns": "HTMLDivElement with openAside/closeAside/toggleAside/openNav/closeNav/toggleNav methods, isDrawerOpen/isNavOpen/isMobile/reflow, header()/aside()/nav()/page()/footer(), headerUpdate/asideUpdate/navUpdate/pageUpdate/mainUpdate/footerUpdate and _dispose()",
  "description": "Composable shell layout with independent left drawer and right nav, configurable widths, optional resize with min/max, optional floating mode, and runtime section updates."
}
```
