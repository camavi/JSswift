  UI.Layout = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const hasOwn = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
    const getViewportWidth = () => typeof window === "undefined" ? 1024 : window.innerWidth;
    const getResponsiveProps = () => {
      const width = getViewportWidth();
      const mobileProps = JSswift.uiResponsivePropsFor(props, uiResponsiveDevice("mobile")) || {};
      const tabletProps = width >= 768 ? (JSswift.uiResponsivePropsFor(props, uiResponsiveDevice("tablet")) || {}) : {};
      const pcProps = width >= 1024 ? (JSswift.uiResponsivePropsFor(props, uiResponsiveDevice("pc")) || {}) : {};
      return { ...mobileProps, ...tabletProps, ...pcProps };
    };
    const resolveProp = (...keys) => {
      for (const key of keys) {
        if (hasOwn(props, key)) return props[key];
      }
      return undefined;
    };
    const resolveLayoutProp = (...keys) => {
      const responsiveProps = getResponsiveProps();
      for (const key of keys) {
        if (hasOwn(responsiveProps, key)) return responsiveProps[key];
      }
      return resolveProp(...keys);
    };
    const getLayoutDisposition = () => normalizeLayoutDisposition(
      resolveLayoutProp("disposition", "layoutDisposition", "layout")
    );
    const getLayoutMode = () => {
      const raw = uiUnwrap(resolveLayoutProp("mode", "layoutMode"));
      if (raw == null || raw === false || raw === "") return "";
      const mode = String(raw).trim().toLowerCase();
      return mode === "global" || mode === "local" ? mode : "";
    };
    const toLayoutCssSize = (value, fallback = null) => {
      if (value == null || value === false || value === "") return fallback;
      return typeof value === "number" ? `${value}px` : String(value);
    };
    const toLayoutPx = (value, fallback = null) => {
      if (value == null || value === false || value === "") return fallback;
      if (typeof value === "number" && Number.isFinite(value)) return value;
      const parsed = Number.parseFloat(String(value));
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const toLayoutGridTemplateAreas = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return null;
      if (Array.isArray(raw)) {
        return raw.map((row) => `"${Array.isArray(row) ? row.join(" ") : String(row)}"`).join(" ");
      }
      return String(raw);
    };
    const clampLayoutWidth = (value, min = null, max = null) => {
      let next = Number.isFinite(value) ? value : 0;
      if (Number.isFinite(min)) next = Math.max(min, next);
      if (Number.isFinite(max)) next = Math.min(max, next);
      return next;
    };

    const headerSource = resolveProp("header", "headerContent");
    const drawerSource = resolveProp("aside", "drawer");
    const navSource = resolveProp("nav", "asideRight", "drawerRight");
    const pageSource = resolveProp("page", "main", "content", "body");
    const footerSource = resolveProp("footer", "footerContent");

    const getDrawerEnabledValue = () => uiUnwrap(resolveLayoutProp("drawerEnabled", "asideEnabled"));
    const getNavEnabledValue = () => uiUnwrap(resolveLayoutProp("navEnabled", "asideRightEnabled", "rightAsideEnabled"));
    const getDrawerRequested = () => getDrawerEnabledValue() !== false;
    const getNavRequested = () => getNavEnabledValue() === true || uiUnwrap(resolveLayoutProp("noNav")) === false;
    const getDrawerDisabled = () => uiUnwrap(resolveLayoutProp("noDrawer")) === true || getDrawerEnabledValue() === false || drawerSource === false;
    const getNavDisabled = () => uiUnwrap(resolveLayoutProp("noNav")) === true || getNavEnabledValue() === false || navSource === false;
    const getDrawerFloating = () => uiUnwrap(resolveLayoutProp("drawerFloating")) === true;
    const getNavFloating = () => uiUnwrap(resolveLayoutProp("navFloating")) === true;
    const getDrawerResizable = () => uiUnwrap(resolveLayoutProp("drawerResizable")) === true;
    const getNavResizable = () => uiUnwrap(resolveLayoutProp("navResizable")) === true;
    const getDrawerMinWidth = () => toLayoutPx(uiUnwrap(resolveLayoutProp("drawerMinWidth")), 180);
    const getDrawerMaxWidth = () => toLayoutPx(uiUnwrap(resolveLayoutProp("drawerMaxWidth")), null);
    const getNavMinWidth = () => toLayoutPx(uiUnwrap(resolveLayoutProp("navMinWidth")), 180);
    const getNavMaxWidth = () => toLayoutPx(uiUnwrap(resolveLayoutProp("navMaxWidth")), null);
    const initialDrawerWidthPx = toLayoutPx(uiUnwrap(resolveLayoutProp("drawerWidth")), 280);
    const initialNavWidthPx = toLayoutPx(uiUnwrap(resolveLayoutProp("navWidth")) ?? uiUnwrap(resolveLayoutProp("asideRightWidth")), 280);
    const [getDrawerWidthPx, setDrawerWidthPx] = JSswift.reactive.signal(
      clampLayoutWidth(initialDrawerWidthPx, getDrawerMinWidth(), getDrawerMaxWidth())
    );
    const [getNavWidthPx, setNavWidthPx] = JSswift.reactive.signal(
      clampLayoutWidth(initialNavWidthPx, getNavMinWidth(), getNavMaxWidth())
    );

    const controlledDrawer = resolveModel(props.drawerOpen, "UI.Layout:drawerOpen");
    const initialOpen = controlledDrawer
      ? !!controlledDrawer.get()
      : (typeof props.drawerOpen === "boolean" ? !!props.drawerOpen : true);
    const [getOpen, syncOpen] = JSswift.reactive.signal(initialOpen);
    const setOpen = (value) => {
      const next = !!value;
      if (getOpen() !== next) syncOpen(next);
      controlledDrawer?.set(next);
    };
    const stopDrawerWatch = controlledDrawer?.watch?.(() => {
      const next = !!controlledDrawer.get();
      if (getOpen() !== next) syncOpen(next);
    });

    const controlledNav = resolveModel(props.navOpen, "UI.Layout:navOpen");
    const initialNavOpen = controlledNav
      ? !!controlledNav.get()
      : (typeof props.navOpen === "boolean" ? !!props.navOpen : true);
    const [getNavOpen, syncNavOpen] = JSswift.reactive.signal(initialNavOpen);
    const setNavOpen = (value) => {
      const next = !!value;
      if (getNavOpen() !== next) syncNavOpen(next);
      controlledNav?.set(next);
    };
    const stopNavWatch = controlledNav?.watch?.(() => {
      const next = !!controlledNav.get();
      if (getNavOpen() !== next) syncNavOpen(next);
    });

    const getResponsiveBreakpoint = () => {
      const layoutBreakpoint = Number(uiUnwrap(resolveLayoutProp("layoutBreakpoint")) ?? 0);
      const drawerBreakpoint = Number(uiUnwrap(resolveLayoutProp("drawerBreakpoint")) ?? (layoutBreakpoint || 1024));
      const navBreakpoint = Number(uiUnwrap(resolveLayoutProp("navBreakpoint")) ?? (layoutBreakpoint || drawerBreakpoint));
      return Math.max(drawerBreakpoint, navBreakpoint, 0);
    };
    const getResponsiveDeviceKey = () => {
      const width = getViewportWidth();
      return width >= 1024 ? "pc" : (width >= 768 ? "tablet" : "mobile");
    };
    const [getMobile, setMobile] = JSswift.reactive.signal(false);
    const [getResponsiveKey, setResponsiveKey] = JSswift.reactive.signal(getResponsiveDeviceKey());
    const checkMobile = () => {
      if (typeof window === "undefined") return;
      setResponsiveKey(getResponsiveDeviceKey());
      setMobile(window.innerWidth < getResponsiveBreakpoint());
    };
    if (typeof window !== "undefined") {
      checkMobile();
      window.addEventListener("resize", checkMobile);
    }

    const createCtx = () => ({
      props,
      openAside: () => setOpen(true),
      closeAside: () => setOpen(false),
      toggleAside: () => setOpen(!getOpen()),
      openNav: () => setNavOpen(true),
      closeNav: () => setNavOpen(false),
      toggleNav: () => setNavOpen(!getNavOpen()),
      isDrawerOpen: () => !!getOpen(),
      isNavOpen: () => !!getNavOpen(),
      isMobile: () => !!getMobile(),
      isDrawerFloating: () => getDrawerFloating(),
      isNavFloating: () => getNavFloating()
    });
    const renderAliasSlot = (names, fallback) => {
      const ctx = createCtx();
      for (const name of names) {
        if (!hasOwn(slots, name)) continue;
        const raw = typeof slots[name] === "function" ? slots[name](ctx) : slots[name];
        return renderSlotToArray(null, "default", ctx, raw);
      }
      const raw = typeof fallback === "function" ? fallback(ctx) : fallback;
      return renderSlotToArray(null, "default", ctx, raw);
    };

    const pageFallback = pageSource !== undefined ? pageSource : children;

    const cls = uiClass([
      "jss-app",
      "jss-layout",
      JSswift.uiResponsiveClasses({ mobile: props }, uiResponsiveLayoutRules),
      JSswift.uiResponsiveClasses(props, uiResponsiveLayoutRules),
      props.class
    ]);
    const p = JSswift.omit(props, [
      "header", "headerContent",
      "aside", "drawer",
      "nav", "asideRight", "drawerRight",
      "page", "main", "content", "body",
      "footer", "footerContent",
      "noDrawer", "drawerEnabled", "asideEnabled",
      "noNav", "navEnabled", "asideRightEnabled", "rightAsideEnabled",
      "drawerOpen", "navOpen",
      "layoutBreakpoint", "drawerBreakpoint", "navBreakpoint",
      "drawerWidth", "navWidth", "asideRightWidth",
      "drawerResizable", "drawerMinWidth", "drawerMaxWidth",
      "navResizable", "navMinWidth", "navMaxWidth",
      "drawerPeek", "navPeek", "asideRightPeek",
      "drawerFloating", "navFloating",
      "overlayClose", "escClose",
      "stickyHeader", "stickyFooter", "stickyAside", "stickyNav",
      "tagPage", "mode", "layoutMode", "disposition", "layoutDisposition", "layout",
      "shellClass", "headerClass", "asideClass", "navClass", "pageClass", "footerClass", "overlayClass",
      "gap", "headerOffset", "minHeight", "areas", "gridTemplateAreas", "templateAreas",
      "slots"
    ]);
    p.class = cls;
    p.style = { ...(props.style || {}) };
    JSswift.uiApplyResponsiveProps(p, props, JSswift.uiResponsiveStyleRules);

    const root = _.div(p);
    if (stopDrawerWatch) JSswift._registerCleanup(root, stopDrawerWatch);
    if (stopNavWatch) JSswift._registerCleanup(root, stopNavWatch);
    const tagPage = uiUnwrap(resolveLayoutProp("tagPage")) === true;
    const tags = tagPage
      ? { header: "header", aside: "aside", nav: "nav", page: "main", footer: "footer" }
      : { header: "div", aside: "div", nav: "div", page: "div", footer: "div" };

    const shell = _.div({ class: uiClass(["jss-layout-shell-grid", props.shellClass]) });
    const headerWrap = _[tags.header]({
      class: uiClass(["jss-layout-section", "jss-layout-header", "header", uiWhen(props.stickyHeader, "sticky"), props.headerClass])
    });
    const asideWrap = _[tags.aside]({
      class: uiClass(["jss-layout-section", "jss-layout-aside", "aside", uiWhen(props.stickyAside !== false, "sticky"), props.asideClass]),
      role: "navigation",
      "aria-hidden": "true"
    });
    const asideContentWrap = _.div({ class: "jss-layout-panel-body jss-layout-aside-body" });
    const asideResizeHandle = _.div({
      class: "jss-layout-resize-handle jss-layout-resize-handle-drawer",
      "aria-hidden": "true"
    });
    asideWrap.appendChild(asideContentWrap);
    asideWrap.appendChild(asideResizeHandle);
    const navWrap = _[tags.nav]({
      class: uiClass(["jss-layout-section", "jss-layout-nav", "nav", uiWhen(props.stickyNav, "sticky"), props.navClass]),
      role: tags.nav === "nav" ? null : "complementary",
      "aria-hidden": "true"
    });
    const navContentWrap = _.div({ class: "jss-layout-panel-body jss-layout-nav-body" });
    const navResizeHandle = _.div({
      class: "jss-layout-resize-handle jss-layout-resize-handle-nav",
      "aria-hidden": "true"
    });
    navWrap.appendChild(navContentWrap);
    navWrap.appendChild(navResizeHandle);
    const mainWrap = _[tags.page]({
      class: uiClass(["jss-layout-section", "jss-layout-main", "main", props.pageClass]),
      role: tags.page === "main" ? null : "main"
    });
    const footerWrap = _[tags.footer]({
      class: uiClass(["jss-layout-section", "jss-layout-footer", "footer", uiWhen(props.stickyFooter, "sticky"), props.footerClass])
    });

    shell.appendChild(headerWrap);
    shell.appendChild(asideWrap);
    shell.appendChild(mainWrap);
    shell.appendChild(navWrap);
    shell.appendChild(footerWrap);
    root.appendChild(shell);

    const overlay = _.div({
      class: uiClass(["jss-aside-overlay", props.overlayClass]),
      onClick: () => {
        if (uiUnwrap(resolveLayoutProp("overlayClose")) === false) return;
        if (getOpen()) setOpen(false);
        if (getNavOpen()) setNavOpen(false);
      }
    });
    root.appendChild(overlay);

    let hasHeaderContent = false;
    let hasDrawerContent = false;
    let hasNavContent = false;
    let hasPageContent = false;
    let hasFooterContent = false;
    let headerObserver = null;
    let disposeResizeSession = null;

    const disposeTree = (node) => {
      if (!node || typeof node !== "object") return;
      if (typeof node._dispose === "function") node._dispose();
      if (!node.childNodes || !node.childNodes.length) return;
      Array.from(node.childNodes).forEach(disposeTree);
    };

    const clearWrap = (wrap) => {
      if (!wrap) return;
      Array.from(wrap.childNodes).forEach((node) => {
        disposeTree(node);
        node.remove();
      });
    };

    const normalizeUpdateNodes = (value) => {
      const ctx = createCtx();
      const raw = typeof value === "function" ? value(ctx) : value;
      return renderSlotToArray(null, "default", ctx, raw);
    };

    const syncHeaderHeight = () => {
      const height = hasHeaderContent ? headerWrap.getBoundingClientRect().height : 0;
      root.style.setProperty("--layout-header-height", `${height}px`);
    };

    const fillWrap = (wrap, nodes) => {
      clearWrap(wrap);
      nodes.forEach((node) => wrap.appendChild(node));
      return nodes.length > 0;
    };
    const syncLayoutVars = () => {
      root.style.setProperty("--jss-layout-drawer-width", toLayoutCssSize(uiUnwrap(resolveLayoutProp("drawerWidth")) ?? 280, "280px"));
      root.style.setProperty("--jss-layout-nav-width", toLayoutCssSize(uiUnwrap(resolveLayoutProp("navWidth")) ?? uiUnwrap(resolveLayoutProp("asideRightWidth")) ?? 280, "280px"));
      root.style.setProperty("--jss-layout-drawer-peek", toLayoutCssSize(uiUnwrap(resolveLayoutProp("drawerPeek")) ?? 20, "20px"));
      root.style.setProperty("--jss-layout-nav-peek", toLayoutCssSize(uiUnwrap(resolveLayoutProp("navPeek")) ?? uiUnwrap(resolveLayoutProp("asideRightPeek")) ?? 20, "20px"));
      const layoutGap = toLayoutCssSize(uiUnwrap(resolveLayoutProp("gap")), null);
      if (layoutGap != null) root.style.setProperty("--jss-layout-gap", layoutGap);
      else root.style.removeProperty("--jss-layout-gap");
      const headerOffset = toLayoutCssSize(uiUnwrap(resolveLayoutProp("headerOffset")), null);
      if (headerOffset != null) root.style.setProperty("--layout-header-height", headerOffset);
      const minHeight = toLayoutCssSize(uiUnwrap(resolveLayoutProp("minHeight")), null);
      if (minHeight != null) root.style.setProperty("--jss-layout-min-height", minHeight);
      else root.style.removeProperty("--jss-layout-min-height");
    };
    const syncPanelWidths = () => {
      if (getDrawerResizable()) {
        const nextDrawerWidth = clampLayoutWidth(getDrawerWidthPx(), getDrawerMinWidth(), getDrawerMaxWidth());
        if (nextDrawerWidth !== getDrawerWidthPx()) setDrawerWidthPx(nextDrawerWidth);
        root.style.setProperty("--jss-layout-drawer-width", `${nextDrawerWidth}px`);
      }
      if (getNavResizable()) {
        const nextNavWidth = clampLayoutWidth(getNavWidthPx(), getNavMinWidth(), getNavMaxWidth());
        if (nextNavWidth !== getNavWidthPx()) setNavWidthPx(nextNavWidth);
        root.style.setProperty("--jss-layout-nav-width", `${nextNavWidth}px`);
      }
    };
    const startResize = (side, event) => {
      if (event.button !== 0) return;
      const panel = side === "drawer" ? asideWrap : navWrap;
      if (panel.hidden) return;
      const getCurrentWidth = side === "drawer" ? getDrawerWidthPx : getNavWidthPx;
      const setCurrentWidth = side === "drawer" ? setDrawerWidthPx : setNavWidthPx;
      const getMinWidth = side === "drawer" ? getDrawerMinWidth : getNavMinWidth;
      const getMaxWidth = side === "drawer" ? getDrawerMaxWidth : getNavMaxWidth;
      const rect = panel.getBoundingClientRect();
      const initialWidth = rect.width || getCurrentWidth();
      const onMove = (moveEvent) => {
        const nextWidth = side === "drawer"
          ? (moveEvent.clientX - rect.left)
          : (rect.right - moveEvent.clientX);
        setCurrentWidth(clampLayoutWidth(nextWidth || initialWidth, getMinWidth(), getMaxWidth()));
        syncPanelWidths();
        syncLayoutState();
      };
      const onUp = () => {
        root.classList.remove("is-resizing-layout");
        document.removeEventListener("pointermove", onMove, true);
        document.removeEventListener("pointerup", onUp, true);
        disposeResizeSession = null;
      };
      root.classList.add("is-resizing-layout");
      document.addEventListener("pointermove", onMove, true);
      document.addEventListener("pointerup", onUp, true);
      disposeResizeSession = onUp;
      event.preventDefault();
    };
    const onDrawerResizePointerDown = (event) => startResize("drawer", event);
    const onNavResizePointerDown = (event) => startResize("nav", event);
    asideResizeHandle.addEventListener("pointerdown", onDrawerResizePointerDown);
    navResizeHandle.addEventListener("pointerdown", onNavResizePointerDown);

    const syncLayoutState = () => {
      const mobile = !!getMobile();
      const asideOpen = !!getOpen();
      const navOpen = !!getNavOpen();
      const drawerEnabled = !getDrawerDisabled() && getDrawerRequested() && hasDrawerContent;
      const navEnabled = !getNavDisabled() && getNavRequested() && hasNavContent;
      const drawerFloating = drawerEnabled && (mobile || getDrawerFloating());
      const navFloating = navEnabled && (mobile || getNavFloating());
      const drawerVisible = drawerEnabled && asideOpen;
      const navVisible = navEnabled && navOpen;
      const inlineDrawerVisible = drawerVisible && !drawerFloating;
      const inlineNavVisible = navVisible && !navFloating;
      const inlineDrawerResizable = inlineDrawerVisible && getDrawerResizable();
      const inlineNavResizable = inlineNavVisible && getNavResizable();
      const overlayVisible = (drawerVisible && drawerFloating) || (navVisible && navFloating);

      syncLayoutVars();
      syncPanelWidths();

      root.classList.toggle("is-mobile", mobile);
      root.classList.toggle("drawer-open", drawerVisible);
      root.classList.toggle("nav-open", navVisible);
      root.classList.toggle("no-drawer", !drawerEnabled);
      root.classList.toggle("no-nav", !navEnabled);
      root.classList.toggle("has-header", hasHeaderContent);
      root.classList.toggle("has-drawer", drawerEnabled);
      root.classList.toggle("has-nav", navEnabled);
      root.classList.toggle("has-footer", hasFooterContent);
      root.classList.toggle("drawer-floating", drawerFloating);
      root.classList.toggle("nav-floating", navFloating);
      const disposition = getLayoutDisposition();
      const mode = disposition ? getLayoutMode() : "";
      root.dataset.disposition = disposition || "";
      root.dataset.layoutMode = mode || "";
      root.classList.toggle("has-disposition", !!disposition);
      root.classList.toggle("mode-local", mode === "local");
      root.classList.toggle("mode-global", mode === "global");
      headerWrap.classList.toggle("sticky", uiUnwrap(resolveLayoutProp("stickyHeader")) === true);
      footerWrap.classList.toggle("sticky", uiUnwrap(resolveLayoutProp("stickyFooter")) === true);
      asideWrap.classList.toggle("sticky", uiUnwrap(resolveLayoutProp("stickyAside")) !== false);
      navWrap.classList.toggle("sticky", uiUnwrap(resolveLayoutProp("stickyNav")) === true);

      headerWrap.hidden = !hasHeaderContent;
      footerWrap.hidden = !hasFooterContent;
      mainWrap.hidden = !hasPageContent;

      overlay.hidden = !(drawerFloating || navFloating);
      overlay.classList.toggle("show", overlayVisible);

      asideWrap.hidden = !drawerEnabled || (!drawerVisible && !drawerFloating);
      asideWrap.classList.toggle("open", drawerVisible);
      asideWrap.classList.toggle("is-floating", drawerFloating);
      asideWrap.classList.toggle("is-resizable", inlineDrawerResizable);
      asideWrap.setAttribute("aria-hidden", drawerVisible ? "false" : "true");
      asideResizeHandle.hidden = !inlineDrawerResizable;

      navWrap.hidden = !navEnabled || (!navVisible && !navFloating);
      navWrap.classList.toggle("open", navVisible);
      navWrap.classList.toggle("is-floating", navFloating);
      navWrap.classList.toggle("is-resizable", inlineNavResizable);
      navWrap.setAttribute("aria-hidden", navVisible ? "false" : "true");
      navResizeHandle.hidden = !inlineNavResizable;

      const dispositionConfig = layoutDispositionMap[disposition] || null;
      const dispositionSide = dispositionConfig?.side || (inlineDrawerVisible && dispositionConfig ? "left" : null);
      const dispositionNav = dispositionConfig?.nav || (inlineNavVisible && dispositionConfig ? "top" : null);
      const drawerColumn = inlineDrawerVisible ? (dispositionConfig ? dispositionSide : "left") : "";
      const navColumn = inlineNavVisible ? (dispositionConfig ? (dispositionNav === "left" || dispositionNav === "right" ? dispositionNav : "") : "right") : "";
      root.classList.toggle("drawer-left", drawerEnabled && dispositionSide === "left");
      root.classList.toggle("drawer-right", drawerEnabled && dispositionSide === "right");
      root.classList.toggle("nav-top", inlineNavVisible && dispositionNav === "top");
      root.classList.toggle("nav-side", inlineNavVisible && (navColumn === "left" || navColumn === "right"));
      shell.style.gridTemplateColumns = [
        drawerColumn === "left"
          ? "minmax(0, var(--jss-layout-drawer-width))"
          : navColumn === "left"
            ? "minmax(0, var(--jss-layout-nav-width))"
            : "0px",
        "minmax(0, 1fr)",
        drawerColumn === "right"
          ? "minmax(0, var(--jss-layout-drawer-width))"
          : navColumn === "right"
            ? "minmax(0, var(--jss-layout-nav-width))"
            : "0px"
      ].join(" ");
      const defaultAreas = [
        "\"header header header\"",
        `"${inlineDrawerVisible ? "aside" : "."} main ${inlineNavVisible ? "nav" : "."}"`,
        "\"footer footer footer\""
      ].join(" ");
      const dispositionAreas = createLayoutDispositionAreas(layoutDispositionMap[disposition], {
        header: hasHeaderContent,
        aside: inlineDrawerVisible,
        nav: inlineNavVisible,
        main: hasPageContent,
        footer: hasFooterContent
      });
      shell.style.gridTemplateAreas = toLayoutGridTemplateAreas(
        resolveLayoutProp("areas", "gridTemplateAreas", "templateAreas")
      ) || dispositionAreas || defaultAreas;
    };

    const headerUpdate = (value, newUrl) => {
      hasHeaderContent = fillWrap(headerWrap, normalizeUpdateNodes(value));
      syncHeaderHeight();
      syncLayoutState();
      if (newUrl) JSswift.router.setURLOnly(newUrl);
      return headerWrap;
    };
    const asideUpdate = (value, newUrl) => {
      hasDrawerContent = fillWrap(asideContentWrap, normalizeUpdateNodes(value));
      if (!hasDrawerContent) setOpen(false);
      syncLayoutState();
      if (newUrl) JSswift.router.setURLOnly(newUrl);
      return asideWrap;
    };
    const navUpdate = (value, newUrl) => {
      hasNavContent = fillWrap(navContentWrap, normalizeUpdateNodes(value));
      if (!hasNavContent) setNavOpen(false);
      syncLayoutState();
      if (newUrl) JSswift.router.setURLOnly(newUrl);
      return navWrap;
    };
    const pageUpdate = (value, newUrl) => {
      hasPageContent = fillWrap(mainWrap, normalizeUpdateNodes(value));
      syncLayoutState();
      if (newUrl) JSswift.router.setURLOnly(newUrl);
      return mainWrap;
    };
    const footerUpdate = (value, newUrl) => {
      hasFooterContent = fillWrap(footerWrap, normalizeUpdateNodes(value));
      syncLayoutState();
      if (newUrl) JSswift.router.setURLOnly(newUrl);
      return footerWrap;
    };

    hasHeaderContent = fillWrap(headerWrap, renderAliasSlot(["header"], headerSource));
    hasDrawerContent = fillWrap(asideContentWrap, drawerSource === false ? [] : renderAliasSlot(["aside", "drawer"], drawerSource));
    hasNavContent = fillWrap(navContentWrap, navSource === false ? [] : renderAliasSlot(["nav", "asideRight", "drawerRight"], navSource));
    hasPageContent = fillWrap(mainWrap, renderAliasSlot(["page", "main", "default"], pageFallback));
    hasFooterContent = fillWrap(footerWrap, renderAliasSlot(["footer"], footerSource));

    if (typeof ResizeObserver !== "undefined") {
      headerObserver = new ResizeObserver(() => syncHeaderHeight());
      headerObserver.observe(headerWrap);
    }
    syncHeaderHeight();

    JSswift.reactive.effect(() => {
      getResponsiveKey();
      getMobile();
      getOpen();
      getNavOpen();
      syncLayoutState();
    }, "UI.Layout:state");

    const onKeyDown = (e) => {
      if (uiUnwrap(resolveLayoutProp("escClose")) === false) return;
      if ((!getMobile() && !getDrawerFloating() && !getNavFloating()) || (!getOpen() && !getNavOpen())) return;
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (getOpen()) setOpen(false);
      if (getNavOpen()) setNavOpen(false);
    };
    if (typeof document !== "undefined") {
      document.addEventListener("keydown", onKeyDown, true);
    }

    root.openAside = () => setOpen(true);
    root.closeAside = () => setOpen(false);
    root.toggleAside = () => setOpen(!getOpen());
    root.openNav = () => setNavOpen(true);
    root.closeNav = () => setNavOpen(false);
    root.toggleNav = () => setNavOpen(!getNavOpen());
    root.isDrawerOpen = () => !!getOpen();
    root.isNavOpen = () => !!getNavOpen();
    root.isMobile = () => !!getMobile();
    root.header = () => headerWrap;
    root.aside = () => asideWrap;
    root.drawer = () => asideWrap;
    root.nav = () => navWrap;
    root.page = () => mainWrap;
    root.main = () => mainWrap;
    root.footer = () => footerWrap;
    root.headerUpdate = headerUpdate;
    root.asideUpdate = asideUpdate;
    root.drawerUpdate = asideUpdate;
    root.navUpdate = navUpdate;
    root.pageUpdate = pageUpdate;
    root.mainUpdate = pageUpdate;
    root.footerUpdate = footerUpdate;
    root.reflow = syncLayoutState;
    root._dispose = () => {
      if (typeof window !== "undefined") window.removeEventListener("resize", checkMobile);
      if (typeof document !== "undefined") document.removeEventListener("keydown", onKeyDown, true);
      asideResizeHandle.removeEventListener("pointerdown", onDrawerResizePointerDown);
      navResizeHandle.removeEventListener("pointerdown", onNavResizePointerDown);
      disposeResizeSession?.();
      headerObserver?.disconnect?.();
    };

    setPropertyProps(root, props);
    syncLayoutState();
    return root;
  };

  // Esempio: JSswift.ui.Layout({ header, aside, page, footer })
