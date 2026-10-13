
  UI.Row = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const renderArea = (names, fallback, ctx = {}) => {
      const list = Array.isArray(names) ? names : [names];
      for (const name of list) {
        if (JSswift.ui.getSlot(slots, name) != null) {
          return renderSlotToArray(slots, name, ctx, fallback);
        }
      }
      return fallback == null ? [] : renderSlotToArray(null, "default", ctx, fallback);
    };

    const rowSpaceValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number") return `${value}px`;
      if (typeof value === "string" && JSswift.uiSizes?.includes(value)) return `var(--jss-s-${value})`;
      return String(value);
    };
    const rowWidthValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number") return `${value}px`;
      if (typeof value === "string" && JSswift.uiSizes?.includes(value)) return `var(--jss-w-${value})`;
      return String(value);
    };

    const p = JSswift.omit(props, [
      "slots",
      "start", "left", "startClass",
      "body", "center", "bodyClass", "centerClass",
      "end", "right", "endClass",
      "align", "justify", "wrap", "gap", "rowGap", "columnGap",
      "direction", "reverse", "inline", "full", "width", "minWidth", "maxWidth",
      ...JSswift.uiResponsiveOmitProps
    ]);
    p.class = uiClass([
      "jss-row",
      JSswift.uiResponsiveClasses({ mobile: props }, uiResponsiveLayoutRules),
      JSswift.uiResponsiveClasses(props, uiResponsiveLayoutRules),
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
    style["--jss-row-base-gap"] = uiStyleValue(props.columnGap ?? props.gap, rowSpaceValue, "0px");
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
    JSswift.uiApplyResponsiveProps(p, props, JSswift.uiResponsiveStyleRules);

    const ctx = { props };
    const startNodes = renderArea(["start", "left"], props.start ?? props.left, ctx);
    const bodyNodes = renderArea(["body", "center", "default"], props.body ?? props.center ?? children, ctx);
    const endNodes = renderArea(["end", "right"], props.end ?? props.right, ctx);
    const hasStructuredContent = startNodes.length || endNodes.length || props.body != null || props.center != null || props.startClass || props.bodyClass || props.centerClass || props.endClass
      || JSswift.ui.getSlot(slots, "start") != null
      || JSswift.ui.getSlot(slots, "left") != null
      || JSswift.ui.getSlot(slots, "body") != null
      || JSswift.ui.getSlot(slots, "center") != null
      || JSswift.ui.getSlot(slots, "end") != null
      || JSswift.ui.getSlot(slots, "right") != null;

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
        ? _.div({ class: uiClass(["jss-row-start", props.startClass]), style: { ...regionStyle } }, ...startNodes)
        : null,
      bodyNodes.length
        ? _.div({ class: uiClass(["jss-row-body", bodyClass]), style: { ...regionStyle, flex: "1 1 auto" } }, ...bodyNodes)
        : null,
      endNodes.length
        ? _.div({
          class: uiClass(["jss-row-end", props.endClass]),
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
