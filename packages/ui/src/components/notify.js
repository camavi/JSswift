
  UI.Notify = (...args) => app.services.notify?.show?.(buildNotifyOptionsFromArgs(args));
  UI.Notify.show = UI.Notify;
  UI.Notify.success = createNotifyShortcut("success", "Success");
  UI.Notify.error = createNotifyShortcut("danger", "Error");
  UI.Notify.warning = createNotifyShortcut("warning", "Warning");
  UI.Notify.info = createNotifyShortcut("info", "Info");
  UI.Notify.primary = createNotifyShortcut("primary", "Notice");
  UI.Notify.secondary = createNotifyShortcut("secondary", "Notice");
  UI.Notify.remove = (id) => app.services.notify?.remove?.(id);
  UI.Notify.clear = () => app.services.notify?.clear?.();
  UI.Notify.update = (id, patch = {}) => app.services.notify?.update?.(id, patch);
  UI.Notify.promise = async (task, opts = {}) => {
    const loadingInput = opts.loading === false
      ? false
      : resolveNotifyPromiseOutcome(
        typeof opts.loading === "function" ? () => opts.loading() : opts.loading,
        "Operazione in corso...",
        "In corso"
      );
    const loadingId = loadingInput === false
      ? null
      : app.services.notify?.show?.(normalizeNotifyPayload({
        type: "info",
        timeout: 0,
        closable: false,
        ...loadingInput
      }, "info"));

    try {
      const promise = typeof task === "function" ? task() : task;
      const result = await promise;
      const successInput = resolveNotifyPromiseOutcome(
        typeof opts.success === "function" ? () => opts.success(result) : opts.success,
        "Operazione completata con successo.",
        "Completato"
      );
      if (successInput !== false) {
        if (loadingId != null) app.services.notify?.update?.(loadingId, normalizeNotifyPayload(successInput, "success"));
        else app.services.notify?.show?.(normalizeNotifyPayload(successInput, "success"));
      } else if (loadingId != null) {
        app.services.notify?.remove?.(loadingId);
      }
      return result;
    } catch (error) {
      const errorInput = resolveNotifyPromiseOutcome(
        typeof opts.error === "function" ? () => opts.error(error) : opts.error,
        error?.message || "Operazione fallita.",
        "Errore"
      );
      if (errorInput !== false) {
        if (loadingId != null) app.services.notify?.update?.(loadingId, normalizeNotifyPayload(errorInput, "danger"));
        else app.services.notify?.show?.(normalizeNotifyPayload(errorInput, "danger"));
      } else if (loadingId != null) {
        app.services.notify?.remove?.(loadingId);
      }
      throw error;
    }
  };
