
  UI.Progress = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const boundValue = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(boundValue, "UI.Progress:model");
    const stateClass = uiComputed([props.state, props.color], () => {
      const state = normalizeState(uiUnwrap(props.state) || uiUnwrap(props.color));
      return state ? `jss-state-${state}` : "";
    });

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
    const getTrackHeight = () => {
      const raw = uiUnwrap(props.height ?? props.thickness ?? props.size);
      if (raw == null || raw === "") return uiUnwrap(props.dense) ? "4px" : "8px";
      if (typeof raw === "number") return `${raw}px`;
      if (typeof raw === "string") {
        const sizePreset = {
          xxs: "4px",
          xs: "6px",
          sm: "8px",
          md: "10px",
          lg: "12px",
          xl: "14px",
          xxl: "16px",
          xxxl: "18px"
        };
        return sizePreset[raw] || raw;
      }
      return "8px";
    };
    const resolveCssColor = (value, fallback = "") => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return fallback;
      const state = normalizeState(raw);
      if (state === "light") return "var(--jss-progress-light, var(--jss-light))";
      if (state) return `var(--jss-${state})`;
      if (typeof raw === "string" && isTokenCSS(raw)) return `var(--jss-${raw})`;
      return String(raw);
    };
    const normalizeValue = (value) => {
      const min = getMin();
      const max = getMax();
      const next = getNumber(value, min);
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
    const clampBuffer = (value) => {
      const normalized = normalizeValue(value);
      return normalized < getValue() ? getValue() : normalized;
    };
    const resolveDisplayValue = (value, percent, ctx) => {
      const formatter = props.formatValue;
      if (typeof formatter === "function") {
        const formatted = formatter(value, percent, ctx);
        if (formatted != null) return formatted;
      }
      return `${Math.round(percent)}%`;
    };
    const clearHost = (host) => {
      while (host.firstChild) host.removeChild(host.firstChild);
    };
    const renderInto = (host, nodes, display = "flex") => {
      clearHost(host);
      (nodes || []).forEach((node) => {
        if (node == null || node === false) return;
        if (node instanceof Node) {
          host.appendChild(node);
          return;
        }
        host.appendChild(document.createTextNode(String(node)));
      });
      host.style.display = host.childNodes.length ? display : "none";
    };
    const asArray = (value, ctx = {}) => slotToArray(uiUnwrap(value), ctx);
    const asIconArray = (value, as, ctx = {}) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return [];
      if (typeof raw === "string") return [UI.Icon({ name: raw, size: props.iconSize ?? 16 })];
      return asArray(raw, { ...ctx, as });
    };
    const resolveContentProp = (value) => {
      if (uiIsRod(value) || uiIsSignal(value)) return uiUnwrap(value);
      if (typeof value === "function" && value.length === 0) return value();
      return value;
    };

    const [getValue, setValue] = JSswift.reactive.signal(normalizeValue(
      model ? model.get() : (uiUnwrap(props.value) ?? uiUnwrap(props.min) ?? 0)
    ));
    const [getBuffer, setBuffer] = JSswift.reactive.signal(clampBuffer(
      uiUnwrap(props.buffer) ?? (model ? model.get() : (uiUnwrap(props.value) ?? uiUnwrap(props.min) ?? 0))
    ));

    const setProgressValue = (raw, opts = {}) => {
      const next = normalizeValue(raw);
      if (getValue() !== next) setValue(next);
      if (getBuffer() < next) setBuffer(next);
      if (model && opts.fromModel !== true) model.set(next);
      return next;
    };
    const setProgressBuffer = (raw) => {
      const next = clampBuffer(raw);
      if (getBuffer() !== next) setBuffer(next);
      return next;
    };

    const wrapProps = JSswift.omit(props, [
      "model", "value", "min", "max", "buffer", "class", "style", "slots",
      "label", "note", "showValue", "valueLabel", "insideLabel", "formatValue",
      "icon", "iconRight", "iconSize", "startLabel", "endLabel", "leftLabel", "rightLabel",
      "trackColor", "bufferColor", "height", "thickness", "size", "state", "color",
      "reverse", "striped", "animated", "indeterminate", "ariaLabel", "ariaValueText",
      "width", "dense", "outline", "flat", "border", "glossy", "glow", "glass",
      "shadow", "gradient", "textGradient", "lightShadow", "radius", "rounded", "textColor"
    ]);
    const rootStyle = {
      width: uiUnwrap(props.width) || "100%",
      ...(props.style || {})
    };
    const propColor = uiUnwrap(props.color);
    if ((propColor != null || uiIsReactive(props.color)) && !normalizeState(propColor || "")) {
      delete rootStyle.backgroundColor;
    }
    wrapProps.class = uiClass([
      "jss-progress-wrap",
      uiWhen(props.dense, "dense"),
      uiWhen(props.textGradient, "jss-text-gradient"),
      uiWhen(props.reverse, "is-reverse"),
      uiWhen(props.indeterminate, "is-indeterminate"),
      stateClass,
      props.class
    ]);
    wrapProps.style = rootStyle;

    const header = _.div({ class: "jss-progress-header" });
    const heading = _.div({ class: "jss-progress-heading" });
    const labelHost = _.div({ class: "jss-progress-label" });
    const noteHost = _.div({ class: "jss-progress-note" });
    const valueHost = _.div({ class: "jss-progress-value" });
    heading.append(labelHost, noteHost);
    header.append(heading, valueHost);

    const body = _.div({ class: "jss-progress-body" });
    const startLabelHost = _.span({ class: "jss-progress-edge-label jss-progress-edge-label-left" });
    const track = _.div({
      class: "jss-progress",
      role: "progressbar"
    });
    const buffer = _.span({ class: "jss-progress-buffer" });
    const fill = _.span({
      class: uiClass([
        "jss-progress-bar",
        "jss-singularity",
        stateClass,
        uiWhen(props.outline, "jss-outline"),
        uiWhen(props.flat, "jss-flat"),
        uiWhen(props.border, "jss-border"),
        uiWhen(props.glossy, "jss-glossy"),
        uiWhen(props.glow, "jss-glow"),
        uiWhen(props.glass, "jss-glass"),
        uiWhen(props.shadow, "jss-shadow"),
        uiComputed(props.shadow, () => {
          const shadow = normalizeShadow(uiUnwrap(props.shadow));
          return shadow ? `jss-shadow-${shadow}` : "";
        }),
        uiWhen(props.gradient, "jss-gradient"),
        uiWhen(props.textGradient, "jss-text-gradient"),
        uiWhen(props.lightShadow, "jss-light-shadow"),
        uiWhen(props.striped, "is-striped"),
        uiWhen(props.animated || props.indeterminate, "is-animated")
      ])
    });
    const insideHost = _.span({ class: "jss-progress-bar-label" });
    fill.appendChild(insideHost);
    track.append(buffer, fill);
    const endLabelHost = _.span({ class: "jss-progress-edge-label jss-progress-edge-label-right" });
    body.append(startLabelHost, track, endLabelHost);

    const wrap = _.div(wrapProps, header, body);
    setPropertyProps(fill, props);

    const renderHeader = () => {
      const value = getValue();
      const percent = ratioFromValue(value) * 100;
      const ctx = {
        value,
        percent,
        min: getMin(),
        max: getMax(),
        buffer: getBuffer(),
        progress: wrap,
        track,
        bar: fill,
        props
      };
      const iconNodes = renderSlotToArray(slots, "icon", ctx, null);
      const iconFallback = iconNodes.length ? [] : asIconArray(props.icon, "icon", ctx);
      const labelNodes = renderSlotToArray(slots, "label", ctx, resolveContentProp(props.label));
      const fallbackNodes = labelNodes.length ? labelNodes : renderSlotToArray(slots, "default", ctx, children);
      const rightIconNodes = renderSlotToArray(slots, "iconRight", ctx, null);
      const rightIconFallback = rightIconNodes.length ? [] : asIconArray(props.iconRight, "iconRight", ctx);
      const noteNodes = renderSlotToArray(slots, "note", ctx, resolveContentProp(props.note));
      const valueFallback = props.valueLabel != null
        ? resolveContentProp(props.valueLabel)
        : resolveDisplayValue(value, percent, ctx);
      const showValue = uiUnwrap(props.showValue);
      const outsideValueNodes = (showValue === true || props.valueLabel != null || JSswift.ui.getSlot(slots, "value") != null)
        ? renderSlotToArray(slots, "value", ctx, valueFallback)
        : [];

      renderInto(labelHost, [...iconFallback, ...iconNodes, ...fallbackNodes, ...rightIconFallback, ...rightIconNodes], "inline-flex");
      renderInto(noteHost, noteNodes, "block");
      renderInto(valueHost, showValue === "inside" ? [] : outsideValueNodes, "inline-flex");
      header.style.display = (labelHost.childNodes.length || noteHost.childNodes.length || valueHost.childNodes.length) ? "flex" : "none";
    };

    const renderEdgeLabels = () => {
      const value = getValue();
      const percent = ratioFromValue(value) * 100;
      const ctx = {
        value,
        percent,
        min: getMin(),
        max: getMax(),
        buffer: getBuffer(),
        progress: wrap,
        track,
        bar: fill,
        props
      };
      const startSource = resolveContentProp(props.startLabel ?? props.leftLabel);
      const endSource = resolveContentProp(props.endLabel ?? props.rightLabel);
      renderInto(startLabelHost, renderSlotToArray(slots, "startLabel", ctx, startSource), "inline-flex");
      renderInto(endLabelHost, renderSlotToArray(slots, "endLabel", ctx, endSource), "inline-flex");
    };

    const renderInsideValue = () => {
      const value = getValue();
      const percent = ratioFromValue(value) * 100;
      const ctx = {
        value,
        percent,
        min: getMin(),
        max: getMax(),
        buffer: getBuffer(),
        progress: wrap,
        track,
        bar: fill,
        props
      };
      const showValue = uiUnwrap(props.showValue);
      const insideFallback = props.insideLabel != null
        ? resolveContentProp(props.insideLabel)
        : resolveDisplayValue(value, percent, ctx);
      const insideNodes = (showValue === "inside" || props.insideLabel != null || JSswift.ui.getSlot(slots, "inside") != null)
        ? renderSlotToArray(slots, "inside", ctx, insideFallback)
        : [];
      renderInto(insideHost, insideNodes, "inline-flex");
    };

    const syncVisualState = () => {
      const value = getValue();
      const bufferValue = getBuffer();
      const min = getMin();
      const max = getMax();
      const percent = ratioFromValue(value) * 100;
      const bufferPercent = ratioFromValue(bufferValue) * 100;
      const tone = resolveCssColor(props.color, "");
      const trackTone = resolveCssColor(
        props.trackColor,
        tone ? `color-mix(in srgb, ${tone} 14%, transparent)` : "rgba(255,255,255,0.08)"
      );
      const bufferTone = resolveCssColor(
        props.bufferColor,
        tone ? `color-mix(in srgb, ${tone} 30%, transparent)` : "rgba(255,255,255,0.16)"
      );
      const ariaLabel = uiUnwrap(props.ariaLabel);
      const ariaValueText = uiUnwrap(props.ariaValueText);
      const isIndeterminate = !!uiUnwrap(props.indeterminate);
      const customRadius = uiUnwrap(props.radius);

      wrap.style.width = uiUnwrap(props.width) || "100%";
      wrap.style.setProperty("--jss-progress-height", getTrackHeight());
      if (customRadius != null) {
        if (typeof customRadius === "number") wrap.style.setProperty("--jss-progress-radius", `${customRadius}px`);
        else if (typeof customRadius === "string" && JSswift.uiSizes.includes(customRadius)) wrap.style.setProperty("--jss-progress-radius", `var(--jss-r-${customRadius})`);
        else wrap.style.setProperty("--jss-progress-radius", String(customRadius));
      } else {
        wrap.style.removeProperty("--jss-progress-radius");
      }

      track.style.background = trackTone;
      buffer.style.background = bufferTone;
      buffer.style.width = `${bufferPercent}%`;

      if (tone && !normalizeState(uiUnwrap(props.state) || uiUnwrap(props.color))) {
        fill.style.setProperty("--set-background-color", tone);
        fill.style.setProperty("--set-border-color", tone);
        fill.style.setProperty("--set-color", uiUnwrap(props.textColor) || "var(--jss-on-primary, #fff)");
      } else if (!normalizeState(uiUnwrap(props.state) || uiUnwrap(props.color))) {
        fill.style.setProperty("--set-background-color", "var(--jss-primary)");
        fill.style.setProperty("--set-border-color", "var(--jss-primary)");
        fill.style.setProperty("--set-color", uiUnwrap(props.textColor) || "var(--jss-on-primary, #fff)");
      } else {
        fill.style.removeProperty("--set-background-color");
        fill.style.removeProperty("--set-border-color");
        fill.style.removeProperty("--set-color");
      }

      if (isIndeterminate) {
        fill.style.width = "";
        track.removeAttribute("aria-valuenow");
        track.removeAttribute("aria-valuemin");
        track.removeAttribute("aria-valuemax");
      } else {
        fill.style.width = `${percent}%`;
        track.setAttribute("aria-valuemin", String(min));
        track.setAttribute("aria-valuemax", String(max));
        track.setAttribute("aria-valuenow", String(value));
      }

      if (ariaLabel != null) track.setAttribute("aria-label", String(ariaLabel));
      else if (typeof uiUnwrap(props.label) === "string") track.setAttribute("aria-label", String(uiUnwrap(props.label)));
      else track.removeAttribute("aria-label");

      if (ariaValueText != null) {
        track.setAttribute("aria-valuetext", String(ariaValueText));
      } else if (!isIndeterminate) {
        track.setAttribute("aria-valuetext", resolveDisplayValue(value, percent, { value, percent, min, max, buffer: bufferValue, progress: wrap, track, bar: fill, props }));
      } else {
        track.removeAttribute("aria-valuetext");
      }

      wrap.classList.toggle("has-start-label", startLabelHost.childNodes.length > 0);
      wrap.classList.toggle("has-end-label", endLabelHost.childNodes.length > 0);
      wrap.classList.toggle("has-inside-label", insideHost.childNodes.length > 0);
    };

    if (model) {
      setProgressValue(model.get(), { fromModel: true });
      model.watch((value) => { setProgressValue(value, { fromModel: true }); }, "UI.Progress:watch");
    } else if (uiIsReactive(props.value)) {
      JSswift.reactive.effect(() => {
        setProgressValue(uiUnwrap(props.value), { fromModel: true });
      }, "UI.Progress:value");
    } else {
      setProgressValue(props.value ?? props.min ?? 0, { fromModel: true });
    }

    if (uiIsReactive(props.buffer)) {
      JSswift.reactive.effect(() => {
        setProgressBuffer(uiUnwrap(props.buffer));
      }, "UI.Progress:buffer");
    } else {
      setProgressBuffer(props.buffer ?? props.value ?? props.min ?? 0);
    }

    JSswift.reactive.effect(() => {
      renderHeader();
      renderEdgeLabels();
      renderInsideValue();
      syncVisualState();
    }, "UI.Progress:render");

    wrap._track = track;
    wrap._bar = fill;
    wrap._buffer = buffer;
    wrap._getValue = getValue;
    wrap._getBuffer = getBuffer;
    wrap._setValue = (value) => setProgressValue(value);
    wrap._setBuffer = (value) => setProgressBuffer(value);

    return wrap;
  };

  // Esempio: JSswift.ui.Progress({ value: 45 })
