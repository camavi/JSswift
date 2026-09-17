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
