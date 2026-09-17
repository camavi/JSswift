  UI.TabPanel = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const rawTabs = Array.isArray(props.tabs)
      ? props.tabs
      : (Array.isArray(props.items) ? props.items : []);
    const model = resolveModel(props.model, "UI.TabPanel:model");
    const componentId = props.id || (`cms-tabpanel-` + Math.random().toString(36).slice(2, 9));
    const normalizeOrientation = (value) => String(uiUnwrap(value) || "vertical").toLowerCase() === "horizontal" ? "horizontal" : "vertical";
    const normalizePosition = (value) => String(uiUnwrap(value) || "before").toLowerCase() === "after" ? "after" : "before";
    const normalizeVariant = (value) => {
      const raw = String(uiUnwrap(value) || "").toLowerCase();
      if (raw === "pills" || raw === "pill") return "pills";
      if (raw === "soft" || raw === "card") return "soft";
      return "line";
    };
    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return JSswift.uiColors.includes(raw) ? `var(--cms-${raw})` : String(raw);
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
      "cms-clear-set",
      "cms-tabpanel",
      "cms-singularity",
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
      wrap.style.setProperty("--cms-tabpanel-duration", `${transitionDuration}ms`);
      wrap.style.setProperty("--cms-tabpanel-easing", transitionEasing);
    }
    if (accentColor) {
      wrap.style.setProperty("--cms-tabpanel-accent", accentColor);
    }

    const nav = _.div({
      class: uiClass(["cms-tabpanel-nav", props.navClass]),
      role: "tablist",
      "aria-orientation": orientation
    });
    const panelsWrap = _.div({ class: uiClass(["cms-tabpanel-panels", props.panelsClass]) });

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
      const fallbackTabContent = _.span({ class: "cms-tabpanel-tab-inner" },
        iconNodes.length ? _.span({ class: "cms-tabpanel-tab-icon" }, ...iconNodes) : null,
        _.span({ class: "cms-tabpanel-tab-copy" },
          _.span({ class: "cms-tabpanel-tab-label" }, ...(labelNodes.length ? labelNodes : [""])),
          noteNodes.length ? _.span({ class: "cms-tabpanel-tab-note" }, ...noteNodes) : null
        ),
        badgeNodes.length ? _.span({ class: "cms-tabpanel-tab-badge" }, ...badgeNodes) : null
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
          "cms-tabpanel-tab",
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
          "cms-tabpanel-nav-btn",
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
          "cms-tabpanel-panel",
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
      const emptyNodes = renderSlotToArray(slots, "empty", { tabs }, props.empty ?? _.div({ class: "cms-tabpanel-empty" }, "Nessun contenuto disponibile."));
      emptyNodes.forEach((node) => panelsWrap.appendChild(node));
    }

    const setDirectionVars = (dir) => {
      if (!animated) return;
      const enter = dir === "next" ? "18px" : "-18px";
      const leave = dir === "next" ? "-18px" : "18px";
      wrap.style.setProperty("--cms-tabpanel-enter", enter);
      wrap.style.setProperty("--cms-tabpanel-leave", leave);
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
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.TabPanel = {
      signature: "UI.TabPanel(props) | UI.TabPanel(props, ...children)",
      props: {
        tabs: {
          type: "Array<{ name?, value?, label?, title?, note?, subtitle?, icon?, badge?, content?, panel?, body?, children?, disabled?, hidden?, tabClass?, panelClass? }>",
          description: "Tab definition. Supports multiple aliases for label and content.",
          category: "data"
        },
        items: {
          type: "Array",
          description: "Alias of `tabs`.",
          category: "data"
        },
        value: {
          type: "any",
          description: "Initial or controlled value of the active tab.",
          category: "data"
        },
        defaultValue: {
          type: "any",
          description: "Explicit alias for the initial tab when `model` is not used.",
          category: "data"
        },
        model: {
          type: "[get,set] signal",
          description: "Reactive binding for the active tab.",
          category: "data"
        },
        orientation: {
          type: "vertical|horizontal",
          description: "Navigation orientation.",
          values: ["vertical", "horizontal"],
          default: "vertical",
          category: "layout"
        },
        navPosition: {
          type: "before|after",
          description: "Tab bar position relative to the panels.",
          values: ["before", "after"],
          default: "before",
          category: "layout"
        },
        variant: {
          type: "line|pills|soft",
          description: "Visual style of the tab navigation.",
          values: ["line", "pills", "soft"],
          default: "line",
          category: "style"
        },
        wrap: {
          type: "boolean",
          description: "Allows the nav to wrap when space is limited.",
          default: false,
          category: "layout"
        },
        navFill: {
          type: "boolean",
          description: "Distributes tabs across the available width.",
          default: false,
          category: "layout"
        },
        swipeable: {
          type: "boolean",
          description: "Enables swipe gestures on panels.",
          default: false,
          category: "behavior"
        },
        infinite: {
          type: "boolean",
          description: "When enabled, next/prev cycles from the first to the last tab.",
          default: false,
          category: "behavior"
        },
        animated: {
          type: "boolean",
          description: "Enables the transition between panels.",
          default: false,
          category: "behavior"
        },
        transitionDuration: {
          type: "number",
          description: "Animation duration in milliseconds.",
          default: 220,
          category: "behavior"
        },
        transitionEasing: {
          type: "string",
          description: "CSS timing function for the animation.",
          default: "ease",
          category: "behavior"
        },
        transitionPrev: {
          type: "string",
          description: "Custom classes applied during the transition to the previous tab.",
          category: "behavior"
        },
        transitionNext: {
          type: "string",
          description: "Custom classes applied during the transition to the next tab.",
          category: "behavior"
        },
        tabClass: {
          type: "string",
          description: "Additional classes for all tab buttons.",
          category: "style"
        },
        tabStyle: {
          type: "object",
          description: "Inline style applied to all tab buttons.",
          category: "style"
        },
        navClass: {
          type: "string",
          description: "Additional classes for the nav wrapper.",
          category: "style"
        },
        panelsClass: {
          type: "string",
          description: "Additional classes for the panels wrapper.",
          category: "style"
        },
        panelClass: {
          type: "string",
          description: "Common additional classes for each panel.",
          category: "style"
        },
        panelStyle: {
          type: "object",
          description: "Common inline style for each panel.",
          category: "style"
        },
        empty: {
          type: "Node|Function|Array",
          description: "Visual fallback when `tabs` and `items` are empty.",
          category: "state"
        },
        disabled: {
          type: "boolean",
          description: "Disables the entire component.",
          default: false,
          category: "state"
        },
        slots: {
          type: "{ nav?, tab?, label?, icon?, note?, badge?, panel?, empty?, default? }",
          description: "Structured slots for customizing nav, label, badge, and content.",
          category: "general"
        }
      },
      slots: {
        nav: {
          type: "Function|Node|Array",
          description: "Full navigation renderer. Receives `tabs`, `active()`, `activeTab()`, `select()`, `next()`, `prev()`, `nodes`, `orientation`, `position`, `variant`."
        },
        tab: {
          type: "Function|Node|Array",
          description: "Inner content of the tab button. Receives `tab`, `name`, `index`, `active`, `label`, `icon`, `note`, `badge`, `select()`."
        },
        label: {
          type: "Function|Node|Array",
          description: "Tab label."
        },
        icon: {
          type: "Function|Node|Array",
          description: "Tab icon."
        },
        note: {
          type: "Function|Node|Array",
          description: "Note, subtitle, or short description below the label."
        },
        badge: {
          type: "Function|Node|Array",
          description: "Badge or counter aligned to the right of the tab."
        },
        panel: {
          type: "Function|Node|Array",
          description: "Active/inactive panel renderer. Receives `tab`, `name`, `index`, `active`, `select()`, `next()`, `prev()`."
        },
        empty: {
          type: "Function|Node|Array",
          description: "Fallback when there are no tabs."
        },
        default: {
          type: "Node|Array|Function",
          description: "Extra content appended after the component."
        }
      },
      events: {
        onChange: "(name, tab, index)"
      },
      returns: "HTMLDivElement with API `_getValue()`, `_setValue(value)`, `_select(value)`, `_next()`, `_prev()`, `_active()`, `_tabs()`",
      description: "Standardized tab panel with accessible nav, structured slots, reactive model, swipe, and animations."
    };
  }

  function closeBackdrop(backdrop) {
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }

  function renderDialog({ title, message, contentNode, okText, cancelText, showCancel, onOk, onCancel, persistent }) {
    ensureModalRoot();

    const backdrop = _.div({
      class: "cms-dialog-backdrop", onClick: (e) => {
        if (e.target === backdrop && persistent !== true) onCancel?.();
      }
    });

    const titleNodes = renderSlotToArray(null, "default", {}, title);
    const messageNodes = renderSlotToArray(null, "default", {}, message);
    const contentNodes = renderSlotToArray(null, "default", {}, contentNode);

    const dialog = _.div({ class: "cms-dialog cms-panel" },
      titleNodes.length ? _.h3(...titleNodes) : null,
      messageNodes.length ? _.p(...messageNodes) : null,
      ...contentNodes,
      _.div({ class: "cms-dialog-actions" },
        showCancel ? JSswift.ui.Btn({ onClick: onCancel }, cancelText || "Annulla") : null,
        JSswift.ui.Btn({ color: "primary", onClick: onOk }, okText || "OK")
      )
    );

    backdrop.appendChild(dialog);
    ensureModalRoot().appendChild(backdrop);

    // escape to close
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey, { once: true });

    return { backdrop, close: () => closeBackdrop(backdrop) };
  }

  app.dialog.alert = function (message, opts = {}) {
    return new Promise((resolve) => {
      const { backdrop, close } = renderDialog({
        title: opts.title || "Info",
        message,
        okText: opts.okText || "OK",
        showCancel: false,
        persistent: opts.persistent,
        onOk: () => { close(); resolve(true); },
        onCancel: () => { close(); resolve(true); }
      });
    });
  };

  app.dialog.confirm = function (opts = {}) {
    return new Promise((resolve) => {
      const { close } = renderDialog({
        title: opts.title || "Conferma",
        message: opts.message || "",
        okText: opts.okText || "Conferma",
        cancelText: opts.cancelText || "Annulla",
        showCancel: true,
        persistent: opts.persistent,
        onOk: () => { close(); resolve(true); },
        onCancel: () => { close(); resolve(false); }
      });
    });
  };

  app.dialog.prompt = function (opts = {}) {
    return new Promise((resolve) => {
      const input = JSswift.ui.Input({
        class: "cms-dialog-input",
        type: opts.type || "text",
        placeholder: opts.placeholder || ""
      });

      // default value
      if (opts.value != null) input.value = String(opts.value);

      const { close } = renderDialog({
        title: opts.title || "Inserisci valore",
        message: opts.message || "",
        okText: opts.okText || "OK",
        cancelText: opts.cancelText || "Annulla",
        showCancel: true,
        contentNode: _.div(input),
        persistent: opts.persistent,
        onOk: () => { const v = input.value; close(); resolve(v); },
        onCancel: () => { close(); resolve(null); }
      });

      // focus
      setTimeout(() => input.focus(), 0);
    });
  };

  // ===============================
  // Loading Service
  // ===============================

  app.services = app.services || {};
  app.services.loading = app.services.loading || {};
  app.loading = app.services.loading;

  let overlay = null;
  let countLoading = 0;

  function ensureOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "cms-loading-backdrop";
    overlay.style.cssText = `
position: fixed; inset: 0;
background: rgba(0,0,0,0.45);
display: none;
align-items: center; justify-content: center;
z-index: 10001;
padding: 14px;
`;
    const box = document.createElement("div");
    box.className = "cms-panel cms-loading-card";
    box.style.cssText = `
padding: 14px 16px;
border-radius: var(--cms-r-lg);
min-width: 260px;
display:flex; gap: 12px; align-items:center;
flex-direction: column;
`;

    const spinner = document.createElement("div");
    spinner.className = "cms-loading-spinner";
    spinner.style.cssText = `
width: 18px; height: 18px;
border-radius: 50%;
border: 2px solid rgba(255,255,255,0.25);
border-top-color: var(--cms-primary);
animation: cmsSpin 0.9s linear infinite;
`;

    const text = document.createElement("div");
    text.className = "cms-muted cms-loading-text";
    text.textContent = "Loading...";

    const progressWrap = document.createElement("div");
    progressWrap.className = "cms-loading-progress";
    progressWrap.style.cssText = `
width: 100%;
height: 6px;
border-radius: 999px;
overflow: hidden;
background: rgba(255,255,255,0.08);
display: none;
`;
    const progressBar = document.createElement("div");
    progressBar.className = "cms-loading-progress-bar";
    progressBar.style.cssText = `
height: 100%;
width: 0%;
background: var(--cms-primary);
transition: width 200ms ease;
`;
    progressWrap.appendChild(progressBar);

    const row = document.createElement("div");
    row.style.cssText = "display:flex; gap: 12px; align-items:center; width: 100%;";
    row.appendChild(spinner);
    row.appendChild(text);

    box.appendChild(row);
    box.appendChild(progressWrap);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const style = document.createElement("style");
    style.textContent = `
@keyframes cmsSpin { to { transform: rotate(360deg); } }
`;
    document.head.appendChild(style);

    overlay._textNode = text;
    overlay._spinner = spinner;
    overlay._progressWrap = progressWrap;
    overlay._progressBar = progressBar;
    overlay._progressActive = false;
    return overlay;
  }

  function normalizeLoadingOptions(message, opts) {
    if (typeof message === "object" && message !== null) return { ...message };
    const base = (opts && typeof opts === "object") ? opts : {};
    if (typeof opts === "string" && (message == null || typeof message === "number")) {
      return { ...base, message: opts };
    }
    return { ...base, message: message };
  }

  function setLoadingMode(ov, mode) {
    const showProgress = mode === "progress";
    ov._spinner.style.display = showProgress ? "none" : "";
    ov._progressWrap.style.display = showProgress ? "block" : "none";
    ov._mode = mode;
  }

  app.loading.show = function (message = "Loading...", opts = {}) {
    const ov = ensureOverlay();
    const o = normalizeLoadingOptions(message, opts);
    countLoading++;
    ov._progressActive = false;
    ov._textNode.textContent = o.message || "Loading...";
    setLoadingMode(ov, "spinner");
    if (o.spinner === false) ov._spinner.style.display = "none";
    ov.style.display = "flex";
  };

  app.loading.hide = function () {
    if (!overlay) return;
    countLoading = Math.max(0, countLoading - 1);
    if (countLoading === 0) {
      overlay.style.display = "none";
      overlay._progressActive = false;
    }
  };

  app.loading.progress = function (value = 0, opts = {}) {
    const ov = ensureOverlay();
    if (typeof value === "object" && value !== null) {
      opts = value;
      value = value.value ?? 0;
    }
    const o = normalizeLoadingOptions(null, opts);
    if (!ov._progressActive) {
      countLoading++;
      ov._progressActive = true;
    }
    const v = Math.max(0, Math.min(100, Number(value ?? 0)));
    ov._textNode.textContent = o.message || "Loading...";
    ov._progressBar.style.width = v + "%";
    setLoadingMode(ov, "progress");
    ov.style.display = "flex";
  };

  // helper: wrapper async
  app.loading.wrap = async function (message, fn) {
    app.loading.show(message);
    try { return await fn(); }
    finally { app.loading.hide(); }
  };

  // ===============================
  // UI.Table
  // ===============================
  function toValue(rows) {
    if (typeof rows === "function") return rows();
    return rows || [];
  }

  function tableGetByPath(obj, path) {
    if (obj == null || path == null) return undefined;
    if (typeof path !== "string" || path.indexOf(".") < 0) return obj?.[path];
    return path.split(".").reduce((acc, key) => acc == null ? acc : acc[key], obj);
  }

  function defaultCompare(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  }

  function tableToArray(value) {
    const rows = toValue(value);
    return Array.isArray(rows) ? rows : [];
  }

  function tableColumnLabel(col) {
    return col?.label ?? col?.title ?? col?.header ?? col?.key ?? "";
  }

  function tableColumnSortKey(col, index) {
    return col?.sortKey ?? col?.key ?? `__col_${index}`;
  }

  function tableFindColumn(columns, key) {
    return columns.find((col, index) => tableColumnSortKey(col, index) === key || col?.key === key) || null;
  }

  function tableResolveValue(col, row, rowIndex) {
    if (!col) return row;
    if (typeof col.get === "function") return col.get(row, { row, rowIndex, col });
    if (typeof col.value === "function") return col.value(row, { row, rowIndex, col });
    if (typeof col.key === "string") return tableGetByPath(row, col.key);
    return col.key != null ? row?.[col.key] : row;
  }

  function tableResolveStyle(style, ctx) {
    if (typeof style === "function") return style(ctx) || {};
    return style || {};
  }

  function tableTextValue(value) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(tableTextValue).filter(Boolean).join(" ");
    if (typeof Node !== "undefined" && value instanceof Node) return value.textContent || "";
    if (typeof value === "object") {
      if (typeof value.textContent === "string") return value.textContent;
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return String(value);
  }

  function tableNormalizePageSizes(options, fallback) {
    const list = Array.isArray(options) ? options : fallback;
    const normalized = list
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
    return normalized.length ? Array.from(new Set(normalized)) : fallback;
  }

  function tableMatchesQuery(row, columns, query, props) {
    const predicate = props.searchBy || props.searchPredicate;
    if (typeof predicate === "function") return !!predicate(row, { query, columns });

    const terms = String(query || "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!terms.length) return true;

    const searchKeys = Array.isArray(props.searchKeys) && props.searchKeys.length
      ? props.searchKeys
      : columns.filter((col) => col?.searchable !== false).map((col) => col?.searchKey ?? col?.key).filter(Boolean);

    const tokens = [];
    if (searchKeys.length) {
      for (const key of searchKeys) {
        if (typeof key === "function") tokens.push(tableTextValue(key(row)));
        else {
          const col = columns.find((item) => item?.key === key || item?.searchKey === key);
          tokens.push(tableTextValue(col ? tableResolveValue(col, row, -1) : tableGetByPath(row, key)));
        }
      }
    } else {
      tokens.push(tableTextValue(row));
    }

    const haystack = tokens.join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  }

