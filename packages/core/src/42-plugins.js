  // ===============================
  // Plugin system (JSswift.usePlugin)
  // ===============================
  JSswift._plugins = new Set();

  JSswift.usePlugin = function (plugin, options) {
    if (!plugin) return;

    // evita doppia installazione
    if (JSswift._plugins.has(plugin)) {
      if (JSswift.config?.debug) {
        console.warn("[JSswift.usePlugin] plugin già installato:", plugin.name || plugin);
      }
      return;
    }

    // funzione-plugin
    if (typeof plugin === "function") {
      plugin(JSswift, options);
      JSswift._plugins.add(plugin);
      return;
    }

    // oggetto-plugin { install(app, opts) }
    if (plugin && typeof plugin.install === "function") {
      plugin.install(JSswift, options);
      JSswift._plugins.add(plugin);
      return;
    }

    console.warn("[JSswift.usePlugin] plugin non valido:", plugin);
  };

  //-- RESTA come esempio --
  JSswift.plugins = JSswift.plugins || {};
  JSswift.plugins.debug = {
    install(app) {
      app.config.debug = true;
      console.log("[JSswift] Debug mode ON");
    }
  };

  // ===============================
  // Plugin Forms (validation + UX)
  // ===============================
  JSswift.plugins.forms = {
    install(app) {
      const forms = {};

      app.forms = {
        validate(formEl, rules = {}, opts = {}) {
          if (typeof formEl === "string") formEl = app.dom.q(formEl);
          if (!formEl || !formEl.querySelectorAll) {
            console.warn("[forms.validate] form non valido:", formEl);
            return null;
          }

          const options = {
            mode: opts.mode || "input", // input | change | blur
            showMessages: opts.showMessages ?? true,
            submitGuard: opts.submitGuard ?? true,
            errorClass: opts.errorClass || "is-invalid",
            validClass: opts.validClass || "is-valid",
            messageClass: opts.messageClass || "form-error"
          };

          const fieldState = {}; // name -> { getErr, setErr }

          // setup fields
          for (const [name, rule] of Object.entries(rules)) {
            const els = formEl.querySelectorAll(`[name="${name}"]`);
            if (!els.length) continue;

            const [getErr, setErr] = app.reactive.signal(null);
            fieldState[name] = { getErr, setErr, els };

            // message node (uno per campo)
            let msgNode = null;
            if (options.showMessages) {
              msgNode = document.createElement("div");
              msgNode.className = options.messageClass;
              els[els.length - 1].after(msgNode);
            }

            const validateValue = () => {
              let value;
              const el = els[0];

              if (el.type === "checkbox") value = el.checked;
              else if (el.type === "radio") {
                const c = Array.from(els).find(r => r.checked);
                value = c ? c.value : null;
              } else value = el.value;

              let res = true;
              try {
                res = rule(value);
              } catch (e) {
                res = e.message || "Errore di validazione";
              }

              const error = res === true ? null : (typeof res === "string" ? res : "Valore non valido");
              setErr(error);
              return !error;
            };

            // bind events
            for (const el of els) {
              el.addEventListener(options.mode, validateValue);
            }

            // reactive UI
            app.reactive.effect(() => {
              const err = getErr();
              for (const el of els) {
                el.classList.toggle(options.errorClass, !!err);
                el.classList.toggle(options.validClass, !err);
              }
              if (msgNode) {
                msgNode.textContent = err || "";
                msgNode.style.display = err ? "block" : "none";
              }
            });

            // initial check
            validateValue();
          }

          // computed form validity
          const isValid = app.store.computed(() => {
            return Object.values(fieldState).every(f => !f.getErr());
          });

          // submit guard
          const onSubmit = (e) => {
            let ok = true;
            for (const f of Object.values(fieldState)) {
              const el = f.els[0];
              if (el) el.dispatchEvent(new Event(options.mode, { bubbles: true }));
              if (f.getErr()) ok = false;
            }
            if (!ok && options.submitGuard) {
              e.preventDefault();
              e.stopPropagation();
            }
          };

          if (options.submitGuard) {
            formEl.addEventListener("submit", onSubmit);
          }

          const dispose = () => {
            if (options.submitGuard) {
              formEl.removeEventListener("submit", onSubmit);
            }
          };

          forms[formEl] = { isValid, dispose };
          return { isValid, dispose };
        }
      };
    }
  };
