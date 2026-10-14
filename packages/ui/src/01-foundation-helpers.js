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

JSswift.isUIPlainObject = isUIPlainObject;
JSswift.isListItemNode = isListItemNode;
JSswift.asNodeArray = asNodeArray;

const UI_RESPONSIVE_DEVICES = [
  { key: "mobile", aliases: ["mobile", "mobil"], prefix: "jss-" },
  { key: "tablet", aliases: ["tablet"], prefix: "jss-tablet-" },
  { key: "pc", aliases: ["pc", "desktop"], prefix: "jss-pc-" }
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
        tokens.push(String(suffix).startsWith("jss-") ? suffix : `${device.prefix}${suffix}`);
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
  if (rule.token && typeof value === "string" && JSswift.uiSizes?.includes(value)) {
    return `var(--jss-${rule.token}-${value})`;
  }
  return String(value);
};
const uiResponsiveSetStyle = (style, name, value) => {
  if (!style || value == null || value === "") return;
  if (typeof style.setProperty === "function") style.setProperty(name, value);
  else style[name] = value;
};
const uiResponsiveVarClass = (deviceKey, varName) => {
  return deviceKey === "mobile" ? `jss-rsp-${varName}` : `jss-rsp-${deviceKey}-${varName}`;
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
  if (!target || !props) return target;
  const configurations = [];
  for (const device of UI_RESPONSIVE_DEVICES) {
    const deviceProps = uiResponsivePropsFor(props, device);
    if (deviceProps) configurations.push([device.key, deviceProps]);
  }
  if (!configurations.length) return target;
  const style = target.style || {};
  let hasResponsiveVars = false;

  for (const rule of rules) {
    const propNames = Array.isArray(rule.prop) ? rule.prop : [rule.prop];
    const setVar = (deviceKey, sourceProps) => {
      const rawValue = uiResponsiveFirstValue(sourceProps, propNames);
      const value = uiResponsiveDefaultValue(rawValue, rule);
      if (!value) return;
      const varName = rule.var || rule.css;
      const prefix = deviceKey === "mobile" ? "--jss-rsp-" : `--jss-rsp-${deviceKey}-`;
      uiResponsiveSetStyle(style, `${prefix}${varName}`, value);
      uiResponsiveAddClass(target, uiResponsiveVarClass(deviceKey, varName));
      hasResponsiveVars = true;
    };

    setVar("mobile", props);
    for (const [deviceKey, deviceProps] of configurations) setVar(deviceKey, deviceProps);
  }

  if (hasResponsiveVars) {
    if (!target.nodeType) target.style = style;
    uiResponsiveAddClass(target, "jss-rsp");
  }
  return target;
};

JSswift.uiResponsiveDevices = UI_RESPONSIVE_DEVICES;
JSswift.uiResponsiveOmitProps = UI_RESPONSIVE_PROP_KEYS;
JSswift.uiResponsivePropsFor = uiResponsivePropsFor;
JSswift.uiResponsiveHasConfig = uiResponsiveHasConfig;
JSswift.uiResponsiveHasProp = uiResponsiveHasProp;
JSswift.uiResponsiveClasses = uiResponsiveClassList;
JSswift.uiApplyResponsiveProps = uiApplyResponsiveProps;

const uiOmitBase = JSswift.omit;
JSswift.omit = (obj, keys = []) => {
  const allKeys = Array.isArray(keys)
    ? keys.concat(UI_RESPONSIVE_PROP_KEYS)
    : UI_RESPONSIVE_PROP_KEYS;
  return uiOmitBase(obj, allKeys);
};

const applyCommonProps = (props = {}) => {
  const classTokens = [];
  const style = {};

  classTokens.push(
    uiWhen(props.clickable, "jss-clickable"),
    uiWhen(props.dense, "jss-dense"),
    uiWhen(props.flat, "jss-flat"),
    uiWhen(props.border, "jss-border"),
    uiWhen(props.glossy, "jss-glossy"),
    uiWhen(props.glow, "jss-glow"),
    uiWhen(props.glass, "jss-glass"),
    uiComputed(props.shadow, () => { const value = uiUnwrap(props.shadow); return value && value !== "none" ? "jss-shadow" : ""; }),
    uiWhen(props.outline, "jss-outline"),
    uiWhen(props.rounded, "jss-rounded"),
    uiWhen(props.gradient, "jss-gradient"),
    uiWhen(props.textGradient, "jss-text-gradient"),
    uiWhen(props.lightShadow, "jss-light-shadow")
  );

  if (uiIsReactive(props.color)) {
    classTokens.push(() => {
      const v = uiUnwrap(props.color);
      const state = normalizeState(v);
      return state ? `jss-state-${state}` : "";
    });
    style.backgroundColor = () => {
      const v = uiUnwrap(props.color);
      const state = normalizeState(v);
      if (state) return "";
      if (v && isTokenCSS(String(v))) return `var(--jss-${v})`;
      return v || "";
    };
  } else {
    const state = normalizeState(props.color);
    if (state) {
      classTokens.push(`jss-state-${state}`);
    } else if (props.color && isTokenCSS(props.color)) {
      style.backgroundColor = `var(--jss-${props.color})`;
    } else if (props.color) {
      style.backgroundColor = props.color;
    }
  }

  // facciamo text color per i token
  if (uiIsReactive(props.textColor)) {
    style.color = () => {
      const v = uiUnwrap(props.textColor);
      if (v && isTokenCSS(String(v))) return `var(--jss-${v})`;
      return v || "";
    };
  } else if (props.textColor && isTokenCSS(props.textColor)) {
    style.color = `var(--jss-${props.textColor})`;
  } else if (props.textColor) {
    style.color = props.textColor;
  }

  if (uiIsReactive(props.size)) {
    classTokens.push(() => {
      const v = uiUnwrap(props.size);
      if (typeof v === "string" && JSswift.uiSizes?.includes(v)) return `jss-size-${v}`;
      return "";
    });
  } else {
    const size = props.size;
    if (typeof size === "string" && JSswift.uiSizes?.includes(size)) {
      classTokens.push(`jss-size-${size}`);
    }
  }

  if (uiIsReactive(props.shadow)) {
    classTokens.push(() => {
      const v = uiUnwrap(props.shadow);
      const shadow = normalizeShadow(v);
      return shadow ? `jss-shadow-${shadow}` : "";
    });
    style.boxShadow = () => {
      const v = uiUnwrap(props.shadow);
      const shadow = normalizeShadow(v);
      if (shadow || v == null || v === false) return "";
      return typeof v === "string" ? v : "";
    };
  } else {
    const shadow = normalizeShadow(props.shadow);
    if (shadow) classTokens.push(`jss-shadow-${shadow}`);
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

const normalizeArgsBase = JSswift.uiNormalizeArgs;
JSswift.uiNormalizeArgs = function (args) {
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
JSswift.uiResponsiveStyleRules = UI_RESPONSIVE_STYLE_RULES;
JSswift.uiResponsiveCommonStyleRules = UI_RESPONSIVE_COMMON_STYLE_RULES;
const camelToCssProperty = (name) => name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const applyStyleProp = (obj, value, name, tokenName) => {
  if (value == null || value === false || value === "") return;
  obj.style.setProperty(camelToCssProperty(name), unitCover(value, tokenName));
};
function setPropertyProps(obj, props) {
  if (props.size) {
    if (typeof props.size === "number") {
      obj.style.setProperty("--jss-font-size", `${props.size}px`);
    } else if (JSswift.uiSizes.includes(props.size)) {
      obj.style.setProperty("--jss-font-size", `var(--jss-font-size-${props.size})`);
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
    } else if (JSswift.uiSizes.includes(props.radius)) {
      obj.style.setProperty("--set-border-radius", `var(--jss-r-${props.radius})`);
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

JSswift.ui.getSlot = (slots, name) => {
  if (!slots) return null;
  return Object.prototype.hasOwnProperty.call(slots, name) ? slots[name] : null;
};

JSswift.ui.renderSlot = (slots, name, ctx, fallback) => {
  const slot = JSswift.ui.getSlot(slots, name);
  const hasSlot = slot !== null && slot !== undefined;
  const raw = hasSlot ? (typeof slot === "function" ? slot(ctx || {}) : slot) : fallback;
  if (raw == null) return null;
  return flattenSlotValue(JSswift.ui.slot(raw));
};

const renderSlotToArray = (slots, name, ctx, fallback) => {
  const v = JSswift.ui.renderSlot(slots, name, ctx, fallback);
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
  node.className = options.className || "jss-shortcode";
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

  JSswift._registerCleanup(anchor, dispose);
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
  if (JSswift.uiSizes.includes(v)) return `var(--jss-${name}-${v})`;
  if (typeof v === "string") return v;
  return v;
};

