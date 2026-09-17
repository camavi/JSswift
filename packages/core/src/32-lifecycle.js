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
