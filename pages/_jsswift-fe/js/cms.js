(() => {

  /* ===============================
     JSswift core mini (ready + dom + reactive)
     =============================== */

  window.JSswift = window.JSswift || {};
  const JSswift = window.JSswift;
  window._ = window.JSswift; // legacy alias, deprecated: use `_.`


  JSswift.config = JSswift.config || {};
  const JSswiftBootstrapSetting =
    typeof globalThis !== "undefined" && globalThis.JSswift_setting
      ? globalThis.JSswift_setting
      : {};
  JSswift.config.debug = JSswiftBootstrapSetting.modeDev ?? false;

  JSswift.isDev = function () {
    return JSswift.config.debug;
  };

  // UTILITIES
  JSswift.uiNormalizeArgs = function (args) {
    let props = {};
    let children = args;

    if (
      args.length > 0 &&
      typeof args[0] === "object" &&
      args[0] !== null &&
      !args[0].nodeType &&
      !Array.isArray(args[0]) &&
      !(args[0] instanceof Function)
    ) {
      props = args[0];
      children = args.slice(1);
    }
    return { props, children };
  }
  JSswift.uiSizes = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"];
  JSswift.uiColors = ["primary", "secondary", "success", "warning", "danger", "info", "light", "dark"];
  JSswift.meta = JSswift.meta || {
    version: "1.0.23",
    policy: {
      sourceOfTruth: "docs/reference/core.md",
      syncRule: "Quando cambia un modulo core, aggiornare sia questo meta sia docs/reference/core.md."
    },
    modules: {
      render: {
        description: "Bridge props -> DOM per hyperscript _, attributi, class, style, eventi e children reattivi.",
        entrypoints: ["createElement", "setProp", "bindProp"],
        status: "milestone-3-closed",
        knownLimits: [
          "Il mini-terzo-giro e il successivo micro-giro avanzato hanno chiuso style dinamico, eventi, children e props/attr speciali, ma restano altri edge case avanzati da esplorare.",
          "Gli eventi ora supportano composizione base di listener multipli, ma non hanno ancora delegation o diff avanzato.",
          "Restano da esplorare edge case avanzati del renderer oltre ai giri gia coperti dai test."
        ]
      },
      reactive: {
        description: "Core minimale signal/effect usato come base della reattivita.",
        entrypoints: ["JSswift.reactive.signal", "JSswift.reactive.effect", "JSswift.reactive.computed", "JSswift.reactive.untracked", "JSswift.reactive.batch"],
        status: "milestone-2-closed",
        knownLimits: [
          "La protezione loop copre i loop sincroni per singolo effect, non ancora i cicli complessi tra effect multipli.",
          "Il batching sincrono ora esiste, ma manca ancora scheduling configurabile oltre il flush immediato a fine batch.",
          "Mancano primitive avanzate per controllare scheduling e transazioni asincrone."
        ]
      },
      rod: {
        description: "Layer reattivo di alto livello per binding DOM, model e interpolazioni.",
        entrypoints: ["_.rod", "JSswift.rodBind", "JSswift.rodModel"],
        status: "milestone-2-closed",
        knownLimits: [
          "Va chiarito meglio il rapporto con JSswift.reactive oltre al primo riallineamento strutturale.",
          "Restano casi avanzati di model/binding da esplorare oltre al primo giro coperto dai test.",
          "Il modulo e piu pulito internamente ma non e ancora il punto finale della convergenza con il renderer."
        ]
      },
      mount: {
        description: "Mount, component instances e cleanup automatico del tree DOM.",
        entrypoints: ["JSswift.mount", "JSswift.component", "JSswift.enableAutoCleanup"],
        status: "milestone-2-closed",
        knownLimits: [
          "Il lifecycle e piu pulito internamente ma resta da chiarire meglio la semantica su multi-mount e cloni.",
          "Restano da esplorare edge case avanzati del cleanup automatico fuori dal primo giro gia coperto."
        ]
      },
      platform: {
        description: "Moduli applicativi nel core: overlay, store, auth, http, router, UI meta.",
        entrypoints: ["JSswift.overlay", "JSswift.store", "JSswift.plugins.auth", "JSswift.http", "JSswift.router", "JSswift.ui.meta"],
        status: "milestone-2-closed",
        knownLimits: [
          "Il secondo giro ha ripulito i moduli interni, ma mancano ancora demo separate per modulo e una validazione piu formale di alcune superfici pubbliche.",
          "Esiste una demo browser aggregata del blocco platform, ma non ancora demo separate per ogni modulo.",
          "Mancano configurazione pubblica piu coerente e confini piu netti tra auth, http e router.",
          "Il registry UI meta non ha ancora validazione formale del suo shape."
        ]
      }
    }
  };

  JSswift.omit = (obj, keys) => {
    const out = {};
    const skip = new Set(keys || []);
    for (const k in (obj || {})) {
      if (!skip.has(k)) out[k] = obj[k];
    }
    return out;
  };


  // ===============================
  // Cleanup registry (DOM -> disposers)
  // ===============================
  JSswift._cleanupRegistry = new WeakMap();
  JSswift._registerCleanup = function (node, disposer) {
    if (!node || typeof disposer !== "function") return disposer;
    const list = JSswift._cleanupRegistry.get(node) || [];
    list.push(disposer);
    JSswift._cleanupRegistry.set(node, list);
    return disposer;
  };


  JSswift.dom = {
    q(sel, root = document) { return root.querySelector(sel); },
    qa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); },
    attr(el, name, value) {
      if (!el) return null;
      if (value === undefined) return el.getAttribute(name);
      if (value === null) el.removeAttribute(name);
      else el.setAttribute(name, String(value));
      return el;
    }
  };

  // READY definitivo
  (() => {
    let _queue = [];
    let _ready = false;

    function flushReady() {
      if (_ready) return;
      _ready = true;
      const q = _queue.slice();
      _queue.length = 0;
      for (const fn of q) {
        try { fn(); } catch (e) { console.error("[JSswift.ready] error:", e); }
      }
    }

    JSswift.ready = function (fn) {
      if (typeof fn !== "function") return;
      if (_ready || document.readyState === "interactive" || document.readyState === "complete") {
        queueMicrotask(() => {
          try { fn(); } catch (e) { console.error("[JSswift.ready] error:", e); }
        });
      } else {
        _queue.push(fn);
      }
    };

    document.addEventListener("DOMContentLoaded", flushReady, { once: true });
  })();

  // REACTIVE core
  JSswift.reactive = (() => {
    let CURRENT_EFFECT = null;
    const EFFECT_STACK = [];
    const MAX_SYNC_EFFECT_RERUNS = 100;
    let BATCH_DEPTH = 0;
    let BATCH_FLUSH_MODE = "sync";
    let PENDING_FLUSH_MODE = "sync";
    let MICROTASK_FLUSH_SCHEDULED = false;
    const PENDING_RUNNERS = new Set();

    function normalizeFlushMode(options) {
      const mode = options?.flush;
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
        try { cleanup(); } catch (e) { console.error("[JSswift.reactive.effect] cleanup error:", e); }
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
      if (typeof fn !== "function") return () => { };

      const record = {
        fn,
        active: true,
        _deps: new Set(),
        _cleanup: null,
        _runner: null,
        _running: false,
        _queued: false
      };

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
              console.warn("[JSswift.reactive.effect] loop guard triggered: too many synchronous reruns", {
                max: MAX_SYNC_EFFECT_RERUNS,
                effect: fn.name || "anonymous"
              });
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
      const subs = new Set();

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

      const [get, set, disposeSignal] = signal(undefined);
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
  // ===============================
  // Overlay shared helpers
  // ===============================
  JSswift._overlayShared = (() => {
    const focusSelector = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    function ensureRoot(getRoot, setRoot) {
      const currentRoot = getRoot();
      if (currentRoot && currentRoot.isConnected) return currentRoot;

      let el = document.getElementById("cms-overlay-root");
      if (!el && document?.body) {
        el = document.createElement("div");
        el.id = "cms-overlay-root";
        el.className = "cms-overlay-root";
        document.body.appendChild(el);
      }

      if (!document.body && !el) {
        JSswift.ready(() => {
          let readyEl = document.getElementById("cms-overlay-root");
          if (!readyEl) {
            readyEl = document.createElement("div");
            readyEl.id = "cms-overlay-root";
            readyEl.className = "cms-overlay-root";
            document.body.appendChild(readyEl);
          }
          setRoot(readyEl);
        });
      }

      setRoot(el);
      return el;
    }

    function focusFirst(container) {
      const node = container.querySelector(focusSelector);
      node?.focus?.();
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
      if (!opts.anchorEl) return;

      const anchorRect = opts.anchorEl.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const visualViewport = window.visualViewport || null;
      const viewportOffsetLeft = Math.max(0, Number(visualViewport?.offsetLeft) || 0);
      const viewportOffsetTop = Math.max(0, Number(visualViewport?.offsetTop) || 0);
      const viewportWidth = Math.max(
        Number(visualViewport?.width) || 0,
        window.innerWidth || 0,
        document.documentElement?.clientWidth || 0
      );
      const viewportHeight = Math.max(
        Number(visualViewport?.height) || 0,
        window.innerHeight || 0,
        document.documentElement?.clientHeight || 0
      );
      const rawGutter = Number(opts.viewportGutter ?? opts.gutter ?? 8);
      const gutter = Number.isFinite(rawGutter) ? Math.max(0, rawGutter) : 8;
      const rawOffsetX = Number(opts.offsetX ?? 0);
      const rawOffsetY = Number(opts.offsetY ?? 8);
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
        let left = anchorRect.left + offsetX;
        let top = anchorRect.top + offsetY;

        if (targetSide === "top" || targetSide === "bottom") {
          if (align === "center") left = anchorRect.left + ((anchorRect.width - panelWidth) / 2) + offsetX;
          else if (align === "end") left = anchorRect.right - panelWidth + offsetX;
          top = targetSide === "top"
            ? anchorRect.top - panelHeight - offsetY
            : anchorRect.bottom + offsetY;
        } else {
          if (align === "center") top = anchorRect.top + ((anchorRect.height - panelHeight) / 2) + offsetY;
          else if (align === "end") top = anchorRect.bottom - panelHeight + offsetY;
          left = targetSide === "left"
            ? anchorRect.left - panelWidth - offsetX
            : anchorRect.right + offsetX;
        }

        return { left, top };
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
      const resolvedSide = (requiredSpace > preferredSpace && oppositeSpace > preferredSpace)
        ? oppositeSide
        : side;
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

    return {
      ensureRoot,
      focusFirst,
      trapFocus,
      applyAnchoredPosition
    };
  })();
  JSswift.overlay = (() => {
    let seq = 0;
    const stack = new Map(); // id -> entry
    let root = null;
    const {
      ensureRoot: ensureOverlayRoot,
      focusFirst,
      trapFocus,
      applyAnchoredPosition
    } = JSswift._overlayShared;
    const ensureRoot = () => ensureOverlayRoot(() => root, (nextRoot) => {
      root = nextRoot;
    });

    let scrollLockCount = 0;
    const lockScroll = () => {
      scrollLockCount++;
      if (scrollLockCount === 1) {
        document.documentElement.classList.add("cms-scroll-locked");
      }
    };
    const unlockScroll = () => {
      scrollLockCount = Math.max(0, scrollLockCount - 1);
      if (scrollLockCount === 0) {
        document.documentElement.classList.remove("cms-scroll-locked");
      }
    };

    const getTop = () => {
      let top = null;
      for (const e of stack.values()) top = e; // insertion order
      return top;
    };

    const isOverlayInteractivePortal = (target) => {
      let node = target;
      while (node && node !== document) {
        if (node.nodeType === 1 && node.getAttribute?.("data-cms-overlay-portal") === "true") return true;
        node = node.parentNode;
      }
      return false;
    };

    const open = (content, opts = {}) => {
      const id = `ov_${++seq}`;

      const entry = {
        id,
        opts,
        isOpen: true,
        anchorEl: opts.anchorEl || null,
        placement: opts.placement || "bottom-start",
        onClose: typeof opts.onClose === "function" ? opts.onClose : null,
        overlay: null,
        panel: null,
        backdrop: null,
        reposition: null,
        _positionCleanup: null,
        _positionFrame: null,
        _panelResizeObserver: null,
        _cleanup: null
      };

      const overlay = document.createElement("div");
      overlay.className = ["cms-overlay", opts.type ? `type-${opts.type}` : ""].filter(Boolean).join(" ");
      overlay.dataset.id = id;

      const backdrop = document.createElement("div");
      backdrop.className = "cms-overlay-backdrop";
      if (!opts.backdrop) backdrop.style.display = "none";

      const panel = document.createElement("div");
      panel.className = ["cms-overlay-panel", opts.className].filter(Boolean).join(" ");
      panel.tabIndex = -1;

      // mount content
      const node = (typeof content === "function") ? content({ close: () => close(id) }) : content;
      const normalized = JSswift.ui.slot(node);
      if (Array.isArray(normalized)) normalized.forEach(n => n && panel.appendChild(n));
      else if (normalized) panel.appendChild(normalized);

      overlay.appendChild(backdrop);
      overlay.appendChild(panel);
      const host = ensureRoot();
      if (!host) return { id, close: () => close(id), panel, overlay };
      host.appendChild(overlay);

      // stack bookkeeping
      entry.overlay = overlay;
      entry.panel = panel;
      entry.backdrop = backdrop;
      stack.set(id, entry);

      // scroll lock + focus
      if (opts.lockScroll) lockScroll();
      if (opts.autoFocus !== false) setTimeout(() => focusFirst(panel), 0);

      // positioning (for menus/tooltips)
      const position = (nextOpts = null) => {
        if (nextOpts && typeof nextOpts === "object") Object.assign(entry.opts, nextOpts);
        applyAnchoredPosition(panel, entry.opts);
      };
      const schedulePosition = () => {
        if (!opts.anchorEl) return;
        const raf = globalThis.requestAnimationFrame || ((fn) => setTimeout(() => fn(Date.now()), 0));
        const caf = globalThis.cancelAnimationFrame || clearTimeout;
        if (entry._positionFrame != null) caf(entry._positionFrame);
        entry._positionFrame = raf(() => {
          entry._positionFrame = null;
          position();
        });
      };
      entry.reposition = position;

      if (opts.anchorEl) {
        position();
        schedulePosition();
        const onResize = () => position();
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onResize, true);
        window.visualViewport?.addEventListener?.("resize", onResize);
        window.visualViewport?.addEventListener?.("scroll", onResize);
        if (typeof ResizeObserver === "function") {
          const panelResizeObserver = new ResizeObserver(() => position());
          panelResizeObserver.observe(panel);
          entry._panelResizeObserver = panelResizeObserver;
        }
        entry._positionCleanup = () => {
          const caf = globalThis.cancelAnimationFrame || clearTimeout;
          if (entry._positionFrame != null) {
            caf(entry._positionFrame);
            entry._positionFrame = null;
          }
          entry._panelResizeObserver?.disconnect?.();
          entry._panelResizeObserver = null;
          window.removeEventListener("resize", onResize);
          window.removeEventListener("scroll", onResize, true);
          window.visualViewport?.removeEventListener?.("resize", onResize);
          window.visualViewport?.removeEventListener?.("scroll", onResize);
        };
      }

      // click outside
      const onDocClick = (e) => {
        const top = getTop();
        if (!top || top.id !== id) return;
        if (opts.closeOnOutside === false) return;
        if (isOverlayInteractivePortal(e.target)) return;
        if (!panel.contains(e.target)) close(id);
      };
      document.addEventListener("mousedown", onDocClick, true);

      // ESC + focus trap
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

      // backdrop click
      backdrop.addEventListener("click", () => {
        if (opts.closeOnBackdrop === false) return;
        close(id);
      });

      // store cleanup
      entry._cleanup = () => {
        document.removeEventListener("mousedown", onDocClick, true);
        document.removeEventListener("keydown", onKeyDown, true);
        entry._positionCleanup?.();
      };

      // z-index stacking
      const z = 1000 + stack.size * 10;
      overlay.style.zIndex = String(z);

      return {
        id,
        close: () => close(id),
        panel,
        overlay,
        reposition: position
      };
    };

    const close = (id) => {
      const entry = stack.get(id);
      if (!entry) return;
      stack.delete(id);

      entry._cleanup?.();

      if (entry.opts.lockScroll) unlockScroll();

      if (typeof cleanupNodeTree === "function") cleanupNodeTree(entry.overlay);
      entry.overlay?.remove();

      entry.onClose?.();
    };

    const closeTop = () => {
      const top = getTop();
      if (top) close(top.id);
    };

    return { open, close, closeTop, root, _stack: stack };
  })();
  /* ===============================
     Shared DOM prop bridge
     =============================== */

  function createDomPropBridge(el, options = {}) {
    const {
      isSVG = false,
      normalizeClass: normalizeClassValue = (value) => String(value ?? ""),
      isContentProp: isContent = () => false,
      autoValueTags = new Set(["INPUT", "TEXTAREA", "SELECT"])
    } = options;

    function isBooleanDomProp(name) {
      if (isSVG || !(name in el)) return false;
      try {
        return typeof el[name] === "boolean";
      } catch {
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
        try { el[name] = false; } catch { }
        el.removeAttribute(name);
        return;
      }
      el.removeAttribute(name);
      if (!isAttributeOnlyProp(name)) {
        try {
          if (typeof el[name] === "string") el[name] = "";
        } catch { }
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
        el[name] = value ?? "";
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
        obj = obj?.[parts[i]];
        if (!obj) return;
      }
      obj[parts[parts.length - 1]] = value;
    }

    function isBindingValueKey(name) {
      if (!name) return false;
      return name === "auto"
        || name.startsWith("attr:")
        || name.startsWith("@")
        || name.startsWith("style.")
        || name.includes(".");
    }

    function applyBindingValue(name, value) {
      if (!name || name === "auto") {
        if (autoValueTags.has(el.tagName)) {
          setProp("value", value);
        } else {
          el.textContent = value ?? "";
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

    return {
      isBooleanDomProp,
      isAttributeOnlyProp,
      isBindingValueKey,
      setAttributeValue,
      setStyleEntry,
      setClassValue,
      setBooleanProp,
      removeProp,
      applyStyleObject,
      setProp,
      setPathValue,
      applyBindingValue
    };
  }
  /* ===============================
     Renderer shared helpers
     =============================== */

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
    let previousKeys = new Set();

    function clearMissing(nextKeys) {
      previousKeys.forEach((styleName) => {
        if (!nextKeys.has(styleName)) setStyleEntry(styleName, null);
      });
      previousKeys = nextKeys;
    }

    function apply(value, isRod) {
      const nextStyle = resolveStyleObject(value, isRod);
      if (!nextStyle) {
        clearMissing(new Set());
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
    return typeof key === "string" && (key.startsWith("on:") || (key.startsWith("on") && key.length > 2));
  }

  const ROD_INTERPOLATION_BUFFER_LIMIT = 128;
  const rodInterpolationBuffer = [];

  function trackRodInterpolation(rod, value) {
    rodInterpolationBuffer.push({ rod, value: String(value ?? "") });
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
    let out = "";
    for (const part of segments) {
      if (typeof part === "string") out += part;
      else out += part?.value ?? "";
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
      return {
        capture: !!options.capture,
        passive: !!options.passive,
        once: !!options.once
      };
    }
    return false;
  }

  function eventOptionsEqual(a, b) {
    const left = normalizeEventOptions(a);
    const right = normalizeEventOptions(b);
    if (typeof left === "boolean" || typeof right === "boolean") return left === right;
    return !!left && !!right
      && left.capture === right.capture
      && left.passive === right.passive
      && left.once === right.once;
  }

  function hasDynamicEventValue(value, isRod) {
    if (Array.isArray(value)) return value.some((entry) => hasDynamicEventValue(entry, isRod));
    if (isRod(value)) return true;
    if (!value || typeof value !== "object" || Array.isArray(value) || value.nodeType) return false;
    if (Array.isArray(value.handlers)) return value.handlers.some((entry) => hasDynamicEventValue(entry, isRod)) || isRod(value.options) || typeof value.options === "function";
    if (Array.isArray(value.listeners)) return value.listeners.some((entry) => hasDynamicEventValue(entry, isRod)) || isRod(value.options) || typeof value.options === "function";
    return isRod(value.handler)
      || isRod(value.listener)
      || isRod(value.fn)
      || isRod(value.options)
      || typeof value.options === "function";
  }

  function normalizeEventEntry(value, isRod, inheritedOptions) {
    if (value == null || value === false) {
      return [];
    }
    if (typeof value === "function") {
      return [{ handler: value, options: normalizeEventOptions(inheritedOptions ?? false) }];
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
        const sharedOptions = value.options ?? inheritedOptions ?? false;
        return handlers.flatMap((entry) => normalizeEventEntry(entry, isRod, sharedOptions));
      }
      let handler = value.handler ?? value.listener ?? value.fn ?? null;
      let options = value.options ?? inheritedOptions ?? false;
      if (isRod(handler)) handler = handler.value;
      if (isRod(options)) options = options.value;
      if (typeof options === "function") options = options();
      return typeof handler === "function"
        ? [{ handler, options: normalizeEventOptions(options) }]
        : [];
    }
    return [];
  }

  function normalizeEventValue(value, isRod) {
    return normalizeEventEntry(value, isRod);
  }

  function bindEventProp(el, key, value, isRod) {
    const eventName = getEventName(key);
    if (!eventName) return;

    const state = {
      listeners: []
    };

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
        const entry = {
          handler: listener.handler,
          options: listener.options,
          dispatch: null
        };
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
  /* ===============================
     Renderer child helpers
     =============================== */

  function createRendererChildHelpers(el, options = {}) {
    const {
      isRod = () => false,
      interpolationCursor = null
    } = options;

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
        if (item?.nodeType) {
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

    return {
      appendRodText,
      appendInterpolatedText,
      appendDynamicChild,
      appendChildValue
    };
  }
  /* ===============================
     Renderer args parser
     =============================== */

  function applyRendererArgs(args, options = {}) {
    const {
      el,
      isRod = () => false,
      interpolationCursor = null,
      appendChildValue = () => { },
      appendRodText = () => { },
      appendInterpolatedText = () => { },
      appendDynamicChild = () => { },
      bindProp = () => { }
    } = options;

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
/* ===============================
   _h hyperscript (usa JSswift.reactive.effect)
   =============================== */

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "line",
  "rect",
  "polygon",
  "polyline",
  "text",
  "tspan",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "use",
  "symbol",
  "clipPath",
  "mask",
  "pattern",
  "filter",
  "feGaussianBlur",
  "feOffset",
  "feBlend",
  "feColorMatrix"
]);

function isContentProp(key) {
  return key === "innerHTML" || key === "innerText" || key === "textContent" || key === "value";
}

function createElement(tag, ...args) {
  const isSVG = SVG_TAGS.has(tag);
  const el = tag === "text" && !isSVG
    ? document.createTextNode("")
    : isSVG
      ? document.createElementNS(SVG_NS, tag)
      : document.createElement(tag);

  const isRod = (v) => !!v && v.type === "rod";
  const interpolationCursor = createRodInterpolationCursor();
  const childHelpers = createRendererChildHelpers(el, { isRod, interpolationCursor });
  const {
    appendRodText,
    appendInterpolatedText,
    appendDynamicChild,
    appendChildValue
  } = childHelpers;
  const domBridge = createDomPropBridge(el, { isSVG, normalizeClass, isContentProp });
  const {
    isBooleanDomProp,
    isBindingValueKey,
    applyBindingValue,
    setStyleEntry,
    setProp,
    setClassValue
  } = domBridge;

  function registerNodeEffect(run) {
    const stop = JSswift.reactive.effect(run);
    JSswift._registerCleanup(el, stop);
    return stop;
  }

  function isNumericValueControl(control) {
    if (String(control?.tagName || "").toLowerCase() !== "input") return false;
    const inputType = String(control?.type || "").toLowerCase();
    return inputType === "range" || inputType === "number";
  }

  function getValueControlType(control) {
    if (String(control?.tagName || "").toLowerCase() !== "input") return "";
    return String(control?.type || "").toLowerCase();
  }

  function isSingleSelectControl(control) {
    return String(control?.tagName || "").toLowerCase() === "select" && !control.multiple;
  }

  function isFileInputControl(control) {
    return String(control?.tagName || "").toLowerCase() === "input"
      && String(control?.type || "").toLowerCase() === "file";
  }

  function bindRodValueControl(control, rodValue, eventName) {
    registerNodeEffect(() => {
      const next = rodValue.value ?? "";
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
          const numeric = typeof control.valueAsNumber === "number" && !Number.isNaN(control.valueAsNumber)
            ? control.valueAsNumber
            : Number(control.value);
          next = Number.isNaN(numeric) ? (controlType === "number" ? null : 0) : numeric;
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
    const readOwnValue = () => String(control.value ?? "on");

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
      const shouldClear = next == null || (Array.isArray(next) && next.length === 0);
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
    const readValues = () => Array.from(control.childNodes || [])
      .filter((node) => node?.tagName === "OPTION" && node.selected)
      .map((node) => String(node.value ?? ""));

    const applyFromRod = () => {
      const nextValues = Array.isArray(rodValue.value)
        ? rodValue.value.map((item) => String(item))
        : [];
      const nextSet = new Set(nextValues);
      Array.from(control.childNodes || []).forEach((node) => {
        if (node?.tagName !== "OPTION") return;
        const shouldSelect = nextSet.has(String(node.value ?? ""));
        if (!!node.selected === shouldSelect) return;
        node.selected = shouldSelect;
        if (shouldSelect) node.setAttribute("selected", "");
        else node.removeAttribute("selected");
      });
    };

    registerNodeEffect(applyFromRod);
    control._cmsApplySelectedValues = applyFromRod;
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
      if (parentSelect || optionEl.parentNode?.tagName !== "SELECT") return;
      parentSelect = optionEl.parentNode;
      parentSelect.addEventListener("change", onParentChange);
    };

    queueMicrotask(attachParent);
    JSswift._registerCleanup(optionEl, () => {
      parentSelect?.removeEventListener("change", onParentChange);
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

  applyRendererArgs(args, {
    el,
    isRod,
    interpolationCursor,
    appendChildValue,
    appendRodText,
    appendInterpolatedText,
    appendDynamicChild,
    bindProp
  });

  if (tag === "select" && typeof el._cmsApplySelectedValues === "function") {
    el._cmsApplySelectedValues();
  }

  return el;
}

const _h = {};
const DOM_ELEMENTS = [

  // ─────────────────────────────
  // Document & Metadata
  // ─────────────────────────────
  "html",
  "head",
  "title",
  "base",
  "link",
  "meta",
  "style",

  // ─────────────────────────────
  // Sectioning
  // ─────────────────────────────
  "body",
  "header",
  "footer",
  "main",
  "section",
  "article",
  "aside",
  "nav",

  // ─────────────────────────────
  // Headings
  // ─────────────────────────────
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",

  // ─────────────────────────────
  // Text content
  // ─────────────────────────────
  "p",
  "div",
  "span",
  "pre",
  "blockquote",
  "hr",
  "br",
  "address",

  // ─────────────────────────────
  // Inline text semantics
  // ─────────────────────────────
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "cite",
  "code",
  "data",
  "dfn",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "small",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",

  // ─────────────────────────────
  // Lists
  // ─────────────────────────────
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",

  // ─────────────────────────────
  // Tables
  // ─────────────────────────────
  "table",
  "caption",
  "colgroup",
  "col",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",

  // ─────────────────────────────
  // Forms
  // ─────────────────────────────
  "form",
  "label",
  "input",
  "textarea",
  "button",
  "select",
  "option",
  "optgroup",
  "fieldset",
  "legend",
  "datalist",
  "output",
  "progress",
  "meter",

  // ─────────────────────────────
  // Embedded content
  // ─────────────────────────────
  "img",
  "picture",
  "source",
  "iframe",
  "embed",
  "object",
  "param",

  // ─────────────────────────────
  // Media
  // ─────────────────────────────
  "audio",
  "video",
  "track",

  // ─────────────────────────────
  // Interactive
  // ─────────────────────────────
  "details",
  "summary",
  "dialog",

  // ─────────────────────────────
  // Scripting
  // ─────────────────────────────
  "script",
  "noscript",
  "canvas",
  "template",
  "slot",

  // ─────────────────────────────
  // SVG (principali)
  // ─────────────────────────────
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "line",
  "rect",
  "polygon",
  "polyline",
  "text",
  "tspan",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "use",
  "symbol",
  "clipPath",
  "mask",
  "pattern",
  "filter",
  "feGaussianBlur",
  "feOffset",
  "feBlend",
  "feColorMatrix"
];
DOM_ELEMENTS.forEach(tag => {
  window._[tag] = (...args) => createElement(tag, ...args);
});
_.DOM_ELEMENTS = DOM_ELEMENTS;

_.fragment = (...children) => children;
_.dynamic = function (renderFn) {
  const anchor = document.createComment("dyn");
  const parent = document.createDocumentFragment();
  parent.appendChild(anchor);

  let current = null;

  JSswift.reactive.effect(() => {
    const next = renderFn();

    // rimuovi current
    if (current && current.parentNode) current.parentNode.removeChild(current);
    current = null;

    if (next == null) return;

    // normalizza: node o string
    let node = next;
    if (typeof next === "string" || typeof next === "number") {
      node = document.createTextNode(String(next));
    }

    // inserisci dopo anchor
    const p = anchor.parentNode;
    if (p && node && node.nodeType) {
      p.insertBefore(node, anchor.nextSibling);
      current = node;
    }
  });

  return parent; // fragment con anchor
};
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
  // ===============================
  // Lifecycle helpers
  // ===============================

  function cleanupNodeTree(node) {
    if (!node) return;

    const disposers = JSswift._cleanupRegistry.get(node);
    if (disposers) {
      for (const d of disposers) {
        try { d(); } catch (e) { console.error("[cleanup] error:", e); }
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
    const toEl = (t) => (typeof t === "string" ? JSswift.dom.q(t) : t);
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
        try { d(); } catch (e) { console.error(label, e); }
      }
    };
  }

  function createComponentDisposer(disposers = [], userDispose = null) {
    return createOnceDisposer([
      ...(userDispose ? [userDispose] : []),
      ...disposers
    ], "[component] dispose error:");
  }
  // ===============================
  // JSswift.mount (Node | array | string | function)
  // ===============================
  // ===============================
  // JSswift.mount (target singolo o array) + component cleanup
  // content può essere:
  // - Node | array | string/number
  // - function -> uno dei precedenti
  // - { node, dispose }
  // - function -> { node, dispose }  (component instance)
  // ===============================
  JSswift.mount = function (target, content, opts = {}) {
    const targets = toMountTargets(target);

    const clear = opts.clear ?? true;
    const isMulti = targets.length > 1;

    if (targets.length === 0) {
      console.warn("[JSswift.mount] nessun target valido:", target);
      return () => { };
    }

    const mounted = []; // [{ root, nodes, disposers }]

    for (const root of targets) {
      if (clear) {
        while (root.firstChild) {
          cleanupNodeTree(root.firstChild);
          root.removeChild(root.firstChild);
        }
      }

      // per multi-target: se non passi una function, cloneremo i nodi (ma NON possiamo clonare cleanup)
      // quindi: consigliamo content come function quando mounti su più target.
      const { nodes: rawNodes, disposers } = normalizeMountContent(content);

      let nodes = rawNodes;

      if (isMulti && typeof content !== "function") {
        nodes = rawNodes.map(n => n.cloneNode(true));
        if (disposers.length) {
          console.warn("[JSswift.mount] multi-target con dispose: usa content come function per istanze separate.");
        }
      }

      const disposeMounted = createOnceDisposer(disposers);

      for (const n of nodes) root.appendChild(n);

      mounted.push({ root, nodes, dispose: disposeMounted });

      // registra cleanup automatico per ogni nodo root montato
      for (const n of nodes) {
        if (!n || !n.nodeType) continue;
        JSswift._registerCleanup(n, disposeMounted);
      }
    }

    // unmount: rimuove DOM e chiama cleanup
    const unmount = () => {
      for (const m of mounted) {
        // remove nodes
        for (const n of m.nodes) {
          if (!n) continue;
          cleanupNodeTree(n);
          if (n.parentNode === m.root) m.root.removeChild(n);
        }
        m.dispose?.();
      }
    };

    return unmount;
  };

  // ===============================
  // JSswift.component (istanza con cleanup)
  // ===============================
  JSswift.component = function (renderFn) {
    if (typeof renderFn !== "function") throw new Error("JSswift.component: renderFn must be a function");

    // ritorna una factory: props -> { node(s), dispose }
    return function ComponentInstance(props = {}) {
      const disposers = [];

      const ctx = {
        onDispose(fn) {
          if (typeof fn === "function") disposers.push(fn);
        }
      };

      const out = renderFn(props, ctx);

      // supporta:
      // - Node / array / string/number
      // - { node, dispose }
      if (out && typeof out === "object" && "node" in out) {
        return {
          node: out.node,
          dispose: createComponentDisposer(disposers, typeof out.dispose === "function" ? out.dispose : null)
        };
      }

      return {
        node: out,
        dispose: createComponentDisposer(disposers)
      };
    };
  };

  // ===============================
  // Auto cleanup observer (opt-in)
  // ===============================
  JSswift.enableAutoCleanup = function () {
    if (JSswift._autoCleanupEnabled) return;
    JSswift._autoCleanupEnabled = true;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.removedNodes) {
          cleanupNodeTree(node);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    JSswift._cleanupObserver = observer;
  };
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


  // ===============================
  // Rod DevTools micro
  // ===============================
  JSswift.rod = JSswift.rod || {};

  JSswift.rod.inspect = function (r, label = "rod") {
    if (!r || r.type !== "rod") {
      console.warn("[JSswift.rod.inspect] non è un rod:", r);
      return null;
    }

    const bindings = typeof r.bindings === "function" ? r.bindings() : [];
    const info = {
      label,
      value: r.value,
      bindingsCount: bindings.length,
      bindings: bindings.map(b => ({
        key: b.key,
        el: b.el?.nodeType === 3 ? "#text" : b.el?.tagName,
        id: b.el?.id || null,
        className: b.el?.className || null,
        isConnected: b.el?.nodeType === 3 ? !!b.el.parentNode : (b.el?.isConnected ?? null)
      })),
      actionsCount: Array.isArray(r._actions) ? r._actions.length : null,
      disposed: !!r._disposed
    };

    if (JSswift.config.debug) {
      console.groupCollapsed(`[JSswift.rod.inspect] ${label}`);
      console.log(info);
      console.groupEnd();
    } else {
      console.log(info);
    }

    return info;
  };

  JSswift.rod.inspectAll = function () {
    const all = JSswift.rod._all ? Array.from(JSswift.rod._all) : [];
    all.forEach((r, i) => JSswift.rod.inspect(r, `rod#${i + 1}`));
    return all.length;
  };
  // ===============================
  // Store shared helpers
  // ===============================
  JSswift._storeShared = (() => {
    function scopeId(scope) {
      return `${scope.storage}::${scope.prefix}`;
    }

    function createScopeTools(config, knownScopes) {
      function getScope(opts = {}) {
        const scope = {
          storage: opts.storage ?? config.storage,
          prefix: opts.prefix ?? config.prefix
        };
        knownScopes.set(scopeId(scope), scope);
        return scope;
      }

      function getStorage(scope = null) {
        const mode = typeof scope === "string" ? scope : (scope?.storage ?? config.storage);
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
      try { return JSON.parse(str); } catch { return undefined; }
    }

    function safeStringify(value) {
      try { return JSON.stringify(value); } catch { return undefined; }
    }

    function clearScopedMapEntries(scope, ...maps) {
      const prefix = `${scope.storage}::${scope.prefix}::`;
      for (const map of maps) {
        for (const id of Array.from(map.keys())) {
          if (id.startsWith(prefix)) map.delete(id);
        }
      }
    }

    return {
      createScopeTools,
      safeParse,
      safeStringify,
      clearScopedMapEntries
    };
  })();
  // ===============================
  // JSswift.store v1 (persisted reactive state)
  // ===============================
  JSswift.store = (() => {
    const config = {
      prefix: "JSswift:",
      storage: "local", // "local" | "session"
      syncTabs: true,
      writeDelay: 0, // ms (0 = microtask)
    };

    const mem = new Map();          // channelKey -> value (runtime cache)
    const watchers = new Map();     // channelKey -> Set(fn)
    const pendingWrites = new Map();// channelKey -> { key, scope }
    const knownScopes = new Map();  // scopeId -> { storage, prefix }
    let writeQueued = false;
    const {
      createScopeTools,
      safeParse,
      safeStringify,
      clearScopedMapEntries
    } = JSswift._storeShared;
    const {
      getScope,
      getStorage,
      fullKey,
      channelKey
    } = createScopeTools(config, knownScopes);

    function emit(key, value, scope = null) {
      const resolved = scope || getScope();
      const set = watchers.get(channelKey(key, resolved));
      if (!set) return;
      for (const fn of set) {
        try {
          if (JSswift.reactive?.untracked) {
            JSswift.reactive.untracked(() => fn(value));
          } else {
            fn(value);
          }
        } catch (e) { console.error("[store] watcher error:", e); }
      }
    }

    function flushWrites() {
      writeQueued = false;
      for (const [id, pending] of Array.from(pendingWrites.entries())) {
        pendingWrites.delete(id);
        const v = mem.get(id);
        const s = safeStringify(v);
        if (s === undefined) continue;
        const st = getStorage(pending.scope);
        try { st.setItem(fullKey(pending.key, pending.scope), s); }
        catch (e) { console.error("[store] write error:", e); }
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
      if (raw == null) return undefined;
      return safeParse(raw);
    }

    function get(key, fallback, scope = null) {
      const resolved = scope || getScope();
      const id = channelKey(key, resolved);
      if (mem.has(id)) return mem.get(id);
      const v = readFromStorage(key, resolved);
      if (v !== undefined) {
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
      try { getStorage(resolved).removeItem(fullKey(key, resolved)); } catch { }
      emit(key, undefined, resolved);
    }

    function clear(opts = {}) {
      const scope = getScope(opts);
      // rimuove solo chiavi col prefix nel relativo storage
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
      if (typeof fn !== "function") return () => { };
      const resolved = scope || getScope();
      const id = channelKey(key, resolved);
      if (!watchers.has(id)) watchers.set(id, new Set());
      watchers.get(id).add(fn);
      return () => watchers.get(id)?.delete(fn);
    }

    // Signal persistente (core feature)
    function signal(key, initial, opts = {}) {
      const scope = getScope({
        storage: opts.storage,
        prefix: opts.prefix
      });

      const hydrated = get(key, initial, scope);
      const [getSig, setSig, disposeSignal] = JSswift.reactive.signal(hydrated);

      // quando cambia signal -> store, deve restare nello scope corretto
      const stopEffect = JSswift.reactive.effect(() => {
        const v = getSig();
        set(key, v, scope);
      });

      // quando cambia store (cross-tab o set manuale nello stesso scope) -> signal
      const unwatch = watch(key, (v) => {
        // evita loop inutili
        if (getSig() !== v) setSig(v);
      }, scope);

      // cleanup helper
      const dispose = () => {
        try { stopEffect?.(); } catch { }
        try { unwatch?.(); } catch { }
        try { disposeSignal?.(); } catch { }
      };

      return [getSig, setSig, dispose];
    }

    getScope();

    // cross-tab sync
    if (config.syncTabs) {
      window.addEventListener("storage", (e) => {
        if (!e.key || !e.storageArea) return;

        for (const scope of knownScopes.values()) {
          if (getStorage(scope) !== e.storageArea) continue;
          if (!e.key.startsWith(scope.prefix)) continue;

          const key = e.key.slice(scope.prefix.length);
          const v = e.newValue == null ? undefined : safeParse(e.newValue);
          const id = channelKey(key, scope);

          // aggiorna cache + watchers (senza forzare write)
          if (v === undefined) mem.delete(id);
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
      return {
        prefix: config.prefix,
        storage: config.storage,
        syncTabs: config.syncTabs,
        cacheSize: mem.size,
        scopeCount: knownScopes.size,
      };
    }

    return { configure, stats, get, set, remove, clear, watch, signal };
  })();
  // ===============================
  // 1) store.computed (derivato, non persistito)
  // ===============================
  JSswift.store.computed = function (fn) {
    if (typeof fn !== "function") throw new Error("store.computed: fn must be a function");
    return JSswift.reactive.computed(fn);
  };


  // ===============================
  // 2) store.migrate (versioning + migrazioni)
  // ===============================
  // targetVersion: numero intero (es. 3)
  // steps: object { 0: fn, 1: fn, 2: fn } dove la chiave è la versione "from"
  //   step[v] porta da v -> v+1
  JSswift.store.migrate = function (targetVersion, steps, opts = {}) {
    const versionKey = opts.versionKey ?? "__version";
    const from = Number(JSswift.store.get(versionKey, 0) ?? 0);
    const to = Number(targetVersion ?? 0);

    if (!Number.isFinite(to) || to < 0) throw new Error("store.migrate: targetVersion non valido");
    if (from >= to) return { from, to, applied: 0 };

    let applied = 0;

    for (let v = from; v < to; v++) {
      const step = steps?.[v];
      if (typeof step === "function") {
        try {
          step(JSswift.store);
        } catch (e) {
          console.error("[store.migrate] step error at version", v, e);
          // puoi scegliere se interrompere qui: io continuo ma è discutibile.
          // return { from, to, applied, error: e };
        }
      }
      applied++;
      // salva versione raggiunta (più sicuro step-by-step)
      JSswift.store.set(versionKey, v + 1);
    }

    return { from, to, applied };
  };


  // ===============================
  // 3) store.model (form persistenti + rodModel)
  // ===============================
  // elOrList: Element | NodeList | Array<Element> (radio group ecc.)
  // key: string per storage
  // initial: valore iniziale se non presente
  // opts: { storage, prefix, event, parse, format }
  JSswift.store.model = function (elOrList, key, initial, opts = {}) {
    if (typeof key !== "string" || !key) throw new Error("store.model: key deve essere una stringa non vuota");

    // signal persistente
    const [get, set, disposeSignal] = JSswift.store.signal(key, initial, {
      storage: opts.storage,
      prefix: opts.prefix,
    });

    // bridge signal <-> rod
    const r = JSswift.rodFromSignal(get, set);

    // two-way con elementi form (checkbox/radio/select/text/number)
    const unbindModel = JSswift.rodModel(elOrList, r, {
      event: opts.event,
      parse: opts.parse,
      format: opts.format
    });

    // cleanup totale (utile con component dispose)
    return () => {
      try { unbindModel?.(); } catch { }
      try { disposeSignal?.(); } catch { }
      try { r.dispose?.(); } catch { }
    };
  };

  // ===============================
  // store.bind (DX alias super corto)
  // ===============================
  // selectorOrEl: "#id" | Element | NodeList | Array<Element>
  // key: string storage key
  // initial: valore iniziale
  // opts: { storage, prefix, event, parse, format }
  JSswift.store.bind = function (selectorOrEl, key, initial, opts = {}) {
    let target = selectorOrEl;

    // risolve selector string
    if (typeof selectorOrEl === "string") {
      // se è un radio group: input[name=...]
      if (selectorOrEl.includes("[") || selectorOrEl.includes(" ")) {
        target = document.querySelectorAll(selectorOrEl);
      } else {
        target = JSswift.dom.q(selectorOrEl);
      }
    }

    if (!target) {
      if (JSswift.config?.debug) {
        console.warn("[store.bind] target non trovato:", selectorOrEl);
      }
      return () => { };
    }

    return JSswift.store.model(target, key, initial, opts);
  };

  // ===============================
  // store.bindAll (form -> store)
  // ===============================
  JSswift.store.bindAll = function (formEl, schema = {}, opts = {}) {
    if (typeof formEl === "string") formEl = JSswift.dom.q(formEl);
    if (!formEl || !formEl.querySelectorAll) {
      console.warn("[store.bindAll] form non valido:", formEl);
      return () => { };
    }

    const disposers = [];

    for (const [name, initial] of Object.entries(schema)) {
      const els = formEl.querySelectorAll(`[name="${name}"]`);
      if (!els.length) continue;

      const unbind = JSswift.store.model(
        els.length === 1 ? els[0] : els,
        name,
        initial,
        opts
      );
      disposers.push(unbind);
    }

    return () => disposers.forEach(fn => fn());
  };

  // ===============================
  // store.inspect (DevTools)
  // ===============================
  JSswift.store.inspect = function () {
    const info = {
      ...JSswift.store.stats(),
      keys: Array.from(
        (function () {
          const st = JSswift.store.stats().storage === "session"
            ? sessionStorage
            : localStorage;
          const out = [];
          for (let i = 0; i < st.length; i++) {
            const k = st.key(i);
            if (k && k.startsWith(JSswift.store.stats().prefix)) {
              out.push(k.replace(JSswift.store.stats().prefix, ""));
            }
          }
          return out;
        })()
      )
    };

    console.groupCollapsed("[JSswift.store.inspect]");
    console.table(info.keys);
    console.log(info);
    console.groupEnd();

    return info;
  };

  // ===============================
  // store.autoForm (autosave + restore)
  // ===============================
  JSswift.store.autoForm = function (formEl, schema = {}, opts = {}) {
    const unbind = JSswift.store.bindAll(formEl, schema, opts);

    if (JSswift.config?.debug) {
      console.log("[store.autoForm] autosave attivo:", schema);
    }

    return unbind;
  };

  // ===============================
  // useStore (hook-style, component-aware)
  // ===============================
  JSswift.useStore = function (key, initial, ctx, opts = {}) {
    const [get, set, dispose] = JSswift.store.signal(key, initial, opts);

    // se siamo dentro un component, cleanup automatico
    if (ctx && typeof ctx.onDispose === "function" && typeof dispose === "function") {
      ctx.onDispose(dispose);
    }

    return [get, set];
  };
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
  // ===============================
  // Auth shared helpers
  // ===============================
  JSswift._authShared = (() => {
    function createPermissionApi(getUser) {
      const roles = () => getUser()?.roles || [];
      const perms = () => getUser()?.permissions || [];

      return {
        roles,
        perms,
        hasRole: (role) => roles().includes(role),
        can: (permission) => perms().includes(permission),
        canAny: (list) => list.some((item) => roles().includes(item) || perms().includes(item)),
        canAll: (list) => list.every((item) => roles().includes(item) || perms().includes(item))
      };
    }

    function matchesProtectedPath(path, protectedList) {
      return protectedList.some((entry) =>
        typeof entry === "string"
          ? path.startsWith(entry)
          : entry instanceof RegExp
            ? entry.test(path)
            : false
      );
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
          const json = decodeURIComponent(
            atob(b64).split("").map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0")).join("")
          );
          return JSON.parse(json);
        } catch {
          return null;
        }
      }

      function getAuthState() {
        if (typeof auth._getState === "function") {
          const state = auth._getState();
          return state && typeof state === "object"
            ? state
            : { user: auth.user?.() ?? null };
        }
        return { user: auth.user?.() ?? null };
      }

      function status() {
        const state = getAuthState() || {};
        const user = state.user ?? auth.user?.();
        const name = user?.name || user?.email || user?.id || "anon";
        const ok = !!auth.isAuth?.();
        const expiresAt = state.expiresAt || null;
        const left = expiresAt ? expiresAt - safeNow() : null;
        return ok
          ? `AUTH ✅ user=${name}${expiresAt ? ` expiresIn=${Math.round(left / 1000)}s` : ""}`
          : `AUTH ❌ user=${name}`;
      }

      function inspect(label = "auth") {
        const state = getAuthState() || {};
        const user = state.user ?? auth.user?.();
        const roles = user?.roles || [];
        const perms = user?.permissions || [];
        const accessToken = state.accessToken || null;
        const refreshToken = state.refreshToken || null;
        const jwt = accessToken ? decodeJWT(accessToken) : null;
        const expiresAt = state.expiresAt || (jwt?.exp ? jwt.exp * 1000 : null);
        const now = safeNow();
        const expiresInMs = expiresAt ? (expiresAt - now) : null;

        const info = {
          label,
          isAuth: !!auth.isAuth?.(),
          user,
          roles,
          permissions: perms,
          has: {
            role: (role) => !!auth.hasRole?.(role),
            can: (permission) => !!auth.can?.(permission)
          },
          token: {
            hasAccess: !!accessToken,
            hasRefresh: !!refreshToken,
            expiresAt,
            expiresInSec: expiresInMs == null ? null : Math.round(expiresInMs / 1000),
            decodedJWT: jwt
          }
        };

        console.groupCollapsed(`[JSswift.auth.inspect] ${label}`);
        console.log("status:", status());
        console.log(info);
        if (expiresInMs != null) {
          if (expiresInMs <= 0) console.warn("⚠️ Access token scaduto.");
          else if (expiresInMs < 60_000) console.warn("⚠️ Access token in scadenza (<60s).");
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
            } catch { }
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

    return {
      createPermissionApi,
      matchesProtectedPath,
      attachDevTools
    };
  })();
  // ===============================
  // Auth Plugin (store + router guard)
  // Auth Plugin + Roles / Permissions
  // Auth Plugin (async + refresh token)
  // ===============================
  JSswift.plugins.auth = {
    install(app, opts = {}) {
      const {
        createPermissionApi,
        matchesProtectedPath,
        attachDevTools
      } = JSswift._authShared;
      const options = {
        key: opts.key || "auth",
        loginRoute: opts.loginRoute || "/login",
        protected: opts.protected || [],
        autoRedirect: opts.autoRedirect ?? true,

        // async config
        endpoints: opts.endpoints || {
          login: "/api/login",
          refresh: "/api/refresh",
          logout: "/api/logout"
        },

        fetchOptions: opts.fetchOptions || {},
        tokenHeader: opts.tokenHeader || "Authorization",
        tokenPrefix: opts.tokenPrefix || "Bearer ",

        refreshMargin: opts.refreshMargin || 30_000 // ms prima della scadenza
      };

      // ---------- STORE ----------
      const [getAuth, setAuth] = app.store.signal(options.key, null);

      const getUser = () => getAuth()?.user || null;
      const isAuth = () => !!getAuth()?.accessToken;

      // ---------- ROLES / PERMS ----------
      const {
        hasRole,
        can,
        canAny,
        canAll
      } = createPermissionApi(getUser);

      // ---------- INTERNAL STATE ----------
      let refreshing = false;
      let refreshQueue = [];

      // ---------- HELPERS ----------
      function needsRefresh() {
        const a = getAuth();
        if (!a?.expiresAt) return false;
        return Date.now() > (a.expiresAt - options.refreshMargin);
      }

      async function doRefresh() {
        if (refreshing) {
          return new Promise((res, rej) => refreshQueue.push({ res, rej }));
        }

        refreshing = true;

        try {
          const r = await fetch(options.endpoints.refresh, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: getAuth()?.refreshToken })
          });

          if (!r.ok) throw new Error("Refresh failed");

          const data = await r.json();
          setAuth({ ...getAuth(), ...data });

          refreshQueue.forEach(q => q.res(true));
          refreshQueue = [];
          return true;

        } catch (e) {
          refreshQueue.forEach(q => q.rej(e));
          refreshQueue = [];
          setAuth(null);
          if (options.autoRedirect) app.router.navigate(options.loginRoute);
          throw e;

        } finally {
          refreshing = false;
        }
      }

      // ---------- ASYNC AUTH API ----------
      async function loginAsync(credentials) {
        const r = await fetch(options.endpoints.login, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials)
        });

        if (!r.ok) throw new Error("Login failed");
        const data = await r.json();
        setAuth(data);
        return data;
      }

      async function logoutAsync() {
        try {
          await fetch(options.endpoints.logout, { method: "POST" });
        } catch { }
        setAuth(null);
        if (options.autoRedirect) app.router.navigate(options.loginRoute);
      }

      // ---------- AUTH FETCH ----------
      async function authFetch(url, opts = {}) {
        if (needsRefresh()) await doRefresh();

        const a = getAuth();
        const headers = new Headers(opts.headers || {});
        if (a?.accessToken) {
          headers.set(options.tokenHeader, options.tokenPrefix + a.accessToken);
        }

        const r = await fetch(url, { ...options.fetchOptions, ...opts, headers });

        if (r.status === 401 && getAuth()?.refreshToken && !opts._authRetried) {
          await doRefresh();
          return authFetch(url, { ...opts, _authRetried: true });
        }

        return r;
      }

      // ---------- ROUTER GUARD ----------
      app.router.beforeEach((ctx) => {
        const path = ctx.path;
        const protectedMatch = matchesProtectedPath(path, options.protected);

        if (protectedMatch && !isAuth()) {
          return options.loginRoute;
        }
        return true;
      });

      // ---------- PUBLIC API ----------
      app.auth = {
        user: getUser,
        isAuth,
        hasRole,
        can,
        canAny,
        canAll,
        loginAsync,
        logoutAsync,
        fetch: authFetch,
        _getState: getAuth
      };

      // ---------- HOOK ----------
      app.useAuth = function (ctx) {
        if (ctx && typeof ctx.onDispose === "function") {
          // future-proof
        }

        return app.auth;
      };

      attachDevTools(JSswift, app.auth);
    }
  };
  // ===============================
  // HTTP shared helpers
  // ===============================
  JSswift._httpShared = (() => {
    function createReactiveState(JSswift) {
      const reactive = JSswift.reactive;
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
        setLastRequest({
          id,
          url: req.url,
          method: req.method,
          meta: req.meta,
          timeout: req.timeout,
          retry: req.retry,
          startedAt: ts
        });
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
            setLastResponse({
              id,
              status: res.status,
              ok: res.ok,
              headers: res.headers,
              url: res.url,
              receivedAt: ts,
              raw: res
            });
          } else {
            setStatus("idle");
            setLastError(null);
            setLastResponse(null);
          }
          setLastDuration(Math.max(0, Number(durationMs || 0)));
        }
        setLastUpdated(ts);
      }

      const state = {
        inFlight: getInFlight,
        status: getStatus,
        isLoading: JSswift.store?.computed
          ? JSswift.store.computed(() => getInFlight() > 0)
          : () => getInFlight() > 0,
        lastRequest: getLastRequest,
        lastResponse: getLastResponse,
        lastError: getLastError,
        lastDuration: getLastDuration,
        lastUpdated: getLastUpdated,
        reset() {
          setInFlight(0);
          setStatus("idle");
          setLastRequest(null);
          setLastResponse(null);
          setLastError(null);
          setLastDuration(0);
          setLastUpdated(Date.now());
        }
      };

      return { state, markStart, markEnd };
    }

    function joinURL(base, path) {
      if (!base) return path;
      if (/^https?:\/\//i.test(path)) return path;
      const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
      const normalizedPath = path.startsWith("/") ? path : "/" + path;
      return normalizedBase + normalizedPath;
    }

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function isRetryable(err, res) {
      if (err) return true;
      if (!res) return false;
      return res.status === 429 || (res.status >= 500 && res.status <= 599);
    }

    function makeAbort(timeoutMs, externalSignal) {
      if (!timeoutMs && !externalSignal) return { signal: undefined, cancel: () => { } };

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
        if (timeoutId) clearTimeout(timeoutId);
        if (externalSignal) externalSignal.removeEventListener?.("abort", onAbort);
      };

      return { signal, cancel };
    }

    function normalizeRequest(configHTTP, input, init = {}) {
      const url = typeof input === "string" ? joinURL(configHTTP.baseURL, input) : input;
      const method = (init.method || "GET").toUpperCase();
      const headers = new Headers(configHTTP.headers);
      if (init.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));

      return {
        url,
        method,
        headers,
        body: init.body,
        credentials: init.credentials ?? configHTTP.credentials,
        signal: init.signal,
        timeout: init.timeout ?? configHTTP.timeout,
        retry: init.retry ?? configHTTP.retry,
        meta: init.meta || {}
      };
    }

    async function runHooks(set, ...args) {
      let current = args[0];
      for (const fn of set) {
        current = (await fn(current, ...args.slice(1))) ?? current;
      }
      return current;
    }

    function wrapResponse(res, req) {
      return {
        ok: res.ok,
        status: res.status,
        headers: res.headers,
        raw: res,
        req,

        async json() {
          let data = null;
          let error = null;
          try { data = await res.json(); } catch { data = null; }
          if (!res.ok) error = data ?? { status: res.status };
          return { data, error, ok: res.ok, status: res.status };
        },

        async jsonStrict() {
          const { data, error } = await this.json();
          if (error) {
            const e = new Error(`HTTP error ${res.status} ${req?.method || ""} ${req?.url || ""}`.trim());
            e.status = res.status;
            e.data = data;
            e.req = {
              url: req?.url,
              method: req?.method,
              meta: req?.meta
            };
            throw e;
          }
          return { data, ok: true, status: res.status };
        },

        async text() {
          let text = "";
          try { text = await res.text(); } catch { }
          return { text, ok: res.ok, status: res.status };
        },

        async textStrict() {
          const out = await this.text();
          if (!out.ok) {
            const e = new Error("HTTP error " + res.status);
            e.status = res.status;
            e.text = out.text;
            throw e;
          }
          return out;
        }
      };
    }

    function withJSON(request, method, url, body, init = {}) {
      const headers = new Headers(init.headers || {});
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      return request(url, {
        ...init,
        method,
        headers,
        body: body == null ? undefined : JSON.stringify(body)
      });
    }

    return {
      createReactiveState,
      joinURL,
      sleep,
      isRetryable,
      makeAbort,
      normalizeRequest,
      runHooks,
      wrapResponse,
      withJSON
    };
  })();
  // ===============================
  // HTTP (fetch wrapper)
  // ===============================
  const {
    createReactiveState: createHttpReactiveState,
    sleep,
    isRetryable,
    makeAbort,
    normalizeRequest,
    runHooks,
    wrapResponse,
    withJSON
  } = JSswift._httpShared;
  const JSswiftHttpSetting =
    typeof globalThis !== "undefined" && globalThis.JSswift_setting
      ? globalThis.JSswift_setting
      : {};
  const configHTTP = {
    baseURL: JSswiftHttpSetting.http?.baseURL || "",
    timeout: JSswiftHttpSetting.http?.timeout ?? 0, // ms, 0 = no timeout
    retry: JSswiftHttpSetting.http?.retry || { attempts: 0, delay: 250, factor: 2 }, // attempts extra
    headers: JSswiftHttpSetting.http?.headers || {},
    credentials: JSswiftHttpSetting.http?.credentials, // "include" etc (optional)
    debug: JSswiftHttpSetting.debug ?? false
  };
  const httpState = createHttpReactiveState(JSswift);
  const now = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());

  const hooksHTTP = {
    beforeRequest: new Set(),  // (req) => req
    afterResponse: new Set(),  // (res, req) => res
    onError: new Set()         // (err, req) => void
  };

  async function coreFetch(req) {
    // Auth integration: se esiste auth.fetch usa quello
    const f = (JSswift.auth && typeof JSswift.auth.fetch === "function")
      ? JSswift.auth.fetch.bind(JSswift.auth)
      : fetch;
    const init = {
      method: req.method,
      headers: req.headers,
      body: req.body,
      credentials: req.credentials,
      signal: req.signal
    };
    return f(req.url, init);
  }

  async function request(input, init = {}) {
    let req = normalizeRequest(configHTTP, input, init);

    // hooksHTTP pre
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

          JSswift.perf?.inc("httpRequests");
          JSswift.perf?.mark("http:req", { url: req.url, method: req.method });


          const res = await coreFetch(effectiveReq);
          lastRes = res;

          // hooksHTTP post
          const outRes = await runHooks(hooksHTTP.afterResponse, res, effectiveReq);
          const dt = now() - attemptAt;

          JSswift.perf?.tick("http:res", dt, { status: res.status, url: req.url });

          // retryable status?
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

          // hooksHTTP error
          for (const fn of hooksHTTP.onError) {
            try { fn(err, effectiveReq); } catch { }
          }

          // retry?
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

    // fallback (non dovrebbe arrivare qui)
    if (lastErr) throw lastErr;
    return wrapResponse(lastRes, req);
  }

  // shortcuts
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

  JSswift.http.onBefore = function (fn) { hooksHTTP.beforeRequest.add(fn); return () => hooksHTTP.beforeRequest.delete(fn); };
  JSswift.http.onAfter = function (fn) { hooksHTTP.afterResponse.add(fn); return () => hooksHTTP.afterResponse.delete(fn); };
  JSswift.http.onError = function (fn) { hooksHTTP.onError.add(fn); return () => hooksHTTP.onError.delete(fn); };

  // shortcuts per browser global
  window._http = JSswift.http;
  // ===============================
  // useRouter (hook-style)
  // ===============================
  JSswift.useRouter = function (ctx) {
    const router = JSswift.router;

    // nessun cleanup necessario ora, ma pronto per future estensioni
    if (ctx && typeof ctx.onDispose === "function") {
      // placeholder per future listener
    }

    return {
      navigate: router.navigate,
      back: () => history.back(),
      forward: () => history.forward(),
      get current() {
        return router;
      }
    };
  };
  // ===============================
  // useRoute (hook-style, reattivo)
  // ===============================
  JSswift.useRoute = function (ctx) {
    const [getPath, setPath] = JSswift.reactive.signal("");
    const [getParams, setParams] = JSswift.reactive.signal({});
    const [getQuery, setQuery] = JSswift.reactive.signal({});
    const [getHash, setHash] = JSswift.reactive.signal("");

    // handler aggiornamento
    const update = (routeCtx) => {
      setPath(routeCtx.path || "");
      setParams(routeCtx.params || {});
      setQuery(routeCtx.query || {});
      setHash(routeCtx.hash || "");
    };

    // subscribe router
    const unsubscribe = JSswift.router.subscribe(update);

    // cleanup automatico
    if (ctx && typeof ctx.onDispose === "function") {
      ctx.onDispose(unsubscribe);
    }

    return {
      path: getPath,
      params: getParams,
      query: getQuery,
      hash: getHash
    };
  };

  // ===============================
  // Permission-based rendering helpers
  // ===============================
  // ===============================
  // Router shared helpers
  // ===============================
  JSswift._routerShared = (() => {
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
      const regexStr = pattern
        .replace(/([.+*?=^!${}()[\]|/\\])/g, "\\$1")
        .replace(/\\\/:([A-Za-z0-9_]+)/g, (_, key) => {
          keys.push(key);
          return "\\/([^\\/]+)";
        });
      return {
        pattern,
        regex: new RegExp("^" + regexStr + "$"),
        keys
      };
    }

    function parseQuery(search) {
      const query = {};
      const params = new URLSearchParams(search || "");
      params.forEach((value, key) => {
        if (query[key] === undefined) query[key] = value;
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

    function pushHistoryEntry(history, ctx, limit = 50) {
      history.push({
        at: Date.now(),
        path: ctx.path,
        params: ctx.params,
        query: ctx.query,
        hash: ctx.hash
      });
      if (history.length > limit) history.shift();
    }

    return {
      normalizePath,
      stripBase,
      compilePattern,
      parseQuery,
      flattenRoutes,
      matchRoute,
      pushHistoryEntry
    };
  })();
  // ===============================
  // UI meta shared helpers
  // ===============================
  JSswift._uiMetaShared = (() => {
    function resolveDocComponents(_) {
      return {
        hasTabPanel: typeof _.TabPanel === "function",
        Card: typeof _.Card === "function"
          ? _.Card
          : (...children) => _.div({ class: "cms-doc-card" }, ...children),
        Chip: typeof _.Chip === "function"
          ? _.Chip
          : (_props, label) => _.span({ class: "cms-chip cms-chip-fallback" }, label)
      };
    }

    function formatMetaValues(values) {
      if (!values) return "—";
      if (Array.isArray(values)) return values.join(" | ");
      return String(values);
    }

    function renderMetaItem(_, item, Chip) {
      return _.div({ class: "cms-doc-meta" },
        _.div({ class: "cms-doc-meta-head" },
          _.div({ class: "cms-doc-meta-name" }, item.name),
          _.div({ class: "cms-doc-meta-types" },
            ...(item.type
              ? String(item.type).split("|").map((token) => Chip({ color: "secondary", dense: true, outline: true }, token))
              : [_.span("—")])
          )
        ),
        _.div({ class: "cms-doc-meta-grid" },
          _.div({ class: "cms-doc-meta-block" },
            _.div({ class: "cms-doc-meta-label" }, "Default"),
            _.div({ class: "cms-doc-meta-value" }, item.default == null ? "—" : String(item.default))
          ),
          _.div({ class: "cms-doc-meta-block" },
            _.div({ class: "cms-doc-meta-label" }, "Values"),
            _.div({ class: "cms-doc-meta-value" }, formatMetaValues(item.values))
          )
        ),
        _.div({ class: "cms-doc-meta-block" },
          _.div({ class: "cms-doc-meta-label" }, "Description"),
          _.div({ class: "cms-doc-meta-value" }, item.description || "—")
        )
      );
    }

    function renderTabGroupFallback(_, rows) {
      return _.div({ class: "cms-doc-fallback" },
        rows.map((row) => _.div({ class: "cms-doc-fallback-item" },
          _.h4({ class: "cms-doc-fallback-title" }, row.label || row.name),
          row.content
        ))
      );
    }

    function normalizeEventRows(_, events) {
      if (!events) return [];
      if (Array.isArray(events)) {
        return events.map((eventItem) => ({
          name: eventItem.name,
          wrap: true,
          label: eventItem.name,
          content: _.div({ class: "cms-p-md" }, eventItem.description)
        }));
      }
      return Object.entries(events).map(([key, value]) => ({
        name: key,
        wrap: true,
        label: key,
        content: _.div({ class: "cms-p-md" }, value)
      }));
    }

    function normalizeSlotRows(_, slots) {
      if (!slots) return [];
      if (Array.isArray(slots)) {
        return slots.map((slot) => ({
          name: slot.name,
          wrap: true,
          label: slot.type,
          content: slot.description
        }));
      }
      return Object.entries(slots).map(([key, value]) => ({
        name: key,
        wrap: true,
        label: key,
        content: _.div({ class: "cms-doc-meta" },
          _.div({ class: "cms-doc-meta-head" },
            _.div({ class: "cms-doc-meta-name" }, key)
          ),
          _.div({ class: "cms-doc-meta-grid" },
            _.div({ class: "cms-doc-meta-block" },
              _.div({ class: "cms-doc-meta-label" }, "Type"),
              _.div({ class: "cms-doc-meta-value" }, value.type || "—")
            )
          ),
          _.div({ class: "cms-doc-meta-block" },
            _.div({ class: "cms-doc-meta-label" }, "Description"),
            _.div({ class: "cms-doc-meta-value" }, value.description || "—")
          )
        )
      }));
    }

    return {
      resolveDocComponents,
      renderMetaItem,
      renderTabGroupFallback,
      normalizeEventRows,
      normalizeSlotRows
    };
  })();
  JSswift.ui = JSswift.ui || {};
  JSswift.ui.meta = JSswift.ui.meta || {};

  JSswift.ui.slot = function slot(value, opts = {}) {
    const UI = JSswift.ui;
    const {
      as = "node",          // "node" | "text" | "icon"
      wrap = "span",        // "span" | "text" | null
      iconProps = null,     // props extra per UI.Icon
      filter = true         // filtra null/false
    } = opts;

    const makeTextNode = (v) => document.createTextNode(String(v));
    const makeSpan = (v) => _.span(String(v));

    const normalizeOne = (v) => {
      if (v == null || v === false) return null;

      // function: IMPORTANT -> non eseguire qui (serve reattività)
      if (typeof v === "function") return v;

      // array: flatten
      if (Array.isArray(v)) return v.flatMap(normalizeOne).filter(Boolean);

      // DOM Node
      if (v && typeof v === "object" && v.nodeType) return v;

      // primitive
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        const s = String(v);

        if (as === "icon" && UI.Icon) {
          // se vuoi: allow "tabler:plus" o simili
          return UI.Icon(s, { class: "cms-slot-icon", ...(iconProps || {}) });
        }

        if (wrap === "text") return makeTextNode(s);
        if (wrap === "span") return makeSpan(s);
        return s; // lascia stringa nativa (se il tuo _h la gestisce)
      }

      // fallback: stringify
      if (wrap === "text") return makeTextNode(v);
      if (wrap === "span") return makeSpan(v);
      return String(v);
    };

    const out = normalizeOne(value);
    if (!filter) return out;

    // out può essere null, function, node, string, oppure array
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

  // docTable genera una tabella di documentazione
  JSswift.docTable = (name) => {
    if (!JSswift.isDev()) return _.div(); // non fa niente in prod

    const {
      resolveDocComponents,
      renderMetaItem,
      renderTabGroupFallback,
      normalizeEventRows,
      normalizeSlotRows
    } = JSswift._uiMetaShared;
    const meta = JSswift.ui.meta?.[name];
    if (!meta) return _.div({ class: "cms-muted" }, `Meta non trovata: ${name}`);
    const { hasTabPanel, Card, Chip } = resolveDocComponents(_);

    const list = {};
    Object.entries(meta.props || {}).forEach(([k, v]) => {
      const cat = v.category || "general";
      if (!list[cat]) list[cat] = [];
      list[cat].push({
        name: k,
        ...v
      });
    });
    const propsTab = Object.keys(list).map((v) => {
      const rows = list[v].map((p) => {
        return {
          name: p.name,
          wrap: true,
          label: p.name,
          content: renderMetaItem(_, p, Chip)
        };
      });
      return {
        name: v, wrap: true, label: v, content: hasTabPanel ? _.TabPanel({
          orientation: "vertical",
          animated: true,
          radius: "0 0 0 var(--cms-r-default)",
          tabs: rows
        }) : renderTabGroupFallback(_, rows)
      };
    });

    const eventsRows = normalizeEventRows(_, meta.events);
    const slotsRows = normalizeSlotRows(_, meta.slots);
    const tabPanelModel = _.rod(null);
    const taps = [];
    if (slotsRows.length) taps.push({
      name: "Slots",
      wrap: true,
      label: "Slots",
      content: hasTabPanel ? _.TabPanel({
        animated: true,
        radius: "0 0 0 var(--cms-r-default)",
        orientation: "vertical",
        tabs: slotsRows
      }) : renderTabGroupFallback(_, slotsRows)
    });
    if (propsTab.length) taps.push(...propsTab);
    if (eventsRows.length) taps.push({
      name: "Events",
      wrap: true,
      label: "Events",
      content: hasTabPanel ? _.TabPanel({
        animated: true,
        radius: "0 0 0 var(--cms-r-default)",
        orientation: "vertical",
        tabs: eventsRows
      }) : renderTabGroupFallback(_, eventsRows)
    });
    const first = "general";
    taps.sort((a, b) => {
      if (a.name === first) return -1;
      if (b.name === first) return 1;
      return a.name.localeCompare(b.name);
    })
    return Card({ class: "cms-doc-table" },
      _.div({ class: "cms-doc-table-header" },
        _.div({ class: "cms-doc-table-title" }, `_.${name}`),
        meta.signature ? _.div({ class: "cms-doc-table-signature" }, String(meta.signature).replaceAll("UI.", "_.")) : null
      ),
      taps.length
        ? _.h4({ class: "cms-doc-table-section-title" }, propsTab.length ? "Props" : "Documentation")
        : _.p({ class: "cms-muted" }, "Nessuna documentazione strutturata disponibile."),
      taps.length
        ? (hasTabPanel ? _.TabPanel({
          border: true,
          animated: true,
          orientation: "horizontal",
          tabs: taps, model: tabPanelModel
        }) : renderTabGroupFallback(_, taps))
        : null,
      meta.returns ? _.p({ class: "cms-muted", style: { marginTop: "14px" } }, `Returns: ${meta.returns}`) : null
    );
  };

  JSswift.ui.inspect = (name) => console.log(JSswift.ui.meta?.[name] || "meta not found");

  JSswift.ui.can = function (ctx, permOrRole, render, elseRender = null) {
    const auth = JSswift.useAuth ? JSswift.useAuth(ctx) : JSswift.auth;
    if (!auth) return typeof elseRender === "function" ? elseRender() : null;

    const ok =
      typeof permOrRole === "function"
        ? !!permOrRole(auth)
        : (auth.can?.(permOrRole) || auth.hasRole?.(permOrRole));

    if (ok) return typeof render === "function" ? render() : render;
    return typeof elseRender === "function" ? elseRender() : elseRender;
  };

  JSswift.ui.canAny = function (ctx, list, render, elseRender = null) {
    const auth = JSswift.useAuth ? JSswift.useAuth(ctx) : JSswift.auth;
    const ok = !!auth?.canAny?.(list);
    return ok ? (typeof render === "function" ? render() : render)
      : (typeof elseRender === "function" ? elseRender() : elseRender);
  };

  JSswift.ui.canAll = function (ctx, list, render, elseRender = null) {
    const auth = JSswift.useAuth ? JSswift.useAuth(ctx) : JSswift.auth;
    const ok = !!auth?.canAll?.(list);
    return ok ? (typeof render === "function" ? render() : render)
      : (typeof elseRender === "function" ? elseRender() : elseRender);
  };
  // ===============================
  // Can component (hyperscript-friendly)
  // ===============================
  JSswift.Can = function Can(props, ctx) {
    const auth = JSswift.useAuth ? JSswift.useAuth(ctx) : JSswift.auth;

    const pred = () => {
      if (!auth) return false;
      if (props.when && typeof props.when === "function") return !!props.when(auth);
      if (props.perm) return !!auth.can?.(props.perm);
      if (props.role) return !!auth.hasRole?.(props.role);
      if (props.any) return !!auth.canAny?.(props.any);
      if (props.all) return !!auth.canAll?.(props.all);
      return false;
    };

    return pred()
      ? (typeof props.then === "function" ? props.then() : props.then ?? null)
      : (typeof props.else === "function" ? props.else() : props.else ?? null);
  };
  // -- ROUTER --
  JSswift.router = (() => {
    let mode = "history"; // "history" | "hash" | "auto"
    let routes = [];
    let outlet = null;
    let unmountCurrent = null;
    let base = "";
    let beforeHook = null;

    // --- Router DevTools state ---
    let _currentCtx = null;
    let _history = [];
    let _tracing = false;
    const {
      normalizePath,
      stripBase: stripBasePath,
      compilePattern,
      parseQuery,
      matchRoute,
      pushHistoryEntry
    } = JSswift._routerShared;

    const meta = {
      setOutlet: { description: "imposta il contenitore del router" },
      setBase: { description: "imposta il base path del router" },
      add: { description: "per aggiungere la route" },
      notFound: { description: "imposta la view 404" },
      beforeEach: { description: "hook prima di ogni navigazione" },
      start: { description: "avvia il router" },
      navigate: { description: "naviga verso una route" },
      subscribe: { description: "sottoscrive agli aggiornamenti di route" },
      current: { description: "ritorna l'URL corrente" },
      isActive: { description: "verifica se una route è attiva" },
      status: { description: "stringa di stato router" },
      inspect: { description: "stampa info diagnostiche" },
      trace: { description: "abilita/disabilita tracing" },
      history: { description: "ritorna la history interna" },
      setURLOnly: { description: "aggiorna solo l'URL del browser senza render/meta" }
    };

    function setURLOnly(urlLike, { replace = false } = {}) {
      const url = typeof urlLike === "string" ? new URL(urlLike, window.location.origin) : urlLike;
      const fullPath = url.pathname + url.search + url.hash;

      if (mode === "hash" || mode === "auto") {
        if (history.pushState) {
          const h = "#" + fullPath;
          if (replace) history.replaceState({}, "", h);
          else history.pushState({}, "", h);
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

      // auto
      if (mode === "auto") {
        if (window.location.hash.startsWith("#/")) {
          const url = window.location.hash.slice(1);
          return new URL(url, window.location.origin);
        }
      }

      return new URL(window.location.href);
    }

    function updateURL(url, replace = false) {
      if (mode === "hash" || (mode === "auto" && !history.pushState)) {
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

      // aggiorna address bar
      updateURL(url, replace);

      const pathname = stripBase(url.pathname);
      const m = matchRoute(pathname, routes);

      const ctx = {
        path: pathname,
        fullPath,
        params: m ? m.params : {},
        query: parseQuery(url.search),
        hash: url.hash || "",
        navigate, // per navigare dentro view
        outlet
      };

      // beforeEach (redirect/block)
      if (beforeHook) {
        const res = await beforeHook(ctx);
        if (res === false) return;          // blocca
        if (typeof res === "string") {      // redirect
          navigate(res, { replace: true });
          return;
        }
      }

      // unmount view precedente
      if (typeof unmountCurrent === "function") {
        try { unmountCurrent(); } catch (e) { console.error("[router] unmount error:", e); }
        unmountCurrent = null;
      }

      // 404
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

      // mount view matchata
      // mount view matchata (supporta nested)
      const view = m.route.view;
      const parent = m.parent; // se esiste, questa route è child
      let childMounted = null;

      ctx.renderChild = (target) => {
        if (!ctx._child) return null;

        const childOutlet = typeof target === "string" ? ctx.outlet.querySelector(target) : target;
        if (!childOutlet) {
          console.warn("[router] child outlet non trovato:", target);
          return null;
        }

        // monta child (clear true)
        childMounted = JSswift.mount(childOutlet, () => ctx._child.view(ctx._child.ctx), { clear: true });
        return childMounted;
      };

      if (parent) {
        // nested: render layout (parent.view) e prepara child
        const childRoute = m.route;

        // ctx child separato (stessi query/hash, params merged)
        const childCtx = {
          ...ctx,
          params: { ...ctx.params }, // include già i params del child match (per come matcha)
        };

        ctx._child = {
          view: childRoute.view,
          ctx: childCtx
        };

        // mount layout sul root outlet
        unmountCurrent = JSswift.mount(outlet, () => parent.view(ctx), { clear: true });
      } else {
        // non nested
        ctx._child = null;
        unmountCurrent = JSswift.mount(outlet, () => view(ctx), { clear: true });
      }

      notifyRoute(ctx);
      // devtools state update
      _currentCtx = ctx;
      pushHistoryEntry(_history, ctx);

    }

    function navigate(to, opts = {}) {
      const url = new URL(to, window.location.origin);
      render(url, opts);
    }

    function start() {
      // back/forward
      window.addEventListener("popstate", () => {
        render(getCurrentURL(), { replace: true });
      });

      window.addEventListener("hashchange", () => {
        if (mode === "hash" || mode === "auto") {
          render(getCurrentURL(), { replace: true });
        }
      });



      // click interception su <a>
      document.addEventListener("click", (e) => {
        const a = e.target?.closest?.("a");
        if (!a) return;

        // rispetta:
        // - new tab / middle click / ctrl/cmd
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        // rispetta download/target
        if (a.hasAttribute("download")) return;
        if (a.target && a.target !== "_self") return;

        const href = a.getAttribute("href");
        if (!href || href.startsWith("mailto:") || href.startsWith("tel:")) return;

        // esterno
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;

        // hash-only (stessa pagina)
        // se vuoi gestirlo, puoi farlo qui; per ora: lasciamo default se non cambia path
        const current = new URL(window.location.href);
        const samePath = (url.pathname + url.search) === (current.pathname + current.search);
        if (samePath && url.hash) return;

        // prevent e navigate
        e.preventDefault();
        navigate(url.pathname + url.search + url.hash);
      });

      // render iniziale
      render(getCurrentURL(), { replace: true });
    }

    function setOutlet(target) {
      outlet = typeof target === "string" ? JSswift.dom.q(target) : target;
      return outlet;
    }

    function setBase(b) {
      base = b ? normalizePath(b) : "";
      // base dovrebbe essere "" oppure "/qualcosa"
      if (base === "/") base = "";
    }

    function add(path, view, children = null) {
      const compiled = compilePattern(path);
      const record = { path: compiled.pattern, view, _compiled: compiled, children: [] };

      if (Array.isArray(children)) {
        // children: array di [subPath, subView] o [subPath, subView, subChildren]
        for (const c of children) {
          const [subPath, subView, subChildren] = c;
          // child path relativo al parent
          const full = normalizePath(compiled.pattern + "/" + (subPath || "").replace(/^\//, ""));
          record.children.push({
            path: full,
            view: subView,
            _compiled: compilePattern(full),
            children: Array.isArray(subChildren) ? subChildren : []
          });
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

    // --- Router reactive state ---
    let _routeListeners = new Set();

    function notifyRoute(ctx) {
      for (const fn of _routeListeners) {
        try { fn(ctx); } catch (e) { console.error("[router] listener error:", e); }
      }
    }


    // ===============================
    // Router DevTools
    // ===============================
    function routeStatus() {
      if (!_currentCtx) return "ROUTER ⏳ not ready";
      const q = Object.keys(_currentCtx.query || {}).length ? "?" : "";
      return `ROUTER ${_currentCtx.path}${q} ${_currentCtx.hash || ""
        }`;
    }

    function routeInspect(label = "router") {
      if (!_currentCtx) {
        console.warn("[router.inspect] nessuna route attiva");
        return null;
      }

      const info = {
        label,
        mode: typeof mode !== "undefined" ? mode : "unknown",
        base,
        path: _currentCtx.path,
        params: _currentCtx.params,
        query: _currentCtx.query,
        hash: _currentCtx.hash,
        outlet,
        timestamp: new Date().toISOString()
      };

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


    return {
      meta,
      setOutlet, setBase, add, setURLOnly, notFound, beforeEach, start, navigate, isActive, subscribe(fn) {
        _routeListeners.add(fn);
        return () => _routeListeners.delete(fn);
      },
      current() {
        return getCurrentURL ? getCurrentURL() : new URL(window.location.href);
      },
      status: routeStatus,
      inspect: routeInspect,
      trace: routeTrace,
      history: routeHistory
    };
  })();

  if (JSswift.config?.debug) {
    window.$router = JSswift.router;
  }
  // alias per compatibilità
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
    const values = Array.isArray(input)
      ? input
      : typeof input === "string"
        ? input.split(",")
        : [];
    const out = [];
    const seen = new Set();
    for (const item of values) {
      const value = normalizeThemeName(item);
      if (!value || seen.has(value)) continue;
      seen.add(value);
      out.push(value);
    }
    return out;
  }

  function getThemeRoot() {
    if (typeof document !== "undefined" && document.documentElement) {
      return document.documentElement;
    }
    return JSswift.dom?.q ? JSswift.dom.q("html") : null;
  }

  function getThemeStorage() {
    try {
      return typeof globalThis !== "undefined" ? globalThis.localStorage || null : null;
    } catch (_error) {
      return null;
    }
  }

  function getThemeStorageKey() {
    return normalizeThemeName(JSswift.theme?.storageKey) || "jsswift:theme";
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
    } catch (_error) { }
  }

  function resolveThemeList(themes) {
    const html = getThemeRoot();
    const candidates = [
      themes,
      JSswift.theme?.themes,
      JSswift.config?.themes,
      typeof globalThis !== "undefined" ? globalThis.JSswift_setting?.themes : null,
      typeof globalThis !== "undefined" ? globalThis.JSswift_setting?.themeList : null,
      html?.getAttribute?.("data-themes"),
    ];

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

  JSswift.setTheme = function (theme, opts = {}) {
    const value = normalizeThemeName(theme);
    const html = getThemeRoot();
    if (html) {
      if (value == null) html.removeAttribute("data-theme");
      else html.setAttribute("data-theme", value);
    }
    if (opts.persist !== false) writeSavedTheme(value);
    return html;
  };

  JSswift.getTheme = function (opts = {}) {
    const html = getThemeRoot();
    const current = normalizeThemeName(html?.getAttribute?.("data-theme"));
    if (current) return current;

    if (opts.storage === false) return null;

    const saved = readSavedTheme();
    if (saved && html && opts.sync !== false) {
      html.setAttribute("data-theme", saved);
    }
    return saved;
  };

  JSswift.toggleTheme = function (themes, opts = {}) {
    const list = resolveThemeList(themes);
    const activeList = list.length
      ? list
      : normalizeThemeList([JSswift.getTheme({ sync: false }), "light", "dark"]);
    const current = JSswift.getTheme({ sync: false });
    const fallback = normalizeThemeName(opts.fallback) || activeList[0] || "light";
    const currentIndex = current ? activeList.indexOf(current) : -1;
    const nextTheme = currentIndex >= 0
      ? activeList[(currentIndex + 1) % activeList.length]
      : fallback;

    JSswift.theme.themes = activeList.slice();
    JSswift.setTheme(nextTheme, opts);
    return nextTheme;
  };

  const bootTheme = readSavedTheme();
  if (bootTheme) {
    JSswift.setTheme(bootTheme, { persist: false });
  }
})();
