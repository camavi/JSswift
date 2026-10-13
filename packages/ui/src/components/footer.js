
  UI.Footer = (...args) => {
    const { props: originalProps, children } = JSswift.uiNormalizeArgs(args);
    const rawProps = { ...originalProps };
    applyCommonProps(rawProps);
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
      const slot = JSswift.ui.getSlot(slots, name);
      if (slot !== null && slot !== undefined) {
        return renderSlotToArray(slots, name, ctx, null);
      }
      if (typeof fallback === "function") {
        const inlineNames = new Set(["eyebrow", "title", "subtitle"]);
        const host = _[inlineNames.has(name) ? "span" : "div"]({ class: `jss-footer-slot-${name}` });
        JSswift.reactive.effect(() => {
          const nextValue = map(fallback(ctx));
          const normalized = flattenSlotValue(JSswift.ui.slot(nextValue));
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
      return JSswift.ui.slot(value, { as });
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
      { class: uiClass(["jss-footer-body", rawProps.bodyClass, rawProps.centerClass]) },
      _.div(
        { class: "jss-footer-heading" },
        iconNodes.length ? _.div({ class: "jss-footer-icon" }, ...iconNodes) : null,
        _.div(
          { class: "jss-footer-copy" },
          eyebrowNodes.length ? _.div({ class: uiClass(["jss-footer-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
          titleNodes.length ? _.div({ class: uiClass(["jss-footer-title", rawProps.titleClass]) }, ...titleNodes) : null,
          subtitleNodes.length ? _.div({ class: uiClass(["jss-footer-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
          contentNodes.length ? _.div({ class: uiClass(["jss-footer-content", rawProps.contentClass]) }, ...contentNodes) : null
        ),
        metaNodes.length ? _.div({ class: uiClass(["jss-footer-meta", rawProps.metaClass]) }, ...metaNodes) : null
      )
    );

    const mainChildren = [];
    if (customBodyNodes.length) {
      mainChildren.push(_.div({ class: uiClass(["jss-footer-body", rawProps.bodyClass, rawProps.centerClass]) }, ...customBodyNodes));
    } else if (iconNodes.length || eyebrowNodes.length || titleNodes.length || subtitleNodes.length || contentNodes.length || metaNodes.length) {
      mainChildren.push(structuredBody);
    }
    if (endNodes.length || actionNodes.length) {
      mainChildren.push(
        _.div(
          { class: uiClass(["jss-footer-end", rawProps.endClass]) },
          ...endNodes,
          ...(actionNodes.length ? [_.div({ class: uiClass(["jss-footer-actions", rawProps.actionsClass]) }, ...actionNodes)] : [])
        )
      );
    }

    const p = JSswift.omit(rawProps, [
      "actions", "actionsClass", "align", "body", "bodyClass", "center", "centerClass", "content",
      "contentClass", "dense", "description", "divider", "elevated", "end", "endClass", "eyebrow",
      "eyebrowClass", "gap", "icon", "iconSize", "kicker", "label", "left", "meta", "metaClass",
      "minHeight", "note", "right", "slots", "stack", "start", "startClass", "sticky", "subtitle",
      "subtitleClass", "title", "titleClass", "wrap", "justify"
    ]);
    p.class = uiClass([
      "jss-panel",
      "jss-footer",
      "jss-singularity",
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
    if (rawProps.gap != null) p.style["--jss-footer-gap"] = toCssSize(uiUnwrap(rawProps.gap));
    if (rawProps.minHeight != null) p.style.minHeight = toCssSize(uiUnwrap(rawProps.minHeight));
    JSswift.uiApplyResponsiveProps(p, rawProps, JSswift.uiResponsiveStyleRules);

    const el = _.footer(
      p,
      ...(startNodes.length ? [_.div({ class: uiClass(["jss-footer-start", rawProps.startClass]) }, ...startNodes)] : []),
      ...(mainChildren.length ? [_.div({ class: "jss-footer-main" }, ...mainChildren)] : [])
    );

    setPropertyProps(el, rawProps);
    return el;
  };

  // Esempio: JSswift.ui.Footer({}, "Footer")
