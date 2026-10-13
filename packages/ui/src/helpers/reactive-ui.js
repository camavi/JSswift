
  function uiIsSignal(v) {
    return Array.isArray(v) && (v.length === 2 || (v.length === 3 && typeof v[2] === "function")) && typeof v[0] === "function" && typeof v[1] === "function";
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

  JSswift.uiIsReactive = uiIsReactive;
  JSswift.uiUnwrap = uiUnwrap;
  JSswift.uiClass = uiClass;
  JSswift.uiClassStatic = uiClassStatic;
  JSswift.uiWhen = uiWhen;
  JSswift.uiClassValue = uiClassValue;
  JSswift.uiComputed = uiComputed;
  JSswift.uiStyleValue = uiStyleValue;
