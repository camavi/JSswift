  // ===============================
  // Debug utilities
  // ===============================
  JSswift.debug = (() => {
    const counters = {
      rodFlushes: 0,
      rodNotifies: 0,
      rodBinds: 0,
      rodBindNull: 0,
      rodBindDup: 0,
    };

    function enabled() {
      return !!JSswift.config.debug;
    }

    function log(...a) { if (enabled()) console.log("[JSswift]", ...a); }
    function warn(...a) { if (enabled()) console.warn("[JSswift]", ...a); }
    function error(...a) { console.error("[JSswift]", ...a); } // error sempre

    function inc(name, by = 1) {
      if (!counters[name]) counters[name] = 0;
      counters[name] += by;
    }

    function stats() {
      // snapshot immutabile
      return { ...counters };
    }

    function reset() {
      for (const k of Object.keys(counters)) counters[k] = 0;
    }

    return { enabled, log, warn, error, inc, stats, reset };
  })();

  // ===============================
  // Performance DevTools
  // ===============================
  JSswift.perf = (() => {
    let enabled = false;

    const counters = {
      effectsRun: 0,
      effectsSlow: 0,
      rodNotifies: 0,
      rodFlushes: 0,
      domWrites: 0,
      httpRequests: 0
    };

    const timeline = []; // {t,type,ms,meta}
    const slow = [];     // {ms, meta}

    const cfg = {
      timelineMax: 200,
      slowEffectMs: 8,   // soglia "lento"
    };

    function now() {
      return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    }

    function pushEvent(type, ms = 0, meta = null) {
      if (!enabled) return;
      timeline.push({ t: Date.now(), type, ms, meta });
      if (timeline.length > cfg.timelineMax) timeline.shift();
    }

    function inc(name, by = 1) {
      if (!enabled) return;
      counters[name] = (counters[name] || 0) + by;
    }

    function trackSlow(ms, meta) {
      if (!enabled) return;
      slow.push({ t: Date.now(), ms, meta });
      if (slow.length > 100) slow.shift();
    }

    // --- patch reactive.effect ---
    let _origEffect = null;

    function patchEffect() {
      if (_origEffect) return;
      _origEffect = JSswift.reactive.effect;

      JSswift.reactive.effect = function (fn, meta) {
        // meta opzionale (string/object) per identificare
        const wrapped = (...args) => {
          const t0 = now();
          inc("effectsRun");
          try { return fn(...args); }
          finally {
            const dt = now() - t0;
            if (dt >= cfg.slowEffectMs) {
              inc("effectsSlow");
              trackSlow(dt, meta || fn.name || "effect");
              pushEvent("effect:slow", dt, meta || fn.name || null);
            } else {
              pushEvent("effect", dt, meta || fn.name || null);
            }
          }
        };
        return _origEffect(wrapped);
      };
    }

    function unpatchEffect() {
      if (_origEffect) {
        JSswift.reactive.effect = _origEffect;
        _origEffect = null;
      }
    }

    // Public API
    function enable(on = true) {
      enabled = !!on;
      if (enabled) patchEffect();
      else unpatchEffect();
      return enabled;
    }

    function reset() {
      for (const k of Object.keys(counters)) counters[k] = 0;
      timeline.length = 0;
      slow.length = 0;
    }

    function stats() {
      return {
        enabled,
        ...counters,
        slowEffectMs: cfg.slowEffectMs,
        timelineSize: timeline.length
      };
    }

    function getTimeline() {
      return timeline.slice();
    }

    function slowEffects(minMs = cfg.slowEffectMs) {
      return slow.filter(x => x.ms >= minMs).slice().sort((a, b) => b.ms - a.ms);
    }

    // helper per misurare manualmente
    function time(label, fn) {
      const t0 = now();
      try { return fn(); }
      finally {
        const dt = now() - t0;
        pushEvent("time:" + label, dt, label);
      }
    }

    // hook utili da chiamare in rod/http
    function mark(type, meta) { pushEvent(type, 0, meta); }
    function tick(type, ms, meta) { pushEvent(type, ms, meta); }

    return {
      enable,
      reset,
      stats,
      timeline: getTimeline,
      slowEffects,
      time,
      mark,
      tick,
      inc,
      cfg
    };
  })();


