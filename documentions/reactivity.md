# Reactivity and models

`_.signal(initial)` returns `[get, set, dispose]`. Use `_.computed` for derived values, `_.effect` for side effects, `_.untracked` for a non-subscribing read, and `_.batch` for grouped updates.

These direct aliases are exposed by the core runtime footer. Use them in application code.

Example:

    const [getCount, setCount] = _.signal(0);
    _.Button({ onClick: () => setCount(getCount() + 1) }, "Add");
    _.Badge({ label: () => String(getCount()) });

For a documented controlled component, pass a signal tuple as model; do not manually mutate DOM values. Use _.useForm for form values, validation, touched/dirty flags, and submit state.
