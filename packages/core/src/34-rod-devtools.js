  // ===============================
  // Rod DevTools micro
  // ===============================
  JSswift.rod = JSswift.rod || {};

  JSswift.rod.inspect = function (r, label = "rod") {
    if (!r || r.type !== "rod") {
      console.warn("[JSswift.rod.inspect] non è un rod:", r);
      return null;
    }

    const bindings = typeof r.bindings === "function" ? r.bindings() : [];
    const info = {
      label,
      value: r.value,
      bindingsCount: bindings.length,
      bindings: bindings.map(b => ({
        key: b.key,
        el: b.el?.nodeType === 3 ? "#text" : b.el?.tagName,
        id: b.el?.id || null,
        className: b.el?.className || null,
        isConnected: b.el?.nodeType === 3 ? !!b.el.parentNode : (b.el?.isConnected ?? null)
      })),
      actionsCount: Array.isArray(r._actions) ? r._actions.length : null,
      disposed: !!r._disposed
    };

    if (JSswift.config.debug) {
      console.groupCollapsed(`[JSswift.rod.inspect] ${label}`);
      console.log(info);
      console.groupEnd();
    } else {
      console.log(info);
    }

    return info;
  };

  JSswift.rod.inspectAll = function () {
    const all = JSswift.rod._all ? Array.from(JSswift.rod._all) : [];
    all.forEach((r, i) => JSswift.rod.inspect(r, `rod#${i + 1}`));
    return all.length;
  };
