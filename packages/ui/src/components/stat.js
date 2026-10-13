
  UI.Stat = (...args) => {
    const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.state) || uiUnwrap(rawProps.color) || "");
    const stateClass = uiComputed([rawProps.state, rawProps.color], () => {
      const state = resolveStateValue();
      return state ? `jss-state-${state}` : "";
    });
    const trendClass = uiComputed(rawProps.trend, () => {
      const raw = String(uiUnwrap(rawProps.trend) || "").toLowerCase();
      if (["up", "positive", "success", "gain", "increase"].includes(raw)) return "is-positive";
      if (["down", "negative", "danger", "loss", "decrease"].includes(raw)) return "is-negative";
      if (["flat", "neutral", "steady", "stable"].includes(raw)) return "is-neutral";
      return "";
    });

    const props = { ...rawProps };
    const p = JSswift.omit(props, [
      "actions",
      "aside",
      "delta",
      "eyebrow",
      "footer",
      "icon",
      "iconSize",
      "label",
      "meta",
      "note",
      "slots",
      "state",
      "subtitle",
      "title",
      "trend",
      "value"
    ]);
    p.class = uiClass([
      "jss-clear-set",
      "jss-stat",
      "jss-singularity",
      stateClass,
      trendClass,
      props.class
    ]);
    p.style = { ...(props.style || {}) };

    const renderNamed = (slotName, fallback, ctx = {}) => renderSlotToArray(
      slots,
      slotName,
      ctx,
      fallback
    );

    const iconFallback = rawProps.icon == null
      ? null
      : (typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || "md" })
        : JSswift.ui.slot(rawProps.icon, { as: "icon" }));

    const eyebrowNodes = renderNamed("eyebrow", rawProps.eyebrow);
    const labelNodes = renderNamed("label", rawProps.label ?? rawProps.title);
    const valueNodes = renderNamed("value", rawProps.value);
    const noteNodes = renderNamed("note", rawProps.note ?? rawProps.subtitle);
    const metaNodes = renderNamed("meta", rawProps.meta);
    const deltaNodes = renderNamed("delta", rawProps.delta, { trend: rawProps.trend });
    const iconNodes = renderNamed("icon", iconFallback);
    const asideNodes = renderNamed("aside", rawProps.aside);
    const footerNodes = renderNamed("footer", rawProps.footer);
    const actionsNodes = renderNamed("actions", rawProps.actions);
    const bodyNodes = renderNamed("default", children);

    const stat = _.article(
      p,
      _.div(
        { class: "jss-stat-head" },
        _.div(
          { class: "jss-stat-lead" },
          iconNodes.length ? _.div({ class: "jss-stat-icon" }, ...iconNodes) : null,
          _.div(
            { class: "jss-stat-copy" },
            eyebrowNodes.length ? _.div({ class: "jss-stat-eyebrow" }, ...eyebrowNodes) : null,
            labelNodes.length ? _.div({ class: "jss-stat-label" }, ...labelNodes) : null
          )
        ),
        asideNodes.length ? _.div({ class: "jss-stat-aside" }, ...asideNodes) : null
      ),
      _.div(
        { class: "jss-stat-body" },
        valueNodes.length ? _.div({ class: "jss-stat-value" }, ...valueNodes) : null,
        deltaNodes.length
          ? _.div({ class: "jss-stat-delta" }, ...deltaNodes)
          : null,
        noteNodes.length ? _.div({ class: "jss-stat-note" }, ...noteNodes) : null,
        metaNodes.length ? _.div({ class: "jss-stat-meta" }, ...metaNodes) : null,
        bodyNodes.length ? _.div({ class: "jss-stat-extra" }, ...bodyNodes) : null
      ),
      (footerNodes.length || actionsNodes.length)
        ? _.div(
          { class: "jss-stat-footer" },
          footerNodes.length ? _.div({ class: "jss-stat-footer-copy" }, ...footerNodes) : null,
          actionsNodes.length ? _.div({ class: "jss-stat-actions" }, ...actionsNodes) : null
        )
        : null
    );

    setPropertyProps(stat, rawProps);
    return stat;
  };

  // Esempio: JSswift.ui.Stat({ label: "Revenue", value: "€ 128k", delta: "+18%" })
