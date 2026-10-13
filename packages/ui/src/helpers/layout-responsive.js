  const uiResponsiveToken = (className, tokenSet = JSswift.uiSizes) => (value) => {
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
    return JSswift.uiResponsiveDevices.some((device) => {
      const deviceProps = JSswift.uiResponsivePropsFor(props, device);
      return !!deviceProps && list.some((name) => Object.prototype.hasOwnProperty.call(deviceProps, name));
    });
  };
  const uiResponsiveDevice = (key) => JSswift.uiResponsiveDevices.find((device) => device.key === key);
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
  const uiResponsiveGridColStyleRules = (JSswift.uiResponsiveStyleRules || []).filter((rule) => {
    const props = Array.isArray(rule.prop) ? rule.prop : [rule.prop];
    return !props.includes("span") && !props.includes("gridColumn");
  });
