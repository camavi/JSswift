
  UI.Toolbar = (...args) => {
    const { props: originalProps, children } = JSswift.uiNormalizeArgs(args);
    const props = { ...originalProps };
    applyCommonProps(props);
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
    const hasArea = (names) => {
      const list = Array.isArray(names) ? names : [names];
      return list.some((name) => JSswift.ui.getSlot(slots, name) != null);
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
      "jss-toolbar",
      "jss-panel",
      "jss-singularity",
      uiWhen(hasStructuredContent, "structured"),
      uiWhen(props.dense, "dense"),
      uiWhen(props.divider, "divider"),
      uiWhen(props.elevated, "elevated"),
      uiWhen(props.sticky, "sticky"),
      props.class
    ]);

    const p = JSswift.omit(props, [
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
    const gap = uiStyleValue(props.gap, toCssSize, uiComputed(props.dense, () => uiUnwrap(props.dense) ? "8px" : "var(--jss-s-md)"));
    const hasResponsiveGap = uiHasResponsiveOverride(props, "gap");
    style["--jss-toolbar-gap"] = gap != null ? gap : "var(--jss-s-md)";
    if (!hasResponsiveGap) style.gap = style.gap || "var(--jss-toolbar-gap)";
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
    JSswift.uiApplyResponsiveProps(p, props, JSswift.uiResponsiveStyleRules);

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
      gap: "var(--jss-toolbar-gap)",
      flexWrap: "inherit",
      minWidth: 0
    };
    const mainStyle = {};
    if (align != null) mainStyle.alignItems = align;
    if (justify != null) mainStyle.justifyContent = justify;
    if (wrap != null) mainStyle.flexWrap = wrap;

    const copyNode = (metaNodes.length || titleNodes.length || subtitleNodes.length)
      ? _.div(
        { class: uiClass(["jss-toolbar-copy", props.copyClass]) },
        metaNodes.length ? _.div({ class: uiClass(["jss-toolbar-meta", props.metaClass]) }, ...metaNodes) : null,
        titleNodes.length ? _.div({ class: uiClass(["jss-toolbar-title", props.titleClass]) }, ...titleNodes) : null,
        subtitleNodes.length ? _.div({ class: uiClass(["jss-toolbar-subtitle", props.subtitleClass]) }, ...subtitleNodes) : null
      )
      : null;

    const hasMainContent = !!(startNodes.length || copyNode || centerNodes.length || endNodes.length);
    const parts = [
      beforeNodes.length
        ? _.div({ class: uiClass(["jss-toolbar-before", props.beforeClass]), style: { ...regionStyle } }, ...beforeNodes)
        : null,
      hasMainContent
        ? _.div(
          { class: "jss-toolbar-main", style: mainStyle },
          startNodes.length
            ? _.div({ class: uiClass(["jss-toolbar-start", props.startClass]), style: { ...regionStyle } }, ...startNodes)
            : null,
          (copyNode || centerNodes.length)
            ? _.div({ class: uiClass(["jss-toolbar-center", bodyClass]), style: { ...regionStyle, flex: "1 1 240px" } }, copyNode, ...centerNodes)
            : null,
          endNodes.length
            ? _.div({
              class: uiClass(["jss-toolbar-end", props.endClass]),
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
        ? _.div({ class: uiClass(["jss-toolbar-after", props.afterClass]), style: { ...regionStyle } }, ...afterNodes)
        : null
    ].filter(Boolean);

    const el = _.div(p, ...parts);
    setPropertyProps(el, props);
    return el;
  };

  // Esempio: JSswift.ui.Toolbar({}, JSswift.ui.Btn({}, "Azione"))
