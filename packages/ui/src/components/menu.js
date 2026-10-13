  UI.Menu = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const stateList = ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"];
    const sizeList = ["xs", "sm", "md", "lg", "xl"];
    let currentProps = { ...props };
    let entry = null;
    let boundEl = null;
    let lastActive = null;
    let openTimer = null;
    let closeTimer = null;

    const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
    const resolveRender = (value, ctx) => typeof value === "function" ? value(ctx) : value;
    const splitClasses = (value) => String(value || "").split(/\s+/).filter(Boolean);
    const isPlainObject = (value) => value && typeof value === "object" && !value.nodeType && !Array.isArray(value) && !(value instanceof Function);
    const isAnchorLike = (value) => !!value && typeof value === "object" && (value.nodeType === 1 || typeof value.getBoundingClientRect === "function");
    const clearTimers = () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      openTimer = null;
      closeTimer = null;
    };
    const setTrackedClasses = (target, key, classes) => {
      if (!target) return;
      const prev = target[key] || [];
      if (prev.length) target.classList.remove(...prev);
      const next = (classes || []).filter(Boolean);
      if (next.length) target.classList.add(...next);
      target[key] = next;
    };
    const setStyleValue = (target, name, value, formatter = (v) => v) => {
      if (!target) return;
      if (value == null || value === "") {
        target.style.removeProperty(name);
        return;
      }
      target.style.setProperty(name, formatter(value));
    };
    const getOptions = () => currentProps || {};
    const getStateClass = (opts) => {
      const value = String(uiUnwrap(opts.state ?? opts.color) || "").toLowerCase();
      return stateList.includes(value) ? value : "";
    };
    const getSizeClass = (opts) => {
      const value = String(uiUnwrap(opts.size) || "").toLowerCase();
      return sizeList.includes(value) ? value : "";
    };
    const getPlacement = (opts) => String(uiUnwrap(opts.placement ?? opts.position ?? "bottom-start"));
    const getDelay = () => {
      const raw = uiUnwrap(getOptions().delay ?? getOptions().showDelay);
      const value = Number(raw);
      return Number.isFinite(value) ? Math.max(0, value) : 0;
    };
    const getHideDelay = () => {
      const raw = uiUnwrap(getOptions().hideDelay);
      const value = Number(raw);
      return Number.isFinite(value) ? Math.max(0, value) : 80;
    };
    const getAnchor = (fallback = null) => {
      if (fallback) return fallback;
      const opts = getOptions();
      return boundEl || uiUnwrap(opts.anchorEl ?? opts.triggerEl ?? opts.target ?? opts.anchor) || null;
    };
    const parseTriggers = (value) => {
      if (value == null || value === true) return new Set(["click"]);
      if (value === false) return new Set(["manual"]);
      const raw = Array.isArray(value) ? value : String(value).split(/[\s,|/]+/);
      const out = new Set();
      raw.forEach((item) => {
        const key = String(item || "").trim().toLowerCase();
        if (!key) return;
        if (key === "mouseenter" || key === "mouseover") out.add("hover");
        else if (key === "blur" || key === "focusin") out.add("focus");
        else if (key === "tap") out.add("click");
        else out.add(key);
      });
      return out.size ? out : new Set(["manual"]);
    };
    const parseOpenArgs = (arg1, arg2) => {
      let anchorEl = null;
      let nextProps = null;
      if (isAnchorLike(arg1)) {
        anchorEl = arg1;
        if (isPlainObject(arg2)) nextProps = arg2;
      } else if (isPlainObject(arg1)) {
        nextProps = arg1;
        const maybeAnchor = arg1.anchorEl ?? arg1.triggerEl ?? arg1.target ?? arg1.anchor;
        if (isAnchorLike(maybeAnchor)) anchorEl = maybeAnchor;
      } else if (arg1 != null) {
        anchorEl = arg1;
      }
      return { anchorEl, nextProps };
    };
    const getFocusableItems = (root = entry?.panel) => Array.from(root?.querySelectorAll?.(
      "[data-menu-item]:not([disabled]):not([tabindex='-1']), .jss-menu-item:not([disabled]):not([tabindex='-1']), [role='menuitem']:not([disabled]):not([tabindex='-1']), a[href]:not([tabindex='-1']), button:not([disabled]):not([tabindex='-1'])"
    ) || []).filter((el) => el.offsetParent !== null && el.getAttribute("aria-hidden") !== "true");
    const focusInitialItem = () => {
      if (uiUnwrap(getOptions().autoFocus) === false) return;
      setTimeout(() => {
        const items = getFocusableItems();
        if (!items.length) return;
        const active = items.find((el) => el.classList.contains("is-active") || el.classList.contains("is-selected") || el.classList.contains("is-checked"));
        (active || items[0]).focus();
      }, 0);
    };
    const buildIconNode = (value, ctx, size = "sm") => {
      const raw = resolveRender(value, ctx);
      if (raw == null) return [];
      if (typeof raw === "string") return [UI.Icon({ name: raw, size })];
      return slotToArray(raw, { ...ctx, as: "icon" });
    };
    const renderItemEntries = (source, ctx) => {
      const raw = resolveRender(source, ctx);
      if (raw == null || raw === false) return [];
      if (Array.isArray(raw)) return raw.flatMap((entryValue, index) => renderItemEntries(entryValue, { ...ctx, index }));
      if (typeof raw === "function") return renderItemEntries(raw(ctx), ctx);
      if (raw?.nodeType) return [raw];
      if (typeof raw === "string" || typeof raw === "number") {
        return renderItemEntries({ label: raw }, ctx);
      }
      if (!isPlainObject(raw)) {
        return slotToArray(raw, { ...ctx, as: "item" });
      }

      const kind = String(raw.type ?? raw.kind ?? "").toLowerCase();
      if (kind === "separator" || kind === "divider" || raw.separator === true || raw.divider === true) {
        return [_.div({ class: "jss-menu-divider", role: "separator" })];
      }

      const groupItems = raw.items ?? raw.children;
      if ((kind === "group" || kind === "section" || Array.isArray(groupItems)) && groupItems != null) {
        const groupCtx = { ...ctx, item: raw };
        const labelNodes = renderSlotToArray(slots, "groupLabel", groupCtx, resolveRender(raw.label ?? raw.title, groupCtx));
        const contentNodes = renderItemEntries(groupItems, groupCtx);
        if (!contentNodes.length) return [];
        return [_.div(
          { class: uiClass(["jss-menu-group", raw.class]) },
          labelNodes.length ? _.div({ class: "jss-menu-group-label" }, ...labelNodes) : null,
          _.div({ class: "jss-menu-group-items" }, ...contentNodes)
        )];
      }

      const itemCtx = {
        ...ctx,
        item: raw,
        close,
        dismiss: close,
        open,
        toggle,
        update,
        isOpen,
        entry: () => entry,
        anchorEl: getAnchor(),
        props: getOptions()
      };
      const disabled = !!uiUnwrap(raw.disabled);
      const checked = raw.checked == null ? null : !!uiUnwrap(raw.checked);
      const active = !!uiUnwrap(raw.active ?? raw.selected);
      const itemState = getStateClass(raw);
      const href = uiUnwrap(raw.href);
      const to = uiUnwrap(raw.to);
      const closeOnSelect = hasOwn(raw, "closeOnSelect")
        ? !!uiUnwrap(raw.closeOnSelect)
        : (raw.keepOpen === true ? false : (getOptions().closeOnSelect !== false));
      const ariaRole = raw.role || (checked != null ? "menuitemcheckbox" : "menuitem");
      const iconNodes = buildIconNode(raw.icon, itemCtx);
      const iconRightNodes = buildIconNode(raw.iconRight ?? raw.endIcon, itemCtx);
      const titleNodes = renderSlotToArray(slots, "itemTitle", itemCtx, resolveRender(raw.title ?? raw.label, itemCtx));
      const subtitleNodes = renderSlotToArray(slots, "itemSubtitle", itemCtx, resolveRender(raw.subtitle ?? raw.description, itemCtx));
      const shortcutNodes = renderSlotToArray(slots, "itemShortcut", itemCtx, resolveRender(raw.shortcut, itemCtx));
      const badgeNodes = renderSlotToArray(slots, "itemBadge", itemCtx, resolveRender(raw.badge, itemCtx));
      const customBodyNodes = renderSlotToArray(slots, "item", itemCtx, resolveRender(raw.content ?? raw.body ?? raw.render, itemCtx));
      const asideNodes = [
        ...badgeNodes,
        ...shortcutNodes,
        ...(checked === true && !iconRightNodes.length && !badgeNodes.length
          ? [_.span({ class: "jss-menu-entry-check" }, UI.Icon({ name: raw.checkedIcon || "check", size: "sm" }))]
          : []),
        ...iconRightNodes
      ];
      const entryClass = uiClass([
        "jss-menu-entry",
        "jss-menu-item",
        itemState ? `jss-state-${itemState}` : "",
        uiWhen(active, "is-active"),
        uiWhen(checked === true, "is-checked"),
        uiWhen(disabled, "is-disabled"),
        raw.class
      ]);
      const entryProps = {
        class: entryClass,
        role: ariaRole,
        tabIndex: disabled ? -1 : (raw.tabIndex ?? -1),
        "data-menu-item": true,
        "data-menu-select": closeOnSelect ? "true" : "false",
        "data-menu-close": raw.close === true ? "true" : null,
        "data-menu-keep-open": closeOnSelect ? null : "true",
        "aria-disabled": disabled ? "true" : null,
        "aria-checked": checked == null ? null : String(checked),
        title: raw.titleAttr ?? raw.tooltip ?? null,
        type: href ? null : "button",
        href: href || null,
        target: raw.target || null,
        rel: raw.rel || (raw.target === "_blank" ? "noopener noreferrer" : null),
        onClick: (e) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          getOptions().onItemClick?.(raw, itemCtx, e);
          const result = raw.onClick?.(itemCtx, e);
          if (e.defaultPrevented) return;
          if (to && JSswift.router?.navigate) {
            e.preventDefault();
            JSswift.router.navigate(to);
          }
          if (result === false) return;
          if (closeOnSelect) close();
        }
      };
      if (raw.attrs && typeof raw.attrs === "object") Object.assign(entryProps, raw.attrs);

      const Tag = href ? _.a : _.button;
      const bodyNodes = customBodyNodes.length
        ? customBodyNodes
        : [
          titleNodes.length ? _.div({ class: "jss-menu-entry-title" }, ...titleNodes) : null,
          subtitleNodes.length ? _.div({ class: "jss-menu-entry-subtitle" }, ...subtitleNodes) : null
        ].filter(Boolean);

      return [Tag(
        entryProps,
        iconNodes.length ? _.span({ class: "jss-menu-entry-icon" }, ...iconNodes) : null,
        _.span(
          { class: "jss-menu-entry-main" },
          ...bodyNodes
        ),
        asideNodes.length ? _.span({ class: "jss-menu-entry-aside" }, ...asideNodes) : null
      )];
    };
    const buildContent = () => {
      const opts = getOptions();
      const ctx = {
        close,
        dismiss: close,
        open,
        toggle,
        update,
        isOpen,
        entry: () => entry,
        anchorEl: getAnchor(),
        props: opts
      };
      const iconNodes = buildIconNode(opts.icon, ctx, opts.iconSize || "md");
      const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, resolveRender(opts.eyebrow, ctx));
      const titleNodes = renderSlotToArray(slots, "title", ctx, resolveRender(opts.title ?? opts.heading ?? opts.label, ctx));
      const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, resolveRender(opts.subtitle ?? opts.description, ctx));
      const beforeNodes = renderSlotToArray(slots, "before", ctx, resolveRender(opts.before, ctx));
      const headerNodes = renderSlotToArray(slots, "header", ctx, resolveRender(opts.header, ctx));
      const afterNodes = renderSlotToArray(slots, "after", ctx, resolveRender(opts.after, ctx));
      const footerNodes = renderSlotToArray(slots, "footer", ctx, resolveRender(opts.footer, ctx));
      const statusNodes = renderSlotToArray(slots, "status", ctx, resolveRender(opts.status, ctx));

      let contentRaw = opts.content ?? opts.body;
      if (contentRaw == null && children && children.length) contentRaw = children;
      let contentNodes = renderSlotToArray(slots, "content", ctx, resolveRender(contentRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "body", ctx, resolveRender(contentRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "default", ctx, resolveRender(contentRaw, ctx));

      const itemNodes = renderItemEntries(opts.items ?? opts.actionsList ?? opts.entries, ctx);
      const emptyNodes = !itemNodes.length
        ? renderSlotToArray(slots, "empty", ctx, resolveRender(opts.empty ?? opts.emptyText, ctx))
        : [];

      let headerEl = null;
      if (headerNodes.length) {
        headerEl = _.div({ class: uiClass(["jss-menu-head", "jss-menu-head-custom", opts.headerClass]) }, ...headerNodes);
      } else if (iconNodes.length || eyebrowNodes.length || titleNodes.length || subtitleNodes.length) {
        headerEl = _.div(
          { class: uiClass(["jss-menu-head", opts.headerClass]) },
          iconNodes.length ? _.div({ class: "jss-menu-head-icon" }, ...iconNodes) : null,
          _.div(
            { class: "jss-menu-head-main" },
            eyebrowNodes.length ? _.div({ class: "jss-menu-eyebrow" }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: "jss-menu-title" }, ...titleNodes) : null,
            subtitleNodes.length ? _.div({ class: "jss-menu-subtitle" }, ...subtitleNodes) : null
          )
        );
      }

      return _.div(
        {
          class: uiClass([
            "jss-menu",
            "jss-menu-shell",
            uiWhen(opts.dense, "dense"),
            uiWhen(itemNodes.length > 0, "has-items"),
            uiWhen(footerNodes.length > 0 || statusNodes.length > 0, "has-footer")
          ]),
          role: opts.role || "menu",
          "aria-label": opts.ariaLabel || null
        },
        beforeNodes.length ? _.div({ class: "jss-menu-before" }, ...beforeNodes) : null,
        headerEl,
        contentNodes.length ? _.div({ class: uiClass(["jss-menu-content", opts.contentClass]) }, ...contentNodes) : null,
        itemNodes.length ? _.div({ class: uiClass(["jss-menu-items", opts.itemsClass]) }, ...itemNodes) : null,
        (!itemNodes.length && emptyNodes.length) ? _.div({ class: "jss-menu-empty" }, ...emptyNodes) : null,
        afterNodes.length ? _.div({ class: "jss-menu-after" }, ...afterNodes) : null,
        (statusNodes.length || footerNodes.length)
          ? _.div(
            { class: uiClass(["jss-menu-footer", opts.footerClass]) },
            statusNodes.length ? _.div({ class: "jss-menu-status" }, ...statusNodes) : null,
            footerNodes.length ? _.div({ class: "jss-menu-footer-actions" }, ...footerNodes) : null
          )
          : null
      );
    };
    const applyEntryOptions = (currentEntry) => {
      if (!currentEntry?.panel) return;
      const opts = getOptions();
      const stateClass = getStateClass(opts);
      const sizeClass = getSizeClass(opts);
      setTrackedClasses(currentEntry.panel, "_menuClassTokens", [
        "jss-menu-panel",
        "jss-clear-set",
        "jss-singularity",
        sizeClass ? `jss-menu-${sizeClass}` : "",
        stateClass ? `jss-state-${stateClass}` : "",
        uiUnwrap(opts.outline) ? "outline" : "",
        ...splitClasses(opts.class),
        ...splitClasses(opts.panelClass)
      ]);
      setTrackedClasses(currentEntry.overlay, "_menuOverlayClassTokens", [
        ...splitClasses(opts.overlayClass)
      ]);
      currentEntry.panel.dataset.placement = getPlacement(opts);
      setStyleValue(currentEntry.panel, "--jss-menu-width", uiUnwrap(opts.width), toCssSize);
      setStyleValue(currentEntry.panel, "--jss-menu-min-width", uiUnwrap(opts.minWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--jss-menu-max-width", uiUnwrap(opts.maxWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--jss-menu-max-height", uiUnwrap(opts.maxHeight), toCssSize);
      setStyleValue(currentEntry.panel, "--jss-menu-body-max-height", uiUnwrap(opts.bodyMaxHeight ?? opts.contentMaxHeight), toCssSize);
      if (opts.style) Object.assign(currentEntry.panel.style, opts.style);
      if (opts.panelStyle) Object.assign(currentEntry.panel.style, opts.panelStyle);
      setPropertyProps(currentEntry.panel, opts);
    };
    const renderOpenContent = () => {
      if (!entry?.panel) return;
      entry.panel.replaceChildren(buildContent());
    };
    const close = () => {
      clearTimers();
      if (!entry) return;
      const toClose = entry;
      entry = null;
      overlayLeave(toClose, () => JSswift.overlay.close(toClose.id));
    };
    const update = (nextProps = {}) => {
      if (nextProps && typeof nextProps === "object") currentProps = { ...currentProps, ...nextProps };
      if (entry) {
        const opts = getOptions();
        applyEntryOptions(entry);
        renderOpenContent();
        entry.reposition?.({
          anchorEl: entry._anchorEl,
          placement: getPlacement(opts),
          offsetX: opts.offsetX ?? 0,
          offsetY: opts.offsetY ?? opts.offset ?? 8
        });
        focusInitialItem();
      }
      return api;
    };
    const open = (arg1 = null, arg2 = null) => {
      clearTimers();
      const { anchorEl, nextProps } = parseOpenArgs(arg1, arg2);
      if (nextProps) currentProps = { ...currentProps, ...nextProps };
      const opts = getOptions();
      const anchor = getAnchor(anchorEl);
      if (!anchor || uiUnwrap(opts.disabled)) return null;
      if (entry && entry._anchorEl === anchor) {
        const nextOpts = getOptions();
        applyEntryOptions(entry);
        renderOpenContent();
        entry.reposition?.({
          anchorEl: entry._anchorEl,
          placement: getPlacement(nextOpts),
          offsetX: nextOpts.offsetX ?? 0,
          offsetY: nextOpts.offsetY ?? nextOpts.offset ?? 8
        });
        focusInitialItem();
        return entry;
      }
      if (entry) close();
      lastActive = document.activeElement;
      let currentRef = null;
      entry = JSswift.overlay.open(() => buildContent(), {
        type: "menu",
        anchorEl: anchor,
        placement: getPlacement(opts),
        offsetX: opts.offsetX ?? 0,
        offsetY: opts.offsetY ?? opts.offset ?? 8,
        backdrop: opts.backdrop === true,
        lockScroll: opts.lockScroll === true,
        trapFocus: opts.trapFocus === true,
        autoFocus: false,
        closeOnOutside: opts.closeOnOutside !== false,
        closeOnBackdrop: opts.closeOnBackdrop ?? opts.backdrop === true,
        closeOnEsc: opts.closeOnEsc !== false,
        className: uiClassStatic(["jss-menu-panel"]),
        onClose: () => {
          currentRef?._menuCleanup?.();
          if (entry === currentRef) entry = null;
          getOptions().onClose?.(currentRef);
          if (getOptions().returnFocus !== false && lastActive && typeof lastActive.focus === "function") {
            setTimeout(() => lastActive.focus({ preventScroll: true }), 0);
          }
        }
      });
      if (!entry?.panel) return entry;
      const current = entry;
      currentRef = current;
      current._anchorEl = anchor;
      const cancelHide = () => {
        clearTimeout(closeTimer);
        closeTimer = null;
      };
      const scheduleHide = () => {
        hide();
      };
      const onPanelClick = (e) => {
        const target = e.target;
        if (!target || !target.closest) return;
        if (target.closest("[data-menu-close]")) {
          close();
          return;
        }
        if (getOptions().closeOnSelect === false) return;
        const selected = target.closest("[data-menu-item], [data-menu-select], .jss-menu-item, [role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio'], a[href], button:not([disabled])");
        if (!selected) return;
        if (selected.closest("[data-menu-keep-open]")) return;
        if (selected.getAttribute("data-menu-select") === "false") return;
        close();
      };
      const onPanelKeydown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
          return;
        }
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
        const items = getFocusableItems(current.panel);
        if (!items.length) return;
        e.preventDefault();
        const activeIndex = items.indexOf(document.activeElement);
        if (e.key === "Home") {
          items[0].focus();
          return;
        }
        if (e.key === "End") {
          items[items.length - 1].focus();
          return;
        }
        const dir = e.key === "ArrowDown" ? 1 : -1;
        const next = activeIndex < 0
          ? (dir > 0 ? 0 : items.length - 1)
          : (activeIndex + dir + items.length) % items.length;
        items[next].focus();
      };
      current.panel.addEventListener("click", onPanelClick);
      current.panel.addEventListener("keydown", onPanelKeydown);
      const activeTriggers = parseTriggers(opts.trigger ?? opts.triggers ?? (hasOwn(opts, "open") ? "manual" : null));
      const allowHover = activeTriggers.has("hover");
      const allowFocus = activeTriggers.has("focus");
      if (allowHover || allowFocus) {
        current.panel.addEventListener("mouseenter", cancelHide);
        current.panel.addEventListener("mouseleave", scheduleHide);
        current.panel.addEventListener("focusin", cancelHide);
        current.panel.addEventListener("focusout", scheduleHide);
      }
      current._menuCleanup = () => {
        current.panel?.removeEventListener("click", onPanelClick);
        current.panel?.removeEventListener("keydown", onPanelKeydown);
        current.panel?.removeEventListener("mouseenter", cancelHide);
        current.panel?.removeEventListener("mouseleave", scheduleHide);
        current.panel?.removeEventListener("focusin", cancelHide);
        current.panel?.removeEventListener("focusout", scheduleHide);
      };
      applyEntryOptions(current);
      current.reposition?.({
        anchorEl: anchor,
        placement: getPlacement(opts),
        offsetX: opts.offsetX ?? 0,
        offsetY: opts.offsetY ?? opts.offset ?? 8
      });
      overlayEnter(current);
      getOptions().onOpen?.(current);
      focusInitialItem();
      return current;
    };
    const show = (anchorEl, nextProps = null) => {
      clearTimeout(closeTimer);
      closeTimer = null;
      clearTimeout(openTimer);
      openTimer = setTimeout(() => open(anchorEl, nextProps), getDelay());
    };
    const hide = (immediate = false) => {
      clearTimeout(openTimer);
      openTimer = null;
      if (!entry) return;
      clearTimeout(closeTimer);
      if (immediate) {
        close();
        return;
      }
      closeTimer = setTimeout(() => close(), getHideDelay());
    };
    const toggle = (arg1 = null, arg2 = null) => isOpen() ? (close(), null) : open(arg1, arg2);
    const isOpen = () => !!entry;
    const bind = (el) => {
      if (!el) return () => { };
      boundEl = el;
      const opts = getOptions();
      const triggers = parseTriggers(opts.trigger ?? opts.triggers ?? (hasOwn(opts, "open") ? "manual" : null));
      const allowHover = triggers.has("hover");
      const allowFocus = triggers.has("focus");
      const allowClick = triggers.has("click");
      const isManual = triggers.has("manual") || (!allowHover && !allowFocus && !allowClick);
      const cleanups = [];
      const cleanup = () => {
        clearTimers();
        cleanups.forEach((fn) => fn());
        if (boundEl === el) boundEl = null;
      };
      if (hasOwn(opts, "open")) {
        if (uiIsReactive(opts.open)) {
          JSswift.reactive.effect(() => {
            if (!boundEl) return;
            if (uiUnwrap(getOptions().open)) open(boundEl);
            else hide(true);
          }, "UI.Menu:open");
        } else if (opts.open === true) {
          open(el);
        } else if (opts.open === false) {
          hide(true);
        }
        return cleanup;
      }
      if (isManual || uiUnwrap(opts.disabled)) return cleanup;
      if (allowHover) {
        const onEnter = () => show(el);
        const onLeave = () => hide();
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          el.removeEventListener("mouseenter", onEnter);
          el.removeEventListener("mouseleave", onLeave);
        });
      }
      if (allowFocus) {
        const onFocus = () => show(el);
        const onBlur = () => hide();
        el.addEventListener("focus", onFocus);
        el.addEventListener("blur", onBlur);
        cleanups.push(() => {
          el.removeEventListener("focus", onFocus);
          el.removeEventListener("blur", onBlur);
        });
      }
      if (allowClick) {
        const onClick = (e) => {
          getOptions().onTriggerClick?.(e);
          if (e.defaultPrevented) return;
          toggle(el);
        };
        el.addEventListener("click", onClick);
        cleanups.push(() => el.removeEventListener("click", onClick));
      }
      return cleanup;
    };
    const api = {
      open,
      close,
      show,
      hide,
      toggle,
      update,
      bind,
      isOpen,
      entry: () => entry,
      props: () => ({ ...currentProps })
    };

    return api;
  };
