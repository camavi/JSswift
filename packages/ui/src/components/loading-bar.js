
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
    shellProps.class = uiClass(["jss-loading-bar", props.class]);
    shellProps.style = { ...(props.style || {}) };

    const progressProps = JSswift.omit(props, [
      "target", "mount", "position", "top", "right", "bottom", "left", "inset", "zIndex",
      "visible", "autoStart", "hideOnZero", "startValue", "step", "trickle", "trickleStep",
      "trickleInterval", "trickleMax", "trickleTo", "doneValue", "doneDelay", "hideDelay",
      "resetValue", "progressClass", "progressStyle", "onVisibleChange"
    ]);
    progressProps.class = uiClass(["jss-loading-bar-progress", props.progressClass, progressProps.class]);
    progressProps.style = { ...(props.progressStyle || {}) };
    progressProps.value = [getValue, setValueSignal];
    progressProps.buffer = [getBuffer, setBufferSignal];
    if (progressProps.dense == null) progressProps.dense = true;
    if (progressProps.height == null && progressProps.thickness == null && progressProps.size == null) {
      progressProps.height = () => uiUnwrap(props.dense) ? 2
        : (uiUnwrap(props.border) || uiUnwrap(props.glossy)) ? 4 : 3;
    }
    if (progressProps.trackColor == null && uiUnwrap(props.flat)) {
      progressProps.trackColor = "transparent";
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

  // Esempio: const lb = JSswift.ui.LoadingBar({ autoStart: true }); lb.done();
