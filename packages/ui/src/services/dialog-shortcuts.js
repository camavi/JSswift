

  function closeBackdrop(backdrop) {
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }

  function renderDialog({ title, message, contentNode, okText, cancelText, showCancel, onOk, onCancel, persistent }) {
    ensureModalRoot();

    const backdrop = _.div({
      class: "jss-dialog-backdrop", onClick: (e) => {
        if (e.target === backdrop && persistent !== true) onCancel?.();
      }
    });

    const titleNodes = renderSlotToArray(null, "default", {}, title);
    const messageNodes = renderSlotToArray(null, "default", {}, message);
    const contentNodes = renderSlotToArray(null, "default", {}, contentNode);

    const dialog = _.div({ class: "jss-dialog jss-panel" },
      titleNodes.length ? _.h3(...titleNodes) : null,
      messageNodes.length ? _.p(...messageNodes) : null,
      ...contentNodes,
      _.div({ class: "jss-dialog-actions" },
        showCancel ? JSswift.ui.Btn({ onClick: onCancel }, cancelText || "Annulla") : null,
        JSswift.ui.Btn({ color: "primary", onClick: onOk }, okText || "OK")
      )
    );

    backdrop.appendChild(dialog);
    ensureModalRoot().appendChild(backdrop);

    // escape to close
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey, { once: true });

    return { backdrop, close: () => closeBackdrop(backdrop) };
  }

  app.dialog.alert = function (message, opts = {}) {
    return new Promise((resolve) => {
      const { backdrop, close } = renderDialog({
        title: opts.title || "Info",
        message,
        okText: opts.okText || "OK",
        showCancel: false,
        persistent: opts.persistent,
        onOk: () => { close(); resolve(true); },
        onCancel: () => { close(); resolve(true); }
      });
    });
  };

  app.dialog.confirm = function (opts = {}) {
    return new Promise((resolve) => {
      const { close } = renderDialog({
        title: opts.title || "Conferma",
        message: opts.message || "",
        okText: opts.okText || "Conferma",
        cancelText: opts.cancelText || "Annulla",
        showCancel: true,
        persistent: opts.persistent,
        onOk: () => { close(); resolve(true); },
        onCancel: () => { close(); resolve(false); }
      });
    });
  };

  app.dialog.prompt = function (opts = {}) {
    return new Promise((resolve) => {
      const input = JSswift.ui.Input({
        class: "jss-dialog-input",
        type: opts.type || "text",
        placeholder: opts.placeholder || ""
      });

      // default value
      if (opts.value != null) input.value = String(opts.value);

      const { close } = renderDialog({
        title: opts.title || "Inserisci valore",
        message: opts.message || "",
        okText: opts.okText || "OK",
        cancelText: opts.cancelText || "Annulla",
        showCancel: true,
        contentNode: _.div(input),
        persistent: opts.persistent,
        onOk: () => { const v = input.value; close(); resolve(v); },
        onCancel: () => { close(); resolve(null); }
      });

      // focus
      setTimeout(() => input.focus(), 0);
    });
  };

  // ===============================
  // Loading Service
  // ===============================
