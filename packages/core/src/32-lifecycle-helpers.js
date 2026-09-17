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
