UI.Banner = (...args) => {
  const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};

  const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.type) || uiUnwrap(rawProps.state) || "");
  const ctx = {
    state: resolveStateValue,
    dismissible: () => !!uiUnwrap(rawProps.dismissible)
  };

  const typeClass = uiComputed([rawProps.type, rawProps.state], () => resolveStateValue());
  const variantClass = uiComputed(rawProps.variant, () => {
    const variant = String(uiUnwrap(rawProps.variant) || "").toLowerCase();
    return ["solid", "outline", "ghost"].includes(variant) ? `jss-banner-${variant}` : "";
  });
  const actionsPlacementClass = uiComputed([rawProps.actionsPlacement, rawProps.stack], () => {
    const placement = String(uiUnwrap(rawProps.actionsPlacement) || "").toLowerCase();
    return placement === "bottom" || !!uiUnwrap(rawProps.stack) ? "jss-banner-actions-bottom" : "";
  });
  const stackClass = uiComputed(rawProps.stack, () => uiUnwrap(rawProps.stack) ? "jss-banner-stack" : "");

  const props = { ...rawProps };
  const p = JSswift.omit(props, [
    "actions", "actionsPlacement", "accent", "aside", "body", "closeLabel", "description",
    "dismiss", "dismissible", "icon", "iconSize", "message", "meta", "onDismiss", "slots",
    "stack", "state", "subtitle", "title", "type", "variant"
  ]);
  p.class = uiClass([
    "jss-clear-set",
    "jss-banner",
    "jss-singularity",
    typeClass,
    variantClass,
    actionsPlacementClass,
    stackClass,
    props.class
  ]);
  p.style = { ...(props.style || {}) };

  const toneToCss = (value) => {
    if (value == null || value === "") return "";
    const v = uiUnwrap(value);
    if (v == null || v === "") return "";
    const s = String(v);
    if (isTokenCSS(s)) return `var(--jss-${s})`;
    return s;
  };

  if (rawProps.accent != null || uiIsReactive(rawProps.accent)) {
    p.style["--jss-banner-accent"] = () => toneToCss(rawProps.accent);
    p.style["--jss-banner-border"] = () => {
      const tone = toneToCss(rawProps.accent);
      return tone ? `color-mix(in srgb, ${tone} 38%, var(--jss-border-color))` : "";
    };
    p.style["--jss-banner-bg"] = () => {
      const tone = toneToCss(rawProps.accent);
      return tone ? `color-mix(in srgb, ${tone} 14%, var(--jss-panel))` : "";
    };
    p.style["--jss-banner-color"] = () => {
      const tone = toneToCss(rawProps.accent);
      return tone ? `color-mix(in srgb, ${tone} 78%, white)` : "";
    };
  }

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
    const state = resolveStateValue();
    const iconName = state ? autoIconMap[state] : null;
    return iconName ? UI.Icon({ name: iconName, size: rawProps.iconSize || rawProps.size || "md" }) : null;
  })();

  const titleNodes = renderSlotToArray(slots, "title", ctx, rawProps.title);
  const messageNodes = renderSlotToArray(slots, "message", ctx, rawProps.message != null ? rawProps.message : children);
  const descriptionNodes = renderSlotToArray(slots, "description", ctx, rawProps.description ?? rawProps.subtitle);
  const metaNodes = renderSlotToArray(slots, "meta", ctx, rawProps.meta);
  const bodyNodes = renderSlotToArray(
    slots,
    "default",
    ctx,
    rawProps.body != null ? [rawProps.body, ...(children || [])] : (rawProps.message != null ? children : null)
  );
  const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
  const asideNodes = renderSlotToArray(slots, "aside", ctx, rawProps.aside);
  const actionsNodes = renderSlotToArray(slots, "actions", ctx, rawProps.actions);
  const dismissNodes = renderSlotToArray(slots, "dismiss", ctx, rawProps.dismiss);

  const hasBottomActions = (() => {
    const placement = String(uiUnwrap(rawProps.actionsPlacement) || "").toLowerCase();
    return placement === "bottom" || !!uiUnwrap(rawProps.stack);
  })();
  const isDismissible = !!uiUnwrap(rawProps.dismissible) || !!rawProps.onDismiss;

  let bannerEl = null;
  const defaultDismissNode = isDismissible
    ? UI.Btn({
      class: "jss-banner-close",
      outline: true,
      size: rawProps.size || "sm",
      "aria-label": rawProps.closeLabel || "Chiudi banner",
      onClick: (e) => {
        rawProps.onDismiss?.(e);
        if (e.defaultPrevented) return;
        bannerEl?.remove();
      }
    }, UI.Icon({ name: "close", size: rawProps.size || "sm" }))
    : null;

  const sideNodes = [
    ...asideNodes,
    ...(!hasBottomActions ? actionsNodes : []),
    ...(dismissNodes.length ? dismissNodes : (defaultDismissNode ? [defaultDismissNode] : []))
  ];

  bannerEl = _.div(
    p,
    iconNodes.length ? _.div({ class: "jss-banner-icon" }, ...iconNodes) : null,
    _.div(
      { class: "jss-banner-body" },
      _.div(
        { class: "jss-banner-copy" },
        titleNodes.length ? _.div({ class: "jss-banner-title" }, ...titleNodes) : null,
        messageNodes.length ? _.div({ class: "jss-banner-message" }, ...messageNodes) : null,
        descriptionNodes.length ? _.div({ class: "jss-banner-description" }, ...descriptionNodes) : null,
        bodyNodes.length ? _.div({ class: "jss-banner-extra" }, ...bodyNodes) : null,
        metaNodes.length ? _.div({ class: "jss-banner-meta" }, ...metaNodes) : null
      ),
      hasBottomActions && actionsNodes.length
        ? _.div({ class: "jss-banner-actions" }, ...actionsNodes)
        : null
    ),
    sideNodes.length ? _.div({ class: "jss-banner-side" }, ...sideNodes) : null
  );

  const role = p.role || (() => {
    const state = resolveStateValue();
    return state === "danger" || state === "warning" ? "alert" : "status";
  })();
  bannerEl.setAttribute("role", role);
  setPropertyProps(bannerEl, rawProps);
  return bannerEl;
};

// Esempio: JSswift.ui.Banner({ type: "warning", title: "Pagamento in sospeso", message: "Aggiorna il batch entro le 18:00" })
