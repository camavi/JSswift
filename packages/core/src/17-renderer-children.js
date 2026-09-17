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
