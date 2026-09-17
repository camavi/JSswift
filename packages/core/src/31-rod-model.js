  // ===============================
  // Two-way binding: input <-> rod
  // ===============================
  // ===============================
  // Two-way binding avanzato
  // input / checkbox / radio / select
  // ===============================

  function getInputKind(el) {
    if (!el || !el.tagName) return null;

    const tag = el.tagName.toLowerCase();

    if (tag === "input") {
      const type = (el.type || "text").toLowerCase();
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (type === "number") return "number";
      return "text";
    }

    if (tag === "select") {
      return el.multiple ? "select-multiple" : "select";
    }

    return null;
  }

  JSswift.rodModel = function (target, rodObj, opts = {}) {
    if (!rodObj || rodObj.type !== "rod") {
      throw new Error("[JSswift.rodModel] rodObj deve essere un rod");
    }

    // Supporta singolo elemento o lista (radio)
    const elements = Array.isArray(target) || target instanceof NodeList
      ? Array.from(target)
      : [target];

    const eventName = opts.event ?? "change";
    const parse = opts.parse ?? (v => v);
    const format = opts.format ?? (v => v);

    let syncing = false;
    const disposers = [];

    // === ROD → DOM ===
    const updateDOM = (value) => {
      for (const el of elements) {
        if (!el) continue;
        const kind = getInputKind(el);

        switch (kind) {
          case "checkbox":
            el.checked = !!value;
            break;

          case "radio":
            el.checked = el.value == value;
            break;

          case "select":
            el.value = value ?? "";
            break;

          case "select-multiple":
            const arr = Array.isArray(value) ? value.map(String) : [];
            for (const opt of el.options) {
              opt.selected = arr.includes(opt.value);
            }
            break;

          case "number":
          case "text":
          default:
            el.value = value ?? "";
        }
      }
    };

    // bind rod → DOM (usa rod.action)
    rodObj.action((v) => {
      if (syncing) return;
      syncing = true;
      try {
        updateDOM(format(v));
      } finally {
        syncing = false;
      }
    });

    // sync iniziale
    updateDOM(format(rodObj.value));

    // === DOM → ROD ===
    for (const el of elements) {
      if (!el) continue;

      const kind = getInputKind(el);

      const handler = () => {
        if (syncing) return;

        let next;

        switch (kind) {
          case "checkbox":
            next = el.checked;
            break;

          case "radio":
            if (!el.checked) return;
            next = el.value;
            break;

          case "select":
            next = el.value;
            break;

          case "select-multiple":
            next = Array.from(el.selectedOptions).map(o => o.value);
            break;

          case "number":
            next = parse(el.value === "" ? null : Number(el.value));
            break;

          case "text":
          default:
            next = parse(el.value);
        }

        syncing = true;
        try {
          if (rodObj.value !== next) rodObj.value = next;
        } finally {
          syncing = false;
        }
      };

      el.addEventListener(eventName, handler);
      disposers.push(() => el.removeEventListener(eventName, handler));
    }

    // cleanup automatico
    if (typeof rodObj.onDispose === "function") {
      rodObj.onDispose(() => disposers.forEach(fn => fn()));
    }

    return () => disposers.forEach(fn => fn());
  };


  // input <-> signal (sugar)
  JSswift.signalModel = function (inputEl, get, set, opts = {}) {
    const r = JSswift.rodFromSignal(get, set);
    return JSswift.rodModel(inputEl, r, opts);
  };
