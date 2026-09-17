  // 4) NOTIFY SERVICE (toast)
  // -------------------------------
  const [toasts, setToasts] = app.reactive.signal([]);
  const toastTimers = new Map();

  function clearToastTimer(id) {
    const timer = toastTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.delete(id);
    }
  }

  function removeToast(id) {
    if (!id) return null;
    clearToastTimer(id);
    setToasts(toasts().filter((entry) => entry.id !== id));
    return id;
  }

  function clearToasts() {
    for (const id of toastTimers.keys()) clearToastTimer(id);
    setToasts([]);
  }

  function scheduleToastTimer(entry) {
    if (!entry?.id) return;
    clearToastTimer(entry.id);
    if (!(entry.timeout > 0)) return;
    toastTimers.set(entry.id, setTimeout(() => {
      removeToast(entry.id);
    }, entry.timeout));
  }

  function updateToast(id, patch = {}) {
    if (!id) return null;
    let nextEntry = null;
    setToasts(toasts().map((entry) => {
      if (entry.id !== id) return entry;
      nextEntry = normalizeNotifyPayload({ ...entry, ...patch, id: entry.id }, patch.type || patch.state || patch.color || entry.type);
      return nextEntry;
    }));
    if (nextEntry) scheduleToastTimer(nextEntry);
    return nextEntry?.id || null;
  }

  function renderNotifyToast(entry) {
    const close = () => removeToast(entry.id);
    const update = (patch = {}) => updateToast(entry.id, patch);
    const ctx = { toast: entry, id: entry.id, close, update };
    const resolveNotifyRender = (value) => typeof value === "function" ? value(ctx) : value;
    const iconFallback = (() => {
      if (entry.icon === false || entry.icon === null) return null;
      if (entry.icon != null) {
        const resolvedIcon = resolveNotifyRender(entry.icon);
        return typeof resolvedIcon === "string" ? UI.Icon({ name: resolvedIcon, size: "sm" }) : JSswift.ui.slot(resolvedIcon, { as: "icon" });
      }
      const iconName = notifyIconMap[entry.type];
      return iconName ? UI.Icon({ name: iconName, size: "sm" }) : null;
    })();

    const iconNodes = renderSlotToArray(entry.slots, "icon", ctx, iconFallback);
    const titleNodes = renderSlotToArray(entry.slots, "title", ctx, resolveNotifyRender(entry.title));
    const messageNodes = renderSlotToArray(entry.slots, "message", ctx, resolveNotifyRender(entry.message));
    const descriptionNodes = renderSlotToArray(entry.slots, "description", ctx, resolveNotifyRender(entry.description));
    const metaNodes = renderSlotToArray(entry.slots, "meta", ctx, resolveNotifyRender(entry.meta));
    const actionsNodes = renderSlotToArray(entry.slots, "actions", ctx, resolveNotifyRender(entry.actions));
    const bodyNodes = renderSlotToArray(entry.slots, "default", ctx, resolveNotifyRender(entry.body));
    const dismissNodes = renderSlotToArray(entry.slots, "dismiss", ctx, resolveNotifyRender(entry.dismiss));
    const dismissContent = dismissNodes.length
      ? dismissNodes
      : (entry.closable
        ? [UI.Btn({
          class: "cms-toast-close",
          outline: true,
          size: "xs",
          "aria-label": entry.dismissLabel,
          onClick: close
        }, UI.Icon({ name: "close", size: "xs" }))]
        : []);

    const node = _.div({
      class: uiClass([
        "cms-toast",
        `cms-toast-${entry.type}`,
        `cms-toast-${entry.variant}`,
        uiWhen(entry.closable, "is-closable"),
        entry.class
      ]),
      style: entry.style || {},
      role: entry.role
    },
      iconNodes.length ? _.div({ class: "cms-toast-icon" }, ...iconNodes) : null,
      _.div(
        { class: "cms-toast-main" },
        _.div(
          { class: "cms-toast-copy" },
          titleNodes.length ? _.div({ class: "cms-toast-title" }, ...titleNodes) : null,
          messageNodes.length ? _.div({ class: "cms-toast-message" }, ...messageNodes) : null,
          descriptionNodes.length ? _.div({ class: "cms-toast-description" }, ...descriptionNodes) : null,
          bodyNodes.length ? _.div({ class: "cms-toast-body" }, ...bodyNodes) : null,
          metaNodes.length ? _.div({ class: "cms-toast-meta" }, ...metaNodes) : null
        ),
        actionsNodes.length ? _.div({ class: "cms-toast-actions" }, ...actionsNodes) : null
      ),
      dismissContent.length ? _.div({ class: "cms-toast-dismiss" }, ...dismissContent) : null
    );

    setPropertyProps(node, entry);
    return node;
  }

  function ensureToastRoot() {
    let root = document.querySelector(".cms-toast-layer");
    if (root) return root;
    root = document.createElement("div");
    root.className = "cms-toast-layer";
    document.body.appendChild(root);

    app.reactive.effect(() => {
      const list = toasts();
      root.innerHTML = "";
      const groups = new Map();
      for (const toast of list) {
        const key = normalizeNotifyPosition(toast.position);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(toast);
      }

      for (const position of NOTIFY_POSITIONS) {
        const entries = groups.get(position);
        if (!entries?.length) continue;
        const wrap = _.div({ class: uiClass(["cms-toast-wrap", `is-${position}`]) },
          ...entries.map((entry) => renderNotifyToast(entry))
        );
        root.appendChild(wrap);
      }
    }, "JSswiftUI:toasts");

    return root;
  }

  function pushToast(input = {}) {
    ensureToastRoot();
    const entry = normalizeNotifyPayload(input);
    entry.id = entry.id || Math.random().toString(36).slice(2);
    setToasts([...toasts().filter((item) => item.id !== entry.id), entry]);
    scheduleToastTimer(entry);
    return entry.id;
  }

  app.services.notify.show = pushToast;
  app.services.notify.success = createNotifyShortcut("success", "Success");
  app.services.notify.error = createNotifyShortcut("danger", "Error");
  app.services.notify.warning = createNotifyShortcut("warning", "Warning");
  app.services.notify.info = createNotifyShortcut("info", "Info");
  app.services.notify.primary = createNotifyShortcut("primary", "Notice");
  app.services.notify.secondary = createNotifyShortcut("secondary", "Notice");
  app.services.notify.update = updateToast;
  app.services.notify.remove = removeToast;
  app.services.notify.clear = clearToasts;
  app.services.notify.promise = UI.Notify.promise;

  // Optional shortcut
  app.notify = app.services.notify;

