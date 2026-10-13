
  UI.Kpi = (...args) => {
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
      "media",
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
      "jss-kpi",
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
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || "lg" })
        : JSswift.ui.slot(rawProps.icon, { as: "icon" }));

    const eyebrowNodes = renderNamed("eyebrow", rawProps.eyebrow);
    const titleNodes = renderNamed("title", rawProps.title ?? rawProps.label);
    const valueNodes = renderNamed("value", rawProps.value);
    const deltaNodes = renderNamed("delta", rawProps.delta, { trend: rawProps.trend });
    const noteNodes = renderNamed("note", rawProps.note ?? rawProps.subtitle);
    const metaNodes = renderNamed("meta", rawProps.meta);
    const iconNodes = renderNamed("icon", iconFallback);
    const asideNodes = renderNamed("aside", rawProps.aside);
    const mediaNodes = renderNamed("media", rawProps.media);
    const footerNodes = renderNamed("footer", rawProps.footer);
    const actionsNodes = renderNamed("actions", rawProps.actions);
    const bodyNodes = renderNamed("default", children);

    const kpi = _.section(
      p,
      _.div(
        { class: "jss-kpi-head" },
        _.div(
          { class: "jss-kpi-title-wrap" },
          iconNodes.length ? _.div({ class: "jss-kpi-icon" }, ...iconNodes) : null,
          _.div(
            { class: "jss-kpi-copy" },
            eyebrowNodes.length ? _.div({ class: "jss-kpi-eyebrow" }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: "jss-kpi-title" }, ...titleNodes) : null
          )
        ),
        asideNodes.length ? _.div({ class: "jss-kpi-aside" }, ...asideNodes) : null
      ),
      _.div(
        { class: "jss-kpi-core" },
        _.div(
          { class: "jss-kpi-value-wrap" },
          valueNodes.length ? _.div({ class: "jss-kpi-value" }, ...valueNodes) : null,
          deltaNodes.length ? _.div({ class: "jss-kpi-delta" }, ...deltaNodes) : null
        ),
        noteNodes.length ? _.div({ class: "jss-kpi-note" }, ...noteNodes) : null,
        metaNodes.length ? _.div({ class: "jss-kpi-meta" }, ...metaNodes) : null,
        mediaNodes.length ? _.div({ class: "jss-kpi-media" }, ...mediaNodes) : null,
        bodyNodes.length ? _.div({ class: "jss-kpi-extra" }, ...bodyNodes) : null
      ),
      (footerNodes.length || actionsNodes.length)
        ? _.div(
          { class: "jss-kpi-footer" },
          footerNodes.length ? _.div({ class: "jss-kpi-footer-copy" }, ...footerNodes) : null,
          actionsNodes.length ? _.div({ class: "jss-kpi-actions" }, ...actionsNodes) : null
        )
        : null
    );

    setPropertyProps(kpi, rawProps);
    return kpi;
  };

  // Esempio: JSswift.ui.Kpi({ title: "Orders", value: "342", delta: "+12%" })
