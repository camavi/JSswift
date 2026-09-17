  /* ===============================
     Renderer shared helpers
     =============================== */

  function normalizeClass(v) {
    const tokens = [];
    const add = (value) => {
      if (value == null || value === false) return;
      if (typeof value === "function") {
        add(value());
        return;
      }
      if (value && value.type === "rod") {
        add(value.value);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(add);
        return;
      }
      if (typeof value === "object") {
        Object.entries(value).forEach(([className, enabled]) => {
          let resolved = enabled;
          if (typeof resolved === "function") resolved = resolved();
          else if (resolved && resolved.type === "rod") resolved = resolved.value;
          add(resolved ? className : null);
        });
        return;
      }
      if (value === true) return;
      String(value).split(/\s+/).forEach((token) => {
        if (token) tokens.push(token);
      });
    };

    add(v);
    return tokens.length ? Array.from(new Set(tokens)).join(" ") : "";
  }

  function hasDynamicClassValue(value) {
    if (value == null || value === false) return false;
    if (typeof value === "function") return true;
    if (value && value.type === "rod") return true;
    if (Array.isArray(value)) return value.some(hasDynamicClassValue);
    if (typeof value === "object") return Object.values(value).some(hasDynamicClassValue);
    return false;
  }

  function hasDynamicStyleValue(value, isRod) {
    if (value == null || value === false) return false;
    if (typeof value === "function") return true;
    if (isRod(value)) return true;
    if (typeof value !== "object" || Array.isArray(value) || value.nodeType) return false;
    return Object.values(value).some((entry) => hasDynamicStyleValue(entry, isRod));
  }

  function resolveStyleObject(value, isRod) {
    let next = value;
    if (typeof next === "function") next = next();
    else if (isRod(next)) next = next.value;

    if (!next || typeof next !== "object" || Array.isArray(next) || next.nodeType) {
      return null;
    }

    const out = {};
    Object.entries(next).forEach(([styleName, styleValue]) => {
      let resolved = styleValue;
      if (typeof resolved === "function") resolved = resolved();
      else if (isRod(resolved)) resolved = resolved.value;
      out[styleName] = resolved;
    });
    return out;
  }

  function createStyleObjectApplier(setStyleEntry) {
    let previousKeys = new Set();

    function clearMissing(nextKeys) {
      previousKeys.forEach((styleName) => {
        if (!nextKeys.has(styleName)) setStyleEntry(styleName, null);
      });
      previousKeys = nextKeys;
    }

    function apply(value, isRod) {
      const nextStyle = resolveStyleObject(value, isRod);
      if (!nextStyle) {
        clearMissing(new Set());
        return;
      }

      const nextKeys = new Set(Object.keys(nextStyle));
      clearMissing(nextKeys);
      Object.entries(nextStyle).forEach(([styleName, styleValue]) => {
        setStyleEntry(styleName, styleValue);
      });
    }

    return { apply };
  }

  function isEventProp(key) {
    return typeof key === "string" && (key.startsWith("on:") || (key.startsWith("on") && key.length > 2));
  }

  const ROD_INTERPOLATION_BUFFER_LIMIT = 128;
  const rodInterpolationBuffer = [];

  function trackRodInterpolation(rod, value) {
    rodInterpolationBuffer.push({ rod, value: String(value ?? "") });
    if (rodInterpolationBuffer.length > ROD_INTERPOLATION_BUFFER_LIMIT) {
      rodInterpolationBuffer.splice(0, rodInterpolationBuffer.length - ROD_INTERPOLATION_BUFFER_LIMIT);
    }
  }

  function createRodInterpolationCursor() {
    if (!rodInterpolationBuffer.length) return null;
    const items = rodInterpolationBuffer.slice();
    rodInterpolationBuffer.length = 0;
    return { items, index: 0 };
  }

  function takeInterpolatedSegments(text, cursor) {
    if (!cursor || !text || cursor.index >= cursor.items.length) return null;

    const segments = [];
    const source = String(text);
    let offset = 0;
    let nextIndex = cursor.index;
    let matched = false;

    while (nextIndex < cursor.items.length) {
      const entry = cursor.items[nextIndex];
      const needle = entry.value;
      if (!needle) break;

      const pos = source.indexOf(needle, offset);
      if (pos === -1) break;

      if (pos > offset) segments.push(source.slice(offset, pos));
      segments.push(entry.rod);
      offset = pos + needle.length;
      nextIndex++;
      matched = true;
    }

    if (!matched) return null;
    if (offset < source.length) segments.push(source.slice(offset));
    cursor.index = nextIndex;
    return segments;
  }

  function renderInterpolatedSegments(segments) {
    let out = "";
    for (const part of segments) {
      if (typeof part === "string") out += part;
      else out += part?.value ?? "";
    }
    return out;
  }

  function getEventName(key) {
    if (key.startsWith("on:")) return key.slice(3);
    const raw = key.slice(2);
    if (!raw) return "";
    if (raw === "DoubleClick") return "dblclick";
    return raw.toLowerCase();
  }

  function normalizeEventOptions(options) {
    if (options == null || options === false) return false;
    if (options === true) return { capture: true };
    if (typeof options === "boolean") return options;
    if (typeof options === "object") {
      return {
        capture: !!options.capture,
        passive: !!options.passive,
        once: !!options.once
      };
    }
    return false;
  }

  function eventOptionsEqual(a, b) {
    const left = normalizeEventOptions(a);
    const right = normalizeEventOptions(b);
    if (typeof left === "boolean" || typeof right === "boolean") return left === right;
    return !!left && !!right
      && left.capture === right.capture
      && left.passive === right.passive
      && left.once === right.once;
  }

  function hasDynamicEventValue(value, isRod) {
    if (Array.isArray(value)) return value.some((entry) => hasDynamicEventValue(entry, isRod));
    if (isRod(value)) return true;
    if (!value || typeof value !== "object" || Array.isArray(value) || value.nodeType) return false;
    if (Array.isArray(value.handlers)) return value.handlers.some((entry) => hasDynamicEventValue(entry, isRod)) || isRod(value.options) || typeof value.options === "function";
    if (Array.isArray(value.listeners)) return value.listeners.some((entry) => hasDynamicEventValue(entry, isRod)) || isRod(value.options) || typeof value.options === "function";
    return isRod(value.handler)
      || isRod(value.listener)
      || isRod(value.fn)
      || isRod(value.options)
      || typeof value.options === "function";
  }

  function normalizeEventEntry(value, isRod, inheritedOptions) {
    if (value == null || value === false) {
      return [];
    }
    if (typeof value === "function") {
      return [{ handler: value, options: normalizeEventOptions(inheritedOptions ?? false) }];
    }
    if (isRod(value)) {
      return normalizeEventEntry(value.value, isRod, inheritedOptions);
    }
    if (Array.isArray(value)) {
      return value.flatMap((entry) => normalizeEventEntry(entry, isRod, inheritedOptions));
    }
    if (typeof value === "object" && !Array.isArray(value) && !value.nodeType) {
      if (Array.isArray(value.handlers) || Array.isArray(value.listeners)) {
        const handlers = value.handlers || value.listeners || [];
        const sharedOptions = value.options ?? inheritedOptions ?? false;
        return handlers.flatMap((entry) => normalizeEventEntry(entry, isRod, sharedOptions));
      }
      let handler = value.handler ?? value.listener ?? value.fn ?? null;
      let options = value.options ?? inheritedOptions ?? false;
      if (isRod(handler)) handler = handler.value;
      if (isRod(options)) options = options.value;
      if (typeof options === "function") options = options();
      return typeof handler === "function"
        ? [{ handler, options: normalizeEventOptions(options) }]
        : [];
    }
    return [];
  }

  function normalizeEventValue(value, isRod) {
    return normalizeEventEntry(value, isRod);
  }

  function bindEventProp(el, key, value, isRod) {
    const eventName = getEventName(key);
    if (!eventName) return;

    const state = {
      listeners: []
    };

    const detach = () => {
      state.listeners.forEach((entry) => {
        el.removeEventListener(eventName, entry.dispatch, entry.options);
      });
      state.listeners = [];
    };

    const apply = (nextValue) => {
      const nextListeners = normalizeEventValue(nextValue, isRod);
      const isSameShape = state.listeners.length === nextListeners.length && state.listeners.every((entry, index) => {
        const next = nextListeners[index];
        return entry.handler === next.handler && eventOptionsEqual(entry.options, next.options);
      });
      if (isSameShape) return;

      detach();

      nextListeners.forEach((listener) => {
        const entry = {
          handler: listener.handler,
          options: listener.options,
          dispatch: null
        };
        entry.dispatch = (event) => {
          if (typeof entry.handler === "function") {
            const result = entry.handler.call(el, event);
            if (entry.options && typeof entry.options === "object" && entry.options.once) {
              el.removeEventListener(eventName, entry.dispatch, entry.options);
              state.listeners = state.listeners.filter((item) => item !== entry);
            }
            return result;
          }
        };
        el.addEventListener(eventName, entry.dispatch, entry.options);
        state.listeners.push(entry);
      });
    };

    JSswift._registerCleanup(el, detach);

    if (isRod(value)) {
      const stop = JSswift.reactive.effect(() => {
        apply(value.value);
      });
      JSswift._registerCleanup(el, stop);
      return;
    }

    if (hasDynamicEventValue(value, isRod)) {
      const stop = JSswift.reactive.effect(() => {
        apply(value);
      });
      JSswift._registerCleanup(el, stop);
      return;
    }

    apply(value);
  }
