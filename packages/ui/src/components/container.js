

  UI.Container = (...args) => {
    const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const props = { ...rawProps };
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(rawProps, key);
    const containerWidthMap = {
      xxs: "360px",
      xs: "480px",
      sm: "640px",
      md: "820px",
      lg: "1100px",
      xl: "1280px",
      xxl: "1440px",
      narrow: "760px",
      prose: "760px",
      wide: "1360px"
    };
    const resolveWidthValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number") return `${value}px`;
      const key = String(value).trim().toLowerCase();
      if (!key) return "";
      if (key === "full" || key === "fluid") return "100%";
      return containerWidthMap[key] || String(value);
    };
    const resolveSpaceValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number") return `${value}px`;
      if (typeof value === "string" && JSswift.uiSizes?.includes(value)) return `var(--jss-s-${value})`;
      return String(value);
    };
    const resolveColsValue = (value) => {
      if (value == null || value === false || value === "") return "";
      if (typeof value === "number" && Number.isFinite(value)) return `repeat(${Math.max(1, Math.floor(value))}, minmax(0, 1fr))`;
      const raw = String(value).trim();
      if (!raw) return "";
      if (/^\d+$/.test(raw)) return `repeat(${Math.max(1, Number(raw))}, minmax(0, 1fr))`;
      return raw;
    };
    const resolveWrapValue = (value) => {
      if (value == null || value === "") return "";
      if (value === true) return "wrap";
      if (value === false) return "nowrap";
      return String(value);
    };
    const ctx = { props: rawProps };
    const appendResolvedValue = (host, value) => {
      if (value == null || value === false) return;
      if (Array.isArray(value)) {
        value.forEach((item) => appendResolvedValue(host, item));
        return;
      }
      if (value?.nodeType) {
        host.appendChild(value);
        return;
      }
      host.appendChild(document.createTextNode(String(value)));
    };
    const renderPropNodes = (name, fallback) => {
      const slot = JSswift.ui.getSlot(slots, name);
      if (slot !== null && slot !== undefined) {
        return renderSlotToArray(slots, name, ctx, null);
      }
      if (typeof fallback === "function") {
        const host = _.div({ class: `jss-container-slot-${name}` });
        JSswift.reactive.effect(() => {
          const normalized = flattenSlotValue(JSswift.ui.slot(fallback(ctx)));
          host.replaceChildren();
          if (Array.isArray(normalized)) normalized.forEach((item) => appendResolvedValue(host, item));
          else appendResolvedValue(host, normalized);
        }, `UI.Container:${name}`);
        return [host];
      }
      return renderSlotToArray(slots, name, ctx, fallback);
    };
    const contentFallback = hasOwn("content") ? rawProps.content : (children?.length ? children : null);
    const beforeNodes = renderPropNodes("before", rawProps.before ?? rawProps.top);
    const headerNodes = renderPropNodes("header", rawProps.header);
    const startNodes = [
      ...renderPropNodes("left", rawProps.left),
      ...renderPropNodes("start", rawProps.start)
    ];
    const bodyNodes = renderPropNodes("body", hasOwn("body") ? rawProps.body : null);
    const contentNodes = (() => {
      const explicit = renderPropNodes("content", hasOwn("content") ? rawProps.content : null);
      return explicit.length ? explicit : renderPropNodes("default", contentFallback);
    })();
    const endNodes = [
      ...renderPropNodes("right", rawProps.right),
      ...renderPropNodes("end", rawProps.end)
    ];
    const footerNodes = renderPropNodes("footer", rawProps.footer);
    const afterNodes = renderPropNodes("after", rawProps.after ?? rawProps.bottom);
    const hasShellSections = beforeNodes.length || headerNodes.length || startNodes.length || endNodes.length || footerNodes.length || afterNodes.length
      || JSswift.ui.getSlot(slots, "before") != null
      || JSswift.ui.getSlot(slots, "header") != null
      || JSswift.ui.getSlot(slots, "left") != null
      || JSswift.ui.getSlot(slots, "start") != null
      || JSswift.ui.getSlot(slots, "right") != null
      || JSswift.ui.getSlot(slots, "end") != null
      || JSswift.ui.getSlot(slots, "footer") != null
      || JSswift.ui.getSlot(slots, "after") != null;
    const hasStructuredLayout = !!hasShellSections || (bodyNodes.length > 0 && (JSswift.ui.getSlot(slots, "body") != null || hasShellSections));
    const resolveLayoutMode = () => {
      const explicit = String(uiUnwrap(rawProps.layout ?? rawProps.display) || "").trim().toLowerCase();
      if (["flex", "grid", "stack"].includes(explicit)) return explicit;
      if (["inline", "inline-flex", "inlineflex"].includes(explicit)) return "inline";
      if (!!uiUnwrap(rawProps.inline)) return "inline";
      if (!!uiUnwrap(rawProps.grid) || uiUnwrap(rawProps.cols) != null) return "grid";
      if (explicit === "block") return "block";
      if (uiUnwrap(rawProps.direction) != null || uiUnwrap(rawProps.wrap) != null || uiUnwrap(rawProps.align) != null || uiUnwrap(rawProps.justify) != null || uiUnwrap(rawProps.gap) != null) return "flex";
      if (startNodes.length || endNodes.length) return "flex";
      return "block";
    };
    const layoutClass = uiComputed([
      rawProps.layout, rawProps.display, rawProps.inline, rawProps.grid, rawProps.cols,
      rawProps.direction, rawProps.wrap, rawProps.align, rawProps.justify, rawProps.gap
    ], () => {
      const mode = resolveLayoutMode();
      return mode === "block" ? "" : `is-${mode}`;
    });
    const rootStyle = { ...(props.style || {}) };
    const assignStyle = (key, value) => {
      if (value != null) rootStyle[key] = value;
    };
    assignStyle("maxWidth", uiComputed([rawProps.maxWidth, rawProps.fluid], () => {
      if (uiUnwrap(rawProps.fluid)) return "none";
      const value = resolveWidthValue(uiUnwrap(rawProps.maxWidth));
      return value || "";
    }));
    assignStyle("width", uiStyleValue(rawProps.width, resolveWidthValue));
    assignStyle("minWidth", uiStyleValue(rawProps.minWidth, resolveWidthValue));
    assignStyle("--jss-container-padding", uiStyleValue(rawProps.padding, resolveSpaceValue));
    assignStyle("--jss-container-padding-x", uiStyleValue(rawProps.paddingX ?? rawProps.gutter, resolveSpaceValue));
    assignStyle("--jss-container-padding-y", uiStyleValue(rawProps.paddingY, resolveSpaceValue));
    assignStyle("--jss-container-gap", uiStyleValue(rawProps.gap, resolveSpaceValue));
    assignStyle("--jss-container-section-gap", uiStyleValue(rawProps.sectionGap ?? rawProps.gap, resolveSpaceValue));
    assignStyle("--jss-container-cols", uiStyleValue(rawProps.cols, resolveColsValue));
    assignStyle("--jss-container-align", uiStyleValue(rawProps.align, (value) => String(value)));
    assignStyle("--jss-container-justify", uiStyleValue(rawProps.justify, (value) => String(value)));
    assignStyle("--jss-container-direction", uiStyleValue(rawProps.direction, (value) => String(value)));
    assignStyle("--jss-container-wrap", uiStyleValue(rawProps.wrap, resolveWrapValue));

    const p = JSswift.omit(props, [
      "after", "afterClass", "align", "as", "before", "beforeClass", "body", "bodyClass",
      "bottom", "cols", "content", "contentClass", "direction", "display", "end",
      "endClass", "fluid", "footer", "footerClass", "gap", "grid", "gutter", "header",
      "headerClass", "inline", "justify", "layout", "left", "mainClass", "maxWidth",
      "minWidth", "padding", "paddingX", "paddingY", "right", "sectionGap", "slots",
      "start", "startClass", "tag", "top", "width", "wrap"
    ]);
    p.class = uiClass([
      "jss-container",
      uiWhen(rawProps.fluid, "is-fluid"),
      uiWhen(hasStructuredLayout, "has-structure"),
      hasStructuredLayout ? "" : layoutClass,
      props.class
    ]);
    p.style = rootStyle;
    JSswift.uiApplyResponsiveProps(p, rawProps, JSswift.uiResponsiveStyleRules);

    const createSection = (name, nodes, extraClass) => {
      if (!nodes.length) return null;
      return _.div({ class: uiClass(["jss-container-section", `jss-container-${name}`, extraClass]) }, ...nodes);
    };

    const contentRoot = bodyNodes.length
      ? _.div(
        { class: uiClass(["jss-container-body", hasStructuredLayout ? layoutClass : "", rawProps.bodyClass]) },
        createSection("start", startNodes, rawProps.startClass),
        ...(startNodes.length || endNodes.length
          ? [_.div({ class: uiClass(["jss-container-main", rawProps.mainClass, rawProps.contentClass]) }, ...bodyNodes)]
          : bodyNodes),
        createSection("end", endNodes, rawProps.endClass)
      )
      : (
        (startNodes.length || contentNodes.length || endNodes.length)
          ? _.div(
            { class: uiClass(["jss-container-body", hasStructuredLayout ? layoutClass : "", rawProps.bodyClass]) },
            createSection("start", startNodes, rawProps.startClass),
            contentNodes.length ? _.div({ class: uiClass(["jss-container-main", rawProps.mainClass, rawProps.contentClass]) }, ...contentNodes) : null,
            createSection("end", endNodes, rawProps.endClass)
          )
          : null
      );

    const creator = (() => {
      const tag = String(uiUnwrap(rawProps.tag ?? rawProps.as) || "div").toLowerCase();
      return typeof _[tag] === "function" ? _[tag] : _.div;
    })();

    const el = hasStructuredLayout
      ? creator(
        p,
        createSection("before", beforeNodes, rawProps.beforeClass),
        createSection("header", headerNodes, rawProps.headerClass),
        contentRoot,
        createSection("footer", footerNodes, rawProps.footerClass),
        createSection("after", afterNodes, rawProps.afterClass)
      )
      : creator(p, ...(bodyNodes.length ? bodyNodes : contentNodes));
    setPropertyProps(el, rawProps);
    return el;
  };
