
  UI.Item = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    if (props.state != null && props.color == null) props.color = props.state;
    applyCommonProps(props);
    const slots = props.slots || {};
    const interactive = uiComputed([props.clickable, props.to], () => !!(uiUnwrap(props.clickable) || uiUnwrap(props.to)));
    const active = uiComputed([props.active, props.selected], () => !!(uiUnwrap(props.active) || uiUnwrap(props.selected)));
    const hasSurface = !!(
      props.color != null || props.outline || props.border || props.glossy || props.glow || props.glass ||
      props.shadow || props.gradient || props.textGradient || props.lightShadow || props.radius ||
      props.rounded || props.flat
    );

    const resolveIcon = (value, size, as) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return null;
      if (typeof raw === "string") return UI.Icon({ name: raw, size: size || "sm" });
      return JSswift.ui.slot(raw, { as });
    };

    const iconNodes = renderSlotToArray(slots, "icon", {}, resolveIcon(props.icon, props.iconSize || props.size, "icon"));
    const titleNodes = renderSlotToArray(slots, "title", {}, props.title ?? props.label);
    const subtitleNodes = renderSlotToArray(slots, "subtitle", {}, props.subtitle ?? props.caption ?? props.description);
    const metaNodes = renderSlotToArray(slots, "meta", {}, props.meta ?? props.eyebrow);
    const bodyNodes = renderSlotToArray(slots, "body", {}, props.body ?? props.content);
    const defaultNodes = renderSlotToArray(slots, "default", {}, children);
    const actionsNodes = renderSlotToArray(slots, "actions", {}, props.actions ?? props.footer);
    const asideFallback = props.aside ?? props.trailing ?? resolveIcon(props.iconRight, props.iconSize || props.size, "iconRight");
    const asideNodes = renderSlotToArray(slots, "aside", {}, asideFallback);

    const mergedBodyNodes = [...bodyNodes, ...defaultNodes];
    const isInline = !(
      hasSurface || props.clickable || props.to || iconNodes.length || titleNodes.length ||
      subtitleNodes.length || metaNodes.length || actionsNodes.length || asideNodes.length ||
      bodyNodes.length
    );

    const cls = uiClass([
      "jss-item",
      uiWhen(props.divider, "divider"),
      uiWhen(hasSurface, "jss-clear-set"),
      uiWhen(hasSurface, "jss-singularity"),
      uiWhen(hasSurface, "jss-item-surface"),
      uiWhen(isInline, "jss-item-inline"),
      uiWhen(interactive, "jss-item-clickable"),
      uiWhen(active, "is-active"),
      uiWhen(props.disabled, "is-disabled"),
      props.class
    ]);
    const p = JSswift.omit(props, [
      "divider", "slots", "label", "title", "subtitle", "caption", "description", "meta", "eyebrow",
      "body", "content", "children", "node", "icon", "iconRight", "iconSize", "aside", "trailing",
      "actions", "footer", "clickable", "to", "active", "selected", "disabled", "state",
      "color", "size", "outline", "flat", "border", "glossy", "glow", "glass", "gradient",
      "textGradient", "lightShadow", "shadow", "rounded", "radius", "textColor", "dense"
    ]);
    p.class = cls;
    p.style = {
      ...(props.style || {})
    };

    const userOnClick = props.onClick;
    const userOnKeydown = props.onKeydown;
    const onClick = (e) => {
      userOnClick?.(e);
      if (e.defaultPrevented || uiUnwrap(props.disabled)) return;
      const to = uiUnwrap(props.to);
      if (to && JSswift.router?.navigate) {
        e.preventDefault();
        JSswift.router.navigate(to);
      }
    };
    const onKeydown = (e) => {
      userOnKeydown?.(e);
      if (e.defaultPrevented || uiUnwrap(props.disabled)) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    };
    if (uiUnwrap(props.disabled)) {
      p["aria-disabled"] = "true";
    }
    if (uiUnwrap(props.clickable) || uiUnwrap(props.to)) {
      p.onClick = onClick;
      p.onKeydown = onKeydown;
      if (p.tabIndex == null) p.tabIndex = uiUnwrap(props.disabled) ? -1 : 0;
      if (p.role == null) p.role = "button";
    }

    const titleSection = titleNodes.length ? _.div({ class: "jss-item-title" }, ...titleNodes) : null;
    const subtitleSection = subtitleNodes.length ? _.div({ class: "jss-item-subtitle" }, ...subtitleNodes) : null;
    const metaSection = metaNodes.length ? _.div({ class: "jss-item-meta" }, ...metaNodes) : null;
    const bodySection = mergedBodyNodes.length
      ? _.div({ class: uiClass(["jss-item-body", uiWhen(!(titleNodes.length || subtitleNodes.length || metaNodes.length), "is-standalone")]) }, ...mergedBodyNodes)
      : null;
    const actionsSection = actionsNodes.length ? _.div({ class: "jss-item-actions" }, ...actionsNodes) : null;

    const item = _.li(
      p,
      _.div(
        { class: "jss-item-row" },
        iconNodes.length ? _.div({ class: "jss-item-icon" }, ...iconNodes) : null,
        _.div(
          { class: "jss-item-main" },
          metaSection,
          titleSection,
          subtitleSection,
          bodySection,
          actionsSection
        ),
        asideNodes.length ? _.div({ class: "jss-item-aside" }, ...asideNodes) : null
      )
    );
    setPropertyProps(item, props);
    return item;
  };

  // Esempio: JSswift.ui.Item({}, "Elemento")
