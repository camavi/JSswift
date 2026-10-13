
  const buildChoiceControl = (type, args, options = {}) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const isRadio = type === "radio";
    const isToggle = options.appearance === "toggle";
    const supportsStandby = !isRadio;
    const id = props.id || (`jss-${type}-` + Math.random().toString(36).slice(2));
    const model = resolveModel(
      props.model,
      options.modelName || (isRadio ? "UI.Radio:model" : "UI.Checkbox:model")
    );

    const inputProps = JSswift.omit(props, [
      "model", "label", "checked", "class", "style", "dense", "onChange", "onInput", "slots",
      "icon", "iconOn", "iconOff", "iconStandby", "checkedIcon", "uncheckedIcon", "standbyIcon",
      "indeterminateIcon", "inputClass", "iconSize", "color", "size", "outline", "behavior", "mode",
      "flat", "glossy", "glow", "glass", "gradient", "textGradient", "lightShadow", "shadow",
      "rounded", "radius", "textColor", "clickable", "border",
      "shortcode", "shortcut", "hotkey", "showShortcode", "showShortcut"
    ]);
    inputProps.type = type;
    inputProps.id = id;
    if (isRadio && props.name != null) inputProps.name = props.name;
    inputProps.class = uiClass([`jss-${type}`, "jss-choice-input", props.inputClass]);
    const input = _.input(inputProps);

    const labelNodes = renderSlotToArray(slots, "label", {}, props.label);
    const labelContent = labelNodes.length ? labelNodes : renderSlotToArray(slots, "default", {}, children);
    const shortcodeHint = uiCreateShortcodeHint(props, { className: "jss-shortcode jss-choice-shortcode" });
    const finalLabelContent = shortcodeHint ? [...labelContent, shortcodeHint] : labelContent;

    const wrapProps = JSswift.omit(props, [
      "model", "label", "checked", "onChange", "onInput", "value", "name", "id", "type", "dense",
      "inputClass", "slots", "icon", "iconOn", "iconOff", "iconStandby", "checkedIcon",
      "uncheckedIcon", "standbyIcon", "indeterminateIcon", "iconSize", "color", "size", "behavior",
      "mode",
      "outline", "flat", "glossy", "glow", "glass", "gradient", "textGradient", "lightShadow",
      "shadow", "rounded", "radius", "textColor", "clickable", "border",
      "shortcode", "shortcut", "hotkey", "showShortcode", "showShortcut"
    ]);
    wrapProps.class = uiClass([
      "jss-clear-set",
      "jss-singularity-check",
      "jss-choice-wrap",
      `jss-${type}-wrap`,
      uiWhen(isToggle, "jss-toggle-wrap"),
      uiWhen(isToggle && isRadio, "jss-toggle-radio-wrap"),
      uiWhen(isToggle && !isRadio, "jss-toggle-checkbox-wrap"),
      uiWhen(props.dense, "dense"),
      props.class
    ]);
    wrapProps.style = { ...(props.style || {}) };

    const sizeValue = uiUnwrap(props.size);
    if (sizeValue != null && !(typeof sizeValue === "string" && JSswift.uiSizes?.includes(sizeValue))) {
      wrapProps.style["--jss-choice-size"] = toCssSize(sizeValue);
    }

    const marker = _.span({
      class: uiClass([
        "jss-choice-mark",
        isRadio ? "jss-choice-radio-mark" : "jss-choice-checkbox-mark",
        uiWhen(isToggle, "jss-toggle-mark")
      ])
    });
    const indicatorHost = isToggle ? _.span({ class: "jss-toggle-thumb" }) : marker;
    if (isToggle) marker.appendChild(indicatorHost);
    const labelNode = finalLabelContent.length ? _.span({ class: "jss-choice-label" }, ...finalLabelContent) : null;

    const wrap = _.label(
      wrapProps,
      input,
      marker,
      labelNode
    );
    setPropertyProps(wrap, props);

    const iconSize = props.iconSize ? props.iconSize : props.size;
    const defaultCheckedIcon = isToggle ? null : (isRadio ? "radio_button_checked" : "check");
    const defaultUncheckedIcon = isToggle ? null : (isRadio ? "radio_button_unchecked" : null);
    const defaultStandbyIcon = isToggle || isRadio ? null : "indeterminate_check_box";
    const setInputState = (value) => {
      if (isRadio) {
        input.checked = value == props.value;
        return input.checked;
      }
      const normalized = value == null ? null : !!value;
      input.checked = normalized === true;
      input.indeterminate = supportsStandby && normalized == null;
      return normalized;
    };
    const getInputState = () => {
      if (!isRadio && supportsStandby && input.indeterminate) return null;
      return !!input.checked;
    };
    const resolveIconSource = (state) => {
      if (state === true) {
        if (props.checkedIcon != null) return props.checkedIcon;
        if (props.icon != null) return props.icon;
        return defaultCheckedIcon;
      }
      if (state === false) {
        if (props.uncheckedIcon != null) return props.uncheckedIcon;
        return defaultUncheckedIcon;
      }
      if (props.indeterminateIcon != null) return props.indeterminateIcon;
      if (props.standbyIcon != null) return props.standbyIcon;
      if (props.iconStandby != null) return props.iconStandby;
      return defaultStandbyIcon;
    };

    const syncIndicator = () => {
      const state = getInputState();
      const checked = state === true;
      while (indicatorHost.firstChild) indicatorHost.removeChild(indicatorHost.firstChild);
      wrap.classList.toggle("is-checked", checked);
      wrap.classList.toggle("is-indeterminate", state == null);
      wrap.classList.toggle("is-disabled", !!input.disabled);
      if (checked && (props.checkedIcon || props.icon)) {
        wrap.classList.toggle("toggle-default", false);
      } else if (checked && !props.checkedIcon) {
        wrap.classList.toggle("toggle-default", true);
      } else if (state == null && !props.standbyIcon) {
        wrap.classList.toggle("toggle-default", true);
      } else if (state == null && props.standbyIcon) {
        wrap.classList.toggle("toggle-default", false);
      } else if (input.disabled === false && !props.uncheckedIcon) {
        wrap.classList.toggle("toggle-default", true);
      } else {
        wrap.classList.toggle("toggle-default", false);
      }

      if (isToggle) {
        if (state == null) {
          indicatorHost.style.transform = "translateX(calc((var(--jss-toggle-width) - var(--jss-toggle-thumb-size) - 1px) / 2))";
        } else {
          indicatorHost.style.removeProperty("transform");
        }
      }

      const ctx = { checked, state, indeterminate: state == null, value: props.value, id, type };
      let iconNode = null;
      if (state === true) {
        iconNode = JSswift.ui.renderSlot(slots, "checkedIcon", ctx, null);
        if (iconNode == null) iconNode = JSswift.ui.renderSlot(slots, "iconOn", ctx, null);
      } else if (state === false) {
        iconNode = JSswift.ui.renderSlot(slots, "uncheckedIcon", ctx, null);
        if (iconNode == null) iconNode = JSswift.ui.renderSlot(slots, "iconOff", ctx, null);
      } else {
        iconNode = JSswift.ui.renderSlot(slots, "indeterminateIcon", ctx, null);
        if (iconNode == null) iconNode = JSswift.ui.renderSlot(slots, "standbyIcon", ctx, null);
        if (iconNode == null) iconNode = JSswift.ui.renderSlot(slots, "iconStandby", ctx, null);
      }
      if (iconNode == null) iconNode = JSswift.ui.renderSlot(slots, "icon", ctx, null);
      if (iconNode == null) {
        const source = resolveIconSource(state);
        if (typeof source === "string") iconNode = UI.Icon({ name: source, size: iconSize, ...(isToggle ? { textColor: props.color, outline: true } : {}) });
        else if (source != null) {
          iconNode = JSswift.ui.slot(source, {
            checked,
            state,
            indeterminate: state == null,
            as: state === true ? "checkedIcon" : (state === false ? "uncheckedIcon" : "indeterminateIcon")
          });
        }
      }
      renderSlotToArray(null, "default", {}, iconNode).forEach((n) => indicatorHost.appendChild(n));
    };

    if (model) {
      setInputState(model.get());
      const stopModel = model.watch((v) => {
        setInputState(v);
        syncIndicator();
      }, isRadio ? "UI.Radio:watch" : "UI.Checkbox:watch");
      JSswift._registerCleanup(wrap, stopModel);
      input.addEventListener("change", (e) => {
        if (isRadio) {
          if (input.checked) {
            model.set(props.value);
            props.onChange?.(props.value, e);
          }
        } else {
          const nextState = getInputState();
          model.set(nextState);
          props.onChange?.(nextState, e);
        }
        syncIndicator();
      });
    } else {
      setInputState(isRadio ? (props.checked === true ? props.value : undefined) : props.checked);
      input.addEventListener("change", (e) => {
        if (isRadio) props.onChange?.(props.value, e);
        else props.onChange?.(getInputState(), e);
        syncIndicator();
      });
    }
    if (props.onInput) {
      input.addEventListener("input", (e) => {
        if (isRadio) props.onInput?.(props.value, e);
        else props.onInput?.(getInputState(), e);
      });
    }

    syncIndicator();
    uiRegisterShortcode(wrap, props, {
      isEnabled: () => !input.disabled,
      action: () => {
        if (input.disabled) return false;
        uiFocusShortcutTarget(input);
        input.click();
      }
    });
    return wrap;
  };
