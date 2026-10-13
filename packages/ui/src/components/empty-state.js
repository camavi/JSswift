
UI.EmptyState = (...args) => {
  const input = normalizeArgsBase(args);
  const tone = uiComputed([input.props.state, input.props.color], () =>
    uiUnwrap(input.props.state) || uiUnwrap(input.props.color) || "");
  const { props: rawProps, children } = JSswift.uiNormalizeArgs([{ ...input.props, color: tone }, ...input.children]);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };
  const p = JSswift.omit(props, [
    "actions", "description", "eyebrow", "icon", "iconSize", "illustration", "media",
    "message", "meta", "slots", "state", "title", "compact", "inline", "gap", "elevated"
  ]);
  p.class = uiClass([
    "jss-clear-set",
    "jss-panel",
    "jss-empty-state",
    "jss-singularity",
    uiWhen(rawProps.elevated, "elevated"),
    uiWhen(rawProps.compact, "compact"),
    uiWhen(rawProps.inline, "inline"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };
  if (rawProps.gap != null) p.style["--jss-empty-gap"] = uiStyleValue(rawProps.gap, toCssSize);

  const iconFallback = rawProps.icon === false
    ? null
    : (rawProps.icon != null
      ? (typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || rawProps.size || "xl" })
        : JSswift.ui.slot(rawProps.icon, { as: "icon" }))
      : UI.Icon({ name: "inbox", size: rawProps.iconSize || rawProps.size || "xl" }));

  const illustrationNodes = renderSlotToArray(slots, "illustration", {}, rawProps.illustration ?? rawProps.media);
  const iconNodes = renderSlotToArray(slots, "icon", {}, iconFallback);
  const eyebrowNodes = renderSlotToArray(slots, "eyebrow", {}, rawProps.eyebrow);
  const titleNodes = renderSlotToArray(slots, "title", {}, rawProps.title);
  const messageNodes = renderSlotToArray(slots, "message", {}, rawProps.message != null ? rawProps.message : children);
  const descriptionNodes = renderSlotToArray(slots, "description", {}, rawProps.description);
  const metaNodes = renderSlotToArray(slots, "meta", {}, rawProps.meta);
  const actionsNodes = renderSlotToArray(slots, "actions", {}, rawProps.actions);
  const bodyNodes = renderSlotToArray(slots, "default", {}, rawProps.message != null ? children : null);

  const emptyState = _.section(
    p,
    illustrationNodes.length
      ? _.div({ class: "jss-empty-state-illustration" }, ...illustrationNodes)
      : null,
    iconNodes.length ? _.div({ class: "jss-empty-state-icon" }, ...iconNodes) : null,
    eyebrowNodes.length ? _.div({ class: "jss-empty-state-eyebrow" }, ...eyebrowNodes) : null,
    titleNodes.length ? _.div({ class: "jss-empty-state-title" }, ...titleNodes) : null,
    messageNodes.length ? _.div({ class: "jss-empty-state-message" }, ...messageNodes) : null,
    descriptionNodes.length ? _.div({ class: "jss-empty-state-description" }, ...descriptionNodes) : null,
    metaNodes.length ? _.div({ class: "jss-empty-state-meta" }, ...metaNodes) : null,
    bodyNodes.length ? _.div({ class: "jss-empty-state-extra" }, ...bodyNodes) : null,
    actionsNodes.length ? _.div({ class: "jss-empty-state-actions" }, ...actionsNodes) : null
  );

  setPropertyProps(emptyState, rawProps);
  return emptyState;
};

// Esempio: JSswift.ui.EmptyState({ title: "No results", message: "Prova a cambiare i filtri" })

// -------------------------------
// 3) APP SHELL
// -------------------------------
