# JSswift AI quick start

Start here for a small page using Input, Select, Button, Card, Table, and Dialog. The example and callback table below are a supported subset; read a component contract only when using additional APIs. Do not read the whole catalog or search runtime bundles for documentation. Button’s full contract is `components/btn.md`; `components/button.md` redirects to it.

## Import, create, mount

Provide `<div id="app"></div>` in HTML and a module entrypoint. With Vite:

```js
import 'jsswift';
import 'jsswift/css/ui.css';
const _ = window._;

const name = _.rod('Prodotto 01');
const category = _.rod('Casa');
const nameInput = _.Input({ label: 'Nome prodotto', model: name });
const categorySelect = _.Select({
  label: 'Categoria', model: category,
  options: [{ value: 'Casa', label: 'Casa' }, { value: 'Ufficio', label: 'Ufficio' }]
});
const errors = _.div({ role: 'alert' });
const dialog = _.Dialog({
  title: 'Modifica prodotto', ariaLabel: 'Modifica prodotto',
  content: _.div({}, nameInput, categorySelect, errors),
  closeOnEsc: true, trapFocus: true, autoFocus: true
});
const save = _.Button({ color: 'primary', onClick: () => {
  if (!name.value.trim()) {
    errors.replaceChildren(_.p('Il nome è obbligatorio.'));
    return;
  }
  errors.replaceChildren();
  console.log({ name: name.value, category: category.value });
  dialog.close();
}}, 'Salva');
dialog.update({ actions: [
  _.Button({ onClick: () => dialog.close() }, 'Annulla'), save
] });
const edit = _.Button({ onClick: () => dialog.open() }, 'Modifica');
const table = _.Table({
  rows: [{ id: 1, name: 'Prodotto 01', price: 10 }], rowKey: 'id',
  columns: [
    { key: 'name', label: 'Nome', render: (row, { value }) => _.strong(value) },
    { key: 'price', label: 'Prezzo', format: value => `${value} EUR` }
  ],
  pagination: false, hideFooter: true, minTableWidth: 700
});
const page = _.Page({}, _.Card({ title: 'Prodotti' }, edit, table));
_.mount('#app', page);
```

This demonstrates composition and validation; saving logs the values. Add application persistence and refresh the table when your task requires them. Prefer `_.rod(initial)` for bidirectional field models: read `name.value`, write `name.value = 'Nuovo nome'`; `model` synchronizes the control. Use `_.signal(initial)` when explicit getter/setter functions suit the state, and `_.useForm()` for structured form validation and errors. This avoids reading private `_input` or `_select` references. The current controls do not document public `focus/getValue/setValue` methods; do not invent them.

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

The UI stylesheet includes component styles, theme variables, and responsive rules. Start with native components. Prefer documented `color`, `dense`, `padding`, `radius`, `shadow`, and breakpoint props to overrides of internal `.cms-*` classes. Read [common props](ui/common-props.md) once when styling; component-specific definitions take precedence. Use custom CSS for remaining page requirements.

System fonts are the default. Import `jsswift/css/fonts-nunito.css`, `jsswift/css/fonts-material.css`, or `jsswift/tabler` only when required; Material Symbols loads a remote Google font. See [setup](getting-started.md).

## Accessibility and verification

The current implementation requires checking the rendered accessible names: a visible `label` is not sufficient evidence of an associated control label. Set Dialog `ariaLabel` explicitly. Dialog normally restores the original focus element; if the app replaces that element, restore focus to its current replacement using a stable application identifier in `onClose`. Do not claim these behaviors were tested from a build alone.

Run the app's build after implementation and check values, validation, dialog keyboard behavior, and persistence when required. Start one development server on an explicit available port; with Vite use `npm run dev -- --port <port> --strictPort`. Report checks actually performed.

## Read only what the task needs

- Exact APIs: [Input](components/input.md), [Select](components/select.md), [Button](components/btn.md), [Card](components/card.md), [Table](components/table.md), [Dialog](components/dialog.md).
- Extra behavior: [forms](ui/forms.md), [reactivity](reactivity.md), [layout](ui/layout-and-responsive.md), [overlays](ui/data-feedback-overlays.md).
- Other components: [index](components/README.md). MCP: read `guide:AI`, then search only for additional features.
