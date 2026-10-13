  UI.TabPanel = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const rawTabs = Array.isArray(props.tabs)
      ? props.tabs
      : (Array.isArray(props.items) ? props.items : []);
    const model = resolveModel(props.model, "UI.TabPanel:model");
    const componentId = props.id || (`jss-tabpanel-` + Math.random().toString(36).slice(2, 9));
    const normalizeOrientation = (value) => String(uiUnwrap(value) || "vertical").toLowerCase() === "horizontal" ? "horizontal" : "vertical";
    const normalizePosition = (value) => String(uiUnwrap(value) || "before").toLowerCase() === "after" ? "after" : "before";
    const normalizeVariant = (value) => {
      const raw = String(uiUnwrap(value) || "").toLowerCase();
      if (raw === "pills" || raw === "pill") return "pills";
      if (raw === "soft" || raw === "card") return "soft";
      if (raw === "solid") return "solid";
      return "line";
    };
    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return JSswift.uiColors.includes(raw) ? `var(--jss-${raw})` : String(raw);
    };

    const orientation = normalizeOrientation(props.orientation || props.orient || props.direction);
    const navPosition = normalizePosition(props.navPosition || props.barPosition || props.position);
    const variant = normalizeVariant(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line")));
    const wrapTabs = !!props.wrap;
    const swipeable = !!props.swipeable;
    const infinite = !!props.infinite;
    const animated = !!props.animated;
    const navFill = !!(props.navFill ?? props.fill ?? props.stretch);
    const disabledAll = !!props.disabled;

    const transitionDurationRaw = uiUnwrap(props.transitionDuration ?? props["transition-duration"]);
    const transitionDuration = (() => {
      if (transitionDurationRaw == null) return 220;
      if (typeof transitionDurationRaw === "number") return transitionDurationRaw;
      const parsed = parseFloat(transitionDurationRaw);
      return Number.isFinite(parsed) ? parsed : 220;
    })();
    const transitionEasing = uiUnwrap(props.transitionEasing ?? props["transition-easing"]) || "ease";
    const transitionPrev = props.transitionPrev ?? props["transition-prev"] ?? null;
    const transitionNext = props.transitionNext ?? props["transition-next"] ?? null;
    const accentColor = resolveAccent(props.color ?? props.state);

    const tabs = rawTabs.map((tab, index) => {
      if (tab == null) return null;
      if (typeof tab !== "object") {
        return {
          name: tab,
          labelFallback: tab,
          panelFallback: null,
          noteFallback: null,
          iconFallback: null,
          badgeFallback: null,
          hidden: false,
          raw: tab,
          index
        };
      }
      const name = tab.name ?? tab.value ?? tab.id ?? tab.key ?? tab.label ?? tab.title ?? `tab-${index}`;
      const hasLabel = tab.label != null || tab.title != null;
      const labelFallback = hasLabel
        ? (tab.label ?? tab.title)
        : (tab.children != null && tab.content == null && tab.panel == null ? tab.children : (tab.name ?? tab.value ?? `Tab ${index + 1}`));
      const panelFallback = tab.content ?? tab.panel ?? tab.body ?? (hasLabel ? tab.children : null);
      const noteFallback = tab.note ?? tab.subtitle ?? tab.description ?? null;
      const iconFallback = tab.icon ?? null;
      const badgeFallback = Object.prototype.hasOwnProperty.call(tab, "badge")
        ? tab.badge
        : (Object.prototype.hasOwnProperty.call(tab, "counter") ? tab.counter : null);
      return {
        ...tab,
        name,
        labelFallback,
        panelFallback,
        noteFallback,
        iconFallback,
        badgeFallback,
        index
      };
    }).filter(Boolean).filter((tab) => tab.hidden !== true && tab.visible !== false);

    const cls = uiClass([
      "jss-clear-set",
      "jss-tabpanel",
      "jss-singularity",
      orientation,
      `variant-${variant}`,
      uiWhen(wrapTabs, "wrap"),
      uiWhen(animated, "animated"),
      uiWhen(navFill, "nav-fill"),
      uiWhen(disabledAll, "disabled"),
      uiWhen(navPosition === "after", "nav-after"),
      props.class
    ]);
    const wrapProps = JSswift.omit(props, [
      "tabs", "items", "value", "default", "defaultValue", "model",
      "orientation", "orient", "direction",
      "navPosition", "barPosition", "position",
      "variant", "pills", "soft",
      "navFill", "fill", "stretch",
      "wrap", "swipeable", "infinite", "animated",
      "transitionDuration", "transition-duration",
      "transitionEasing", "transition-easing",
      "transitionPrev", "transition-prev",
      "transitionNext", "transition-next",
      "slots", "empty",
      "tabClass", "tabStyle",
      "panelClass", "panelStyle",
      "navClass", "panelsClass",
      "class", "style"
    ]);
    wrapProps.class = cls;
    wrapProps.style = props.style;
    const wrap = _.div(wrapProps);

    if (animated) {
      wrap.style.setProperty("--jss-tabpanel-duration", `${transitionDuration}ms`);
      wrap.style.setProperty("--jss-tabpanel-easing", transitionEasing);
    }
    if (accentColor) {
      wrap.style.setProperty("--jss-tabpanel-accent", accentColor);
    }

    const nav = _.div({
      class: uiClass(["jss-tabpanel-nav", props.navClass]),
      role: "tablist",
      "aria-orientation": orientation
    });
    const panelsWrap = _.div({ class: uiClass(["jss-tabpanel-panels", props.panelsClass]) });

    const tabButtons = [];
    const panelNodes = [];
    let activeIndex = -1;

    const isHorizontal = () => orientation === "horizontal";
    const createCtx = (tab, index, active) => ({
      tab,
      name: tab.name,
      index,
      active,
      value: tab.name,
      select: () => setActiveByIndex(index),
      next: () => goNext(),
      prev: () => goPrev()
    });

    const findEnabledIndex = (start, step, allowWrap = false) => {
      if (!tabs.length) return -1;
      let idx = start;
      for (let i = 0; i < tabs.length; i += 1) {
        idx += step;
        if (idx >= tabs.length) {
          if (!allowWrap) return -1;
          idx = 0;
        } else if (idx < 0) {
          if (!allowWrap) return -1;
          idx = tabs.length - 1;
        }
        if (!tabs[idx]?.disabled) return idx;
      }
      return -1;
    };

    const focusIndex = (index) => {
      const btn = tabButtons[index]?.btn;
      if (!btn || typeof btn.focus !== "function") return;
      requestAnimationFrame(() => btn.focus());
    };

    const makeLabelNodes = (tab, index, isActive) => {
      const ctx = createCtx(tab, index, isActive);
      const labelNode = JSswift.ui.renderSlot(slots, "label", ctx, tab.labelFallback);
      return renderSlotToArray(null, "default", {}, labelNode);
    };

    const makeTabNode = (tab, index) => {
      const isActive = index === activeIndex;
      const tabId = `${componentId}-tab-${index}`;
      const panelId = `${componentId}-panel-${index}`;
      const ctx = createCtx(tab, index, isActive);
      const labelNodes = makeLabelNodes(tab, index, isActive);
      const iconFallback = tab.iconFallback != null
        ? (typeof tab.iconFallback === "string"
          ? UI.Icon({ name: tab.iconFallback, size: tab.iconSize ?? tab.size ?? props.size ?? null })
          : tab.iconFallback)
        : null;
      const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
      const noteNodes = renderSlotToArray(slots, "note", ctx, tab.noteFallback);
      const badgeNodes = renderSlotToArray(slots, "badge", ctx, tab.badgeFallback);
      const fallbackTabContent = _.span({ class: "jss-tabpanel-tab-inner" },
        iconNodes.length ? _.span({ class: "jss-tabpanel-tab-icon" }, ...iconNodes) : null,
        _.span({ class: "jss-tabpanel-tab-copy" },
          _.span({ class: "jss-tabpanel-tab-label" }, ...(labelNodes.length ? labelNodes : [""])),
          noteNodes.length ? _.span({ class: "jss-tabpanel-tab-note" }, ...noteNodes) : null
        ),
        badgeNodes.length ? _.span({ class: "jss-tabpanel-tab-badge" }, ...badgeNodes) : null
      );
      const contentNodes = renderSlotToArray(slots, "tab", {
        ...ctx,
        label: labelNodes,
        icon: iconNodes,
        note: noteNodes,
        badge: badgeNodes,
        tabId,
        panelId
      }, fallbackTabContent);
      const onKeydown = (e) => {
        if (disabledAll || tab.disabled) return;
        const key = e.key;
        if (key === "Enter" || key === " ") {
          e.preventDefault();
          setActiveByIndex(index);
          return;
        }
        if (key === "Home") {
          e.preventDefault();
          const first = tabs.findIndex((item) => !item.disabled);
          if (first >= 0) {
            setActiveByIndex(first);
            focusIndex(first);
          }
          return;
        }
        if (key === "End") {
          e.preventDefault();
          const last = (() => {
            for (let i = tabs.length - 1; i >= 0; i -= 1) {
              if (!tabs[i]?.disabled) return i;
            }
            return -1;
          })();
          if (last >= 0) {
            setActiveByIndex(last);
            focusIndex(last);
          }
          return;
        }
        const prevKeys = isHorizontal() ? ["ArrowLeft"] : ["ArrowUp"];
        const nextKeys = isHorizontal() ? ["ArrowRight"] : ["ArrowDown"];
        if (prevKeys.includes(key)) {
          e.preventDefault();
          const prev = findEnabledIndex(index, -1, infinite);
          if (prev >= 0) {
            setActiveByIndex(prev, { dir: "prev" });
            focusIndex(prev);
          }
          return;
        }
        if (nextKeys.includes(key)) {
          e.preventDefault();
          const next = findEnabledIndex(index, 1, infinite);
          if (next >= 0) {
            setActiveByIndex(next, { dir: "next" });
            focusIndex(next);
          }
        }
      };
      const defaultBtn = UI.Btn({
        class: uiClass([
          "jss-tabpanel-tab",
          uiWhen(isActive, "active"),
          uiWhen(tab.disabled || disabledAll, "disabled"),
          props.tabClass,
          tab.tabClass || tab.class
        ]),
        type: "button",
        id: tabId,
        role: "tab",
        disabled: !!(tab.disabled || disabledAll),
        "aria-selected": isActive ? "true" : "false",
        "aria-controls": panelId,
        tabindex: isActive ? "0" : "-1",
        outline: variant === "pills" && !isActive,
        color: variant === "pills" && isActive ? (tab.color || props.color || props.state || "primary") : null,
        size: tab.size ?? props.size ?? null,
        style: {
          ...(props.tabStyle || {}),
          ...(tab.tabStyle || {})
        },
        onClick: () => {
          if (tab.disabled || disabledAll) return;
          setActiveByIndex(index);
        },
        onKeydown
      }, ...contentNodes);
      const navBtn = _.div({
        class: uiClass([
          "jss-tabpanel-nav-btn",
          uiWhen(isActive, "active"),
          tab.navClass
        ]),
        "data-name": tab.name
      }, defaultBtn, _.span({ class: "tab-indicator" }));
      tabButtons[index] = { btn: defaultBtn, wrap: navBtn, index };
      return navBtn;
    };

    const makePanelNode = (tab, index) => {
      const isActive = index === activeIndex;
      const tabId = `${componentId}-tab-${index}`;
      const panelId = `${componentId}-panel-${index}`;
      const ctx = createCtx(tab, index, isActive);
      const panelNode = JSswift.ui.renderSlot(slots, "panel", ctx, tab.panelFallback);
      const panel = _.div({
        class: uiClass([
          "jss-tabpanel-panel",
          uiWhen(isActive, "active"),
          props.panelClass,
          tab.panelClass
        ]),
        style: {
          ...(props.panelStyle || {}),
          ...(tab.panelStyle || {})
        },
        "data-name": tab.name,
        role: "tabpanel",
        id: panelId,
        tabindex: 0,
        "aria-labelledby": tabId,
        "aria-hidden": isActive ? "false" : "true"
      }, ...renderSlotToArray(null, "default", {}, panelNode));
      panelNodes[index] = panel;
      return panel;
    };

    const defaultNavNodes = tabs.map((tab, index) => makeTabNode(tab, index));
    const navContent = JSswift.ui.renderSlot(slots, "nav", {
      tabs,
      active: () => (activeIndex >= 0 ? tabs[activeIndex]?.name : null),
      activeIndex: () => activeIndex,
      activeTab: () => (activeIndex >= 0 ? tabs[activeIndex] : null),
      select: (nameOrIndex) => {
        if (typeof nameOrIndex === "number") setActiveByIndex(nameOrIndex);
        else setActiveByValue(nameOrIndex);
      },
      next: () => goNext(),
      prev: () => goPrev(),
      nodes: defaultNavNodes,
      orientation,
      position: navPosition,
      variant
    }, defaultNavNodes);

    renderSlotToArray(null, "default", {}, navContent).forEach(n => nav.appendChild(n));
    if (tabs.length) {
      tabs.forEach((tab, index) => panelsWrap.appendChild(makePanelNode(tab, index)));
    } else {
      const emptyNodes = renderSlotToArray(slots, "empty", { tabs }, props.empty ?? _.div({ class: "jss-tabpanel-empty" }, "Nessun contenuto disponibile."));
      emptyNodes.forEach((node) => panelsWrap.appendChild(node));
    }

    const setDirectionVars = (dir) => {
      if (!animated) return;
      const enter = dir === "next" ? "18px" : "-18px";
      const leave = dir === "next" ? "-18px" : "18px";
      wrap.style.setProperty("--jss-tabpanel-enter", enter);
      wrap.style.setProperty("--jss-tabpanel-leave", leave);
    };

    const cleanCustomTransitions = () => {
      const classes = [];
      if (transitionPrev) classes.push(...String(transitionPrev).split(/\s+/));
      if (transitionNext) classes.push(...String(transitionNext).split(/\s+/));
      if (classes.length) panelsWrap.classList.remove(...classes.filter(Boolean));
    };

    const applyCustomTransition = (dir) => {
      cleanCustomTransitions();
      const cls = dir === "prev" ? transitionPrev : transitionNext;
      if (!cls) return;
      const parts = String(cls).split(/\s+/).filter(Boolean);
      if (!parts.length) return;
      panelsWrap.classList.add(...parts);
      setTimeout(() => panelsWrap.classList.remove(...parts), transitionDuration + 40);
    };

    const updateNavButtons = (nextIndex) => {
      const active = tabButtons.find(({ btn }) => btn.classList.contains("active"));
      const rectPrev = active?.btn.parentNode?.getBoundingClientRect();
      tabButtons.forEach(({ btn, index }) => {
        const isActive = index === nextIndex;
        const parent = btn.parentNode;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        if (parent.isConnected && rectPrev) {
          parent.style.setProperty("--nav-pos-x", (rectPrev.left - rect.left) + "px");
          parent.style.setProperty("--nav-pos-y", (rectPrev.top - rect.top) + "px");
        }
        parent.classList.toggle("active", isActive);
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
        btn.setAttribute("tabindex", isActive ? "0" : "-1");
      });
    };

    const updatePanels = (prevIndex, nextIndex, dir) => {
      setDirectionVars(dir);
      panelNodes.forEach((panel, index) => {
        if (!panel) return;
        const isNext = index === nextIndex;
        const isPrev = index === prevIndex;
        if (isNext) {
          panel.classList.add("active");
          panel.classList.remove("leaving");
          panel.setAttribute("aria-hidden", "false");
        } else {
          panel.classList.remove("active");
          panel.setAttribute("aria-hidden", "true");
          if (animated && isPrev) {
            panel.classList.add("leaving");
            setTimeout(() => panel.classList.remove("leaving"), transitionDuration + 40);
          } else {
            panel.classList.remove("leaving");
          }
        }
      });
    };

    const computeDir = (prevIndex, nextIndex) => {
      if (prevIndex < 0 || prevIndex === nextIndex) return "next";
      if (infinite && prevIndex === tabs.length - 1 && nextIndex === 0) return "next";
      if (infinite && prevIndex === 0 && nextIndex === tabs.length - 1) return "prev";
      return nextIndex > prevIndex ? "next" : "prev";
    };

    const setActiveByIndex = (nextIndex, opts = {}) => {
      if (nextIndex == null || nextIndex < 0 || nextIndex >= tabs.length) return;
      if (tabs[nextIndex]?.disabled) return;
      const prevIndex = activeIndex;
      if (prevIndex === nextIndex) return;
      activeIndex = nextIndex;
      const nextTab = tabs[nextIndex];
      const dir = opts.dir || computeDir(prevIndex, nextIndex);
      if (model && !opts.fromModel) model.set(nextTab.name);
      updateNavButtons(nextIndex);
      updatePanels(prevIndex, nextIndex, dir);
      applyCustomTransition(dir);
      wrap.dataset.active = String(nextTab.name);
      props.onChange?.(nextTab.name, nextTab, nextIndex);
    };

    const setActiveByValue = (value, opts = {}) => {
      if (!tabs.length) return;
      const idx = tabs.findIndex(t => t.name == value);
      if (idx === -1) return;
      setActiveByIndex(idx, opts);
    };

    const goNext = () => {
      if (!tabs.length) return;
      const nextIndex = activeIndex < 0
        ? tabs.findIndex((tab) => !tab.disabled)
        : findEnabledIndex(activeIndex, 1, infinite);
      if (nextIndex < 0) return;
      setActiveByIndex(nextIndex, { dir: "next" });
    };

    const goPrev = () => {
      if (!tabs.length) return;
      const nextIndex = activeIndex < 0
        ? (() => {
          for (let i = tabs.length - 1; i >= 0; i -= 1) {
            if (!tabs[i]?.disabled) return i;
          }
          return -1;
        })()
        : findEnabledIndex(activeIndex, -1, infinite);
      if (nextIndex < 0) return;
      setActiveByIndex(nextIndex, { dir: "prev" });
    };

    if (swipeable) {
      let startX = 0;
      let startY = 0;
      let tracking = false;
      const threshold = 42;
      panelsWrap.addEventListener("pointerdown", (e) => {
        if (e.button != null && e.button !== 0) return;
        tracking = true;
        startX = e.clientX;
        startY = e.clientY;
      });
      panelsWrap.addEventListener("pointerup", (e) => {
        if (!tracking) return;
        tracking = false;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;
        if (dx < 0) goNext();
        else goPrev();
      });
      panelsWrap.addEventListener("pointercancel", () => { tracking = false; });
      panelsWrap.addEventListener("pointerleave", () => { tracking = false; });
    }

    const initialValue = model ? model.get() : (props.value ?? props.defaultValue ?? props.default ?? null);
    if (tabs.length) {
      const initialIndex = tabs.findIndex(t => t.name == initialValue);
      if (initialIndex >= 0) {
        setActiveByIndex(initialIndex, { fromModel: true });
      } else {
        const firstEnabled = tabs.findIndex((tab) => !tab.disabled);
        if (firstEnabled >= 0) {
          setActiveByIndex(firstEnabled, { fromModel: true });
          if (model) model.set(tabs[firstEnabled].name);
        }
      }
    }

    if (model) {
      model.watch((v) => setActiveByValue(v, { fromModel: true }), "UI.TabPanel:watch");
    }

    if (navPosition === "after") {
      wrap.appendChild(panelsWrap);
      wrap.appendChild(nav);
    } else {
      wrap.appendChild(nav);
      wrap.appendChild(panelsWrap);
    }

    const extra = renderSlotToArray(slots, "default", {}, children);
    extra.forEach((n) => wrap.appendChild(n));
    setPropertyProps(wrap, props);
    wrap._tabs = () => tabs.slice();
    wrap._active = () => (activeIndex >= 0 ? tabs[activeIndex] : null);
    wrap._getValue = () => (activeIndex >= 0 ? tabs[activeIndex]?.name : null);
    wrap._setValue = (value) => setActiveByValue(value);
    wrap._select = (value) => {
      if (typeof value === "number") setActiveByIndex(value);
      else setActiveByValue(value);
    };
    wrap._next = goNext;
    wrap._prev = goPrev;
    return wrap;
  };
