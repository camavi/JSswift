
  // Public field attributes belong to the interactive control, not its wrapper.
  function uiConfigureFieldControl(field, control, props, native = false) {
    field.focus = (options) => control.focus(options);
    const set = (name, value) => {
      if (value == null || value === false) control.removeAttribute(name);
      else control.setAttribute(name, String(value));
    };
    const stopAttributes = JSswift.reactive.effect(() => {
      const label = uiUnwrap(props.ariaLabel) ?? (typeof props.label === "string" ? props.label : null);
      set("aria-label", label);
      set("aria-labelledby", uiUnwrap(props.ariaLabelledBy));
      field._syncDescription?.();
      const invalid = props.ariaInvalid == null ? !!uiUnwrap(props.error) : !!uiUnwrap(props.ariaInvalid);
      control.setAttribute("aria-invalid", String(invalid));
      const required = !!uiUnwrap(props.required);
      control.setAttribute("aria-required", String(required));
      if (native) {
        control.required = required;
        for (const name of ["min", "max", "step", "pattern", "minLength", "maxLength"])
          set(name.toLowerCase(), uiUnwrap(props[name]));
      }
    }, "UI.Field:controlAttributes");
    JSswift._registerCleanup(field, stopAttributes);
  }
