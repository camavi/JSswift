UI.Header = (...args) => {
  const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };
  applyCommonProps(props);

  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(rawProps, key);
  const currentStateKey = rawProps.drawerStateKey ?? drawerStateKey;
  if (currentStateKey) {
    drawerStateKey = currentStateKey;
    drawerOpen = readDrawerOpen(currentStateKey);
  }

  const isDrawerOpen = () => readDrawerOpen(currentStateKey);
  const openDrawer = () => setDrawerOpen(true, currentStateKey);
  const closeDrawer = () => setDrawerOpen(false, currentStateKey);
  const toggleDrawer = () => setDrawerOpen(!isDrawerOpen(), currentStateKey);
  const ctx = {
    props: rawProps,
    stateKey: currentStateKey,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    toggleAside: toggleDrawer
  };
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
      const host = _[inlineNames.has(name) ? "span" : "div"]({ class: `jss-header-slot-${name}` });
      JSswift.reactive.effect(() => {
        const nextValue = map(fallback(ctx));
        const normalized = flattenSlotValue(JSswift.ui.slot(nextValue));
        host.replaceChildren();
        if (Array.isArray(normalized)) normalized.forEach((item) => appendResolvedValue(host, item));
        else appendResolvedValue(host, normalized);
      }, `UI.Header:${name}`);
      return [host];
    }
    return renderSlotToArray(slots, name, ctx, map(fallback));
  };

  const renderIconValue = (value, as = "icon", sizeFallback = rawProps.iconSize || rawProps.size || "md") => {
    if (value == null || value === false) return null;
    if (typeof value === "string") return UI.Icon({ name: value, size: sizeFallback });
    return JSswift.ui.slot(value, { as });
  };
  const renderDrawerToggleValue = (open) => {
    const value = open ? (rawProps.drawerOpenIcon ?? "✕") : (rawProps.drawerCloseIcon ?? "☰");
    if (value == null || value === false) return null;
    if (typeof value === "string") return value;
    return JSswift.ui.slot(value, { as: open ? "drawerOpenIcon" : "drawerCloseIcon" });
  };

  const toggleIconHost = _.span({ class: "jss-header-toggle-icon" });
  const paintToggleIcon = (open) => {
    const nodes = renderSlotToArray(null, "default", ctx, renderDrawerToggleValue(open));
    toggleIconHost.replaceChildren(...(nodes.length ? nodes : [""]));
  };
  paintToggleIcon(isDrawerOpen());

  const autoLeft = UI.Btn({
    class: "jss-header-toggle",
    outline: true,
    size: rawProps.toggleSize ?? rawProps.size ?? "sm",
    onClick: toggleDrawer,
    "aria-label": rawProps.toggleLabel || "Toggle navigation"
  }, toggleIconHost);
  if (rawProps.left == null && rawProps.left !== false && !JSswift.ui.getSlot(slots, "left")) {
    drawerToggleIcons.add({ update: paintToggleIcon });
  }

  const leftFallback = rawProps.left === false
    ? null
    : (rawProps.left != null ? rawProps.left : autoLeft);
  const titleFallback = hasOwn("title") ? rawProps.title : (rawProps.label ?? "App");
  const subtitleFallback = rawProps.subtitle ?? rawProps.description ?? "";
  const rightFallback = hasOwn("right") ? rawProps.right : rawProps.end;
  const contentFallback = hasOwn("content")
    ? rawProps.content
    : (hasOwn("body") ? rawProps.body : (children?.length ? children : null));

  const startNodes = [
    ...renderPropNodes("left", leftFallback),
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
  const customCenterNodes = [
    ...renderPropNodes("center", null),
    ...renderPropNodes("body", null)
  ];
  const rightNodes = [
    ...renderPropNodes("right", rightFallback),
    ...renderPropNodes("end", null)
  ];
  const actionNodes = renderPropNodes("actions", rawProps.actions);

  const structuredCenter = _.div(
    { class: uiClass(["jss-header-body", rawProps.bodyClass, rawProps.centerClass]) },
    _.div(
      { class: "jss-header-heading" },
      iconNodes.length ? _.div({ class: "jss-header-icon" }, ...iconNodes) : null,
      _.div(
        { class: "jss-header-copy" },
        eyebrowNodes.length ? _.div({ class: uiClass(["jss-header-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
        titleNodes.length ? _.div({ class: uiClass(["jss-header-title", rawProps.titleClass]) }, ...titleNodes) : null,
        subtitleNodes.length ? _.div({ class: uiClass(["jss-header-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
        contentNodes.length ? _.div({ class: uiClass(["jss-header-content", rawProps.contentClass]) }, ...contentNodes) : null
      ),
      metaNodes.length ? _.div({ class: uiClass(["jss-header-meta", rawProps.metaClass]) }, ...metaNodes) : null
    )
  );

  const endContent = [
    ...rightNodes,
    ...(actionNodes.length ? [_.div({ class: uiClass(["jss-header-actions", rawProps.actionsClass]) }, ...actionNodes)] : [])
  ];

  const p = JSswift.omit(props, [
    "actions", "actionsClass", "body", "bodyClass", "centerClass", "content", "contentClass",
    "description", "divider", "drawerCloseIcon", "drawerOpenIcon", "drawerStateKey", "elevated",
    "end", "eyebrow", "eyebrowClass", "icon", "iconSize", "kicker", "label", "left", "meta",
    "metaClass", "right", "slots", "stack", "sticky", "subtitle", "subtitleClass", "title",
    "titleClass", "toggleLabel", "toggleSize", "gap", "minHeight", "startClass", "endClass"
  ]);
  p.class = uiClass([
    "jss-panel",
    "jss-header",
    "jss-singularity",
    uiWhen(rawProps.sticky !== false, "sticky"),
    uiWhen(rawProps.stack, "stack"),
    uiWhen(rawProps.elevated, "elevated"),
    uiWhen(rawProps.divider !== false, "divider"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };
  if (rawProps.gap != null) p.style["--jss-header-gap"] = toCssSize(uiUnwrap(rawProps.gap));
  if (rawProps.minHeight != null) p.style.minHeight = toCssSize(uiUnwrap(rawProps.minHeight));

  const el = _.div(
    p,
    ...(startNodes.length ? [_.div({ class: uiClass(["jss-header-start", rawProps.startClass]) }, ...startNodes)] : []),
    _.div(
      { class: "jss-header-main" },
      ...(customCenterNodes.length
        ? [_.div({ class: uiClass(["jss-header-body", rawProps.bodyClass, rawProps.centerClass]) }, ...customCenterNodes)]
        : [structuredCenter]),
      ...(endContent.length ? [_.div({ class: uiClass(["jss-header-end", rawProps.endClass]) }, ...endContent)] : [])
    )
  );

  setPropertyProps(el, rawProps);
  return el;
};
