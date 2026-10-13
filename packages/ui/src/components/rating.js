
  UI.Rating = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const boundValue = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(boundValue, "UI.Rating:model");
    const id = props.id || (`jss-rating-` + Math.random().toString(36).slice(2));
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
    inputProps.class = uiClass(["jss-rating-input", "jss-choice-input", props.inputClass]);
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
      "jss-clear-set",
      "jss-singularity-check",
      "jss-choice-wrap",
      "jss-rating",
      "jss-rating-wrap",
      uiWhen(props.dense, "dense"),
      props.class
    ]);
    wrapProps.style = { ...(props.style || {}) };
    const sizeValue = uiUnwrap(props.size);
    if (sizeValue != null && !(typeof sizeValue === "string" && JSswift.uiSizes?.includes(sizeValue))) {
      wrapProps.style["--jss-rating-size"] = toCssSize(sizeValue);
    }
    const gapValue = uiUnwrap(props.gap);
    if (gapValue != null) {
      wrapProps.style["--jss-rating-gap"] = toCssSize(gapValue);
    }

    const control = _.span({
      class: "jss-rating-control",
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
    const labelHost = _.span({ class: "jss-choice-label jss-rating-label" });
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
      const selectedColor = uiUnwrap(props.colorSelected ?? props.activeColor ?? props.color ?? props.textColor) || "var(--jss-warning, #f0b429)";
      const halfColor = uiUnwrap(props.colorHalf ?? props.halfColor ?? props.colorSelected ?? props.activeColor ?? props.color ?? props.textColor) || selectedColor;
      const hoveredColor = uiUnwrap(props.colorHovered ?? props.hoverColor ?? props.colorSelected ?? props.activeColor ?? props.color ?? props.textColor) || selectedColor;
      const inactiveColor = uiUnwrap(props.colorInactive ?? props.colorOff ?? props.color) || "var(--jss-muted)";
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
        const iconHost = _.span({ class: "jss-rating-item-icon" });
        const item = _.span({
          class: "jss-rating-item",
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
          "jss-rating-item",
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
      const stopModel = model.watch((next) => {
        const normalized = normalizeValue(next);
        if (Object.is(normalized, localValue)) return;
        localValue = normalized;
        hoverValue = null;
        updateInputValue(localValue);
        syncVisualState();
      }, "UI.Rating:watch");
      JSswift._registerCleanup(wrap, stopModel);
    }

    const stopRender = JSswift.reactive.effect(() => {
      if (!model && props.value != null) {
        localValue = normalizeValue(uiUnwrap(props.value));
      }
      syncVisualState();
    }, "UI.Rating:render");
    JSswift._registerCleanup(wrap, stopRender);

    return wrap;
  };

  // Esempio: JSswift.ui.Rating({ max: 5, model: [get,set] })
