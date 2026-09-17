  UI.Tooltip = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    let entry = null;
    let openTimer = null;
    let closeTimer = null;
    let boundEl = null;
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(props, key);
    const hasExternalTarget = hasOwn("target") || hasOwn("anchorEl") || hasOwn("triggerEl");
    const targetNode = props.target || props.anchorEl || props.triggerEl || (children && children.length ? children[0] : null);

    const getNumber = (value, fallback) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    };
    const clearTimers = () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      openTimer = null;
      closeTimer = null;
    };
    const getDelay = () => getNumber(props.delay, 350);
    const getHideDelay = () => getNumber(props.hideDelay, uiUnwrap(props.interactive) ? 120 : 0);
    const closeNow = () => {
      clearTimers();
      if (!entry) return;
      const toClose = entry;
      entry = null;
      overlayLeave(toClose, () => JSswift.overlay.close(toClose.id));
    };
    const parseTriggers = (value) => {
      if (value == null || value === true) return new Set(["hover", "focus"]);
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
    const triggers = parseTriggers(props.trigger ?? props.triggers ?? (hasOwn("open") ? "manual" : null));
    const allowHover = triggers.has("hover");
    const allowFocus = triggers.has("focus");
    const allowClick = triggers.has("click");
    const isManual = triggers.has("manual") || (!allowHover && !allowFocus && !allowClick);

    const buildContent = () => {
      const ctx = {
        anchorEl: boundEl || targetNode || null,
        close: () => closeNow(),
        hide: () => closeNow(),
        isOpen: () => !!entry
      };
      const iconFallback = props.icon
        ? (typeof props.icon === "string"
          ? UI.Icon({ name: props.icon, size: props.iconSize || props.size || "sm" })
          : JSswift.ui.slot(props.icon, { as: "icon" }))
        : null;
      const titleNodes = renderSlotToArray(slots, "title", ctx, props.title ?? props.heading);
      const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
      const footerNodes = renderSlotToArray(slots, "footer", ctx, props.footer ?? props.actions);

      let bodyRaw = props.content ?? props.text ?? props.body ?? props.description ?? props.label;
      if (bodyRaw == null) {
        if (hasExternalTarget) bodyRaw = children;
        else if (targetNode && children && children.length > 1) bodyRaw = children.slice(1);
        else if (!targetNode) bodyRaw = children;
      }
      let bodyNodes = renderSlotToArray(slots, "content", ctx, bodyRaw);
      if (!bodyNodes.length) bodyNodes = renderSlotToArray(slots, "default", ctx, bodyRaw);

      const bodyEl = bodyNodes.length ? _.div({ class: "cms-tooltip-body" }, ...bodyNodes) : null;
      const headEl = (iconNodes.length || titleNodes.length)
        ? _.div(
          { class: "cms-tooltip-head" },
          iconNodes.length ? _.div({ class: "cms-tooltip-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-tooltip-head-main" },
            titleNodes.length ? _.div({ class: "cms-tooltip-title" }, ...titleNodes) : null,
            bodyEl
          )
        )
        : bodyEl;
      const footerEl = footerNodes.length ? _.div({ class: "cms-tooltip-footer" }, ...footerNodes) : null;

      return _.div({ class: "cms-tooltip-content" }, ...[headEl, footerEl].filter(Boolean));
    };

    const open = (anchorEl) => {
      const anchor = anchorEl || boundEl;
      if (!anchor || uiUnwrap(props.disabled)) return null;
      if (entry && entry._anchorEl === anchor) return entry;
      if (entry) closeNow();
      const shouldCloseOnOutside = props.closeOnOutside ?? (allowClick || uiUnwrap(props.interactive));
      const shouldCloseOnEsc = props.closeOnEsc ?? (allowClick || uiUnwrap(props.interactive));
      let currentRef = null;
      entry = JSswift.overlay.open(() => buildContent(), {
        type: "tooltip",
        anchorEl: anchor,
        placement: props.placement || "top",
        offsetX: props.offsetX ?? 0,
        offsetY: props.offsetY ?? props.offset ?? 8,
        backdrop: false,
        lockScroll: false,
        trapFocus: false,
        closeOnOutside: shouldCloseOnOutside,
        closeOnBackdrop: false,
        closeOnEsc: shouldCloseOnEsc,
        autoFocus: false,
        className: uiClassStatic([
          "cms-tooltip",
          uiWhen(props.interactive, "interactive"),
          props.class,
          props.panelClass
        ]),
        onClose: () => {
          currentRef?._tooltipCleanup?.();
          if (entry === currentRef) entry = null;
          props.onClose?.();
        }
      });
      if (!entry?.panel) return entry;
      const current = entry;
      currentRef = current;
      current._anchorEl = anchor;
      current.panel.dataset.placement = String(uiUnwrap(props.placement || "top"));
      if (props.maxWidth != null) current.panel.style.maxWidth = toCssSize(uiUnwrap(props.maxWidth));
      if (props.minWidth != null) current.panel.style.minWidth = toCssSize(uiUnwrap(props.minWidth));
      if (props.width != null) current.panel.style.width = toCssSize(uiUnwrap(props.width));
      if (props.style) Object.assign(current.panel.style, props.style);
      setPropertyProps(current.panel, props);
      if (uiUnwrap(props.interactive)) {
        const cancelHide = () => {
          clearTimeout(closeTimer);
          closeTimer = null;
        };
        const scheduleHide = () => hide();
        const onPanelClick = (e) => {
          const target = e.target;
          if (target && target.closest && target.closest("[data-tooltip-close]")) {
            closeNow();
          }
        };
        current.panel.addEventListener("mouseenter", cancelHide);
        current.panel.addEventListener("mouseleave", scheduleHide);
        current.panel.addEventListener("focusin", cancelHide);
        current.panel.addEventListener("focusout", scheduleHide);
        current.panel.addEventListener("click", onPanelClick);
        current._tooltipCleanup = () => {
          current.panel?.removeEventListener("mouseenter", cancelHide);
          current.panel?.removeEventListener("mouseleave", scheduleHide);
          current.panel?.removeEventListener("focusin", cancelHide);
          current.panel?.removeEventListener("focusout", scheduleHide);
          current.panel?.removeEventListener("click", onPanelClick);
        };
      }
      overlayEnter(current);
      props.onOpen?.(current);
      return current;
    };

    const show = (anchorEl) => {
      clearTimeout(closeTimer);
      closeTimer = null;
      clearTimeout(openTimer);
      openTimer = setTimeout(() => open(anchorEl), getDelay());
    };

    const hide = (immediate = false) => {
      clearTimeout(openTimer);
      openTimer = null;
      if (!entry) return;
      clearTimeout(closeTimer);
      if (immediate) {
        closeNow();
        return;
      }
      closeTimer = setTimeout(() => closeNow(), getHideDelay());
    };
    const toggle = (anchorEl) => {
      if (entry) hide(true);
      else open(anchorEl);
    };
    const isOpen = () => !!entry;

    const bind = (el) => {
      if (!el) return () => { };
      boundEl = el;
      const cleanups = [];
      const cleanup = () => {
        clearTimers();
        cleanups.forEach((fn) => fn());
      };
      if (hasOwn("open")) {
        if (uiIsReactive(props.open)) {
          JSswift.reactive.effect(() => {
            if (!boundEl) return;
            if (uiUnwrap(props.open)) open(boundEl);
            else hide(true);
          }, "UI.Tooltip:open");
        } else if (props.open === true) {
          open(el);
        } else if (props.open === false) {
          hide(true);
        }
        return cleanup;
      }
      if (isManual || uiUnwrap(props.disabled)) return cleanup;
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
          props.onTriggerClick?.(e);
          if (e.defaultPrevented) return;
          toggle(el);
        };
        el.addEventListener("click", onClick);
        cleanups.push(() => el.removeEventListener("click", onClick));
      }
      return cleanup;
    };

    if (targetNode) {
      const cls = uiClass(["cms-tooltip-wrap", props.wrapClass, props.targetClass]);
      const p = JSswift.omit(props, [
        "actions", "anchorEl", "body", "closeOnEsc", "closeOnOutside", "content", "delay", "description",
        "disabled", "footer", "heading", "hideDelay", "icon", "iconSize", "interactive", "label",
        "maxWidth", "minWidth", "offset", "offsetX", "offsetY", "onClose", "onOpen", "onTriggerClick",
        "open", "panelClass", "placement", "slots", "style", "target", "targetClass", "targetStyle",
        "text", "title", "trigger", "triggerEl", "triggers", "width", "wrapClass", "wrapStyle"
      ]);
      p.class = cls;
      p.style = { display: "inline-flex", alignItems: "center", ...(props.wrapStyle || props.targetStyle || {}) };
      const target = JSswift.ui.renderSlot(slots, "target", {
        open: () => open(boundEl),
        show: () => show(boundEl),
        hide: () => hide(true),
        toggle: () => toggle(boundEl),
        isOpen
      }, targetNode);
      const wrap = _.span(p, ...renderSlotToArray(null, "default", {}, target));
      bind(wrap);
      wrap._tooltip = { bind, open, show, hide, close: closeNow, toggle, isOpen };
      return wrap;
    }

    return { bind, open, show, hide, close: closeNow, toggle, isOpen };
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Tooltip = {
      signature: "UI.Tooltip(props, target?) | UI.Tooltip(target, content)",
      props: {
        title: "String|Node|Function|Array",
        content: "String|Node|Function|Array",
        text: "String|Node|Function|Array",
        body: "String|Node|Function|Array",
        footer: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        target: "Node|Function|Array",
        trigger: "\"hover focus\" | \"click\" | \"manual\" | Array",
        interactive: "boolean",
        disabled: "boolean",
        open: "boolean | reactive",
        placement: "string",
        delay: "number",
        hideDelay: "number",
        offset: "number (legacy)",
        offsetX: "number",
        offsetY: "number",
        closeOnOutside: "boolean",
        closeOnEsc: "boolean",
        maxWidth: "string|number",
        minWidth: "string|number",
        width: "string|number",
        slots: "{ target?, icon?, title?, content?, footer?, default? }",
        class: "string",
        panelClass: "string",
        wrapClass: "string",
        style: "object",
        targetStyle: "object"
      },
      slots: {
        target: "Tooltip trigger content ({ open, show, hide, toggle, isOpen })",
        icon: "Tooltip icon content",
        title: "Tooltip title content",
        content: "Tooltip body content ({ close, hide, isOpen, anchorEl })",
        footer: "Tooltip footer content ({ close, hide, isOpen, anchorEl })",
        default: "Fallback tooltip body content"
      },
      events: {
        onOpen: "(entry) => void",
        onClose: "() => void",
        onTriggerClick: "(event) => void"
      },
      returns: "Object { bind(), open(), show(), hide(), close(), toggle(), isOpen() } | HTMLSpanElement",
      description: "Anchored tooltip with hover/focus/click triggers, rich content, and imperative API."
    };
  }
  // Esempio: JSswift.ui.Tooltip({ title: "Info", text: "Dettaglio rapido" }, JSswift.ui.Icon({ name: "info" }))

