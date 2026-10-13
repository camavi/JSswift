
  UI.Form = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const form = props.form; // required-ish
    const onSubmit = props.onSubmit; // async (model, form) => ...
    const cls = uiClass(["jss-form", props.class]);

    const p = JSswift.omit(props, ["form", "onSubmit", "slots"]);
    p.class = cls;

    const el = _.form({
      ...p,
      onReset: (e) => {
        if (!form) return;
        e.preventDefault();
        props.onReset?.(e);
        form.reset();
      },
      onSubmit: async (e) => {
        e.preventDefault();
        if (!form) return;
        await form.submit(onSubmit || (async () => { }));
      }
    });

    // children can be nodes or function(form)->nodes
    const content = [];
    const formChildren = props.slots?.default ? [props.slots.default] : children;
    for (const ch of (formChildren || [])) {
      const v = (typeof ch === "function") ? ch(form) : ch;
      const out = JSswift.ui.slot(v);
      if (!out) continue;
      if (Array.isArray(out)) content.push(...out);
      else content.push(out);
    }

    content.forEach(n => el.appendChild(n));

    // disable fields/buttons while submitting (optional UX)
    if (form && form.submitting) {
      const stop = JSswift.reactive.effect(() => {
        el.classList.toggle("is-submitting", !!form.submitting.value);
      }, "UI.Form:submitting");
      JSswift._registerCleanup(el, stop);
    }

    setPropertyProps(el, props);
    return el;
  };


  // ===============================
  // Dialog Service (Modal)
  // ===============================
