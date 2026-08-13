// ===============================
// CMSwift UI Kit MVP
// ===============================
(function initCMSwiftUI(app) {
  app.ui = app.ui || {};
  app.services = app.services || {};
  app.services.notify = app.services.notify || {};

  const uiRodPathRaw = Symbol("cms.ui.rodPathRaw");
  const uiRodPathEnhanced = Symbol("cms.ui.rodPathEnhanced");
  const uiRodPathPatchedH = Symbol("cms.ui.rodPathPatchedH");
  const uiRodPathWrappedUI = Symbol("cms.ui.rodPathWrappedUI");
  const uiRodPathAccess = new WeakMap();
  const uiRodPathProxyCache = new WeakMap();
  const uiWrappedFunctionCache = new WeakMap();
  const uiRodPathReadBuffer = [];
  const uiIsIndexKey = (key) => {
    if (typeof key === "number") return Number.isInteger(key) && key >= 0;
    if (typeof key !== "string" || key === "") return false;
    if (key[0] === "-" || key.includes(".")) return false;
    const num = Number(key);
    return Number.isInteger(num) && num >= 0 && String(num) === key;
  };
  const uiTrackablePrimitive = (v) => {
    const t = typeof v;
    return t === "string" || t === "number" || t === "boolean" || t === "bigint";
  };
  const uiIsPlainObject = (v) => {
    if (!v || typeof v !== "object") return false;
    const p = Object.getPrototypeOf(v);
    return p === Object.prototype || p === null;
  };
  let uiRodPathReadFlushQueued = false;
  const uiScheduleRodPathReadFlush = () => {
    if (uiRodPathReadFlushQueued) return;
    uiRodPathReadFlushQueued = true;
    queueMicrotask(() => {
      uiRodPathReadFlushQueued = false;
      uiRodPathReadBuffer.length = 0;
    });
  };
  const uiPushRodPathRead = (entry) => {
    uiRodPathReadBuffer.push(entry);
    if (uiRodPathReadBuffer.length > 128) {
      uiRodPathReadBuffer.splice(0, uiRodPathReadBuffer.length - 128);
    }
    uiScheduleRodPathReadFlush();
  };
  const uiCreateRodPathCursor = () => {
    if (!uiRodPathReadBuffer.length) return null;
    const items = uiRodPathReadBuffer.slice();
    uiRodPathReadBuffer.length = 0;
    return { items, index: 0 };
  };
  const uiTakeRodPathMatch = (cursor, value) => {
    if (!cursor) return null;
    const entry = cursor.items[cursor.index];
    if (!entry) return null;
    if (!Object.is(entry.value, value)) return null;
    cursor.index += 1;
    return entry;
  };
  const uiUnwrapRodPathValue = (v) => {
    if (v && typeof v === "object" && v[uiRodPathRaw]) return v[uiRodPathRaw];
    return v;
  };
  const uiReadRodPath = (rod, path) => {
    const access = uiRodPathAccess.get(rod);
    if (!access) return undefined;
    let cur = access.rawGet();
    for (const key of path) {
      if (cur == null) return undefined;
      cur = cur[key];
    }
    return cur;
  };
  const uiWriteRodPath = (rod, path, nextValue) => {
    const access = uiRodPathAccess.get(rod);
    if (!access) return;
    const unwrapped = uiUnwrapRodPathValue(nextValue);
    if (!path.length) {
      if (Object.is(access.rawGet(), unwrapped)) return;
      access.rawSet(unwrapped);
      return;
    }
    let root = access.rawGet();
    if (!root || typeof root !== "object") {
      root = uiIsIndexKey(path[0]) ? [] : {};
    }
    let cur = root;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      let child = cur[key];
      if (!child || typeof child !== "object") {
        const nextKey = path[i + 1];
        child = uiIsIndexKey(nextKey) ? [] : {};
        cur[key] = child;
      }
      cur = child;
    }
    if (Object.is(cur[path[path.length - 1]], unwrapped)) return;
    cur[path[path.length - 1]] = unwrapped;
    access.rawSet(root);
  };
  const uiCreateRodPathModel = (rod, path) => [
    () => uiReadRodPath(rod, path),
    (nextValue) => uiWriteRodPath(rod, path, nextValue)
  ];
  const uiCreateRodPathProxy = (rod, target, path = []) => {
    if (!target || typeof target !== "object") return target;
    let byTarget = uiRodPathProxyCache.get(rod);
    if (!byTarget) {
      byTarget = new WeakMap();
      uiRodPathProxyCache.set(rod, byTarget);
    }
    const cached = byTarget.get(target);
    if (cached) return cached;
    const proxy = new Proxy(target, {
      get(obj, prop, receiver) {
        if (prop === uiRodPathRaw) return obj;
        const value = Reflect.get(obj, prop, receiver);
        if (typeof prop === "symbol") return value;
        const nextPath = path.concat(prop);
        if (value && typeof value === "object") {
          return uiCreateRodPathProxy(rod, value, nextPath);
        }
        if (typeof value === "function") {
          return value.bind(receiver);
        }
        if (uiTrackablePrimitive(value)) {
          uiPushRodPathRead({ rod, path: nextPath, value });
        }
        return value;
      },
      set(obj, prop, value, receiver) {
        const nextValue = uiUnwrapRodPathValue(value);
        const prevValue = Reflect.get(obj, prop, receiver);
        if (Object.is(prevValue, nextValue)) return true;
        const ok = Reflect.set(obj, prop, nextValue, receiver);
        if (ok) {
          const access = uiRodPathAccess.get(rod);
          access?.rawSet(access.rawGet());
        }
        return ok;
      },
      deleteProperty(obj, prop) {
        const hadKey = Reflect.has(obj, prop);
        const ok = Reflect.deleteProperty(obj, prop);
        if (ok && hadKey) {
          const access = uiRodPathAccess.get(rod);
          access?.rawSet(access.rawGet());
        }
        return ok;
      }
    });
    byTarget.set(target, proxy);
    return proxy;
  };
  const uiEnhanceRodPath = (rod) => {
    if (!rod || typeof rod !== "object" || rod.type !== "rod" || rod[uiRodPathEnhanced]) return rod;
    const desc = Object.getOwnPropertyDescriptor(rod, "value");
    if (!desc || typeof desc.get !== "function" || typeof desc.set !== "function") return rod;
    const rawGet = () => desc.get.call(rod);
    const rawSet = (v) => desc.set.call(rod, uiUnwrapRodPathValue(v));
    uiRodPathAccess.set(rod, { rawGet, rawSet });
    Object.defineProperty(rod, "value", {
      get() {
        const raw = rawGet();
        if (!raw || typeof raw !== "object") return raw;
        return uiCreateRodPathProxy(rod, raw, []);
      },
      set(v) {
        rawSet(v);
      },
      configurable: true
    });
    Object.defineProperty(rod, uiRodPathEnhanced, { value: true, configurable: false });
    return rod;
  };
  const uiPatchRodFactory = () => {
    if (typeof window._.rod !== "function" || window._.rod[uiRodPathEnhanced]) return;
    const baseRod = window._.rod;
    const patchedRod = function patchedRod(...args) {
      return uiEnhanceRodPath(baseRod(...args));
    };
    Object.defineProperty(patchedRod, uiRodPathEnhanced, { value: true, configurable: false });
    window._.rod = patchedRod;
  };
  app.ui.withoutRodPathCapture = (fn) => {
    const length = uiRodPathReadBuffer.length;
    try {
      return fn();
    } finally {
      uiRodPathReadBuffer.length = length;
    }
  };
  const uiPatchValueForH = (value, cursor, keyHint = "") => {
    if (Array.isArray(value)) {
      let changed = false;
      const next = value.map((item) => {
        const out = uiPatchValueForH(item, cursor, "");
        if (out !== item) changed = true;
        return out;
      });
      return changed ? next : value;
    }
    if (uiTrackablePrimitive(value)) {
      const entry = uiTakeRodPathMatch(cursor, value);
      if (!entry) return value;
      if (keyHint === "model") return uiCreateRodPathModel(entry.rod, entry.path);
      return () => uiReadRodPath(entry.rod, entry.path);
    }
    if (!uiIsPlainObject(value)) return value;
    let changed = false;
    const out = {};
    for (const key of Object.keys(value)) {
      const next = uiPatchValueForH(value[key], cursor, key);
      out[key] = next;
      if (next !== value[key]) changed = true;
    }
    return changed ? out : value;
  };
  const uiPatchValueForUI = (value, cursor, keyHint = "") => {
    if (Array.isArray(value)) {
      let changed = false;
      const next = value.map((item) => {
        const out = uiPatchValueForUI(item, cursor, "");
        if (out !== item) changed = true;
        return out;
      });
      return changed ? next : value;
    }
    if (uiTrackablePrimitive(value)) {
      const entry = uiTakeRodPathMatch(cursor, value);
      if (!entry) return value;
      if (keyHint === "model") return uiCreateRodPathModel(entry.rod, entry.path);
      return () => uiReadRodPath(entry.rod, entry.path);
    }
    if (!uiIsPlainObject(value)) return value;
    let changed = false;
    const out = {};
    for (const key of Object.keys(value)) {
      const shouldPatch = key === "model" || key === "children";
      const next = shouldPatch ? uiPatchValueForUI(value[key], cursor, key) : value[key];
      out[key] = next;
      if (next !== value[key]) changed = true;
    }
    return changed ? out : value;
  };
  const uiWrapUIFunction = (fn) => {
    if (typeof fn !== "function" || fn[uiRodPathWrappedUI]) return fn;
    const cached = uiWrappedFunctionCache.get(fn);
    if (cached) return cached;
    const wrapped = function uiWrappedComponent(...args) {
      const cursor = uiCreateRodPathCursor();
      if (!cursor) return fn.apply(this, args);
      let changed = false;
      const patchedArgs = args.map((arg) => {
        const out = uiPatchValueForUI(arg, cursor, "");
        if (out !== arg) changed = true;
        return out;
      });
      return fn.apply(this, changed ? patchedArgs : args);
    };
    Object.defineProperty(wrapped, uiRodPathWrappedUI, { value: true, configurable: false });
    uiWrappedFunctionCache.set(fn, wrapped);
    return wrapped;
  };
  const uiInstallUIProxy = () => {
    const uiTarget = app.ui;
    if (!uiTarget || uiTarget[uiRodPathWrappedUI]) return;
    Object.defineProperty(uiTarget, uiRodPathWrappedUI, { value: true, configurable: false });
    for (const key of Object.keys(uiTarget)) {
      if (typeof uiTarget[key] === "function") {
        uiTarget[key] = uiWrapUIFunction(uiTarget[key]);
      }
    }
    app.ui = new Proxy(uiTarget, {
      get(target, prop, receiver) {
        return Reflect.get(target, prop, receiver);
      },
      set(target, prop, value, receiver) {
        const next = typeof value === "function" ? uiWrapUIFunction(value) : value;
        return Reflect.set(target, prop, next, receiver);
      }
    });
  };
  const uiPatchHyperscript = () => {
    if (!window._ || window._[uiRodPathPatchedH]) return;
    Object.defineProperty(window._, uiRodPathPatchedH, { value: true, configurable: false });
    for (const key of Object.keys(window._)) {
      const base = window._[key];
      if (typeof base !== "function") continue;
      window._[key] = function uiWrappedHyperscript(...args) {
        const cursor = uiCreateRodPathCursor();
        if (!cursor) return base.apply(this, args);
        let changed = false;
        const patchedArgs = args.map((arg) => {
          const out = uiPatchValueForH(arg, cursor, "");
          if (out !== arg) changed = true;
          return out;
        });
        return base.apply(this, changed ? patchedArgs : args);
      };
    }
  };

  uiPatchRodFactory();
  if (CMSwift.rod?._all instanceof Set) {
    CMSwift.rod._all.forEach((rod) => uiEnhanceRodPath(rod));
  }
  uiPatchHyperscript();
  uiInstallUIProxy();

  const UI_STATE_ALIASES = {
    error: "danger",
    danger: "danger",
    warn: "warning",
    warning: "warning",
    success: "success",
    info: "info",
    primary: "primary",
    secondary: "secondary",
    light: "light",
    dark: "dark"
  };
  const UI_STATE_TOKENS = new Set(Object.values(UI_STATE_ALIASES));
  const UI_RADIUS_TOKENS = new Set(["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl", "full"]);
