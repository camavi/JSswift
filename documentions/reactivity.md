# Reactivity and models

Prefer `_.rod(initial)` for bidirectional control models. Pass the rod as `model`, read and update its public `.value`; do not manually mutate the control DOM.

```js
const name = _.rod('');
const category = _.rod('');
const input = _.Input({ label: 'Nome prodotto', model: name });
const select = _.Select({ model: category, options: [
  { value: '', label: 'Seleziona' }, { value: 'Casa', label: 'Casa' }
] });
const save = _.Button({ onClick: () => console.log(name.value, category.value) }, 'Salva');
name.value = 'Prodotto 01';
// Choosing Casa in Select updates category.value; changing category.value updates Select.
```

Rod control notifications are scheduled through microtasks; wait for the control update before inspecting DOM after a programmatic assignment. Rod values themselves can be read immediately. Use `_.useForm()` for values, validation, touched/dirty flags and submit state; see [forms](ui/forms.md). Follow each component's documented model contract.

`_.signal(initial)` remains supported and returns `[get, set, dispose]`. Use it when explicit getter/setter functions are useful. Pass the full tuple as `model` to a control supporting signals; `[get, set]` is also supported.

```js
const [getCount, setCount] = _.signal(0);
_.Button({ onClick: () => setCount(getCount() + 1) }, 'Add');
_.Badge({ label: () => String(getCount()) });
```

Use `_.computed` for derived values, `_.effect` for side effects, `_.untracked` for a non-subscribing read, and `_.batch` for grouped updates. These direct aliases are exposed by the core runtime footer.
