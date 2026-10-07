(() => {
  var _a, _b, _c, _d, _e, _f, _g, _h2, _i;
  window.JSswift = window.JSswift || {};
  const JSswift = window.JSswift;
  window._ = window.JSswift;
  JSswift.config = JSswift.config || {};
  const JSswiftBootstrapSetting = typeof globalThis !== "undefined" && globalThis.JSswift_setting ? globalThis.JSswift_setting : {};
  JSswift.config.debug = (_a = JSswiftBootstrapSetting.modeDev) != null ? _a : false;
  JSswift.isDev = function() {
    return JSswift.config.debug;
  };
  JSswift.uiNormalizeArgs = function(args) {
    let props = {};
    let children = args;
    if (args.length > 0 && typeof args[0] === "object" && args[0] !== null && !args[0].nodeType && !Array.isArray(args[0]) && !(args[0] instanceof Function)) {
      props = args[0];
      children = args.slice(1);
    }
    return { props, children };
  };
  JSswift.uiSizes = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"];
  JSswift.uiColors = ["primary", "secondary", "success", "warning", "danger", "info", "light", "dark"];
  JSswift.meta = JSswift.meta || { version: "1.0.23", policy: { sourceOfTruth: "docDevelop/reference/core.md", syncRule: "Quando cambia un modulo core, aggiornare sia questo meta sia docDevelop/reference/core.md." }, modules: { render: { description: "Bridge props -> DOM per hyperscript _, attributi, class, style, eventi e children reattivi.", entrypoints: ["createElement", "setProp", "bindProp"], status: "milestone-3-closed", knownLimits: ["Il mini-terzo-giro e il successivo micro-giro avanzato hanno chiuso style dinamico, eventi, children e props/attr speciali, ma restano altri edge case avanzati da esplorare.", "Gli eventi ora supportano composizione base di listener multipli, ma non hanno ancora delegation o diff avanzato.", "Restano da esplorare edge case avanzati del renderer oltre ai giri gia coperti dai test."] }, reactive: { description: "Core minimale signal/effect usato come base della reattivita.", entrypoints: ["JSswift.reactive.signal", "JSswift.reactive.effect", "JSswift.reactive.computed", "JSswift.reactive.untracked", "JSswift.reactive.batch"], status: "milestone-2-closed", knownLimits: ["La protezione loop copre i loop sincroni per singolo effect, non ancora i cicli complessi tra effect multipli.", "Il batching sincrono ora esiste, ma manca ancora scheduling configurabile oltre il flush immediato a fine batch.", "Mancano primitive avanzate per controllare scheduling e transazioni asincrone."] }, rod: { description: "Layer reattivo di alto livello per binding DOM, model e interpolazioni.", entrypoints: ["_.rod", "JSswift.rodBind", "JSswift.rodModel"], status: "milestone-2-closed", knownLimits: ["Va chiarito meglio il rapporto con JSswift.reactive oltre al primo riallineamento strutturale.", "Restano casi avanzati di model/binding da esplorare oltre al primo giro coperto dai test.", "Il modulo e piu pulito internamente ma non e ancora il punto finale della convergenza con il renderer."] }, mount: { description: "Mount, component instances e cleanup automatico del tree DOM.", entrypoints: ["JSswift.mount", "JSswift.component", "JSswift.enableAutoCleanup"], status: "milestone-2-closed", knownLimits: ["Il lifecycle e piu pulito internamente ma resta da chiarire meglio la semantica su multi-mount e cloni.", "Restano da esplorare edge case avanzati del cleanup automatico fuori dal primo giro gia coperto."] }, platform: { description: "Moduli applicativi nel core: overlay, store, auth, http, router, UI meta.", entrypoints: ["JSswift.overlay", "JSswift.store", "JSswift.plugins.auth", "JSswift.http", "JSswift.router", "JSswift.ui.meta"], status: "milestone-2-closed", knownLimits: ["Il secondo giro ha ripulito i moduli interni, ma mancano ancora demo separate per modulo e una validazione piu formale di alcune superfici pubbliche.", "Esiste una demo browser aggregata del blocco platform, ma non ancora demo separate per ogni modulo.", "Mancano configurazione pubblica piu coerente e confini piu netti tra auth, http e router.", "Il registry UI meta non ha ancora validazione formale del suo shape."] } } };
  JSswift.omit = (obj, keys) => {
    const out = {};
    const skip = new Set(keys || []);
    for (const k in obj || {}) {
      if (!skip.has(k)) out[k] = obj[k];
    }
    return out;
  };
  JSswift._cleanupRegistry = /* @__PURE__ */ new WeakMap();
  JSswift._registerCleanup = function(node, disposer) {
    if (!node || typeof disposer !== "function") return disposer;
    const list = JSswift._cleanupRegistry.get(node) || [];
    list.push(disposer);
    JSswift._cleanupRegistry.set(node, list);
    return disposer;
  };
  JSswift.dom = { q(sel, root = document) {
    return root.querySelector(sel);
  }, qa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }, attr(el, name, value) {
    if (!el) return null;
    if (value === void 0) return el.getAttribute(name);
    if (value === null) el.removeAttribute(name);
    else el.setAttribute(name, String(value));
    return el;
  } };
  (() => {
    let _queue = [];
    let _ready = false;
    function flushReady() {
      if (_ready) return;
      _ready = true;
      const q = _queue.slice();
      _queue.length = 0;
      for (const fn of q) {
        try {
          fn();
        } catch (e) {
          console.error("[JSswift.ready] error:", e);
        }
      }
    }
    JSswift.ready = function(fn) {
      if (typeof fn !== "function") return;
      if (_ready || document.readyState === "interactive" || document.readyState === "complete") {
        queueMicrotask(() => {
          try {
            fn();
          } catch (e) {
            console.error("[JSswift.ready] error:", e);
          }
        });
      } else {
        _queue.push(fn);
      }
    };
    document.addEventListener("DOMContentLoaded", flushReady, { once: true });
  })();
  JSswift.reactive = /* @__PURE__ */ (() => {
    let CURRENT_EFFECT = null;
    const EFFECT_STACK = [];
    const MAX_SYNC_EFFECT_RERUNS = 100;
    let BATCH_DEPTH = 0;
    let BATCH_FLUSH_MODE = "sync";
    let PENDING_FLUSH_MODE = "sync";
    let MICROTASK_FLUSH_SCHEDULED = false;
    const PENDING_RUNNERS = /* @__PURE__ */ new Set();
    function normalizeFlushMode(options) {
      const mode = options == null ? void 0 : options.flush;
      if (mode == null || mode === "sync") return "sync";
      if (mode === "microtask") return "microtask";
      throw new Error("JSswift.reactive.batch: options.flush must be 'sync' or 'microtask'");
    }
    function flushPendingRunners() {
      while (PENDING_RUNNERS.size) {
        const jobs = Array.from(PENDING_RUNNERS);
        PENDING_RUNNERS.clear();
        jobs.forEach((fn) => fn());
      }
    }
    function scheduleMicrotaskFlush() {
      if (MICROTASK_FLUSH_SCHEDULED) return;
      MICROTASK_FLUSH_SCHEDULED = true;
      queueMicrotask(() => {
        MICROTASK_FLUSH_SCHEDULED = false;
        PENDING_FLUSH_MODE = "sync";
        flushPendingRunners();
      });
    }
    function notifySubscribers(subs) {
      const jobs = Array.from(subs);
      if (BATCH_DEPTH > 0 || PENDING_FLUSH_MODE === "microtask") {
        jobs.forEach((fn) => PENDING_RUNNERS.add(fn));
        if (BATCH_DEPTH === 0 && PENDING_FLUSH_MODE === "microtask") {
          scheduleMicrotaskFlush();
        }
        return;
      }
      jobs.forEach((fn) => fn());
    }
    function cleanupEffect(record) {
      if (!record) return;
      if (record._deps.size) {
        record._deps.forEach((dep) => dep.delete(record._runner));
        record._deps.clear();
      }
      if (typeof record._cleanup === "function") {
        const cleanup = record._cleanup;
        record._cleanup = null;
        try {
          cleanup();
        } catch (e) {
          console.error("[JSswift.reactive.effect] cleanup error:", e);
        }
      }
    }
    function runEffect(record) {
      if (!record || !record.active) return;
      cleanupEffect(record);
      EFFECT_STACK.push(record);
      CURRENT_EFFECT = record;
      try {
        const onCleanup = (fn) => {
          record._cleanup = typeof fn === "function" ? fn : null;
        };
        const out = record.fn.length > 0 ? record.fn(onCleanup) : record.fn();
        if (typeof out === "function") {
          record._cleanup = out;
        }
      } finally {
        EFFECT_STACK.pop();
        CURRENT_EFFECT = EFFECT_STACK[EFFECT_STACK.length - 1] || null;
      }
    }
    function effect(fn) {
      if (typeof fn !== "function") return () => {
      };
      const record = { fn, active: true, _deps: /* @__PURE__ */ new Set(), _cleanup: null, _runner: null, _running: false, _queued: false };
      const runner = () => {
        if (!record.active) return;
        if (record._running) {
          record._queued = true;
          return;
        }
        record._running = true;
        let reruns = 0;
        try {
          do {
            record._queued = false;
            runEffect(record);
            reruns++;
            if (reruns >= MAX_SYNC_EFFECT_RERUNS) {
              record._queued = false;
              console.warn("[JSswift.reactive.effect] loop guard triggered: too many synchronous reruns", { max: MAX_SYNC_EFFECT_RERUNS, effect: fn.name || "anonymous" });
              break;
            }
          } while (record.active && record._queued);
        } finally {
          record._running = false;
        }
      };
      record._runner = runner;
      runner();
      return () => {
        if (!record.active) return;
        record.active = false;
        cleanupEffect(record);
      };
    }
    function signal(initial) {
      let value = initial;
      const subs = /* @__PURE__ */ new Set();
      function get() {
        if (CURRENT_EFFECT && CURRENT_EFFECT.active) {
          subs.add(CURRENT_EFFECT._runner);
          CURRENT_EFFECT._deps.add(subs);
        }
        return value;
      }
      function set(v) {
        value = v;
        notifySubscribers(subs);
      }
      function dispose() {
        subs.clear();
      }
      return [get, set, dispose];
    }
    function computed(fn) {
      if (typeof fn !== "function") throw new Error("JSswift.reactive.computed: fn must be a function");
      const [get, set, disposeSignal] = signal(void 0);
      const disposeEffect = effect(() => {
        set(fn());
      });
      const getter = () => get();
      getter.dispose = () => {
        disposeEffect();
        disposeSignal();
      };
      getter.peek = () => get();
      getter.type = "computed";
      return getter;
    }
    function untracked(fn) {
      if (typeof fn !== "function") throw new Error("JSswift.reactive.untracked: fn must be a function");
      const prevEffect = CURRENT_EFFECT;
      CURRENT_EFFECT = null;
      try {
        return fn();
      } finally {
        CURRENT_EFFECT = prevEffect;
      }
    }
    function batch(fn, options) {
      if (typeof fn !== "function") throw new Error("JSswift.reactive.batch: fn must be a function");
      const flushMode = normalizeFlushMode(options);
      if (BATCH_DEPTH === 0) {
        BATCH_FLUSH_MODE = flushMode;
      } else if (flushMode === "microtask") {
        BATCH_FLUSH_MODE = "microtask";
      }
      BATCH_DEPTH += 1;
      try {
        return fn();
      } finally {
        BATCH_DEPTH -= 1;
        if (BATCH_DEPTH === 0) {
          const shouldUseMicrotask = BATCH_FLUSH_MODE === "microtask" || PENDING_FLUSH_MODE === "microtask";
          BATCH_FLUSH_MODE = "sync";
          if (shouldUseMicrotask) {
            PENDING_FLUSH_MODE = "microtask";
            scheduleMicrotaskFlush();
          } else {
            flushPendingRunners();
          }
        }
      }
    }
    return { signal, effect, computed, untracked, batch };
  })();
  JSswift._overlayShared = (() => {
    const focusSelector = ["button:not([disabled])", "[href]", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])", "[tabindex]:not([tabindex='-1'])"].join(",");
    function ensureRoot(getRoot, setRoot) {
      const currentRoot = getRoot();
      if (currentRoot && currentRoot.isConnected) return currentRoot;
      let el = document.getElementById("jss-overlay-root");
      if (!el && (document == null ? void 0 : document.body)) {
        el = document.createElement("div");
        el.id = "jss-overlay-root";
        el.className = "jss-overlay-root";
        document.body.appendChild(el);
      }
      if (!document.body && !el) {
        JSswift.ready(() => {
          let readyEl = document.getElementById("jss-overlay-root");
          if (!readyEl) {
            readyEl = document.createElement("div");
            readyEl.id = "jss-overlay-root";
            readyEl.className = "jss-overlay-root";
            document.body.appendChild(readyEl);
          }
          setRoot(readyEl);
        });
      }
      setRoot(el);
      return el;
    }
    function focusFirst(container) {
      var _a2;
      const node = container.querySelector(focusSelector);
      (_a2 = node == null ? void 0 : node.focus) == null ? void 0 : _a2.call(node);
    }
    function trapFocus(event, container) {
      if (event.key !== "Tab") return;
      const nodes = Array.from(container.querySelectorAll(focusSelector)).filter((node) => node.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    function applyAnchoredPosition(panel, opts) {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      if (!opts.anchorEl) return;
      const anchorRect = opts.anchorEl.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const visualViewport = window.visualViewport || null;
      const viewportOffsetLeft = Math.max(0, Number(visualViewport == null ? void 0 : visualViewport.offsetLeft) || 0);
      const viewportOffsetTop = Math.max(0, Number(visualViewport == null ? void 0 : visualViewport.offsetTop) || 0);
      const viewportWidth = Math.max(Number(visualViewport == null ? void 0 : visualViewport.width) || 0, window.innerWidth || 0, ((_a2 = document.documentElement) == null ? void 0 : _a2.clientWidth) || 0);
      const viewportHeight = Math.max(Number(visualViewport == null ? void 0 : visualViewport.height) || 0, window.innerHeight || 0, ((_b2 = document.documentElement) == null ? void 0 : _b2.clientHeight) || 0);
      const rawGutter = Number((_d2 = (_c2 = opts.viewportGutter) != null ? _c2 : opts.gutter) != null ? _d2 : 8);
      const gutter = Number.isFinite(rawGutter) ? Math.max(0, rawGutter) : 8;
      const rawOffsetX = Number((_e2 = opts.offsetX) != null ? _e2 : 0);
      const rawOffsetY = Number((_f2 = opts.offsetY) != null ? _f2 : 8);
      const offsetX = Number.isFinite(rawOffsetX) ? rawOffsetX : 0;
      const offsetY = Number.isFinite(rawOffsetY) ? rawOffsetY : 8;
      const clamp = (value, min, max) => {
        if (!Number.isFinite(value)) return min;
        if (!Number.isFinite(min)) min = 0;
        if (!Number.isFinite(max)) max = min;
        if (max < min) return min;
        return Math.min(Math.max(value, min), max);
      };
      const rawPlacement = String(opts.placement || "bottom-start").toLowerCase();
      const [rawSide, rawAlign] = rawPlacement.split("-");
      const side = ["top", "bottom", "left", "right"].includes(rawSide) ? rawSide : "bottom";
      const align = ["start", "end", "center"].includes(rawAlign) ? rawAlign : "start";
      const oppositeSide = { top: "bottom", bottom: "top", left: "right", right: "left" }[side] || "top";
      const isVertical = side === "top" || side === "bottom";
      const panelWidth = panelRect.width;
      const panelHeight = panelRect.height;
      const computePosition = (targetSide) => {
        let left2 = anchorRect.left + offsetX;
        let top2 = anchorRect.top + offsetY;
        if (targetSide === "top" || targetSide === "bottom") {
          if (align === "center") left2 = anchorRect.left + (anchorRect.width - panelWidth) / 2 + offsetX;
          else if (align === "end") left2 = anchorRect.right - panelWidth + offsetX;
          top2 = targetSide === "top" ? anchorRect.top - panelHeight - offsetY : anchorRect.bottom + offsetY;
        } else {
          if (align === "center") top2 = anchorRect.top + (anchorRect.height - panelHeight) / 2 + offsetY;
          else if (align === "end") top2 = anchorRect.bottom - panelHeight + offsetY;
          left2 = targetSide === "left" ? anchorRect.left - panelWidth - offsetX : anchorRect.right + offsetX;
        }
        return { left: left2, top: top2 };
      };
      const availableSpace = (targetSide) => {
        if (targetSide === "top") return anchorRect.top - offsetY - gutter;
        if (targetSide === "bottom") return viewportHeight - anchorRect.bottom - offsetY - gutter;
        if (targetSide === "left") return anchorRect.left - offsetX - gutter;
        return viewportWidth - anchorRect.right - offsetX - gutter;
      };
      const preferredSpace = availableSpace(side);
      const oppositeSpace = availableSpace(oppositeSide);
      const requiredSpace = isVertical ? panelHeight : panelWidth;
      const resolvedSide = requiredSpace > preferredSpace && oppositeSpace > preferredSpace ? oppositeSide : side;
      const resolvedPosition = computePosition(resolvedSide);
      const minLeft = viewportOffsetLeft + gutter;
      const minTop = viewportOffsetTop + gutter;
      const maxLeft = Math.max(minLeft, viewportOffsetLeft + viewportWidth - panelWidth - gutter);
      const maxTop = Math.max(minTop, viewportOffsetTop + viewportHeight - panelHeight - gutter);
      const left = clamp(resolvedPosition.left, minLeft, maxLeft);
      const top = clamp(resolvedPosition.top, minTop, maxTop);
      panel.style.position = "fixed";
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }
    return { ensureRoot, focusFirst, trapFocus, applyAnchoredPosition };
  })();
  JSswift.overlay = (() => {
    let seq = 0;
    const stack = /* @__PURE__ */ new Map();
    let root = null;
    const { ensureRoot: ensureOverlayRoot, focusFirst, trapFocus, applyAnchoredPosition } = JSswift._overlayShared;
    const ensureRoot = () => ensureOverlayRoot(() => root, (nextRoot) => {
      root = nextRoot;
    });
    let scrollLockCount = 0;
    const lockScroll = () => {
      scrollLockCount++;
      if (scrollLockCount === 1) {
        document.documentElement.classList.add("jss-scroll-locked");
      }
    };
    const unlockScroll = () => {
      scrollLockCount = Math.max(0, scrollLockCount - 1);
      if (scrollLockCount === 0) {
        document.documentElement.classList.remove("jss-scroll-locked");
      }
    };
    const getTop = () => {
      let top = null;
      for (const e of stack.values()) top = e;
      return top;
    };
    const isOverlayInteractivePortal = (target) => {
      var _a2;
      let node = target;
      while (node && node !== document) {
        if (node.nodeType === 1 && ((_a2 = node.getAttribute) == null ? void 0 : _a2.call(node, "data-jss-overlay-portal")) === "true") return true;
        node = node.parentNode;
      }
      return false;
    };
    const open = (content, opts = {}) => {
      var _a2, _b2, _c2, _d2;
      const id = `ov_${++seq}`;
      const entry = { id, opts, isOpen: true, anchorEl: opts.anchorEl || null, placement: opts.placement || "bottom-start", onClose: typeof opts.onClose === "function" ? opts.onClose : null, overlay: null, panel: null, backdrop: null, reposition: null, _positionCleanup: null, _positionFrame: null, _panelResizeObserver: null, _cleanup: null };
      const overlay = document.createElement("div");
      overlay.className = ["jss-overlay", opts.type ? `type-${opts.type}` : ""].filter(Boolean).join(" ");
      overlay.dataset.id = id;
      const backdrop = document.createElement("div");
      backdrop.className = "jss-overlay-backdrop";
      if (!opts.backdrop) backdrop.style.display = "none";
      const panel = document.createElement("div");
      panel.className = ["jss-overlay-panel", opts.className].filter(Boolean).join(" ");
      panel.tabIndex = -1;
      const node = typeof content === "function" ? content({ close: () => close(id) }) : content;
      const normalized = JSswift.ui.slot(node);
      if (Array.isArray(normalized)) normalized.forEach((n) => n && panel.appendChild(n));
      else if (normalized) panel.appendChild(normalized);
      overlay.appendChild(backdrop);
      overlay.appendChild(panel);
      const host = ensureRoot();
      if (!host) return { id, close: () => close(id), panel, overlay };
      host.appendChild(overlay);
      entry.overlay = overlay;
      entry.panel = panel;
      entry.backdrop = backdrop;
      stack.set(id, entry);
      if (opts.lockScroll) lockScroll();
      if (opts.autoFocus !== false) setTimeout(() => {
        if (panel.isConnected && stack.get(id) === entry && !panel.contains(document.activeElement)) focusFirst(panel);
      }, 0);
      const position = (nextOpts = null) => {
        if (nextOpts && typeof nextOpts === "object") Object.assign(entry.opts, nextOpts);
        applyAnchoredPosition(panel, entry.opts);
      };
      const schedulePosition = () => {
        if (!opts.anchorEl) return;
        const raf = globalThis.requestAnimationFrame || ((fn) => setTimeout(() => fn(Date.now()), 0));
        if (entry._positionFrame != null) return;
        entry._positionFrame = raf(() => {
          entry._positionFrame = null;
          position();
        });
      };
      entry.reposition = position;
      if (opts.anchorEl) {
        position();
        schedulePosition();
        const onResize = schedulePosition;
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onResize, true);
        (_b2 = (_a2 = window.visualViewport) == null ? void 0 : _a2.addEventListener) == null ? void 0 : _b2.call(_a2, "resize", onResize);
        (_d2 = (_c2 = window.visualViewport) == null ? void 0 : _c2.addEventListener) == null ? void 0 : _d2.call(_c2, "scroll", onResize);
        if (typeof ResizeObserver === "function") {
          const panelResizeObserver = new ResizeObserver(schedulePosition);
          panelResizeObserver.observe(panel);
          entry._panelResizeObserver = panelResizeObserver;
        }
        entry._positionCleanup = () => {
          var _a3, _b3, _c3, _d3, _e2, _f2;
          const caf = globalThis.cancelAnimationFrame || clearTimeout;
          if (entry._positionFrame != null) {
            caf(entry._positionFrame);
            entry._positionFrame = null;
          }
          (_b3 = (_a3 = entry._panelResizeObserver) == null ? void 0 : _a3.disconnect) == null ? void 0 : _b3.call(_a3);
          entry._panelResizeObserver = null;
          window.removeEventListener("resize", onResize);
          window.removeEventListener("scroll", onResize, true);
          (_d3 = (_c3 = window.visualViewport) == null ? void 0 : _c3.removeEventListener) == null ? void 0 : _d3.call(_c3, "resize", onResize);
          (_f2 = (_e2 = window.visualViewport) == null ? void 0 : _e2.removeEventListener) == null ? void 0 : _f2.call(_e2, "scroll", onResize);
        };
      }
      const onDocClick = (e) => {
        const top = getTop();
        if (!top || top.id !== id) return;
        if (opts.closeOnOutside === false) return;
        if (isOverlayInteractivePortal(e.target)) return;
        if (!panel.contains(e.target)) close(id);
      };
      document.addEventListener("mousedown", onDocClick, true);
      const onKeyDown = (e) => {
        const top = getTop();
        if (!top || top.id !== id) return;
        if (opts.trapFocus) trapFocus(e, panel);
        if (e.key === "Escape" && opts.closeOnEsc !== false) {
          e.preventDefault();
          close(id);
        }
      };
      document.addEventListener("keydown", onKeyDown, true);
      backdrop.addEventListener("click", () => {
        if (opts.closeOnBackdrop === false) return;
        close(id);
      });
      entry._cleanup = () => {
        var _a3;
        document.removeEventListener("mousedown", onDocClick, true);
        document.removeEventListener("keydown", onKeyDown, true);
        (_a3 = entry._positionCleanup) == null ? void 0 : _a3.call(entry);
      };
      const z = 1e3 + stack.size * 10;
      overlay.style.zIndex = String(z);
      return { id, close: () => close(id), panel, overlay, reposition: position };
    };
    const close = (id) => {
      var _a2, _b2, _c2;
      const entry = stack.get(id);
      if (!entry) return;
      stack.delete(id);
      (_a2 = entry._cleanup) == null ? void 0 : _a2.call(entry);
      if (entry.opts.lockScroll) unlockScroll();
      if (typeof cleanupNodeTree === "function") cleanupNodeTree(entry.overlay);
      (_b2 = entry.overlay) == null ? void 0 : _b2.remove();
      (_c2 = entry.onClose) == null ? void 0 : _c2.call(entry);
    };
    const closeTop = () => {
      const top = getTop();
      if (top) close(top.id);
    };
    return { open, close, closeTop, root, _stack: stack };
  })();
  function createDomPropBridge(el, options = {}) {
    const { isSVG = false, normalizeClass: normalizeClassValue = (value) => String(value != null ? value : ""), isContentProp: isContent = () => false, autoValueTags = /* @__PURE__ */ new Set(["INPUT", "TEXTAREA", "SELECT"]) } = options;
    function isBooleanDomProp(name) {
      if (isSVG || !(name in el)) return false;
      try {
        return typeof el[name] === "boolean";
      } catch (e) {
        return false;
      }
    }
    function isAttributeOnlyProp(name) {
      return isSVG || name.startsWith("data-") || name.startsWith("aria-") || !(name in el);
    }
    function setAttributeValue(name, value) {
      if (value == null) {
        el.removeAttribute(name);
        return;
      }
      if (value === false) {
        if (name.startsWith("aria-")) {
          el.setAttribute(name, "false");
          return;
        }
        el.removeAttribute(name);
        return;
      }
      if (value === true && !isSVG && !name.startsWith("aria-") && !name.startsWith("data-")) {
        el.setAttribute(name, "");
        return;
      }
      el.setAttribute(name, String(value));
    }
    function setStyleEntry(name, value) {
      if (name == null) return;
      const styleName = String(name);
      const isCssProperty = styleName.startsWith("--") || styleName.includes("-");
      if (value == null || value === false || value === "") {
        if (isCssProperty) el.style.removeProperty(styleName);
        else el.style[styleName] = "";
        return;
      }
      if (isCssProperty) {
        el.style.setProperty(styleName, String(value));
        return;
      }
      el.style[styleName] = value;
    }
    function setClassValue(value) {
      const normalized = normalizeClassValue(value);
      if (normalized == null || normalized === false || normalized === "") {
        el.removeAttribute("class");
        return;
      }
      el.setAttribute("class", String(normalized));
    }
    function setBooleanProp(name, value) {
      const next = !!value;
      el[name] = next;
      if (next) el.setAttribute(name, "");
      else el.removeAttribute(name);
    }
    function removeProp(name) {
      if (isContent(name)) {
        el[name] = "";
        return;
      }
      if (name === "class") {
        el.removeAttribute("class");
        return;
      }
      if (name === "style") {
        el.removeAttribute("style");
        return;
      }
      if (isBooleanDomProp(name)) {
        try {
          el[name] = false;
        } catch (e) {
        }
        el.removeAttribute(name);
        return;
      }
      el.removeAttribute(name);
      if (!isAttributeOnlyProp(name)) {
        try {
          if (typeof el[name] === "string") el[name] = "";
        } catch (e) {
        }
      }
    }
    function applyStyleObject(styleObj) {
      if (!styleObj || typeof styleObj !== "object") return;
      Object.entries(styleObj).forEach(([styleName, styleValue]) => {
        setStyleEntry(styleName, styleValue);
      });
    }
    function setProp(name, value) {
      if (isContent(name)) {
        el[name] = value != null ? value : "";
        return;
      }
      if (name === "class") {
        setClassValue(value);
        return;
      }
      if (name === "style") {
        if (value == null || value === false) {
          removeProp(name);
          return;
        }
        if (typeof value === "object") {
          applyStyleObject(value);
          return;
        }
      }
      if (isBooleanDomProp(name)) {
        setBooleanProp(name, value);
        return;
      }
      if (value == null || value === false) {
        removeProp(name);
        return;
      }
      if (isAttributeOnlyProp(name)) {
        setAttributeValue(name, value);
        return;
      }
      el[name] = value;
    }
    function setPathValue(path, value) {
      const parts = String(path).split(".");
      let obj = el;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj == null ? void 0 : obj[parts[i]];
        if (!obj) return;
      }
      obj[parts[parts.length - 1]] = value;
    }
    function isBindingValueKey(name) {
      if (!name) return false;
      return name === "auto" || name.startsWith("attr:") || name.startsWith("@") || name.startsWith("style.") || name.includes(".");
    }
    function applyBindingValue(name, value) {
      if (!name || name === "auto") {
        if (autoValueTags.has(el.tagName)) {
          setProp("value", value);
        } else {
          el.textContent = value != null ? value : "";
        }
        return;
      }
      if (name.startsWith("attr:")) {
        setAttributeValue(name.slice(5), value);
        return;
      }
      if (name.startsWith("@")) {
        setAttributeValue(name.slice(1), value);
        return;
      }
      if (name.startsWith("style.")) {
        setStyleEntry(name.slice(6), value);
        return;
      }
      if (name.includes(".")) {
        setPathValue(name, value);
        return;
      }
      setProp(name, value);
    }
    return { isBooleanDomProp, isAttributeOnlyProp, isBindingValueKey, setAttributeValue, setStyleEntry, setClassValue, setBooleanProp, removeProp, applyStyleObject, setProp, setPathValue, applyBindingValue };
  }
  function normalizeClass(v) {
    const tokens = [];
    const add = (value) => {
      if (value == null || value === false) return;
      if (typeof value === "function") {
        add(value());
        return;
      }
      if (value && value.type === "rod") {
        add(value.value);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(add);
        return;
      }
      if (typeof value === "object") {
        Object.entries(value).forEach(([className, enabled]) => {
          let resolved = enabled;
          if (typeof resolved === "function") resolved = resolved();
          else if (resolved && resolved.type === "rod") resolved = resolved.value;
          add(resolved ? className : null);
        });
        return;
      }
      if (value === true) return;
      String(value).split(/\s+/).forEach((token) => {
        if (token) tokens.push(token);
      });
    };
    add(v);
    return tokens.length ? Array.from(new Set(tokens)).join(" ") : "";
  }
  function hasDynamicClassValue(value) {
    if (value == null || value === false) return false;
    if (typeof value === "function") return true;
    if (value && value.type === "rod") return true;
    if (Array.isArray(value)) return value.some(hasDynamicClassValue);
    if (typeof value === "object") return Object.values(value).some(hasDynamicClassValue);
    return false;
  }
  function hasDynamicStyleValue(value, isRod) {
    if (value == null || value === false) return false;
    if (typeof value === "function") return true;
    if (isRod(value)) return true;
    if (typeof value !== "object" || Array.isArray(value) || value.nodeType) return false;
    return Object.values(value).some((entry) => hasDynamicStyleValue(entry, isRod));
  }
  function resolveStyleObject(value, isRod) {
    let next = value;
    if (typeof next === "function") next = next();
    else if (isRod(next)) next = next.value;
    if (!next || typeof next !== "object" || Array.isArray(next) || next.nodeType) {
      return null;
    }
    const out = {};
    Object.entries(next).forEach(([styleName, styleValue]) => {
      let resolved = styleValue;
      if (typeof resolved === "function") resolved = resolved();
      else if (isRod(resolved)) resolved = resolved.value;
      out[styleName] = resolved;
    });
    return out;
  }
  function createStyleObjectApplier(setStyleEntry) {
    let previousKeys = /* @__PURE__ */ new Set();
    function clearMissing(nextKeys) {
      previousKeys.forEach((styleName) => {
        if (!nextKeys.has(styleName)) setStyleEntry(styleName, null);
      });
      previousKeys = nextKeys;
    }
    function apply(value, isRod) {
      const nextStyle = resolveStyleObject(value, isRod);
      if (!nextStyle) {
        clearMissing(/* @__PURE__ */ new Set());
        return;
      }
      const nextKeys = new Set(Object.keys(nextStyle));
      clearMissing(nextKeys);
      Object.entries(nextStyle).forEach(([styleName, styleValue]) => {
        setStyleEntry(styleName, styleValue);
      });
    }
    return { apply };
  }
  function isEventProp(key) {
    return typeof key === "string" && (key.startsWith("on:") || key.startsWith("on") && key.length > 2);
  }
  const ROD_INTERPOLATION_BUFFER_LIMIT = 128;
  const rodInterpolationBuffer = [];
  function trackRodInterpolation(rod, value) {
    rodInterpolationBuffer.push({ rod, value: String(value != null ? value : "") });
    if (rodInterpolationBuffer.length > ROD_INTERPOLATION_BUFFER_LIMIT) {
      rodInterpolationBuffer.splice(0, rodInterpolationBuffer.length - ROD_INTERPOLATION_BUFFER_LIMIT);
    }
  }
  function createRodInterpolationCursor() {
    if (!rodInterpolationBuffer.length) return null;
    const items = rodInterpolationBuffer.slice();
    rodInterpolationBuffer.length = 0;
    return { items, index: 0 };
  }
  function takeInterpolatedSegments(text, cursor) {
    if (!cursor || !text || cursor.index >= cursor.items.length) return null;
    const segments = [];
    const source = String(text);
    let offset = 0;
    let nextIndex = cursor.index;
    let matched = false;
    while (nextIndex < cursor.items.length) {
      const entry = cursor.items[nextIndex];
      const needle = entry.value;
      if (!needle) break;
      const pos = source.indexOf(needle, offset);
      if (pos === -1) break;
      if (pos > offset) segments.push(source.slice(offset, pos));
      segments.push(entry.rod);
      offset = pos + needle.length;
      nextIndex++;
      matched = true;
    }
    if (!matched) return null;
    if (offset < source.length) segments.push(source.slice(offset));
    cursor.index = nextIndex;
    return segments;
  }
  function renderInterpolatedSegments(segments) {
    var _a2;
    let out = "";
    for (const part of segments) {
      if (typeof part === "string") out += part;
      else out += (_a2 = part == null ? void 0 : part.value) != null ? _a2 : "";
    }
    return out;
  }
  function getEventName(key) {
    if (key.startsWith("on:")) return key.slice(3);
    const raw = key.slice(2);
    if (!raw) return "";
    if (raw === "DoubleClick") return "dblclick";
    return raw.toLowerCase();
  }
  function normalizeEventOptions(options) {
    if (options == null || options === false) return false;
    if (options === true) return { capture: true };
    if (typeof options === "boolean") return options;
    if (typeof options === "object") {
      return { capture: !!options.capture, passive: !!options.passive, once: !!options.once };
    }
    return false;
  }
  function eventOptionsEqual(a, b) {
    const left = normalizeEventOptions(a);
    const right = normalizeEventOptions(b);
    if (typeof left === "boolean" || typeof right === "boolean") return left === right;
    return !!left && !!right && left.capture === right.capture && left.passive === right.passive && left.once === right.once;
  }
  function hasDynamicEventValue(value, isRod) {
    if (Array.isArray(value)) return value.some((entry) => hasDynamicEventValue(entry, isRod));
    if (isRod(value)) return true;
    if (!value || typeof value !== "object" || Array.isArray(value) || value.nodeType) return false;
    if (Array.isArray(value.handlers)) return value.handlers.some((entry) => hasDynamicEventValue(entry, isRod)) || isRod(value.options) || typeof value.options === "function";
    if (Array.isArray(value.listeners)) return value.listeners.some((entry) => hasDynamicEventValue(entry, isRod)) || isRod(value.options) || typeof value.options === "function";
    return isRod(value.handler) || isRod(value.listener) || isRod(value.fn) || isRod(value.options) || typeof value.options === "function";
  }
  function normalizeEventEntry(value, isRod, inheritedOptions) {
    var _a2, _b2, _c2, _d2, _e2, _f2, _g2;
    if (value == null || value === false) {
      return [];
    }
    if (typeof value === "function") {
      return [{ handler: value, options: normalizeEventOptions(inheritedOptions != null ? inheritedOptions : false) }];
    }
    if (isRod(value)) {
      return normalizeEventEntry(value.value, isRod, inheritedOptions);
    }
    if (Array.isArray(value)) {
      return value.flatMap((entry) => normalizeEventEntry(entry, isRod, inheritedOptions));
    }
    if (typeof value === "object" && !Array.isArray(value) && !value.nodeType) {
      if (Array.isArray(value.handlers) || Array.isArray(value.listeners)) {
        const handlers = value.handlers || value.listeners || [];
        const sharedOptions = (_b2 = (_a2 = value.options) != null ? _a2 : inheritedOptions) != null ? _b2 : false;
        return handlers.flatMap((entry) => normalizeEventEntry(entry, isRod, sharedOptions));
      }
      let handler = (_e2 = (_d2 = (_c2 = value.handler) != null ? _c2 : value.listener) != null ? _d2 : value.fn) != null ? _e2 : null;
      let options = (_g2 = (_f2 = value.options) != null ? _f2 : inheritedOptions) != null ? _g2 : false;
      if (isRod(handler)) handler = handler.value;
      if (isRod(options)) options = options.value;
      if (typeof options === "function") options = options();
      return typeof handler === "function" ? [{ handler, options: normalizeEventOptions(options) }] : [];
    }
    return [];
  }
  function normalizeEventValue(value, isRod) {
    return normalizeEventEntry(value, isRod);
  }
  function bindEventProp(el, key, value, isRod) {
    const eventName = getEventName(key);
    if (!eventName) return;
    const state = { listeners: [] };
    const detach = () => {
      state.listeners.forEach((entry) => {
        el.removeEventListener(eventName, entry.dispatch, entry.options);
      });
      state.listeners = [];
    };
    const apply = (nextValue) => {
      const nextListeners = normalizeEventValue(nextValue, isRod);
      const isSameShape = state.listeners.length === nextListeners.length && state.listeners.every((entry, index) => {
        const next = nextListeners[index];
        return entry.handler === next.handler && eventOptionsEqual(entry.options, next.options);
      });
      if (isSameShape) return;
      detach();
      nextListeners.forEach((listener) => {
        const entry = { handler: listener.handler, options: listener.options, dispatch: null };
        entry.dispatch = (event) => {
          if (typeof entry.handler === "function") {
            const result = entry.handler.call(el, event);
            if (entry.options && typeof entry.options === "object" && entry.options.once) {
              el.removeEventListener(eventName, entry.dispatch, entry.options);
              state.listeners = state.listeners.filter((item) => item !== entry);
            }
            return result;
          }
        };
        el.addEventListener(eventName, entry.dispatch, entry.options);
        state.listeners.push(entry);
      });
    };
    JSswift._registerCleanup(el, detach);
    if (isRod(value)) {
      const stop = JSswift.reactive.effect(() => {
        apply(value.value);
      });
      JSswift._registerCleanup(el, stop);
      return;
    }
    if (hasDynamicEventValue(value, isRod)) {
      const stop = JSswift.reactive.effect(() => {
        apply(value);
      });
      JSswift._registerCleanup(el, stop);
      return;
    }
    apply(value);
  }
  function createRendererChildHelpers(el, options = {}) {
    const { isRod = () => false, interpolationCursor = null } = options;
    function createRodTextNode(rod) {
      const t = document.createTextNode("");
      const unbind = JSswift.rodBind(t, rod);
      JSswift._registerCleanup(t, unbind);
      return t;
    }
    function appendRodText(rod) {
      el.appendChild(createRodTextNode(rod));
    }
    function appendInterpolatedText(segments) {
      const t = document.createTextNode("");
      el.appendChild(t);
      const stop = JSswift.reactive.effect(() => {
        t.textContent = renderInterpolatedSegments(segments);
      });
      JSswift._registerCleanup(t, stop);
    }
    function normalizeDynamicChildNodes(value) {
      const out = [];
      const add = (item) => {
        if (item == null || item === false) return;
        if (Array.isArray(item)) {
          item.forEach(add);
          return;
        }
        if (typeof item === "string") {
          out.push(document.createTextNode(item));
          return;
        }
        if (typeof item === "number") {
          out.push(document.createTextNode(String(item)));
          return;
        }
        if (typeof item === "boolean") return;
        if (isRod(item)) {
          out.push(createRodTextNode(item));
          return;
        }
        if (item == null ? void 0 : item.nodeType) {
          out.push(item);
          return;
        }
        out.push(document.createTextNode(String(item)));
      };
      add(value);
      return out;
    }
    function appendDynamicChild(renderFn) {
      const anchor = document.createComment("dyn");
      el.appendChild(anchor);
      let currentNodes = [];
      const stop = JSswift.reactive.effect(() => {
        currentNodes.forEach((node) => {
          cleanupNodeTree(node);
          if (node.parentNode) node.parentNode.removeChild(node);
        });
        currentNodes = [];
        const parent = anchor.parentNode;
        if (!parent) return;
        const nextNodes = normalizeDynamicChildNodes(renderFn());
        if (!nextNodes.length) return;
        const frag = document.createDocumentFragment();
        nextNodes.forEach((node) => frag.appendChild(node));
        parent.insertBefore(frag, anchor.nextSibling);
        currentNodes = nextNodes;
      });
      JSswift._registerCleanup(anchor, () => {
        stop();
        currentNodes.forEach((node) => cleanupNodeTree(node));
        currentNodes = [];
      });
    }
    function appendChildValue(value) {
      if (value == null) return;
      if (Array.isArray(value)) {
        for (const item of value) appendChildValue(item);
        return;
      }
      if (typeof value === "string") {
        const segments = takeInterpolatedSegments(value, interpolationCursor);
        if (segments) appendInterpolatedText(segments);
        else el.appendChild(document.createTextNode(value));
        return;
      }
      if (typeof value === "number") {
        el.appendChild(document.createTextNode(String(value)));
        return;
      }
      if (typeof value === "function") {
        appendDynamicChild(value);
        return;
      }
      if (isRod(value)) {
        appendRodText(value);
        return;
      }
      if (value.nodeType) {
        el.appendChild(value);
      }
    }
    return { appendRodText, appendInterpolatedText, appendDynamicChild, appendChildValue };
  }
  function applyRendererArgs(args, options = {}) {
    const { el, isRod = () => false, interpolationCursor = null, appendChildValue = () => {
    }, appendRodText = () => {
    }, appendInterpolatedText = () => {
    }, appendDynamicChild = () => {
    }, bindProp = () => {
    } } = options;
    for (const arg of args) {
      if (arg == null) continue;
      if (Array.isArray(arg)) {
        appendChildValue(arg);
        continue;
      }
      if (typeof arg === "string") {
        const segments = takeInterpolatedSegments(arg, interpolationCursor);
        if (segments) appendInterpolatedText(segments);
        else el.appendChild(document.createTextNode(arg));
        continue;
      }
      if (typeof arg === "number") {
        el.appendChild(document.createTextNode(String(arg)));
        continue;
      }
      if (typeof arg === "function") {
        appendDynamicChild(arg);
        continue;
      }
      if (isRod(arg)) {
        appendRodText(arg);
        continue;
      }
      if (arg.nodeType) {
        el.appendChild(arg);
        continue;
      }
      if (typeof arg === "object") {
        for (const [key, value] of Object.entries(arg)) {
          if (typeof value === "string") {
            const segments = takeInterpolatedSegments(value, interpolationCursor);
            if (segments) {
              bindProp(key, () => renderInterpolatedSegments(segments));
              continue;
            }
          }
          if (key === "class") {
            bindProp(key, value);
            continue;
          }
          if (key === "style" && typeof value === "object" && value !== null && !isRod(value)) {
            bindProp(key, value);
            continue;
          }
          bindProp(key, value);
        }
      }
    }
  }
  const SVG_NS = "http://www.w3.org/2000/svg";
  const SVG_TAGS = /* @__PURE__ */ new Set(["svg", "g", "path", "circle", "ellipse", "line", "rect", "polygon", "polyline", "text", "tspan", "defs", "linearGradient", "radialGradient", "stop", "use", "symbol", "clipPath", "mask", "pattern", "filter", "feGaussianBlur", "feOffset", "feBlend", "feColorMatrix"]);
  function isContentProp(key) {
    return key === "innerHTML" || key === "innerText" || key === "textContent" || key === "value";
  }
  function createElement(tag, ...args) {
    const isSVG = SVG_TAGS.has(tag);
    const el = tag === "text" && !isSVG ? document.createTextNode("") : isSVG ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    const isRod = (v) => !!v && v.type === "rod";
    const interpolationCursor = createRodInterpolationCursor();
    const childHelpers = createRendererChildHelpers(el, { isRod, interpolationCursor });
    const { appendRodText, appendInterpolatedText, appendDynamicChild, appendChildValue } = childHelpers;
    const domBridge = createDomPropBridge(el, { isSVG, normalizeClass, isContentProp });
    const { isBooleanDomProp, isBindingValueKey, applyBindingValue, setStyleEntry, setProp, setClassValue } = domBridge;
    function registerNodeEffect(run) {
      const stop = JSswift.reactive.effect(run);
      JSswift._registerCleanup(el, stop);
      return stop;
    }
    function isNumericValueControl(control) {
      if (String((control == null ? void 0 : control.tagName) || "").toLowerCase() !== "input") return false;
      const inputType = String((control == null ? void 0 : control.type) || "").toLowerCase();
      return inputType === "range" || inputType === "number";
    }
    function getValueControlType(control) {
      if (String((control == null ? void 0 : control.tagName) || "").toLowerCase() !== "input") return "";
      return String((control == null ? void 0 : control.type) || "").toLowerCase();
    }
    function isSingleSelectControl(control) {
      return String((control == null ? void 0 : control.tagName) || "").toLowerCase() === "select" && !control.multiple;
    }
    function isFileInputControl(control) {
      return String((control == null ? void 0 : control.tagName) || "").toLowerCase() === "input" && String((control == null ? void 0 : control.type) || "").toLowerCase() === "file";
    }
    function bindRodValueControl(control, rodValue, eventName) {
      registerNodeEffect(() => {
        var _a2;
        const next = (_a2 = rodValue.value) != null ? _a2 : "";
        if (control.value !== String(next)) setProp("value", next);
      });
      const onValueChange = () => {
        let next = control.value;
        const controlType = getValueControlType(control);
        const isNumericRod = typeof rodValue.value === "number" || rodValue.value == null;
        if (isSingleSelectControl(control) && control.value === "") {
          next = null;
        } else if (isNumericValueControl(control) && isNumericRod) {
          if (controlType === "number" && control.value === "") {
            next = null;
          } else {
            const numeric = typeof control.valueAsNumber === "number" && !Number.isNaN(control.valueAsNumber) ? control.valueAsNumber : Number(control.value);
            next = Number.isNaN(numeric) ? controlType === "number" ? null : 0 : numeric;
          }
        }
        if (rodValue.value !== next) rodValue.value = next;
      };
      control.addEventListener(eventName, onValueChange);
      JSswift._registerCleanup(control, () => {
        control.removeEventListener(eventName, onValueChange);
      });
    }
    function bindRodCheckedControl(control, rodValue) {
      registerNodeEffect(() => {
        const next = !!rodValue.value;
        if (!!control.checked !== next) setProp("checked", next);
      });
      const onCheckedChange = () => {
        const next = !!control.checked;
        if (rodValue.value !== next) rodValue.value = next;
      };
      control.addEventListener("change", onCheckedChange);
      JSswift._registerCleanup(control, () => {
        control.removeEventListener("change", onCheckedChange);
      });
    }
    function bindRodRadioControl(control, rodValue) {
      const readOwnValue = () => {
        var _a2;
        return String((_a2 = control.value) != null ? _a2 : "on");
      };
      registerNodeEffect(() => {
        const next = rodValue.value == null ? null : String(rodValue.value);
        const shouldCheck = next === readOwnValue();
        if (!!control.checked !== shouldCheck) setProp("checked", shouldCheck);
      });
      const onCheckedChange = () => {
        if (!control.checked) return;
        const next = readOwnValue();
        if (rodValue.value !== next) rodValue.value = next;
      };
      control.addEventListener("change", onCheckedChange);
      JSswift._registerCleanup(control, () => {
        control.removeEventListener("change", onCheckedChange);
      });
    }
    function bindRodFilesControl(control, rodValue) {
      const readFiles = () => {
        const files = control.files;
        if (files == null) return [];
        if (Array.isArray(files)) return files.slice();
        if (typeof files.length === "number") return Array.from(files);
        return [files];
      };
      registerNodeEffect(() => {
        const next = rodValue.value;
        const shouldClear = next == null || Array.isArray(next) && next.length === 0;
        if (!shouldClear) return;
        if (control.value !== "") setProp("value", "");
        if (Array.isArray(control.files)) control.files = [];
      });
      const onFilesChange = () => {
        const next = readFiles();
        rodValue.value = next;
      };
      control.addEventListener("change", onFilesChange);
      JSswift._registerCleanup(control, () => {
        control.removeEventListener("change", onFilesChange);
      });
    }
    function bindRodSelectMultiple(control, rodValue) {
      const readValues = () => Array.from(control.childNodes || []).filter((node) => (node == null ? void 0 : node.tagName) === "OPTION" && node.selected).map((node) => {
        var _a2;
        return String((_a2 = node.value) != null ? _a2 : "");
      });
      const applyFromRod = () => {
        const nextValues = Array.isArray(rodValue.value) ? rodValue.value.map((item) => String(item)) : [];
        const nextSet = new Set(nextValues);
        Array.from(control.childNodes || []).forEach((node) => {
          var _a2;
          if ((node == null ? void 0 : node.tagName) !== "OPTION") return;
          const shouldSelect = nextSet.has(String((_a2 = node.value) != null ? _a2 : ""));
          if (!!node.selected === shouldSelect) return;
          node.selected = shouldSelect;
          if (shouldSelect) node.setAttribute("selected", "");
          else node.removeAttribute("selected");
        });
      };
      registerNodeEffect(applyFromRod);
      control._jssApplySelectedValues = applyFromRod;
      queueMicrotask(applyFromRod);
      const onValueChange = () => {
        const next = readValues();
        const current = Array.isArray(rodValue.value) ? rodValue.value.map((item) => String(item)) : [];
        if (current.length === next.length && current.every((item, index) => item === next[index])) return;
        rodValue.value = next;
      };
      control.addEventListener("change", onValueChange);
      JSswift._registerCleanup(control, () => {
        control.removeEventListener("change", onValueChange);
      });
    }
    function bindRodOptionSelected(optionEl, rodValue) {
      registerNodeEffect(() => {
        const next = !!rodValue.value;
        if (!!optionEl.selected !== next) setProp("selected", next);
      });
      let parentSelect = null;
      const onParentChange = () => {
        const next = !!optionEl.selected;
        if (rodValue.value !== next) rodValue.value = next;
      };
      const attachParent = () => {
        var _a2;
        if (parentSelect || ((_a2 = optionEl.parentNode) == null ? void 0 : _a2.tagName) !== "SELECT") return;
        parentSelect = optionEl.parentNode;
        parentSelect.addEventListener("change", onParentChange);
      };
      queueMicrotask(attachParent);
      JSswift._registerCleanup(optionEl, () => {
        parentSelect == null ? void 0 : parentSelect.removeEventListener("change", onParentChange);
      });
    }
    function bindProp(key, value) {
      if (isEventProp(key)) {
        bindEventProp(el, key, value, isRod);
        return;
      }
      if (key === "class") {
        if (hasDynamicClassValue(value)) {
          registerNodeEffect(() => {
            setClassValue(normalizeClass(value));
          });
          return;
        }
        setClassValue(normalizeClass(value));
        return;
      }
      if (key === "style" && value && typeof value === "object") {
        const styleApplier = createStyleObjectApplier(setStyleEntry);
        if (hasDynamicStyleValue(value, isRod)) {
          registerNodeEffect(() => {
            styleApplier.apply(value, isRod);
          });
          return;
        }
        styleApplier.apply(value, isRod);
        return;
      }
      if (key === "style" && (typeof value === "function" || isRod(value))) {
        const styleApplier = createStyleObjectApplier(setStyleEntry);
        registerNodeEffect(() => {
          styleApplier.apply(value, isRod);
        });
        return;
      }
      if (isBindingValueKey(key) && typeof value === "function") {
        registerNodeEffect(() => {
          applyBindingValue(key, value());
        });
        return;
      }
      if (isBindingValueKey(key) && !isRod(value)) {
        applyBindingValue(key, value);
        return;
      }
      if (typeof value === "function") {
        registerNodeEffect(() => {
          setProp(key, value());
        });
        return;
      }
      if (key === "value" && isRod(value) && (tag === "input" || tag === "textarea" || tag === "select")) {
        if (tag === "select" && !!el.multiple) {
          bindRodSelectMultiple(el, value);
          return;
        }
        bindRodValueControl(el, value, tag === "select" ? "change" : "input");
        return;
      }
      if (key === "checked" && isRod(value) && tag === "input") {
        if (String(el.type || "").toLowerCase() === "radio") {
          bindRodRadioControl(el, value);
          return;
        }
        bindRodCheckedControl(el, value);
        return;
      }
      if (key === "files" && isRod(value) && isFileInputControl(el)) {
        bindRodFilesControl(el, value);
        return;
      }
      if (key === "selected" && isRod(value) && tag === "option") {
        bindRodOptionSelected(el, value);
        return;
      }
      if (isContentProp(key) && isRod(value)) {
        registerNodeEffect(() => {
          setProp(key, value.value);
        });
        return;
      }
      if (isRod(value)) {
        const unbind = JSswift.rodBind(el, value, { key });
        JSswift._registerCleanup(el, unbind);
        return;
      }
      setProp(key, value);
    }
    applyRendererArgs(args, { el, isRod, interpolationCursor, appendChildValue, appendRodText, appendInterpolatedText, appendDynamicChild, bindProp });
    if (tag === "select" && typeof el._jssApplySelectedValues === "function") {
      el._jssApplySelectedValues();
    }
    return el;
  }
  const _h = {};
  const DOM_ELEMENTS = ["html", "head", "title", "base", "link", "meta", "style", "body", "header", "footer", "main", "section", "article", "aside", "nav", "h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "span", "pre", "blockquote", "hr", "br", "address", "a", "abbr", "b", "bdi", "bdo", "cite", "code", "data", "dfn", "em", "i", "kbd", "mark", "q", "rp", "rt", "ruby", "s", "samp", "small", "strong", "sub", "sup", "time", "u", "var", "wbr", "ul", "ol", "li", "dl", "dt", "dd", "table", "caption", "colgroup", "col", "thead", "tbody", "tfoot", "tr", "th", "td", "form", "label", "input", "textarea", "button", "select", "option", "optgroup", "fieldset", "legend", "datalist", "output", "progress", "meter", "img", "picture", "source", "iframe", "embed", "object", "param", "audio", "video", "track", "details", "summary", "dialog", "script", "noscript", "canvas", "template", "slot", "svg", "g", "path", "circle", "ellipse", "line", "rect", "polygon", "polyline", "text", "tspan", "defs", "linearGradient", "radialGradient", "stop", "use", "symbol", "clipPath", "mask", "pattern", "filter", "feGaussianBlur", "feOffset", "feBlend", "feColorMatrix"];
  DOM_ELEMENTS.forEach((tag) => {
    window._[tag] = (...args) => createElement(tag, ...args);
  });
  _.DOM_ELEMENTS = DOM_ELEMENTS;
  _.fragment = (...children) => children;
  _.dynamic = function(renderFn) {
    const anchor = document.createComment("dyn");
    const parent = document.createDocumentFragment();
    parent.appendChild(anchor);
    let current = null;
    JSswift.reactive.effect(() => {
      const next = renderFn();
      if (current && current.parentNode) current.parentNode.removeChild(current);
      current = null;
      if (next == null) return;
      let node = next;
      if (typeof next === "string" || typeof next === "number") {
        node = document.createTextNode(String(next));
      }
      const p = anchor.parentNode;
      if (p && node && node.nodeType) {
        p.insertBefore(node, anchor.nextSibling);
        current = node;
      }
    });
    return parent;
  };
  function createMicrotaskScheduler() {
    let queued = false;
    const queue = /* @__PURE__ */ new Set();
    function flush() {
      var _a2, _b2, _c2;
      queued = false;
      (_a2 = JSswift.debug) == null ? void 0 : _a2.inc("rodFlushes");
      (_b2 = JSswift.perf) == null ? void 0 : _b2.inc("rodFlushes");
      (_c2 = JSswift.perf) == null ? void 0 : _c2.mark("rod:flush");
      const jobs = Array.from(queue);
      queue.clear();
      for (const fn of jobs) {
        try {
          fn();
        } catch (e) {
          console.error("[rod] flush error:", e);
        }
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
      el.textContent = value != null ? value : "";
      return;
    }
    const domBridge = createDomPropBridge(el, { isSVG: el.namespaceURI === SVG_NS, normalizeClass, isContentProp });
    domBridge.applyBindingValue(key, value);
  }
  function rodCreateComponent(initialValue) {
    const comp = { type: "rod", value: initialValue, _bindings: [], _actions: [], _disposeHooks: [], _disposed: false, _silentDepth: 0, _pending: false, bindings() {
      return this._bindings.map((b) => ({ el: b.el, key: b.key }));
    }, onDispose(fn) {
      if (typeof fn === "function") this._disposeHooks.push(fn);
      return this;
    }, _bind(el, config = { key: "auto" }) {
      var _a2;
      if (this._disposed) return () => {
      };
      if (!el) return () => {
      };
      const b = { el, key: (_a2 = config == null ? void 0 : config.key) != null ? _a2 : "auto" };
      const exists = this._bindings.some((x) => x.el === b.el && x.key === b.key);
      if (!exists) this._bindings.push(b);
      rodApplyBinding(b.el, b.key, this.value);
      return () => {
        this._bindings = this._bindings.filter((x) => !(x.el === b.el && x.key === b.key));
      };
    }, action(fn) {
      if (!this._disposed && typeof fn === "function") this._actions.push(fn);
      return this;
    }, _setSilent(v) {
      this._silentDepth++;
      try {
        this.value = v;
      } finally {
        this._silentDepth--;
      }
      return this;
    }, _scheduleNotify() {
      if (this._disposed || this._pending) return;
      this._pending = true;
      rodSchedule(() => {
        this._pending = false;
        this._notifyNow();
      });
    }, _notifyNow() {
      var _a2, _b2, _c2, _d2, _e2;
      if (this._disposed) return;
      const __t0 = performance.now();
      (_a2 = JSswift.perf) == null ? void 0 : _a2.inc("rodNotifies");
      this._bindings = this._bindings.filter((b) => {
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
        try {
          fn(this.value);
        } catch (e) {
          console.error("[rod] action error:", e);
        }
      }
      (_b2 = JSswift.debug) == null ? void 0 : _b2.inc("rodNotifies");
      (_e2 = JSswift.perf) == null ? void 0 : _e2.tick("rod:notify", performance.now() - __t0, { bindings: ((_c2 = this._bindings) == null ? void 0 : _c2.length) || 0, actions: ((_d2 = this._actions) == null ? void 0 : _d2.length) || 0 });
    }, dispose() {
      if (this._disposed) return;
      this._disposed = true;
      for (const fn of this._disposeHooks) {
        try {
          fn();
        } catch (e) {
          console.error("[rod] dispose hook error:", e);
        }
      }
      this._bindings.length = 0;
      this._actions.length = 0;
      this._disposeHooks.length = 0;
    } };
    return comp;
  }
  function rodMakeReactive(obj, key = "value") {
    var _a2;
    let _val = obj[key];
    let _get = null;
    let _set = null;
    let _disposeSignal = null;
    if ((_a2 = JSswift == null ? void 0 : JSswift.reactive) == null ? void 0 : _a2.signal) {
      [_get, _set, _disposeSignal] = JSswift.reactive.signal(_val);
      if (_disposeSignal && typeof obj.onDispose === "function") {
        obj.onDispose(_disposeSignal);
      }
    }
    Object.defineProperty(obj, key, { get() {
      return _get ? _get() : _val;
    }, set(v) {
      if (_set) _set(v);
      else _val = v;
      obj._scheduleNotify();
    }, configurable: true });
    if (typeof obj.val !== "function") {
      Object.defineProperty(obj, "val", { value(v) {
        if (arguments.length) {
          this.value = v;
          return v;
        }
        return this.value;
      }, configurable: true });
    }
    if (!obj[Symbol.toPrimitive]) {
      Object.defineProperty(obj, Symbol.toPrimitive, { value(hint) {
        const v = this.value;
        if (v == null) return v;
        const t = typeof v;
        if (hint === "number") return Number(v);
        if (t !== "symbol") trackRodInterpolation(this, v);
        if (t === "string" || t === "number" || t === "boolean" || t === "bigint" || t === "symbol") return v;
        const out = String(v);
        return out;
      }, configurable: true });
    }
    if (!obj.valueOf) {
      Object.defineProperty(obj, "valueOf", { value() {
        return this.value;
      }, configurable: true });
    }
    if (!obj.toString) {
      Object.defineProperty(obj, "toString", { value() {
        return String(this.value);
      }, configurable: true });
    }
    return obj;
  }
  _.rod = function _rod(data, key = "value") {
    const comp = rodCreateComponent(data);
    rodMakeReactive(comp, key);
    JSswift.rod._all = JSswift.rod._all || /* @__PURE__ */ new Set();
    JSswift.rod._all.add(comp);
    if (typeof comp.onDispose === "function") {
      comp.onDispose(() => JSswift.rod._all.delete(comp));
    }
    return comp;
  };
  JSswift.rodBind = function(el, react, config = { key: "auto" }) {
    var _a2, _b2, _c2;
    (_a2 = JSswift.debug) == null ? void 0 : _a2.inc("rodBinds");
    if (!el) {
      (_b2 = JSswift.debug) == null ? void 0 : _b2.inc("rodBindNull");
      (_c2 = JSswift.debug) == null ? void 0 : _c2.warn("rodBind: target element \xE8 null/undefined", config);
      return () => {
      };
    }
    if (!react || react.type !== "rod") {
      throw new Error("JSswift.rodBind: react must be a rod object");
    }
    return react._bind(el, config);
  };
  JSswift.rodFromSignal = function(get, set) {
    const r = _.rod(get());
    let syncing = false;
    const stopRodToSignal = JSswift.reactive.effect(() => {
      const v = r.value;
      const currentSignal = JSswift.reactive.untracked(() => get());
      if (syncing) return;
      if (currentSignal === v) return;
      syncing = true;
      try {
        set(v);
      } finally {
        syncing = false;
      }
    });
    const stopEffect = JSswift.reactive.effect(() => {
      const v = get();
      const currentRod = JSswift.reactive.untracked(() => r.value);
      if (currentRod === v) return;
      syncing = true;
      try {
        r._setSilent(v);
      } finally {
        syncing = false;
      }
    });
    if (typeof r.onDispose === "function") {
      r.onDispose(stopRodToSignal);
      r.onDispose(stopEffect);
    }
    return r;
  };
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
  JSswift.rodModel = function(target, rodObj, opts = {}) {
    var _a2, _b2, _c2;
    if (!rodObj || rodObj.type !== "rod") {
      throw new Error("[JSswift.rodModel] rodObj deve essere un rod");
    }
    const elements = Array.isArray(target) || target instanceof NodeList ? Array.from(target) : [target];
    const eventName = (_a2 = opts.event) != null ? _a2 : "change";
    const parse = (_b2 = opts.parse) != null ? _b2 : ((v) => v);
    const format = (_c2 = opts.format) != null ? _c2 : ((v) => v);
    let syncing = false;
    const disposers = [];
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
            el.value = value != null ? value : "";
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
            el.value = value != null ? value : "";
        }
      }
    };
    const onValue = (v) => {
      if (syncing) return;
      syncing = true;
      try {
        updateDOM(format(v));
      } finally {
        syncing = false;
      }
    };
    rodObj.action(onValue);
    updateDOM(format(rodObj.value));
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
            next = Array.from(el.selectedOptions).map((o) => o.value);
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
    let disposed = false;
    const dispose = () => {
      var _a3, _b3, _c3, _d2;
      if (disposed) return;
      disposed = true;
      disposers.splice(0).forEach((fn) => fn());
      const actionIndex = (_b3 = (_a3 = rodObj._actions) == null ? void 0 : _a3.indexOf(onValue)) != null ? _b3 : -1;
      if (actionIndex >= 0) rodObj._actions.splice(actionIndex, 1);
      const hookIndex = (_d2 = (_c3 = rodObj._disposeHooks) == null ? void 0 : _c3.indexOf(dispose)) != null ? _d2 : -1;
      if (hookIndex >= 0 && !rodObj._disposed) rodObj._disposeHooks.splice(hookIndex, 1);
    };
    if (typeof rodObj.onDispose === "function") rodObj.onDispose(dispose);
    return dispose;
  };
  JSswift.signalModel = function(inputEl, get, set, opts = {}) {
    const r = JSswift.rodFromSignal(get, set);
    const stopBinding = JSswift.rodModel(inputEl, r, opts);
    return () => {
      stopBinding();
      r.dispose();
    };
  };
  function cleanupNodeTree(node) {
    if (!node) return;
    const disposers = JSswift._cleanupRegistry.get(node);
    if (disposers) {
      for (const d of disposers) {
        try {
          d();
        } catch (e) {
          console.error("[cleanup] error:", e);
        }
      }
      JSswift._cleanupRegistry.delete(node);
    }
    if (node.childNodes && node.childNodes.length) {
      for (const child of node.childNodes) {
        cleanupNodeTree(child);
      }
    }
  }
  function toMountTargets(target) {
    const toEl = (t) => typeof t === "string" ? JSswift.dom.q(t) : t;
    return Array.isArray(target) ? target.map(toEl).filter(Boolean) : [toEl(target)].filter(Boolean);
  }
  function normalizeMountContent(content) {
    const nodes = [];
    const disposers = [];
    const add = (value) => {
      if (value == null) return;
      if (typeof value === "function") {
        add(value());
        return;
      }
      if (value && typeof value === "object" && "node" in value) {
        if (typeof value.dispose === "function") disposers.push(value.dispose);
        add(value.node);
        return;
      }
      if (Array.isArray(value)) {
        for (const item of value) add(item);
        return;
      }
      if (typeof value === "string" || typeof value === "number") {
        nodes.push(document.createTextNode(String(value)));
        return;
      }
      if (value.nodeType) {
        nodes.push(value);
        return;
      }
      console.warn("[JSswift.mount] contenuto non supportato:", value);
    };
    add(content);
    return { nodes, disposers };
  }
  function createOnceDisposer(disposers = [], label = "[JSswift.mount] dispose error:") {
    let done = false;
    return () => {
      if (done) return;
      done = true;
      for (const d of disposers) {
        try {
          d();
        } catch (e) {
          console.error(label, e);
        }
      }
    };
  }
  function createComponentDisposer(disposers = [], userDispose = null) {
    return createOnceDisposer([...userDispose ? [userDispose] : [], ...disposers], "[component] dispose error:");
  }
  JSswift.mount = function(target, content, opts = {}) {
    var _a2;
    const targets = toMountTargets(target);
    const clear = (_a2 = opts.clear) != null ? _a2 : true;
    const isMulti = targets.length > 1;
    if (targets.length === 0) {
      console.warn("[JSswift.mount] nessun target valido:", target);
      return () => {
      };
    }
    const mounted = [];
    for (const root of targets) {
      if (clear) {
        while (root.firstChild) {
          cleanupNodeTree(root.firstChild);
          root.removeChild(root.firstChild);
        }
      }
      const { nodes: rawNodes, disposers } = normalizeMountContent(content);
      let nodes = rawNodes;
      if (isMulti && typeof content !== "function") {
        nodes = rawNodes.map((n) => n.cloneNode(true));
        if (disposers.length) {
          console.warn("[JSswift.mount] multi-target con dispose: usa content come function per istanze separate.");
        }
      }
      const disposeMounted = createOnceDisposer(disposers);
      for (const n of nodes) root.appendChild(n);
      mounted.push({ root, nodes, dispose: disposeMounted });
      for (const n of nodes) {
        if (!n || !n.nodeType) continue;
        JSswift._registerCleanup(n, disposeMounted);
      }
    }
    const unmount = () => {
      var _a3;
      for (const m of mounted) {
        for (const n of m.nodes) {
          if (!n) continue;
          cleanupNodeTree(n);
          if (n.parentNode === m.root) m.root.removeChild(n);
        }
        (_a3 = m.dispose) == null ? void 0 : _a3.call(m);
      }
    };
    return unmount;
  };
  JSswift.component = function(renderFn) {
    if (typeof renderFn !== "function") throw new Error("JSswift.component: renderFn must be a function");
    return function ComponentInstance(props = {}) {
      const disposers = [];
      const ctx = { onDispose(fn) {
        if (typeof fn === "function") disposers.push(fn);
      } };
      const out = renderFn(props, ctx);
      if (out && typeof out === "object" && "node" in out) {
        return { node: out.node, dispose: createComponentDisposer(disposers, typeof out.dispose === "function" ? out.dispose : null) };
      }
      return { node: out, dispose: createComponentDisposer(disposers) };
    };
  };
  JSswift.enableAutoCleanup = function() {
    if (JSswift._autoCleanupEnabled) return;
    JSswift._autoCleanupEnabled = true;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.removedNodes) {
          cleanupNodeTree(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    JSswift._cleanupObserver = observer;
  };
  JSswift.debug = /* @__PURE__ */ (() => {
    const counters = { rodFlushes: 0, rodNotifies: 0, rodBinds: 0, rodBindNull: 0, rodBindDup: 0 };
    function enabled() {
      return !!JSswift.config.debug;
    }
    function log(...a) {
      if (enabled()) console.log("[JSswift]", ...a);
    }
    function warn(...a) {
      if (enabled()) console.warn("[JSswift]", ...a);
    }
    function error(...a) {
      console.error("[JSswift]", ...a);
    }
    function inc(name, by = 1) {
      if (!counters[name]) counters[name] = 0;
      counters[name] += by;
    }
    function stats() {
      return { ...counters };
    }
    function reset() {
      for (const k of Object.keys(counters)) counters[k] = 0;
    }
    return { enabled, log, warn, error, inc, stats, reset };
  })();
  JSswift.perf = /* @__PURE__ */ (() => {
    let enabled = false;
    const counters = { effectsRun: 0, effectsSlow: 0, rodNotifies: 0, rodFlushes: 0, domWrites: 0, httpRequests: 0 };
    const timeline = [];
    const slow = [];
    const cfg = { timelineMax: 200, slowEffectMs: 8 };
    function now2() {
      return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
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
    let _origEffect = null;
    function patchEffect() {
      if (_origEffect) return;
      _origEffect = JSswift.reactive.effect;
      JSswift.reactive.effect = function(fn, meta) {
        const wrapped = (...args) => {
          const t0 = now2();
          inc("effectsRun");
          try {
            return fn(...args);
          } finally {
            const dt = now2() - t0;
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
      return { enabled, ...counters, slowEffectMs: cfg.slowEffectMs, timelineSize: timeline.length };
    }
    function getTimeline() {
      return timeline.slice();
    }
    function slowEffects(minMs = cfg.slowEffectMs) {
      return slow.filter((x) => x.ms >= minMs).slice().sort((a, b) => b.ms - a.ms);
    }
    function time(label, fn) {
      const t0 = now2();
      try {
        return fn();
      } finally {
        const dt = now2() - t0;
        pushEvent("time:" + label, dt, label);
      }
    }
    function mark(type, meta) {
      pushEvent(type, 0, meta);
    }
    function tick(type, ms, meta) {
      pushEvent(type, ms, meta);
    }
    return { enable, reset, stats, timeline: getTimeline, slowEffects, time, mark, tick, inc, cfg };
  })();
  JSswift.rod = JSswift.rod || {};
  JSswift.rod.inspect = function(r, label = "rod") {
    if (!r || r.type !== "rod") {
      console.warn("[JSswift.rod.inspect] non \xE8 un rod:", r);
      return null;
    }
    const bindings = typeof r.bindings === "function" ? r.bindings() : [];
    const info = { label, value: r.value, bindingsCount: bindings.length, bindings: bindings.map((b) => {
      var _a2, _b2, _c2, _d2, _e2, _f2, _g2;
      return { key: b.key, el: ((_a2 = b.el) == null ? void 0 : _a2.nodeType) === 3 ? "#text" : (_b2 = b.el) == null ? void 0 : _b2.tagName, id: ((_c2 = b.el) == null ? void 0 : _c2.id) || null, className: ((_d2 = b.el) == null ? void 0 : _d2.className) || null, isConnected: ((_e2 = b.el) == null ? void 0 : _e2.nodeType) === 3 ? !!b.el.parentNode : (_g2 = (_f2 = b.el) == null ? void 0 : _f2.isConnected) != null ? _g2 : null };
    }), actionsCount: Array.isArray(r._actions) ? r._actions.length : null, disposed: !!r._disposed };
    if (JSswift.config.debug) {
      console.groupCollapsed(`[JSswift.rod.inspect] ${label}`);
      console.log(info);
      console.groupEnd();
    } else {
      console.log(info);
    }
    return info;
  };
  JSswift.rod.inspectAll = function() {
    const all = JSswift.rod._all ? Array.from(JSswift.rod._all) : [];
    all.forEach((r, i) => JSswift.rod.inspect(r, `rod#${i + 1}`));
    return all.length;
  };
  JSswift._storeShared = /* @__PURE__ */ (() => {
    function scopeId(scope) {
      return `${scope.storage}::${scope.prefix}`;
    }
    function createScopeTools(config, knownScopes) {
      function getScope(opts = {}) {
        var _a2, _b2;
        const scope = { storage: (_a2 = opts.storage) != null ? _a2 : config.storage, prefix: (_b2 = opts.prefix) != null ? _b2 : config.prefix };
        knownScopes.set(scopeId(scope), scope);
        return scope;
      }
      function getStorage(scope = null) {
        var _a2;
        const mode = typeof scope === "string" ? scope : (_a2 = scope == null ? void 0 : scope.storage) != null ? _a2 : config.storage;
        return mode === "session" ? window.sessionStorage : window.localStorage;
      }
      function fullKey(key, scope = null) {
        const resolved = scope || getScope();
        return resolved.prefix + key;
      }
      function channelKey(key, scope = null) {
        const resolved = scope || getScope();
        return `${scopeId(resolved)}::${key}`;
      }
      return { getScope, getStorage, fullKey, channelKey };
    }
    function safeParse(str) {
      try {
        return JSON.parse(str);
      } catch (e) {
        return void 0;
      }
    }
    function safeStringify(value) {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return void 0;
      }
    }
    function clearScopedMapEntries(scope, ...maps) {
      const prefix = `${scope.storage}::${scope.prefix}::`;
      for (const map of maps) {
        for (const id of Array.from(map.keys())) {
          if (id.startsWith(prefix)) map.delete(id);
        }
      }
    }
    return { createScopeTools, safeParse, safeStringify, clearScopedMapEntries };
  })();
  JSswift.store = (() => {
    const config = { prefix: "JSswift:", storage: "local", syncTabs: true, writeDelay: 0 };
    const mem = /* @__PURE__ */ new Map();
    const watchers = /* @__PURE__ */ new Map();
    const pendingWrites = /* @__PURE__ */ new Map();
    const knownScopes = /* @__PURE__ */ new Map();
    let writeQueued = false;
    const { createScopeTools, safeParse, safeStringify, clearScopedMapEntries } = JSswift._storeShared;
    const { getScope, getStorage, fullKey, channelKey } = createScopeTools(config, knownScopes);
    function emit(key, value, scope = null) {
      var _a2;
      const resolved = scope || getScope();
      const set2 = watchers.get(channelKey(key, resolved));
      if (!set2) return;
      for (const fn of set2) {
        try {
          if ((_a2 = JSswift.reactive) == null ? void 0 : _a2.untracked) {
            JSswift.reactive.untracked(() => fn(value));
          } else {
            fn(value);
          }
        } catch (e) {
          console.error("[store] watcher error:", e);
        }
      }
    }
    function flushWrites() {
      writeQueued = false;
      for (const [id, pending] of Array.from(pendingWrites.entries())) {
        pendingWrites.delete(id);
        const v = mem.get(id);
        const s = safeStringify(v);
        if (s === void 0) continue;
        const st = getStorage(pending.scope);
        try {
          st.setItem(fullKey(pending.key, pending.scope), s);
        } catch (e) {
          console.error("[store] write error:", e);
        }
      }
    }
    function scheduleWrite(key, scope = null) {
      const resolved = scope || getScope();
      pendingWrites.set(channelKey(key, resolved), { key, scope: resolved });
      if (writeQueued) return;
      writeQueued = true;
      if (config.writeDelay > 0) {
        setTimeout(flushWrites, config.writeDelay);
      } else {
        queueMicrotask(flushWrites);
      }
    }
    function readFromStorage(key, scope = null) {
      const resolved = scope || getScope();
      const st = getStorage(resolved);
      const raw = st.getItem(fullKey(key, resolved));
      if (raw == null) return void 0;
      return safeParse(raw);
    }
    function get(key, fallback, scope = null) {
      const resolved = scope || getScope();
      const id = channelKey(key, resolved);
      if (mem.has(id)) return mem.get(id);
      const v = readFromStorage(key, resolved);
      if (v !== void 0) {
        mem.set(id, v);
        return v;
      }
      return fallback;
    }
    function set(key, value, scope = null) {
      const resolved = scope || getScope();
      mem.set(channelKey(key, resolved), value);
      scheduleWrite(key, resolved);
      emit(key, value, resolved);
      return value;
    }
    function remove(key, scope = null) {
      const resolved = scope || getScope();
      const id = channelKey(key, resolved);
      mem.delete(id);
      pendingWrites.delete(id);
      try {
        getStorage(resolved).removeItem(fullKey(key, resolved));
      } catch (e) {
      }
      emit(key, void 0, resolved);
    }
    function clear(opts = {}) {
      const scope = getScope(opts);
      const st = getStorage(scope);
      const keys = [];
      for (let i = 0; i < st.length; i++) {
        const k = st.key(i);
        if (k && k.startsWith(scope.prefix)) keys.push(k);
      }
      for (const k of keys) st.removeItem(k);
      clearScopedMapEntries(scope, mem, pendingWrites, watchers);
    }
    function watch(key, fn, scope = null) {
      if (typeof fn !== "function") return () => {
      };
      const resolved = scope || getScope();
      const id = channelKey(key, resolved);
      if (!watchers.has(id)) watchers.set(id, /* @__PURE__ */ new Set());
      watchers.get(id).add(fn);
      return () => {
        var _a2;
        return (_a2 = watchers.get(id)) == null ? void 0 : _a2.delete(fn);
      };
    }
    function signal(key, initial, opts = {}) {
      const scope = getScope({ storage: opts.storage, prefix: opts.prefix });
      const hydrated = get(key, initial, scope);
      const [getSig, setSig, disposeSignal] = JSswift.reactive.signal(hydrated);
      const stopEffect = JSswift.reactive.effect(() => {
        const v = getSig();
        set(key, v, scope);
      });
      const unwatch = watch(key, (v) => {
        if (getSig() !== v) setSig(v);
      }, scope);
      const dispose = () => {
        try {
          stopEffect == null ? void 0 : stopEffect();
        } catch (e) {
        }
        try {
          unwatch == null ? void 0 : unwatch();
        } catch (e) {
        }
        try {
          disposeSignal == null ? void 0 : disposeSignal();
        } catch (e) {
        }
      };
      return [getSig, setSig, dispose];
    }
    getScope();
    if (config.syncTabs) {
      window.addEventListener("storage", (e) => {
        if (!e.key || !e.storageArea) return;
        for (const scope of knownScopes.values()) {
          if (getStorage(scope) !== e.storageArea) continue;
          if (!e.key.startsWith(scope.prefix)) continue;
          const key = e.key.slice(scope.prefix.length);
          const v = e.newValue == null ? void 0 : safeParse(e.newValue);
          const id = channelKey(key, scope);
          if (v === void 0) mem.delete(id);
          else mem.set(id, v);
          emit(key, v, scope);
        }
      });
    }
    function configure(next = {}) {
      Object.assign(config, next);
      getScope();
    }
    function stats() {
      return { prefix: config.prefix, storage: config.storage, syncTabs: config.syncTabs, cacheSize: mem.size, scopeCount: knownScopes.size };
    }
    return { configure, stats, get, set, remove, clear, watch, signal };
  })();
  JSswift.store.computed = function(fn) {
    if (typeof fn !== "function") throw new Error("store.computed: fn must be a function");
    return JSswift.reactive.computed(fn);
  };
  JSswift.store.migrate = function(targetVersion, steps, opts = {}) {
    var _a2, _b2;
    const versionKey = (_a2 = opts.versionKey) != null ? _a2 : "__version";
    const from = Number((_b2 = JSswift.store.get(versionKey, 0)) != null ? _b2 : 0);
    const to = Number(targetVersion != null ? targetVersion : 0);
    if (!Number.isFinite(to) || to < 0) throw new Error("store.migrate: targetVersion non valido");
    if (from >= to) return { from, to, applied: 0 };
    let applied = 0;
    for (let v = from; v < to; v++) {
      const step = steps == null ? void 0 : steps[v];
      if (typeof step === "function") {
        try {
          step(JSswift.store);
        } catch (e) {
          console.error("[store.migrate] step error at version", v, e);
        }
      }
      applied++;
      JSswift.store.set(versionKey, v + 1);
    }
    return { from, to, applied };
  };
  JSswift.store.model = function(elOrList, key, initial, opts = {}) {
    if (typeof key !== "string" || !key) throw new Error("store.model: key deve essere una stringa non vuota");
    const [get, set, disposeSignal] = JSswift.store.signal(key, initial, { storage: opts.storage, prefix: opts.prefix });
    const r = JSswift.rodFromSignal(get, set);
    const unbindModel = JSswift.rodModel(elOrList, r, { event: opts.event, parse: opts.parse, format: opts.format });
    return () => {
      var _a2;
      try {
        unbindModel == null ? void 0 : unbindModel();
      } catch (e) {
      }
      try {
        disposeSignal == null ? void 0 : disposeSignal();
      } catch (e) {
      }
      try {
        (_a2 = r.dispose) == null ? void 0 : _a2.call(r);
      } catch (e) {
      }
    };
  };
  JSswift.store.bind = function(selectorOrEl, key, initial, opts = {}) {
    var _a2;
    let target = selectorOrEl;
    if (typeof selectorOrEl === "string") {
      if (selectorOrEl.includes("[") || selectorOrEl.includes(" ")) {
        target = document.querySelectorAll(selectorOrEl);
      } else {
        target = JSswift.dom.q(selectorOrEl);
      }
    }
    if (!target) {
      if ((_a2 = JSswift.config) == null ? void 0 : _a2.debug) {
        console.warn("[store.bind] target non trovato:", selectorOrEl);
      }
      return () => {
      };
    }
    return JSswift.store.model(target, key, initial, opts);
  };
  JSswift.store.bindAll = function(formEl, schema = {}, opts = {}) {
    if (typeof formEl === "string") formEl = JSswift.dom.q(formEl);
    if (!formEl || !formEl.querySelectorAll) {
      console.warn("[store.bindAll] form non valido:", formEl);
      return () => {
      };
    }
    const disposers = [];
    for (const [name, initial] of Object.entries(schema)) {
      const els = formEl.querySelectorAll(`[name="${name}"]`);
      if (!els.length) continue;
      const unbind = JSswift.store.model(els.length === 1 ? els[0] : els, name, initial, opts);
      disposers.push(unbind);
    }
    return () => disposers.forEach((fn) => fn());
  };
  JSswift.store.inspect = function() {
    const info = { ...JSswift.store.stats(), keys: Array.from((function() {
      const st = JSswift.store.stats().storage === "session" ? sessionStorage : localStorage;
      const out = [];
      for (let i = 0; i < st.length; i++) {
        const k = st.key(i);
        if (k && k.startsWith(JSswift.store.stats().prefix)) {
          out.push(k.replace(JSswift.store.stats().prefix, ""));
        }
      }
      return out;
    })()) };
    console.groupCollapsed("[JSswift.store.inspect]");
    console.table(info.keys);
    console.log(info);
    console.groupEnd();
    return info;
  };
  JSswift.store.autoForm = function(formEl, schema = {}, opts = {}) {
    var _a2;
    const unbind = JSswift.store.bindAll(formEl, schema, opts);
    if ((_a2 = JSswift.config) == null ? void 0 : _a2.debug) {
      console.log("[store.autoForm] autosave attivo:", schema);
    }
    return unbind;
  };
  JSswift.useStore = function(key, initial, ctx, opts = {}) {
    const [get, set, dispose] = JSswift.store.signal(key, initial, opts);
    if (ctx && typeof ctx.onDispose === "function" && typeof dispose === "function") {
      ctx.onDispose(dispose);
    }
    return [get, set];
  };
  JSswift._plugins = /* @__PURE__ */ new Set();
  JSswift.usePlugin = function(plugin, options) {
    var _a2;
    if (!plugin) return;
    if (JSswift._plugins.has(plugin)) {
      if ((_a2 = JSswift.config) == null ? void 0 : _a2.debug) {
        console.warn("[JSswift.usePlugin] plugin gi\xE0 installato:", plugin.name || plugin);
      }
      return;
    }
    if (typeof plugin === "function") {
      plugin(JSswift, options);
      JSswift._plugins.add(plugin);
      return;
    }
    if (plugin && typeof plugin.install === "function") {
      plugin.install(JSswift, options);
      JSswift._plugins.add(plugin);
      return;
    }
    console.warn("[JSswift.usePlugin] plugin non valido:", plugin);
  };
  JSswift.plugins = JSswift.plugins || {};
  JSswift.plugins.debug = { install(app) {
    app.config.debug = true;
    console.log("[JSswift] Debug mode ON");
  } };
  JSswift.plugins.forms = { install(app) {
    const forms = {};
    app.forms = { validate(formEl, rules = {}, opts = {}) {
      var _a2, _b2;
      if (typeof formEl === "string") formEl = app.dom.q(formEl);
      if (!formEl || !formEl.querySelectorAll) {
        console.warn("[forms.validate] form non valido:", formEl);
        return null;
      }
      const options = { mode: opts.mode || "input", showMessages: (_a2 = opts.showMessages) != null ? _a2 : true, submitGuard: (_b2 = opts.submitGuard) != null ? _b2 : true, errorClass: opts.errorClass || "is-invalid", validClass: opts.validClass || "is-valid", messageClass: opts.messageClass || "form-error" };
      const fieldState = {};
      for (const [name, rule] of Object.entries(rules)) {
        const els = formEl.querySelectorAll(`[name="${name}"]`);
        if (!els.length) continue;
        const [getErr, setErr] = app.reactive.signal(null);
        fieldState[name] = { getErr, setErr, els };
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
            const c = Array.from(els).find((r) => r.checked);
            value = c ? c.value : null;
          } else value = el.value;
          let res = true;
          try {
            res = rule(value);
          } catch (e) {
            res = e.message || "Errore di validazione";
          }
          const error = res === true ? null : typeof res === "string" ? res : "Valore non valido";
          setErr(error);
          return !error;
        };
        for (const el of els) {
          el.addEventListener(options.mode, validateValue);
        }
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
        validateValue();
      }
      const isValid = app.store.computed(() => {
        return Object.values(fieldState).every((f) => !f.getErr());
      });
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
    } };
  } };
  JSswift._authShared = /* @__PURE__ */ (() => {
    function createPermissionApi(getUser) {
      const roles = () => {
        var _a2;
        return ((_a2 = getUser()) == null ? void 0 : _a2.roles) || [];
      };
      const perms = () => {
        var _a2;
        return ((_a2 = getUser()) == null ? void 0 : _a2.permissions) || [];
      };
      return { roles, perms, hasRole: (role) => roles().includes(role), can: (permission) => perms().includes(permission), canAny: (list) => list.some((item) => roles().includes(item) || perms().includes(item)), canAll: (list) => list.every((item) => roles().includes(item) || perms().includes(item)) };
    }
    function matchesProtectedPath(path, protectedList) {
      return protectedList.some((entry) => typeof entry === "string" ? path.startsWith(entry) : entry instanceof RegExp ? entry.test(path) : false);
    }
    function attachDevTools(app, auth) {
      if (!app || !auth) return;
      let tracing = false;
      function safeNow() {
        return Date.now();
      }
      function decodeJWT(token) {
        if (!token || typeof token !== "string") return null;
        const parts = token.split(".");
        if (parts.length < 2) return null;
        try {
          const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const json = decodeURIComponent(atob(b64).split("").map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
          return JSON.parse(json);
        } catch (e) {
          return null;
        }
      }
      function getAuthState() {
        var _a2, _b2, _c2, _d2;
        if (typeof auth._getState === "function") {
          const state = auth._getState();
          return state && typeof state === "object" ? state : { user: (_b2 = (_a2 = auth.user) == null ? void 0 : _a2.call(auth)) != null ? _b2 : null };
        }
        return { user: (_d2 = (_c2 = auth.user) == null ? void 0 : _c2.call(auth)) != null ? _d2 : null };
      }
      function status() {
        var _a2, _b2, _c2;
        const state = getAuthState() || {};
        const user = (_b2 = state.user) != null ? _b2 : (_a2 = auth.user) == null ? void 0 : _a2.call(auth);
        const name = (user == null ? void 0 : user.name) || (user == null ? void 0 : user.email) || (user == null ? void 0 : user.id) || "anon";
        const ok = !!((_c2 = auth.isAuth) == null ? void 0 : _c2.call(auth));
        const expiresAt = state.expiresAt || null;
        const left = expiresAt ? expiresAt - safeNow() : null;
        return ok ? `AUTH \u2705 user=${name}${expiresAt ? ` expiresIn=${Math.round(left / 1e3)}s` : ""}` : `AUTH \u274C user=${name}`;
      }
      function inspect(label = "auth") {
        var _a2, _b2, _c2;
        const state = getAuthState() || {};
        const user = (_b2 = state.user) != null ? _b2 : (_a2 = auth.user) == null ? void 0 : _a2.call(auth);
        const roles = (user == null ? void 0 : user.roles) || [];
        const perms = (user == null ? void 0 : user.permissions) || [];
        const accessToken = state.accessToken || null;
        const refreshToken = state.refreshToken || null;
        const jwt = accessToken ? decodeJWT(accessToken) : null;
        const expiresAt = state.expiresAt || ((jwt == null ? void 0 : jwt.exp) ? jwt.exp * 1e3 : null);
        const now2 = safeNow();
        const expiresInMs = expiresAt ? expiresAt - now2 : null;
        const info = { label, isAuth: !!((_c2 = auth.isAuth) == null ? void 0 : _c2.call(auth)), user, roles, permissions: perms, has: { role: (role) => {
          var _a3;
          return !!((_a3 = auth.hasRole) == null ? void 0 : _a3.call(auth, role));
        }, can: (permission) => {
          var _a3;
          return !!((_a3 = auth.can) == null ? void 0 : _a3.call(auth, permission));
        } }, token: { hasAccess: !!accessToken, hasRefresh: !!refreshToken, expiresAt, expiresInSec: expiresInMs == null ? null : Math.round(expiresInMs / 1e3), decodedJWT: jwt } };
        console.groupCollapsed(`[JSswift.auth.inspect] ${label}`);
        console.log("status:", status());
        console.log(info);
        if (expiresInMs != null) {
          if (expiresInMs <= 0) console.warn("\u26A0\uFE0F Access token scaduto.");
          else if (expiresInMs < 6e4) console.warn("\u26A0\uFE0F Access token in scadenza (<60s).");
        }
        console.groupEnd();
        return info;
      }
      function trace(on = true) {
        tracing = !!on;
        console.log("[JSswift.auth.trace]", tracing ? "ON" : "OFF");
      }
      if (typeof auth.fetch === "function" && !auth._fetchWrapped) {
        const originalFetch = auth.fetch.bind(auth);
        auth.fetch = async (...args) => {
          const res = await originalFetch(...args);
          if (tracing) {
            try {
              console.log("[auth.fetch]", res.status, args[0]);
            } catch (e) {
            }
          }
          return res;
        };
        auth._fetchWrapped = true;
      }
      auth.decodeJWT = decodeJWT;
      auth.status = status;
      auth.inspect = inspect;
      auth.trace = trace;
    }
    return { createPermissionApi, matchesProtectedPath, attachDevTools };
  })();
  JSswift.plugins.auth = { install(app, opts = {}) {
    var _a2;
    const { createPermissionApi, matchesProtectedPath, attachDevTools } = JSswift._authShared;
    const options = { key: opts.key || "auth", loginRoute: opts.loginRoute || "/login", protected: opts.protected || [], autoRedirect: (_a2 = opts.autoRedirect) != null ? _a2 : true, endpoints: opts.endpoints || { login: "/api/login", refresh: "/api/refresh", logout: "/api/logout" }, fetchOptions: opts.fetchOptions || {}, tokenHeader: opts.tokenHeader || "Authorization", tokenPrefix: opts.tokenPrefix || "Bearer ", refreshMargin: opts.refreshMargin || 3e4 };
    const [getAuth, setAuth] = app.store.signal(options.key, null);
    const getUser = () => {
      var _a3;
      return ((_a3 = getAuth()) == null ? void 0 : _a3.user) || null;
    };
    const isAuth = () => {
      var _a3;
      return !!((_a3 = getAuth()) == null ? void 0 : _a3.accessToken);
    };
    const { hasRole, can, canAny, canAll } = createPermissionApi(getUser);
    let refreshing = false;
    let refreshQueue = [];
    function needsRefresh() {
      const a = getAuth();
      if (!(a == null ? void 0 : a.expiresAt)) return false;
      return Date.now() > a.expiresAt - options.refreshMargin;
    }
    async function doRefresh() {
      var _a3;
      if (refreshing) {
        return new Promise((res, rej) => refreshQueue.push({ res, rej }));
      }
      refreshing = true;
      try {
        const r = await fetch(options.endpoints.refresh, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken: (_a3 = getAuth()) == null ? void 0 : _a3.refreshToken }) });
        if (!r.ok) throw new Error("Refresh failed");
        const data = await r.json();
        setAuth({ ...getAuth(), ...data });
        refreshQueue.forEach((q) => q.res(true));
        refreshQueue = [];
        return true;
      } catch (e) {
        refreshQueue.forEach((q) => q.rej(e));
        refreshQueue = [];
        setAuth(null);
        if (options.autoRedirect) app.router.navigate(options.loginRoute);
        throw e;
      } finally {
        refreshing = false;
      }
    }
    async function loginAsync(credentials) {
      const r = await fetch(options.endpoints.login, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
      if (!r.ok) throw new Error("Login failed");
      const data = await r.json();
      setAuth(data);
      return data;
    }
    async function logoutAsync() {
      try {
        await fetch(options.endpoints.logout, { method: "POST" });
      } catch (e) {
      }
      setAuth(null);
      if (options.autoRedirect) app.router.navigate(options.loginRoute);
    }
    async function authFetch(url, opts2 = {}) {
      var _a3;
      if (needsRefresh()) await doRefresh();
      const a = getAuth();
      const headers = new Headers(opts2.headers || {});
      if (a == null ? void 0 : a.accessToken) {
        headers.set(options.tokenHeader, options.tokenPrefix + a.accessToken);
      }
      const r = await fetch(url, { ...options.fetchOptions, ...opts2, headers });
      if (r.status === 401 && ((_a3 = getAuth()) == null ? void 0 : _a3.refreshToken) && !opts2._authRetried) {
        await doRefresh();
        return authFetch(url, { ...opts2, _authRetried: true });
      }
      return r;
    }
    app.router.beforeEach((ctx) => {
      const path = ctx.path;
      const protectedMatch = matchesProtectedPath(path, options.protected);
      if (protectedMatch && !isAuth()) {
        return options.loginRoute;
      }
      return true;
    });
    app.auth = { user: getUser, isAuth, hasRole, can, canAny, canAll, loginAsync, logoutAsync, fetch: authFetch, _getState: getAuth };
    app.useAuth = function(ctx) {
      if (ctx && typeof ctx.onDispose === "function") {
      }
      return app.auth;
    };
    attachDevTools(JSswift, app.auth);
  } };
  JSswift._httpShared = /* @__PURE__ */ (() => {
    function createReactiveState(JSswift2) {
      var _a2;
      const reactive = JSswift2.reactive;
      const [getInFlight, setInFlight] = reactive.signal(0);
      const [getStatus, setStatus] = reactive.signal("idle");
      const [getLastRequest, setLastRequest] = reactive.signal(null);
      const [getLastResponse, setLastResponse] = reactive.signal(null);
      const [getLastError, setLastError] = reactive.signal(null);
      const [getLastDuration, setLastDuration] = reactive.signal(0);
      const [getLastUpdated, setLastUpdated] = reactive.signal(0);
      let lastStartId = 0;
      function markStart(req) {
        const id = ++lastStartId;
        const ts = Date.now();
        setInFlight(getInFlight() + 1);
        setStatus("pending");
        setLastError(null);
        setLastResponse(null);
        setLastRequest({ id, url: req.url, method: req.method, meta: req.meta, timeout: req.timeout, retry: req.retry, startedAt: ts });
        setLastUpdated(ts);
        return id;
      }
      function markEnd(id, res, err, durationMs) {
        const ts = Date.now();
        setInFlight(Math.max(0, getInFlight() - 1));
        if (id === lastStartId) {
          if (err) {
            setStatus("error");
            setLastError(err);
            setLastResponse(null);
          } else if (res) {
            setStatus("success");
            setLastError(null);
            setLastResponse({ id, status: res.status, ok: res.ok, headers: res.headers, url: res.url, receivedAt: ts, raw: res });
          } else {
            setStatus("idle");
            setLastError(null);
            setLastResponse(null);
          }
          setLastDuration(Math.max(0, Number(durationMs || 0)));
        }
        setLastUpdated(ts);
      }
      const state = { inFlight: getInFlight, status: getStatus, isLoading: ((_a2 = JSswift2.store) == null ? void 0 : _a2.computed) ? JSswift2.store.computed(() => getInFlight() > 0) : () => getInFlight() > 0, lastRequest: getLastRequest, lastResponse: getLastResponse, lastError: getLastError, lastDuration: getLastDuration, lastUpdated: getLastUpdated, reset() {
        setInFlight(0);
        setStatus("idle");
        setLastRequest(null);
        setLastResponse(null);
        setLastError(null);
        setLastDuration(0);
        setLastUpdated(Date.now());
      } };
      return { state, markStart, markEnd };
    }
    function joinURL(base, path) {
      if (!base) return path;
      if (/^https?:\/\//i.test(path)) return path;
      const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
      const normalizedPath = path.startsWith("/") ? path : "/" + path;
      return normalizedBase + normalizedPath;
    }
    function sleep2(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    function isRetryable2(err, res) {
      if (err) return true;
      if (!res) return false;
      return res.status === 429 || res.status >= 500 && res.status <= 599;
    }
    function makeAbort2(timeoutMs, externalSignal) {
      if (!timeoutMs && !externalSignal) return { signal: void 0, cancel: () => {
      } };
      const controller = new AbortController();
      const signal = controller.signal;
      let timeoutId = null;
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
      }
      const onAbort = () => controller.abort(externalSignal.reason || new Error("aborted"));
      if (externalSignal) {
        if (externalSignal.aborted) onAbort();
        else externalSignal.addEventListener("abort", onAbort, { once: true });
      }
      const cancel = () => {
        var _a2;
        if (timeoutId) clearTimeout(timeoutId);
        if (externalSignal) (_a2 = externalSignal.removeEventListener) == null ? void 0 : _a2.call(externalSignal, "abort", onAbort);
      };
      return { signal, cancel };
    }
    function normalizeRequest2(configHTTP2, input, init = {}) {
      var _a2, _b2, _c2;
      const url = typeof input === "string" ? joinURL(configHTTP2.baseURL, input) : input;
      const method = (init.method || "GET").toUpperCase();
      const headers = new Headers(configHTTP2.headers);
      if (init.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
      return { url, method, headers, body: init.body, credentials: (_a2 = init.credentials) != null ? _a2 : configHTTP2.credentials, signal: init.signal, timeout: (_b2 = init.timeout) != null ? _b2 : configHTTP2.timeout, retry: (_c2 = init.retry) != null ? _c2 : configHTTP2.retry, meta: init.meta || {} };
    }
    async function runHooks2(set, ...args) {
      var _a2;
      let current = args[0];
      for (const fn of set) {
        current = (_a2 = await fn(current, ...args.slice(1))) != null ? _a2 : current;
      }
      return current;
    }
    function wrapResponse2(res, req) {
      return { ok: res.ok, status: res.status, headers: res.headers, raw: res, req, async json() {
        let data = null;
        let error = null;
        try {
          data = await res.json();
        } catch (e) {
          data = null;
        }
        if (!res.ok) error = data != null ? data : { status: res.status };
        return { data, error, ok: res.ok, status: res.status };
      }, async jsonStrict() {
        const { data, error } = await this.json();
        if (error) {
          const e = new Error(`HTTP error ${res.status} ${(req == null ? void 0 : req.method) || ""} ${(req == null ? void 0 : req.url) || ""}`.trim());
          e.status = res.status;
          e.data = data;
          e.req = { url: req == null ? void 0 : req.url, method: req == null ? void 0 : req.method, meta: req == null ? void 0 : req.meta };
          throw e;
        }
        return { data, ok: true, status: res.status };
      }, async text() {
        let text = "";
        try {
          text = await res.text();
        } catch (e) {
        }
        return { text, ok: res.ok, status: res.status };
      }, async textStrict() {
        const out = await this.text();
        if (!out.ok) {
          const e = new Error("HTTP error " + res.status);
          e.status = res.status;
          e.text = out.text;
          throw e;
        }
        return out;
      } };
    }
    function withJSON2(request2, method, url, body, init = {}) {
      const headers = new Headers(init.headers || {});
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      return request2(url, { ...init, method, headers, body: body == null ? void 0 : JSON.stringify(body) });
    }
    return { createReactiveState, joinURL, sleep: sleep2, isRetryable: isRetryable2, makeAbort: makeAbort2, normalizeRequest: normalizeRequest2, runHooks: runHooks2, wrapResponse: wrapResponse2, withJSON: withJSON2 };
  })();
  const { createReactiveState: createHttpReactiveState, sleep, isRetryable, makeAbort, normalizeRequest, runHooks, wrapResponse, withJSON } = JSswift._httpShared;
  const JSswiftHttpSetting = typeof globalThis !== "undefined" && globalThis.JSswift_setting ? globalThis.JSswift_setting : {};
  const configHTTP = { baseURL: ((_b = JSswiftHttpSetting.http) == null ? void 0 : _b.baseURL) || "", timeout: (_d = (_c = JSswiftHttpSetting.http) == null ? void 0 : _c.timeout) != null ? _d : 0, retry: ((_e = JSswiftHttpSetting.http) == null ? void 0 : _e.retry) || { attempts: 0, delay: 250, factor: 2 }, headers: ((_f = JSswiftHttpSetting.http) == null ? void 0 : _f.headers) || {}, credentials: (_g = JSswiftHttpSetting.http) == null ? void 0 : _g.credentials, debug: (_h2 = JSswiftHttpSetting.debug) != null ? _h2 : false };
  const httpState = createHttpReactiveState(JSswift);
  const now = () => typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
  const hooksHTTP = { beforeRequest: /* @__PURE__ */ new Set(), afterResponse: /* @__PURE__ */ new Set(), onError: /* @__PURE__ */ new Set() };
  async function coreFetch(req) {
    const f = JSswift.auth && typeof JSswift.auth.fetch === "function" ? JSswift.auth.fetch.bind(JSswift.auth) : fetch;
    const init = { method: req.method, headers: req.headers, body: req.body, credentials: req.credentials, signal: req.signal };
    return f(req.url, init);
  }
  async function request(input, init = {}) {
    var _a2, _b2, _c2;
    let req = normalizeRequest(configHTTP, input, init);
    req = await runHooks(hooksHTTP.beforeRequest, req);
    const requestId = httpState.markStart(req);
    const startAt = now();
    const retryCfg = req.retry || { attempts: 0, delay: 250, factor: 2 };
    const maxAttempts = Math.max(0, Number(retryCfg.attempts || 0));
    let delay = Math.max(0, Number(retryCfg.delay || 0));
    const factor = Math.max(1, Number(retryCfg.factor || 2));
    let lastErr = null;
    let lastRes = null;
    let finalRes = null;
    let finalErr = null;
    try {
      for (let attempt = 0; attempt <= maxAttempts; attempt++) {
        lastErr = null;
        lastRes = null;
        const { signal, cancel } = makeAbort(req.timeout, init.signal);
        const effectiveReq = { ...req, signal };
        const attemptAt = now();
        try {
          if (configHTTP.debug) console.log("[http.request]", effectiveReq.method, effectiveReq.url);
          (_a2 = JSswift.perf) == null ? void 0 : _a2.inc("httpRequests");
          (_b2 = JSswift.perf) == null ? void 0 : _b2.mark("http:req", { url: req.url, method: req.method });
          const res = await coreFetch(effectiveReq);
          lastRes = res;
          const outRes = await runHooks(hooksHTTP.afterResponse, res, effectiveReq);
          const dt = now() - attemptAt;
          (_c2 = JSswift.perf) == null ? void 0 : _c2.tick("http:res", dt, { status: res.status, url: req.url });
          if (attempt < maxAttempts && isRetryable(null, outRes)) {
            cancel();
            await sleep(delay);
            delay = Math.round(delay * factor);
            continue;
          }
          cancel();
          finalRes = outRes;
          return wrapResponse(outRes, effectiveReq);
        } catch (err) {
          lastErr = err;
          cancel();
          for (const fn of hooksHTTP.onError) {
            try {
              fn(err, effectiveReq);
            } catch (e) {
            }
          }
          if (attempt < maxAttempts && isRetryable(err, null)) {
            await sleep(delay);
            delay = Math.round(delay * factor);
            continue;
          }
          finalErr = err;
          throw err;
        }
      }
    } finally {
      const totalDt = now() - startAt;
      httpState.markEnd(requestId, finalRes, finalErr, totalDt);
    }
    if (lastErr) throw lastErr;
    return wrapResponse(lastRes, req);
  }
  JSswift.http = {};
  JSswift.http.request = request;
  JSswift.http.state = () => httpState.state;
  JSswift.http.get = (url, init) => request(url, { ...init, method: "GET" });
  JSswift.http.del = (url, init) => request(url, { ...init, method: "DELETE" });
  JSswift.http.post = (url, body, init) => withJSON(request, "POST", url, body, init);
  JSswift.http.put = (url, body, init) => withJSON(request, "PUT", url, body, init);
  JSswift.http.patch = (url, body, init) => withJSON(request, "PATCH", url, body, init);
  JSswift.http.getJSON = async (url, init) => (await request(url, { ...init, method: "GET" })).jsonStrict();
  JSswift.http.delJSON = async (url, init) => (await request(url, { ...init, method: "DELETE" })).jsonStrict();
  JSswift.http.postJSON = async (url, body, init) => (await withJSON(request, "POST", url, body, init)).jsonStrict();
  JSswift.http.putJSON = async (url, body, init) => (await withJSON(request, "PUT", url, body, init)).jsonStrict();
  JSswift.http.patchJSON = async (url, body, init) => (await withJSON(request, "PATCH", url, body, init)).jsonStrict();
  JSswift.http.onBefore = function(fn) {
    hooksHTTP.beforeRequest.add(fn);
    return () => hooksHTTP.beforeRequest.delete(fn);
  };
  JSswift.http.onAfter = function(fn) {
    hooksHTTP.afterResponse.add(fn);
    return () => hooksHTTP.afterResponse.delete(fn);
  };
  JSswift.http.onError = function(fn) {
    hooksHTTP.onError.add(fn);
    return () => hooksHTTP.onError.delete(fn);
  };
  window._http = JSswift.http;
  JSswift.useRouter = function(ctx) {
    const router = JSswift.router;
    if (ctx && typeof ctx.onDispose === "function") {
    }
    return { navigate: router.navigate, back: () => history.back(), forward: () => history.forward(), get current() {
      return router;
    } };
  };
  JSswift.useRoute = function(ctx) {
    const [getPath, setPath] = JSswift.reactive.signal("");
    const [getParams, setParams] = JSswift.reactive.signal({});
    const [getQuery, setQuery] = JSswift.reactive.signal({});
    const [getHash, setHash] = JSswift.reactive.signal("");
    const update = (routeCtx) => {
      setPath(routeCtx.path || "");
      setParams(routeCtx.params || {});
      setQuery(routeCtx.query || {});
      setHash(routeCtx.hash || "");
    };
    const unsubscribe = JSswift.router.subscribe(update);
    if (ctx && typeof ctx.onDispose === "function") {
      ctx.onDispose(unsubscribe);
    }
    return { path: getPath, params: getParams, query: getQuery, hash: getHash };
  };
  JSswift._routerShared = /* @__PURE__ */ (() => {
    function normalizePath(path) {
      if (!path) return "/";
      if (!path.startsWith("/")) path = "/" + path;
      if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
      return path;
    }
    function stripBase(path, base = "") {
      if (base && path.startsWith(base)) {
        const next = path.slice(base.length) || "/";
        return normalizePath(next);
      }
      return normalizePath(path);
    }
    function compilePattern(pattern) {
      pattern = normalizePath(pattern);
      const keys = [];
      const regexStr = pattern.replace(/([.+*?=^!${}()[\]|/\\])/g, "\\$1").replace(/\\\/:([A-Za-z0-9_]+)/g, (_2, key) => {
        keys.push(key);
        return "\\/([^\\/]+)";
      });
      return { pattern, regex: new RegExp("^" + regexStr + "$"), keys };
    }
    function parseQuery(search) {
      const query = {};
      const params = new URLSearchParams(search || "");
      params.forEach((value, key) => {
        if (query[key] === void 0) query[key] = value;
        else if (Array.isArray(query[key])) query[key].push(value);
        else query[key] = [query[key], value];
      });
      return query;
    }
    function flattenRoutes(routes) {
      const all = [];
      for (const route of routes) {
        all.push({ ...route, _parent: null });
        if (route.children && route.children.length) {
          for (const child of route.children) {
            all.push({ ...child, _parent: route });
          }
        }
      }
      all.sort((a, b) => b.path.length - a.path.length);
      return all;
    }
    function matchRoute(pathname, routes) {
      const path = normalizePath(pathname);
      const all = flattenRoutes(routes);
      for (const route of all) {
        const match = route._compiled.regex.exec(path);
        if (!match) continue;
        const params = {};
        route._compiled.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1]);
        });
        return { route, params, parent: route._parent || null };
      }
      return null;
    }
    function pushHistoryEntry(history2, ctx, limit = 50) {
      history2.push({ at: Date.now(), path: ctx.path, params: ctx.params, query: ctx.query, hash: ctx.hash });
      if (history2.length > limit) history2.shift();
    }
    return { normalizePath, stripBase, compilePattern, parseQuery, flattenRoutes, matchRoute, pushHistoryEntry };
  })();
  JSswift._uiMetaShared = /* @__PURE__ */ (() => {
    function resolveDocComponents(_2) {
      return { hasTabPanel: typeof _2.TabPanel === "function", Card: typeof _2.Card === "function" ? _2.Card : (...children) => _2.div({ class: "jss-doc-card" }, ...children), Chip: typeof _2.Chip === "function" ? _2.Chip : (_props, label) => _2.span({ class: "jss-chip jss-chip-fallback" }, label) };
    }
    function formatMetaValues(values) {
      if (!values) return "\u2014";
      if (Array.isArray(values)) return values.join(" | ");
      return String(values);
    }
    function renderMetaItem(_2, item, Chip) {
      return _2.div({ class: "jss-doc-meta" }, _2.div({ class: "jss-doc-meta-head" }, _2.div({ class: "jss-doc-meta-name" }, item.name), _2.div({ class: "jss-doc-meta-types" }, ...item.type ? String(item.type).split("|").map((token) => Chip({ color: "secondary", dense: true, outline: true }, token)) : [_2.span("\u2014")])), _2.div({ class: "jss-doc-meta-grid" }, _2.div({ class: "jss-doc-meta-block" }, _2.div({ class: "jss-doc-meta-label" }, "Default"), _2.div({ class: "jss-doc-meta-value" }, item.default == null ? "\u2014" : String(item.default))), _2.div({ class: "jss-doc-meta-block" }, _2.div({ class: "jss-doc-meta-label" }, "Values"), _2.div({ class: "jss-doc-meta-value" }, formatMetaValues(item.values)))), _2.div({ class: "jss-doc-meta-block" }, _2.div({ class: "jss-doc-meta-label" }, "Description"), _2.div({ class: "jss-doc-meta-value" }, item.description || "\u2014")));
    }
    function renderTabGroupFallback(_2, rows) {
      return _2.div({ class: "jss-doc-fallback" }, rows.map((row) => _2.div({ class: "jss-doc-fallback-item" }, _2.h4({ class: "jss-doc-fallback-title" }, row.label || row.name), row.content)));
    }
    function normalizeEventRows(_2, events) {
      if (!events) return [];
      if (Array.isArray(events)) {
        return events.map((eventItem) => ({ name: eventItem.name, wrap: true, label: eventItem.name, content: _2.div({ class: "jss-p-md" }, eventItem.description) }));
      }
      return Object.entries(events).map(([key, value]) => ({ name: key, wrap: true, label: key, content: _2.div({ class: "jss-p-md" }, value) }));
    }
    function normalizeSlotRows(_2, slots) {
      if (!slots) return [];
      if (Array.isArray(slots)) {
        return slots.map((slot) => ({ name: slot.name, wrap: true, label: slot.type, content: slot.description }));
      }
      return Object.entries(slots).map(([key, value]) => ({ name: key, wrap: true, label: key, content: _2.div({ class: "jss-doc-meta" }, _2.div({ class: "jss-doc-meta-head" }, _2.div({ class: "jss-doc-meta-name" }, key)), _2.div({ class: "jss-doc-meta-grid" }, _2.div({ class: "jss-doc-meta-block" }, _2.div({ class: "jss-doc-meta-label" }, "Type"), _2.div({ class: "jss-doc-meta-value" }, value.type || "\u2014"))), _2.div({ class: "jss-doc-meta-block" }, _2.div({ class: "jss-doc-meta-label" }, "Description"), _2.div({ class: "jss-doc-meta-value" }, value.description || "\u2014"))) }));
    }
    return { resolveDocComponents, renderMetaItem, renderTabGroupFallback, normalizeEventRows, normalizeSlotRows };
  })();
  JSswift.ui = JSswift.ui || {};
  JSswift.ui.meta = JSswift.ui.meta || {};
  JSswift.ui.slot = function slot(value, opts = {}) {
    const UI = JSswift.ui;
    const { as = "node", wrap = "span", iconProps = null, filter = true } = opts;
    const makeTextNode = (v) => document.createTextNode(String(v));
    const makeSpan = (v) => _.span(String(v));
    const normalizeOne = (v) => {
      if (v == null || v === false) return null;
      if (typeof v === "function") return v;
      if (Array.isArray(v)) return v.flatMap(normalizeOne).filter(Boolean);
      if (v && typeof v === "object" && v.nodeType) return v;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        const s = String(v);
        if (as === "icon" && UI.Icon) {
          return UI.Icon(s, { class: "jss-slot-icon", ...iconProps || {} });
        }
        if (wrap === "text") return makeTextNode(s);
        if (wrap === "span") return makeSpan(s);
        return s;
      }
      if (wrap === "text") return makeTextNode(v);
      if (wrap === "span") return makeSpan(v);
      return String(v);
    };
    const out = normalizeOne(value);
    if (!filter) return out;
    if (Array.isArray(out)) return out.filter(Boolean);
    return out;
  };
  JSswift.ui.slots = function slots(...values) {
    const out = [];
    for (const v of values) {
      const r = JSswift.ui.slot(v);
      if (!r) continue;
      if (Array.isArray(r)) out.push(...r);
      else out.push(r);
    }
    return out;
  };
  JSswift.docTable = (name) => {
    var _a2;
    if (!JSswift.isDev()) return _.div();
    const { resolveDocComponents, renderMetaItem, renderTabGroupFallback, normalizeEventRows, normalizeSlotRows } = JSswift._uiMetaShared;
    const meta = (_a2 = JSswift.ui.meta) == null ? void 0 : _a2[name];
    if (!meta) return _.div({ class: "jss-muted" }, `Meta non trovata: ${name}`);
    const { hasTabPanel, Card, Chip } = resolveDocComponents(_);
    const list = {};
    Object.entries(meta.props || {}).forEach(([k, v]) => {
      const cat = v.category || "general";
      if (!list[cat]) list[cat] = [];
      list[cat].push({ name: k, ...v });
    });
    const propsTab = Object.keys(list).map((v) => {
      const rows = list[v].map((p) => {
        return { name: p.name, wrap: true, label: p.name, content: renderMetaItem(_, p, Chip) };
      });
      return { name: v, wrap: true, label: v, content: hasTabPanel ? _.TabPanel({ orientation: "vertical", animated: true, radius: "0 0 0 var(--jss-r-default)", tabs: rows }) : renderTabGroupFallback(_, rows) };
    });
    const eventsRows = normalizeEventRows(_, meta.events);
    const slotsRows = normalizeSlotRows(_, meta.slots);
    const tabPanelModel = _.rod(null);
    const taps = [];
    if (slotsRows.length) taps.push({ name: "Slots", wrap: true, label: "Slots", content: hasTabPanel ? _.TabPanel({ animated: true, radius: "0 0 0 var(--jss-r-default)", orientation: "vertical", tabs: slotsRows }) : renderTabGroupFallback(_, slotsRows) });
    if (propsTab.length) taps.push(...propsTab);
    if (eventsRows.length) taps.push({ name: "Events", wrap: true, label: "Events", content: hasTabPanel ? _.TabPanel({ animated: true, radius: "0 0 0 var(--jss-r-default)", orientation: "vertical", tabs: eventsRows }) : renderTabGroupFallback(_, eventsRows) });
    const first = "general";
    taps.sort((a, b) => {
      if (a.name === first) return -1;
      if (b.name === first) return 1;
      return a.name.localeCompare(b.name);
    });
    return Card({ class: "jss-doc-table" }, _.div({ class: "jss-doc-table-header" }, _.div({ class: "jss-doc-table-title" }, `_.${name}`), meta.signature ? _.div({ class: "jss-doc-table-signature" }, String(meta.signature).replaceAll("UI.", "_.")) : null), taps.length ? _.h4({ class: "jss-doc-table-section-title" }, propsTab.length ? "Props" : "Documentation") : _.p({ class: "jss-muted" }, "Nessuna documentazione strutturata disponibile."), taps.length ? hasTabPanel ? _.TabPanel({ border: true, animated: true, orientation: "horizontal", tabs: taps, model: tabPanelModel }) : renderTabGroupFallback(_, taps) : null, meta.returns ? _.p({ class: "jss-muted", style: { marginTop: "14px" } }, `Returns: ${meta.returns}`) : null);
  };
  JSswift.ui.inspect = (name) => {
    var _a2;
    return console.log(((_a2 = JSswift.ui.meta) == null ? void 0 : _a2[name]) || "meta not found");
  };
  JSswift.ui.can = function(ctx, permOrRole, render, elseRender = null) {
    var _a2, _b2;
    const auth = JSswift.useAuth ? JSswift.useAuth(ctx) : JSswift.auth;
    if (!auth) return typeof elseRender === "function" ? elseRender() : null;
    const ok = typeof permOrRole === "function" ? !!permOrRole(auth) : ((_a2 = auth.can) == null ? void 0 : _a2.call(auth, permOrRole)) || ((_b2 = auth.hasRole) == null ? void 0 : _b2.call(auth, permOrRole));
    if (ok) return typeof render === "function" ? render() : render;
    return typeof elseRender === "function" ? elseRender() : elseRender;
  };
  JSswift.ui.canAny = function(ctx, list, render, elseRender = null) {
    var _a2;
    const auth = JSswift.useAuth ? JSswift.useAuth(ctx) : JSswift.auth;
    const ok = !!((_a2 = auth == null ? void 0 : auth.canAny) == null ? void 0 : _a2.call(auth, list));
    return ok ? typeof render === "function" ? render() : render : typeof elseRender === "function" ? elseRender() : elseRender;
  };
  JSswift.ui.canAll = function(ctx, list, render, elseRender = null) {
    var _a2;
    const auth = JSswift.useAuth ? JSswift.useAuth(ctx) : JSswift.auth;
    const ok = !!((_a2 = auth == null ? void 0 : auth.canAll) == null ? void 0 : _a2.call(auth, list));
    return ok ? typeof render === "function" ? render() : render : typeof elseRender === "function" ? elseRender() : elseRender;
  };
  JSswift.Can = function Can(props, ctx) {
    var _a2, _b2;
    const auth = JSswift.useAuth ? JSswift.useAuth(ctx) : JSswift.auth;
    const pred = () => {
      var _a3, _b3, _c2, _d2;
      if (!auth) return false;
      if (props.when && typeof props.when === "function") return !!props.when(auth);
      if (props.perm) return !!((_a3 = auth.can) == null ? void 0 : _a3.call(auth, props.perm));
      if (props.role) return !!((_b3 = auth.hasRole) == null ? void 0 : _b3.call(auth, props.role));
      if (props.any) return !!((_c2 = auth.canAny) == null ? void 0 : _c2.call(auth, props.any));
      if (props.all) return !!((_d2 = auth.canAll) == null ? void 0 : _d2.call(auth, props.all));
      return false;
    };
    return pred() ? typeof props.then === "function" ? props.then() : (_a2 = props.then) != null ? _a2 : null : typeof props.else === "function" ? props.else() : (_b2 = props.else) != null ? _b2 : null;
  };
  JSswift.router = (() => {
    let mode = "history";
    let routes = [];
    let outlet = null;
    let unmountCurrent = null;
    let base = "";
    let beforeHook = null;
    let _currentCtx = null;
    let _history = [];
    let _tracing = false;
    const { normalizePath, stripBase: stripBasePath, compilePattern, parseQuery, matchRoute, pushHistoryEntry } = JSswift._routerShared;
    const meta = { setOutlet: { description: "imposta il contenitore del router" }, setBase: { description: "imposta il base path del router" }, add: { description: "per aggiungere la route" }, notFound: { description: "imposta la view 404" }, beforeEach: { description: "hook prima di ogni navigazione" }, start: { description: "avvia il router" }, navigate: { description: "naviga verso una route" }, subscribe: { description: "sottoscrive agli aggiornamenti di route" }, current: { description: "ritorna l'URL corrente" }, isActive: { description: "verifica se una route e\u0300 attiva" }, status: { description: "stringa di stato router" }, inspect: { description: "stampa info diagnostiche" }, trace: { description: "abilita/disabilita tracing" }, history: { description: "ritorna la history interna" }, setURLOnly: { description: "aggiorna solo l'URL del browser senza render/meta" } };
    function setURLOnly(urlLike, { replace = false } = {}) {
      const url = typeof urlLike === "string" ? new URL(urlLike, window.location.origin) : urlLike;
      const fullPath = url.pathname + url.search + url.hash;
      if (mode === "hash" || mode === "auto") {
        if (history.pushState) {
          const h2 = "#" + fullPath;
          if (replace) history.replaceState({}, "", h2);
          else history.pushState({}, "", h2);
          return;
        }
        const h = "#" + fullPath;
        if (replace) window.location.replace(h);
        else window.location.hash = h;
        return;
      }
      if (replace) history.replaceState({}, "", base + fullPath);
      else history.pushState({}, "", base + fullPath);
    }
    function getCurrentURL() {
      if (mode === "hash") {
        const h = window.location.hash || "#/";
        const url = h.startsWith("#") ? h.slice(1) : h;
        return new URL(url, window.location.origin);
      }
      if (mode === "auto") {
        if (window.location.hash.startsWith("#/")) {
          const url = window.location.hash.slice(1);
          return new URL(url, window.location.origin);
        }
      }
      return new URL(window.location.href);
    }
    function updateURL(url, replace = false) {
      if (mode === "hash" || mode === "auto" && !history.pushState) {
        const h = "#" + (url.pathname + url.search + url.hash);
        if (replace) {
          window.location.replace(h);
        } else {
          window.location.hash = h;
        }
        return;
      }
      if (replace) history.replaceState({}, "", base + url.pathname + url.search + url.hash);
      else history.pushState({}, "", base + url.pathname + url.search + url.hash);
    }
    function setMode(m) {
      mode = m || "history";
    }
    function stripBase(path) {
      return stripBasePath(path, base);
    }
    function isActive(path) {
      if (!path) return false;
      const currentPath = _currentCtx ? _currentCtx.path : stripBase(getCurrentURL().pathname);
      let pathname = path;
      if (typeof pathname === "string" && (pathname.includes("?") || pathname.includes("#") || pathname.includes("://"))) {
        pathname = new URL(pathname, window.location.origin).pathname;
      }
      const target = stripBase(pathname);
      if (!target.includes(":")) return target === currentPath;
      const compiled = compilePattern(target);
      return compiled.regex.test(currentPath);
    }
    async function render(urlLike, { replace = false } = {}) {
      if (!outlet) {
        console.warn("[router] outlet non impostato. Usa JSswift.router.setOutlet('#app').");
        return;
      }
      const url = typeof urlLike === "string" ? new URL(urlLike, window.location.origin) : urlLike;
      if (_tracing) {
        console.log("[router.navigate]", url.toString());
      }
      const fullPath = url.pathname + url.search + url.hash;
      updateURL(url, replace);
      const pathname = stripBase(url.pathname);
      const m = matchRoute(pathname, routes);
      const ctx = { path: pathname, fullPath, params: m ? m.params : {}, query: parseQuery(url.search), hash: url.hash || "", navigate, outlet };
      if (beforeHook) {
        const res = await beforeHook(ctx);
        if (res === false) return;
        if (typeof res === "string") {
          navigate(res, { replace: true });
          return;
        }
      }
      if (typeof unmountCurrent === "function") {
        try {
          unmountCurrent();
        } catch (e) {
          console.error("[router] unmount error:", e);
        }
        unmountCurrent = null;
      }
      if (!m) {
        const view404 = routes._notFound;
        if (view404) {
          unmountCurrent = JSswift.mount(outlet, () => view404(ctx), { clear: true });
        } else {
          unmountCurrent = JSswift.mount(outlet, _.div("404"), { clear: true });
        }
        notifyRoute(ctx);
        _currentCtx = ctx;
        pushHistoryEntry(_history, ctx);
        return;
      }
      const view = m.route.view;
      const parent = m.parent;
      let childMounted = null;
      ctx.renderChild = (target) => {
        if (!ctx._child) return null;
        const childOutlet = typeof target === "string" ? ctx.outlet.querySelector(target) : target;
        if (!childOutlet) {
          console.warn("[router] child outlet non trovato:", target);
          return null;
        }
        childMounted = JSswift.mount(childOutlet, () => ctx._child.view(ctx._child.ctx), { clear: true });
        return childMounted;
      };
      if (parent) {
        const childRoute = m.route;
        const childCtx = { ...ctx, params: { ...ctx.params } };
        ctx._child = { view: childRoute.view, ctx: childCtx };
        unmountCurrent = JSswift.mount(outlet, () => parent.view(ctx), { clear: true });
      } else {
        ctx._child = null;
        unmountCurrent = JSswift.mount(outlet, () => view(ctx), { clear: true });
      }
      notifyRoute(ctx);
      _currentCtx = ctx;
      pushHistoryEntry(_history, ctx);
    }
    function navigate(to, opts = {}) {
      const url = new URL(to, window.location.origin);
      render(url, opts);
    }
    function start() {
      window.addEventListener("popstate", () => {
        render(getCurrentURL(), { replace: true });
      });
      window.addEventListener("hashchange", () => {
        if (mode === "hash" || mode === "auto") {
          render(getCurrentURL(), { replace: true });
        }
      });
      document.addEventListener("click", (e) => {
        var _a2, _b2;
        const a = (_b2 = (_a2 = e.target) == null ? void 0 : _a2.closest) == null ? void 0 : _b2.call(_a2, "a");
        if (!a) return;
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (a.hasAttribute("download")) return;
        if (a.target && a.target !== "_self") return;
        const href = a.getAttribute("href");
        if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const current = new URL(window.location.href);
        const samePath = url.pathname + url.search === current.pathname + current.search;
        if (samePath && url.hash) return;
        e.preventDefault();
        navigate(url.pathname + url.search + url.hash);
      });
      render(getCurrentURL(), { replace: true });
    }
    function setOutlet(target) {
      outlet = typeof target === "string" ? JSswift.dom.q(target) : target;
      return outlet;
    }
    function setBase(b) {
      base = b ? normalizePath(b) : "";
      if (base === "/") base = "";
    }
    function add(path, view, children = null) {
      const compiled = compilePattern(path);
      const record = { path: compiled.pattern, view, _compiled: compiled, children: [] };
      if (Array.isArray(children)) {
        for (const c of children) {
          const [subPath, subView, subChildren] = c;
          const full = normalizePath(compiled.pattern + "/" + (subPath || "").replace(/^\//, ""));
          record.children.push({ path: full, view: subView, _compiled: compilePattern(full), children: Array.isArray(subChildren) ? subChildren : [] });
        }
      }
      routes.push(record);
    }
    function notFound(view) {
      routes._notFound = view;
    }
    function beforeEach(fn) {
      beforeHook = fn;
    }
    let _routeListeners = /* @__PURE__ */ new Set();
    function notifyRoute(ctx) {
      for (const fn of _routeListeners) {
        try {
          fn(ctx);
        } catch (e) {
          console.error("[router] listener error:", e);
        }
      }
    }
    function routeStatus() {
      if (!_currentCtx) return "ROUTER \u23F3 not ready";
      const q = Object.keys(_currentCtx.query || {}).length ? "?" : "";
      return `ROUTER ${_currentCtx.path}${q} ${_currentCtx.hash || ""}`;
    }
    function routeInspect(label = "router") {
      if (!_currentCtx) {
        console.warn("[router.inspect] nessuna route attiva");
        return null;
      }
      const info = { label, mode: typeof mode !== "undefined" ? mode : "unknown", base, path: _currentCtx.path, params: _currentCtx.params, query: _currentCtx.query, hash: _currentCtx.hash, outlet, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      console.groupCollapsed(`[JSswift.router.inspect] ${label}`);
      console.log(info);
      console.log("history:", _history.slice());
      console.groupEnd();
      return info;
    }
    function routeTrace(on = true) {
      _tracing = !!on;
      console.log("[JSswift.router.trace]", _tracing ? "ON" : "OFF");
    }
    function routeHistory() {
      return _history.slice();
    }
    return { meta, setOutlet, setBase, add, setURLOnly, notFound, beforeEach, start, navigate, isActive, subscribe(fn) {
      _routeListeners.add(fn);
      return () => _routeListeners.delete(fn);
    }, current() {
      return getCurrentURL ? getCurrentURL() : new URL(window.location.href);
    }, status: routeStatus, inspect: routeInspect, trace: routeTrace, history: routeHistory };
  })();
  if ((_i = JSswift.config) == null ? void 0 : _i.debug) {
    window.$router = JSswift.router;
  }
  JSswift.signal = JSswift.reactive.signal;
  JSswift.effect = JSswift.reactive.effect;
  JSswift.computed = JSswift.reactive.computed;
  JSswift.untracked = JSswift.reactive.untracked;
  JSswift.batch = JSswift.reactive.batch;
  function normalizeThemeName(theme) {
    if (theme == null) return null;
    const value = String(theme).trim();
    return value || null;
  }
  function normalizeThemeList(input) {
    const values = Array.isArray(input) ? input : typeof input === "string" ? input.split(",") : [];
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const item of values) {
      const value = normalizeThemeName(item);
      if (!value || seen.has(value)) continue;
      seen.add(value);
      out.push(value);
    }
    return out;
  }
  function getThemeRoot() {
    var _a2;
    if (typeof document !== "undefined" && document.documentElement) {
      return document.documentElement;
    }
    return ((_a2 = JSswift.dom) == null ? void 0 : _a2.q) ? JSswift.dom.q("html") : null;
  }
  function getThemeStorage() {
    try {
      return typeof globalThis !== "undefined" ? globalThis.localStorage || null : null;
    } catch (_error) {
      return null;
    }
  }
  function getThemeStorageKey() {
    var _a2;
    return normalizeThemeName((_a2 = JSswift.theme) == null ? void 0 : _a2.storageKey) || "jsswift:theme";
  }
  function readSavedTheme() {
    const storage = getThemeStorage();
    if (!storage) return null;
    try {
      return normalizeThemeName(storage.getItem(getThemeStorageKey()));
    } catch (_error) {
      return null;
    }
  }
  function writeSavedTheme(theme) {
    const storage = getThemeStorage();
    if (!storage) return;
    try {
      if (theme == null) {
        storage.removeItem(getThemeStorageKey());
      } else {
        storage.setItem(getThemeStorageKey(), theme);
      }
    } catch (_error) {
    }
  }
  function resolveThemeList(themes) {
    var _a2, _b2, _c2, _d2, _e2;
    const html = getThemeRoot();
    const candidates = [themes, (_a2 = JSswift.theme) == null ? void 0 : _a2.themes, (_b2 = JSswift.config) == null ? void 0 : _b2.themes, typeof globalThis !== "undefined" ? (_c2 = globalThis.JSswift_setting) == null ? void 0 : _c2.themes : null, typeof globalThis !== "undefined" ? (_d2 = globalThis.JSswift_setting) == null ? void 0 : _d2.themeList : null, (_e2 = html == null ? void 0 : html.getAttribute) == null ? void 0 : _e2.call(html, "data-themes")];
    for (const candidate of candidates) {
      const list = normalizeThemeList(candidate);
      if (list.length) return list;
    }
    return [];
  }
  JSswift.theme = JSswift.theme || {};
  JSswift.theme.storageKey = getThemeStorageKey();
  if (!normalizeThemeList(JSswift.theme.themes).length) {
    JSswift.theme.themes = resolveThemeList();
  }
  JSswift.setTheme = function(theme, opts = {}) {
    const value = normalizeThemeName(theme);
    const html = getThemeRoot();
    if (html) {
      if (value == null) html.removeAttribute("data-theme");
      else html.setAttribute("data-theme", value);
    }
    if (opts.persist !== false) writeSavedTheme(value);
    return html;
  };
  JSswift.getTheme = function(opts = {}) {
    var _a2;
    const html = getThemeRoot();
    const current = normalizeThemeName((_a2 = html == null ? void 0 : html.getAttribute) == null ? void 0 : _a2.call(html, "data-theme"));
    if (current) return current;
    if (opts.storage === false) return null;
    const saved = readSavedTheme();
    if (saved && html && opts.sync !== false) {
      html.setAttribute("data-theme", saved);
    }
    return saved;
  };
  JSswift.toggleTheme = function(themes, opts = {}) {
    const list = resolveThemeList(themes);
    const activeList = list.length ? list : normalizeThemeList([JSswift.getTheme({ sync: false }), "light", "dark"]);
    const current = JSswift.getTheme({ sync: false });
    const fallback = normalizeThemeName(opts.fallback) || activeList[0] || "light";
    const currentIndex = current ? activeList.indexOf(current) : -1;
    const nextTheme = currentIndex >= 0 ? activeList[(currentIndex + 1) % activeList.length] : fallback;
    JSswift.theme.themes = activeList.slice();
    JSswift.setTheme(nextTheme, opts);
    return nextTheme;
  };
  const bootTheme = readSavedTheme();
  if (bootTheme) {
    JSswift.setTheme(bootTheme, { persist: false });
  }
})();
