
  UI.GridCol = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(props, key);
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
      if (typeof value === "string" && JSswift.uiSizes?.includes(value)) return `var(--jss-s-${value})`;
      return toCssSize(value);
    };
    const resolveSizeValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "string" && JSswift.uiSizes?.includes(value)) return unitCover(value, "size");
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
    const tabletProps = JSswift.uiResponsivePropsFor(props, uiResponsiveDevice("tablet")) || {};
    const pcProps = JSswift.uiResponsivePropsFor(props, uiResponsiveDevice("pc")) || {};
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
      return active ? ["jss-clear-set", "jss-singularity", "jss-grid-col-surface"] : [];
    });
    const cls = uiClass([
      "jss-grid-col",
      surfaceClasses,
      JSswift.uiResponsiveClasses({ mobile: props }, uiResponsiveGridColRules),
      JSswift.uiResponsiveClasses(props, uiResponsiveGridColRules),
      uiWhen(props.panel, "jss-grid-col-panel"),
      uiWhen(props.auto, "is-auto"),
      uiWhen(useStackLayout, "jss-grid-col-stack"),
      uiWhen(props.inline, "jss-grid-col-inline"),
      uiWhen(centerContent, "jss-grid-col-center"),
      props.class
    ]);

    const p = JSswift.omit(props, [
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
      ...JSswift.uiResponsiveOmitProps
    ]);
    p.class = cls;

    if (style["--jss-grid-col-base"] == null) style["--jss-grid-col-base"] = "auto";
    if (style["--jss-grid-col-tablet"] == null) style["--jss-grid-col-tablet"] = "var(--jss-grid-col-base, auto)";
    if (style["--jss-grid-col-pc"] == null) style["--jss-grid-col-pc"] = "var(--jss-grid-col-tablet, var(--jss-grid-col-base, auto))";
    if (uiUnwrap(props.auto) === true) style["--jss-grid-col-base"] = "auto";
    else if (span != null) style["--jss-grid-col-base"] = span;
    if (sm != null) style["--jss-grid-col-sm"] = sm;
    if (md != null) style["--jss-grid-col-md"] = md;
    if (lg != null) style["--jss-grid-col-lg"] = lg;
    if (tabletSpan != null) style["--jss-grid-col-tablet"] = tabletSpan;
    if (pcSpan != null) style["--jss-grid-col-pc"] = pcSpan;
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
    JSswift.uiApplyResponsiveProps(p, props, uiResponsiveGridColStyleRules);

    const userOnClick = props.onClick;
    const userOnKeydown = props.onKeydown;
    const isInteractive = !!(uiUnwrap(props.clickable) || uiUnwrap(props.to));
    const onClick = (e) => {
      userOnClick?.(e);
      if (e.defaultPrevented) return;
      const to = uiUnwrap(props.to);
      if (to && JSswift.router?.navigate) {
        e.preventDefault();
        JSswift.router.navigate(to);
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
          class: uiClass(["jss-grid-col-start", props.startClass, props.topClass, props.headerClass]),
          style: { ...sectionStyle }
        }, ...startNodes)
        : null,
      bodyNodes.length
        ? _.div({
          class: uiClass(["jss-grid-col-body", props.bodyClass, props.contentClass]),
          style: { ...sectionStyle, flex: "1 1 auto" }
        }, ...bodyNodes)
        : null,
      endNodes.length
        ? _.div({
          class: uiClass(["jss-grid-col-end", props.endClass, props.bottomClass, props.footerClass]),
          style: { ...sectionStyle }
        }, ...endNodes)
        : null
    ].filter(Boolean);

    const el = _.div(p, ...parts);
    setPropertyProps(el, props);
    return el;
  };

  // Esempio: JSswift.ui.GridCol({ span: 6, sm: 12 }, "Colonna")
