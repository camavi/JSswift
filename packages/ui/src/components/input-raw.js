
  UI.InputRaw = (props = {}) => {
    const el = _.input({
      class: uiClass(["jss-input-raw", props.class]),
      type: props.type || "text",
      name: props.name,
      placeholder: props.placeholder,
      autocomplete: props.autocomplete,
      value: props.value
    });

    let autofillDisposed = false;
    const autofillTimeouts = new Set();
    const autofillLater = (fn, delay) => {
      if (autofillDisposed) return;
      const id = setTimeout(() => {
        autofillTimeouts.delete(id);
        if (!autofillDisposed) fn();
      }, delay);
      autofillTimeouts.add(id);
    };
    let lastKnownValue = el.value ?? "";
    const syncAutofill = () => {
      const next = el.value ?? "";
      if (next === lastKnownValue) return;
      lastKnownValue = next;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    let autofillTimer = null;
    let autofillProbe = false;
    const scheduleAutofillProbe = () => {
      if (autofillDisposed || autofillProbe) return;
      autofillProbe = true;
      let count = 0;
      const tick = () => {
        syncAutofill();
        count += 1;
        if (count >= 10) {
          autofillProbe = false;
          return;
        }
        autofillLater(tick, 120);
      };
      autofillLater(tick, 40);
    };
    const startAutofillWatch = () => {
      if (autofillDisposed || autofillTimer) return;
      autofillTimer = setInterval(() => {
        if (document.activeElement !== el) {
          clearInterval(autofillTimer);
          autofillTimer = null;
          return;
        }
        syncAutofill();
      }, 250);
    };
    const stopAutofillWatch = () => {
      if (!autofillTimer) return;
      clearInterval(autofillTimer);
      autofillTimer = null;
    };
    el.addEventListener("input", () => { lastKnownValue = el.value ?? ""; });
    el.addEventListener("change", () => { lastKnownValue = el.value ?? ""; });
    el.addEventListener("animationstart", (e) => {
      if (e.animationName !== "jss-autofill") return;
      syncAutofill();
      startAutofillWatch();
      scheduleAutofillProbe();
    });
    el.addEventListener("focus", () => {
      startAutofillWatch();
      scheduleAutofillProbe();
      autofillLater(syncAutofill, 50);
    });
    el.addEventListener("blur", () => {
      stopAutofillWatch();
      autofillLater(syncAutofill, 0);
    });
    autofillLater(syncAutofill, 0);
    scheduleAutofillProbe();

    JSswift._registerCleanup(el, () => {
      autofillDisposed = true;
      stopAutofillWatch();
      autofillTimeouts.forEach(clearTimeout);
      autofillTimeouts.clear();
    });

    // model binding
    const model = props.model;
    if (model) {
      // Supporta rod direttamente
      if (typeof model === "object" && typeof model._bind === "function") {
        JSswift._registerCleanup(el, app.rodModel(el, model));
      }
      // Supporta [get,set] signal -> creiamo rodFromSignal
      else if (Array.isArray(model) && typeof model[0] === "function" && typeof model[1] === "function") {
        const stop = JSswift.reactive.untracked(() => app.signalModel(el, model[0], model[1]));
        JSswift._registerCleanup(el, stop);
      }
    }
    uiRegisterShortcode(el, props, {
      isEnabled: () => !el.disabled,
      action: () => uiFocusShortcutTarget(el, { selectText: !!props.selectOnShortcode })
    });
    return el;
  };
