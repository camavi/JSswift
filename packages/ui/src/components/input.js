
  UI.Input = (props = {}) => {
    const slots = props.slots || {};
    const fieldProps = {
      ...props,
      label: props.label ?? props.placeholder
    };
    const input = _.input({
      class: uiClass(["jss-input", props.class]),
      type: props.type || "text",
      name: props.name,
      autocomplete: props.autocomplete,
      inputmode: props.inputmode,
      value: props.value ?? "",
      disabled: !!props.disabled,
      readOnly: !!props.readonly
    });

    let autofillDisposed = false;
    const autofillTimeouts = new Set();
    const autofillLater = (fn, delay) => {
      if (autofillDisposed) return;
      const id = setTimeout(() => {
        autofillTimeouts.delete(id);
        if (!autofillDisposed) fn();
      }, delay);
      autofillTimeouts.add(id);
    };
    let lastKnownValue = input.value ?? "";
    const syncAutofill = () => {
      const next = input.value ?? "";
      if (next === lastKnownValue) return;
      lastKnownValue = next;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    let autofillTimer = null;
    let autofillProbe = false;
    const scheduleAutofillProbe = () => {
      if (autofillDisposed || autofillProbe) return;
      autofillProbe = true;
      let count = 0;
      const tick = () => {
        syncAutofill();
        count += 1;
        if (count >= 10) {
          autofillProbe = false;
          return;
        }
        autofillLater(tick, 120);
      };
      autofillLater(tick, 40);
    };
    const startAutofillWatch = () => {
      if (autofillDisposed || autofillTimer) return;
      autofillTimer = setInterval(() => {
        if (document.activeElement !== input) {
          clearInterval(autofillTimer);
          autofillTimer = null;
          return;
        }
        syncAutofill();
      }, 250);
    };
    const stopAutofillWatch = () => {
      if (!autofillTimer) return;
      clearInterval(autofillTimer);
      autofillTimer = null;
    };

    // listeners
    input.addEventListener("input", () => {
      lastKnownValue = input.value ?? "";
      props.onInput?.(input.value);
    });
    input.addEventListener("change", () => {
      lastKnownValue = input.value ?? "";
      props.onChange?.(input.value);
    });
    input.addEventListener("focus", (e) => {
      props.onFocus?.(e);
      startAutofillWatch();
      scheduleAutofillProbe();
      autofillLater(syncAutofill, 50);
    });
    input.addEventListener("blur", (e) => {
      props.onBlur?.(e);
      stopAutofillWatch();
      autofillLater(syncAutofill, 0);
    });
    input.addEventListener("animationstart", (e) => {
      if (e.animationName !== "jss-autofill") return;
      syncAutofill();
      startAutofillWatch();
      scheduleAutofillProbe();
    });
    autofillLater(syncAutofill, 0);
    scheduleAutofillProbe();

    JSswift._registerCleanup(input, () => {
      autofillDisposed = true;
      stopAutofillWatch();
      autofillTimeouts.forEach(clearTimeout);
      autofillTimeouts.clear();
    });

    // model binding
    const model = props.model;
    if (model) {
      const bindInputRod = (rod) => {
        let syncing = false;

        const updateFromRod = (v) => {
          const next = v ?? "";
          if (input.value === next) return;
          input.value = next;
          lastKnownValue = next;
        };

        const onValue = (v) => {
          if (syncing) return;
          syncing = true;
          try { updateFromRod(v); } finally { syncing = false; }
        };
        rod.action(onValue);

        // Component setup may run inside a dynamic parent render. This initial
        // hydration must not make that parent subscribe to the control model.
        JSswift.reactive.untracked(() => updateFromRod(rod.value));

        const onInput = (e) => {
          if (syncing || e?.isComposing) return;
          const next = input.value;
          if (rod.value === next) return;
          syncing = true;
          try { rod.value = next; } finally { syncing = false; }
        };

        input.addEventListener("input", onInput);
        input.addEventListener("compositionend", onInput);

        let disposed = false;
        const stop = () => {
          if (disposed) return;
          disposed = true;
          input.removeEventListener("input", onInput);
          input.removeEventListener("compositionend", onInput);
          const actionIndex = rod._actions?.indexOf(onValue) ?? -1;
          if (actionIndex >= 0) rod._actions.splice(actionIndex, 1);
          const hookIndex = rod._disposeHooks?.indexOf(stop) ?? -1;
          if (hookIndex >= 0 && !rod._disposed) rod._disposeHooks.splice(hookIndex, 1);
        };
        rod.onDispose?.(stop);
        JSswift._registerCleanup(input, stop);
      };
      if (typeof model === "object" && typeof model._bind === "function") {
        bindInputRod(model);
      } else if (Array.isArray(model) && typeof model[0] === "function" && typeof model[1] === "function") {
        const r = JSswift.reactive.untracked(() => JSswift.rodFromSignal(model[0], model[1]));
        bindInputRod(r);
        JSswift._registerCleanup(input, () => r.dispose());
      }
    }

    const inputSlot = JSswift.ui.renderSlot(slots, "input", { input, props }, input);
    const controlNode = Array.isArray(inputSlot)
      ? _.div({ style: { display: "contents" } }, ...inputSlot)
      : inputSlot;

    const field = UI.FormField({
      ...fieldProps,
      control: controlNode,
      getValue: () => input.value,
      onClear: () => {
        if (input.disabled || input.readOnly) return;
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      },
      onFocus: () => input.focus()
    });

    // keep UI in sync with programmatic updates:
    // (questa parte DIPENDE da come rodModel aggiorna input.value)
    input.addEventListener("input", () => field._refresh?.());
    input.addEventListener("change", () => field._refresh?.());

    // expose reference
    field._input = input;
    uiConfigureFieldControl(field, input, props, true);
    uiRegisterShortcode(input, props, {
      isEnabled: () => !input.disabled,
      action: () => uiFocusShortcutTarget(input, { selectText: !!props.selectOnShortcode })
    });

    return field;
  }
