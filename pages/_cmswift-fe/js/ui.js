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
const UI_SHADOW_TOKENS = new Set(["none", "sm", "md", "lg"]);
const sizeMap = {
  xxs: { font: "9px", pad: "2px 5px" },
  xs: { font: "10px", pad: "2px 6px" },
  sm: { font: "11px", pad: "2px 7px" },
  md: { font: "12px", pad: "2px 8px" },
  lg: { font: "13px", pad: "3px 10px" },
  xl: { font: "14px", pad: "4px 12px" },
  xxl: { font: "15px", pad: "5px 14px" },
  xxxl: { font: "16px", pad: "6px 16px" }
};

// normalize color is RGB | RGBA | HEX | color name
const isTokenCSS = (value) => {
  // se la parola contiene un trattino - è un token
  if (value.indexOf("-") > -1) return true;
}
const normalizeState = (value) => {
  if (!value) return "";
  const key = String(value).toLowerCase();
  return UI_STATE_ALIASES[key] || "";
};

const normalizeRadius = (value) => {
  if (value == null) return null;
  const key = String(value).toLowerCase();
  if (key === "full") return "xxxl";
  if (UI_RADIUS_TOKENS.has(key)) return key;
  return null;
};

const normalizeShadow = (value) => {
  if (value === true) return "sm";
  if (value == null || value === false) return null;
  const key = String(value).toLowerCase();
  if (UI_SHADOW_TOKENS.has(key)) return key;
  return null;
};

const isUIPlainObject = (value) => value && typeof value === "object" && !value.nodeType && !Array.isArray(value) && !(value instanceof Function);
const isListItemNode = (value) => value && value.nodeType === 1 && String(value.tagName || "").toLowerCase() === "li";
const asNodeArray = (value) => {
  if (value == null || value === false || value === "") return [];
  return Array.isArray(value) ? value : [value];
};

CMSwift.isUIPlainObject = isUIPlainObject;
CMSwift.isListItemNode = isListItemNode;
CMSwift.asNodeArray = asNodeArray;

const UI_RESPONSIVE_DEVICES = [
  { key: "mobile", aliases: ["mobile", "mobil"], prefix: "cms-" },
  { key: "tablet", aliases: ["tablet"], prefix: "cms-tablet-" },
  { key: "pc", aliases: ["pc", "desktop"], prefix: "cms-pc-" }
];
const UI_RESPONSIVE_PROP_KEYS = UI_RESPONSIVE_DEVICES.flatMap((device) => device.aliases);
const uiResponsiveHasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
const uiResponsivePropsFor = (props = {}, device) => {
  if (!device) return null;
  for (const alias of device.aliases) {
    if (!uiResponsiveHasOwn(props, alias)) continue;
    const value = uiUnwrap(props[alias]);
    if (isUIPlainObject(value)) return value;
  }
  return null;
};
const uiResponsiveHasProp = (props = {}, names) => {
  const list = Array.isArray(names) ? names : [names];
  return UI_RESPONSIVE_DEVICES.some((device) => {
    const deviceProps = uiResponsivePropsFor(props, device);
    return !!deviceProps && list.some((name) => uiResponsiveHasOwn(deviceProps, name));
  });
};
const uiResponsiveNormalizeToken = (value) => String(value).trim().toLowerCase().replace(/\s+/g, "-");
const uiResponsiveClassList = (props = {}, rules = []) => {
  const tokens = [];
  for (const device of UI_RESPONSIVE_DEVICES) {
    const deviceProps = uiResponsivePropsFor(props, device);
    if (!deviceProps) continue;
    for (const rule of rules) {
      const propNames = Array.isArray(rule.prop) ? rule.prop : [rule.prop];
      let hasValue = false;
      let value;
      let propName = "";
      for (const name of propNames) {
        if (!uiResponsiveHasOwn(deviceProps, name)) continue;
        value = uiUnwrap(deviceProps[name]);
        propName = name;
        hasValue = true;
        break;
      }
      if (!hasValue || value == null || value === "" || (value === false && !rule.allowFalse)) continue;
      const resolved = typeof rule.map === "function"
        ? rule.map(value, { propName, props: deviceProps, device, rule })
        : `${rule.class}-${uiResponsiveNormalizeToken(value)}`;
      const list = Array.isArray(resolved) ? resolved : [resolved];
      for (const suffix of list) {
        if (!suffix) continue;
        tokens.push(String(suffix).startsWith("cms-") ? suffix : `${device.prefix}${suffix}`);
      }
    }
  }
  return tokens;
};
const uiResponsiveHasConfig = (props = {}) => {
  return UI_RESPONSIVE_DEVICES.some((device) => !!uiResponsivePropsFor(props, device));
};
const uiResponsiveFirstValue = (props = {}, propNames = []) => {
  for (const propName of propNames) {
    if (!uiResponsiveHasOwn(props, propName)) continue;
    const value = uiUnwrap(props[propName]);
    if (value == null || value === "") continue;
    return value;
  }
  return undefined;
};
const uiResponsiveDefaultValue = (value, rule = {}) => {
  if (value == null || value === "" || (value === false && !rule.allowFalse)) return "";
  if (typeof rule.mapValue === "function") return rule.mapValue(value, rule);
  if (typeof value === "number") return rule.number === "raw" ? String(value) : `${value}px`;
  if (rule.token && typeof value === "string" && CMSwift.uiSizes?.includes(value)) {
    return `var(--cms-${rule.token}-${value})`;
  }
  return String(value);
};
const uiResponsiveSetStyle = (style, name, value) => {
  if (!style || value == null || value === "") return;
  if (typeof style.setProperty === "function") style.setProperty(name, value);
  else style[name] = value;
};
const uiResponsiveVarClass = (deviceKey, varName) => {
  return deviceKey === "mobile" ? `cms-rsp-${varName}` : `cms-rsp-${deviceKey}-${varName}`;
};
const uiResponsiveAddClass = (target, className) => {
  if (!target || !className) return;
  if (target.classList?.add) {
    target.classList.add(className);
    return;
  }
  target.class = uiClass([target.class, className]);
};
const uiApplyResponsiveProps = (target, props = {}, rules = []) => {
  if (!target || !props || !uiResponsiveHasConfig(props)) return target;
  const style = target.style || {};
  let hasResponsiveVars = false;

  for (const rule of rules) {
    const propNames = Array.isArray(rule.prop) ? rule.prop : [rule.prop];
    const setVar = (deviceKey, sourceProps) => {
      const rawValue = uiResponsiveFirstValue(sourceProps, propNames);
      const value = uiResponsiveDefaultValue(rawValue, rule);
      if (!value) return;
      const varName = rule.var || rule.css;
      const prefix = deviceKey === "mobile" ? "--cms-rsp-" : `--cms-rsp-${deviceKey}-`;
      uiResponsiveSetStyle(style, `${prefix}${varName}`, value);
      uiResponsiveAddClass(target, uiResponsiveVarClass(deviceKey, varName));
      hasResponsiveVars = true;
    };

    setVar("mobile", props);
    for (const device of UI_RESPONSIVE_DEVICES) {
      const deviceProps = uiResponsivePropsFor(props, device);
      if (deviceProps) setVar(device.key, deviceProps);
    }
  }

  if (hasResponsiveVars) {
    if (!target.nodeType) target.style = style;
    uiResponsiveAddClass(target, "cms-rsp");
  }
  return target;
};

CMSwift.uiResponsiveDevices = UI_RESPONSIVE_DEVICES;
CMSwift.uiResponsiveOmitProps = UI_RESPONSIVE_PROP_KEYS;
CMSwift.uiResponsivePropsFor = uiResponsivePropsFor;
CMSwift.uiResponsiveHasConfig = uiResponsiveHasConfig;
CMSwift.uiResponsiveHasProp = uiResponsiveHasProp;
CMSwift.uiResponsiveClasses = uiResponsiveClassList;
CMSwift.uiApplyResponsiveProps = uiApplyResponsiveProps;

const uiOmitBase = CMSwift.omit;
CMSwift.omit = (obj, keys = []) => {
  const allKeys = Array.isArray(keys)
    ? keys.concat(UI_RESPONSIVE_PROP_KEYS)
    : UI_RESPONSIVE_PROP_KEYS;
  return uiOmitBase(obj, allKeys);
};

const applyCommonProps = (props = {}) => {
  const classTokens = [];
  const style = {};

  classTokens.push(
    uiWhen(props.clickable, "cms-clickable"),
    uiWhen(props.dense, "cms-dense"),
    uiWhen(props.flat, "cms-flat"),
    uiWhen(props.border, "cms-border"),
    uiWhen(props.glossy, "cms-glossy"),
    uiWhen(props.glow, "cms-glow"),
    uiWhen(props.glass, "cms-glass"),
    uiWhen(props.shadow, "cms-shadow"),
    uiWhen(props.outline, "cms-outline"),
    uiWhen(props.rounded, "cms-rounded"),
    uiWhen(props.gradient, "cms-gradient"),
    uiWhen(props.textGradient, "cms-text-gradient"),
    uiWhen(props.lightShadow, "cms-light-shadow")
  );

  if (uiIsReactive(props.color)) {
    classTokens.push(() => {
      const v = uiUnwrap(props.color);
      const state = normalizeState(v);
      return state ? `cms-state-${state}` : "";
    });
    style.backgroundColor = () => {
      const v = uiUnwrap(props.color);
      const state = normalizeState(v);
      if (state) return "";
      if (v && isTokenCSS(String(v))) return `var(--cms-${v})`;
      return v || "";
    };
  } else {
    const state = normalizeState(props.color);
    if (state) {
      classTokens.push(`cms-state-${state}`);
    } else if (props.color && isTokenCSS(props.color)) {
      style.backgroundColor = `var(--cms-${props.color})`;
    } else if (props.color) {
      style.backgroundColor = props.color;
    }
  }

  // facciamo text color per i token
  if (uiIsReactive(props.textColor)) {
    style.color = () => {
      const v = uiUnwrap(props.textColor);
      if (v && isTokenCSS(String(v))) return `var(--cms-${v})`;
      return v || "";
    };
  } else if (props.textColor && isTokenCSS(props.textColor)) {
    style.color = `var(--cms-${props.textColor})`;
  } else if (props.textColor) {
    style.color = props.textColor;
  }

  if (uiIsReactive(props.size)) {
    classTokens.push(() => {
      const v = uiUnwrap(props.size);
      if (typeof v === "string" && CMSwift.uiSizes?.includes(v)) return `cms-size-${v}`;
      return "";
    });
  } else {
    const size = props.size;
    if (typeof size === "string" && CMSwift.uiSizes?.includes(size)) {
      classTokens.push(`cms-size-${size}`);
    }
  }

  if (uiIsReactive(props.shadow)) {
    classTokens.push(() => {
      const v = uiUnwrap(props.shadow);
      const shadow = normalizeShadow(v);
      return shadow ? `cms-shadow-${shadow}` : "";
    });
    style.boxShadow = () => {
      const v = uiUnwrap(props.shadow);
      const shadow = normalizeShadow(v);
      if (shadow || v == null || v === false) return "";
      return typeof v === "string" ? v : "";
    };
  } else {
    const shadow = normalizeShadow(props.shadow);
    if (shadow) classTokens.push(`cms-shadow-${shadow}`);
    else if (props.shadow && typeof props.shadow === "string") {
      style.boxShadow = props.shadow;
    }
  }

  if (classTokens.length) {
    props.class = uiClass([props.class, ...classTokens]);
  }
  if (Object.keys(style).length) {
    props.style = { ...style, ...(props.style || {}) };
  }
};

const normalizeArgsBase = CMSwift.uiNormalizeArgs;
CMSwift.uiNormalizeArgs = function (args) {
  const out = normalizeArgsBase(args);
  const props = out.props || {};
  if (props && Object.prototype.hasOwnProperty.call(props, "children")) {
    const propChildren = props.children;
    if (!out.children || out.children.length === 0) {
      out.children = Array.isArray(propChildren) ? propChildren : [propChildren];
    }
    delete props.children;
  }
  applyCommonProps(props);
  return out;
};

// --------------------------------
// 2) UI PRIMITIVES (layout + atoms)
// --------------------------------
const UI = window._;

/*
UI.Row
UI.Col
UI.Spacer
UI.Container
UI.Card
UI.Btn
UI.Input
UI.Select
UI.Layout
UI.Footer
UI.Toolbar
UI.Grid
UI.GridCol
UI.Icon
UI.Badge
UI.Avatar
UI.Chip
UI.Tooltip
UI.List
UI.Item
UI.Separator
UI.Checkbox
UI.Radio
UI.Toggle
UI.Slider
UI.Rating
UI.Datepicker
UI.Calendar
UI.Date
UI.Time
UI.Tabs
UI.RouteTab
UI.Breadcrumbs
UI.Pagination
UI.Spinner
UI.Progress
UI.LoadingBar
UI.Banner
UI.Header
UI.Drawer
UI.Page
UI.AppShell
UI.Parallax
*/

const META_PROP_DESCRIPTIONS = {
  actions: "Content rendered in the action area, typically in a footer or trailing region.",
  active: "Marks the item as active/selected and applies active styling/ARIA when relevant.",
  align: "Alignment of content along the cross axis (e.g. left/center/right).",
  allowCustom: "Allows values not present in the options list.",
  allowCustomValue: "Accepts free-form values in addition to predefined options.",
  aside: "Content or configuration for the aside/secondary region.",
  auto: "Enables automatic sizing or layout behavior instead of fixed sizing.",
  autocomplete: "Native autocomplete attribute for input elements.",
  backdrop: "Whether to render a backdrop overlay behind the component.",
  bgClass: "Additional CSS classes applied to the background layer.",
  bgPosition: "CSS background-position value for the background image/layer.",
  bgSize: "CSS background-size value for the background image/layer.",
  cardClass: "Additional CSS classes applied to the card container.",
  checked: "Checked state for toggleable controls (controlled).",
  class: "Additional CSS classes applied to the component root element.",
  clearable: "Shows a clear action to reset the current value.",
  clickable: "Enables pointer/hover styles and click handling on the component.",
  closeOnEsc: "Closes the component when the Escape key is pressed.",
  closeOnOutside: "Closes the component when clicking outside its bounds.",
  closeOnSelect: "Closes the menu/popover after selecting an item.",
  color: "Semantic color name used to style the component.",
  cols: "Number of columns for grid layouts.",
  columns: "Column definitions for table-like components.",
  content: "Main content node(s) or render function for the component body.",
  contentClass: "Additional CSS classes applied to the content container.",
  control: "Custom control element or render function for the input area.",
  children: "Default child content (nodes, arrays, or render function).",
  delay: "Delay in milliseconds before showing or hiding.",
  dense: "Uses compact spacing and sizing.",
  disabled: "Disables interaction and applies disabled styling/ARIA.",
  divider: "Shows dividers between items or sections.",
  drawer: "Content or configuration for the drawer region.",
  drawerBreakpoint: "Viewport width where the drawer switches behavior (overlay vs persistent).",
  drawerCloseIcon: "Icon used for the drawer close control.",
  drawerOpen: "Controls whether the drawer is open (controlled).",
  drawerOpenIcon: "Icon used for the drawer open control.",
  drawerStateKey: "Storage key used to persist drawer open state.",
  drawerWidth: "Drawer width (number interpreted as px or CSS length).",
  elevated: "Applies elevated shadow/raised styling.",
  emptyText: "Text shown when there is no data to display.",
  error: "Error state or message displayed with the component.",
  escClose: "Alias for close-on-escape behavior.",
  filterPlaceholder: "Placeholder text for the filter/search input.",
  filterable: "Enables filtering UI for option lists.",
  flat: "Removes elevation/border for a flat look.",
  footer: "Footer content node(s) or render function.",
  form: "HTML form attribute to associate controls with a form.",
  gap: "Gap/spacing between child elements.",
  getValue: "Function to extract a value from an item object.",
  groupCloseIcon: "Icon used to collapse grouped items.",
  groupOpenIcon: "Icon used to expand grouped items.",
  header: "Header content node(s) or render function.",
  height: "Explicit height (number interpreted as px or CSS length).",
  hint: "Helper text shown near the control.",
  icon: "Icon name or node rendered with the component.",
  iconRight: "Icon name or node rendered on the right side of the component.",
  iconAlign: "Position of the icon relative to the label.",
  initialSort: "Initial sort configuration for table data.",
  inputmode: "Native inputmode attribute hint for virtual keyboards.",
  items: "Array of items or nodes to render.",
  justify: "Justification of items along the main axis.",
  label: "Label text or node for the component.",
  left: "Content or configuration for the left region.",
  lg: "Column span at large breakpoint.",
  loading: "Shows loading state and disables interactions where appropriate.",
  loadingText: "Text displayed while loading.",
  lockScroll: "Prevents body scroll while an overlay is open.",
  max: "Maximum value for range-based controls.",
  md: "Column span at medium breakpoint.",
  message: "Message text shown in banners/alerts.",
  min: "Minimum value for range-based controls.",
  mobile: "Responsive overrides applied at the base/mobile viewport.",
  model: "Two-way bound value (alias to value in some components).",
  multi: "Enables multi-selection behavior.",
  multiple: "Allows selecting multiple values.",
  name: "HTML name attribute for form submission.",
  noDrawer: "Disables rendering of the drawer region.",
  note: "Secondary note text.",
  number: "Forces numeric input/formatting where supported.",
  offset: "General offset for positioning.",
  offsetX: "Horizontal offset for overlay placement in pixels.",
  offsetY: "Vertical offset for overlay placement in pixels.",
  onBlur: "Callback fired when the control loses focus.",
  onChange: "Callback fired when the value or selection changes.",
  onClear: "Callback fired when the clear action is used.",
  onClose: "Callback fired when the component closes.",
  onFocus: "Callback fired when the control gains focus.",
  onInput: "Callback fired on input events or while typing.",
  onOpen: "Callback fired when the component opens.",
  onRemove: "Callback fired when an item is removed.",
  onSubmit: "Callback fired when a form is submitted.",
  open: "Controls open/visible state (controlled).",
  options: "Array of selectable options or option groups.",
  outline: "Uses outlined visual style.",
  overlay: "Renders content in an overlay layer or portal.",
  overlayClose: "Closes the overlay when the backdrop is clicked.",
  page: "Current page index (1-based unless documented otherwise).",
  pageSize: "Number of items per page.",
  padding: "Padding applied to the component root element.",
  persistent: "Prevents closing via outside click or Escape.",
  pc: "Responsive overrides applied from the desktop breakpoint upward.",
  placeholder: "Placeholder text for inputs.",
  placement: "Overlay placement relative to the target/anchor.",
  prefix: "Content rendered before the main control.",
  readonly: "Prevents editing while keeping focus and selection.",
  removable: "Shows a remove affordance for chips/items.",
  right: "Content or configuration for the right region.",
  rowKey: "Key or function used to derive unique row IDs.",
  rows: "Row data array for table-like components.",
  margin: "Margin applied to the component root element.",
  maxHeight: "Maximum height constraint (number interpreted as px or CSS length).",
  maxWidth: "Maximum width constraint (number interpreted as px or CSS length).",
  minHeight: "Minimum height constraint (number interpreted as px or CSS length).",
  minWidth: "Minimum width constraint (number interpreted as px or CSS length).",
  radius: "Border radius token or CSS length applied to the component.",
  borderRadius: "Border radius token or CSS length applied to the component.",
  separator: "Separator string/node between items.",
  shortcode: "Keyboard shortcut string, object, or array bound to the component action.",
  showShortcode: "Displays the configured keyboard shortcut badge when the component supports it.",
  showLabel: "Whether to render the label text.",
  size: "Size token, number, or CSS length for sizing.",
  slots: "Named slots map for render overrides.",
  sm: "Column span at small breakpoint.",
  span: "Column span within a grid.",
  speed: "Animation speed or duration in milliseconds.",
  square: "Use square corners instead of rounded.",
  src: "Image source URL.",
  startTop: "Starting scroll offset for parallax effects.",
  stateKey: "Storage key used to persist component state.",
  step: "Step increment for numeric controls.",
  sticky: "Makes the component sticky within its container.",
  stickyAside: "Keeps the aside region sticky during scroll.",
  stickyFooter: "Keeps the footer region sticky during scroll.",
  stickyHeader: "Keeps the header region sticky during scroll.",
  striped: "Applies striped row styling.",
  style: "Inline styles applied to the component root element.",
  subtitle: "Subtitle text or node.",
  success: "Marks the component with success state styling.",
  suffix: "Content rendered after the main control.",
  tableClass: "Additional CSS classes applied to the table element.",
  tablet: "Responsive overrides applied from the tablet breakpoint upward.",
  tabs: "Tab definitions array.",
  tagPage: "Query parameter name used to read/write the current page.",
  target: "Target element or anchor used for positioning.",
  text: "Text content for simple components.",
  thickness: "Stroke/line thickness for progress indicators.",
  title: "Title text or node.",
  to: "Navigation target/route to open on click.",
  topLabel: "Label displayed above the control.",
  trapFocus: "Keeps focus trapped inside the dialog/popover.",
  type: "Variant or native input type.",
  value: "Current value (controlled).",
  vertical: "Vertical orientation instead of horizontal.",
  warning: "Marks the component with warning state styling.",
  width: "Explicit width (number interpreted as px or CSS length).",
  wrap: "Allows children to wrap to new lines.",
  wrapClass: "Additional CSS classes applied to the outer wrapper.",
  zIndex: "z-index for overlay stacking.",
  shadow: "Shadow token or CSS box-shadow string applied to the component.",
};

const META_SLOT_DESCRIPTIONS = {
  actions: "Slot for action buttons or links.",
  arrow: "Slot for the tooltip/popover arrow element.",
  aside: "Slot for aside/secondary content.",
  center: "Slot for centered content within a toolbar/row.",
  clear: "Slot for the clear control/content.",
  content: "Slot for the main body content.",
  control: "Slot for custom control/input rendering.",
  default: "Primary content for the component.",
  drawer: "Slot for drawer content.",
  empty: "Slot for empty-state content.",
  errorMessage: "Slot for custom error message rendering.",
  filter: "Slot for custom filter/search UI.",
  footer: "Slot for footer content.",
  group: "Slot for grouped content container.",
  groupLabel: "Slot for group label content.",
  header: "Slot for header content.",
  hint: "Slot for helper/hint text.",
  icon: "Slot for icon content.",
  iconRight: "Slot for right-aligned icon content.",
  input: "Slot for custom input element/content.",
  item: "Slot for custom item rendering.",
  itemLabel: "Slot for item label rendering.",
  label: "Slot for label content.",
  left: "Slot for left-aligned content.",
  loading: "Slot for loading state content.",
  message: "Slot for message/alert content.",
  next: "Slot for the next-page control.",
  note: "Slot for note/secondary text.",
  option: "Slot for custom option rendering.",
  page: "Slot for page indicator/content.",
  prefix: "Slot for prefix content.",
  prev: "Slot for the previous-page control.",
  right: "Slot for right-aligned content.",
  separator: "Slot for separator rendering between items.",
  star: "Slot for custom star icon/content in rating.",
  subtitle: "Slot for subtitle content.",
  success: "Slot for success message/content.",
  suffix: "Slot for suffix content.",
  tab: "Slot for custom tab label/content.",
  target: "Slot for custom target/anchor element.",
  title: "Slot for title content.",
  topLabel: "Slot for top label content.",
  warning: "Slot for warning message/content."
};

const META_PROP_DEFAULTS = {
  dense: false,
  disabled: false,
  readonly: false,
  outline: false,
  clickable: false,
  flat: false,
  elevated: false
};
const DEFAULT_SIZE = [...CMSwift.uiSizes];
const DEFAULT_COLOR = [...CMSwift.uiColors];
const META_PROP_VALUES = {
  size: ["number", "CSS units", ...DEFAULT_SIZE],
  color: DEFAULT_COLOR,
  padding: ["number", "CSS units", ...DEFAULT_SIZE],
  margin: ["number", "CSS units", ...DEFAULT_SIZE],
  width: ["number", "CSS units", ...DEFAULT_SIZE],
  minWidth: ["number", "CSS units", ...DEFAULT_SIZE],
  maxWidth: ["number", "CSS units", ...DEFAULT_SIZE],
  height: ["number", "CSS units", ...DEFAULT_SIZE],
  minHeight: ["number", "CSS units", ...DEFAULT_SIZE],
  maxHeight: ["number", "CSS units", ...DEFAULT_SIZE],
  iconAlign: ["left", "right", "before", "after"],
  align: ["left", "center", "right"],
  justify: ["start", "center", "end", "space-between", "space-around", "space-evenly"],
  placement: ["top", "bottom", "left", "right", "top-start", "top-end", "bottom-start", "bottom-end"],
  type: DEFAULT_COLOR,
  shadow: ["none", ...DEFAULT_SIZE],
  outline: ["number", "CSS units", ...DEFAULT_SIZE],
  borderRadius: ["number", "CSS units", ...DEFAULT_SIZE],
  radius: ["number", "CSS units", ...DEFAULT_SIZE],
  icon: ["#name_tabler", "name_material", "class"],
  iconRight: ["#name_tabler", "name_material", "class"]
};

const META_PROP_CATEGORIES = {
  class: "style",
  style: "style",
  size: "style",
  color: "style",
  outline: "style",
  shadow: "style",
  borderRadius: "style",
  radius: "style",
  padding: "layout",
  margin: "layout",
  width: "layout",
  minWidth: "layout",
  maxWidth: "layout",
  height: "layout",
  minHeight: "layout",
  maxHeight: "layout",
  mobile: "layout",
  tablet: "layout",
  pc: "layout",
  dense: "layout",
  flat: "style",
  elevated: "style",
  clickable: "behavior",
  disabled: "state",
  readonly: "state",
  loading: "state",
  active: "state",
  error: "state",
  success: "state",
  warning: "state",
  note: "state",
  hint: "state",
  value: "data",
  model: "data",
  items: "data",
  options: "data",
  rows: "data",
  columns: "data",
  onClick: "events",
  onChange: "events",
  onInput: "events",
  onFocus: "events",
  onBlur: "events",
  onSubmit: "events"
};

const normalizeMetaType = (value) => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "unknown";
  return value.type || value.signature || value.value || "unknown";
};

const fallbackMetaDescription = (name, kind) => {
  if (kind === "slot") {
    return `Slot content for "${name}". Accepts nodes, arrays, or render functions.`;
  }
  return `Component configuration for "${name}". When not handled internally, it is forwarded to the root element.`;
};

const normalizeMetaFields = (fields, descriptions, kind) => {
  if (!fields || typeof fields !== "object") return fields;
  const out = {};
  for (const [name, value] of Object.entries(fields)) {
    const description = descriptions[name] || fallbackMetaDescription(name, kind);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const type = normalizeMetaType(value);
      out[name] = {
        ...value,
        type,
        description: value.description || description,
        default: Object.prototype.hasOwnProperty.call(value, "default") ? value.default : (META_PROP_DEFAULTS[name] ?? null),
        values: value.values || META_PROP_VALUES[name] || null,
        category: value.category || META_PROP_CATEGORIES[name] || (kind === "slot" ? "slot" : "general")
      };
    } else {
      const type = normalizeMetaType(value);
      out[name] = {
        type,
        description,
        default: META_PROP_DEFAULTS[name] ?? null,
        values: META_PROP_VALUES[name] || null,
        category: META_PROP_CATEGORIES[name] || (kind === "slot" ? "slot" : "general")
      };
    }
  }
  return out;
};

const normalizeMetaEntry = (componentName, meta) => {
  if (!meta || typeof meta !== "object") return meta;
  if (!meta.props || typeof meta.props !== "object" || Array.isArray(meta.props)) {
    meta.props = meta.props && typeof meta.props === "object" && !Array.isArray(meta.props) ? meta.props : {};
  }
  if (!Object.prototype.hasOwnProperty.call(meta.props, "children")) {
    meta.props.children = "Node|Array|Function";
  }
  const commonProps = {
    size: meta.props.size || "string|number",
    color: meta.props.color || "string",
    outline: meta.props.outline || "boolean",
    clickable: meta.props.clickable || "boolean",
    padding: meta.props.padding || "string|number",
    margin: meta.props.margin || "string|number",
    width: meta.props.width || "string|number",
    minWidth: meta.props.minWidth || "string|number",
    maxWidth: meta.props.maxWidth || "string|number",
    height: meta.props.height || "string|number",
    minHeight: meta.props.minHeight || "string|number",
    maxHeight: meta.props.maxHeight || "string|number",
    radius: meta.props.radius || "string|number",
    borderRadius: meta.props.borderRadius || "string|number",
    shadow: meta.props.shadow || "string|boolean",
    mobile: meta.props.mobile || "object",
    tablet: meta.props.tablet || "object",
    pc: meta.props.pc || "object",
    class: meta.props.class || "string",
    style: meta.props.style || "object"
  };
  meta.props = { ...commonProps, ...meta.props };
  if (meta.props.icon && !meta.props.iconRight) {
    meta.props.iconRight = meta.props.icon;
  }
  if (meta.props) meta.props = normalizeMetaFields(meta.props, META_PROP_DESCRIPTIONS, "prop");
  if (meta.slots) meta.slots = normalizeMetaFields(meta.slots, META_SLOT_DESCRIPTIONS, "slot");
  if (meta.slots && meta.slots.icon && !meta.slots.iconRight) {
    meta.slots.iconRight = { type: meta.slots.icon?.type || "Node|Array|Function", description: "Slot for right-aligned icon content." };
  }
  if (!meta.description) {
    meta.description = `${componentName} component meta definition.`;
  }
  return meta;
};

const ensureMetaProxy = () => {
  if (app.ui._metaProxyInstalled) return;
  app.ui._metaProxyInstalled = true;
  const target = app.ui.meta || {};
  for (const key of Object.keys(target)) {
    normalizeMetaEntry(key, target[key]);
  }
  const proxy = new Proxy(target, {
    set(obj, prop, value) {
      if (typeof prop === "symbol") {
        obj[prop] = value;
        return true;
      }
      obj[prop] = normalizeMetaEntry(prop, value);
      return true;
    }
  });
  app.ui.meta = proxy;
  UI.meta = proxy;
};

if (app.isDev?.()) {
  ensureMetaProxy();
}

function flattenSlotValue(value) {
  if (!value) return null;
  if (!Array.isArray(value)) return value;
  const out = [];
  const stack = value.slice();
  while (stack.length) {
    const item = stack.shift();
    if (!item) continue;
    if (Array.isArray(item)) stack.unshift(...item);
    else out.push(item);
  }
  return out.length ? out : null;
}
const STYLE_PROP_TOKEN_MAP = {
  padding: "p",
  paddingTop: "p",
  paddingRight: "p",
  paddingBottom: "p",
  paddingLeft: "p",
  paddingInline: "p",
  paddingInlineStart: "p",
  paddingInlineEnd: "p",
  paddingBlock: "p",
  paddingBlockStart: "p",
  paddingBlockEnd: "p",
  margin: "m",
  marginTop: "m",
  marginRight: "m",
  marginBottom: "m",
  marginLeft: "m",
  marginInline: "m",
  marginInlineStart: "m",
  marginInlineEnd: "m",
  marginBlock: "m",
  marginBlockStart: "m",
  marginBlockEnd: "m",
  width: "w",
  minWidth: "w",
  maxWidth: "w",
  height: "h",
  minHeight: "h",
  maxHeight: "h"
};
const uiResponsiveWrapValue = (value) => {
  if (value === true) return "wrap";
  if (value === false) return "nowrap";
  return String(value);
};
const uiResponsiveGridColsValue = (value) => {
  if (typeof value === "number") return `repeat(${Math.max(1, Math.round(value))}, minmax(0, 1fr))`;
  return String(value);
};
const uiResponsiveGridFlowValue = (value) => {
  const flow = String(value).trim().toLowerCase().replace("-", " ");
  return flow;
};
const UI_RESPONSIVE_STYLE_RULES = [
  { prop: "display", css: "display", var: "display" },
  { prop: "direction", css: "flex-direction", var: "flex-direction" },
  { prop: "wrap", css: "flex-wrap", var: "flex-wrap", allowFalse: true, mapValue: uiResponsiveWrapValue },
  { prop: "align", css: "align-items", var: "align-items" },
  { prop: "justify", css: "justify-content", var: "justify-content" },
  { prop: "self", css: "align-self", var: "align-self" },
  { prop: "justifySelf", css: "justify-self", var: "justify-self" },
  { prop: "place", css: "place-items", var: "place-items" },
  { prop: "placeSelf", css: "place-self", var: "place-self" },
  { prop: ["cols", "columns"], css: "grid-template-columns", var: "grid-template-columns", mapValue: uiResponsiveGridColsValue },
  { prop: "rows", css: "grid-template-rows", var: "grid-template-rows", mapValue: uiResponsiveGridColsValue },
  { prop: "flow", css: "grid-auto-flow", var: "grid-auto-flow", mapValue: uiResponsiveGridFlowValue },
  { prop: "autoRows", css: "grid-auto-rows", var: "grid-auto-rows" },
  { prop: ["span", "gridColumn"], css: "grid-column", var: "grid-column", number: "raw" },
  { prop: ["row", "rowSpan"], css: "grid-row", var: "grid-row", number: "raw" },
  { prop: "area", css: "grid-area", var: "grid-area" },
  { prop: "gap", css: "gap", var: "gap", token: "gap" },
  { prop: "rowGap", css: "row-gap", var: "row-gap", token: "gap" },
  { prop: ["columnGap", "colGap"], css: "column-gap", var: "column-gap", token: "gap" },
  { prop: "width", css: "width", var: "width", token: "w" },
  { prop: "minWidth", css: "min-width", var: "min-width", token: "min-w" },
  { prop: "maxWidth", css: "max-width", var: "max-width", token: "max-w" },
  { prop: "height", css: "height", var: "height", token: "h" },
  { prop: "minHeight", css: "min-height", var: "min-height", token: "min-h" },
  { prop: "maxHeight", css: "max-height", var: "max-height", token: "max-h" },
  { prop: "padding", css: "padding", var: "padding", token: "p" },
  { prop: "paddingLeft", css: "padding-left", var: "padding-left", token: "p" },
  { prop: "paddingRight", css: "padding-right", var: "padding-right", token: "p" },
  { prop: "paddingTop", css: "padding-top", var: "padding-top", token: "p" },
  { prop: "paddingBottom", css: "padding-bottom", var: "padding-bottom", token: "p" },
  { prop: "margin", css: "margin", var: "margin", token: "m" },
  { prop: "marginLeft", css: "margin-left", var: "margin-left", token: "m" },
  { prop: "marginRight", css: "margin-right", var: "margin-right", token: "m" },
  { prop: "marginTop", css: "margin-top", var: "margin-top", token: "m" },
  { prop: "marginBottom", css: "margin-bottom", var: "margin-bottom", token: "m" },
  { prop: "fontSize", css: "font-size", var: "font-size", token: "f" },
  { prop: "fontWeight", css: "font-weight", var: "font-weight", token: "fw", number: "raw" },
  { prop: "lineHeight", css: "line-height", var: "line-height", token: "lh", number: "raw" },
  { prop: "letterSpacing", css: "letter-spacing", var: "letter-spacing", token: "ls" },
  { prop: ["borderRadius", "radius"], css: "border-radius", var: "border-radius", token: "r" },
  { prop: "overflow", css: "overflow", var: "overflow" },
  { prop: "order", css: "order", var: "order", number: "raw" },
];
const UI_RESPONSIVE_COMMON_STYLE_RULES = UI_RESPONSIVE_STYLE_RULES.filter((rule) => {
  const props = Array.isArray(rule.prop) ? rule.prop : [rule.prop];
  return props.some((prop) => Object.prototype.hasOwnProperty.call(STYLE_PROP_TOKEN_MAP, prop))
    || props.includes("fontSize")
    || props.includes("fontWeight")
    || props.includes("lineHeight")
    || props.includes("letterSpacing")
    || props.includes("borderRadius")
    || props.includes("radius");
});
CMSwift.uiResponsiveStyleRules = UI_RESPONSIVE_STYLE_RULES;
CMSwift.uiResponsiveCommonStyleRules = UI_RESPONSIVE_COMMON_STYLE_RULES;
const camelToCssProperty = (name) => name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const applyStyleProp = (obj, value, name, tokenName) => {
  if (value == null || value === false || value === "") return;
  obj.style.setProperty(camelToCssProperty(name), unitCover(value, tokenName));
};
function setPropertyProps(obj, props) {
  if (props.size) {
    if (typeof props.size === "number") {
      obj.style.setProperty("--cms-font-size", `${props.size}px`);
    } else if (CMSwift.uiSizes.includes(props.size)) {
      obj.style.setProperty("--cms-font-size", `var(--cms-font-size-${props.size})`);
    }
  }

  Object.entries(STYLE_PROP_TOKEN_MAP).forEach(([name, tokenName]) => {
    if (uiResponsiveHasProp(props, name)) return;
    applyStyleProp(obj, props[name], name, tokenName);
  });
  uiApplyResponsiveProps(obj, props, UI_RESPONSIVE_COMMON_STYLE_RULES);

  // gradient
  if (props.gradient) {
    if (typeof props.gradient == "number") {
      obj.style.setProperty("--set-gradient-deg", `${props.gradient}deg`);
    }
  }
  // radius
  if (props.radius) {
    if (typeof props.radius == "number") {
      obj.style.setProperty("--set-border-radius", `${props.radius}px`);
    } else if (CMSwift.uiSizes.includes(props.radius)) {
      obj.style.setProperty("--set-border-radius", `var(--cms-r-${props.radius})`);
    } else {
      obj.style.setProperty("--set-border-radius", `${props.radius}`);
    }
  }

}

function uiOptionNode(props = {}, ...children) {
  const el = document.createElement("option");
  if (props && typeof props === "object") {
    if (props.value != null) el.value = String(props.value);
    if (props.label != null) el.label = String(props.label);
    if (props.disabled != null) el.disabled = !!props.disabled;
    if (props.selected != null) el.selected = !!props.selected;
    if (props.class != null) el.className = String(props.class);
  }
  const content = children.flat ? children.flat(Infinity) : children;
  if (content.length) {
    content.forEach((child) => {
      if (child == null || child === false) return;
      if (child instanceof Node) el.appendChild(child);
      else el.appendChild(document.createTextNode(String(child)));
    });
  } else if (props && props.text != null) {
    el.textContent = String(props.text);
  }
  return el;
}

CMSwift.ui.getSlot = (slots, name) => {
  if (!slots) return null;
  return Object.prototype.hasOwnProperty.call(slots, name) ? slots[name] : null;
};

CMSwift.ui.renderSlot = (slots, name, ctx, fallback) => {
  const slot = CMSwift.ui.getSlot(slots, name);
  const hasSlot = slot !== null && slot !== undefined;
  const raw = hasSlot ? (typeof slot === "function" ? slot(ctx || {}) : slot) : fallback;
  if (raw == null) return null;
  return flattenSlotValue(CMSwift.ui.slot(raw));
};

const renderSlotToArray = (slots, name, ctx, fallback) => {
  const v = CMSwift.ui.renderSlot(slots, name, ctx, fallback);
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
};

const UI_SHORTCODE_REGISTRY = new Set();
let uiShortcodeListenerAttached = false;
const UI_SHORTCODE_MODIFIERS = new Set(["ctrl", "alt", "shift", "meta"]);
const UI_SHORTCODE_ALIASES = {
  control: "ctrl",
  ctl: "ctrl",
  option: "alt",
  opt: "alt",
  command: "meta",
  cmd: "meta",
  "⌘": "meta",
  "⌃": "ctrl",
  "⌥": "alt",
  "⇧": "shift",
  esc: "escape",
  return: "enter",
  plus: "+",
  spacebar: "space",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
  del: "delete"
};
const UI_SHORTCODE_DISPLAY = {
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  meta: "Meta",
  escape: "Esc",
  enter: "Enter",
  tab: "Tab",
  space: "Space",
  backspace: "Backspace",
  delete: "Del",
  arrowup: "Up",
  arrowdown: "Down",
  arrowleft: "Left",
  arrowright: "Right",
  pageup: "PgUp",
  pagedown: "PgDn"
};

const uiIsApplePlatform = () => {
  if (typeof navigator === "undefined") return false;
  const platform = String(navigator.platform || navigator.userAgent || "");
  return /(mac|iphone|ipad|ipod)/i.test(platform);
};

const uiNormalizeShortcodeToken = (token) => {
  if (token == null) return "";
  const raw = String(token).trim().toLowerCase();
  if (!raw) return "";
  return UI_SHORTCODE_ALIASES[raw] || raw;
};

const uiParseShortcode = (rawValue) => {
  if (rawValue == null || rawValue === false) return null;
  const source = String(rawValue).trim();
  if (!source) return null;

  const parts = source
    .split("+")
    .map(uiNormalizeShortcodeToken)
    .filter(Boolean);

  if (!parts.length) return null;

  const spec = {
    raw: source,
    key: "",
    ctrl: false,
    alt: false,
    shift: false,
    meta: false
  };

  parts.forEach((part) => {
    if (part === "mod") {
      if (uiIsApplePlatform()) spec.meta = true;
      else spec.ctrl = true;
      return;
    }
    if (UI_SHORTCODE_MODIFIERS.has(part)) {
      spec[part] = true;
      return;
    }
    spec.key = part;
  });

  if (!spec.key) return null;
  return spec;
};

const uiNormalizeShortcodeList = (rawValue) => {
  if (rawValue == null || rawValue === false) return [];
  const list = Array.isArray(rawValue) ? rawValue : [rawValue];
  return list.map((item) => {
    if (item == null || item === false) return null;
    if (typeof item === "object" && !Array.isArray(item)) {
      const parsed = uiParseShortcode(item.shortcode ?? item.shortcut ?? item.keys ?? item.key);
      return parsed ? { ...item, ...parsed } : null;
    }
    const parsed = uiParseShortcode(item);
    return parsed ? { ...parsed } : null;
  }).filter(Boolean);
};

const uiResolveShortcodeList = (props = {}) =>
  uiNormalizeShortcodeList(props.shortcode ?? props.shortcut ?? props.hotkey ?? props.keys);

const uiIsShortcodeVisible = (props = {}) =>
  props.showShortcode === true || props.showShortcut === true;

const uiFormatShortcodeKey = (key) => {
  const normalized = uiNormalizeShortcodeToken(key);
  if (!normalized) return "";
  const display = { ...UI_SHORTCODE_DISPLAY };
  if (uiIsApplePlatform()) {
    display.alt = "Option";
    display.meta = "Cmd";
  }
  if (display[normalized]) return display[normalized];
  if (normalized.length === 1) return normalized.toUpperCase();
  return normalized.replace(/(^|[-_ ])(\w)/g, (_, prefix, char) => `${prefix}${char.toUpperCase()}`);
};

const uiFormatShortcode = (spec) => {
  if (!spec) return "";
  const parts = [];
  if (spec.ctrl) parts.push(uiFormatShortcodeKey("ctrl"));
  if (spec.alt) parts.push(uiFormatShortcodeKey("alt"));
  if (spec.shift) parts.push(uiFormatShortcodeKey("shift"));
  if (spec.meta) parts.push(uiFormatShortcodeKey("meta"));
  parts.push(uiFormatShortcodeKey(spec.key));
  return parts.filter(Boolean).join("+");
};

const uiFormatShortcodeList = (specs) =>
  (Array.isArray(specs) ? specs : []).map(uiFormatShortcode).filter(Boolean).join(" / ");

const uiCreateShortcodeHint = (props = {}, options = {}) => {
  const specs = uiResolveShortcodeList(props);
  if (!uiIsShortcodeVisible(props) || !specs.length || typeof document === "undefined") return null;
  const node = document.createElement("span");
  node.className = options.className || "cms-shortcode";
  node.setAttribute("aria-hidden", "true");
  node.textContent = uiFormatShortcodeList(specs);
  return node;
};

const uiIsEditableEventTarget = (target) => {
  const el = target?.nodeType === 1 ? target : target?.parentElement;
  if (!el || typeof el.closest !== "function") return false;
  if (el.isContentEditable) return true;
  const editable = el.closest("input, textarea, select, [contenteditable], [contenteditable='true'], [contenteditable='plaintext-only']");
  if (!editable) return false;
  if ("disabled" in editable && editable.disabled) return false;
  return true;
};

const uiEventMatchesShortcode = (event, spec) => {
  if (!event || !spec) return false;
  if (!!event.ctrlKey !== !!spec.ctrl) return false;
  if (!!event.altKey !== !!spec.alt) return false;
  if (!!event.shiftKey !== !!spec.shift) return false;
  if (!!event.metaKey !== !!spec.meta) return false;
  return uiNormalizeShortcodeToken(event.key) === spec.key;
};

const uiDetachShortcodeListenerIfEmpty = () => {
  if (UI_SHORTCODE_REGISTRY.size || !uiShortcodeListenerAttached || typeof document === "undefined") return;
  document.removeEventListener("keydown", uiHandleShortcodeKeydown, true);
  uiShortcodeListenerAttached = false;
};

function uiHandleShortcodeKeydown(event) {
  if (!UI_SHORTCODE_REGISTRY.size || !event || event.defaultPrevented || event.isComposing) return;

  const isEditable = uiIsEditableEventTarget(event.target);
  const bindings = Array.from(UI_SHORTCODE_REGISTRY);

  for (let index = bindings.length - 1; index >= 0; index -= 1) {
    const binding = bindings[index];
    const anchor = binding?.anchor;
    if (!anchor || !anchor.isConnected) {
      UI_SHORTCODE_REGISTRY.delete(binding);
      continue;
    }
    if (binding.isEnabled?.() === false) continue;

    const matched = binding.specs.find((spec) => {
      const allowInEditable = spec.allowInEditable ?? binding.allowInEditable ?? false;
      if (isEditable && !allowInEditable) return false;
      return uiEventMatchesShortcode(event, spec);
    });

    if (!matched) continue;

    const shouldPreventDefault = matched.preventDefault ?? binding.preventDefault ?? true;
    const shouldStopPropagation = matched.stopPropagation ?? binding.stopPropagation ?? true;
    if (shouldPreventDefault) event.preventDefault();
    if (shouldStopPropagation) event.stopPropagation();

    const result = binding.action?.(event, matched, anchor);
    if (result !== false) break;
  }

  uiDetachShortcodeListenerIfEmpty();
}

const uiRegisterShortcode = (anchor, props = {}, options = {}) => {
  const specs = uiResolveShortcodeList(props);
  if (!anchor || !specs.length || typeof document === "undefined") return null;

  const binding = {
    anchor,
    specs,
    action: typeof options.action === "function" ? options.action : () => anchor.click?.(),
    isEnabled: typeof options.isEnabled === "function" ? options.isEnabled : null,
    allowInEditable: !!options.allowInEditable,
    preventDefault: options.preventDefault ?? true,
    stopPropagation: options.stopPropagation ?? true
  };

  UI_SHORTCODE_REGISTRY.add(binding);

  if (!uiShortcodeListenerAttached) {
    document.addEventListener("keydown", uiHandleShortcodeKeydown, true);
    uiShortcodeListenerAttached = true;
  }

  const dispose = () => {
    UI_SHORTCODE_REGISTRY.delete(binding);
    uiDetachShortcodeListenerIfEmpty();
  };

  CMSwift._registerCleanup(anchor, dispose);
  return dispose;
};

const uiFocusShortcutTarget = (target, options = {}) => {
  if (!target || typeof target.focus !== "function") return false;
  try {
    target.focus({ preventScroll: options.preventScroll ?? true });
  } catch {
    target.focus();
  }
  if (options.selectText && typeof target.select === "function") {
    try { target.select(); } catch { }
  }
  return true;
};

const unitCover = (v, name = 'size') => {
  if (typeof v === "number") return v + "px";
  if (CMSwift.uiSizes.includes(v)) return `var(--cms-${name}-${v})`;
  if (typeof v === "string") return v;
  return v;
};

  const uiResponsiveToken = (className, tokenSet = CMSwift.uiSizes) => (value) => {
    const key = String(value).trim();
    return tokenSet?.includes(key) ? `${className}-${key}` : "";
  };
  const uiResponsiveRaw = (className) => (value) => `${className}-${String(value).trim().toLowerCase().replace(/\s+/g, "-")}`;
  const uiResponsiveWrap = (value) => {
    if (value === true) return "wrap-wrap";
    if (value === false) return "wrap-nowrap";
    const key = String(value).trim().toLowerCase();
    if (key === "false" || key === "no" || key === "none") return "wrap-nowrap";
    if (key === "reverse") return "wrap-reverse";
    return `wrap-${key}`;
  };
  const uiResponsiveBoolDisplay = (value, inlineClass, blockClass) => value ? inlineClass : blockClass;
  const uiResponsiveSpan = (value) => {
    const raw = uiUnwrap(value);
    if (raw == null || raw === "") return "";
    if (raw === "auto") return "col-auto";
    if (raw === true) return "col-24";
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return `col-${Math.max(1, Math.min(24, Math.round(n)))}`;
    if (typeof raw === "string") {
      const normalized = raw.trim();
      if (/^\d+$/.test(normalized)) return `col-${Math.max(1, Math.min(24, Number(normalized)))}`;
    }
    return "";
  };
  const uiResponsiveGridCols = (value) => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? `grid-cols-${Math.max(1, Math.min(24, Math.round(n)))}` : "";
  };
  const uiHasResponsiveOverride = (props, names) => {
    const list = Array.isArray(names) ? names : [names];
    return CMSwift.uiResponsiveDevices.some((device) => {
      const deviceProps = CMSwift.uiResponsivePropsFor(props, device);
      return !!deviceProps && list.some((name) => Object.prototype.hasOwnProperty.call(deviceProps, name));
    });
  };
  const uiResponsiveDevice = (key) => CMSwift.uiResponsiveDevices.find((device) => device.key === key);
  const uiResponsiveLayoutRules = [
    { prop: "gap", class: "gap", map: uiResponsiveToken("gap") },
    { prop: "rowGap", class: "gap-y", map: uiResponsiveToken("gap-y") },
    { prop: ["columnGap", "colGap"], class: "gap-x", map: uiResponsiveToken("gap-x") },
    { prop: "direction", class: "dir", map: uiResponsiveRaw("dir") },
    { prop: "wrap", class: "wrap", allowFalse: true, map: uiResponsiveWrap },
    { prop: "align", class: "align", map: uiResponsiveRaw("align") },
    { prop: "justify", class: "justify", map: uiResponsiveRaw("justify") },
    { prop: "width", class: "w", map: uiResponsiveToken("w") },
    { prop: "minWidth", class: "min-w", map: uiResponsiveToken("min-w") },
    { prop: "maxWidth", class: "max-w", map: uiResponsiveToken("max-w") },
    { prop: "height", class: "h", map: uiResponsiveToken("h") },
    { prop: "minHeight", class: "min-h", map: uiResponsiveToken("min-h") },
    { prop: "maxHeight", class: "max-h", map: uiResponsiveToken("max-h") },
    { prop: "padding", class: "p", map: uiResponsiveToken("p") },
    { prop: "margin", class: "m", map: uiResponsiveToken("m") },
  ];
  const uiResponsiveBoxRules = uiResponsiveLayoutRules.filter((rule) => {
    const props = Array.isArray(rule.prop) ? rule.prop : [rule.prop];
    return !props.includes("align") && !props.includes("justify");
  });
  const uiResponsiveColRules = [
    { prop: ["col", "span"], class: "col", map: uiResponsiveSpan },
    { prop: "auto", class: "col", map: (value) => value ? "col-auto" : "" },
    { prop: "inline", class: "display", allowFalse: true, map: (value) => uiResponsiveBoolDisplay(value, "display-inline-flex", "display-flex") },
    { prop: "self", class: "self", map: uiResponsiveRaw("self") },
    ...uiResponsiveLayoutRules
  ];
  const uiResponsiveGridRules = [
    { prop: ["cols", "columns"], class: "grid-cols", map: uiResponsiveGridCols },
    { prop: "inline", class: "display", allowFalse: true, map: (value) => uiResponsiveBoolDisplay(value, "display-inline-grid", "display-grid") },
    { prop: "flow", class: "grid-flow", map: (value) => `grid-flow-${String(value).trim().toLowerCase().replace(/\s+/g, "-")}` },
    ...uiResponsiveLayoutRules
  ];
  const uiResponsiveGridColRules = [
    { prop: "inline", class: "display", allowFalse: true, map: (value) => uiResponsiveBoolDisplay(value, "display-inline-flex", "display-flex") },
    { prop: "direction", class: "dir", map: uiResponsiveRaw("dir") },
    { prop: "contentAlign", class: "align", map: uiResponsiveRaw("align") },
    { prop: "contentJustify", class: "justify", map: uiResponsiveRaw("justify") },
    { prop: "align", class: "self", map: uiResponsiveRaw("self") },
    { prop: "justify", class: "justify-self", map: uiResponsiveRaw("justify-self") },
    { prop: "place", class: "place-self", map: uiResponsiveRaw("place-self") },
    ...uiResponsiveBoxRules
  ];
  const uiResponsiveGridColStyleRules = (CMSwift.uiResponsiveStyleRules || []).filter((rule) => {
    const props = Array.isArray(rule.prop) ? rule.prop : [rule.prop];
    return !props.includes("span") && !props.includes("gridColumn");
  });

  UI.Row = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const renderArea = (names, fallback, ctx = {}) => {
      const list = Array.isArray(names) ? names : [names];
      for (const name of list) {
        if (CMSwift.ui.getSlot(slots, name) != null) {
          return renderSlotToArray(slots, name, ctx, fallback);
        }
      }
      return fallback == null ? [] : renderSlotToArray(null, "default", ctx, fallback);
    };

    const rowSpaceValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number") return `${value}px`;
      if (typeof value === "string" && CMSwift.uiSizes?.includes(value)) return `var(--cms-s-${value})`;
      return String(value);
    };
    const rowWidthValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number") return `${value}px`;
      if (typeof value === "string" && CMSwift.uiSizes?.includes(value)) return `var(--cms-w-${value})`;
      return String(value);
    };

    const p = CMSwift.omit(props, [
      "slots",
      "start", "left", "startClass",
      "body", "center", "bodyClass", "centerClass",
      "end", "right", "endClass",
      "align", "justify", "wrap", "gap", "rowGap", "columnGap",
      "direction", "reverse", "inline", "full", "width", "minWidth", "maxWidth",
      ...CMSwift.uiResponsiveOmitProps
    ]);
    p.class = uiClass([
      "cms-row",
      CMSwift.uiResponsiveClasses({ mobile: props }, uiResponsiveLayoutRules),
      CMSwift.uiResponsiveClasses(props, uiResponsiveLayoutRules),
      props.class
    ]);

    const style = { ...(props.style || {}) };
    const direction = uiComputed([props.direction, props.reverse], () => {
      const raw = uiUnwrap(props.direction);
      if (raw != null && raw !== "") return String(raw);
      return uiUnwrap(props.reverse) ? "row-reverse" : "";
    });
    const align = uiStyleValue(props.align);
    const justify = uiStyleValue(props.justify);
    const wrap = uiStyleValue(props.wrap, (v) => typeof v === "boolean" ? (v ? "wrap" : "nowrap") : String(v));
    const gap = uiStyleValue(props.gap, rowSpaceValue);
    const rowGap = uiStyleValue(props.rowGap, rowSpaceValue);
    const columnGap = uiStyleValue(props.columnGap, rowSpaceValue);
    const display = uiStyleValue(props.inline, (v) => v ? "inline-flex" : "flex");
    const width = uiStyleValue(props.width, rowWidthValue);
    const minWidth = uiStyleValue(props.minWidth, rowWidthValue);
    const maxWidth = uiStyleValue(props.maxWidth, rowWidthValue);
    const full = uiStyleValue(props.full, (v) => v ? "100%" : "", "");
    const inlineWidth = uiComputed([props.inline, props.full, props.width], () => {
      const isInline = !!uiUnwrap(props.inline);
      const isFull = !!uiUnwrap(props.full);
      const hasWidth = uiUnwrap(props.width) != null && uiUnwrap(props.width) !== false && uiUnwrap(props.width) !== "";
      if (!isInline || isFull || hasWidth) return "";
      return "max-content";
    });

    if (direction != null && !uiHasResponsiveOverride(props, "direction")) style.flexDirection = direction;
    if (align != null && !uiHasResponsiveOverride(props, "align")) style.alignItems = align;
    if (justify != null && !uiHasResponsiveOverride(props, "justify")) style.justifyContent = justify;
    if (wrap != null && !uiHasResponsiveOverride(props, "wrap")) style.flexWrap = wrap;
    if (gap != null && !uiHasResponsiveOverride(props, "gap")) style.gap = gap;
    if (rowGap != null && !uiHasResponsiveOverride(props, "rowGap")) style.rowGap = rowGap;
    if (columnGap != null && !uiHasResponsiveOverride(props, "columnGap")) style.columnGap = columnGap;
    if (display != null) style.display = display;
    if (inlineWidth != null) style.width = inlineWidth;
    if (width != null && !uiHasResponsiveOverride(props, "width")) style.width = width;
    if (minWidth != null && !uiHasResponsiveOverride(props, "minWidth")) style.minWidth = minWidth;
    if (maxWidth != null && !uiHasResponsiveOverride(props, "maxWidth")) style.maxWidth = maxWidth;
    if (full != null) style.width = full;
    if (Object.keys(style).length) p.style = style;
    CMSwift.uiApplyResponsiveProps(p, props, CMSwift.uiResponsiveStyleRules);

    const ctx = { props };
    const startNodes = renderArea(["start", "left"], props.start ?? props.left, ctx);
    const bodyNodes = renderArea(["body", "center", "default"], props.body ?? props.center ?? children, ctx);
    const endNodes = renderArea(["end", "right"], props.end ?? props.right, ctx);
    const hasStructuredContent = startNodes.length || endNodes.length || props.body != null || props.center != null || props.startClass || props.bodyClass || props.centerClass || props.endClass
      || CMSwift.ui.getSlot(slots, "start") != null
      || CMSwift.ui.getSlot(slots, "left") != null
      || CMSwift.ui.getSlot(slots, "body") != null
      || CMSwift.ui.getSlot(slots, "center") != null
      || CMSwift.ui.getSlot(slots, "end") != null
      || CMSwift.ui.getSlot(slots, "right") != null;

    if (!hasStructuredContent) {
      const content = renderSlotToArray(slots, "default", ctx, children);
      const el = _.div(p, ...content);
      setPropertyProps(el, props);
      return el;
    }

    const regionStyle = {
      display: "flex",
      alignItems: "inherit",
      gap: "inherit",
      flexWrap: "inherit",
      minWidth: 0
    };
    const bodyClass = props.bodyClass ?? props.centerClass;
    const endAutoMargin = uiComputed([props.direction, props.reverse], () => {
      const rawDirection = uiUnwrap(props.direction) || (uiUnwrap(props.reverse) ? "row-reverse" : "row");
      return rawDirection === "row" ? "auto" : "";
    });

    const parts = [
      startNodes.length
        ? _.div({ class: uiClass(["cms-row-start", props.startClass]), style: { ...regionStyle } }, ...startNodes)
        : null,
      bodyNodes.length
        ? _.div({ class: uiClass(["cms-row-body", bodyClass]), style: { ...regionStyle, flex: "1 1 auto" } }, ...bodyNodes)
        : null,
      endNodes.length
        ? _.div({
          class: uiClass(["cms-row-end", props.endClass]),
          style: {
            ...regionStyle,
            justifyContent: "flex-end",
            marginInlineStart: endAutoMargin
          }
        }, ...endNodes)
        : null
    ].filter(Boolean);

    const el = _.div(p, ...parts);
    setPropertyProps(el, props);
    return el;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Row = {
      signature: "UI.Row(...children) | UI.Row(props, ...children)",
      props: {
        start: "Node|Function|Array",
        left: "Alias of start",
        body: "Node|Function|Array",
        center: "Alias of body",
        end: "Node|Function|Array",
        right: "Alias of end",
        align: `stretch|flex-start|center|flex-end|baseline`,
        justify: `flex-start|center|flex-end|space-between|space-around|space-evenly`,
        wrap: "boolean|string",
        direction: `row|row-reverse|column|column-reverse`,
        reverse: "boolean",
        gap: "string|number",
        rowGap: "string|number",
        columnGap: "string|number",
        inline: "boolean",
        full: "boolean",
        width: "string|number",
        minWidth: "string|number",
        maxWidth: "string|number",
        mobile: "{ gap?, direction?, wrap?, align?, justify?, width?, minWidth?, maxWidth? }",
        tablet: "{ gap?, direction?, wrap?, align?, justify?, width?, minWidth?, maxWidth? }",
        pc: "{ gap?, direction?, wrap?, align?, justify?, width?, minWidth?, maxWidth? }",
        startClass: "string",
        bodyClass: "string",
        centerClass: "Alias of bodyClass",
        endClass: "string",
        slots: "{ start?, left?, body?, center?, end?, right?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        start: "Leading content area",
        left: "Alias of start",
        body: "Main content area",
        center: "Alias of body",
        end: "Trailing content area",
        right: "Alias of end",
        default: "Fallback content / children"
      },
      returns: "HTMLDivElement",
      description: "Wrapper flex in riga con children, slot strutturati e props di layout per gap, allineamento, wrap e direction."
    };
  }
  function uiIsSignal(v) {
    return Array.isArray(v) && v.length === 2 && typeof v[0] === "function" && typeof v[1] === "function";
  }

  function uiIsRod(v) {
    return !!v && v.type === "rod";
  }

  function uiIsReactive(v) {
    return typeof v === "function" || uiIsRod(v) || uiIsSignal(v);
  }

  function uiUnwrap(v) {
    if (typeof v === "function") return v();
    if (uiIsRod(v)) return v.value;
    if (uiIsSignal(v)) return v[0]();
    return v;
  }

  function uiHasReactive(parts) {
    const stack = Array.isArray(parts) ? [...parts] : [parts];
    while (stack.length) {
      const item = stack.pop();
      if (uiIsReactive(item)) return true;
      if (Array.isArray(item)) stack.push(...item);
    }
    return false;
  }

  function uiClass(parts) {
    const hasReactive = uiHasReactive(parts);
    const build = () => {
      const out = [];
      const stack = Array.isArray(parts) ? [...parts] : [parts];
      while (stack.length) {
        const item = stack.shift();
        if (item == null || item === false) continue;
        const value = uiUnwrap(item);
        if (value == null || value === false || value === "") continue;
        if (Array.isArray(value)) {
          stack.unshift(...value);
          continue;
        }
        out.push(value);
      }
      return out.join(" ");
    };
    return hasReactive ? build : build();
  }

  function uiClassStatic(parts) {
    const cls = uiClass(parts);
    return typeof cls === "function" ? cls() : cls;
  }

  function uiWhen(cond, className, fallback = "") {
    if (uiIsReactive(cond)) {
      return () => (uiUnwrap(cond) ? className : fallback);
    }
    return cond ? className : fallback;
  }

  function uiClassValue(value, prefix, suffix = "") {
    if (uiIsReactive(value)) {
      return () => {
        const v = uiUnwrap(value);
        if (v == null || v === "") return "";
        return `${prefix}${v}${suffix}`;
      };
    }
    if (value == null || value === "") return "";
    return `${prefix}${value}${suffix}`;
  }

  function uiComputed(deps, fn) {
    const list = Array.isArray(deps) ? deps : [deps];
    const reactive = list.some(uiIsReactive);
    if (!reactive) return fn();
    return () => fn();
  }

  function uiStyleValue(value, map, empty = "") {
    if (uiIsReactive(value)) {
      return () => {
        const v = uiUnwrap(value);
        if (v == null || v === false) return empty;
        return map ? map(v) : v;
      };
    }
    if (value == null || value === false) return null;
    return map ? map(value) : value;
  }

  CMSwift.uiIsReactive = uiIsReactive;
  CMSwift.uiUnwrap = uiUnwrap;
  CMSwift.uiClass = uiClass;
  CMSwift.uiClassStatic = uiClassStatic;
  CMSwift.uiWhen = uiWhen;
  CMSwift.uiClassValue = uiClassValue;
  CMSwift.uiComputed = uiComputed;
  CMSwift.uiStyleValue = uiStyleValue;
  UI.Col = (...args) => {
    const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(rawProps, key);
    const renderArea = (names, fallback, ctx = {}) => {
      const list = Array.isArray(names) ? names : [names];
      for (const name of list) {
        if (CMSwift.ui.getSlot(slots, name) != null) {
          return renderSlotToArray(slots, name, ctx, fallback);
        }
      }
      return fallback == null ? [] : renderSlotToArray(null, "default", ctx, fallback);
    };
    const resolveSpaceValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number") return `${value}px`;
      if (typeof value === "string" && CMSwift.uiSizes?.includes(value)) return `var(--cms-s-${value})`;
      return String(value);
    };
    const resolveSizeValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "string" && CMSwift.uiSizes?.includes(value)) return unitCover(value, "size");
      return toCssSize(value);
    };
    const resolveSpanClass = (value, prefix) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return "";
      if (raw === "auto") return prefix === "cms-col-" ? "cms-col-auto" : "";
      if (raw === true) return `${prefix}24`;
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) {
        return `${prefix}${Math.max(1, Math.min(24, Math.round(n)))}`;
      }
      if (typeof raw === "string") {
        const normalized = raw.trim();
        if (!normalized) return "";
        if (normalized.startsWith(prefix)) return normalized;
        if (/^\d+$/.test(normalized)) {
          return `${prefix}${Math.max(1, Math.min(24, Number(normalized)))}`;
        }
      }
      return "";
    };
    const resolveFlexValue = () => {
      const explicit = uiUnwrap(rawProps.flex);
      if (explicit != null && explicit !== false && explicit !== "") return String(explicit);
      if (uiUnwrap(rawProps.fill)) return "1 1 auto";
      const hasGrow = hasOwn("grow");
      const hasShrink = hasOwn("shrink");
      const hasBasis = hasOwn("basis");
      if (!hasGrow && !hasShrink && !hasBasis) return "";
      const grow = hasGrow ? uiUnwrap(rawProps.grow) : 0;
      const shrink = hasShrink ? uiUnwrap(rawProps.shrink) : 1;
      const basis = hasBasis ? resolveSizeValue(uiUnwrap(rawProps.basis)) : "auto";
      return `${grow} ${shrink} ${basis || "auto"}`;
    };

    const baseColClass = uiComputed([rawProps.auto, rawProps.col, rawProps.span], () => {
      if (uiUnwrap(rawProps.auto)) return "cms-col-auto";
      const spanSource = hasOwn("span") ? rawProps.span : rawProps.col;
      return resolveSpanClass(spanSource, "cms-col-") || "cms-col";
    });

    const p = CMSwift.omit(rawProps, [
      "slots",
      "col", "span", "sm", "md", "lg", "auto",
      "size", "width", "minWidth", "maxWidth",
      "height", "minHeight", "maxHeight",
      "gap", "rowGap", "columnGap",
      "align", "justify", "inline", "center", "stack",
      "flex", "fill", "grow", "shrink", "basis",
      "self", "order", "scroll",
      "start", "top", "header", "before", "startClass", "topClass", "headerClass",
      "body", "content", "bodyClass", "contentClass",
      "end", "bottom", "footer", "after", "endClass", "bottomClass", "footerClass",
      ...CMSwift.uiResponsiveOmitProps
    ]);

    const style = { ...(rawProps.style || {}) };
    if (!uiHasResponsiveOverride(rawProps, "minWidth") && style.minWidth == null) style.minWidth = 0;
    const gap = uiStyleValue(rawProps.gap, resolveSpaceValue);
    const rowGap = uiStyleValue(rawProps.rowGap, resolveSpaceValue);
    const columnGap = uiStyleValue(rawProps.columnGap, resolveSpaceValue);
    const align = uiStyleValue(rawProps.align);
    const justify = uiStyleValue(rawProps.justify);
    const widthSource = hasOwn("width") ? rawProps.width : rawProps.size;
    const width = uiStyleValue(widthSource, resolveSizeValue);
    const minWidth = uiStyleValue(rawProps.minWidth, resolveSizeValue);
    const maxWidth = uiStyleValue(rawProps.maxWidth, resolveSizeValue);
    const height = uiStyleValue(rawProps.height, resolveSizeValue);
    const minHeight = uiStyleValue(rawProps.minHeight, resolveSizeValue);
    const maxHeight = uiStyleValue(rawProps.maxHeight, resolveSizeValue);
    const self = uiStyleValue(rawProps.self);
    const order = uiStyleValue(rawProps.order, (v) => String(v));
    const scroll = uiStyleValue(rawProps.scroll, (v) => v ? "auto" : "", "");
    const flexValue = uiComputed([
      rawProps.flex, rawProps.fill, rawProps.grow, rawProps.shrink, rawProps.basis
    ], resolveFlexValue);
    const center = uiComputed([rawProps.center, rawProps.align, rawProps.justify], () => {
      return !!uiUnwrap(rawProps.center)
        && (uiUnwrap(rawProps.align) == null || uiUnwrap(rawProps.align) === "")
        && (uiUnwrap(rawProps.justify) == null || uiUnwrap(rawProps.justify) === "");
    });
    if (flexValue != null && flexValue !== "") style.flex = flexValue;
    if (self != null && !uiHasResponsiveOverride(rawProps, "self")) style.alignSelf = self;
    if (order != null) style.order = order;
    if (scroll != null && scroll !== "") style.overflow = scroll;
    if (width != null && width !== "" && !uiHasResponsiveOverride(rawProps, ["width", "size"])) {
      style.width = width;
      if (!hasOwn("flex") && !hasOwn("fill") && !hasOwn("grow") && !hasOwn("shrink") && !hasOwn("basis")) {
        style.flex = "0 0 auto";
      }
    }
    if (minWidth != null && !uiHasResponsiveOverride(rawProps, "minWidth")) style.minWidth = minWidth;
    if (maxWidth != null && !uiHasResponsiveOverride(rawProps, "maxWidth")) style.maxWidth = maxWidth;
    if (height != null && !uiHasResponsiveOverride(rawProps, "height")) style.height = height;
    if (minHeight != null && !uiHasResponsiveOverride(rawProps, "minHeight")) style.minHeight = minHeight;
    if (maxHeight != null && !uiHasResponsiveOverride(rawProps, "maxHeight")) style.maxHeight = maxHeight;
    if (Object.keys(style).length) p.style = style;

    const ctx = { props: rawProps };
    const startNodes = renderArea(
      ["start", "top", "header", "before"],
      rawProps.start ?? rawProps.top ?? rawProps.header ?? rawProps.before,
      ctx
    );
    const bodyFallback = hasOwn("body")
      ? rawProps.body
      : (hasOwn("content") ? rawProps.content : children);
    const bodyNodes = renderArea(["body", "content", "default"], bodyFallback, ctx);
    const endNodes = renderArea(
      ["end", "bottom", "footer", "after"],
      rawProps.end ?? rawProps.bottom ?? rawProps.footer ?? rawProps.after,
      ctx
    );
    const hasStructuredContent = startNodes.length || endNodes.length
      || hasOwn("start") || hasOwn("top") || hasOwn("header") || hasOwn("before")
      || hasOwn("body") || hasOwn("content")
      || hasOwn("end") || hasOwn("bottom") || hasOwn("footer") || hasOwn("after")
      || rawProps.startClass || rawProps.bodyClass || rawProps.contentClass || rawProps.endClass
      || rawProps.topClass || rawProps.headerClass || rawProps.bottomClass || rawProps.footerClass
      || CMSwift.ui.getSlot(slots, "start") != null
      || CMSwift.ui.getSlot(slots, "top") != null
      || CMSwift.ui.getSlot(slots, "header") != null
      || CMSwift.ui.getSlot(slots, "before") != null
      || CMSwift.ui.getSlot(slots, "body") != null
      || CMSwift.ui.getSlot(slots, "content") != null
      || CMSwift.ui.getSlot(slots, "end") != null
      || CMSwift.ui.getSlot(slots, "bottom") != null
      || CMSwift.ui.getSlot(slots, "footer") != null
      || CMSwift.ui.getSlot(slots, "after") != null;

    const useFlexLayout = uiComputed([
      rawProps.stack, rawProps.gap, rawProps.rowGap, rawProps.columnGap,
      rawProps.align, rawProps.justify, rawProps.center
    ], () => {
      if (!!uiUnwrap(rawProps.stack)) return true;
      if (hasStructuredContent) return true;
      const values = [
        uiUnwrap(rawProps.gap),
        uiUnwrap(rawProps.rowGap),
        uiUnwrap(rawProps.columnGap),
        uiUnwrap(rawProps.align),
        uiUnwrap(rawProps.justify)
      ];
      if (values.some((value) => value != null && value !== false && value !== "")) return true;
      return !!uiUnwrap(rawProps.center);
    });

    p.class = uiClass([
      "cms-col",
      baseColClass,
      uiComputed(rawProps.sm, () => resolveSpanClass(rawProps.sm, "cms-sm-col-")),
      uiComputed(rawProps.md, () => resolveSpanClass(rawProps.md, "cms-md-col-")),
      uiComputed(rawProps.lg, () => resolveSpanClass(rawProps.lg, "cms-lg-col-")),
      CMSwift.uiResponsiveClasses({ mobile: rawProps }, uiResponsiveColRules),
      CMSwift.uiResponsiveClasses(rawProps, uiResponsiveColRules),
      uiWhen(useFlexLayout, "cms-col-flex"),
      uiWhen(rawProps.inline, "cms-col-inline"),
      rawProps.class
    ]);

    if (gap != null && !uiHasResponsiveOverride(rawProps, "gap")) style.gap = gap;
    if (rowGap != null && !uiHasResponsiveOverride(rawProps, "rowGap")) style.rowGap = rowGap;
    if (columnGap != null && !uiHasResponsiveOverride(rawProps, "columnGap")) style.columnGap = columnGap;
    if (align != null && !uiHasResponsiveOverride(rawProps, "align")) style.alignItems = align;
    else if (center != null && center !== "") style.alignItems = center ? "center" : "";
    if (justify != null && !uiHasResponsiveOverride(rawProps, "justify")) style.justifyContent = justify;
    else if (center != null && center !== "") style.justifyContent = center ? "center" : "";
    if (Object.keys(style).length) p.style = style;
    CMSwift.uiApplyResponsiveProps(p, rawProps, CMSwift.uiResponsiveStyleRules);

    if (!hasStructuredContent) {
      const el = _.div(p, ...renderSlotToArray(slots, "default", ctx, children));
      setPropertyProps(el, rawProps);
      return el;
    }

    const sectionStyle = {
      display: "flex",
      flexDirection: "column",
      gap: "inherit",
      minWidth: 0
    };
    const parts = [
      startNodes.length
        ? _.div({
          class: uiClass(["cms-col-start", rawProps.startClass, rawProps.topClass, rawProps.headerClass]),
          style: { ...sectionStyle }
        }, ...startNodes)
        : null,
      bodyNodes.length
        ? _.div({
          class: uiClass(["cms-col-body", rawProps.bodyClass, rawProps.contentClass]),
          style: { ...sectionStyle, flex: "1 1 auto" }
        }, ...bodyNodes)
        : null,
      endNodes.length
        ? _.div({
          class: uiClass(["cms-col-end", rawProps.endClass, rawProps.bottomClass, rawProps.footerClass]),
          style: { ...sectionStyle }
        }, ...endNodes)
        : null
    ].filter(Boolean);

    const el = _.div(p, ...parts);
    setPropertyProps(el, rawProps);
    return el;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Col = {
      signature: "UI.Col(...children) | UI.Col(props, ...children)",
      props: {
        col: "number|string",
        span: "Alias of col",
        sm: "number|string",
        md: "number|string",
        lg: "number|string",
        auto: "boolean",
        gap: "number|string",
        rowGap: "number|string",
        columnGap: "number|string",
        align: "string",
        justify: "string",
        inline: "boolean",
        stack: "boolean",
        center: "boolean",
        width: "number|string",
        size: "Alias of width",
        minWidth: "number|string",
        maxWidth: "number|string",
        height: "number|string",
        minHeight: "number|string",
        maxHeight: "number|string",
        flex: "string",
        fill: "boolean",
        grow: "number",
        shrink: "number",
        basis: "number|string",
        self: "string",
        order: "number|string",
        scroll: "boolean",
        mobile: "{ col?, span?, gap?, direction?, align?, justify?, width?, height? }",
        tablet: "{ col?, span?, gap?, direction?, align?, justify?, width?, height? }",
        pc: "{ col?, span?, gap?, direction?, align?, justify?, width?, height? }",
        start: "Node|Function|Array",
        top: "Alias of start",
        header: "Alias of start",
        body: "Node|Function|Array",
        content: "Alias of body",
        end: "Node|Function|Array",
        bottom: "Alias of end",
        footer: "Alias of end",
        startClass: "string",
        bodyClass: "string",
        endClass: "string",
        slots: "{ start?, top?, header?, body?, content?, end?, bottom?, footer?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        start: "Column leading area",
        top: "Alias of start",
        header: "Alias of start",
        body: "Column main area",
        content: "Alias of body",
        end: "Column trailing area",
        bottom: "Alias of end",
        footer: "Alias of end",
        default: "Column fallback content"
      },
      returns: "HTMLDivElement",
      description: "Responsive 24-column wrapper. By default it behaves like a regular container and enables vertical flex layout when using gap/alignment, structured regions, or `stack`."
    };
  }

  UI.Spacer = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const p = CMSwift.omit(props, ["slots"]);
    p.class = uiClass(["cms-spacer", props.class]);
    const content = renderSlotToArray(slots, "default", {}, children);
    return _.div(p, ...content);
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Spacer = {
      signature: "UI.Spacer() | UI.Spacer(props)",
      props: {
        slots: "{ default?: Slot }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Optional spacer content"
      },
      returns: "HTMLDivElement",
      description: "Flex spacer."
    };
  }

  UI.Container = (...args) => {
    const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const props = { ...rawProps };
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(rawProps, key);
    const containerWidthMap = {
      xxs: "360px",
      xs: "480px",
      sm: "640px",
      md: "820px",
      lg: "1100px",
      xl: "1280px",
      xxl: "1440px",
      narrow: "760px",
      prose: "760px",
      wide: "1360px"
    };
    const resolveWidthValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number") return `${value}px`;
      const key = String(value).trim().toLowerCase();
      if (!key) return "";
      if (key === "full" || key === "fluid") return "100%";
      return containerWidthMap[key] || String(value);
    };
    const resolveSpaceValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number") return `${value}px`;
      if (typeof value === "string" && CMSwift.uiSizes?.includes(value)) return `var(--cms-s-${value})`;
      return String(value);
    };
    const resolveColsValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number" && Number.isFinite(value)) return `repeat(${Math.max(1, Math.floor(value))}, minmax(0, 1fr))`;
      const raw = String(value).trim();
      if (!raw) return "";
      if (/^\d+$/.test(raw)) return `repeat(${Math.max(1, Number(raw))}, minmax(0, 1fr))`;
      return raw;
    };
    const resolveWrapValue = (value) => {
      if (value == null || value === "") return "";
      if (value === true) return "wrap";
      if (value === false) return "nowrap";
      return String(value);
    };
    const ctx = { props: rawProps };
    const appendResolvedValue = (host, value) => {
      if (value == null || value === false) return;
      if (Array.isArray(value)) {
        value.forEach((item) => appendResolvedValue(host, item));
        return;
      }
      if (value?.nodeType) {
        host.appendChild(value);
        return;
      }
      host.appendChild(document.createTextNode(String(value)));
    };
    const renderPropNodes = (name, fallback) => {
      const slot = CMSwift.ui.getSlot(slots, name);
      if (slot !== null && slot !== undefined) {
        return renderSlotToArray(slots, name, ctx, null);
      }
      if (typeof fallback === "function") {
        const host = _.div({ class: `cms-container-slot-${name}` });
        CMSwift.reactive.effect(() => {
          const normalized = flattenSlotValue(CMSwift.ui.slot(fallback(ctx)));
          host.replaceChildren();
          if (Array.isArray(normalized)) normalized.forEach((item) => appendResolvedValue(host, item));
          else appendResolvedValue(host, normalized);
        }, `UI.Container:${name}`);
        return [host];
      }
      return renderSlotToArray(slots, name, ctx, fallback);
    };
    const contentFallback = hasOwn("content") ? rawProps.content : (children?.length ? children : null);
    const beforeNodes = renderPropNodes("before", rawProps.before ?? rawProps.top);
    const headerNodes = renderPropNodes("header", rawProps.header);
    const startNodes = [
      ...renderPropNodes("left", rawProps.left),
      ...renderPropNodes("start", rawProps.start)
    ];
    const bodyNodes = renderPropNodes("body", hasOwn("body") ? rawProps.body : null);
    const contentNodes = (() => {
      const explicit = renderPropNodes("content", hasOwn("content") ? rawProps.content : null);
      return explicit.length ? explicit : renderPropNodes("default", contentFallback);
    })();
    const endNodes = [
      ...renderPropNodes("right", rawProps.right),
      ...renderPropNodes("end", rawProps.end)
    ];
    const footerNodes = renderPropNodes("footer", rawProps.footer);
    const afterNodes = renderPropNodes("after", rawProps.after ?? rawProps.bottom);
    const hasShellSections = beforeNodes.length || headerNodes.length || startNodes.length || endNodes.length || footerNodes.length || afterNodes.length
      || CMSwift.ui.getSlot(slots, "before") != null
      || CMSwift.ui.getSlot(slots, "header") != null
      || CMSwift.ui.getSlot(slots, "left") != null
      || CMSwift.ui.getSlot(slots, "start") != null
      || CMSwift.ui.getSlot(slots, "right") != null
      || CMSwift.ui.getSlot(slots, "end") != null
      || CMSwift.ui.getSlot(slots, "footer") != null
      || CMSwift.ui.getSlot(slots, "after") != null;
    const hasStructuredLayout = !!hasShellSections || (bodyNodes.length > 0 && (CMSwift.ui.getSlot(slots, "body") != null || hasShellSections));
    const resolveLayoutMode = () => {
      const explicit = String(uiUnwrap(rawProps.layout ?? rawProps.display) || "").trim().toLowerCase();
      if (["flex", "grid", "stack"].includes(explicit)) return explicit;
      if (["inline", "inline-flex", "inlineflex"].includes(explicit)) return "inline";
      if (!!uiUnwrap(rawProps.inline)) return "inline";
      if (!!uiUnwrap(rawProps.grid) || uiUnwrap(rawProps.cols) != null) return "grid";
      if (explicit === "block") return "block";
      if (uiUnwrap(rawProps.direction) != null || uiUnwrap(rawProps.wrap) != null || uiUnwrap(rawProps.align) != null || uiUnwrap(rawProps.justify) != null || uiUnwrap(rawProps.gap) != null) return "flex";
      if (startNodes.length || endNodes.length) return "flex";
      return "block";
    };
    const layoutClass = uiComputed([
      rawProps.layout, rawProps.display, rawProps.inline, rawProps.grid, rawProps.cols,
      rawProps.direction, rawProps.wrap, rawProps.align, rawProps.justify, rawProps.gap
    ], () => {
      const mode = resolveLayoutMode();
      return mode === "block" ? "" : `is-${mode}`;
    });
    const rootStyle = { ...(props.style || {}) };
    const assignStyle = (key, value) => {
      if (value != null) rootStyle[key] = value;
    };
    assignStyle("maxWidth", uiComputed([rawProps.maxWidth, rawProps.fluid], () => {
      if (uiUnwrap(rawProps.fluid)) return "none";
      const value = resolveWidthValue(uiUnwrap(rawProps.maxWidth));
      return value || "";
    }));
    assignStyle("width", uiStyleValue(rawProps.width, resolveWidthValue));
    assignStyle("minWidth", uiStyleValue(rawProps.minWidth, resolveWidthValue));
    assignStyle("--cms-container-padding", uiStyleValue(rawProps.padding, resolveSpaceValue));
    assignStyle("--cms-container-padding-x", uiStyleValue(rawProps.paddingX ?? rawProps.gutter, resolveSpaceValue));
    assignStyle("--cms-container-padding-y", uiStyleValue(rawProps.paddingY, resolveSpaceValue));
    assignStyle("--cms-container-gap", uiStyleValue(rawProps.gap, resolveSpaceValue));
    assignStyle("--cms-container-section-gap", uiStyleValue(rawProps.sectionGap ?? rawProps.gap, resolveSpaceValue));
    assignStyle("--cms-container-cols", uiStyleValue(rawProps.cols, resolveColsValue));
    assignStyle("--cms-container-align", uiStyleValue(rawProps.align, (value) => String(value)));
    assignStyle("--cms-container-justify", uiStyleValue(rawProps.justify, (value) => String(value)));
    assignStyle("--cms-container-direction", uiStyleValue(rawProps.direction, (value) => String(value)));
    assignStyle("--cms-container-wrap", uiStyleValue(rawProps.wrap, resolveWrapValue));

    const p = CMSwift.omit(props, [
      "after", "afterClass", "align", "as", "before", "beforeClass", "body", "bodyClass",
      "bottom", "cols", "content", "contentClass", "direction", "display", "end",
      "endClass", "fluid", "footer", "footerClass", "gap", "grid", "gutter", "header",
      "headerClass", "inline", "justify", "layout", "left", "mainClass", "maxWidth",
      "minWidth", "padding", "paddingX", "paddingY", "right", "sectionGap", "slots",
      "start", "startClass", "tag", "top", "width", "wrap"
    ]);
    p.class = uiClass([
      "cms-container",
      uiWhen(rawProps.fluid, "is-fluid"),
      uiWhen(hasStructuredLayout, "has-structure"),
      hasStructuredLayout ? "" : layoutClass,
      props.class
    ]);
    p.style = rootStyle;
    CMSwift.uiApplyResponsiveProps(p, rawProps, CMSwift.uiResponsiveStyleRules);

    const createSection = (name, nodes, extraClass) => {
      if (!nodes.length) return null;
      return _.div({ class: uiClass(["cms-container-section", `cms-container-${name}`, extraClass]) }, ...nodes);
    };

    const contentRoot = bodyNodes.length
      ? _.div({ class: uiClass(["cms-container-body", hasStructuredLayout ? layoutClass : "", rawProps.bodyClass]) }, ...bodyNodes)
      : (
        (startNodes.length || contentNodes.length || endNodes.length)
          ? _.div(
            { class: uiClass(["cms-container-body", hasStructuredLayout ? layoutClass : "", rawProps.bodyClass]) },
            createSection("start", startNodes, rawProps.startClass),
            contentNodes.length ? _.div({ class: uiClass(["cms-container-main", rawProps.mainClass, rawProps.contentClass]) }, ...contentNodes) : null,
            createSection("end", endNodes, rawProps.endClass)
          )
          : null
      );

    const creator = (() => {
      const tag = String(uiUnwrap(rawProps.tag ?? rawProps.as) || "div").toLowerCase();
      return typeof _[tag] === "function" ? _[tag] : _.div;
    })();

    const el = hasStructuredLayout
      ? creator(
        p,
        createSection("before", beforeNodes, rawProps.beforeClass),
        createSection("header", headerNodes, rawProps.headerClass),
        contentRoot,
        createSection("footer", footerNodes, rawProps.footerClass),
        createSection("after", afterNodes, rawProps.afterClass)
      )
      : creator(p, ...(bodyNodes.length ? bodyNodes : contentNodes));
    setPropertyProps(el, rawProps);
    return el;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Container = {
      signature: "UI.Container(...children) | UI.Container(props, ...children)",
      props: {
        tag: "string",
        fluid: "boolean",
        maxWidth: "number|string",
        minWidth: "number|string",
        width: "number|string",
        padding: "number|string",
        paddingX: "number|string",
        paddingY: "number|string",
        gap: "number|string",
        sectionGap: "number|string",
        layout: '"block|flex|grid|stack|inline"',
        direction: '"row|column"',
        wrap: "boolean|string",
        align: "string",
        justify: "string",
        cols: "number|string",
        before: "String|Node|Function|Array",
        header: "String|Node|Function|Array",
        start: "String|Node|Function|Array",
        body: "String|Node|Function|Array",
        content: "String|Node|Function|Array",
        end: "String|Node|Function|Array",
        footer: "String|Node|Function|Array",
        after: "String|Node|Function|Array",
        slots: "{ before?, header?, left?, start?, body?, content?, default?, right?, end?, footer?, after? }",
        class: "string",
        style: "object"
      },
      slots: {
        before: "Top content before the main container body",
        header: "Structured header area",
        left: "Alias for start",
        start: "Leading area inside the main body",
        body: "Custom body renderer overriding start/content/end wrappers",
        content: "Explicit main content",
        default: "Fallback content from children",
        right: "Alias for end",
        end: "Trailing area inside the main body",
        footer: "Structured footer area",
        after: "Bottom content after the main container body"
      },
      returns: "HTMLDivElement",
      description: "Composable container with max-width, spacing, layout props, and optional sections."
    };
  }

  UI.Card = (...args) => {
    const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const props = { ...rawProps };
    applyCommonProps(props);

    const isSectionNode = (node, name) => {
      return !!(node && node.nodeType === 1 && node.classList?.contains(`cms-card-${name}`));
    };
    const renderIconFallback = (value) => {
      if (value == null) return null;
      if (typeof value === "string") return UI.Icon({ name: value, size: rawProps.iconSize || rawProps.size || "lg" });
      return CMSwift.ui.slot(value, { as: "icon" });
    };
    const iconFallback = renderIconFallback(rawProps.icon);
    const coverFallback = rawProps.image
      ? _.img({
        src: rawProps.image,
        alt: rawProps.imageAlt || "",
        class: uiClass(["cms-card-cover-media", rawProps.imageClass]),
        style: rawProps.imageStyle
      })
      : rawProps.cover;

    const ctx = {
      dense: !!uiUnwrap(rawProps.dense),
      flat: !!uiUnwrap(rawProps.flat),
      clickable: !!uiUnwrap(rawProps.clickable),
      to: uiUnwrap(rawProps.to) || null
    };

    const defaultNodes = renderSlotToArray(slots, "default", ctx, children?.length ? children : []);
    const sectionNodes = {
      identifier: [],
      cover: [],
      media: [],
      header: [],
      body: [],
      footer: [],
      actions: []
    };
    const looseNodes = [];

    defaultNodes.forEach((node) => {
      if (isSectionNode(node, "identifier")) sectionNodes.identifier.push(node);
      else if (isSectionNode(node, "cover")) sectionNodes.cover.push(node);
      else if (isSectionNode(node, "media")) sectionNodes.media.push(node);
      else if (isSectionNode(node, "header")) sectionNodes.header.push(node);
      else if (isSectionNode(node, "body")) sectionNodes.body.push(node);
      else if (isSectionNode(node, "footer")) sectionNodes.footer.push(node);
      else if (isSectionNode(node, "actions")) sectionNodes.actions.push(node);
      else looseNodes.push(node);
    });

    const identifierNodes = renderSlotToArray(slots, "identifier", ctx, rawProps.identifier);
    const coverNodes = renderSlotToArray(slots, "cover", ctx, coverFallback);
    const mediaNodes = renderSlotToArray(slots, "media", ctx, rawProps.media);
    const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, rawProps.eyebrow ?? rawProps.kicker);
    const titleNodes = renderSlotToArray(slots, "title", ctx, rawProps.title);
    const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, rawProps.subtitle);
    const headerNodes = renderSlotToArray(slots, "header", ctx, rawProps.header);
    const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
    const asideNodes = renderSlotToArray(slots, "aside", ctx, rawProps.aside ?? rawProps.headerAside);
    const bodyNodes = renderSlotToArray(slots, "body", ctx, rawProps.body);
    const footerNodes = renderSlotToArray(slots, "footer", ctx, rawProps.footer);
    const actionsNodes = renderSlotToArray(slots, "actions", ctx, rawProps.actions);

    const generatedIdentifier = identifierNodes.length
      ? _.div({ class: uiClass(["cms-card-identifier", rawProps.identifierClass]) }, ...identifierNodes)
      : null;
    const generatedCover = coverNodes.length
      ? _.div({ class: uiClass(["cms-card-cover", rawProps.coverClass]) }, ...coverNodes)
      : null;
    const generatedMedia = mediaNodes.length
      ? _.div({ class: uiClass(["cms-card-media", rawProps.mediaClass]) }, ...mediaNodes)
      : null;

    const hasStructuredHeader = iconNodes.length || eyebrowNodes.length || titleNodes.length || subtitleNodes.length || headerNodes.length || asideNodes.length;
    const generatedHeader = hasStructuredHeader
      ? _.div(
        { class: uiClass(["cms-card-header", rawProps.headerClass]) },
        _.div(
          { class: "cms-card-head" },
          iconNodes.length ? _.div({ class: "cms-card-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-card-head-main" },
            eyebrowNodes.length ? _.div({ class: uiClass(["cms-card-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: uiClass(["cms-card-title", rawProps.titleClass]) }, ...titleNodes) : null,
            subtitleNodes.length ? _.div({ class: uiClass(["cms-card-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
            headerNodes.length ? _.div({ class: uiClass(["cms-card-header-content", rawProps.headerContentClass]) }, ...headerNodes) : null
          ),
          asideNodes.length ? _.div({ class: uiClass(["cms-card-aside", rawProps.asideClass]) }, ...asideNodes) : null
        )
      )
      : null;

    const mergedBodyNodes = [...bodyNodes, ...looseNodes];
    const generatedBody = mergedBodyNodes.length
      ? _.div({ class: uiClass(["cms-card-body", rawProps.bodyClass]) }, ...mergedBodyNodes)
      : null;

    const mergedActionNodes = [...actionsNodes, ...sectionNodes.actions];
    const generatedFooter = (footerNodes.length || mergedActionNodes.length)
      ? _.div(
        { class: uiClass(["cms-card-footer", rawProps.footerClass]) },
        ...footerNodes,
        mergedActionNodes.length ? _.div({ class: "cms-card-actions" }, ...mergedActionNodes) : null
      )
      : null;

    const interactiveClass = uiComputed([rawProps.clickable, rawProps.to], () => {
      return (uiUnwrap(rawProps.clickable) || uiUnwrap(rawProps.to)) ? "cms-card-clickable" : "";
    });
    const hasIdentifier = identifierNodes.length || sectionNodes.identifier.length;
    const hasTopVisual = coverNodes.length || sectionNodes.cover.length || mediaNodes.length || sectionNodes.media.length;

    const p = CMSwift.omit(props, [
      "actions", "aside", "asideClass", "body", "bodyClass", "clickable", "cover", "coverClass",
      "coverHeight", "dense", "eyebrow", "eyebrowClass", "flat", "footer", "footerClass", "header",
      "headerAside", "headerClass", "headerContentClass", "icon", "iconSize", "identifier",
      "identifierClass", "image", "imageAlt", "imageClass", "imageStyle", "kicker", "media",
      "mediaClass", "slots", "subtitle", "subtitleClass", "title", "titleClass", "to",
      "display", "direction", "wrap", "align", "justify", "gap", "rowGap", "columnGap",
      "cols", "columns"
    ]);
    p.class = uiClass([
      "cms-panel",
      "cms-card",
      'cms-clear-set',
      "cms-singularity",
      uiWhen(rawProps.flat, "cms-card-flat"),
      uiWhen(rawProps.dense, "cms-card-dense"),
      uiWhen(hasIdentifier, "cms-card-has-identifier"),
      uiWhen(hasTopVisual, "cms-card-has-top-visual"),
      interactiveClass,
      props.class
    ]);
    p.style = { ...(props.style || {}) };
    if (rawProps.coverHeight != null) {
      p.style["--cms-card-cover-height"] = toCssSize(uiUnwrap(rawProps.coverHeight));
    }
    CMSwift.uiApplyResponsiveProps(p, rawProps, CMSwift.uiResponsiveStyleRules);

    const userOnClick = rawProps.onClick;
    const userOnKeydown = rawProps.onKeydown;
    const onClick = (e) => {
      userOnClick?.(e);
      if (e.defaultPrevented) return;
      const to = uiUnwrap(rawProps.to);
      if (to && CMSwift.router?.navigate) {
        e.preventDefault();
        CMSwift.router.navigate(to);
      }
    };
    const onKeydown = (e) => {
      userOnKeydown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    };
    if (uiUnwrap(rawProps.clickable) || uiUnwrap(rawProps.to)) {
      p.onClick = onClick;
      p.onKeydown = onKeydown;
      if (p.tabIndex == null) p.tabIndex = 0;
      if (p.role == null) p.role = "button";
    }

    const el = _.div(
      p,
      generatedIdentifier,
      ...sectionNodes.identifier,
      generatedCover,
      ...sectionNodes.cover,
      generatedMedia,
      ...sectionNodes.media,
      generatedHeader,
      ...sectionNodes.header,
      generatedBody,
      ...sectionNodes.body,
      generatedFooter,
      ...sectionNodes.footer
    );

    setPropertyProps(el, rawProps);
    return el;
  }
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Card = {
      signature: "UI.Card(...children) | UI.Card(props, ...children)",
      description: "Sectioned card with structured header, cover/media, body, and footer/actions.",
      props: {
        title: "String|Node|Function|Array",
        subtitle: "String|Node|Function|Array",
        eyebrow: "String|Node|Function|Array",
        header: "String|Node|Function|Array",
        body: "String|Node|Function|Array",
        footer: "String|Node|Function|Array",
        actions: "Node|Function|Array",
        icon: "String|Node|Function|Array",
        aside: "Node|Function|Array",
        identifier: "String|Node|Function|Array",
        media: "Node|Function|Array",
        cover: "Node|Function|Array",
        image: "string",
        imageAlt: "string",
        coverHeight: "string|number",
        clickable: "boolean",
        to: "string",
        dense: "boolean",
        flat: "boolean",
        display: "string",
        direction: "row|column|string",
        gap: "string|number",
        cols: "number|string",
        mobile: "{ display?, direction?, gap?, cols? }",
        tablet: "{ display?, direction?, gap?, cols? }",
        pc: "{ display?, direction?, gap?, cols? }",
        headerClass: "string",
        bodyClass: "string",
        footerClass: "string",
        slots: "{ identifier?, cover?, media?, icon?, eyebrow?, title?, subtitle?, header?, aside?, body?, footer?, actions?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        identifier: "Badge/top identifier content",
        cover: "Top visual/cover content",
        media: "Media section above header/body",
        icon: "Header icon content",
        eyebrow: "Eyebrow/kicker content",
        title: "Card title content",
        subtitle: "Card subtitle content",
        header: "Header support content",
        aside: "Right side header content",
        body: "Body content",
        footer: "Footer content",
        actions: "Footer actions slot",
        default: "Fallback body content or raw card sections"
      },
      returns: "HTMLDivElement"
    };
  }
  UI.Btn = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};

    const state = uiComputed([props.color, props.state], () => {
      const color = uiUnwrap(props.color) || uiUnwrap(props.state) || "";
      return ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"].includes(color)
        ? color
        : (uiUnwrap(props.state) || "");
    });

    const cls = uiClass(["cms-clear-set", "cms-btn", "cms-singularity", "cms-clickable", state, uiWhen(props.outline, "outline"), props.class]);

    const p = CMSwift.omit(props, [
      "icon", "iconRight", "label", "loading", "outline", "iconAlign", "slots",
      "shortcode", "shortcut", "hotkey", "showShortcode", "showShortcut"
    ]);
    p.class = cls;

    const iconFallback = props.icon != null
      ? (typeof props.icon === "string" ? UI.Icon({ name: props.icon }) : props.icon)
      : null;
    const iconRightFallback = props.iconRight != null
      ? (typeof props.iconRight === "string" ? UI.Icon({ name: props.iconRight }) : props.iconRight)
      : null;
    const icon = CMSwift.ui.renderSlot(slots, "icon", {}, iconFallback);
    const iconRight = CMSwift.ui.renderSlot(slots, "iconRight", {}, iconRightFallback);
    const label = CMSwift.ui.renderSlot(slots, "label", {}, props.label);
    const slotChildren = renderSlotToArray(slots, "default", {}, children);

    const content = [];
    const pushAll = (x) => {
      if (!x) return;
      if (Array.isArray(x)) content.push(...x);
      else content.push(x);
    };

    const align = props.iconAlign;
    const iconAfter = align === "after" || align === "right";

    if (iconAfter && !iconRightFallback) {
      pushAll(label);
      if (slotChildren.length) content.push(...slotChildren);
      pushAll(icon);
    } else {
      pushAll(icon);
      pushAll(label);
      if (slotChildren.length) content.push(...slotChildren);
    }
    pushAll(iconRight);
    pushAll(uiCreateShortcodeHint(props, { className: "cms-shortcode cms-btn-shortcode" }));

    if (content.length === 0) content.push(_.span("Button"));

    const disabled = !!props.disabled || !!props.loading;

    const onClick = props.loading ? null : props.onClick;

    const onPointerDown = (e) => {
      props.onPointerDown?.(e);
      if (disabled || !e?.currentTarget) return;
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = typeof e.clientX === "number" ? e.clientX - rect.left : rect.width / 2;
      const y = typeof e.clientY === "number" ? e.clientY - rect.top : rect.height / 2;
      btn.style.setProperty("--cms-burst-x", `${x}px`);
      btn.style.setProperty("--cms-burst-y", `${y}px`);
      btn.classList.remove("cms-btn-burst");
      void btn.offsetWidth;
      btn.classList.add("cms-btn-burst");
    };

    if (props.loading) {
      content.unshift(_.span({ class: "cms-muted", style: { marginRight: "8px" } }, "⏳"));
    }

    const btn = _.button({
      ...p,
      disabled,
      onClick,
      onPointerDown,
      "aria-disabled": disabled ? "true" : null,
      "aria-busy": props.loading ? "true" : null
    }, ...content);

    setPropertyProps(btn, props);
    uiRegisterShortcode(btn, props, {
      isEnabled: () => !disabled,
      action: () => {
        if (disabled) return false;
        btn.click();
      }
    });
    return btn;
  }
  UI.Button = UI.Btn;
  CMSwift.ui.Btn = UI.Btn;
  CMSwift.ui.Button = UI.Button;
  if (CMSwift.isDev?.()) {
    UI.meta.Btn = {
      signature: "UI.Btn(...children) | UI.Btn(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        iconAlign: `before|after|left|right`,
        color: `primary|secondary|warning|danger|success|info|light|dark`,
        outline: "boolean",
        loading: "boolean",
        disabled: "boolean",
        shortcode: "string|Array<string>|object",
        showShortcode: "boolean",
        slots: "{ icon?, label?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        icon: "Icon slot",
        iconRight: "Right icon slot",
        label: "Label slot",
        default: "Button content"
      },
      events: ["click", "pointerdown", "focus", "blur"],
      returns: "HTMLButtonElement"
    };
    UI.meta.Button = UI.meta.Btn;
  }
  // Esempio: CMSwift.ui.QBtn({ color: "primary", icon: "save", label: "Salva" })

  // Input: supporta value come rod (two-way) oppure rod via props.model
  // props: { model: rod OR [get,set] signal OR plain, placeholder, type }


  UI.FormField = (props = {}) => {

    applyCommonProps(props);

    const slots = props.slots || {};
    const state = uiComputed([props.color, props.state], () => {
      const color = uiUnwrap(props.color) || uiUnwrap(props.state) || "";
      return ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"].includes(color)
        ? color
        : (uiUnwrap(props.state) || "");
    });

    const wrap = _.div({ class: uiClass(["cms-clear-field-set", "cms-field", "cms-singularity-field", state, uiWhen(props.fill, "cms-field-fill"), uiWhen(props.outline, "outline"), props.wrapClass, props.class]) });

    const topLabelNodes = renderSlotToArray(slots, "topLabel", {}, props.topLabel);
    if (topLabelNodes.length) {
      wrap.appendChild(_.div({ class: "cms-field-label" }, ...topLabelNodes));
    }
    const isMulti = props.multi || props.multiple;

    const controlEl = typeof props.control === "function" ? props.control() : props.control;
    const getHasValue = () => {
      const v = props.getValue ? props.getValue() : null;
      return !(v == null || v === "");
    };
    const clear = () => {
      if (props.disabled || props.readonly) return;
      props.onClear?.();
      props.onFocus?.();
    };

    const controlSlot = CMSwift.ui.renderSlot(slots, "control", {
      control: controlEl,
      clear,
      disabled: !!props.disabled,
      readonly: !!props.readonly,
      hasValue: getHasValue()
    }, null);

    let control = null;
    let clearBtn = null;

    if (controlSlot) {
      control = Array.isArray(controlSlot)
        ? _.div({ class: "cms-control" }, ...controlSlot)
        : controlSlot;
    } else {
      control = _.div({ class: "cms-control" });

      // left addon
      const left = _.div({ class: "cms-addon cms-addon-left" });
      const iconFallback = props.icon != null
        ? (typeof props.icon === "string" ? UI.Icon({ name: props.icon }) : props.icon)
        : null;
      const iconNode = CMSwift.ui.renderSlot(slots, "icon", {}, iconFallback);
      const prefixNode = CMSwift.ui.renderSlot(slots, "prefix", {}, props.prefix);
      renderSlotToArray(null, "default", {}, iconNode).forEach(n => left.appendChild(n));
      renderSlotToArray(null, "default", {}, prefixNode).forEach(n => left.appendChild(n));
      if (left.childNodes.length) control.appendChild(left);

      // middle: controlEl + floating label
      const mid = _.div({ class: "cms-mid" + (left.childNodes.length > 0 ? " cms-with-left" : ""), style: { position: "relative", flex: "1", minWidth: "0" } });
      if (controlEl) mid.appendChild(controlEl);

      const labelNodes = renderSlotToArray(slots, "label", {}, props.label);
      if (labelNodes.length) {
        const floatLabel = _.div({ class: uiClass(["cms-float-label", uiWhen(isMulti, "cms-multiselect")]) }, ...labelNodes);
        mid.appendChild(floatLabel);
      }

      control.appendChild(mid);

      // clear
      const defaultClear = props.clearable ? _.div({
        class: "cms-clear",
        title: "Clear",
        onClick: clear
      }, UI.Icon({ name: "close" })) : null;

      const clearNode = CMSwift.ui.renderSlot(slots, "clear", {

        disabled: !!props.disabled,
        readonly: !!props.readonly,
        hasValue: getHasValue()
      }, defaultClear);

      if (clearNode) {
        clearNode.onclick = (e) => {
          e.stopPropagation();
          clear();
        }
        renderSlotToArray(null, "default", {}, clearNode).forEach(n => control.appendChild(n));
      }

      clearBtn = defaultClear;
      if (clearBtn && props.clearable?.action) {
        props.clearable.action((v) => v ? clearBtn.classList.remove("cms-d-none") : clearBtn.classList.add("cms-d-none"));
      }

      // right addon
      const right = _.div({ class: "cms-addon cms-addon-right" });
      const iconRightFallback = props.iconRight != null
        ? (typeof props.iconRight === "string" ? UI.Icon({ name: props.iconRight }) : props.iconRight)
        : null;
      const iconRightNode = CMSwift.ui.renderSlot(slots, "iconRight", {}, iconRightFallback);
      const suffixNode = CMSwift.ui.renderSlot(slots, "suffix", {}, props.suffix);
      const shortcodeNode = CMSwift.ui.renderSlot(slots, "shortcode", { props }, uiCreateShortcodeHint(props, { className: "cms-shortcode cms-field-shortcode" }));
      renderSlotToArray(null, "default", {}, suffixNode).forEach(n => right.appendChild(n));
      renderSlotToArray(null, "default", {}, iconRightNode).forEach(n => right.appendChild(n));
      renderSlotToArray(null, "default", {}, shortcodeNode).forEach(n => right.appendChild(n));
      if (right.childNodes.length) {
        control.appendChild(right);
        mid.classList.add("cms-with-right");
      }
    }

    const resolveValue = (value) => {
      if (!value) return value;
      if (value && typeof value.action === "function") return value.value;
      if (Array.isArray(value) && typeof value[0] === "function") return value[0]();
      if (typeof value === "function") return value();
      return value;
    };
    const hasContent = (value) => {
      if (value == null || value === false || value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    };
    let messageEl = null;
    const renderMessage = () => {
      const statusOrder = [
        { key: "error", value: resolveValue(props.error), slot: "errorMessage", className: "cms-error" },
        { key: "warning", value: resolveValue(props.warning), slot: "warning", className: "cms-warning" },
        { key: "success", value: resolveValue(props.success), slot: "success", className: "cms-success" },
        { key: "note", value: resolveValue(props.note), slot: "note", className: "cms-note" },
        { key: "hint", value: resolveValue(props.hint), slot: "hint", className: "cms-hint" }
      ];
      let active = null;
      for (const item of statusOrder) {
        if (hasContent(item.value)) {
          active = item;
          break;
        }
      }
      const ctx = {
        error: statusOrder[0].value,
        warning: statusOrder[1].value,
        success: statusOrder[2].value,
        note: statusOrder[3].value,
        hint: statusOrder[4].value,
        props
      };
      const nodes = active
        ? renderSlotToArray(slots, active.slot, ctx, active.value)
        : [];
      const nextEl = nodes.length
        ? _.div({ class: active?.className }, ...nodes)
        : null;

      const stateKeys = ["error", "warning", "success", "note"];
      stateKeys.forEach((k) => control?.classList?.toggle(k, active?.key === k));

      if (messageEl) {
        if (nextEl) messageEl.replaceWith(nextEl);
        else messageEl.remove();
      } else if (nextEl) {
        wrap.appendChild(nextEl);
      }
      messageEl = nextEl;
    };

    // state updater
    const setHasValue = () => {
      const has = getHasValue();
      control?.classList?.toggle("has-value", has);
      if (clearBtn) clearBtn.style.display = has ? "" : "none";
    };

    // initial states
    setHasValue();
    control?.classList?.toggle("disabled", !!props.disabled);

    wrap.appendChild(control);
    const errorSlot = CMSwift.ui.getSlot(slots, "errorMessage");
    const warningSlot = CMSwift.ui.getSlot(slots, "warning");
    const successSlot = CMSwift.ui.getSlot(slots, "success");
    const noteSlot = CMSwift.ui.getSlot(slots, "note");
    const hintSlot = CMSwift.ui.getSlot(slots, "hint");
    const canReact = !!(props.error?.action || props.warning?.action || props.success?.action || props.note?.action || props.hint?.action)
      || (Array.isArray(props.error) && typeof props.error[0] === "function")
      || (Array.isArray(props.warning) && typeof props.warning[0] === "function")
      || (Array.isArray(props.success) && typeof props.success[0] === "function")
      || (Array.isArray(props.note) && typeof props.note[0] === "function")
      || (Array.isArray(props.hint) && typeof props.hint[0] === "function")
      || typeof props.error === "function"
      || typeof props.warning === "function"
      || typeof props.success === "function"
      || typeof props.note === "function"
      || typeof props.hint === "function"
      || typeof errorSlot === "function"
      || typeof warningSlot === "function"
      || typeof successSlot === "function"
      || typeof noteSlot === "function"
      || typeof hintSlot === "function";
    if (canReact) {
      CMSwift.reactive.effect(() => { renderMessage(); }, "UI.FormField:message");
    } else {
      renderMessage();
    }

    // expose small API so Input/Select can refresh state when value changes programmatically
    wrap._refresh = setHasValue;
    wrap._control = control;
    wrap._el = controlEl;

    return wrap;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.FormField = {
      signature: "UI.FormField(props)",
      description: "Wrapper field con label floating, hint/error/success/warning/note, clear e addons slot-based.",
      props: {
        label: "String|Node|Function",
        topLabel: "String|Node|Function",
        hint: "String|Node|Function",
        error: "String|Node|Function",
        success: "String|Node|Function",
        warning: "String|Node|Function",
        note: "String|Node|Function",
        icon: "String|Node|Function",
        iconRight: "String|Node|Function",
        prefix: "String|Node|Function",
        suffix: "String|Node|Function",
        clearable: "boolean",
        shortcode: "string|Array<string>|object",
        showShortcode: "boolean",
        disabled: "boolean",
        readonly: "boolean",
        control: "Node|Function",
        getValue: "() => any",
        onClear: "() => void",
        onFocus: "() => void",
        wrapClass: "string",
        slots: "{ label?, topLabel?, prefix?, suffix?, shortcode?, icon?, iconRight?, clear?, hint?, error?, control? }"
      },
      slots: {
        label: "Floating label content",
        topLabel: "Top label content",
        prefix: "Left addon content",
        suffix: "Right addon content",
        icon: "Left icon content",
        iconRight: "Right icon content",
        shortcode: "Shortcut badge content",
        clear: "Clear button slot (ctx: { clear, disabled, readonly, hasValue })",
        hint: "Hint content",
        errorMessage: "Error content",
        success: "Success content",
        warning: "Warning content",
        note: "Note content",
        control: "Override control wrapper (ctx: { control, clear, disabled, readonly, hasValue })"
      },
      returns: "HTMLDivElement (wrapper) con ._refresh()"
    };
  }
  UI.InputRaw = (props = {}) => {
    const el = _.input({
      class: uiClass(["cms-input-raw", props.class]),
      type: props.type || "text",
      name: props.name,
      placeholder: props.placeholder,
      autocomplete: props.autocomplete,
      value: props.value
    });

    let lastKnownValue = el.value ?? "";
    const syncAutofill = () => {
      const next = el.value ?? "";
      if (next === lastKnownValue) return;
      lastKnownValue = next;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    let autofillTimer = null;
    let autofillProbe = false;
    const scheduleAutofillProbe = () => {
      if (autofillProbe) return;
      autofillProbe = true;
      let count = 0;
      const tick = () => {
        syncAutofill();
        count += 1;
        if (count >= 10) {
          autofillProbe = false;
          return;
        }
        setTimeout(tick, 120);
      };
      setTimeout(tick, 40);
    };
    const startAutofillWatch = () => {
      if (autofillTimer) return;
      autofillTimer = setInterval(() => {
        if (document.activeElement !== el) {
          clearInterval(autofillTimer);
          autofillTimer = null;
          return;
        }
        syncAutofill();
      }, 250);
    };
    const stopAutofillWatch = () => {
      if (!autofillTimer) return;
      clearInterval(autofillTimer);
      autofillTimer = null;
    };
    el.addEventListener("input", () => { lastKnownValue = el.value ?? ""; });
    el.addEventListener("change", () => { lastKnownValue = el.value ?? ""; });
    el.addEventListener("animationstart", (e) => {
      if (e.animationName !== "cms-autofill") return;
      syncAutofill();
      startAutofillWatch();
      scheduleAutofillProbe();
    });
    el.addEventListener("focus", () => {
      startAutofillWatch();
      scheduleAutofillProbe();
      setTimeout(syncAutofill, 50);
    });
    el.addEventListener("blur", () => {
      stopAutofillWatch();
      setTimeout(syncAutofill, 0);
    });
    setTimeout(syncAutofill, 0);
    scheduleAutofillProbe();

    // model binding
    const model = props.model;
    if (model) {
      // Supporta rod direttamente
      if (typeof model === "object" && typeof model._bind === "function") {
        app.rodModel(el, model);
      }
      // Supporta [get,set] signal -> creiamo rodFromSignal
      else if (Array.isArray(model) && typeof model[0] === "function" && typeof model[1] === "function") {
        const r = app.rodFromSignal(model[0], model[1]);
        app.rodModel(el, r);
        // NOTE: se vuoi cleanup automatico qui, lo facciamo nel layer component (v2)
      }
    }
    uiRegisterShortcode(el, props, {
      isEnabled: () => !el.disabled,
      action: () => uiFocusShortcutTarget(el, { selectText: !!props.selectOnShortcode })
    });
    return el;
  };

  UI.Input = (props = {}) => {
    const slots = props.slots || {};
    const fieldProps = {
      ...props,
      label: props.label ?? props.placeholder
    };
    const input = _.input({
      class: uiClass(["cms-input", props.class]),
      type: props.type || "text",
      name: props.name,
      autocomplete: props.autocomplete,
      inputmode: props.inputmode,
      value: props.value ?? "",
      disabled: !!props.disabled,
      readOnly: !!props.readonly
    });

    let lastKnownValue = input.value ?? "";
    const syncAutofill = () => {
      const next = input.value ?? "";
      if (next === lastKnownValue) return;
      lastKnownValue = next;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    let autofillTimer = null;
    let autofillProbe = false;
    const scheduleAutofillProbe = () => {
      if (autofillProbe) return;
      autofillProbe = true;
      let count = 0;
      const tick = () => {
        syncAutofill();
        count += 1;
        if (count >= 10) {
          autofillProbe = false;
          return;
        }
        setTimeout(tick, 120);
      };
      setTimeout(tick, 40);
    };
    const startAutofillWatch = () => {
      if (autofillTimer) return;
      autofillTimer = setInterval(() => {
        if (document.activeElement !== input) {
          clearInterval(autofillTimer);
          autofillTimer = null;
          return;
        }
        syncAutofill();
      }, 250);
    };
    const stopAutofillWatch = () => {
      if (!autofillTimer) return;
      clearInterval(autofillTimer);
      autofillTimer = null;
    };

    // listeners
    input.addEventListener("input", () => {
      lastKnownValue = input.value ?? "";
      props.onInput?.(input.value);
    });
    input.addEventListener("change", () => {
      lastKnownValue = input.value ?? "";
      props.onChange?.(input.value);
    });
    input.addEventListener("focus", (e) => {
      props.onFocus?.(e);
      startAutofillWatch();
      scheduleAutofillProbe();
      setTimeout(syncAutofill, 50);
    });
    input.addEventListener("blur", (e) => {
      props.onBlur?.(e);
      stopAutofillWatch();
      setTimeout(syncAutofill, 0);
    });
    input.addEventListener("animationstart", (e) => {
      if (e.animationName !== "cms-autofill") return;
      syncAutofill();
      startAutofillWatch();
      scheduleAutofillProbe();
    });
    setTimeout(syncAutofill, 0);
    scheduleAutofillProbe();

    // model binding
    const model = props.model;
    if (model) {
      const bindInputRod = (rod) => {
        let syncing = false;

        const updateFromRod = (v) => {
          const next = v ?? "";
          if (input.value === next) return;
          input.value = next;
          lastKnownValue = next;
        };

        rod.action((v) => {
          if (syncing) return;
          syncing = true;
          try { updateFromRod(v); } finally { syncing = false; }
        });

        updateFromRod(rod.value);

        const onInput = (e) => {
          if (syncing || e?.isComposing) return;
          const next = input.value;
          if (rod.value === next) return;
          syncing = true;
          try { rod.value = next; } finally { syncing = false; }
        };

        input.addEventListener("input", onInput);
        input.addEventListener("compositionend", onInput);

        if (typeof rod.onDispose === "function") {
          rod.onDispose(() => {
            input.removeEventListener("input", onInput);
            input.removeEventListener("compositionend", onInput);
          });
        }
      };
      if (typeof model === "object" && typeof model._bind === "function") {
        bindInputRod(model);
      } else if (Array.isArray(model) && typeof model[0] === "function" && typeof model[1] === "function") {
        const r = CMSwift.rodFromSignal(model[0], model[1]);
        bindInputRod(r);
      }
    }

    const inputSlot = CMSwift.ui.renderSlot(slots, "input", { input, props }, input);
    const controlNode = Array.isArray(inputSlot)
      ? _.div({ style: { display: "contents" } }, ...inputSlot)
      : inputSlot;

    const field = UI.FormField({
      ...fieldProps,
      control: controlNode,
      getValue: () => input.value,
      onClear: () => {
        if (input.disabled || input.readOnly) return;
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      },
      onFocus: () => input.focus()
    });

    // keep UI in sync with programmatic updates:
    // (questa parte DIPENDE da come rodModel aggiorna input.value)
    input.addEventListener("input", () => field._refresh?.());
    input.addEventListener("change", () => field._refresh?.());

    // expose reference
    field._input = input;
    uiRegisterShortcode(input, props, {
      isEnabled: () => !input.disabled,
      action: () => uiFocusShortcutTarget(input, { selectText: !!props.selectOnShortcode })
    });

    return field;
  }
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};

    UI.meta.Input = {
      signature: "UI.Input(props)",
      description: "Input field with floating label, hint/error/success/warning/note, clearable control, icon, prefix/suffix, and reactive support (rod/signal).",
      props: {
        // value & model
        model: "rod | [get,set] signal",
        value: "string",

        // input native
        type: "string (default: 'text')",
        name: "string",
        autocomplete: "string",
        inputmode: "string",
        disabled: "boolean",
        readonly: "boolean",
        shortcode: "string|Array<string>|object",
        showShortcode: "boolean",

        // UI / UX
        label: "String|Node|Function (floating label)",
        topLabel: "String|Node|Function (label above, not floating)",
        placeholder: "String|Node|Function (alias of label when label is not set)",
        hint: "String|Node|Function",
        error: "String|Node|Function",
        success: "String|Node|Function",
        warning: "String|Node|Function",
        note: "String|Node|Function",
        clearable: "boolean",

        // addons
        icon: "String|Node|Function",
        iconRight: "String|Node|Function",
        prefix: "String|Node|Function",
        suffix: "String|Node|Function",

        // style
        class: "string (applicata all'input)",
        wrapClass: "string (applicata al field wrapper)",
        style: "object",

        // events
        onInput: "(value:string) => void",
        onChange: "(value:string) => void",
        onFocus: "(event) => void",
        onBlur: "(event) => void"
      },

      slots: {
        label: "Floating label (via FormField slots.label)",
        topLabel: "Top label (via FormField slots.topLabel)",
        prefix: "Left addon (via FormField slots.prefix)",
        suffix: "Right addon (via FormField slots.suffix)",
        shortcode: "Shortcut badge (via FormField slots.shortcode)",
        icon: "Left icon (via FormField slots.icon)",
        iconRight: "Right icon (via FormField slots.iconRight)",
        clear: "Clear button (via FormField slots.clear)",
        hint: "Hint content (via FormField slots.hint)",
        errorMessage: "Error content (via FormField slots.errorMessage)",
        success: "Success content (via FormField slots.success)",
        warning: "Warning content (via FormField slots.warning)",
        note: "Note content (via FormField slots.note)",
        input: "Custom input node (ctx: { input, props })"
      },

      returns: "HTMLDivElement (field wrapper) con ._input = HTMLInputElement"
    };
  }

  UI.Textarea = (props = {}) => {
    const slots = props.slots || {};
    const fieldProps = {
      ...props,
      label: props.label ?? props.placeholder,
      wrapClass: uiClass(["cms-textarea-field", props.wrapClass])
    };
    const textarea = _.textarea({
      class: uiClass(["cms-input", "cms-textarea", props.class]),
      name: props.name,
      autocomplete: props.autocomplete,
      inputmode: props.inputmode,
      rows: props.rows,
      cols: props.cols,
      maxLength: props.maxLength ?? props.maxlength,
      minLength: props.minLength ?? props.minlength,
      wrap: props.wrap,
      value: props.value ?? "",
      disabled: !!props.disabled,
      readOnly: !!props.readonly
    });

    textarea.addEventListener("input", () => {
      props.onInput?.(textarea.value);
    });
    textarea.addEventListener("change", () => {
      props.onChange?.(textarea.value);
    });
    textarea.addEventListener("focus", (e) => {
      props.onFocus?.(e);
    });
    textarea.addEventListener("blur", (e) => {
      props.onBlur?.(e);
    });

    const model = props.model;
    if (model) {
      const bindTextareaRod = (rod) => {
        let syncing = false;

        const updateFromRod = (v) => {
          const next = v ?? "";
          if (textarea.value === next) return;
          textarea.value = next;
        };

        rod.action((v) => {
          if (syncing) return;
          syncing = true;
          try { updateFromRod(v); } finally { syncing = false; }
        });

        updateFromRod(rod.value);

        const onInput = (e) => {
          if (syncing || e?.isComposing) return;
          const next = textarea.value;
          if (rod.value === next) return;
          syncing = true;
          try { rod.value = next; } finally { syncing = false; }
        };

        textarea.addEventListener("input", onInput);
        textarea.addEventListener("compositionend", onInput);

        if (typeof rod.onDispose === "function") {
          rod.onDispose(() => {
            textarea.removeEventListener("input", onInput);
            textarea.removeEventListener("compositionend", onInput);
          });
        }
      };
      if (typeof model === "object" && typeof model._bind === "function") {
        bindTextareaRod(model);
      } else if (Array.isArray(model) && typeof model[0] === "function" && typeof model[1] === "function") {
        const r = CMSwift.rodFromSignal(model[0], model[1]);
        bindTextareaRod(r);
      }
    }

    const textareaSlotName = CMSwift.ui.getSlot(slots, "textarea") != null ? "textarea" : "input";
    const textareaSlot = CMSwift.ui.renderSlot(slots, textareaSlotName, { textarea, input: textarea, props }, textarea);
    const controlNode = Array.isArray(textareaSlot)
      ? _.div({ style: { display: "contents" } }, ...textareaSlot)
      : textareaSlot;

    const field = UI.FormField({
      ...fieldProps,
      control: controlNode,
      getValue: () => textarea.value,
      onClear: () => {
        if (textarea.disabled || textarea.readOnly) return;
        textarea.value = "";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      },
      onFocus: () => textarea.focus()
    });

    textarea.addEventListener("input", () => field._refresh?.());
    textarea.addEventListener("change", () => field._refresh?.());

    field._input = textarea;
    field._textarea = textarea;
    uiRegisterShortcode(textarea, props, {
      isEnabled: () => !textarea.disabled,
      action: () => uiFocusShortcutTarget(textarea, { selectText: !!props.selectOnShortcode })
    });

    return field;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};

    UI.meta.Textarea = {
      signature: "UI.Textarea(props)",
      description: "Textarea field with floating label, hint/error/success/warning/note, clearable control, icon, prefix/suffix, and reactive support (rod/signal).",
      props: {
        model: "rod | [get,set] signal",
        value: "string",

        name: "string",
        autocomplete: "string",
        inputmode: "string",
        rows: "number|string",
        cols: "number|string",
        maxLength: "number|string",
        minLength: "number|string",
        wrap: "string",
        disabled: "boolean",
        readonly: "boolean",
        shortcode: "string|Array<string>|object",
        showShortcode: "boolean",

        label: "String|Node|Function (floating label)",
        topLabel: "String|Node|Function (label above, not floating)",
        placeholder: "String|Node|Function (alias of label when label is not set)",
        hint: "String|Node|Function",
        error: "String|Node|Function",
        success: "String|Node|Function",
        warning: "String|Node|Function",
        note: "String|Node|Function",
        clearable: "boolean",

        icon: "String|Node|Function",
        iconRight: "String|Node|Function",
        prefix: "String|Node|Function",
        suffix: "String|Node|Function",

        class: "string (applicata alla textarea)",
        wrapClass: "string (applicata al field wrapper)",
        style: "object",

        onInput: "(value:string) => void",
        onChange: "(value:string) => void",
        onFocus: "(event) => void",
        onBlur: "(event) => void"
      },

      slots: {
        label: "Floating label (via FormField slots.label)",
        topLabel: "Top label (via FormField slots.topLabel)",
        prefix: "Left addon (via FormField slots.prefix)",
        suffix: "Right addon (via FormField slots.suffix)",
        shortcode: "Shortcut badge (via FormField slots.shortcode)",
        icon: "Left icon (via FormField slots.icon)",
        iconRight: "Right icon (via FormField slots.iconRight)",
        clear: "Clear button (via FormField slots.clear)",
        hint: "Hint content (via FormField slots.hint)",
        errorMessage: "Error content (via FormField slots.errorMessage)",
        success: "Success content (via FormField slots.success)",
        warning: "Warning content (via FormField slots.warning)",
        note: "Note content (via FormField slots.note)",
        textarea: "Custom textarea node (ctx: { textarea, input, props })",
        input: "Alias slot for custom textarea node (ctx: { textarea, input, props })"
      },

      returns: "HTMLDivElement (field wrapper) con ._textarea = HTMLTextAreaElement"
    };
  }

  UI.Search = (props = {}) => {
    const slots = props.slots || {};
    const isBoundValue = (v) => !!v && ((typeof v === "object" && typeof v._bind === "function") || uiIsSignal(v));
    const valueBinding = isBoundValue(props.model)
      ? props.model
      : (isBoundValue(props.value) ? props.value : null);
    const initialValue = valueBinding
      ? (typeof valueBinding === "object" && typeof valueBinding._bind === "function" ? valueBinding.value : valueBinding[0]())
      : uiUnwrap(props.value);

    const [getQuery, setQueryState] = CMSwift.reactive.signal(initialValue == null ? "" : String(initialValue));
    const [getOpen, setOpen] = CMSwift.reactive.signal(false);
    const [getLoading, setLoading] = CMSwift.reactive.signal(false);
    const [getError, setError] = CMSwift.reactive.signal(null);
    const [getResults, setResults] = CMSwift.reactive.signal([]);
    const [getActive, setActive] = CMSwift.reactive.signal(-1);

    const uid = `cms-search-${Math.random().toString(36).slice(2, 10)}`;
    const cache = new Map();
    let modelSet = null;
    let searchTimer = null;
    let activeController = null;
    let requestId = 0;
    let menuPortalFrame = 0;
    let menuPortalBound = false;
    let lastActive = -1;
    let resultNodes = [];

    const toNumber = (value, fallback) => {
      const n = Number(uiUnwrap(value));
      return Number.isFinite(n) ? n : fallback;
    };
    const toBool = (value, fallback = false) => {
      const raw = uiUnwrap(value);
      return raw == null ? fallback : !!raw;
    };
    const isDisabled = () => toBool(props.disabled, false);
    const isReadonly = () => toBool(props.readonly, false);
    const minLength = () => Math.max(0, toNumber(props.minLength, props.endpoint ? 1 : 0));
    const debounceMs = () => Math.max(0, toNumber(props.debounce, 250));
    const getLabel = (item) => {
      const fn = props.getLabel || props.labelOf;
      if (typeof fn === "function") return fn(item);
      if (item == null) return "";
      if (typeof item === "string" || typeof item === "number") return String(item);
      return item.label ?? item.title ?? item.name ?? item.text ?? item.value ?? "";
    };
    const getValue = (item) => {
      const fn = props.getValue || props.valueOf;
      if (typeof fn === "function") return fn(item);
      if (item == null) return "";
      if (typeof item === "string" || typeof item === "number") return item;
      return item.value ?? item.id ?? item.key ?? getLabel(item);
    };
    const normalizeResults = (raw) => {
      if (Array.isArray(raw)) return raw;
      if (!raw || typeof raw !== "object") return [];
      if (Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw.results)) return raw.results;
      if (Array.isArray(raw.data)) return raw.data;
      return [];
    };
    const resolveListSource = async (source, query) => {
      const value = typeof source === "function" ? source(query, { props }) : uiUnwrap(source);
      return value && typeof value.then === "function" ? await value : value;
    };
    const buildEndpointUrl = (endpoint, query) => {
      const raw = typeof endpoint === "function" ? endpoint(query, { props }) : uiUnwrap(endpoint);
      if (!raw) return "";
      const base = String(raw);
      const url = new URL(base, window.location.href);
      const param = uiUnwrap(props.queryParam) || "q";
      if (param) url.searchParams.set(param, query);
      const params = typeof props.params === "function" ? props.params(query, { props }) : uiUnwrap(props.params);
      if (params && typeof params === "object") {
        Object.keys(params).forEach((key) => {
          const value = uiUnwrap(params[key]);
          if (value == null || value === false) return;
          url.searchParams.set(key, String(value));
        });
      }
      return url.toString();
    };
    const setQuery = (value, meta = {}) => {
      const next = value == null ? "" : String(value);
      if (getQuery() !== next) setQueryState(next);
      if (input.value !== next) input.value = next;
      if (modelSet && !meta.fromModel) modelSet(next);
      if (!meta.fromModel) props.onInput?.(next, meta.event);
      field?._refresh?.();
    };
    const close = () => {
      setOpen(false);
      setActive(-1);
    };
    const hasPanelContent = () => {
      if (getLoading() || getError() || getResults().length) return true;
      const query = getQuery().trim();
      if (query.length >= minLength()) return !!(props.emptyText || CMSwift.ui.getSlot(slots, "empty") != null);
      return !!(props.startText || CMSwift.ui.getSlot(slots, "empty") != null);
    };
    const open = () => {
      if (isDisabled()) return;
      if (!hasPanelContent()) return;
      setOpen(true);
      scheduleMenuPosition();
    };
    const clearResults = () => {
      setResults([]);
      setError(null);
      setActive(-1);
    };
    const runSearch = async (query, options = {}) => {
      const q = query == null ? "" : String(query).trim();
      const id = ++requestId;
      const endpoint = uiUnwrap(props.endpoint ?? props.url);
      const source = props.items ?? props.options ?? props.suggestions;

      if (activeController) {
        activeController.abort();
        activeController = null;
      }
      if (q.length < minLength()) {
        setLoading(false);
        clearResults();
        if (options.open && hasPanelContent()) open();
        else if (!hasPanelContent()) close();
        return;
      }

      const cacheEnabled = props.cache !== false;
      const cacheKey = `${endpoint || "local"}::${q}`;
      if (cacheEnabled && cache.has(cacheKey)) {
        setResults(cache.get(cacheKey));
        setError(null);
        setLoading(false);
        setActive(cache.get(cacheKey).length ? 0 : -1);
        if (options.open !== false) open();
        return;
      }

      setLoading(true);
      setError(null);
      if (options.open !== false) open();
      props.onSearch?.(q);

      try {
        let raw;
        if (endpoint) {
          activeController = new AbortController();
          const url = buildEndpointUrl(endpoint, q);
          const response = await fetch(url, {
            method: "GET",
            headers: props.headers,
            credentials: props.credentials,
            signal: activeController.signal
          });
          if (!response.ok) throw new Error(`Search request failed (${response.status})`);
          const parser = props.parseResponse || ((res) => res.json());
          raw = await parser(response);
        } else if (source != null) {
          const list = normalizeResults(await resolveListSource(source, q));
          const filterFn = props.filter || ((item, term) => String(getLabel(item)).toLowerCase().includes(term.toLowerCase()));
          raw = list.filter((item) => filterFn(item, q));
        } else {
          raw = [];
        }
        if (id !== requestId) return;
        const mapped = typeof props.mapResponse === "function" ? props.mapResponse(raw, q) : normalizeResults(raw);
        const results = normalizeResults(mapped);
        if (cacheEnabled) cache.set(cacheKey, results);
        setResults(results);
        setActive(results.length ? 0 : -1);
        props.onResults?.(results, q);
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (id !== requestId) return;
        setError(error);
        setResults([]);
        setActive(-1);
        props.onError?.(error, q);
      } finally {
        if (id === requestId) {
          setLoading(false);
          activeController = null;
          scheduleMenuPosition();
        }
      }
    };
    const scheduleSearch = (query, options = {}) => {
      if (searchTimer) clearTimeout(searchTimer);
      const delay = options.immediate ? 0 : debounceMs();
      searchTimer = setTimeout(() => {
        searchTimer = null;
        runSearch(query, options);
      }, delay);
    };
    const submit = (event) => {
      const q = getQuery();
      props.onSubmit?.(q, event);
      if (props.submitOnEnter === false) return;
      scheduleSearch(q, { immediate: true, open: true });
    };
    const selectResult = (item, event) => {
      if (!item) return;
      const value = getValue(item);
      const label = getLabel(item);
      if (props.commitValue === "value") setQuery(value, { event });
      else if (props.commitValue !== false) setQuery(label, { event });
      props.onSelect?.(item, { value, label, query: getQuery(), event });
      if (props.closeOnSelect !== false) close();
    };
    const moveActive = (dir) => {
      const list = getResults();
      if (!list.length) return;
      const current = getActive();
      const next = current < 0
        ? (dir > 0 ? 0 : list.length - 1)
        : Math.max(0, Math.min(list.length - 1, current + dir));
      setActive(next);
    };
    const renderHighlightedLabel = (label) => {
      const text = label == null ? "" : String(label);
      const q = getQuery().trim();
      if (!q || props.highlight === false) return [document.createTextNode(text)];
      const index = text.toLowerCase().indexOf(q.toLowerCase());
      if (index < 0) return [document.createTextNode(text)];
      return [
        document.createTextNode(text.slice(0, index)),
        _.mark({ class: "cms-search-highlight" }, text.slice(index, index + q.length)),
        document.createTextNode(text.slice(index + q.length))
      ];
    };
    const renderDefaultResult = (item) => {
      const label = getLabel(item);
      const description = item && typeof item === "object" ? (item.description ?? item.subtitle ?? item.note) : null;
      return _.div({ class: "cms-search-result-content" },
        _.div({ class: "cms-search-result-label" }, ...renderHighlightedLabel(label)),
        description ? _.div({ class: "cms-search-result-description" }, String(description)) : null
      );
    };
    const scheduleMenuPosition = () => {
      if (!getOpen() || menu.parentNode !== document.body) return;
      if (menuPortalFrame) return;
      menuPortalFrame = requestAnimationFrame(() => {
        menuPortalFrame = 0;
        if (!getOpen() || !root.isConnected || menu.parentNode !== document.body) return;
        const anchor = root.getBoundingClientRect();
        const gap = 6;
        const pad = 8;
        const maxWidth = Math.max(180, window.innerWidth - (pad * 2));
        const width = Math.min(Math.max(anchor.width, toNumber(props.minMenuWidth, 260)), maxWidth);
        const left = Math.max(pad, Math.min(anchor.left, window.innerWidth - width - pad));
        menu.style.width = `${width}px`;
        menu.style.left = `${left}px`;
        menu.style.right = "auto";
        const menuHeight = menu.getBoundingClientRect().height || 0;
        const spaceBelow = window.innerHeight - anchor.bottom - gap - pad;
        const spaceAbove = anchor.top - gap - pad;
        const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
        let top = placeAbove ? (anchor.top - gap - menuHeight) : (anchor.bottom + gap);
        top = Math.max(pad, Math.min(top, window.innerHeight - menuHeight - pad));
        menu.style.top = `${top}px`;
      });
    };
    const bindMenuPortalPosition = () => {
      if (menuPortalBound) return;
      menuPortalBound = true;
      window.addEventListener("resize", scheduleMenuPosition);
      window.addEventListener("scroll", scheduleMenuPosition, true);
    };
    const unbindMenuPortalPosition = () => {
      if (!menuPortalBound) return;
      menuPortalBound = false;
      window.removeEventListener("resize", scheduleMenuPosition);
      window.removeEventListener("scroll", scheduleMenuPosition, true);
    };
    const mountMenuPortal = () => {
      if (menu.parentNode === document.body) return;
      if (menuPortalFrame) {
        cancelAnimationFrame(menuPortalFrame);
        menuPortalFrame = 0;
      }
      menu.classList.add("portal");
      menu.style.display = "block";
      document.body.appendChild(menu);
      bindMenuPortalPosition();
      scheduleMenuPosition();
    };
    const unmountMenuPortal = () => {
      if (menuPortalFrame) {
        cancelAnimationFrame(menuPortalFrame);
        menuPortalFrame = 0;
      }
      unbindMenuPortalPosition();
      if (menu.parentNode !== root) root.appendChild(menu);
      menu.classList.remove("portal");
      menu.style.display = "";
      menu.style.position = "";
      menu.style.top = "";
      menu.style.left = "";
      menu.style.right = "";
      menu.style.width = "";
    };

    const hasFloatingLabel = props.label != null || CMSwift.ui.getSlot(slots, "label") != null;
    const syncPlaceholder = () => {
      if (!hasFloatingLabel) {
        input.placeholder = uiUnwrap(props.placeholder) || "";
        return;
      }
      input.placeholder = document.activeElement === input ? (uiUnwrap(props.placeholder) || "") : "";
    };

    const input = _.input({
      id: props.id,
      class: uiClass(["cms-input", "cms-search-input", props.inputClass]),
      type: "search",
      name: props.name,
      placeholder: hasFloatingLabel ? "" : props.placeholder,
      autocomplete: props.autocomplete || "off",
      inputmode: props.inputmode,
      value: getQuery(),
      disabled: isDisabled(),
      readOnly: isReadonly(),
      role: "combobox",
      "aria-autocomplete": "list",
      "aria-expanded": "false",
      "aria-controls": `${uid}-list`
    });

    const resultsWrap = _.div({
      id: `${uid}-list`,
      class: "cms-search-results",
      role: "listbox"
    });
    const menu = _.div({
      class: uiClass(["cms-search-menu", "cms-singularity-menu-select", props.menuClass, uiWhen(props.fill, "cms-select-menu-fill")]),
      "data-cms-overlay-portal": "true",
      onClick: (event) => event.stopPropagation()
    }, resultsWrap);
    const root = _.div({
      class: uiClass(["cms-search", props.class]),
      role: "presentation"
    }, input, menu);

    let field = null;

    if (valueBinding) {
      if (typeof valueBinding === "object" && typeof valueBinding._bind === "function") {
        valueBinding.action((v) => setQuery(v, { fromModel: true }));
        modelSet = (v) => {
          if (valueBinding.value !== v) valueBinding.value = v;
        };
      } else if (Array.isArray(valueBinding) && typeof valueBinding[0] === "function" && typeof valueBinding[1] === "function") {
        const get = valueBinding[0];
        const set = valueBinding[1];
        CMSwift.reactive.effect(() => { setQuery(get(), { fromModel: true }); }, "UI.Search:model");
        modelSet = (v) => set(v);
      }
    } else if (uiIsReactive(props.value)) {
      CMSwift.reactive.effect(() => { setQuery(uiUnwrap(props.value), { fromModel: true }); }, "UI.Search:value");
    }

    input.addEventListener("input", (event) => {
      setQuery(input.value, { event });
      if (props.searchOnInput !== false) scheduleSearch(input.value, { open: true });
    });
    input.addEventListener("change", (event) => props.onChange?.(input.value, event));
    input.addEventListener("focus", (event) => {
      syncPlaceholder();
      props.onFocus?.(event);
      if (props.openOnFocus !== false) {
        if (props.searchOnFocus && !getResults().length) scheduleSearch(input.value, { immediate: true, open: true });
        else open();
      }
    });
    input.addEventListener("blur", (event) => {
      syncPlaceholder();
      props.onBlur?.(event);
    });
    input.addEventListener("keydown", (event) => {
      if (isDisabled() || isReadonly()) return;
      const openNow = getOpen();
      const list = getResults();
      const active = getActive();
      if (event.key === "Escape") {
        if (openNow) {
          event.preventDefault();
          close();
        }
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!openNow) {
          open();
          if (!list.length) scheduleSearch(input.value, { immediate: true, open: true });
        } else moveActive(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!openNow) open();
        else moveActive(-1);
        return;
      }
      if (event.key === "Home" && openNow && list.length && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setActive(0);
        return;
      }
      if (event.key === "End" && openNow && list.length && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setActive(list.length - 1);
        return;
      }
      if (event.key === "Enter") {
        if (openNow && active >= 0 && list[active]) {
          event.preventDefault();
          selectResult(list[active], event);
        } else {
          submit(event);
        }
      }
    });

    const onDocClick = (event) => {
      if (!root.isConnected) return;
      const target = event.target;
      if (root.contains(target) || menu.contains(target)) return;
      close();
    };
    document.addEventListener("click", onDocClick, true);

    CMSwift.reactive.effect(() => {
      const openNow = getOpen();
      root.classList.toggle("open", openNow);
      input.setAttribute("aria-expanded", openNow ? "true" : "false");
      if (openNow) mountMenuPortal();
      else unmountMenuPortal();
    }, "UI.Search:open");

    CMSwift.reactive.effect(() => {
      const d = isDisabled();
      const r = isReadonly();
      root.classList.toggle("disabled", d);
      root.classList.toggle("readonly", r);
      input.disabled = d;
      input.readOnly = r;
    }, "UI.Search:disabled");

    CMSwift.reactive.effect(() => {
      const loading = getLoading();
      const error = getError();
      const results = getResults();
      const query = getQuery();
      resultsWrap.innerHTML = "";
      resultNodes = [];
      lastActive = -1;

      if (loading) {
        const loadingNode = CMSwift.ui.renderSlot(slots, "loading", { query }, props.loadingText || "Caricamento...");
        resultsWrap.appendChild(_.div({ class: "cms-search-empty is-loading" }, ...renderSlotToArray(null, "default", {}, loadingNode)));
      } else if (error) {
        const errorNode = CMSwift.ui.renderSlot(slots, "error", { error, query }, props.errorText || "Errore ricerca");
        resultsWrap.appendChild(_.div({ class: "cms-search-empty is-error" }, ...renderSlotToArray(null, "default", {}, errorNode)));
      } else if (!results.length) {
        const enoughQuery = query.trim().length >= minLength();
        const emptyDefault = enoughQuery ? (props.emptyText || "Nessun risultato") : (props.startText || "");
        const emptyNode = CMSwift.ui.renderSlot(slots, "empty", { query }, emptyDefault);
        if (emptyDefault || CMSwift.ui.getSlot(slots, "empty") != null) {
          resultsWrap.appendChild(_.div({ class: "cms-search-empty" }, ...renderSlotToArray(null, "default", {}, emptyNode)));
        }
      } else {
        results.forEach((item, index) => {
          const selected = false;
          const label = getLabel(item);
          const value = getValue(item);
          const select = (event) => selectResult(item, event);
          const content = CMSwift.ui.renderSlot(slots, "result", {
            item,
            index,
            active: selected,
            label,
            value,
            query,
            select
          }, renderDefaultResult(item));
          const node = _.div({
            id: `${uid}-result-${index}`,
            class: uiClass(["cms-search-result", selected ? "active" : ""]),
            role: "option",
            "aria-selected": selected ? "true" : "false",
            onMouseEnter: () => setActive(index),
            onMouseDown: (event) => event.preventDefault(),
            onClick: select
          }, ...renderSlotToArray(null, "default", {}, content));
          resultsWrap.appendChild(node);
          resultNodes[index] = node;
        });
      }
      if (!hasPanelContent()) close();
      scheduleMenuPosition();
    }, "UI.Search:render");

    CMSwift.reactive.effect(() => {
      const active = getActive();
      if (active === lastActive) return;
      if (resultNodes[lastActive]) {
        resultNodes[lastActive].classList.remove("active");
        resultNodes[lastActive].setAttribute("aria-selected", "false");
      }
      if (resultNodes[active]) {
        resultNodes[active].classList.add("active");
        resultNodes[active].setAttribute("aria-selected", "true");
        resultNodes[active].scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", `${uid}-result-${active}`);
      } else {
        input.removeAttribute("aria-activedescendant");
      }
      lastActive = active;
    }, "UI.Search:active");

    field = UI.FormField({
      ...props,
      icon: props.icon ?? "search",
      wrapClass: uiClass(["cms-search-field", props.wrapClass]),
      control: root,
      getValue: () => getQuery(),
      onClear: () => {
        if (isDisabled() || isReadonly()) return;
        setQuery("", {});
        clearResults();
        props.onClear?.();
      },
      onFocus: () => input.focus()
    });

    input.addEventListener("input", () => field._refresh?.());
    input.addEventListener("change", () => field._refresh?.());

    field._input = input;
    field._search = root;
    field._open = open;
    field._close = close;
    field._searchNow = () => runSearch(getQuery(), { immediate: true, open: true });
    field._getResults = getResults;
    field._setValue = (value) => setQuery(value, {});
    let disposed = false;
    field._dispose = () => {
      if (disposed) return;
      disposed = true;
      document.removeEventListener("click", onDocClick, true);
      if (searchTimer) clearTimeout(searchTimer);
      if (activeController) activeController.abort();
      unmountMenuPortal();
    };
    CMSwift._registerCleanup?.(field, field._dispose);
    uiRegisterShortcode(input, props, {
      isEnabled: () => !input.disabled,
      action: () => uiFocusShortcutTarget(input, { selectText: !!props.selectOnShortcode })
    });

    if (props.autoSearch || props.searchOnMount) {
      scheduleSearch(getQuery(), { immediate: true, open: false });
    }

    return field;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Search = {
      signature: "UI.Search(props)",
      description: "Professional search with FormField, GET fetch, debounce, AbortController, overlay results, optional cache, reactive binding, and keyboard navigation.",
      props: {
        model: "rod | [get,set] signal",
        value: "string | rod | [get,set] signal",
        endpoint: "string | (query, ctx) => string",
        url: "Alias of endpoint",
        method: "'GET' (internal)",
        queryParam: "string (default: 'q')",
        params: "object | (query, ctx) => object",
        headers: "object",
        credentials: "RequestCredentials",
        parseResponse: "(Response) => Promise<any>",
        mapResponse: "(payload, query) => Array",
        items: "Array | (query, ctx) => Array|Promise<Array>",
        options: "Local alias of items",
        suggestions: "Local alias of items",
        filter: "(item, query) => boolean",
        getLabel: "(item) => string",
        getValue: "(item) => any",
        minLength: "number (default: endpoint ? 1 : 0)",
        debounce: "number ms (default: 250)",
        cache: "boolean (default: true)",
        highlight: "boolean (default: true)",
        clearable: "boolean",
        label: "String|Node|Function",
        topLabel: "String|Node|Function",
        placeholder: "string",
        icon: "String|Node|Function (default: 'search')",
        iconRight: "String|Node|Function",
        shortcode: "string|Array<string>|object",
        showShortcode: "boolean",
        openOnFocus: "boolean",
        searchOnFocus: "boolean",
        searchOnInput: "boolean",
        searchOnMount: "boolean",
        autoSearch: "Alias of searchOnMount",
        closeOnSelect: "boolean",
        commitValue: "'label'|'value'|false",
        disabled: "boolean|Function|rod",
        readonly: "boolean|Function|rod",
        loadingText: "string",
        emptyText: "string",
        errorText: "string",
        startText: "string",
        class: "string",
        inputClass: "string",
        menuClass: "string",
        wrapClass: "string",
        style: "object"
      },
      slots: {
        result: "Result renderer ({ item, index, active, label, value, query, select })",
        empty: "Empty state ({ query })",
        loading: "Loading state ({ query })",
        error: "Error state ({ error, query })",
        label: "Floating label",
        topLabel: "Top label",
        prefix: "Left addon",
        suffix: "Right addon",
        icon: "Left icon",
        iconRight: "Right icon",
        shortcode: "Shortcut badge",
        clear: "Clear button"
      },
      events: {
        onInput: "(query, event)",
        onChange: "(query, event)",
        onSearch: "(query)",
        onResults: "(results, query)",
        onSelect: "(item, { value, label, query, event })",
        onSubmit: "(query, event)",
        onClear: "()",
        onError: "(error, query)",
        onFocus: "(event)",
        onBlur: "(event)"
      },
      keyboard: {
        ArrowDown: "Opens/moves to the next result",
        ArrowUp: "Moves to the previous result",
        Enter: "Selects the active result or submits the query",
        Escape: "Closes the overlay",
        "Cmd/Ctrl+Home": "First result",
        "Cmd/Ctrl+End": "Last result"
      },
      returns: "HTMLDivElement (field wrapper) with ._input, ._open(), ._close(), ._searchNow(), ._getResults(), ._setValue(value), ._dispose()"
    };
  }

  UI.Select = (props = {}) => {
    const fieldProps = {
      ...props,
      label: props.label ?? props.placeholder
    };
    const filterable = props.filterable;
    const isMulti = !!props.multiple || !!props.multi;
    const allowCustom = !!props.allowCustom || !!props.allowCustomValue;
    const slots = props.slots || {};
    const isBoundValue = (v) => !!v && ((typeof v === "object" && typeof v._bind === "function") || uiIsSignal(v));
    const valueBinding = isBoundValue(props.model)
      ? props.model
      : (isBoundValue(props.value) ? props.value : null);

    const toArray = (v) => {
      if (Array.isArray(v)) return v.slice();
      if (v == null || v === "") return [];
      return [v];
    };
    const normalizeValue = (v) => isMulti ? toArray(v) : v;
    const initialValue = valueBinding
      ? (typeof valueBinding === "object" && typeof valueBinding._bind === "function" ? valueBinding.value : valueBinding[0]())
      : props.value;

    // state
    const [getOpen, setOpen] = CMSwift.reactive.signal(false);
    const [getFilter, setFilter] = CMSwift.reactive.signal("");
    const [getValue, setValue] = CMSwift.reactive.signal(isMulti ? toArray(initialValue) : (initialValue ?? ""));
    const [getLoading, setLoading] = CMSwift.reactive.signal(false);
    const [getList, setList] = CMSwift.reactive.signal([]);      // normalized flat list
    const [getFlat, setFlat] = CMSwift.reactive.signal([]);      // flat selectable options only (no groups)
    const [getActive, setActive] = CMSwift.reactive.signal(-1);  // active index in flat selectable list

    let modelSet = null;

    // model binding
    if (valueBinding) {
      if (typeof valueBinding === "object" && typeof valueBinding._bind === "function") {
        setValue(normalizeValue(valueBinding.value));
        valueBinding.action((v) => setValue(normalizeValue(v)));
        modelSet = (v) => {
          const next = normalizeValue(v);
          if (valueBinding.value !== next) valueBinding.value = next;
        };
      } else if (Array.isArray(valueBinding) && typeof valueBinding[0] === "function" && typeof valueBinding[1] === "function") {
        const get = valueBinding[0];
        const set = valueBinding[1];
        CMSwift.reactive.effect(() => { setValue(normalizeValue(get())); }, "UI.Select:model");
        modelSet = (v) => set(normalizeValue(v));
      }
    }

    function isDisabled() {
      if (typeof props.disabled === "function") return props.disabled();
      else if (typeof props.disabled === "boolean") return props.disabled;
      else if (props?.disabled?.action) {
        return props.disabled.value;
      } else return false;
    }

    function normalizeOption(opt) {
      if (opt == null) return null;
      if (typeof opt === "string" || typeof opt === "number") {
        return { type: "option", label: String(opt), value: opt, disabled: false };
      }
      if (typeof opt === "object") {
        // group support: { label, options: [...] }
        if (Array.isArray(opt.options)) {
          return {
            type: "group",
            label: String(opt.label ?? ""),
            options: opt.options
          };
        }
        const label = opt.label ?? (opt.value != null ? String(opt.value) : "");
        return {
          type: "option",
          label: String(label),
          value: opt.value ?? opt.label ?? "",
          disabled: !!opt.disabled
        };
      }
      return { type: "option", label: String(opt), value: opt, disabled: false };
    }

    // Build display list with groups + flatten selectable list
    function buildLists(rawOptions) {
      const base = Array.isArray(rawOptions) ? rawOptions : [];
      const normalized = base.map(normalizeOption).filter(Boolean);

      const display = [];     // includes group headers + options
      const selectable = [];  // options only (no group headers)

      for (const item of normalized) {
        if (item.type === "group") {
          display.push({ type: "group", label: item.label });
          const gopts = (item.options || []).map(normalizeOption).filter(Boolean).filter(x => x.type === "option");
          for (const o of gopts) {
            display.push(o);
            selectable.push(o);
          }
        } else {
          display.push(item);
          selectable.push(item);
        }
      }

      setList(display);
      setFlat(selectable);
    }

    // supports async options
    async function loadOptions() {
      const src = props.options;
      let raw;

      try {
        const v = (typeof src === "function") ? src() : src;
        if (v && typeof v.then === "function") {
          setLoading(true);
          raw = await v;
        } else {
          raw = v;
        }
        buildLists(raw);
      } catch (e) {
        console.error("[UI.Select] options load error:", e);
        buildLists([]);
      } finally {
        setLoading(false);
      }
    }

    function commit(next) {
      const val = normalizeValue(next);
      setValue(val);
      if (modelSet) modelSet(val);
      props.onChange?.(val);
    }

    function toggleValue(val) {
      const list = toArray(getValue());
      const exists = list.some(v => v == val);
      const next = exists ? list.filter(v => v != val) : [...list, val];
      commit(next);
    }

    function selectValue(val, fromFilter = false) {
      if (isMulti) {
        toggleValue(val);
        if (fromFilter) clearFilterInput();
      } else {
        commit(val);
        close();
      }
    }

    function clearFilterInput() {
      setFilter("");
      if (filterInput) filterInput.value = "";
    }

    function close() {
      setOpen(false);
      clearFilterInput();
      setActive(-1);
    }

    async function open() {
      if (isDisabled()) return;
      setOpen(true);

      // load options (sync/async) on open
      await loadOptions();

      // set active to current selected, otherwise first enabled
      const current = getValue();
      const flat = getFlat();
      let idx = -1;
      if (isMulti) {
        const list = toArray(current);
        for (const val of list) {
          idx = flat.findIndex(o => o.value == val && !o.disabled);
          if (idx >= 0) break;
        }
      } else {
        idx = flat.findIndex(o => o.value == current && !o.disabled);
      }
      if (idx < 0) idx = flat.findIndex(o => !o.disabled);
      setActive(idx);

      if (filterInput) setTimeout(() => filterInput.focus(), 0);
    }

    function toggle() {
      if (getOpen()) close();
      else open();
    }

    // root select (control + menu)
    const root = _.div({
      class: uiClass(["cms-select", isMulti ? "multiple" : "", props.class]),
      tabIndex: isDisabled() ? -1 : 0,
      role: "combobox",
      "aria-expanded": "false",
      "aria-disabled": isDisabled() ? "true" : "false"
    });

    const valueNode = _.div({
      class: uiClass(["cms-select-value", isMulti ? "cms-select-value-multi" : ""])
    });
    CMSwift.reactive.effect(() => {
      const flat = getFlat();
      valueNode.innerHTML = "";
      if (isMulti) {
        const list = toArray(getValue());
        for (const val of list) {
          const opt = flat.find(o => o.value == val);
          const label = opt ? opt.label : (val == null ? "" : String(val));
          let removing = false;
          const chip = UI.Chip({
            label,
            dense: true,
            color: props.chipColor || props.color,
            icon: props.chipIcon || null,
            iconRight: props.chipIconRight || null,
            glossy: props.glossy,
            glow: props.glow,
            glass: props.chipGlass || props.glass,
            class: props.chipClass,
            flat: props.flat,
            rounded: props.rounded,
            outline: props.outline,
            shadow: props.chipShadow,
            lightShadow: props.lightShadow,
            gloss: props.gloss,
            border: props.border,
            size: props.chipSize,
            removable: true,
            onRemove: (e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              e?.stopImmediatePropagation?.();
              if (removing) return;
              removing = true;
              toggleValue(val);
            }
          });
          valueNode.appendChild(chip);
        }
      } else {
        const v = getValue();
        const opt = flat.find(o => o.value == v);
        valueNode.textContent = opt ? opt.label : ((v == null || v === "") ? "" : String(v));
      }
    }, "UI.Select:value");

    const arrowWrap = _.div({ class: "cms-select-arrow" });
    CMSwift.reactive.effect(() => {
      const arrowNode = CMSwift.ui.renderSlot(slots, "arrow", { open: getOpen() }, UI.Icon("#chevron-down"));
      arrowWrap.innerHTML = "";
      renderSlotToArray(null, "default", {}, arrowNode).forEach(n => arrowWrap.appendChild(n));
    }, "UI.Select:arrow");

    const control = _.div({ class: "cms-select-control", onClick: toggle },
      valueNode,
      arrowWrap
    );

    const optionsWrap = _.div({
      class: "cms-select-options",
      role: "listbox",
      "aria-multiselectable": isMulti ? "true" : "false"
    });

    const filterWrap = _.div({ class: "cms-select-filter cms-d-none" });
    let filterInput = null;
    const defaultFilterInput = _.input({
      class: "cms-input",
      type: "text",
      placeholder: props.filterPlaceholder || "Cerca...",
      onInput: (e) => setFilter(e.target.value || "")
    });
    const renderFilterSlot = () => {
      const filterNode = CMSwift.ui.renderSlot(slots, "filter", {
        value: getFilter(),
        setValue: (v) => {
          const next = v == null ? "" : String(v);
          setFilter(next);
          if (filterInput && "value" in filterInput) filterInput.value = next;
        },
        close
      }, defaultFilterInput);
      filterWrap.innerHTML = "";
      const nodes = renderSlotToArray(null, "default", {}, filterNode);
      nodes.forEach(n => filterWrap.appendChild(n));
      filterInput = nodes.length === 1 && nodes[0] && nodes[0].tagName === "INPUT" ? nodes[0] : null;
      if (filterInput) filterInput.value = getFilter() || "";
    };
    renderFilterSlot();
    CMSwift.reactive.effect(() => {
      const next = getFilter() || "";
      if (filterInput && "value" in filterInput && filterInput.value !== next) {
        filterInput.value = next;
      }
    }, "UI.Select:filterValue");

    if (typeof filterable === "boolean") filterable ? filterWrap.classList.remove("cms-d-none") : filterWrap.classList.add("cms-d-none");
    else if (filterable?.action) {
      filterable.action((v) => {
        v ? filterWrap.classList.remove("cms-d-none") : filterWrap.classList.add("cms-d-none");
      });
      filterable.value ? filterWrap.classList.remove("cms-d-none") : filterWrap.classList.add("cms-d-none");;
    }
    //copia del props
    const menuProps = { ...props };
    applyCommonProps(menuProps);

    const stateMenu = uiComputed([menuProps.color, menuProps.state], () => {
      const color = uiUnwrap(menuProps.color) || uiUnwrap(menuProps.state) || "";
      return ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"].includes(color)
        ? color
        : (uiUnwrap(menuProps.state) || "");
    });
    const menu = _.div({
      class: uiClass(["cms-select-menu", "cms-singularity-menu-select", stateMenu, menuProps.class, uiWhen(props.fill, "cms-select-menu-fill")]),
      "data-cms-overlay-portal": "true",
      onClick: (e) => e.stopPropagation()
    },
      filterWrap, optionsWrap
    );
    let menuPortalFrame = 0;
    let menuPortalBound = false;

    const scheduleMenuPosition = () => {
      if (!getOpen() || menu.parentNode !== document.body) return;
      if (menuPortalFrame) return;
      menuPortalFrame = requestAnimationFrame(() => {
        menuPortalFrame = 0;
        if (!getOpen() || !root.isConnected || menu.parentNode !== document.body) return;
        const anchor = root.getBoundingClientRect();
        const gap = 6;
        const pad = 8;
        const maxWidth = Math.max(160, window.innerWidth - (pad * 2));
        const width = Math.min(Math.max(anchor.width, 180), maxWidth);
        const left = Math.max(pad, Math.min(anchor.left, window.innerWidth - width - pad));

        menu.style.width = `${width}px`;
        menu.style.left = `${left}px`;
        menu.style.right = "auto";
        menu.style.marginTop = "0";

        const menuHeight = menu.getBoundingClientRect().height || 0;
        const spaceBelow = window.innerHeight - anchor.bottom - gap - pad;
        const spaceAbove = anchor.top - gap - pad;
        const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
        let top = placeAbove ? (anchor.top - gap - menuHeight) : (anchor.bottom + gap);
        top = Math.max(pad, Math.min(top, window.innerHeight - menuHeight - pad));
        menu.style.top = `${top}px`;
      });
    };

    const bindMenuPortalPosition = () => {
      if (menuPortalBound) return;
      menuPortalBound = true;
      window.addEventListener("resize", scheduleMenuPosition);
      window.addEventListener("scroll", scheduleMenuPosition, true);
    };

    const unbindMenuPortalPosition = () => {
      if (!menuPortalBound) return;
      menuPortalBound = false;
      window.removeEventListener("resize", scheduleMenuPosition);
      window.removeEventListener("scroll", scheduleMenuPosition, true);
    };

    const mountMenuPortal = () => {
      if (menu.parentNode === document.body) return;
      if (menuPortalFrame) {
        cancelAnimationFrame(menuPortalFrame);
        menuPortalFrame = 0;
      }
      menu.classList.add("portal");
      menu.style.display = "block";
      document.body.appendChild(menu);
      bindMenuPortalPosition();
      scheduleMenuPosition();
    };

    const unmountMenuPortal = () => {
      if (menuPortalFrame) {
        cancelAnimationFrame(menuPortalFrame);
        menuPortalFrame = 0;
      }
      unbindMenuPortalPosition();
      if (menu.parentNode !== root) root.appendChild(menu);
      menu.classList.remove("portal");
      menu.style.display = "";
      menu.style.position = "";
      menu.style.top = "";
      menu.style.left = "";
      menu.style.right = "";
      menu.style.width = "";
      menu.style.marginTop = "";
    };

    root.appendChild(control);
    root.appendChild(menu);

    // open class + aria
    CMSwift.reactive.effect(() => {
      const o = getOpen();
      root.classList.toggle("open", o);
      root.setAttribute("aria-expanded", o ? "true" : "false");
      if (o) mountMenuPortal();
      else unmountMenuPortal();
    }, "UI.Select:open");

    CMSwift.reactive.effect(() => {
      const d = isDisabled();
      root.classList.toggle("disabled", d);
      root.tabIndex = d ? -1 : 0;
      root.setAttribute("aria-disabled", d ? "true" : "false");
    }, "UI.Select:disabled");

    // render options with filter (active paint in separate effect)
    let optionNodes = [];
    let lastActive = -1;
    let activeIndex = -1;

    function paintActive() {
      const active = getActive();
      activeIndex = active;
      if (active === lastActive) return;
      if (optionNodes[lastActive]) optionNodes[lastActive].classList.remove("active");
      if (optionNodes[active]) optionNodes[active].classList.add("active");
      lastActive = active;
      if (active >= 0) optionNodes[active]?.scrollIntoView({ block: "nearest" });
    }

    CMSwift.reactive.effect(() => {
      const display = getList();
      const flat = getFlat();
      const filter = (getFilter() || "").toLowerCase().trim();
      const current = getValue();
      const selectedValues = isMulti ? toArray(current) : [current];
      const loading = getLoading();
      const activeSnapshot = activeIndex;

      optionsWrap.innerHTML = "";
      optionNodes = [];
      lastActive = -1;

      // build filtered view:
      // we filter only options, group headers appear only if their options remain
      const nodes = [];
      let flatIndex = 0;

      const pushOption = (opt) => {
        const selected = selectedValues.some(v => v == opt.value);
        const disabled = !!opt.disabled;

        const cls = [
          "cms-select-option",
          selected ? "selected" : "",
          disabled ? "disabled" : ""
        ].filter(Boolean).join(" ");

        const select = () => {
          if (isMulti) toggleValue(opt.value);
          else { commit(opt.value); close(); }
        };

        const content = CMSwift.ui.renderSlot(slots, "option", {
          opt,
          selected,
          active: flatIndex === activeSnapshot,
          disabled,
          select
        }, opt.label);
        const contentNodes = renderSlotToArray(null, "default", {}, content);

        const node = _.div({
          class: cls,
          "data-flat-index": String(flatIndex),
          // da sistemare nel futuro
          //onMouseEnter: () => setActive(flatIndex),
          onClick: disabled ? null : select
        }, ...contentNodes);

        nodes.push(node);
        optionNodes[flatIndex] = node;
        flatIndex++;
      };

      // If filter active, we filter against flat list; groups become irrelevant visually.
      if (filter) {
        const filtered = flat.filter(o => o.label.toLowerCase().includes(filter));
        if (filtered.length === 0) {
          const emptyNode = CMSwift.ui.renderSlot(slots, "empty", { filter }, props.emptyText || "Nessuna opzione");
          optionsWrap.appendChild(_.div({ class: "cms-select-empty" }, ...renderSlotToArray(null, "default", {}, emptyNode)));
          if (getOpen()) scheduleMenuPosition();
          return;
        }
        for (const opt of filtered) pushOption(opt);
      } else {
        // no filter: render grouped display list with headers
        let hadAnyOption = false;
        for (const item of display) {
          if (item.type === "group") {
            const groupNode = CMSwift.ui.renderSlot(slots, "group", { label: item.label }, item.label);
            nodes.push(_.div({ class: "cms-select-group" }, ...renderSlotToArray(null, "default", {}, groupNode)));
          } else {
            hadAnyOption = true;
            pushOption(item);
          }
        }
        if (!hadAnyOption) {
          const emptyNode = CMSwift.ui.renderSlot(slots, "empty", { filter }, props.emptyText || "Nessuna opzione");
          optionsWrap.appendChild(_.div({ class: "cms-select-empty" }, ...renderSlotToArray(null, "default", {}, emptyNode)));
          if (getOpen()) scheduleMenuPosition();
          return;
        }
      }

      if (loading) {
        const loadingNode = CMSwift.ui.renderSlot(slots, "loading", {}, "Caricamento...");
        optionsWrap.appendChild(_.div({ class: "cms-select-empty" }, ...renderSlotToArray(null, "default", {}, loadingNode)));
        if (getOpen()) scheduleMenuPosition();
        return;
      }

      for (const n of nodes) optionsWrap.appendChild(n);
      paintActive();
      if (getOpen()) scheduleMenuPosition();
    }, "UI.Select:render");

    CMSwift.reactive.effect(() => {
      paintActive();
    }, "UI.Select:paintActive");

    // outside click + escape cleanup
    const onDocClick = (e) => {
      if (!root.isConnected) return;
      const t = e.target;
      if (root.contains(t)) return;
      if (menu.contains(t)) return;
      close();
    };
    document.addEventListener("click", onDocClick, true);

    const onKeyDown = (e) => {
      if (isDisabled()) return;

      const openNow = getOpen();
      const flat = getFlat();
      const active = getActive();
      const isFilterTarget = filterInput && e.target === filterInput;

      const nextEnabled = (start, dir) => {
        let i = start;
        while (i >= 0 && i < flat.length) {
          if (!flat[i].disabled) return i;
          i += dir;
        }
        return -1;
      };

      const findMatchByFilter = (term) => {
        if (!term) return null;
        const t = term.toLowerCase();
        let exact = flat.find(o => String(o.label).toLowerCase() === t || String(o.value).toLowerCase() === t);
        if (!exact) exact = flat.find(o => String(o.label).toLowerCase().includes(t));
        return exact && !exact.disabled ? exact : null;
      };

      if (e.key === "Escape") {
        if (openNow) { e.preventDefault(); close(); }
        return;
      }

      if (isFilterTarget && (e.key === "Enter" || e.key === " ")) {
        const term = (getFilter() || "").trim();
        if (term) {
          const match = findMatchByFilter(term);
          if (match) {
            e.preventDefault();
            selectValue(match.value, true);
            return;
          }
          if (allowCustom && e.key === "Enter") {
            e.preventDefault();
            selectValue(term, true);
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            return;
          }
        }
        if (e.key === " ") return;
      }

      if (e.key === "Enter" || e.key === " ") {
        // open if closed, otherwise commit active
        e.preventDefault();
        if (!openNow) { open(); return; }
        if (active >= 0 && flat[active] && !flat[active].disabled) {
          if (isMulti) toggleValue(flat[active].value);
          else { commit(flat[active].value); close(); }
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!openNow) { open(); return; }
        const i = nextEnabled(active < 0 ? 0 : active + 1, +1);
        if (i >= 0) setActive(i);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!openNow) { open(); return; }
        const i = nextEnabled(active < 0 ? flat.length - 1 : active - 1, -1);
        if (i >= 0) setActive(i);
        return;
      }

      if (e.key === "Home") {
        if (!openNow) return;
        e.preventDefault();
        const i = nextEnabled(0, +1);
        if (i >= 0) setActive(i);
        return;
      }

      if (e.key === "End") {
        if (!openNow) return;
        e.preventDefault();
        const i = nextEnabled(flat.length - 1, -1);
        if (i >= 0) setActive(i);
        return;
      }
    };

    // attach keydown to root + filter wrapper
    root.addEventListener("keydown", onKeyDown);
    filterWrap.addEventListener("keydown", onKeyDown);

    let disposed = false;
    root._dispose = () => {
      if (disposed) return;
      disposed = true;
      document.removeEventListener("click", onDocClick, true);
      root.removeEventListener("keydown", onKeyDown);
      filterWrap.removeEventListener("keydown", onKeyDown);
      unmountMenuPortal();
    };

    // Wrap in FormField
    const field = UI.FormField({
      ...fieldProps,
      control: root,
      clearable: props.clearable,
      disabled: isDisabled(),
      readonly: false,
      getValue: () => {
        const v = getValue();
        return isMulti ? (Array.isArray(v) && v.length ? v : "") : v;
      },
      onClear: () => {
        if (isDisabled()) return;
        commit(isMulti ? [] : null);
        close();
      },
      onFocus: () => {
        // open on focus (nice UX)
        open();
      }
    });

    // refresh has-value when value changes
    CMSwift.reactive.effect(() => { field._refresh?.(); }, "UI.Select:fieldRefresh");

    field._select = root;
    field._dispose = root._dispose;
    CMSwift._registerCleanup?.(field, field._dispose);
    uiRegisterShortcode(field, props, {
      isEnabled: () => !isDisabled(),
      action: () => {
        if (isDisabled()) return false;
        uiFocusShortcutTarget(root);
        open();
      }
    });

    loadOptions();

    return field;
  }
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Select = {
      signature: "UI.Select(props)",
      description: "Select premium: keyboard nav, option groups, async options, filter, clearable, multi select, valori custom da filtro. Wrappato in UI.FormField.",

      props: {
        options: "Array<option|group> | () => Array<option|group> | async () => Promise<Array<option|group>>",
        value: "any",
        model: "rod | [get,set] signal",

        label: "String|Node|Function (floating)",
        placeholder: "String|Node|Function (alias of label when label is not set)",
        topLabel: "String|Node|Function",
        hint: "String|Node|Function",
        error: "String|Node|Function",
        success: "String|Node|Function",
        warning: "String|Node|Function",
        note: "String|Node|Function",

        clearable: "boolean",
        filterable: "boolean",
        multiple: "boolean",
        multi: "boolean (alias multiple)",
        allowCustom: "boolean (consenti valori custom dal filtro)",
        allowCustomValue: "boolean (alias allowCustom)",
        filterPlaceholder: "string",
        emptyText: "string",
        shortcode: "string|Array<string>|object",
        showShortcode: "boolean",

        icon: "String|Node|Function",
        iconRight: "String|Node|Function",
        prefix: "String|Node|Function",
        suffix: "String|Node|Function",

        disabled: "boolean | () => boolean",
        dense: "boolean",
        class: "string",
        wrapClass: "string",
        slots: "{ clear?, arrow?, filter?, option?, group?, empty?, loading? }",

        onChange: "(value:any) => void"
      },

      slots: {
        clear: "Clear button (via FormField slots.clear)",
        arrow: "Arrow slot (ctx: { open })",
        filter: "Filter input slot (ctx: { value, setValue, close })",
        option: "Option renderer (ctx: { opt, selected, active, disabled, select })",
        group: "Group header (ctx: { label })",
        empty: "Empty state (ctx: { filter })",
        loading: "Loading state (ctx: {})",
        label: "Floating label (via FormField slots.label)",
        topLabel: "Top label (via FormField slots.topLabel)",
        prefix: "Left addon (via FormField slots.prefix)",
        suffix: "Right addon (via FormField slots.suffix)",
        shortcode: "Shortcut badge (via FormField slots.shortcode)",
        icon: "Left icon (via FormField slots.icon)",
        iconRight: "Right icon (via FormField slots.iconRight)",
        hint: "Hint content (via FormField slots.hint)",
        errorMessage: "Error content (via FormField slots.errorMessage)",
        success: "Success content (via FormField slots.success)",
        warning: "Warning content (via FormField slots.warning)",
        note: "Note content (via FormField slots.note)"
      },

      keyboard: ["Enter/Space", "ArrowUp", "ArrowDown", "Home", "End", "Escape"],

      returns: "HTMLDivElement (wrapper field) con ._select, ._dispose()"
    };
  }

  UI.Upload = (props = {}) => {
    applyCommonProps(props);
    const slots = props.slots || {};
    const [getFiles, setFiles] = CMSwift.reactive.signal([]);
    const [getDragging, setDragging] = CMSwift.reactive.signal(false);
    const [getBusy, setBusy] = CMSwift.reactive.signal(false);
    const [getError, setError] = CMSwift.reactive.signal(null);
    let seq = 0;
    let disposed = false;

    const isDisabled = () => !!uiUnwrap(props.disabled) || !!uiUnwrap(props.readonly);
    const isMultiple = () => props.multiple !== false && props.single !== true;
    const getFieldName = () => props.fieldName || props.paramName || props.name || "file";
    const getParallel = () => Math.max(1, Number(uiUnwrap(props.parallelUploads ?? props.parallel) || 1));
    const getRetry = () => {
      const retry = uiUnwrap(props.retry);
      if (retry === true) return { attempts: 2, delay: 350, factor: 2 };
      if (!retry) return { attempts: 0, delay: 350, factor: 2 };
      return {
        attempts: Math.max(0, Number(retry.attempts ?? retry.retries ?? 0)),
        delay: Math.max(0, Number(retry.delay ?? 350)),
        factor: Math.max(1, Number(retry.factor ?? 2))
      };
    };
    const toList = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return Array.from(value);
    };
    const formatBytes = (size) => {
      const n = Number(size || 0);
      if (n < 1024) return `${n} B`;
      if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
      if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
      return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
    };
    const getAccepted = () => String(uiUnwrap(props.acceptedFiles ?? props.accept) || "").trim();
    const acceptMatches = (file) => {
      const accept = getAccepted();
      if (!accept) return true;
      const name = String(file.name || "").toLowerCase();
      const type = String(file.type || "").toLowerCase();
      return accept.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean).some((rule) => {
        if (rule.startsWith(".")) return name.endsWith(rule);
        if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
        return type === rule;
      });
    };
    const activeFiles = () => getFiles().filter((item) => item.status !== "rejected" && item.status !== "removed");
    const totalSize = (extra = 0) => activeFiles().reduce((sum, item) => sum + Number(item.size || 0), extra);
    const refresh = () => {
      setFiles(getFiles().slice());
      root.classList.toggle("is-busy", getFiles().some((item) => item.status === "uploading"));
      root.classList.toggle("has-files", getFiles().some((item) => item.status !== "removed"));
      props.onChange?.(getFiles().slice(), api);
    };
    const rejectFile = (file, reason, detail = null) => {
      const item = {
        id: `upload_${Date.now()}_${++seq}`,
        file,
        name: file?.name || "file",
        size: Number(file?.size || 0),
        type: file?.type || "",
        status: "rejected",
        progress: 0,
        error: reason,
        detail,
        attempts: 0,
        response: null,
        xhr: null
      };
      getFiles().push(item);
      props.onRejected?.(item, { reason, detail, api });
      return item;
    };
    const validateFile = async (file, nextCount) => {
      const maxFiles = props.maxFiles == null ? null : Number(uiUnwrap(props.maxFiles));
      const maxFileSize = props.maxFileSize == null ? null : Number(uiUnwrap(props.maxFileSize));
      const minFileSize = props.minFileSize == null ? null : Number(uiUnwrap(props.minFileSize));
      const maxTotalSize = props.maxTotalSize == null ? null : Number(uiUnwrap(props.maxTotalSize));
      if (maxFiles != null && nextCount > maxFiles) return "max-files";
      if (maxFileSize != null && Number(file.size || 0) > maxFileSize) return "max-file-size";
      if (minFileSize != null && Number(file.size || 0) < minFileSize) return "min-file-size";
      if (maxTotalSize != null && totalSize(Number(file.size || 0)) > maxTotalSize) return "max-total-size";
      if (!acceptMatches(file)) return "accept";
      const validator = props.filter || props.acceptFile || props.validate;
      if (typeof validator === "function") {
        const out = await validator(file, { files: getFiles().slice(), api });
        if (out === false) return "filter";
        if (typeof out === "string") return out;
      }
      return null;
    };
    const reconcileRejected = async () => {
      for (const item of getFiles()) {
        if (item.status !== "rejected" || item.error !== "max-files") continue;
        const reason = await validateFile(item.file, activeFiles().length + 1);
        if (reason) {
          item.error = reason;
          continue;
        }
        item.status = "queued";
        item.progress = 0;
        item.error = null;
        item.detail = null;
      }
    };
    const createItem = (file) => ({
      id: `upload_${Date.now()}_${++seq}`,
      file,
      name: file?.name || "file",
      size: Number(file?.size || 0),
      type: file?.type || "",
      status: "queued",
      progress: 0,
      bytesUploaded: 0,
      error: null,
      detail: null,
      attempts: 0,
      response: null,
      xhr: null
    });
    const addFiles = async (inputFiles, meta = {}) => {
      if (isDisabled()) return [];
      setError(null);
      const incoming = toList(inputFiles);
      const added = [];
      if (!isMultiple() && incoming.length) {
        clear({ silent: true });
      }
      for (const file of incoming) {
        const reason = await validateFile(file, activeFiles().length + 1);
        if (reason) {
          rejectFile(file, reason);
          continue;
        }
        const item = createItem(file);
        getFiles().push(item);
        added.push(item);
        props.onAdded?.(item, { file, meta, api });
        if (!isMultiple()) break;
      }
      refresh();
      if (added.length && props.autoUpload) upload();
      return added;
    };
    const clear = (opts = {}) => {
      for (const item of getFiles()) {
        if (item.status === "uploading") abort(item);
        item.status = "removed";
      }
      setFiles([]);
      setError(null);
      refresh();
      if (!opts.silent) props.onClear?.(api);
    };
    const remove = async (itemOrId) => {
      const item = typeof itemOrId === "string" ? getFiles().find((entry) => entry.id === itemOrId) : itemOrId;
      if (!item) return;
      if (item.status === "uploading") abort(item);
      const next = getFiles().filter((entry) => entry !== item);
      setFiles(next);
      await reconcileRejected();
      refresh();
      props.onRemove?.(item, { api });
    };
    const abort = (itemOrId) => {
      const item = typeof itemOrId === "string" ? getFiles().find((entry) => entry.id === itemOrId) : itemOrId;
      if (!item || item.status !== "uploading") return;
      item.status = "canceled";
      item.error = "canceled";
      item.xhr?.abort?.();
      props.onCancel?.(item, { api });
      refresh();
    };
    const abortAll = () => getFiles().filter((item) => item.status === "uploading").forEach(abort);
    const resolveUploadOptions = async (item) => {
      const base = {
        url: uiUnwrap(props.url),
        method: uiUnwrap(props.method || "POST"),
        headers: props.headers,
        formFields: props.formFields || props.fields,
        fieldName: getFieldName(),
        withCredentials: !!uiUnwrap(props.withCredentials ?? props.credentials),
        sendRaw: !!uiUnwrap(props.sendRaw)
      };
      if (typeof props.factory === "function") {
        try {
          const out = await props.factory(item.file, { item, files: getFiles().slice(), api });
          if (out && typeof out === "object") Object.assign(base, out);
          else if (out != null) throw new Error("factory must return an object");
        } catch (error) {
          props.onFactoryFailed?.(error, { item, api });
          throw error;
        }
      }
      return base;
    };
    const applyHeaders = (xhr, headers, item) => {
      const resolved = typeof headers === "function" ? headers(item.file, { item, api }) : headers;
      if (!resolved) return;
      if (resolved instanceof Headers) {
        resolved.forEach((value, key) => xhr.setRequestHeader(key, value));
      } else if (Array.isArray(resolved)) {
        resolved.forEach((entry) => {
          if (Array.isArray(entry)) xhr.setRequestHeader(entry[0], entry[1]);
          else if (entry?.name) xhr.setRequestHeader(entry.name, entry.value);
        });
      } else if (typeof resolved === "object") {
        Object.keys(resolved).forEach((key) => xhr.setRequestHeader(key, resolved[key]));
      }
    };
    const appendFields = (form, fields, item) => {
      const resolved = typeof fields === "function" ? fields(item.file, { item, api }) : fields;
      if (!resolved) return;
      if (Array.isArray(resolved)) {
        resolved.forEach((entry) => {
          if (Array.isArray(entry)) form.append(entry[0], entry[1]);
          else if (entry?.name) form.append(entry.name, entry.value);
        });
      } else if (typeof resolved === "object") {
        Object.keys(resolved).forEach((key) => form.append(key, resolved[key]));
      }
    };
    const uploadViaXhr = (item, options) => new Promise((resolve, reject) => {
      if (!options.url) {
        reject(new Error("UI.Upload: url is required"));
        return;
      }
      if (typeof XMLHttpRequest !== "function") {
        reject(new Error("UI.Upload: XMLHttpRequest is not available"));
        return;
      }
      const xhr = new XMLHttpRequest();
      item.xhr = xhr;
      xhr.open(String(options.method || "POST").toUpperCase(), options.url, true);
      xhr.withCredentials = !!options.withCredentials;
      applyHeaders(xhr, options.headers, item);
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        item.bytesUploaded = event.loaded;
        item.progress = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
        props.onProgress?.(item, { event, api });
        refresh();
      };
      xhr.onload = () => {
        const ok = xhr.status >= 200 && xhr.status < 300;
        const response = { status: xhr.status, text: xhr.responseText, xhr };
        ok ? resolve(response) : reject(Object.assign(new Error(`HTTP error ${xhr.status}`), { response }));
      };
      xhr.onerror = () => reject(new Error("network-error"));
      xhr.onabort = () => reject(new Error("canceled"));
      const body = options.sendRaw ? item.file : (() => {
        const form = new FormData();
        appendFields(form, options.formFields, item);
        form.append(options.fieldName || "file", item.file, item.name);
        return form;
      })();
      xhr.send(body);
    });
    const runUpload = async (item) => {
      const retry = getRetry();
      let delay = retry.delay;
      item.status = "uploading";
      item.error = null;
      item.progress = Math.max(0, item.progress || 0);
      props.onStart?.(item, { api });
      refresh();
      for (let attempt = 0; attempt <= retry.attempts; attempt++) {
        item.attempts = attempt + 1;
        try {
          const options = await resolveUploadOptions(item);
          const response = typeof props.upload === "function" || typeof props.uploader === "function"
            ? await (props.upload || props.uploader)(item.file, { item, options, progress: (value) => {
              item.progress = Math.max(0, Math.min(100, Number(value) || 0));
              props.onProgress?.(item, { api });
              refresh();
            }, api })
            : await uploadViaXhr(item, options);
          item.status = "done";
          item.progress = 100;
          item.response = response;
          item.xhr = null;
          props.onSuccess?.(item, { response, api });
          props.onComplete?.(item, { response, api });
          refresh();
          return item;
        } catch (error) {
          if (String(error?.message || error) === "canceled" || item.status === "canceled") {
            item.status = "canceled";
            item.error = "canceled";
            item.xhr = null;
            props.onComplete?.(item, { error, api });
            refresh();
            return item;
          }
          if (attempt < retry.attempts) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.round(delay * retry.factor);
            continue;
          }
          item.status = "error";
          item.error = error;
          item.xhr = null;
          setError(error);
          props.onError?.(item, { error, api });
          props.onComplete?.(item, { error, api });
          refresh();
          return item;
        }
      }
      return item;
    };
    const processQueue = () => {
      if (disposed || isDisabled()) return;
      const uploading = getFiles().filter((item) => item.status === "uploading").length;
      const openSlots = Math.max(0, getParallel() - uploading);
      const queued = getFiles().filter((item) => item.status === "queued").slice(0, openSlots);
      if (!queued.length) {
        const busyNow = getFiles().some((item) => item.status === "uploading");
        setBusy(busyNow);
        if (!busyNow) props.onFinish?.(getFiles().slice(), { api });
        return;
      }
      setBusy(true);
      queued.forEach((item) => {
        runUpload(item).finally(() => processQueue());
      });
    };
    const upload = (items = null) => {
      const targets = items ? toList(items) : getFiles().filter((item) => ["queued", "error", "canceled"].includes(item.status));
      targets.forEach((entry) => {
        const item = typeof entry === "string" ? getFiles().find((candidate) => candidate.id === entry) : entry;
        if (item && item.status !== "uploading" && item.status !== "done" && item.status !== "rejected") {
          item.status = "queued";
          item.progress = 0;
          item.error = null;
        }
      });
      refresh();
      processQueue();
    };
    const retryUpload = (itemOrId) => upload([itemOrId]);
    const browse = () => {
      if (isDisabled()) return;
      input.click();
    };

    const input = _.input({
      type: "file",
      class: "cms-upload-input",
      accept: getAccepted() || null,
      multiple: isMultiple(),
      capture: props.capture || null,
      disabled: isDisabled(),
      onChange: (event) => {
        addFiles(event.target.files, { event, source: "browse" });
        event.target.value = "";
      }
    });
    const listEl = _.div({ class: "cms-upload-list" });
    const summaryEl = _.div({ class: "cms-upload-summary" });
    const actionsEl = _.div({ class: "cms-upload-actions" });
    const root = _.div({
      class: uiClass([
        "cms-upload",
        "cms-singularity",
        uiWhen(props.box || props.variant === "box", "cms-upload-box"),
        uiWhen(props.compact, "is-compact"),
        props.class
      ]),
      tabindex: isDisabled() ? "-1" : "0",
      role: "group",
      "aria-disabled": isDisabled() ? "true" : "false"
    });
    const api = {
      addFiles,
      browse,
      upload,
      retry: retryUpload,
      retryAll: () => upload(getFiles().filter((item) => item.status === "error" || item.status === "canceled")),
      remove,
      clear,
      abort,
      abortAll,
      files: () => getFiles().slice(),
      state: () => ({
        files: getFiles().slice(),
        busy: getBusy(),
        dragging: getDragging(),
        error: getError()
      }),
      reset: clear
    };
    const renderActions = () => {
      const ctx = { api, files: getFiles().slice(), busy: getBusy(), disabled: isDisabled() };
      const browseNode = CMSwift.ui.renderSlot(slots, "browse", ctx, UI.Btn({ size: "sm", icon: "folder_open", label: props.browseText || "Browse", onClick: browse }));
      const uploadNode = CMSwift.ui.renderSlot(slots, "upload", ctx, UI.Btn({ size: "sm", color: "primary", icon: "upload", label: props.uploadText || "Upload", loading: getBusy(), disabled: isDisabled() || !getFiles().some((item) => ["queued", "error", "canceled"].includes(item.status)), onClick: () => upload() }));
      const clearNode = CMSwift.ui.renderSlot(slots, "clear", ctx, UI.Btn({ size: "sm", color: "secondary", outline: true, icon: "delete", label: props.clearText || "Clear", disabled: isDisabled() || !getFiles().length, onClick: () => clear() }));
      return renderSlotToArray(slots, "actions", ctx, [browseNode, uploadNode, clearNode]);
    };
    const renderFile = (item, index) => {
      const ctx = {
        item,
        file: item.file,
        index,
        api,
        remove: () => remove(item),
        retry: () => retryUpload(item),
        abort: () => abort(item)
      };
      const fallback = _.div({ class: uiClass(["cms-upload-file", `is-${item.status}`]) },
        _.div({ class: "cms-upload-file-icon" }, UI.Icon({ name: item.status === "done" ? "check_circle" : item.status === "error" || item.status === "rejected" ? "error" : "description" })),
        _.div({ class: "cms-upload-file-main" },
          _.div({ class: "cms-upload-file-name" }, ...renderSlotToArray(slots, "fileName", ctx, item.name)),
          _.div({ class: "cms-upload-file-meta" },
            ...renderSlotToArray(slots, "fileMeta", ctx, item.error ? String(item.error?.message || item.error) : (item.status === "queued" ? "Queued" : item.status))
          ),
          _.div({ class: "cms-upload-progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(item.progress || 0) },
            _.div({ class: "cms-upload-progress-bar", style: { width: `${item.progress || 0}%` } })
          )
        ),
        _.div({ class: "cms-upload-file-trailing" },
          _.div({ class: "cms-upload-file-size" }, formatBytes(item.size)),
          _.div({ class: "cms-upload-file-actions" },
            ...renderSlotToArray(slots, "fileActions", ctx, [
              item.status === "uploading" ? UI.Btn({ size: "sm", outline: true, icon: "close", "aria-label": "Cancel", onClick: () => abort(item) }) : null,
              item.status === "error" || item.status === "canceled" ? UI.Btn({ size: "sm", outline: true, icon: "refresh", "aria-label": "Retry", onClick: () => retryUpload(item) }) : null,
              UI.Btn({ size: "sm", dense: true, outline: true, icon: "delete", "aria-label": "Remove", onClick: () => remove(item) })
            ])
          )
        )
      );
      const custom = CMSwift.ui.renderSlot(slots, "file", ctx, fallback);
      return _.div({ class: "cms-upload-file-wrap", "data-status": item.status, "data-id": item.id }, ...renderSlotToArray(null, "default", {}, custom));
    };
    const render = () => {
      const files = getFiles();
      actionsEl.replaceChildren(...renderActions());
      listEl.replaceChildren();
      if (!files.length) {
        const empty = CMSwift.ui.renderSlot(slots, "empty", { api }, props.emptyText || "No files selected");
        listEl.appendChild(_.div({ class: "cms-upload-empty" }, ...renderSlotToArray(null, "default", {}, empty)));
      } else {
        files.forEach((item, index) => listEl.appendChild(renderFile(item, index)));
      }
      const summaryFiles = files.filter((item) => item.status !== "rejected" && item.status !== "removed");
      summaryEl.textContent = `${summaryFiles.length} file • ${formatBytes(summaryFiles.reduce((sum, item) => sum + Number(item.size || 0), 0))}`;
    };
    const iconNode = CMSwift.ui.renderSlot(slots, "icon", { api }, UI.Icon({ name: props.icon || "cloud_upload" }));
    const titleNode = CMSwift.ui.renderSlot(slots, "title", { api }, props.title || "Upload files");
    const subtitleNode = CMSwift.ui.renderSlot(slots, "subtitle", { api }, props.subtitle || (getAccepted() ? `Accepted: ${getAccepted()}` : "Drag files here or browse from your device"));
    const dropzone = _.div({
      class: "cms-upload-dropzone",
      onClick: (event) => {
        if (event.target?.closest?.(".cms-upload-actions, .cms-upload-list")) return;
        if (props.clickable !== false) browse();
      },
      onDragenter: (event) => {
        if (props.drag === false || isDisabled()) return;
        event.preventDefault();
        setDragging(true);
        root.classList.add("is-dragging");
      },
      onDragover: (event) => {
        if (props.drag === false || isDisabled()) return;
        event.preventDefault();
      },
      onDragleave: (event) => {
        if (event.currentTarget !== event.target) return;
        setDragging(false);
        root.classList.remove("is-dragging");
      },
      onDrop: (event) => {
        if (props.drag === false || isDisabled()) return;
        event.preventDefault();
        setDragging(false);
        root.classList.remove("is-dragging");
        props.onDrop?.(event, { api });
        addFiles(event.dataTransfer?.files || [], { event, source: "drop" });
      }
    },
      _.div({ class: "cms-upload-head" },
        _.div({ class: "cms-upload-icon" }, ...renderSlotToArray(null, "default", {}, iconNode)),
        _.div({ class: "cms-upload-copy" },
          _.div({ class: "cms-upload-title" }, ...renderSlotToArray(null, "default", {}, titleNode)),
          _.div({ class: "cms-upload-subtitle" }, ...renderSlotToArray(null, "default", {}, subtitleNode))
        ),
        actionsEl
      ),
      summaryEl,
      listEl
    );
    const header = CMSwift.ui.renderSlot(slots, "header", { api }, null);
    renderSlotToArray(null, "default", {}, header).forEach((node) => root.appendChild(node));
    root.appendChild(input);
    renderSlotToArray(slots, "default", { api, dropzone }, dropzone).forEach((node) => root.appendChild(node));
    CMSwift.reactive.effect(() => { render(); }, "UI.Upload:render");
    CMSwift.reactive.effect(() => {
      root.classList.toggle("is-disabled", isDisabled());
      root.setAttribute("aria-disabled", isDisabled() ? "true" : "false");
      input.disabled = isDisabled();
      input.multiple = isMultiple();
    }, "UI.Upload:disabled");
    root._upload = api;
    root._addFiles = addFiles;
    root._browse = browse;
    root._uploadFiles = upload;
    root._dispose = () => {
      if (disposed) return;
      disposed = true;
      abortAll();
    };
    CMSwift._registerCleanup?.(root, root._dispose);
    return root;
  };
  UI.BoxUpload = (props = {}) => UI.Upload({ ...props, box: true });
  UI.boxUpload = (props = {}) => UI.BoxUpload(props);
  CMSwift.ui.Upload = UI.Upload;
  CMSwift.ui.BoxUpload = UI.BoxUpload;
  CMSwift.ui.boxUpload = UI.boxUpload;
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Upload = {
      signature: "UI.Upload(props)",
      description: "Professional uploader with drag/drop, validation, queue, retry, factory options, XHR progress, custom upload and slot-based rendering.",
      props: {
        url: "string",
        method: "POST|PUT|PATCH|string",
        fieldName: "string",
        paramName: "Alias of fieldName",
        headers: "object|Array|Headers|(file, ctx)=>headers",
        formFields: "object|Array|(file, ctx)=>fields",
        factory: "(file, ctx)=>object|Promise<object>",
        upload: "(file, ctx)=>Promise<any> custom uploader",
        multiple: "boolean",
        accept: "string",
        acceptedFiles: "Alias of accept",
        maxFiles: "number",
        maxFileSize: "number bytes",
        maxTotalSize: "number bytes",
        autoUpload: "boolean",
        parallelUploads: "number",
        retry: "boolean|{ attempts, delay, factor }",
        withCredentials: "boolean",
        sendRaw: "boolean",
        drag: "boolean",
        clickable: "boolean",
        box: "boolean",
        compact: "boolean",
        title: "String|Node|Function",
        subtitle: "String|Node|Function",
        emptyText: "string",
        slots: "{ header?, default?, icon?, title?, subtitle?, actions?, browse?, upload?, clear?, file?, fileName?, fileMeta?, fileActions?, empty? }"
      },
      slots: {
        header: "Content before the uploader",
        default: "Dropzone override (ctx: { api, dropzone })",
        icon: "Main icon",
        title: "Title content",
        subtitle: "Subtitle content",
        actions: "Actions area",
        browse: "Browse button",
        upload: "Upload button",
        clear: "Clear button",
        file: "Full file row renderer",
        fileName: "File name slot",
        fileMeta: "Status/error slot",
        fileActions: "Per-file actions",
        empty: "Empty list state"
      },
      events: ["change", "added", "rejected", "remove", "start", "progress", "success", "error", "complete", "finish", "cancel", "drop", "factoryFailed"],
      returns: "HTMLDivElement with ._upload API, ._addFiles(files), ._uploadFiles(), ._browse(), ._dispose()"
    };
    UI.meta.BoxUpload = { ...UI.meta.Upload, signature: "UI.BoxUpload(props)", description: "Box-styled variant of UI.Upload." };
    UI.meta.boxUpload = UI.meta.BoxUpload;
  }

  function resolveModel(model, name) {
    if (!model) return null;
    if (typeof model === "object" && typeof model._bind === "function") {
      return {
        get: () => model.value,
        set: (v) => { if (model.value !== v) model.value = v; },
        watch: (fn) => { if (typeof model.action === "function") model.action(fn); }
      };
    }
    if (Array.isArray(model) && typeof model[0] === "function" && typeof model[1] === "function") {
      const get = model[0];
      const set = model[1];
      return {
        get,
        set,
        watch: (fn) => app.reactive.effect(() => { fn(get()); }, name || "UI:model")
      };
    }
    return null;
  }
  const layoutDispositionMap = {
    classic: { side: "left", nav: "top", rows: ["header", "nav", "body", "footer"] },
    classicright: { side: "right", nav: "top", rows: ["header", "nav", "body", "footer"] },
    sidebarfullleft: { side: "left", fullSide: true, nav: "top", rows: ["header", "nav", "body", "footer"] },
    sidebarfullright: { side: "right", fullSide: true, nav: "top", rows: ["header", "nav", "body", "footer"] },
    appshell: { side: "left", nav: "top", rows: ["header", "nav", "body", "footer"] },
    dashboard: { side: "left", nav: "top", rows: ["header", "nav", "body", "footer"] },
    website: { side: null, nav: "top", rows: ["header", "nav", "body", "footer"] },
    documentation: { side: "right", nav: "left", rows: ["header", "body", "footer"] },
    landing: { side: null, nav: null, rows: ["header", "body", "footer"] }
  };
  const normalizeLayoutDisposition = (value) => {
    const raw = uiUnwrap(value);
    if (raw == null || raw === false || raw === "") return "";
    return String(raw).trim().toLowerCase().replace(/[\s_-]+/g, "");
  };
  const createLayoutDispositionAreas = (config, state) => {
    if (!config || !state.main) return null;
    const side = config.side || (state.aside ? "left" : null);
    const navPosition = config.nav || (state.nav ? "top" : null);
    const sideVisible = !!state.aside && !!side;
    const navVisible = !!state.nav && !!navPosition;
    const leftArea = navVisible && navPosition === "left" ? "nav" : (sideVisible && side === "left" ? "aside" : ".");
    const rightArea = navVisible && navPosition === "right" ? "nav" : (sideVisible && side === "right" ? "aside" : ".");
    const bodyRow = [leftArea, "main", rightArea];
    const rows = [];
    const rowNames = [...(config.rows || [])];
    if (navVisible && navPosition === "top" && !rowNames.includes("nav")) {
      const bodyIndex = rowNames.indexOf("body");
      rowNames.splice(bodyIndex >= 0 ? bodyIndex : rowNames.length, 0, "nav");
    }
    for (const rowName of rowNames) {
      if (rowName === "header" && state.header) {
        rows.push(config.fullSide && sideVisible && side === "left"
          ? ["aside", "header", "header"]
          : config.fullSide && sideVisible && side === "right"
            ? ["header", "header", "aside"]
            : ["header", "header", "header"]
        );
      } else if (rowName === "nav" && navVisible && navPosition === "top") {
        rows.push(config.fullSide && sideVisible && side === "left"
          ? ["aside", "nav", "nav"]
          : config.fullSide && sideVisible && side === "right"
            ? ["nav", "nav", "aside"]
            : ["nav", "nav", "nav"]
        );
      } else if (rowName === "body") {
        rows.push(bodyRow);
      } else if (rowName === "footer" && state.footer) {
        rows.push(config.fullSide && sideVisible && side === "left"
          ? ["aside", "footer", "footer"]
          : config.fullSide && sideVisible && side === "right"
            ? ["footer", "footer", "aside"]
            : ["footer", "footer", "footer"]
        );
      }
    }
    return rows.length ? rows.map((row) => `"${row.join(" ")}"`).join(" ") : null;
  };
  UI.Layout = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const hasOwn = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
    const getViewportWidth = () => typeof window === "undefined" ? 1024 : window.innerWidth;
    const getResponsiveProps = () => {
      const width = getViewportWidth();
      const mobileProps = CMSwift.uiResponsivePropsFor(props, uiResponsiveDevice("mobile")) || {};
      const tabletProps = width >= 768 ? (CMSwift.uiResponsivePropsFor(props, uiResponsiveDevice("tablet")) || {}) : {};
      const pcProps = width >= 1024 ? (CMSwift.uiResponsivePropsFor(props, uiResponsiveDevice("pc")) || {}) : {};
      return { ...mobileProps, ...tabletProps, ...pcProps };
    };
    const resolveProp = (...keys) => {
      for (const key of keys) {
        if (hasOwn(props, key)) return props[key];
      }
      return undefined;
    };
    const resolveLayoutProp = (...keys) => {
      const responsiveProps = getResponsiveProps();
      for (const key of keys) {
        if (hasOwn(responsiveProps, key)) return responsiveProps[key];
      }
      return resolveProp(...keys);
    };
    const resolveLayoutDeviceProp = (...keys) => {
      const responsiveProps = CMSwift.uiResponsivePropsFor(props, uiResponsiveDevice(getResponsiveDeviceKey())) || {};
      for (const key of keys) {
        if (hasOwn(responsiveProps, key)) return responsiveProps[key];
      }
      return resolveProp(...keys);
    };
    const getLayoutDisposition = () => normalizeLayoutDisposition(
      resolveLayoutDeviceProp("disposition", "layoutDisposition", "layout")
    );
    const getLayoutMode = () => {
      const raw = uiUnwrap(resolveLayoutProp("mode", "layoutMode"));
      if (raw == null || raw === false || raw === "") return "";
      const mode = String(raw).trim().toLowerCase();
      return mode === "global" || mode === "local" ? mode : "";
    };
    const toLayoutCssSize = (value, fallback = null) => {
      if (value == null || value === false || value === "") return fallback;
      return typeof value === "number" ? `${value}px` : String(value);
    };
    const toLayoutPx = (value, fallback = null) => {
      if (value == null || value === false || value === "") return fallback;
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const parsed = Number.parseFloat(String(value));
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const toLayoutGridTemplateAreas = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return null;
      if (Array.isArray(raw)) {
        return raw.map((row) => `"${Array.isArray(row) ? row.join(" ") : String(row)}"`).join(" ");
      }
      return String(raw);
    };
    const clampLayoutWidth = (value, min = null, max = null) => {
      let next = Number.isFinite(value) ? value : 0;
      if (Number.isFinite(min)) next = Math.max(min, next);
      if (Number.isFinite(max)) next = Math.min(max, next);
      return next;
    };

    const headerSource = resolveProp("header", "headerContent");
    const drawerSource = resolveProp("aside", "drawer");
    const navSource = resolveProp("nav", "asideRight", "drawerRight");
    const pageSource = resolveProp("page", "main", "content", "body");
    const footerSource = resolveProp("footer", "footerContent");

    const getDrawerEnabledValue = () => uiUnwrap(resolveLayoutProp("drawerEnabled", "asideEnabled"));
    const getNavEnabledValue = () => uiUnwrap(resolveLayoutProp("navEnabled", "asideRightEnabled", "rightAsideEnabled"));
    const getDrawerRequested = () => getDrawerEnabledValue() !== false;
    const getNavRequested = () => getNavEnabledValue() === true || uiUnwrap(resolveLayoutProp("noNav")) === false;
    const getDrawerDisabled = () => uiUnwrap(resolveLayoutProp("noDrawer")) === true || getDrawerEnabledValue() === false || drawerSource === false;
    const getNavDisabled = () => uiUnwrap(resolveLayoutProp("noNav")) === true || getNavEnabledValue() === false || navSource === false;
    const getDrawerFloating = () => uiUnwrap(resolveLayoutProp("drawerFloating")) === true;
    const getNavFloating = () => uiUnwrap(resolveLayoutProp("navFloating")) === true;
    const getDrawerResizable = () => uiUnwrap(resolveLayoutProp("drawerResizable")) === true;
    const getNavResizable = () => uiUnwrap(resolveLayoutProp("navResizable")) === true;
    const getDrawerMinWidth = () => toLayoutPx(uiUnwrap(resolveLayoutProp("drawerMinWidth")), 180);
    const getDrawerMaxWidth = () => toLayoutPx(uiUnwrap(resolveLayoutProp("drawerMaxWidth")), null);
    const getNavMinWidth = () => toLayoutPx(uiUnwrap(resolveLayoutProp("navMinWidth")), 180);
    const getNavMaxWidth = () => toLayoutPx(uiUnwrap(resolveLayoutProp("navMaxWidth")), null);
    const initialDrawerWidthPx = toLayoutPx(uiUnwrap(resolveLayoutProp("drawerWidth")), 280);
    const initialNavWidthPx = toLayoutPx(uiUnwrap(resolveLayoutProp("navWidth")) ?? uiUnwrap(resolveLayoutProp("asideRightWidth")), 280);
    const [getDrawerWidthPx, setDrawerWidthPx] = CMSwift.reactive.signal(
      clampLayoutWidth(initialDrawerWidthPx, getDrawerMinWidth(), getDrawerMaxWidth())
    );
    const [getNavWidthPx, setNavWidthPx] = CMSwift.reactive.signal(
      clampLayoutWidth(initialNavWidthPx, getNavMinWidth(), getNavMaxWidth())
    );

    const controlledDrawer = resolveModel(props.drawerOpen, "UI.Layout:drawerOpen");
    const initialOpen = controlledDrawer
      ? !!controlledDrawer.get()
      : (typeof props.drawerOpen === "boolean" ? !!props.drawerOpen : true);
    const [getOpen, syncOpen] = CMSwift.reactive.signal(initialOpen);
    const setOpen = (value) => {
      const next = !!value;
      if (getOpen() !== next) syncOpen(next);
      controlledDrawer?.set(next);
    };
    controlledDrawer?.watch?.(() => {
      const next = !!controlledDrawer.get();
      if (getOpen() !== next) syncOpen(next);
    });

    const controlledNav = resolveModel(props.navOpen, "UI.Layout:navOpen");
    const initialNavOpen = controlledNav
      ? !!controlledNav.get()
      : (typeof props.navOpen === "boolean" ? !!props.navOpen : true);
    const [getNavOpen, syncNavOpen] = CMSwift.reactive.signal(initialNavOpen);
    const setNavOpen = (value) => {
      const next = !!value;
      if (getNavOpen() !== next) syncNavOpen(next);
      controlledNav?.set(next);
    };
    controlledNav?.watch?.(() => {
      const next = !!controlledNav.get();
      if (getNavOpen() !== next) syncNavOpen(next);
    });

    const getResponsiveBreakpoint = () => {
      const layoutBreakpoint = Number(uiUnwrap(resolveLayoutProp("layoutBreakpoint")) ?? 0);
      const drawerBreakpoint = Number(uiUnwrap(resolveLayoutProp("drawerBreakpoint")) ?? (layoutBreakpoint || 1024));
      const navBreakpoint = Number(uiUnwrap(resolveLayoutProp("navBreakpoint")) ?? (layoutBreakpoint || drawerBreakpoint));
      return Math.max(drawerBreakpoint, navBreakpoint, 0);
    };
    const getResponsiveDeviceKey = () => {
      const width = getViewportWidth();
      return width >= 1024 ? "pc" : (width >= 768 ? "tablet" : "mobile");
    };
    const [getMobile, setMobile] = CMSwift.reactive.signal(false);
    const [getResponsiveKey, setResponsiveKey] = CMSwift.reactive.signal(getResponsiveDeviceKey());
    const checkMobile = () => {
      if (typeof window === "undefined") return;
      setResponsiveKey(getResponsiveDeviceKey());
      setMobile(window.innerWidth < getResponsiveBreakpoint());
    };
    if (typeof window !== "undefined") {
      checkMobile();
      window.addEventListener("resize", checkMobile);
    }

    const createCtx = () => ({
      props,
      openAside: () => setOpen(true),
      closeAside: () => setOpen(false),
      toggleAside: () => setOpen(!getOpen()),
      openNav: () => setNavOpen(true),
      closeNav: () => setNavOpen(false),
      toggleNav: () => setNavOpen(!getNavOpen()),
      isDrawerOpen: () => !!getOpen(),
      isNavOpen: () => !!getNavOpen(),
      isMobile: () => !!getMobile(),
      isDrawerFloating: () => getDrawerFloating(),
      isNavFloating: () => getNavFloating()
    });
    const renderAliasSlot = (names, fallback) => {
      const ctx = createCtx();
      for (const name of names) {
        if (!hasOwn(slots, name)) continue;
        const raw = typeof slots[name] === "function" ? slots[name](ctx) : slots[name];
        return renderSlotToArray(null, "default", ctx, raw);
      }
      const raw = typeof fallback === "function" ? fallback(ctx) : fallback;
      return renderSlotToArray(null, "default", ctx, raw);
    };

    const pageFallback = pageSource !== undefined ? pageSource : children;

    const cls = uiClass([
      "cms-app",
      "cms-layout",
      CMSwift.uiResponsiveClasses({ mobile: props }, uiResponsiveLayoutRules),
      CMSwift.uiResponsiveClasses(props, uiResponsiveLayoutRules),
      props.class
    ]);
    const p = CMSwift.omit(props, [
      "header", "headerContent",
      "aside", "drawer",
      "nav", "asideRight", "drawerRight",
      "page", "main", "content", "body",
      "footer", "footerContent",
      "noDrawer", "drawerEnabled", "asideEnabled",
      "noNav", "navEnabled", "asideRightEnabled", "rightAsideEnabled",
      "drawerOpen", "navOpen",
      "layoutBreakpoint", "drawerBreakpoint", "navBreakpoint",
      "drawerWidth", "navWidth", "asideRightWidth",
      "drawerResizable", "drawerMinWidth", "drawerMaxWidth",
      "navResizable", "navMinWidth", "navMaxWidth",
      "drawerPeek", "navPeek", "asideRightPeek",
      "drawerFloating", "navFloating",
      "overlayClose", "escClose",
      "stickyHeader", "stickyFooter", "stickyAside", "stickyNav",
      "tagPage", "mode", "layoutMode", "disposition", "layoutDisposition", "layout",
      "shellClass", "headerClass", "asideClass", "navClass", "pageClass", "footerClass", "overlayClass",
      "gap", "headerOffset", "minHeight", "areas", "gridTemplateAreas", "templateAreas",
      "slots"
    ]);
    p.class = cls;
    p.style = { ...(props.style || {}) };
    CMSwift.uiApplyResponsiveProps(p, props, CMSwift.uiResponsiveStyleRules);

    const root = _.div(p);
    const tagPage = uiUnwrap(resolveLayoutProp("tagPage")) === true;
    const tags = tagPage
      ? { header: "header", aside: "aside", nav: "nav", page: "main", footer: "footer" }
      : { header: "div", aside: "div", nav: "div", page: "div", footer: "div" };

    const shell = _.div({ class: uiClass(["cms-layout-shell-grid", props.shellClass]) });
    const headerWrap = _[tags.header]({
      class: uiClass(["cms-layout-section", "cms-layout-header", "header", uiWhen(props.stickyHeader, "sticky"), props.headerClass])
    });
    const asideWrap = _[tags.aside]({
      class: uiClass(["cms-layout-section", "cms-layout-aside", "aside", uiWhen(props.stickyAside !== false, "sticky"), props.asideClass]),
      role: "navigation",
      "aria-hidden": "true"
    });
    const asideContentWrap = _.div({ class: "cms-layout-panel-body cms-layout-aside-body" });
    const asideResizeHandle = _.div({
      class: "cms-layout-resize-handle cms-layout-resize-handle-drawer",
      "aria-hidden": "true"
    });
    asideWrap.appendChild(asideContentWrap);
    asideWrap.appendChild(asideResizeHandle);
    const navWrap = _[tags.nav]({
      class: uiClass(["cms-layout-section", "cms-layout-nav", "nav", uiWhen(props.stickyNav, "sticky"), props.navClass]),
      role: tags.nav === "nav" ? null : "complementary",
      "aria-hidden": "true"
    });
    const navContentWrap = _.div({ class: "cms-layout-panel-body cms-layout-nav-body" });
    const navResizeHandle = _.div({
      class: "cms-layout-resize-handle cms-layout-resize-handle-nav",
      "aria-hidden": "true"
    });
    navWrap.appendChild(navContentWrap);
    navWrap.appendChild(navResizeHandle);
    const mainWrap = _[tags.page]({
      class: uiClass(["cms-layout-section", "cms-layout-main", "main", props.pageClass]),
      role: tags.page === "main" ? null : "main"
    });
    const footerWrap = _[tags.footer]({
      class: uiClass(["cms-layout-section", "cms-layout-footer", "footer", uiWhen(props.stickyFooter, "sticky"), props.footerClass])
    });

    shell.appendChild(headerWrap);
    shell.appendChild(asideWrap);
    shell.appendChild(mainWrap);
    shell.appendChild(navWrap);
    shell.appendChild(footerWrap);
    root.appendChild(shell);

    const overlay = _.div({
      class: uiClass(["cms-aside-overlay", props.overlayClass]),
      onClick: () => {
        if (uiUnwrap(resolveLayoutProp("overlayClose")) === false) return;
        if (getOpen()) setOpen(false);
        if (getNavOpen()) setNavOpen(false);
      }
    });
    root.appendChild(overlay);

    let hasHeaderContent = false;
    let hasDrawerContent = false;
    let hasNavContent = false;
    let hasPageContent = false;
    let hasFooterContent = false;
    let headerObserver = null;
    let disposeResizeSession = null;

    const disposeTree = (node) => {
      if (!node || typeof node !== "object") return;
      if (typeof node._dispose === "function") node._dispose();
      if (!node.childNodes || !node.childNodes.length) return;
      Array.from(node.childNodes).forEach(disposeTree);
    };

    const clearWrap = (wrap) => {
      if (!wrap) return;
      Array.from(wrap.childNodes).forEach((node) => {
        disposeTree(node);
        node.remove();
      });
    };

    const normalizeUpdateNodes = (value) => {
      const ctx = createCtx();
      const raw = typeof value === "function" ? value(ctx) : value;
      return renderSlotToArray(null, "default", ctx, raw);
    };

    const syncHeaderHeight = () => {
      const height = hasHeaderContent ? headerWrap.getBoundingClientRect().height : 0;
      root.style.setProperty("--layout-header-height", `${height}px`);
    };

    const fillWrap = (wrap, nodes) => {
      clearWrap(wrap);
      nodes.forEach((node) => wrap.appendChild(node));
      return nodes.length > 0;
    };
    const syncLayoutVars = () => {
      root.style.setProperty("--cms-layout-drawer-width", toLayoutCssSize(uiUnwrap(resolveLayoutProp("drawerWidth")) ?? 280, "280px"));
      root.style.setProperty("--cms-layout-nav-width", toLayoutCssSize(uiUnwrap(resolveLayoutProp("navWidth")) ?? uiUnwrap(resolveLayoutProp("asideRightWidth")) ?? 280, "280px"));
      root.style.setProperty("--cms-layout-drawer-peek", toLayoutCssSize(uiUnwrap(resolveLayoutProp("drawerPeek")) ?? 20, "20px"));
      root.style.setProperty("--cms-layout-nav-peek", toLayoutCssSize(uiUnwrap(resolveLayoutProp("navPeek")) ?? uiUnwrap(resolveLayoutProp("asideRightPeek")) ?? 20, "20px"));
      const layoutGap = toLayoutCssSize(uiUnwrap(resolveLayoutProp("gap")), null);
      if (layoutGap != null) root.style.setProperty("--cms-layout-gap", layoutGap);
      else root.style.removeProperty("--cms-layout-gap");
      const headerOffset = toLayoutCssSize(uiUnwrap(resolveLayoutProp("headerOffset")), null);
      if (headerOffset != null) root.style.setProperty("--layout-header-height", headerOffset);
      const minHeight = toLayoutCssSize(uiUnwrap(resolveLayoutProp("minHeight")), null);
      if (minHeight != null) root.style.setProperty("--cms-layout-min-height", minHeight);
      else root.style.removeProperty("--cms-layout-min-height");
    };
    const syncPanelWidths = () => {
      if (getDrawerResizable()) {
        const nextDrawerWidth = clampLayoutWidth(getDrawerWidthPx(), getDrawerMinWidth(), getDrawerMaxWidth());
        if (nextDrawerWidth !== getDrawerWidthPx()) setDrawerWidthPx(nextDrawerWidth);
        root.style.setProperty("--cms-layout-drawer-width", `${nextDrawerWidth}px`);
      }
      if (getNavResizable()) {
        const nextNavWidth = clampLayoutWidth(getNavWidthPx(), getNavMinWidth(), getNavMaxWidth());
        if (nextNavWidth !== getNavWidthPx()) setNavWidthPx(nextNavWidth);
        root.style.setProperty("--cms-layout-nav-width", `${nextNavWidth}px`);
      }
    };
    const startResize = (side, event) => {
      if (event.button !== 0) return;
      const panel = side === "drawer" ? asideWrap : navWrap;
      if (panel.hidden) return;
      const getCurrentWidth = side === "drawer" ? getDrawerWidthPx : getNavWidthPx;
      const setCurrentWidth = side === "drawer" ? setDrawerWidthPx : setNavWidthPx;
      const getMinWidth = side === "drawer" ? getDrawerMinWidth : getNavMinWidth;
      const getMaxWidth = side === "drawer" ? getDrawerMaxWidth : getNavMaxWidth;
      const rect = panel.getBoundingClientRect();
      const initialWidth = rect.width || getCurrentWidth();
      const onMove = (moveEvent) => {
        const nextWidth = side === "drawer"
          ? (moveEvent.clientX - rect.left)
          : (rect.right - moveEvent.clientX);
        setCurrentWidth(clampLayoutWidth(nextWidth || initialWidth, getMinWidth(), getMaxWidth()));
        syncPanelWidths();
        syncLayoutState();
      };
      const onUp = () => {
        root.classList.remove("is-resizing-layout");
        document.removeEventListener("pointermove", onMove, true);
        document.removeEventListener("pointerup", onUp, true);
        disposeResizeSession = null;
      };
      root.classList.add("is-resizing-layout");
      document.addEventListener("pointermove", onMove, true);
      document.addEventListener("pointerup", onUp, true);
      disposeResizeSession = onUp;
      event.preventDefault();
    };
    const onDrawerResizePointerDown = (event) => startResize("drawer", event);
    const onNavResizePointerDown = (event) => startResize("nav", event);
    asideResizeHandle.addEventListener("pointerdown", onDrawerResizePointerDown);
    navResizeHandle.addEventListener("pointerdown", onNavResizePointerDown);

    const syncLayoutState = () => {
      const mobile = !!getMobile();
      const asideOpen = !!getOpen();
      const navOpen = !!getNavOpen();
      const drawerEnabled = !getDrawerDisabled() && getDrawerRequested() && hasDrawerContent;
      const navEnabled = !getNavDisabled() && getNavRequested() && hasNavContent;
      const drawerFloating = drawerEnabled && (mobile || getDrawerFloating());
      const navFloating = navEnabled && (mobile || getNavFloating());
      const drawerVisible = drawerEnabled && asideOpen;
      const navVisible = navEnabled && navOpen;
      const inlineDrawerVisible = drawerVisible && !drawerFloating;
      const inlineNavVisible = navVisible && !navFloating;
      const inlineDrawerResizable = inlineDrawerVisible && getDrawerResizable();
      const inlineNavResizable = inlineNavVisible && getNavResizable();
      const overlayVisible = (drawerVisible && drawerFloating) || (navVisible && navFloating);

      syncLayoutVars();
      syncPanelWidths();

      root.classList.toggle("is-mobile", mobile);
      root.classList.toggle("drawer-open", drawerVisible);
      root.classList.toggle("nav-open", navVisible);
      root.classList.toggle("no-drawer", !drawerEnabled);
      root.classList.toggle("no-nav", !navEnabled);
      root.classList.toggle("has-header", hasHeaderContent);
      root.classList.toggle("has-drawer", drawerEnabled);
      root.classList.toggle("has-nav", navEnabled);
      root.classList.toggle("has-footer", hasFooterContent);
      root.classList.toggle("drawer-floating", drawerFloating);
      root.classList.toggle("nav-floating", navFloating);
      const disposition = getLayoutDisposition();
      const mode = disposition ? getLayoutMode() : "";
      root.dataset.disposition = disposition || "";
      root.dataset.layoutMode = mode || "";
      root.classList.toggle("has-disposition", !!disposition);
      root.classList.toggle("mode-local", mode === "local");
      root.classList.toggle("mode-global", mode === "global");
      headerWrap.classList.toggle("sticky", uiUnwrap(resolveLayoutProp("stickyHeader")) === true);
      footerWrap.classList.toggle("sticky", uiUnwrap(resolveLayoutProp("stickyFooter")) === true);
      asideWrap.classList.toggle("sticky", uiUnwrap(resolveLayoutProp("stickyAside")) !== false);
      navWrap.classList.toggle("sticky", uiUnwrap(resolveLayoutProp("stickyNav")) === true);

      headerWrap.hidden = !hasHeaderContent;
      footerWrap.hidden = !hasFooterContent;
      mainWrap.hidden = !hasPageContent;

      overlay.hidden = !(drawerFloating || navFloating);
      overlay.classList.toggle("show", overlayVisible);

      asideWrap.hidden = !drawerEnabled || (!drawerVisible && !drawerFloating);
      asideWrap.classList.toggle("open", drawerVisible);
      asideWrap.classList.toggle("is-floating", drawerFloating);
      asideWrap.classList.toggle("is-resizable", inlineDrawerResizable);
      asideWrap.setAttribute("aria-hidden", drawerVisible ? "false" : "true");
      asideResizeHandle.hidden = !inlineDrawerResizable;

      navWrap.hidden = !navEnabled || (!navVisible && !navFloating);
      navWrap.classList.toggle("open", navVisible);
      navWrap.classList.toggle("is-floating", navFloating);
      navWrap.classList.toggle("is-resizable", inlineNavResizable);
      navWrap.setAttribute("aria-hidden", navVisible ? "false" : "true");
      navResizeHandle.hidden = !inlineNavResizable;

      const dispositionConfig = layoutDispositionMap[disposition] || null;
      const dispositionSide = dispositionConfig?.side || (inlineDrawerVisible && dispositionConfig ? "left" : null);
      const dispositionNav = dispositionConfig?.nav || (inlineNavVisible && dispositionConfig ? "top" : null);
      const drawerColumn = inlineDrawerVisible ? (dispositionConfig ? dispositionSide : "left") : "";
      const navColumn = inlineNavVisible ? (dispositionConfig ? (dispositionNav === "left" || dispositionNav === "right" ? dispositionNav : "") : "right") : "";
      root.classList.toggle("drawer-left", drawerEnabled && dispositionSide === "left");
      root.classList.toggle("drawer-right", drawerEnabled && dispositionSide === "right");
      root.classList.toggle("nav-top", inlineNavVisible && dispositionNav === "top");
      root.classList.toggle("nav-side", inlineNavVisible && (navColumn === "left" || navColumn === "right"));
      shell.style.gridTemplateColumns = [
        drawerColumn === "left"
          ? "minmax(0, var(--cms-layout-drawer-width))"
          : navColumn === "left"
            ? "minmax(0, var(--cms-layout-nav-width))"
            : "0px",
        "minmax(0, 1fr)",
        drawerColumn === "right"
          ? "minmax(0, var(--cms-layout-drawer-width))"
          : navColumn === "right"
            ? "minmax(0, var(--cms-layout-nav-width))"
            : "0px"
      ].join(" ");
      const defaultAreas = [
        "\"header header header\"",
        `"${inlineDrawerVisible ? "aside" : "."} main ${inlineNavVisible ? "nav" : "."}"`,
        "\"footer footer footer\""
      ].join(" ");
      const dispositionAreas = createLayoutDispositionAreas(layoutDispositionMap[disposition], {
        header: hasHeaderContent,
        aside: inlineDrawerVisible,
        nav: inlineNavVisible,
        main: hasPageContent,
        footer: hasFooterContent
      });
      shell.style.gridTemplateAreas = toLayoutGridTemplateAreas(
        resolveLayoutDeviceProp("areas", "gridTemplateAreas", "templateAreas")
      ) || dispositionAreas || defaultAreas;
    };

    const headerUpdate = (value, newUrl) => {
      hasHeaderContent = fillWrap(headerWrap, normalizeUpdateNodes(value));
      syncHeaderHeight();
      syncLayoutState();
      if (newUrl) CMSwift.router.setURLOnly(newUrl);
      return headerWrap;
    };
    const asideUpdate = (value, newUrl) => {
      hasDrawerContent = fillWrap(asideContentWrap, normalizeUpdateNodes(value));
      if (!hasDrawerContent) setOpen(false);
      syncLayoutState();
      if (newUrl) CMSwift.router.setURLOnly(newUrl);
      return asideWrap;
    };
    const navUpdate = (value, newUrl) => {
      hasNavContent = fillWrap(navContentWrap, normalizeUpdateNodes(value));
      if (!hasNavContent) setNavOpen(false);
      syncLayoutState();
      if (newUrl) CMSwift.router.setURLOnly(newUrl);
      return navWrap;
    };
    const pageUpdate = (value, newUrl) => {
      hasPageContent = fillWrap(mainWrap, normalizeUpdateNodes(value));
      syncLayoutState();
      if (newUrl) CMSwift.router.setURLOnly(newUrl);
      return mainWrap;
    };
    const footerUpdate = (value, newUrl) => {
      hasFooterContent = fillWrap(footerWrap, normalizeUpdateNodes(value));
      syncLayoutState();
      if (newUrl) CMSwift.router.setURLOnly(newUrl);
      return footerWrap;
    };

    hasHeaderContent = fillWrap(headerWrap, renderAliasSlot(["header"], headerSource));
    hasDrawerContent = fillWrap(asideContentWrap, drawerSource === false ? [] : renderAliasSlot(["aside", "drawer"], drawerSource));
    hasNavContent = fillWrap(navContentWrap, navSource === false ? [] : renderAliasSlot(["nav", "asideRight", "drawerRight"], navSource));
    hasPageContent = fillWrap(mainWrap, renderAliasSlot(["page", "main", "default"], pageFallback));
    hasFooterContent = fillWrap(footerWrap, renderAliasSlot(["footer"], footerSource));

    if (typeof ResizeObserver !== "undefined") {
      headerObserver = new ResizeObserver(() => syncHeaderHeight());
      headerObserver.observe(headerWrap);
    }
    syncHeaderHeight();

    CMSwift.reactive.effect(() => {
      getResponsiveKey();
      getMobile();
      getOpen();
      getNavOpen();
      syncLayoutState();
    }, "UI.Layout:state");

    const onKeyDown = (e) => {
      if (uiUnwrap(resolveLayoutProp("escClose")) === false) return;
      if ((!getMobile() && !getDrawerFloating() && !getNavFloating()) || (!getOpen() && !getNavOpen())) return;
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (getOpen()) setOpen(false);
      if (getNavOpen()) setNavOpen(false);
    };
    if (typeof document !== "undefined") {
      document.addEventListener("keydown", onKeyDown, true);
    }

    root.openAside = () => setOpen(true);
    root.closeAside = () => setOpen(false);
    root.toggleAside = () => setOpen(!getOpen());
    root.openNav = () => setNavOpen(true);
    root.closeNav = () => setNavOpen(false);
    root.toggleNav = () => setNavOpen(!getNavOpen());
    root.isDrawerOpen = () => !!getOpen();
    root.isNavOpen = () => !!getNavOpen();
    root.isMobile = () => !!getMobile();
    root.header = () => headerWrap;
    root.aside = () => asideWrap;
    root.drawer = () => asideWrap;
    root.nav = () => navWrap;
    root.page = () => mainWrap;
    root.main = () => mainWrap;
    root.footer = () => footerWrap;
    root.headerUpdate = headerUpdate;
    root.asideUpdate = asideUpdate;
    root.drawerUpdate = asideUpdate;
    root.navUpdate = navUpdate;
    root.pageUpdate = pageUpdate;
    root.mainUpdate = pageUpdate;
    root.footerUpdate = footerUpdate;
    root.reflow = syncLayoutState;
    root._dispose = () => {
      if (typeof window !== "undefined") window.removeEventListener("resize", checkMobile);
      if (typeof document !== "undefined") document.removeEventListener("keydown", onKeyDown, true);
      asideResizeHandle.removeEventListener("pointerdown", onDrawerResizePointerDown);
      navResizeHandle.removeEventListener("pointerdown", onNavResizePointerDown);
      disposeResizeSession?.();
      headerObserver?.disconnect?.();
    };

    setPropertyProps(root, props);
    syncLayoutState();
    return root;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Layout = {
      signature: "UI.Layout(...children) | UI.Layout(props, ...children)",
      props: {
        header: "Node|Function|Array",
        headerContent: "Node|Function|Array",
        aside: "Node|Function|Array|false",
        drawer: "Node|Function|Array|false",
        nav: "Node|Function|Array|false",
        asideRight: "Node|Function|Array|false",
        drawerRight: "Node|Function|Array|false",
        page: "Node|Function|Array",
        main: "Node|Function|Array",
        content: "Node|Function|Array",
        body: "Node|Function|Array",
        footer: "Node|Function|Array",
        footerContent: "Node|Function|Array",
        noDrawer: "boolean",
        drawerEnabled: "boolean",
        asideEnabled: "boolean",
        noNav: "boolean",
        navEnabled: "boolean",
        asideRightEnabled: "boolean",
        drawerOpen: "rod | [get,set] signal | boolean",
        navOpen: "rod | [get,set] signal | boolean",
        layoutBreakpoint: "number(px)",
        drawerBreakpoint: "number(px)",
        navBreakpoint: "number(px)",
        drawerWidth: "number|string",
        drawerResizable: "boolean",
        drawerMinWidth: "number|string",
        drawerMaxWidth: "number|string",
        navWidth: "number|string",
        navResizable: "boolean",
        navMinWidth: "number|string",
        navMaxWidth: "number|string",
        asideRightWidth: "number|string",
        drawerPeek: "number|string",
        navPeek: "number|string",
        asideRightPeek: "number|string",
        drawerFloating: "boolean",
        navFloating: "boolean",
        overlayClose: "boolean",
        escClose: "boolean",
        stickyHeader: "boolean",
        stickyFooter: "boolean",
        stickyAside: "boolean",
        stickyNav: "boolean",
        tagPage: "boolean",
        mode: "local|global",
        layoutMode: "alias di mode",
        disposition: "classic|classicRight|sidebarFullLeft|sidebarFullRight|appShell|dashboard|website|documentation|landing",
        layoutDisposition: "alias di disposition",
        layout: "alias di disposition",
        gap: "number|string",
        headerOffset: "number|string",
        minHeight: "number|string",
        areas: "string|array",
        gridTemplateAreas: "string|array",
        templateAreas: "string|array",
        mobile: "{ disposition?, mode?, gap?, minHeight?, areas?, gridTemplateAreas?, drawerWidth?, navWidth?, drawerFloating?, navFloating?, noDrawer?, noNav? }",
        tablet: "{ disposition?, mode?, gap?, minHeight?, areas?, gridTemplateAreas?, drawerWidth?, navWidth?, drawerFloating?, navFloating?, noDrawer?, noNav? }",
        pc: "{ disposition?, mode?, gap?, minHeight?, areas?, gridTemplateAreas?, drawerWidth?, navWidth?, drawerFloating?, navFloating?, noDrawer?, noNav? }",
        shellClass: "string",
        headerClass: "string",
        asideClass: "string",
        navClass: "string",
        pageClass: "string",
        footerClass: "string",
        overlayClass: "string",
        slots: "{ header?, aside?, drawer?, nav?, asideRight?, drawerRight?, page?, main?, footer?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        header: "Header content",
        aside: "Aside / drawer content",
        drawer: "Alias of aside",
        nav: "Right-side panel content",
        asideRight: "Alias of nav",
        drawerRight: "Alias of nav",
        page: "Page content",
        main: "Alias of page",
        footer: "Footer content",
        default: "Fallback page content"
      },
      returns: "HTMLDivElement with openAside/closeAside/toggleAside/openNav/closeNav/toggleNav methods, " +
        "isDrawerOpen/isNavOpen/isMobile/reflow, header()/aside()/nav()/page()/footer(), " +
        "headerUpdate/asideUpdate/navUpdate/pageUpdate/mainUpdate/footerUpdate and _dispose()",
      description: "Composable shell layout with independent left drawer and right nav, configurable widths, optional resize with min/max, optional floating mode, and runtime section updates."
    };
  }
  // Esempio: CMSwift.ui.Layout({ header, aside, page, footer })

  UI.Footer = (...args) => {
    const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(rawProps, key);
    const ctx = { props: rawProps };
    const appendResolvedValue = (host, value) => {
      if (value == null || value === false) return;
      if (Array.isArray(value)) {
        value.forEach((item) => appendResolvedValue(host, item));
        return;
      }
      if (value?.nodeType) {
        host.appendChild(value);
        return;
      }
      host.appendChild(document.createTextNode(String(value)));
    };
    const renderPropNodes = (name, fallback, map = (value) => value) => {
      const slot = CMSwift.ui.getSlot(slots, name);
      if (slot !== null && slot !== undefined) {
        return renderSlotToArray(slots, name, ctx, null);
      }
      if (typeof fallback === "function") {
        const inlineNames = new Set(["eyebrow", "title", "subtitle"]);
        const host = _[inlineNames.has(name) ? "span" : "div"]({ class: `cms-footer-slot-${name}` });
        CMSwift.reactive.effect(() => {
          const nextValue = map(fallback(ctx));
          const normalized = flattenSlotValue(CMSwift.ui.slot(nextValue));
          host.replaceChildren();
          if (Array.isArray(normalized)) normalized.forEach((item) => appendResolvedValue(host, item));
          else appendResolvedValue(host, normalized);
        }, `UI.Footer:${name}`);
        return [host];
      }
      return renderSlotToArray(slots, name, ctx, map(fallback));
    };

    const renderIconValue = (value, as = "icon", sizeFallback = rawProps.iconSize || rawProps.size || "md") => {
      if (value == null || value === false) return null;
      if (typeof value === "string") return UI.Icon({ name: value, size: sizeFallback });
      return CMSwift.ui.slot(value, { as });
    };

    const startFallback = hasOwn("left") ? rawProps.left : rawProps.start;
    const endFallback = hasOwn("right") ? rawProps.right : rawProps.end;
    const titleFallback = hasOwn("title") ? rawProps.title : rawProps.label;
    const subtitleFallback = rawProps.subtitle ?? rawProps.description ?? rawProps.note;
    const contentFallback = hasOwn("content")
      ? rawProps.content
      : (hasOwn("body") ? rawProps.body : (children?.length ? children : null));

    const startNodes = [
      ...renderPropNodes("left", startFallback),
      ...renderPropNodes("start", null)
    ];
    const iconNodes = renderPropNodes("icon", rawProps.icon, renderIconValue);
    const eyebrowNodes = renderPropNodes("eyebrow", rawProps.eyebrow ?? rawProps.kicker);
    const titleNodes = renderPropNodes("title", titleFallback);
    const subtitleNodes = renderPropNodes("subtitle", subtitleFallback);
    const metaNodes = renderPropNodes("meta", rawProps.meta);
    const contentNodes = (() => {
      const explicit = renderPropNodes("content", null);
      return explicit.length ? explicit : renderPropNodes("default", contentFallback);
    })();
    const customBodyNodes = [
      ...renderPropNodes("center", null),
      ...renderPropNodes("body", null)
    ];
    const endNodes = [
      ...renderPropNodes("right", endFallback),
      ...renderPropNodes("end", null)
    ];
    const actionNodes = renderPropNodes("actions", rawProps.actions);

    const structuredBody = _.div(
      { class: uiClass(["cms-footer-body", rawProps.bodyClass, rawProps.centerClass]) },
      _.div(
        { class: "cms-footer-heading" },
        iconNodes.length ? _.div({ class: "cms-footer-icon" }, ...iconNodes) : null,
        _.div(
          { class: "cms-footer-copy" },
          eyebrowNodes.length ? _.div({ class: uiClass(["cms-footer-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
          titleNodes.length ? _.div({ class: uiClass(["cms-footer-title", rawProps.titleClass]) }, ...titleNodes) : null,
          subtitleNodes.length ? _.div({ class: uiClass(["cms-footer-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
          contentNodes.length ? _.div({ class: uiClass(["cms-footer-content", rawProps.contentClass]) }, ...contentNodes) : null
        ),
        metaNodes.length ? _.div({ class: uiClass(["cms-footer-meta", rawProps.metaClass]) }, ...metaNodes) : null
      )
    );

    const mainChildren = [];
    if (customBodyNodes.length) {
      mainChildren.push(_.div({ class: uiClass(["cms-footer-body", rawProps.bodyClass, rawProps.centerClass]) }, ...customBodyNodes));
    } else if (iconNodes.length || eyebrowNodes.length || titleNodes.length || subtitleNodes.length || contentNodes.length || metaNodes.length) {
      mainChildren.push(structuredBody);
    }
    if (endNodes.length || actionNodes.length) {
      mainChildren.push(
        _.div(
          { class: uiClass(["cms-footer-end", rawProps.endClass]) },
          ...endNodes,
          ...(actionNodes.length ? [_.div({ class: uiClass(["cms-footer-actions", rawProps.actionsClass]) }, ...actionNodes)] : [])
        )
      );
    }

    const p = CMSwift.omit(rawProps, [
      "actions", "actionsClass", "align", "body", "bodyClass", "center", "centerClass", "content",
      "contentClass", "dense", "description", "divider", "elevated", "end", "endClass", "eyebrow",
      "eyebrowClass", "gap", "icon", "iconSize", "kicker", "label", "left", "meta", "metaClass",
      "minHeight", "note", "right", "slots", "stack", "start", "startClass", "sticky", "subtitle",
      "subtitleClass", "title", "titleClass", "wrap", "justify"
    ]);
    p.class = uiClass([
      "cms-panel",
      "cms-footer",
      "cms-singularity",
      uiWhen(rawProps.sticky, "sticky"),
      uiWhen(rawProps.dense, "dense"),
      uiWhen(rawProps.elevated, "elevated"),
      uiWhen(rawProps.divider !== false, "divider"),
      uiWhen(rawProps.stack, "stack"),
      uiClassValue(rawProps.align, "align-"),
      rawProps.class
    ]);
    p.style = { ...(rawProps.style || {}) };
    const justify = uiStyleValue(rawProps.justify);
    if (justify != null) p.style.justifyContent = justify;
    const wrap = uiStyleValue(rawProps.wrap, (v) => v ? "wrap" : "nowrap");
    if (wrap != null) p.style.flexWrap = wrap;
    if (rawProps.gap != null) p.style["--cms-footer-gap"] = toCssSize(uiUnwrap(rawProps.gap));
    if (rawProps.minHeight != null) p.style.minHeight = toCssSize(uiUnwrap(rawProps.minHeight));
    CMSwift.uiApplyResponsiveProps(p, rawProps, CMSwift.uiResponsiveStyleRules);

    const el = _.footer(
      p,
      ...(startNodes.length ? [_.div({ class: uiClass(["cms-footer-start", rawProps.startClass]) }, ...startNodes)] : []),
      ...(mainChildren.length ? [_.div({ class: "cms-footer-main" }, ...mainChildren)] : [])
    );

    setPropertyProps(el, rawProps);
    return el;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Footer = {
      signature: "UI.Footer(...children) | UI.Footer(props, ...children)",
      props: {
        title: "String|Node|Function|Array",
        subtitle: "String|Node|Function|Array",
        eyebrow: "String|Node|Function|Array",
        content: "Node|Function|Array",
        meta: "Node|Function|Array",
        icon: "String|Node|Function|Array",
        left: "Node|Function|Array",
        start: "Alias of left",
        right: "Node|Function|Array",
        end: "Alias of right",
        body: "Alias of content",
        actions: "Node|Function|Array",
        sticky: "boolean",
        dense: "boolean",
        elevated: "boolean",
        divider: "boolean",
        align: `left|center|right`,
        justify: `flex-start|center|flex-end|space-between|space-around|space-evenly`,
        wrap: "boolean",
        stack: "boolean",
        gap: "string|number",
        minHeight: "string|number",
        slots: "{ left?, start?, right?, end?, center?, body?, icon?, eyebrow?, title?, subtitle?, meta?, content?, actions?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        left: "Footer leading area",
        start: "Alias/addon for the leading area",
        right: "Footer trailing area",
        end: "Alias/addon for the trailing area",
        center: "Full override for the central body",
        body: "Alias of center",
        icon: "Leading icon",
        eyebrow: "Eyebrow / kicker",
        title: "Main title",
        subtitle: "Subtitle or note",
        meta: "Meta info next to the central content",
        content: "Extra content or children fallback",
        actions: "Actions grouped in the trailing area",
        default: "Fallback content for the body area"
      },
      returns: "HTMLElement <footer>",
      description: "Structured footer with start/body/end regions, optional copy, actions, and composable slots."
    };
  }
  // Esempio: CMSwift.ui.Footer({}, "Footer")

  const normalizeChildren = (children) => {
    const out = [];
    for (const ch of (children || [])) {
      const v = flattenSlotValue(CMSwift.ui.slot(ch));
      if (!v) continue;
      if (Array.isArray(v)) out.push(...v);
      else out.push(v);
    }
    return out;
  };

  const slotToArray = (value, opts) => {
    const v = flattenSlotValue(CMSwift.ui.slot(value, opts));
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  };

  const toCssSize = (v) => {
    if (typeof v === "number") return `${v}px`;
    if (typeof v === "string" && CMSwift.uiSizes?.includes(v)) return `var(--cms-size-${v})`;
    return String(v);
  };

  UI.Toolbar = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const renderArea = (names, fallback, ctx = {}) => {
      const list = Array.isArray(names) ? names : [names];
      for (const name of list) {
        if (CMSwift.ui.getSlot(slots, name) != null) {
          return renderSlotToArray(slots, name, ctx, fallback);
        }
      }
      return fallback == null ? [] : renderSlotToArray(null, "default", ctx, fallback);
    };
    const hasArea = (names) => {
      const list = Array.isArray(names) ? names : [names];
      return list.some((name) => CMSwift.ui.getSlot(slots, name) != null);
    };

    const ctx = { props };
    const beforeNodes = renderArea(["before"], props.before, ctx);
    const startNodes = renderArea(["start", "left"], props.start ?? props.left, ctx);
    const centerNodes = renderArea(["center", "body", "content", "default"], props.center ?? props.body ?? props.content ?? children, ctx);
    const endNodes = renderArea(["end", "right", "actions"], props.end ?? props.right ?? props.actions, ctx);
    const afterNodes = renderArea(["after"], props.after, ctx);
    const titleNodes = renderArea(["title"], props.title, ctx);
    const subtitleNodes = renderArea(["subtitle"], props.subtitle, ctx);
    const metaNodes = renderArea(["meta"], props.meta, ctx);

    const hasStructuredContent = !!(
      beforeNodes.length || startNodes.length || endNodes.length || afterNodes.length || titleNodes.length || subtitleNodes.length || metaNodes.length
      || props.before != null || props.start != null || props.left != null || props.end != null || props.right != null || props.actions != null
      || props.after != null || props.title != null || props.subtitle != null || props.meta != null || props.body != null || props.center != null || props.content != null
      || props.beforeClass || props.startClass || props.bodyClass || props.centerClass || props.contentClass || props.endClass || props.afterClass
      || props.titleClass || props.subtitleClass || props.metaClass || props.copyClass
      || hasArea(["before", "start", "left", "center", "body", "content", "end", "right", "actions", "after", "title", "subtitle", "meta"])
    );

    const cls = uiClass([
      "cms-toolbar",
      uiWhen(hasStructuredContent, "structured"),
      uiWhen(props.dense, "dense"),
      uiWhen(props.divider, "divider"),
      uiWhen(props.elevated, "elevated"),
      uiWhen(props.sticky, "sticky"),
      props.class
    ]);

    const p = CMSwift.omit(props, [
      "actions", "after", "afterClass", "align", "before", "beforeClass", "body", "bodyClass", "center", "centerClass",
      "content", "contentClass", "copyClass", "dense", "divider", "elevated", "end", "endClass", "gap", "justify",
      "left", "meta", "metaClass", "right", "size", "slots", "start", "startClass", "sticky", "subtitle", "subtitleClass",
      "title", "titleClass", "wrap"
    ]);
    p.class = cls;

    const style = { ...(props.style || {}) };
    style.display = style.display || "flex";
    const align = uiStyleValue(props.align);
    const justify = uiStyleValue(props.justify);
    const wrap = uiStyleValue(props.wrap, (v) => typeof v === "boolean" ? (v ? "wrap" : "nowrap") : String(v), "wrap");
    const gap = uiStyleValue(props.gap, toCssSize, "var(--cms-s-md)");
    const hasResponsiveGap = uiHasResponsiveOverride(props, "gap");
    style["--cms-toolbar-gap"] = gap != null ? gap : "var(--cms-s-md)";
    if (!hasResponsiveGap) style.gap = style.gap || "var(--cms-toolbar-gap)";
    const sizePadding = {
      xxs: "4px 6px",
      xs: "6px 8px",
      sm: "6px 10px",
      md: "10px 12px",
      lg: "12px 16px",
      xl: "14px 18px",
      xxl: "16px 20px"
    };
    const padding = uiStyleValue(props.size, (v) => sizePadding[v] || "");
    if (padding != null) style.padding = padding;
    if (hasStructuredContent) {
      style.flexDirection = style.flexDirection || "column";
      style.alignItems = style.alignItems || "stretch";
    } else {
      if (align != null) style.alignItems = align;
      if (justify != null) style.justifyContent = justify;
      if (wrap != null) style.flexWrap = wrap;
    }
    if (Object.keys(style).length) p.style = style;
    CMSwift.uiApplyResponsiveProps(p, props, CMSwift.uiResponsiveStyleRules);

    if (!hasStructuredContent) {
      const content = renderSlotToArray(slots, "default", ctx, children);
      const el = _.div(p, ...content);
      setPropertyProps(el, props);
      return el;
    }

    const bodyClass = props.bodyClass ?? props.centerClass ?? props.contentClass;
    const endAutoMargin = uiComputed([props.justify], () => {
      const value = uiUnwrap(props.justify);
      return !value || value === "flex-start" ? "auto" : "";
    });
    const regionStyle = {
      display: "flex",
      alignItems: "inherit",
      gap: "var(--cms-toolbar-gap)",
      flexWrap: "inherit",
      minWidth: 0
    };
    const mainStyle = {};
    if (align != null) mainStyle.alignItems = align;
    if (justify != null) mainStyle.justifyContent = justify;
    if (wrap != null) mainStyle.flexWrap = wrap;

    const copyNode = (metaNodes.length || titleNodes.length || subtitleNodes.length)
      ? _.div(
        { class: uiClass(["cms-toolbar-copy", props.copyClass]) },
        metaNodes.length ? _.div({ class: uiClass(["cms-toolbar-meta", props.metaClass]) }, ...metaNodes) : null,
        titleNodes.length ? _.div({ class: uiClass(["cms-toolbar-title", props.titleClass]) }, ...titleNodes) : null,
        subtitleNodes.length ? _.div({ class: uiClass(["cms-toolbar-subtitle", props.subtitleClass]) }, ...subtitleNodes) : null
      )
      : null;

    const hasMainContent = !!(startNodes.length || copyNode || centerNodes.length || endNodes.length);
    const parts = [
      beforeNodes.length
        ? _.div({ class: uiClass(["cms-toolbar-before", props.beforeClass]), style: { ...regionStyle } }, ...beforeNodes)
        : null,
      hasMainContent
        ? _.div(
          { class: "cms-toolbar-main", style: mainStyle },
          startNodes.length
            ? _.div({ class: uiClass(["cms-toolbar-start", props.startClass]), style: { ...regionStyle } }, ...startNodes)
            : null,
          (copyNode || centerNodes.length)
            ? _.div({ class: uiClass(["cms-toolbar-center", bodyClass]), style: { ...regionStyle, flex: "1 1 240px" } }, copyNode, ...centerNodes)
            : null,
          endNodes.length
            ? _.div({
              class: uiClass(["cms-toolbar-end", props.endClass]),
              style: {
                ...regionStyle,
                justifyContent: "flex-end",
                marginInlineStart: endAutoMargin
              }
            }, ...endNodes)
            : null
        )
        : null,
      afterNodes.length
        ? _.div({ class: uiClass(["cms-toolbar-after", props.afterClass]), style: { ...regionStyle } }, ...afterNodes)
        : null
    ].filter(Boolean);

    const el = _.div(p, ...parts);
    setPropertyProps(el, props);
    return el;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Toolbar = {
      signature: "UI.Toolbar(...children) | UI.Toolbar(props, ...children)",
      props: {
        before: "Node|Function|Array",
        start: "Node|Function|Array",
        left: "Alias of start",
        center: "Node|Function|Array",
        body: "Alias of center",
        content: "Alias of center",
        title: "String|Node|Function|Array",
        subtitle: "String|Node|Function|Array",
        meta: "String|Node|Function|Array",
        end: "Node|Function|Array",
        right: "Alias of end",
        actions: "Alias of end",
        after: "Node|Function|Array",
        dense: "boolean",
        divider: "boolean",
        elevated: "boolean",
        sticky: "boolean",
        wrap: "boolean|string",
        align: `stretch|flex-start|center|flex-end|baseline`,
        justify: `flex-start|center|flex-end|space-between|space-around|space-evenly`,
        gap: "string|number (e.g. '8px' or 'var(--cms-s-md)')",
        size: "xxs|xs|sm|md|lg|xl|xxl",
        beforeClass: "string",
        startClass: "string",
        bodyClass: "string",
        centerClass: "Alias of bodyClass",
        contentClass: "Alias of bodyClass",
        copyClass: "string",
        titleClass: "string",
        subtitleClass: "string",
        metaClass: "string",
        endClass: "string",
        afterClass: "string",
        slots: "{ before?, start?, left?, center?, body?, content?, title?, subtitle?, meta?, end?, right?, actions?, after?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        before: "Optional top row",
        start: "Leading content area",
        left: "Alias of start",
        center: "Main content area",
        body: "Alias of center",
        content: "Alias of center",
        title: "Toolbar main title",
        subtitle: "Subtitle or operational note",
        meta: "Meta info/chips above or next to the title",
        end: "Trailing actions area",
        right: "Alias of end",
        actions: "Alias of end",
        after: "Optional bottom row",
        default: "Fallback content / children"
      },
      events: {
        onClick: "MouseEvent"
      },
      description: "Composable toolbar with before/start/center/end/after regions, optional copy, and fallback compatible with simple flex usage.",
      returns: "HTMLDivElement"
    };
  }
  // Esempio: CMSwift.ui.Toolbar({}, CMSwift.ui.Btn({}, "Azione"))

  const isGridColNode = (value) => value && value.nodeType === 1 && value.classList?.contains("cms-grid-col");

  UI.Grid = (...args) => {
    const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const itemSource = uiUnwrap(rawProps.items);
    const items = Array.isArray(itemSource) ? itemSource : (itemSource == null ? [] : [itemSource]);

    const buildItemProps = (entryProps = {}) => {
      const baseProps = rawProps.itemProps || {};
      const merged = { ...baseProps, ...entryProps };
      merged.class = uiClass([baseProps.class, rawProps.itemClass, entryProps.class]);
      merged.style = {
        ...(baseProps.style || {}),
        ...(rawProps.itemStyle || {}),
        ...(entryProps.style || {})
      };
      return merged;
    };

    const normalizeResolvedNode = (value, entryProps = {}) => {
      if (value == null || value === false) return [];
      if (isGridColNode(value)) return [value];
      if (isUIPlainObject(value)) {
        const childContent = value.children != null
          ? asNodeArray(value.children)
          : (value.content != null
            ? asNodeArray(value.content)
            : (value.node != null
              ? asNodeArray(value.node)
              : (value.label != null ? asNodeArray(value.label) : [])));
        return [UI.GridCol(buildItemProps(value), ...childContent)];
      }
      if (Array.isArray(value)) {
        return [UI.GridCol(buildItemProps(entryProps), ...value)];
      }
      return [UI.GridCol(buildItemProps(entryProps), value)];
    };

    const normalizeItemNode = (value, index, total, useItemSlot = true) => {
      if (value == null || value === false) return [];
      const entryProps = isUIPlainObject(value) ? value : {};
      if (useItemSlot) {
        const ctx = {
          item: value,
          index,
          count: total,
          first: index === 0,
          last: index === total - 1
        };
        const slotted = renderSlotToArray(slots, "item", ctx, null);
        if (slotted.length) {
          return slotted.flatMap((node) => normalizeResolvedNode(node, entryProps));
        }
      }
      return normalizeResolvedNode(value, entryProps);
    };

    const content = [];
    items.forEach((item, index) => {
      content.push(...normalizeItemNode(item, index, items.length));
    });

    const defaultNodes = renderSlotToArray(slots, "default", { items, count: items.length }, children);
    defaultNodes.forEach((node) => {
      content.push(...normalizeResolvedNode(node));
    });

    if (!content.length) {
      const emptyNodes = renderSlotToArray(slots, "empty", { items, count: 0 }, rawProps.empty);
      emptyNodes.forEach((node) => {
        const normalized = normalizeResolvedNode(node, {
          style: { gridColumn: "1 / -1" }
        });
        content.push(...normalized);
      });
    }

    const cls = uiClass([
      "cms-grid",
      CMSwift.uiResponsiveClasses({ mobile: rawProps }, uiResponsiveGridRules),
      CMSwift.uiResponsiveClasses(rawProps, uiResponsiveGridRules),
      uiWhen(rawProps.dense, "dense"),
      uiWhen(rawProps.inline, "cms-grid-inline"),
      uiWhen(rawProps.debug, "cms-grid-debug"),
      rawProps.class
    ]);

    const p = CMSwift.omit(rawProps, [
      "gap", "rowGap", "columnGap", "colGap", "cols", "columns", "rows", "areas", "align", "justify",
      "alignItems", "justifyItems", "placeItems", "placeContent", "dense", "flow", "inline", "debug",
      "autoFit", "autoFill", "min", "max", "autoRows", "items", "itemClass", "itemStyle", "itemProps",
      "empty", "slots", "full", "width", "minWidth", "maxWidth", "padding",
      ...CMSwift.uiResponsiveOmitProps
    ]);
    p.class = cls;

    const style = { ...(rawProps.style || {}) };
    if (
      CMSwift.uiResponsiveHasConfig?.(rawProps)
      && rawProps.display == null
      && !uiHasResponsiveOverride(rawProps, "display")
      && style.display == null
    ) {
      style.display = rawProps.inline ? "inline-grid" : "grid";
    }
    const gap = uiStyleValue(rawProps.gap, toCssSize);
    if (gap != null && !uiHasResponsiveOverride(rawProps, "gap")) {
      style["--cms-grid-gap"] = gap;
      style.gap = gap;
    }
    const rowGap = uiStyleValue(rawProps.rowGap, toCssSize);
    if (rowGap != null && !uiHasResponsiveOverride(rawProps, "rowGap")) style.rowGap = rowGap;
    const columnGap = uiStyleValue(rawProps.columnGap ?? rawProps.colGap, toCssSize);
    if (columnGap != null && !uiHasResponsiveOverride(rawProps, ["columnGap", "colGap"])) style.columnGap = columnGap;

    const trackMax = uiStyleValue(rawProps.max, toCssSize, "1fr");
    const min = uiStyleValue(rawProps.min, toCssSize);
    if (min != null) {
      const mode = uiUnwrap(rawProps.autoFill) ? "auto-fill" : "auto-fit";
      style.gridTemplateColumns = `repeat(${mode}, minmax(${min}, ${trackMax || "1fr"}))`;
    } else {
      const cols = uiStyleValue(rawProps.columns ?? rawProps.cols, (v) => typeof v === "number"
        ? `repeat(${v}, minmax(0, 1fr))`
        : String(v)
      );
      if (cols != null && !uiHasResponsiveOverride(rawProps, ["cols", "columns"])) style.gridTemplateColumns = cols;
    }

    const rows = uiStyleValue(rawProps.rows, (v) => typeof v === "number"
      ? `repeat(${v}, minmax(0, auto))`
      : String(v)
    );
    if (rows != null) style.gridTemplateRows = rows;

    const autoRows = uiStyleValue(rawProps.autoRows, toCssSize);
    if (autoRows != null) style.gridAutoRows = autoRows;

    const flow = uiStyleValue(rawProps.flow, (v) => {
      const value = String(v);
      return rawProps.dense && !value.includes("dense") ? `${value} dense` : value;
    });
    if (flow != null && !uiHasResponsiveOverride(rawProps, "flow")) style.gridAutoFlow = flow;

    const areas = uiStyleValue(rawProps.areas, (value) => {
      if (Array.isArray(value)) {
        return value.map((row) => `"${Array.isArray(row) ? row.join(" ") : String(row)}"`).join(" ");
      }
      return String(value);
    });
    if (areas != null) style.gridTemplateAreas = areas;

    const align = uiStyleValue(rawProps.align ?? rawProps.alignItems);
    if (align != null && !uiHasResponsiveOverride(rawProps, ["align", "alignItems"])) style.alignItems = align;
    const justify = uiStyleValue(rawProps.justify);
    if (justify != null && !uiHasResponsiveOverride(rawProps, "justify")) style.justifyContent = justify;
    const justifyItems = uiStyleValue(rawProps.justifyItems);
    if (justifyItems != null) style.justifyItems = justifyItems;
    const placeItems = uiStyleValue(rawProps.placeItems);
    if (placeItems != null) style.placeItems = placeItems;
    const placeContent = uiStyleValue(rawProps.placeContent);
    if (placeContent != null) style.placeContent = placeContent;
    const width = uiStyleValue(rawProps.width, toCssSize);
    if (width != null && !uiHasResponsiveOverride(rawProps, "width")) style.width = width;
    if (uiUnwrap(rawProps.full) === true) style.width = "100%";
    const minWidth = uiStyleValue(rawProps.minWidth, toCssSize);
    if (minWidth != null && !uiHasResponsiveOverride(rawProps, "minWidth")) style.minWidth = minWidth;
    const maxWidth = uiStyleValue(rawProps.maxWidth, toCssSize);
    if (maxWidth != null && !uiHasResponsiveOverride(rawProps, "maxWidth")) style.maxWidth = maxWidth;
    const padding = uiStyleValue(rawProps.padding, toCssSize);
    if (padding != null && !uiHasResponsiveOverride(rawProps, "padding")) style.padding = padding;
    if (Object.keys(style).length) p.style = style;
    CMSwift.uiApplyResponsiveProps(p, rawProps, CMSwift.uiResponsiveStyleRules);

    const el = _.div(p, ...content);
    setPropertyProps(el, rawProps);
    return el;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Grid = {
      signature: "UI.Grid(...children) | UI.Grid(props, ...children)",
      props: {
        cols: "number|string",
        columns: "alias di cols",
        min: "string|number (auto-fit/auto-fill min width)",
        max: "string|number (max track size, default 1fr)",
        gap: "string|number",
        rowGap: "string|number",
        columnGap: "string|number",
        colGap: "alias di columnGap",
        rows: "number|string",
        autoRows: "string|number",
        areas: "string|array",
        flow: "row|column|dense|row dense|column dense",
        align: `stretch|start|center|end`,
        alignItems: "alias di align",
        justify: `start|center|end|space-between|space-around|space-evenly`,
        justifyItems: `stretch|start|center|end`,
        placeItems: "string",
        placeContent: "string",
        dense: "boolean",
        inline: "boolean",
        debug: "boolean",
        autoFit: "boolean",
        autoFill: "boolean",
        full: "boolean",
        width: "string|number",
        minWidth: "string|number",
        maxWidth: "string|number",
        padding: "string|number",
        mobile: "{ cols?, gap?, flow?, width?, padding? }",
        tablet: "{ cols?, gap?, flow?, width?, padding? }",
        pc: "{ cols?, gap?, flow?, width?, padding? }",
        items: "Array<Node|Object|string>",
        itemClass: "string",
        itemStyle: "object",
        itemProps: "object",
        empty: "String|Node|Function|Array",
        slots: "{ default?, item?, empty? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Grid content fallback",
        item: "Render custom di ogni item ({ item, index, count, first, last })",
        empty: "Empty state della griglia"
      },
      returns: "HTMLDivElement",
      description: "Griglia dichiarativa per layout responsive: supporta children, items/slot item, auto-fit, template custom e empty state."
    };
  }
  // Esempio: CMSwift.ui.Grid({}, CMSwift.ui.GridCol({ span: 12 }, "Col"))

  UI.GridCol = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(props, key);
    const renderArea = (names, fallback, ctx = {}) => {
      const list = Array.isArray(names) ? names : [names];
      for (const name of list) {
        if (CMSwift.ui.getSlot(slots, name) != null) {
          return renderSlotToArray(slots, name, ctx, fallback);
        }
      }
      return fallback == null ? [] : renderSlotToArray(null, "default", ctx, fallback);
    };
    const resolveSpaceValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "string" && CMSwift.uiSizes?.includes(value)) return `var(--cms-s-${value})`;
      return toCssSize(value);
    };
    const resolveSizeValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "string" && CMSwift.uiSizes?.includes(value)) return unitCover(value, "size");
      return toCssSize(value);
    };

    const style = { ...(props.style || {}) };
    const toGridSpan = (value) => {
      if (value == null || value === "") return null;
      if (value === "auto") return "auto";
      if (value === "full" || value === true) return "1 / -1";
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) {
        const spanValue = Math.max(1, Math.round(n));
        return `span ${spanValue} / span ${spanValue}`;
      }
      return String(value);
    };
    const toGridRow = (value) => {
      if (value == null || value === "") return null;
      if (value === "full" || value === true) return "1 / -1";
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) {
        const spanValue = Math.max(1, Math.round(n));
        return `span ${spanValue} / span ${spanValue}`;
      }
      return String(value);
    };

    const spanSource = hasOwn("span") ? props.span : props.col;
    const span = uiStyleValue(spanSource, toGridSpan);
    const sm = uiStyleValue(props.sm, toGridSpan);
    const md = uiStyleValue(props.md, toGridSpan);
    const lg = uiStyleValue(props.lg, toGridSpan);
    const tabletProps = CMSwift.uiResponsivePropsFor(props, uiResponsiveDevice("tablet")) || {};
    const pcProps = CMSwift.uiResponsivePropsFor(props, uiResponsiveDevice("pc")) || {};
    const tabletSpanSource = tabletProps.span ?? tabletProps.col;
    const pcSpanSource = pcProps.span ?? pcProps.col;
    const tabletSpan = uiStyleValue(tabletSpanSource, toGridSpan);
    const pcSpan = uiStyleValue(pcSpanSource, toGridSpan);
    const rowSpan = uiStyleValue(props.rowSpan, toGridRow);
    const row = uiStyleValue(props.row, toGridRow);
    const area = uiStyleValue(props.area);
    const align = uiStyleValue(props.align);
    const justify = uiStyleValue(props.justify);
    const place = uiStyleValue(props.place);
    const gap = uiStyleValue(props.gap, resolveSpaceValue);
    const rowGap = uiStyleValue(props.rowGap, resolveSpaceValue);
    const columnGap = uiStyleValue(props.columnGap, resolveSpaceValue);
    const padding = uiStyleValue(props.padding, resolveSpaceValue);
    const width = uiStyleValue(props.width, resolveSizeValue);
    const minHeight = uiStyleValue(props.minHeight, resolveSizeValue);
    const height = uiStyleValue(props.height, resolveSizeValue);
    const maxHeight = uiStyleValue(props.maxHeight, resolveSizeValue);
    const contentAlign = uiStyleValue(props.contentAlign);
    const contentJustify = uiStyleValue(props.contentJustify);
    const direction = uiStyleValue(props.direction);
    const scroll = uiStyleValue(props.scroll, (value) => value === true ? "auto" : String(value), "");
    const fullHeight = uiStyleValue(props.fullHeight, (value) => value ? "100%" : "", "");
    const centerContent = uiComputed([props.center, props.contentAlign, props.contentJustify], () => {
      return !!uiUnwrap(props.center)
        && (uiUnwrap(props.contentAlign) == null || uiUnwrap(props.contentAlign) === "")
        && (uiUnwrap(props.contentJustify) == null || uiUnwrap(props.contentJustify) === "");
    });

    const ctx = { props };
    const startNodes = renderArea(
      ["start", "top", "header", "before"],
      props.start ?? props.top ?? props.header ?? props.before,
      ctx
    );
    const bodyFallback = hasOwn("body")
      ? props.body
      : (hasOwn("content") ? props.content : children);
    const bodyNodes = renderArea(["body", "content", "default"], bodyFallback, ctx);
    const endNodes = renderArea(
      ["end", "bottom", "footer", "after"],
      props.end ?? props.bottom ?? props.footer ?? props.after,
      ctx
    );
    const hasStructuredContent = startNodes.length || endNodes.length
      || hasOwn("start") || hasOwn("top") || hasOwn("header") || hasOwn("before")
      || hasOwn("body") || hasOwn("content")
      || hasOwn("end") || hasOwn("bottom") || hasOwn("footer") || hasOwn("after")
      || props.startClass || props.bodyClass || props.contentClass || props.endClass
      || props.topClass || props.headerClass || props.bottomClass || props.footerClass
      || CMSwift.ui.getSlot(slots, "start") != null
      || CMSwift.ui.getSlot(slots, "top") != null
      || CMSwift.ui.getSlot(slots, "header") != null
      || CMSwift.ui.getSlot(slots, "before") != null
      || CMSwift.ui.getSlot(slots, "body") != null
      || CMSwift.ui.getSlot(slots, "content") != null
      || CMSwift.ui.getSlot(slots, "end") != null
      || CMSwift.ui.getSlot(slots, "bottom") != null
      || CMSwift.ui.getSlot(slots, "footer") != null
      || CMSwift.ui.getSlot(slots, "after") != null;
    const useStackLayout = uiComputed([
      props.stack, props.gap, props.rowGap, props.columnGap,
      props.contentAlign, props.contentJustify, props.direction, props.center
    ], () => {
      if (hasStructuredContent || !!uiUnwrap(props.stack)) return true;
      const values = [
        uiUnwrap(props.gap),
        uiUnwrap(props.rowGap),
        uiUnwrap(props.columnGap),
        uiUnwrap(props.contentAlign),
        uiUnwrap(props.contentJustify),
        uiUnwrap(props.direction)
      ];
      if (values.some((value) => value != null && value !== false && value !== "")) return true;
      return !!uiUnwrap(props.center);
    });
    const surfaceClasses = uiComputed([
      props.panel, props.color, props.clickable, props.border, props.glossy, props.glow,
      props.glass, props.shadow, props.outline, props.gradient, props.textGradient,
      props.lightShadow, props.radius
    ], () => {
      const active = !!(
        uiUnwrap(props.panel) || uiUnwrap(props.color) || uiUnwrap(props.clickable) ||
        uiUnwrap(props.border) || uiUnwrap(props.glossy) || uiUnwrap(props.glow) ||
        uiUnwrap(props.glass) || uiUnwrap(props.shadow) || uiUnwrap(props.outline) ||
        uiUnwrap(props.gradient) || uiUnwrap(props.textGradient) || uiUnwrap(props.lightShadow) ||
        uiUnwrap(props.radius)
      );
      return active ? ["cms-clear-set", "cms-singularity", "cms-grid-col-surface"] : [];
    });
    const cls = uiClass([
      "cms-grid-col",
      surfaceClasses,
      CMSwift.uiResponsiveClasses({ mobile: props }, uiResponsiveGridColRules),
      CMSwift.uiResponsiveClasses(props, uiResponsiveGridColRules),
      uiWhen(props.panel, "cms-grid-col-panel"),
      uiWhen(props.auto, "is-auto"),
      uiWhen(useStackLayout, "cms-grid-col-stack"),
      uiWhen(props.inline, "cms-grid-col-inline"),
      uiWhen(centerContent, "cms-grid-col-center"),
      props.class
    ]);

    const p = CMSwift.omit(props, [
      "span", "col", "sm", "md", "lg", "auto",
      "row", "rowSpan", "area", "align", "justify", "place",
      "gap", "rowGap", "columnGap", "padding",
      "width", "height", "minHeight", "maxHeight", "fullHeight",
      "stack", "inline", "direction", "contentAlign", "contentJustify", "center", "scroll",
      "panel", "to",
      "start", "top", "header", "before", "startClass", "topClass", "headerClass",
      "body", "content", "bodyClass", "contentClass",
      "end", "bottom", "footer", "after", "endClass", "bottomClass", "footerClass",
      "slots", "style",
      "clickable", "dense", "flat", "border", "glossy", "glow", "glass", "shadow",
      "outline", "rounded", "gradient", "textGradient", "lightShadow", "color", "textColor",
      "size", "radius",
      ...CMSwift.uiResponsiveOmitProps
    ]);
    p.class = cls;

    if (style["--cms-grid-col-base"] == null) style["--cms-grid-col-base"] = "auto";
    if (style["--cms-grid-col-tablet"] == null) style["--cms-grid-col-tablet"] = "var(--cms-grid-col-base, auto)";
    if (style["--cms-grid-col-pc"] == null) style["--cms-grid-col-pc"] = "var(--cms-grid-col-tablet, var(--cms-grid-col-base, auto))";
    if (uiUnwrap(props.auto) === true) style["--cms-grid-col-base"] = "auto";
    else if (span != null) style["--cms-grid-col-base"] = span;
    if (sm != null) style["--cms-grid-col-sm"] = sm;
    if (md != null) style["--cms-grid-col-md"] = md;
    if (lg != null) style["--cms-grid-col-lg"] = lg;
    if (tabletSpan != null) style["--cms-grid-col-tablet"] = tabletSpan;
    if (pcSpan != null) style["--cms-grid-col-pc"] = pcSpan;
    if (rowSpan != null) style.gridRow = rowSpan;
    else if (row != null) style.gridRow = row;
    if (area != null) style.gridArea = area;
    if (align != null && !uiHasResponsiveOverride(props, "align")) style.alignSelf = align;
    if (justify != null && !uiHasResponsiveOverride(props, "justify")) style.justifySelf = justify;
    if (place != null && !uiHasResponsiveOverride(props, "place")) style.placeSelf = place;
    if (gap != null && !uiHasResponsiveOverride(props, "gap")) style.gap = gap;
    if (rowGap != null && !uiHasResponsiveOverride(props, "rowGap")) style.rowGap = rowGap;
    if (columnGap != null && !uiHasResponsiveOverride(props, "columnGap")) style.columnGap = columnGap;
    if (padding != null && !uiHasResponsiveOverride(props, "padding")) style.padding = padding;
    if (width != null && !uiHasResponsiveOverride(props, "width")) style.width = width;
    if (fullHeight != null && fullHeight !== "") style.height = fullHeight;
    else if (height != null && !uiHasResponsiveOverride(props, "height")) style.height = height;
    if (minHeight != null && !uiHasResponsiveOverride(props, "minHeight")) style.minHeight = minHeight;
    if (maxHeight != null && !uiHasResponsiveOverride(props, "maxHeight")) style.maxHeight = maxHeight;
    if (direction != null && !uiHasResponsiveOverride(props, "direction")) style.flexDirection = direction;
    if (contentAlign != null && !uiHasResponsiveOverride(props, "contentAlign")) style.alignItems = contentAlign;
    else if (centerContent != null && centerContent !== "") style.alignItems = centerContent ? "center" : "";
    if (contentJustify != null && !uiHasResponsiveOverride(props, "contentJustify")) style.justifyContent = contentJustify;
    else if (centerContent != null && centerContent !== "") style.justifyContent = centerContent ? "center" : "";
    if (scroll != null && scroll !== "") style.overflow = scroll;
    if (Object.keys(style).length) p.style = style;
    CMSwift.uiApplyResponsiveProps(p, props, uiResponsiveGridColStyleRules);

    const userOnClick = props.onClick;
    const userOnKeydown = props.onKeydown;
    const isInteractive = !!(uiUnwrap(props.clickable) || uiUnwrap(props.to));
    const onClick = (e) => {
      userOnClick?.(e);
      if (e.defaultPrevented) return;
      const to = uiUnwrap(props.to);
      if (to && CMSwift.router?.navigate) {
        e.preventDefault();
        CMSwift.router.navigate(to);
      }
    };
    const onKeydown = (e) => {
      userOnKeydown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    };
    if (isInteractive) {
      p.onClick = onClick;
      p.onKeydown = onKeydown;
      if (p.tabIndex == null) p.tabIndex = 0;
      if (p.role == null) p.role = "button";
    }

    if (!hasStructuredContent) {
      const el = _.div(p, ...renderSlotToArray(slots, "default", ctx, children));
      setPropertyProps(el, props);
      return el;
    }

    const sectionStyle = {
      display: "flex",
      flexDirection: "column",
      gap: "inherit",
      minWidth: 0
    };
    const parts = [
      startNodes.length
        ? _.div({
          class: uiClass(["cms-grid-col-start", props.startClass, props.topClass, props.headerClass]),
          style: { ...sectionStyle }
        }, ...startNodes)
        : null,
      bodyNodes.length
        ? _.div({
          class: uiClass(["cms-grid-col-body", props.bodyClass, props.contentClass]),
          style: { ...sectionStyle, flex: "1 1 auto" }
        }, ...bodyNodes)
        : null,
      endNodes.length
        ? _.div({
          class: uiClass(["cms-grid-col-end", props.endClass, props.bottomClass, props.footerClass]),
          style: { ...sectionStyle }
        }, ...endNodes)
        : null
    ].filter(Boolean);

    const el = _.div(p, ...parts);
    setPropertyProps(el, props);
    return el;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.GridCol = {
      signature: "UI.GridCol(...children) | UI.GridCol(props, ...children)",
      props: {
        span: "number|string",
        col: "alias di span",
        sm: "number|string",
        md: "number|string",
        lg: "number|string",
        auto: "boolean",
        row: "number|string",
        rowSpan: "number|string",
        area: "string",
        align: "string (align-self)",
        justify: "string (justify-self)",
        place: "string (place-self)",
        gap: "string|number",
        rowGap: "string|number",
        columnGap: "string|number",
        padding: "string|number",
        width: "string|number",
        height: "string|number",
        minHeight: "string|number",
        maxHeight: "string|number",
        fullHeight: "boolean",
        stack: "boolean",
        inline: "boolean",
        direction: "column|row|string",
        contentAlign: "string",
        contentJustify: "string",
        center: "boolean",
        scroll: "boolean|string",
        panel: "boolean",
        clickable: "boolean",
        to: "string",
        mobile: "{ span?, col?, gap?, direction?, contentAlign?, contentJustify? }",
        tablet: "{ span?, col?, gap?, direction?, contentAlign?, contentJustify? }",
        pc: "{ span?, col?, gap?, direction?, contentAlign?, contentJustify? }",
        start: "Node|Function|Array",
        body: "Node|Function|Array",
        end: "Node|Function|Array",
        color: "string",
        outline: "boolean",
        shadow: "boolean|string",
        radius: "number|string",
        slots: "{ start?, body?, end?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        start: "Top/header region",
        body: "Main body region",
        end: "Bottom/footer region",
        default: "Fallback content"
      },
      events: {
        onClick: "MouseEvent",
        onKeydown: "KeyboardEvent"
      },
      returns: "HTMLDivElement",
      description: "CSS Grid item with responsive spans, optional internal stack layout, start/body/end regions, and lightweight visual variants."
    };
  }
  // Esempio: CMSwift.ui.GridCol({ span: 6, sm: 12 }, "Colonna")
  UI.Icon = (...args) => {
    let props = {};
    let children = [];
    let name = "home";
    let hasName = false;
    const a = args[0];
    const b = args[1];
    const isPlainObject = (v) => v && typeof v === "object" && !v.nodeType && !Array.isArray(v) && !(v instanceof Function);

    if (typeof a === "string") {
      name = a;
      hasName = true;
      if (isPlainObject(b)) {
        props = b;
        if (args.length > 2) children = args.slice(2);
      } else if (args.length > 1) {
        children = args.slice(1);
      }
    } else if (isPlainObject(a)) {
      props = a;
      if (a.name != null) {
        name = a.name;
        hasName = true;
      }
      if (args.length > 1) children = args.slice(1);
    } else if (args.length) {
      children = args;
    }

    if (!hasName && children.length) {
      name = children.length === 1 ? children[0] : children;
    }
    applyCommonProps(props);

    const slots = props.slots || {};

    const size = uiUnwrap(props.size);
    const color = uiUnwrap(props.color);
    const isFill = String(name).endsWith("-fill");
    const style = { ...(props.style || {}) };
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? v : "";
    });

    const hasVisualSurface = !!(props.color || props.clickable || props.border || props.glossy || props.glow || props.glass || props.shadow || props.outline || props.gradient || props.textGradient || props.lightShadow || props.radius);
    const builtInSpriteIcons = {
      "chevron-down": {
        viewBox: "0 0 24 24",
        paths: [{ d: "M6 9l6 6l6 -6", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }]
      }
    };
    const createBuiltInSpriteIcon = (id) => {
      const def = builtInSpriteIcons[id];
      if (!def) return null;
      return _.svg(
        { width: "100%", height: "100%", viewBox: def.viewBox, fill: "none", "aria-hidden": "true", focusable: "false" },
        ...def.paths.map((path) => _.path(path))
      );
    };
    const wrapIcon = (icon) => {
      const tooltip = uiUnwrap(props.tooltip);
      if (tooltip == null || tooltip === false || !UI.Tooltip) return icon;
      const tooltipProps = isPlainObject(tooltip)
        ? { ...tooltip }
        : { text: tooltip };
      if (isPlainObject(props.tooltipProps)) Object.assign(tooltipProps, props.tooltipProps);
      return UI.Tooltip({ ...tooltipProps, target: icon });
    };

    const cls = uiClass([
      "cms-icon",
      "material-icons",
      ...(hasVisualSurface ? ["cms-clear-set", "cms-singularity"] : []),
      sizeClass,
      props.class
    ]);
    const p = CMSwift.omit(props, ["name", "size", "class", "style", "label", "border", "color", "icon", "iconRight", "removable", "onRemove", "dense", "flat", "glossy", "outline", "slots", "spriteUrl", "tooltip", "tooltipProps"]);
    p.class = cls;
    if (Object.keys(style).length) p.style = style;

    if (typeof name === "function" || (name && typeof name === "object")) {
      const customNode = CMSwift.ui.renderSlot(slots, "default", {}, name);
      const content = renderSlotToArray(null, "default", {}, customNode);
      const icon = _.span({ ...p, "data-icon": "custom" }, ...content);
      setPropertyProps(icon, props);
      return wrapIcon(icon);
    }

    const nameStr = String(name);
    const useHref = nameStr.includes("#") ? nameStr : "";
    let icon = null;
    if (useHref) {
      const spriteUrl =
        props.spriteUrl ||
        CMSwift.config?.iconSpriteUrl ||
        (typeof globalThis !== "undefined" ? globalThis.CMSwift_setting?.iconSpriteUrl : null);
      const symbolId = useHref.slice(useHref.indexOf("#") + 1);
      const svg = spriteUrl
        ? _.svg(
          { width: "100%", height: "100%" },
          _.use({ href: spriteUrl + useHref })
        )
        : createBuiltInSpriteIcon(symbolId) || _.svg(
          { width: "100%", height: "100%" },
          _.use({ href: useHref })
        );
      if (isFill) svg.style.fill = "currentColor";
      icon = _.span({ ...p, "data-icon": nameStr }, svg, ...children);
    } else {
      icon = _.span({ ...p, "data-icon": nameStr }, nameStr, ...children);
    }

    if (size != null) {
      let v = size;
      if (CMSwift.uiSizes.includes(size)) {
        v = `var(--cms-icon-size-${size})`;
      }
      v = typeof v === "number" ? v + "px" : String(v);
      icon.style.setProperty("--set-icon-size", v);
    }

    setPropertyProps(icon, props);
    return wrapIcon(icon);
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Icon = {
      signature: "UI.Icon(name) | UI.Icon(props) | UI.Icon(props, ...children)",
      props: {
        name: "string|Node|Function",
        size: "number|string",
        color: "string",
        shadow: "boolean|string",
        lightShadow: "boolean",
        clickable: "boolean",
        border: "boolean",
        glossy: "boolean",
        glow: "boolean",
        glass: "boolean",
        gradient: "boolean|number",
        outline: "boolean",
        textGradient: "boolean",
        radius: "number|string",
        spriteUrl: "string",
        tooltip: "String|Node|Function|Object",
        tooltipProps: "object",
        slots: "{ default? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Custom icon content"
      },
      returns: "HTMLSpanElement",
      description: "Sprite- or text-based icon with configurable size/color."
    };
  }
  // Esempio: CMSwift.ui.Icon({ name: "home", size: 18 })

  UI.Badge = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? `cms-size-${v}` : "";
    });
    const cls = uiClass([
      "cms-clear-set",
      "cms-badge",
      "cms-singularity",
      sizeClass,
      uiWhen(props.outline, "outline"),
      props.class
    ]);
    const p = CMSwift.omit(props, [
      "label",
      "color",
      "outline",
      "size",
      "slots",
      "notification",
      "iconSize",
      "topLeft",
      "topRight",
      "bottomLeft",
      "bottomRight",
      "left",
      "right"
    ]);
    p.class = cls;

    const style = {
      ...(props.style || {})
    };
    if (props.size) {
      const size = uiUnwrap(props.size);
      if (!(typeof size === "string" && sizeMap[size])) {
        style.fontSize = toCssSize(props.size);
      }
    }
    p.style = style;

    const renderNamedSlotToArray = (names, ctx, fallback) => {
      const list = Array.isArray(names) ? names : [names];
      for (const name of list) {
        if (CMSwift.ui.getSlot(slots, name) != null) {
          return renderSlotToArray(slots, name, ctx, fallback);
        }
      }
      return fallback == null || fallback === false || fallback === ""
        ? []
        : renderSlotToArray(null, "default", ctx, fallback);
    };

    const resolveIconSize = () => {
      const raw = uiUnwrap(props.iconSize ?? props.size);
      if (typeof raw === "number") return Math.max(10, Math.round(raw * 0.85));
      if (typeof raw === "string") {
        const map = {
          xxs: 10,
          xs: 11,
          sm: 12,
          md: 13,
          lg: 14,
          xl: 16,
          xxl: 18,
          xxxl: 20
        };
        return map[raw] || 14;
      }
      return 14;
    };

    const resolveIconFallback = (source, as) => {
      const raw = uiUnwrap(source);
      if (raw == null || raw === false || raw === "") return null;
      if (typeof raw === "string") return UI.Icon({ name: raw, size: resolveIconSize() });
      return CMSwift.ui.slot(raw, { as });
    };

    const renderIconAnchor = (slotNames, propKey, position) => _.dynamic(() => {
      const iconFallback = resolveIconFallback(props[propKey], position);
      const nodes = renderNamedSlotToArray(slotNames, { position }, iconFallback);
      if (!nodes.length) return null;
      return _.span({
        class: `cms-badge-anchor cms-badge-anchor-${position}`,
        "data-badge-slot": position
      }, ...nodes);
    });

    const content = _.dynamic(() => {
      const labelFallback = uiUnwrap(props.label);
      let labelNodes = renderNamedSlotToArray(["label"], {}, labelFallback);
      if (!labelNodes.length) labelNodes = renderNamedSlotToArray(["default"], {}, children);
      return _.span(
        { class: "cms-badge-content" },
        _.span({ class: "cms-badge-label" }, ...(labelNodes.length ? labelNodes : [""]))
      );
    });

    const notification = _.dynamic(() => {
      const rawNotification = uiUnwrap(props.notification);
      const fallback = rawNotification == null || rawNotification === false || rawNotification === ""
        ? null
        : rawNotification;
      const nodes = renderNamedSlotToArray(["notification"], { notification: rawNotification }, fallback);
      if (!nodes.length) return null;
      return _.span({
        class: "cms-badge-notification",
        "data-badge-slot": "notification",
        "aria-label": typeof rawNotification === "number" ? `${rawNotification} notifications` : null
      }, ...nodes);
    });

    const wrap = _.span(
      renderIconAnchor(["left"], "left", "left"),
      renderIconAnchor(["centerLeft", "center-left"], "centerLeft", "center-left"),
      p,
      content,
      renderIconAnchor(["topLeft", "top-left"], "topLeft", "top-left"),
      renderIconAnchor(["topRight", "top-right"], "topRight", "top-right"),
      renderIconAnchor(["bottomLeft", "bottom-left"], "bottomLeft", "bottom-left"),
      renderIconAnchor(["bottomRight", "bottom-right"], "bottomRight", "bottom-right"),
      renderIconAnchor(["centerRight", "center-right"], "centerRight", "center-right"),
      renderIconAnchor(["right"], "right", "right"),
      notification
    );
    // se esiste un props con left o right
    if (props.topLeft || props.centerLeft || props.bottomLeft) {
      wrap.style.setProperty("padding-left", "15px");
    }
    if (props.topRight || props.centerRight || props.bottomRight) {
      wrap.style.setProperty("padding-right", "15px");
    }

    setPropertyProps(wrap, props);
    return wrap;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Badge = {
      signature: "UI.Badge(...children) | UI.Badge(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        color: "string",
        size: "string|number",
        outline: "boolean",
        notification: "string|number|Node|Function|[get,set] signal",
        iconSize: "string|number",
        topLeft: "String|Node|Function|Array",
        topRight: "String|Node|Function|Array",
        bottomLeft: "String|Node|Function|Array",
        bottomRight: "String|Node|Function|Array",
        centerLeft: "String|Node|Function|Array",
        centerRight: "String|Node|Function|Array",
        left: "String|Node|Function|Array",
        right: "String|Node|Function|Array",
        slots: "{ label?, default?, notification?, topLeft?, topRight?, bottomLeft?, bottomRight?, left?, right? }",
        class: "string",
        style: "object"
      },
      slots: {
        label: "Badge label content",
        default: "Fallback content",
        notification: "Notification badge content",
        topLeft: "Icon anchored top-left",
        topRight: "Icon anchored top-right",
        bottomLeft: "Icon anchored bottom-left",
        bottomRight: "Icon anchored bottom-right",
        centerLeft: "Icon anchored center-left",
        centerRight: "Icon anchored center-right",
        left: "Icon anchored left",
        right: "Icon anchored right"
      },
      returns: "HTMLSpanElement",
      description: "Inline badge with reactive notification and 6 positionable icon slots."
    };
  }
  // Esempio: CMSwift.ui.Badge({ label: "New" })

  const avatarGetInitials = (value) => {
    if (value == null || value === false) return "";
    const text = String(value)
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";
    const words = text.split(" ").filter(Boolean);
    if (!words.length) return "";
    if (words.length === 1) {
      const token = words[0].replace(/[^a-z0-9]/gi, "");
      return token.slice(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  };

  const avatarStatusState = (value, fallback) => {
    const raw = value == null || value === true ? fallback : value;
    if (raw == null || raw === false) return normalizeState(fallback);
    const token = String(raw).toLowerCase();
    if (token === "online" || token === "available" || token === "active") return "success";
    if (token === "away" || token === "pending") return "warning";
    if (token === "busy" || token === "dnd" || token === "blocked") return "danger";
    if (token === "offline" || token === "idle") return "secondary";
    return normalizeState(token) || normalizeState(fallback);
  };

  const avatarPrimitiveBadge = (value, className = "cms-avatar-badge") => {
    if (value == null || value === false) return null;
    if (value instanceof Node || Array.isArray(value)) return value;
    if (typeof value === "function") return value;
    if (value === true) return _.span({ class: className });
    return _.span({ class: className }, String(value));
  };

  const avatarPrimitiveStatus = (value, color) => {
    if (value == null || value === false) {
      if (!color) return null;
      const fallbackState = avatarStatusState(null, color);
      return _.span({ class: uiClass(["cms-avatar-status", fallbackState ? `cms-state-${fallbackState}` : ""]) });
    }
    if (value instanceof Node || Array.isArray(value)) return value;
    if (typeof value === "function") return value;
    const state = avatarStatusState(value, color);
    if (value === true || state) {
      return _.span({ class: uiClass(["cms-avatar-status", state ? `cms-state-${state}` : ""]) });
    }
    return avatarPrimitiveBadge(value, "cms-avatar-badge");
  };

  const avatarRenderAnchor = (className, nodes) => {
    if (!nodes || !nodes.length) return null;
    return _.span({ class: uiClass(["cms-avatar-anchor", className]) }, ...nodes);
  };

  UI.Avatar = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && CMSwift.uiSizes?.includes(v)) ? `cms-size-${v}` : "";
    });
    const stateClass = uiComputed([props.color, props.state], () => {
      const v = uiUnwrap(props.color) || uiUnwrap(props.state) || "";
      const state = normalizeState(v);
      return state ? `cms-state-${state}` : "";
    });
    const cls = uiClass([
      "cms-clear-set",
      "cms-avatar",
      "cms-singularity",
      sizeClass,
      stateClass,
      uiWhen(props.square, "cms-avatar-square"),
      uiWhen(props.elevated, "elevated"),
      props.class
    ]);

    const p = CMSwift.omit(props, [
      "src", "srcset", "srcSet", "sizes", "alt", "label", "name", "initials", "text",
      "size", "fontSize", "textSize", "radius", "rounded", "square", "elevated",
      "icon", "iconSize", "media", "fit", "badge", "notification", "status",
      "statusColor", "presence", "topLeft", "topRight", "bottomLeft", "bottomRight",
      "slots"
    ]);
    p.class = cls;

    const style = { ...(props.style || {}) };
    const sizeStyle = uiStyleValue(props.size, (value) => {
      if (typeof value === "string" && CMSwift.uiSizes?.includes(value)) return "";
      return toCssSize(value);
    }, "");
    if (sizeStyle != null) {
      style.width = sizeStyle;
      style.height = sizeStyle;
    }

    const fontSizeValue = props.fontSize ?? props.textSize;
    const fontSizeStyle = fontSizeValue != null
      ? uiStyleValue(fontSizeValue, toCssSize)
      : uiStyleValue(props.size, (value) => {
        if (typeof value === "string" && CMSwift.uiSizes?.includes(value)) return "";
        return `clamp(11px, calc(${toCssSize(value)} * 0.34), 28px)`;
      }, "");
    if (fontSizeStyle != null) style.fontSize = fontSizeStyle;

    const radiusStyle = uiStyleValue(props.radius, (value) => {
      const normalized = normalizeRadius(value);
      if (normalized === "xxxl") return "999px";
      if (normalized) return `var(--cms-r-${normalized})`;
      if (typeof value === "number") return `${value}px`;
      return String(value);
    });
    if (radiusStyle != null) style["--set-border-radius"] = radiusStyle;
    p.style = style;

    const ctx = { props };
    const altText = uiComputed([props.alt, props.label, props.name, props.text], () => {
      const raw = uiUnwrap(props.alt) || uiUnwrap(props.label) || uiUnwrap(props.name) || uiUnwrap(props.text) || "avatar";
      return String(raw);
    });
    const iconFallback = props.icon != null
      ? (typeof props.icon === "string"
        ? UI.Icon({ name: props.icon, size: props.iconSize || props.size || "sm" })
        : CMSwift.ui.slot(props.icon, { as: "icon" }))
      : null;
    const labelFallback = uiComputed([props.initials, props.text, props.label, props.name], () => {
      const explicit = uiUnwrap(props.initials) ?? uiUnwrap(props.text);
      if (explicit != null) return explicit;
      const rawLabel = uiUnwrap(props.label) ?? uiUnwrap(props.name);
      if (typeof rawLabel === "string") return avatarGetInitials(rawLabel);
      return rawLabel;
    });
    const badgeFallback = avatarPrimitiveBadge(uiUnwrap(props.badge ?? props.notification));
    const statusFallback = avatarPrimitiveStatus(
      uiUnwrap(props.status ?? props.presence),
      uiUnwrap(props.statusColor)
    );

    let mediaNodes = renderSlotToArray(slots, "media", ctx, props.media);
    if (!mediaNodes.length && props.src) {
      const imgProps = {
        class: "cms-avatar-img",
        src: props.src,
        alt: altText,
        sizes: props.sizes,
        style: {}
      };
      if (props.srcset != null) imgProps.srcset = props.srcset;
      if (props.srcSet != null) imgProps.srcset = props.srcSet;
      const fitStyle = uiStyleValue(props.fit);
      if (fitStyle != null) imgProps.style.objectFit = fitStyle;
      mediaNodes = [_.img(imgProps)];
    }

    const defaultNodes = renderSlotToArray(slots, "default", ctx, children);
    const fallbackNodes = renderSlotToArray(slots, "fallback", ctx, null);
    const labelNodes = renderSlotToArray(slots, "label", ctx, labelFallback);
    const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
    const mainNodes = mediaNodes.length
      ? mediaNodes
      : (defaultNodes.length
        ? defaultNodes
        : (fallbackNodes.length
          ? fallbackNodes
          : (labelNodes.length
            ? labelNodes
            : (iconNodes.length ? iconNodes : ["?"]))));

    const bodyClass = mediaNodes.length ? "cms-avatar-media" : "cms-avatar-fallback";
    const body = _.span({ class: "cms-avatar-body" },
      _.span({ class: bodyClass }, ...mainNodes)
    );

    let topLeftNodes = renderSlotToArray(slots, "topLeft", ctx, props.topLeft);
    let topRightNodes = renderSlotToArray(slots, "topRight", ctx, props.topRight);
    let bottomLeftNodes = renderSlotToArray(slots, "bottomLeft", ctx, props.bottomLeft);
    let bottomRightNodes = renderSlotToArray(slots, "bottomRight", ctx, props.bottomRight);
    const badgeNodes = renderSlotToArray(slots, "badge", ctx, badgeFallback);
    const statusNodes = renderSlotToArray(slots, "status", ctx, statusFallback);

    if (!topRightNodes.length && badgeNodes.length) topRightNodes = badgeNodes;
    if (!bottomRightNodes.length && statusNodes.length) bottomRightNodes = statusNodes;

    const wrap = _.div(
      p,
      body,
      avatarRenderAnchor("cms-avatar-anchor-top-left", topLeftNodes),
      avatarRenderAnchor("cms-avatar-anchor-top-right", topRightNodes),
      avatarRenderAnchor("cms-avatar-anchor-bottom-left", bottomLeftNodes),
      avatarRenderAnchor("cms-avatar-anchor-bottom-right", bottomRightNodes)
    );
    setPropertyProps(wrap, props);
    return wrap;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Avatar = {
      signature: "UI.Avatar(...children) | UI.Avatar(props, ...children)",
      props: {
        src: "string",
        srcset: "string",
        sizes: "string",
        alt: "string",
        label: "String|Node|Function|Array",
        name: "string",
        initials: "string|Node|Function|Array",
        text: "string|Node|Function|Array",
        size: "number|string",
        fontSize: "number|string",
        radius: "number|string",
        square: "boolean",
        elevated: "boolean",
        color: "string",
        state: "string",
        icon: "string|Node|Function|Array",
        iconSize: "number|string",
        media: "Node|Function|Array",
        fit: "cover|contain|fill|scale-down|none",
        badge: "string|number|Node|Function|Array",
        notification: "string|number|Node|Function|Array",
        status: "boolean|string|number|Node|Function|Array",
        statusColor: "success|warning|danger|info|primary|secondary|dark|light|string",
        topLeft: "Node|Function|Array",
        topRight: "Node|Function|Array",
        bottomLeft: "Node|Function|Array",
        bottomRight: "Node|Function|Array",
        slots: "{ media?, default?, fallback?, label?, icon?, badge?, status?, topLeft?, topRight?, bottomLeft?, bottomRight? }",
        mobile: "{ width?, height?, minWidth?, maxWidth?, padding?, margin?, radius? }",
        tablet: "{ width?, height?, minWidth?, maxWidth?, padding?, margin?, radius? }",
        pc: "{ width?, height?, minWidth?, maxWidth?, padding?, margin?, radius? }",
        class: "string",
        style: "object"
      },
      slots: {
        media: "Custom main media",
        default: "Custom main content instead of image or fallback",
        fallback: "Fallback custom quando non c'e immagine",
        label: "Fallback testuale / initials",
        icon: "Fallback icon",
        badge: "Badge overlay, di default top-right",
        status: "Presence dot or overlay content, bottom-right by default",
        topLeft: "Top-left overlay content",
        topRight: "Top-right overlay content",
        bottomLeft: "Bottom-left overlay content",
        bottomRight: "Bottom-right overlay content"
      },
      returns: "HTMLDivElement",
      description: "Flexible avatar with image, smart fallbacks, states, badge, and overlay slots."
    };
  }
  // Esempio: CMSwift.ui.Avatar({ label: "CM" })

  UI.Chip = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? v : "";
    });
    const cls = uiClass([
      "cms-clear-set",
      "cms-chip",
      "cms-singularity",
      sizeClass,
      props.class
    ]);
    const p = CMSwift.omit(props, ["label", "border", "color", "icon", "iconRight", "removable", "onRemove", "dense", "flat", "glossy", "outline", "slots"]);
    p.class = cls;
    p.style = {
      ...(props.style || {})
    };

    const iconFallback = props.icon
      ? (typeof props.icon === "string" ? UI.Icon({ name: props.icon, size: props?.size ?? null }) : CMSwift.ui.slot(props.icon, { as: "icon" }))
      : null;
    const iconRightFallback = props.iconRight
      ? (typeof props.iconRight === "string" ? UI.Icon({ name: props.iconRight, size: props?.size ?? null }) : CMSwift.ui.slot(props.iconRight, { as: "iconRight" }))
      : null;
    const iconNode = CMSwift.ui.renderSlot(slots, "icon", {}, iconFallback);
    const iconRightNode = CMSwift.ui.renderSlot(slots, "iconRight", {}, iconRightFallback);
    const labelNodes = renderSlotToArray(slots, "label", {}, props.label);
    const labelNode = labelNodes.length ? labelNodes : renderSlotToArray(slots, "default", {}, children);

    const iconNodes = renderSlotToArray(null, "default", {}, iconNode);
    const iconRightNodes = renderSlotToArray(null, "default", {}, iconRightNode);
    const wrap = _.span(p, ...iconNodes, ...(labelNode.length ? labelNode : [""]), ...iconRightNodes);
    if (props.removable) {
      const btn = UI.Btn({ class: "cms-chip-remove", onClick: props.onRemove, size: props?.size ?? null }, UI.Icon({ size: props?.size ?? null, name: "close" }));
      wrap.appendChild(btn);
      btn.onclick = () => {
        if (props.onRemove) {
          props.onRemove();
        }
        wrap.remove();
      }
    }
    setPropertyProps(wrap, props);
    return wrap;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Chip = {
      signature: "UI.Chip(...children) | UI.Chip(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        removable: "boolean",
        onRemove: "function",
        dense: "boolean",
        outline: "boolean|string|number",
        slots: "{ icon?, label?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        icon: "Chip icon content",
        iconRight: "Chip right icon content",
        label: "Chip label content",
        default: "Fallback content"
      },
      events: {
        onRemove: "MouseEvent"
      },
      returns: "HTMLSpanElement",
      description: "Chip with optional icon and removal."
    };
  }
  // Esempio: CMSwift.ui.Chip({ label: "Tag", removable: true })

  UI.Stat = (...args) => {
    const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.state) || uiUnwrap(rawProps.color) || "");
    const stateClass = uiComputed([rawProps.state, rawProps.color], () => {
      const state = resolveStateValue();
      return state ? `cms-state-${state}` : "";
    });
    const trendClass = uiComputed(rawProps.trend, () => {
      const raw = String(uiUnwrap(rawProps.trend) || "").toLowerCase();
      if (["up", "positive", "success", "gain", "increase"].includes(raw)) return "is-positive";
      if (["down", "negative", "danger", "loss", "decrease"].includes(raw)) return "is-negative";
      if (["flat", "neutral", "steady", "stable"].includes(raw)) return "is-neutral";
      return "";
    });

    const props = { ...rawProps };
    const p = CMSwift.omit(props, [
      "actions",
      "aside",
      "delta",
      "eyebrow",
      "footer",
      "icon",
      "iconSize",
      "label",
      "meta",
      "note",
      "slots",
      "state",
      "subtitle",
      "title",
      "trend",
      "value"
    ]);
    p.class = uiClass([
      "cms-clear-set",
      "cms-stat",
      "cms-singularity",
      stateClass,
      trendClass,
      props.class
    ]);
    p.style = { ...(props.style || {}) };

    const renderNamed = (slotName, fallback, ctx = {}) => renderSlotToArray(
      slots,
      slotName,
      ctx,
      fallback
    );

    const iconFallback = rawProps.icon == null
      ? null
      : (typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || "md" })
        : CMSwift.ui.slot(rawProps.icon, { as: "icon" }));

    const eyebrowNodes = renderNamed("eyebrow", rawProps.eyebrow);
    const labelNodes = renderNamed("label", rawProps.label ?? rawProps.title);
    const valueNodes = renderNamed("value", rawProps.value);
    const noteNodes = renderNamed("note", rawProps.note ?? rawProps.subtitle);
    const metaNodes = renderNamed("meta", rawProps.meta);
    const deltaNodes = renderNamed("delta", rawProps.delta, { trend: rawProps.trend });
    const iconNodes = renderNamed("icon", iconFallback);
    const asideNodes = renderNamed("aside", rawProps.aside);
    const footerNodes = renderNamed("footer", rawProps.footer);
    const actionsNodes = renderNamed("actions", rawProps.actions);
    const bodyNodes = renderNamed("default", children);

    const stat = _.article(
      p,
      _.div(
        { class: "cms-stat-head" },
        _.div(
          { class: "cms-stat-lead" },
          iconNodes.length ? _.div({ class: "cms-stat-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-stat-copy" },
            eyebrowNodes.length ? _.div({ class: "cms-stat-eyebrow" }, ...eyebrowNodes) : null,
            labelNodes.length ? _.div({ class: "cms-stat-label" }, ...labelNodes) : null
          )
        ),
        asideNodes.length ? _.div({ class: "cms-stat-aside" }, ...asideNodes) : null
      ),
      _.div(
        { class: "cms-stat-body" },
        valueNodes.length ? _.div({ class: "cms-stat-value" }, ...valueNodes) : null,
        deltaNodes.length
          ? _.div({ class: "cms-stat-delta" }, ...deltaNodes)
          : null,
        noteNodes.length ? _.div({ class: "cms-stat-note" }, ...noteNodes) : null,
        metaNodes.length ? _.div({ class: "cms-stat-meta" }, ...metaNodes) : null,
        bodyNodes.length ? _.div({ class: "cms-stat-extra" }, ...bodyNodes) : null
      ),
      (footerNodes.length || actionsNodes.length)
        ? _.div(
          { class: "cms-stat-footer" },
          footerNodes.length ? _.div({ class: "cms-stat-footer-copy" }, ...footerNodes) : null,
          actionsNodes.length ? _.div({ class: "cms-stat-actions" }, ...actionsNodes) : null
        )
        : null
    );

    setPropertyProps(stat, rawProps);
    return stat;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Stat = {
      signature: "UI.Stat(...children) | UI.Stat(props, ...children)",
      props: {
        eyebrow: "String|Node|Function|Array",
        label: "String|Node|Function|Array",
        title: "Alias of label",
        value: "String|Number|Node|Function|Array",
        delta: "String|Node|Function|Array",
        trend: "up|down|flat|positive|negative|neutral",
        note: "String|Node|Function|Array",
        subtitle: "Alias of note",
        meta: "Node|Function|Array",
        icon: "String|Node|Function|Array",
        aside: "Node|Function|Array",
        footer: "Node|Function|Array",
        actions: "Node|Function|Array",
        state: "primary|secondary|success|warning|danger|info|light|dark",
        slots: "{ eyebrow?, label?, value?, delta?, note?, meta?, icon?, aside?, footer?, actions?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        eyebrow: "Small kicker above the stat label",
        label: "Main stat label",
        value: "Primary metric value",
        delta: "Trend / delta content",
        note: "Supporting note",
        meta: "Extra meta badges or info",
        icon: "Leading icon or avatar",
        aside: "Right-side support content",
        footer: "Footer/supporting bottom content",
        actions: "Footer actions cluster",
        default: "Extra body content"
      },
      returns: "HTMLElement",
      description: "Compact surface for single metrics, trends, and operational metadata."
    };
  }
  // Esempio: CMSwift.ui.Stat({ label: "Revenue", value: "€ 128k", delta: "+18%" })

  UI.Kpi = (...args) => {
    const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.state) || uiUnwrap(rawProps.color) || "");
    const stateClass = uiComputed([rawProps.state, rawProps.color], () => {
      const state = resolveStateValue();
      return state ? `cms-state-${state}` : "";
    });

    const props = { ...rawProps };
    const p = CMSwift.omit(props, [
      "actions",
      "aside",
      "delta",
      "eyebrow",
      "footer",
      "icon",
      "iconSize",
      "label",
      "media",
      "meta",
      "note",
      "slots",
      "state",
      "subtitle",
      "title",
      "trend",
      "value"
    ]);
    p.class = uiClass([
      "cms-clear-set",
      "cms-kpi",
      "cms-singularity",
      stateClass,
      props.class
    ]);
    p.style = { ...(props.style || {}) };

    const renderNamed = (slotName, fallback, ctx = {}) => renderSlotToArray(
      slots,
      slotName,
      ctx,
      fallback
    );

    const iconFallback = rawProps.icon == null
      ? null
      : (typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || "lg" })
        : CMSwift.ui.slot(rawProps.icon, { as: "icon" }));

    const eyebrowNodes = renderNamed("eyebrow", rawProps.eyebrow);
    const titleNodes = renderNamed("title", rawProps.title ?? rawProps.label);
    const valueNodes = renderNamed("value", rawProps.value);
    const deltaNodes = renderNamed("delta", rawProps.delta, { trend: rawProps.trend });
    const noteNodes = renderNamed("note", rawProps.note ?? rawProps.subtitle);
    const metaNodes = renderNamed("meta", rawProps.meta);
    const iconNodes = renderNamed("icon", iconFallback);
    const asideNodes = renderNamed("aside", rawProps.aside);
    const mediaNodes = renderNamed("media", rawProps.media);
    const footerNodes = renderNamed("footer", rawProps.footer);
    const actionsNodes = renderNamed("actions", rawProps.actions);
    const bodyNodes = renderNamed("default", children);

    const kpi = _.section(
      p,
      _.div(
        { class: "cms-kpi-head" },
        _.div(
          { class: "cms-kpi-title-wrap" },
          iconNodes.length ? _.div({ class: "cms-kpi-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-kpi-copy" },
            eyebrowNodes.length ? _.div({ class: "cms-kpi-eyebrow" }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: "cms-kpi-title" }, ...titleNodes) : null
          )
        ),
        asideNodes.length ? _.div({ class: "cms-kpi-aside" }, ...asideNodes) : null
      ),
      _.div(
        { class: "cms-kpi-core" },
        _.div(
          { class: "cms-kpi-value-wrap" },
          valueNodes.length ? _.div({ class: "cms-kpi-value" }, ...valueNodes) : null,
          deltaNodes.length ? _.div({ class: "cms-kpi-delta" }, ...deltaNodes) : null
        ),
        noteNodes.length ? _.div({ class: "cms-kpi-note" }, ...noteNodes) : null,
        metaNodes.length ? _.div({ class: "cms-kpi-meta" }, ...metaNodes) : null,
        mediaNodes.length ? _.div({ class: "cms-kpi-media" }, ...mediaNodes) : null,
        bodyNodes.length ? _.div({ class: "cms-kpi-extra" }, ...bodyNodes) : null
      ),
      (footerNodes.length || actionsNodes.length)
        ? _.div(
          { class: "cms-kpi-footer" },
          footerNodes.length ? _.div({ class: "cms-kpi-footer-copy" }, ...footerNodes) : null,
          actionsNodes.length ? _.div({ class: "cms-kpi-actions" }, ...actionsNodes) : null
        )
        : null
    );

    setPropertyProps(kpi, rawProps);
    return kpi;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Kpi = {
      signature: "UI.Kpi(...children) | UI.Kpi(props, ...children)",
      props: {
        eyebrow: "String|Node|Function|Array",
        title: "String|Node|Function|Array",
        label: "Alias of title",
        value: "String|Number|Node|Function|Array",
        delta: "String|Node|Function|Array",
        trend: "up|down|flat|positive|negative|neutral",
        note: "String|Node|Function|Array",
        subtitle: "Alias of note",
        meta: "Node|Function|Array",
        media: "Node|Function|Array",
        icon: "String|Node|Function|Array",
        aside: "Node|Function|Array",
        footer: "Node|Function|Array",
        actions: "Node|Function|Array",
        state: "primary|secondary|success|warning|danger|info|light|dark",
        slots: "{ eyebrow?, title?, value?, delta?, note?, meta?, media?, icon?, aside?, footer?, actions?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        eyebrow: "Kicker content",
        title: "KPI title content",
        value: "Primary KPI value",
        delta: "Delta/trend content",
        note: "Supporting note",
        meta: "Extra meta badges or inline info",
        media: "Secondary data view or mini-visual content",
        icon: "Leading icon or avatar",
        aside: "Top-right support content",
        footer: "Bottom support content",
        actions: "Footer actions cluster",
        default: "Extra body content"
      },
      returns: "HTMLElement",
      description: "Richer surface for KPIs, headline metrics, and mini dashboard summaries."
    };
  }
  // Esempio: CMSwift.ui.Kpi({ title: "Orders", value: "342", delta: "+12%" })

  const overlayAnimDuration = (el, fallback = 180) => {
    const d = getComputedStyle(el).transitionDuration;
    if (!d) return fallback;
    const first = d.split(",")[0].trim();
    if (!first) return fallback;
    const ms = first.includes("ms") ? parseFloat(first) : parseFloat(first) * 1000;
    return Number.isFinite(ms) ? ms : fallback;
  };

  const overlayEnter = (entry) => {
    if (!entry?.overlay || !entry?.panel) return;
    entry.overlay.classList.add("enter");
    entry.panel.classList.add("enter");
    requestAnimationFrame(() => {
      if (!entry?.overlay || !entry?.panel) return;
      entry.overlay.classList.add("entered");
      entry.panel.classList.add("entered");
      entry.overlay.classList.remove("enter");
      entry.panel.classList.remove("enter");
    });
  };

  const overlayLeave = (entry, done) => {
    if (!entry?.overlay || !entry?.panel) {
      done?.();
      return;
    }
    if (entry._closing) return;
    entry._closing = true;
    entry.overlay.classList.add("leave");
    entry.panel.classList.add("leave");
    const finish = () => {
      if (entry._closed) return;
      entry._closed = true;
      done?.();
    };
    const onEnd = (e) => {
      if (e.target !== entry.panel) return;
      entry.panel.removeEventListener("transitionend", onEnd);
      finish();
    };
    entry.panel.addEventListener("transitionend", onEnd);
    const ms = overlayAnimDuration(entry.panel, 180);
    setTimeout(finish, ms + 40);
  };

  UI.List = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const ordered = !!uiUnwrap(props.number ?? props.ordered);
    const marker = uiUnwrap(props.marker);
    const itemSource = uiUnwrap(props.items);
    const items = Array.isArray(itemSource) ? itemSource : (itemSource == null ? [] : [itemSource]);

    const buildItemProps = (entryProps = {}) => {
      const baseProps = props.itemProps || {};
      const merged = { ...baseProps, ...entryProps };
      if (props.divider != null && merged.divider == null) merged.divider = props.divider;
      merged.class = uiClass([baseProps.class, props.itemClass, entryProps.class]);
      merged.style = {
        ...(baseProps.style || {}),
        ...(props.itemStyle || {}),
        ...(entryProps.style || {})
      };
      return merged;
    };

    const normalizeResolvedNode = (value) => {
      if (value == null || value === false) return [];
      if (isListItemNode(value)) return [value];
      if (isUIPlainObject(value)) {
        const itemChildren = value.children != null
          ? asNodeArray(value.children)
          : (value.content != null
            ? asNodeArray(value.content)
            : asNodeArray(value.node));
        return [UI.Item(buildItemProps(value), ...itemChildren)];
      }
      if (Array.isArray(value)) {
        return [UI.Item(buildItemProps(), ...value)];
      }
      if (value?.nodeType) {
        return [UI.Item(buildItemProps(), value)];
      }
      return [UI.Item(buildItemProps(), value)];
    };

    const normalizeItemNode = (value, index, total, useItemSlot = true) => {
      if (value == null || value === false) return [];
      if (useItemSlot) {
        const ctx = {
          item: value,
          index,
          count: total,
          first: index === 0,
          last: index === total - 1
        };
        const slotted = renderSlotToArray(slots, "item", ctx, null);
        if (slotted.length) {
          return slotted.flatMap((node) => normalizeResolvedNode(node));
        }
      }
      return normalizeResolvedNode(value);
    };

    const content = [];
    items.forEach((item, index) => {
      content.push(...normalizeItemNode(item, index, items.length));
    });

    const defaultNodes = renderSlotToArray(slots, "default", { items, count: items.length }, children);
    defaultNodes.forEach((node, index) => {
      content.push(...normalizeItemNode(node, items.length + index, items.length + defaultNodes.length, false));
    });

    if (!content.length) {
      const emptyNodes = renderSlotToArray(slots, "empty", { items, count: 0 }, props.empty);
      if (emptyNodes.length) {
        if (emptyNodes.length === 1 && isListItemNode(emptyNodes[0])) {
          content.push(emptyNodes[0]);
        } else {
          content.push(UI.Item({ class: "cms-item-empty", flat: true }, ...emptyNodes));
        }
      }
    }

    const cls = uiClass([
      "cms-list",
      uiWhen(props.dense, "dense"),
      uiWhen(props.divider, "divider"),
      uiWhen(marker === false || marker === "none", "cms-list-no-marker"),
      props.class
    ]);
    const p = CMSwift.omit(props, [
      "dense", "divider", "slots", "number", "ordered", "items", "itemClass", "itemStyle", "itemProps",
      "empty", "marker", "gap"
    ]);
    p.class = cls;
    p.style = {
      ...(props.style || {})
    };
    const gap = uiStyleValue(props.gap, toCssSize);
    if (gap != null) p.style["--cms-list-gap"] = gap;
    if (marker != null && marker !== false && marker !== true && marker !== "none") {
      p.style.listStyleType = String(marker);
    }

    const list = _[ordered ? "ol" : "ul"](p, ...content);
    return list;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.List = {
      signature: "UI.List(...children) | UI.List(props, ...children)",
      props: {
        items: "Array<Node|Object|string>",
        ordered: "boolean",
        number: "boolean",
        marker: "boolean|string",
        dense: "boolean",
        divider: "boolean",
        gap: "string|number",
        empty: "String|Node|Function|Array",
        itemClass: "string",
        itemStyle: "object",
        itemProps: "object",
        slots: "{ default?, item?, empty? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "List content fallback",
        item: "Render custom di ogni item ({ item, index, count, first, last })",
        empty: "Empty state content"
      },
      returns: "HTMLUListElement|HTMLOListElement",
      description: "Lista dichiarativa con supporto items, slot item, ordered/marker ed empty state."
    };
  }
  // Esempio: CMSwift.ui.List({}, CMSwift.ui.Item({}, "Item"))

  UI.Item = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    if (props.state != null && props.color == null) props.color = props.state;
    applyCommonProps(props);
    const slots = props.slots || {};
    const interactive = uiComputed([props.clickable, props.to], () => !!(uiUnwrap(props.clickable) || uiUnwrap(props.to)));
    const active = uiComputed([props.active, props.selected], () => !!(uiUnwrap(props.active) || uiUnwrap(props.selected)));
    const hasSurface = !!(
      props.color != null || props.outline || props.border || props.glossy || props.glow || props.glass ||
      props.shadow || props.gradient || props.textGradient || props.lightShadow || props.radius ||
      props.rounded || props.flat
    );

    const resolveIcon = (value, size, as) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return null;
      if (typeof raw === "string") return UI.Icon({ name: raw, size: size || "sm" });
      return CMSwift.ui.slot(raw, { as });
    };

    const iconNodes = renderSlotToArray(slots, "icon", {}, resolveIcon(props.icon, props.iconSize || props.size, "icon"));
    const titleNodes = renderSlotToArray(slots, "title", {}, props.title ?? props.label);
    const subtitleNodes = renderSlotToArray(slots, "subtitle", {}, props.subtitle ?? props.caption ?? props.description);
    const metaNodes = renderSlotToArray(slots, "meta", {}, props.meta ?? props.eyebrow);
    const bodyNodes = renderSlotToArray(slots, "body", {}, props.body ?? props.content);
    const defaultNodes = renderSlotToArray(slots, "default", {}, children);
    const actionsNodes = renderSlotToArray(slots, "actions", {}, props.actions ?? props.footer);
    const asideFallback = props.aside ?? props.trailing ?? resolveIcon(props.iconRight, props.iconSize || props.size, "iconRight");
    const asideNodes = renderSlotToArray(slots, "aside", {}, asideFallback);

    const mergedBodyNodes = [...bodyNodes, ...defaultNodes];
    const isInline = !(
      hasSurface || props.clickable || props.to || iconNodes.length || titleNodes.length ||
      subtitleNodes.length || metaNodes.length || actionsNodes.length || asideNodes.length ||
      bodyNodes.length
    );

    const cls = uiClass([
      "cms-item",
      uiWhen(props.divider, "divider"),
      uiWhen(hasSurface, "cms-clear-set"),
      uiWhen(hasSurface, "cms-singularity"),
      uiWhen(hasSurface, "cms-item-surface"),
      uiWhen(isInline, "cms-item-inline"),
      uiWhen(interactive, "cms-item-clickable"),
      uiWhen(active, "is-active"),
      uiWhen(props.disabled, "is-disabled"),
      props.class
    ]);
    const p = CMSwift.omit(props, [
      "divider", "slots", "label", "title", "subtitle", "caption", "description", "meta", "eyebrow",
      "body", "content", "children", "node", "icon", "iconRight", "iconSize", "aside", "trailing",
      "actions", "footer", "clickable", "to", "active", "selected", "disabled", "state",
      "color", "size", "outline", "flat", "border", "glossy", "glow", "glass", "gradient",
      "textGradient", "lightShadow", "shadow", "rounded", "radius", "textColor", "dense"
    ]);
    p.class = cls;
    p.style = {
      ...(props.style || {})
    };

    const userOnClick = props.onClick;
    const userOnKeydown = props.onKeydown;
    const onClick = (e) => {
      userOnClick?.(e);
      if (e.defaultPrevented || uiUnwrap(props.disabled)) return;
      const to = uiUnwrap(props.to);
      if (to && CMSwift.router?.navigate) {
        e.preventDefault();
        CMSwift.router.navigate(to);
      }
    };
    const onKeydown = (e) => {
      userOnKeydown?.(e);
      if (e.defaultPrevented || uiUnwrap(props.disabled)) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    };
    if (uiUnwrap(props.disabled)) {
      p["aria-disabled"] = "true";
    }
    if (uiUnwrap(props.clickable) || uiUnwrap(props.to)) {
      p.onClick = onClick;
      p.onKeydown = onKeydown;
      if (p.tabIndex == null) p.tabIndex = uiUnwrap(props.disabled) ? -1 : 0;
      if (p.role == null) p.role = "button";
    }

    const titleSection = titleNodes.length ? _.div({ class: "cms-item-title" }, ...titleNodes) : null;
    const subtitleSection = subtitleNodes.length ? _.div({ class: "cms-item-subtitle" }, ...subtitleNodes) : null;
    const metaSection = metaNodes.length ? _.div({ class: "cms-item-meta" }, ...metaNodes) : null;
    const bodySection = mergedBodyNodes.length
      ? _.div({ class: uiClass(["cms-item-body", uiWhen(!(titleNodes.length || subtitleNodes.length || metaNodes.length), "is-standalone")]) }, ...mergedBodyNodes)
      : null;
    const actionsSection = actionsNodes.length ? _.div({ class: "cms-item-actions" }, ...actionsNodes) : null;

    const item = _.li(
      p,
      _.div(
        { class: "cms-item-row" },
        iconNodes.length ? _.div({ class: "cms-item-icon" }, ...iconNodes) : null,
        _.div(
          { class: "cms-item-main" },
          metaSection,
          titleSection,
          subtitleSection,
          bodySection,
          actionsSection
        ),
        asideNodes.length ? _.div({ class: "cms-item-aside" }, ...asideNodes) : null
      )
    );
    setPropertyProps(item, props);
    return item;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Item = {
      signature: "UI.Item(...children) | UI.Item(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        title: "String|Node|Function|Array",
        subtitle: "String|Node|Function|Array",
        meta: "String|Node|Function|Array",
        body: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        aside: "Node|Function|Array",
        actions: "Node|Function|Array",
        clickable: "boolean",
        to: "string",
        active: "boolean",
        selected: "boolean",
        disabled: "boolean",
        color: "string",
        state: "Alias of color",
        size: "string|number",
        outline: "boolean",
        shadow: "boolean|string",
        lightShadow: "boolean",
        border: "boolean",
        glossy: "boolean",
        glow: "boolean",
        glass: "boolean",
        gradient: "boolean|number",
        textGradient: "boolean",
        radius: "string|number",
        divider: "boolean",
        slots: "{ icon?, title?, subtitle?, meta?, body?, aside?, actions?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        icon: "Leading visual/icon",
        title: "Main title content",
        subtitle: "Secondary text",
        meta: "Top meta content",
        body: "Body content",
        aside: "Trailing content",
        actions: "Actions row",
        default: "Fallback body content"
      },
      returns: "HTMLLIElement",
      description: "Structured item for simple lists, feeds, task lists, and clickable rows."
    };
  }
  // Esempio: CMSwift.ui.Item({}, "Elemento")

  UI.Separator = (...args) => {
    const { props } = CMSwift.uiNormalizeArgs(args);
    const cls = uiClass(["cms-separator", uiWhen(props.vertical, "vertical"), props.class]);
    const p = CMSwift.omit(props, ["vertical", "size", "slots"]);
    p.class = cls;
    const style = { borderColor: "var(--cms-border)", ...(props.style || {}) };
    const sizeValue = uiUnwrap(props.size);
    const vertical = uiUnwrap(props.vertical);
    if (sizeValue != null) {
      const size = toCssSize(sizeValue);
      if (vertical) style.width = size;
      else style.height = size;
    }
    p.style = style;
    return _.hr(p);
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Separator = {
      signature: "UI.Separator() | UI.Separator(props)",
      props: {
        vertical: "boolean",
        size: "string|number",
        slots: "{ default? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Unused (separator has no content)"
      },
      returns: "HTMLHRElement",
      description: "Separatore orizzontale o verticale."
    };
  }
  // Esempio: CMSwift.ui.Separator()

UI.Banner = (...args) => {
  const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};

  const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.type) || uiUnwrap(rawProps.state) || "");
  const ctx = {
    state: resolveStateValue,
    dismissible: () => !!uiUnwrap(rawProps.dismissible)
  };

  const typeClass = uiComputed([rawProps.type, rawProps.state], () => resolveStateValue());
  const variantClass = uiComputed(rawProps.variant, () => {
    const variant = String(uiUnwrap(rawProps.variant) || "").toLowerCase();
    return ["solid", "outline", "ghost"].includes(variant) ? `cms-banner-${variant}` : "";
  });
  const actionsPlacementClass = uiComputed([rawProps.actionsPlacement, rawProps.stack], () => {
    const placement = String(uiUnwrap(rawProps.actionsPlacement) || "").toLowerCase();
    return placement === "bottom" || !!uiUnwrap(rawProps.stack) ? "cms-banner-actions-bottom" : "";
  });
  const stackClass = uiComputed(rawProps.stack, () => uiUnwrap(rawProps.stack) ? "cms-banner-stack" : "");

  const props = { ...rawProps };
  const p = CMSwift.omit(props, [
    "actions", "actionsPlacement", "accent", "aside", "body", "closeLabel", "description",
    "dismiss", "dismissible", "icon", "iconSize", "message", "meta", "onDismiss", "slots",
    "stack", "state", "subtitle", "title", "type", "variant"
  ]);
  p.class = uiClass([
    "cms-clear-set",
    "cms-banner",
    "cms-singularity",
    typeClass,
    variantClass,
    actionsPlacementClass,
    stackClass,
    props.class
  ]);
  p.style = { ...(props.style || {}) };

  const toneToCss = (value) => {
    if (value == null || value === "") return "";
    const v = uiUnwrap(value);
    if (v == null || v === "") return "";
    const s = String(v);
    if (isTokenCSS(s)) return `var(--cms-${s})`;
    return s;
  };

  if (rawProps.accent != null || uiIsReactive(rawProps.accent)) {
    p.style["--cms-banner-accent"] = () => toneToCss(rawProps.accent);
    p.style["--cms-banner-border"] = () => {
      const tone = toneToCss(rawProps.accent);
      return tone ? `color-mix(in srgb, ${tone} 38%, var(--cms-border-color))` : "";
    };
    p.style["--cms-banner-bg"] = () => {
      const tone = toneToCss(rawProps.accent);
      return tone ? `color-mix(in srgb, ${tone} 14%, var(--cms-panel))` : "";
    };
    p.style["--cms-banner-color"] = () => {
      const tone = toneToCss(rawProps.accent);
      return tone ? `color-mix(in srgb, ${tone} 78%, white)` : "";
    };
  }

  const autoIconMap = {
    success: "check_circle",
    warning: "warning",
    danger: "error",
    info: "info",
    primary: "bolt",
    secondary: "campaign",
    dark: "shield",
    light: "notifications"
  };

  const iconFallback = (() => {
    if (rawProps.icon === false || rawProps.icon === null) return null;
    if (rawProps.icon != null) {
      return typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || rawProps.size || "md" })
        : CMSwift.ui.slot(rawProps.icon, { as: "icon" });
    }
    const state = resolveStateValue();
    const iconName = state ? autoIconMap[state] : null;
    return iconName ? UI.Icon({ name: iconName, size: rawProps.iconSize || rawProps.size || "md" }) : null;
  })();

  const titleNodes = renderSlotToArray(slots, "title", ctx, rawProps.title);
  const messageNodes = renderSlotToArray(slots, "message", ctx, rawProps.message != null ? rawProps.message : children);
  const descriptionNodes = renderSlotToArray(slots, "description", ctx, rawProps.description ?? rawProps.subtitle);
  const metaNodes = renderSlotToArray(slots, "meta", ctx, rawProps.meta);
  const bodyNodes = renderSlotToArray(
    slots,
    "default",
    ctx,
    rawProps.body != null ? [rawProps.body, ...(children || [])] : (rawProps.message != null ? children : null)
  );
  const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
  const asideNodes = renderSlotToArray(slots, "aside", ctx, rawProps.aside);
  const actionsNodes = renderSlotToArray(slots, "actions", ctx, rawProps.actions);
  const dismissNodes = renderSlotToArray(slots, "dismiss", ctx, rawProps.dismiss);

  const hasBottomActions = (() => {
    const placement = String(uiUnwrap(rawProps.actionsPlacement) || "").toLowerCase();
    return placement === "bottom" || !!uiUnwrap(rawProps.stack);
  })();
  const isDismissible = !!uiUnwrap(rawProps.dismissible) || !!rawProps.onDismiss;

  let bannerEl = null;
  const defaultDismissNode = isDismissible
    ? UI.Btn({
      class: "cms-banner-close",
      outline: true,
      size: rawProps.size || "sm",
      "aria-label": rawProps.closeLabel || "Chiudi banner",
      onClick: (e) => {
        rawProps.onDismiss?.(e);
        if (e.defaultPrevented) return;
        bannerEl?.remove();
      }
    }, UI.Icon({ name: "close", size: rawProps.size || "sm" }))
    : null;

  const sideNodes = [
    ...asideNodes,
    ...(!hasBottomActions ? actionsNodes : []),
    ...(dismissNodes.length ? dismissNodes : (defaultDismissNode ? [defaultDismissNode] : []))
  ];

  bannerEl = _.div(
    p,
    iconNodes.length ? _.div({ class: "cms-banner-icon" }, ...iconNodes) : null,
    _.div(
      { class: "cms-banner-body" },
      _.div(
        { class: "cms-banner-copy" },
        titleNodes.length ? _.div({ class: "cms-banner-title" }, ...titleNodes) : null,
        messageNodes.length ? _.div({ class: "cms-banner-message" }, ...messageNodes) : null,
        descriptionNodes.length ? _.div({ class: "cms-banner-description" }, ...descriptionNodes) : null,
        bodyNodes.length ? _.div({ class: "cms-banner-extra" }, ...bodyNodes) : null,
        metaNodes.length ? _.div({ class: "cms-banner-meta" }, ...metaNodes) : null
      ),
      hasBottomActions && actionsNodes.length
        ? _.div({ class: "cms-banner-actions" }, ...actionsNodes)
        : null
    ),
    sideNodes.length ? _.div({ class: "cms-banner-side" }, ...sideNodes) : null
  );

  const role = p.role || (() => {
    const state = resolveStateValue();
    return state === "danger" || state === "warning" ? "alert" : "status";
  })();
  bannerEl.setAttribute("role", role);
  setPropertyProps(bannerEl, rawProps);
  return bannerEl;
};
if (CMSwift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.Banner = {
    signature: "UI.Banner(...children) | UI.Banner(props, ...children)",
    props: {
      title: "String|Node|Function|Array",
      message: "String|Node|Function|Array",
      description: "String|Node|Function|Array",
      meta: "String|Node|Function|Array",
      icon: "String|Node|Function|Array|false",
      actions: "Node|Function|Array",
      aside: "Node|Function|Array",
      body: "Node|Function|Array",
      dismissible: "boolean",
      dismiss: "Node|Function|Array",
      onDismiss: "function",
      closeLabel: "string",
      type: "success|warning|danger|error|info|primary|secondary|light|dark",
      state: "success|warning|danger|error|info|primary|secondary|light|dark",
      accent: "string",
      variant: "soft|solid|outline|ghost",
      actionsPlacement: "end|bottom",
      dense: "boolean",
      stack: "boolean",
      slots: "{ icon?, title?, message?, description?, meta?, actions?, aside?, dismiss?, default? }",
      class: "string",
      style: "object"
    },
    slots: {
      icon: "Leading visual/icon content",
      title: "Banner title content",
      message: "Primary message content",
      description: "Secondary/supporting text",
      meta: "Meta information content",
      actions: "Actions area content",
      aside: "Right side support content",
      dismiss: "Custom dismiss control",
      default: "Extra banner body content"
    },
    returns: "HTMLDivElement",
    description: "Structured banner with tone, actions, dismiss, and composable slots."
  };
}
// Esempio: CMSwift.ui.Banner({ type: "warning", title: "Pagamento in sospeso", message: "Aggiorna il batch entro le 18:00" })

UI.Alert = (...args) => {
  const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};

  const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.type) || uiUnwrap(rawProps.state) || uiUnwrap(rawProps.color) || "warning");
  const stateClass = uiComputed([rawProps.type, rawProps.state, rawProps.color], () => {
    const state = resolveStateValue();
    return state ? `cms-state-${state}` : "";
  });

  const props = { ...rawProps };
  const p = CMSwift.omit(props, [
    "actions", "aside", "closeLabel", "description", "dismiss", "dismissible",
    "icon", "iconSize", "message", "meta", "onDismiss", "slots", "state",
    "subtitle", "title", "type", "variant"
  ]);
  p.class = uiClass([
    "cms-clear-set",
    "cms-alert",
    "cms-singularity",
    stateClass,
    uiWhen(rawProps.dismissible, "is-dismissible"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };

  const autoIconMap = {
    success: "check_circle",
    warning: "warning",
    danger: "error",
    info: "info",
    primary: "bolt",
    secondary: "campaign",
    dark: "shield",
    light: "notifications"
  };

  const iconFallback = (() => {
    if (rawProps.icon === false || rawProps.icon === null) return null;
    if (rawProps.icon != null) {
      return typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || "sm" })
        : CMSwift.ui.slot(rawProps.icon, { as: "icon" });
    }
    const iconName = autoIconMap[resolveStateValue()] || autoIconMap.warning;
    return UI.Icon({ name: iconName, size: rawProps.iconSize || "sm" });
  })();

  const titleNodes = renderSlotToArray(slots, "title", {}, rawProps.title);
  const messageNodes = renderSlotToArray(slots, "message", {}, rawProps.message != null ? rawProps.message : children);
  const descriptionNodes = renderSlotToArray(slots, "description", {}, rawProps.description ?? rawProps.subtitle);
  const metaNodes = renderSlotToArray(slots, "meta", {}, rawProps.meta);
  const actionsNodes = renderSlotToArray(slots, "actions", {}, rawProps.actions);
  const asideNodes = renderSlotToArray(slots, "aside", {}, rawProps.aside);
  const iconNodes = renderSlotToArray(slots, "icon", {}, iconFallback);
  const dismissNodes = renderSlotToArray(slots, "dismiss", {}, rawProps.dismiss);

  let alertEl = null;
  const defaultDismissNode = rawProps.dismissible || rawProps.onDismiss
    ? UI.Btn({
      class: "cms-alert-close",
      outline: true,
      size: "sm",
      "aria-label": rawProps.closeLabel || "Chiudi alert",
      onClick: (e) => {
        rawProps.onDismiss?.(e);
        if (e.defaultPrevented) return;
        alertEl?.remove();
      }
    }, UI.Icon({ name: "close", size: "sm" }))
    : null;

  alertEl = _.div(
    p,
    iconNodes.length ? _.div({ class: "cms-alert-icon" }, ...iconNodes) : null,
    _.div(
      { class: "cms-alert-body" },
      titleNodes.length ? _.div({ class: "cms-alert-title" }, ...titleNodes) : null,
      messageNodes.length ? _.div({ class: "cms-alert-message" }, ...messageNodes) : null,
      descriptionNodes.length ? _.div({ class: "cms-alert-description" }, ...descriptionNodes) : null,
      metaNodes.length ? _.div({ class: "cms-alert-meta" }, ...metaNodes) : null,
      actionsNodes.length ? _.div({ class: "cms-alert-actions" }, ...actionsNodes) : null
    ),
    (asideNodes.length || dismissNodes.length || defaultDismissNode)
      ? _.div(
        { class: "cms-alert-side" },
        ...asideNodes,
        ...(dismissNodes.length ? dismissNodes : (defaultDismissNode ? [defaultDismissNode] : []))
      )
      : null
  );

  alertEl.setAttribute("role", resolveStateValue() === "danger" || resolveStateValue() === "warning" ? "alert" : "status");
  setPropertyProps(alertEl, rawProps);
  return alertEl;
};
if (CMSwift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.Alert = {
    signature: "UI.Alert(...children) | UI.Alert(props, ...children)",
    props: {
      title: "String|Node|Function|Array",
      message: "String|Node|Function|Array",
      description: "String|Node|Function|Array",
      meta: "Node|Function|Array",
      icon: "String|Node|Function|Array|false",
      actions: "Node|Function|Array",
      aside: "Node|Function|Array",
      dismissible: "boolean",
      dismiss: "Node|Function|Array",
      onDismiss: "function",
      closeLabel: "string",
      type: "success|warning|danger|error|info|primary|secondary|light|dark",
      state: "success|warning|danger|error|info|primary|secondary|light|dark",
      slots: "{ icon?, title?, message?, description?, meta?, actions?, aside?, dismiss?, default? }",
      class: "string",
      style: "object"
    },
    slots: {
      icon: "Leading alert icon content",
      title: "Alert title content",
      message: "Primary alert copy",
      description: "Secondary/supporting text",
      meta: "Inline meta content",
      actions: "Alert actions cluster",
      aside: "Right side support content",
      dismiss: "Custom dismiss control",
      default: "Fallback alert message content"
    },
    returns: "HTMLDivElement",
    description: "Alert compatto per warning inline, policy note e feedback persistente dentro page o card."
  };
}
// Esempio: CMSwift.ui.Alert({ type: "warning", title: "Review richiesta", message: "Controlla il batch prima del go-live" })

UI.EmptyState = (...args) => {
  const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.state) || uiUnwrap(rawProps.color) || "");
  const stateClass = uiComputed([rawProps.state, rawProps.color], () => {
    const state = resolveStateValue();
    return state ? `cms-state-${state}` : "";
  });

  const props = { ...rawProps };
  const p = CMSwift.omit(props, [
    "actions", "description", "eyebrow", "icon", "iconSize", "illustration", "media",
    "message", "meta", "slots", "state", "title"
  ]);
  p.class = uiClass([
    "cms-clear-set",
    "cms-empty-state",
    "cms-singularity",
    stateClass,
    uiWhen(rawProps.compact, "compact"),
    uiWhen(rawProps.inline, "inline"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };

  const iconFallback = rawProps.icon === false
    ? null
    : (rawProps.icon != null
      ? (typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || "xl" })
        : CMSwift.ui.slot(rawProps.icon, { as: "icon" }))
      : UI.Icon({ name: "inbox", size: rawProps.iconSize || "xl" }));

  const illustrationNodes = renderSlotToArray(slots, "illustration", {}, rawProps.illustration ?? rawProps.media);
  const iconNodes = renderSlotToArray(slots, "icon", {}, iconFallback);
  const eyebrowNodes = renderSlotToArray(slots, "eyebrow", {}, rawProps.eyebrow);
  const titleNodes = renderSlotToArray(slots, "title", {}, rawProps.title);
  const messageNodes = renderSlotToArray(slots, "message", {}, rawProps.message != null ? rawProps.message : children);
  const descriptionNodes = renderSlotToArray(slots, "description", {}, rawProps.description);
  const metaNodes = renderSlotToArray(slots, "meta", {}, rawProps.meta);
  const actionsNodes = renderSlotToArray(slots, "actions", {}, rawProps.actions);
  const bodyNodes = renderSlotToArray(slots, "default", {}, rawProps.message != null ? children : null);

  const emptyState = _.section(
    p,
    illustrationNodes.length
      ? _.div({ class: "cms-empty-state-illustration" }, ...illustrationNodes)
      : null,
    iconNodes.length ? _.div({ class: "cms-empty-state-icon" }, ...iconNodes) : null,
    eyebrowNodes.length ? _.div({ class: "cms-empty-state-eyebrow" }, ...eyebrowNodes) : null,
    titleNodes.length ? _.div({ class: "cms-empty-state-title" }, ...titleNodes) : null,
    messageNodes.length ? _.div({ class: "cms-empty-state-message" }, ...messageNodes) : null,
    descriptionNodes.length ? _.div({ class: "cms-empty-state-description" }, ...descriptionNodes) : null,
    metaNodes.length ? _.div({ class: "cms-empty-state-meta" }, ...metaNodes) : null,
    bodyNodes.length ? _.div({ class: "cms-empty-state-extra" }, ...bodyNodes) : null,
    actionsNodes.length ? _.div({ class: "cms-empty-state-actions" }, ...actionsNodes) : null
  );

  setPropertyProps(emptyState, rawProps);
  return emptyState;
};
if (CMSwift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.EmptyState = {
    signature: "UI.EmptyState(...children) | UI.EmptyState(props, ...children)",
    props: {
      eyebrow: "String|Node|Function|Array",
      title: "String|Node|Function|Array",
      message: "String|Node|Function|Array",
      description: "String|Node|Function|Array",
      meta: "Node|Function|Array",
      icon: "String|Node|Function|Array|false",
      illustration: "Node|Function|Array",
      media: "Alias of illustration",
      actions: "Node|Function|Array",
      compact: "boolean",
      inline: "boolean",
      state: "primary|secondary|success|warning|danger|info|light|dark",
      slots: "{ illustration?, icon?, eyebrow?, title?, message?, description?, meta?, actions?, default? }",
      class: "string",
      style: "object"
    },
    slots: {
      illustration: "Top visual / illustration content",
      icon: "Leading empty-state icon",
      eyebrow: "Small kicker content",
      title: "Primary empty-state heading",
      message: "Primary message content",
      description: "Secondary supporting text",
      meta: "Meta badges or summary content",
      actions: "Actions cluster",
      default: "Extra empty-state body content"
    },
    returns: "HTMLElement",
    description: "Surface per zero-results, onboarding vuoti e pannelli senza dati con CTA di recupero."
  };
}
// Esempio: CMSwift.ui.EmptyState({ title: "No results", message: "Prova a cambiare i filtri" })

// -------------------------------
// 3) APP SHELL
// -------------------------------
let drawerStateKey = "cmswift:drawer-open";
const drawerToggleIcons = new Set();
const drawerElsByKey = new Map();
const readDrawerOpen = (key = drawerStateKey) => {
  const store = CMSwift?.store;
  if (store?.get) {
    const stored = store.get(key, undefined);
    if (typeof stored === "boolean") return stored;
  }
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};
const writeDrawerOpen = (open, key = drawerStateKey) => {
  const store = CMSwift?.store;
  if (store?.set) {
    store.set(key, !!open);
    return;
  }
  try {
    localStorage.setItem(key, open ? "1" : "0");
  } catch {
    // ignore storage errors
  }
};
let drawerOpen = readDrawerOpen();
const setDrawerOpen = (open, key = drawerStateKey) => {
  drawerOpen = !!open;
  const drawerEls = drawerElsByKey.get(key);
  if (drawerEls && drawerEls.size) {
    drawerEls.forEach((el) => el?.classList.toggle("open", drawerOpen));
  } else {
    const drawerEl = document.querySelector(".cms-drawer");
    if (drawerEl) drawerEl.classList.toggle("open", drawerOpen);
  }
  drawerToggleIcons.forEach((entry) => {
    if (!entry) return;
    if (typeof entry.update === "function") {
      entry.update(drawerOpen);
      return;
    }
    const { el, openIcon, closeIcon } = entry;
    if (el) el.textContent = drawerOpen ? openIcon : closeIcon;
  });
  writeDrawerOpen(drawerOpen, key);
  return drawerOpen;
};

  UI.Tooltip = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    let entry = null;
    let openTimer = null;
    let closeTimer = null;
    let boundEl = null;
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(props, key);
    const hasExternalTarget = hasOwn("target") || hasOwn("anchorEl") || hasOwn("triggerEl");
    const targetNode = props.target || props.anchorEl || props.triggerEl || (children && children.length ? children[0] : null);

    const getNumber = (value, fallback) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    };
    const clearTimers = () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      openTimer = null;
      closeTimer = null;
    };
    const getDelay = () => getNumber(props.delay, 350);
    const getHideDelay = () => getNumber(props.hideDelay, uiUnwrap(props.interactive) ? 120 : 0);
    const closeNow = () => {
      clearTimers();
      if (!entry) return;
      const toClose = entry;
      entry = null;
      overlayLeave(toClose, () => CMSwift.overlay.close(toClose.id));
    };
    const parseTriggers = (value) => {
      if (value == null || value === true) return new Set(["hover", "focus"]);
      if (value === false) return new Set(["manual"]);
      const raw = Array.isArray(value) ? value : String(value).split(/[\s,|/]+/);
      const out = new Set();
      raw.forEach((item) => {
        const key = String(item || "").trim().toLowerCase();
        if (!key) return;
        if (key === "mouseenter" || key === "mouseover") out.add("hover");
        else if (key === "blur" || key === "focusin") out.add("focus");
        else if (key === "tap") out.add("click");
        else out.add(key);
      });
      return out.size ? out : new Set(["manual"]);
    };
    const triggers = parseTriggers(props.trigger ?? props.triggers ?? (hasOwn("open") ? "manual" : null));
    const allowHover = triggers.has("hover");
    const allowFocus = triggers.has("focus");
    const allowClick = triggers.has("click");
    const isManual = triggers.has("manual") || (!allowHover && !allowFocus && !allowClick);

    const buildContent = () => {
      const ctx = {
        anchorEl: boundEl || targetNode || null,
        close: () => closeNow(),
        hide: () => closeNow(),
        isOpen: () => !!entry
      };
      const iconFallback = props.icon
        ? (typeof props.icon === "string"
          ? UI.Icon({ name: props.icon, size: props.iconSize || props.size || "sm" })
          : CMSwift.ui.slot(props.icon, { as: "icon" }))
        : null;
      const titleNodes = renderSlotToArray(slots, "title", ctx, props.title ?? props.heading);
      const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
      const footerNodes = renderSlotToArray(slots, "footer", ctx, props.footer ?? props.actions);

      let bodyRaw = props.content ?? props.text ?? props.body ?? props.description ?? props.label;
      if (bodyRaw == null) {
        if (hasExternalTarget) bodyRaw = children;
        else if (targetNode && children && children.length > 1) bodyRaw = children.slice(1);
        else if (!targetNode) bodyRaw = children;
      }
      let bodyNodes = renderSlotToArray(slots, "content", ctx, bodyRaw);
      if (!bodyNodes.length) bodyNodes = renderSlotToArray(slots, "default", ctx, bodyRaw);

      const bodyEl = bodyNodes.length ? _.div({ class: "cms-tooltip-body" }, ...bodyNodes) : null;
      const headEl = (iconNodes.length || titleNodes.length)
        ? _.div(
          { class: "cms-tooltip-head" },
          iconNodes.length ? _.div({ class: "cms-tooltip-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-tooltip-head-main" },
            titleNodes.length ? _.div({ class: "cms-tooltip-title" }, ...titleNodes) : null,
            bodyEl
          )
        )
        : bodyEl;
      const footerEl = footerNodes.length ? _.div({ class: "cms-tooltip-footer" }, ...footerNodes) : null;

      return _.div({ class: "cms-tooltip-content" }, ...[headEl, footerEl].filter(Boolean));
    };

    const open = (anchorEl) => {
      const anchor = anchorEl || boundEl;
      if (!anchor || uiUnwrap(props.disabled)) return null;
      if (entry && entry._anchorEl === anchor) return entry;
      if (entry) closeNow();
      const shouldCloseOnOutside = props.closeOnOutside ?? (allowClick || uiUnwrap(props.interactive));
      const shouldCloseOnEsc = props.closeOnEsc ?? (allowClick || uiUnwrap(props.interactive));
      let currentRef = null;
      entry = CMSwift.overlay.open(() => buildContent(), {
        type: "tooltip",
        anchorEl: anchor,
        placement: props.placement || "top",
        offsetX: props.offsetX ?? 0,
        offsetY: props.offsetY ?? props.offset ?? 8,
        backdrop: false,
        lockScroll: false,
        trapFocus: false,
        closeOnOutside: shouldCloseOnOutside,
        closeOnBackdrop: false,
        closeOnEsc: shouldCloseOnEsc,
        autoFocus: false,
        className: uiClassStatic([
          "cms-tooltip",
          uiWhen(props.interactive, "interactive"),
          props.class,
          props.panelClass
        ]),
        onClose: () => {
          currentRef?._tooltipCleanup?.();
          if (entry === currentRef) entry = null;
          props.onClose?.();
        }
      });
      if (!entry?.panel) return entry;
      const current = entry;
      currentRef = current;
      current._anchorEl = anchor;
      current.panel.dataset.placement = String(uiUnwrap(props.placement || "top"));
      if (props.maxWidth != null) current.panel.style.maxWidth = toCssSize(uiUnwrap(props.maxWidth));
      if (props.minWidth != null) current.panel.style.minWidth = toCssSize(uiUnwrap(props.minWidth));
      if (props.width != null) current.panel.style.width = toCssSize(uiUnwrap(props.width));
      if (props.style) Object.assign(current.panel.style, props.style);
      setPropertyProps(current.panel, props);
      if (uiUnwrap(props.interactive)) {
        const cancelHide = () => {
          clearTimeout(closeTimer);
          closeTimer = null;
        };
        const scheduleHide = () => hide();
        const onPanelClick = (e) => {
          const target = e.target;
          if (target && target.closest && target.closest("[data-tooltip-close]")) {
            closeNow();
          }
        };
        current.panel.addEventListener("mouseenter", cancelHide);
        current.panel.addEventListener("mouseleave", scheduleHide);
        current.panel.addEventListener("focusin", cancelHide);
        current.panel.addEventListener("focusout", scheduleHide);
        current.panel.addEventListener("click", onPanelClick);
        current._tooltipCleanup = () => {
          current.panel?.removeEventListener("mouseenter", cancelHide);
          current.panel?.removeEventListener("mouseleave", scheduleHide);
          current.panel?.removeEventListener("focusin", cancelHide);
          current.panel?.removeEventListener("focusout", scheduleHide);
          current.panel?.removeEventListener("click", onPanelClick);
        };
      }
      overlayEnter(current);
      props.onOpen?.(current);
      return current;
    };

    const show = (anchorEl) => {
      clearTimeout(closeTimer);
      closeTimer = null;
      clearTimeout(openTimer);
      openTimer = setTimeout(() => open(anchorEl), getDelay());
    };

    const hide = (immediate = false) => {
      clearTimeout(openTimer);
      openTimer = null;
      if (!entry) return;
      clearTimeout(closeTimer);
      if (immediate) {
        closeNow();
        return;
      }
      closeTimer = setTimeout(() => closeNow(), getHideDelay());
    };
    const toggle = (anchorEl) => {
      if (entry) hide(true);
      else open(anchorEl);
    };
    const isOpen = () => !!entry;

    const bind = (el) => {
      if (!el) return () => { };
      boundEl = el;
      const cleanups = [];
      const cleanup = () => {
        clearTimers();
        cleanups.forEach((fn) => fn());
      };
      if (hasOwn("open")) {
        if (uiIsReactive(props.open)) {
          CMSwift.reactive.effect(() => {
            if (!boundEl) return;
            if (uiUnwrap(props.open)) open(boundEl);
            else hide(true);
          }, "UI.Tooltip:open");
        } else if (props.open === true) {
          open(el);
        } else if (props.open === false) {
          hide(true);
        }
        return cleanup;
      }
      if (isManual || uiUnwrap(props.disabled)) return cleanup;
      if (allowHover) {
        const onEnter = () => show(el);
        const onLeave = () => hide();
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
        });
      }
      if (allowFocus) {
        const onFocus = () => show(el);
        const onBlur = () => hide();
        el.addEventListener("focus", onFocus);
        el.addEventListener("blur", onBlur);
        cleanups.push(() => {
          el.removeEventListener("focus", onFocus);
          el.removeEventListener("blur", onBlur);
        });
      }
      if (allowClick) {
        const onClick = (e) => {
          props.onTriggerClick?.(e);
          if (e.defaultPrevented) return;
          toggle(el);
        };
        el.addEventListener("click", onClick);
        cleanups.push(() => el.removeEventListener("click", onClick));
      }
      return cleanup;
    };

    if (targetNode) {
      const cls = uiClass(["cms-tooltip-wrap", props.wrapClass, props.targetClass]);
      const p = CMSwift.omit(props, [
        "actions", "anchorEl", "body", "closeOnEsc", "closeOnOutside", "content", "delay", "description",
        "disabled", "footer", "heading", "hideDelay", "icon", "iconSize", "interactive", "label",
        "maxWidth", "minWidth", "offset", "offsetX", "offsetY", "onClose", "onOpen", "onTriggerClick",
        "open", "panelClass", "placement", "slots", "style", "target", "targetClass", "targetStyle",
        "text", "title", "trigger", "triggerEl", "triggers", "width", "wrapClass", "wrapStyle"
      ]);
      p.class = cls;
      p.style = { display: "inline-flex", alignItems: "center", ...(props.wrapStyle || props.targetStyle || {}) };
      const target = CMSwift.ui.renderSlot(slots, "target", {
        open: () => open(boundEl),
        show: () => show(boundEl),
        hide: () => hide(true),
        toggle: () => toggle(boundEl),
        isOpen
      }, targetNode);
      const wrap = _.span(p, ...renderSlotToArray(null, "default", {}, target));
      bind(wrap);
      wrap._tooltip = { bind, open, show, hide, close: closeNow, toggle, isOpen };
      return wrap;
    }

    return { bind, open, show, hide, close: closeNow, toggle, isOpen };
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Tooltip = {
      signature: "UI.Tooltip(props, target?) | UI.Tooltip(target, content)",
      props: {
        title: "String|Node|Function|Array",
        content: "String|Node|Function|Array",
        text: "String|Node|Function|Array",
        body: "String|Node|Function|Array",
        footer: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        target: "Node|Function|Array",
        trigger: "\"hover focus\" | \"click\" | \"manual\" | Array",
        interactive: "boolean",
        disabled: "boolean",
        open: "boolean | reactive",
        placement: "string",
        delay: "number",
        hideDelay: "number",
        offset: "number (legacy)",
        offsetX: "number",
        offsetY: "number",
        closeOnOutside: "boolean",
        closeOnEsc: "boolean",
        maxWidth: "string|number",
        minWidth: "string|number",
        width: "string|number",
        slots: "{ target?, icon?, title?, content?, footer?, default? }",
        class: "string",
        panelClass: "string",
        wrapClass: "string",
        style: "object",
        targetStyle: "object"
      },
      slots: {
        target: "Tooltip trigger content ({ open, show, hide, toggle, isOpen })",
        icon: "Tooltip icon content",
        title: "Tooltip title content",
        content: "Tooltip body content ({ close, hide, isOpen, anchorEl })",
        footer: "Tooltip footer content ({ close, hide, isOpen, anchorEl })",
        default: "Fallback tooltip body content"
      },
      events: {
        onOpen: "(entry) => void",
        onClose: "() => void",
        onTriggerClick: "(event) => void"
      },
      returns: "Object { bind(), open(), show(), hide(), close(), toggle(), isOpen() } | HTMLSpanElement",
      description: "Anchored tooltip with hover/focus/click triggers, rich content, and imperative API."
    };
  }
  // Esempio: CMSwift.ui.Tooltip({ title: "Info", text: "Dettaglio rapido" }, CMSwift.ui.Icon({ name: "info" }))

  const buildChoiceControl = (type, args, options = {}) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const isRadio = type === "radio";
    const isToggle = options.appearance === "toggle";
    const supportsStandby = !isRadio;
    const id = props.id || (`cms-${type}-` + Math.random().toString(36).slice(2));
    const model = resolveModel(
      props.model,
      options.modelName || (isRadio ? "UI.Radio:model" : "UI.Checkbox:model")
    );

    const inputProps = CMSwift.omit(props, [
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

    const wrapProps = CMSwift.omit(props, [
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
    if (sizeValue != null && !(typeof sizeValue === "string" && CMSwift.uiSizes?.includes(sizeValue))) {
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
        iconNode = CMSwift.ui.renderSlot(slots, "checkedIcon", ctx, null);
        if (iconNode == null) iconNode = CMSwift.ui.renderSlot(slots, "iconOn", ctx, null);
      } else if (state === false) {
        iconNode = CMSwift.ui.renderSlot(slots, "uncheckedIcon", ctx, null);
        if (iconNode == null) iconNode = CMSwift.ui.renderSlot(slots, "iconOff", ctx, null);
      } else {
        iconNode = CMSwift.ui.renderSlot(slots, "indeterminateIcon", ctx, null);
        if (iconNode == null) iconNode = CMSwift.ui.renderSlot(slots, "standbyIcon", ctx, null);
        if (iconNode == null) iconNode = CMSwift.ui.renderSlot(slots, "iconStandby", ctx, null);
      }
      if (iconNode == null) iconNode = CMSwift.ui.renderSlot(slots, "icon", ctx, null);
      if (iconNode == null) {
        const source = resolveIconSource(state);
        if (typeof source === "string") iconNode = UI.Icon({ name: source, size: iconSize, ...(isToggle ? { textColor: props.color, outline: true } : {}) });
        else if (source != null) {
          iconNode = CMSwift.ui.slot(source, {
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
  if (CMSwift.isDev?.()) {
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
  // Esempio: CMSwift.ui.Checkbox({ label: "Accetto", model: [get,set] })

  UI.Radio = (...args) => buildChoiceControl("radio", args);
  if (CMSwift.isDev?.()) {
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
  // Esempio: CMSwift.ui.Radio({ name: "r1", value: "a", label: "A", model: [get,set] })

  UI.Toggle = (...args) => {
    const { props } = CMSwift.uiNormalizeArgs(args);
    const behavior = String(props.behavior ?? props.mode ?? props.type ?? "checkbox").toLowerCase() === "radio"
      ? "radio"
      : "checkbox";
    return buildChoiceControl(behavior, args, {
      appearance: "toggle",
      modelName: "UI.Toggle:model"
    });
  };
  if (CMSwift.isDev?.()) {
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
  // Esempio: CMSwift.ui.Toggle({ label: "Attivo", model: [get,set] })

  UI.Slider = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const boundValue = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(boundValue, "UI.Slider:model");

    const inputProps = CMSwift.omit(props, [
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
      const sliderSize = (typeof sizeValue === "string" && CMSwift.uiSizes?.includes(sizeValue))
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
    const [getValue, setValue] = CMSwift.reactive.signal(normalizeValue(
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
        let markerNode = CMSwift.ui.renderSlot(slots, "marker", markerCtx, null);
        if (markerNode == null && marker.icon != null) {
          markerNode = typeof marker.icon === "string"
            ? UI.Icon({ name: marker.icon, size: 12 })
            : CMSwift.ui.slot(marker.icon, { ...markerCtx, as: "marker" });
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
      CMSwift.reactive.effect(() => {
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

    CMSwift.reactive.effect(() => {
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
  if (CMSwift.isDev?.()) {
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
  // Esempio: CMSwift.ui.Slider({ min: 0, max: 10, model: [get,set] })

  UI.Rating = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const boundValue = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(boundValue, "UI.Rating:model");
    const id = props.id || (`cms-rating-` + Math.random().toString(36).slice(2));
    const inputProps = CMSwift.omit(props, [
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

    const wrapProps = CMSwift.omit(props, [
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
    if (sizeValue != null && !(typeof sizeValue === "string" && CMSwift.uiSizes?.includes(sizeValue))) {
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

    CMSwift.reactive.effect(() => {
      if (!model && props.value != null) {
        localValue = normalizeValue(uiUnwrap(props.value));
      }
      syncVisualState();
    }, "UI.Rating:render");

    return wrap;
  };
  if (CMSwift.isDev?.()) {
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
  // Esempio: CMSwift.ui.Rating({ max: 5, model: [get,set] })

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
        const slotValue = CMSwift.ui.getSlot(slots, candidate);
        if (slotValue == null) continue;
        const rendered = CMSwift.ui.renderSlot(slots, candidate, ctx, fallback);
        if (rendered != null) return rendered;
      }
      return CMSwift.ui.slot(fallback, ctx);
    };
    const renderPointNodes = (ctx) => {
      let pointNode = renderNamedSlot("point", ctx, null);
      if (pointNode == null && config.pointIcon != null && ctx.selected) {
        pointNode = typeof config.pointIcon === "string"
          ? UI.Icon({ name: config.pointIcon, size: embedded ? 10 : 12 })
          : CMSwift.ui.slot(config.pointIcon, ctx);
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
    const { props, children } = CMSwift.uiNormalizeArgs(args);
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
    const hasFloatingLabel = fieldProps.label != null || CMSwift.ui.getSlot(slots, "label") != null;
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
        let pointNode = CMSwift.ui.renderSlot(slots, "point", ctx, null);
        if (pointNode == null) pointNode = CMSwift.ui.renderSlot(slots, "dayPoint", ctx, null);
        if (pointNode == null && props.pointIcon != null && (ctx.selected || ctx.inRange || ctx.today)) {
          pointNode = typeof props.pointIcon === "string"
            ? UI.Icon({ name: props.pointIcon, size: 10 })
            : CMSwift.ui.slot(props.pointIcon, ctx);
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
          const labelNode = CMSwift.ui.renderSlot(slots, "day", ctx, String(date.getDate()));
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
      entry = CMSwift.overlay.open(({ close }) => {
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
      overlayLeave(toClose, () => CMSwift.overlay.close(toClose.id));
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

    CMSwift.reactive.effect(() => {
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
  CMSwift.ui.Datepicker = UI.Datepicker;
  CMSwift.ui.Calendar = UI.Calendar;
  CMSwift.ui.Date = UI.Date;
  if (CMSwift.isDev?.()) {
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
  // Esempio: CMSwift.ui.Datepicker({ value: "2024-01-01" })

  UI.Time = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
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
    const hasFloatingLabel = fieldProps.label != null || CMSwift.ui.getSlot(slots, "label") != null;

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
      entry = CMSwift.overlay.open(() => {
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
      overlayLeave(toClose, () => CMSwift.overlay.close(toClose.id));
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

    CMSwift.reactive.effect(() => {
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
  if (CMSwift.isDev?.()) {
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
  // Esempio: CMSwift.ui.Time({ value: "09:30" })

  UI.Tabs = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const hasOwn = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
    const normalizeOrientation = (value) => String(uiUnwrap(value) || "horizontal").toLowerCase() === "vertical" ? "vertical" : "horizontal";
    const normalizeVariant = (value) => {
      const raw = String(uiUnwrap(value) || "").toLowerCase();
      if (raw === "pills" || raw === "pill") return "pills";
      if (raw === "soft" || raw === "card") return "soft";
      return "line";
    };
    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return CMSwift.uiColors?.includes(raw) ? `var(--cms-${raw})` : String(raw);
    };
    const isSameValue = (a, b) => Object.is(a, b) || (a != null && b != null && a == b);

    const model = resolveModel(props.model, "UI.Tabs:model");
    const orientation = normalizeOrientation(props.orientation || props.orient || props.direction);
    const variant = normalizeVariant(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line")));
    const fillTabs = !!uiUnwrap(props.fill ?? props.navFill ?? props.stretch);
    const wrapTabs = !!uiUnwrap(props.wrap);
    const disabledAll = !!uiUnwrap(props.disabled);
    const componentId = props.id || (`cms-tabs-` + Math.random().toString(36).slice(2, 9));
    const rawTabs = uiUnwrap(props.tabs ?? props.items) || [];
    const tabs = (Array.isArray(rawTabs) ? rawTabs : [rawTabs])
      .map((tab, index) => {
        if (tab == null) return null;
        if (typeof tab !== "object") {
          return {
            raw: tab,
            index,
            value: tab,
            labelFallback: tab,
            noteFallback: null,
            iconFallback: null,
            badgeFallback: null,
            disabled: false,
            hidden: false
          };
        }
        const value = tab.value ?? tab.name ?? tab.id ?? tab.key ?? tab.label ?? tab.title ?? `tab-${index}`;
        const labelFallback = tab.label ?? tab.title ?? tab.name ?? tab.value ?? `Tab ${index + 1}`;
        const badgeFallback = hasOwn(tab, "badge")
          ? tab.badge
          : (hasOwn(tab, "counter") ? tab.counter : null);
        return {
          ...tab,
          raw: tab,
          index,
          value,
          labelFallback,
          noteFallback: tab.note ?? tab.subtitle ?? tab.description ?? null,
          iconFallback: tab.icon ?? null,
          badgeFallback
        };
      })
      .filter(Boolean)
      .filter((tab) => tab.hidden !== true && tab.visible !== false);

    const firstEnabled = tabs.find((tab) => !tab.disabled) || null;
    const findTabIndex = (value) => tabs.findIndex((tab) => isSameValue(tab.value, value));
    const findEnabledIndex = (startIndex, step) => {
      if (!tabs.length) return -1;
      let index = startIndex;
      for (let i = 0; i < tabs.length; i += 1) {
        index += step;
        if (index < 0) index = tabs.length - 1;
        else if (index >= tabs.length) index = 0;
        if (!tabs[index]?.disabled) return index;
      }
      return -1;
    };
    const coerceValue = (value, fallback = false) => {
      const index = findTabIndex(value);
      if (index >= 0 && !tabs[index]?.disabled) return tabs[index].value;
      return fallback ? (firstEnabled?.value ?? null) : (value ?? null);
    };
    const initialValue = coerceValue(
      model
        ? model.get()
        : (hasOwn(props, "value") ? uiUnwrap(props.value) : (props.defaultValue ?? props.default)),
      true
    );
    const [getValue, setValue] = CMSwift.reactive.signal(initialValue);

    const cls = uiClass([
      "cms-clear-set",
      "cms-tabs",
      "cms-singularity",
      orientation,
      `variant-${variant}`,
      uiWhen(props.dense, "dense"),
      uiWhen(fillTabs, "fill"),
      uiWhen(wrapTabs, "wrap"),
      uiWhen(disabledAll, "disabled"),
      props.class
    ]);
    const wrapProps = CMSwift.omit(props, [
      "tabs", "items", "value", "defaultValue", "default", "model",
      "orientation", "orient", "direction",
      "variant", "pills", "soft",
      "fill", "navFill", "stretch",
      "wrap", "dense", "disabled",
      "slots", "empty",
      "gap", "tabGap",
      "align", "justify",
      "color", "state",
      "navClass", "navStyle",
      "barClass", "barStyle",
      "tabClass", "tabStyle",
      "itemClass", "itemStyle",
      "class", "style"
    ]);
    wrapProps.class = cls;
    wrapProps.style = {
      ...(props.style || {})
    };
    if (props.gap != null) wrapProps.style["--cms-tabs-gap"] = toCssSize(props.gap);
    if (props.tabGap != null) wrapProps.style["--cms-tabs-tab-gap"] = toCssSize(props.tabGap);
    const accentColor = resolveAccent(props.color ?? props.state);
    if (accentColor) wrapProps.style["--cms-tabs-accent"] = accentColor;
    const wrap = _.div(wrapProps);

    const bar = _.div({
      class: uiClass(["cms-tabs-bar", props.barClass]),
      style: {
        alignItems: props.align || (orientation === "vertical" ? "stretch" : "center"),
        justifyContent: props.justify || "flex-start",
        ...(props.barStyle || {})
      }
    });
    const nav = _.div({
      class: uiClass(["cms-tabs-nav", props.navClass]),
      style: props.navStyle || null,
      role: "tablist",
      "aria-orientation": orientation
    });
    const tabButtons = [];

    const getActiveIndex = () => findTabIndex(getValue());
    const getActiveTab = () => {
      const index = getActiveIndex();
      return index >= 0 ? tabs[index] : null;
    };
    const createRootCtx = () => ({
      tabs,
      value: getValue(),
      active: getValue(),
      activeIndex: getActiveIndex(),
      activeTab: getActiveTab(),
      orientation,
      variant,
      select: (value, event) => selectByValue(value, { event, emit: true }),
      next: () => goNext(),
      prev: () => goPrev()
    });
    const createCtx = (tab, index, active) => ({
      ...createRootCtx(),
      tab,
      index,
      active,
      disabled: !!tab.disabled,
      select: (event) => selectByIndex(index, { event, emit: true })
    });
    const focusIndex = (index) => {
      const btn = tabButtons[index]?.btn;
      if (!btn || typeof btn.focus !== "function") return;
      requestAnimationFrame(() => btn.focus());
    };

    const updateButtons = (nextValue) => {
      const nextIndex = findTabIndex(nextValue);
      wrap.dataset.value = nextValue == null ? "" : String(nextValue);
      wrap.dataset.activeIndex = nextIndex >= 0 ? String(nextIndex) : "";
      tabButtons.forEach(({ btn, item, tab, index }) => {
        const active = index === nextIndex;
        item.classList.toggle("active", active);
        item.classList.toggle("disabled", !!(tab.disabled || disabledAll));
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
        btn.setAttribute("tabindex", active ? "0" : "-1");
      });
    };

    const syncValue = (nextValue) => {
      setValue(nextValue);
      updateButtons(nextValue);
    };

    const selectByValue = (nextValue, options = {}) => {
      if (disabledAll) return null;
      const index = findTabIndex(nextValue);
      if (index < 0) return null;
      return selectByIndex(index, options);
    };

    const selectByIndex = (index, options = {}) => {
      const tab = tabs[index];
      if (!tab || tab.disabled || disabledAll) return null;
      const nextValue = tab.value;
      const prevValue = getValue();
      const changed = !isSameValue(prevValue, nextValue);

      syncValue(nextValue);
      if (model && !isSameValue(model.get(), nextValue)) {
        model.set(nextValue);
      }
      if (options.focus) focusIndex(index);
      if (options.event) {
        tab.onClick?.(nextValue, options.event, tab, index);
      }
      if (changed && options.emit !== false) {
        props.onChange?.(nextValue, tab, options.event || null, index);
      }
      return tab;
    };

    const goNext = () => {
      const nextIndex = findEnabledIndex(getActiveIndex() < 0 ? -1 : getActiveIndex(), 1);
      if (nextIndex >= 0) selectByIndex(nextIndex, { emit: true, focus: true });
    };
    const goPrev = () => {
      const start = getActiveIndex() < 0 ? 0 : getActiveIndex();
      const prevIndex = findEnabledIndex(start, -1);
      if (prevIndex >= 0) selectByIndex(prevIndex, { emit: true, focus: true });
    };

    const makeTabNode = (tab, index) => {
      const isActive = index === getActiveIndex();
      const ctx = createCtx(tab, index, isActive);
      const tabId = `${componentId}-tab-${index}`;
      const iconFallback = tab.iconFallback != null
        ? (typeof tab.iconFallback === "string"
          ? UI.Icon({ name: tab.iconFallback, size: tab.iconSize ?? tab.size ?? props.size ?? null })
          : tab.iconFallback)
        : null;
      const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
      const labelNodes = renderSlotToArray(null, "default", {}, CMSwift.ui.renderSlot(slots, "label", ctx, tab.labelFallback));
      const noteNodes = renderSlotToArray(slots, "note", ctx, tab.noteFallback);
      const badgeNodes = renderSlotToArray(slots, "badge", ctx, tab.badgeFallback);
      const fallbackContent = _.span({ class: "cms-tabs-tab-inner" },
        iconNodes.length ? _.span({ class: "cms-tabs-tab-icon" }, ...iconNodes) : null,
        _.span({ class: "cms-tabs-tab-copy" },
          _.span({ class: "cms-tabs-tab-label" }, ...(labelNodes.length ? labelNodes : [""])),
          noteNodes.length ? _.span({ class: "cms-tabs-tab-note" }, ...noteNodes) : null
        ),
        badgeNodes.length ? _.span({ class: "cms-tabs-tab-badge" }, ...badgeNodes) : null
      );
      const contentNodes = renderSlotToArray(slots, "tab", {
        ...ctx,
        tabId,
        label: labelNodes,
        icon: iconNodes,
        note: noteNodes,
        badge: badgeNodes
      }, fallbackContent);
      const onKeydown = (e) => {
        if (tab.disabled || disabledAll) return;
        const key = e.key;
        if (key === "Enter" || key === " ") {
          e.preventDefault();
          selectByIndex(index, { event: e, emit: true });
          return;
        }
        if (key === "Home") {
          e.preventDefault();
          const firstIndex = tabs.findIndex((item) => !item.disabled);
          if (firstIndex >= 0) selectByIndex(firstIndex, { event: e, emit: true, focus: true });
          return;
        }
        if (key === "End") {
          e.preventDefault();
          let lastIndex = -1;
          for (let i = tabs.length - 1; i >= 0; i -= 1) {
            if (!tabs[i]?.disabled) {
              lastIndex = i;
              break;
            }
          }
          if (lastIndex >= 0) selectByIndex(lastIndex, { event: e, emit: true, focus: true });
          return;
        }
        const prevKeys = orientation === "vertical" ? ["ArrowUp"] : ["ArrowLeft"];
        const nextKeys = orientation === "vertical" ? ["ArrowDown"] : ["ArrowRight"];
        if (prevKeys.includes(key)) {
          e.preventDefault();
          const prevIndex = findEnabledIndex(index, -1);
          if (prevIndex >= 0) selectByIndex(prevIndex, { event: e, emit: true, focus: true });
          return;
        }
        if (nextKeys.includes(key)) {
          e.preventDefault();
          const nextIndex = findEnabledIndex(index, 1);
          if (nextIndex >= 0) selectByIndex(nextIndex, { event: e, emit: true, focus: true });
        }
      };
      const itemAccent = resolveAccent(tab.color ?? tab.state);
      const item = _.div({
        class: uiClass([
          "cms-tabs-item",
          uiWhen(isActive, "active"),
          uiWhen(tab.disabled || disabledAll, "disabled"),
          props.itemClass,
          tab.itemClass
        ]),
        style: {
          ...(itemAccent ? { "--cms-tabs-item-accent": itemAccent } : {}),
          ...(props.itemStyle || {}),
          ...(tab.itemStyle || {})
        },
        "data-name": String(tab.value)
      });
      const btn = UI.Btn({
        class: uiClass([
          "cms-tabs-tab",
          uiWhen(isActive, "active"),
          uiWhen(tab.disabled || disabledAll, "disabled"),
          props.tabClass,
          tab.tabClass || tab.class
        ]),
        type: "button",
        id: tabId,
        role: "tab",
        disabled: !!(tab.disabled || disabledAll),
        "aria-selected": isActive ? "true" : "false",
        tabindex: isActive ? "0" : "-1",
        size: tab.size ?? props.size ?? null,
        style: {
          ...(props.tabStyle || {}),
          ...(tab.tabStyle || {})
        },
        onClick: (e) => {
          selectByIndex(index, { event: e, emit: true });
        },
        onKeydown
      }, ...contentNodes);
      item.appendChild(btn);
      item.appendChild(_.span({ class: "tab-indicator" }));
      tabButtons[index] = { tab, index, item, btn };
      return item;
    };

    if (tabs.length) {
      const defaultNavNodes = tabs.map((tab, index) => makeTabNode(tab, index));
      const navContent = CMSwift.ui.renderSlot(slots, "nav", {
        ...createRootCtx(),
        nodes: defaultNavNodes
      }, defaultNavNodes);
      renderSlotToArray(null, "default", {}, navContent).forEach((node) => nav.appendChild(node));
    } else {
      renderSlotToArray(slots, "empty", createRootCtx(), props.empty ?? _.div({ class: "cms-tabs-empty" }, "Nessuna tab disponibile."))
        .forEach((node) => nav.appendChild(node));
    }

    const extraCtx = createRootCtx();
    const extraNodes = [
      ...renderSlotToArray(null, "default", {}, CMSwift.ui.renderSlot(slots, "extra", extraCtx, null)),
      ...renderSlotToArray(slots, "default", extraCtx, children)
    ];
    bar.appendChild(nav);
    if (extraNodes.length) {
      bar.appendChild(_.div({ class: "cms-tabs-extra" }, ...extraNodes));
    }
    wrap.appendChild(bar);

    syncValue(initialValue);
    if (model) {
      model.watch((value) => {
        syncValue(coerceValue(value, true));
      }, "UI.Tabs:watch");
    } else if (uiIsReactive(props.value)) {
      app.reactive.effect(() => {
        syncValue(coerceValue(uiUnwrap(props.value), true));
      }, "UI.Tabs:value");
    }

    wrap._getValue = () => getValue();
    wrap._setValue = (value) => selectByValue(value, { emit: true });
    wrap._select = (value) => selectByValue(value, { emit: true });
    wrap._next = () => goNext();
    wrap._prev = () => goPrev();
    wrap._getTabs = () => tabs.slice();
    setPropertyProps(wrap, props);
    return wrap;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Tabs = {
      signature: "UI.Tabs(props) | UI.Tabs(props, ...children)",
      props: {
        tabs: "Array<{ value|name|id|key, label|title, note|subtitle|description, icon, badge|counter, disabled, hidden, onClick }>",
        items: "Alias of tabs",
        value: "any",
        defaultValue: "any",
        default: "Alias of defaultValue",
        model: "[get,set] signal",
        orientation: "horizontal|vertical",
        variant: "line|pills|soft",
        fill: "boolean",
        wrap: "boolean",
        disabled: "boolean",
        color: "string",
        state: "string",
        gap: "string|number",
        tabGap: "string|number",
        align: "string",
        justify: "string",
        size: "string|number",
        dense: "boolean",
        navClass: "string",
        tabClass: "string",
        itemClass: "string",
        slots: "{ nav?, tab?, label?, icon?, note?, badge?, extra?, empty?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        nav: "Full nav renderer",
        tab: "Single tab renderer",
        label: "Label renderer",
        icon: "Icon renderer",
        note: "Note renderer",
        badge: "Badge/counter renderer",
        extra: "Extra area next to the nav",
        empty: "Fallback when tabs/items are empty",
        default: "Children / extra content fallback"
      },
      events: {
        onChange: "(value, tab, event, index)"
      },
      keyboard: ["Enter/Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"],
      returns: "HTMLDivElement con ._getValue(), ._setValue(value), ._select(value), ._next(), ._prev(), ._getTabs()",
      description: "Standardized tab bar with controlled/uncontrolled support, structured slots, badge/note/icon, and keyboard navigation."
    };
  }
  // Esempio: CMSwift.ui.Tabs({ tabs: [{ label: "Overview", value: "overview", icon: "dashboard" }], model: [get,set] })

  UI.RouteTab = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const router = CMSwift.router || app?.router || null;
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(props, key);
    const hasExplicitActive = hasOwn("active") || hasOwn("selected");
    const normalizeVariant = (value) => {
      const raw = String(uiUnwrap(value) || "").toLowerCase();
      if (raw === "pill" || raw === "pills") return "pills";
      if (raw === "soft" || raw === "card") return "soft";
      return "line";
    };
    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return CMSwift.uiColors?.includes(raw) ? `var(--cms-${raw})` : String(raw);
    };
    const resolvePath = (value) => {
      if (value == null || value === "") return "";
      try {
        const url = new URL(String(value), window.location.origin);
        return url.pathname || "";
      } catch (_) {
        return String(value).split(/[?#]/)[0] || "";
      }
    };
    const isExternalLink = (value) => {
      if (uiUnwrap(props.external) === true) return true;
      if (!value) return false;
      return /^(mailto:|tel:|https?:\/\/|\/\/)/i.test(String(value));
    };
    const getHref = () => uiUnwrap(props.href ?? props.to) || "#";
    const getTo = () => uiUnwrap(props.to ?? props.href) || "";
    const getCurrentPath = () => {
      try {
        if (router?.current) return router.current().pathname || window.location.pathname || "";
      } catch (_) { }
      return window.location.pathname || "";
    };
    const matchCurrentRoute = () => {
      const to = getTo();
      if (!to) return false;
      const matchValue = uiUnwrap(props.match ?? props.activeMatch ?? props.routeMatch);
      const matchMode = String(uiUnwrap(props.matchMode ?? (props.startsWith ? "startsWith" : (props.exact ? "exact" : ""))) || "").toLowerCase();
      const currentPath = getCurrentPath();
      if (typeof matchValue === "function") {
        return !!matchValue({ currentPath, to, href: getHref(), router, props });
      }
      if (matchValue instanceof RegExp) {
        return matchValue.test(currentPath);
      }
      const targetPath = resolvePath(typeof matchValue === "string" && !["exact", "startsWith", "prefix", "section"].includes(matchValue.toLowerCase())
        ? matchValue
        : to);
      if (!targetPath) return false;
      const mode = matchMode || (typeof matchValue === "string" && ["startsWith", "prefix", "section"].includes(matchValue.toLowerCase()) ? "startsWith" : "exact");
      if (mode === "startswith" || mode === "prefix" || mode === "section") {
        return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
      }
      if (router?.isActive) return !!router.isActive(to);
      return currentPath === targetPath;
    };
    const getDisabled = () => !!uiUnwrap(props.disabled);
    let manualActive = null;
    const getActive = () => {
      if (manualActive != null) return !!manualActive;
      if (hasExplicitActive) return !!uiUnwrap(props.active ?? props.selected);
      return matchCurrentRoute();
    };

    const variant = normalizeVariant(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line")));
    const normalizedState = !uiUnwrap(props.color) && uiUnwrap(props.state)
      ? normalizeState(uiUnwrap(props.state))
      : "";
    const stateClass = normalizedState ? `cms-state-${normalizedState}` : "";
    const p = CMSwift.omit(props, [
      "active", "selected", "label", "title", "text", "to", "icon", "iconRight", "iconSize",
      "note", "subtitle", "caption", "description", "badge", "counter", "count", "aside", "trailing",
      "slots", "state", "color", "dense", "outline", "flat", "glossy", "glow", "glass", "gradient",
      "textGradient", "lightShadow", "shadow", "rounded", "radius", "textColor", "variant", "pills",
      "soft", "block", "fill", "match", "matchMode", "activeMatch", "routeMatch", "exact",
      "startsWith", "external", "onNavigate"
    ]);
    p.href = getHref();
    p.class = uiClass([
      "cms-route-tab",
      "cms-clear-set",
      "cms-singularity",
      `variant-${variant}`,
      uiWhen(props.block ?? props.fill, "block"),
      uiWhen(props.dense, "dense"),
      stateClass,
      props.class
    ]);
    p.style = {
      ...(props.style || {})
    };

    const accent = resolveAccent(props.color ?? props.state);
    if (accent) p.style["--cms-route-tab-accent"] = accent;

    const iconSize = props.iconSize ?? props.size ?? null;
    const resolveIconNode = (value, as) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return null;
      if (typeof raw === "string") return UI.Icon({ name: raw, size: iconSize });
      return CMSwift.ui.slot(raw, { as });
    };
    const ctx = () => ({
      active: getActive(),
      disabled: getDisabled(),
      href: getHref(),
      to: getTo(),
      external: isExternalLink(getHref()),
      navigate: (event) => {
        if (getDisabled()) return false;
        const nextTo = getTo();
        const external = isExternalLink(getHref());
        if (!external && nextTo && router?.navigate) {
          if (event?.preventDefault) event.preventDefault();
          router.navigate(nextTo);
          props.onNavigate?.(nextTo, event || null);
          return true;
        }
        props.onNavigate?.(nextTo || getHref(), event || null);
        return false;
      }
    });

    const iconNodes = renderSlotToArray(slots, "icon", ctx(), resolveIconNode(props.icon, "icon"));
    const labelNodes = renderSlotToArray(
      slots,
      "label",
      ctx(),
      props.label ?? props.title ?? props.text ?? children
    );
    const noteNodes = renderSlotToArray(
      slots,
      "note",
      ctx(),
      props.note ?? props.subtitle ?? props.caption ?? props.description
    );
    const badgeNodes = renderSlotToArray(
      slots,
      "badge",
      ctx(),
      props.badge ?? props.counter ?? props.count
    );
    const asideNodes = renderSlotToArray(
      slots,
      "aside",
      ctx(),
      props.aside ?? props.trailing ?? resolveIconNode(props.iconRight, "iconRight")
    );
    const defaultNodes = renderSlotToArray(slots, "default", ctx(), props.content ?? props.body);

    const content = _.span({ class: "cms-route-tab-inner" },
      iconNodes.length ? _.span({ class: "cms-route-tab-icon" }, ...iconNodes) : null,
      _.span({ class: "cms-route-tab-copy" },
        _.span({ class: "cms-route-tab-label" }, ...(labelNodes.length ? labelNodes : [getTo() || getHref() || ""])),
        noteNodes.length ? _.span({ class: "cms-route-tab-note" }, ...noteNodes) : null,
        defaultNodes.length ? _.span({ class: "cms-route-tab-extra" }, ...defaultNodes) : null
      ),
      badgeNodes.length ? _.span({ class: "cms-route-tab-badge" }, ...badgeNodes) : null,
      asideNodes.length ? _.span({ class: "cms-route-tab-aside" }, ...asideNodes) : null
    );

    const wrap = _.a(p, content);
    setPropertyProps(wrap, props);

    const syncState = () => {
      const active = getActive();
      const disabled = getDisabled();
      const href = getHref();
      const external = isExternalLink(href);
      wrap.classList.toggle("active", active);
      wrap.classList.toggle("is-disabled", disabled);
      wrap.classList.toggle("is-external", external);
      if (active) wrap.setAttribute("aria-current", String(uiUnwrap(props.ariaCurrent) || "page"));
      else wrap.removeAttribute("aria-current");
      wrap.setAttribute("href", href || "#");
      if (disabled) {
        wrap.setAttribute("aria-disabled", "true");
        wrap.tabIndex = -1;
      } else {
        wrap.removeAttribute("aria-disabled");
        if (!hasOwn("tabIndex") && !hasOwn("tabindex")) wrap.removeAttribute("tabindex");
      }
      if (getTo()) wrap.dataset.to = String(getTo());
      else delete wrap.dataset.to;
      if (external && wrap.target === "_blank" && !wrap.rel) wrap.rel = "noopener noreferrer";
    };

    const userOnClick = props.onClick;
    wrap.onclick = (e) => {
      userOnClick?.(e);
      if (e.defaultPrevented) return;
      if (getDisabled()) {
        e.preventDefault();
        return;
      }
      ctx().navigate(e);
    };

    if (!hasExplicitActive && getTo() && router?.subscribe) {
      router.subscribe(() => syncState());
    }
    CMSwift.reactive.effect(() => {
      syncState();
    }, "UI.RouteTab:render");

    wrap._isActive = () => getActive();
    wrap._setActive = (value) => {
      manualActive = value == null ? null : !!value;
      syncState();
      return wrap;
    };
    wrap._navigate = (event) => ctx().navigate(event);
    return wrap;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.RouteTab = {
      signature: "UI.RouteTab(...children) | UI.RouteTab(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        to: "string",
        href: "string",
        active: "boolean",
        selected: "Alias of active",
        match: "\"exact\"|\"startsWith\"|RegExp|Function|string",
        matchMode: "\"exact\"|\"startsWith\"",
        exact: "boolean",
        startsWith: "boolean",
        note: "String|Node|Function|Array",
        badge: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        aside: "Node|Function|Array",
        variant: "\"line\"|\"pills\"|\"soft\"",
        disabled: "boolean",
        block: "boolean",
        state: "string",
        color: "string",
        slots: "{ icon?, label?, note?, badge?, aside?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        icon: "Leading icon content",
        label: "Main label content",
        note: "Secondary note/caption",
        badge: "Badge / counter area",
        aside: "Trailing visual/action area",
        default: "Extra content under the note"
      },
      events: {
        onClick: "MouseEvent",
        onNavigate: "(to, event)"
      },
      returns: "HTMLAnchorElement con ._isActive(), ._setActive(boolean|null), ._navigate(event?)",
      description: "Standardized tab/link for router or href navigation, with structured slots, states, and badges."
    };
  }
  // Esempio: CMSwift.ui.RouteTab({ label: "Home", to: "/" })

  UI.Breadcrumbs = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const router = CMSwift.router || app?.router || null;
    const model = resolveModel(props.model, "UI.Breadcrumbs:model");
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && CMSwift.uiSizes?.includes(v)) ? `cms-size-${v}` : "";
    });
    const variantClass = uiComputed(props.variant, () => {
      const raw = String(uiUnwrap(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line"))) || "").toLowerCase();
      if (raw === "pill" || raw === "pills") return "variant-pills";
      if (raw === "soft" || raw === "card") return "variant-soft";
      return "variant-line";
    });
    const nowrapClass = uiComputed([props.wrap, props.nowrap], () => {
      return (uiUnwrap(props.wrap) === false || !!uiUnwrap(props.nowrap)) ? "no-wrap" : "";
    });
    const wrap = _.nav({
      class: uiClass([
        "cms-breadcrumbs",
        "cms-clear-set",
        sizeClass,
        variantClass,
        nowrapClass,
        uiWhen(props.dense, "dense"),
        props.class
      ]),
      style: { ...(props.style || {}) },
      role: "navigation",
      "aria-label": props.ariaLabel || "Breadcrumb"
    });
    const beforeEl = _.div({ class: "cms-breadcrumbs-before" });
    const listEl = _.ol({ class: "cms-breadcrumbs-list" });
    const afterEl = _.div({ class: "cms-breadcrumbs-after" });
    wrap.appendChild(beforeEl);
    wrap.appendChild(listEl);
    wrap.appendChild(afterEl);

    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return CMSwift.uiColors?.includes(raw) ? `var(--cms-${raw})` : String(raw);
    };
    const isExternalLink = (entry) => {
      if (!entry) return false;
      if (uiUnwrap(entry.external) === true) return true;
      const href = uiUnwrap(entry.href ?? entry.to);
      if (!href) return false;
      return /^(mailto:|tel:|https?:\/\/|\/\/)/i.test(String(href));
    };
    const cloneIfNode = (value) => {
      if (value?.nodeType && value.cloneNode) return value.cloneNode(true);
      return value;
    };
    const renderInto = (host, nodes) => {
      host.innerHTML = "";
      nodes.forEach((node) => host.appendChild(node));
    };
    const renderNamedSlot = (slotBag, name, ctx, fallback, alias = null) => {
      const primary = CMSwift.ui.getSlot(slotBag, name) != null
        ? renderSlotToArray(slotBag, name, ctx, fallback)
        : [];
      if (primary.length) return primary;
      if (alias && CMSwift.ui.getSlot(slotBag, alias) != null) {
        return renderSlotToArray(slotBag, alias, ctx, fallback);
      }
      return renderSlotToArray(null, "default", ctx, fallback);
    };
    const resolveIconNode = (value, size, as) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return null;
      if (typeof raw === "string") return UI.Icon({ name: raw, size });
      return CMSwift.ui.slot(raw, { as });
    };
    const normalizeItems = () => {
      const source = model ? model.get() : uiUnwrap(props.items ?? props.value ?? props.breadcrumbs);
      const list = [];
      const pushItem = (entry) => {
        if (entry == null || entry === false) return;
        if (Array.isArray(entry)) {
          entry.forEach(pushItem);
          return;
        }
        if (typeof entry === "string" || typeof entry === "number") {
          list.push({ label: String(entry) });
          return;
        }
        if (entry?.nodeType || typeof entry === "function") {
          list.push({ label: entry });
          return;
        }
        list.push(entry);
      };

      const home = uiUnwrap(props.home);
      if (home) {
        pushItem(home === true ? { label: "Home", to: "/", icon: "home" } : home);
      }
      pushItem(source);
      if (!list.length && children?.length) {
        children.forEach((child) => pushItem(child));
      }
      return list.filter((item) => !uiUnwrap(item?.hidden));
    };
    const getCurrentIndex = (items) => {
      const explicitIndex = items.findIndex((item) => !!uiUnwrap(item?.current ?? item?.active ?? item?.selected));
      if (explicitIndex > -1) return explicitIndex;
      return uiUnwrap(props.autoCurrent) === false ? -1 : (items.length ? items.length - 1 : -1);
    };
    const collapseItems = (items) => {
      const maxRaw = Number(uiUnwrap(props.max ?? props.maxItems ?? props.collapseAfter ?? props.collapse));
      const max = Number.isFinite(maxRaw) ? Math.max(0, Math.trunc(maxRaw)) : 0;
      if (!max || max < 3 || items.length <= max) {
        return items.map((item, index) => ({ type: "item", item, index, key: `item-${index}` }));
      }

      let leading = Number(uiUnwrap(props.leadingCount ?? props.keepStart ?? 1));
      let trailing = Number(uiUnwrap(props.trailingCount ?? props.keepEnd ?? Math.max(1, max - 2)));
      leading = Number.isFinite(leading) ? Math.max(1, Math.trunc(leading)) : 1;
      trailing = Number.isFinite(trailing) ? Math.max(1, Math.trunc(trailing)) : Math.max(1, max - 2);
      if (leading + trailing + 1 > max) {
        trailing = Math.max(1, max - leading - 1);
        if (leading + trailing + 1 > max) leading = Math.max(1, max - trailing - 1);
      }
      if (leading + trailing >= items.length) {
        return items.map((item, index) => ({ type: "item", item, index, key: `item-${index}` }));
      }

      const entries = [];
      for (let i = 0; i < leading; i++) {
        entries.push({ type: "item", item: items[i], index: i, key: `item-${i}` });
      }
      const hiddenItems = items.slice(leading, items.length - trailing);
      entries.push({
        type: "collapsed",
        key: `collapsed-${leading}-${items.length - trailing}`,
        items: hiddenItems,
        from: leading,
        to: items.length - trailing - 1
      });
      for (let i = items.length - trailing; i < items.length; i++) {
        entries.push({ type: "item", item: items[i], index: i, key: `item-${i}` });
      }
      return entries;
    };
    const navigateItem = (item, event = null) => {
      if (!item) return false;
      const href = uiUnwrap(item.href ?? item.to) || "";
      const to = uiUnwrap(item.to) || "";
      if (!isExternalLink(item) && to && router?.navigate) {
        if (event?.preventDefault) event.preventDefault();
        router.navigate(to);
        item.onNavigate?.(to, event || null);
        props.onNavigate?.(to, item, event || null);
        return true;
      }
      item.onNavigate?.(to || href, event || null);
      props.onNavigate?.(to || href, item, event || null);
      return false;
    };
    const createSeparator = (entry, index, total) => {
      const prev = entry;
      const next = total[index + 1] || null;
      const ctx = { index, entry, previous: prev, next };
      const fallback = cloneIfNode(uiUnwrap((entry?.type === "item" ? entry.item?.separator : null) ?? props.separator ?? "/"));
      const nodes = renderNamedSlot(slots, "separator", ctx, fallback);
      return _.li({ class: "cms-breadcrumbs-separator-item", "aria-hidden": "true" },
        _.span({ class: "cms-breadcrumbs-separator" }, ...nodes)
      );
    };
    const createCollapsedEntry = (entry, items, currentIndex) => {
      const ctx = {
        type: "collapsed",
        collapsed: true,
        items,
        hiddenItems: entry.items,
        currentIndex,
        from: entry.from,
        to: entry.to
      };
      const fallback = _.span({ class: "cms-breadcrumb cms-breadcrumb-collapsed" },
        _.span({ class: "cms-breadcrumb-inner" },
          _.span({ class: "cms-breadcrumb-copy" },
            _.span({ class: "cms-breadcrumb-label" }, String(uiUnwrap(props.collapsedLabel) || "…"))
          )
        )
      );
      const nodes = renderNamedSlot(slots, "collapsed", ctx, fallback, "item");
      return _.li({ class: "cms-breadcrumbs-entry is-collapsed" }, ...nodes);
    };
    const createItemEntry = (entry, items, currentIndex, visibleIndex) => {
      const item = entry.item || {};
      const slotBag = item.slots ? { ...slots, ...item.slots } : slots;
      const href = uiUnwrap(item.href ?? item.to) || "";
      const disabled = !!uiUnwrap(item.disabled);
      const current = entry.index === currentIndex;
      const iconSize = item.iconSize ?? props.itemSize ?? props.size ?? null;
      const accent = resolveAccent(item.color ?? item.state ?? props.color ?? props.state);
      const state = !uiUnwrap(item.color) && uiUnwrap(item.state)
        ? normalizeState(uiUnwrap(item.state))
        : "";
      const labelFallback = item.label ?? item.title ?? item.text ?? item.to ?? item.href ?? "";
      const noteFallback = item.note ?? item.subtitle ?? item.caption ?? item.description;
      const badgeFallback = item.badge ?? item.counter ?? item.count;
      const asideFallback = item.aside ?? item.trailing ?? resolveIconNode(item.iconRight, iconSize, "iconRight");
      const defaultFallback = item.content ?? item.body;
      const ctx = {
        item,
        index: entry.index,
        visibleIndex,
        total: items.length,
        current,
        active: current,
        disabled,
        href,
        to: uiUnwrap(item.to) || "",
        external: isExternalLink(item),
        isFirst: entry.index === 0,
        isLast: entry.index === items.length - 1,
        navigate: (event) => navigateItem(item, event)
      };

      const iconNodes = renderNamedSlot(slotBag, "icon", ctx, resolveIconNode(item.icon, iconSize, "icon"));
      const labelNodes = renderNamedSlot(slotBag, "label", ctx, labelFallback);
      const noteNodes = renderNamedSlot(slotBag, "note", ctx, noteFallback);
      const badgeNodes = renderNamedSlot(slotBag, "badge", ctx, badgeFallback);
      const asideNodes = renderNamedSlot(slotBag, "aside", ctx, asideFallback);
      const defaultNodes = renderNamedSlot(slotBag, "default", ctx, defaultFallback);

      const content = _.span({ class: "cms-breadcrumb-inner" },
        iconNodes.length ? _.span({ class: "cms-breadcrumb-icon" }, ...iconNodes) : null,
        _.span({ class: "cms-breadcrumb-copy" },
          _.span({ class: "cms-breadcrumb-label" }, ...(labelNodes.length ? labelNodes : [href || ""])),
          noteNodes.length ? _.span({ class: "cms-breadcrumb-note" }, ...noteNodes) : null,
          defaultNodes.length ? _.span({ class: "cms-breadcrumb-extra" }, ...defaultNodes) : null
        ),
        badgeNodes.length ? _.span({ class: "cms-breadcrumb-badge" }, ...badgeNodes) : null,
        asideNodes.length ? _.span({ class: "cms-breadcrumb-aside" }, ...asideNodes) : null
      );

      const interactive = !disabled && (!current || !!uiUnwrap(item.linkCurrent ?? props.linkCurrent));
      const sharedProps = {
        class: uiClass([
          "cms-breadcrumb",
          "cms-clear-set",
          "cms-singularity",
          uiWhen(current, "is-current"),
          uiWhen(current, "active"),
          uiWhen(disabled, "is-disabled"),
          state ? `cms-state-${state}` : "",
          item.class
        ]),
        style: {
          ...(item.style || {})
        },
        "aria-current": current ? String(uiUnwrap(item.ariaCurrent ?? props.ariaCurrent) || "page") : null
      };
      if (accent) sharedProps.style["--cms-breadcrumb-accent"] = accent;

      let node = null;
      if (interactive && href) {
        node = _.a({
          ...sharedProps,
          href,
          target: item.target,
          rel: item.rel,
          onClick: (event) => {
            item.onClick?.(event, ctx);
            props.onItemClick?.(item, ctx, event);
            if (event.defaultPrevented) return;
            ctx.navigate(event);
          }
        }, content);
        if (ctx.external && node.target === "_blank" && !node.rel) node.rel = "noopener noreferrer";
      } else if (interactive && typeof item.onClick === "function") {
        node = _.button({
          ...sharedProps,
          type: item.type || "button",
          onClick: (event) => {
            item.onClick?.(event, ctx);
            props.onItemClick?.(item, ctx, event);
          }
        }, content);
      } else {
        node = _.span({
          ...sharedProps,
          "aria-disabled": disabled ? "true" : null
        }, content);
      }

      setPropertyProps(node, {
        size: item.size ?? props.itemSize ?? props.size,
        radius: item.radius ?? props.radius,
        gradient: item.gradient ?? props.gradient
      });

      const fallback = node;
      const rendered = renderNamedSlot(slotBag, "item", ctx, fallback);
      return _.li({
        class: uiClass([
          "cms-breadcrumbs-entry",
          uiWhen(current, "is-current"),
          uiWhen(disabled, "is-disabled")
        ])
      }, ...rendered);
    };
    const render = () => {
      const items = normalizeItems();
      const currentIndex = getCurrentIndex(items);
      const visibleItems = collapseItems(items);
      const accent = resolveAccent(props.color ?? props.state);
      wrap.classList.toggle("is-empty", items.length === 0);
      if (accent) wrap.style.setProperty("--cms-breadcrumb-accent", accent);
      else wrap.style.removeProperty("--cms-breadcrumb-accent");

      const rootCtx = {
        items,
        visibleItems,
        currentIndex,
        count: items.length,
        collapsed: visibleItems.some((entry) => entry.type === "collapsed")
      };
      renderInto(beforeEl, renderNamedSlot(slots, "before", rootCtx, props.before));
      renderInto(afterEl, renderNamedSlot(slots, "after", rootCtx, props.after));

      listEl.innerHTML = "";
      if (!items.length) {
        const emptyNodes = renderNamedSlot(slots, "empty", rootCtx, props.empty);
        if (emptyNodes.length) listEl.appendChild(_.li({ class: "cms-breadcrumbs-entry is-empty" }, ...emptyNodes));
        return;
      }

      visibleItems.forEach((entry, visibleIndex) => {
        if (visibleIndex > 0) listEl.appendChild(createSeparator(visibleItems[visibleIndex - 1], visibleIndex - 1, visibleItems));
        listEl.appendChild(
          entry.type === "collapsed"
            ? createCollapsedEntry(entry, items, currentIndex)
            : createItemEntry(entry, items, currentIndex, visibleIndex)
        );
      });
    };

    app.reactive.effect(() => {
      render();
    }, "UI.Breadcrumbs:render");

    wrap.getItems = () => normalizeItems();
    wrap.getVisibleItems = () => collapseItems(normalizeItems());
    wrap.refresh = () => {
      render();
      return wrap;
    };
    wrap.setItems = (next) => {
      if (model) model.set(next);
      else props.items = next;
      render();
      return wrap;
    };
    setPropertyProps(wrap, props);
    return wrap;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Breadcrumbs = {
      signature: "UI.Breadcrumbs(props)",
      props: {
        items: "Array<string|number|Node|Function|{ label?, to?, href?, icon?, note?, badge?, current?, disabled?, hidden?, slots? }>",
        model: "[get,set] signal|Array",
        home: "boolean|Object",
        separator: "string|Node|Function",
        before: "Node|Function|Array",
        after: "Node|Function|Array",
        empty: "Node|Function|Array",
        variant: "\"line\"|\"pills\"|\"soft\"",
        max: "number",
        leadingCount: "number",
        trailingCount: "number",
        dense: "boolean",
        wrap: "boolean",
        nowrap: "boolean",
        linkCurrent: "boolean",
        color: "string",
        state: "string",
        itemSize: "string|number",
        ariaLabel: "string",
        class: "string",
        style: "object"
      },
      slots: {
        before: "Content before breadcrumb list",
        after: "Content after breadcrumb list",
        item: "Full renderer for a breadcrumb entry",
        icon: "Leading icon for each breadcrumb",
        label: "Main breadcrumb label",
        note: "Secondary line for the breadcrumb",
        badge: "Badge/counter area",
        aside: "Trailing area",
        default: "Extra content under note",
        separator: "Separator renderer",
        collapsed: "Renderer for collapsed middle items",
        empty: "Renderer for empty state"
      },
      events: {
        onItemClick: "(item, ctx, event)",
        onNavigate: "(toOrHref, item, event)"
      },
      returns: "HTMLElement <nav> con .getItems(), .getVisibleItems(), .refresh(), .setItems(items)",
      description: "Breadcrumbs standardizzati con item strutturati, slot completi, collapse automatico e supporto a link/router."
    };
  }
  // Esempio: CMSwift.ui.Breadcrumbs({ items: [{ label: "Home", to: "/" }, { label: "Pagina" }] })

  UI.Pagination = (...args) => {
    const { props } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const model = resolveModel(props.model, "UI.Pagination:model");
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? `cms-size-${v}` : "";
    });
    const wrap = _.nav({
      class: uiClass([
        "cms-pagination",
        "cms-clear-set",
        sizeClass,
        uiWhen(props.dense, "dense"),
        uiWhen(props.simple, "is-simple"),
        uiWhen(props.disabled, "is-disabled"),
        props.class
      ]),
      style: { ...(props.style || {}) },
      role: "navigation",
      "aria-label": props.ariaLabel || "Pagination"
    });
    const controls = _.div({ class: "cms-pagination-controls" });
    const startGroup = _.div({ class: "cms-pagination-start" });
    const pagesGroup = _.div({ class: "cms-pagination-pages" });
    const endGroup = _.div({ class: "cms-pagination-end" });
    const summary = _.div({ class: "cms-pagination-summary" });

    controls.appendChild(startGroup);
    controls.appendChild(pagesGroup);
    controls.appendChild(endGroup);
    wrap.appendChild(controls);
    wrap.appendChild(summary);

    let currentPage = 1;
    let currentPages = 1;

    const toInt = (value, fallback = 0) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return fallback;
      const n = Number(raw);
      if (!Number.isFinite(n)) return fallback;
      return Math.trunc(n);
    };
    const clampPage = (page, pages = getPages()) => {
      const raw = Number(page);
      const next = Number.isFinite(raw) ? Math.trunc(raw) : 1;
      return Math.min(Math.max(next || 1, 1), Math.max(1, pages || 1));
    };
    const getPages = () => {
      const explicit = toInt(props.max ?? props.pages ?? props.pageCount ?? props.totalPages, 0);
      if (explicit > 0) return explicit;
      const total = toInt(props.total ?? props.totalItems ?? props.count, 0);
      const pageSize = toInt(props.pageSize ?? props.perPage ?? props.limit, 0);
      if (total >= 0 && pageSize > 0) return Math.max(1, Math.ceil(total / pageSize));
      return 1;
    };
    const getRequestedPage = () => {
      if (model) return toInt(model.get(), 1);
      return toInt(props.page ?? props.value ?? props.current ?? props.currentPage, 1);
    };
    const getSiblingCount = () => Math.max(0, toInt(props.siblings ?? props.siblingCount ?? props.window, 1));
    const getBoundaryCount = () => Math.max(0, toInt(props.boundaryCount ?? props.boundaries ?? props.edges, 1));
    const isDisabled = () => !!uiUnwrap(props.disabled);
    const showSummary = () => uiUnwrap(props.showSummary ?? props.showLabel) !== false;
    const showNumbers = () => uiUnwrap(props.showPages) !== false && !uiUnwrap(props.simple);
    const showPrev = () => uiUnwrap(props.showPrev) !== false;
    const showNext = () => uiUnwrap(props.showNext) !== false;
    const showEdges = () => !!uiUnwrap(props.showEdges);
    const showFirst = () => {
      const value = uiUnwrap(props.showFirst);
      return value == null ? showEdges() : !!value;
    };
    const showLast = () => {
      const value = uiUnwrap(props.showLast);
      return value == null ? showEdges() : !!value;
    };
    const hideOnSinglePage = () => !!uiUnwrap(props.hideOnSinglePage);
    const getTotal = () => {
      const total = uiUnwrap(props.total ?? props.totalItems ?? props.count);
      if (total == null || total === "") return null;
      const n = Number(total);
      return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : null;
    };
    const getPageSize = () => {
      const pageSize = uiUnwrap(props.pageSize ?? props.perPage ?? props.limit);
      if (pageSize == null || pageSize === "") return null;
      const n = Number(pageSize);
      return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
    };
    const getCtx = (page = currentPage, pages = currentPages) => {
      const total = getTotal();
      const pageSize = getPageSize();
      const from = total != null && pageSize ? (total === 0 ? 0 : ((page - 1) * pageSize) + 1) : null;
      const to = total != null && pageSize ? Math.min(total, page * pageSize) : null;
      return {
        page,
        value: page,
        current: page,
        currentPage: page,
        pages,
        max: pages,
        total,
        pageSize,
        from,
        to,
        disabled: isDisabled(),
        isFirst: page <= 1,
        isLast: page >= pages,
        canPrev: page > 1,
        canNext: page < pages,
        setPage: (nextPage, event) => commitPage(nextPage, event),
        prev: (event) => commitPage(page - 1, event),
        next: (event) => commitPage(page + 1, event),
        first: (event) => commitPage(1, event),
        last: (event) => commitPage(pages, event)
      };
    };
    const buildItems = (page, pages) => {
      if (pages <= 0) return [];
      const items = [];
      const included = new Set();
      const boundary = getBoundaryCount();
      const siblings = getSiblingCount();

      for (let i = 1; i <= Math.min(boundary, pages); i++) included.add(i);
      for (let i = Math.max(1, page - siblings); i <= Math.min(pages, page + siblings); i++) included.add(i);
      for (let i = Math.max(1, pages - boundary + 1); i <= pages; i++) included.add(i);

      let last = 0;
      for (let i = 1; i <= pages; i++) {
        if (!included.has(i)) continue;
        if (last && i - last > 1) items.push({ type: "ellipsis", key: `ellipsis-${last}-${i}` });
        items.push({ type: "page", page: i, key: `page-${i}` });
        last = i;
      }
      if (!items.length) items.push({ type: "page", page: 1, key: "page-1" });
      return items;
    };
    const renderNamedSlot = (name, fallback, ctx, alias = null) => {
      const primary = CMSwift.ui.getSlot(slots, name) != null
        ? renderSlotToArray(slots, name, ctx, fallback)
        : [];
      if (primary.length) return primary;
      if (alias && CMSwift.ui.getSlot(slots, alias) != null) {
        return renderSlotToArray(slots, alias, ctx, fallback);
      }
      return renderSlotToArray(null, "default", ctx, fallback);
    };
    const renderInto = (host, nodes) => {
      host.innerHTML = "";
      nodes.forEach((node) => host.appendChild(node));
    };
    const createButton = (name, fallback, onClick, options = {}) => {
      const ctx = { ...getCtx(), kind: name, active: !!options.active };
      return UI.Btn({
        class: uiClass([
          "cms-pagination-btn",
          `cms-pagination-${name}`,
          uiWhen(options.active, "active"),
          options.class
        ]),
        size: props.itemSize || props.size || (props.dense ? "sm" : "md"),
        color: options.active ? (props.color || props.state || "primary") : (options.color || null),
        outline: options.active ? false : (options.outline ?? true),
        disabled: isDisabled() || !!options.disabled,
        "aria-current": options.active ? "page" : null,
        onClick: (event) => {
          if (isDisabled() || options.disabled) return;
          onClick?.(event);
        }
      }, ...renderNamedSlot(name, fallback, ctx, name === "summary" ? "label" : (name === "page" ? "item" : null)));
    };
    const render = (page, pages) => {
      currentPage = clampPage(page, pages);
      currentPages = Math.max(1, pages || 1);
      const ctx = getCtx(currentPage, currentPages);

      wrap.style.display = hideOnSinglePage() && currentPages <= 1 ? "none" : "";
      summary.style.display = showSummary() ? "" : "none";
      pagesGroup.style.display = showNumbers() ? "" : "none";

      startGroup.innerHTML = "";
      pagesGroup.innerHTML = "";
      endGroup.innerHTML = "";

      const startNodes = renderNamedSlot("start", props.start, ctx);
      if (startNodes.length) {
        startGroup.appendChild(_.div({ class: "cms-pagination-extra cms-pagination-extra-start" }, ...startNodes));
      }

      if (showFirst()) {
        startGroup.appendChild(createButton("first", "«", (event) => commitPage(1, event), {
          disabled: currentPage <= 1
        }));
      }
      if (showPrev()) {
        startGroup.appendChild(createButton("prev", "Prev", (event) => commitPage(currentPage - 1, event), {
          disabled: currentPage <= 1
        }));
      }

      if (showNumbers()) {
        buildItems(currentPage, currentPages).forEach((item) => {
          if (item.type === "ellipsis") {
            const ellipsisCtx = { ...ctx, kind: "ellipsis" };
            const ellipsisNodes = renderNamedSlot("ellipsis", "…", ellipsisCtx);
            pagesGroup.appendChild(_.span({ class: "cms-pagination-ellipsis", "aria-hidden": "true" }, ...ellipsisNodes));
            return;
          }
          const itemPage = item.page;
          const itemCtx = { ...ctx, page: itemPage, value: itemPage, item, active: itemPage === currentPage };
          pagesGroup.appendChild(UI.Btn({
            class: uiClass([
              "cms-pagination-btn",
              "cms-pagination-page-btn",
              uiWhen(itemPage === currentPage, "active")
            ]),
            size: props.itemSize || props.size || (props.dense ? "sm" : "md"),
            color: itemPage === currentPage ? (props.color || props.state || "primary") : null,
            outline: itemPage === currentPage ? false : true,
            disabled: isDisabled(),
            "aria-current": itemPage === currentPage ? "page" : null,
            onClick: (event) => commitPage(itemPage, event)
          }, ...renderNamedSlot("page", String(itemPage), itemCtx, "item")));
        });
      }

      if (showNext()) {
        endGroup.appendChild(createButton("next", "Next", (event) => commitPage(currentPage + 1, event), {
          disabled: currentPage >= currentPages
        }));
      }
      if (showLast()) {
        endGroup.appendChild(createButton("last", "»", (event) => commitPage(currentPages, event), {
          disabled: currentPage >= currentPages
        }));
      }

      const endNodes = renderNamedSlot("end", props.end, ctx);
      if (endNodes.length) {
        endGroup.appendChild(_.div({ class: "cms-pagination-extra cms-pagination-extra-end" }, ...endNodes));
      }

      let summaryText = `Pagina ${currentPage} di ${currentPages}`;
      if (ctx.total != null && ctx.pageSize) {
        summaryText = ctx.total === 0
          ? "0 risultati"
          : `${ctx.from}-${ctx.to} di ${ctx.total}`;
      }
      renderInto(summary, renderNamedSlot("summary", summaryText, ctx, "label"));
    };
    const commitPage = (page, event = null) => {
      const pages = getPages();
      const nextPage = clampPage(page, pages);
      if (nextPage === currentPage && pages === currentPages) return nextPage;
      render(nextPage, pages);
      if (model && model.get() !== nextPage) model.set(nextPage);
      props.onChange?.(nextPage, getCtx(nextPage, pages), event);
      props.onPageChange?.(nextPage, getCtx(nextPage, pages), event);
      return nextPage;
    };

    app.reactive.effect(() => {
      const pages = getPages();
      const requested = getRequestedPage();
      const nextPage = clampPage(requested, pages);
      render(nextPage, pages);
      if (model && requested !== nextPage) model.set(nextPage);
    }, "UI.Pagination:sync");

    wrap.getPage = () => currentPage;
    wrap.getPages = () => currentPages;
    wrap.setPage = (page) => commitPage(page);
    wrap.prev = () => commitPage(currentPage - 1);
    wrap.next = () => commitPage(currentPage + 1);
    wrap.first = () => commitPage(1);
    wrap.last = () => commitPage(currentPages);
    setPropertyProps(wrap, props);
    return wrap;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Pagination = {
      signature: "UI.Pagination(props)",
      props: {
        max: "number",
        pages: "number",
        total: "number",
        pageSize: "number",
        value: "number",
        page: "number",
        model: "[get,set] signal",
        showPages: "boolean",
        showSummary: "boolean",
        showLabel: "boolean",
        showPrev: "boolean",
        showNext: "boolean",
        showFirst: "boolean",
        showLast: "boolean",
        showEdges: "boolean",
        siblings: "number",
        boundaryCount: "number",
        hideOnSinglePage: "boolean",
        size: "xxs|xs|sm|md|lg|xl|xxl|xxxl",
        dense: "boolean",
        simple: "boolean",
        color: "primary|secondary|warning|danger|success|info|light|dark",
        state: "primary|secondary|warning|danger|success|info|light|dark",
        slots: "{ start?, end?, first?, prev?, page?, item?, ellipsis?, next?, last?, summary?, label? }",
        class: "string",
        style: "object"
      },
      slots: {
        start: "Content before the controls",
        end: "Content after the controls",
        first: "First button content",
        prev: "Prev button content",
        page: "Page item content (ctx: { page, active, pages })",
        item: "Alias of page",
        ellipsis: "Ellipsis content",
        next: "Next button content",
        last: "Last button content",
        summary: "Summary content",
        label: "Alias legacy di summary"
      },
      events: {
        onChange: "(page, ctx, event)",
        onPageChange: "(page, ctx, event)"
      },
      returns: "HTMLElement <nav>",
      description: "Paginazione standard con controlli edge, numeri, ellissi, summary e supporto total/pageSize."
    };
  }
  // Esempio: CMSwift.ui.Pagination({ total: 120, pageSize: 12, model: [get,set], showEdges: true })

  UI.Spinner = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
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

    const p = CMSwift.omit(props, [
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
  if (CMSwift.isDev?.()) {
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
  // Esempio: CMSwift.ui.Spinner({ size: 24 })

  UI.Progress = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
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

    const [getValue, setValue] = CMSwift.reactive.signal(normalizeValue(
      model ? model.get() : (uiUnwrap(props.value) ?? uiUnwrap(props.min) ?? 0)
    ));
    const [getBuffer, setBuffer] = CMSwift.reactive.signal(clampBuffer(
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

    const wrapProps = CMSwift.omit(props, [
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
      const outsideValueNodes = (showValue === true || props.valueLabel != null || CMSwift.ui.getSlot(slots, "value") != null)
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
      const insideNodes = (showValue === "inside" || props.insideLabel != null || CMSwift.ui.getSlot(slots, "inside") != null)
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
        else if (typeof customRadius === "string" && CMSwift.uiSizes.includes(customRadius)) wrap.style.setProperty("--cms-progress-radius", `var(--cms-r-${customRadius})`);
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
      CMSwift.reactive.effect(() => {
        setProgressValue(uiUnwrap(props.value), { fromModel: true });
      }, "UI.Progress:value");
    } else {
      setProgressValue(props.value ?? props.min ?? 0, { fromModel: true });
    }

    if (uiIsReactive(props.buffer)) {
      CMSwift.reactive.effect(() => {
        setProgressBuffer(uiUnwrap(props.buffer));
      }, "UI.Progress:buffer");
    } else {
      setProgressBuffer(props.buffer ?? props.value ?? props.min ?? 0);
    }

    CMSwift.reactive.effect(() => {
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
  if (CMSwift.isDev?.()) {
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
  // Esempio: CMSwift.ui.Progress({ value: 45 })

  UI.LoadingBar = function LoadingBar(...args) {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
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
    const [getValue, setValueSignal] = CMSwift.reactive.signal(clampValue(initialValue));
    const [getBuffer, setBufferSignal] = CMSwift.reactive.signal(Math.max(clampValue(initialBuffer), clampValue(initialValue)));
    const [getVisible, setVisibleSignal] = CMSwift.reactive.signal(
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

    const shellProps = CMSwift.omit(props, [
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

    const progressProps = CMSwift.omit(props, [
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
      CMSwift.reactive.effect(() => {
        const next = clampValue(uiUnwrap(props.value));
        syncValue(next, { fromExternal: true });
        showIfNeeded(next);
      }, "UI.LoadingBar:value");
    }

    if (bufferModel) {
      bufferModel.watch((value) => { syncBuffer(value, { fromExternal: true }); }, "UI.LoadingBar:bufferWatch");
    } else if (uiIsReactive(props.buffer)) {
      CMSwift.reactive.effect(() => {
        syncBuffer(uiUnwrap(props.buffer), { fromExternal: true });
      }, "UI.LoadingBar:buffer");
    }

    CMSwift.reactive.effect(() => {
      const min = getMin();
      const max = getMax();
      const current = Math.min(max, Math.max(min, getValue()));
      const bufferCurrent = Math.max(current, Math.min(max, Math.max(min, getBuffer())));
      if (current !== getValue()) setValueSignal(current);
      if (bufferCurrent !== getBuffer()) setBufferSignal(bufferCurrent);
    }, "UI.LoadingBar:range");

    CMSwift.reactive.effect(() => {
      if (props.visible == null) return;
      syncVisibility(uiUnwrap(props.visible), { fromExternal: true });
    }, "UI.LoadingBar:visible");

    CMSwift.reactive.effect(() => {
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
  if (CMSwift.isDev?.()) {
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
  // Esempio: const lb = CMSwift.ui.LoadingBar({ autoStart: true }); lb.done();

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
      const { props, children } = CMSwift.uiNormalizeArgs(args);
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
  if (CMSwift.isDev?.()) {
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


UI.Header = (...args) => {
  const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };
  applyCommonProps(props);

  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(rawProps, key);
  const currentStateKey = rawProps.drawerStateKey ?? drawerStateKey;
  if (currentStateKey) {
    drawerStateKey = currentStateKey;
    drawerOpen = readDrawerOpen(currentStateKey);
  }

  const isDrawerOpen = () => readDrawerOpen(currentStateKey);
  const openDrawer = () => setDrawerOpen(true, currentStateKey);
  const closeDrawer = () => setDrawerOpen(false, currentStateKey);
  const toggleDrawer = () => setDrawerOpen(!isDrawerOpen(), currentStateKey);
  const ctx = {
    props: rawProps,
    stateKey: currentStateKey,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    toggleAside: toggleDrawer
  };
  const appendResolvedValue = (host, value) => {
    if (value == null || value === false) return;
    if (Array.isArray(value)) {
      value.forEach((item) => appendResolvedValue(host, item));
      return;
    }
    if (value?.nodeType) {
      host.appendChild(value);
      return;
    }
    host.appendChild(document.createTextNode(String(value)));
  };
  const renderPropNodes = (name, fallback, map = (value) => value) => {
    const slot = CMSwift.ui.getSlot(slots, name);
    if (slot !== null && slot !== undefined) {
      return renderSlotToArray(slots, name, ctx, null);
    }
    if (typeof fallback === "function") {
      const inlineNames = new Set(["eyebrow", "title", "subtitle"]);
      const host = _[inlineNames.has(name) ? "span" : "div"]({ class: `cms-header-slot-${name}` });
      CMSwift.reactive.effect(() => {
        const nextValue = map(fallback(ctx));
        const normalized = flattenSlotValue(CMSwift.ui.slot(nextValue));
        host.replaceChildren();
        if (Array.isArray(normalized)) normalized.forEach((item) => appendResolvedValue(host, item));
        else appendResolvedValue(host, normalized);
      }, `UI.Header:${name}`);
      return [host];
    }
    return renderSlotToArray(slots, name, ctx, map(fallback));
  };

  const renderIconValue = (value, as = "icon", sizeFallback = rawProps.iconSize || rawProps.size || "md") => {
    if (value == null || value === false) return null;
    if (typeof value === "string") return UI.Icon({ name: value, size: sizeFallback });
    return CMSwift.ui.slot(value, { as });
  };
  const renderDrawerToggleValue = (open) => {
    const value = open ? (rawProps.drawerOpenIcon ?? "✕") : (rawProps.drawerCloseIcon ?? "☰");
    if (value == null || value === false) return null;
    if (typeof value === "string") return value;
    return CMSwift.ui.slot(value, { as: open ? "drawerOpenIcon" : "drawerCloseIcon" });
  };

  const toggleIconHost = _.span({ class: "cms-header-toggle-icon" });
  const paintToggleIcon = (open) => {
    const nodes = renderSlotToArray(null, "default", ctx, renderDrawerToggleValue(open));
    toggleIconHost.replaceChildren(...(nodes.length ? nodes : [""]));
  };
  paintToggleIcon(isDrawerOpen());

  const autoLeft = UI.Btn({
    class: "cms-header-toggle",
    outline: true,
    size: rawProps.toggleSize ?? rawProps.size ?? "sm",
    onClick: toggleDrawer,
    "aria-label": rawProps.toggleLabel || "Toggle navigation"
  }, toggleIconHost);
  if (rawProps.left == null && rawProps.left !== false && !CMSwift.ui.getSlot(slots, "left")) {
    drawerToggleIcons.add({ update: paintToggleIcon });
  }

  const leftFallback = rawProps.left === false
    ? null
    : (rawProps.left != null ? rawProps.left : autoLeft);
  const titleFallback = hasOwn("title") ? rawProps.title : (rawProps.label ?? "App");
  const subtitleFallback = rawProps.subtitle ?? rawProps.description ?? "";
  const rightFallback = hasOwn("right") ? rawProps.right : rawProps.end;
  const contentFallback = hasOwn("content")
    ? rawProps.content
    : (hasOwn("body") ? rawProps.body : (children?.length ? children : null));

  const startNodes = [
    ...renderPropNodes("left", leftFallback),
    ...renderPropNodes("start", null)
  ];
  const iconNodes = renderPropNodes("icon", rawProps.icon, renderIconValue);
  const eyebrowNodes = renderPropNodes("eyebrow", rawProps.eyebrow ?? rawProps.kicker);
  const titleNodes = renderPropNodes("title", titleFallback);
  const subtitleNodes = renderPropNodes("subtitle", subtitleFallback);
  const metaNodes = renderPropNodes("meta", rawProps.meta);
  const contentNodes = (() => {
    const explicit = renderPropNodes("content", null);
    return explicit.length ? explicit : renderPropNodes("default", contentFallback);
  })();
  const customCenterNodes = [
    ...renderPropNodes("center", null),
    ...renderPropNodes("body", null)
  ];
  const rightNodes = [
    ...renderPropNodes("right", rightFallback),
    ...renderPropNodes("end", null)
  ];
  const actionNodes = renderPropNodes("actions", rawProps.actions);

  const structuredCenter = _.div(
    { class: uiClass(["cms-header-body", rawProps.bodyClass, rawProps.centerClass]) },
    _.div(
      { class: "cms-header-heading" },
      iconNodes.length ? _.div({ class: "cms-header-icon" }, ...iconNodes) : null,
      _.div(
        { class: "cms-header-copy" },
        eyebrowNodes.length ? _.div({ class: uiClass(["cms-header-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
        titleNodes.length ? _.div({ class: uiClass(["cms-header-title", rawProps.titleClass]) }, ...titleNodes) : null,
        subtitleNodes.length ? _.div({ class: uiClass(["cms-header-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
        contentNodes.length ? _.div({ class: uiClass(["cms-header-content", rawProps.contentClass]) }, ...contentNodes) : null
      ),
      metaNodes.length ? _.div({ class: uiClass(["cms-header-meta", rawProps.metaClass]) }, ...metaNodes) : null
    )
  );

  const endContent = [
    ...rightNodes,
    ...(actionNodes.length ? [_.div({ class: uiClass(["cms-header-actions", rawProps.actionsClass]) }, ...actionNodes)] : [])
  ];

  const p = CMSwift.omit(props, [
    "actions", "actionsClass", "body", "bodyClass", "centerClass", "content", "contentClass",
    "description", "divider", "drawerCloseIcon", "drawerOpenIcon", "drawerStateKey", "elevated",
    "end", "eyebrow", "eyebrowClass", "icon", "iconSize", "kicker", "label", "left", "meta",
    "metaClass", "right", "slots", "stack", "sticky", "subtitle", "subtitleClass", "title",
    "titleClass", "toggleLabel", "toggleSize", "gap", "minHeight", "startClass", "endClass"
  ]);
  p.class = uiClass([
    "cms-panel",
    "cms-header",
    "cms-singularity",
    uiWhen(rawProps.sticky !== false, "sticky"),
    uiWhen(rawProps.stack, "stack"),
    uiWhen(rawProps.elevated, "elevated"),
    uiWhen(rawProps.divider !== false, "divider"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };
  if (rawProps.gap != null) p.style["--cms-header-gap"] = toCssSize(uiUnwrap(rawProps.gap));
  if (rawProps.minHeight != null) p.style.minHeight = toCssSize(uiUnwrap(rawProps.minHeight));

  const el = _.div(
    p,
    ...(startNodes.length ? [_.div({ class: uiClass(["cms-header-start", rawProps.startClass]) }, ...startNodes)] : []),
    _.div(
      { class: "cms-header-main" },
      ...(customCenterNodes.length
        ? [_.div({ class: uiClass(["cms-header-body", rawProps.bodyClass, rawProps.centerClass]) }, ...customCenterNodes)]
        : [structuredCenter]),
      ...(endContent.length ? [_.div({ class: uiClass(["cms-header-end", rawProps.endClass]) }, ...endContent)] : [])
    )
  );

  setPropertyProps(el, rawProps);
  return el;
};
if (CMSwift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.Header = {
    signature: "UI.Header(...children) | UI.Header(props, ...children)",
    props: {
      title: "String|Node|Function|Array",
      subtitle: "String|Node|Function|Array",
      eyebrow: "String|Node|Function|Array",
      content: "Node|Function|Array",
      meta: "Node|Function|Array",
      icon: "String|Node|Function|Array",
      left: "Node|Function|Array|false",
      right: "Node|Function|Array",
      actions: "Node|Function|Array",
      drawerOpenIcon: "string|Node",
      drawerCloseIcon: "string|Node",
      drawerStateKey: "string",
      sticky: "boolean",
      stack: "boolean",
      dense: "boolean",
      elevated: "boolean",
      divider: "boolean",
      gap: "string|number",
      minHeight: "string|number",
      slots: "{ left?, start?, right?, end?, center?, body?, icon?, eyebrow?, title?, subtitle?, meta?, content?, actions? }",
      class: "string",
      style: "object"
    },
    slots: {
      left: "Left area, falls back to the drawer toggle",
      start: "Alias/addon for the left area",
      right: "Main right area",
      end: "Alias/addon for the right area",
      center: "Full override for the central body",
      body: "Alias of center",
      icon: "Leading icon",
      eyebrow: "Eyebrow / kicker",
      title: "Title",
      subtitle: "Subtitle",
      meta: "Meta info next to the central content",
      content: "Extra content below the subtitle",
      actions: "Actions grouped in the right area"
    },
    returns: "HTMLDivElement",
    description: "Structured header with start/body/end regions, integrated drawer toggle, metadata, and composable slots."
  };
}

UI.Drawer = (...args) => {
  const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(rawProps, key);
  const currentStateKey = rawProps.stateKey ?? drawerStateKey;
  if (currentStateKey) {
    drawerStateKey = currentStateKey;
    drawerOpen = readDrawerOpen(currentStateKey);
  }

  const isDrawerOpen = () => readDrawerOpen(currentStateKey);
  const openDrawer = () => setDrawerOpen(true, currentStateKey);
  const closeDrawer = () => setDrawerOpen(false, currentStateKey);
  const toggleDrawer = () => setDrawerOpen(!isDrawerOpen(), currentStateKey);
  const ctx = {
    props: rawProps,
    stateKey: currentStateKey,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    toggleAside: toggleDrawer
  };

  const store = CMSwift?.store;
  const canStore = !!(store?.get && store?.set);
  const groupStateKey = `${currentStateKey}:groups`;
  const activeStateKey = `${currentStateKey}:active`;
  let groupState = canStore ? (store.get(groupStateKey, {}) || {}) : {};
  let activeItemKey = canStore ? (store.get(activeStateKey, null) ?? null) : null;
  const activeLeafRefs = new Map();
  const activeGroupRefs = new Map();

  const normalizeList = (value) => {
    const raw = uiUnwrap(value);
    if (raw == null || raw === false) return [];
    if (Array.isArray(raw)) return raw.flat(Infinity);
    return [raw];
  };
  const renderArea = (names, fallback, localCtx = ctx) => {
    const list = Array.isArray(names) ? names : [names];
    for (const name of list) {
      if (CMSwift.ui.getSlot(slots, name) != null) {
        return renderSlotToArray(slots, name, localCtx, fallback);
      }
    }
    return fallback == null ? [] : renderSlotToArray(null, "default", localCtx, uiUnwrap(fallback));
  };
  const hasArea = (names) => {
    const list = Array.isArray(names) ? names : [names];
    return list.some((name) => CMSwift.ui.getSlot(slots, name) != null);
  };

  const isExternalLink = (it) => {
    if (typeof uiUnwrap(it.external) === "boolean") return !!uiUnwrap(it.external);
    const href = uiUnwrap(it.href || it.to || it.link || "");
    return /^(https?:)?\/\//.test(href);
  };
  const closeOnSelect = rawProps.closeOnSelect ?? true;
  const shouldClose = (it) => !!closeOnSelect && uiUnwrap(it.keepOpen) !== true;
  const itemIconSize = rawProps.itemIconSize ?? rawProps.size ?? "md";
  const groupOpenIcon = rawProps.groupOpenIcon ?? "arrow_drop_up";
  const groupCloseIcon = rawProps.groupCloseIcon ?? "arrow_drop_down";

  const isStoredActive = (key) => !!key && activeItemKey === key;
  const isBranchActive = (key) => !!key && !!activeItemKey && (activeItemKey === key || activeItemKey.startsWith(`${key}::`));
  const syncActiveClasses = () => {
    activeLeafRefs.forEach(({ el, baseActive }, key) => {
      const active = !!baseActive || isStoredActive(key);
      el.classList.toggle("active", active);
      if (active) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
    activeGroupRefs.forEach(({ wrap, toggle, baseActive }, key) => {
      const active = !!baseActive || isBranchActive(key);
      wrap.classList.toggle("active", active);
      toggle.classList.toggle("active", active);
    });
  };
  const setActiveItem = (key) => {
    activeItemKey = key || null;
    if (canStore) store.set(activeStateKey, activeItemKey);
    syncActiveClasses();
  };
  const inferBaseActive = (it, href) => {
    if (uiUnwrap(it.active) != null) return !!uiUnwrap(it.active);
    if (uiUnwrap(it.current) != null) return !!uiUnwrap(it.current);
    if (!href || isExternalLink(it)) return false;
    try {
      if (href.startsWith("#")) return window.location.hash === href;
      const fullPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      return href === fullPath || href === window.location.pathname;
    } catch {
      return false;
    }
  };
  const inferActive = (it, href, itemStateKey) => inferBaseActive(it, href) || isStoredActive(itemStateKey);
  const hasActiveChildren = (list = [], level = 0, path = []) => {
    return normalizeList(list).some((entry, idx) => {
      const it = uiUnwrap(entry);
      if (!it || typeof it !== "object" || it.nodeType) return false;
      const href = uiUnwrap(it.href || it.to || it.link || "");
      const label = uiUnwrap(it.label ?? it.title ?? it.text ?? href ?? null) ?? `item-${level}-${idx}`;
      const keyPart = itemKeyPart(it, label, level, idx);
      const itemStateKey = path.concat(keyPart).join("::");
      if (inferActive(it, href, itemStateKey)) return true;
      const nested = it.items || it.children || it.sub;
      return hasActiveChildren(nested, level + 1, path.concat(keyPart));
    });
  };
  const iconNodes = (icon, localCtx = {}) => {
    const raw = uiUnwrap(icon);
    if (raw == null || raw === false) return [];
    const slotValue = typeof raw === "string"
      ? UI.Icon({ name: raw, size: localCtx.iconSize ?? itemIconSize })
      : CMSwift.ui.slot(raw, { ...localCtx, as: "icon" });
    return renderSlotToArray(null, "default", localCtx, slotValue);
  };
  const wrapIconNodes = (icon, side, localCtx = {}) => {
    const nodes = iconNodes(icon, localCtx);
    return nodes.length ? [_.span({ class: uiClass(["cms-drawer-item-icon", side]) }, ...nodes)] : [];
  };

  const getItemIcons = (it) => {
    const side = uiUnwrap(it.iconPosition) || "left";
    const leftIcon = Object.prototype.hasOwnProperty.call(it, "iconLeft") ? it.iconLeft : (side !== "right" ? it.icon : null);
    const rightIcon = Object.prototype.hasOwnProperty.call(it, "iconRight") ? it.iconRight : (side === "right" ? it.icon : null);
    return {
      left: leftIcon,
      right: rightIcon
    };
  };

  const itemKeyPart = (it, label, level, idx) => uiUnwrap(it.key || it.id || it.to || it.href || label || `item-${level}-${idx}`);

  const readGroupOpen = (key, fallback) => {
    if (!canStore) return fallback;
    if (Object.prototype.hasOwnProperty.call(groupState, key)) return !!groupState[key];
    return fallback;
  };

  const writeGroupOpen = (key, open) => {
    if (!canStore) return;
    groupState = { ...groupState, [key]: !!open };
    store.set(groupStateKey, groupState);
  };

  const buildStructuredHeader = () => {
    const headerCtx = { ...ctx, area: "header" };
    const icon = renderArea(["headerIcon", "icon"], rawProps.icon, headerCtx);
    const eyebrow = renderArea(["eyebrow"], rawProps.eyebrow, headerCtx);
    const title = renderArea(["title"], rawProps.title, headerCtx);
    const subtitle = renderArea(["subtitle"], rawProps.subtitle, headerCtx);
    const meta = renderArea(["meta"], rawProps.meta, headerCtx);
    const content = renderArea(["content"], rawProps.content, headerCtx);
    const actions = renderArea(["actions"], rawProps.actions, headerCtx);
    const extra = hasOwn("header") ? renderSlotToArray(null, "default", headerCtx, uiUnwrap(rawProps.header)) : [];
    const hasStructured = icon.length || eyebrow.length || title.length || subtitle.length || meta.length || content.length || actions.length;
    if (!hasStructured && !extra.length) return [];
    if (!hasStructured) return extra;
    return [
      _.div(
        { class: uiClass(["cms-drawer-header", rawProps.headerClass]) },
        ...(icon.length ? [_.div({ class: "cms-drawer-header-icon" }, ...icon)] : []),
        _.div(
          { class: "cms-drawer-header-body" },
          ...(eyebrow.length ? [_.div({ class: "cms-drawer-header-eyebrow" }, ...eyebrow)] : []),
          ...(title.length ? [_.div({ class: "cms-drawer-header-title" }, ...title)] : []),
          ...(subtitle.length ? [_.div({ class: "cms-drawer-header-subtitle" }, ...subtitle)] : []),
          ...(meta.length ? [_.div({ class: "cms-drawer-header-meta" }, ...meta)] : []),
          ...(content.length ? [_.div({ class: "cms-drawer-header-content" }, ...content)] : []),
          ...(extra.length ? [_.div({ class: "cms-drawer-header-extra" }, ...extra)] : [])
        ),
        ...(actions.length ? [_.div({ class: "cms-drawer-header-actions" }, ...actions)] : [])
      )
    ];
  };
  const invokeItemHandler = (it, itemCtx, e) => {
    const itemResult = it.onClick?.(e, itemCtx);
    if (itemResult === false || e?.defaultPrevented) return false;
    const rootResult = rawProps.onSelect?.(it, itemCtx, e);
    if (rootResult === false || e?.defaultPrevented) return false;
    return true;
  };
  const renderEntryNodes = (it, itemCtx, extras = {}) => {
    const slotPrefix = itemCtx.hasChildren ? "group" : "item";
    const labelNodes = renderSlotToArray(slots, `${slotPrefix}Label`, itemCtx, itemCtx.label);
    const noteNodes = renderSlotToArray(slots, `${slotPrefix}Note`, itemCtx, itemCtx.note);
    const badgeNodes = renderSlotToArray(slots, `${slotPrefix}Badge`, itemCtx, itemCtx.badge);
    const asideNodes = renderSlotToArray(slots, `${slotPrefix}Aside`, itemCtx, itemCtx.aside);
    const contentNodes = renderSlotToArray(slots, `${slotPrefix}Content`, itemCtx, itemCtx.content);
    const mainChildren = [];

    if (labelNodes.length || noteNodes.length || badgeNodes.length || asideNodes.length) {
      mainChildren.push(
        _.div(
          { class: "cms-drawer-item-top" },
          _.div(
            { class: "cms-drawer-item-copy" },
            ...(labelNodes.length ? [_.div({ class: "cms-drawer-item-label" }, ...labelNodes)] : []),
            ...(noteNodes.length ? [_.div({ class: "cms-drawer-item-note" }, ...noteNodes)] : [])
          ),
          ...(badgeNodes.length || asideNodes.length
            ? [_.div(
              { class: "cms-drawer-item-meta" },
              ...(badgeNodes.length ? [_.div({ class: "cms-drawer-item-badge" }, ...badgeNodes)] : []),
              ...(asideNodes.length ? [_.div({ class: "cms-drawer-item-aside" }, ...asideNodes)] : [])
            )]
            : [])
        )
      );
    }
    if (contentNodes.length) mainChildren.push(_.div({ class: "cms-drawer-item-content" }, ...contentNodes));

    return [
      ...(extras.start || []),
      ...wrapIconNodes(itemCtx.iconLeft, "left", itemCtx),
      ...(mainChildren.length ? [_.div({ class: "cms-drawer-item-main" }, ...mainChildren)] : []),
      ...wrapIconNodes(itemCtx.iconRight, "right", itemCtx),
      ...(extras.end || [])
    ];
  };
  const renderItems = (list = [], level = 0, path = []) => {
    return normalizeList(list).map((entry, idx) => {
      const it = uiUnwrap(entry);
      if (it == null || it === false) return null;

      if (it.nodeType || typeof it !== "object" || Array.isArray(it)) {
        return _.div({
          class: "cms-drawer-custom",
          "data-level": String(level)
        }, ...renderSlotToArray(null, "default", { ...ctx, item: it, level, index: idx, path }, it));
      }

      if (uiUnwrap(it.hidden) === true || uiUnwrap(it.visible) === false) return null;

      const childItems = normalizeList(it.items || it.children || it.sub);
      const href = uiUnwrap(it.href || it.to || it.link || null);
      const rawLabel = uiUnwrap(it.label ?? it.title ?? it.text ?? href ?? null);
      const label = rawLabel ?? `item-${level}-${idx}`;
      const note = uiUnwrap(it.note ?? it.subtitle ?? it.description ?? null);
      const badge = uiUnwrap(it.badge ?? null);
      const aside = uiUnwrap(it.aside ?? it.meta ?? null);
      const content = uiUnwrap(it.content ?? null);
      const keyPart = itemKeyPart(it, label, level, idx);
      const itemStateKey = path.concat(keyPart).join("::");
      const { left: itemIconLeft, right: itemIconRight } = getItemIcons(it);
      const tone = normalizeState(uiUnwrap(it.state) || uiUnwrap(it.color) || "");
      const baseIsActive = inferBaseActive(it, href);
      const isActive = baseIsActive || isStoredActive(itemStateKey);
      const disabled = !!uiUnwrap(it.disabled);
      const itemCtx = {
        ...ctx,
        item: it,
        index: idx,
        level,
        path,
        label,
        note,
        badge,
        aside,
        content,
        itemStateKey,
        iconLeft: itemIconLeft,
        iconRight: itemIconRight,
        iconSize: uiUnwrap(it.iconSize) || itemIconSize,
        active: isActive,
        disabled,
        hasChildren: false
      };
      const dividerLike = uiUnwrap(it.divider) === true || it.type === "divider" || it.type === "separator";
      const sectionLike = uiUnwrap(it.section) === true || it.type === "section" || it.type === "heading" || it.type === "label";
      const contentOnly = it.type === "content" || it.type === "custom" || (!href && !childItems.length && !uiUnwrap(it.button) && it.type !== "button" && rawLabel == null && content != null);

      if (dividerLike) {
        return _.div({
          class: uiClass(["cms-drawer-separator", it.class]),
          "data-level": String(level)
        });
      }

      if (sectionLike) {
        const sectionNodes = renderSlotToArray(slots, "sectionLabel", itemCtx, label || content);
        return _.div({
          class: uiClass(["cms-drawer-section-label", it.class]),
          "data-level": String(level)
        }, ...sectionNodes);
      }

      if (contentOnly) {
        const customNodes = renderSlotToArray(slots, "item", itemCtx, content ?? label);
        return _.div({
          class: uiClass(["cms-drawer-custom", tone ? `cms-drawer-tone-${tone}` : "", it.class]),
          style: it.style,
          "data-level": String(level)
        }, ...customNodes);
      }

      if (childItems.length) {
        const baseActiveInGroup = baseIsActive || hasActiveChildren(childItems, level + 1, path.concat(keyPart));
        const activeInGroup = baseActiveInGroup || isBranchActive(itemStateKey);
        let open = readGroupOpen(itemStateKey, !!uiUnwrap(it.expanded) || !!uiUnwrap(it.open) || activeInGroup);
        const toggleIconEl = _.span({ class: "cms-drawer-group-icon" });
        const groupCtx = {
          ...itemCtx,
          active: activeInGroup,
          hasChildren: true,
          isOpen: () => open,
          setOpen: (value) => setOpen(value),
          toggle: () => setOpen(!open)
        };
        const paintToggleIcon = () => {
          const icon = open ? (it.openIcon ?? groupOpenIcon) : (it.closeIcon ?? groupCloseIcon);
          const side = uiUnwrap(
            open
              ? (it.iconSidePosition || it.openIconSide || it.openIconPosition || "right")
              : (it.iconSidePosition || it.closeIconSide || it.closeIconPosition || "right")
          ) === "left" ? "left" : "right";
          toggleIconEl.innerHTML = "";
          toggleIconEl.className = `cms-drawer-group-icon ${side}`;
          iconNodes(icon, { ...groupCtx, as: "toggleIcon" }).forEach((node) => toggleIconEl.appendChild(node));
        };
        const toggleBtn = _.button({
          type: "button",
          class: uiClass([
            "cms-drawer-group-toggle",
            "cms-drawer-entry",
            open ? "open" : "",
            activeInGroup ? "active" : "",
            disabled ? "is-disabled" : "",
            tone ? `cms-drawer-tone-${tone}` : "",
            it.class
          ]),
          style: it.style,
          "data-level": String(level),
          "aria-expanded": String(open),
          "aria-disabled": disabled ? "true" : null,
          onClick: (e) => {
            if (disabled) {
              e.preventDefault();
              return;
            }
            setActiveItem(itemStateKey);
            setOpen(!open);
          }
        }, ...renderEntryNodes(it, groupCtx, {
          start: uiUnwrap(it.iconSidePosition || it.openIconSide || it.closeIconSide || it.openIconPosition || it.closeIconPosition || "right") === "left" ? [toggleIconEl] : [],
          end: uiUnwrap(it.iconSidePosition || it.openIconSide || it.closeIconSide || it.openIconPosition || it.closeIconPosition || "right") === "right" ? [toggleIconEl] : []
        }));
        const customGroupHeader = renderSlotToArray(slots, "group", groupCtx, null);
        const groupItems = _.div({ class: "cms-drawer-group-items" }, ...renderItems(childItems, level + 1, path.concat(keyPart)));
        const groupWrap = _.div({
          class: uiClass([
            "cms-drawer-group",
            open ? "open" : "",
            activeInGroup ? "active" : "",
            tone ? `cms-drawer-tone-${tone}` : ""
          ]),
          "data-level": String(level)
        }, ...(customGroupHeader.length ? customGroupHeader : [toggleBtn]), groupItems);
        const setOpen = (value) => {
          open = !!value;
          groupWrap.classList.toggle("open", open);
          toggleBtn.classList.toggle("open", open);
          toggleBtn.setAttribute("aria-expanded", String(open));
          paintToggleIcon();
          writeGroupOpen(itemStateKey, open);
        };
        activeGroupRefs.set(itemStateKey, {
          wrap: groupWrap,
          toggle: toggleBtn,
          baseActive: baseActiveInGroup
        });
        paintToggleIcon();
        return groupWrap;
      }

      const customItem = renderSlotToArray(slots, "item", itemCtx, null);
      const isButtonItem = uiUnwrap(it.button) === true || it.type === "button" || (!href && typeof it.onClick === "function");
      const sharedProps = {
        class: uiClass([
          "cms-drawer-entry",
          isButtonItem ? "cms-drawer-btn" : "cms-drawer-link",
          isActive ? "active" : "",
          disabled ? "is-disabled" : "",
          tone ? `cms-drawer-tone-${tone}` : "",
          it.class
        ]),
        style: it.style,
        "data-level": String(level),
        "aria-current": isActive ? "page" : null,
        "aria-disabled": disabled ? "true" : null
      };
      const entryNodes = customItem.length ? customItem : renderEntryNodes(it, itemCtx);

      if (isButtonItem) {
        const entryEl = _.button({
          ...sharedProps,
          type: it.buttonType || "button",
          disabled,
          onClick: (e) => {
            if (disabled) {
              e.preventDefault();
              return;
            }
            if (!invokeItemHandler(it, itemCtx, e)) return;
            setActiveItem(itemStateKey);
            if (shouldClose(it)) closeDrawer();
          }
        }, ...entryNodes);
        activeLeafRefs.set(itemStateKey, { el: entryEl, baseActive: baseIsActive });
        return entryEl;
      }

      const external = isExternalLink(it);
      const target = external ? (uiUnwrap(it.target) || "_blank") : uiUnwrap(it.target);
      const rel = external ? (uiUnwrap(it.rel) || "noopener noreferrer") : uiUnwrap(it.rel);

      const entryEl = _.a({
        ...sharedProps,
        href: href || "#",
        target: target || null,
        rel: rel || null,
        tabIndex: disabled ? -1 : null,
        onClick: (e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          if (!invokeItemHandler(it, itemCtx, e)) return;
          if (!external && it.to && app.router?.navigate) {
            e.preventDefault();
            app.router.navigate(it.to);
          }
          if (shouldClose(it)) closeDrawer();
        }
      }, ...entryNodes);
      activeLeafRefs.set(itemStateKey, { el: entryEl, baseActive: baseIsActive });
      return entryEl;
    }).filter(Boolean);
  };

  const beforeNodes = renderArea(["before", "beforeItems"], rawProps.before ?? rawProps.beforeItems);
  const bodyCustom = hasArea(["body"]) ? renderArea(["body"], null) : [];
  const itemNodes = renderItems(rawProps.items || []);
  const defaultNodes = renderArea(["default"], children);
  const afterNodes = renderArea(["after", "afterItems"], rawProps.after ?? rawProps.afterItems);
  const bodyNodes = bodyCustom.length ? bodyCustom : [...beforeNodes, ...itemNodes, ...defaultNodes, ...afterNodes];
  const emptyFallback = hasOwn("empty") || hasOwn("emptyText")
    ? (rawProps.empty ?? _.div({ class: uiClass(["cms-drawer-empty", rawProps.emptyClass]) }, rawProps.emptyText || "Nessun contenuto"))
    : _.div({ class: uiClass(["cms-drawer-empty", rawProps.emptyClass]) }, "Nessun contenuto");
  const headerNodes = renderArea(["header"], buildStructuredHeader());
  const footerNodes = renderArea(["footer"], rawProps.footer);
  const finalBodyNodes = bodyNodes.length ? bodyNodes : renderArea(["empty"], emptyFallback);

  const p = CMSwift.omit(props, [
    "items", "header", "footer", "before", "beforeItems", "after", "afterItems",
    "title", "subtitle", "eyebrow", "icon", "content", "meta", "actions",
    "empty", "emptyText", "closeOnSelect", "groupOpenIcon", "groupCloseIcon",
    "stateKey", "sticky", "slots", "headerClass", "bodyClass", "footerClass",
    "emptyClass", "itemIconSize", "gap", "indent", "padding", "minHeight",
    "maxHeight", "width", "onSelect"
  ]);
  p.class = uiClass([
    "cms-panel",
    "cms-drawer",
    drawerOpen ? "open" : "",
    uiWhen(rawProps.sticky, "sticky"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };
  if (rawProps.gap != null) p.style["--cms-drawer-gap"] = toCssSize(uiUnwrap(rawProps.gap));
  if (rawProps.indent != null) p.style["--cms-drawer-indent"] = toCssSize(uiUnwrap(rawProps.indent));
  if (rawProps.padding != null) p.style["--cms-drawer-padding"] = toCssSize(uiUnwrap(rawProps.padding));
  if (rawProps.width != null) p.style.width = toCssSize(uiUnwrap(rawProps.width));
  if (rawProps.minHeight != null) p.style.minHeight = toCssSize(uiUnwrap(rawProps.minHeight));
  if (rawProps.maxHeight != null) p.style.maxHeight = toCssSize(uiUnwrap(rawProps.maxHeight));

  const drawerEl = _.div(
    p,
    ...(headerNodes.length ? headerNodes : []),
    _.div({ class: uiClass(["cms-drawer-body", rawProps.bodyClass]) }, ...finalBodyNodes),
    ...(footerNodes.length ? [_.div({ class: uiClass(["cms-drawer-footer", rawProps.footerClass]) }, ...footerNodes)] : [])
  );
  const drawerSet = drawerElsByKey.get(currentStateKey) || new Set();
  drawerSet.add(drawerEl);
  drawerElsByKey.set(currentStateKey, drawerSet);
  setDrawerOpen(drawerOpen, currentStateKey);
  drawerEl.isDrawerOpen = isDrawerOpen;
  drawerEl.openDrawer = openDrawer;
  drawerEl.closeDrawer = closeDrawer;
  drawerEl.toggleDrawer = toggleDrawer;
  drawerEl.setActiveItem = setActiveItem;
  setPropertyProps(drawerEl, rawProps);
  syncActiveClasses();
  return drawerEl;
};
if (CMSwift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.Drawer = {
    signature: "UI.Drawer(props)",
    props: {
      items: "Array",
      header: "Node|Function|Array",
      footer: "Node|Function|Array",
      before: "Node|Function|Array",
      after: "Node|Function|Array",
      title: "String|Node|Function|Array",
      subtitle: "String|Node|Function|Array",
      eyebrow: "String|Node|Function|Array",
      icon: "String|Node|Function|Array",
      content: "Node|Function|Array",
      meta: "Node|Function|Array",
      actions: "Node|Function|Array",
      empty: "Node|Function|Array",
      emptyText: "string",
      stateKey: "string",
      closeOnSelect: "boolean",
      groupOpenIcon: "String|Node|Function|Array",
      groupCloseIcon: "String|Node|Function|Array",
      itemIconSize: "string|number",
      gap: "string|number",
      indent: "string|number",
      padding: "string|number",
      width: "string|number",
      minHeight: "string|number",
      maxHeight: "string|number",
      onSelect: "function(item, ctx, event)",
      sticky: "boolean",
      slots: "{ header?, body?, footer?, before?, after?, empty?, item?, itemLabel?, itemNote?, itemBadge?, itemAside?, itemContent?, group?, groupLabel?, groupNote?, groupBadge?, groupAside?, groupContent?, sectionLabel? }",
      class: "string",
      style: "object"
    },
    slots: {
      header: "Drawer header, full override",
      body: "Full body override",
      footer: "Drawer footer",
      before: "Content before the item list",
      after: "Content after the item list",
      empty: "Empty state when there is no content",
      item: "Full override for a simple item",
      itemLabel: "Item label (ctx: { item, label, note, badge, aside, content })",
      itemNote: "Item note/subtitle",
      itemBadge: "Item badge",
      itemAside: "Item aside/meta",
      itemContent: "Extra item content",
      group: "Full override for a group header (ctx includes toggle/isOpen)",
      groupLabel: "Group label",
      groupNote: "Group note",
      groupBadge: "Group badge",
      groupAside: "Group aside/meta",
      groupContent: "Extra group content",
      sectionLabel: "Label for section/heading items"
    },
    returns: "HTMLDivElement with openDrawer/closeDrawer/toggleDrawer/isDrawerOpen methods",
    description: "Structured, backward-compatible drawer with header/footer, groups, extended slots, empty state, and persistent state."
  };
}

UI.Page = (...args) => {
  const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };

  const isSectionNode = (node, name) => {
    return !!(node && node.nodeType === 1 && node.classList?.contains(`cms-page-${name}`));
  };
  const renderIconFallback = (value) => {
    if (value == null) return null;
    if (typeof value === "string") return UI.Icon({ name: value, size: rawProps.iconSize || rawProps.size || "xl" });
    return CMSwift.ui.slot(value, { as: "icon" });
  };

  const ctx = {
    dense: !!uiUnwrap(rawProps.dense),
    flat: !!uiUnwrap(rawProps.flat),
    centered: !!uiUnwrap(rawProps.centered),
    narrow: !!uiUnwrap(rawProps.narrow)
  };
  const appendResolvedValue = (host, value) => {
    if (value == null || value === false) return;
    if (Array.isArray(value)) {
      value.forEach((item) => appendResolvedValue(host, item));
      return;
    }
    if (value?.nodeType) {
      host.appendChild(value);
      return;
    }
    host.appendChild(document.createTextNode(String(value)));
  };
  const renderPropNodes = (name, fallback, map = (value) => value) => {
    const slot = CMSwift.ui.getSlot(slots, name);
    if (slot !== null && slot !== undefined) {
      return renderSlotToArray(slots, name, ctx, null);
    }
    if (typeof fallback === "function") {
      const inlineNames = new Set(["eyebrow", "title", "subtitle"]);
      const host = _[inlineNames.has(name) ? "span" : "div"]({ class: `cms-page-slot-${name}` });
      CMSwift.reactive.effect(() => {
        const nextValue = map(fallback(ctx));
        const normalized = flattenSlotValue(CMSwift.ui.slot(nextValue));
        host.replaceChildren();
        if (Array.isArray(normalized)) normalized.forEach((item) => appendResolvedValue(host, item));
        else appendResolvedValue(host, normalized);
      }, `UI.Page:${name}`);
      return [host];
    }
    return renderSlotToArray(slots, name, ctx, map(fallback));
  };

  const defaultNodes = renderSlotToArray(slots, "default", ctx, children?.length ? children : []);
  const sectionNodes = {
    hero: [],
    header: [],
    body: [],
    footer: [],
    actions: []
  };
  const looseNodes = [];

  defaultNodes.forEach((node) => {
    if (isSectionNode(node, "hero")) sectionNodes.hero.push(node);
    else if (isSectionNode(node, "header")) sectionNodes.header.push(node);
    else if (isSectionNode(node, "body")) sectionNodes.body.push(node);
    else if (isSectionNode(node, "footer")) sectionNodes.footer.push(node);
    else if (isSectionNode(node, "actions")) sectionNodes.actions.push(node);
    else looseNodes.push(node);
  });

  const iconNodes = renderPropNodes("icon", rawProps.icon, renderIconFallback);
  const heroNodes = renderPropNodes("hero", rawProps.hero ?? rawProps.banner);
  const eyebrowNodes = renderPropNodes("eyebrow", rawProps.eyebrow ?? rawProps.kicker);
  const titleNodes = renderPropNodes("title", rawProps.title);
  const subtitleNodes = renderPropNodes("subtitle", rawProps.subtitle ?? rawProps.description);
  const headerNodes = renderPropNodes("header", rawProps.header);
  const asideNodes = renderPropNodes("aside", rawProps.aside);
  const bodyNodes = renderPropNodes("body", rawProps.body ?? rawProps.content);
  const footerNodes = renderPropNodes("footer", rawProps.footer);
  const actionsNodes = renderPropNodes("actions", rawProps.actions);

  const generatedHero = heroNodes.length
    ? _.div({ class: uiClass(["cms-page-hero", rawProps.heroClass]) }, ...heroNodes)
    : null;

  const hasStructuredHeader = iconNodes.length || eyebrowNodes.length || titleNodes.length || subtitleNodes.length || headerNodes.length || asideNodes.length;
  const generatedHeader = hasStructuredHeader
    ? _.div(
      { class: uiClass(["cms-page-header", rawProps.headerClass]) },
      _.div(
        { class: "cms-page-head" },
        iconNodes.length ? _.div({ class: uiClass(["cms-page-icon", rawProps.iconClass]) }, ...iconNodes) : null,
        _.div(
          { class: "cms-page-head-main" },
          eyebrowNodes.length ? _.div({ class: uiClass(["cms-page-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
          titleNodes.length ? _.div({ class: uiClass(["cms-page-title", rawProps.titleClass]) }, ...titleNodes) : null,
          subtitleNodes.length ? _.div({ class: uiClass(["cms-page-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
          headerNodes.length ? _.div({ class: uiClass(["cms-page-header-content", rawProps.headerContentClass]) }, ...headerNodes) : null
        ),
        asideNodes.length ? _.div({ class: uiClass(["cms-page-aside", rawProps.asideClass]) }, ...asideNodes) : null
      )
    )
    : null;

  const mergedBodyNodes = [...bodyNodes, ...looseNodes];
  const generatedBody = mergedBodyNodes.length
    ? _.div({ class: uiClass(["cms-page-body", rawProps.bodyClass]) }, ...mergedBodyNodes)
    : null;

  const mergedActionNodes = [...actionsNodes, ...sectionNodes.actions];
  const generatedFooter = (footerNodes.length || mergedActionNodes.length)
    ? _.div(
      { class: uiClass(["cms-page-footer", rawProps.footerClass]) },
      ...footerNodes,
      mergedActionNodes.length ? _.div({ class: "cms-page-actions" }, ...mergedActionNodes) : null
    )
    : null;

  const hasHero = !!(heroNodes.length || sectionNodes.hero.length);
  const hasHeader = !!(hasStructuredHeader || sectionNodes.header.length);
  const p = CMSwift.omit(props, [
    "actions", "aside", "asideClass", "banner", "body", "bodyClass", "centered", "content",
    "dense", "description", "eyebrow", "eyebrowClass", "flat", "footer", "footerClass",
    "gap", "header", "headerClass", "headerContentClass", "headerGap", "hero", "heroClass",
    "heroPadding", "icon", "iconClass", "iconSize", "kicker", "maxWidth", "minHeight",
    "narrow", "padding", "size", "slots", "subtitle", "subtitleClass", "title", "titleClass"
  ]);
  p.class = uiClass([
    "cms-panel",
    "cms-page",
    uiWhen(rawProps.dense, "dense"),
    uiWhen(rawProps.flat, "cms-page-flat"),
    uiWhen(rawProps.centered, "cms-page-centered"),
    uiWhen(rawProps.narrow, "cms-page-narrow"),
    uiWhen(hasHero, "cms-page-has-hero"),
    uiWhen(hasHeader, "cms-page-has-header"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };

  if (rawProps.gap != null || uiIsReactive(rawProps.gap)) {
    p.style["--cms-page-gap"] = uiStyleValue(rawProps.gap, toCssSize);
  }
  if (rawProps.padding != null || uiIsReactive(rawProps.padding)) {
    p.style["--cms-page-padding"] = uiStyleValue(rawProps.padding, toCssSize);
  }
  if (rawProps.maxWidth != null || uiIsReactive(rawProps.maxWidth)) {
    p.style["--cms-page-max-width"] = uiStyleValue(rawProps.maxWidth, toCssSize);
  }
  if (rawProps.minHeight != null || uiIsReactive(rawProps.minHeight)) {
    p.style["--cms-page-min-height"] = uiStyleValue(rawProps.minHeight, toCssSize);
  }
  if (rawProps.headerGap != null || uiIsReactive(rawProps.headerGap)) {
    p.style["--cms-page-header-gap"] = uiStyleValue(rawProps.headerGap, toCssSize);
  }
  if (rawProps.heroPadding != null || uiIsReactive(rawProps.heroPadding)) {
    p.style["--cms-page-hero-padding"] = uiStyleValue(rawProps.heroPadding, toCssSize);
  }

  const el = _.div(
    p,
    generatedHero,
    ...sectionNodes.hero,
    generatedHeader,
    ...sectionNodes.header,
    generatedBody,
    ...sectionNodes.body,
    generatedFooter,
    ...sectionNodes.footer
  );

  setPropertyProps(el, rawProps);
  return el;
};
if (CMSwift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.Page = {
    signature: "UI.Page(...children) | UI.Page(props, ...children)",
    props: {
      hero: "Node|Function|Array",
      icon: "String|Node|Function|Array",
      eyebrow: "String|Node|Function|Array",
      title: "String|Node|Function|Array",
      subtitle: "String|Node|Function|Array",
      header: "String|Node|Function|Array",
      aside: "Node|Function|Array",
      body: "Node|Function|Array",
      footer: "Node|Function|Array",
      actions: "Node|Function|Array",
      dense: "boolean",
      flat: "boolean",
      centered: "boolean",
      narrow: "boolean",
      gap: "string|number",
      padding: "string|number",
      maxWidth: "string|number",
      minHeight: "string|number",
      heroPadding: "string|number",
      headerGap: "string|number",
      slots: "{ hero?, icon?, eyebrow?, title?, subtitle?, header?, aside?, body?, footer?, actions?, default? }",
      class: "string",
      style: "object"
    },
    slots: {
      hero: "Top hero/banner area",
      icon: "Page icon/visual",
      eyebrow: "Eyebrow/kicker content",
      title: "Page title content",
      subtitle: "Page subtitle/description content",
      header: "Header support content under title",
      aside: "Top-right header content",
      body: "Structured body content",
      footer: "Footer meta/content",
      actions: "Footer actions content",
      default: "Fallback body content"
    },
    returns: "HTMLDivElement",
    description: "Structured page container with hero, header, body, footer, and configurable layout."
  };
}

UI.AppShell = (...args) => {
  const { props, children } = CMSwift.uiNormalizeArgs(args);
  const slots = props.slots || {};
  const hasOwn = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);

  const noDrawer = uiUnwrap(props.noDrawer) === true || props.drawer === false;
  const reverse = uiUnwrap(props.reverse) === true;
  const stack = uiUnwrap(props.stack) === true;
  const currentStateKey = props.drawerStateKey ?? props.stateKey ?? drawerStateKey;

  if (currentStateKey) {
    drawerStateKey = currentStateKey;
    drawerOpen = readDrawerOpen(currentStateKey);
  }

  const shellCtx = {
    props,
    noDrawer,
    stateKey: currentStateKey,
    isDrawerOpen: () => readDrawerOpen(currentStateKey),
    openDrawer: () => setDrawerOpen(true, currentStateKey),
    closeDrawer: () => setDrawerOpen(false, currentStateKey),
    toggleDrawer: () => setDrawerOpen(!readDrawerOpen(currentStateKey), currentStateKey)
  };

  const headerProps = (props.headerProps && typeof props.headerProps === "object") ? { ...props.headerProps } : {};
  let headerFallback = props.header;
  if (!hasOwn(props, "header") && (
    Object.keys(headerProps).length ||
    hasOwn(props, "title") ||
    hasOwn(props, "subtitle") ||
    hasOwn(props, "left") ||
    hasOwn(props, "right")
  )) {
    if (!hasOwn(headerProps, "title") && hasOwn(props, "title")) headerProps.title = props.title;
    if (!hasOwn(headerProps, "subtitle") && hasOwn(props, "subtitle")) headerProps.subtitle = props.subtitle;
    if (!hasOwn(headerProps, "left") && hasOwn(props, "left")) headerProps.left = props.left;
    if (!hasOwn(headerProps, "right") && hasOwn(props, "right")) headerProps.right = props.right;
    if (!hasOwn(headerProps, "drawerStateKey")) headerProps.drawerStateKey = currentStateKey;
    if (noDrawer && !hasOwn(headerProps, "left")) headerProps.left = false;
    headerFallback = UI.Header(headerProps);
  }

  const drawerProps = (props.drawerProps && typeof props.drawerProps === "object") ? { ...props.drawerProps } : {};
  const drawerItems = hasOwn(props, "drawerItems") ? props.drawerItems : props.items;
  const drawerHeader = hasOwn(props, "drawerHeader") ? props.drawerHeader : undefined;
  let drawerFallback = props.drawer;
  if (!hasOwn(props, "drawer") && !noDrawer && (
    Object.keys(drawerProps).length ||
    drawerItems != null ||
    drawerHeader != null
  )) {
    if (!hasOwn(drawerProps, "items") && drawerItems != null) drawerProps.items = drawerItems;
    if (!hasOwn(drawerProps, "header") && drawerHeader != null) drawerProps.header = drawerHeader;
    if (!hasOwn(drawerProps, "stateKey")) drawerProps.stateKey = currentStateKey;
    drawerFallback = UI.Drawer(drawerProps);
  }

  const pageProps = (props.pageProps && typeof props.pageProps === "object") ? { ...props.pageProps } : {};
  const pageContentFallback = hasOwn(props, "content") ? props.content : children;
  const defaultPageContent = renderSlotToArray(slots, "default", shellCtx, pageContentFallback);
  let pageFallback = props.page;
  if (!hasOwn(props, "page") && (Object.keys(pageProps).length || defaultPageContent.length)) {
    pageFallback = UI.Page(pageProps, ...defaultPageContent);
  }

  const footerProps = (props.footerProps && typeof props.footerProps === "object") ? { ...props.footerProps } : {};
  const footerContent = hasOwn(props, "footerContent") ? props.footerContent : undefined;
  let footerFallback = props.footer;
  if (!hasOwn(props, "footer") && (Object.keys(footerProps).length || footerContent != null)) {
    footerFallback = UI.Footer(footerProps, ...renderSlotToArray(null, "default", shellCtx, footerContent));
  }

  const headerNodes = renderSlotToArray(slots, "header", shellCtx, headerFallback);
  const drawerNodes = noDrawer ? [] : renderSlotToArray(slots, "drawer", shellCtx, drawerFallback);
  const pageNodes = renderSlotToArray(slots, "page", shellCtx, pageFallback);
  const footerNodes = renderSlotToArray(slots, "footer", shellCtx, footerFallback);

  const cls = uiClass([
    "cms-app",
    "cms-app-shell",
    uiWhen(noDrawer, "no-drawer"),
    uiWhen(reverse, "is-reverse"),
    uiWhen(stack, "is-stack"),
    uiWhen(props.flush, "is-flush"),
    uiWhen(props.divider, "is-divider"),
    props.class
  ]);

  const p = CMSwift.omit(props, [
    "header", "drawer", "page", "footer", "content",
    "title", "subtitle", "left", "right",
    "items", "drawerItems", "drawerHeader",
    "headerProps", "drawerProps", "pageProps", "footerProps",
    "footerContent",
    "noDrawer", "reverse", "stack", "flush", "divider",
    "drawerStateKey", "stateKey",
    "drawerWidth", "gap", "padding",
    "slots"
  ]);
  p.class = cls;
  p.style = { ...(props.style || {}) };

  const drawerWidth = uiStyleValue(props.drawerWidth, toCssSize);
  if (drawerWidth != null) p.style["--cms-app-shell-drawer-width"] = drawerWidth;
  const gap = uiStyleValue(props.gap, toCssSize);
  if (gap != null) p.style["--cms-app-shell-gap"] = gap;
  const padding = uiStyleValue(props.padding, toCssSize);
  if (padding != null) p.style["--cms-app-shell-padding"] = padding;

  const headerWrap = headerNodes.length
    ? _.div({ class: "cms-app-shell-header-slot" }, ...headerNodes)
    : null;
  const drawerWrap = drawerNodes.length
    ? _.div({ class: "cms-app-shell-drawer-slot" }, ...drawerNodes)
    : null;
  const pageWrap = pageNodes.length
    ? _.div({ class: "cms-app-shell-page-slot" }, ...pageNodes)
    : null;
  const footerWrap = footerNodes.length
    ? _.div({ class: "cms-app-shell-footer-slot" }, ...footerNodes)
    : null;

  const bodyNodes = reverse
    ? [pageWrap, drawerWrap]
    : [drawerWrap, pageWrap];

  const root = _.div(
    p,
    ...(headerWrap ? [headerWrap] : []),
    _.div({ class: "cms-app-shell-body" }, ...bodyNodes.filter(Boolean)),
    ...(footerWrap ? [footerWrap] : [])
  );

  root.openDrawer = shellCtx.openDrawer;
  root.closeDrawer = shellCtx.closeDrawer;
  root.toggleDrawer = shellCtx.toggleDrawer;
  root.isDrawerOpen = shellCtx.isDrawerOpen;
  root.header = headerWrap;
  root.drawer = drawerWrap;
  root.page = pageWrap;
  root.footer = footerWrap;

  setPropertyProps(root, props);
  return root;
};
if (CMSwift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.AppShell = {
    signature: "UI.AppShell(...children) | UI.AppShell(props, ...children)",
    props: {
      header: "Node|Function|Array|false",
      drawer: "Node|Function|Array|false",
      page: "Node|Function|Array|false",
      footer: "Node|Function|Array|false",
      title: "string|Node|Function|Array",
      subtitle: "string|Node|Function|Array",
      left: "Node|Function|Array|false",
      right: "Node|Function|Array",
      items: "Array",
      drawerItems: "Array",
      drawerHeader: "Node|Function|Array",
      content: "Node|Function|Array",
      headerProps: "object",
      drawerProps: "object",
      pageProps: "object",
      footerProps: "object",
      footerContent: "Node|Function|Array",
      noDrawer: "boolean",
      reverse: "boolean",
      stack: "boolean",
      flush: "boolean",
      divider: "boolean",
      drawerStateKey: "string",
      stateKey: "string",
      drawerWidth: "number|string",
      gap: "number|string",
      padding: "number|string",
      slots: "{ header?, drawer?, page?, footer?, default? }",
      class: "string",
      style: "object"
    },
    slots: {
      header: "Header content",
      drawer: "Drawer content",
      page: "Page content",
      footer: "Footer content",
      default: "Fallback page content"
    },
    returns: "HTMLDivElement con methods openDrawer/closeDrawer/toggleDrawer/isDrawerOpen",
    description: "Shell applicazione composabile con shortcut per Header/Drawer/Page/Footer e gestione drawer."
  };
}

UI.Parallax = function Parallax(...args) {
  const { props: rawProps, children } = CMSwift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };

  if (props.color != null && props.textColor == null) props.textColor = props.color;
  delete props.color;
  applyCommonProps(props);

  const stateClass = uiComputed(rawProps.state, () => {
    const state = normalizeState(uiUnwrap(rawProps.state));
    return state ? `cms-state-${state}` : "";
  });
  const mapColorValue = (value) => {
    if (value == null || value === false || value === "") return "";
    const text = String(value);
    return isTokenCSS(text) ? `var(--cms-${text})` : text;
  };
  const getBackgroundImage = () => {
    const background = uiUnwrap(rawProps.background);
    if (background) return String(background);
    const source = uiUnwrap(rawProps.image) || uiUnwrap(rawProps.src) || "";
    if (!source) return "linear-gradient(120deg, #1b2c5a, #2f6d8f, #2a8f5c)";
    const text = String(source);
    if (/^url\(/i.test(text) || /gradient\(/i.test(text) || /^var\(/i.test(text)) return text;
    return `url(${text})`;
  };
  const getNumericValue = (value, fallback) => {
    const num = Number(uiUnwrap(value));
    return Number.isFinite(num) ? num : fallback;
  };

  const ctx = {
    speed: () => uiUnwrap(rawProps.speed) ?? 0.18,
    state: () => uiUnwrap(rawProps.state) || "",
    disabled: () => !!uiUnwrap(rawProps.disabled)
  };

  const badgeNodes = renderSlotToArray(slots, "badge", ctx, rawProps.badge);
  const backgroundNodes = renderSlotToArray(slots, "background", ctx, rawProps.backgroundContent);
  const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, rawProps.eyebrow ?? rawProps.kicker);
  const titleNodes = renderSlotToArray(slots, "title", ctx, rawProps.title);
  const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, rawProps.subtitle);
  const headerNodes = renderSlotToArray(slots, "header", ctx, rawProps.header);
  const asideNodes = renderSlotToArray(slots, "aside", ctx, rawProps.aside);
  const mediaNodes = renderSlotToArray(slots, "media", ctx, rawProps.media);
  const contentNodes = renderSlotToArray(slots, "content", ctx, rawProps.content ?? rawProps.body);
  const defaultNodes = renderSlotToArray(slots, "default", ctx, children?.length ? children : []);
  const footerNodes = renderSlotToArray(slots, "footer", ctx, rawProps.footer);
  const actionsNodes = renderSlotToArray(slots, "actions", ctx, rawProps.actions);
  const mergedBodyNodes = [...contentNodes, ...defaultNodes];

  const generatedBadge = badgeNodes.length
    ? _.div({ class: uiClass(["cms-parallax-badge", rawProps.badgeClass]) }, ...badgeNodes)
    : null;
  const hasStructuredHeader = eyebrowNodes.length || titleNodes.length || subtitleNodes.length || headerNodes.length || asideNodes.length;
  const generatedHeader = hasStructuredHeader
    ? _.div(
      { class: uiClass(["cms-parallax-header", rawProps.headerClass]) },
      _.div(
        { class: "cms-parallax-head" },
        _.div(
          { class: "cms-parallax-head-main" },
          eyebrowNodes.length ? _.div({ class: uiClass(["cms-parallax-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
          titleNodes.length ? _.div({ class: uiClass(["cms-parallax-title", rawProps.titleClass]) }, ...titleNodes) : null,
          subtitleNodes.length ? _.div({ class: uiClass(["cms-parallax-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
          headerNodes.length ? _.div({ class: uiClass(["cms-parallax-header-content", rawProps.headerContentClass]) }, ...headerNodes) : null
        ),
        asideNodes.length ? _.div({ class: uiClass(["cms-parallax-aside", rawProps.asideClass]) }, ...asideNodes) : null
      )
    )
    : null;
  const generatedMedia = mediaNodes.length
    ? _.div({ class: uiClass(["cms-parallax-media", rawProps.mediaClass]) }, ...mediaNodes)
    : null;
  const generatedBody = mergedBodyNodes.length
    ? _.div({ class: uiClass(["cms-parallax-body", rawProps.bodyClass]) }, ...mergedBodyNodes)
    : null;
  const generatedFooter = (footerNodes.length || actionsNodes.length)
    ? _.div(
      { class: uiClass(["cms-parallax-footer", rawProps.footerClass]) },
      footerNodes.length ? _.div({ class: "cms-parallax-footer-content" }, ...footerNodes) : null,
      actionsNodes.length ? _.div({ class: "cms-parallax-actions" }, ...actionsNodes) : null
    )
    : null;

  const wrapProps = CMSwift.omit(props, [
    "actions", "align", "aside", "asideClass", "background", "backgroundContent", "backgroundContentClass",
    "badge", "badgeClass", "bgClass", "bgPosition", "bgRepeat", "bgSize", "body", "bodyClass", "color",
    "content", "contentClass", "contentMaxWidth", "disabled", "eyebrow", "eyebrowClass", "footer",
    "footerClass", "gap", "header", "headerClass", "headerContentClass", "height", "image", "imageAlt",
    "imageClass", "innerClass", "justify", "kicker", "maxOffset", "media", "mediaClass", "minHeight",
    "overlay", "padding", "slots", "speed", "src", "startTop", "state", "subtitle", "subtitleClass",
    "textColor", "title", "titleClass"
  ]);
  wrapProps.class = uiClass([
    "cms-parallax",
    "cms-singularity",
    stateClass,
    uiWhen(rawProps.disabled, "cms-parallax-static"),
    uiWhen(generatedBadge, "cms-parallax-has-badge"),
    uiWhen(hasStructuredHeader, "cms-parallax-has-header"),
    props.class
  ]);
  wrapProps.style = { ...(props.style || {}) };
  if (rawProps.height != null) wrapProps.style["--cms-parallax-height"] = uiStyleValue(rawProps.height, toCssSize);
  if (rawProps.minHeight != null) wrapProps.style["--cms-parallax-min-height"] = uiStyleValue(rawProps.minHeight, toCssSize);
  if (rawProps.padding != null) wrapProps.style["--cms-parallax-padding"] = uiStyleValue(rawProps.padding, toCssSize);
  if (rawProps.gap != null) wrapProps.style["--cms-parallax-gap"] = uiStyleValue(rawProps.gap, toCssSize);
  if (rawProps.contentMaxWidth != null) wrapProps.style["--cms-parallax-content-max-width"] = uiStyleValue(rawProps.contentMaxWidth, toCssSize);
  if (rawProps.justify != null) wrapProps.style["--cms-parallax-justify"] = uiStyleValue(rawProps.justify);
  if (rawProps.align != null) wrapProps.style["--cms-parallax-align"] = uiStyleValue(rawProps.align);
  if (rawProps.color != null) wrapProps.style["--cms-parallax-color"] = uiStyleValue(rawProps.color, mapColorValue);
  if (rawProps.overlay != null) wrapProps.style["--cms-parallax-overlay"] = uiStyleValue(rawProps.overlay);
  if (rawProps.bgPosition != null) wrapProps.style["--cms-parallax-position"] = uiStyleValue(rawProps.bgPosition);
  if (rawProps.bgSize != null) wrapProps.style["--cms-parallax-size"] = uiStyleValue(rawProps.bgSize);
  if (rawProps.bgRepeat != null) wrapProps.style["--cms-parallax-repeat"] = uiStyleValue(rawProps.bgRepeat);
  wrapProps.style["--cms-parallax-image"] = (uiIsReactive(rawProps.background) || uiIsReactive(rawProps.image) || uiIsReactive(rawProps.src))
    ? () => getBackgroundImage()
    : getBackgroundImage();

  const bg = _.div(
    { class: uiClass(["cms-parallax-bg", rawProps.bgClass]) },
    backgroundNodes.length
      ? _.div({ class: uiClass(["cms-parallax-bg-content", rawProps.backgroundContentClass]) }, ...backgroundNodes)
      : null
  );
  const content = _.div(
    { class: uiClass(["cms-parallax-content", rawProps.contentClass, rawProps.innerClass]) },
    generatedBadge,
    generatedHeader,
    generatedMedia,
    generatedBody,
    generatedFooter
  );

  const wrap = _.div(wrapProps, bg, content);

  let disposed = false;
  let ticking = false;
  let resizeObserver = null;

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    if (typeof window !== "undefined") {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    }
    resizeObserver?.disconnect?.();
    resizeObserver = null;
  };

  const update = () => {
    if (disposed) return;
    if (!wrap.isConnected) {
      cleanup();
      return;
    }
    if (uiUnwrap(rawProps.disabled)) {
      bg.style.transform = "translate3d(0, 0, 0)";
      wrap.style.setProperty("--cms-parallax-offset", "0px");
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const speed = getNumericValue(rawProps.speed, 0.18);
    const maxOffset = Math.abs(getNumericValue(rawProps.maxOffset, 96));
    const explicitStartTop = uiUnwrap(rawProps.startTop);
    const rawOffset = explicitStartTop != null && explicitStartTop !== ""
      ? (rect.top - getNumericValue(rawProps.startTop, 0)) * speed
      : (((typeof window !== "undefined" ? window.innerHeight || document.documentElement.clientHeight || 0 : 0) / 2) - (rect.top + (rect.height / 2))) * speed;
    const offset = maxOffset > 0 ? Math.max(-maxOffset, Math.min(maxOffset, rawOffset)) : rawOffset;
    const cssOffset = `${offset.toFixed(2)}px`;
    bg.style.transform = `translate3d(0, ${cssOffset}, 0)`;
    wrap.style.setProperty("--cms-parallax-offset", cssOffset);
  };

  function scheduleUpdate() {
    if (disposed || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => { scheduleUpdate(); });
      resizeObserver.observe(wrap);
    }
    requestAnimationFrame(() => { scheduleUpdate(); });
    setTimeout(() => { scheduleUpdate(); }, 90);
  }

  wrap.refresh = () => {
    scheduleUpdate();
    return wrap;
  };
  wrap.update = wrap.refresh;
  wrap.destroy = () => {
    cleanup();
    wrap.remove();
    return null;
  };
  wrap._dispose = cleanup;

  setPropertyProps(wrap, rawProps);
  return wrap;
};
if (CMSwift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.Parallax = {
    signature: "UI.Parallax(...children) | UI.Parallax(props, ...children)",
    props: {
      src: "string",
      image: "string",
      background: "string",
      backgroundContent: "Node|Function|Array",
      height: "string|number",
      minHeight: "string|number",
      speed: "number",
      maxOffset: "number",
      startTop: "number",
      state: "success|warning|danger|info|primary|secondary|dark|light|string",
      overlay: "string",
      color: "string",
      bgPosition: "string",
      bgSize: "string",
      bgRepeat: "string",
      padding: "string|number",
      gap: "string|number",
      justify: "string",
      align: "string",
      contentMaxWidth: "string|number",
      disabled: "boolean",
      badge: "Node|Function|Array",
      eyebrow: "String|Node|Function|Array",
      title: "String|Node|Function|Array",
      subtitle: "String|Node|Function|Array",
      header: "Node|Function|Array",
      aside: "Node|Function|Array",
      media: "Node|Function|Array",
      content: "Node|Function|Array",
      footer: "Node|Function|Array",
      actions: "Node|Function|Array",
      bgClass: "string",
      badgeClass: "string",
      headerClass: "string",
      bodyClass: "string",
      footerClass: "string",
      contentClass: "string",
      slots: "{ background?, badge?, eyebrow?, title?, subtitle?, header?, aside?, media?, content?, footer?, actions?, default? }",
      class: "string",
      style: "object"
    },
    slots: {
      background: "Decorative content inside the background layer",
      badge: "Meta badge/chip above the main content",
      eyebrow: "Eyebrow/kicker",
      title: "Main title",
      subtitle: "Subtitle or supporting text",
      header: "Additional header content",
      aside: "Header side area",
      media: "Media content or foreground card",
      content: "Main body",
      footer: "Informational footer",
      actions: "Actions area",
      default: "Fallback body content"
    },
    returns: "HTMLDivElement with refresh/update/destroy methods",
    description: "Standardized parallax hero/section with structured header, body, actions, slots, and minimal refresh API."
  };
}

// Example:
// _.Parallax({ src: "/assets/hero.jpg", height: "280px", speed: 0.2 }, _.h2("Hello"));

// -------------------------------
  // 4) NOTIFY SERVICE (toast)
  // -------------------------------
  const [toasts, setToasts] = app.reactive.signal([]);
  const toastTimers = new Map();

  function clearToastTimer(id) {
    const timer = toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.delete(id);
    }
  }

  function removeToast(id) {
    if (!id) return null;
    clearToastTimer(id);
    setToasts(toasts().filter((entry) => entry.id !== id));
    return id;
  }

  function clearToasts() {
    for (const id of toastTimers.keys()) clearToastTimer(id);
    setToasts([]);
  }

  function scheduleToastTimer(entry) {
    if (!entry?.id) return;
    clearToastTimer(entry.id);
    if (!(entry.timeout > 0)) return;
    toastTimers.set(entry.id, setTimeout(() => {
      removeToast(entry.id);
    }, entry.timeout));
  }

  function updateToast(id, patch = {}) {
    if (!id) return null;
    let nextEntry = null;
    setToasts(toasts().map((entry) => {
      if (entry.id !== id) return entry;
      nextEntry = normalizeNotifyPayload({ ...entry, ...patch, id: entry.id }, patch.type || patch.state || patch.color || entry.type);
      return nextEntry;
    }));
    if (nextEntry) scheduleToastTimer(nextEntry);
    return nextEntry?.id || null;
  }

  function renderNotifyToast(entry) {
    const close = () => removeToast(entry.id);
    const update = (patch = {}) => updateToast(entry.id, patch);
    const ctx = { toast: entry, id: entry.id, close, update };
    const resolveNotifyRender = (value) => typeof value === "function" ? value(ctx) : value;
    const iconFallback = (() => {
      if (entry.icon === false || entry.icon === null) return null;
      if (entry.icon != null) {
        const resolvedIcon = resolveNotifyRender(entry.icon);
        return typeof resolvedIcon === "string" ? UI.Icon({ name: resolvedIcon, size: "sm" }) : CMSwift.ui.slot(resolvedIcon, { as: "icon" });
      }
      const iconName = notifyIconMap[entry.type];
      return iconName ? UI.Icon({ name: iconName, size: "sm" }) : null;
    })();

    const iconNodes = renderSlotToArray(entry.slots, "icon", ctx, iconFallback);
    const titleNodes = renderSlotToArray(entry.slots, "title", ctx, resolveNotifyRender(entry.title));
    const messageNodes = renderSlotToArray(entry.slots, "message", ctx, resolveNotifyRender(entry.message));
    const descriptionNodes = renderSlotToArray(entry.slots, "description", ctx, resolveNotifyRender(entry.description));
    const metaNodes = renderSlotToArray(entry.slots, "meta", ctx, resolveNotifyRender(entry.meta));
    const actionsNodes = renderSlotToArray(entry.slots, "actions", ctx, resolveNotifyRender(entry.actions));
    const bodyNodes = renderSlotToArray(entry.slots, "default", ctx, resolveNotifyRender(entry.body));
    const dismissNodes = renderSlotToArray(entry.slots, "dismiss", ctx, resolveNotifyRender(entry.dismiss));
    const dismissContent = dismissNodes.length
      ? dismissNodes
      : (entry.closable
        ? [UI.Btn({
          class: "cms-toast-close",
          outline: true,
          size: "xs",
          "aria-label": entry.dismissLabel,
          onClick: close
        }, UI.Icon({ name: "close", size: "xs" }))]
        : []);

    const node = _.div({
      class: uiClass([
        "cms-toast",
        `cms-toast-${entry.type}`,
        `cms-toast-${entry.variant}`,
        uiWhen(entry.closable, "is-closable"),
        entry.class
      ]),
      style: entry.style || {},
      role: entry.role
    },
      iconNodes.length ? _.div({ class: "cms-toast-icon" }, ...iconNodes) : null,
      _.div(
        { class: "cms-toast-main" },
        _.div(
          { class: "cms-toast-copy" },
          titleNodes.length ? _.div({ class: "cms-toast-title" }, ...titleNodes) : null,
          messageNodes.length ? _.div({ class: "cms-toast-message" }, ...messageNodes) : null,
          descriptionNodes.length ? _.div({ class: "cms-toast-description" }, ...descriptionNodes) : null,
          bodyNodes.length ? _.div({ class: "cms-toast-body" }, ...bodyNodes) : null,
          metaNodes.length ? _.div({ class: "cms-toast-meta" }, ...metaNodes) : null
        ),
        actionsNodes.length ? _.div({ class: "cms-toast-actions" }, ...actionsNodes) : null
      ),
      dismissContent.length ? _.div({ class: "cms-toast-dismiss" }, ...dismissContent) : null
    );

    setPropertyProps(node, entry);
    return node;
  }

  function ensureToastRoot() {
    let root = document.querySelector(".cms-toast-layer");
    if (root) return root;
    root = document.createElement("div");
    root.className = "cms-toast-layer";
    document.body.appendChild(root);

    app.reactive.effect(() => {
      const list = toasts();
      root.innerHTML = "";
      const groups = new Map();
      for (const toast of list) {
        const key = normalizeNotifyPosition(toast.position);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(toast);
      }

      for (const position of NOTIFY_POSITIONS) {
        const entries = groups.get(position);
        if (!entries?.length) continue;
        const wrap = _.div({ class: uiClass(["cms-toast-wrap", `is-${position}`]) },
          ...entries.map((entry) => renderNotifyToast(entry))
        );
        root.appendChild(wrap);
      }
    }, "CMSwiftUI:toasts");

    return root;
  }

  function pushToast(input = {}) {
    ensureToastRoot();
    const entry = normalizeNotifyPayload(input);
    entry.id = entry.id || Math.random().toString(36).slice(2);
    setToasts([...toasts().filter((item) => item.id !== entry.id), entry]);
    scheduleToastTimer(entry);
    return entry.id;
  }

  app.services.notify.show = pushToast;
  app.services.notify.success = createNotifyShortcut("success", "Success");
  app.services.notify.error = createNotifyShortcut("danger", "Error");
  app.services.notify.warning = createNotifyShortcut("warning", "Warning");
  app.services.notify.info = createNotifyShortcut("info", "Info");
  app.services.notify.primary = createNotifyShortcut("primary", "Notice");
  app.services.notify.secondary = createNotifyShortcut("secondary", "Notice");
  app.services.notify.update = updateToast;
  app.services.notify.remove = removeToast;
  app.services.notify.clear = clearToasts;
  app.services.notify.promise = UI.Notify.promise;

  // Optional shortcut
  app.notify = app.services.notify;

  // useForm + UI.Form
  CMSwift.form = CMSwift.form || {};

  CMSwift.form._isPromise = (v) => v && typeof v.then === "function";

  CMSwift.form._normalizeRules = (rules) => {
    // rules: { fieldName: [fn|{rule, message}] } or { fieldName: fn } etc.
    const out = {};
    for (const k in (rules || {})) {
      const r = rules[k];
      out[k] = Array.isArray(r) ? r : [r];
    }
    return out;
  };

  // rule returns: true (ok) | false (generic error) | string (error msg)
  CMSwift.form._runRule = async (rule, value, ctx) => {
    let fn = rule;
    let msg = null;

    if (rule && typeof rule === "object" && typeof rule.rule === "function") {
      fn = rule.rule;
      msg = rule.message || null;
    }

    const res = fn ? fn(value, ctx) : true;
    const v = CMSwift.form._isPromise(res) ? await res : res;

    if (v === true) return null;
    if (typeof v === "string") return v;
    if (v === false) return msg || "Valore non valido";
    return v ? null : (msg || "Valore non valido");
  };

  CMSwift.useForm = (options = {}) => {
    const model = options.model || {};
    const rules = CMSwift.form._normalizeRules(options.rules || {});
    const validateOn = options.validateOn || "submit"; // "input" | "blur" | "submit"
    const initial = options.initial || null;

    // errors: { field: string|null }
    const errors = _.rod({});
    const touched = _.rod({});
    const submitting = _.rod(false);
    const submitError = _.rod(null);

    const getModelObj = () => {
      // allow rod model (model.value)
      if (model && typeof model === "object" && "value" in model) return model.value || {};
      return model;
    };

    const setModelObj = (next) => {
      if (model && typeof model === "object" && "value" in model) model.value = next;
      else {
        // mutate existing
        const obj = model || {};
        for (const k in obj) delete obj[k];
        Object.assign(obj, next);
      }
    };

    const getFieldValue = (name) => {
      const obj = getModelObj();
      return obj ? obj[name] : undefined;
    };

    const setFieldValue = (name, value) => {
      const obj = { ...(getModelObj() || {}) };
      obj[name] = value;
      setModelObj(obj);
    };

    const setError = (name, msg) => {
      const e = { ...(errors.value || {}) };
      if (msg) e[name] = msg;
      else delete e[name];
      errors.value = e;
    };

    const getError = (name) => (errors.value || {})[name] || null;

    const touch = (name) => {
      touched.value = { ...(touched.value || {}), [name]: true };
    };

    const isTouched = (name) => !!(touched.value || {})[name];

    const validateField = async (name) => {
      const list = rules[name] || [];
      if (!list.length) {
        setError(name, null);
        return true;
      }
      const value = getFieldValue(name);
      const ctx = { name, value, model: getModelObj(), form: api };

      for (const rule of list) {
        if (!rule) continue;
        const msg = await CMSwift.form._runRule(rule, value, ctx);
        if (msg) {
          setError(name, msg);
          return false;
        }
      }
      setError(name, null);
      return true;
    };

    const validate = async () => {
      submitError.value = null;
      const names = Object.keys(rules);
      let ok = true;
      for (const n of names) {
        const r = await validateField(n);
        if (!r) ok = false;
      }
      return ok;
    };

    const reset = () => {
      submitError.value = null;
      errors.value = {};
      touched.value = {};
      if (initial) setModelObj({ ...(initial || {}) });
    };

    const submit = async (fn) => {
      submitting.value = true;
      submitError.value = null;
      try {
        const ok = await validate();
        if (!ok) return { ok: false, reason: "validation" };
        const res = await fn?.(getModelObj(), api);
        return { ok: true, result: res };
      } catch (e) {
        console.error("[useForm] submit error:", e);
        submitError.value = (e && e.message) ? e.message : String(e);
        return { ok: false, reason: "exception", error: e };
      } finally {
        submitting.value = false;
      }
    };

    // Field binding factory for UI components
    const field = (name, fieldOpts = {}) => {
      const r = _.rod("");
      // keep rod synced with form model
      // when r changes -> update model
      r.action?.((v) => {
        setFieldValue(name, v)
      });

      const shouldShowError = () => {
        if (validateOn === "submit" || validateOn === "input" || validateOn === "blur") return true;
        return isTouched(name);
      };

      let activeEl = null;
      let blurHandled = false;
      let watchingOutside = false;

      const runBlur = async () => {
        if (blurHandled) return;
        blurHandled = true;
        touch(name);
        if (validateOn === "blur" || validateOn === "input") await validateField(name);
        setTimeout(() => { blurHandled = false; }, 0);
      };

      const onDocPointerDown = (e) => {
        if (!activeEl) return;
        if (activeEl === e.target || (activeEl.contains && activeEl.contains(e.target))) return;
        runBlur();
        activeEl = null;
        if (watchingOutside) {
          watchingOutside = false;
          document.removeEventListener("pointerdown", onDocPointerDown, true);
        }
      };

      const ensureOutsideWatch = () => {
        if (watchingOutside) return;
        watchingOutside = true;
        document.addEventListener("pointerdown", onDocPointerDown, true);
      };

      const onInput = async () => {
        activeEl = document.activeElement;
        blurHandled = false;
        ensureOutsideWatch();
        if (validateOn === "input") await validateField(name);
      };

      const onBlur = async () => {
        await runBlur();
        activeEl = null;
        if (watchingOutside) {
          watchingOutside = false;
          document.removeEventListener("pointerdown", onDocPointerDown, true);
        }
      };
      return {
        name,
        model: r,
        get value() { return r.value; },
        set value(v) { r.value = v; },
        error: () => (shouldShowError() ? getError(name) : null),
        success: fieldOpts.success || null,
        warning: fieldOpts.warning || null,
        note: fieldOpts.note || null,
        touch: () => touch(name),
        validate: () => validateField(name),
        onInput,
        onBlur,
        // allow passing through custom hints
        hint: fieldOpts.hint || null
      };
    };

    const api = {
      model,
      errors,
      touched,
      submitting,
      submitError,

      getValue: getFieldValue,
      setValue: setFieldValue,
      getError,
      setError,

      touch,
      isTouched,

      field,
      validateField,
      validate,
      reset,
      submit
    };

    return api;
  };

  UI.Form = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const form = props.form; // required-ish
    const onSubmit = props.onSubmit; // async (model, form) => ...
    const cls = uiClass(["cms-form", props.class]);

    const p = CMSwift.omit(props, ["form", "onSubmit"]);
    p.class = cls;

    const el = _.form({
      ...p,
      onSubmit: async (e) => {
        e.preventDefault();
        if (!form) return;
        await form.submit(onSubmit || (async () => { }));
      }
    });

    // children can be nodes or function(form)->nodes
    const content = [];
    for (const ch of (children || [])) {
      const v = (typeof ch === "function") ? ch(form) : ch;
      const out = CMSwift.ui.slot(v);
      if (!out) continue;
      if (Array.isArray(out)) content.push(...out);
      else content.push(out);
    }

    content.forEach(n => el.appendChild(n));

    // disable fields/buttons while submitting (optional UX)
    if (form && form.submitting) {
      CMSwift.reactive.effect(() => {
        el.classList.toggle("is-submitting", !!form.submitting.value);
      }, "UI.Form:submitting");
    }

    return el;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Form = {
      signature: "UI.Form({ form, onSubmit, ...props }, ...children)",
      props: {
        form: "useForm() instance",
        onSubmit: "async (model, form) => any",
        class: "string",
        style: "object"
      },
      slots: {
        default: "(form) => Node|Array|Node"
      },
      returns: "HTMLFormElement"
    };
  }

  // ===============================
  // Dialog Service (Modal)
  // ===============================
  app.services = app.services || {};
  app.services.dialog = app.services.dialog || {};
  app.dialog = app.services.dialog;

  let modalRoot = null;

  function ensureModalRoot() {
    if (modalRoot) return modalRoot;

    modalRoot = document.createElement("div");
    modalRoot.setAttribute("data-cms-modal-root", "true");
    document.body.appendChild(modalRoot);
    return modalRoot;
  }

  UI.cardHeader = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const cls = uiClass(["cms-card-header", uiWhen(props.divider, "divider"), props.class]);
    const p = CMSwift.omit(props, ["divider", "align", "justify", "gap", "wrap", "direction", "slots"]);
    p.class = cls;

    const style = { ...(props.style || {}) };
    const align = uiStyleValue(props.align);
    if (align != null && !uiHasResponsiveOverride(props, "align")) style.alignItems = align;
    const justify = uiStyleValue(props.justify);
    if (justify != null && !uiHasResponsiveOverride(props, "justify")) style.justifyContent = justify;
    const wrap = uiStyleValue(props.wrap, (v) => v ? "wrap" : "nowrap");
    if (wrap != null && !uiHasResponsiveOverride(props, "wrap")) style.flexWrap = wrap;
    const direction = uiStyleValue(props.direction);
    if (direction != null && !uiHasResponsiveOverride(props, "direction")) style.flexDirection = direction;
    const gap = uiStyleValue(props.gap, toCssSize);
    if (gap != null && !uiHasResponsiveOverride(props, "gap")) style.gap = gap;
    if (Object.keys(style).length) p.style = style;
    CMSwift.uiApplyResponsiveProps(p, props, CMSwift.uiResponsiveStyleRules);

    const el = _.div(p, ...renderSlotToArray(slots, "default", {}, children));
    setPropertyProps(el, props);
    return el;
  };
  UI.cardBody = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const cls = uiClass(["cms-card-body", props.class]);
    const p = CMSwift.omit(props, [
      "slots", "display", "direction", "wrap", "align", "justify", "gap",
      "rowGap", "columnGap", "padding", "width"
    ]);
    p.class = cls;
    CMSwift.uiApplyResponsiveProps(p, props, CMSwift.uiResponsiveStyleRules);
    const el = _.div(p, ...renderSlotToArray(slots, "default", {}, children));
    setPropertyProps(el, props);
    return el;
  };
  UI.cardFooter = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const cls = uiClass(["cms-card-footer", uiWhen(props.divider, "divider"), props.class]);
    const p = CMSwift.omit(props, ["divider", "align", "justify", "gap", "wrap", "direction", "slots"]);
    p.class = cls;

    const style = { ...(props.style || {}) };
    const align = uiStyleValue(props.align);
    if (align != null && !uiHasResponsiveOverride(props, "align")) style.alignItems = align;
    const justify = uiStyleValue(props.justify);
    if (justify != null && !uiHasResponsiveOverride(props, "justify")) style.justifyContent = justify;
    const wrap = uiStyleValue(props.wrap, (v) => v ? "wrap" : "nowrap");
    if (wrap != null && !uiHasResponsiveOverride(props, "wrap")) style.flexWrap = wrap;
    const direction = uiStyleValue(props.direction);
    if (direction != null && !uiHasResponsiveOverride(props, "direction")) style.flexDirection = direction;
    const gap = uiStyleValue(props.gap, toCssSize);
    if (gap != null && !uiHasResponsiveOverride(props, "gap")) style.gap = gap;
    if (Object.keys(style).length) p.style = style;
    CMSwift.uiApplyResponsiveProps(p, props, CMSwift.uiResponsiveStyleRules);

    const el = _.div(p, ...renderSlotToArray(slots, "default", {}, children));
    setPropertyProps(el, props);
    return el;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.cardHeader = {
      signature: "UI.cardHeader(...children) | UI.cardHeader(props, ...children)",
      props: {
        divider: "boolean",
        align: `stretch|flex-start|center|flex-end|baseline`,
        justify: `flex-start|center|flex-end|space-between|space-around|space-evenly`,
        wrap: "boolean",
        direction: "row|column|string",
        gap: "string|number",
        mobile: "{ gap?, align?, justify?, wrap?, direction? }",
        tablet: "{ gap?, align?, justify?, wrap?, direction? }",
        pc: "{ gap?, align?, justify?, wrap?, direction? }",
        slots: "{ default? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Card header content"
      },
      returns: "HTMLDivElement",
      description: "Header della card con supporto layout flex."
    };
    UI.meta.cardBody = {
      signature: "UI.cardBody(...children) | UI.cardBody(props, ...children)",
      props: {
        padding: "string|number",
        gap: "string|number",
        direction: "row|column|string",
        mobile: "{ padding?, gap?, direction?, width? }",
        tablet: "{ padding?, gap?, direction?, width? }",
        pc: "{ padding?, gap?, direction?, width? }",
        slots: "{ default? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Card body content"
      },
      returns: "HTMLDivElement",
      description: "Body della card."
    };
    UI.meta.cardFooter = {
      signature: "UI.cardFooter(...children) | UI.cardFooter(props, ...children)",
      props: {
        divider: "boolean",
        align: `stretch|flex-start|center|flex-end|baseline`,
        justify: `flex-start|center|flex-end|space-between|space-around|space-evenly`,
        wrap: "boolean",
        direction: "row|column|string",
        gap: "string|number",
        mobile: "{ gap?, align?, justify?, wrap?, direction? }",
        tablet: "{ gap?, align?, justify?, wrap?, direction? }",
        pc: "{ gap?, align?, justify?, wrap?, direction? }",
        slots: "{ default? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Card footer content"
      },
      returns: "HTMLDivElement",
      description: "Footer della card con supporto layout flex."
    };
  }

  UI.Dialog = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const stateList = ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"];
    const sizeList = ["xs", "sm", "md", "lg", "xl", "full"];
    let currentProps = { ...props };
    let entry = null;
    let lastActive = null;
    const resolveRender = (value, ctx) => typeof value === "function" ? value(ctx) : value;
    const splitClasses = (value) => String(value || "").split(/\s+/).filter(Boolean);
    const setTrackedClasses = (target, key, classes) => {
      if (!target) return;
      const prev = target[key] || [];
      if (prev.length) target.classList.remove(...prev);
      const next = (classes || []).filter(Boolean);
      if (next.length) target.classList.add(...next);
      target[key] = next;
    };
    const setStyleValue = (target, name, value, formatter = (v) => v) => {
      if (!target) return;
      if (value == null || value === "") {
        target.style.removeProperty(name);
        return;
      }
      target.style.setProperty(name, formatter(value));
    };
    const fullscreenViewportSize = () => {
      const vv = window.visualViewport;
      const left = Math.max(0, Math.round(vv?.offsetLeft ?? 0));
      const top = Math.max(0, Math.round(vv?.offsetTop ?? 0));
      const width = Math.max(0, Math.round(vv?.width ?? window.innerWidth ?? 0));
      const height = Math.max(0, Math.round(vv?.height ?? window.innerHeight ?? 0));
      return { left, top, width, height };
    };
    const syncFullscreenViewport = (currentEntry) => {
      if (!currentEntry?.panel) return;
      const { left, top, width, height } = fullscreenViewportSize();
      setStyleValue(currentEntry.panel, "position", "fixed");
      setStyleValue(currentEntry.panel, "inset", 0, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "top", top, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "left", left, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "right", "auto");
      setStyleValue(currentEntry.panel, "bottom", "auto");
      setStyleValue(currentEntry.panel, "width", width, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "height", height, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "min-height", height, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "max-width", width, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "max-height", height, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "min-width", 0, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "margin", 0, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "box-sizing", "border-box");
      setStyleValue(currentEntry.panel, "border-width", 0, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "border-radius", 0, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "transform", "none");
      setStyleValue(currentEntry.panel, "overflow", "hidden");
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-left", left, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-top", top, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-width", width, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-height", height, (v) => `${v}px`);
    };
    const clearFullscreenViewport = (currentEntry) => {
      if (!currentEntry?.panel) return;
      setStyleValue(currentEntry.panel, "position", null);
      setStyleValue(currentEntry.panel, "inset", null);
      setStyleValue(currentEntry.panel, "top", null);
      setStyleValue(currentEntry.panel, "left", null);
      setStyleValue(currentEntry.panel, "right", null);
      setStyleValue(currentEntry.panel, "bottom", null);
      setStyleValue(currentEntry.panel, "width", null);
      setStyleValue(currentEntry.panel, "height", null);
      setStyleValue(currentEntry.panel, "min-height", null);
      setStyleValue(currentEntry.panel, "max-width", null);
      setStyleValue(currentEntry.panel, "max-height", null);
      setStyleValue(currentEntry.panel, "min-width", null);
      setStyleValue(currentEntry.panel, "margin", null);
      setStyleValue(currentEntry.panel, "box-sizing", null);
      setStyleValue(currentEntry.panel, "border-width", null);
      setStyleValue(currentEntry.panel, "border-radius", null);
      setStyleValue(currentEntry.panel, "transform", null);
      setStyleValue(currentEntry.panel, "overflow", null);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-left", null);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-top", null);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-width", null);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-height", null);
    };
    const ensureFullscreenViewportTracking = (currentEntry, enabled) => {
      if (!currentEntry) return;
      currentEntry._dialogViewportCleanup?.();
      currentEntry._dialogViewportCleanup = null;
      if (!enabled) {
        clearFullscreenViewport(currentEntry);
        return;
      }
      let frameId = null;
      const raf = globalThis.requestAnimationFrame || ((fn) => setTimeout(() => fn(Date.now()), 0));
      const caf = globalThis.cancelAnimationFrame || clearTimeout;
      const sync = () => syncFullscreenViewport(currentEntry);
      const scheduleSync = () => {
        if (frameId != null) caf(frameId);
        frameId = raf(() => {
          frameId = null;
          sync();
        });
      };
      sync();
      scheduleSync();
      window.addEventListener("resize", sync);
      window.addEventListener("orientationchange", scheduleSync);
      window.visualViewport?.addEventListener?.("resize", sync);
      window.visualViewport?.addEventListener?.("scroll", scheduleSync);
      currentEntry._dialogViewportCleanup = () => {
        if (frameId != null) {
          caf(frameId);
          frameId = null;
        }
        window.removeEventListener("resize", sync);
        window.removeEventListener("orientationchange", scheduleSync);
        window.visualViewport?.removeEventListener?.("resize", sync);
        window.visualViewport?.removeEventListener?.("scroll", scheduleSync);
      };
    };
    const getOptions = () => currentProps;
    const getStateClass = (opts) => {
      const value = uiUnwrap(opts.state ?? opts.color);
      if (!value) return "";
      return stateList.includes(value) ? value : String(value);
    };
    const getSizeClass = (opts) => {
      const value = uiUnwrap(opts.size);
      return (typeof value === "string" && sizeList.includes(value)) ? value : "";
    };
    const getAlignClass = (opts) => {
      const raw = String(uiUnwrap(opts.actionsAlign ?? opts.footerAlign ?? opts.alignActions ?? "end")).toLowerCase();
      if (["start", "left"].includes(raw)) return "start";
      if (["center", "middle"].includes(raw)) return "center";
      if (["between", "space-between"].includes(raw)) return "between";
      if (["stretch", "full"].includes(raw)) return "stretch";
      return "end";
    };
    const getVerticalAlignClass = (opts) => {
      const raw = String(uiUnwrap(opts.align ?? opts.verticalAlign ?? opts.position ?? "center")).toLowerCase();
      if (["top", "start", "flex-start"].includes(raw)) return "cms-dialog-align-top";
      if (["bottom", "end", "flex-end"].includes(raw)) return "cms-dialog-align-bottom";
      return "";
    };
    const isClosable = (opts) => {
      const value = opts.closable ?? opts.dismissible ?? opts.closeButton;
      return value !== false;
    };
    const buildContent = () => {
      const opts = getOptions();
      const ctx = {
        close,
        dismiss: close,
        open,
        toggle,
        update,
        isOpen,
        entry: () => entry,
        props: opts
      };
      const iconFallback = opts.icon != null
        ? (typeof opts.icon === "string"
          ? UI.Icon({ name: opts.icon, size: opts.iconSize || "md" })
          : CMSwift.ui.slot(opts.icon, { as: "icon" }))
        : null;
      const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, resolveRender(opts.eyebrow, ctx));
      const titleNodes = renderSlotToArray(slots, "title", ctx, resolveRender(opts.title ?? opts.heading ?? opts.header, ctx));
      const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, resolveRender(opts.subtitle ?? opts.description, ctx));
      const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
      const customHeaderNodes = renderSlotToArray(slots, "header", ctx, resolveRender(opts.headerContent ?? opts.head, ctx));
      const closeSlotNodes = isClosable(opts)
        ? renderSlotToArray(slots, "close", ctx, UI.Btn({
          class: "cms-dialog-close",
          size: "sm",
          outline: true,
          "aria-label": opts.closeLabel || "Chiudi dialog",
          "data-dialog-close": true
        }, UI.Icon({ name: opts.closeIcon || "close", size: "sm" })))
        : [];
      const bodyRaw = opts.content ?? opts.body ?? opts.message ?? (children && children.length ? children : null);
      let contentNodes = renderSlotToArray(slots, "content", ctx, resolveRender(bodyRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "body", ctx, resolveRender(bodyRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "default", ctx, resolveRender(bodyRaw, ctx));
      const footerRaw = resolveRender(opts.footer ?? opts.actions, ctx);
      let footerNodes = renderSlotToArray(slots, "footer", ctx, footerRaw);
      if (!footerNodes.length) footerNodes = renderSlotToArray(slots, "actions", ctx, footerRaw);

      let headerEl = null;
      if (customHeaderNodes.length) {
        headerEl = _.div({ class: "cms-dialog-head cms-dialog-head-custom" }, ...customHeaderNodes);
      } else if (eyebrowNodes.length || titleNodes.length || subtitleNodes.length || iconNodes.length || closeSlotNodes.length) {
        headerEl = _.div(
          { class: "cms-dialog-head" },
          iconNodes.length ? _.div({ class: "cms-dialog-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-dialog-head-main" },
            eyebrowNodes.length ? _.div({ class: "cms-dialog-eyebrow" }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: "cms-dialog-title" }, ...titleNodes) : null,
            subtitleNodes.length ? _.div({ class: "cms-dialog-subtitle" }, ...subtitleNodes) : null
          ),
          closeSlotNodes.length ? _.div({ class: "cms-dialog-close-wrap" }, ...closeSlotNodes) : null
        );
      }

      const bodyEl = _.div(
        { class: uiClass(["cms-dialog-body", opts.bodyClass]) },
        ...contentNodes
      );
      const footerEl = footerNodes.length
        ? _.div({
          class: uiClass([
            "cms-dialog-actions",
            `is-${getAlignClass(opts)}`,
            uiWhen(opts.stackActions, "is-stacked"),
            opts.actionsClass,
            opts.footerClass
          ])
        }, ...footerNodes)
        : null;

      return _.div({
        class: uiClass([
          "cms-dialog-shell",
          uiWhen(!!headerEl, "has-head"),
          uiWhen(!!footerEl, "has-footer"),
          uiWhen(opts.divider !== false, "with-divider")
        ])
      }, ...[headerEl, bodyEl, footerEl].filter(Boolean));
    };
    const applyEntryOptions = (currentEntry) => {
      if (!currentEntry?.panel) return;
      const opts = getOptions();
      const stateClass = getStateClass(opts);
      const sizeClass = getSizeClass(opts);
      setTrackedClasses(currentEntry.panel, "_dialogClassTokens", [
        "cms-dialog",
        "cms-singularity",
        "cms-clear-set",
        sizeClass ? `cms-dialog-${sizeClass}` : "",
        stateClass,
        stateClass ? `cms-state-${stateClass}` : "",
        uiUnwrap(opts.fullscreen) ? "fullscreen" : "",
        uiUnwrap(opts.scrollable) ? "scrollable" : "",
        uiUnwrap(opts.stickyHeader) ? "sticky-head" : "",
        uiUnwrap(opts.stickyActions) ? "sticky-actions" : "",
        uiUnwrap(opts.borderless) ? "borderless" : "",
        ...splitClasses(opts.class),
        ...splitClasses(opts.panelClass)
      ]);
      setTrackedClasses(currentEntry.overlay, "_dialogOverlayClassTokens", [
        getVerticalAlignClass(opts),
        uiUnwrap(opts.backdropBlur) ? "cms-dialog-overlay-blur" : "",
        ...splitClasses(opts.overlayClass)
      ]);
      setStyleValue(currentEntry.panel, "--cms-dialog-width", uiUnwrap(opts.width), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-min-width", uiUnwrap(opts.minWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-max-width", uiUnwrap(opts.maxWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-max-height", uiUnwrap(opts.maxHeight), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-body-max-height", uiUnwrap(opts.bodyMaxHeight ?? opts.contentMaxHeight), toCssSize);
      if (opts.style) Object.assign(currentEntry.panel.style, opts.style);
      setPropertyProps(currentEntry.panel, opts);
      ensureFullscreenViewportTracking(currentEntry, uiUnwrap(opts.fullscreen));
      currentEntry.panel.setAttribute("role", opts.role || "dialog");
      currentEntry.panel.setAttribute("aria-modal", opts.modal === false ? "false" : "true");
      if (opts.ariaLabel) currentEntry.panel.setAttribute("aria-label", opts.ariaLabel);
      else currentEntry.panel.removeAttribute("aria-label");
    };
    const renderOpenContent = () => {
      if (!entry?.panel) return;
      entry.panel.replaceChildren(buildContent());
    };
    const update = (nextProps = {}) => {
      if (nextProps && typeof nextProps === "object") currentProps = { ...currentProps, ...nextProps };
      if (entry) {
        applyEntryOptions(entry);
        renderOpenContent();
      }
      return api;
    };
    const open = (nextProps = null) => {
      if (nextProps && typeof nextProps === "object") currentProps = { ...currentProps, ...nextProps };
      if (entry) {
        applyEntryOptions(entry);
        renderOpenContent();
        return entry;
      }
      lastActive = document.activeElement;
      const opts = getOptions();
      const persistent = opts.persistent === true;
      entry = CMSwift.overlay.open(() => buildContent(), {
        type: "dialog",
        backdrop: opts.backdrop !== false,
        lockScroll: opts.lockScroll !== false,
        trapFocus: opts.trapFocus !== false,
        autoFocus: opts.autoFocus !== false,
        closeOnOutside: opts.closeOnOutside ?? !persistent,
        closeOnBackdrop: opts.closeOnBackdrop ?? !persistent,
        closeOnEsc: opts.closeOnEsc ?? !persistent,
        className: uiClassStatic(["cms-dialog"]),
        onClose: () => {
          entry?._dialogViewportCleanup?.();
          entry?.panel?.removeEventListener("click", onPanelClick);
          entry = null;
          getOptions().onClose?.();
          if (lastActive && typeof lastActive.focus === "function") {
            setTimeout(() => lastActive.focus(), 0);
          }
        }
      });
      const onPanelClick = (e) => {
        const target = e.target;
        if (target && target.closest && target.closest("[data-dialog-close]")) close();
      };
      entry.panel.addEventListener("click", onPanelClick);
      applyEntryOptions(entry);
      overlayEnter(entry);
      getOptions().onOpen?.(entry);
      return entry;
    };

    const close = () => {
      if (!entry) return;
      const toClose = entry;
      overlayLeave(toClose, () => CMSwift.overlay.close(toClose.id));
    };

    const isOpen = () => !!entry;
    const toggle = (nextProps = null) => isOpen() ? (close(), null) : open(nextProps);
    const api = { open, close, toggle, update, isOpen, entry: () => entry, props: () => ({ ...currentProps }) };

    return api;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Dialog = {
      signature: "UI.Dialog(props) | UI.Dialog(props, ...children) -> { open, close, toggle, update, isOpen }",
      props: {
        title: "String|Node|Function|Array|({ close })=>Node",
        subtitle: "String|Node|Function|Array|({ close })=>Node",
        eyebrow: "String|Node|Function|Array|({ close })=>Node",
        icon: "String|Node|Function|Array",
        content: "Node|Function|Array|({ close })=>Node",
        body: "Alias of content",
        actions: "Node|Function|Array|({ close })=>Node",
        footer: "Alias of actions",
        size: "xs|sm|md|lg|xl|full",
        state: "primary|secondary|warning|danger|success|info|light|dark",
        color: "Alias of state",
        width: "string|number",
        minWidth: "string|number",
        maxWidth: "string|number",
        maxHeight: "string|number",
        bodyMaxHeight: "string|number",
        persistent: "boolean",
        closable: "boolean",
        closeButton: "boolean",
        closeIcon: "string",
        align: "top|center|bottom",
        actionsAlign: "start|center|end|between|stretch",
        stickyHeader: "boolean",
        stickyActions: "boolean",
        scrollable: "boolean",
        stackActions: "boolean",
        fullscreen: "boolean",
        backdrop: "boolean",
        backdropBlur: "boolean",
        lockScroll: "boolean",
        trapFocus: "boolean",
        autoFocus: "boolean",
        closeOnOutside: "boolean",
        closeOnBackdrop: "boolean",
        closeOnEsc: "boolean",
        slots: "{ icon?, eyebrow?, title?, subtitle?, header?, content?, body?, footer?, actions?, close?, default? }",
        class: "string",
        panelClass: "string",
        overlayClass: "string",
        style: "object"
      },
      events: {
        onOpen: "(entry)",
        onClose: "void"
      },
      slots: {
        icon: "Dialog icon ({ close })",
        eyebrow: "Eyebrow above the title ({ close })",
        title: "Dialog title ({ close })",
        subtitle: "Dialog subtitle ({ close })",
        header: "Custom header ({ close })",
        content: "Dialog body ({ close })",
        body: "Alias of content ({ close })",
        footer: "Custom footer ({ close })",
        actions: "Dialog actions ({ close })",
        close: "Close action ({ close })",
        default: "Fallback body content ({ close })"
      },
      description: "Standardized dialog overlay with variants, animations, structured slots, and imperative API.",
      returns: "Object { open(overrides?), close(), toggle(overrides?), update(props), isOpen(), entry(), props() }"
    };
  }

  UI.TabPanel = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const rawTabs = Array.isArray(props.tabs)
      ? props.tabs
      : (Array.isArray(props.items) ? props.items : []);
    const model = resolveModel(props.model, "UI.TabPanel:model");
    const componentId = props.id || (`cms-tabpanel-` + Math.random().toString(36).slice(2, 9));
    const normalizeOrientation = (value) => String(uiUnwrap(value) || "vertical").toLowerCase() === "horizontal" ? "horizontal" : "vertical";
    const normalizePosition = (value) => String(uiUnwrap(value) || "before").toLowerCase() === "after" ? "after" : "before";
    const normalizeVariant = (value) => {
      const raw = String(uiUnwrap(value) || "").toLowerCase();
      if (raw === "pills" || raw === "pill") return "pills";
      if (raw === "soft" || raw === "card") return "soft";
      return "line";
    };
    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return CMSwift.uiColors.includes(raw) ? `var(--cms-${raw})` : String(raw);
    };

    const orientation = normalizeOrientation(props.orientation || props.orient || props.direction);
    const navPosition = normalizePosition(props.navPosition || props.barPosition || props.position);
    const variant = normalizeVariant(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line")));
    const wrapTabs = !!props.wrap;
    const swipeable = !!props.swipeable;
    const infinite = !!props.infinite;
    const animated = !!props.animated;
    const navFill = !!(props.navFill ?? props.fill ?? props.stretch);
    const disabledAll = !!props.disabled;

    const transitionDurationRaw = uiUnwrap(props.transitionDuration ?? props["transition-duration"]);
    const transitionDuration = (() => {
      if (transitionDurationRaw == null) return 220;
      if (typeof transitionDurationRaw === "number") return transitionDurationRaw;
      const parsed = parseFloat(transitionDurationRaw);
      return Number.isFinite(parsed) ? parsed : 220;
    })();
    const transitionEasing = uiUnwrap(props.transitionEasing ?? props["transition-easing"]) || "ease";
    const transitionPrev = props.transitionPrev ?? props["transition-prev"] ?? null;
    const transitionNext = props.transitionNext ?? props["transition-next"] ?? null;
    const accentColor = resolveAccent(props.color ?? props.state);

    const tabs = rawTabs.map((tab, index) => {
      if (tab == null) return null;
      if (typeof tab !== "object") {
        return {
          name: tab,
          labelFallback: tab,
          panelFallback: null,
          noteFallback: null,
          iconFallback: null,
          badgeFallback: null,
          hidden: false,
          raw: tab,
          index
        };
      }
      const name = tab.name ?? tab.value ?? tab.id ?? tab.key ?? tab.label ?? tab.title ?? `tab-${index}`;
      const hasLabel = tab.label != null || tab.title != null;
      const labelFallback = hasLabel
        ? (tab.label ?? tab.title)
        : (tab.children != null && tab.content == null && tab.panel == null ? tab.children : (tab.name ?? tab.value ?? `Tab ${index + 1}`));
      const panelFallback = tab.content ?? tab.panel ?? tab.body ?? (hasLabel ? tab.children : null);
      const noteFallback = tab.note ?? tab.subtitle ?? tab.description ?? null;
      const iconFallback = tab.icon ?? null;
      const badgeFallback = Object.prototype.hasOwnProperty.call(tab, "badge")
        ? tab.badge
        : (Object.prototype.hasOwnProperty.call(tab, "counter") ? tab.counter : null);
      return {
        ...tab,
        name,
        labelFallback,
        panelFallback,
        noteFallback,
        iconFallback,
        badgeFallback,
        index
      };
    }).filter(Boolean).filter((tab) => tab.hidden !== true && tab.visible !== false);

    const cls = uiClass([
      "cms-clear-set",
      "cms-tabpanel",
      "cms-singularity",
      orientation,
      `variant-${variant}`,
      uiWhen(wrapTabs, "wrap"),
      uiWhen(animated, "animated"),
      uiWhen(navFill, "nav-fill"),
      uiWhen(disabledAll, "disabled"),
      uiWhen(navPosition === "after", "nav-after"),
      props.class
    ]);
    const wrapProps = CMSwift.omit(props, [
      "tabs", "items", "value", "default", "defaultValue", "model",
      "orientation", "orient", "direction",
      "navPosition", "barPosition", "position",
      "variant", "pills", "soft",
      "navFill", "fill", "stretch",
      "wrap", "swipeable", "infinite", "animated",
      "transitionDuration", "transition-duration",
      "transitionEasing", "transition-easing",
      "transitionPrev", "transition-prev",
      "transitionNext", "transition-next",
      "slots", "empty",
      "tabClass", "tabStyle",
      "panelClass", "panelStyle",
      "navClass", "panelsClass",
      "class", "style"
    ]);
    wrapProps.class = cls;
    wrapProps.style = props.style;
    const wrap = _.div(wrapProps);

    if (animated) {
      wrap.style.setProperty("--cms-tabpanel-duration", `${transitionDuration}ms`);
      wrap.style.setProperty("--cms-tabpanel-easing", transitionEasing);
    }
    if (accentColor) {
      wrap.style.setProperty("--cms-tabpanel-accent", accentColor);
    }

    const nav = _.div({
      class: uiClass(["cms-tabpanel-nav", props.navClass]),
      role: "tablist",
      "aria-orientation": orientation
    });
    const panelsWrap = _.div({ class: uiClass(["cms-tabpanel-panels", props.panelsClass]) });

    const tabButtons = [];
    const panelNodes = [];
    let activeIndex = -1;

    const isHorizontal = () => orientation === "horizontal";
    const createCtx = (tab, index, active) => ({
      tab,
      name: tab.name,
      index,
      active,
      value: tab.name,
      select: () => setActiveByIndex(index),
      next: () => goNext(),
      prev: () => goPrev()
    });

    const findEnabledIndex = (start, step, allowWrap = false) => {
      if (!tabs.length) return -1;
      let idx = start;
      for (let i = 0; i < tabs.length; i += 1) {
        idx += step;
        if (idx >= tabs.length) {
          if (!allowWrap) return -1;
          idx = 0;
        } else if (idx < 0) {
          if (!allowWrap) return -1;
          idx = tabs.length - 1;
        }
        if (!tabs[idx]?.disabled) return idx;
      }
      return -1;
    };

    const focusIndex = (index) => {
      const btn = tabButtons[index]?.btn;
      if (!btn || typeof btn.focus !== "function") return;
      requestAnimationFrame(() => btn.focus());
    };

    const makeLabelNodes = (tab, index, isActive) => {
      const ctx = createCtx(tab, index, isActive);
      const labelNode = CMSwift.ui.renderSlot(slots, "label", ctx, tab.labelFallback);
      return renderSlotToArray(null, "default", {}, labelNode);
    };

    const makeTabNode = (tab, index) => {
      const isActive = index === activeIndex;
      const tabId = `${componentId}-tab-${index}`;
      const panelId = `${componentId}-panel-${index}`;
      const ctx = createCtx(tab, index, isActive);
      const labelNodes = makeLabelNodes(tab, index, isActive);
      const iconFallback = tab.iconFallback != null
        ? (typeof tab.iconFallback === "string"
          ? UI.Icon({ name: tab.iconFallback, size: tab.iconSize ?? tab.size ?? props.size ?? null })
          : tab.iconFallback)
        : null;
      const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
      const noteNodes = renderSlotToArray(slots, "note", ctx, tab.noteFallback);
      const badgeNodes = renderSlotToArray(slots, "badge", ctx, tab.badgeFallback);
      const fallbackTabContent = _.span({ class: "cms-tabpanel-tab-inner" },
        iconNodes.length ? _.span({ class: "cms-tabpanel-tab-icon" }, ...iconNodes) : null,
        _.span({ class: "cms-tabpanel-tab-copy" },
          _.span({ class: "cms-tabpanel-tab-label" }, ...(labelNodes.length ? labelNodes : [""])),
          noteNodes.length ? _.span({ class: "cms-tabpanel-tab-note" }, ...noteNodes) : null
        ),
        badgeNodes.length ? _.span({ class: "cms-tabpanel-tab-badge" }, ...badgeNodes) : null
      );
      const contentNodes = renderSlotToArray(slots, "tab", {
        ...ctx,
        label: labelNodes,
        icon: iconNodes,
        note: noteNodes,
        badge: badgeNodes,
        tabId,
        panelId
      }, fallbackTabContent);
      const onKeydown = (e) => {
        if (disabledAll || tab.disabled) return;
        const key = e.key;
        if (key === "Enter" || key === " ") {
          e.preventDefault();
          setActiveByIndex(index);
          return;
        }
        if (key === "Home") {
          e.preventDefault();
          const first = tabs.findIndex((item) => !item.disabled);
          if (first >= 0) {
            setActiveByIndex(first);
            focusIndex(first);
          }
          return;
        }
        if (key === "End") {
          e.preventDefault();
          const last = (() => {
            for (let i = tabs.length - 1; i >= 0; i -= 1) {
              if (!tabs[i]?.disabled) return i;
            }
            return -1;
          })();
          if (last >= 0) {
            setActiveByIndex(last);
            focusIndex(last);
          }
          return;
        }
        const prevKeys = isHorizontal() ? ["ArrowLeft"] : ["ArrowUp"];
        const nextKeys = isHorizontal() ? ["ArrowRight"] : ["ArrowDown"];
        if (prevKeys.includes(key)) {
          e.preventDefault();
          const prev = findEnabledIndex(index, -1, infinite);
          if (prev >= 0) {
            setActiveByIndex(prev, { dir: "prev" });
            focusIndex(prev);
          }
          return;
        }
        if (nextKeys.includes(key)) {
          e.preventDefault();
          const next = findEnabledIndex(index, 1, infinite);
          if (next >= 0) {
            setActiveByIndex(next, { dir: "next" });
            focusIndex(next);
          }
        }
      };
      const defaultBtn = UI.Btn({
        class: uiClass([
          "cms-tabpanel-tab",
          uiWhen(isActive, "active"),
          uiWhen(tab.disabled || disabledAll, "disabled"),
          props.tabClass,
          tab.tabClass || tab.class
        ]),
        type: "button",
        id: tabId,
        role: "tab",
        disabled: !!(tab.disabled || disabledAll),
        "aria-selected": isActive ? "true" : "false",
        "aria-controls": panelId,
        tabindex: isActive ? "0" : "-1",
        outline: variant === "pills" && !isActive,
        color: variant === "pills" && isActive ? (tab.color || props.color || props.state || "primary") : null,
        size: tab.size ?? props.size ?? null,
        style: {
          ...(props.tabStyle || {}),
          ...(tab.tabStyle || {})
        },
        onClick: () => {
          if (tab.disabled || disabledAll) return;
          setActiveByIndex(index);
        },
        onKeydown
      }, ...contentNodes);
      const navBtn = _.div({
        class: uiClass([
          "cms-tabpanel-nav-btn",
          uiWhen(isActive, "active"),
          tab.navClass
        ]),
        "data-name": tab.name
      }, defaultBtn, _.span({ class: "tab-indicator" }));
      tabButtons[index] = { btn: defaultBtn, wrap: navBtn, index };
      return navBtn;
    };

    const makePanelNode = (tab, index) => {
      const isActive = index === activeIndex;
      const tabId = `${componentId}-tab-${index}`;
      const panelId = `${componentId}-panel-${index}`;
      const ctx = createCtx(tab, index, isActive);
      const panelNode = CMSwift.ui.renderSlot(slots, "panel", ctx, tab.panelFallback);
      const panel = _.div({
        class: uiClass([
          "cms-tabpanel-panel",
          uiWhen(isActive, "active"),
          props.panelClass,
          tab.panelClass
        ]),
        style: {
          ...(props.panelStyle || {}),
          ...(tab.panelStyle || {})
        },
        "data-name": tab.name,
        role: "tabpanel",
        id: panelId,
        tabindex: 0,
        "aria-labelledby": tabId,
        "aria-hidden": isActive ? "false" : "true"
      }, ...renderSlotToArray(null, "default", {}, panelNode));
      panelNodes[index] = panel;
      return panel;
    };

    const defaultNavNodes = tabs.map((tab, index) => makeTabNode(tab, index));
    const navContent = CMSwift.ui.renderSlot(slots, "nav", {
      tabs,
      active: () => (activeIndex >= 0 ? tabs[activeIndex]?.name : null),
      activeIndex: () => activeIndex,
      activeTab: () => (activeIndex >= 0 ? tabs[activeIndex] : null),
      select: (nameOrIndex) => {
        if (typeof nameOrIndex === "number") setActiveByIndex(nameOrIndex);
        else setActiveByValue(nameOrIndex);
      },
      next: () => goNext(),
      prev: () => goPrev(),
      nodes: defaultNavNodes,
      orientation,
      position: navPosition,
      variant
    }, defaultNavNodes);

    renderSlotToArray(null, "default", {}, navContent).forEach(n => nav.appendChild(n));
    if (tabs.length) {
      tabs.forEach((tab, index) => panelsWrap.appendChild(makePanelNode(tab, index)));
    } else {
      const emptyNodes = renderSlotToArray(slots, "empty", { tabs }, props.empty ?? _.div({ class: "cms-tabpanel-empty" }, "Nessun contenuto disponibile."));
      emptyNodes.forEach((node) => panelsWrap.appendChild(node));
    }

    const setDirectionVars = (dir) => {
      if (!animated) return;
      const enter = dir === "next" ? "18px" : "-18px";
      const leave = dir === "next" ? "-18px" : "18px";
      wrap.style.setProperty("--cms-tabpanel-enter", enter);
      wrap.style.setProperty("--cms-tabpanel-leave", leave);
    };

    const cleanCustomTransitions = () => {
      const classes = [];
      if (transitionPrev) classes.push(...String(transitionPrev).split(/\s+/));
      if (transitionNext) classes.push(...String(transitionNext).split(/\s+/));
      if (classes.length) panelsWrap.classList.remove(...classes.filter(Boolean));
    };

    const applyCustomTransition = (dir) => {
      cleanCustomTransitions();
      const cls = dir === "prev" ? transitionPrev : transitionNext;
      if (!cls) return;
      const parts = String(cls).split(/\s+/).filter(Boolean);
      if (!parts.length) return;
      panelsWrap.classList.add(...parts);
      setTimeout(() => panelsWrap.classList.remove(...parts), transitionDuration + 40);
    };

    const updateNavButtons = (nextIndex) => {
      const active = tabButtons.find(({ btn }) => btn.classList.contains("active"));
      const rectPrev = active?.btn.parentNode?.getBoundingClientRect();
      tabButtons.forEach(({ btn, index }) => {
        const isActive = index === nextIndex;
        const parent = btn.parentNode;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        if (parent.isConnected && rectPrev) {
          parent.style.setProperty("--nav-pos-x", (rectPrev.left - rect.left) + "px");
          parent.style.setProperty("--nav-pos-y", (rectPrev.top - rect.top) + "px");
        }
        parent.classList.toggle("active", isActive);
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
        btn.setAttribute("tabindex", isActive ? "0" : "-1");
      });
    };

    const updatePanels = (prevIndex, nextIndex, dir) => {
      setDirectionVars(dir);
      panelNodes.forEach((panel, index) => {
        if (!panel) return;
        const isNext = index === nextIndex;
        const isPrev = index === prevIndex;
        if (isNext) {
          panel.classList.add("active");
          panel.classList.remove("leaving");
          panel.setAttribute("aria-hidden", "false");
        } else {
          panel.classList.remove("active");
          panel.setAttribute("aria-hidden", "true");
          if (animated && isPrev) {
            panel.classList.add("leaving");
            setTimeout(() => panel.classList.remove("leaving"), transitionDuration + 40);
          } else {
            panel.classList.remove("leaving");
          }
        }
      });
    };

    const computeDir = (prevIndex, nextIndex) => {
      if (prevIndex < 0 || prevIndex === nextIndex) return "next";
      if (infinite && prevIndex === tabs.length - 1 && nextIndex === 0) return "next";
      if (infinite && prevIndex === 0 && nextIndex === tabs.length - 1) return "prev";
      return nextIndex > prevIndex ? "next" : "prev";
    };

    const setActiveByIndex = (nextIndex, opts = {}) => {
      if (nextIndex == null || nextIndex < 0 || nextIndex >= tabs.length) return;
      if (tabs[nextIndex]?.disabled) return;
      const prevIndex = activeIndex;
      if (prevIndex === nextIndex) return;
      activeIndex = nextIndex;
      const nextTab = tabs[nextIndex];
      const dir = opts.dir || computeDir(prevIndex, nextIndex);
      if (model && !opts.fromModel) model.set(nextTab.name);
      updateNavButtons(nextIndex);
      updatePanels(prevIndex, nextIndex, dir);
      applyCustomTransition(dir);
      wrap.dataset.active = String(nextTab.name);
      props.onChange?.(nextTab.name, nextTab, nextIndex);
    };

    const setActiveByValue = (value, opts = {}) => {
      if (!tabs.length) return;
      const idx = tabs.findIndex(t => t.name == value);
      if (idx === -1) return;
      setActiveByIndex(idx, opts);
    };

    const goNext = () => {
      if (!tabs.length) return;
      const nextIndex = activeIndex < 0
        ? tabs.findIndex((tab) => !tab.disabled)
        : findEnabledIndex(activeIndex, 1, infinite);
      if (nextIndex < 0) return;
      setActiveByIndex(nextIndex, { dir: "next" });
    };

    const goPrev = () => {
      if (!tabs.length) return;
      const nextIndex = activeIndex < 0
        ? (() => {
          for (let i = tabs.length - 1; i >= 0; i -= 1) {
            if (!tabs[i]?.disabled) return i;
          }
          return -1;
        })()
        : findEnabledIndex(activeIndex, -1, infinite);
      if (nextIndex < 0) return;
      setActiveByIndex(nextIndex, { dir: "prev" });
    };

    if (swipeable) {
      let startX = 0;
      let startY = 0;
      let tracking = false;
      const threshold = 42;
      panelsWrap.addEventListener("pointerdown", (e) => {
        if (e.button != null && e.button !== 0) return;
        tracking = true;
        startX = e.clientX;
        startY = e.clientY;
      });
      panelsWrap.addEventListener("pointerup", (e) => {
        if (!tracking) return;
        tracking = false;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) goNext();
        else goPrev();
      });
      panelsWrap.addEventListener("pointercancel", () => { tracking = false; });
      panelsWrap.addEventListener("pointerleave", () => { tracking = false; });
    }

    const initialValue = model ? model.get() : (props.value ?? props.defaultValue ?? props.default ?? null);
    if (tabs.length) {
      const initialIndex = tabs.findIndex(t => t.name == initialValue);
      if (initialIndex >= 0) {
        setActiveByIndex(initialIndex, { fromModel: true });
      } else {
        const firstEnabled = tabs.findIndex((tab) => !tab.disabled);
        if (firstEnabled >= 0) {
          setActiveByIndex(firstEnabled, { fromModel: true });
          if (model) model.set(tabs[firstEnabled].name);
        }
      }
    }

    if (model) {
      model.watch((v) => setActiveByValue(v, { fromModel: true }), "UI.TabPanel:watch");
    }

    if (navPosition === "after") {
      wrap.appendChild(panelsWrap);
      wrap.appendChild(nav);
    } else {
      wrap.appendChild(nav);
      wrap.appendChild(panelsWrap);
    }

    const extra = renderSlotToArray(slots, "default", {}, children);
    extra.forEach((n) => wrap.appendChild(n));
    setPropertyProps(wrap, props);
    wrap._tabs = () => tabs.slice();
    wrap._active = () => (activeIndex >= 0 ? tabs[activeIndex] : null);
    wrap._getValue = () => (activeIndex >= 0 ? tabs[activeIndex]?.name : null);
    wrap._setValue = (value) => setActiveByValue(value);
    wrap._select = (value) => {
      if (typeof value === "number") setActiveByIndex(value);
      else setActiveByValue(value);
    };
    wrap._next = goNext;
    wrap._prev = goPrev;
    return wrap;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.TabPanel = {
      signature: "UI.TabPanel(props) | UI.TabPanel(props, ...children)",
      props: {
        tabs: {
          type: "Array<{ name?, value?, label?, title?, note?, subtitle?, icon?, badge?, content?, panel?, body?, children?, disabled?, hidden?, tabClass?, panelClass? }>",
          description: "Tab definition. Supports multiple aliases for label and content.",
          category: "data"
        },
        items: {
          type: "Array",
          description: "Alias of `tabs`.",
          category: "data"
        },
        value: {
          type: "any",
          description: "Initial or controlled value of the active tab.",
          category: "data"
        },
        defaultValue: {
          type: "any",
          description: "Explicit alias for the initial tab when `model` is not used.",
          category: "data"
        },
        model: {
          type: "[get,set] signal",
          description: "Reactive binding for the active tab.",
          category: "data"
        },
        orientation: {
          type: "vertical|horizontal",
          description: "Navigation orientation.",
          values: ["vertical", "horizontal"],
          default: "vertical",
          category: "layout"
        },
        navPosition: {
          type: "before|after",
          description: "Tab bar position relative to the panels.",
          values: ["before", "after"],
          default: "before",
          category: "layout"
        },
        variant: {
          type: "line|pills|soft",
          description: "Visual style of the tab navigation.",
          values: ["line", "pills", "soft"],
          default: "line",
          category: "style"
        },
        wrap: {
          type: "boolean",
          description: "Allows the nav to wrap when space is limited.",
          default: false,
          category: "layout"
        },
        navFill: {
          type: "boolean",
          description: "Distributes tabs across the available width.",
          default: false,
          category: "layout"
        },
        swipeable: {
          type: "boolean",
          description: "Enables swipe gestures on panels.",
          default: false,
          category: "behavior"
        },
        infinite: {
          type: "boolean",
          description: "When enabled, next/prev cycles from the first to the last tab.",
          default: false,
          category: "behavior"
        },
        animated: {
          type: "boolean",
          description: "Enables the transition between panels.",
          default: false,
          category: "behavior"
        },
        transitionDuration: {
          type: "number",
          description: "Animation duration in milliseconds.",
          default: 220,
          category: "behavior"
        },
        transitionEasing: {
          type: "string",
          description: "CSS timing function for the animation.",
          default: "ease",
          category: "behavior"
        },
        transitionPrev: {
          type: "string",
          description: "Custom classes applied during the transition to the previous tab.",
          category: "behavior"
        },
        transitionNext: {
          type: "string",
          description: "Custom classes applied during the transition to the next tab.",
          category: "behavior"
        },
        tabClass: {
          type: "string",
          description: "Additional classes for all tab buttons.",
          category: "style"
        },
        tabStyle: {
          type: "object",
          description: "Inline style applied to all tab buttons.",
          category: "style"
        },
        navClass: {
          type: "string",
          description: "Additional classes for the nav wrapper.",
          category: "style"
        },
        panelsClass: {
          type: "string",
          description: "Additional classes for the panels wrapper.",
          category: "style"
        },
        panelClass: {
          type: "string",
          description: "Common additional classes for each panel.",
          category: "style"
        },
        panelStyle: {
          type: "object",
          description: "Common inline style for each panel.",
          category: "style"
        },
        empty: {
          type: "Node|Function|Array",
          description: "Visual fallback when `tabs` and `items` are empty.",
          category: "state"
        },
        disabled: {
          type: "boolean",
          description: "Disables the entire component.",
          default: false,
          category: "state"
        },
        slots: {
          type: "{ nav?, tab?, label?, icon?, note?, badge?, panel?, empty?, default? }",
          description: "Structured slots for customizing nav, label, badge, and content.",
          category: "general"
        }
      },
      slots: {
        nav: {
          type: "Function|Node|Array",
          description: "Full navigation renderer. Receives `tabs`, `active()`, `activeTab()`, `select()`, `next()`, `prev()`, `nodes`, `orientation`, `position`, `variant`."
        },
        tab: {
          type: "Function|Node|Array",
          description: "Inner content of the tab button. Receives `tab`, `name`, `index`, `active`, `label`, `icon`, `note`, `badge`, `select()`."
        },
        label: {
          type: "Function|Node|Array",
          description: "Tab label."
        },
        icon: {
          type: "Function|Node|Array",
          description: "Tab icon."
        },
        note: {
          type: "Function|Node|Array",
          description: "Note, subtitle, or short description below the label."
        },
        badge: {
          type: "Function|Node|Array",
          description: "Badge or counter aligned to the right of the tab."
        },
        panel: {
          type: "Function|Node|Array",
          description: "Active/inactive panel renderer. Receives `tab`, `name`, `index`, `active`, `select()`, `next()`, `prev()`."
        },
        empty: {
          type: "Function|Node|Array",
          description: "Fallback when there are no tabs."
        },
        default: {
          type: "Node|Array|Function",
          description: "Extra content appended after the component."
        }
      },
      events: {
        onChange: "(name, tab, index)"
      },
      returns: "HTMLDivElement with API `_getValue()`, `_setValue(value)`, `_select(value)`, `_next()`, `_prev()`, `_active()`, `_tabs()`",
      description: "Standardized tab panel with accessible nav, structured slots, reactive model, swipe, and animations."
    };
  }

  function closeBackdrop(backdrop) {
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }

  function renderDialog({ title, message, contentNode, okText, cancelText, showCancel, onOk, onCancel, persistent }) {
    ensureModalRoot();

    const backdrop = _.div({
      class: "cms-dialog-backdrop", onClick: (e) => {
        if (e.target === backdrop && persistent !== true) onCancel?.();
      }
    });

    const titleNodes = renderSlotToArray(null, "default", {}, title);
    const messageNodes = renderSlotToArray(null, "default", {}, message);
    const contentNodes = renderSlotToArray(null, "default", {}, contentNode);

    const dialog = _.div({ class: "cms-dialog cms-panel" },
      titleNodes.length ? _.h3(...titleNodes) : null,
      messageNodes.length ? _.p(...messageNodes) : null,
      ...contentNodes,
      _.div({ class: "cms-dialog-actions" },
        showCancel ? CMSwift.ui.Btn({ onClick: onCancel }, cancelText || "Annulla") : null,
        CMSwift.ui.Btn({ color: "primary", onClick: onOk }, okText || "OK")
      )
    );

    backdrop.appendChild(dialog);
    ensureModalRoot().appendChild(backdrop);

    // escape to close
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey, { once: true });

    return { backdrop, close: () => closeBackdrop(backdrop) };
  }

  app.dialog.alert = function (message, opts = {}) {
    return new Promise((resolve) => {
      const { backdrop, close } = renderDialog({
        title: opts.title || "Info",
        message,
        okText: opts.okText || "OK",
        showCancel: false,
        persistent: opts.persistent,
        onOk: () => { close(); resolve(true); },
        onCancel: () => { close(); resolve(true); }
      });
    });
  };

  app.dialog.confirm = function (opts = {}) {
    return new Promise((resolve) => {
      const { close } = renderDialog({
        title: opts.title || "Conferma",
        message: opts.message || "",
        okText: opts.okText || "Conferma",
        cancelText: opts.cancelText || "Annulla",
        showCancel: true,
        persistent: opts.persistent,
        onOk: () => { close(); resolve(true); },
        onCancel: () => { close(); resolve(false); }
      });
    });
  };

  app.dialog.prompt = function (opts = {}) {
    return new Promise((resolve) => {
      const input = CMSwift.ui.Input({
        class: "cms-dialog-input",
        type: opts.type || "text",
        placeholder: opts.placeholder || ""
      });

      // default value
      if (opts.value != null) input.value = String(opts.value);

      const { close } = renderDialog({
        title: opts.title || "Inserisci valore",
        message: opts.message || "",
        okText: opts.okText || "OK",
        cancelText: opts.cancelText || "Annulla",
        showCancel: true,
        contentNode: _.div(input),
        persistent: opts.persistent,
        onOk: () => { const v = input.value; close(); resolve(v); },
        onCancel: () => { close(); resolve(null); }
      });

      // focus
      setTimeout(() => input.focus(), 0);
    });
  };

  // ===============================
  // Loading Service
  // ===============================

  app.services = app.services || {};
  app.services.loading = app.services.loading || {};
  app.loading = app.services.loading;

  let overlay = null;
  let countLoading = 0;

  function ensureOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "cms-loading-backdrop";
    overlay.style.cssText = `
position: fixed; inset: 0;
background: rgba(0,0,0,0.45);
display: none;
align-items: center; justify-content: center;
z-index: 10001;
padding: 14px;
`;
    const box = document.createElement("div");
    box.className = "cms-panel cms-loading-card";
    box.style.cssText = `
padding: 14px 16px;
border-radius: var(--cms-r-lg);
min-width: 260px;
display:flex; gap: 12px; align-items:center;
flex-direction: column;
`;

    const spinner = document.createElement("div");
    spinner.className = "cms-loading-spinner";
    spinner.style.cssText = `
width: 18px; height: 18px;
border-radius: 50%;
border: 2px solid rgba(255,255,255,0.25);
border-top-color: var(--cms-primary);
animation: cmsSpin 0.9s linear infinite;
`;

    const text = document.createElement("div");
    text.className = "cms-muted cms-loading-text";
    text.textContent = "Loading...";

    const progressWrap = document.createElement("div");
    progressWrap.className = "cms-loading-progress";
    progressWrap.style.cssText = `
width: 100%;
height: 6px;
border-radius: 999px;
overflow: hidden;
background: rgba(255,255,255,0.08);
display: none;
`;
    const progressBar = document.createElement("div");
    progressBar.className = "cms-loading-progress-bar";
    progressBar.style.cssText = `
height: 100%;
width: 0%;
background: var(--cms-primary);
transition: width 200ms ease;
`;
    progressWrap.appendChild(progressBar);

    const row = document.createElement("div");
    row.style.cssText = "display:flex; gap: 12px; align-items:center; width: 100%;";
    row.appendChild(spinner);
    row.appendChild(text);

    box.appendChild(row);
    box.appendChild(progressWrap);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const style = document.createElement("style");
    style.textContent = `
@keyframes cmsSpin { to { transform: rotate(360deg); } }
`;
    document.head.appendChild(style);

    overlay._textNode = text;
    overlay._spinner = spinner;
    overlay._progressWrap = progressWrap;
    overlay._progressBar = progressBar;
    overlay._progressActive = false;
    return overlay;
  }

  function normalizeLoadingOptions(message, opts) {
    if (typeof message === "object" && message !== null) return { ...message };
    const base = (opts && typeof opts === "object") ? opts : {};
    if (typeof opts === "string" && (message == null || typeof message === "number")) {
      return { ...base, message: opts };
    }
    return { ...base, message: message };
  }

  function setLoadingMode(ov, mode) {
    const showProgress = mode === "progress";
    ov._spinner.style.display = showProgress ? "none" : "";
    ov._progressWrap.style.display = showProgress ? "block" : "none";
    ov._mode = mode;
  }

  app.loading.show = function (message = "Loading...", opts = {}) {
    const ov = ensureOverlay();
    const o = normalizeLoadingOptions(message, opts);
    countLoading++;
    ov._progressActive = false;
    ov._textNode.textContent = o.message || "Loading...";
    setLoadingMode(ov, "spinner");
    if (o.spinner === false) ov._spinner.style.display = "none";
    ov.style.display = "flex";
  };

  app.loading.hide = function () {
    if (!overlay) return;
    countLoading = Math.max(0, countLoading - 1);
    if (countLoading === 0) {
      overlay.style.display = "none";
      overlay._progressActive = false;
    }
  };

  app.loading.progress = function (value = 0, opts = {}) {
    const ov = ensureOverlay();
    if (typeof value === "object" && value !== null) {
      opts = value;
      value = value.value ?? 0;
    }
    const o = normalizeLoadingOptions(null, opts);
    if (!ov._progressActive) {
      countLoading++;
      ov._progressActive = true;
    }
    const v = Math.max(0, Math.min(100, Number(value ?? 0)));
    ov._textNode.textContent = o.message || "Loading...";
    ov._progressBar.style.width = v + "%";
    setLoadingMode(ov, "progress");
    ov.style.display = "flex";
  };

  // helper: wrapper async
  app.loading.wrap = async function (message, fn) {
    app.loading.show(message);
    try { return await fn(); }
    finally { app.loading.hide(); }
  };

  // ===============================
  // UI.Table
  // ===============================
  function toValue(rows) {
    if (typeof rows === "function") return rows();
    return rows || [];
  }

  function tableGetByPath(obj, path) {
    if (obj == null || path == null) return undefined;
    if (typeof path !== "string" || path.indexOf(".") < 0) return obj?.[path];
    return path.split(".").reduce((acc, key) => acc == null ? acc : acc[key], obj);
  }

  function defaultCompare(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  }

  function tableToArray(value) {
    const rows = toValue(value);
    return Array.isArray(rows) ? rows : [];
  }

  function tableColumnLabel(col) {
    return col?.label ?? col?.title ?? col?.header ?? col?.key ?? "";
  }

  function tableColumnSortKey(col, index) {
    return col?.sortKey ?? col?.key ?? `__col_${index}`;
  }

  function tableFindColumn(columns, key) {
    return columns.find((col, index) => tableColumnSortKey(col, index) === key || col?.key === key) || null;
  }

  function tableResolveValue(col, row, rowIndex) {
    if (!col) return row;
    if (typeof col.get === "function") return col.get(row, { row, rowIndex, col });
    if (typeof col.value === "function") return col.value(row, { row, rowIndex, col });
    if (typeof col.key === "string") return tableGetByPath(row, col.key);
    return col.key != null ? row?.[col.key] : row;
  }

  function tableResolveStyle(style, ctx) {
    if (typeof style === "function") return style(ctx) || {};
    return style || {};
  }

  function tableTextValue(value) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(tableTextValue).filter(Boolean).join(" ");
    if (typeof Node !== "undefined" && value instanceof Node) return value.textContent || "";
    if (typeof value === "object") {
      if (typeof value.textContent === "string") return value.textContent;
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return String(value);
  }

  function tableNormalizePageSizes(options, fallback) {
    const list = Array.isArray(options) ? options : fallback;
    const normalized = list
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
    return normalized.length ? Array.from(new Set(normalized)) : fallback;
  }

  function tableMatchesQuery(row, columns, query, props) {
    const predicate = props.searchBy || props.searchPredicate;
    if (typeof predicate === "function") return !!predicate(row, { query, columns });

    const terms = String(query || "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!terms.length) return true;

    const searchKeys = Array.isArray(props.searchKeys) && props.searchKeys.length
      ? props.searchKeys
      : columns.filter((col) => col?.searchable !== false).map((col) => col?.searchKey ?? col?.key).filter(Boolean);

    const tokens = [];
    if (searchKeys.length) {
      for (const key of searchKeys) {
        if (typeof key === "function") tokens.push(tableTextValue(key(row)));
        else {
          const col = columns.find((item) => item?.key === key || item?.searchKey === key);
          tokens.push(tableTextValue(col ? tableResolveValue(col, row, -1) : tableGetByPath(row, key)));
        }
      }
    } else {
      tokens.push(tableTextValue(row));
    }

    const haystack = tokens.join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  }

  UI.Table = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const columns = Array.isArray(props.columns) ? props.columns : [];
    const basePageSizes = tableNormalizePageSizes(props.pageSizeOptions, [5, 10, 20, 50]);
    const initialPageSize = Number(props.pageSize ?? basePageSizes[0] ?? 10) || 10;
    const pageSizes = Array.from(new Set([...basePageSizes, initialPageSize])).sort((a, b) => a - b);
    const initialSort = props.initialSort || (props.sortBy ? { key: props.sortBy, dir: props.sortDir === "desc" ? "desc" : "asc" } : null);
    const searchable = props.searchable === true
      || typeof props.searchable === "string"
      || props.searchPlaceholder != null
      || props.search != null
      || props.query != null
      || !!props.searchModel
      || !!props.queryModel
      || Array.isArray(props.searchKeys)
      || typeof props.searchBy === "function"
      || typeof props.searchPredicate === "function";
    const searchModel = resolveModel(props.searchModel || props.queryModel, "UI.Table:query");

    const [getPage, setPage] = app.reactive.signal(Math.max(1, Number(props.page || 1) || 1));
    const [getPageSize, setPageSizeState] = app.reactive.signal(initialPageSize);
    const [getSort, setSort] = app.reactive.signal(initialSort);
    const [getQuery, setQueryState] = app.reactive.signal(String((searchModel ? searchModel.get() : (props.search ?? props.query)) ?? ""));

    const setQuery = (value) => {
      const next = String(value ?? "");
      setQueryState(next);
      if (searchModel) searchModel.set(next);
      setPage(1);
    };
    const setPageSize = (value) => {
      const next = Number(value) || initialPageSize;
      setPageSizeState(next);
      setPage(1);
    };
    const toggleSort = (col, index) => {
      const nextKey = tableColumnSortKey(col, index);
      const current = getSort();
      if (!current || (current.key !== nextKey && current.key !== col?.key)) setSort({ key: nextKey, dir: "asc" });
      else if (current.dir === "asc") setSort({ key: nextKey, dir: "desc" });
      else setSort(null);
      setPage(1);
    };

    let searchInput = null;
    if (searchModel) {
      searchModel.watch((value) => {
        const next = String(value ?? "");
        setQueryState(next);
        if (searchInput && searchInput.value !== next) searchInput.value = next;
        setPage(1);
      }, "UI.Table:queryWatch");
    }

    const wrapProps = CMSwift.omit(props, [
      "columns", "rows", "rowKey", "loading", "page", "pageSize", "pageSizeOptions", "pagination",
      "initialSort", "sortBy", "sortDir", "search", "query", "searchable", "searchPlaceholder",
      "searchKeys", "searchBy", "searchPredicate", "searchModel", "queryModel", "filter",
      "actions", "actionsLabel", "emptyText", "loadingText", "onRowClick", "onRowDblClick",
      "tableClass", "tableStyle", "cardClass", "dense", "striped", "hover", "stickyHeader",
      "toolbar", "toolbarStart", "toolbarEnd", "caption", "footer", "status", "rowClass", "rowAttrs",
      "minTableWidth", "hideHeader", "hideFooter", "slots", "body"
    ]);
    wrapProps.class = uiClass(["cms-table-card", props.class, props.cardClass]);
    if (props.dense != null) wrapProps.dense = props.dense;

    const shell = _.div({ class: "cms-table-shell" });
    const leadNodes = renderSlotToArray(slots, "default", {}, children);
    if (leadNodes.length) shell.appendChild(_.div({ class: "cms-table-lead" }, ...leadNodes));

    const toolbarStartNodes = renderSlotToArray(slots, "toolbarStart", {}, props.toolbarStart);
    const toolbarNodes = renderSlotToArray(slots, "toolbar", {}, props.toolbar);
    const toolbarEndNodes = renderSlotToArray(slots, "toolbarEnd", {}, props.toolbarEnd);

    const toolbar = _.div({ class: "cms-table-toolbar" });
    const toolbarMain = _.div({ class: "cms-table-toolbar-main" });
    const toolbarSide = _.div({ class: "cms-table-toolbar-side" });
    toolbarStartNodes.forEach((node) => toolbarMain.appendChild(node));
    toolbarNodes.forEach((node) => toolbarMain.appendChild(node));

    const searchSlotNodes = renderSlotToArray(slots, "search", { query: getQuery(), getQuery, setQuery }, null);
    if (searchSlotNodes.length) {
      searchSlotNodes.forEach((node) => toolbarSide.appendChild(node));
    } else if (searchable) {
      searchInput = _.input({
        type: "search",
        class: "cms-input",
        placeholder: typeof props.searchable === "string" ? props.searchable : (props.searchPlaceholder || "Cerca nella tabella"),
        value: String(getQuery() || "")
      });
      searchInput.addEventListener("input", () => setQuery(searchInput.value));
      const clearSearch = UI.Btn({
        class: "cms-table-search-clear",
        outline: true,
        onClick: () => {
          if (searchInput) searchInput.value = "";
          setQuery("");
        }
      }, "Reset");
      toolbarSide.appendChild(
        _.div({ class: "cms-singularity cms-table-search" },
          _.span({ class: "cms-table-search-icon", "aria-hidden": "true" }, "⌕"),
          searchInput,
          clearSearch
        )
      );
    }
    toolbarEndNodes.forEach((node) => toolbarSide.appendChild(node));
    if (toolbarMain.childNodes.length || toolbarSide.childNodes.length) {
      toolbar.appendChild(toolbarMain);
      toolbar.appendChild(toolbarSide);
      shell.appendChild(toolbar);
    }

    const statusSummary = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const statusFilter = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const statusSort = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const statusExtraNodes = renderSlotToArray(slots, "status", {}, props.status);
    const status = _.div({ class: "cms-table-status" },
      statusSummary,
      statusFilter,
      statusSort,
      ...statusExtraNodes
    );
    shell.appendChild(status);

    const captionNodes = renderSlotToArray(slots, "caption", {}, props.caption);
    if (captionNodes.length) shell.appendChild(_.div({ class: "cms-table-caption" }, ...captionNodes));

    const thead = _.thead();
    const tbody = _.tbody();
    const hasActions = !!props.actions || !!slots.actions;

    const tableClass = uiClass([
      "cms-table",
      uiWhen(props.dense, "dense"),
      uiWhen(props.striped, "striped"),
      uiWhen(props.hover !== false, "hover"),
      uiWhen(props.stickyHeader !== false, "sticky-head"),
      props.tableClass
    ]);
    const tableStyle = {
      ...(props.tableStyle || {})
    };
    if (props.minTableWidth != null) tableStyle["--cms-table-min-width"] = toCssSize(props.minTableWidth);
    const table = _.table({ class: tableClass, style: tableStyle }, thead, tbody);
    const wrapTable = _.div({ class: "cms-singularity cms-table-wrap" }, table);
    shell.appendChild(wrapTable);

    const pagerInfo = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const pagerMeta = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const btnPrev = UI.Btn({ outline: true, onClick: () => setPage(Math.max(1, getPage() - 1)) }, "‹");
    const btnNext = UI.Btn({ outline: true, onClick: () => setPage(getPage() + 1) }, "›");
    const pageChip = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const sizeSelect = _.select({ class: "cms-input cms-table-size-select" },
      ...pageSizes.map((size) => uiOptionNode({ value: String(size) }, String(size)))
    );
    sizeSelect.value = String(getPageSize());
    sizeSelect.addEventListener("change", () => setPageSize(sizeSelect.value));
    const footerExtraNodes = renderSlotToArray(slots, "footer", {}, props.footer);

    const footer = _.div({ class: "cms-table-foot" },
      _.div({ class: "cms-table-foot-main" },
        pagerInfo,
        pagerMeta,
        _.label({ class: "cms-table-size" },
          _.span("Righe"),
          sizeSelect
        )
      ),
      _.div({ class: "cms-table-foot-extra" },
        ...footerExtraNodes,
        _.div({ class: "cms-table-pager" },
          btnPrev,
          pageChip,
          btnNext
        )
      )
    );
    if (props.hideFooter !== true) shell.appendChild(footer);

    const renderHeader = () => {
      thead.innerHTML = "";
      if (props.hideHeader) return;

      const row = _.tr();
      columns.forEach((col, colIndex) => {
        const ctx = { col, colIndex, sort: getSort() };
        const thStyle = {
          ...tableResolveStyle(col?.style, { ...ctx, header: true }),
          ...tableResolveStyle(col?.headerStyle ?? col?.thStyle, { ...ctx, header: true })
        };
        if (col?.width != null) thStyle.width = toCssSize(col.width);
        if (col?.minWidth != null) thStyle.minWidth = toCssSize(col.minWidth);
        if (col?.maxWidth != null) thStyle.maxWidth = toCssSize(col.maxWidth);
        if (col?.align) thStyle.textAlign = col.align;
        let headerNodes = renderSlotToArray(col?.slots, "header", ctx, null);
        if (!headerNodes.length) {
          const fallback = typeof col?.header === "function" ? col.header(ctx) : (col?.header ?? tableColumnLabel(col));
          headerNodes = renderSlotToArray(slots, "header", ctx, fallback);
        }

        const currentSort = getSort();
        const sortKey = tableColumnSortKey(col, colIndex);
        const isSortable = col?.sortable !== false && (col?.key != null || typeof col?.get === "function" || typeof col?.compare === "function");
        const isActive = !!currentSort && (currentSort.key === sortKey || currentSort.key === col?.key);
        const th = _.th({
          class: uiClass([
            "cms-table-head-cell",
            uiWhen(col?.nowrap, "is-nowrap"),
            uiWhen(isSortable, "cms-table-sortable"),
            uiWhen(isActive, "is-sorted"),
            col?.headerClass
          ]),
          style: thStyle
        });

        if (isSortable) {
          th.appendChild(
            _.button({
              type: "button",
              class: "cms-table-head-button",
              onClick: () => toggleSort(col, colIndex)
            },
              _.span({ class: "cms-table-head-label" }, ...headerNodes),
              _.span({ class: "cms-table-head-arrow", "aria-hidden": "true" },
                isActive ? (currentSort.dir === "asc" ? "↑" : "↓") : "↕"
              )
            )
          );
        } else {
          headerNodes.forEach((node) => th.appendChild(node));
        }
        row.appendChild(th);
      });

      if (hasActions) {
        const actionsHeaderNodes = renderSlotToArray(slots, "actionsHeader", {}, props.actionsLabel || "Azioni");
        row.appendChild(
          _.th({ class: "cms-table-head-cell cms-table-head-actions", style: { textAlign: "right" } }, ...actionsHeaderNodes)
        );
      }
      thead.appendChild(row);
    };

    const renderStateRow = (slotName, fallback) => {
      const ctx = { columns, count: columns.length };
      const nodes = renderSlotToArray(slots, slotName, ctx, fallback);
      const colSpan = String(columns.length + (hasActions ? 1 : 0));
      tbody.appendChild(
        _.tr(
          _.td({ colSpan, class: "cms-table-state" }, ...nodes)
        )
      );
    };

    app.reactive.effect(() => {
      const rows = tableToArray(props.rows);
      const query = String(getQuery() || "").trim();
      const currentSort = getSort();
      const loading = typeof props.loading === "function" ? !!props.loading() : !!props.loading;
      const paginationEnabled = props.pagination !== false;

      renderHeader();
      tbody.innerHTML = "";
      if (searchInput && searchInput.value !== getQuery()) searchInput.value = getQuery();
      if (sizeSelect.value !== String(getPageSize())) sizeSelect.value = String(getPageSize());

      if (loading) {
        statusSummary.textContent = "Caricamento in corso";
        statusFilter.style.display = "none";
        statusSort.style.display = "none";
        pagerInfo.textContent = "Loading…";
        pagerMeta.textContent = "";
        pageChip.textContent = "Pagina 1";
        btnPrev.disabled = true;
        btnNext.disabled = true;
        renderStateRow("loading", props.loadingText || "Loading...");
        return;
      }

      let list = rows.slice();
      const datasetTotal = list.length;
      if (typeof props.filter === "function") {
        list = list.filter((row, index) => props.filter(row, { row, index, query, rows, columns }));
      }
      if (query) {
        list = list.filter((row) => tableMatchesQuery(row, columns, query, props));
      }

      if (currentSort) {
        const sortCol = tableFindColumn(columns, currentSort.key);
        if (sortCol) {
          list.sort((a, b) => {
            const av = tableResolveValue(sortCol, a, -1);
            const bv = tableResolveValue(sortCol, b, -1);
            const out = typeof sortCol.compare === "function"
              ? sortCol.compare(av, bv, a, b)
              : defaultCompare(av, bv);
            return currentSort.dir === "asc" ? out : -out;
          });
        }
      }

      const filteredTotal = list.length;
      const currentPageSize = Math.max(1, Number(getPageSize()) || initialPageSize);
      const pages = paginationEnabled ? Math.max(1, Math.ceil(filteredTotal / currentPageSize)) : 1;
      const page = paginationEnabled ? Math.min(getPage(), pages) : 1;
      if (page !== getPage()) setPage(page);

      const start = paginationEnabled ? (page - 1) * currentPageSize : 0;
      const end = paginationEnabled ? start + currentPageSize : filteredTotal;
      const pageRows = list.slice(start, end);

      statusSummary.textContent = filteredTotal === datasetTotal
        ? `${filteredTotal} righe`
        : `${filteredTotal} di ${datasetTotal} righe`;
      statusFilter.textContent = query ? `Ricerca: ${query}` : "";
      statusFilter.style.display = query ? "" : "none";
      if (currentSort) {
        const sortCol = tableFindColumn(columns, currentSort.key);
        statusSort.textContent = sortCol
          ? `Ordine: ${tableColumnLabel(sortCol)} ${currentSort.dir === "asc" ? "↑" : "↓"}`
          : "";
        statusSort.style.display = sortCol ? "" : "none";
      } else {
        statusSort.style.display = "none";
      }

      pagerInfo.textContent = filteredTotal
        ? `${start + 1}-${Math.min(end, filteredTotal)} di ${filteredTotal}`
        : "0 risultati";
      pagerMeta.textContent = filteredTotal !== datasetTotal ? `Dataset totale ${datasetTotal}` : `Page size ${currentPageSize}`;
      pageChip.textContent = paginationEnabled ? `Pagina ${page} / ${pages}` : "Tutte le righe";
      btnPrev.disabled = !paginationEnabled || page <= 1;
      btnNext.disabled = !paginationEnabled || page >= pages;
      sizeSelect.disabled = !paginationEnabled;
      sizeSelect.parentNode.style.display = paginationEnabled ? "" : "none";

      if (pageRows.length === 0) {
        renderStateRow("empty", props.emptyText || "Nessun dato");
        return;
      }

      for (let pageIndex = 0; pageIndex < pageRows.length; pageIndex++) {
        const row = pageRows[pageIndex];
        const rowIndex = start + pageIndex;
        const rowCtx = { row, rowIndex, pageIndex };
        const rowAttrs = typeof props.rowAttrs === "function" ? (props.rowAttrs(row, rowCtx) || {}) : (props.rowAttrs || {});
        const rowClass = typeof props.rowClass === "function" ? props.rowClass(row, rowCtx) : props.rowClass;
        const isInteractiveRow = !!(props.onRowClick || props.onRowDblClick);
        const tr = _.tr({
          ...rowAttrs,
          class: uiClass([
            "cms-table-row",
            rowClass,
            rowAttrs.class,
            uiWhen(isInteractiveRow, "is-clickable")
          ])
        });

        if (props.rowKey) {
          const key = typeof props.rowKey === "function" ? props.rowKey(row, rowCtx) : tableGetByPath(row, props.rowKey);
          if (key != null) tr.dataset.key = String(key);
        }

        const shouldIgnoreRowEvent = (event) => {
          const target = event?.target;
          return !!(target && target.closest && target.closest("button, a, input, select, textarea, label, [data-table-action]"));
        };
        if (props.onRowClick) {
          tr.addEventListener("click", (event) => {
            if (shouldIgnoreRowEvent(event)) return;
            props.onRowClick(row, rowCtx, event);
          });
        }
        if (props.onRowDblClick) {
          tr.addEventListener("dblclick", (event) => {
            if (shouldIgnoreRowEvent(event)) return;
            props.onRowDblClick(row, rowCtx, event);
          });
        }

        columns.forEach((col, colIndex) => {
          const value = tableResolveValue(col, row, rowIndex);
          const cellCtx = { ...rowCtx, col, colIndex, value };
          const tdStyle = {
            ...tableResolveStyle(col?.style, cellCtx),
            ...tableResolveStyle(col?.cellStyle ?? col?.tdStyle, cellCtx)
          };
          if (col?.align) tdStyle.textAlign = col.align;
          if (col?.width != null) tdStyle.width = toCssSize(col.width);
          if (col?.minWidth != null) tdStyle.minWidth = toCssSize(col.minWidth);
          if (col?.maxWidth != null) tdStyle.maxWidth = toCssSize(col.maxWidth);
          const cellClass = typeof col?.cellClass === "function" ? col.cellClass(row, cellCtx) : (col?.cellClass || col?.class);
          const td = _.td({
            class: uiClass(["cms-table-cell", cellClass, uiWhen(col?.nowrap, "is-nowrap")]),
            style: tdStyle
          });

          let cellNodes = renderSlotToArray(col?.slots, "cell", cellCtx, null);
          if (!cellNodes.length) {
            const raw = typeof col?.render === "function"
              ? col.render(row, cellCtx)
              : (typeof col?.format === "function" ? col.format(value, row, cellCtx) : value);
            const fallback = raw == null ? (col?.emptyText ?? "") : raw;
            cellNodes = renderSlotToArray(slots, "cell", cellCtx, fallback);
          }
          if (!cellNodes.length) cellNodes = [""];
          cellNodes.forEach((node) => td.appendChild(node));
          tr.appendChild(td);
        });

        if (hasActions) {
          const actionCtx = { ...rowCtx };
          const actionRaw = typeof props.actions === "function" ? props.actions(row, rowCtx) : props.actions;
          let actionNodes = renderSlotToArray(slots, "actions", actionCtx, actionRaw);
          if (!actionNodes.length) actionNodes = renderSlotToArray(null, "default", actionCtx, actionRaw);
          tr.appendChild(
            _.td({ class: "cms-table-cell cms-table-cell-actions", style: { textAlign: "right" } },
              _.div({ class: "cms-table-actions" }, ...actionNodes)
            )
          );
        }

        tbody.appendChild(tr);
      }
    }, "UI.Table:render");

    wrapProps.body = shell;
    return UI.Card(wrapProps);
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Table = {
      signature: "UI.Table(props)",
      props: {
        columns: "Array<{ key, label?, sortable?, get?, value?, render?, format?, width?, minWidth?, maxWidth?, align?, compare?, style?, headerStyle?, thStyle?, cellStyle?, tdStyle?, cellClass?, headerClass?, nowrap?, searchable? }>",
        rows: "Array|() => Array",
        rowKey: "string|((row)=>string)",
        loading: "boolean|() => boolean",
        page: "number",
        pageSize: "number",
        pageSizeOptions: "number[]",
        pagination: "boolean",
        initialSort: "{ key, dir: 'asc'|'desc' }",
        search: "string",
        query: "string",
        searchable: "boolean|string",
        searchPlaceholder: "string",
        searchKeys: "Array<string|function>",
        searchModel: "[get,set] signal",
        filter: "(row, ctx)=>boolean",
        actions: "(row, ctx)=>Node|Array",
        actionsLabel: "string|Node|Function|Array",
        emptyText: "string|Node|Function|Array",
        loadingText: "string|Node|Function|Array",
        toolbar: "Node|Function|Array",
        toolbarStart: "Node|Function|Array",
        toolbarEnd: "Node|Function|Array",
        caption: "string|Node|Function|Array",
        footer: "Node|Function|Array",
        status: "string|Node|Function|Array",
        rowClass: "string|((row,ctx)=>string)",
        rowAttrs: "object|((row,ctx)=>object)",
        minTableWidth: "string|number",
        stickyHeader: "boolean",
        hideHeader: "boolean",
        hideFooter: "boolean",
        dense: "boolean",
        striped: "boolean",
        hover: "boolean",
        tableClass: "string",
        cardClass: "string",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Introductory content above the table",
        toolbarStart: "Toolbar left area",
        toolbar: "Central/custom toolbar",
        toolbarEnd: "Toolbar right area",
        search: "Replaces the built-in search box",
        header: "Custom column header",
        cell: "Global cell renderer",
        actions: "Global row actions renderer",
        actionsHeader: "Actions column header",
        caption: "Caption above the table",
        status: "Extra content in the status row",
        loading: "Loading state",
        empty: "Empty state",
        footer: "Extra content in the footer"
      },
      events: {
        onRowClick: "(row, ctx, event) => void",
        onRowDblClick: "(row, ctx, event) => void"
      },
      returns: "HTMLDivElement",
      description: "Standardized table with toolbar, search, sorting, pagination, states, and flexible rendering."
    };
  }

  UI.Menu = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const stateList = ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"];
    const sizeList = ["xs", "sm", "md", "lg", "xl"];
    let currentProps = { ...props };
    let entry = null;
    let boundEl = null;
    let lastActive = null;
    let openTimer = null;
    let closeTimer = null;

    const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
    const resolveRender = (value, ctx) => typeof value === "function" ? value(ctx) : value;
    const splitClasses = (value) => String(value || "").split(/\s+/).filter(Boolean);
    const isPlainObject = (value) => value && typeof value === "object" && !value.nodeType && !Array.isArray(value) && !(value instanceof Function);
    const isAnchorLike = (value) => !!value && typeof value === "object" && (value.nodeType === 1 || typeof value.getBoundingClientRect === "function");
    const clearTimers = () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      openTimer = null;
      closeTimer = null;
    };
    const setTrackedClasses = (target, key, classes) => {
      if (!target) return;
      const prev = target[key] || [];
      if (prev.length) target.classList.remove(...prev);
      const next = (classes || []).filter(Boolean);
      if (next.length) target.classList.add(...next);
      target[key] = next;
    };
    const setStyleValue = (target, name, value, formatter = (v) => v) => {
      if (!target) return;
      if (value == null || value === "") {
        target.style.removeProperty(name);
        return;
      }
      target.style.setProperty(name, formatter(value));
    };
    const getOptions = () => currentProps || {};
    const getStateClass = (opts) => {
      const value = String(uiUnwrap(opts.state ?? opts.color) || "").toLowerCase();
      return stateList.includes(value) ? value : "";
    };
    const getSizeClass = (opts) => {
      const value = String(uiUnwrap(opts.size) || "").toLowerCase();
      return sizeList.includes(value) ? value : "";
    };
    const getPlacement = (opts) => String(uiUnwrap(opts.placement ?? opts.position ?? "bottom-start"));
    const getDelay = () => {
      const raw = uiUnwrap(getOptions().delay ?? getOptions().showDelay);
      const value = Number(raw);
      return Number.isFinite(value) ? Math.max(0, value) : 0;
    };
    const getHideDelay = () => {
      const raw = uiUnwrap(getOptions().hideDelay);
      const value = Number(raw);
      return Number.isFinite(value) ? Math.max(0, value) : 80;
    };
    const getAnchor = (fallback = null) => {
      if (fallback) return fallback;
      const opts = getOptions();
      return boundEl || uiUnwrap(opts.anchorEl ?? opts.triggerEl ?? opts.target ?? opts.anchor) || null;
    };
    const parseTriggers = (value) => {
      if (value == null || value === true) return new Set(["click"]);
      if (value === false) return new Set(["manual"]);
      const raw = Array.isArray(value) ? value : String(value).split(/[\s,|/]+/);
      const out = new Set();
      raw.forEach((item) => {
        const key = String(item || "").trim().toLowerCase();
        if (!key) return;
        if (key === "mouseenter" || key === "mouseover") out.add("hover");
        else if (key === "blur" || key === "focusin") out.add("focus");
        else if (key === "tap") out.add("click");
        else out.add(key);
      });
      return out.size ? out : new Set(["manual"]);
    };
    const parseOpenArgs = (arg1, arg2) => {
      let anchorEl = null;
      let nextProps = null;
      if (isAnchorLike(arg1)) {
        anchorEl = arg1;
        if (isPlainObject(arg2)) nextProps = arg2;
      } else if (isPlainObject(arg1)) {
        nextProps = arg1;
        const maybeAnchor = arg1.anchorEl ?? arg1.triggerEl ?? arg1.target ?? arg1.anchor;
        if (isAnchorLike(maybeAnchor)) anchorEl = maybeAnchor;
      } else if (arg1 != null) {
        anchorEl = arg1;
      }
      return { anchorEl, nextProps };
    };
    const getFocusableItems = (root = entry?.panel) => Array.from(root?.querySelectorAll?.(
      "[data-menu-item]:not([disabled]):not([tabindex='-1']), .cms-menu-item:not([disabled]):not([tabindex='-1']), [role='menuitem']:not([disabled]):not([tabindex='-1']), a[href]:not([tabindex='-1']), button:not([disabled]):not([tabindex='-1'])"
    ) || []).filter((el) => el.offsetParent !== null && el.getAttribute("aria-hidden") !== "true");
    const focusInitialItem = () => {
      if (uiUnwrap(getOptions().autoFocus) === false) return;
      setTimeout(() => {
        const items = getFocusableItems();
        if (!items.length) return;
        const active = items.find((el) => el.classList.contains("is-active") || el.classList.contains("is-selected") || el.classList.contains("is-checked"));
        (active || items[0]).focus();
      }, 0);
    };
    const buildIconNode = (value, ctx, size = "sm") => {
      const raw = resolveRender(value, ctx);
      if (raw == null) return [];
      if (typeof raw === "string") return [UI.Icon({ name: raw, size })];
      return slotToArray(raw, { ...ctx, as: "icon" });
    };
    const renderItemEntries = (source, ctx) => {
      const raw = resolveRender(source, ctx);
      if (raw == null || raw === false) return [];
      if (Array.isArray(raw)) return raw.flatMap((entryValue, index) => renderItemEntries(entryValue, { ...ctx, index }));
      if (typeof raw === "function") return renderItemEntries(raw(ctx), ctx);
      if (raw?.nodeType) return [raw];
      if (typeof raw === "string" || typeof raw === "number") {
        return renderItemEntries({ label: raw }, ctx);
      }
      if (!isPlainObject(raw)) {
        return slotToArray(raw, { ...ctx, as: "item" });
      }

      const kind = String(raw.type ?? raw.kind ?? "").toLowerCase();
      if (kind === "separator" || kind === "divider" || raw.separator === true || raw.divider === true) {
        return [_.div({ class: "cms-menu-divider", role: "separator" })];
      }

      const groupItems = raw.items ?? raw.children;
      if ((kind === "group" || kind === "section" || Array.isArray(groupItems)) && groupItems != null) {
        const groupCtx = { ...ctx, item: raw };
        const labelNodes = renderSlotToArray(slots, "groupLabel", groupCtx, resolveRender(raw.label ?? raw.title, groupCtx));
        const contentNodes = renderItemEntries(groupItems, groupCtx);
        if (!contentNodes.length) return [];
        return [_.div(
          { class: uiClass(["cms-menu-group", raw.class]) },
          labelNodes.length ? _.div({ class: "cms-menu-group-label" }, ...labelNodes) : null,
          _.div({ class: "cms-menu-group-items" }, ...contentNodes)
        )];
      }

      const itemCtx = {
        ...ctx,
        item: raw,
        close,
        dismiss: close,
        open,
        toggle,
        update,
        isOpen,
        entry: () => entry,
        anchorEl: getAnchor(),
        props: getOptions()
      };
      const disabled = !!uiUnwrap(raw.disabled);
      const checked = raw.checked == null ? null : !!uiUnwrap(raw.checked);
      const active = !!uiUnwrap(raw.active ?? raw.selected);
      const itemState = getStateClass(raw);
      const href = uiUnwrap(raw.href);
      const to = uiUnwrap(raw.to);
      const closeOnSelect = hasOwn(raw, "closeOnSelect")
        ? !!uiUnwrap(raw.closeOnSelect)
        : (raw.keepOpen === true ? false : (getOptions().closeOnSelect !== false));
      const ariaRole = raw.role || (checked != null ? "menuitemcheckbox" : "menuitem");
      const iconNodes = buildIconNode(raw.icon, itemCtx);
      const iconRightNodes = buildIconNode(raw.iconRight ?? raw.endIcon, itemCtx);
      const titleNodes = renderSlotToArray(slots, "itemTitle", itemCtx, resolveRender(raw.title ?? raw.label, itemCtx));
      const subtitleNodes = renderSlotToArray(slots, "itemSubtitle", itemCtx, resolveRender(raw.subtitle ?? raw.description, itemCtx));
      const shortcutNodes = renderSlotToArray(slots, "itemShortcut", itemCtx, resolveRender(raw.shortcut, itemCtx));
      const badgeNodes = renderSlotToArray(slots, "itemBadge", itemCtx, resolveRender(raw.badge, itemCtx));
      const customBodyNodes = renderSlotToArray(slots, "item", itemCtx, resolveRender(raw.content ?? raw.body ?? raw.render, itemCtx));
      const asideNodes = [
        ...badgeNodes,
        ...shortcutNodes,
        ...(checked === true && !iconRightNodes.length && !badgeNodes.length
          ? [_.span({ class: "cms-menu-entry-check" }, UI.Icon({ name: raw.checkedIcon || "check", size: "sm" }))]
          : []),
        ...iconRightNodes
      ];
      const entryClass = uiClass([
        "cms-menu-entry",
        "cms-menu-item",
        itemState ? `cms-state-${itemState}` : "",
        uiWhen(active, "is-active"),
        uiWhen(checked === true, "is-checked"),
        uiWhen(disabled, "is-disabled"),
        raw.class
      ]);
      const entryProps = {
        class: entryClass,
        role: ariaRole,
        tabIndex: disabled ? -1 : (raw.tabIndex ?? -1),
        "data-menu-item": true,
        "data-menu-select": closeOnSelect ? "true" : "false",
        "data-menu-close": raw.close === true ? "true" : null,
        "data-menu-keep-open": closeOnSelect ? null : "true",
        "aria-disabled": disabled ? "true" : null,
        "aria-checked": checked == null ? null : String(checked),
        title: raw.titleAttr ?? raw.tooltip ?? null,
        type: href ? null : "button",
        href: href || null,
        target: raw.target || null,
        rel: raw.rel || (raw.target === "_blank" ? "noopener noreferrer" : null),
        onClick: (e) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          getOptions().onItemClick?.(raw, itemCtx, e);
          const result = raw.onClick?.(itemCtx, e);
          if (e.defaultPrevented) return;
          if (to && CMSwift.router?.navigate) {
            e.preventDefault();
            CMSwift.router.navigate(to);
          }
          if (result === false) return;
          if (closeOnSelect) close();
        }
      };
      if (raw.attrs && typeof raw.attrs === "object") Object.assign(entryProps, raw.attrs);

      const Tag = href ? _.a : _.button;
      const bodyNodes = customBodyNodes.length
        ? customBodyNodes
        : [
          titleNodes.length ? _.div({ class: "cms-menu-entry-title" }, ...titleNodes) : null,
          subtitleNodes.length ? _.div({ class: "cms-menu-entry-subtitle" }, ...subtitleNodes) : null
        ].filter(Boolean);

      return [Tag(
        entryProps,
        iconNodes.length ? _.span({ class: "cms-menu-entry-icon" }, ...iconNodes) : null,
        _.span(
          { class: "cms-menu-entry-main" },
          ...bodyNodes
        ),
        asideNodes.length ? _.span({ class: "cms-menu-entry-aside" }, ...asideNodes) : null
      )];
    };
    const buildContent = () => {
      const opts = getOptions();
      const ctx = {
        close,
        dismiss: close,
        open,
        toggle,
        update,
        isOpen,
        entry: () => entry,
        anchorEl: getAnchor(),
        props: opts
      };
      const iconNodes = buildIconNode(opts.icon, ctx, opts.iconSize || "md");
      const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, resolveRender(opts.eyebrow, ctx));
      const titleNodes = renderSlotToArray(slots, "title", ctx, resolveRender(opts.title ?? opts.heading ?? opts.label, ctx));
      const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, resolveRender(opts.subtitle ?? opts.description, ctx));
      const beforeNodes = renderSlotToArray(slots, "before", ctx, resolveRender(opts.before, ctx));
      const headerNodes = renderSlotToArray(slots, "header", ctx, resolveRender(opts.header, ctx));
      const afterNodes = renderSlotToArray(slots, "after", ctx, resolveRender(opts.after, ctx));
      const footerNodes = renderSlotToArray(slots, "footer", ctx, resolveRender(opts.footer, ctx));
      const statusNodes = renderSlotToArray(slots, "status", ctx, resolveRender(opts.status, ctx));

      let contentRaw = opts.content ?? opts.body;
      if (contentRaw == null && children && children.length) contentRaw = children;
      let contentNodes = renderSlotToArray(slots, "content", ctx, resolveRender(contentRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "body", ctx, resolveRender(contentRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "default", ctx, resolveRender(contentRaw, ctx));

      const itemNodes = renderItemEntries(opts.items ?? opts.actionsList ?? opts.entries, ctx);
      const emptyNodes = !itemNodes.length
        ? renderSlotToArray(slots, "empty", ctx, resolveRender(opts.empty ?? opts.emptyText, ctx))
        : [];

      let headerEl = null;
      if (headerNodes.length) {
        headerEl = _.div({ class: uiClass(["cms-menu-head", "cms-menu-head-custom", opts.headerClass]) }, ...headerNodes);
      } else if (iconNodes.length || eyebrowNodes.length || titleNodes.length || subtitleNodes.length) {
        headerEl = _.div(
          { class: uiClass(["cms-menu-head", opts.headerClass]) },
          iconNodes.length ? _.div({ class: "cms-menu-head-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-menu-head-main" },
            eyebrowNodes.length ? _.div({ class: "cms-menu-eyebrow" }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: "cms-menu-title" }, ...titleNodes) : null,
            subtitleNodes.length ? _.div({ class: "cms-menu-subtitle" }, ...subtitleNodes) : null
          )
        );
      }

      return _.div(
        {
          class: uiClass([
            "cms-menu",
            "cms-menu-shell",
            uiWhen(opts.dense, "dense"),
            uiWhen(itemNodes.length > 0, "has-items"),
            uiWhen(footerNodes.length > 0 || statusNodes.length > 0, "has-footer"),
            opts.class
          ]),
          style: opts.style || {},
          role: opts.role || "menu",
          "aria-label": opts.ariaLabel || null
        },
        beforeNodes.length ? _.div({ class: "cms-menu-before" }, ...beforeNodes) : null,
        headerEl,
        contentNodes.length ? _.div({ class: uiClass(["cms-menu-content", opts.contentClass]) }, ...contentNodes) : null,
        itemNodes.length ? _.div({ class: uiClass(["cms-menu-items", opts.itemsClass]) }, ...itemNodes) : null,
        (!itemNodes.length && emptyNodes.length) ? _.div({ class: "cms-menu-empty" }, ...emptyNodes) : null,
        afterNodes.length ? _.div({ class: "cms-menu-after" }, ...afterNodes) : null,
        (statusNodes.length || footerNodes.length)
          ? _.div(
            { class: uiClass(["cms-menu-footer", opts.footerClass]) },
            statusNodes.length ? _.div({ class: "cms-menu-status" }, ...statusNodes) : null,
            footerNodes.length ? _.div({ class: "cms-menu-footer-actions" }, ...footerNodes) : null
          )
          : null
      );
    };
    const applyEntryOptions = (currentEntry) => {
      if (!currentEntry?.panel) return;
      const opts = getOptions();
      const stateClass = getStateClass(opts);
      const sizeClass = getSizeClass(opts);
      setTrackedClasses(currentEntry.panel, "_menuClassTokens", [
        "cms-menu-panel",
        "cms-clear-set",
        "cms-singularity",
        sizeClass ? `cms-menu-${sizeClass}` : "",
        stateClass ? `cms-state-${stateClass}` : "",
        uiUnwrap(opts.outline) ? "outline" : "",
        ...splitClasses(opts.panelClass)
      ]);
      setTrackedClasses(currentEntry.overlay, "_menuOverlayClassTokens", [
        ...splitClasses(opts.overlayClass)
      ]);
      currentEntry.panel.dataset.placement = getPlacement(opts);
      setStyleValue(currentEntry.panel, "--cms-menu-width", uiUnwrap(opts.width), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-menu-min-width", uiUnwrap(opts.minWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-menu-max-width", uiUnwrap(opts.maxWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-menu-max-height", uiUnwrap(opts.maxHeight), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-menu-body-max-height", uiUnwrap(opts.bodyMaxHeight ?? opts.contentMaxHeight), toCssSize);
      if (opts.panelStyle) Object.assign(currentEntry.panel.style, opts.panelStyle);
      setPropertyProps(currentEntry.panel, opts);
    };
    const renderOpenContent = () => {
      if (!entry?.panel) return;
      entry.panel.replaceChildren(buildContent());
    };
    const close = () => {
      clearTimers();
      if (!entry) return;
      const toClose = entry;
      entry = null;
      overlayLeave(toClose, () => CMSwift.overlay.close(toClose.id));
    };
    const update = (nextProps = {}) => {
      if (nextProps && typeof nextProps === "object") currentProps = { ...currentProps, ...nextProps };
      if (entry) {
        const opts = getOptions();
        applyEntryOptions(entry);
        renderOpenContent();
        entry.reposition?.({
          anchorEl: entry._anchorEl,
          placement: getPlacement(opts),
          offsetX: opts.offsetX ?? 0,
          offsetY: opts.offsetY ?? opts.offset ?? 8
        });
        focusInitialItem();
      }
      return api;
    };
    const open = (arg1 = null, arg2 = null) => {
      clearTimers();
      const { anchorEl, nextProps } = parseOpenArgs(arg1, arg2);
      if (nextProps) currentProps = { ...currentProps, ...nextProps };
      const opts = getOptions();
      const anchor = getAnchor(anchorEl);
      if (!anchor || uiUnwrap(opts.disabled)) return null;
      if (entry && entry._anchorEl === anchor) {
        const nextOpts = getOptions();
        applyEntryOptions(entry);
        renderOpenContent();
        entry.reposition?.({
          anchorEl: entry._anchorEl,
          placement: getPlacement(nextOpts),
          offsetX: nextOpts.offsetX ?? 0,
          offsetY: nextOpts.offsetY ?? nextOpts.offset ?? 8
        });
        focusInitialItem();
        return entry;
      }
      if (entry) close();
      lastActive = document.activeElement;
      let currentRef = null;
      entry = CMSwift.overlay.open(() => buildContent(), {
        type: "menu",
        anchorEl: anchor,
        placement: getPlacement(opts),
        offsetX: opts.offsetX ?? 0,
        offsetY: opts.offsetY ?? opts.offset ?? 8,
        backdrop: opts.backdrop === true,
        lockScroll: opts.lockScroll === true,
        trapFocus: opts.trapFocus === true,
        autoFocus: false,
        closeOnOutside: opts.closeOnOutside !== false,
        closeOnBackdrop: opts.closeOnBackdrop ?? opts.backdrop === true,
        closeOnEsc: opts.closeOnEsc !== false,
        className: uiClassStatic(["cms-menu-panel"]),
        onClose: () => {
          currentRef?._menuCleanup?.();
          getOptions().onClose?.(currentRef);
          if (getOptions().returnFocus !== false && lastActive && typeof lastActive.focus === "function") {
            setTimeout(() => lastActive.focus(), 0);
          }
        }
      });
      if (!entry?.panel) return entry;
      const current = entry;
      currentRef = current;
      current._anchorEl = anchor;
      const cancelHide = () => {
        clearTimeout(closeTimer);
        closeTimer = null;
      };
      const scheduleHide = () => {
        hide();
      };
      const onPanelClick = (e) => {
        const target = e.target;
        if (!target || !target.closest) return;
        if (target.closest("[data-menu-close]")) {
          close();
          return;
        }
        if (getOptions().closeOnSelect === false) return;
        const selected = target.closest("[data-menu-item], [data-menu-select], .cms-menu-item, [role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio'], a[href], button:not([disabled])");
        if (!selected) return;
        if (selected.closest("[data-menu-keep-open]")) return;
        if (selected.getAttribute("data-menu-select") === "false") return;
        close();
      };
      const onPanelKeydown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
          return;
        }
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
        const items = getFocusableItems(current.panel);
        if (!items.length) return;
        e.preventDefault();
        const activeIndex = items.indexOf(document.activeElement);
        if (e.key === "Home") {
          items[0].focus();
          return;
        }
        if (e.key === "End") {
          items[items.length - 1].focus();
          return;
        }
        const dir = e.key === "ArrowDown" ? 1 : -1;
        const next = activeIndex < 0
          ? (dir > 0 ? 0 : items.length - 1)
          : (activeIndex + dir + items.length) % items.length;
        items[next].focus();
      };
      current.panel.addEventListener("click", onPanelClick);
      current.panel.addEventListener("keydown", onPanelKeydown);
      const activeTriggers = parseTriggers(opts.trigger ?? opts.triggers ?? (hasOwn(opts, "open") ? "manual" : null));
      const allowHover = activeTriggers.has("hover");
      const allowFocus = activeTriggers.has("focus");
      if (allowHover || allowFocus) {
        current.panel.addEventListener("mouseenter", cancelHide);
        current.panel.addEventListener("mouseleave", scheduleHide);
        current.panel.addEventListener("focusin", cancelHide);
        current.panel.addEventListener("focusout", scheduleHide);
      }
      current._menuCleanup = () => {
        current.panel?.removeEventListener("click", onPanelClick);
        current.panel?.removeEventListener("keydown", onPanelKeydown);
        current.panel?.removeEventListener("mouseenter", cancelHide);
        current.panel?.removeEventListener("mouseleave", scheduleHide);
        current.panel?.removeEventListener("focusin", cancelHide);
        current.panel?.removeEventListener("focusout", scheduleHide);
      };
      applyEntryOptions(current);
      current.reposition?.({
        anchorEl: anchor,
        placement: getPlacement(opts),
        offsetX: opts.offsetX ?? 0,
        offsetY: opts.offsetY ?? opts.offset ?? 8
      });
      overlayEnter(current);
      getOptions().onOpen?.(current);
      focusInitialItem();
      return current;
    };
    const show = (anchorEl, nextProps = null) => {
      clearTimeout(closeTimer);
      closeTimer = null;
      clearTimeout(openTimer);
      openTimer = setTimeout(() => open(anchorEl, nextProps), getDelay());
    };
    const hide = (immediate = false) => {
      clearTimeout(openTimer);
      openTimer = null;
      if (!entry) return;
      clearTimeout(closeTimer);
      if (immediate) {
        close();
        return;
      }
      closeTimer = setTimeout(() => close(), getHideDelay());
    };
    const toggle = (arg1 = null, arg2 = null) => isOpen() ? (close(), null) : open(arg1, arg2);
    const isOpen = () => !!entry;
    const bind = (el) => {
      if (!el) return () => { };
      boundEl = el;
      const opts = getOptions();
      const triggers = parseTriggers(opts.trigger ?? opts.triggers ?? (hasOwn(opts, "open") ? "manual" : null));
      const allowHover = triggers.has("hover");
      const allowFocus = triggers.has("focus");
      const allowClick = triggers.has("click");
      const isManual = triggers.has("manual") || (!allowHover && !allowFocus && !allowClick);
      const cleanups = [];
      const cleanup = () => {
        clearTimers();
        cleanups.forEach((fn) => fn());
        if (boundEl === el) boundEl = null;
      };
      if (hasOwn(opts, "open")) {
        if (uiIsReactive(opts.open)) {
          CMSwift.reactive.effect(() => {
            if (!boundEl) return;
            if (uiUnwrap(getOptions().open)) open(boundEl);
            else hide(true);
          }, "UI.Menu:open");
        } else if (opts.open === true) {
          open(el);
        } else if (opts.open === false) {
          hide(true);
        }
        return cleanup;
      }
      if (isManual || uiUnwrap(opts.disabled)) return cleanup;
      if (allowHover) {
        const onEnter = () => show(el);
        const onLeave = () => hide();
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
        });
      }
      if (allowFocus) {
        const onFocus = () => show(el);
        const onBlur = () => hide();
        el.addEventListener("focus", onFocus);
        el.addEventListener("blur", onBlur);
        cleanups.push(() => {
          el.removeEventListener("focus", onFocus);
          el.removeEventListener("blur", onBlur);
        });
      }
      if (allowClick) {
        const onClick = (e) => {
          getOptions().onTriggerClick?.(e);
          if (e.defaultPrevented) return;
          toggle(el);
        };
        el.addEventListener("click", onClick);
        cleanups.push(() => el.removeEventListener("click", onClick));
      }
      return cleanup;
    };
    const api = {
      open,
      close,
      show,
      hide,
      toggle,
      update,
      bind,
      isOpen,
      entry: () => entry,
      props: () => ({ ...currentProps })
    };

    return api;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Menu = {
      signature: "UI.Menu(props) | UI.Menu(props, ...children) -> { open, close, show, hide, toggle, update, bind, isOpen }",
      props: {
        title: "String|Node|Function|Array|({ close })=>Node",
        subtitle: "String|Node|Function|Array|({ close })=>Node",
        eyebrow: "String|Node|Function|Array|({ close })=>Node",
        icon: "String|Node|Function|Array",
        content: "Node|Function|Array|({ close })=>Node",
        body: "Alias of content",
        items: "Array<string|object>|Function|Array",
        before: "Node|Function|Array",
        after: "Node|Function|Array",
        footer: "Node|Function|Array",
        status: "Node|Function|Array",
        empty: "Node|Function|Array",
        size: "xs|sm|md|lg|xl",
        state: "primary|secondary|warning|danger|success|info|light|dark",
        color: "Alias of state",
        trigger: "click|hover|focus|manual|Array",
        placement: "string",
        offsetX: "number",
        offsetY: "number",
        offset: "Alias of offsetY",
        width: "string|number",
        minWidth: "string|number",
        maxWidth: "string|number",
        maxHeight: "string|number",
        bodyMaxHeight: "string|number",
        contentMaxHeight: "Alias of bodyMaxHeight",
        closeOnSelect: "boolean",
        closeOnOutside: "boolean",
        closeOnEsc: "boolean",
        autoFocus: "boolean",
        anchorEl: "HTMLElement|VirtualAnchor",
        triggerEl: "Alias of anchorEl",
        target: "Alias of anchorEl",
        slots: "{ before?, icon?, eyebrow?, title?, subtitle?, header?, content?, body?, item?, itemTitle?, itemSubtitle?, itemBadge?, itemShortcut?, groupLabel?, empty?, status?, footer?, after?, default? }",
        class: "string",
        panelClass: "string",
        overlayClass: "string",
        style: "object",
        panelStyle: "object",
        onOpen: "function",
        onClose: "function",
        onItemClick: "(item, ctx, event) => void",
        onTriggerClick: "function"
      },
      slots: {
        before: "Region above header/body ({ close })",
        icon: "Menu icon",
        eyebrow: "Menu eyebrow ({ close })",
        title: "Menu title ({ close })",
        subtitle: "Menu subtitle ({ close })",
        header: "Header custom ({ close })",
        content: "Custom content ({ close })",
        body: "Alias of content ({ close })",
        item: "Custom item body ({ item, close })",
        itemTitle: "Item title ({ item, close })",
        itemSubtitle: "Item subtitle ({ item, close })",
        itemBadge: "Item badge ({ item, close })",
        itemShortcut: "Item shortcut ({ item, close })",
        groupLabel: "Group label ({ item, close })",
        empty: "Empty state ({ close })",
        status: "Status row ({ close })",
        footer: "Footer actions ({ close })",
        after: "Region below body/footer ({ close })",
        default: "Fallback content ({ close })"
      },
      events: {
        onOpen: "void",
        onClose: "void",
        onItemClick: "item click"
      },
      returns: "Object { open(), close(), show(), hide(), toggle(), update(), bind(), isOpen() }",
      description: "Standardized menu overlay with item model, rich slots, bindable triggers, header/footer, and imperative API."
    };
  }

  UI.Popover = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const stateList = ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"];
    const sizeList = ["xs", "sm", "md", "lg", "xl"];
    let currentProps = { ...props };
    let entry = null;
    let boundEl = null;
    let lastActive = null;
    let openTimer = null;
    let closeTimer = null;

    const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
    const resolveRender = (value, ctx) => typeof value === "function" ? value(ctx) : value;
    const splitClasses = (value) => String(value || "").split(/\s+/).filter(Boolean);
    const isPlainObject = (value) => value && typeof value === "object" && !value.nodeType && !Array.isArray(value) && !(value instanceof Function);
    const isAnchorLike = (value) => !!value && typeof value === "object" && (value.nodeType === 1 || typeof value.getBoundingClientRect === "function");
    const clearTimers = () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      openTimer = null;
      closeTimer = null;
    };
    const setTrackedClasses = (target, key, classes) => {
      if (!target) return;
      const prev = target[key] || [];
      if (prev.length) target.classList.remove(...prev);
      const next = (classes || []).filter(Boolean);
      if (next.length) target.classList.add(...next);
      target[key] = next;
    };
    const setStyleValue = (target, name, value, formatter = (v) => v) => {
      if (!target) return;
      if (value == null || value === "") {
        target.style.removeProperty(name);
        return;
      }
      target.style.setProperty(name, formatter(value));
    };
    const getOptions = () => currentProps;
    const getStateClass = (opts) => {
      const value = uiUnwrap(opts.state ?? opts.color);
      if (!value) return "";
      return stateList.includes(value) ? value : String(value);
    };
    const getSizeClass = (opts) => {
      const value = uiUnwrap(opts.size);
      return (typeof value === "string" && sizeList.includes(value)) ? value : "";
    };
    const getAlignClass = (opts) => {
      const raw = String(uiUnwrap(opts.actionsAlign ?? opts.footerAlign ?? opts.alignActions ?? "end")).toLowerCase();
      if (["start", "left"].includes(raw)) return "start";
      if (["center", "middle"].includes(raw)) return "center";
      if (["between", "space-between"].includes(raw)) return "between";
      if (["stretch", "full"].includes(raw)) return "stretch";
      return "end";
    };
    const getPlacement = (opts) => String(uiUnwrap(opts.placement ?? opts.position ?? "bottom-start"));
    const getNumber = (value, fallback) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    };
    const getDelay = () => getNumber(getOptions().delay, 0);
    const getHideDelay = () => getNumber(getOptions().hideDelay, 120);
    const isClosable = (opts) => {
      const value = opts.closable ?? opts.dismissible ?? opts.closeButton;
      return value === true;
    };
    const getAnchor = (anchorOverride = null) => {
      if (anchorOverride) return anchorOverride;
      const opts = getOptions();
      return boundEl || uiUnwrap(opts.anchorEl ?? opts.triggerEl ?? opts.target ?? opts.anchor) || null;
    };
    const parseTriggers = (value) => {
      if (value == null || value === true) return new Set(["click"]);
      if (value === false) return new Set(["manual"]);
      const raw = Array.isArray(value) ? value : String(value).split(/[\s,|/]+/);
      const out = new Set();
      raw.forEach((item) => {
        const key = String(item || "").trim().toLowerCase();
        if (!key) return;
        if (key === "mouseenter" || key === "mouseover") out.add("hover");
        else if (key === "blur" || key === "focusin") out.add("focus");
        else if (key === "tap") out.add("click");
        else out.add(key);
      });
      return out.size ? out : new Set(["manual"]);
    };
    const parseOpenArgs = (arg1, arg2) => {
      let anchorEl = null;
      let nextProps = null;
      if (isAnchorLike(arg1)) {
        anchorEl = arg1;
        if (isPlainObject(arg2)) nextProps = arg2;
      } else if (isPlainObject(arg1)) {
        nextProps = arg1;
        const maybeAnchor = arg1.anchorEl ?? arg1.triggerEl ?? arg1.target ?? arg1.anchor;
        if (isAnchorLike(maybeAnchor)) anchorEl = maybeAnchor;
      } else if (arg1 != null) {
        anchorEl = arg1;
      }
      return { anchorEl, nextProps };
    };
    const buildContent = () => {
      const opts = getOptions();
      const ctx = {
        close,
        dismiss: close,
        open,
        toggle,
        update,
        isOpen,
        entry: () => entry,
        anchorEl: getAnchor(),
        props: opts
      };
      const iconFallback = opts.icon != null
        ? (typeof opts.icon === "string"
          ? UI.Icon({ name: opts.icon, size: opts.iconSize || "md" })
          : CMSwift.ui.slot(opts.icon, { as: "icon" }))
        : null;
      const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, resolveRender(opts.eyebrow, ctx));
      const titleNodes = renderSlotToArray(slots, "title", ctx, resolveRender(opts.title ?? opts.heading ?? opts.label, ctx));
      const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, resolveRender(opts.subtitle ?? opts.description, ctx));
      const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
      const headerNodes = renderSlotToArray(slots, "header", ctx, resolveRender(opts.headerContent ?? opts.head ?? opts.header, ctx));
      const closeSlotNodes = isClosable(opts)
        ? renderSlotToArray(slots, "close", ctx, UI.Btn({
          class: "cms-dialog-close",
          size: "sm",
          outline: true,
          "aria-label": opts.closeLabel || "Chiudi popover",
          "data-popover-close": true
        }, UI.Icon({ name: opts.closeIcon || "close", size: "sm" })))
        : [];

      let bodyRaw = opts.content ?? opts.body ?? opts.message ?? opts.text;
      if (bodyRaw == null && children && children.length) bodyRaw = children;
      let contentNodes = renderSlotToArray(slots, "content", ctx, resolveRender(bodyRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "body", ctx, resolveRender(bodyRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "default", ctx, resolveRender(bodyRaw, ctx));

      const footerRaw = resolveRender(opts.footer ?? opts.actions, ctx);
      let footerNodes = renderSlotToArray(slots, "footer", ctx, footerRaw);
      if (!footerNodes.length) footerNodes = renderSlotToArray(slots, "actions", ctx, footerRaw);

      let headerEl = null;
      if (headerNodes.length) {
        headerEl = _.div({ class: "cms-dialog-head cms-dialog-head-custom" }, ...headerNodes);
      } else if (eyebrowNodes.length || titleNodes.length || subtitleNodes.length || iconNodes.length || closeSlotNodes.length) {
        headerEl = _.div(
          { class: "cms-dialog-head" },
          iconNodes.length ? _.div({ class: "cms-dialog-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-dialog-head-main" },
            eyebrowNodes.length ? _.div({ class: "cms-dialog-eyebrow" }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: "cms-dialog-title" }, ...titleNodes) : null,
            subtitleNodes.length ? _.div({ class: "cms-dialog-subtitle" }, ...subtitleNodes) : null
          ),
          closeSlotNodes.length ? _.div({ class: "cms-dialog-close-wrap" }, ...closeSlotNodes) : null
        );
      }

      const sections = [];
      if (headerEl) sections.push(headerEl);
      if (contentNodes.length) {
        sections.push(_.div({ class: uiClass(["cms-dialog-body", opts.bodyClass]) }, ...contentNodes));
      }
      if (footerNodes.length) {
        sections.push(_.div({
          class: uiClass([
            "cms-dialog-actions",
            `is-${getAlignClass(opts)}`,
            uiWhen(opts.stackActions, "is-stacked"),
            opts.actionsClass,
            opts.footerClass
          ])
        }, ...footerNodes));
      }
      if (!sections.length) {
        sections.push(_.div({ class: uiClass(["cms-dialog-body", opts.bodyClass]) }));
      }

      return _.div({
        class: uiClass([
          "cms-dialog-shell",
          "cms-popover-shell",
          uiWhen(!!headerEl, "has-head"),
          uiWhen(footerNodes.length > 0, "has-footer"),
          uiWhen(opts.divider !== false, "with-divider")
        ])
      }, ...sections);
    };
    const applyEntryOptions = (currentEntry) => {
      if (!currentEntry?.panel) return;
      const opts = getOptions();
      const stateClass = getStateClass(opts);
      const sizeClass = getSizeClass(opts);
      setTrackedClasses(currentEntry.panel, "_popoverClassTokens", [
        "cms-dialog",
        "cms-popover",
        "cms-singularity",
        "cms-clear-set",
        sizeClass ? `cms-dialog-${sizeClass}` : "",
        stateClass,
        stateClass ? `cms-state-${stateClass}` : "",
        uiUnwrap(opts.scrollable) ? "scrollable" : "",
        uiUnwrap(opts.stickyHeader) ? "sticky-head" : "",
        uiUnwrap(opts.stickyActions) ? "sticky-actions" : "",
        uiUnwrap(opts.borderless) ? "borderless" : "",
        ...splitClasses(opts.class),
        ...splitClasses(opts.panelClass)
      ]);
      setTrackedClasses(currentEntry.overlay, "_popoverOverlayClassTokens", [
        ...splitClasses(opts.overlayClass)
      ]);
      currentEntry.panel.dataset.placement = getPlacement(opts);
      setStyleValue(currentEntry.panel, "--cms-dialog-width", uiUnwrap(opts.width), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-min-width", uiUnwrap(opts.minWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-max-width", uiUnwrap(opts.maxWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-max-height", uiUnwrap(opts.maxHeight), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-body-max-height", uiUnwrap(opts.bodyMaxHeight ?? opts.contentMaxHeight), toCssSize);
      if (opts.style) Object.assign(currentEntry.panel.style, opts.style);
      setPropertyProps(currentEntry.panel, opts);
      currentEntry.panel.setAttribute("role", opts.role || "dialog");
      currentEntry.panel.setAttribute("aria-modal", opts.modal === true ? "true" : "false");
      if (opts.ariaLabel) currentEntry.panel.setAttribute("aria-label", opts.ariaLabel);
      else currentEntry.panel.removeAttribute("aria-label");
    };
    const renderOpenContent = () => {
      if (!entry?.panel) return;
      entry.panel.replaceChildren(buildContent());
    };
    const close = () => {
      clearTimers();
      if (!entry) return;
      const toClose = entry;
      entry = null;
      overlayLeave(toClose, () => CMSwift.overlay.close(toClose.id));
    };
    const update = (nextProps = {}) => {
      if (nextProps && typeof nextProps === "object") currentProps = { ...currentProps, ...nextProps };
      if (entry) {
        applyEntryOptions(entry);
        renderOpenContent();
      }
      return api;
    };
    const open = (arg1 = null, arg2 = null) => {
      clearTimers();
      const { anchorEl, nextProps } = parseOpenArgs(arg1, arg2);
      if (nextProps) currentProps = { ...currentProps, ...nextProps };
      const opts = getOptions();
      const anchor = getAnchor(anchorEl);
      if (!anchor || uiUnwrap(opts.disabled)) return null;
      if (entry && entry._anchorEl === anchor) {
        applyEntryOptions(entry);
        renderOpenContent();
        return entry;
      }
      if (entry) close();
      lastActive = document.activeElement;
      const activeTriggers = parseTriggers(opts.trigger ?? opts.triggers ?? (hasOwn(opts, "open") ? "manual" : null));
      const allowHover = activeTriggers.has("hover");
      const allowFocus = activeTriggers.has("focus");
      let currentRef = null;
      entry = CMSwift.overlay.open(() => buildContent(), {
        type: "popover",
        anchorEl: anchor,
        placement: getPlacement(opts),
        offsetX: opts.offsetX ?? 0,
        offsetY: opts.offsetY ?? opts.offset ?? 10,
        backdrop: opts.backdrop === true,
        lockScroll: opts.lockScroll === true,
        trapFocus: opts.trapFocus === true,
        autoFocus: opts.autoFocus === true,
        closeOnOutside: opts.closeOnOutside !== false,
        closeOnBackdrop: opts.closeOnBackdrop ?? opts.backdrop === true,
        closeOnEsc: opts.closeOnEsc !== false,
        className: uiClassStatic(["cms-dialog", "cms-popover"]),
        onClose: () => {
          currentRef?._popoverCleanup?.();
          getOptions().onClose?.(currentRef);
          if (getOptions().returnFocus !== false && lastActive && typeof lastActive.focus === "function") {
            setTimeout(() => lastActive.focus(), 0);
          }
        }
      });
      if (!entry?.panel) return entry;
      const current = entry;
      currentRef = current;
      current._anchorEl = anchor;
      const cancelHide = () => {
        clearTimeout(closeTimer);
        closeTimer = null;
      };
      const scheduleHide = () => {
        if (!allowHover && !allowFocus) return;
        hide();
      };
      const onPanelClick = (e) => {
        const target = e.target;
        if (!target || !target.closest) return;
        if (target.closest("[data-popover-close]") || target.closest("[data-dialog-close]")) {
          close();
          return;
        }
        if (getOptions().closeOnSelect === true && target.closest("[data-popover-select]")) {
          close();
        }
      };
      current.panel.addEventListener("click", onPanelClick);
      if (allowHover || allowFocus) {
        current.panel.addEventListener("mouseenter", cancelHide);
        current.panel.addEventListener("mouseleave", scheduleHide);
        current.panel.addEventListener("focusin", cancelHide);
        current.panel.addEventListener("focusout", scheduleHide);
      }
      current._popoverCleanup = () => {
        current.panel?.removeEventListener("click", onPanelClick);
        current.panel?.removeEventListener("mouseenter", cancelHide);
        current.panel?.removeEventListener("mouseleave", scheduleHide);
        current.panel?.removeEventListener("focusin", cancelHide);
        current.panel?.removeEventListener("focusout", scheduleHide);
      };
      applyEntryOptions(current);
      overlayEnter(current);
      getOptions().onOpen?.(current);
      return current;
    };
    const show = (anchorEl, nextProps = null) => {
      clearTimeout(closeTimer);
      closeTimer = null;
      clearTimeout(openTimer);
      openTimer = setTimeout(() => open(anchorEl, nextProps), getDelay());
    };
    const hide = (immediate = false) => {
      clearTimeout(openTimer);
      openTimer = null;
      if (!entry) return;
      clearTimeout(closeTimer);
      if (immediate) {
        close();
        return;
      }
      closeTimer = setTimeout(() => close(), getHideDelay());
    };
    const toggle = (arg1 = null, arg2 = null) => isOpen() ? (close(), null) : open(arg1, arg2);
    const isOpen = () => !!entry;
    const bind = (el) => {
      if (!el) return () => { };
      boundEl = el;
      const opts = getOptions();
      const triggers = parseTriggers(opts.trigger ?? opts.triggers ?? (hasOwn(opts, "open") ? "manual" : null));
      const allowHover = triggers.has("hover");
      const allowFocus = triggers.has("focus");
      const allowClick = triggers.has("click");
      const isManual = triggers.has("manual") || (!allowHover && !allowFocus && !allowClick);
      const cleanups = [];
      const cleanup = () => {
        clearTimers();
        cleanups.forEach((fn) => fn());
        if (boundEl === el) boundEl = null;
      };
      if (hasOwn(opts, "open")) {
        if (uiIsReactive(opts.open)) {
          CMSwift.reactive.effect(() => {
            if (!boundEl) return;
            if (uiUnwrap(getOptions().open)) open(boundEl);
            else hide(true);
          }, "UI.Popover:open");
        } else if (opts.open === true) {
          open(el);
        } else if (opts.open === false) {
          hide(true);
        }
        return cleanup;
      }
      if (isManual || uiUnwrap(opts.disabled)) return cleanup;
      if (allowHover) {
        const onEnter = () => show(el);
        const onLeave = () => hide();
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
        });
      }
      if (allowFocus) {
        const onFocus = () => show(el);
        const onBlur = () => hide();
        el.addEventListener("focus", onFocus);
        el.addEventListener("blur", onBlur);
        cleanups.push(() => {
          el.removeEventListener("focus", onFocus);
          el.removeEventListener("blur", onBlur);
        });
      }
      if (allowClick) {
        const onClick = (e) => {
          getOptions().onTriggerClick?.(e);
          if (e.defaultPrevented) return;
          toggle(el);
        };
        el.addEventListener("click", onClick);
        cleanups.push(() => el.removeEventListener("click", onClick));
      }
      return cleanup;
    };
    const api = {
      open,
      close,
      show,
      hide,
      toggle,
      update,
      bind,
      isOpen,
      entry: () => entry,
      props: () => ({ ...currentProps })
    };

    return api;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Popover = {
      signature: "UI.Popover(props) | UI.Popover(props, ...children) -> { open, close, show, hide, toggle, update, bind, isOpen }",
      props: {
        title: "String|Node|Function|Array|({ close })=>Node",
        subtitle: "String|Node|Function|Array|({ close })=>Node",
        eyebrow: "String|Node|Function|Array|({ close })=>Node",
        icon: "String|Node|Function|Array",
        content: "Node|Function|Array|({ close })=>Node",
        body: "Alias of content",
        actions: "Node|Function|Array|({ close })=>Node",
        footer: "Alias of actions",
        size: "xs|sm|md|lg|xl",
        state: "primary|secondary|warning|danger|success|info|light|dark",
        color: "Alias of state",
        trigger: "click|hover|focus|manual|Array",
        placement: "string",
        offsetX: "number",
        offsetY: "number",
        offset: "Alias of offsetY",
        width: "string|number",
        minWidth: "string|number",
        maxWidth: "string|number",
        maxHeight: "string|number",
        bodyMaxHeight: "string|number",
        contentMaxHeight: "Alias of bodyMaxHeight",
        backdrop: "boolean",
        lockScroll: "boolean",
        trapFocus: "boolean",
        autoFocus: "boolean",
        closeButton: "boolean",
        closable: "boolean",
        closeOnSelect: "boolean",
        closeOnOutside: "boolean",
        closeOnBackdrop: "boolean",
        closeOnEsc: "boolean",
        open: "boolean|rod|signal",
        anchorEl: "HTMLElement|VirtualAnchor",
        triggerEl: "Alias of anchorEl",
        target: "Alias of anchorEl",
        slots: "{ icon?, eyebrow?, title?, subtitle?, header?, content?, body?, footer?, actions?, close?, default? }",
        class: "string",
        panelClass: "string",
        overlayClass: "string",
        style: "object",
        onOpen: "function",
        onClose: "function",
        onTriggerClick: "function"
      },
      slots: {
        icon: "Popover icon",
        eyebrow: "Popover eyebrow ({ close })",
        title: "Popover title ({ close })",
        subtitle: "Popover subtitle ({ close })",
        header: "Header custom ({ close })",
        content: "Popover body ({ close })",
        body: "Alias of content ({ close })",
        footer: "Popover footer ({ close })",
        actions: "Alias of footer ({ close })",
        close: "Close button slot ({ close })",
        default: "Fallback body ({ close })"
      },
      events: {
        onOpen: "void",
        onClose: "void"
      },
      returns: "Object { open(), close(), show(), hide(), toggle(), update(), bind(), isOpen() }",
      description: "Standardized anchored popover with rich layout, complete slots, bindable triggers, and imperative API."
    };
  }

  UI.ContextMenu = (...args) => {
    const { props, children } = CMSwift.uiNormalizeArgs(args);
    let currentProps = { ...props };
    let lastPoint = null;
    let lastAnchor = null;
    let lastTriggerEl = null;

    const isPlainObject = (value) => value && typeof value === "object" && !value.nodeType && !Array.isArray(value) && !(value instanceof Function);
    const isAnchorLike = (value) => !!value && typeof value === "object" && (value.nodeType === 1 || typeof value.getBoundingClientRect === "function");
    const isEventLike = (value) => !!value && typeof value === "object" && ("clientX" in value || "type" in value || "target" in value || "currentTarget" in value);
    const isPointLike = (value) => !!value && Number.isFinite(Number(value.x)) && Number.isFinite(Number(value.y));
    const getOptions = () => currentProps;
    const normalizePoint = (x, y) => {
      const px = Number(x);
      const py = Number(y);
      if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
      return { x: px, y: py };
    };
    const createVirtualAnchor = (point) => point ? {
      _cmsContextPoint: point,
      getBoundingClientRect: () => ({
        top: point.y,
        bottom: point.y,
        left: point.x,
        right: point.x,
        width: 0,
        height: 0
      })
    } : null;
    const getElementPoint = (el) => {
      if (!isAnchorLike(el)) return null;
      const rect = el.getBoundingClientRect();
      return normalizePoint(rect.left + Math.min(rect.width / 2, 24), rect.top + Math.min(rect.height / 2, 24));
    };
    const extractAnchor = (value) => uiUnwrap(value?.anchorEl ?? value?.triggerEl ?? value?.target ?? value?.anchor ?? null);
    const getEventPoint = (event, fallbackEl = null) => {
      if (!event) return getElementPoint(fallbackEl || lastTriggerEl);
      const point = normalizePoint(event.clientX, event.clientY);
      if (point) return point;
      const anchor = extractAnchor({ anchorEl: fallbackEl || event.currentTarget || event.target || lastTriggerEl });
      return getElementPoint(anchor);
    };
    const stripContextKeys = (value = {}) => {
      if (!isPlainObject(value)) return {};
      const next = { ...value };
      delete next.event;
      delete next.point;
      delete next.x;
      delete next.y;
      return next;
    };
    const buildMenuProps = () => {
      const opts = getOptions();
      return {
        ...opts,
        trigger: "manual",
        placement: opts.placement || "bottom-start",
        offsetX: opts.offsetX ?? 0,
        offsetY: opts.offsetY ?? opts.offset ?? 4,
        closeOnOutside: opts.closeOnOutside !== false,
        closeOnEsc: opts.closeOnEsc !== false,
        role: opts.role || "menu",
        ariaLabel: opts.ariaLabel || opts.title || "Context menu",
        class: uiClass(["cms-context-menu-shell", opts.class]),
        panelClass: uiClass(["cms-context-menu-panel", opts.panelClass])
      };
    };
    const menu = UI.Menu(buildMenuProps(), ...children);

    const resolveOpenInput = (arg1 = null, arg2 = null, arg3 = null) => {
      let point = null;
      let anchor = null;
      let nextProps = null;

      if (isEventLike(arg1)) {
        point = getEventPoint(arg1, lastTriggerEl);
        nextProps = isPlainObject(arg2) ? stripContextKeys(arg2) : null;
      } else if (typeof arg1 === "number" || typeof arg2 === "number") {
        point = normalizePoint(arg1, arg2);
        nextProps = isPlainObject(arg3) ? stripContextKeys(arg3) : null;
      } else if (isPointLike(arg1)) {
        point = normalizePoint(arg1.x, arg1.y);
        nextProps = isPlainObject(arg2) ? stripContextKeys(arg2) : null;
      } else if (isAnchorLike(arg1)) {
        anchor = arg1;
        nextProps = isPlainObject(arg2) ? stripContextKeys(arg2) : null;
      } else if (isPlainObject(arg1)) {
        const rawPoint = isPointLike(arg1.point) ? arg1.point : (isPointLike(arg1) ? arg1 : null);
        const rawAnchor = extractAnchor(arg1);
        const rawEvent = arg1.event;
        point = rawPoint ? normalizePoint(rawPoint.x, rawPoint.y) : getEventPoint(rawEvent, rawAnchor || lastTriggerEl);
        anchor = rawAnchor && isAnchorLike(rawAnchor) ? rawAnchor : null;
        nextProps = {
          ...stripContextKeys(arg1),
          ...(isPlainObject(arg2) ? stripContextKeys(arg2) : {})
        };
      } else if (lastPoint) {
        point = { ...lastPoint };
      }

      return { point, anchor, nextProps };
    };
    const rememberAnchor = (anchor, point = null) => {
      lastAnchor = anchor || lastAnchor;
      lastPoint = point || (anchor && anchor._cmsContextPoint) || lastPoint;
    };
    const mergeProps = (nextProps = null) => {
      if (isPlainObject(nextProps) && Object.keys(nextProps).length) {
        currentProps = { ...currentProps, ...nextProps };
      }
    };
    const getOpenAnchor = (inputAnchor = null, inputPoint = null) => {
      if (inputPoint) return createVirtualAnchor(inputPoint);
      if (inputAnchor && isAnchorLike(inputAnchor)) return inputAnchor;
      const configAnchor = extractAnchor(getOptions());
      if (isAnchorLike(configAnchor)) return configAnchor;
      if (lastPoint) return createVirtualAnchor(lastPoint);
      if (isAnchorLike(lastAnchor)) return lastAnchor;
      if (isAnchorLike(lastTriggerEl)) return lastTriggerEl;
      return null;
    };
    const open = (arg1 = null, arg2 = null, arg3 = null) => {
      const { point, anchor, nextProps } = resolveOpenInput(arg1, arg2, arg3);
      mergeProps(nextProps);
      const openAnchor = getOpenAnchor(anchor, point);
      if (!openAnchor) return null;
      rememberAnchor(openAnchor, point);
      return menu.open(openAnchor, buildMenuProps());
    };
    const openAt = (x, y, nextProps = null) => open(x, y, nextProps);
    const openFromEvent = (event, nextProps = null) => open(event, nextProps);
    const close = () => {
      menu.close();
      return api;
    };
    const hide = (immediate = true) => {
      if (immediate === false) menu.hide(false);
      else menu.close();
      return api;
    };
    const show = (arg1 = null, arg2 = null, arg3 = null) => open(arg1, arg2, arg3);
    const toggle = (arg1 = null, arg2 = null, arg3 = null) => menu.isOpen() ? (close(), null) : open(arg1, arg2, arg3);
    const update = (nextProps = {}) => {
      mergeProps(stripContextKeys(nextProps));
      menu.update(buildMenuProps());
      return api;
    };
    const bind = (el, bindProps = null) => {
      if (!el) return () => { };
      const scopedProps = isPlainObject(bindProps) ? stripContextKeys(bindProps) : null;
      const onContextMenu = (e) => {
        lastTriggerEl = el;
        e.preventDefault();
        const result = getOptions().onTrigger?.(e, { element: el, open, close, update });
        if (result === false || uiUnwrap(getOptions().disabled)) return;
        open({ event: e, anchorEl: el }, scopedProps);
      };
      const onKeyboardOpen = (e) => {
        if (e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
        lastTriggerEl = el;
        e.preventDefault();
        const result = getOptions().onTrigger?.(e, { element: el, open, close, update });
        if (result === false || uiUnwrap(getOptions().disabled)) return;
        open({ event: e, anchorEl: el }, scopedProps);
      };
      el.addEventListener("contextmenu", onContextMenu);
      el.addEventListener("keydown", onKeyboardOpen);
      return () => {
        el.removeEventListener("contextmenu", onContextMenu);
        el.removeEventListener("keydown", onKeyboardOpen);
      };
    };
    const api = {
      open,
      openAt,
      openFromEvent,
      show,
      hide,
      close,
      toggle,
      update,
      bind,
      isOpen: menu.isOpen,
      entry: menu.entry,
      props: () => ({ ...currentProps })
    };

    return api;
  };
  if (CMSwift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.ContextMenu = {
      signature: "UI.ContextMenu(props) | UI.ContextMenu(props, ...children) -> { open, openAt, openFromEvent, show, hide, close, toggle, update, bind, isOpen }",
      props: {
        title: "String|Node|Function|Array|({ close })=>Node",
        subtitle: "String|Node|Function|Array|({ close })=>Node",
        eyebrow: "String|Node|Function|Array|({ close })=>Node",
        icon: "String|Node|Function|Array",
        content: "Node|Function|Array|({ close })=>Node",
        body: "Alias of content",
        items: "Array<string|object>|Function|Array",
        before: "Node|Function|Array",
        after: "Node|Function|Array",
        footer: "Node|Function|Array",
        status: "Node|Function|Array",
        empty: "Node|Function|Array",
        size: "xs|sm|md|lg|xl",
        state: "primary|secondary|warning|danger|success|info|light|dark",
        color: "Alias of state",
        placement: "string",
        offsetX: "number",
        offsetY: "number",
        offset: "Alias of offsetY",
        width: "string|number",
        minWidth: "string|number",
        maxWidth: "string|number",
        maxHeight: "string|number",
        bodyMaxHeight: "string|number",
        contentMaxHeight: "Alias of bodyMaxHeight",
        closeOnSelect: "boolean",
        closeOnOutside: "boolean",
        closeOnEsc: "boolean",
        anchorEl: "HTMLElement|VirtualAnchor",
        triggerEl: "Alias of anchorEl",
        target: "Alias of anchorEl",
        slots: "{ before?, icon?, eyebrow?, title?, subtitle?, header?, content?, body?, item?, itemTitle?, itemSubtitle?, itemBadge?, itemShortcut?, groupLabel?, empty?, status?, footer?, after?, default? }",
        class: "string",
        panelClass: "string",
        overlayClass: "string",
        style: "object",
        panelStyle: "object",
        onOpen: "function",
        onClose: "function",
        onItemClick: "(item, ctx, event) => void",
        onTrigger: "(event, ctx) => boolean|void"
      },
      slots: {
        before: "Region above header/body ({ close })",
        icon: "Context icon",
        eyebrow: "Context eyebrow ({ close })",
        title: "Context title ({ close })",
        subtitle: "Context subtitle ({ close })",
        header: "Header custom ({ close })",
        content: "Context menu content ({ close })",
        body: "Alias of content ({ close })",
        item: "Custom item body ({ item, close })",
        itemTitle: "Item title ({ item, close })",
        itemSubtitle: "Item subtitle ({ item, close })",
        itemBadge: "Item badge ({ item, close })",
        itemShortcut: "Item shortcut ({ item, close })",
        groupLabel: "Group label ({ item, close })",
        empty: "Empty state ({ close })",
        status: "Status row ({ close })",
        footer: "Footer actions ({ close })",
        after: "Region below body/footer ({ close })",
        default: "Fallback content ({ close })"
      },
      events: {
        onOpen: "void",
        onClose: "void",
        onItemClick: "item click",
        onTrigger: "contextmenu / keyboard trigger"
      },
      returns: "Object { open(), openAt(), openFromEvent(), show(), hide(), close(), toggle(), update(), bind(), isOpen() }",
      description: "Menu specialization for right-click and context-menu key interactions, with items, rich slots, runtime overrides, and coordinate-based positioning."
    };
  }
})(CMSwift);
