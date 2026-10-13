
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
    inputProps.class = uiClass(["jss-slider-input", props.inputClass]);
    const input = _.input(inputProps);

    const sliderStyle = { ...(props.style || {}) };
    const sizeValue = uiUnwrap(props.size);
    if (sizeValue != null) {
      const sliderSize = (typeof sizeValue === "string" && JSswift.uiSizes?.includes(sizeValue))
        ? `var(--jss-size-${sizeValue})`
        : toCssSize(sizeValue);
      sliderStyle["--jss-slider-size"] = sliderSize;
      sliderStyle["--jss-slider-track-size"] = `max(4px, calc(${sliderSize} / 4))`;
      sliderStyle["--jss-slider-box-height"] = `calc(${sliderSize} * 1.5)`;
      sliderStyle["--jss-slider-marker-size"] = `max(6px, calc(${sliderSize} / 3))`;
    }

    const wrap = _.label({
      class: uiClass([
        "jss-clear-set",
        "jss-singularity-check",
        "jss-slider-wrap",
        uiWhen(props.dense, "dense"),
        props.class
      ]),
      style: sliderStyle
    });
    setPropertyProps(wrap, props);

    const header = _.div({
      class: "jss-slider-header"
    });
    const labelHost = _.span({
      class: "jss-slider-label"
    });
    const valueHost = _.span({
      class: "jss-slider-value"
    });
    header.append(labelHost, valueHost);

    const body = _.div({
      class: "jss-slider-body"
    });
    const startIconHost = _.span({
      class: "jss-slider-icon jss-slider-icon-left"
    });
    const startLabelHost = _.span({
      class: "jss-slider-edge-label jss-slider-edge-label-left"
    });
    const main = _.div({
      class: "jss-slider-main"
    });
    const sliderBox = _.div({
      class: "jss-slider-box",
      style: {
        minHeight: "var(--jss-slider-box-height, 36px)"
      }
    });
    const rail = _.span({
      class: "jss-slider-rail",
      style: {
        height: "var(--jss-slider-track-size, 6px)"
      }
    });
    const selection = _.span({
      class: "jss-slider-selection",
      style: {
        height: "var(--jss-slider-track-size, 6px)"
      }
    });
    const thumb = _.span({
      class: "jss-slider-thumb",
      style: {
        width: "var(--jss-slider-size, 24px)",
        height: "var(--jss-slider-size, 24px)"
      }
    });
    const thumbIconHost = _.span({
      class: "jss-slider-thumb-icon"
    });
    const thumbLabelHost = _.span({
      class: "jss-slider-thumb-label"
    });
    thumb.append(thumbLabelHost, thumbIconHost);

    const markersHost = _.div({
      class: "jss-slider-markers"
    });
    const endLabelHost = _.span({
      class: "jss-slider-edge-label jss-slider-edge-label-right"
    });
    const endIconHost = _.span({
      class: "jss-slider-icon jss-slider-icon-right"
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
          class: uiClass(["jss-slider-marker", marker.className, uiWhen(() => active, "active")]),
          style: {
            left: `${ratio * 100}%`,
            color: active ? (uiUnwrap(props.color) || "var(--jss-primary)") : "var(--jss-muted)",
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
          class: "jss-slider-marker-tick",
          style: {
            width: "var(--jss-slider-marker-size, 8px)",
            height: "var(--jss-slider-marker-size, 8px)",
            background: active ? (uiUnwrap(props.color) || "var(--jss-primary)") : "var(--jss-border-color)"
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
            class: "jss-slider-marker-label"
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
      const resolveSliderColor = (raw) => JSswift.uiColors.includes(raw) ? `var(--jss-${raw})` : raw;
      const colorName = uiUnwrap(props.color) || uiUnwrap(props.selectionColor) || "primary";
      const color = resolveSliderColor(colorName);
      const trackColor = resolveSliderColor(uiUnwrap(props.trackColor)) || "var(--jss-border-color)";
      const thumbColor = resolveSliderColor(uiUnwrap(props.thumbColor)) || color;
      const readonly = !!uiUnwrap(props.readonly);
      const disabled = !!uiUnwrap(props.disabled);

      input.min = String(min);
      input.max = String(max);
      input.step = step === "any" ? "any" : String(step);
      input.disabled = disabled;
      input.value = String(value);

      rail.style.background = trackColor;
      selection.style.background = color;
      wrap.style.setProperty("--jss-slider-glow-color", color);
      selection.style.width = percent;
      thumb.style.left = percent;
      thumb.style.borderColor = thumbColor;
      thumb.style.color = thumbColor;
      thumbLabelHost.style.background = color;
      thumbLabelHost.style.color = JSswift.uiColors.includes(colorName)
        ? (["warning", "success", "light"].includes(colorName) ? "var(--jss-gray-900)" : "var(--jss-gray-50)")
        : "var(--jss-text)";
      wrap.classList.toggle("is-disabled", disabled);
      wrap.classList.toggle("is-readonly", readonly);
      wrap.classList.toggle("has-markers", markersHost.childNodes.length > 0);
    };

    if (model) {
      setSliderValue(model.get(), { fromModel: true });
      JSswift._registerCleanup(wrap, model.watch((v) => { setSliderValue(v, { fromModel: true }); }, "UI.Slider:watch"));
    } else if (uiIsReactive(props.value)) {
      const stopValue = JSswift.reactive.effect(() => {
        setSliderValue(uiUnwrap(props.value), { fromModel: true });
      }, "UI.Slider:value");
      JSswift._registerCleanup(wrap, stopValue);
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

    const stopRender = JSswift.reactive.effect(() => {
      renderHeader();
      renderAddons();
      renderThumb();
      renderMarkers();
      syncVisualState();
    }, "UI.Slider:render");
    JSswift._registerCleanup(wrap, stopRender);

    wrap._input = input;
    wrap._getValue = getValue;
    wrap._setValue = (value) => setSliderValue(value);

    if (props.withQItem || props.qitem || props.item === true) {
      const item = UI.Item({
        class: uiClass(["jss-slider-item", props.itemClass]),
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

  // Esempio: JSswift.ui.Slider({ min: 0, max: 10, model: [get,set] })
