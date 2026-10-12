# Forms

Use `_.useForm({ model, rules, initial, validateOn })` for structured form values, validation and submission state. `model` accepts an object or a caller-owned rod containing an object. Bind controls through `form.field(name)`; `form.model` is the supplied model, not a function. `values` is not an option.

```js
const model = _.rod({ email: "" });
const form = _.useForm({
  model,
  rules: { email: value => value.includes("@") || "Enter a valid email" },
  validateOn: "input"
});
_.Form({ form, onSubmit: async values => save(values) },
  _.Input({ label: "Email", ...form.field("email") }),
  _.Button({ type: "submit", color: "primary", label: "Save" }),
  _.Button({ type: "reset", label: "Reset" })
);
```

Rules return `true` for success, `false` for the default error, or an error string. Async rules are supported; outdated results and results arriving after reset are ignored. `validateOn` accepts `submit` (default), `input` or `blur`.

`form.getValue(name)` and `form.setValue(name, value)` read/write a field. Fields start with the model value and follow `setValue`, reset and external rod model assignments. For plain objects, update through `setValue`; direct external object mutation is not observable. Rod control notifications settle through microtasks.

`form.reset()` restores a snapshot of `initial`, or the model at creation when `initial` is omitted, and clears errors/touched/submitError. Native reset controls inside `_.Form` use this reset. Reset invalidates pending validation and prevents a submission still validating from calling its handler; it does not cancel an already executing handler.

`form.submit(handler)` validates before calling `handler(values, form)`. It returns `{ ok: true, result }` or `{ ok: false, reason }` with reason `validation`, `submitting`, `reset` or `exception` (with `error`). Overlapping submits are rejected while `form.submitting.value` is true. `errors`, `touched` and `submitError` are rods. Exceptions from validation during submit are reported through submitError; direct validate calls propagate rule exceptions.

A field binding exposes `model`, `value`, `name`, reactive `error`, `onInput`, `onBlur`, `touch()`, `validate()` and `dispose()`. Dispose bindings when their owner is discarded; this stops model synchronization and removes outside-pointer listeners. A field that has handled input also registers disposal on that control's JSswift lifecycle cleanup. Caller-owned model rods remain usable. Form cleans up its submitting effect through JSswift lifecycle cleanup.

Form is a native behavioral container; visual state belongs primarily to its child controls. Common sizing/spacing props apply to the container. Use children or `slots.default(form)` for content.

Read each control contract for value/model details.
