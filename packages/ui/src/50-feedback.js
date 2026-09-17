  UI.Spinner = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};

    const makeCssVarValue = (value, mapper, fallback) => {
      if (uiIsReactive(value)) {
        return () => {
          const raw = uiUnwrap(value);
          if (raw == null || raw === false || raw === "") return fallback;
          const next = mapper ? mapper(raw) : raw;
          return next == null || next === "" ? fallback : next;
        };
      }
      if (value == null || value === false || value === "") return fallback;
      const next = mapper ? mapper(value) : value;
      return next == null || next === "" ? fallback : next;
    };

    const resolveSpinnerColor = (value) => {
      if (value == null || value === false || value === "") return "";
      const state = normalizeState(value);
      if (state) return "";
      const str = String(value).trim();
      if (!str) return "";
      if (
        str.startsWith("#") ||
        str.startsWith("rgb(") ||
        str.startsWith("rgba(") ||
        str.startsWith("hsl(") ||
        str.startsWith("hsla(") ||
        str.startsWith("var(")
      ) return str;
      if (isTokenCSS(str)) return `var(--cms-${str})`;
      return str;
    };

    const stateClass = uiComputed(props.state, () => {
      const state = normalizeState(uiUnwrap(props.state));
      return state ? `cms-state-${state}` : "";
    });

    const cls = uiClass([
      "cms-spinner",
      stateClass,
      uiWhen(props.vertical, "vertical"),
      uiWhen(props.reverse, "reverse"),
      uiWhen(props.center, "center"),
      uiWhen(props.block, "block"),
      uiWhen(props.pause || props.paused, "paused"),
      props.class
    ]);

    const p = JSswift.omit(props, [
      "ariaLabel", "block", "center", "color", "indicatorClass", "indicatorStyle",
      "label", "note", "pause", "paused", "reverse", "size", "slots", "speed",
      "state", "thickness", "trackColor", "vertical"
    ]);
    p.class = cls;

    const rootStyle = { ...(props.style || {}) };
    if (props.color != null && Object.prototype.hasOwnProperty.call(rootStyle, "backgroundColor")) {
      delete rootStyle.backgroundColor;
    }
    p.style = rootStyle;
    if (p.role == null) p.role = "status";
    if (p["aria-live"] == null) p["aria-live"] = "polite";
    if (p["aria-busy"] == null) p["aria-busy"] = "true";

    const ctx = { props };
    const labelNodes = renderSlotToArray(slots, "label", ctx, props.label);
    const copyNodes = renderSlotToArray(slots, "default", ctx, children);
    const noteNodes = renderSlotToArray(slots, "note", ctx, props.note);
    const hasText = labelNodes.length || copyNodes.length || noteNodes.length;

    if (!hasText) {
      const ariaLabel = uiUnwrap(props.ariaLabel ?? props["aria-label"]);
      if (ariaLabel) p["aria-label"] = ariaLabel;
      else if (p["aria-label"] == null) p["aria-label"] = "Loading";
    }

    const indicatorFallback = _.span({
      class: uiClass(["cms-spinner-indicator", props.indicatorClass]),
      style: {
        "--cms-spinner-size": makeCssVarValue(props.size, toCssSize, "18px"),
        "--cms-spinner-thickness": makeCssVarValue(props.thickness, toCssSize, "2px"),
        "--cms-spinner-speed": makeCssVarValue(props.speed, (v) => typeof v === "number" ? `${v}ms` : String(v), "900ms"),
        "--cms-spinner-color": makeCssVarValue(props.color, resolveSpinnerColor, "var(--set-border-color, var(--cms-primary))"),
        "--cms-spinner-track": makeCssVarValue(props.trackColor, resolveSpinnerColor, "color-mix(in srgb, var(--cms-spinner-color) 18%, transparent)"),
        ...(props.indicatorStyle || {})
      },
      "aria-hidden": "true"
    });
    const indicatorNodes = renderSlotToArray(slots, "indicator", ctx, indicatorFallback);
    const content = [];

    if (indicatorNodes.length) content.push(...indicatorNodes);
    if (hasText) {
      content.push(_.div(
        { class: "cms-spinner-content" },
        labelNodes.length ? _.div({ class: "cms-spinner-label" }, ...labelNodes) : null,
        copyNodes.length ? _.div({ class: "cms-spinner-copy" }, ...copyNodes) : null,
        noteNodes.length ? _.div({ class: "cms-spinner-note" }, ...noteNodes) : null
      ));
    }

    const root = _.div(p, ...content);
    setPropertyProps(root, props);
    return root;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Spinner = {
      signature: "UI.Spinner(...children) | UI.Spinner(props, ...children)",
      props: {
        size: "number|string",
        color: "string",
        thickness: "number|string",
        trackColor: "string",
        speed: "number|string",
        state: "primary|secondary|success|warning|danger|info|light|dark",
        label: "String|Node|Function|Array",
        note: "String|Node|Function|Array",
        vertical: "boolean",
        reverse: "boolean",
        center: "boolean",
        block: "boolean",
        pause: "boolean",
        paused: "boolean",
        ariaLabel: "string",
        indicatorClass: "string",
        indicatorStyle: "object",
        slots: "{ indicator?, label?, note?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        indicator: "Custom spinner indicator",
        label: "Primary label/content near the spinner",
        note: "Secondary supporting text",
        default: "Extra content rendered near the spinner"
      },
      returns: "HTMLDivElement",
      description: "Animated spinner with flexible layout, optional content, and controls for size, speed, and track."
    };
  }
  // Esempio: JSswift.ui.Spinner({ size: 24 })

  UI.Progress = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const boundValue = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(boundValue, "UI.Progress:model");
    const stateClass = uiComputed([props.state, props.color], () => {
      const state = normalizeState(uiUnwrap(props.state) || uiUnwrap(props.color));
      return state ? `cms-state-${state}` : "";
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
      if (raw == null || raw === "") return "8px";
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
      if (state) return `var(--cms-${state})`;
      if (typeof raw === "string" && isTokenCSS(raw)) return `var(--cms-${raw})`;
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
      "cms-progress-wrap",
      uiWhen(props.dense, "dense"),
      uiWhen(props.reverse, "is-reverse"),
      uiWhen(props.indeterminate, "is-indeterminate"),
      stateClass,
      props.class
    ]);
    wrapProps.style = rootStyle;

    const header = _.div({ class: "cms-progress-header" });
    const heading = _.div({ class: "cms-progress-heading" });
    const labelHost = _.div({ class: "cms-progress-label" });
    const noteHost = _.div({ class: "cms-progress-note" });
    const valueHost = _.div({ class: "cms-progress-value" });
    heading.append(labelHost, noteHost);
    header.append(heading, valueHost);

    const body = _.div({ class: "cms-progress-body" });
    const startLabelHost = _.span({ class: "cms-progress-edge-label cms-progress-edge-label-left" });
    const track = _.div({
      class: "cms-progress",
      role: "progressbar"
    });
    const buffer = _.span({ class: "cms-progress-buffer" });
    const fill = _.span({
      class: uiClass([
        "cms-progress-bar",
        "cms-singularity",
        stateClass,
        uiWhen(props.outline, "cms-outline"),
        uiWhen(props.flat, "cms-flat"),
        uiWhen(props.border, "cms-border"),
        uiWhen(props.glossy, "cms-glossy"),
        uiWhen(props.glow, "cms-glow"),
        uiWhen(props.glass, "cms-glass"),
        uiWhen(props.shadow, "cms-shadow"),
        uiComputed(props.shadow, () => {
          const shadow = normalizeShadow(uiUnwrap(props.shadow));
          return shadow ? `cms-shadow-${shadow}` : "";
        }),
        uiWhen(props.gradient, "cms-gradient"),
        uiWhen(props.textGradient, "cms-text-gradient"),
        uiWhen(props.lightShadow, "cms-light-shadow"),
        uiWhen(props.striped, "is-striped"),
        uiWhen(props.animated || props.indeterminate, "is-animated")
      ])
    });
    const insideHost = _.span({ class: "cms-progress-bar-label" });
    fill.appendChild(insideHost);
    track.append(buffer, fill);
    const endLabelHost = _.span({ class: "cms-progress-edge-label cms-progress-edge-label-right" });
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
      wrap.style.setProperty("--cms-progress-height", getTrackHeight());
      if (customRadius != null) {
        if (typeof customRadius === "number") wrap.style.setProperty("--cms-progress-radius", `${customRadius}px`);
        else if (typeof customRadius === "string" && JSswift.uiSizes.includes(customRadius)) wrap.style.setProperty("--cms-progress-radius", `var(--cms-r-${customRadius})`);
        else wrap.style.setProperty("--cms-progress-radius", String(customRadius));
      } else {
        wrap.style.removeProperty("--cms-progress-radius");
      }

      track.style.background = trackTone;
      buffer.style.background = bufferTone;
      buffer.style.width = `${bufferPercent}%`;

      if (tone && !normalizeState(uiUnwrap(props.state) || uiUnwrap(props.color))) {
        fill.style.setProperty("--set-background-color", tone);
        fill.style.setProperty("--set-border-color", tone);
        fill.style.setProperty("--set-color", uiUnwrap(props.textColor) || "var(--cms-on-primary, #fff)");
      } else if (!normalizeState(uiUnwrap(props.state) || uiUnwrap(props.color))) {
        fill.style.setProperty("--set-background-color", "var(--cms-primary)");
        fill.style.setProperty("--set-border-color", "var(--cms-primary)");
        fill.style.setProperty("--set-color", uiUnwrap(props.textColor) || "var(--cms-on-primary, #fff)");
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
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Progress = {
      signature: "UI.Progress(...children) | UI.Progress(props, ...children)",
      props: {
        value: "number|rod|[get,set] signal",
        model: "rod|[get,set] signal",
        min: "number",
        max: "number",
        buffer: "number|rod|[get,set] signal",
        label: "String|Node|Function|Array",
        note: "String|Node|Function|Array",
        showValue: "boolean|\"inside\"",
        valueLabel: "String|Node|Function|Array",
        insideLabel: "String|Node|Function|Array",
        formatValue: "function(value, percent, ctx)",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        startLabel: "String|Node|Function|Array",
        endLabel: "String|Node|Function|Array",
        leftLabel: "Alias of startLabel",
        rightLabel: "Alias of endLabel",
        width: "string|number",
        size: "string|number",
        height: "string|number",
        thickness: "Alias of height",
        color: "string",
        state: "primary|secondary|success|warning|danger|info|light|dark",
        trackColor: "string",
        bufferColor: "string",
        striped: "boolean",
        animated: "boolean",
        indeterminate: "boolean",
        reverse: "boolean",
        slots: "{ icon?, label?, note?, value?, inside?, startLabel?, endLabel?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        icon: "Icon before the label",
        label: "Main progress content",
        note: "Secondary content below the label",
        value: "External value on the right",
        inside: "Content inside the bar",
        startLabel: "Label on the left of the bar",
        endLabel: "Label on the right of the bar",
        default: "Fallback label content"
      },
      returns: "HTMLDivElement",
      description: "Standardized progress bar with optional header, buffer, semantic state, and reactive support."
    };
  }
  // Esempio: JSswift.ui.Progress({ value: 45 })

  UI.LoadingBar = function LoadingBar(...args) {
    const { props, children } = JSswift.uiNormalizeArgs(args);
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
    const clampValue = (value) => {
      const min = getMin();
      const max = getMax();
      const next = getNumber(value, min);
      return Math.min(max, Math.max(min, next));
    };
    const toCssValue = (value, fallback = "") => {
      if (value == null || value === false || value === "") return fallback;
      if (typeof value === "number") return `${value}px`;
      return String(value);
    };
    const resolveTarget = (target) => {
      const raw = uiUnwrap(target);
      if (!raw) return document.body;
      if (raw === document) return document.body;
      if (typeof raw === "string") return document.querySelector(raw) || document.body;
      if (raw && raw.body instanceof HTMLElement) return raw.body;
      return raw instanceof HTMLElement ? raw : document.body;
    };

    const valueBinding = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const valueModel = resolveModel(valueBinding, "UI.LoadingBar:model");
    const bufferBinding = (uiIsSignal(props.buffer) || uiIsRod(props.buffer)) ? props.buffer : null;
    const bufferModel = resolveModel(bufferBinding, "UI.LoadingBar:buffer");
    const initialValue = valueModel ? valueModel.get() : (uiUnwrap(props.value) ?? getMin());
    const initialBuffer = bufferModel ? bufferModel.get() : (uiUnwrap(props.buffer) ?? initialValue);
    const [getValue, setValueSignal] = JSswift.reactive.signal(clampValue(initialValue));
    const [getBuffer, setBufferSignal] = JSswift.reactive.signal(Math.max(clampValue(initialBuffer), clampValue(initialValue)));
    const [getVisible, setVisibleSignal] = JSswift.reactive.signal(
      props.visible != null ? !!uiUnwrap(props.visible) : (clampValue(initialValue) > getMin() || !!uiUnwrap(props.indeterminate))
    );

    let trickleTimer = null;
    let doneTimer = null;

    const clearTrickle = () => {
      if (trickleTimer) {
        clearInterval(trickleTimer);
        trickleTimer = null;
      }
    };
    const clearDoneTimer = () => {
      if (doneTimer) {
        clearTimeout(doneTimer);
        doneTimer = null;
      }
    };
    const syncVisibility = (next, opts = {}) => {
      const visible = !!next;
      if (getVisible() !== visible) setVisibleSignal(visible);
      if (opts.fromExternal !== true && typeof props.onVisibleChange === "function") {
        props.onVisibleChange(visible);
      }
      return visible;
    };
    const syncValue = (raw, opts = {}) => {
      const next = clampValue(raw);
      if (getValue() !== next) setValueSignal(next);
      if (getBuffer() < next) {
        setBufferSignal(next);
        if (bufferModel && opts.fromExternal !== true) bufferModel.set(next);
      }
      if (valueModel && opts.fromExternal !== true) valueModel.set(next);
      return next;
    };
    const syncBuffer = (raw, opts = {}) => {
      const next = Math.max(syncValue(getValue(), { fromExternal: true }), clampValue(raw));
      if (getBuffer() !== next) setBufferSignal(next);
      if (bufferModel && opts.fromExternal !== true) bufferModel.set(next);
      return next;
    };
    const showIfNeeded = (nextValue = getValue()) => {
      if (props.visible != null) return;
      if (uiUnwrap(props.indeterminate) || nextValue > getMin()) syncVisibility(true);
      else if (uiUnwrap(props.hideOnZero) !== false) syncVisibility(false);
    };
    const startTrickle = () => {
      clearTrickle();
      if (uiUnwrap(props.trickle) === false || uiUnwrap(props.indeterminate)) return;
      const interval = getNumber(uiUnwrap(props.trickleInterval), 280);
      if (interval <= 0) return;
      trickleTimer = setInterval(() => {
        const current = getValue();
        const max = clampValue(uiUnwrap(props.trickleTo) ?? uiUnwrap(props.trickleMax) ?? 92);
        if (current >= max) return;
        const step = getNumber(uiUnwrap(props.trickleStep), current < 45 ? 12 : (current < 75 ? 7 : 3));
        syncValue(Math.min(max, current + step));
      }, interval);
    };

    const shellProps = JSswift.omit(props, [
      "model", "value", "min", "max", "buffer", "class", "style", "slots",
      "label", "note", "showValue", "valueLabel", "insideLabel", "formatValue",
      "icon", "iconRight", "iconSize", "startLabel", "endLabel", "leftLabel", "rightLabel",
      "trackColor", "bufferColor", "height", "thickness", "size", "state", "color",
      "reverse", "striped", "animated", "indeterminate", "ariaLabel", "ariaValueText",
      "width", "dense", "outline", "flat", "border", "glossy", "glow", "glass",
      "shadow", "gradient", "textGradient", "lightShadow", "radius", "rounded", "textColor",
      "target", "mount", "position", "top", "right", "bottom", "left", "inset", "zIndex",
      "visible", "autoStart", "hideOnZero", "startValue", "step", "trickle", "trickleStep",
      "trickleInterval", "trickleMax", "trickleTo", "doneValue", "doneDelay", "hideDelay",
      "resetValue", "progressClass", "progressStyle", "onVisibleChange"
    ]);
    shellProps.class = uiClass(["cms-loading-bar", props.class]);
    shellProps.style = { ...(props.style || {}) };

    const progressProps = JSswift.omit(props, [
      "target", "mount", "position", "top", "right", "bottom", "left", "inset", "zIndex",
      "visible", "autoStart", "hideOnZero", "startValue", "step", "trickle", "trickleStep",
      "trickleInterval", "trickleMax", "trickleTo", "doneValue", "doneDelay", "hideDelay",
      "resetValue", "progressClass", "progressStyle", "onVisibleChange"
    ]);
    progressProps.class = uiClass(["cms-loading-bar-progress", props.progressClass, progressProps.class]);
    progressProps.style = { ...(props.progressStyle || {}) };
    progressProps.value = [getValue, setValueSignal];
    progressProps.buffer = [getBuffer, setBufferSignal];
    if (progressProps.dense == null) progressProps.dense = true;
    if (progressProps.height == null && progressProps.thickness == null && progressProps.size == null) {
      progressProps.height = 3;
    }
    if (progressProps.width == null) progressProps.width = "100%";

    const root = _.div(shellProps);
    const progress = UI.Progress(progressProps, ...children);
    root.appendChild(progress);

    const set = (value) => {
      clearDoneTimer();
      const next = syncValue(value);
      showIfNeeded(next);
      return root;
    };
    const setBuffer = (value) => {
      clearDoneTimer();
      const next = syncBuffer(value);
      showIfNeeded(next);
      return root;
    };
    const inc = (step = uiUnwrap(props.step) ?? 8) => {
      clearDoneTimer();
      const current = getValue();
      const next = syncValue(current + getNumber(step, 0));
      showIfNeeded(next);
      return root;
    };
    const start = (value = uiUnwrap(props.startValue) ?? 12) => {
      clearDoneTimer();
      const next = Math.max(getValue(), clampValue(value));
      syncValue(next);
      syncBuffer(Math.max(getBuffer(), next));
      showIfNeeded(next);
      startTrickle();
      return root;
    };
    const reset = (value = uiUnwrap(props.resetValue) ?? getMin()) => {
      clearDoneTimer();
      clearTrickle();
      const next = clampValue(value);
      syncBuffer(next);
      syncValue(next);
      showIfNeeded(next);
      return root;
    };
    const done = (value = uiUnwrap(props.doneValue) ?? getMax()) => {
      clearDoneTimer();
      clearTrickle();
      const next = clampValue(value);
      syncBuffer(next);
      syncValue(next);
      showIfNeeded(next);
      const delay = Math.max(0, getNumber(uiUnwrap(props.hideDelay) ?? uiUnwrap(props.doneDelay), 220));
      doneTimer = setTimeout(() => { reset(); }, delay);
      return root;
    };
    const stop = (...innerArgs) => done(...innerArgs);
    const show = () => {
      syncVisibility(true);
      return root;
    };
    const hide = () => {
      clearDoneTimer();
      clearTrickle();
      syncVisibility(false);
      return root;
    };
    const destroy = () => {
      clearDoneTimer();
      clearTrickle();
      root.remove();
      return null;
    };

    root.el = root;
    root._progress = progress;
    root.get = () => getValue();
    root.getBuffer = () => getBuffer();
    root.set = set;
    root.setBuffer = setBuffer;
    root.inc = inc;
    root.start = start;
    root.done = done;
    root.complete = done;
    root.stop = stop;
    root.reset = reset;
    root.show = show;
    root.hide = hide;
    root.destroy = destroy;
    root._dispose = destroy;

    if (valueModel) {
      valueModel.watch((value) => { syncValue(value, { fromExternal: true }); showIfNeeded(clampValue(value)); }, "UI.LoadingBar:watch");
    } else if (uiIsReactive(props.value)) {
      JSswift.reactive.effect(() => {
        const next = clampValue(uiUnwrap(props.value));
        syncValue(next, { fromExternal: true });
        showIfNeeded(next);
      }, "UI.LoadingBar:value");
    }

    if (bufferModel) {
      bufferModel.watch((value) => { syncBuffer(value, { fromExternal: true }); }, "UI.LoadingBar:bufferWatch");
    } else if (uiIsReactive(props.buffer)) {
      JSswift.reactive.effect(() => {
        syncBuffer(uiUnwrap(props.buffer), { fromExternal: true });
      }, "UI.LoadingBar:buffer");
    }

    JSswift.reactive.effect(() => {
      const min = getMin();
      const max = getMax();
      const current = Math.min(max, Math.max(min, getValue()));
      const bufferCurrent = Math.max(current, Math.min(max, Math.max(min, getBuffer())));
      if (current !== getValue()) setValueSignal(current);
      if (bufferCurrent !== getBuffer()) setBufferSignal(bufferCurrent);
    }, "UI.LoadingBar:range");

    JSswift.reactive.effect(() => {
      if (props.visible == null) return;
      syncVisibility(uiUnwrap(props.visible), { fromExternal: true });
    }, "UI.LoadingBar:visible");

    JSswift.reactive.effect(() => {
      const position = uiUnwrap(props.position) || "fixed";
      const inset = uiUnwrap(props.inset);
      const top = uiUnwrap(props.top);
      const right = uiUnwrap(props.right);
      const bottom = uiUnwrap(props.bottom);
      const left = uiUnwrap(props.left);
      const width = uiUnwrap(props.width);
      const visible = props.visible != null ? !!uiUnwrap(props.visible) : getVisible();
      const inlineLike = position === "static" || position === "relative";

      root.classList.toggle("is-visible", visible);
      root.classList.toggle("is-inline", inlineLike);
      root.classList.toggle("has-track", !!uiUnwrap(props.trackColor));

      root.style.position = position;
      root.style.zIndex = String(uiUnwrap(props.zIndex) ?? 10002);
      root.style.width = toCssValue(width, inlineLike ? "100%" : "");

      if (inset != null && inset !== "") {
        root.style.inset = toCssValue(inset);
        root.style.removeProperty("top");
        root.style.removeProperty("right");
        root.style.removeProperty("bottom");
        root.style.removeProperty("left");
      } else {
        root.style.removeProperty("inset");
        if (!inlineLike && position !== "sticky") {
          root.style.top = toCssValue(top, "0px");
          root.style.right = toCssValue(right, width == null || width === "" ? "0px" : "");
          root.style.bottom = toCssValue(bottom, "");
          root.style.left = toCssValue(left, "0px");
        } else {
          root.style.top = toCssValue(top, "");
          root.style.right = toCssValue(right, "");
          root.style.bottom = toCssValue(bottom, "");
          root.style.left = toCssValue(left, "");
        }
      }
    }, "UI.LoadingBar:layout");

    setPropertyProps(root, props);

    if (uiUnwrap(props.mount) !== false) {
      resolveTarget(props.target).appendChild(root);
    }
    if (uiUnwrap(props.autoStart)) start();
    return root;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.LoadingBar = {
      signature: "UI.LoadingBar(...children) | UI.LoadingBar(props, ...children)",
      props: {
        value: "number|rod|[get,set] signal",
        model: "rod|[get,set] signal",
        buffer: "number|rod|[get,set] signal",
        min: "number",
        max: "number",
        height: "string|number",
        thickness: "Alias of height",
        size: "string|number",
        color: "string",
        state: "primary|secondary|success|warning|danger|info|light|dark",
        trackColor: "string",
        bufferColor: "string",
        striped: "boolean",
        animated: "boolean",
        indeterminate: "boolean",
        reverse: "boolean",
        width: "string|number",
        target: "HTMLElement|string",
        mount: "boolean",
        position: "fixed|absolute|relative|static|sticky",
        inset: "string|number",
        top: "string|number",
        right: "string|number",
        bottom: "string|number",
        left: "string|number",
        zIndex: "number",
        visible: "boolean",
        autoStart: "boolean",
        startValue: "number",
        step: "number",
        trickle: "boolean",
        trickleStep: "number",
        trickleInterval: "number",
        trickleMax: "number",
        trickleTo: "Alias of trickleMax",
        doneValue: "number",
        doneDelay: "Alias of hideDelay",
        hideDelay: "number",
        resetValue: "number",
        label: "String|Node|Function|Array",
        note: "String|Node|Function|Array",
        showValue: "boolean|\"inside\"",
        valueLabel: "String|Node|Function|Array",
        insideLabel: "String|Node|Function|Array",
        startLabel: "String|Node|Function|Array",
        endLabel: "String|Node|Function|Array",
        progressClass: "string",
        progressStyle: "object",
        slots: "{ icon?, label?, note?, value?, inside?, startLabel?, endLabel?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        icon: "Icon before the label",
        label: "Main content",
        note: "Secondary content",
        value: "External value on the right",
        inside: "Content inside the bar",
        startLabel: "Label on the left of the bar",
        endLabel: "Label on the right of the bar",
        default: "Fallback content"
      },
      returns: "HTMLDivElement with imperative API: .set(), .setBuffer(), .inc(), .start(), .done(), .stop(), .reset(), .show(), .hide(), .destroy()",
      description: "Loading bar based on UI.Progress, mountable on body or a custom container, controllable via model or imperative API."
    };
  }
  // Esempio: const lb = JSswift.ui.LoadingBar({ autoStart: true }); lb.done();

  const NOTIFY_POSITIONS = new Set([
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right"
  ]);
  const NOTIFY_VARIANTS = new Set(["soft", "solid", "outline"]);
  const NOTIFY_DEFAULT_TITLES = {
    success: "Success",
    warning: "Warning",
    danger: "Error",
    info: "Info",
    primary: "Notice",
    secondary: "Notice",
    light: "Notice",
    dark: "Notice"
  };
  const notifyIconMap = {
    success: "check_circle",
    warning: "warning",
    danger: "error",
    info: "info",
    primary: "bolt",
    secondary: "notifications",
    light: "notifications",
    dark: "shield"
  };

  const normalizeNotifyPosition = (value) => {
    const raw = String(uiUnwrap(value) || "").trim().toLowerCase();
    if (!raw) return "bottom-right";
    if (NOTIFY_POSITIONS.has(raw)) return raw;
    if (raw === "top") return "top-right";
    if (raw === "bottom") return "bottom-right";
    if (raw === "left") return "bottom-left";
    if (raw === "right") return "bottom-right";
    if (raw === "center") return "bottom-center";
    return "bottom-right";
  };

  const normalizeNotifyVariant = (value) => {
    const raw = String(uiUnwrap(value) || "").trim().toLowerCase();
    return NOTIFY_VARIANTS.has(raw) ? raw : "soft";
  };

  const normalizeNotifyTimeout = (value, tone) => {
    const raw = uiUnwrap(value);
    if (raw === false || raw === null) return 0;
    if (raw === true) return tone === "danger" ? 3500 : 2500;
    if (raw === "" || raw === undefined) return tone === "danger" ? 3500 : 2500;
    const num = Number(raw);
    return Number.isFinite(num) && num >= 0 ? num : (tone === "danger" ? 3500 : 2500);
  };

  const normalizeNotifyPayload = (input = {}, forcedType = "") => {
    const src = uiIsPlainObject(input) ? { ...input } : { message: input };
    const tone = normalizeState(uiUnwrap(forcedType) || uiUnwrap(src.type) || uiUnwrap(src.state) || uiUnwrap(src.color) || "info") || "info";
    const timeout = normalizeNotifyTimeout(src.timeout ?? src.duration ?? src.delay, tone);
    const closable = src.closable ?? src.dismissible ?? (src.dismiss != null) ?? (timeout === 0);
    const title = src.title === undefined
      ? (src.label === undefined ? NOTIFY_DEFAULT_TITLES[tone] : src.label)
      : src.title;

    return {
      ...src,
      type: tone,
      state: tone,
      title,
      message: src.message ?? src.content ?? src.text ?? null,
      description: src.description ?? src.subtitle ?? src.note ?? null,
      meta: src.meta ?? src.caption ?? null,
      body: src.body ?? null,
      timeout,
      closable: !!closable,
      dismissLabel: src.dismissLabel || src.closeLabel || "Chiudi notifica",
      position: normalizeNotifyPosition(src.position),
      variant: normalizeNotifyVariant(src.variant),
      slots: src.slots || {},
      role: src.role || ((tone === "danger" || tone === "warning") ? "alert" : "status")
    };
  };

  const buildNotifyOptionsFromArgs = (args, forcedType = "", defaultTitle = "") => {
    if (!args.length) {
      return normalizeNotifyPayload(defaultTitle ? { type: forcedType, title: defaultTitle } : { type: forcedType });
    }

    if (uiIsPlainObject(args[0])) {
      const { props, children } = JSswift.uiNormalizeArgs(args);
      const next = { ...props };
      if (!next.type && !next.state && !next.color && forcedType) next.type = forcedType;
      if (next.title == null && defaultTitle) next.title = defaultTitle;
      if (children.length) {
        if (next.message == null && next.description == null && next.body == null && children.length === 1) {
          next.message = children[0];
        } else if (next.body == null) {
          next.body = children.length === 1 ? children[0] : children;
        }
      }
      return normalizeNotifyPayload(next, forcedType);
    }

    const [message, second, third] = args;
    let next = {};
    if (uiIsPlainObject(second)) {
      next = { ...second, message };
    } else if (uiIsPlainObject(third)) {
      next = { ...third, message, title: second };
    } else {
      next = { message, title: second };
    }
    if (forcedType && !next.type && !next.state && !next.color) next.type = forcedType;
    if (next.title == null && defaultTitle) next.title = defaultTitle;
    return normalizeNotifyPayload(next, forcedType);
  };

  const createNotifyShortcut = (type, defaultTitle) => (...args) =>
    app.services.notify?.show?.(buildNotifyOptionsFromArgs(args, type, defaultTitle));

  const resolveNotifyPromiseOutcome = (value, fallbackMessage, fallbackTitle) => {
    if (value === false) return false;
    if (typeof value === "function") {
      const next = value();
      return resolveNotifyPromiseOutcome(next, fallbackMessage, fallbackTitle);
    }
    if (uiIsPlainObject(value)) return value;
    if (value != null) return { message: value, title: fallbackTitle };
    return { message: fallbackMessage, title: fallbackTitle };
  };

  UI.Notify = (...args) => app.services.notify?.show?.(buildNotifyOptionsFromArgs(args));
  UI.Notify.show = UI.Notify;
  UI.Notify.success = createNotifyShortcut("success", "Success");
  UI.Notify.error = createNotifyShortcut("danger", "Error");
  UI.Notify.warning = createNotifyShortcut("warning", "Warning");
  UI.Notify.info = createNotifyShortcut("info", "Info");
  UI.Notify.primary = createNotifyShortcut("primary", "Notice");
  UI.Notify.secondary = createNotifyShortcut("secondary", "Notice");
  UI.Notify.remove = (id) => app.services.notify?.remove?.(id);
  UI.Notify.clear = () => app.services.notify?.clear?.();
  UI.Notify.update = (id, patch = {}) => app.services.notify?.update?.(id, patch);
  UI.Notify.promise = async (task, opts = {}) => {
    const loadingInput = opts.loading === false
      ? false
      : resolveNotifyPromiseOutcome(
        typeof opts.loading === "function" ? () => opts.loading() : opts.loading,
        "Operazione in corso...",
        "In corso"
      );
    const loadingId = loadingInput === false
      ? null
      : app.services.notify?.show?.(normalizeNotifyPayload({
        type: "info",
        timeout: 0,
        closable: false,
        ...loadingInput
      }, "info"));

    try {
      const promise = typeof task === "function" ? task() : task;
      const result = await promise;
      const successInput = resolveNotifyPromiseOutcome(
        typeof opts.success === "function" ? () => opts.success(result) : opts.success,
        "Operazione completata con successo.",
        "Completato"
      );
      if (successInput !== false) {
        if (loadingId != null) app.services.notify?.update?.(loadingId, normalizeNotifyPayload(successInput, "success"));
        else app.services.notify?.show?.(normalizeNotifyPayload(successInput, "success"));
      } else if (loadingId != null) {
        app.services.notify?.remove?.(loadingId);
      }
      return result;
    } catch (error) {
      const errorInput = resolveNotifyPromiseOutcome(
        typeof opts.error === "function" ? () => opts.error(error) : opts.error,
        error?.message || "Operazione fallita.",
        "Errore"
      );
      if (errorInput !== false) {
        if (loadingId != null) app.services.notify?.update?.(loadingId, normalizeNotifyPayload(errorInput, "danger"));
        else app.services.notify?.show?.(normalizeNotifyPayload(errorInput, "danger"));
      } else if (loadingId != null) {
        app.services.notify?.remove?.(loadingId);
      }
      throw error;
    }
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Notify = {
      signature: "UI.Notify(message, title?, opts?) | UI.Notify(opts, ...children)",
      props: {
        id: "string",
        type: "success|warning|danger|error|info|primary|secondary|light|dark",
        state: "Alias of type",
        color: "Alias of type",
        title: "String|Node|Function|Array|false",
        message: "String|Node|Function|Array",
        description: "String|Node|Function|Array",
        meta: "String|Node|Function|Array",
        body: "Node|Function|Array",
        icon: "String|Node|Function|Array|false",
        actions: "Node|Function|Array",
        dismiss: "Node|Function|Array",
        timeout: "number|false",
        duration: "Alias of timeout",
        closable: "boolean",
        dismissLabel: "string",
        position: "top-left|top-center|top-right|bottom-left|bottom-center|bottom-right",
        variant: "soft|solid|outline",
        slots: "{ icon?, title?, message?, description?, meta?, actions?, dismiss?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        icon: "Leading visual/icon content",
        title: "Toast title content",
        message: "Primary message content",
        description: "Secondary/supporting text",
        meta: "Meta info or badges",
        actions: "Actions area content",
        dismiss: "Custom dismiss control",
        default: "Extra body content under the message"
      },
      methods: {
        show: "Alias of UI.Notify(...)",
        success: "UI.Notify.success(message|opts, title?)",
        error: "UI.Notify.error(message|opts, title?)",
        warning: "UI.Notify.warning(message|opts, title?)",
        info: "UI.Notify.info(message|opts, title?)",
        update: "UI.Notify.update(id, patch)",
        remove: "UI.Notify.remove(id)",
        clear: "UI.Notify.clear()",
        promise: "UI.Notify.promise(promise|fn, { loading?, success?, error? })"
      },
      returns: "string|null (toast id)",
      description: "Standardized notify service with structured payloads, semantic shortcuts, update/remove/clear, and promise support."
    };
  }


