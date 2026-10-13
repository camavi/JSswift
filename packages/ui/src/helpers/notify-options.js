
  const NOTIFY_POSITIONS = new Set([
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right"
  ]);
  const NOTIFY_VARIANTS = new Set(["soft", "solid", "outline"]);
  const NOTIFY_DEFAULT_TITLES = {
    neutral: "Notice",
    success: "Success",
    warning: "Warning",
    danger: "Error",
    info: "Info",
    primary: "Notice",
    secondary: "Notice",
    light: "Notice",
    dark: "Notice"
  };
  const notifyIconMap = {
    success: "check_circle",
    warning: "warning",
    danger: "error",
    info: "info",
    primary: "bolt",
    secondary: "notifications",
    light: "notifications",
    dark: "shield"
  };

  const normalizeNotifyPosition = (value) => {
    const raw = String(uiUnwrap(value) || "").trim().toLowerCase();
    if (!raw) return "bottom-right";
    if (NOTIFY_POSITIONS.has(raw)) return raw;
    if (raw === "top") return "top-right";
    if (raw === "bottom") return "bottom-right";
    if (raw === "left") return "bottom-left";
    if (raw === "right") return "bottom-right";
    if (raw === "center") return "bottom-center";
    return "bottom-right";
  };

  const normalizeNotifyVariant = (value) => {
    const raw = String(uiUnwrap(value) || "").trim().toLowerCase();
    return NOTIFY_VARIANTS.has(raw) ? raw : "soft";
  };

  const normalizeNotifyTimeout = (value, tone) => {
    const raw = uiUnwrap(value);
    if (raw === false || raw === null) return 0;
    if (raw === true) return tone === "danger" ? 3500 : 2500;
    if (raw === "" || raw === undefined) return tone === "danger" ? 3500 : 2500;
    const num = Number(raw);
    return Number.isFinite(num) && num >= 0 ? num : (tone === "danger" ? 3500 : 2500);
  };

  const normalizeNotifyPayload = (input = {}, forcedType = "") => {
    const src = uiIsPlainObject(input) ? { ...input } : { message: input };
    const tone = normalizeState(uiUnwrap(forcedType) || uiUnwrap(src.type) || uiUnwrap(src.state) || uiUnwrap(src.color)) || "neutral";
    const timeout = normalizeNotifyTimeout(src.timeout ?? src.duration ?? src.delay, tone);
    const closable = src.closable ?? src.dismissible ?? (src.dismiss != null) ?? (timeout === 0);
    const title = src.title === undefined
      ? (src.label === undefined ? NOTIFY_DEFAULT_TITLES[tone] : src.label)
      : src.title;

    return {
      ...src,
      type: tone,
      state: tone,
      title,
      message: src.message ?? src.content ?? src.text ?? null,
      description: src.description ?? src.subtitle ?? src.note ?? null,
      meta: src.meta ?? src.caption ?? null,
      body: src.body ?? null,
      timeout,
      closable: !!closable,
      dismissLabel: src.dismissLabel || src.closeLabel || "Chiudi notifica",
      position: normalizeNotifyPosition(src.position),
      variant: normalizeNotifyVariant(src.variant),
      slots: src.slots || {},
      role: src.role || ((tone === "danger" || tone === "warning") ? "alert" : "status")
    };
  };

  const buildNotifyOptionsFromArgs = (args, forcedType = "", defaultTitle = "") => {
    if (!args.length) {
      return normalizeNotifyPayload(defaultTitle ? { type: forcedType, title: defaultTitle } : { type: forcedType });
    }

    if (uiIsPlainObject(args[0])) {
      const { props, children } = JSswift.uiNormalizeArgs(args);
      const next = { ...props };
      if (!next.type && !next.state && !next.color && forcedType) next.type = forcedType;
      if (next.title == null && defaultTitle) next.title = defaultTitle;
      if (children.length) {
        if (next.message == null && next.description == null && next.body == null && children.length === 1) {
          next.message = children[0];
        } else if (next.body == null) {
          next.body = children.length === 1 ? children[0] : children;
        }
      }
      return normalizeNotifyPayload(next, forcedType);
    }

    const [message, second, third] = args;
    let next = {};
    if (uiIsPlainObject(second)) {
      next = { ...second, message };
    } else if (uiIsPlainObject(third)) {
      next = { ...third, message, title: second };
    } else {
      next = { message, title: second };
    }
    if (forcedType && !next.type && !next.state && !next.color) next.type = forcedType;
    if (next.title == null && defaultTitle) next.title = defaultTitle;
    return normalizeNotifyPayload(next, forcedType);
  };

  const createNotifyShortcut = (type, defaultTitle) => (...args) =>
    app.services.notify?.show?.(buildNotifyOptionsFromArgs(args, type, defaultTitle));

  const resolveNotifyPromiseOutcome = (value, fallbackMessage, fallbackTitle) => {
    if (value === false) return false;
    if (typeof value === "function") {
      const next = value();
      return resolveNotifyPromiseOutcome(next, fallbackMessage, fallbackTitle);
    }
    if (uiIsPlainObject(value)) return value;
    if (value != null) return { message: value, title: fallbackTitle };
    return { message: fallbackMessage, title: fallbackTitle };
  };
