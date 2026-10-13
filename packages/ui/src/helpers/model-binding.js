

  function resolveModel(model, name) {
    if (!model) return null;
    if (typeof model === "object" && typeof model._bind === "function") {
      return {
        get: () => model.value,
        set: (v) => { if (model.value !== v) model.value = v; },
        watch: (fn) => {
          model.action?.(fn);
          return () => { const i = model._actions?.indexOf(fn) ?? -1; if (i >= 0) model._actions.splice(i, 1); };
        }
      };
    }
    if (Array.isArray(model) && typeof model[0] === "function" && typeof model[1] === "function") {
      const get = model[0];
      const set = model[1];
      return {
        get,
        set,
        watch: (fn) => app.reactive.effect(() => { fn(get()); }, name || "UI:model")
      };
    }
    return null;
  }
