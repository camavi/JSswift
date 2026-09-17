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
      const host = _[inlineNames.has(name) ? "span" : "div"]({ class: `cms-header-slot-${name}` });
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

  const toggleIconHost = _.span({ class: "cms-header-toggle-icon" });
  const paintToggleIcon = (open) => {
    const nodes = renderSlotToArray(null, "default", ctx, renderDrawerToggleValue(open));
    toggleIconHost.replaceChildren(...(nodes.length ? nodes : [""]));
  };
  paintToggleIcon(isDrawerOpen());

  const autoLeft = UI.Btn({
    class: "cms-header-toggle",
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
    { class: uiClass(["cms-header-body", rawProps.bodyClass, rawProps.centerClass]) },
    _.div(
      { class: "cms-header-heading" },
      iconNodes.length ? _.div({ class: "cms-header-icon" }, ...iconNodes) : null,
      _.div(
        { class: "cms-header-copy" },
        eyebrowNodes.length ? _.div({ class: uiClass(["cms-header-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
        titleNodes.length ? _.div({ class: uiClass(["cms-header-title", rawProps.titleClass]) }, ...titleNodes) : null,
        subtitleNodes.length ? _.div({ class: uiClass(["cms-header-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
        contentNodes.length ? _.div({ class: uiClass(["cms-header-content", rawProps.contentClass]) }, ...contentNodes) : null
      ),
      metaNodes.length ? _.div({ class: uiClass(["cms-header-meta", rawProps.metaClass]) }, ...metaNodes) : null
    )
  );

  const endContent = [
    ...rightNodes,
    ...(actionNodes.length ? [_.div({ class: uiClass(["cms-header-actions", rawProps.actionsClass]) }, ...actionNodes)] : [])
  ];

  const p = JSswift.omit(props, [
    "actions", "actionsClass", "body", "bodyClass", "centerClass", "content", "contentClass",
    "description", "divider", "drawerCloseIcon", "drawerOpenIcon", "drawerStateKey", "elevated",
    "end", "eyebrow", "eyebrowClass", "icon", "iconSize", "kicker", "label", "left", "meta",
    "metaClass", "right", "slots", "stack", "sticky", "subtitle", "subtitleClass", "title",
    "titleClass", "toggleLabel", "toggleSize", "gap", "minHeight", "startClass", "endClass"
  ]);
  p.class = uiClass([
    "cms-panel",
    "cms-header",
    "cms-singularity",
    uiWhen(rawProps.sticky !== false, "sticky"),
    uiWhen(rawProps.stack, "stack"),
    uiWhen(rawProps.elevated, "elevated"),
    uiWhen(rawProps.divider !== false, "divider"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };
  if (rawProps.gap != null) p.style["--cms-header-gap"] = toCssSize(uiUnwrap(rawProps.gap));
  if (rawProps.minHeight != null) p.style.minHeight = toCssSize(uiUnwrap(rawProps.minHeight));

  const el = _.div(
    p,
    ...(startNodes.length ? [_.div({ class: uiClass(["cms-header-start", rawProps.startClass]) }, ...startNodes)] : []),
    _.div(
      { class: "cms-header-main" },
      ...(customCenterNodes.length
        ? [_.div({ class: uiClass(["cms-header-body", rawProps.bodyClass, rawProps.centerClass]) }, ...customCenterNodes)]
        : [structuredCenter]),
      ...(endContent.length ? [_.div({ class: uiClass(["cms-header-end", rawProps.endClass]) }, ...endContent)] : [])
    )
  );

  setPropertyProps(el, rawProps);
  return el;
};
if (JSswift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.Header = {
    signature: "UI.Header(...children) | UI.Header(props, ...children)",
    props: {
      title: "String|Node|Function|Array",
      subtitle: "String|Node|Function|Array",
      eyebrow: "String|Node|Function|Array",
      content: "Node|Function|Array",
      meta: "Node|Function|Array",
      icon: "String|Node|Function|Array",
      left: "Node|Function|Array|false",
      right: "Node|Function|Array",
      actions: "Node|Function|Array",
      drawerOpenIcon: "string|Node",
      drawerCloseIcon: "string|Node",
      drawerStateKey: "string",
      sticky: "boolean",
      stack: "boolean",
      dense: "boolean",
      elevated: "boolean",
      divider: "boolean",
      gap: "string|number",
      minHeight: "string|number",
      slots: "{ left?, start?, right?, end?, center?, body?, icon?, eyebrow?, title?, subtitle?, meta?, content?, actions? }",
      class: "string",
      style: "object"
    },
    slots: {
      left: "Left area, falls back to the drawer toggle",
      start: "Alias/addon for the left area",
      right: "Main right area",
      end: "Alias/addon for the right area",
      center: "Full override for the central body",
      body: "Alias of center",
      icon: "Leading icon",
      eyebrow: "Eyebrow / kicker",
      title: "Title",
      subtitle: "Subtitle",
      meta: "Meta info next to the central content",
      content: "Extra content below the subtitle",
      actions: "Actions grouped in the right area"
    },
    returns: "HTMLDivElement",
    description: "Structured header with start/body/end regions, integrated drawer toggle, metadata, and composable slots."
  };
}

UI.Drawer = (...args) => {
  const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };
  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(rawProps, key);
  const currentStateKey = rawProps.stateKey ?? drawerStateKey;
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

  const store = JSswift?.store;
  const canStore = !!(store?.get && store?.set);
  const groupStateKey = `${currentStateKey}:groups`;
  const activeStateKey = `${currentStateKey}:active`;
  let groupState = canStore ? (store.get(groupStateKey, {}) || {}) : {};
  let activeItemKey = canStore ? (store.get(activeStateKey, null) ?? null) : null;
  const activeLeafRefs = new Map();
  const activeGroupRefs = new Map();

  const normalizeList = (value) => {
    const raw = uiUnwrap(value);
    if (raw == null || raw === false) return [];
    if (Array.isArray(raw)) return raw.flat(Infinity);
    return [raw];
  };
  const renderArea = (names, fallback, localCtx = ctx) => {
    const list = Array.isArray(names) ? names : [names];
    for (const name of list) {
      if (JSswift.ui.getSlot(slots, name) != null) {
        return renderSlotToArray(slots, name, localCtx, fallback);
      }
    }
    return fallback == null ? [] : renderSlotToArray(null, "default", localCtx, uiUnwrap(fallback));
  };
  const hasArea = (names) => {
    const list = Array.isArray(names) ? names : [names];
    return list.some((name) => JSswift.ui.getSlot(slots, name) != null);
  };

  const isExternalLink = (it) => {
    if (typeof uiUnwrap(it.external) === "boolean") return !!uiUnwrap(it.external);
    const href = uiUnwrap(it.href || it.to || it.link || "");
    return /^(https?:)?\/\//.test(href);
  };
  const closeOnSelect = rawProps.closeOnSelect ?? true;
  const shouldClose = (it) => !!closeOnSelect && uiUnwrap(it.keepOpen) !== true;
  const itemIconSize = rawProps.itemIconSize ?? rawProps.size ?? "md";
  const groupOpenIcon = rawProps.groupOpenIcon ?? "arrow_drop_up";
  const groupCloseIcon = rawProps.groupCloseIcon ?? "arrow_drop_down";

  const isStoredActive = (key) => !!key && activeItemKey === key;
  const isBranchActive = (key) => !!key && !!activeItemKey && (activeItemKey === key || activeItemKey.startsWith(`${key}::`));
  const syncActiveClasses = () => {
    activeLeafRefs.forEach(({ el, baseActive }, key) => {
      const active = !!baseActive || isStoredActive(key);
      el.classList.toggle("active", active);
      if (active) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
    });
    activeGroupRefs.forEach(({ wrap, toggle, baseActive }, key) => {
      const active = !!baseActive || isBranchActive(key);
      wrap.classList.toggle("active", active);
      toggle.classList.toggle("active", active);
    });
  };
  const setActiveItem = (key) => {
    activeItemKey = key || null;
    if (canStore) store.set(activeStateKey, activeItemKey);
    syncActiveClasses();
  };
  const inferBaseActive = (it, href) => {
    if (uiUnwrap(it.active) != null) return !!uiUnwrap(it.active);
    if (uiUnwrap(it.current) != null) return !!uiUnwrap(it.current);
    if (!href || isExternalLink(it)) return false;
    try {
      if (href.startsWith("#")) return window.location.hash === href;
      const fullPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      return href === fullPath || href === window.location.pathname;
    } catch {
      return false;
    }
  };
  const inferActive = (it, href, itemStateKey) => inferBaseActive(it, href) || isStoredActive(itemStateKey);
  const hasActiveChildren = (list = [], level = 0, path = []) => {
    return normalizeList(list).some((entry, idx) => {
      const it = uiUnwrap(entry);
      if (!it || typeof it !== "object" || it.nodeType) return false;
      const href = uiUnwrap(it.href || it.to || it.link || "");
      const label = uiUnwrap(it.label ?? it.title ?? it.text ?? href ?? null) ?? `item-${level}-${idx}`;
      const keyPart = itemKeyPart(it, label, level, idx);
      const itemStateKey = path.concat(keyPart).join("::");
      if (inferActive(it, href, itemStateKey)) return true;
      const nested = it.items || it.children || it.sub;
      return hasActiveChildren(nested, level + 1, path.concat(keyPart));
    });
  };
  const iconNodes = (icon, localCtx = {}) => {
    const raw = uiUnwrap(icon);
    if (raw == null || raw === false) return [];
    const slotValue = typeof raw === "string"
      ? UI.Icon({ name: raw, size: localCtx.iconSize ?? itemIconSize })
      : JSswift.ui.slot(raw, { ...localCtx, as: "icon" });
    return renderSlotToArray(null, "default", localCtx, slotValue);
  };
  const wrapIconNodes = (icon, side, localCtx = {}) => {
    const nodes = iconNodes(icon, localCtx);
    return nodes.length ? [_.span({ class: uiClass(["cms-drawer-item-icon", side]) }, ...nodes)] : [];
  };

  const getItemIcons = (it) => {
    const side = uiUnwrap(it.iconPosition) || "left";
    const leftIcon = Object.prototype.hasOwnProperty.call(it, "iconLeft") ? it.iconLeft : (side !== "right" ? it.icon : null);
    const rightIcon = Object.prototype.hasOwnProperty.call(it, "iconRight") ? it.iconRight : (side === "right" ? it.icon : null);
    return {
      left: leftIcon,
      right: rightIcon
    };
  };

  const itemKeyPart = (it, label, level, idx) => uiUnwrap(it.key || it.id || it.to || it.href || label || `item-${level}-${idx}`);

  const readGroupOpen = (key, fallback) => {
    if (!canStore) return fallback;
    if (Object.prototype.hasOwnProperty.call(groupState, key)) return !!groupState[key];
    return fallback;
  };

  const writeGroupOpen = (key, open) => {
    if (!canStore) return;
    groupState = { ...groupState, [key]: !!open };
    store.set(groupStateKey, groupState);
  };

  const buildStructuredHeader = () => {
    const headerCtx = { ...ctx, area: "header" };
    const icon = renderArea(["headerIcon", "icon"], rawProps.icon, headerCtx);
    const eyebrow = renderArea(["eyebrow"], rawProps.eyebrow, headerCtx);
    const title = renderArea(["title"], rawProps.title, headerCtx);
    const subtitle = renderArea(["subtitle"], rawProps.subtitle, headerCtx);
    const meta = renderArea(["meta"], rawProps.meta, headerCtx);
    const content = renderArea(["content"], rawProps.content, headerCtx);
    const actions = renderArea(["actions"], rawProps.actions, headerCtx);
    const extra = hasOwn("header") ? renderSlotToArray(null, "default", headerCtx, uiUnwrap(rawProps.header)) : [];
    const hasStructured = icon.length || eyebrow.length || title.length || subtitle.length || meta.length || content.length || actions.length;
    if (!hasStructured && !extra.length) return [];
    if (!hasStructured) return extra;
    return [
      _.div(
        { class: uiClass(["cms-drawer-header", rawProps.headerClass]) },
        ...(icon.length ? [_.div({ class: "cms-drawer-header-icon" }, ...icon)] : []),
        _.div(
          { class: "cms-drawer-header-body" },
          ...(eyebrow.length ? [_.div({ class: "cms-drawer-header-eyebrow" }, ...eyebrow)] : []),
          ...(title.length ? [_.div({ class: "cms-drawer-header-title" }, ...title)] : []),
          ...(subtitle.length ? [_.div({ class: "cms-drawer-header-subtitle" }, ...subtitle)] : []),
          ...(meta.length ? [_.div({ class: "cms-drawer-header-meta" }, ...meta)] : []),
          ...(content.length ? [_.div({ class: "cms-drawer-header-content" }, ...content)] : []),
          ...(extra.length ? [_.div({ class: "cms-drawer-header-extra" }, ...extra)] : [])
        ),
        ...(actions.length ? [_.div({ class: "cms-drawer-header-actions" }, ...actions)] : [])
      )
    ];
  };
  const invokeItemHandler = (it, itemCtx, e) => {
    const itemResult = it.onClick?.(e, itemCtx);
    if (itemResult === false || e?.defaultPrevented) return false;
    const rootResult = rawProps.onSelect?.(it, itemCtx, e);
    if (rootResult === false || e?.defaultPrevented) return false;
    return true;
  };
  const renderEntryNodes = (it, itemCtx, extras = {}) => {
    const slotPrefix = itemCtx.hasChildren ? "group" : "item";
    const labelNodes = renderSlotToArray(slots, `${slotPrefix}Label`, itemCtx, itemCtx.label);
    const noteNodes = renderSlotToArray(slots, `${slotPrefix}Note`, itemCtx, itemCtx.note);
    const badgeNodes = renderSlotToArray(slots, `${slotPrefix}Badge`, itemCtx, itemCtx.badge);
    const asideNodes = renderSlotToArray(slots, `${slotPrefix}Aside`, itemCtx, itemCtx.aside);
    const contentNodes = renderSlotToArray(slots, `${slotPrefix}Content`, itemCtx, itemCtx.content);
    const mainChildren = [];

    if (labelNodes.length || noteNodes.length || badgeNodes.length || asideNodes.length) {
      mainChildren.push(
        _.div(
          { class: "cms-drawer-item-top" },
          _.div(
            { class: "cms-drawer-item-copy" },
            ...(labelNodes.length ? [_.div({ class: "cms-drawer-item-label" }, ...labelNodes)] : []),
            ...(noteNodes.length ? [_.div({ class: "cms-drawer-item-note" }, ...noteNodes)] : [])
          ),
          ...(badgeNodes.length || asideNodes.length
            ? [_.div(
              { class: "cms-drawer-item-meta" },
              ...(badgeNodes.length ? [_.div({ class: "cms-drawer-item-badge" }, ...badgeNodes)] : []),
              ...(asideNodes.length ? [_.div({ class: "cms-drawer-item-aside" }, ...asideNodes)] : [])
            )]
            : [])
        )
      );
    }
    if (contentNodes.length) mainChildren.push(_.div({ class: "cms-drawer-item-content" }, ...contentNodes));

    return [
      ...(extras.start || []),
      ...wrapIconNodes(itemCtx.iconLeft, "left", itemCtx),
      ...(mainChildren.length ? [_.div({ class: "cms-drawer-item-main" }, ...mainChildren)] : []),
      ...wrapIconNodes(itemCtx.iconRight, "right", itemCtx),
      ...(extras.end || [])
    ];
  };
  const renderItems = (list = [], level = 0, path = []) => {
    return normalizeList(list).map((entry, idx) => {
      const it = uiUnwrap(entry);
      if (it == null || it === false) return null;

      if (it.nodeType || typeof it !== "object" || Array.isArray(it)) {
        return _.div({
          class: "cms-drawer-custom",
          "data-level": String(level)
        }, ...renderSlotToArray(null, "default", { ...ctx, item: it, level, index: idx, path }, it));
      }

      if (uiUnwrap(it.hidden) === true || uiUnwrap(it.visible) === false) return null;

      const childItems = normalizeList(it.items || it.children || it.sub);
      const href = uiUnwrap(it.href || it.to || it.link || null);
      const rawLabel = uiUnwrap(it.label ?? it.title ?? it.text ?? href ?? null);
      const label = rawLabel ?? `item-${level}-${idx}`;
      const note = uiUnwrap(it.note ?? it.subtitle ?? it.description ?? null);
      const badge = uiUnwrap(it.badge ?? null);
      const aside = uiUnwrap(it.aside ?? it.meta ?? null);
      const content = uiUnwrap(it.content ?? null);
      const keyPart = itemKeyPart(it, label, level, idx);
      const itemStateKey = path.concat(keyPart).join("::");
      const { left: itemIconLeft, right: itemIconRight } = getItemIcons(it);
      const tone = normalizeState(uiUnwrap(it.state) || uiUnwrap(it.color) || "");
      const baseIsActive = inferBaseActive(it, href);
      const isActive = baseIsActive || isStoredActive(itemStateKey);
      const disabled = !!uiUnwrap(it.disabled);
      const itemCtx = {
        ...ctx,
        item: it,
        index: idx,
        level,
        path,
        label,
        note,
        badge,
        aside,
        content,
        itemStateKey,
        iconLeft: itemIconLeft,
        iconRight: itemIconRight,
        iconSize: uiUnwrap(it.iconSize) || itemIconSize,
        active: isActive,
        disabled,
        hasChildren: false
      };
      const dividerLike = uiUnwrap(it.divider) === true || it.type === "divider" || it.type === "separator";
      const sectionLike = uiUnwrap(it.section) === true || it.type === "section" || it.type === "heading" || it.type === "label";
      const contentOnly = it.type === "content" || it.type === "custom" || (!href && !childItems.length && !uiUnwrap(it.button) && it.type !== "button" && rawLabel == null && content != null);

      if (dividerLike) {
        return _.div({
          class: uiClass(["cms-drawer-separator", it.class]),
          "data-level": String(level)
        });
      }

      if (sectionLike) {
        const sectionNodes = renderSlotToArray(slots, "sectionLabel", itemCtx, label || content);
        return _.div({
          class: uiClass(["cms-drawer-section-label", it.class]),
          "data-level": String(level)
        }, ...sectionNodes);
      }

      if (contentOnly) {
        const customNodes = renderSlotToArray(slots, "item", itemCtx, content ?? label);
        return _.div({
          class: uiClass(["cms-drawer-custom", tone ? `cms-drawer-tone-${tone}` : "", it.class]),
          style: it.style,
          "data-level": String(level)
        }, ...customNodes);
      }

      if (childItems.length) {
        const baseActiveInGroup = baseIsActive || hasActiveChildren(childItems, level + 1, path.concat(keyPart));
        const activeInGroup = baseActiveInGroup || isBranchActive(itemStateKey);
        let open = readGroupOpen(itemStateKey, !!uiUnwrap(it.expanded) || !!uiUnwrap(it.open) || activeInGroup);
        const toggleIconEl = _.span({ class: "cms-drawer-group-icon" });
        const groupCtx = {
          ...itemCtx,
          active: activeInGroup,
          hasChildren: true,
          isOpen: () => open,
          setOpen: (value) => setOpen(value),
          toggle: () => setOpen(!open)
        };
        const paintToggleIcon = () => {
          const icon = open ? (it.openIcon ?? groupOpenIcon) : (it.closeIcon ?? groupCloseIcon);
          const side = uiUnwrap(
            open
              ? (it.iconSidePosition || it.openIconSide || it.openIconPosition || "right")
              : (it.iconSidePosition || it.closeIconSide || it.closeIconPosition || "right")
          ) === "left" ? "left" : "right";
          toggleIconEl.innerHTML = "";
          toggleIconEl.className = `cms-drawer-group-icon ${side}`;
          iconNodes(icon, { ...groupCtx, as: "toggleIcon" }).forEach((node) => toggleIconEl.appendChild(node));
        };
        const toggleBtn = _.button({
          type: "button",
          class: uiClass([
            "cms-drawer-group-toggle",
            "cms-drawer-entry",
            open ? "open" : "",
            activeInGroup ? "active" : "",
            disabled ? "is-disabled" : "",
            tone ? `cms-drawer-tone-${tone}` : "",
            it.class
          ]),
          style: it.style,
          "data-level": String(level),
          "aria-expanded": String(open),
          "aria-disabled": disabled ? "true" : null,
          onClick: (e) => {
            if (disabled) {
              e.preventDefault();
              return;
            }
            setActiveItem(itemStateKey);
            setOpen(!open);
          }
        }, ...renderEntryNodes(it, groupCtx, {
          start: uiUnwrap(it.iconSidePosition || it.openIconSide || it.closeIconSide || it.openIconPosition || it.closeIconPosition || "right") === "left" ? [toggleIconEl] : [],
          end: uiUnwrap(it.iconSidePosition || it.openIconSide || it.closeIconSide || it.openIconPosition || it.closeIconPosition || "right") === "right" ? [toggleIconEl] : []
        }));
        const customGroupHeader = renderSlotToArray(slots, "group", groupCtx, null);
        const groupItems = _.div({ class: "cms-drawer-group-items" }, ...renderItems(childItems, level + 1, path.concat(keyPart)));
        const groupWrap = _.div({
          class: uiClass([
            "cms-drawer-group",
            open ? "open" : "",
            activeInGroup ? "active" : "",
            tone ? `cms-drawer-tone-${tone}` : ""
          ]),
          "data-level": String(level)
        }, ...(customGroupHeader.length ? customGroupHeader : [toggleBtn]), groupItems);
        const setOpen = (value) => {
          open = !!value;
          groupWrap.classList.toggle("open", open);
          toggleBtn.classList.toggle("open", open);
          toggleBtn.setAttribute("aria-expanded", String(open));
          paintToggleIcon();
          writeGroupOpen(itemStateKey, open);
        };
        activeGroupRefs.set(itemStateKey, {
          wrap: groupWrap,
          toggle: toggleBtn,
          baseActive: baseActiveInGroup
        });
        paintToggleIcon();
        return groupWrap;
      }

      const customItem = renderSlotToArray(slots, "item", itemCtx, null);
      const isButtonItem = uiUnwrap(it.button) === true || it.type === "button" || (!href && typeof it.onClick === "function");
      const sharedProps = {
        class: uiClass([
          "cms-drawer-entry",
          isButtonItem ? "cms-drawer-btn" : "cms-drawer-link",
          isActive ? "active" : "",
          disabled ? "is-disabled" : "",
          tone ? `cms-drawer-tone-${tone}` : "",
          it.class
        ]),
        style: it.style,
        "data-level": String(level),
        "aria-current": isActive ? "page" : null,
        "aria-disabled": disabled ? "true" : null
      };
      const entryNodes = customItem.length ? customItem : renderEntryNodes(it, itemCtx);

      if (isButtonItem) {
        const entryEl = _.button({
          ...sharedProps,
          type: it.buttonType || "button",
          disabled,
          onClick: (e) => {
            if (disabled) {
              e.preventDefault();
              return;
            }
            if (!invokeItemHandler(it, itemCtx, e)) return;
            setActiveItem(itemStateKey);
            if (shouldClose(it)) closeDrawer();
          }
        }, ...entryNodes);
        activeLeafRefs.set(itemStateKey, { el: entryEl, baseActive: baseIsActive });
        return entryEl;
      }

      const external = isExternalLink(it);
      const target = external ? (uiUnwrap(it.target) || "_blank") : uiUnwrap(it.target);
      const rel = external ? (uiUnwrap(it.rel) || "noopener noreferrer") : uiUnwrap(it.rel);

      const entryEl = _.a({
        ...sharedProps,
        href: href || "#",
        target: target || null,
        rel: rel || null,
        tabIndex: disabled ? -1 : null,
        onClick: (e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          if (!invokeItemHandler(it, itemCtx, e)) return;
          if (!external && it.to && app.router?.navigate) {
            e.preventDefault();
            app.router.navigate(it.to);
          }
          if (shouldClose(it)) closeDrawer();
        }
      }, ...entryNodes);
      activeLeafRefs.set(itemStateKey, { el: entryEl, baseActive: baseIsActive });
      return entryEl;
    }).filter(Boolean);
  };

  const beforeNodes = renderArea(["before", "beforeItems"], rawProps.before ?? rawProps.beforeItems);
  const bodyCustom = hasArea(["body"]) ? renderArea(["body"], null) : [];
  const itemNodes = renderItems(rawProps.items || []);
  const defaultNodes = renderArea(["default"], children);
  const afterNodes = renderArea(["after", "afterItems"], rawProps.after ?? rawProps.afterItems);
  const bodyNodes = bodyCustom.length ? bodyCustom : [...beforeNodes, ...itemNodes, ...defaultNodes, ...afterNodes];
  const emptyFallback = hasOwn("empty") || hasOwn("emptyText")
    ? (rawProps.empty ?? _.div({ class: uiClass(["cms-drawer-empty", rawProps.emptyClass]) }, rawProps.emptyText || "Nessun contenuto"))
    : _.div({ class: uiClass(["cms-drawer-empty", rawProps.emptyClass]) }, "Nessun contenuto");
  const headerNodes = renderArea(["header"], buildStructuredHeader());
  const footerNodes = renderArea(["footer"], rawProps.footer);
  const finalBodyNodes = bodyNodes.length ? bodyNodes : renderArea(["empty"], emptyFallback);

  const p = JSswift.omit(props, [
    "items", "header", "footer", "before", "beforeItems", "after", "afterItems",
    "title", "subtitle", "eyebrow", "icon", "content", "meta", "actions",
    "empty", "emptyText", "closeOnSelect", "groupOpenIcon", "groupCloseIcon",
    "stateKey", "sticky", "slots", "headerClass", "bodyClass", "footerClass",
    "emptyClass", "itemIconSize", "gap", "indent", "padding", "minHeight",
    "maxHeight", "width", "onSelect"
  ]);
  p.class = uiClass([
    "cms-panel",
    "cms-drawer",
    drawerOpen ? "open" : "",
    uiWhen(rawProps.sticky, "sticky"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };
  if (rawProps.gap != null) p.style["--cms-drawer-gap"] = toCssSize(uiUnwrap(rawProps.gap));
  if (rawProps.indent != null) p.style["--cms-drawer-indent"] = toCssSize(uiUnwrap(rawProps.indent));
  if (rawProps.padding != null) p.style["--cms-drawer-padding"] = toCssSize(uiUnwrap(rawProps.padding));
  if (rawProps.width != null) p.style.width = toCssSize(uiUnwrap(rawProps.width));
  if (rawProps.minHeight != null) p.style.minHeight = toCssSize(uiUnwrap(rawProps.minHeight));
  if (rawProps.maxHeight != null) p.style.maxHeight = toCssSize(uiUnwrap(rawProps.maxHeight));

  const drawerEl = _.div(
    p,
    ...(headerNodes.length ? headerNodes : []),
    _.div({ class: uiClass(["cms-drawer-body", rawProps.bodyClass]) }, ...finalBodyNodes),
    ...(footerNodes.length ? [_.div({ class: uiClass(["cms-drawer-footer", rawProps.footerClass]) }, ...footerNodes)] : [])
  );
  const drawerSet = drawerElsByKey.get(currentStateKey) || new Set();
  drawerSet.add(drawerEl);
  drawerElsByKey.set(currentStateKey, drawerSet);
  setDrawerOpen(drawerOpen, currentStateKey);
  drawerEl.isDrawerOpen = isDrawerOpen;
  drawerEl.openDrawer = openDrawer;
  drawerEl.closeDrawer = closeDrawer;
  drawerEl.toggleDrawer = toggleDrawer;
  drawerEl.setActiveItem = setActiveItem;
  setPropertyProps(drawerEl, rawProps);
  syncActiveClasses();
  return drawerEl;
};
if (JSswift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.Drawer = {
    signature: "UI.Drawer(props)",
    props: {
      items: "Array",
      header: "Node|Function|Array",
      footer: "Node|Function|Array",
      before: "Node|Function|Array",
      after: "Node|Function|Array",
      title: "String|Node|Function|Array",
      subtitle: "String|Node|Function|Array",
      eyebrow: "String|Node|Function|Array",
      icon: "String|Node|Function|Array",
      content: "Node|Function|Array",
      meta: "Node|Function|Array",
      actions: "Node|Function|Array",
      empty: "Node|Function|Array",
      emptyText: "string",
      stateKey: "string",
      closeOnSelect: "boolean",
      groupOpenIcon: "String|Node|Function|Array",
      groupCloseIcon: "String|Node|Function|Array",
      itemIconSize: "string|number",
      gap: "string|number",
      indent: "string|number",
      padding: "string|number",
      width: "string|number",
      minHeight: "string|number",
      maxHeight: "string|number",
      onSelect: "function(item, ctx, event)",
      sticky: "boolean",
      slots: "{ header?, body?, footer?, before?, after?, empty?, item?, itemLabel?, itemNote?, itemBadge?, itemAside?, itemContent?, group?, groupLabel?, groupNote?, groupBadge?, groupAside?, groupContent?, sectionLabel? }",
      class: "string",
      style: "object"
    },
    slots: {
      header: "Drawer header, full override",
      body: "Full body override",
      footer: "Drawer footer",
      before: "Content before the item list",
      after: "Content after the item list",
      empty: "Empty state when there is no content",
      item: "Full override for a simple item",
      itemLabel: "Item label (ctx: { item, label, note, badge, aside, content })",
      itemNote: "Item note/subtitle",
      itemBadge: "Item badge",
      itemAside: "Item aside/meta",
      itemContent: "Extra item content",
      group: "Full override for a group header (ctx includes toggle/isOpen)",
      groupLabel: "Group label",
      groupNote: "Group note",
      groupBadge: "Group badge",
      groupAside: "Group aside/meta",
      groupContent: "Extra group content",
      sectionLabel: "Label for section/heading items"
    },
    returns: "HTMLDivElement with openDrawer/closeDrawer/toggleDrawer/isDrawerOpen methods",
    description: "Structured, backward-compatible drawer with header/footer, groups, extended slots, empty state, and persistent state."
  };
}

UI.Page = (...args) => {
  const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };

  const isSectionNode = (node, name) => {
    return !!(node && node.nodeType === 1 && node.classList?.contains(`cms-page-${name}`));
  };
  const renderIconFallback = (value) => {
    if (value == null) return null;
    if (typeof value === "string") return UI.Icon({ name: value, size: rawProps.iconSize || rawProps.size || "xl" });
    return JSswift.ui.slot(value, { as: "icon" });
  };

  const ctx = {
    dense: !!uiUnwrap(rawProps.dense),
    flat: !!uiUnwrap(rawProps.flat),
    centered: !!uiUnwrap(rawProps.centered),
    narrow: !!uiUnwrap(rawProps.narrow)
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
      const host = _[inlineNames.has(name) ? "span" : "div"]({ class: `cms-page-slot-${name}` });
      JSswift.reactive.effect(() => {
        const nextValue = map(fallback(ctx));
        const normalized = flattenSlotValue(JSswift.ui.slot(nextValue));
        host.replaceChildren();
        if (Array.isArray(normalized)) normalized.forEach((item) => appendResolvedValue(host, item));
        else appendResolvedValue(host, normalized);
      }, `UI.Page:${name}`);
      return [host];
    }
    return renderSlotToArray(slots, name, ctx, map(fallback));
  };

  const defaultNodes = renderSlotToArray(slots, "default", ctx, children?.length ? children : []);
  const sectionNodes = {
    hero: [],
    header: [],
    body: [],
    footer: [],
    actions: []
  };
  const looseNodes = [];

  defaultNodes.forEach((node) => {
    if (isSectionNode(node, "hero")) sectionNodes.hero.push(node);
    else if (isSectionNode(node, "header")) sectionNodes.header.push(node);
    else if (isSectionNode(node, "body")) sectionNodes.body.push(node);
    else if (isSectionNode(node, "footer")) sectionNodes.footer.push(node);
    else if (isSectionNode(node, "actions")) sectionNodes.actions.push(node);
    else looseNodes.push(node);
  });

  const iconNodes = renderPropNodes("icon", rawProps.icon, renderIconFallback);
  const heroNodes = renderPropNodes("hero", rawProps.hero ?? rawProps.banner);
  const eyebrowNodes = renderPropNodes("eyebrow", rawProps.eyebrow ?? rawProps.kicker);
  const titleNodes = renderPropNodes("title", rawProps.title);
  const subtitleNodes = renderPropNodes("subtitle", rawProps.subtitle ?? rawProps.description);
  const headerNodes = renderPropNodes("header", rawProps.header);
  const asideNodes = renderPropNodes("aside", rawProps.aside);
  const bodyNodes = renderPropNodes("body", rawProps.body ?? rawProps.content);
  const footerNodes = renderPropNodes("footer", rawProps.footer);
  const actionsNodes = renderPropNodes("actions", rawProps.actions);

  const generatedHero = heroNodes.length
    ? _.div({ class: uiClass(["cms-page-hero", rawProps.heroClass]) }, ...heroNodes)
    : null;

  const hasStructuredHeader = iconNodes.length || eyebrowNodes.length || titleNodes.length || subtitleNodes.length || headerNodes.length || asideNodes.length;
  const generatedHeader = hasStructuredHeader
    ? _.div(
      { class: uiClass(["cms-page-header", rawProps.headerClass]) },
      _.div(
        { class: "cms-page-head" },
        iconNodes.length ? _.div({ class: uiClass(["cms-page-icon", rawProps.iconClass]) }, ...iconNodes) : null,
        _.div(
          { class: "cms-page-head-main" },
          eyebrowNodes.length ? _.div({ class: uiClass(["cms-page-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
          titleNodes.length ? _.div({ class: uiClass(["cms-page-title", rawProps.titleClass]) }, ...titleNodes) : null,
          subtitleNodes.length ? _.div({ class: uiClass(["cms-page-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
          headerNodes.length ? _.div({ class: uiClass(["cms-page-header-content", rawProps.headerContentClass]) }, ...headerNodes) : null
        ),
        asideNodes.length ? _.div({ class: uiClass(["cms-page-aside", rawProps.asideClass]) }, ...asideNodes) : null
      )
    )
    : null;

  const mergedBodyNodes = [...bodyNodes, ...looseNodes];
  const generatedBody = mergedBodyNodes.length
    ? _.div({ class: uiClass(["cms-page-body", rawProps.bodyClass]) }, ...mergedBodyNodes)
    : null;

  const mergedActionNodes = [...actionsNodes, ...sectionNodes.actions];
  const generatedFooter = (footerNodes.length || mergedActionNodes.length)
    ? _.div(
      { class: uiClass(["cms-page-footer", rawProps.footerClass]) },
      ...footerNodes,
      mergedActionNodes.length ? _.div({ class: "cms-page-actions" }, ...mergedActionNodes) : null
    )
    : null;

  const hasHero = !!(heroNodes.length || sectionNodes.hero.length);
  const hasHeader = !!(hasStructuredHeader || sectionNodes.header.length);
  const p = JSswift.omit(props, [
    "actions", "aside", "asideClass", "banner", "body", "bodyClass", "centered", "content",
    "dense", "description", "eyebrow", "eyebrowClass", "flat", "footer", "footerClass",
    "gap", "header", "headerClass", "headerContentClass", "headerGap", "hero", "heroClass",
    "heroPadding", "icon", "iconClass", "iconSize", "kicker", "maxWidth", "minHeight",
    "narrow", "padding", "size", "slots", "subtitle", "subtitleClass", "title", "titleClass"
  ]);
  p.class = uiClass([
    "cms-panel",
    "cms-page",
    uiWhen(rawProps.dense, "dense"),
    uiWhen(rawProps.flat, "cms-page-flat"),
    uiWhen(rawProps.centered, "cms-page-centered"),
    uiWhen(rawProps.narrow, "cms-page-narrow"),
    uiWhen(hasHero, "cms-page-has-hero"),
    uiWhen(hasHeader, "cms-page-has-header"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };

  if (rawProps.gap != null || uiIsReactive(rawProps.gap)) {
    p.style["--cms-page-gap"] = uiStyleValue(rawProps.gap, toCssSize);
  }
  if (rawProps.padding != null || uiIsReactive(rawProps.padding)) {
    p.style["--cms-page-padding"] = uiStyleValue(rawProps.padding, toCssSize);
  }
  if (rawProps.maxWidth != null || uiIsReactive(rawProps.maxWidth)) {
    p.style["--cms-page-max-width"] = uiStyleValue(rawProps.maxWidth, toCssSize);
  }
  if (rawProps.minHeight != null || uiIsReactive(rawProps.minHeight)) {
    p.style["--cms-page-min-height"] = uiStyleValue(rawProps.minHeight, toCssSize);
  }
  if (rawProps.headerGap != null || uiIsReactive(rawProps.headerGap)) {
    p.style["--cms-page-header-gap"] = uiStyleValue(rawProps.headerGap, toCssSize);
  }
  if (rawProps.heroPadding != null || uiIsReactive(rawProps.heroPadding)) {
    p.style["--cms-page-hero-padding"] = uiStyleValue(rawProps.heroPadding, toCssSize);
  }

  const el = _.div(
    p,
    generatedHero,
    ...sectionNodes.hero,
    generatedHeader,
    ...sectionNodes.header,
    generatedBody,
    ...sectionNodes.body,
    generatedFooter,
    ...sectionNodes.footer
  );

  setPropertyProps(el, rawProps);
  return el;
};
if (JSswift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.Page = {
    signature: "UI.Page(...children) | UI.Page(props, ...children)",
    props: {
      hero: "Node|Function|Array",
      icon: "String|Node|Function|Array",
      eyebrow: "String|Node|Function|Array",
      title: "String|Node|Function|Array",
      subtitle: "String|Node|Function|Array",
      header: "String|Node|Function|Array",
      aside: "Node|Function|Array",
      body: "Node|Function|Array",
      footer: "Node|Function|Array",
      actions: "Node|Function|Array",
      dense: "boolean",
      flat: "boolean",
      centered: "boolean",
      narrow: "boolean",
      gap: "string|number",
      padding: "string|number",
      maxWidth: "string|number",
      minHeight: "string|number",
      heroPadding: "string|number",
      headerGap: "string|number",
      slots: "{ hero?, icon?, eyebrow?, title?, subtitle?, header?, aside?, body?, footer?, actions?, default? }",
      class: "string",
      style: "object"
    },
    slots: {
      hero: "Top hero/banner area",
      icon: "Page icon/visual",
      eyebrow: "Eyebrow/kicker content",
      title: "Page title content",
      subtitle: "Page subtitle/description content",
      header: "Header support content under title",
      aside: "Top-right header content",
      body: "Structured body content",
      footer: "Footer meta/content",
      actions: "Footer actions content",
      default: "Fallback body content"
    },
    returns: "HTMLDivElement",
    description: "Structured page container with hero, header, body, footer, and configurable layout."
  };
}

UI.AppShell = (...args) => {
  const { props, children } = JSswift.uiNormalizeArgs(args);
  const slots = props.slots || {};
  const hasOwn = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);

  const noDrawer = uiUnwrap(props.noDrawer) === true || props.drawer === false;
  const reverse = uiUnwrap(props.reverse) === true;
  const stack = uiUnwrap(props.stack) === true;
  const currentStateKey = props.drawerStateKey ?? props.stateKey ?? drawerStateKey;

  if (currentStateKey) {
    drawerStateKey = currentStateKey;
    drawerOpen = readDrawerOpen(currentStateKey);
  }

  const shellCtx = {
    props,
    noDrawer,
    stateKey: currentStateKey,
    isDrawerOpen: () => readDrawerOpen(currentStateKey),
    openDrawer: () => setDrawerOpen(true, currentStateKey),
    closeDrawer: () => setDrawerOpen(false, currentStateKey),
    toggleDrawer: () => setDrawerOpen(!readDrawerOpen(currentStateKey), currentStateKey)
  };

  const headerProps = (props.headerProps && typeof props.headerProps === "object") ? { ...props.headerProps } : {};
  let headerFallback = props.header;
  if (!hasOwn(props, "header") && (
    Object.keys(headerProps).length ||
    hasOwn(props, "title") ||
    hasOwn(props, "subtitle") ||
    hasOwn(props, "left") ||
    hasOwn(props, "right")
  )) {
    if (!hasOwn(headerProps, "title") && hasOwn(props, "title")) headerProps.title = props.title;
    if (!hasOwn(headerProps, "subtitle") && hasOwn(props, "subtitle")) headerProps.subtitle = props.subtitle;
    if (!hasOwn(headerProps, "left") && hasOwn(props, "left")) headerProps.left = props.left;
    if (!hasOwn(headerProps, "right") && hasOwn(props, "right")) headerProps.right = props.right;
    if (!hasOwn(headerProps, "drawerStateKey")) headerProps.drawerStateKey = currentStateKey;
    if (noDrawer && !hasOwn(headerProps, "left")) headerProps.left = false;
    headerFallback = UI.Header(headerProps);
  }

  const drawerProps = (props.drawerProps && typeof props.drawerProps === "object") ? { ...props.drawerProps } : {};
  const drawerItems = hasOwn(props, "drawerItems") ? props.drawerItems : props.items;
  const drawerHeader = hasOwn(props, "drawerHeader") ? props.drawerHeader : undefined;
  let drawerFallback = props.drawer;
  if (!hasOwn(props, "drawer") && !noDrawer && (
    Object.keys(drawerProps).length ||
    drawerItems != null ||
    drawerHeader != null
  )) {
    if (!hasOwn(drawerProps, "items") && drawerItems != null) drawerProps.items = drawerItems;
    if (!hasOwn(drawerProps, "header") && drawerHeader != null) drawerProps.header = drawerHeader;
    if (!hasOwn(drawerProps, "stateKey")) drawerProps.stateKey = currentStateKey;
    drawerFallback = UI.Drawer(drawerProps);
  }

  const pageProps = (props.pageProps && typeof props.pageProps === "object") ? { ...props.pageProps } : {};
  const pageContentFallback = hasOwn(props, "content") ? props.content : children;
  const defaultPageContent = renderSlotToArray(slots, "default", shellCtx, pageContentFallback);
  let pageFallback = props.page;
  if (!hasOwn(props, "page") && (Object.keys(pageProps).length || defaultPageContent.length)) {
    pageFallback = UI.Page(pageProps, ...defaultPageContent);
  }

  const footerProps = (props.footerProps && typeof props.footerProps === "object") ? { ...props.footerProps } : {};
  const footerContent = hasOwn(props, "footerContent") ? props.footerContent : undefined;
  let footerFallback = props.footer;
  if (!hasOwn(props, "footer") && (Object.keys(footerProps).length || footerContent != null)) {
    footerFallback = UI.Footer(footerProps, ...renderSlotToArray(null, "default", shellCtx, footerContent));
  }

  const headerNodes = renderSlotToArray(slots, "header", shellCtx, headerFallback);
  const drawerNodes = noDrawer ? [] : renderSlotToArray(slots, "drawer", shellCtx, drawerFallback);
  const pageNodes = renderSlotToArray(slots, "page", shellCtx, pageFallback);
  const footerNodes = renderSlotToArray(slots, "footer", shellCtx, footerFallback);

  const cls = uiClass([
    "cms-app",
    "cms-app-shell",
    uiWhen(noDrawer, "no-drawer"),
    uiWhen(reverse, "is-reverse"),
    uiWhen(stack, "is-stack"),
    uiWhen(props.flush, "is-flush"),
    uiWhen(props.divider, "is-divider"),
    props.class
  ]);

  const p = JSswift.omit(props, [
    "header", "drawer", "page", "footer", "content",
    "title", "subtitle", "left", "right",
    "items", "drawerItems", "drawerHeader",
    "headerProps", "drawerProps", "pageProps", "footerProps",
    "footerContent",
    "noDrawer", "reverse", "stack", "flush", "divider",
    "drawerStateKey", "stateKey",
    "drawerWidth", "gap", "padding",
    "slots"
  ]);
  p.class = cls;
  p.style = { ...(props.style || {}) };

  const drawerWidth = uiStyleValue(props.drawerWidth, toCssSize);
  if (drawerWidth != null) p.style["--cms-app-shell-drawer-width"] = drawerWidth;
  const gap = uiStyleValue(props.gap, toCssSize);
  if (gap != null) p.style["--cms-app-shell-gap"] = gap;
  const padding = uiStyleValue(props.padding, toCssSize);
  if (padding != null) p.style["--cms-app-shell-padding"] = padding;

  const headerWrap = headerNodes.length
    ? _.div({ class: "cms-app-shell-header-slot" }, ...headerNodes)
    : null;
  const drawerWrap = drawerNodes.length
    ? _.div({ class: "cms-app-shell-drawer-slot" }, ...drawerNodes)
    : null;
  const pageWrap = pageNodes.length
    ? _.div({ class: "cms-app-shell-page-slot" }, ...pageNodes)
    : null;
  const footerWrap = footerNodes.length
    ? _.div({ class: "cms-app-shell-footer-slot" }, ...footerNodes)
    : null;

  const bodyNodes = reverse
    ? [pageWrap, drawerWrap]
    : [drawerWrap, pageWrap];

  const root = _.div(
    p,
    ...(headerWrap ? [headerWrap] : []),
    _.div({ class: "cms-app-shell-body" }, ...bodyNodes.filter(Boolean)),
    ...(footerWrap ? [footerWrap] : [])
  );

  root.openDrawer = shellCtx.openDrawer;
  root.closeDrawer = shellCtx.closeDrawer;
  root.toggleDrawer = shellCtx.toggleDrawer;
  root.isDrawerOpen = shellCtx.isDrawerOpen;
  root.header = headerWrap;
  root.drawer = drawerWrap;
  root.page = pageWrap;
  root.footer = footerWrap;

  setPropertyProps(root, props);
  return root;
};
if (JSswift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.AppShell = {
    signature: "UI.AppShell(...children) | UI.AppShell(props, ...children)",
    props: {
      header: "Node|Function|Array|false",
      drawer: "Node|Function|Array|false",
      page: "Node|Function|Array|false",
      footer: "Node|Function|Array|false",
      title: "string|Node|Function|Array",
      subtitle: "string|Node|Function|Array",
      left: "Node|Function|Array|false",
      right: "Node|Function|Array",
      items: "Array",
      drawerItems: "Array",
      drawerHeader: "Node|Function|Array",
      content: "Node|Function|Array",
      headerProps: "object",
      drawerProps: "object",
      pageProps: "object",
      footerProps: "object",
      footerContent: "Node|Function|Array",
      noDrawer: "boolean",
      reverse: "boolean",
      stack: "boolean",
      flush: "boolean",
      divider: "boolean",
      drawerStateKey: "string",
      stateKey: "string",
      drawerWidth: "number|string",
      gap: "number|string",
      padding: "number|string",
      slots: "{ header?, drawer?, page?, footer?, default? }",
      class: "string",
      style: "object"
    },
    slots: {
      header: "Header content",
      drawer: "Drawer content",
      page: "Page content",
      footer: "Footer content",
      default: "Fallback page content"
    },
    returns: "HTMLDivElement con methods openDrawer/closeDrawer/toggleDrawer/isDrawerOpen",
    description: "Shell applicazione composabile con shortcut per Header/Drawer/Page/Footer e gestione drawer."
  };
}

UI.Parallax = function Parallax(...args) {
  const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };

  if (props.color != null && props.textColor == null) props.textColor = props.color;
  delete props.color;
  applyCommonProps(props);

  const stateClass = uiComputed(rawProps.state, () => {
    const state = normalizeState(uiUnwrap(rawProps.state));
    return state ? `cms-state-${state}` : "";
  });
  const mapColorValue = (value) => {
    if (value == null || value === false || value === "") return "";
    const text = String(value);
    return isTokenCSS(text) ? `var(--cms-${text})` : text;
  };
  const getBackgroundImage = () => {
    const background = uiUnwrap(rawProps.background);
    if (background) return String(background);
    const source = uiUnwrap(rawProps.image) || uiUnwrap(rawProps.src) || "";
    if (!source) return "linear-gradient(120deg, #1b2c5a, #2f6d8f, #2a8f5c)";
    const text = String(source);
    if (/^url\(/i.test(text) || /gradient\(/i.test(text) || /^var\(/i.test(text)) return text;
    return `url(${text})`;
  };
  const getNumericValue = (value, fallback) => {
    const num = Number(uiUnwrap(value));
    return Number.isFinite(num) ? num : fallback;
  };

  const ctx = {
    speed: () => uiUnwrap(rawProps.speed) ?? 0.18,
    state: () => uiUnwrap(rawProps.state) || "",
    disabled: () => !!uiUnwrap(rawProps.disabled)
  };

  const badgeNodes = renderSlotToArray(slots, "badge", ctx, rawProps.badge);
  const backgroundNodes = renderSlotToArray(slots, "background", ctx, rawProps.backgroundContent);
  const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, rawProps.eyebrow ?? rawProps.kicker);
  const titleNodes = renderSlotToArray(slots, "title", ctx, rawProps.title);
  const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, rawProps.subtitle);
  const headerNodes = renderSlotToArray(slots, "header", ctx, rawProps.header);
  const asideNodes = renderSlotToArray(slots, "aside", ctx, rawProps.aside);
  const mediaNodes = renderSlotToArray(slots, "media", ctx, rawProps.media);
  const contentNodes = renderSlotToArray(slots, "content", ctx, rawProps.content ?? rawProps.body);
  const defaultNodes = renderSlotToArray(slots, "default", ctx, children?.length ? children : []);
  const footerNodes = renderSlotToArray(slots, "footer", ctx, rawProps.footer);
  const actionsNodes = renderSlotToArray(slots, "actions", ctx, rawProps.actions);
  const mergedBodyNodes = [...contentNodes, ...defaultNodes];

  const generatedBadge = badgeNodes.length
    ? _.div({ class: uiClass(["cms-parallax-badge", rawProps.badgeClass]) }, ...badgeNodes)
    : null;
  const hasStructuredHeader = eyebrowNodes.length || titleNodes.length || subtitleNodes.length || headerNodes.length || asideNodes.length;
  const generatedHeader = hasStructuredHeader
    ? _.div(
      { class: uiClass(["cms-parallax-header", rawProps.headerClass]) },
      _.div(
        { class: "cms-parallax-head" },
        _.div(
          { class: "cms-parallax-head-main" },
          eyebrowNodes.length ? _.div({ class: uiClass(["cms-parallax-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
          titleNodes.length ? _.div({ class: uiClass(["cms-parallax-title", rawProps.titleClass]) }, ...titleNodes) : null,
          subtitleNodes.length ? _.div({ class: uiClass(["cms-parallax-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
          headerNodes.length ? _.div({ class: uiClass(["cms-parallax-header-content", rawProps.headerContentClass]) }, ...headerNodes) : null
        ),
        asideNodes.length ? _.div({ class: uiClass(["cms-parallax-aside", rawProps.asideClass]) }, ...asideNodes) : null
      )
    )
    : null;
  const generatedMedia = mediaNodes.length
    ? _.div({ class: uiClass(["cms-parallax-media", rawProps.mediaClass]) }, ...mediaNodes)
    : null;
  const generatedBody = mergedBodyNodes.length
    ? _.div({ class: uiClass(["cms-parallax-body", rawProps.bodyClass]) }, ...mergedBodyNodes)
    : null;
  const generatedFooter = (footerNodes.length || actionsNodes.length)
    ? _.div(
      { class: uiClass(["cms-parallax-footer", rawProps.footerClass]) },
      footerNodes.length ? _.div({ class: "cms-parallax-footer-content" }, ...footerNodes) : null,
      actionsNodes.length ? _.div({ class: "cms-parallax-actions" }, ...actionsNodes) : null
    )
    : null;

  const wrapProps = JSswift.omit(props, [
    "actions", "align", "aside", "asideClass", "background", "backgroundContent", "backgroundContentClass",
    "badge", "badgeClass", "bgClass", "bgPosition", "bgRepeat", "bgSize", "body", "bodyClass", "color",
    "content", "contentClass", "contentMaxWidth", "disabled", "eyebrow", "eyebrowClass", "footer",
    "footerClass", "gap", "header", "headerClass", "headerContentClass", "height", "image", "imageAlt",
    "imageClass", "innerClass", "justify", "kicker", "maxOffset", "media", "mediaClass", "minHeight",
    "overlay", "padding", "slots", "speed", "src", "startTop", "state", "subtitle", "subtitleClass",
    "textColor", "title", "titleClass"
  ]);
  wrapProps.class = uiClass([
    "cms-parallax",
    "cms-singularity",
    stateClass,
    uiWhen(rawProps.disabled, "cms-parallax-static"),
    uiWhen(generatedBadge, "cms-parallax-has-badge"),
    uiWhen(hasStructuredHeader, "cms-parallax-has-header"),
    props.class
  ]);
  wrapProps.style = { ...(props.style || {}) };
  if (rawProps.height != null) wrapProps.style["--cms-parallax-height"] = uiStyleValue(rawProps.height, toCssSize);
  if (rawProps.minHeight != null) wrapProps.style["--cms-parallax-min-height"] = uiStyleValue(rawProps.minHeight, toCssSize);
  if (rawProps.padding != null) wrapProps.style["--cms-parallax-padding"] = uiStyleValue(rawProps.padding, toCssSize);
  if (rawProps.gap != null) wrapProps.style["--cms-parallax-gap"] = uiStyleValue(rawProps.gap, toCssSize);
  if (rawProps.contentMaxWidth != null) wrapProps.style["--cms-parallax-content-max-width"] = uiStyleValue(rawProps.contentMaxWidth, toCssSize);
  if (rawProps.justify != null) wrapProps.style["--cms-parallax-justify"] = uiStyleValue(rawProps.justify);
  if (rawProps.align != null) wrapProps.style["--cms-parallax-align"] = uiStyleValue(rawProps.align);
  if (rawProps.color != null) wrapProps.style["--cms-parallax-color"] = uiStyleValue(rawProps.color, mapColorValue);
  if (rawProps.overlay != null) wrapProps.style["--cms-parallax-overlay"] = uiStyleValue(rawProps.overlay);
  if (rawProps.bgPosition != null) wrapProps.style["--cms-parallax-position"] = uiStyleValue(rawProps.bgPosition);
  if (rawProps.bgSize != null) wrapProps.style["--cms-parallax-size"] = uiStyleValue(rawProps.bgSize);
  if (rawProps.bgRepeat != null) wrapProps.style["--cms-parallax-repeat"] = uiStyleValue(rawProps.bgRepeat);
  wrapProps.style["--cms-parallax-image"] = (uiIsReactive(rawProps.background) || uiIsReactive(rawProps.image) || uiIsReactive(rawProps.src))
    ? () => getBackgroundImage()
    : getBackgroundImage();

  const bg = _.div(
    { class: uiClass(["cms-parallax-bg", rawProps.bgClass]) },
    backgroundNodes.length
      ? _.div({ class: uiClass(["cms-parallax-bg-content", rawProps.backgroundContentClass]) }, ...backgroundNodes)
      : null
  );
  const content = _.div(
    { class: uiClass(["cms-parallax-content", rawProps.contentClass, rawProps.innerClass]) },
    generatedBadge,
    generatedHeader,
    generatedMedia,
    generatedBody,
    generatedFooter
  );

  const wrap = _.div(wrapProps, bg, content);

  let disposed = false;
  let ticking = false;
  let resizeObserver = null;

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    if (typeof window !== "undefined") {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    }
    resizeObserver?.disconnect?.();
    resizeObserver = null;
  };

  const update = () => {
    if (disposed) return;
    if (!wrap.isConnected) {
      cleanup();
      return;
    }
    if (uiUnwrap(rawProps.disabled)) {
      bg.style.transform = "translate3d(0, 0, 0)";
      wrap.style.setProperty("--cms-parallax-offset", "0px");
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const speed = getNumericValue(rawProps.speed, 0.18);
    const maxOffset = Math.abs(getNumericValue(rawProps.maxOffset, 96));
    const explicitStartTop = uiUnwrap(rawProps.startTop);
    const rawOffset = explicitStartTop != null && explicitStartTop !== ""
      ? (rect.top - getNumericValue(rawProps.startTop, 0)) * speed
      : (((typeof window !== "undefined" ? window.innerHeight || document.documentElement.clientHeight || 0 : 0) / 2) - (rect.top + (rect.height / 2))) * speed;
    const offset = maxOffset > 0 ? Math.max(-maxOffset, Math.min(maxOffset, rawOffset)) : rawOffset;
    const cssOffset = `${offset.toFixed(2)}px`;
    bg.style.transform = `translate3d(0, ${cssOffset}, 0)`;
    wrap.style.setProperty("--cms-parallax-offset", cssOffset);
  };

  function scheduleUpdate() {
    if (disposed || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => { scheduleUpdate(); });
      resizeObserver.observe(wrap);
    }
    requestAnimationFrame(() => { scheduleUpdate(); });
    setTimeout(() => { scheduleUpdate(); }, 90);
  }

  wrap.refresh = () => {
    scheduleUpdate();
    return wrap;
  };
  wrap.update = wrap.refresh;
  wrap.destroy = () => {
    cleanup();
    wrap.remove();
    return null;
  };
  wrap._dispose = cleanup;

  setPropertyProps(wrap, rawProps);
  return wrap;
};
if (JSswift.isDev?.()) {
  UI.meta = UI.meta || {};
  UI.meta.Parallax = {
    signature: "UI.Parallax(...children) | UI.Parallax(props, ...children)",
    props: {
      src: "string",
      image: "string",
      background: "string",
      backgroundContent: "Node|Function|Array",
      height: "string|number",
      minHeight: "string|number",
      speed: "number",
      maxOffset: "number",
      startTop: "number",
      state: "success|warning|danger|info|primary|secondary|dark|light|string",
      overlay: "string",
      color: "string",
      bgPosition: "string",
      bgSize: "string",
      bgRepeat: "string",
      padding: "string|number",
      gap: "string|number",
      justify: "string",
      align: "string",
      contentMaxWidth: "string|number",
      disabled: "boolean",
      badge: "Node|Function|Array",
      eyebrow: "String|Node|Function|Array",
      title: "String|Node|Function|Array",
      subtitle: "String|Node|Function|Array",
      header: "Node|Function|Array",
      aside: "Node|Function|Array",
      media: "Node|Function|Array",
      content: "Node|Function|Array",
      footer: "Node|Function|Array",
      actions: "Node|Function|Array",
      bgClass: "string",
      badgeClass: "string",
      headerClass: "string",
      bodyClass: "string",
      footerClass: "string",
      contentClass: "string",
      slots: "{ background?, badge?, eyebrow?, title?, subtitle?, header?, aside?, media?, content?, footer?, actions?, default? }",
      class: "string",
      style: "object"
    },
    slots: {
      background: "Decorative content inside the background layer",
      badge: "Meta badge/chip above the main content",
      eyebrow: "Eyebrow/kicker",
      title: "Main title",
      subtitle: "Subtitle or supporting text",
      header: "Additional header content",
      aside: "Header side area",
      media: "Media content or foreground card",
      content: "Main body",
      footer: "Informational footer",
      actions: "Actions area",
      default: "Fallback body content"
    },
    returns: "HTMLDivElement with refresh/update/destroy methods",
    description: "Standardized parallax hero/section with structured header, body, actions, slots, and minimal refresh API."
  };
}

// Example:
// _.Parallax({ src: "/assets/hero.jpg", height: "280px", speed: 0.2 }, _.h2("Hello"));

// -------------------------------
