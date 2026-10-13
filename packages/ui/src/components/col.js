  UI.Col = (...args) => {
    const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(rawProps, key);
    const renderArea = (names, fallback, ctx = {}) => {
      const list = Array.isArray(names) ? names : [names];
      for (const name of list) {
        if (JSswift.ui.getSlot(slots, name) != null) {
          return renderSlotToArray(slots, name, ctx, fallback);
        }
      }
      return fallback == null ? [] : renderSlotToArray(null, "default", ctx, fallback);
    };
    const resolveSpaceValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number") return `${value}px`;
      if (typeof value === "string" && JSswift.uiSizes?.includes(value)) return `var(--jss-s-${value})`;
      return String(value);
    };
    const resolveSizeValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "string" && JSswift.uiSizes?.includes(value)) return unitCover(value, "size");
      return toCssSize(value);
    };
    const resolveSpanClass = (value, prefix) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return "";
      if (raw === "auto") return prefix === "jss-col-" ? "jss-col-auto" : "";
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
      if (uiUnwrap(rawProps.auto)) return "jss-col-auto";
      const spanSource = hasOwn("span") ? rawProps.span : rawProps.col;
      return resolveSpanClass(spanSource, "jss-col-") || "jss-col";
    });

    const p = JSswift.omit(rawProps, [
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
      ...JSswift.uiResponsiveOmitProps
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
      || JSswift.ui.getSlot(slots, "start") != null
      || JSswift.ui.getSlot(slots, "top") != null
      || JSswift.ui.getSlot(slots, "header") != null
      || JSswift.ui.getSlot(slots, "before") != null
      || JSswift.ui.getSlot(slots, "body") != null
      || JSswift.ui.getSlot(slots, "content") != null
      || JSswift.ui.getSlot(slots, "end") != null
      || JSswift.ui.getSlot(slots, "bottom") != null
      || JSswift.ui.getSlot(slots, "footer") != null
      || JSswift.ui.getSlot(slots, "after") != null;

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
      "jss-col",
      baseColClass,
      uiComputed(rawProps.sm, () => resolveSpanClass(rawProps.sm, "jss-sm-col-")),
      uiComputed(rawProps.md, () => resolveSpanClass(rawProps.md, "jss-md-col-")),
      uiComputed(rawProps.lg, () => resolveSpanClass(rawProps.lg, "jss-lg-col-")),
      JSswift.uiResponsiveClasses({ mobile: rawProps }, uiResponsiveColRules),
      JSswift.uiResponsiveClasses(rawProps, uiResponsiveColRules),
      uiWhen(useFlexLayout, "jss-col-flex"),
      uiWhen(rawProps.inline, "jss-col-inline"),
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
    JSswift.uiApplyResponsiveProps(p, rawProps, JSswift.uiResponsiveStyleRules);

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
          class: uiClass(["jss-col-start", rawProps.startClass, rawProps.topClass, rawProps.headerClass]),
          style: { ...sectionStyle }
        }, ...startNodes)
        : null,
      bodyNodes.length
        ? _.div({
          class: uiClass(["jss-col-body", rawProps.bodyClass, rawProps.contentClass]),
          style: { ...sectionStyle, flex: "1 1 auto" }
        }, ...bodyNodes)
        : null,
      endNodes.length
        ? _.div({
          class: uiClass(["jss-col-end", rawProps.endClass, rawProps.bottomClass, rawProps.footerClass]),
          style: { ...sectionStyle }
        }, ...endNodes)
        : null
    ].filter(Boolean);

    const el = _.div(p, ...parts);
    setPropertyProps(el, rawProps);
    return el;
  };
