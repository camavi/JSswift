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
      if (isTokenCSS(str)) return `var(--jss-${str})`;
      return str;
    };

    const stateClass = uiComputed(props.state, () => {
      const state = normalizeState(uiUnwrap(props.state));
      return state ? `jss-state-${state}` : "";
    });

    const cls = uiClass([
      "jss-spinner",
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
      class: uiClass(["jss-spinner-indicator", props.indicatorClass]),
      style: {
        "--jss-spinner-size": makeCssVarValue(props.size, toCssSize, "var(--jss-spinner-default-size, 18px)"),
        "--jss-spinner-thickness": makeCssVarValue(props.thickness, toCssSize, "2px"),
        "--jss-spinner-speed": makeCssVarValue(props.speed, (v) => typeof v === "number" ? `${v}ms` : String(v), "900ms"),
        "--jss-spinner-color": makeCssVarValue(props.color, resolveSpinnerColor, "var(--set-hover, var(--jss-primary))"),
        "--jss-spinner-track": makeCssVarValue(props.trackColor, resolveSpinnerColor, "var(--jss-spinner-default-track, color-mix(in srgb, var(--jss-spinner-color) 18%, transparent))"),
        ...(props.indicatorStyle || {})
      },
      "aria-hidden": "true"
    });
    const indicatorNodes = renderSlotToArray(slots, "indicator", ctx, indicatorFallback);
    const content = [];

    if (indicatorNodes.length) content.push(...indicatorNodes);
    if (hasText) {
      content.push(_.div(
        { class: "jss-spinner-content" },
        labelNodes.length ? _.div({ class: "jss-spinner-label" }, ...labelNodes) : null,
        copyNodes.length ? _.div({ class: "jss-spinner-copy" }, ...copyNodes) : null,
        noteNodes.length ? _.div({ class: "jss-spinner-note" }, ...noteNodes) : null
      ));
    }

    const root = _.div(p, ...content);
    setPropertyProps(root, props);
    return root;
  };

  // Esempio: JSswift.ui.Spinner({ size: 24 })
