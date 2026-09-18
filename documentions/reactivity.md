# Reactivity and models

JSswift.reactive.signal(initial) returns [get, set, dispose]. Use computed for derived values, effect for side effects, untracked for a non-subscribing read, and batch for grouped updates.

Example:

    const [getCount, setCount] = JSswift.reactive.signal(0);
    JSswift.ui.Btn({ onClick: () => setCount(getCount() + 1) }, "Add");
    JSswift.ui.Badge({ label: () => String(getCount()) });

For a documented controlled component, pass a signal tuple as model; do not manually mutate DOM values. Use JSswift.useForm for form values, validation, touched/dirty flags, and submit state.
