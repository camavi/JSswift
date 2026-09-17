  UI.Dialog = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const stateList = ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"];
    const sizeList = ["xs", "sm", "md", "lg", "xl", "full"];
    let currentProps = { ...props };
    let entry = null;
    let lastActive = null;
    const resolveRender = (value, ctx) => typeof value === "function" ? value(ctx) : value;
    const splitClasses = (value) => String(value || "").split(/\s+/).filter(Boolean);
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
    const fullscreenViewportSize = () => {
      const vv = window.visualViewport;
      const left = Math.max(0, Math.round(vv?.offsetLeft ?? 0));
      const top = Math.max(0, Math.round(vv?.offsetTop ?? 0));
      const width = Math.max(0, Math.round(vv?.width ?? window.innerWidth ?? 0));
      const height = Math.max(0, Math.round(vv?.height ?? window.innerHeight ?? 0));
      return { left, top, width, height };
    };
    const syncFullscreenViewport = (currentEntry) => {
      if (!currentEntry?.panel) return;
      const { left, top, width, height } = fullscreenViewportSize();
      setStyleValue(currentEntry.panel, "position", "fixed");
      setStyleValue(currentEntry.panel, "inset", 0, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "top", top, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "left", left, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "right", "auto");
      setStyleValue(currentEntry.panel, "bottom", "auto");
      setStyleValue(currentEntry.panel, "width", width, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "height", height, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "min-height", height, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "max-width", width, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "max-height", height, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "min-width", 0, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "margin", 0, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "box-sizing", "border-box");
      setStyleValue(currentEntry.panel, "border-width", 0, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "border-radius", 0, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "transform", "none");
      setStyleValue(currentEntry.panel, "overflow", "hidden");
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-left", left, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-top", top, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-width", width, (v) => `${v}px`);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-height", height, (v) => `${v}px`);
    };
    const clearFullscreenViewport = (currentEntry) => {
      if (!currentEntry?.panel) return;
      setStyleValue(currentEntry.panel, "position", null);
      setStyleValue(currentEntry.panel, "inset", null);
      setStyleValue(currentEntry.panel, "top", null);
      setStyleValue(currentEntry.panel, "left", null);
      setStyleValue(currentEntry.panel, "right", null);
      setStyleValue(currentEntry.panel, "bottom", null);
      setStyleValue(currentEntry.panel, "width", null);
      setStyleValue(currentEntry.panel, "height", null);
      setStyleValue(currentEntry.panel, "min-height", null);
      setStyleValue(currentEntry.panel, "max-width", null);
      setStyleValue(currentEntry.panel, "max-height", null);
      setStyleValue(currentEntry.panel, "min-width", null);
      setStyleValue(currentEntry.panel, "margin", null);
      setStyleValue(currentEntry.panel, "box-sizing", null);
      setStyleValue(currentEntry.panel, "border-width", null);
      setStyleValue(currentEntry.panel, "border-radius", null);
      setStyleValue(currentEntry.panel, "transform", null);
      setStyleValue(currentEntry.panel, "overflow", null);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-left", null);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-top", null);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-width", null);
      setStyleValue(currentEntry.panel, "--cms-dialog-fullscreen-height", null);
    };
    const ensureFullscreenViewportTracking = (currentEntry, enabled) => {
      if (!currentEntry) return;
      currentEntry._dialogViewportCleanup?.();
      currentEntry._dialogViewportCleanup = null;
      if (!enabled) {
        clearFullscreenViewport(currentEntry);
        return;
      }
      let frameId = null;
      const raf = globalThis.requestAnimationFrame || ((fn) => setTimeout(() => fn(Date.now()), 0));
      const caf = globalThis.cancelAnimationFrame || clearTimeout;
      const sync = () => syncFullscreenViewport(currentEntry);
      const scheduleSync = () => {
        if (frameId != null) caf(frameId);
        frameId = raf(() => {
          frameId = null;
          sync();
        });
      };
      sync();
      scheduleSync();
      window.addEventListener("resize", sync);
      window.addEventListener("orientationchange", scheduleSync);
      window.visualViewport?.addEventListener?.("resize", sync);
      window.visualViewport?.addEventListener?.("scroll", scheduleSync);
      currentEntry._dialogViewportCleanup = () => {
        if (frameId != null) {
          caf(frameId);
          frameId = null;
        }
        window.removeEventListener("resize", sync);
        window.removeEventListener("orientationchange", scheduleSync);
        window.visualViewport?.removeEventListener?.("resize", sync);
        window.visualViewport?.removeEventListener?.("scroll", scheduleSync);
      };
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
    const getVerticalAlignClass = (opts) => {
      const raw = String(uiUnwrap(opts.align ?? opts.verticalAlign ?? opts.position ?? "center")).toLowerCase();
      if (["top", "start", "flex-start"].includes(raw)) return "cms-dialog-align-top";
      if (["bottom", "end", "flex-end"].includes(raw)) return "cms-dialog-align-bottom";
      return "";
    };
    const isClosable = (opts) => {
      const value = opts.closable ?? opts.dismissible ?? opts.closeButton;
      return value !== false;
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
        props: opts
      };
      const iconFallback = opts.icon != null
        ? (typeof opts.icon === "string"
          ? UI.Icon({ name: opts.icon, size: opts.iconSize || "md" })
          : JSswift.ui.slot(opts.icon, { as: "icon" }))
        : null;
      const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, resolveRender(opts.eyebrow, ctx));
      const titleNodes = renderSlotToArray(slots, "title", ctx, resolveRender(opts.title ?? opts.heading ?? opts.header, ctx));
      const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, resolveRender(opts.subtitle ?? opts.description, ctx));
      const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
      const customHeaderNodes = renderSlotToArray(slots, "header", ctx, resolveRender(opts.headerContent ?? opts.head, ctx));
      const closeSlotNodes = isClosable(opts)
        ? renderSlotToArray(slots, "close", ctx, UI.Btn({
          class: "cms-dialog-close",
          size: "sm",
          outline: true,
          "aria-label": opts.closeLabel || "Chiudi dialog",
          "data-dialog-close": true
        }, UI.Icon({ name: opts.closeIcon || "close", size: "sm" })))
        : [];
      const bodyRaw = opts.content ?? opts.body ?? opts.message ?? (children && children.length ? children : null);
      let contentNodes = renderSlotToArray(slots, "content", ctx, resolveRender(bodyRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "body", ctx, resolveRender(bodyRaw, ctx));
      if (!contentNodes.length) contentNodes = renderSlotToArray(slots, "default", ctx, resolveRender(bodyRaw, ctx));
      const footerRaw = resolveRender(opts.footer ?? opts.actions, ctx);
      let footerNodes = renderSlotToArray(slots, "footer", ctx, footerRaw);
      if (!footerNodes.length) footerNodes = renderSlotToArray(slots, "actions", ctx, footerRaw);

      let headerEl = null;
      if (customHeaderNodes.length) {
        headerEl = _.div({ class: "cms-dialog-head cms-dialog-head-custom" }, ...customHeaderNodes);
      } else if (eyebrowNodes.length || titleNodes.length || subtitleNodes.length || iconNodes.length || closeSlotNodes.length) {
        headerEl = _.div(
          { class: "cms-dialog-head" },
          iconNodes.length ? _.div({ class: "cms-dialog-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-dialog-head-main" },
            eyebrowNodes.length ? _.div({ class: "cms-dialog-eyebrow" }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: "cms-dialog-title" }, ...titleNodes) : null,
            subtitleNodes.length ? _.div({ class: "cms-dialog-subtitle" }, ...subtitleNodes) : null
          ),
          closeSlotNodes.length ? _.div({ class: "cms-dialog-close-wrap" }, ...closeSlotNodes) : null
        );
      }

      const bodyEl = _.div(
        { class: uiClass(["cms-dialog-body", opts.bodyClass]) },
        ...contentNodes
      );
      const footerEl = footerNodes.length
        ? _.div({
          class: uiClass([
            "cms-dialog-actions",
            `is-${getAlignClass(opts)}`,
            uiWhen(opts.stackActions, "is-stacked"),
            opts.actionsClass,
            opts.footerClass
          ])
        }, ...footerNodes)
        : null;

      return _.div({
        class: uiClass([
          "cms-dialog-shell",
          uiWhen(!!headerEl, "has-head"),
          uiWhen(!!footerEl, "has-footer"),
          uiWhen(opts.divider !== false, "with-divider")
        ])
      }, ...[headerEl, bodyEl, footerEl].filter(Boolean));
    };
    const applyEntryOptions = (currentEntry) => {
      if (!currentEntry?.panel) return;
      const opts = getOptions();
      const stateClass = getStateClass(opts);
      const sizeClass = getSizeClass(opts);
      setTrackedClasses(currentEntry.panel, "_dialogClassTokens", [
        "cms-dialog",
        "cms-singularity",
        "cms-clear-set",
        sizeClass ? `cms-dialog-${sizeClass}` : "",
        stateClass,
        stateClass ? `cms-state-${stateClass}` : "",
        uiUnwrap(opts.fullscreen) ? "fullscreen" : "",
        uiUnwrap(opts.scrollable) ? "scrollable" : "",
        uiUnwrap(opts.stickyHeader) ? "sticky-head" : "",
        uiUnwrap(opts.stickyActions) ? "sticky-actions" : "",
        uiUnwrap(opts.borderless) ? "borderless" : "",
        ...splitClasses(opts.class),
        ...splitClasses(opts.panelClass)
      ]);
      setTrackedClasses(currentEntry.overlay, "_dialogOverlayClassTokens", [
        getVerticalAlignClass(opts),
        uiUnwrap(opts.backdropBlur) ? "cms-dialog-overlay-blur" : "",
        ...splitClasses(opts.overlayClass)
      ]);
      setStyleValue(currentEntry.panel, "--cms-dialog-width", uiUnwrap(opts.width), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-min-width", uiUnwrap(opts.minWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-max-width", uiUnwrap(opts.maxWidth), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-max-height", uiUnwrap(opts.maxHeight), toCssSize);
      setStyleValue(currentEntry.panel, "--cms-dialog-body-max-height", uiUnwrap(opts.bodyMaxHeight ?? opts.contentMaxHeight), toCssSize);
      if (opts.style) Object.assign(currentEntry.panel.style, opts.style);
      setPropertyProps(currentEntry.panel, opts);
      ensureFullscreenViewportTracking(currentEntry, uiUnwrap(opts.fullscreen));
      currentEntry.panel.setAttribute("role", opts.role || "dialog");
      currentEntry.panel.setAttribute("aria-modal", opts.modal === false ? "false" : "true");
      if (opts.ariaLabel) currentEntry.panel.setAttribute("aria-label", opts.ariaLabel);
      else currentEntry.panel.removeAttribute("aria-label");
    };
    const renderOpenContent = () => {
      if (!entry?.panel) return;
      entry.panel.replaceChildren(buildContent());
    };
    const update = (nextProps = {}) => {
      if (nextProps && typeof nextProps === "object") currentProps = { ...currentProps, ...nextProps };
      if (entry) {
        applyEntryOptions(entry);
        renderOpenContent();
      }
      return api;
    };
    const open = (nextProps = null) => {
      if (nextProps && typeof nextProps === "object") currentProps = { ...currentProps, ...nextProps };
      if (entry) {
        applyEntryOptions(entry);
        renderOpenContent();
        return entry;
      }
      lastActive = document.activeElement;
      const opts = getOptions();
      const persistent = opts.persistent === true;
      entry = JSswift.overlay.open(() => buildContent(), {
        type: "dialog",
        backdrop: opts.backdrop !== false,
        lockScroll: opts.lockScroll !== false,
        trapFocus: opts.trapFocus !== false,
        autoFocus: opts.autoFocus !== false,
        closeOnOutside: opts.closeOnOutside ?? !persistent,
        closeOnBackdrop: opts.closeOnBackdrop ?? !persistent,
        closeOnEsc: opts.closeOnEsc ?? !persistent,
        className: uiClassStatic(["cms-dialog"]),
        onClose: () => {
          entry?._dialogViewportCleanup?.();
          entry?.panel?.removeEventListener("click", onPanelClick);
          entry = null;
          getOptions().onClose?.();
          if (lastActive && typeof lastActive.focus === "function") {
            setTimeout(() => lastActive.focus(), 0);
          }
        }
      });
      const onPanelClick = (e) => {
        const target = e.target;
        if (target && target.closest && target.closest("[data-dialog-close]")) close();
      };
      entry.panel.addEventListener("click", onPanelClick);
      applyEntryOptions(entry);
      overlayEnter(entry);
      getOptions().onOpen?.(entry);
      return entry;
    };

    const close = () => {
      if (!entry) return;
      const toClose = entry;
      overlayLeave(toClose, () => JSswift.overlay.close(toClose.id));
    };

    const isOpen = () => !!entry;
    const toggle = (nextProps = null) => isOpen() ? (close(), null) : open(nextProps);
    const api = { open, close, toggle, update, isOpen, entry: () => entry, props: () => ({ ...currentProps }) };

    return api;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Dialog = {
      signature: "UI.Dialog(props) | UI.Dialog(props, ...children) -> { open, close, toggle, update, isOpen }",
      props: {
        title: "String|Node|Function|Array|({ close })=>Node",
        subtitle: "String|Node|Function|Array|({ close })=>Node",
        eyebrow: "String|Node|Function|Array|({ close })=>Node",
        icon: "String|Node|Function|Array",
        content: "Node|Function|Array|({ close })=>Node",
        body: "Alias of content",
        actions: "Node|Function|Array|({ close })=>Node",
        footer: "Alias of actions",
        size: "xs|sm|md|lg|xl|full",
        state: "primary|secondary|warning|danger|success|info|light|dark",
        color: "Alias of state",
        width: "string|number",
        minWidth: "string|number",
        maxWidth: "string|number",
        maxHeight: "string|number",
        bodyMaxHeight: "string|number",
        persistent: "boolean",
        closable: "boolean",
        closeButton: "boolean",
        closeIcon: "string",
        align: "top|center|bottom",
        actionsAlign: "start|center|end|between|stretch",
        stickyHeader: "boolean",
        stickyActions: "boolean",
        scrollable: "boolean",
        stackActions: "boolean",
        fullscreen: "boolean",
        backdrop: "boolean",
        backdropBlur: "boolean",
        lockScroll: "boolean",
        trapFocus: "boolean",
        autoFocus: "boolean",
        closeOnOutside: "boolean",
        closeOnBackdrop: "boolean",
        closeOnEsc: "boolean",
        slots: "{ icon?, eyebrow?, title?, subtitle?, header?, content?, body?, footer?, actions?, close?, default? }",
        class: "string",
        panelClass: "string",
        overlayClass: "string",
        style: "object"
      },
      events: {
        onOpen: "(entry)",
        onClose: "void"
      },
      slots: {
        icon: "Dialog icon ({ close })",
        eyebrow: "Eyebrow above the title ({ close })",
        title: "Dialog title ({ close })",
        subtitle: "Dialog subtitle ({ close })",
        header: "Custom header ({ close })",
        content: "Dialog body ({ close })",
        body: "Alias of content ({ close })",
        footer: "Custom footer ({ close })",
        actions: "Dialog actions ({ close })",
        close: "Close action ({ close })",
        default: "Fallback body content ({ close })"
      },
      description: "Standardized dialog overlay with variants, animations, structured slots, and imperative API.",
      returns: "Object { open(overrides?), close(), toggle(overrides?), update(props), isOpen(), entry(), props() }"
    };
  }

