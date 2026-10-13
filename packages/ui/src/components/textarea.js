

  UI.Textarea = (props = {}) => {
    const slots = props.slots || {};
    const fieldProps = {
      ...props,
      label: props.label ?? props.placeholder,
      wrapClass: uiClass(["jss-textarea-field", props.wrapClass])
    };
    const textarea = _.textarea({
      class: uiClass(["jss-input", "jss-textarea", props.class]),
      name: props.name,
      autocomplete: props.autocomplete,
      inputmode: props.inputmode,
      rows: props.rows,
      cols: props.cols,
      maxLength: props.maxLength ?? props.maxlength,
      minLength: props.minLength ?? props.minlength,
      wrap: props.wrap,
      value: props.value ?? "",
      disabled: !!props.disabled,
      readOnly: !!props.readonly
    });

    textarea.addEventListener("input", () => {
      props.onInput?.(textarea.value);
    });
    textarea.addEventListener("change", () => {
      props.onChange?.(textarea.value);
    });
    textarea.addEventListener("focus", (e) => {
      props.onFocus?.(e);
    });
    textarea.addEventListener("blur", (e) => {
      props.onBlur?.(e);
    });

    const model = props.model;
    if (model) {
      const bindTextareaRod = (rod) => {
        let syncing = false;

        const updateFromRod = (v) => {
          const next = v ?? "";
          if (textarea.value === next) return;
          textarea.value = next;
        };

        const onValue = (v) => {
          if (syncing) return;
          syncing = true;
          try { updateFromRod(v); } finally { syncing = false; }
        };
        rod.action(onValue);

        JSswift.reactive.untracked(() => updateFromRod(rod.value));

        const onInput = (e) => {
          if (syncing || e?.isComposing) return;
          const next = textarea.value;
          if (rod.value === next) return;
          syncing = true;
          try { rod.value = next; } finally { syncing = false; }
        };

        textarea.addEventListener("input", onInput);
        textarea.addEventListener("compositionend", onInput);

        let disposed = false;
        const stop = () => {
          if (disposed) return;
          disposed = true;
          textarea.removeEventListener("input", onInput);
          textarea.removeEventListener("compositionend", onInput);
          const actionIndex = rod._actions?.indexOf(onValue) ?? -1;
          if (actionIndex >= 0) rod._actions.splice(actionIndex, 1);
          const hookIndex = rod._disposeHooks?.indexOf(stop) ?? -1;
          if (hookIndex >= 0 && !rod._disposed) rod._disposeHooks.splice(hookIndex, 1);
        };
        rod.onDispose?.(stop);
        JSswift._registerCleanup(textarea, stop);
      };
      if (typeof model === "object" && typeof model._bind === "function") {
        bindTextareaRod(model);
      } else if (Array.isArray(model) && typeof model[0] === "function" && typeof model[1] === "function") {
        const r = JSswift.reactive.untracked(() => JSswift.rodFromSignal(model[0], model[1]));
        bindTextareaRod(r);
        JSswift._registerCleanup(textarea, () => r.dispose());
      }
    }

    const textareaSlotName = JSswift.ui.getSlot(slots, "textarea") != null ? "textarea" : "input";
    const textareaSlot = JSswift.ui.renderSlot(slots, textareaSlotName, { textarea, input: textarea, props }, textarea);
    const controlNode = Array.isArray(textareaSlot)
      ? _.div({ style: { display: "contents" } }, ...textareaSlot)
      : textareaSlot;

    const field = UI.FormField({
      ...fieldProps,
      control: controlNode,
      getValue: () => textarea.value,
      onClear: () => {
        if (textarea.disabled || textarea.readOnly) return;
        textarea.value = "";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      },
      onFocus: () => textarea.focus()
    });

    textarea.addEventListener("input", () => field._refresh?.());
    textarea.addEventListener("change", () => field._refresh?.());

    field._input = textarea;
    field._textarea = textarea;
    uiRegisterShortcode(textarea, props, {
      isEnabled: () => !textarea.disabled,
      action: () => uiFocusShortcutTarget(textarea, { selectText: !!props.selectOnShortcode })
    });

    return field;
  };
