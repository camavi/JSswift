  /* ===============================
     ROD v3 PRO (batch + bindings + dispose hooks + key mapping)
     =============================== */

  function createMicrotaskScheduler() {
    let queued = false;
    const queue = new Set();
    function flush() {
      queued = false;
      JSswift.debug?.inc("rodFlushes");
      JSswift.perf?.inc("rodFlushes");
      JSswift.perf?.mark("rod:flush");
      const jobs = Array.from(queue);
      queue.clear();
      for (const fn of jobs) {
        try { fn(); } catch (e) { console.error("[rod] flush error:", e); }
      }
    }
    return function schedule(fn) {
      queue.add(fn);
      if (!queued) {
        queued = true;
        queueMicrotask(flush);
      }
    };
  }
  const rodSchedule = createMicrotaskScheduler();

  function rodApplyBinding(el, key, value) {
    if (!el) return;

    if (el.nodeType === 3) {
      el.textContent = value ?? "";
      return;
    }

    const domBridge = createDomPropBridge(el, {
      isSVG: el.namespaceURI === SVG_NS,
      normalizeClass,
      isContentProp
    });
    domBridge.applyBindingValue(key, value);
  }

  function rodCreateComponent(initialValue) {
    const comp = {
      type: "rod",
      value: initialValue,

      _bindings: [],
      _actions: [],
      _disposeHooks: [],

      _disposed: false,
      _silentDepth: 0,
      _pending: false,

      bindings() {
        return this._bindings.map(b => ({ el: b.el, key: b.key }));
      },

      onDispose(fn) {
        if (typeof fn === "function") this._disposeHooks.push(fn);
        return this;
      },

      _bind(el, config = { key: "auto" }) {
        if (this._disposed) return () => { };
        if (!el) return () => { };

        const b = { el, key: (config?.key ?? "auto") };

        const exists = this._bindings.some(x => x.el === b.el && x.key === b.key);
        if (!exists) this._bindings.push(b);

        rodApplyBinding(b.el, b.key, this.value);

        return () => {
          this._bindings = this._bindings.filter(x => !(x.el === b.el && x.key === b.key));
        };
      },

      action(fn) {
        if (!this._disposed && typeof fn === "function") this._actions.push(fn);
        return this;
      },

      _setSilent(v) {
        this._silentDepth++;
        try { this.value = v; } finally { this._silentDepth--; }
        return this;
      },

      _scheduleNotify() {
        if (this._disposed || this._pending) return;
        this._pending = true;
        rodSchedule(() => {
          this._pending = false;
          this._notifyNow();
        });
      },

      _notifyNow() {
        if (this._disposed) return;
        const __t0 = performance.now();

        JSswift.perf?.inc("rodNotifies");

        this._bindings = this._bindings.filter(b => {
          const el = b.el;
          if (!el) return false;
          if (el.nodeType === 3) return !!el.parentNode;
          return el.isConnected !== false;
        });

        for (const b of this._bindings) {
          rodApplyBinding(b.el, b.key, this.value);
        }

        if (this._silentDepth > 0) return;

        for (const fn of this._actions) {
          try { fn(this.value); } catch (e) { console.error("[rod] action error:", e); }
        }
        JSswift.debug?.inc("rodNotifies");
        JSswift.perf?.tick("rod:notify", performance.now() - __t0, {
          bindings: this._bindings?.length || 0,
          actions: this._actions?.length || 0
        });
      },

      dispose() {
        if (this._disposed) return;
        this._disposed = true;
        for (const fn of this._disposeHooks) {
          try { fn(); } catch (e) { console.error("[rod] dispose hook error:", e); }
        }
        this._bindings.length = 0;
        this._actions.length = 0;
        this._disposeHooks.length = 0;
      }
    };
    return comp;
  }

  function rodMakeReactive(obj, key = "value") {
    let _val = obj[key];
    let _get = null;
    let _set = null;
    let _disposeSignal = null;

    if (JSswift?.reactive?.signal) {
      [_get, _set, _disposeSignal] = JSswift.reactive.signal(_val);
      if (_disposeSignal && typeof obj.onDispose === "function") {
        obj.onDispose(_disposeSignal);
      }
    }

    Object.defineProperty(obj, key, {
      get() { return _get ? _get() : _val; },
      set(v) {
        if (_set) _set(v);
        else _val = v;
        obj._scheduleNotify();
      },
      configurable: true
    });

    if (typeof obj.val !== "function") {
      Object.defineProperty(obj, "val", {
        value(v) {
          if (arguments.length) {
            this.value = v;
            return v;
          }
          return this.value;
        },
        configurable: true
      });
    }

    if (!obj[Symbol.toPrimitive]) {
      Object.defineProperty(obj, Symbol.toPrimitive, {
        value(hint) {
          const v = this.value;
          if (v == null) return v;
          const t = typeof v;
          if (hint === "number") return Number(v);
          if (t !== "symbol") trackRodInterpolation(this, v);
          if (t === "string" || t === "number" || t === "boolean" || t === "bigint" || t === "symbol") return v;
          const out = String(v);
          return out;
        },
        configurable: true
      });
    }

    if (!obj.valueOf) {
      Object.defineProperty(obj, "valueOf", {
        value() { return this.value; },
        configurable: true
      });
    }

    if (!obj.toString) {
      Object.defineProperty(obj, "toString", {
        value() { return String(this.value); },
        configurable: true
      });
    }

    return obj;
  }

  _.rod = function _rod(data, key = "value") {
    const comp = rodCreateComponent(data);
    rodMakeReactive(comp, key);

    JSswift.rod._all = JSswift.rod._all || new Set();
    JSswift.rod._all.add(comp);

    if (typeof comp.onDispose === "function") {
      comp.onDispose(() => JSswift.rod._all.delete(comp));
    }
    return comp;
  }; // legacy alias, deprecated: use `_.rod`

  JSswift.rodBind = function (el, react, config = { key: "auto" }) {
    JSswift.debug?.inc("rodBinds");

    if (!el) {
      JSswift.debug?.inc("rodBindNull");
      JSswift.debug?.warn("rodBind: target element è null/undefined", config);
      return () => { };
    }
    if (!react || react.type !== "rod") {
      throw new Error("JSswift.rodBind: react must be a rod object");
    }
    return react._bind(el, config);
  };


  JSswift.rodFromSignal = function (get, set) {
    const r = _.rod(get());
    let syncing = false;

    const stopRodToSignal = JSswift.reactive.effect(() => {
      const v = r.value;
      const currentSignal = JSswift.reactive.untracked(() => get());
      if (syncing) return;
      if (currentSignal === v) return;
      syncing = true;
      try { set(v); } finally { syncing = false; }
    });

    const stopEffect = JSswift.reactive.effect(() => {
      const v = get();
      const currentRod = JSswift.reactive.untracked(() => r.value);
      if (currentRod === v) return;
      syncing = true;
      try { r._setSilent(v); } finally { syncing = false; }
    });

    if (typeof r.onDispose === "function") {
      r.onDispose(stopRodToSignal);
      r.onDispose(stopEffect);
    }

    return r;
  };
