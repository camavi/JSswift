# JSswift AI quick start

Start here for a small page using Input, Select, Button, Card, Table, and Dialog. The example and callback table below are a supported subset; read a component contract only when using additional APIs. Do not read the whole catalog or search runtime bundles for documentation. Button’s full contract is `components/btn.md`; `components/button.md` redirects to it.

## Reading budget and discovery

Read this guide alone first and implement its supported APIs directly. Do not pre-read the six linked component contracts to confirm this example. Do not concatenate the guide and the component catalog in one command.

If a required API is absent here, consult `knowledge-map.json` to find its exact path, then read only that document. The map routes requests; it does not contain component API definitions. With an already configured MCP, read `guide:AI`, then use `jsswift_search` for the missing feature and `jsswift_read` for its result. MCP setup is optional; local files are sufficient.

The installed package exposes this same guide as `AI.md` at its root and through `jsswift/AI.md`. `package.json` includes `jsswiftDocumentation` discovery paths. Do not inspect runtime bundles to discover documented APIs.

## Choose one starting route

| Task | First read | Stop condition |
| --- | --- | --- |
| Small page with the six components below | This guide | Implement the supported subset without opening component contracts. |
| Product CRUD with validation, persistence and focus | [CRUD example](examples/crud.md) | Reuse the example; do not also concatenate Input, Select, Dialog and Table contracts. |
| One missing prop or callback | Map → exact document, or selective MCP read | Read only the needed section; do not search the runtime bundle. |
| Custom appearance | Supported props below, then one relevant contract | Keep component styles; add CSS for page layout and task-specific visuals. |

The map locates a contract; it does not replace it. Avoid reading all of `ui/common-props.md` just to confirm examples already covered here. Structural helpers used below (`div`, `p`, `span`, `strong`) do not require a separate HTML/SVG guide. Read that guide only for additional helper behavior.

## Import, create, mount

With Vite, provide `<div id="app"></div>` and a module entrypoint:

```js
import 'jsswift';
import 'jsswift/css/ui-light.css';
const _ = window._;
const name = _.rod('Prodotto 01'), category = _.rod('Casa');
const input = _.Input({label:'Nome', required:true, model:name});
const select = _.Select({label:'Categoria', model:category,
 options:[{value:'Casa',label:'Casa'},{value:'Ufficio',label:'Ufficio'}]});
const dialog = _.Dialog({title:'Prodotto', ariaLabel:'Prodotto',
 content:_.div({}, input, select), trapFocus:true, closeOnEsc:true,
 onOpen:() => input.focus()});
dialog.update({actions:[_.Button({onClick:() => {
 console.log({name:name.value, category:category.value}); dialog.close();
}}, 'Salva')]});
const table = _.Table({rows:[{id:1,name:'Prodotto 01'}], rowKey:'id',
 columns:[{key:'name',label:'Nome',sortable:false,render:(row,ctx) => _.strong(ctx.value)}],
 pagination:false, hideFooter:true, hideStatus:true, minTableWidth:600});
_.mount('#app', _.div({}, _.Card({title:'Prodotti'},
 _.Button({color:'primary',onClick:() => dialog.open()}, 'Modifica')), table));
```

This logs values; it does not implement validation or persistence. For product editing use [the executable CRUD example](examples/crud.md) instead of reading forms, overlays or component contracts first.

Prefer `_.rod(initial)` for bidirectional fields: read/write `model.value`. `_.signal(initial)` remains supported. Input/Select expose `focus(options?)`; avoid private `_input`/`_select`. Use `label`, `required`, `ariaLabel`, `ariaLabelledBy`, `ariaDescribedBy`, `ariaInvalid`, and `error: _.rod('')`. Input accepts `min`, `max`, `step`, `pattern`, `minLength`, `maxLength`.

## Exact callback arguments

| API | Arguments |
| --- | --- |
| Input `onInput`, `onChange` | `(value)`; text value is a string. No DOM event argument is passed by Input. |
| Select `onChange` | `(value)`; single selection emits its option value; multiple selection emits an array. |
| Button `onClick` | DOM click event. |
| Table column `render` | `(row, cellContext)`; read `cellContext.value`. |
| Table column `format` | `(value, row, cellContext)`. |
| Table `actions` | `(row, rowContext)`. |
| Dialog `onOpen` | Overlay entry. |
| Dialog `onClose` | No arguments. |

Dialog returns an API object, not a node to mount: `open(overrides?)`, `close()`, `toggle(overrides?)`, `update(props)`, `isOpen()`, `entry()`, `props()`.

## Existing CSS and optional assets

The light import includes base tokens, colors, component styles, dense/outline and unprefixed layout utilities. Add `jsswift/css/responsive.css` **after** it for tablet/pc/desktop or legacy breakpoint classes. `ui.css` is the complete alternative; do not import full and light together. Component-specific mobile rules remain in light.

Prefer public props to rebuilding controls: `_.Button({color:'primary',outline:true,dense:true}, 'Modifica')`. For breakpoint props use `_.Row({gap:'md',tablet:{gap:'lg'}})` with the responsive addon. Consult common props only for an additional inherited API.

Classes and theme variables use `jss-`; migrate old `cms-` overrides. Fonts are system defaults. Import `jsswift/css/fonts-nunito.css`, `fonts-material.css`, or `jsswift/tabler` only when required; Material Symbols downloads a remote font.

## Accessibility and verification

String labels name Input/Select; set Dialog `ariaLabel`. Field errors are associated automatically. Dialog preserves focus assigned in `onOpen`. If rendering replaces the trigger, restore its current replacement in `onClose`; see CRUD.

Build is not a browser test. Verify initial focus after deferred autofocus, Tab/Shift+Tab containment, Escape, return focus, validation, persistence, mobile overflow and borders separately. Report unverified checks. Use this custom focus CSS:

```css
:is(button,a,input,select,[tabindex]):focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}
```

Keep build, logic assertions and server startup in separate commands. Check tooling/permissions first; use an explicit Vite port with `--strictPort`. Environment failures are not application failures; HTTP alone does not verify interactions.

## Additional APIs only

Use the map for the missing API, then read its focused contract. Button is `components/btn.md` (`button.md` redirects). With configured MCP: `jsswift_read({id:"component:table",section:"props",keys:["pagination","hideFooter"]})`; sections include props/events/methods/slots and resolve inherited props. No MCP setup is required for local documentation.

## Catalogue surfaces and field styling

`_.Kpi({title:'Disponibili',value:9,note:'Con quantità maggiore di zero'})` supplies dashboard metrics. Update KPI when inventory changes, not on each filter; see CRUD. Read the Kpi contract only for additional options.

Table returns a Card; use a structural container. Card props include `shadow:'none'`, `radius:'12px'`, and `padding`. For a fixed light surface: `style:{background:'#fff'}`, `tableStyle:{background:'#fff','--set-color-1':'#fff'}`. This does not provide automatic dark theming.

For external pagination use `pagination:false`, `hideFooter:true`, `hideStatus:true`, `emptyText:'Nessun prodotto trovato'`, `minTableWidth:600`. Set each data column's `sortable:false`: built-in sorting sees only the supplied page. Sort the full filtered dataset before slicing if needed.

Input's native input is transparent; preserve that background to keep the outer curved border visible. Set height on an application container:

```css
.catalogue-filters {
  --jss-input-height-default: 40px;
}
```
 Use the field's `radius` prop if it should not inherit a surface radius. Avoid clipping controls/focus indicators with overflow:hidden. Check borders, labels, errors and focus at desktop/mobile sizes.

## Theme and lifecycle essentials

base.css is already included. Use `_.setTheme('dark')` or `_.setTheme('light')`; persistence defaults to `jsswift:theme`. At startup restore with `_.setTheme(_.getTheme())`. Customize the existing `--jss-primary-600`/`--jss-primary-700` palette values after the UI import. See [base CSS and themes](ui/themes.md) only for additional theme requirements.

Replace component subtrees with `_.mount(host, nextContent)` (default clear:true), which cleans up previous effects and subscriptions. Native `replaceChildren`/`innerHTML` alone do not run JSswift cleanup. Keep shared models owned by the application alive.
