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
    const initial = options.initial || null;

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
      setModelObj(obj);
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
      const list = rules[name] || [];
      if (!list.length) {
        setError(name, null);
        return true;
      }
      const value = getFieldValue(name);
      const ctx = { name, value, model: getModelObj(), form: api };

      for (const rule of list) {
        if (!rule) continue;
        const msg = await JSswift.form._runRule(rule, value, ctx);
        if (msg) {
          setError(name, msg);
          return false;
        }
      }
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
      submitError.value = null;
      errors.value = {};
      touched.value = {};
      if (initial) setModelObj({ ...(initial || {}) });
    };

    const submit = async (fn) => {
      submitting.value = true;
      submitError.value = null;
      try {
        const ok = await validate();
        if (!ok) return { ok: false, reason: "validation" };
        const res = await fn?.(getModelObj(), api);
        return { ok: true, result: res };
      } catch (e) {
        console.error("[useForm] submit error:", e);
        submitError.value = (e && e.message) ? e.message : String(e);
        return { ok: false, reason: "exception", error: e };
      } finally {
        submitting.value = false;
      }
    };

    // Field binding factory for UI components
    const field = (name, fieldOpts = {}) => {
      const r = _.rod("");
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

      const runBlur = async () => {
        if (blurHandled) return;
        blurHandled = true;
        touch(name);
        if (validateOn === "blur" || validateOn === "input") await validateField(name);
        setTimeout(() => { blurHandled = false; }, 0);
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

      const onInput = async () => {
        activeEl = document.activeElement;
        blurHandled = false;
        ensureOutsideWatch();
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

  UI.Form = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const form = props.form; // required-ish
    const onSubmit = props.onSubmit; // async (model, form) => ...
    const cls = uiClass(["cms-form", props.class]);

    const p = JSswift.omit(props, ["form", "onSubmit"]);
    p.class = cls;

    const el = _.form({
      ...p,
      onSubmit: async (e) => {
        e.preventDefault();
        if (!form) return;
        await form.submit(onSubmit || (async () => { }));
      }
    });

    // children can be nodes or function(form)->nodes
    const content = [];
    for (const ch of (children || [])) {
      const v = (typeof ch === "function") ? ch(form) : ch;
      const out = JSswift.ui.slot(v);
      if (!out) continue;
      if (Array.isArray(out)) content.push(...out);
      else content.push(out);
    }

    content.forEach(n => el.appendChild(n));

    // disable fields/buttons while submitting (optional UX)
    if (form && form.submitting) {
      JSswift.reactive.effect(() => {
        el.classList.toggle("is-submitting", !!form.submitting.value);
      }, "UI.Form:submitting");
    }

    return el;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Form = {
      signature: "UI.Form({ form, onSubmit, ...props }, ...children)",
      props: {
        form: "useForm() instance",
        onSubmit: "async (model, form) => any",
        class: "string",
        style: "object"
      },
      slots: {
        default: "(form) => Node|Array|Node"
      },
      returns: "HTMLFormElement"
    };
  }

  // ===============================
  // Dialog Service (Modal)
  // ===============================
  app.services = app.services || {};
  app.services.dialog = app.services.dialog || {};
  app.dialog = app.services.dialog;

  let modalRoot = null;

  function ensureModalRoot() {
    if (modalRoot) return modalRoot;

    modalRoot = document.createElement("div");
    modalRoot.setAttribute("data-cms-modal-root", "true");
    document.body.appendChild(modalRoot);
    return modalRoot;
  }

  UI.cardHeader = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const cls = uiClass(["cms-card-header", uiWhen(props.divider, "divider"), props.class]);
    const p = JSswift.omit(props, ["divider", "align", "justify", "gap", "wrap", "direction", "slots"]);
    p.class = cls;

    const style = { ...(props.style || {}) };
    const align = uiStyleValue(props.align);
    if (align != null && !uiHasResponsiveOverride(props, "align")) style.alignItems = align;
    const justify = uiStyleValue(props.justify);
    if (justify != null && !uiHasResponsiveOverride(props, "justify")) style.justifyContent = justify;
    const wrap = uiStyleValue(props.wrap, (v) => v ? "wrap" : "nowrap");
    if (wrap != null && !uiHasResponsiveOverride(props, "wrap")) style.flexWrap = wrap;
    const direction = uiStyleValue(props.direction);
    if (direction != null && !uiHasResponsiveOverride(props, "direction")) style.flexDirection = direction;
    const gap = uiStyleValue(props.gap, toCssSize);
    if (gap != null && !uiHasResponsiveOverride(props, "gap")) style.gap = gap;
    if (Object.keys(style).length) p.style = style;
    JSswift.uiApplyResponsiveProps(p, props, JSswift.uiResponsiveStyleRules);

    const el = _.div(p, ...renderSlotToArray(slots, "default", {}, children));
    setPropertyProps(el, props);
    return el;
  };
  UI.cardBody = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const cls = uiClass(["cms-card-body", props.class]);
    const p = JSswift.omit(props, [
      "slots", "display", "direction", "wrap", "align", "justify", "gap",
      "rowGap", "columnGap", "padding", "width"
    ]);
    p.class = cls;
    JSswift.uiApplyResponsiveProps(p, props, JSswift.uiResponsiveStyleRules);
    const el = _.div(p, ...renderSlotToArray(slots, "default", {}, children));
    setPropertyProps(el, props);
    return el;
  };
  UI.cardFooter = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const cls = uiClass(["cms-card-footer", uiWhen(props.divider, "divider"), props.class]);
    const p = JSswift.omit(props, ["divider", "align", "justify", "gap", "wrap", "direction", "slots"]);
    p.class = cls;

    const style = { ...(props.style || {}) };
    const align = uiStyleValue(props.align);
    if (align != null && !uiHasResponsiveOverride(props, "align")) style.alignItems = align;
    const justify = uiStyleValue(props.justify);
    if (justify != null && !uiHasResponsiveOverride(props, "justify")) style.justifyContent = justify;
    const wrap = uiStyleValue(props.wrap, (v) => v ? "wrap" : "nowrap");
    if (wrap != null && !uiHasResponsiveOverride(props, "wrap")) style.flexWrap = wrap;
    const direction = uiStyleValue(props.direction);
    if (direction != null && !uiHasResponsiveOverride(props, "direction")) style.flexDirection = direction;
    const gap = uiStyleValue(props.gap, toCssSize);
    if (gap != null && !uiHasResponsiveOverride(props, "gap")) style.gap = gap;
    if (Object.keys(style).length) p.style = style;
    JSswift.uiApplyResponsiveProps(p, props, JSswift.uiResponsiveStyleRules);

    const el = _.div(p, ...renderSlotToArray(slots, "default", {}, children));
    setPropertyProps(el, props);
    return el;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.cardHeader = {
      signature: "UI.cardHeader(...children) | UI.cardHeader(props, ...children)",
      props: {
        divider: "boolean",
        align: `stretch|flex-start|center|flex-end|baseline`,
        justify: `flex-start|center|flex-end|space-between|space-around|space-evenly`,
        wrap: "boolean",
        direction: "row|column|string",
        gap: "string|number",
        mobile: "{ gap?, align?, justify?, wrap?, direction? }",
        tablet: "{ gap?, align?, justify?, wrap?, direction? }",
        pc: "{ gap?, align?, justify?, wrap?, direction? }",
        slots: "{ default? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Card header content"
      },
      returns: "HTMLDivElement",
      description: "Header della card con supporto layout flex."
    };
    UI.meta.cardBody = {
      signature: "UI.cardBody(...children) | UI.cardBody(props, ...children)",
      props: {
        padding: "string|number",
        gap: "string|number",
        direction: "row|column|string",
        mobile: "{ padding?, gap?, direction?, width? }",
        tablet: "{ padding?, gap?, direction?, width? }",
        pc: "{ padding?, gap?, direction?, width? }",
        slots: "{ default? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Card body content"
      },
      returns: "HTMLDivElement",
      description: "Body della card."
    };
    UI.meta.cardFooter = {
      signature: "UI.cardFooter(...children) | UI.cardFooter(props, ...children)",
      props: {
        divider: "boolean",
        align: `stretch|flex-start|center|flex-end|baseline`,
        justify: `flex-start|center|flex-end|space-between|space-around|space-evenly`,
        wrap: "boolean",
        direction: "row|column|string",
        gap: "string|number",
        mobile: "{ gap?, align?, justify?, wrap?, direction? }",
        tablet: "{ gap?, align?, justify?, wrap?, direction? }",
        pc: "{ gap?, align?, justify?, wrap?, direction? }",
        slots: "{ default? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Card footer content"
      },
      returns: "HTMLDivElement",
      description: "Footer della card con supporto layout flex."
    };
  }

