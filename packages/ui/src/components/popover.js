

  UI.Popover = (...args) => {
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
    const getOptions = () => currentProps;
    const getStateClass = (opts) => {
      const value = uiUnwrap(opts.state ?? opts.color);
      if (!value) return "";
      return stateList.includes(value) ? value : String(value);
    };
    const getSizeClass = (opts) => {
      const value = uiUnwrap(opts.size);
      return (typeof value === "string" && sizeList.includes(value)) ? value : "";
    };
    const getAlignClass = (opts) => {
      const raw = String(uiUnwrap(opts.actionsAlign ?? opts.footerAlign ?? opts.alignActions ?? "end")).toLowerCase();
      if (["start", "left"].includes(raw)) return "start";
      if (["center", "middle"].includes(raw)) return "center";
      if (["between", "space-between"].includes(raw)) return "between";
      if (["stretch", "full"].includes(raw)) return "stretch";
      return "end";
    };
    const getPlacement = (opts) => String(uiUnwrap(opts.placement ?? opts.position ?? "bottom-start"));
    const getNumber = (value, fallback) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    };
    const getDelay = () => getNumber(getOptions().delay, 0);
    const getHideDelay = () => getNumber(getOptions().hideDelay, 120);
    const isClosable = (opts) => {
      const value = opts.closable ?? opts.dismissible ?? opts.closeButton;
      return value === true;
    };
    const getAnchor = (anchorOverride = null) => {
      if (anchorOverride) return anchorOverride;
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
      const iconFallback = opts.icon != null
        ? (typeof opts.icon === "string"
          ? UI.Icon({ name: opts.icon, size: opts.iconSize || "md" })
          : JSswift.ui.slot(opts.icon, { as: "icon" }))
        : null;
      const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, resolveRender(opts.eyebrow, ctx));
      const titleNodes = renderSlotToArray(slots, "title", ctx, resolveRender(opts.title ?? opts.heading ?? opts.label, ctx));
      const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, resolveRender(opts.subtitle ?? opts.description, ctx));
      const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
      const headerNodes = renderSlotToArray(slots, "header", ctx, resolveRender(opts.headerContent ?? opts.head ?? opts.header, ctx));
      const closeSlotNodes = isClosable(opts)
        ? renderSlotToArray(slots, "close", ctx, UI.Btn({
          class: "jss-dialog-close",
          size: "sm",
          outline: true,
          "aria-label": opts.closeLabel || "Chiudi popover",
          "data-popover-close": true
        }, UI.Icon({ name: opts.closeIcon || "#close", size: "sm" })))
        : [];

      let bodyRaw = opts.content ?? opts.body ?? opts.message ?? opts.text;
      if (bodyRaw == null && children && children.length) bodyRaw = children;
      let contentNodes = renderSlotToArray(slots, "content", ctx, resolveRender(bodyRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "body", ctx, resolveRender(bodyRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "default", ctx, resolveRender(bodyRaw, ctx));

      const footerRaw = resolveRender(opts.footer ?? opts.actions, ctx);
      let footerNodes = renderSlotToArray(slots, "footer", ctx, footerRaw);
      if (!footerNodes.length) footerNodes = renderSlotToArray(slots, "actions", ctx, footerRaw);

      let headerEl = null;
      if (headerNodes.length) {
        headerEl = _.div({ class: "jss-dialog-head jss-dialog-head-custom" }, ...headerNodes);
      } else if (eyebrowNodes.length || titleNodes.length || subtitleNodes.length || iconNodes.length || closeSlotNodes.length) {
        headerEl = _.div(
          { class: "jss-dialog-head" },
          iconNodes.length ? _.div({ class: "jss-dialog-icon" }, ...iconNodes) : null,
          _.div(
            { class: "jss-dialog-head-main" },
            eyebrowNodes.length ? _.div({ class: "jss-dialog-eyebrow" }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: "jss-dialog-title" }, ...titleNodes) : null,
            subtitleNodes.length ? _.div({ class: "jss-dialog-subtitle" }, ...subtitleNodes) : null
          ),
          closeSlotNodes.length ? _.div({ class: "jss-dialog-close-wrap" }, ...closeSlotNodes) : null
        );
      }

      const sections = [];
      if (headerEl) sections.push(headerEl);
      if (contentNodes.length) {
        sections.push(_.div({ class: uiClass(["jss-dialog-body", opts.bodyClass]) }, ...contentNodes));
      }
      if (footerNodes.length) {
        sections.push(_.div({
          class: uiClass([
            "jss-dialog-actions",
            `is-${getAlignClass(opts)}`,
            uiWhen(opts.stackActions, "is-stacked"),
            opts.actionsClass,
            opts.footerClass
          ])
        }, ...footerNodes));
      }
      if (!sections.length) {
        sections.push(_.div({ class: uiClass(["jss-dialog-body", opts.bodyClass]) }));
      }

      return _.div({
        class: uiClass([
          "jss-dialog-shell",
          "jss-popover-shell",
          uiWhen(!!headerEl, "has-head"),
          uiWhen(footerNodes.length > 0, "has-footer"),
          uiWhen(opts.divider !== false, "with-divider")
        ])
      }, ...sections);
    };
    const applyEntryOptions = (currentEntry) => {
      if (!currentEntry?.panel) return;
      const opts = getOptions();
      const stateClass = getStateClass(opts);
      const sizeClass = getSizeClass(opts);
      setTrackedClasses(currentEntry.panel, "_popoverClassTokens", [
        "jss-dialog",
        "jss-popover",
        "jss-singularity",
        "jss-clear-set",
        sizeClass ? `jss-dialog-${sizeClass}` : "",
        stateClass,
        stateClass ? `jss-state-${stateClass}` : "",
        uiUnwrap(opts.scrollable) ? "scrollable" : "",
        uiUnwrap(opts.stickyHeader) ? "sticky-head" : "",
        uiUnwrap(opts.stickyActions) ? "sticky-actions" : "",
        uiUnwrap(opts.borderless) ? "borderless" : "",
        ...splitClasses(opts.class),
        ...splitClasses(opts.panelClass)
      ]);
      setTrackedClasses(currentEntry.overlay, "_popoverOverlayClassTokens", [
        ...splitClasses(opts.overlayClass)
      ]);
      currentEntry.panel.dataset.placement = getPlacement(opts);
      setStyleValue(currentEntry.panel, "--jss-dialog-width", uiUnwrap(opts.width), toCssSize);
      setStyleValue(currentEntry.panel, "--jss-dialog-min-width", uiUnwrap(opts.minWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--jss-dialog-max-width", uiUnwrap(opts.maxWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--jss-dialog-max-height", uiUnwrap(opts.maxHeight), toCssSize);
      setStyleValue(currentEntry.panel, "--jss-dialog-body-max-height", uiUnwrap(opts.bodyMaxHeight ?? opts.contentMaxHeight), toCssSize);
      if (opts.style) Object.assign(currentEntry.panel.style, opts.style);
      setPropertyProps(currentEntry.panel, opts);
      currentEntry.panel.setAttribute("role", opts.role || "dialog");
      currentEntry.panel.setAttribute("aria-modal", opts.modal === true ? "true" : "false");
      if (opts.ariaLabel) currentEntry.panel.setAttribute("aria-label", opts.ariaLabel);
      else currentEntry.panel.removeAttribute("aria-label");
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
        applyEntryOptions(entry);
        renderOpenContent();
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
        applyEntryOptions(entry);
        renderOpenContent();
        return entry;
      }
      if (entry) close();
      lastActive = document.activeElement;
      const activeTriggers = parseTriggers(opts.trigger ?? opts.triggers ?? (hasOwn(opts, "open") ? "manual" : null));
      const allowHover = activeTriggers.has("hover");
      const allowFocus = activeTriggers.has("focus");
      let currentRef = null;
      entry = JSswift.overlay.open(() => buildContent(), {
        type: "popover",
        anchorEl: anchor,
        placement: getPlacement(opts),
        offsetX: opts.offsetX ?? 0,
        offsetY: opts.offsetY ?? opts.offset ?? 10,
        backdrop: opts.backdrop === true,
        lockScroll: opts.lockScroll === true,
        trapFocus: opts.trapFocus === true,
        autoFocus: opts.autoFocus === true,
        closeOnOutside: opts.closeOnOutside !== false,
        closeOnBackdrop: opts.closeOnBackdrop ?? opts.backdrop === true,
        closeOnEsc: opts.closeOnEsc !== false,
        className: uiClassStatic(["jss-dialog", "jss-popover"]),
        onClose: () => {
          currentRef?._popoverCleanup?.();
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
        if (!allowHover && !allowFocus) return;
        hide();
      };
      const onPanelClick = (e) => {
        const target = e.target;
        if (!target || !target.closest) return;
        if (target.closest("[data-popover-close]") || target.closest("[data-dialog-close]")) {
          close();
          return;
        }
        if (getOptions().closeOnSelect === true && target.closest("[data-popover-select]")) {
          close();
        }
      };
      current.panel.addEventListener("click", onPanelClick);
      if (allowHover || allowFocus) {
        current.panel.addEventListener("mouseenter", cancelHide);
        current.panel.addEventListener("mouseleave", scheduleHide);
        current.panel.addEventListener("focusin", cancelHide);
        current.panel.addEventListener("focusout", scheduleHide);
      }
      current._popoverCleanup = () => {
        current.panel?.removeEventListener("click", onPanelClick);
        current.panel?.removeEventListener("mouseenter", cancelHide);
        current.panel?.removeEventListener("mouseleave", scheduleHide);
        current.panel?.removeEventListener("focusin", cancelHide);
        current.panel?.removeEventListener("focusout", scheduleHide);
      };
      applyEntryOptions(current);
      overlayEnter(current);
      getOptions().onOpen?.(current);
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
          }, "UI.Popover:open");
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
