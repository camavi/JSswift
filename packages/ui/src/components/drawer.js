UI.Drawer = (...args) => {
  const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };
  applyCommonProps(props);
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
  const groupOpenIcon = rawProps.groupOpenIcon ?? null;
  const groupCloseIcon = rawProps.groupCloseIcon ?? null;

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
    return nodes.length ? [_.span({ class: uiClass(["jss-drawer-item-icon", side]) }, ...nodes)] : [];
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
        { class: uiClass(["jss-drawer-header", rawProps.headerClass]) },
        ...(icon.length ? [_.div({ class: "jss-drawer-header-icon" }, ...icon)] : []),
        _.div(
          { class: "jss-drawer-header-body" },
          ...(eyebrow.length ? [_.div({ class: "jss-drawer-header-eyebrow" }, ...eyebrow)] : []),
          ...(title.length ? [_.div({ class: "jss-drawer-header-title" }, ...title)] : []),
          ...(subtitle.length ? [_.div({ class: "jss-drawer-header-subtitle" }, ...subtitle)] : []),
          ...(meta.length ? [_.div({ class: "jss-drawer-header-meta" }, ...meta)] : []),
          ...(content.length ? [_.div({ class: "jss-drawer-header-content" }, ...content)] : []),
          ...(extra.length ? [_.div({ class: "jss-drawer-header-extra" }, ...extra)] : [])
        ),
        ...(actions.length ? [_.div({ class: "jss-drawer-header-actions" }, ...actions)] : [])
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
          { class: "jss-drawer-item-top" },
          _.div(
            { class: "jss-drawer-item-copy" },
            ...(labelNodes.length ? [_.div({ class: "jss-drawer-item-label" }, ...labelNodes)] : []),
            ...(noteNodes.length ? [_.div({ class: "jss-drawer-item-note" }, ...noteNodes)] : [])
          ),
          ...(badgeNodes.length || asideNodes.length
            ? [_.div(
              { class: "jss-drawer-item-meta" },
              ...(badgeNodes.length ? [_.div({ class: "jss-drawer-item-badge" }, ...badgeNodes)] : []),
              ...(asideNodes.length ? [_.div({ class: "jss-drawer-item-aside" }, ...asideNodes)] : [])
            )]
            : [])
        )
      );
    }
    if (contentNodes.length) mainChildren.push(_.div({ class: "jss-drawer-item-content" }, ...contentNodes));

    return [
      ...(extras.start || []),
      ...wrapIconNodes(itemCtx.iconLeft, "left", itemCtx),
      ...(mainChildren.length ? [_.div({ class: "jss-drawer-item-main" }, ...mainChildren)] : []),
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
          class: "jss-drawer-custom",
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
          class: uiClass(["jss-drawer-separator", it.class]),
          "data-level": String(level)
        });
      }

      if (sectionLike) {
        const sectionNodes = renderSlotToArray(slots, "sectionLabel", itemCtx, label || content);
        return _.div({
          class: uiClass(["jss-drawer-section-label", it.class]),
          "data-level": String(level)
        }, ...sectionNodes);
      }

      if (contentOnly) {
        const customNodes = renderSlotToArray(slots, "item", itemCtx, content ?? label);
        return _.div({
          class: uiClass(["jss-drawer-custom", tone ? `jss-drawer-tone-${tone}` : "", it.class]),
          style: it.style,
          "data-level": String(level)
        }, ...customNodes);
      }

      if (childItems.length) {
        const baseActiveInGroup = baseIsActive || hasActiveChildren(childItems, level + 1, path.concat(keyPart));
        const activeInGroup = baseActiveInGroup || isBranchActive(itemStateKey);
        let open = readGroupOpen(itemStateKey, !!uiUnwrap(it.expanded) || !!uiUnwrap(it.open) || activeInGroup);
        const toggleIconEl = _.span({ class: "jss-drawer-group-icon" });
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
          toggleIconEl.className = `jss-drawer-group-icon ${side}`;
          toggleIconEl.setAttribute("aria-hidden", "true");
          if (icon != null) iconNodes(icon, { ...groupCtx, as: "toggleIcon" }).forEach((node) => toggleIconEl.appendChild(node));
          else {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("viewBox", "0 0 20 20");
            svg.setAttribute("width", "18"); svg.setAttribute("height", "18");
            svg.setAttribute("fill", "none"); svg.setAttribute("focusable", "false");
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", "m7 4 6 6-6 6");
            path.setAttribute("stroke", "currentColor"); path.setAttribute("stroke-width", "1.6");
            path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round");
            svg.appendChild(path); toggleIconEl.appendChild(svg);
            toggleIconEl.classList.add("is-chevron");
          }
        };
        const toggleBtn = _.button({
          type: "button",
          class: uiClass([
            "jss-drawer-group-toggle",
            "jss-drawer-entry",
            open ? "open" : "",
            activeInGroup ? "active" : "",
            disabled ? "is-disabled" : "",
            tone ? `jss-drawer-tone-${tone}` : "",
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
        const groupItems = _.div({ class: "jss-drawer-group-items", id: `jss-drawer-group-${++uiDrawerGroupId}`, hidden: !open }, ...renderItems(childItems, level + 1, path.concat(keyPart)));
        toggleBtn.setAttribute("aria-controls", groupItems.id);
        const groupWrap = _.div({
          class: uiClass([
            "jss-drawer-group",
            open ? "open" : "",
            activeInGroup ? "active" : "",
            tone ? `jss-drawer-tone-${tone}` : ""
          ]),
          "data-level": String(level)
        }, ...(customGroupHeader.length ? customGroupHeader : [toggleBtn]), groupItems);
        const setOpen = (value) => {
          open = !!value;
          groupItems.hidden = !open;
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
          "jss-drawer-entry",
          isButtonItem ? "jss-drawer-btn" : "jss-drawer-link",
          isActive ? "active" : "",
          disabled ? "is-disabled" : "",
          tone ? `jss-drawer-tone-${tone}` : "",
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
          setActiveItem(itemStateKey);
          if (!href) e.preventDefault();
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
    ? (rawProps.empty ?? _.div({ class: uiClass(["jss-drawer-empty", rawProps.emptyClass]) }, rawProps.emptyText || "Nessun contenuto"))
    : _.div({ class: uiClass(["jss-drawer-empty", rawProps.emptyClass]) }, "Nessun contenuto");
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
    "jss-panel",
    "jss-drawer",
    "jss-singularity",
    drawerOpen ? "open" : "",
    uiWhen(rawProps.sticky, "sticky"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };
  if (rawProps.gap != null) p.style["--jss-drawer-gap"] = toCssSize(uiUnwrap(rawProps.gap));
  if (rawProps.indent != null) p.style["--jss-drawer-indent"] = toCssSize(uiUnwrap(rawProps.indent));
  if (rawProps.padding != null) p.style["--jss-drawer-padding"] = toCssSize(uiUnwrap(rawProps.padding));
  if (rawProps.width != null) p.style.width = toCssSize(uiUnwrap(rawProps.width));
  if (rawProps.minHeight != null) p.style.minHeight = toCssSize(uiUnwrap(rawProps.minHeight));
  if (rawProps.maxHeight != null) p.style.maxHeight = toCssSize(uiUnwrap(rawProps.maxHeight));

  const drawerEl = _.div(
    p,
    ...(headerNodes.length ? headerNodes : []),
    _.div({ class: uiClass(["jss-drawer-body", rawProps.bodyClass]) }, ...finalBodyNodes),
    ...(footerNodes.length ? [_.div({ class: uiClass(["jss-drawer-footer", rawProps.footerClass]) }, ...footerNodes)] : [])
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
