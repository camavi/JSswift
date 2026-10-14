
UI.Alert = (...args) => {
  const input = normalizeArgsBase(args);
  const tone = uiComputed([input.props.type, input.props.state, input.props.color], () =>
    uiUnwrap(input.props.type) || uiUnwrap(input.props.state) || uiUnwrap(input.props.color) || "warning");
  const { props: rawProps, children } = JSswift.uiNormalizeArgs([{ ...input.props, color: tone }, ...input.children]);
  const slots = rawProps.slots || {};

  const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.type) || uiUnwrap(rawProps.state) || uiUnwrap(rawProps.color) || "warning");
  const props = { ...rawProps };
  const p = JSswift.omit(props, [
    "actions", "aside", "closeLabel", "description", "dismiss", "dismissible",
    "icon", "iconSize", "message", "meta", "onDismiss", "slots", "state",
    "subtitle", "title", "type", "variant", "stack", "gap", "elevated"
  ]);
  p.class = uiClass([
    "jss-clear-set",
    "jss-panel",
    "jss-alert",
    "jss-singularity",
    uiWhen(rawProps.stack, "stack"),
    uiWhen(rawProps.elevated, "elevated"),
    uiWhen(rawProps.dismissible, "is-dismissible"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };
  if (rawProps.gap != null) p.style["--jss-alert-gap"] = uiStyleValue(rawProps.gap, toCssSize);
  p.role = rawProps.role ?? uiComputed([rawProps.type, rawProps.state, rawProps.color], () =>
    ["danger", "warning"].includes(resolveStateValue()) ? "alert" : "status");

  const autoIconMap = {
    success: "check_circle",
    warning: "warning",
    danger: "error",
    info: "info",
    primary: "bolt",
    secondary: "campaign",
    dark: "shield",
    light: "notifications"
  };

  const iconFallback = (() => {
    if (rawProps.icon === false || rawProps.icon === null) return null;
    if (rawProps.icon != null) {
      return typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || rawProps.size || "md" })
        : JSswift.ui.slot(rawProps.icon, { as: "icon" });
    }
    const iconName = autoIconMap[resolveStateValue()] || autoIconMap.warning;
    return UI.Icon({ name: iconName, size: rawProps.iconSize || rawProps.size || "md" });
  })();

  const titleNodes = renderSlotToArray(slots, "title", {}, rawProps.title);
  const messageNodes = renderSlotToArray(slots, "message", {}, rawProps.message != null ? rawProps.message : children);
  const descriptionNodes = renderSlotToArray(slots, "description", {}, rawProps.description ?? rawProps.subtitle);
  const metaNodes = renderSlotToArray(slots, "meta", {}, rawProps.meta);
  const actionsNodes = renderSlotToArray(slots, "actions", {}, rawProps.actions);
  const asideNodes = renderSlotToArray(slots, "aside", {}, rawProps.aside);
  const iconNodes = renderSlotToArray(slots, "icon", {}, iconFallback);
  const dismissNodes = renderSlotToArray(slots, "dismiss", {}, rawProps.dismiss);

  let alertEl = null;
  const defaultDismissNode = uiUnwrap(rawProps.dismissible) || rawProps.onDismiss
    ? UI.Btn({
      class: "jss-alert-close",
      outline: true,
      size: "sm",
      "aria-label": rawProps.closeLabel || "Chiudi alert",
      onClick: (e) => {
        rawProps.onDismiss?.(e);
        if (e.defaultPrevented) return;
        alertEl?.remove();
      }
    }, UI.Icon({ name: "#close", size: "sm" }))
    : null;

  alertEl = _.div(
    p,
    iconNodes.length ? _.div({ class: "jss-alert-icon" }, ...iconNodes) : null,
    _.div(
      { class: "jss-alert-body" },
      titleNodes.length ? _.div({ class: "jss-alert-title" }, ...titleNodes) : null,
      messageNodes.length ? _.div({ class: "jss-alert-message" }, ...messageNodes) : null,
      descriptionNodes.length ? _.div({ class: "jss-alert-description" }, ...descriptionNodes) : null,
      metaNodes.length ? _.div({ class: "jss-alert-meta" }, ...metaNodes) : null,
      actionsNodes.length ? _.div({ class: "jss-alert-actions" }, ...actionsNodes) : null
    ),
    (asideNodes.length || dismissNodes.length || defaultDismissNode)
      ? _.div(
        { class: "jss-alert-side" },
        ...asideNodes,
        ...(dismissNodes.length ? dismissNodes : (defaultDismissNode ? [defaultDismissNode] : []))
      )
      : null
  );

  setPropertyProps(alertEl, rawProps);
  return alertEl;
};

// Esempio: JSswift.ui.Alert({ type: "warning", title: "Review richiesta", message: "Controlla il batch prima del go-live" })
