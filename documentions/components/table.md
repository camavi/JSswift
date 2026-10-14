# Table

Exact JSswift UI contract. Shared definitions listed in `commonProps` are in [common props](../ui/common-props.md); all component-specific props, slots, events, and methods are below.

```json
{
  "signature": "_.Table(props)",
  "props": {
    "scrollLabel": {"type":"string","description":"Accessible name of the keyboard-focusable horizontal scrolling region.","default":"Tabella, scorrimento orizzontale","values":null,"category":"accessibility"},
    "columns": {"type": "Array<{ key, label?, sortable?, get?, value?, render?, format?, width?, minWidth?, maxWidth?, align?, compare?, style?, headerStyle?, thStyle?, cellStyle?, tdStyle?, cellClass?, headerClass?, nowrap?, searchable? }>", "description": "Column definitions for table-like components.", "default": null, "values": null, "category": "data"},
    "rows": {"type": "Array|() => Array", "description": "Row data array for table-like components.", "default": null, "values": null, "category": "data"},
    "rowKey": {"type": "string|((row)=>string)", "description": "Key or function used to derive unique row IDs.", "default": null, "values": null, "category": "general"},
    "loading": {"type": "boolean|() => boolean", "description": "Shows loading state and disables interactions where appropriate.", "default": null, "values": null, "category": "state"},
    "page": {"type": "number", "description": "Current page index (1-based unless documented otherwise).", "default": null, "values": null, "category": "general"},
    "pageSize": {"type": "number", "description": "Number of items per page.", "default": null, "values": null, "category": "general"},
    "pageSizeOptions": {"type": "number[]", "description": "Component configuration for \"pageSizeOptions\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "pagination": {"type": "boolean", "description": "Component configuration for \"pagination\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "initialSort": {"type": "{ key, dir: 'asc'|'desc' }", "description": "Initial sort configuration for table data.", "default": null, "values": null, "category": "general"},
    "search": {"type": "string", "description": "Component configuration for \"search\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "query": {"type": "string", "description": "Component configuration for \"query\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "searchable": {"type": "boolean|string", "description": "Component configuration for \"searchable\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "searchPlaceholder": {"type": "string", "description": "Component configuration for \"searchPlaceholder\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "searchKeys": {"type": "Array<string|function>", "description": "Component configuration for \"searchKeys\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "searchModel": {"type": "[get,set] signal", "description": "Component configuration for \"searchModel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "filter": {"type": "(row, ctx)=>boolean", "description": "Component configuration for \"filter\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "actions": {"type": "(row, ctx)=>Node|Array", "description": "Content rendered in the action area, typically in a footer or trailing region.", "default": null, "values": null, "category": "general"},
    "actionsLabel": {"type": "string|Node|Function|Array", "description": "Component configuration for \"actionsLabel\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "emptyText": {"type": "string|Node|Function|Array", "description": "Text shown when there is no data to display.", "default": null, "values": null, "category": "general"},
    "loadingText": {"type": "string|Node|Function|Array", "description": "Text displayed while loading.", "default": null, "values": null, "category": "general"},
    "toolbar": {"type": "Node|Function|Array", "description": "Component configuration for \"toolbar\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "toolbarStart": {"type": "Node|Function|Array", "description": "Component configuration for \"toolbarStart\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "toolbarEnd": {"type": "Node|Function|Array", "description": "Component configuration for \"toolbarEnd\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "caption": {"type": "string|Node|Function|Array", "description": "Component configuration for \"caption\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "footer": {"type": "Node|Function|Array", "description": "Footer content node(s) or render function.", "default": null, "values": null, "category": "general"},
    "status": {"type": "string|Node|Function|Array", "description": "Component configuration for \"status\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "rowClass": {"type": "string|((row,ctx)=>string)", "description": "Component configuration for \"rowClass\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "rowAttrs": {"type": "object|((row,ctx)=>object)", "description": "Component configuration for \"rowAttrs\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "minTableWidth": {"type": "string|number", "description": "Component configuration for \"minTableWidth\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "stickyHeader": {"type": "boolean", "description": "Keeps the header region sticky during scroll.", "default": null, "values": null, "category": "general"},
    "hideHeader": {"type": "boolean", "description": "Component configuration for \"hideHeader\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "embedded": {"type": "boolean", "description": "Removes the outer Card frame/shadow, body padding and inner scroll-frame border/radius for use inside an application-owned surface. Preserves table scrolling and row separators. Evaluated at creation.", "default": false, "values": null, "category": "layout"},
    "hideStatus": {"type": "boolean", "description": "Hides the entire status row, including row count, filter/sort indicators and custom status content. Independent of toolbar, column headings and footer. Evaluated at creation.", "default": false, "values": null, "category": "layout"},
    "hideFooter": {"type": "boolean", "description": "Component configuration for \"hideFooter\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "dense": {"type": "boolean", "description": "Uses compact spacing and sizing.", "default": false, "values": null, "category": "layout"},
    "striped": {"type": "boolean", "description": "Applies striped row styling.", "default": null, "values": null, "category": "general"},
    "hover": {"type": "boolean", "description": "Component configuration for \"hover\". When not handled internally, it is forwarded to the root element.", "default": null, "values": null, "category": "general"},
    "tableClass": {"type": "string", "description": "Additional CSS classes applied to the table element.", "default": null, "values": null, "category": "general"},
    "cardClass": {"type": "string", "description": "Additional CSS classes applied to the card container.", "default": null, "values": null, "category": "general"},
    "children": {"type": "Node|Array|Function", "description": "Default child content (nodes, arrays, or render function).", "default": null, "values": null, "category": "general"}
  },
  "slots": {
    "default": {"type": "Introductory content above the table", "description": "Primary content for the component.", "default": null, "values": null, "category": "slot"},
    "toolbarStart": {"type": "Toolbar left area", "description": "Slot content for \"toolbarStart\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "toolbar": {"type": "Central/custom toolbar", "description": "Slot content for \"toolbar\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "toolbarEnd": {"type": "Toolbar right area", "description": "Slot content for \"toolbarEnd\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "search": {"type": "Replaces the built-in search box", "description": "Slot content for \"search\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "header": {"type": "Custom column header", "description": "Slot for header content.", "default": null, "values": null, "category": "slot"},
    "cell": {"type": "Global cell renderer", "description": "Slot content for \"cell\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "actions": {"type": "Global row actions renderer", "description": "Slot for action buttons or links.", "default": null, "values": null, "category": "slot"},
    "actionsHeader": {"type": "Actions column header", "description": "Slot content for \"actionsHeader\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "caption": {"type": "Caption above the table", "description": "Slot content for \"caption\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "status": {"type": "Extra content in the status row", "description": "Slot content for \"status\". Accepts nodes, arrays, or render functions.", "default": null, "values": null, "category": "slot"},
    "loading": {"type": "Loading state", "description": "Slot for loading state content.", "default": null, "values": null, "category": "state"},
    "empty": {"type": "Empty state", "description": "Slot for empty-state content.", "default": null, "values": null, "category": "slot"},
    "footer": {"type": "Extra content in the footer", "description": "Slot for footer content.", "default": null, "values": null, "category": "slot"}
  },
  "events": {
    "onRowClick": "(row, ctx, event) => void",
    "onRowDblClick": "(row, ctx, event) => void"
  },
  "returns": "HTMLDivElement",
  "description": "Standardized table with toolbar, search, sorting, pagination, states, and flexible rendering.",
  "commonProps": {"path": "ui/common-props.md", "keys": ["size", "color", "outline", "clickable", "padding", "margin", "width", "minWidth", "maxWidth", "height", "minHeight", "maxHeight", "radius", "borderRadius", "shadow", "mobile", "tablet", "pc", "class", "style"]}
}
```

## Callback example

Column callbacks use different argument orders: `render(row, cellContext)` receives the row first; `format(value, row, cellContext)` receives the cell value first. `cellContext.value` is the resolved column value. `actions(row, rowContext)` receives the row.

```js
_.Table({
  rows: [{ id: 1, name: 'Prodotto 01', price: 10 }],
  rowKey: 'id',
  columns: [
    { key: 'name', label: 'Nome', render: (row, { value }) => _.strong(value) },
    { key: 'price', label: 'Prezzo', format: value => `${value} EUR` }
  ],
  actions: row => _.Button({ onClick: () => console.log(row.id) }, 'Modifica'),
  pagination: false,
  hideFooter: true,
  minTableWidth: 700
});
```

Use the documented visibility and column style props before hiding or restyling internal table classes. With external pagination, pass the current page's rows and disable internal pagination.

## External filters and pagination

For application-owned filtering/paging, pass the already filtered page as `rows`, set `pagination: false` and `hideFooter: true`. `minTableWidth` keeps columns readable in a horizontally scrollable container. Provide counters and pager buttons outside Table.

`toolbarStart`, `toolbar` and `toolbarEnd` add content to the optional toolbar. The built-in row-count status is a separate region and remains visible even with `hideFooter: true`; it counts the rows supplied to Table, not the full application inventory. Use `hideStatus: true` to hide the entire status region, including custom status content. Do not confuse `hideHeader` (column headings) with the toolbar/status. Table has its own Card wrapper; nesting it in another Card may produce an additional frame. Customize using supported props and theme values first.

## Compose without duplicating the frame

Table already returns a Card. For a catalogue, mount it in a structural `_.div`, rather than wrapping it in another Card. Use `radius`, `shadow`, `padding` and `dense` before overriding internal classes. Keep toolbar content inside Table when it belongs to the table; keep application filters outside when they affect other parts of the page.

```js
const table = _.Table({
  rows: products, rowKey: 'id',
  columns: [{key: 'name', label: 'Nome'}],
  toolbarStart: _.strong('Prodotti'),
  minTableWidth: 600, shadow: 'none', radius: '12px'
});
_.mount('#app', _.div({style: {minWidth: 0}}, table));
```

For external paging, the status count describes the supplied page (for example, “5 righe”); an external total describes all filtered results. Choose whether both pieces of information are useful. `status` adds content; it does not replace or hide the built-in count. `hideFooter` only hides the footer. Do not use `hideHeader` to remove the status row. Use `hideStatus: true` to hide that row when the application supplies its own summary. It does not hide the toolbar, column headings or footer.

A grey surface or gradient is not a focus indicator. Inspect the Card/theme surface separately from `:focus-visible`; do not remove keyboard indicators to change a background. Custom table-cell styling is application CSS, and should remain scoped to an application class.

## Fixed white catalogue surface

Use public `style` for the outer Card and `tableStyle` for the HTML table:

```js
_.Table({rows:products, columns:[{key:'name',label:'Nome'}],
 shadow:'none', radius:'12px',
 style:{background:'#fff'},
 tableStyle:{background:'#fff', '--set-color-1':'#fff'}});
```

`radius`, `padding` and `shadow` act on the Card; `tableStyle` acts on the table, and `--set-color-1` supplies its header background. The inner scroll frame remains. This explicitly fixes a light surface; for theme switching use theme-dependent values instead. Do not remove focus outlines to change a surface.

Use `embedded:true` when an enclosing application surface owns the border and spacing. Default standalone Table appearance remains unchanged.

## Visual surfaces and pagination

Semantic colors accent the column headings and interactive states while the data surface keeps readable theme text. `light` and `dark` retain their surface identity in either theme. Radius uses the shared default or explicit `radius`/`borderRadius`. Border, shadow and glow are opt-in; Dense reduces cell and control spacing.

With `pagination: false`, all matching rows render and page navigation/page-size controls are hidden. The footer count and custom footer remain available unless `hideFooter: true`. Search results include the original dataset count only when filtering changes the result count.

The inner scrolling region is named and keyboard-focusable. Focus it and use horizontal arrow keys to read wide tables; scrollLabel customizes its accessible name. Verify actual scrolling at narrow viewports.

Embedded Table suppresses its Card elevation even when shadow/glow effects are requested; the application surface owns the frame. shadow:'none' does not activate the generic shadow effect class. A custom scrollLabel need not contain “Table” or “Tabella”; validators should identify a named scroll region that contains a table.

Use a structural host without role, tabindex or overflow-x; Table owns its named keyboard scrolling region. Configure its accessible name through scrollLabel. Adding a second scroll/focus layer can create redundant keyboard stops.
