
  // useForm + UI.Form
  JSswift.form = JSswift.form || {};

  JSswift.form._isPromise = (v) => v && typeof v.then === "function";

  JSswift.form._normalizeRules = (rules) => {
    // rules: { fieldName: [fn|{rule, message}] } or { fieldName: fn } etc.
    const out = {};
    for (const k in (rules || {})) {
      const r = rules[k];
      out[k] = Array.isArray(r) ? r : [r];
    }
    return out;
  };

  // rule returns: true (ok) | false (generic error) | string (error msg)
  JSswift.form._runRule = async (rule, value, ctx) => {
    let fn = rule;
    let msg = null;

    if (rule && typeof rule === "object" && typeof rule.rule === "function") {
      fn = rule.rule;
      msg = rule.message || null;
    }

    const res = fn ? fn(value, ctx) : true;
    const v = JSswift.form._isPromise(res) ? await res : res;

    if (v === true) return null;
    if (typeof v === "string") return v;
    if (v === false) return msg || "Valore non valido";
    return v ? null : (msg || "Valore non valido");
  };

  JSswift.useForm = (options = {}) => {
    const model = options.model || {};
    const rules = JSswift.form._normalizeRules(options.rules || {});
    const validateOn = options.validateOn || "submit"; // "input" | "blur" | "submit"
    const cloneValues = (value) => {
      if (Array.isArray(value)) return value.map(cloneValues);
      if (value instanceof Date) return new Date(value.getTime());
      if (value && Object.getPrototypeOf(value) === Object.prototype)
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneValues(item)]));
      return value;
    };
    const initial = cloneValues(options.initial ?? (model && "value" in model ? model.value : model));
    const bindings = new Set();
    const validationVersions = new Map();
    let resetVersion = 0;
    const syncFields = () => {
      for (const binding of bindings) {
        const value = getFieldValue(binding.name);
        if (!Object.is(binding.rod.value, value)) binding.rod.value = value;
      }
    };

    // errors: { field: string|null }
    const errors = _.rod({});
    const touched = _.rod({});
    const submitting = _.rod(false);
    const submitError = _.rod(null);

    const getModelObj = () => {
      // allow rod model (model.value)
      if (model && typeof model === "object" && "value" in model) return model.value || {};
      return model;
    };

    const setModelObj = (next) => {
      if (model && typeof model === "object" && "value" in model) model.value = next;
      else {
        // mutate existing
        const obj = model || {};
        for (const k in obj) delete obj[k];
        Object.assign(obj, next);
      }
    };

    const getFieldValue = (name) => {
      const obj = getModelObj();
      return obj ? obj[name] : undefined;
    };

    const setFieldValue = (name, value) => {
      const obj = { ...(getModelObj() || {}) };
      obj[name] = value;
      if (Object.is(getFieldValue(name), value)) return;
      validationVersions.set(name, (validationVersions.get(name) || 0) + 1);
      setModelObj(obj);
      syncFields();
    };

    const setError = (name, msg) => {
      const e = { ...(errors.value || {}) };
      if (msg) e[name] = msg;
      else delete e[name];
      errors.value = e;
    };

    const getError = (name) => (errors.value || {})[name] || null;

    const touch = (name) => {
      touched.value = { ...(touched.value || {}), [name]: true };
    };

    const isTouched = (name) => !!(touched.value || {})[name];

    const validateField = async (name) => {
      const version = (validationVersions.get(name) || 0) + 1;
      validationVersions.set(name, version);
      const resetAtStart = resetVersion;
      const value = getFieldValue(name);
      const isCurrent = () => resetAtStart === resetVersion && validationVersions.get(name) === version && Object.is(getFieldValue(name), value);
      const list = rules[name] || [];
      if (!list.length) {
        setError(name, null);
        return true;
      }
      const ctx = { name, value, model: getModelObj(), form: api };

      for (const rule of list) {
        if (!rule) continue;
        const msg = await JSswift.form._runRule(rule, value, ctx);
        if (!isCurrent()) return false;
        if (msg) {
          setError(name, msg);
          return false;
        }
      }
      if (!isCurrent()) return false;
      setError(name, null);
      return true;
    };

    const validate = async () => {
      submitError.value = null;
      const names = Object.keys(rules);
      let ok = true;
      for (const n of names) {
        const r = await validateField(n);
        if (!r) ok = false;
      }
      return ok;
    };

    const reset = () => {
      resetVersion++;
      submitError.value = null;
      errors.value = {};
      touched.value = {};
      setModelObj(cloneValues(initial || {}));
      syncFields();
    };

    const submit = async (fn) => {
      if (submitting.value) return { ok: false, reason: "submitting" };
      const resetAtStart = resetVersion;
      submitting.value = true;
      submitError.value = null;
      try {
        const ok = await validate();
        if (resetAtStart !== resetVersion) return { ok: false, reason: "reset" };
        if (!ok) return { ok: false, reason: "validation" };
        const res = await fn?.(getModelObj(), api);
        return { ok: true, result: res };
      } catch (e) {
        console.error("[useForm] submit error:", e);
        if (resetAtStart === resetVersion) submitError.value = (e && e.message) ? e.message : String(e);
        return { ok: false, reason: "exception", error: e };
      } finally {
        submitting.value = false;
      }
    };

    // Field binding factory for UI components
    const field = (name, fieldOpts = {}) => {
      const r = _.rod(getFieldValue(name));
      const binding = { name, rod: r };
      bindings.add(binding);
      const stopSync = model && typeof model === "object" && "value" in model
        ? JSswift.reactive.effect(() => {
          const value = getFieldValue(name);
          JSswift.reactive.untracked(() => { if (!Object.is(r.value, value)) r.value = value; });
        }, "useForm:field") : null;
      // keep rod synced with form model
      // when r changes -> update model
      r.action?.((v) => {
        setFieldValue(name, v)
      });

      const shouldShowError = () => {
        if (validateOn === "submit" || validateOn === "input" || validateOn === "blur") return true;
        return isTouched(name);
      };

      let activeEl = null;
      let blurHandled = false;
      let watchingOutside = false;
      let disposed = false;
      let blurTimer = null;
      const cleanupTargets = new WeakSet();

      const runBlur = async () => {
        if (disposed || blurHandled) return;
        blurHandled = true;
        touch(name);
        if (validateOn === "blur" || validateOn === "input") await validateField(name);
        if (!disposed) blurTimer = setTimeout(() => { blurHandled = false; }, 0);
      };

      const onDocPointerDown = (e) => {
        if (!activeEl) return;
        if (activeEl === e.target || (activeEl.contains && activeEl.contains(e.target))) return;
        runBlur();
        activeEl = null;
        if (watchingOutside) {
          watchingOutside = false;
          document.removeEventListener("pointerdown", onDocPointerDown, true);
        }
      };

      const ensureOutsideWatch = () => {
        if (watchingOutside) return;
        watchingOutside = true;
        document.addEventListener("pointerdown", onDocPointerDown, true);
      };

      const onInput = async (event) => {
        if (disposed) return;
        const control = event?.currentTarget;
        if (control && !cleanupTargets.has(control)) {
          cleanupTargets.add(control);
          JSswift._registerCleanup(control, () => r.dispose());
        }
        activeEl = document.activeElement;
        blurHandled = false;
        ensureOutsideWatch();
        // Native handlers update the control rod later in the same event dispatch.
        await Promise.resolve();
        if (disposed) return;
        setFieldValue(name, r.value);
        if (validateOn === "input") await validateField(name);
      };

      const onBlur = async () => {
        await runBlur();
        activeEl = null;
        if (watchingOutside) {
          watchingOutside = false;
          document.removeEventListener("pointerdown", onDocPointerDown, true);
        }
      };
      r.onDispose(() => {
        disposed = true;
        bindings.delete(binding);
        stopSync?.();
        clearTimeout(blurTimer);
        document.removeEventListener("pointerdown", onDocPointerDown, true);
        activeEl = null;
      });
      return {
        name,
        model: r,
        get value() { return r.value; },
        set value(v) { r.value = v; },
        error: () => (shouldShowError() ? getError(name) : null),
        success: fieldOpts.success || null,
        warning: fieldOpts.warning || null,
        note: fieldOpts.note || null,
        touch: () => touch(name),
        validate: () => validateField(name),
        onInput,
        onBlur,
        dispose: () => r.dispose(),
        // allow passing through custom hints
        hint: fieldOpts.hint || null
      };
    };

    const api = {
      model,
      errors,
      touched,
      submitting,
      submitError,

      getValue: getFieldValue,
      setValue: setFieldValue,
      getError,
      setError,

      touch,
      isTouched,

      field,
      validateField,
      validate,
      reset,
      submit
    };

    return api;
  };
