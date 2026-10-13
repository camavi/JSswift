

  UI.ContextMenu = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    let currentProps = { ...props };
    let lastPoint = null;
    let lastAnchor = null;
    let lastTriggerEl = null;

    const isPlainObject = (value) => value && typeof value === "object" && !value.nodeType && !Array.isArray(value) && !(value instanceof Function);
    const isAnchorLike = (value) => !!value && typeof value === "object" && (value.nodeType === 1 || typeof value.getBoundingClientRect === "function");
    const isEventLike = (value) => !!value && typeof value === "object" && ("clientX" in value || "type" in value || "target" in value || "currentTarget" in value);
    const isPointLike = (value) => !!value && Number.isFinite(Number(value.x)) && Number.isFinite(Number(value.y));
    const getOptions = () => currentProps;
    const normalizePoint = (x, y) => {
      const px = Number(x);
      const py = Number(y);
      if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
      return { x: px, y: py };
    };
    const createVirtualAnchor = (point) => point ? {
      _jssContextPoint: point,
      getBoundingClientRect: () => ({
        top: point.y,
        bottom: point.y,
        left: point.x,
        right: point.x,
        width: 0,
        height: 0
      })
    } : null;
    const getElementPoint = (el) => {
      if (!isAnchorLike(el)) return null;
      const rect = el.getBoundingClientRect();
      return normalizePoint(rect.left + Math.min(rect.width / 2, 24), rect.top + Math.min(rect.height / 2, 24));
    };
    const extractAnchor = (value) => uiUnwrap(value?.anchorEl ?? value?.triggerEl ?? value?.target ?? value?.anchor ?? null);
    const getEventPoint = (event, fallbackEl = null) => {
      if (!event) return getElementPoint(fallbackEl || lastTriggerEl);
      const point = normalizePoint(event.clientX, event.clientY);
      if (point) return point;
      const anchor = extractAnchor({ anchorEl: fallbackEl || event.currentTarget || event.target || lastTriggerEl });
      return getElementPoint(anchor);
    };
    const stripContextKeys = (value = {}) => {
      if (!isPlainObject(value)) return {};
      const next = { ...value };
      delete next.event;
      delete next.point;
      delete next.x;
      delete next.y;
      return next;
    };
    const buildMenuProps = () => {
      const opts = getOptions();
      return {
        ...opts,
        trigger: "manual",
        placement: opts.placement || "bottom-start",
        offsetX: opts.offsetX ?? 0,
        offsetY: opts.offsetY ?? opts.offset ?? 4,
        closeOnOutside: opts.closeOnOutside !== false,
        closeOnEsc: opts.closeOnEsc !== false,
        role: opts.role || "menu",
        ariaLabel: opts.ariaLabel || opts.title || "Context menu",
        class: uiClass(["jss-context-menu-shell", opts.class]),
        panelClass: uiClass(["jss-context-menu-panel", opts.panelClass])
      };
    };
    const menu = UI.Menu(buildMenuProps(), ...children);

    const resolveOpenInput = (arg1 = null, arg2 = null, arg3 = null) => {
      let point = null;
      let anchor = null;
      let nextProps = null;

      if (isEventLike(arg1)) {
        point = getEventPoint(arg1, lastTriggerEl);
        nextProps = isPlainObject(arg2) ? stripContextKeys(arg2) : null;
      } else if (typeof arg1 === "number" || typeof arg2 === "number") {
        point = normalizePoint(arg1, arg2);
        nextProps = isPlainObject(arg3) ? stripContextKeys(arg3) : null;
      } else if (isPointLike(arg1)) {
        point = normalizePoint(arg1.x, arg1.y);
        nextProps = isPlainObject(arg2) ? stripContextKeys(arg2) : null;
      } else if (isAnchorLike(arg1)) {
        anchor = arg1;
        nextProps = isPlainObject(arg2) ? stripContextKeys(arg2) : null;
      } else if (isPlainObject(arg1)) {
        const rawPoint = isPointLike(arg1.point) ? arg1.point : (isPointLike(arg1) ? arg1 : null);
        const rawAnchor = extractAnchor(arg1);
        const rawEvent = arg1.event;
        point = rawPoint ? normalizePoint(rawPoint.x, rawPoint.y) : getEventPoint(rawEvent, rawAnchor || lastTriggerEl);
        anchor = rawAnchor && isAnchorLike(rawAnchor) ? rawAnchor : null;
        nextProps = {
          ...stripContextKeys(arg1),
          ...(isPlainObject(arg2) ? stripContextKeys(arg2) : {})
        };
      } else if (lastPoint) {
        point = { ...lastPoint };
      }

      return { point, anchor, nextProps };
    };
    const rememberAnchor = (anchor, point = null) => {
      lastAnchor = anchor || lastAnchor;
      lastPoint = point || (anchor && anchor._jssContextPoint) || lastPoint;
    };
    const mergeProps = (nextProps = null) => {
      if (isPlainObject(nextProps) && Object.keys(nextProps).length) {
        currentProps = { ...currentProps, ...nextProps };
      }
    };
    const getOpenAnchor = (inputAnchor = null, inputPoint = null) => {
      if (inputPoint) return createVirtualAnchor(inputPoint);
      if (inputAnchor && isAnchorLike(inputAnchor)) return inputAnchor;
      const configAnchor = extractAnchor(getOptions());
      if (isAnchorLike(configAnchor)) return configAnchor;
      if (lastPoint) return createVirtualAnchor(lastPoint);
      if (isAnchorLike(lastAnchor)) return lastAnchor;
      if (isAnchorLike(lastTriggerEl)) return lastTriggerEl;
      return null;
    };
    const open = (arg1 = null, arg2 = null, arg3 = null) => {
      const { point, anchor, nextProps } = resolveOpenInput(arg1, arg2, arg3);
      mergeProps(nextProps);
      const openAnchor = getOpenAnchor(anchor, point);
      if (!openAnchor) return null;
      rememberAnchor(openAnchor, point);
      return menu.open(openAnchor, buildMenuProps());
    };
    const openAt = (x, y, nextProps = null) => open(x, y, nextProps);
    const openFromEvent = (event, nextProps = null) => open(event, nextProps);
    const close = () => {
      menu.close();
      return api;
    };
    const hide = (immediate = true) => {
      if (immediate === false) menu.hide(false);
      else menu.close();
      return api;
    };
    const show = (arg1 = null, arg2 = null, arg3 = null) => open(arg1, arg2, arg3);
    const toggle = (arg1 = null, arg2 = null, arg3 = null) => menu.isOpen() ? (close(), null) : open(arg1, arg2, arg3);
    const update = (nextProps = {}) => {
      mergeProps(stripContextKeys(nextProps));
      menu.update(buildMenuProps());
      return api;
    };
    const bind = (el, bindProps = null) => {
      if (!el) return () => { };
      const scopedProps = isPlainObject(bindProps) ? stripContextKeys(bindProps) : null;
      const onContextMenu = (e) => {
        lastTriggerEl = el;
        e.preventDefault();
        const result = getOptions().onTrigger?.(e, { element: el, open, close, update });
        if (result === false || uiUnwrap(getOptions().disabled)) return;
        open({ event: e, anchorEl: el }, scopedProps);
      };
      const onKeyboardOpen = (e) => {
        if (e.key !== "ContextMenu" && !(e.shiftKey && e.key === "F10")) return;
        lastTriggerEl = el;
        e.preventDefault();
        const result = getOptions().onTrigger?.(e, { element: el, open, close, update });
        if (result === false || uiUnwrap(getOptions().disabled)) return;
        open({ event: e, anchorEl: el }, scopedProps);
      };
      el.addEventListener("contextmenu", onContextMenu);
      el.addEventListener("keydown", onKeyboardOpen);
      return () => {
        el.removeEventListener("contextmenu", onContextMenu);
        el.removeEventListener("keydown", onKeyboardOpen);
      };
    };
    const api = {
      open,
      openAt,
      openFromEvent,
      show,
      hide,
      close,
      toggle,
      update,
      bind,
      isOpen: menu.isOpen,
      entry: menu.entry,
      props: () => ({ ...currentProps })
    };

    return api;
  };
