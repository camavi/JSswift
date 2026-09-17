  const buildChoiceControl = (type, args, options = {}) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const isRadio = type === "radio";
    const isToggle = options.appearance === "toggle";
    const supportsStandby = !isRadio;
    const id = props.id || (`cms-${type}-` + Math.random().toString(36).slice(2));
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
    inputProps.class = uiClass([`cms-${type}`, "cms-choice-input", props.inputClass]);
    const input = _.input(inputProps);

    const labelNodes = renderSlotToArray(slots, "label", {}, props.label);
    const labelContent = labelNodes.length ? labelNodes : renderSlotToArray(slots, "default", {}, children);
    const shortcodeHint = uiCreateShortcodeHint(props, { className: "cms-shortcode cms-choice-shortcode" });
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
      "cms-clear-set",
      "cms-singularity-check",
      "cms-choice-wrap",
      `cms-${type}-wrap`,
      uiWhen(isToggle, "cms-toggle-wrap"),
      uiWhen(isToggle && isRadio, "cms-toggle-radio-wrap"),
      uiWhen(isToggle && !isRadio, "cms-toggle-checkbox-wrap"),
      uiWhen(props.dense, "dense"),
      props.class
    ]);
    wrapProps.style = { ...(props.style || {}) };

    const sizeValue = uiUnwrap(props.size);
    if (sizeValue != null && !(typeof sizeValue === "string" && JSswift.uiSizes?.includes(sizeValue))) {
      wrapProps.style["--cms-choice-size"] = toCssSize(sizeValue);
    }

    const marker = _.span({
      class: uiClass([
        "cms-choice-mark",
        isRadio ? "cms-choice-radio-mark" : "cms-choice-checkbox-mark",
        uiWhen(isToggle, "cms-toggle-mark")
      ])
    });
    const indicatorHost = isToggle ? _.span({ class: "cms-toggle-thumb" }) : marker;
    if (isToggle) marker.appendChild(indicatorHost);
    const labelNode = finalLabelContent.length ? _.span({ class: "cms-choice-label" }, ...finalLabelContent) : null;

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
          indicatorHost.style.transform = "translateX(calc((var(--cms-toggle-width) - var(--cms-toggle-thumb-size) - 1px) / 2))";
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
      model.watch((v) => {
        setInputState(v);
        syncIndicator();
      }, isRadio ? "UI.Radio:watch" : "UI.Checkbox:watch");
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

  UI.Checkbox = (...args) => buildChoiceControl("checkbox", args);
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Checkbox = {
      signature: "UI.Checkbox(...children) | UI.Checkbox(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        checked: "boolean|null",
        model: "[get,set] signal",
        icon: "String|Node|Function|Array",
        iconOn: "Alias of icon/checkedIcon",
        iconOff: "Alias of uncheckedIcon",
        iconStandby: "Icon for null/indeterminate state",
        checkedIcon: "String|Node|Function|Array",
        uncheckedIcon: "String|Node|Function|Array",
        color: "string",
        size: "string|number",
        outline: "boolean",
        dense: "boolean",
        shortcode: "string|Array<string>|object",
        showShortcode: "boolean",
        slots: "{ label?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        label: "Checkbox label",
        icon: "Base icon content",
        iconStandby: "Slot for null/indeterminate icon",
        checkedIcon: "Icon when checked",
        uncheckedIcon: "Icon when unchecked",
        default: "Fallback label content"
      },
      events: {
        onChange: "(checked|null, event)",
        onInput: "(checked|null, event)"
      },
      returns: "HTMLLabelElement",
      description: "Checkbox con label e supporto model."
    };
  }
  // Esempio: JSswift.ui.Checkbox({ label: "Accetto", model: [get,set] })

  UI.Radio = (...args) => buildChoiceControl("radio", args);
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Radio = {
      signature: "UI.Radio(...children) | UI.Radio(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        value: "any",
        name: "string",
        checked: "boolean|null",
        model: "[get,set] signal",
        icon: "String|Node|Function|Array",
        iconOn: "Alias of icon/checkedIcon",
        iconOff: "Alias of uncheckedIcon",
        checkedIcon: "String|Node|Function|Array",
        uncheckedIcon: "String|Node|Function|Array",
        color: "string",
        size: "string|number",
        outline: "boolean",
        dense: "boolean",
        shortcode: "string|Array<string>|object",
        showShortcode: "boolean",
        slots: "{ label?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        label: "Radio label",
        icon: "Base icon content",
        iconOn: "Alias slot for checked icon",
        iconOff: "Alias slot for unchecked icon",
        checkedIcon: "Icon when checked",
        uncheckedIcon: "Icon when unchecked",
        default: "Fallback label content"
      },
      events: {
        onChange: "(value, event)",
        onInput: "(value, event)"
      },
      returns: "HTMLLabelElement",
      description: "Radio con label e supporto model."
    };
  }
  // Esempio: JSswift.ui.Radio({ name: "r1", value: "a", label: "A", model: [get,set] })

  UI.Toggle = (...args) => {
    const { props } = JSswift.uiNormalizeArgs(args);
    const behavior = String(props.behavior ?? props.mode ?? props.type ?? "checkbox").toLowerCase() === "radio"
      ? "radio"
      : "checkbox";
    return buildChoiceControl(behavior, args, {
      appearance: "toggle",
      modelName: "UI.Toggle:model"
    });
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Toggle = {
      signature: "UI.Toggle(...children) | UI.Toggle(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        behavior: "\"checkbox\"|\"radio\"",
        mode: "Alias of behavior",
        value: "any",
        name: "string",
        checked: "boolean",
        model: "[get,set] signal",
        icon: "String|Node|Function|Array",
        iconOn: "Alias of icon/checkedIcon",
        iconOff: "Alias of uncheckedIcon",
        iconStandby: "Icon for null/indeterminate state",
        checkedIcon: "String|Node|Function|Array",
        uncheckedIcon: "String|Node|Function|Array",
        color: "string",
        size: "string|number",
        dense: "boolean",
        shortcode: "string|Array<string>|object",
        showShortcode: "boolean",
        slots: "{ label?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        label: "Toggle label",
        icon: "Base icon content",
        iconOn: "Alias slot for checked icon",
        iconOff: "Alias slot for unchecked icon",
        iconStandby: "Slot for null/indeterminate icon",
        checkedIcon: "Icon when checked",
        uncheckedIcon: "Icon when unchecked",
        default: "Fallback label content"
      },
      events: {
        onChange: "(checked|value, event)",
        onInput: "(checked|value, event)"
      },
      returns: "HTMLLabelElement",
      description: "Toggle switch con supporto model e comportamento checkbox/radio."
    };
  }
  // Esempio: JSswift.ui.Toggle({ label: "Attivo", model: [get,set] })

  UI.Slider = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const boundValue = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(boundValue, "UI.Slider:model");

    const inputProps = JSswift.omit(props, [
      "model", "value", "class", "style", "onChange", "onInput", "slots",
      "label", "icon", "iconRight", "thumbIcon", "iconThumb", "pointIcon",
      "markers", "markerLabels", "labelMarks", "leftLabel", "rightLabel",
      "startLabel", "endLabel", "minLabel", "maxLabel", "withQItem", "qitem",
      "item", "itemClass", "itemStyle", "showValue", "thumbLabel", "labelValue",
      "selectionColor", "trackColor", "thumbColor", "inputClass", "readonly", "size"
    ]);
    inputProps.type = "range";
    inputProps.class = uiClass(["cms-slider-input", props.inputClass]);
    const input = _.input(inputProps);

    const sliderStyle = { ...(props.style || {}) };
    const sizeValue = uiUnwrap(props.size);
    if (sizeValue != null) {
      const sliderSize = (typeof sizeValue === "string" && JSswift.uiSizes?.includes(sizeValue))
        ? `var(--cms-size-${sizeValue})`
        : toCssSize(sizeValue);
      sliderStyle["--cms-slider-size"] = sliderSize;
      sliderStyle["--cms-slider-track-size"] = `max(4px, calc(${sliderSize} / 4))`;
      sliderStyle["--cms-slider-box-height"] = `calc(${sliderSize} * 1.5)`;
      sliderStyle["--cms-slider-marker-size"] = `max(6px, calc(${sliderSize} / 3))`;
    }

    const wrap = _.label({
      class: uiClass([
        "cms-clear-set",
        "cms-singularity-check",
        "cms-slider-wrap",
        uiWhen(props.dense, "dense"),
        props.class
      ]),
      style: sliderStyle
    });
    setPropertyProps(wrap, props);

    const header = _.div({
      class: "cms-slider-header"
    });
    const labelHost = _.span({
      class: "cms-slider-label"
    });
    const valueHost = _.span({
      class: "cms-slider-value"
    });
    header.append(labelHost, valueHost);

    const body = _.div({
      class: "cms-slider-body"
    });
    const startIconHost = _.span({
      class: "cms-slider-icon cms-slider-icon-left"
    });
    const startLabelHost = _.span({
      class: "cms-slider-edge-label cms-slider-edge-label-left"
    });
    const main = _.div({
      class: "cms-slider-main"
    });
    const sliderBox = _.div({
      class: "cms-slider-box",
      style: {
        minHeight: "var(--cms-slider-box-height, 36px)"
      }
    });
    const rail = _.span({
      class: "cms-slider-rail",
      style: {
        height: "var(--cms-slider-track-size, 6px)"
      }
    });
    const selection = _.span({
      class: "cms-slider-selection",
      style: {
        height: "var(--cms-slider-track-size, 6px)"
      }
    });
    const thumb = _.span({
      class: "cms-slider-thumb",
      style: {
        width: "var(--cms-slider-size, 24px)",
        height: "var(--cms-slider-size, 24px)"
      }
    });
    const thumbIconHost = _.span({
      class: "cms-slider-thumb-icon"
    });
    const thumbLabelHost = _.span({
      class: "cms-slider-thumb-label"
    });
    thumb.append(thumbLabelHost, thumbIconHost);

    const markersHost = _.div({
      class: "cms-slider-markers"
    });
    const endLabelHost = _.span({
      class: "cms-slider-edge-label cms-slider-edge-label-right"
    });
    const endIconHost = _.span({
      class: "cms-slider-icon cms-slider-icon-right"
    });

    sliderBox.append(rail, selection, thumb, input);
    main.append(sliderBox, markersHost);
    body.append(startIconHost, startLabelHost, main, endLabelHost, endIconHost);
    wrap.append(header, body);

    const clearHost = (host) => {
      while (host.firstChild) host.removeChild(host.firstChild);
    };
    const renderInto = (host, nodes, display = "") => {
      clearHost(host);
      (nodes || []).forEach((n) => host.appendChild(n));
      host.style.display = host.childNodes.length ? display : "none";
    };
    const unwrapSlotValue = (value) => (uiIsSignal(value) || uiIsRod(value) ? uiUnwrap(value) : value);
    const asArray = (value, ctx = {}) => slotToArray(unwrapSlotValue(value), ctx);
    const asIconArray = (value, as, ctx = {}) => {
      const resolved = unwrapSlotValue(value);
      if (resolved == null) return [];
      if (typeof resolved === "string") return [UI.Icon({ name: resolved, size: props.iconSize ?? props.size ?? 16 })];
      return asArray(resolved, { ...ctx, as });
    };
    const getNumber = (value, fallback) => {
      const next = Number(value);
      return Number.isFinite(next) ? next : fallback;
    };
    const getMin = () => getNumber(uiUnwrap(props.min), 0);
    const getMax = () => {
      const min = getMin();
      const max = getNumber(uiUnwrap(props.max), 100);
      return max < min ? min : max;
    };
    const getStep = () => {
      const raw = uiUnwrap(props.step);
      if (raw === "any") return "any";
      const step = getNumber(raw, 1);
      return step > 0 ? step : 1;
    };
    const getPrecision = (value) => {
      if (value === "any") return 0;
      const str = String(value);
      if (str.includes("e-")) return Number(str.split("e-")[1] || 0);
      const idx = str.indexOf(".");
      return idx === -1 ? 0 : str.length - idx - 1;
    };
    const normalizeValue = (value) => {
      const min = getMin();
      const max = getMax();
      const step = getStep();
      let next = getNumber(value, min);
      if (step !== "any") {
        next = min + Math.round((next - min) / step) * step;
        const precision = getPrecision(step);
        if (precision > 0) next = Number(next.toFixed(precision));
      }
      return Math.min(max, Math.max(min, next));
    };
    const ratioFromValue = (value) => {
      const min = getMin();
      const max = getMax();
      const span = max - min;
      if (!span) return 0;
      const raw = (normalizeValue(value) - min) / span;
      const ratio = uiUnwrap(props.reverse) ? (1 - raw) : raw;
      return Math.max(0, Math.min(1, ratio));
    };
    const [getValue, setValue] = JSswift.reactive.signal(normalizeValue(
      model ? model.get() : (uiUnwrap(props.value) ?? uiUnwrap(props.min) ?? 0)
    ));

    const setSliderValue = (raw, opts = {}) => {
      const next = normalizeValue(raw);
      if (getValue() !== next) setValue(next);
      if (String(input.value) !== String(next)) input.value = String(next);
      if (model && opts.fromModel !== true) model.set(next);
      return next;
    };

    const getMarkerItems = () => {
      const raw = uiUnwrap(props.markers);
      const showLabels = !!uiUnwrap(props.markerLabels ?? props.labelMarks);
      if (!raw) return [];
      const min = getMin();
      const max = getMax();
      const normalizeMarker = (entry, index) => {
        if (entry == null) return null;
        if (typeof entry === "object" && !Array.isArray(entry)) {
          const value = normalizeValue(entry.value ?? entry.position ?? entry.at ?? min);
          return {
            key: entry.key ?? `marker-${index}-${value}`,
            value,
            label: entry.label ?? (showLabels ? String(value) : null),
            icon: entry.icon ?? null,
            className: entry.class ?? entry.className ?? ""
          };
        }
        const value = normalizeValue(entry);
        return {
          key: `marker-${index}-${value}`,
          value,
          label: showLabels ? String(entry) : null,
          icon: null,
          className: ""
        };
      };

      if (Array.isArray(raw)) {
        return raw.map((entry, index) => normalizeMarker(entry, index)).filter(Boolean);
      }
      if (typeof raw === "number" && raw > 1) {
        const count = Math.floor(raw);
        const stepValue = count > 1 ? (max - min) / (count - 1) : 0;
        return Array.from({ length: count }, (_, index) => normalizeMarker(min + (stepValue * index), index)).filter(Boolean);
      }
      if (raw === true) {
        const step = getStep();
        if (step === "any") {
          return [normalizeMarker(min, 0), normalizeMarker(max, 1)].filter(Boolean);
        }
        const count = Math.floor((max - min) / step) + 1;
        if (count > 24) {
          return [normalizeMarker(min, 0), normalizeMarker((min + max) / 2, 1), normalizeMarker(max, 2)].filter(Boolean);
        }
        return Array.from({ length: count }, (_, index) => normalizeMarker(min + (step * index), index)).filter(Boolean);
      }
      if (typeof raw === "object") {
        return Object.keys(raw).map((key, index) => normalizeMarker({
          value: Number(key),
          label: raw[key]
        }, index)).filter(Boolean);
      }
      return [];
    };

    const renderMarkers = () => {
      clearHost(markersHost);
      const markers = getMarkerItems();
      markersHost.style.display = markers.length ? "block" : "none";
      markersHost.style.minHeight = markers.some((marker) => marker.label != null && marker.label !== "") ? "30px" : "10px";
      markers.forEach((marker) => {
        const ratio = ratioFromValue(marker.value);
        const active = uiUnwrap(props.reverse) ? getValue() <= marker.value : getValue() >= marker.value;
        const item = _.button({
          type: "button",
          class: uiClass(["cms-slider-marker", marker.className, uiWhen(() => active, "active")]),
          style: {
            left: `${ratio * 100}%`,
            color: active ? (uiUnwrap(props.color) || "var(--cms-primary)") : "var(--cms-muted)",
            cursor: (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) ? "default" : "pointer"
          },
          disabled: !!uiUnwrap(props.disabled) || !!uiUnwrap(props.readonly),
          onClick: () => {
            if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
            const next = setSliderValue(marker.value);
            props.onInput?.(next);
            props.onChange?.(next);
          }
        });
        const markerCtx = {
          marker,
          active,
          value: marker.value,
          current: getValue(),
          input
        };
        let markerNode = JSswift.ui.renderSlot(slots, "marker", markerCtx, null);
        if (markerNode == null && marker.icon != null) {
          markerNode = typeof marker.icon === "string"
            ? UI.Icon({ name: marker.icon, size: 12 })
            : JSswift.ui.slot(marker.icon, { ...markerCtx, as: "marker" });
        }
        const markerTick = _.span({
          class: "cms-slider-marker-tick",
          style: {
            width: "var(--cms-slider-marker-size, 8px)",
            height: "var(--cms-slider-marker-size, 8px)",
            background: active ? (uiUnwrap(props.color) || "var(--cms-primary)") : "var(--cms-border-color)"
          }
        });
        const markerNodes = markerNode == null
          ? [markerTick]
          : renderSlotToArray(null, "default", markerCtx, markerNode);
        const labelNodes = marker.label == null
          ? renderSlotToArray(slots, "markerLabel", markerCtx, null)
          : renderSlotToArray(slots, "markerLabel", markerCtx, marker.label);
        markerNodes.forEach((node) => item.appendChild(node));
        if (labelNodes.length) {
          item.appendChild(_.span({
            class: "cms-slider-marker-label"
          }, ...labelNodes));
        }
        markersHost.appendChild(item);
      });
    };

    const renderHeader = () => {
      const ctx = { value: getValue(), input, props };
      let labelNodes = renderSlotToArray(slots, "label", ctx, unwrapSlotValue(props.label));
      if (!labelNodes.length) labelNodes = renderSlotToArray(slots, "default", ctx, children);
      renderInto(labelHost, labelNodes, "inline-flex");

      const showValue = uiUnwrap(props.showValue);
      const rawValueLabel = showValue === false
        ? null
        : (unwrapSlotValue(props.labelValue) ?? getValue());
      const valueNodes = showValue || unwrapSlotValue(props.labelValue) != null
        ? renderSlotToArray(slots, "value", ctx, rawValueLabel)
        : [];
      renderInto(valueHost, valueNodes, "inline-flex");
      header.style.display = (labelHost.childNodes.length || valueHost.childNodes.length) ? "flex" : "none";
    };

    const renderAddons = () => {
      const ctx = { value: getValue(), input, props };
      const leftIcon = renderSlotToArray(slots, "icon", ctx, null);
      const leftIconNodes = leftIcon.length ? leftIcon : asIconArray(props.icon, "icon", ctx);
      renderInto(startIconHost, leftIconNodes, "inline-flex");

      const rightIcon = renderSlotToArray(slots, "iconRight", ctx, null);
      const rightIconNodes = rightIcon.length ? rightIcon : asIconArray(props.iconRight, "iconRight", ctx);
      renderInto(endIconHost, rightIconNodes, "inline-flex");

      const leftLabelSource = unwrapSlotValue(props.startLabel ?? props.leftLabel ?? props.minLabel);
      const rightLabelSource = unwrapSlotValue(props.endLabel ?? props.rightLabel ?? props.maxLabel);
      renderInto(startLabelHost, renderSlotToArray(slots, "startLabel", ctx, leftLabelSource), "inline-flex");
      renderInto(endLabelHost, renderSlotToArray(slots, "endLabel", ctx, rightLabelSource), "inline-flex");
    };

    const renderThumb = () => {
      const ctx = { value: getValue(), input, props };
      const thumbIconNodes = renderSlotToArray(slots, "thumbIcon", ctx, null);
      const thumbIconFallback = props.thumbIcon ?? props.iconThumb ?? props.pointIcon;
      renderInto(
        thumbIconHost,
        thumbIconNodes.length ? thumbIconNodes : asIconArray(thumbIconFallback, "thumbIcon", ctx),
        "inline-flex"
      );

      const rawThumbLabel = unwrapSlotValue(props.thumbLabel)
        ?? unwrapSlotValue(props.labelValue)
        ?? (uiUnwrap(props.showValue) ? String(getValue()) : null);
      const thumbLabelNodes = renderSlotToArray(slots, "thumbLabel", ctx, rawThumbLabel);
      renderInto(thumbLabelHost, thumbLabelNodes, "inline-flex");
    };

    const syncVisualState = () => {
      const value = normalizeValue(getValue());
      const min = getMin();
      const max = getMax();
      const step = getStep();
      const ratio = ratioFromValue(value);
      const percent = `${ratio * 100}%`;
      const color = uiUnwrap(props.color) || uiUnwrap(props.selectionColor) || "var(--cms-primary)";
      const trackColor = uiUnwrap(props.trackColor) || "var(--cms-border-color)";
      const thumbColor = uiUnwrap(props.thumbColor) || color;
      const readonly = !!uiUnwrap(props.readonly);
      const disabled = !!uiUnwrap(props.disabled);

      input.min = String(min);
      input.max = String(max);
      input.step = step === "any" ? "any" : String(step);
      input.disabled = disabled;
      input.value = String(value);

      rail.style.background = trackColor;
      selection.style.background = color;
      selection.style.width = percent;
      thumb.style.left = percent;
      thumb.style.borderColor = thumbColor;
      thumb.style.color = thumbColor;
      thumbLabelHost.style.background = color;
      wrap.classList.toggle("is-disabled", disabled);
      wrap.classList.toggle("is-readonly", readonly);
      wrap.classList.toggle("has-markers", markersHost.childNodes.length > 0);
    };

    if (model) {
      setSliderValue(model.get(), { fromModel: true });
      model.watch((v) => { setSliderValue(v, { fromModel: true }); }, "UI.Slider:watch");
    } else if (uiIsReactive(props.value)) {
      JSswift.reactive.effect(() => {
        setSliderValue(uiUnwrap(props.value), { fromModel: true });
      }, "UI.Slider:value");
    } else {
      setSliderValue(props.value ?? props.min ?? 0, { fromModel: true });
    }

    input.addEventListener("input", (e) => {
      if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) {
        input.value = String(getValue());
        return;
      }
      const next = setSliderValue(input.value);
      props.onInput?.(next, e);
    });
    input.addEventListener("change", (e) => {
      if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) {
        input.value = String(getValue());
        return;
      }
      const next = setSliderValue(input.value);
      props.onChange?.(next, e);
    });

    JSswift.reactive.effect(() => {
      renderHeader();
      renderAddons();
      renderThumb();
      renderMarkers();
      syncVisualState();
    }, "UI.Slider:render");

    wrap._input = input;
    wrap._getValue = getValue;
    wrap._setValue = (value) => setSliderValue(value);

    if (props.withQItem || props.qitem || props.item === true) {
      const item = UI.Item({
        class: uiClass(["cms-slider-item", props.itemClass]),
        style: props.itemStyle
      }, wrap);
      item._input = input;
      item._slider = wrap;
      item._getValue = getValue;
      item._setValue = wrap._setValue;
      return item;
    }

    return wrap;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Slider = {
      signature: "UI.Slider(...children) | UI.Slider(props, ...children)",
      props: {
        min: "number",
        max: "number",
        step: "number|\"any\"",
        value: "number | rod | [get,set] signal",
        model: "rod | [get,set] signal",
        label: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        thumbIcon: "String|Node|Function|Array",
        iconThumb: "Alias of thumbIcon",
        pointIcon: "Alias of thumbIcon",
        thumbLabel: "String|Node|Function|Array",
        showValue: "boolean",
        labelValue: "String|Node|Function|Array",
        markers: "boolean|number|Array|Object",
        markerLabels: "boolean",
        labelMarks: "Alias of markerLabels",
        startLabel: "String|Node|Function|Array",
        endLabel: "String|Node|Function|Array",
        leftLabel: "Alias of startLabel",
        rightLabel: "Alias of endLabel",
        minLabel: "Alias of startLabel",
        maxLabel: "Alias of endLabel",
        withQItem: "boolean",
        qitem: "Alias of withQItem",
        item: "boolean",
        itemClass: "string",
        itemStyle: "object",
        selectionColor: "string",
        trackColor: "string",
        thumbColor: "string",
        size: "string|number",
        readonly: "boolean",
        inputClass: "string",
        slots: "{ label?, default?, value?, icon?, iconRight?, thumbIcon?, thumbLabel?, marker?, markerLabel?, startLabel?, endLabel? }",
        class: "string",
        style: "object"
      },
      slots: {
        label: "Label content",
        default: "Fallback label content",
        value: "Header value content",
        icon: "Left icon content",
        iconRight: "Right icon content",
        thumbIcon: "Thumb icon content",
        thumbLabel: "Thumb label content",
        marker: "Marker content",
        markerLabel: "Marker label content",
        startLabel: "Label on the left/start of the track",
        endLabel: "Label on the right/end of the track"
      },
      events: {
        onChange: "(value, event)",
        onInput: "(value, event)"
      },
      returns: "HTMLLabelElement | HTMLLIElement (with ._input = HTMLInputElement)",
      description: "Reactive slider with label, icons, custom thumb, markers, and model/QItem support."
    };
  }
  // Esempio: JSswift.ui.Slider({ min: 0, max: 10, model: [get,set] })

  UI.Rating = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const boundValue = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(boundValue, "UI.Rating:model");
    const id = props.id || (`cms-rating-` + Math.random().toString(36).slice(2));
    const inputProps = JSswift.omit(props, [
      "model", "value", "max", "class", "style", "dense", "readonly", "disabled", "clearable",
      "half", "allowHalf", "noDimming", "label", "slots", "onChange", "onInput", "onHover",
      "icon", "checkedIcon", "uncheckedIcon", "halfIcon", "hoveredIcon", "iconSelected", "iconHalf",
      "iconHovered", "iconOn", "iconOff", "iconSize", "color", "colorSelected", "colorHalf",
      "colorHovered", "colorInactive", "activeColor", "halfColor", "hoverColor", "size", "gap",
      "tabindex", "tabIndex", "inputClass"
    ]);
    inputProps.type = "hidden";
    inputProps.id = id;
    if (props.name != null) inputProps.name = props.name;
    inputProps.class = uiClass(["cms-rating-input", "cms-choice-input", props.inputClass]);
    const input = _.input(inputProps);

    const wrapProps = JSswift.omit(props, [
      "model", "value", "max", "id", "name", "type", "class", "style", "dense", "readonly",
      "disabled", "clearable", "half", "allowHalf", "noDimming", "label", "slots", "onChange",
      "onInput", "onHover", "icon", "checkedIcon", "uncheckedIcon", "halfIcon", "hoveredIcon",
      "iconSelected", "iconHalf", "iconHovered", "iconOn", "iconOff", "iconSize", "color",
      "colorSelected", "colorHalf", "colorHovered", "colorInactive", "activeColor", "halfColor",
      "hoverColor", "size", "gap", "tabindex", "tabIndex", "inputClass"
    ]);
    wrapProps.class = uiClass([
      "cms-clear-set",
      "cms-singularity-check",
      "cms-choice-wrap",
      "cms-rating",
      "cms-rating-wrap",
      uiWhen(props.dense, "dense"),
      props.class
    ]);
    wrapProps.style = { ...(props.style || {}) };
    const sizeValue = uiUnwrap(props.size);
    if (sizeValue != null && !(typeof sizeValue === "string" && JSswift.uiSizes?.includes(sizeValue))) {
      wrapProps.style["--cms-rating-size"] = toCssSize(sizeValue);
    }
    const gapValue = uiUnwrap(props.gap);
    if (gapValue != null) {
      wrapProps.style["--cms-rating-gap"] = toCssSize(gapValue);
    }

    const control = _.span({
      class: "cms-rating-control",
      onMouseleave: (e) => {
        if (hoverValue == null) return;
        hoverValue = null;
        syncVisualState();
        props.onHover?.(getValue(), e);
      },
      onKeydown: (e) => {
        if (!isInteractive()) return;
        const step = hasHalf() ? 0.5 : 1;
        const current = getValue();
        let next = current;
        switch (e.key) {
          case "ArrowRight":
          case "ArrowUp":
            next = current + step;
            break;
          case "ArrowLeft":
          case "ArrowDown":
            next = current - step;
            break;
          case "Home":
            next = uiUnwrap(props.clearable) ? 0 : step;
            break;
          case "End":
            next = getMax();
            break;
          case "Delete":
          case "Backspace":
          case "0":
            if (!uiUnwrap(props.clearable)) return;
            next = 0;
            break;
          case " ":
          case "Enter":
            next = current || (uiUnwrap(props.clearable) ? step : Math.max(step, 1));
            break;
          default:
            return;
        }
        e.preventDefault();
        setRatingValue(next, e, { emit: true });
      }
    });
    const labelHost = _.span({ class: "cms-choice-label cms-rating-label" });
    const wrap = _.label(wrapProps, input, control, labelHost);
    setPropertyProps(wrap, props);

    const clearHost = (host) => {
      while (host.firstChild) host.removeChild(host.firstChild);
    };
    const renderInto = (host, nodes, display = "") => {
      clearHost(host);
      (nodes || []).forEach((n) => host.appendChild(n));
      host.style.display = host.childNodes.length ? display : "none";
    };
    const unwrapSlotValue = (value) => (uiIsSignal(value) || uiIsRod(value) ? uiUnwrap(value) : value);
    const asArray = (value, ctx = {}) => slotToArray(unwrapSlotValue(value), ctx);
    const asIconArray = (value, as, ctx = {}) => {
      const resolved = unwrapSlotValue(value);
      if (resolved == null) return [];
      if (typeof resolved === "string") return [UI.Icon({ name: resolved, color: props.color, size: props.iconSize ?? props.size ?? 16 })];
      return asArray(resolved, { ...ctx, as });
    };

    const getMax = () => {
      const value = Number(uiUnwrap(props.max) ?? 5);
      return Number.isFinite(value) && value > 0 ? Math.max(1, Math.round(value)) : 5;
    };
    const hasHalf = () => !!uiUnwrap(props.half ?? props.allowHalf);
    const normalizeValue = (value, max = getMax()) => {
      let next = Number(uiUnwrap(value));
      if (!Number.isFinite(next)) next = 0;
      next = Math.min(max, Math.max(0, next));
      const step = hasHalf() ? 0.5 : 1;
      return Math.round(next / step) * step;
    };
    const isDisabled = () => !!uiUnwrap(props.disabled);
    const isReadonly = () => !!uiUnwrap(props.readonly);
    const isInteractive = () => !isDisabled() && !isReadonly();
    const getValue = () => normalizeValue(model ? model.get() : localValue);
    const updateInputValue = (value) => {
      const stringValue = value > 0 ? String(value) : "";
      input.value = stringValue;
      input.setAttribute("value", stringValue);
      input.disabled = isDisabled();
    };

    let localValue = normalizeValue(model ? model.get() : uiUnwrap(props.value));
    let hoverValue = null;
    let renderedMax = 0;
    let items = [];

    const getPointerValue = (index, event) => {
      if (!hasHalf()) return normalizeValue(index);
      const rect = event.currentTarget.getBoundingClientRect();
      const half = (event.clientX - rect.left) <= (rect.width / 2);
      return normalizeValue(half ? index - 0.5 : index);
    };
    const getItemState = (displayValue, index) => {
      if (displayValue >= index) return "full";
      if (hasHalf() && displayValue >= (index - 0.5)) return "half";
      return "empty";
    };
    const getStateColor = (state, hovered) => {
      const selectedColor = uiUnwrap(props.colorSelected ?? props.activeColor ?? props.color ?? props.textColor) || "var(--cms-warning, #f0b429)";
      const halfColor = uiUnwrap(props.colorHalf ?? props.halfColor ?? props.colorSelected ?? props.activeColor ?? props.color ?? props.textColor) || selectedColor;
      const hoveredColor = uiUnwrap(props.colorHovered ?? props.hoverColor ?? props.colorSelected ?? props.activeColor ?? props.color ?? props.textColor) || selectedColor;
      const inactiveColor = uiUnwrap(props.colorInactive ?? props.colorOff ?? props.color) || "var(--cms-muted)";
      if (hovered) return hoveredColor;
      if (state === "full") return selectedColor;
      if (state === "half") return halfColor;
      return inactiveColor;
    };
    const resolveItemNodes = (ctx) => {
      const slotCandidates = [];
      if (ctx.hovered && ctx.state !== "empty") slotCandidates.push("hoveredIcon", "iconHovered");
      if (ctx.state === "full") slotCandidates.push("checkedIcon", "selectedIcon", "iconSelected", "iconOn");
      else if (ctx.state === "half") slotCandidates.push("halfIcon", "iconHalf");
      else slotCandidates.push("uncheckedIcon", "iconOff");
      slotCandidates.push("icon", "item", "star");
      for (const name of slotCandidates) {
        const nodes = renderSlotToArray(slots, name, ctx, null);
        if (nodes.length) return nodes;
      }

      let source = null;
      let as = "icon";
      if (ctx.hovered && ctx.state !== "empty") {
        source = props.hoveredIcon ?? props.iconHovered;
        as = "hoveredIcon";
      }
      if (source == null && ctx.state === "full") {
        source = props.checkedIcon ?? props.iconSelected ?? props.iconOn ?? props.icon ?? "star";
        as = "checkedIcon";
      } else if (source == null && ctx.state === "half") {
        source = props.halfIcon ?? props.iconHalf ?? props.checkedIcon ?? props.iconSelected ?? props.icon ?? "star_half";
        as = "halfIcon";
      } else if (source == null) {
        source = props.uncheckedIcon ?? props.iconOff ?? (uiUnwrap(props.noDimming) ? (props.icon ?? props.checkedIcon ?? props.iconSelected ?? "star") : "star_border");
        as = "uncheckedIcon";
      }
      return asIconArray(source, as, ctx);
    };
    const ensureItems = () => {
      const max = getMax();
      if (renderedMax === max) return;
      renderedMax = max;
      items = [];
      clearHost(control);
      for (let index = 1; index <= max; index++) {
        const iconHost = _.span({ class: "cms-rating-item-icon" });
        const item = _.span({
          class: "cms-rating-item",
          role: "radio",
          tabIndex: -1,
          onMousemove: (e) => {
            if (!isInteractive()) return;
            const nextHover = getPointerValue(index, e);
            if (hoverValue === nextHover) return;
            hoverValue = nextHover;
            syncVisualState();
            props.onHover?.(nextHover, e);
          },
          onClick: (e) => {
            if (!isInteractive()) return;
            let nextValue = getPointerValue(index, e);
            if (uiUnwrap(props.clearable) && nextValue === getValue()) nextValue = 0;
            setRatingValue(nextValue, e, { emit: true });
          }
        }, iconHost);
        items.push({ item, iconHost, index });
        control.appendChild(item);
      }
    };
    const syncVisualState = () => {
      ensureItems();
      const max = getMax();
      const value = getValue();
      const displayValue = hoverValue == null ? value : normalizeValue(hoverValue, max);
      const disabled = isDisabled();
      const readonly = isReadonly();
      const clearable = !!uiUnwrap(props.clearable);
      const noDimming = !!uiUnwrap(props.noDimming);

      wrap.classList.toggle("is-disabled", disabled);
      wrap.classList.toggle("is-readonly", readonly);
      wrap.classList.toggle("is-hovering", hoverValue != null);
      wrap.classList.toggle("is-clearable", clearable);
      wrap.classList.toggle("is-half", hasHalf());
      wrap.classList.toggle("no-dimming", noDimming);

      const tabindex = Number(uiUnwrap(props.tabindex ?? props.tabIndex) ?? 0);
      control.tabIndex = disabled ? -1 : tabindex;
      control.setAttribute("role", "slider");
      control.setAttribute("aria-valuemin", "0");
      control.setAttribute("aria-valuemax", String(max));
      control.setAttribute("aria-valuenow", String(value));
      control.setAttribute("aria-disabled", disabled ? "true" : "false");
      control.setAttribute("aria-readonly", readonly ? "true" : "false");

      updateInputValue(value);

      const labelNodes = renderSlotToArray(
        slots,
        "label",
        { value, max, disabled, readonly, clearable },
        props.label != null ? unwrapSlotValue(props.label) : children
      );
      renderInto(labelHost, labelNodes, "inline-flex");

      items.forEach(({ item, iconHost, index }) => {
        const state = getItemState(displayValue, index);
        const hovered = hoverValue != null && state !== "empty";
        const ctx = {
          index,
          max,
          value,
          displayValue,
          state,
          active: state !== "empty",
          checked: state === "full",
          half: state === "half",
          hovered,
          disabled,
          readonly,
          clearable,
          setValue: (next) => setRatingValue(next, null, { emit: false })
        };
        item.className = uiClassStatic([
          "cms-rating-item",
          `is-${state}`,
          uiWhen(hovered, "is-hovered")
        ]);
        item.style.color = getStateColor(state, hovered);
        item.style.opacity = state === "empty" && !noDimming ? "0.48" : "1";
        item.setAttribute("aria-checked", String(value === index));
        renderInto(iconHost, resolveItemNodes(ctx), "inline-flex");
      });
    };
    const setRatingValue = (value, event, options = {}) => {
      const normalized = normalizeValue(value);
      const current = getValue();
      localValue = normalized;
      hoverValue = null;
      if (model && options.fromModel !== true) model.set(normalized);
      updateInputValue(normalized);
      syncVisualState();
      if (options.emit !== false && normalized !== current) {
        props.onInput?.(normalized, event);
        props.onChange?.(normalized, event);
      }
      return normalized;
    };

    wrap._input = input;
    wrap._rating = control;
    wrap._getValue = getValue;
    wrap._setValue = (value) => setRatingValue(value, null, { emit: false });

    if (model) {
      model.watch((next) => {
        const normalized = normalizeValue(next);
        if (serializeValue(normalized) === serializeValue(localValue)) return;
        localValue = normalized;
        hoverValue = null;
        updateInputValue(localValue);
        syncVisualState();
      }, "UI.Rating:watch");
    }

    JSswift.reactive.effect(() => {
      if (!model && props.value != null) {
        localValue = normalizeValue(uiUnwrap(props.value));
      }
      syncVisualState();
    }, "UI.Rating:render");

    return wrap;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Rating = {
      signature: "UI.Rating(...children) | UI.Rating(props, ...children)",
      props: {
        max: "number",
        value: "number | rod | [get,set] signal",
        model: "rod | [get,set] signal",
        name: "string",
        label: "String|Node|Function|Array",
        clearable: "boolean",
        half: "boolean",
        allowHalf: "Alias of half",
        noDimming: "boolean",
        readonly: "boolean",
        disabled: "boolean",
        icon: "String|Node|Function|Array",
        iconSelected: "Alias of checkedIcon",
        checkedIcon: "String|Node|Function|Array",
        uncheckedIcon: "String|Node|Function|Array",
        iconHalf: "Alias of halfIcon",
        halfIcon: "String|Node|Function|Array",
        iconHovered: "Alias of hoveredIcon",
        hoveredIcon: "String|Node|Function|Array",
        color: "string",
        colorSelected: "string",
        colorHalf: "string",
        colorHovered: "string",
        colorInactive: "string",
        iconSize: "string|number",
        size: "string|number",
        gap: "string|number",
        slots: "{ label?, icon?, checkedIcon?, uncheckedIcon?, halfIcon?, hoveredIcon?, item?, star? }",
        class: "string",
        style: "object"
      },
      slots: {
        label: "Label content",
        icon: "Base icon content per item",
        checkedIcon: "Icon when item is selected",
        uncheckedIcon: "Icon when item is empty",
        halfIcon: "Icon when item is half-selected",
        hoveredIcon: "Icon while hovering selected items",
        item: "Custom item renderer",
        star: "Alias of item/icon"
      },
      events: {
        onChange: "(value, event)",
        onInput: "(value, event)",
        onHover: "(value, event)"
      },
      keyboard: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter", "Space", "Delete", "Backspace", "0"],
      returns: "HTMLLabelElement (with ._input, ._rating, ._getValue(), ._setValue(value))",
      description: "Reactive rating with label, custom icons, half rating, clearable behavior, and model support."
    };
  }
  // Esempio: JSswift.ui.Rating({ max: 5, model: [get,set] })

  const uiCloneTimeParts = (value) => {
    if (!value) return null;
    return {
      hour: Number(value.hour) || 0,
      minute: Number(value.minute) || 0,
      second: Number(value.second) || 0
    };
  };
  const uiTimePad = (value) => String(Math.max(0, Number(value) || 0)).padStart(2, "0");
  const uiNormalizeTimeParts = (raw, options = {}) => {
    if (raw == null || raw === "") return null;
    let hour = null;
    let minute = null;
    let second = 0;
    let meridiem = null;

    if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
      hour = raw.getHours();
      minute = raw.getMinutes();
      second = raw.getSeconds();
    } else if (typeof raw === "number" && Number.isFinite(raw)) {
      const total = Math.max(0, Math.floor(raw));
      hour = Math.floor(total / 3600) % 24;
      minute = Math.floor(total / 60) % 60;
      second = total % 60;
    } else if (typeof raw === "object") {
      if (raw.time != null || raw.value != null) return uiNormalizeTimeParts(raw.time ?? raw.value, options);
      hour = Number(raw.hour ?? raw.hours ?? raw.h ?? raw.hh);
      minute = Number(raw.minute ?? raw.minutes ?? raw.min ?? raw.mm ?? 0);
      second = Number(raw.second ?? raw.seconds ?? raw.sec ?? raw.ss ?? 0);
      meridiem = raw.meridiem ?? raw.ampm ?? raw.period ?? null;
    } else if (typeof raw === "string") {
      const value = raw.trim();
      if (!value) return null;
      const compact = value.match(/^(\d{1,2})(\d{2})(\d{2})?$/);
      const match = value.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*([ap]m)?/i);
      if (match) {
        hour = Number(match[1]);
        minute = Number(match[2]);
        second = match[3] != null ? Number(match[3]) : 0;
        meridiem = match[4] || null;
      } else if (compact) {
        hour = Number(compact[1]);
        minute = Number(compact[2]);
        second = compact[3] != null ? Number(compact[3]) : 0;
      } else {
        return null;
      }
    } else {
      return null;
    }

    if (!Number.isFinite(hour) || !Number.isFinite(minute) || !Number.isFinite(second)) return null;
    if (meridiem) {
      const lower = String(meridiem).toLowerCase();
      if (lower === "pm" && hour < 12) hour += 12;
      if (lower === "am" && hour === 12) hour = 0;
    }
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return null;

    const normalized = {
      hour: Math.floor(hour),
      minute: Math.floor(minute),
      second: Math.floor(second)
    };
    return uiConstrainTimeParts(normalized, options);
  };
  const uiExportTimeValue = (value, options = {}) => {
    const parts = value && typeof value === "object" && value.hour != null
      ? uiCloneTimeParts(value)
      : uiNormalizeTimeParts(value, options);
    if (!parts) return "";
    const withSeconds = options.withSeconds === true || Number(parts.second || 0) > 0;
    return `${uiTimePad(parts.hour)}:${uiTimePad(parts.minute)}${withSeconds ? `:${uiTimePad(parts.second)}` : ""}`;
  };
  const uiCompareTimeValue = (a, b) => {
    const av = uiExportTimeValue(a, { withSeconds: true });
    const bv = uiExportTimeValue(b, { withSeconds: true });
    if (!av && !bv) return 0;
    if (!av) return -1;
    if (!bv) return 1;
    return av < bv ? -1 : (av > bv ? 1 : 0);
  };
  function uiConstrainTimeParts(value, options = {}) {
    if (!value) return null;
    const out = uiCloneTimeParts(value);
    const min = options.min != null ? uiNormalizeTimeParts(options.min, { withSeconds: true }) : null;
    const max = options.max != null ? uiNormalizeTimeParts(options.max, { withSeconds: true }) : null;
    if (min && uiCompareTimeValue(out, min) < 0) return uiCloneTimeParts(min);
    if (max && uiCompareTimeValue(out, max) > 0) return uiCloneTimeParts(max);
    return out;
  }
  const uiExtractTimeFromValue = (raw, options = {}) => {
    if (raw == null || raw === "") return null;
    if (raw instanceof Date) return uiNormalizeTimeParts(raw, options);
    if (typeof raw === "object") return uiNormalizeTimeParts(raw.time != null ? raw.time : raw, options);
    if (typeof raw === "string" || typeof raw === "number") return uiNormalizeTimeParts(raw, options);
    return null;
  };
  const uiFormatTimeDisplay = (value, options = {}) => {
    const parts = uiNormalizeTimeParts(value, options);
    if (!parts) return "";
    const withSeconds = options.withSeconds === true || Number(parts.second || 0) > 0;
    const use12h = !!uiUnwrap(options.use12h ?? options.ampm);
    if (!use12h) {
      return `${uiTimePad(parts.hour)}:${uiTimePad(parts.minute)}${withSeconds ? `:${uiTimePad(parts.second)}` : ""}`;
    }
    const meridiem = parts.hour >= 12 ? "PM" : "AM";
    const hour = parts.hour % 12 || 12;
    return `${uiTimePad(hour)}:${uiTimePad(parts.minute)}${withSeconds ? `:${uiTimePad(parts.second)}` : ""} ${meridiem}`;
  };
  const uiMergeDateAndTime = (dateValue, timeValue, options = {}) => {
    if (!dateValue) return "";
    const time = uiExportTimeValue(timeValue, options);
    return time ? `${dateValue}T${time}` : dateValue;
  };
  const uiBuildTimeSteps = (step, max) => {
    const safeStep = Math.max(1, Math.min(max + 1, Math.round(Number(step) || 1)));
    const out = [];
    for (let value = 0; value <= max; value += safeStep) out.push(value);
    return out;
  };
  const uiCreateTimePickerSection = (config = {}) => {
    const {
      props = {},
      slots = {},
      value = null,
      withSeconds = false,
      minuteStep = 5,
      secondStep = 5,
      disabled = false,
      readonly = false,
      embedded = false,
      className = "",
      slotPrefix = "",
      shortcuts = null,
      onSelect = null
    } = config;
    const selectedValue = uiNormalizeTimeParts(value, { withSeconds, min: props.min, max: props.max });
    const baseParts = selectedValue
      || uiNormalizeTimeParts(new Date(), { withSeconds, min: props.min, max: props.max })
      || { hour: 0, minute: 0, second: 0 };
    const selectedParts = selectedValue ? uiCloneTimeParts(selectedValue) : null;
    const prefixed = (name) => slotPrefix ? `${slotPrefix}${name[0].toUpperCase()}${name.slice(1)}` : null;
    const renderNamedSlot = (name, ctx, fallback) => {
      const candidates = [prefixed(name), name].filter(Boolean);
      for (const candidate of candidates) {
        const slotValue = JSswift.ui.getSlot(slots, candidate);
        if (slotValue == null) continue;
        const rendered = JSswift.ui.renderSlot(slots, candidate, ctx, fallback);
        if (rendered != null) return rendered;
      }
      return JSswift.ui.slot(fallback, ctx);
    };
    const renderPointNodes = (ctx) => {
      let pointNode = renderNamedSlot("point", ctx, null);
      if (pointNode == null && config.pointIcon != null && ctx.selected) {
        pointNode = typeof config.pointIcon === "string"
          ? UI.Icon({ name: config.pointIcon, size: embedded ? 10 : 12 })
          : JSswift.ui.slot(config.pointIcon, ctx);
      }
      return renderSlotToArray(null, "default", ctx, pointNode);
    };
    const makeRequestedValue = (part, optionValue) => {
      const next = {
        hour: baseParts.hour,
        minute: baseParts.minute,
        second: withSeconds ? baseParts.second : 0
      };
      next[part] = optionValue;
      return next;
    };
    const section = _.div({
      class: uiClass([
        "cms-time-section",
        uiWhen(embedded, "is-embedded"),
        uiWhen(withSeconds, "has-seconds"),
        className
      ])
    });
    const shortcutList = uiUnwrap(shortcuts) || [];
    if (Array.isArray(shortcutList) && shortcutList.length) {
      const shortcutWrap = _.div({ class: "cms-time-shortcuts" });
      shortcutList.forEach((item, index) => {
        if (!item) return;
        const rawValue = typeof item.value === "function"
          ? item.value({ now: uiExportTimeValue(new Date(), { withSeconds }) })
          : item.value;
        const normalizedValue = uiNormalizeTimeParts(rawValue, { withSeconds, min: props.min, max: props.max });
        if (!normalizedValue) return;
        const ctx = {
          item,
          index,
          value: uiExportTimeValue(normalizedValue, { withSeconds }),
          displayValue: uiFormatTimeDisplay(normalizedValue, { withSeconds, use12h: props.use12h ?? props.ampm })
        };
        const labelNode = renderNamedSlot("shortcut", ctx, item.label ?? item.text ?? ctx.displayValue);
        shortcutWrap.appendChild(_.button({
          type: "button",
          class: uiClass(["cms-time-shortcut", uiWhen(!!selectedParts && uiCompareTimeValue(normalizedValue, selectedParts) === 0, "is-selected")]),
          disabled: disabled || readonly,
          onClick: () => onSelect?.(normalizedValue, { shortcut: item, index })
        }, ...renderSlotToArray(null, "default", ctx, labelNode)));
      });
      if (shortcutWrap.childNodes.length) section.appendChild(shortcutWrap);
    }
    const columns = _.div({ class: "cms-time-columns" });
    const createColumn = (title, part, values) => {
      const column = _.div({ class: "cms-time-column", "data-time-part": part });
      const optionsWrap = _.div({ class: "cms-time-options" });
      values.forEach((optionValue) => {
        const requested = makeRequestedValue(part, optionValue);
        const normalized = uiConstrainTimeParts(requested, { withSeconds, min: props.min, max: props.max });
        const optionDisabled = disabled || readonly || uiCompareTimeValue(normalized, requested) !== 0;
        const selected = !!selectedParts && selectedParts[part] === optionValue;
        const ctx = {
          part,
          selected,
          disabled: optionDisabled,
          value: optionValue,
          label: uiTimePad(optionValue),
          timeValue: uiExportTimeValue(normalized, { withSeconds }),
          displayValue: uiFormatTimeDisplay(normalized, { withSeconds, use12h: props.use12h ?? props.ampm })
        };
        const optionNode = renderNamedSlot("option", ctx, ctx.label);
        const pointNodes = selected ? renderPointNodes(ctx) : [];
        optionsWrap.appendChild(_.button({
          type: "button",
          class: uiClass(["cms-time-option", uiWhen(selected, "is-selected"), uiWhen(optionDisabled, "is-disabled")]),
          disabled: optionDisabled,
          onClick: () => onSelect?.(normalized, { part, optionValue })
        },
          _.span({ class: "cms-time-option-label" }, ...renderSlotToArray(null, "default", ctx, optionNode)),
          pointNodes.length ? _.span({ class: "cms-time-option-point" }, ...pointNodes) : null
        ));
      });
      column.appendChild(optionsWrap);
      return column;
    };
    columns.appendChild(createColumn(uiUnwrap(props.hoursLabel) || "Ore", "hour", uiBuildTimeSteps(1, 23)));
    columns.appendChild(createColumn(uiUnwrap(props.minutesLabel) || "Min", "minute", uiBuildTimeSteps(minuteStep, 59)));
    if (withSeconds) {
      columns.appendChild(createColumn(uiUnwrap(props.secondsLabel) || "Sec", "second", uiBuildTimeSteps(secondStep, 59)));
    }
    section.appendChild(columns);
    return section;
  };

  const uiCaptureTimeColumnScrollState = (root) => {
    if (!root) return null;
    const state = {};
    root.querySelectorAll(".cms-time-column").forEach((column, index) => {
      const key = column.getAttribute("data-time-part") || String(index);
      state[key] = column.scrollTop;
    });
    return state;
  };

  const uiCenterTimeColumnsToSelection = (root, options = {}) => {
    if (!root) return;
    const scrollState = options.scrollState || null;
    const behavior = options.behavior ?? "smooth";
    root.querySelectorAll(".cms-time-column").forEach((column, index) => {
      const key = column.getAttribute("data-time-part") || String(index);
      const previousTop = scrollState && Number.isFinite(scrollState[key]) ? scrollState[key] : null;
      if (previousTop != null) column.scrollTop = previousTop;
      const selectedOption = column.querySelector(".cms-time-option.is-selected");
      if (!selectedOption) return;
      const maxTop = Math.max(0, column.scrollHeight - column.clientHeight);
      const targetTop = selectedOption.offsetTop - ((column.clientHeight - selectedOption.offsetHeight) / 2);
      const nextTop = Math.max(0, Math.min(maxTop, targetTop));
      if (Math.abs(column.scrollTop - nextTop) < 1) {
        column.scrollTop = nextTop;
        return;
      }
      if (behavior && typeof column.scrollTo === "function") {
        column.scrollTo({ top: nextTop, behavior });
        return;
      }
      column.scrollTop = nextTop;
    });
  };

  const buildDateControl = (args, options = {}) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const isCalendar = options.calendar === true;
    const slots = props.slots || {};
    const sizeValue = uiComputed(props.size, () => {
      const value = String(uiUnwrap(props.size) || "").toLowerCase();
      return ["xs", "sm", "md", "lg", "xl"].includes(value) ? `cms-size-${value}` : "";
    });
    const requestedMode = String(
      uiUnwrap(
        props.mode
        ?? (uiUnwrap(props.rangeMultiple ?? props.multipleRange ?? props.multiRange) ? "range-multiple" : null)
        ?? ((props.range && props.multiple) ? "range-multiple" : (props.range ? "range" : (props.multiple ? "multiple" : "single")))
      )
    ).toLowerCase();
    const mode = ["range-multiple", "multiple-range", "rangemultiple", "multiplerange", "range_multiple", "multiple_range", "multi-range", "multi_range", "ranges"]
      .includes(requestedMode)
      ? "range-multiple"
      : (requestedMode === "range"
        ? "range"
        : (requestedMode === "multiple" ? "multiple" : "single"));
    const valueBinding = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(valueBinding, isCalendar ? "UI.Calendar:model" : "UI.Datepicker:model");
    const initialRawValue = model ? model.get() : uiUnwrap(props.value);
    const rangeAsArray = uiUnwrap(props.rangeAs ?? props.rangeModel) === "array" || Array.isArray(initialRawValue);
    const rangeMultipleAsArray = uiUnwrap(props.rangeMultipleAs ?? props.multipleRangeAs) === "array"
      || (Array.isArray(initialRawValue) && Array.isArray(initialRawValue[0]));
    const isTimeEnabled = () => mode === "single" && !!uiUnwrap(props.withTime ?? props.time ?? props.timePicker ?? props.enableTime);
    const getTimeOptions = () => {
      const detectedTime = uiExportTimeValue(
        uiExtractTimeFromValue(uiUnwrap(props.timeValue) ?? (model ? model.get() : uiUnwrap(props.value)) ?? initialRawValue, { withSeconds: true }),
        { withSeconds: true }
      );
      return {
        withSeconds: !!uiUnwrap(props.timeWithSeconds ?? props.withSeconds ?? props.showSeconds)
          || /:\d{2}:\d{2}$/.test(detectedTime)
          || /:\d{2}:\d{2}$/.test(uiUnwrap(props.timeFormat) || ""),
        min: uiUnwrap(props.timeMin ?? props.minTime),
        max: uiUnwrap(props.timeMax ?? props.maxTime),
        use12h: uiUnwrap(props.time12h ?? props.use12h ?? props.ampm)
      };
    };
    const getTimeMinuteStep = () => {
      const raw = Number(uiUnwrap(props.timeMinuteStep ?? props.minuteStep ?? 5));
      return Math.max(1, Math.min(30, Number.isFinite(raw) ? raw : 5));
    };
    const getTimeSecondStep = () => {
      const raw = Number(uiUnwrap(props.timeSecondStep ?? props.secondStep ?? 5));
      return Math.max(1, Math.min(30, Number.isFinite(raw) ? raw : 5));
    };

    const pad = (n) => String(n).padStart(2, "0");
    const createDate = (year, month, day) => {
      const date = new Date(year, month, day);
      if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
      return date;
    };
    const toIsoDate = (date) => {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };
    const fromIsoDate = (iso) => {
      if (typeof iso !== "string") return null;
      const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return null;
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      const date = new Date(year, month, day);
      if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
      return date;
    };
    const shiftDays = (iso, amount) => {
      const date = fromIsoDate(iso);
      if (!date) return null;
      date.setDate(date.getDate() + amount);
      return toIsoDate(date);
    };
    const shiftMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
    const monthStart = (value) => {
      if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), 1);
      const date = normalizeDateOnly(value);
      const parsed = fromIsoDate(date);
      return parsed ? new Date(parsed.getFullYear(), parsed.getMonth(), 1) : new Date();
    };
    const todayIso = () => toIsoDate(new Date());
    const isSameIso = (a, b) => !!a && !!b && a === b;
    const compareIso = (a, b) => {
      if (a == null && b == null) return 0;
      if (a == null) return -1;
      if (b == null) return 1;
      return a < b ? -1 : (a > b ? 1 : 0);
    };
    const diffDays = (a, b) => {
      const da = fromIsoDate(a);
      const db = fromIsoDate(b);
      if (!da || !db) return 0;
      return Math.round((db.getTime() - da.getTime()) / 86400000);
    };
    const ensureArray = (value) => Array.isArray(value) ? value.slice() : (value == null || value === "" ? [] : [value]);
    const cloneRangeValue = (value) => ({ from: value?.from || null, to: value?.to || null });
    const cloneRangeList = (value) => Array.isArray(value) ? value.map(cloneRangeValue) : [];
    const exportRangeValue = (value) => {
      const out = cloneRangeValue(value);
      return rangeAsArray ? [out.from, out.to] : out;
    };
    const exportRangeMultipleValue = (value) => cloneRangeList(value).map((item) => (
      rangeMultipleAsArray ? [item.from, item.to] : item
    ));
    const cloneValue = (value) => {
      if (mode === "multiple") return Array.isArray(value) ? value.slice() : [];
      if (mode === "range") return cloneRangeValue(value);
      if (mode === "range-multiple") return cloneRangeList(value);
      return value || null;
    };
    const exportValue = (value) => {
      if (mode === "multiple") return Array.isArray(value) ? value.slice() : [];
      if (mode === "range") return exportRangeValue(value);
      if (mode === "range-multiple") return exportRangeMultipleValue(value);
      return value || "";
    };
    const serializeValue = (value) => JSON.stringify(exportValue(value));
    const normalizeDateOnly = (raw) => {
      if (raw == null || raw === "") return null;
      if (raw instanceof Date) return toIsoDate(raw);
      if (typeof raw === "number") return toIsoDate(new Date(raw));
      if (typeof raw !== "string") {
        if (typeof raw === "object" && raw.date != null) return normalizeDateOnly(raw.date);
        return null;
      }
      const value = raw.trim();
      if (!value) return null;
      const isoLike = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/);
      if (isoLike) {
        const date = createDate(Number(isoLike[1]), Number(isoLike[2]) - 1, Number(isoLike[3]));
        return toIsoDate(date);
      }
      const euroLike = value.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
      if (euroLike) {
        const year = euroLike[3].length === 2 ? (2000 + Number(euroLike[3])) : Number(euroLike[3]);
        const date = createDate(year, Number(euroLike[2]) - 1, Number(euroLike[1]));
        return toIsoDate(date);
      }
      if (/^\d{1,4}$/.test(value)) return null;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      const explicitYear = value.match(/(?:^|[^\d])(\d{4})(?!\d)/);
      if (explicitYear && parsed.getFullYear() !== Number(explicitYear[1])) return null;
      return toIsoDate(parsed);
    };
    const normalizeRangeValue = (raw) => {
      if (raw == null || raw === "") return { from: null, to: null };
      let from = null;
      let to = null;
      if (Array.isArray(raw)) {
        from = normalizeDateOnly(raw[0]);
        to = normalizeDateOnly(raw[1]);
      } else if (typeof raw === "object") {
        from = normalizeDateOnly(raw.from ?? raw.start ?? raw.dateFrom ?? raw.departure);
        to = normalizeDateOnly(raw.to ?? raw.end ?? raw.dateTo ?? raw.return);
      } else {
        const found = String(raw).match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/g) || [];
        from = normalizeDateOnly(found[0]);
        to = normalizeDateOnly(found[1]);
      }
      if (from && to && from > to) [from, to] = [to, from];
      return { from, to };
    };
    const normalizeRangeMultipleValue = (raw) => {
      const out = [];
      const seen = new Set();
      const pushRange = (value) => {
        const normalized = normalizeRangeValue(value);
        if (!normalized.from) return;
        const key = `${normalized.from || ""}|${normalized.to || ""}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(normalized);
      };
      if (raw == null || raw === "") return out;
      if (Array.isArray(raw)) {
        const isFlatDateList = raw.every((item) => (
          item == null
          || typeof item === "string"
          || typeof item === "number"
          || item instanceof Date
        ));
        if (isFlatDateList) {
          const dates = raw.map(normalizeDateOnly).filter(Boolean);
          for (let index = 0; index < dates.length; index += 2) {
            pushRange({ from: dates[index], to: dates[index + 1] || null });
          }
        } else {
          raw.forEach((item) => pushRange(item));
        }
      } else if (typeof raw === "object" && Array.isArray(raw.ranges)) {
        raw.ranges.forEach((item) => pushRange(item));
      } else if (typeof raw === "object") {
        pushRange(raw);
      } else {
        const found = String(raw).match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/g) || [];
        const dates = found.map(normalizeDateOnly).filter(Boolean);
        for (let index = 0; index < dates.length; index += 2) {
          pushRange({ from: dates[index], to: dates[index + 1] || null });
        }
      }
      return out.sort((a, b) => compareIso(a.from, b.from) || compareIso(a.to, b.to));
    };
    const normalizeMultipleValue = (raw) => {
      const out = [];
      ensureArray(raw).forEach((item) => {
        const normalized = normalizeDateOnly(item);
        if (normalized && !out.includes(normalized)) out.push(normalized);
      });
      return out.sort();
    };
    const normalizeValue = (raw) => {
      if (mode === "range") return normalizeRangeValue(raw);
      if (mode === "range-multiple") return normalizeRangeMultipleValue(raw);
      if (mode === "multiple") return normalizeMultipleValue(raw);
      return normalizeDateOnly(raw);
    };
    const getMin = () => normalizeDateOnly(uiUnwrap(props.min ?? props.minDate));
    const getMax = () => normalizeDateOnly(uiUnwrap(props.max ?? props.maxDate));
    const getLocale = () => uiUnwrap(props.locale) || undefined;
    const getFirstDayOfWeek = () => {
      const raw = Number(uiUnwrap(props.firstDayOfWeek ?? props.weekStart ?? 1));
      return Number.isFinite(raw) ? ((raw % 7) + 7) % 7 : 1;
    };
    const getMonthsToShow = () => {
      const fallback = (mode === "range" || mode === "range-multiple") ? 2 : 1;
      const raw = Number(uiUnwrap(props.monthsToShow) ?? fallback);
      return Math.max(1, Math.min(4, Number.isFinite(raw) ? raw : fallback));
    };
    const getDefaultViewValue = () => {
      const min = getMin();
      const max = getMax();
      let fallback = normalizeDateOnly(uiUnwrap(props.defaultMonth)) || todayIso();
      if (min && fallback < min) fallback = min;
      if (max && fallback > max) fallback = max;
      return fallback || min || max || todayIso();
    };
    const getCurrentValue = () => uiUnwrap(props.confirm) ? workingValue : localValue;
    const getDateContext = (iso) => {
      const date = fromIsoDate(iso);
      if (!date) return { date: iso, value: iso };
      return {
        date: iso,
        value: iso,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        weekday: date.getDay(),
        today: isSameIso(iso, todayIso())
      };
    };
    const matchesDateSpec = (spec, iso) => {
      if (spec == null) return false;
      if (Array.isArray(spec)) return spec.some((item) => normalizeDateOnly(item) === iso);
      if (spec instanceof Set) return spec.has(iso);
      if (typeof spec === "function") return !!spec(iso, getDateContext(iso));
      if (typeof spec === "string" || spec instanceof Date || typeof spec === "number") {
        return normalizeDateOnly(spec) === iso;
      }
      return false;
    };
    const isDateAllowed = (iso) => {
      if (!iso) return false;
      const min = getMin();
      const max = getMax();
      if (min && iso < min) return false;
      if (max && iso > max) return false;
      const allowSpec = uiUnwrap(props.options ?? props.enableDates ?? props.allowedDates);
      if (allowSpec != null && !matchesDateSpec(allowSpec, iso)) return false;
      const disableSpec = uiUnwrap(props.disableDates ?? props.disabledDates ?? props.notAllowedDates);
      if (disableSpec != null && matchesDateSpec(disableSpec, iso)) return false;
      const weekday = fromIsoDate(iso)?.getDay();
      if (Array.isArray(uiUnwrap(props.allowedWeekdays ?? props.weekdays)) && weekday != null) {
        const allowedWeekdays = uiUnwrap(props.allowedWeekdays ?? props.weekdays).map((x) => Number(x));
        if (!allowedWeekdays.includes(weekday)) return false;
      }
      if (uiUnwrap(props.weekdaysOnly) && (weekday === 0 || weekday === 6)) return false;
      if (uiUnwrap(props.weekendsOnly) && weekday != null && weekday !== 0 && weekday !== 6) return false;
      const current = getCurrentValue();
      const pendingRange = mode === "range"
        ? (current?.from && !current?.to ? current : null)
        : (mode === "range-multiple"
          ? ((Array.isArray(current) && current.length && current[current.length - 1]?.from && !current[current.length - 1]?.to)
            ? current[current.length - 1]
            : null)
          : null);
      if (pendingRange?.from) {
        const nights = Math.abs(diffDays(pendingRange.from, iso));
        const minRange = Number(uiUnwrap(props.minRange ?? props.minDays ?? props.minNights));
        const maxRange = Number(uiUnwrap(props.maxRange ?? props.maxDays ?? props.maxNights));
        if (Number.isFinite(minRange) && nights < minRange) return false;
        if (Number.isFinite(maxRange) && nights > maxRange) return false;
      }
      return true;
    };
    const formatSingleDisplay = (iso) => {
      if (!iso) return "";
      const date = fromIsoDate(iso);
      if (!date) return iso;
      const displayMask = String(uiUnwrap(props.displayMask ?? props.mask ?? "") || "").toLowerCase();
      if (displayMask === "iso" || uiUnwrap(props.isoDisplay) === true) return iso;
      return new Intl.DateTimeFormat(getLocale(), {
        year: "numeric",
        month: "short",
        day: "2-digit"
      }).format(date);
    };
    const formatDisplayValue = (value, timeValue = localTimeValue) => {
      if (mode === "range-multiple") {
        if (!Array.isArray(value) || !value.length) return "";
        if (value.length > 2 && uiUnwrap(props.compactMultiple) !== false) {
          return `${value.length} ${uiUnwrap(props.multipleRangeLabel) || "intervalli selezionati"}`;
        }
        return value.map((range) => {
          const from = range?.from ? formatSingleDisplay(range.from) : "";
          const to = range?.to ? formatSingleDisplay(range.to) : "";
          return from && to ? `${from} -> ${to}` : (from || to || "");
        }).filter(Boolean).join("; ");
      }
      if (mode === "multiple") {
        if (!Array.isArray(value) || !value.length) return "";
        if (value.length > 3 && uiUnwrap(props.compactMultiple) !== false) {
          return `${value.length} ${uiUnwrap(props.multipleLabel) || "date selezionate"}`;
        }
        return value.map(formatSingleDisplay).join(", ");
      }
      if (mode === "range") {
        const from = value?.from ? formatSingleDisplay(value.from) : "";
        const to = value?.to ? formatSingleDisplay(value.to) : "";
        if (from && to) return `${from} -> ${to}`;
        return from || to || "";
      }
      const dateLabel = formatSingleDisplay(value);
      if (!isTimeEnabled()) return dateLabel;
      const timeLabel = formatTimeDisplayValue(timeValue);
      return [dateLabel, timeLabel].filter(Boolean).join(" • ");
    };
    const extractTypedDates = (raw) => {
      const found = String(raw || "").match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/g) || [];
      return found.map(normalizeDateOnly).filter(Boolean);
    };
    const parseTypedValue = (raw) => {
      if (raw == null || raw === "") {
        if (mode === "multiple" || mode === "range-multiple") return [];
        if (mode === "range") return { from: null, to: null };
        return null;
      }
      const dates = extractTypedDates(raw);
      if (mode === "range-multiple") {
        const ranges = [];
        for (let index = 0; index < dates.length; index += 2) {
          if (!dates[index]) continue;
          ranges.push({ from: dates[index], to: dates[index + 1] || null });
        }
        return ranges;
      }
      if (mode === "multiple") return dates;
      if (mode === "range") return { from: dates[0] || null, to: dates[1] || null };
      return dates[0] || normalizeDateOnly(raw);
    };
    const emptyValue = () => ((mode === "multiple" || mode === "range-multiple") ? [] : (mode === "range" ? { from: null, to: null } : null));
    const resolveDateTimeTimeValue = (raw, fallback = null) => {
      if (!isTimeEnabled()) return null;
      const options = getTimeOptions();
      const explicit = uiUnwrap(props.timeValue);
      const source = raw != null ? raw : explicit;
      const resolved = uiExtractTimeFromValue(source, options);
      return uiCloneTimeParts(resolved ?? fallback ?? null);
    };
    const getCurrentTimeValue = () => uiUnwrap(props.confirm) ? workingTimeValue : localTimeValue;
    const exportCurrentValue = (dateValue = localValue, timeValue = localTimeValue) => {
      if (mode === "single" && isTimeEnabled()) return uiMergeDateAndTime(dateValue || null, timeValue, getTimeOptions());
      return exportValue(dateValue);
    };
    const serializeCurrentValue = (dateValue = localValue, timeValue = localTimeValue) => JSON.stringify(exportCurrentValue(dateValue, timeValue));
    const formatTimeDisplayValue = (value) => uiFormatTimeDisplay(value, getTimeOptions());

    let localValue = normalizeValue(initialRawValue);
    let workingValue = cloneValue(localValue);
    let localTimeValue = resolveDateTimeTimeValue(initialRawValue, uiExtractTimeFromValue(uiUnwrap(props.timeValue), getTimeOptions()));
    let workingTimeValue = uiCloneTimeParts(localTimeValue);
    let hoverDate = null;
    let mouseSelectedDate = null;
    let viewMonth = monthStart(
      mode === "range"
        ? (localValue?.from || localValue?.to || getDefaultViewValue())
        : (mode === "range-multiple"
          ? (localValue?.[localValue.length - 1]?.from || localValue?.[localValue.length - 1]?.to || getDefaultViewValue())
          : (mode === "multiple"
            ? (localValue[0] || getDefaultViewValue())
            : (localValue || getDefaultViewValue())))
    );
    let entry = null;
    let panelRoot = null;

    const getVisibleMonthOffset = (value) => {
      const date = value instanceof Date ? value : fromIsoDate(normalizeDateOnly(value));
      if (!date) return -1;
      const year = date.getFullYear();
      const month = date.getMonth();
      for (let index = 0; index < getMonthsToShow(); index += 1) {
        const visibleMonth = shiftMonths(viewMonth, index);
        if (visibleMonth.getFullYear() === year && visibleMonth.getMonth() === month) return index;
      }
      return -1;
    };

    const fieldProps = {
      ...props,
      label: props.label ?? props.placeholder
    };
    const hasFloatingLabel = fieldProps.label != null || JSswift.ui.getSlot(slots, "label") != null;
    const defaultPlaceholder = mode === "range"
      ? "Seleziona andata e ritorno"
      : (mode === "range-multiple"
        ? "Seleziona intervalli"
        : (mode === "multiple" ? "Seleziona date" : "Seleziona data"));

    const displayInput = isCalendar ? null : _.input({
      class: uiClass(["cms-input", "cms-date-display", sizeValue, uiWhen(props.manualInput, "is-manual"), props.inputClass]),
      type: "text",
      autocomplete: "off",
      placeholder: hasFloatingLabel ? "" : (props.placeholder ?? defaultPlaceholder),
      readOnly: !uiUnwrap(props.manualInput),
      disabled: !!uiUnwrap(props.disabled),
      value: formatDisplayValue(localValue, localTimeValue)
    });
    const hiddenHost = _.div({ style: { display: "contents" } });
    const controlNode = isCalendar ? null : _.div({ class: "cms-date-control", style: { display: "contents" } }, displayInput, hiddenHost);

    const field = isCalendar ? null : UI.FormField({
      ...fieldProps,
      iconRight: props.iconRight ?? "calendar_month",
      control: controlNode,
      getValue: () => displayInput.value,
      onClear: () => {
        if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
        setDateValue(emptyValue(), null);
        if (entry) closePanel();
      },
      onFocus: () => displayInput.focus()
    });

    const syncViewMonth = (value, options = {}) => {
      const current = options.focusIso || (
        mode === "range"
          ? (value?.from || value?.to || getDefaultViewValue())
          : (mode === "range-multiple"
            ? (value?.[value.length - 1]?.from || value?.[value.length - 1]?.to || getDefaultViewValue())
            : (mode === "multiple"
              ? (value?.[0] || getDefaultViewValue())
              : (value || getDefaultViewValue())))
      );
      let nextViewMonth = monthStart(current);
      if (options.preserveMonthOffset) {
        const monthOffset = Number.isInteger(options.visibleMonthOffset)
          ? options.visibleMonthOffset
          : getVisibleMonthOffset(options.anchorIso || options.focusIso || current);
        if (monthOffset > 0) nextViewMonth = shiftMonths(nextViewMonth, -monthOffset);
      }
      viewMonth = nextViewMonth;
    };

    const syncHiddenInputs = () => {
      hiddenHost.replaceChildren();
      const baseName = uiUnwrap(props.name);
      if (!baseName) return;
      const appendHidden = (name, value) => {
        hiddenHost.appendChild(_.input({ type: "hidden", name, value: value ?? "" }));
      };
      const value = localValue;
      if (mode === "single") {
        appendHidden(baseName, exportCurrentValue(value, localTimeValue));
        return;
      }
      if (mode === "range") {
        appendHidden(uiUnwrap(props.nameFrom) || `${baseName}_from`, value?.from || "");
        appendHidden(uiUnwrap(props.nameTo) || `${baseName}_to`, value?.to || "");
        return;
      }
      if (mode === "range-multiple") {
        const rangeList = Array.isArray(value) ? value : [];
        const fromName = /\[\]$/.test(uiUnwrap(props.nameFrom) || "") ? uiUnwrap(props.nameFrom) : `${uiUnwrap(props.nameFrom) || `${baseName}_from`}[]`;
        const toName = /\[\]$/.test(uiUnwrap(props.nameTo) || "") ? uiUnwrap(props.nameTo) : `${uiUnwrap(props.nameTo) || `${baseName}_to`}[]`;
        rangeList.forEach((item) => {
          appendHidden(fromName, item?.from || "");
          appendHidden(toName, item?.to || "");
        });
        return;
      }
      const listName = /\[\]$/.test(baseName) ? baseName : `${baseName}[]`;
      (Array.isArray(value) ? value : []).forEach((item) => appendHidden(listName, item));
    };

    const syncDisplay = () => {
      if (isCalendar) return;
      displayInput.readOnly = !uiUnwrap(props.manualInput);
      displayInput.disabled = !!uiUnwrap(props.disabled);
      displayInput.setAttribute("aria-expanded", entry ? "true" : "false");
      displayInput.value = formatDisplayValue(localValue, localTimeValue);
      syncHiddenInputs();
      field?._refresh?.();
    };

    const setDateValue = (nextValue, event, options = {}) => {
      const normalized = normalizeValue(nextValue);
      const nextTime = isTimeEnabled()
        ? uiCloneTimeParts(
          uiExtractTimeFromValue(
            options.timeValue != null
              ? options.timeValue
              : (options.preserveTime ? getCurrentTimeValue() : nextValue),
            getTimeOptions()
          ) ?? (options.preserveTime ? getCurrentTimeValue() : null)
        )
        : null;
      const prev = serializeCurrentValue(localValue, localTimeValue);
      localValue = cloneValue(normalized);
      workingValue = cloneValue(normalized);
      if (isTimeEnabled()) {
        localTimeValue = uiCloneTimeParts(nextTime);
        workingTimeValue = uiCloneTimeParts(nextTime);
      }
      hoverDate = null;
      syncViewMonth(normalized, options);
      syncDisplay();
      renderPanel();
      if (model && options.fromModel !== true) model.set(exportCurrentValue(normalized, nextTime));
      const nextSerialized = serializeCurrentValue(normalized, nextTime);
      if (options.emit !== false && nextSerialized !== prev) {
        const emitted = exportCurrentValue(normalized, nextTime);
        props.onInput?.(emitted, event);
        props.onChange?.(emitted, event);
      }
      return normalized;
    };
    const setTimeValue = (nextValue, event, options = {}) => {
      if (!isTimeEnabled()) return null;
      const normalizedTime = uiCloneTimeParts(uiExtractTimeFromValue(nextValue, getTimeOptions()));
      if (uiUnwrap(props.confirm) && options.commit !== true) {
        workingTimeValue = normalizedTime;
        renderPanel();
        return normalizedTime;
      }
      const prev = serializeCurrentValue(localValue, localTimeValue);
      localTimeValue = uiCloneTimeParts(normalizedTime);
      workingTimeValue = uiCloneTimeParts(normalizedTime);
      syncDisplay();
      renderPanel();
      if (model && options.fromModel !== true) model.set(exportCurrentValue(localValue, normalizedTime));
      const nextSerialized = serializeCurrentValue(localValue, normalizedTime);
      if (options.emit !== false && nextSerialized !== prev) {
        const emitted = exportCurrentValue(localValue, normalizedTime);
        props.onInput?.(emitted, event);
        props.onChange?.(emitted, event);
      }
      return normalizedTime;
    };
    const setWorkingOrCommit = (nextValue, event, options = {}) => {
      if (uiUnwrap(props.confirm)) {
        workingValue = cloneValue(normalizeValue(nextValue));
        if (isTimeEnabled() && (options.timeValue != null || options.preserveTime)) {
          workingTimeValue = uiCloneTimeParts(uiExtractTimeFromValue(
            options.timeValue != null ? options.timeValue : getCurrentTimeValue(),
            getTimeOptions()
          ));
        }
        hoverDate = null;
        syncViewMonth(workingValue, options);
        renderPanel();
        return;
      }
      setDateValue(nextValue, event, options);
    };
    const selectionPreview = () => {
      const current = getCurrentValue();
      if (mode === "range") {
        if (!current?.from || current?.to || !hoverDate) return current;
        return compareIso(current.from, hoverDate) <= 0
          ? { from: current.from, to: hoverDate }
          : { from: hoverDate, to: current.from };
      }
      if (mode === "range-multiple") {
        const last = Array.isArray(current) && current.length ? current[current.length - 1] : null;
        if (!last?.from || last?.to || !hoverDate) return last;
        return compareIso(last.from, hoverDate) <= 0
          ? { from: last.from, to: hoverDate }
          : { from: hoverDate, to: last.from };
      }
      return current;
    };
    const renderedRanges = () => {
      if (mode === "range") {
        const preview = selectionPreview();
        return preview?.from ? [preview] : [];
      }
      if (mode === "range-multiple") {
        const current = Array.isArray(getCurrentValue()) ? getCurrentValue() : [];
        if (!current.length) return [];
        const preview = selectionPreview();
        if (!preview?.from) return current;
        return [...current.slice(0, -1), preview];
      }
      return [];
    };
    const isSelectedDate = (iso) => {
      const current = getCurrentValue();
      if (mode === "multiple") return current.includes(iso);
      if (mode === "range-multiple") {
        return Array.isArray(current) && current.some((range) => isSameIso(range?.from, iso) || isSameIso(range?.to, iso));
      }
      if (mode === "range") return isSameIso(current?.from, iso) || isSameIso(current?.to, iso);
      return isSameIso(current, iso);
    };
    const isInRange = (iso) => {
      if (mode !== "range" && mode !== "range-multiple") return false;
      return renderedRanges().some((range) => range?.from && range?.to && iso >= range.from && iso <= range.to);
    };
    const updateRangeHover = (iso, options = {}) => {
      const current = getCurrentValue();
      const pendingRange = mode === "range"
        ? current
        : (mode === "range-multiple"
          ? (Array.isArray(current) && current.length ? current[current.length - 1] : null)
          : null);
      if (!pendingRange?.from || pendingRange?.to || hoverDate === iso) return;
      hoverDate = iso;
      // Re-rendering on focus replaces the clicked day button before the click event fires.
      if (options.render !== false) renderPanel();
    };
    const shouldCloseOnSelect = () => {
      if (isCalendar) return false;
      if (uiUnwrap(props.confirm)) return false;
      if (props.closeOnSelect === false) return false;
      if (mode === "multiple" || mode === "range-multiple") return !!props.closeOnSelect;
      return true;
    };
    const selectDate = (iso, event, selectionOptions = {}) => {
      if (!isDateAllowed(iso) || uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
      const syncOptions = {
        focusIso: iso,
        anchorIso: iso,
        preserveTime: isTimeEnabled(),
        timeValue: getCurrentTimeValue(),
        preserveMonthOffset: !!entry && getMonthsToShow() > 1,
        visibleMonthOffset: Number.isInteger(selectionOptions.visibleMonthOffset) ? selectionOptions.visibleMonthOffset : null
      };
      if (mode === "multiple") {
        const list = normalizeMultipleValue(getCurrentValue());
        const next = list.includes(iso) ? list.filter((item) => item !== iso) : [...list, iso];
        setWorkingOrCommit(next.sort(), event, syncOptions);
        if (shouldCloseOnSelect()) closePanel();
        return;
      }
      if (mode === "range") {
        const current = cloneValue(getCurrentValue());
        let next;
        if (!current.from || (current.from && current.to)) {
          next = { from: iso, to: null };
        } else if (compareIso(iso, current.from) < 0) {
          next = { from: iso, to: current.from };
        } else {
          next = { from: current.from, to: iso };
        }
        setWorkingOrCommit(next, event, syncOptions);
        if (next.to && shouldCloseOnSelect()) closePanel();
        return;
      }
      if (mode === "range-multiple") {
        const list = normalizeRangeMultipleValue(getCurrentValue());
        const last = list.length ? list[list.length - 1] : null;
        let next;
        if (!last?.from || last?.to) {
          next = [...list, { from: iso, to: null }];
        } else if (compareIso(iso, last.from) < 0) {
          next = [...list.slice(0, -1), { from: iso, to: last.from }];
        } else {
          next = [...list.slice(0, -1), { from: last.from, to: iso }];
        }
        setWorkingOrCommit(next, event, syncOptions);
        if (next[next.length - 1]?.to && shouldCloseOnSelect()) closePanel();
        return;
      }
      setWorkingOrCommit(iso, event, syncOptions);
      if (shouldCloseOnSelect()) closePanel();
    };
    const clearValue = () => {
      mouseSelectedDate = null;
      setDateValue(emptyValue(), null, { timeValue: null });
    };
    const jumpToToday = () => {
      const today = todayIso();
      if (!isDateAllowed(today)) {
        syncViewMonth(today);
        renderPanel();
        return;
      }
      if (mode === "range") {
        const tomorrow = shiftDays(today, 1);
        const next = tomorrow && isDateAllowed(tomorrow) ? { from: today, to: tomorrow } : { from: today, to: null };
        setWorkingOrCommit(next, null);
        return;
      }
      if (mode === "range-multiple") {
        const tomorrow = shiftDays(today, 1);
        const next = tomorrow && isDateAllowed(tomorrow)
          ? [{ from: today, to: tomorrow }]
          : [{ from: today, to: null }];
        setWorkingOrCommit(next, null);
        return;
      }
      if (mode === "multiple") {
        setWorkingOrCommit([today], null);
        return;
      }
      setWorkingOrCommit(today, null, { preserveTime: isTimeEnabled(), timeValue: getCurrentTimeValue() });
    };
    const scrollTimeColumnsToSelection = (options = {}) => {
      uiCenterTimeColumnsToSelection(panelRoot, options);
    };
    const jumpToNow = () => {
      if (!isTimeEnabled()) return;
      const scrollState = uiCaptureTimeColumnScrollState(panelRoot);
      setTimeValue(new Date(), null, { commit: !uiUnwrap(props.confirm) });
      scrollTimeColumnsToSelection({ scrollState });
      if (!uiUnwrap(props.confirm) && props.closeOnSelect === true) closePanel();
    };
    const applyWorkingValue = () => {
      if (!uiUnwrap(props.confirm)) return;
      setDateValue(workingValue, null, { timeValue: workingTimeValue, preserveTime: true });
      if (props.closeOnSelect !== false) closePanel();
    };

    const renderPanel = () => {
      if (!panelRoot) return;
      const locale = getLocale();
      const monthLabelFormatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
      const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
      const titleDates = Array.from({ length: 7 }, (_, index) => {
        const day = (getFirstDayOfWeek() + index) % 7;
        return weekdayFormatter.format(new Date(2024, 0, 7 + day));
      });
      const pickerValue = getCurrentValue();

      const buildDayPoint = (ctx) => {
        let pointNode = JSswift.ui.renderSlot(slots, "point", ctx, null);
        if (pointNode == null) pointNode = JSswift.ui.renderSlot(slots, "dayPoint", ctx, null);
        if (pointNode == null && props.pointIcon != null && (ctx.selected || ctx.inRange || ctx.today)) {
          pointNode = typeof props.pointIcon === "string"
            ? UI.Icon({ name: props.pointIcon, size: 10 })
            : JSswift.ui.slot(props.pointIcon, ctx);
        }
        return renderSlotToArray(null, "default", ctx, pointNode);
      };

      const renderMonth = (baseDate, monthOffset) => {
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const start = new Date(year, month, 1);
        const offset = (start.getDay() - getFirstDayOfWeek() + 7) % 7;
        const gridStart = new Date(year, month, 1 - offset);
        const monthBox = _.div({ class: "cms-date-month" });
        monthBox.appendChild(_.div({ class: "cms-date-month-title" }, monthLabelFormatter.format(start)));

        const weekdays = _.div({ class: "cms-date-weekdays" });
        titleDates.forEach((label) => weekdays.appendChild(_.div({ class: "cms-date-weekday" }, label)));
        monthBox.appendChild(weekdays);

        const grid = _.div({ class: "cms-date-grid" });
        for (let index = 0; index < 42; index += 1) {
          const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
          const iso = toIsoDate(date);
          const inMonth = date.getMonth() === month;
          const selected = isSelectedDate(iso);
          const inRange = isInRange(iso);
          const rangeStart = (mode === "range" || mode === "range-multiple") && renderedRanges().some((range) => isSameIso(range?.from, iso));
          const rangeEnd = (mode === "range" || mode === "range-multiple") && renderedRanges().some((range) => isSameIso(range?.to, iso));
          const disabled = !isDateAllowed(iso);
          const ctx = {
            ...getDateContext(iso),
            selected,
            inRange,
            rangeStart,
            rangeEnd,
            disabled,
            outside: !inMonth,
            value: pickerValue,
            select: () => selectDate(iso, null, { visibleMonthOffset: monthOffset })
          };
          const pointNodes = buildDayPoint(ctx);
          const labelNode = JSswift.ui.renderSlot(slots, "day", ctx, String(date.getDate()));
          const labelNodes = renderSlotToArray(null, "default", ctx, labelNode);
          const dayBtn = _.button({
            type: "button",
            class: uiClass([
              "cms-date-day",
              uiWhen(!inMonth, "is-outside"),
              uiWhen(selected, "is-selected"),
              uiWhen(inRange, "is-in-range"),
              uiWhen(rangeStart, "is-range-start"),
              uiWhen(rangeEnd, "is-range-end"),
              uiWhen(disabled, "is-disabled"),
              uiWhen(isSameIso(iso, todayIso()), "is-today"),
              uiWhen(pointNodes.length, "has-point")
            ]),
            disabled,
            onMouseDown: (event) => {
              if (event.button !== 0) return;
              mouseSelectedDate = iso;
              event.preventDefault();
              selectDate(iso, event, { visibleMonthOffset: monthOffset });
            },
            onClick: (event) => {
              if (mouseSelectedDate != null && event.detail !== 0) {
                mouseSelectedDate = null;
                return;
              }
              mouseSelectedDate = null;
              selectDate(iso, event, { visibleMonthOffset: monthOffset });
            },
            onMouseEnter: () => updateRangeHover(iso),
            onFocus: () => updateRangeHover(iso, { render: false })
          },
            _.span({ class: "cms-date-day-label" }, ...labelNodes),
            pointNodes.length ? _.span({ class: "cms-date-day-point" }, ...pointNodes) : null
          );
          grid.appendChild(dayBtn);
        }
        monthBox.appendChild(grid);
        return monthBox;
      };

      const min = getMin();
      const max = getMax();
      const candidateYears = [
        viewMonth.getFullYear(),
        fromIsoDate(todayIso())?.getFullYear(),
        fromIsoDate(min)?.getFullYear(),
        fromIsoDate(max)?.getFullYear(),
        fromIsoDate(uiUnwrap(props.defaultMonth))?.getFullYear()
      ];
      if (mode === "range") {
        candidateYears.push(fromIsoDate(pickerValue?.from)?.getFullYear(), fromIsoDate(pickerValue?.to)?.getFullYear());
      } else if (mode === "range-multiple") {
        pickerValue.forEach((item) => {
          candidateYears.push(fromIsoDate(item?.from)?.getFullYear(), fromIsoDate(item?.to)?.getFullYear());
        });
      } else if (mode === "multiple") {
        pickerValue.forEach((item) => candidateYears.push(fromIsoDate(item)?.getFullYear()));
      } else {
        candidateYears.push(fromIsoDate(pickerValue)?.getFullYear());
      }
      const validYears = candidateYears.filter((year) => Number.isFinite(year));
      const inferredYearStart = (validYears.length ? Math.min(...validYears) : viewMonth.getFullYear()) - 100;
      const inferredYearEnd = (validYears.length ? Math.max(...validYears) : viewMonth.getFullYear()) + 50;
      const yearStart = Number(uiUnwrap(props.yearStart ?? (min ? fromIsoDate(min)?.getFullYear() : null) ?? inferredYearStart));
      const yearEnd = Number(uiUnwrap(props.yearEnd ?? (max ? fromIsoDate(max)?.getFullYear() : null) ?? inferredYearEnd));
      const monthSelect = _.select({
        class: "cms-date-select",
        value: String(viewMonth.getMonth()),
        onChange: (event) => {
          viewMonth = new Date(viewMonth.getFullYear(), Number(event.currentTarget.value), 1);
          props.onNavigate?.({ month: viewMonth.getMonth() + 1, year: viewMonth.getFullYear() });
          renderPanel();
        }
      },
        ...Array.from({ length: 12 }, (_, index) => uiOptionNode({ value: String(index) }, new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2024, index, 1))))
      );
      const yearSelect = _.select({
        class: "cms-date-select cms-date-select-year",
        value: String(viewMonth.getFullYear()),
        onChange: (event) => {
          viewMonth = new Date(Number(event.currentTarget.value), viewMonth.getMonth(), 1);
          props.onNavigate?.({ month: viewMonth.getMonth() + 1, year: viewMonth.getFullYear() });
          renderPanel();
        }
      },
        ...Array.from({ length: Math.max(1, yearEnd - yearStart + 1) }, (_, index) => {
          const year = yearStart + index;
          return uiOptionNode({ value: String(year) }, String(year));
        })
      );

      const header = _.div({ class: "cms-date-header" },
        _.button({
          type: "button",
          class: "cms-date-nav",
          onClick: () => {
            viewMonth = shiftMonths(viewMonth, -1);
            props.onNavigate?.({ month: viewMonth.getMonth() + 1, year: viewMonth.getFullYear() });
            renderPanel();
          }
        }, UI.Icon({ name: "chevron_left", size: 16 })),
        _.div({ class: "cms-date-header-center" }, monthSelect, yearSelect),
        _.button({
          type: "button",
          class: "cms-date-nav",
          onClick: () => {
            viewMonth = shiftMonths(viewMonth, 1);
            props.onNavigate?.({ month: viewMonth.getMonth() + 1, year: viewMonth.getFullYear() });
            renderPanel();
          }
        }, UI.Icon({ name: "chevron_right", size: 16 }))
      );

      const shortcuts = _.div({ class: "cms-date-shortcuts" });
      const shortcutList = uiUnwrap(props.shortcuts ?? props.presets) || [];
      shortcutList.forEach((item, index) => {
        if (!item) return;
        const rawValue = typeof item.value === "function" ? item.value({ today: todayIso() }) : item.value;
        const label = item.label ?? item.text ?? `Preset ${index + 1}`;
        shortcuts.appendChild(_.button({
          type: "button",
          class: "cms-date-shortcut",
          onClick: () => setWorkingOrCommit(rawValue, null, { preserveTime: isTimeEnabled(), timeValue: getCurrentTimeValue() })
        }, label));
      });

      const months = _.div({ class: "cms-date-months" });
      for (let index = 0; index < getMonthsToShow(); index += 1) {
        months.appendChild(renderMonth(shiftMonths(viewMonth, index), index));
      }
      const footerDisplayValue = formatDisplayValue(pickerValue, getCurrentTimeValue());
      const footerValue = _.div({ class: "cms-date-value" },
        ...renderSlotToArray(
          slots,
          "value",
          { value: pickerValue, displayValue: footerDisplayValue, mode, timeValue: getCurrentTimeValue() },
          footerDisplayValue || renderSlotToArray(slots, "default", {}, children)
        )
      );
      const headerTime = _.div({ class: "cms-time-header" });
      const columnsTime = _.div({ class: "cms-time-columns-2" },
        _.div({ class: "cms-time-column-title" }, uiUnwrap(props.hoursLabel) || "Ore"),
        _.div({ class: "cms-time-column-title" }, uiUnwrap(props.minutesLabel) || "Min")
      );
      headerTime.appendChild(columnsTime);
      const bodyTime = isTimeEnabled()
        ? uiCreateTimePickerSection({
          props: {
            min: uiUnwrap(props.timeMin ?? props.minTime),
            max: uiUnwrap(props.timeMax ?? props.maxTime),
            use12h: uiUnwrap(props.time12h ?? props.use12h ?? props.ampm),
            hoursLabel: uiUnwrap(props.timeHoursLabel) || "Ore",
            minutesLabel: uiUnwrap(props.timeMinutesLabel) || "Min",
            secondsLabel: uiUnwrap(props.timeSecondsLabel) || "Sec"
          },
          slots,
          slotPrefix: "time",
          value: getCurrentTimeValue(),
          withSeconds: false,
          minuteStep: 1,
          secondStep: getTimeSecondStep(),
          disabled: !!uiUnwrap(props.disabled),
          readonly: !!uiUnwrap(props.readonly),
          embedded: true,
          pointIcon: uiUnwrap(props.timePointIcon),
          shortcuts: uiUnwrap(props.timeShortcuts ?? props.timePresets),
          onSelect: (nextTime) => {
            const scrollState = uiCaptureTimeColumnScrollState(panelRoot);
            setTimeValue(nextTime, null);
            scrollTimeColumnsToSelection({ scrollState });
          }
        })
        : null;
      const footerInfo = _.div({ class: "cms-date-footer-info" },
        footerValue
      );

      const footer = _.div({ class: uiClass(["cms-date-footer", uiWhen(isTimeEnabled(), "has-time")]) },
        footerInfo,
        _.div({ class: "cms-date-actions" },
          _.button({ type: "button", class: "cms-date-action", onClick: jumpToToday }, uiUnwrap(props.todayLabel) || "Oggi"),
          uiUnwrap(props.clearable) !== false
            ? _.button({ type: "button", class: "cms-date-action", onClick: clearValue }, uiUnwrap(props.clearLabel) || "Reset")
            : null,
          uiUnwrap(props.confirm)
            ? _.button({ type: "button", class: "cms-date-action is-primary", onClick: applyWorkingValue }, uiUnwrap(props.applyLabel) || "Applica")
            : null
        )
      );

      const footerTimer = _.div(_.button({ type: "button", class: "cms-date-action cms-w-lg", onClick: jumpToNow }, uiUnwrap(props.nowLabel) || "Ora"));

      const contentTimer = isTimeEnabled() ? _.div({ class: "cms-date-time" }, headerTime, bodyTime, footerTimer) : null;

      panelRoot.replaceChildren(
        _.div({
          class: "cms-date-panel-root",
          onKeydown: (event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              if (isCalendar) props.onEscape?.(event);
              else closePanel();
            }
          }
        },
          header,
          shortcutList.length ? shortcuts : null,
          _.div({ class: 'cms-data-time' }, months, contentTimer),
          footer
        )
      );
    };

    function openPanel() {
      if (entry || uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return entry;
      workingValue = cloneValue(localValue);
      workingTimeValue = uiCloneTimeParts(localTimeValue);
      hoverDate = null;
      mouseSelectedDate = null;
      syncViewMonth(workingValue);
      entry = JSswift.overlay.open(({ close }) => {
        const fallback = (mode === "range" || mode === "range-multiple") ? 2 : 1;
        const raw = Number(uiUnwrap(props.monthsToShow) ?? fallback);
        panelRoot = _.div({ class: uiClassStatic(["cms-date-panel", uiUnwrap(sizeValue), uiWhen(raw > 1, "multi-month"), props.panelClass]) });
        renderPanel();
        return panelRoot;
      }, {
        type: "date",
        anchorEl: field._control || displayInput,
        placement: props.placement || "bottom-start",
        offsetX: props.offsetX ?? 0,
        offsetY: props.offsetY ?? props.offset ?? 8,
        backdrop: false,
        lockScroll: false,
        trapFocus: false,
        closeOnOutside: props.closeOnOutside !== false,
        closeOnBackdrop: false,
        closeOnEsc: true,
        autoFocus: false,
        className: uiClassStatic(["cms-date-overlay", props.panelClass, uiWhen(isTimeEnabled(), "has-time")]),
        onClose: () => {
          entry = null;
          panelRoot = null;
          hoverDate = null;
          syncDisplay();
          props.onClose?.();
        }
      });
      if (props.panelStyle) Object.assign(entry.panel.style, props.panelStyle);
      overlayEnter(entry);
      syncDisplay();
      props.onOpen?.();
      return entry;
    }

    function closePanel() {
      if (!entry) return;
      mouseSelectedDate = null;
      const toClose = entry;
      overlayLeave(toClose, () => JSswift.overlay.close(toClose.id));
    }

    if (isCalendar) {
      const fallback = (mode === "range" || mode === "range-multiple") ? 2 : 1;
      const raw = Number(uiUnwrap(props.monthsToShow) ?? fallback);
      panelRoot = _.div({
        class: uiClassStatic([
          "cms-date-panel",
          "cms-date-calendar",
          uiUnwrap(sizeValue),
          uiWhen(raw > 1, "multi-month"),
          props.panelClass,
          props.class
        ]),
        style: props.style
      });
    }

    if (!isCalendar) displayInput.addEventListener("focus", (event) => {
      props.onFocus?.(event);
      if (props.openOnFocus !== false) openPanel();
    });
    if (!isCalendar) displayInput.addEventListener("click", (event) => {
      props.onClick?.(event);
      openPanel();
    });
    if (!isCalendar) displayInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (entry) {
          event.preventDefault();
          closePanel();
        }
        return;
      }
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPanel();
      }
      if ((event.key === "Backspace" || event.key === "Delete") && !uiUnwrap(props.manualInput) && uiUnwrap(props.clearable) !== false) {
        event.preventDefault();
        clearValue();
      }
    });
    if (!isCalendar && uiUnwrap(props.manualInput)) {
      displayInput.addEventListener("input", (event) => {
        props.onTyping?.(displayInput.value, event);
      });
      displayInput.addEventListener("change", (event) => {
        const parsed = parseTypedValue(displayInput.value);
        setDateValue(parsed, event, { timeValue: uiExtractTimeFromValue(displayInput.value, getTimeOptions()), preserveTime: !uiExtractTimeFromValue(displayInput.value, getTimeOptions()) });
      });
      displayInput.addEventListener("blur", (event) => {
        props.onBlur?.(event);
        const parsed = parseTypedValue(displayInput.value);
        if (displayInput.value === "") clearValue();
        else setDateValue(parsed, event, { timeValue: uiExtractTimeFromValue(displayInput.value, getTimeOptions()), preserveTime: !uiExtractTimeFromValue(displayInput.value, getTimeOptions()) });
      });
    } else if (!isCalendar) {
      displayInput.addEventListener("blur", (event) => props.onBlur?.(event));
    }

    if (model) {
      model.watch((next) => {
        const normalized = normalizeValue(next);
        const nextTime = resolveDateTimeTimeValue(next);
        if (serializeCurrentValue(normalized, nextTime) === serializeCurrentValue(localValue, localTimeValue)) return;
        localValue = normalized;
        workingValue = cloneValue(localValue);
        localTimeValue = uiCloneTimeParts(nextTime);
        workingTimeValue = uiCloneTimeParts(nextTime);
        hoverDate = null;
        syncViewMonth(localValue);
        syncDisplay();
        renderPanel();
      }, isCalendar ? "UI.Calendar:watch" : "UI.Datepicker:watch");
    }

    JSswift.reactive.effect(() => {
      if (!model && props.value != null) {
        localValue = normalizeValue(uiUnwrap(props.value));
        workingValue = cloneValue(localValue);
        localTimeValue = resolveDateTimeTimeValue(uiUnwrap(props.value));
        workingTimeValue = uiCloneTimeParts(localTimeValue);
      } else if (isTimeEnabled() && props.timeValue != null) {
        localTimeValue = resolveDateTimeTimeValue(uiUnwrap(props.timeValue));
        workingTimeValue = uiCloneTimeParts(localTimeValue);
      }
      syncDisplay();
      renderPanel();
      if (entry && uiUnwrap(props.disabled)) closePanel();
    }, isCalendar ? "UI.Calendar:render" : "UI.Datepicker:render");

    if (isCalendar) {
      panelRoot._calendar = panelRoot;
      panelRoot._date = panelRoot;
      panelRoot._getValue = () => exportCurrentValue(localValue, localTimeValue);
      panelRoot._setValue = (value) => setDateValue(value, null, { emit: false, timeValue: resolveDateTimeTimeValue(value) });
      panelRoot._clear = clearValue;
      panelRoot._select = (value) => {
        const iso = normalizeDateOnly(value);
        if (iso) selectDate(iso, null);
      };
      panelRoot._time = () => uiCloneTimeParts(localTimeValue);
      return panelRoot;
    }

    field._input = displayInput;
    field._date = displayInput;
    field._open = openPanel;
    field._close = closePanel;
    field._getValue = () => exportCurrentValue(localValue, localTimeValue);
    field._setValue = (value) => setDateValue(value, null, { emit: false, timeValue: resolveDateTimeTimeValue(value) });
    field._time = () => uiCloneTimeParts(localTimeValue);
    field._panel = () => entry?.panel || null;

    return field;
  };
  UI.Datepicker = (...args) => buildDateControl(args);
  UI.Calendar = (...args) => buildDateControl(args, { calendar: true });
  UI.Date = UI.Datepicker;
  JSswift.ui.Datepicker = UI.Datepicker;
  JSswift.ui.Calendar = UI.Calendar;
  JSswift.ui.Date = UI.Date;
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Datepicker = {
      signature: "UI.Datepicker(props)",
      props: {
        value: "string | { from, to } | string[] | Array<{ from, to }> | Array<[from, to]>",
        model: "rod | [get,set] signal",
        mode: "\"single\"|\"range\"|\"multiple\"|\"range-multiple\"",
        range: "boolean",
        multiple: "boolean",
        rangeMultiple: "boolean",
        multipleRange: "Alias of rangeMultiple",
        min: "string",
        max: "string",
        minDate: "Alias of min",
        maxDate: "Alias of max",
        minRange: "number",
        maxRange: "number",
        manualInput: "boolean",
        firstDayOfWeek: "number",
        monthsToShow: "number",
        locale: "string",
        shortcuts: "Array<{ label, value }>",
        options: "Array|string|Function",
        enableDates: "Alias of options",
        disableDates: "Array|string|Function",
        label: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        pointIcon: "String|Node|Function|Array",
        withTime: "boolean",
        timeValue: "string|Date",
        timeMin: "string",
        timeMax: "string",
        timeMinuteStep: "number",
        timeSecondStep: "number",
        timeWithSeconds: "boolean",
        timeShortcuts: "Array<{ label, value }>",
        timePointIcon: "String|Node|Function|Array",
        clearable: "boolean",
        confirm: "boolean",
        name: "string",
        nameFrom: "string",
        nameTo: "string",
        size: "\"xs\"|\"sm\"|\"md\"|\"lg\"|\"xl\"",
        class: "string",
        style: "object"
      },
      slots: {
        day: "Day content ({ date, selected, inRange, disabled, outside })",
        point: "Point/icon in the day",
        dayPoint: "Alias of point",
        value: "Footer value renderer ({ value, displayValue, mode })",
        timeOption: "Renderer for a time option in the integrated footer",
        timePoint: "Point/icon in the footer time option",
        timeShortcut: "Integrated time shortcut renderer",
        label: "Floating label",
        topLabel: "Top label",
        icon: "Left icon",
        iconRight: "Right icon",
        default: "Fallback value content"
      },
      events: {
        onChange: "(value, event)",
        onInput: "(value, event)",
        onOpen: "void",
        onClose: "void",
        onNavigate: "({ month, year })"
      },
      returns: "HTMLDivElement (field wrapper) con ._input, ._open(), ._close(), ._getValue(), ._setValue(value)",
      description: "Reactive datepicker input with fixed overlay, single/range/multiple/multi-range modes, model, min/max, presets, xs-xl sizes, and optional time support in a unified interface."
    };
    UI.meta.Calendar = {
      ...UI.meta.Datepicker,
      signature: "UI.Calendar(props)",
      returns: "HTMLDivElement calendar panel con ._getValue(), ._setValue(value), ._clear(), ._select(value)",
      description: "Standalone interactive calendar panel using the same engine and styling as UI.Datepicker, with direct model persistence."
    };
    UI.meta.Date = UI.meta.Datepicker;
  }
  // Esempio: JSswift.ui.Datepicker({ value: "2024-01-01" })

  UI.Time = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeValue = uiComputed(props.size, () => {
      const value = String(uiUnwrap(props.size) || "").toLowerCase();
      return ["xs", "sm", "md", "lg", "xl"].includes(value) ? `cms-size-${value}` : "";
    });
    const getTimeOptions = () => {
      const detectedTime = uiExportTimeValue(
        uiExtractTimeFromValue(model ? model.get() : uiUnwrap(props.value) ?? initialRawValue, { withSeconds: true }),
        { withSeconds: true }
      );
      return {
        withSeconds: !!uiUnwrap(props.withSeconds ?? props.showSeconds) || /:\d{2}:\d{2}$/.test(detectedTime),
        min: uiUnwrap(props.min ?? props.minTime),
        max: uiUnwrap(props.max ?? props.maxTime),
        use12h: uiUnwrap(props.use12h ?? props.ampm)
      };
    };
    const getMinuteStep = () => {
      const raw = Number(uiUnwrap(props.minuteStep ?? 1));
      return Math.max(1, Math.min(30, Number.isFinite(raw) ? raw : 5));
    };
    const getSecondStep = () => {
      const raw = Number(uiUnwrap(props.secondStep ?? 1));
      return Math.max(1, Math.min(30, Number.isFinite(raw) ? raw : 5));
    };
    const valueBinding = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(valueBinding, "UI.Time:model");
    const initialRawValue = model ? model.get() : uiUnwrap(props.value);
    const parseTypedValue = (raw) => uiExtractTimeFromValue(raw, getTimeOptions());
    const formatDisplayValue = (value) => uiFormatTimeDisplay(value, getTimeOptions());
    const exportValue = (value) => uiExportTimeValue(value, getTimeOptions());
    const serializeValue = (value) => JSON.stringify(exportValue(value));

    let localValue = uiCloneTimeParts(parseTypedValue(initialRawValue));
    let workingValue = uiCloneTimeParts(localValue);
    let entry = null;
    let panelRoot = null;

    const fieldProps = {
      ...props,
      label: props.label ?? props.placeholder
    };
    const hasFloatingLabel = fieldProps.label != null || JSswift.ui.getSlot(slots, "label") != null;

    const displayInput = _.input({
      class: uiClass(["cms-input", "cms-time-display", sizeValue, uiWhen(props.manualInput, "is-manual"), props.inputClass]),
      type: "text",
      autocomplete: "off",
      placeholder: hasFloatingLabel ? "" : (props.placeholder ?? "Seleziona orario"),
      readOnly: !uiUnwrap(props.manualInput),
      disabled: !!uiUnwrap(props.disabled),
      value: formatDisplayValue(localValue)
    });
    displayInput.setAttribute("aria-haspopup", "dialog");
    const hiddenHost = _.div({ style: { display: "contents" } });
    const controlNode = _.div({ class: "cms-time-control", style: { display: "contents" } }, displayInput, hiddenHost);

    const field = UI.FormField({
      ...fieldProps,
      iconRight: props.iconRight ?? "schedule",
      control: controlNode,
      getValue: () => displayInput.value,
      onClear: () => {
        if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
        setTimeState(null, null, { commit: true });
        if (entry) closePanel();
      },
      onFocus: () => displayInput.focus()
    });

    const getCurrentValue = () => uiUnwrap(props.confirm) ? workingValue : localValue;
    const syncHiddenInputs = () => {
      hiddenHost.replaceChildren();
      const baseName = uiUnwrap(props.name);
      if (!baseName) return;
      hiddenHost.appendChild(_.input({ type: "hidden", name: baseName, value: exportValue(localValue) }));
    };
    const syncDisplay = () => {
      displayInput.readOnly = !uiUnwrap(props.manualInput);
      displayInput.disabled = !!uiUnwrap(props.disabled);
      displayInput.setAttribute("aria-expanded", entry ? "true" : "false");
      displayInput.value = formatDisplayValue(localValue);
      syncHiddenInputs();
      field._refresh?.();
    };
    const setTimeState = (nextValue, event, options = {}) => {
      const normalized = uiCloneTimeParts(parseTypedValue(nextValue));
      if (uiUnwrap(props.confirm) && options.commit !== true) {
        workingValue = uiCloneTimeParts(normalized);
        renderPanel();
        return normalized;
      }
      const prev = serializeValue(localValue);
      localValue = uiCloneTimeParts(normalized);
      workingValue = uiCloneTimeParts(normalized);
      syncDisplay();
      renderPanel();
      if (model && options.fromModel !== true) model.set(exportValue(normalized));
      const nextSerialized = serializeValue(normalized);
      if (options.emit !== false && nextSerialized !== prev) {
        const emitted = exportValue(normalized);
        props.onInput?.(emitted, event);
        props.onChange?.(emitted, event);
      }
      return normalized;
    };
    const shouldCloseOnSelect = (meta) => {
      if (uiUnwrap(props.confirm)) return false;
      if (props.closeOnSelect !== true) return false;
      if (getTimeOptions().withSeconds) return meta?.part === "second";
      return meta?.part === "minute";
    };
    const scrollTimeColumnsToSelection = (options = {}) => {
      uiCenterTimeColumnsToSelection(panelRoot, options);
    };
    const jumpToNow = () => {
      const scrollState = uiCaptureTimeColumnScrollState(panelRoot);
      setTimeState(new Date(), null, { commit: !uiUnwrap(props.confirm) });
      scrollTimeColumnsToSelection({ scrollState });
      if (!uiUnwrap(props.confirm) && props.closeOnSelect === true) closePanel();
    };
    const applyWorkingValue = () => {
      if (!uiUnwrap(props.confirm)) return;
      setTimeState(workingValue, null, { commit: true });
      if (props.closeOnSelect !== false) closePanel();
    };

    const renderPanel = () => {
      if (!panelRoot) return;
      const currentValue = getCurrentValue();
      const footerDisplayValue = formatDisplayValue(currentValue);
      const header = _.div({ class: "cms-time-header" });
      const columns = _.div({ class: "cms-time-columns" },
        _.div({ class: "cms-time-column-title" }, uiUnwrap(props.hoursLabel) || "Ore"),
        _.div({ class: "cms-time-column-title" }, uiUnwrap(props.minutesLabel) || "Min")
      );
      const withSeconds = getTimeOptions().withSeconds;
      if (withSeconds) {
        columns.appendChild(_.div({ class: "cms-time-column-title" }, uiUnwrap(props.secondsLabel) || "Sec"));
      }
      header.appendChild(columns);
      const body = uiCreateTimePickerSection({
        props: {
          min: uiUnwrap(props.min ?? props.minTime),
          max: uiUnwrap(props.max ?? props.maxTime),
          use12h: uiUnwrap(props.use12h ?? props.ampm),
          hoursLabel: uiUnwrap(props.hoursLabel) || "Ore",
          minutesLabel: uiUnwrap(props.minutesLabel) || "Min",
          secondsLabel: uiUnwrap(props.secondsLabel) || "Sec"
        },
        slots,
        value: currentValue,
        withSeconds: withSeconds,
        minuteStep: getMinuteStep(),
        secondStep: getSecondStep(),
        disabled: !!uiUnwrap(props.disabled),
        readonly: !!uiUnwrap(props.readonly),
        pointIcon: uiUnwrap(props.pointIcon),
        shortcuts: uiUnwrap(props.shortcuts ?? props.presets),
        onSelect: (nextTime, meta) => {
          const scrollState = uiCaptureTimeColumnScrollState(panelRoot);
          setTimeState(nextTime, null);
          scrollTimeColumnsToSelection({ scrollState });
          if (shouldCloseOnSelect(meta)) closePanel();
        }
      });
      const footer = _.div({ class: "cms-time-footer" },
        _.div({ class: "cms-time-value" },
          ...renderSlotToArray(
            slots,
            "value",
            { value: currentValue, displayValue: footerDisplayValue },
            footerDisplayValue || renderSlotToArray(slots, "default", {}, children)
          )
        ),
        _.div({ class: "cms-time-actions" },
          _.button({ type: "button", class: "cms-time-action", onClick: jumpToNow }, uiUnwrap(props.nowLabel) || "Ora"),
          uiUnwrap(props.clearable) !== false
            ? _.button({ type: "button", class: "cms-time-action", onClick: () => setTimeState(null, null, { commit: !uiUnwrap(props.confirm) }) }, uiUnwrap(props.clearLabel) || "Reset")
            : null,
          uiUnwrap(props.confirm)
            ? _.button({ type: "button", class: "cms-time-action is-primary", onClick: applyWorkingValue }, uiUnwrap(props.applyLabel) || "Applica")
            : null
        )
      );
      panelRoot.replaceChildren(_.div({
        class: "cms-time-panel-root",
        onKeydown: (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closePanel();
          }
        }
      }, header, body, footer));
    };

    function openPanel() {
      if (entry || uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return entry;
      workingValue = uiCloneTimeParts(localValue);
      entry = JSswift.overlay.open(() => {
        panelRoot = _.div({ class: uiClassStatic(["cms-time-panel", uiUnwrap(sizeValue), props.panelClass]) });
        renderPanel();
        return panelRoot;
      }, {
        type: "time",
        anchorEl: field._control || displayInput,
        placement: props.placement || "bottom-start",
        offsetX: props.offsetX ?? 0,
        offsetY: props.offsetY ?? props.offset ?? 8,
        backdrop: false,
        lockScroll: false,
        trapFocus: false,
        closeOnOutside: props.closeOnOutside !== false,
        closeOnBackdrop: false,
        closeOnEsc: true,
        autoFocus: false,
        className: uiClassStatic(["cms-time-overlay", props.panelClass]),
        onClose: () => {
          entry = null;
          panelRoot = null;
          syncDisplay();
          props.onClose?.();
        }
      });
      if (props.panelStyle) Object.assign(entry.panel.style, props.panelStyle);
      overlayEnter(entry);
      scrollTimeColumnsToSelection();
      syncDisplay();
      props.onOpen?.();
      return entry;
    }

    function closePanel() {
      if (!entry) return;
      const toClose = entry;
      overlayLeave(toClose, () => JSswift.overlay.close(toClose.id));
    }

    displayInput.addEventListener("focus", (event) => {
      props.onFocus?.(event);
      if (props.openOnFocus !== false) openPanel();
    });
    displayInput.addEventListener("click", (event) => {
      props.onClick?.(event);
      openPanel();
    });
    displayInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (entry) {
          event.preventDefault();
          closePanel();
        }
        return;
      }
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPanel();
      }
      if ((event.key === "Backspace" || event.key === "Delete") && !uiUnwrap(props.manualInput) && uiUnwrap(props.clearable) !== false) {
        event.preventDefault();
        setTimeState(null, event, { commit: true });
      }
    });
    if (uiUnwrap(props.manualInput)) {
      displayInput.addEventListener("input", (event) => props.onTyping?.(displayInput.value, event));
      displayInput.addEventListener("change", (event) => setTimeState(displayInput.value, event));
      displayInput.addEventListener("blur", (event) => {
        props.onBlur?.(event);
        if (displayInput.value === "") setTimeState(null, event);
        else setTimeState(displayInput.value, event);
      });
    } else {
      displayInput.addEventListener("blur", (event) => props.onBlur?.(event));
    }

    if (model) {
      model.watch((next) => {
        const normalized = uiCloneTimeParts(parseTypedValue(next));
        if (serializeValue(normalized) === serializeValue(localValue)) return;
        localValue = uiCloneTimeParts(normalized);
        workingValue = uiCloneTimeParts(normalized);
        syncDisplay();
        renderPanel();
      }, "UI.Time:watch");
    }

    JSswift.reactive.effect(() => {
      if (!model && props.value != null) {
        localValue = uiCloneTimeParts(parseTypedValue(uiUnwrap(props.value)));
        workingValue = uiCloneTimeParts(localValue);
      }
      syncDisplay();
      renderPanel();
      if (entry && uiUnwrap(props.disabled)) closePanel();
    }, "UI.Time:render");

    field._input = displayInput;
    field._time = displayInput;
    field._open = openPanel;
    field._close = closePanel;
    field._getValue = () => exportValue(localValue);
    field._setValue = (value) => setTimeState(value, null, { emit: false, commit: true });
    field._panel = () => entry?.panel || null;

    return field;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Time = {
      signature: "UI.Time(props)",
      props: {
        value: "string|Date",
        model: "rod | [get,set] signal",
        min: "string",
        max: "string",
        minuteStep: "number",
        secondStep: "number",
        withSeconds: "boolean",
        manualInput: "boolean",
        clearable: "boolean",
        confirm: "boolean",
        label: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        pointIcon: "String|Node|Function|Array",
        shortcuts: "Array<{ label, value }>",
        name: "string",
        class: "string",
        style: "object"
      },
      slots: {
        option: "Renderer for a time option ({ part, value, label, selected, timeValue })",
        point: "Point/icon in the selected time option",
        shortcut: "Shortcut renderer",
        value: "Footer value renderer ({ value, displayValue })",
        label: "Floating label",
        topLabel: "Top label",
        icon: "Left icon",
        iconRight: "Right icon",
        default: "Fallback value content"
      },
      events: {
        onChange: "(value, event)",
        onInput: "(value, event)",
        onOpen: "void",
        onClose: "void"
      },
      returns: "HTMLDivElement (field wrapper) con ._input, ._open(), ._close(), ._getValue(), ._setValue(value)",
      description: "Reactive time picker with fixed overlay, label/icon slots, point icon, shortcuts, confirm, and model."
    };
  }
  // Esempio: JSswift.ui.Time({ value: "09:30" })

