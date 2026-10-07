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

UI.Alert = (...args) => {
  const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};

  const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.type) || uiUnwrap(rawProps.state) || uiUnwrap(rawProps.color) || "warning");
  const stateClass = uiComputed([rawProps.type, rawProps.state, rawProps.color], () => {
    const state = resolveStateValue();
    return state ? `jss-state-${state}` : "";
  });

  const props = { ...rawProps };
  const p = JSswift.omit(props, [
    "actions", "aside", "closeLabel", "description", "dismiss", "dismissible",
    "icon", "iconSize", "message", "meta", "onDismiss", "slots", "state",
    "subtitle", "title", "type", "variant"
  ]);
  p.class = uiClass([
    "jss-clear-set",
    "jss-alert",
    "jss-singularity",
    stateClass,
    uiWhen(rawProps.dismissible, "is-dismissible"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };

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
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || "sm" })
        : JSswift.ui.slot(rawProps.icon, { as: "icon" });
    }
    const iconName = autoIconMap[resolveStateValue()] || autoIconMap.warning;
    return UI.Icon({ name: iconName, size: rawProps.iconSize || "sm" });
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
  const defaultDismissNode = rawProps.dismissible || rawProps.onDismiss
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
    }, UI.Icon({ name: "close", size: "sm" }))
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

  alertEl.setAttribute("role", resolveStateValue() === "danger" || resolveStateValue() === "warning" ? "alert" : "status");
  setPropertyProps(alertEl, rawProps);
  return alertEl;
};

// Esempio: JSswift.ui.Alert({ type: "warning", title: "Review richiesta", message: "Controlla il batch prima del go-live" })

UI.EmptyState = (...args) => {
  const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.state) || uiUnwrap(rawProps.color) || "");
  const stateClass = uiComputed([rawProps.state, rawProps.color], () => {
    const state = resolveStateValue();
    return state ? `jss-state-${state}` : "";
  });

  const props = { ...rawProps };
  const p = JSswift.omit(props, [
    "actions", "description", "eyebrow", "icon", "iconSize", "illustration", "media",
    "message", "meta", "slots", "state", "title"
  ]);
  p.class = uiClass([
    "jss-clear-set",
    "jss-empty-state",
    "jss-singularity",
    stateClass,
    uiWhen(rawProps.compact, "compact"),
    uiWhen(rawProps.inline, "inline"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };

  const iconFallback = rawProps.icon === false
    ? null
    : (rawProps.icon != null
      ? (typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || "xl" })
        : JSswift.ui.slot(rawProps.icon, { as: "icon" }))
      : UI.Icon({ name: "inbox", size: rawProps.iconSize || "xl" }));

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
let drawerStateKey = "jsswift:drawer-open";
const drawerToggleIcons = new Set();
const drawerElsByKey = new Map();
const readDrawerOpen = (key = drawerStateKey) => {
  const store = JSswift?.store;
  if (store?.get) {
    const stored = store.get(key, undefined);
    if (typeof stored === "boolean") return stored;
  }
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};
const writeDrawerOpen = (open, key = drawerStateKey) => {
  const store = JSswift?.store;
  if (store?.set) {
    store.set(key, !!open);
    return;
  }
  try {
    localStorage.setItem(key, open ? "1" : "0");
  } catch {
    // ignore storage errors
  }
};
let drawerOpen = readDrawerOpen();
const setDrawerOpen = (open, key = drawerStateKey) => {
  drawerOpen = !!open;
  const drawerEls = drawerElsByKey.get(key);
  if (drawerEls && drawerEls.size) {
    drawerEls.forEach((el) => el?.classList.toggle("open", drawerOpen));
  } else {
    const drawerEl = document.querySelector(".jss-drawer");
    if (drawerEl) drawerEl.classList.toggle("open", drawerOpen);
  }
  drawerToggleIcons.forEach((entry) => {
    if (!entry) return;
    if (typeof entry.update === "function") {
      entry.update(drawerOpen);
      return;
    }
    const { el, openIcon, closeIcon } = entry;
    if (el) el.textContent = drawerOpen ? openIcon : closeIcon;
  });
  writeDrawerOpen(drawerOpen, key);
  return drawerOpen;
};

