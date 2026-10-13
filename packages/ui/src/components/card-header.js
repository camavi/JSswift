
  UI.cardHeader = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const cls = uiClass(["jss-card-header", "jss-card-section", uiWhen(props.divider, "divider"), props.class]);
    const p = JSswift.omit(props, ["divider", "align", "justify", "gap", "wrap", "direction", "slots"]);
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
    JSswift.uiApplyResponsiveProps(p, props, JSswift.uiResponsiveStyleRules);

    const el = _.div(p, ...renderSlotToArray(slots, "default", {}, children));
    setPropertyProps(el, props);
    return el;
  };
