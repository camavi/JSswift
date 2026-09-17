  UI.Tabs = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const hasOwn = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
    const normalizeOrientation = (value) => String(uiUnwrap(value) || "horizontal").toLowerCase() === "vertical" ? "vertical" : "horizontal";
    const normalizeVariant = (value) => {
      const raw = String(uiUnwrap(value) || "").toLowerCase();
      if (raw === "pills" || raw === "pill") return "pills";
      if (raw === "soft" || raw === "card") return "soft";
      return "line";
    };
    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return JSswift.uiColors?.includes(raw) ? `var(--cms-${raw})` : String(raw);
    };
    const isSameValue = (a, b) => Object.is(a, b) || (a != null && b != null && a == b);

    const model = resolveModel(props.model, "UI.Tabs:model");
    const orientation = normalizeOrientation(props.orientation || props.orient || props.direction);
    const variant = normalizeVariant(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line")));
    const fillTabs = !!uiUnwrap(props.fill ?? props.navFill ?? props.stretch);
    const wrapTabs = !!uiUnwrap(props.wrap);
    const disabledAll = !!uiUnwrap(props.disabled);
    const componentId = props.id || (`cms-tabs-` + Math.random().toString(36).slice(2, 9));
    const rawTabs = uiUnwrap(props.tabs ?? props.items) || [];
    const tabs = (Array.isArray(rawTabs) ? rawTabs : [rawTabs])
      .map((tab, index) => {
        if (tab == null) return null;
        if (typeof tab !== "object") {
          return {
            raw: tab,
            index,
            value: tab,
            labelFallback: tab,
            noteFallback: null,
            iconFallback: null,
            badgeFallback: null,
            disabled: false,
            hidden: false
          };
        }
        const value = tab.value ?? tab.name ?? tab.id ?? tab.key ?? tab.label ?? tab.title ?? `tab-${index}`;
        const labelFallback = tab.label ?? tab.title ?? tab.name ?? tab.value ?? `Tab ${index + 1}`;
        const badgeFallback = hasOwn(tab, "badge")
          ? tab.badge
          : (hasOwn(tab, "counter") ? tab.counter : null);
        return {
          ...tab,
          raw: tab,
          index,
          value,
          labelFallback,
          noteFallback: tab.note ?? tab.subtitle ?? tab.description ?? null,
          iconFallback: tab.icon ?? null,
          badgeFallback
        };
      })
      .filter(Boolean)
      .filter((tab) => tab.hidden !== true && tab.visible !== false);

    const firstEnabled = tabs.find((tab) => !tab.disabled) || null;
    const findTabIndex = (value) => tabs.findIndex((tab) => isSameValue(tab.value, value));
    const findEnabledIndex = (startIndex, step) => {
      if (!tabs.length) return -1;
      let index = startIndex;
      for (let i = 0; i < tabs.length; i += 1) {
        index += step;
        if (index < 0) index = tabs.length - 1;
        else if (index >= tabs.length) index = 0;
        if (!tabs[index]?.disabled) return index;
      }
      return -1;
    };
    const coerceValue = (value, fallback = false) => {
      const index = findTabIndex(value);
      if (index >= 0 && !tabs[index]?.disabled) return tabs[index].value;
      return fallback ? (firstEnabled?.value ?? null) : (value ?? null);
    };
    const initialValue = coerceValue(
      model
        ? model.get()
        : (hasOwn(props, "value") ? uiUnwrap(props.value) : (props.defaultValue ?? props.default)),
      true
    );
    const [getValue, setValue] = JSswift.reactive.signal(initialValue);

    const cls = uiClass([
      "cms-clear-set",
      "cms-tabs",
      "cms-singularity",
      orientation,
      `variant-${variant}`,
      uiWhen(props.dense, "dense"),
      uiWhen(fillTabs, "fill"),
      uiWhen(wrapTabs, "wrap"),
      uiWhen(disabledAll, "disabled"),
      props.class
    ]);
    const wrapProps = JSswift.omit(props, [
      "tabs", "items", "value", "defaultValue", "default", "model",
      "orientation", "orient", "direction",
      "variant", "pills", "soft",
      "fill", "navFill", "stretch",
      "wrap", "dense", "disabled",
      "slots", "empty",
      "gap", "tabGap",
      "align", "justify",
      "color", "state",
      "navClass", "navStyle",
      "barClass", "barStyle",
      "tabClass", "tabStyle",
      "itemClass", "itemStyle",
      "class", "style"
    ]);
    wrapProps.class = cls;
    wrapProps.style = {
      ...(props.style || {})
    };
    if (props.gap != null) wrapProps.style["--cms-tabs-gap"] = toCssSize(props.gap);
    if (props.tabGap != null) wrapProps.style["--cms-tabs-tab-gap"] = toCssSize(props.tabGap);
    const accentColor = resolveAccent(props.color ?? props.state);
    if (accentColor) wrapProps.style["--cms-tabs-accent"] = accentColor;
    const wrap = _.div(wrapProps);

    const bar = _.div({
      class: uiClass(["cms-tabs-bar", props.barClass]),
      style: {
        alignItems: props.align || (orientation === "vertical" ? "stretch" : "center"),
        justifyContent: props.justify || "flex-start",
        ...(props.barStyle || {})
      }
    });
    const nav = _.div({
      class: uiClass(["cms-tabs-nav", props.navClass]),
      style: props.navStyle || null,
      role: "tablist",
      "aria-orientation": orientation
    });
    const tabButtons = [];

    const getActiveIndex = () => findTabIndex(getValue());
    const getActiveTab = () => {
      const index = getActiveIndex();
      return index >= 0 ? tabs[index] : null;
    };
    const createRootCtx = () => ({
      tabs,
      value: getValue(),
      active: getValue(),
      activeIndex: getActiveIndex(),
      activeTab: getActiveTab(),
      orientation,
      variant,
      select: (value, event) => selectByValue(value, { event, emit: true }),
      next: () => goNext(),
      prev: () => goPrev()
    });
    const createCtx = (tab, index, active) => ({
      ...createRootCtx(),
      tab,
      index,
      active,
      disabled: !!tab.disabled,
      select: (event) => selectByIndex(index, { event, emit: true })
    });
    const focusIndex = (index) => {
      const btn = tabButtons[index]?.btn;
      if (!btn || typeof btn.focus !== "function") return;
      requestAnimationFrame(() => btn.focus());
    };

    const updateButtons = (nextValue) => {
      const nextIndex = findTabIndex(nextValue);
      wrap.dataset.value = nextValue == null ? "" : String(nextValue);
      wrap.dataset.activeIndex = nextIndex >= 0 ? String(nextIndex) : "";
      tabButtons.forEach(({ btn, item, tab, index }) => {
        const active = index === nextIndex;
        item.classList.toggle("active", active);
        item.classList.toggle("disabled", !!(tab.disabled || disabledAll));
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-selected", active ? "true" : "false");
        btn.setAttribute("tabindex", active ? "0" : "-1");
      });
    };

    const syncValue = (nextValue) => {
      setValue(nextValue);
      updateButtons(nextValue);
    };

    const selectByValue = (nextValue, options = {}) => {
      if (disabledAll) return null;
      const index = findTabIndex(nextValue);
      if (index < 0) return null;
      return selectByIndex(index, options);
    };

    const selectByIndex = (index, options = {}) => {
      const tab = tabs[index];
      if (!tab || tab.disabled || disabledAll) return null;
      const nextValue = tab.value;
      const prevValue = getValue();
      const changed = !isSameValue(prevValue, nextValue);

      syncValue(nextValue);
      if (model && !isSameValue(model.get(), nextValue)) {
        model.set(nextValue);
      }
      if (options.focus) focusIndex(index);
      if (options.event) {
        tab.onClick?.(nextValue, options.event, tab, index);
      }
      if (changed && options.emit !== false) {
        props.onChange?.(nextValue, tab, options.event || null, index);
      }
      return tab;
    };

    const goNext = () => {
      const nextIndex = findEnabledIndex(getActiveIndex() < 0 ? -1 : getActiveIndex(), 1);
      if (nextIndex >= 0) selectByIndex(nextIndex, { emit: true, focus: true });
    };
    const goPrev = () => {
      const start = getActiveIndex() < 0 ? 0 : getActiveIndex();
      const prevIndex = findEnabledIndex(start, -1);
      if (prevIndex >= 0) selectByIndex(prevIndex, { emit: true, focus: true });
    };

    const makeTabNode = (tab, index) => {
      const isActive = index === getActiveIndex();
      const ctx = createCtx(tab, index, isActive);
      const tabId = `${componentId}-tab-${index}`;
      const iconFallback = tab.iconFallback != null
        ? (typeof tab.iconFallback === "string"
          ? UI.Icon({ name: tab.iconFallback, size: tab.iconSize ?? tab.size ?? props.size ?? null })
          : tab.iconFallback)
        : null;
      const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
      const labelNodes = renderSlotToArray(null, "default", {}, JSswift.ui.renderSlot(slots, "label", ctx, tab.labelFallback));
      const noteNodes = renderSlotToArray(slots, "note", ctx, tab.noteFallback);
      const badgeNodes = renderSlotToArray(slots, "badge", ctx, tab.badgeFallback);
      const fallbackContent = _.span({ class: "cms-tabs-tab-inner" },
        iconNodes.length ? _.span({ class: "cms-tabs-tab-icon" }, ...iconNodes) : null,
        _.span({ class: "cms-tabs-tab-copy" },
          _.span({ class: "cms-tabs-tab-label" }, ...(labelNodes.length ? labelNodes : [""])),
          noteNodes.length ? _.span({ class: "cms-tabs-tab-note" }, ...noteNodes) : null
        ),
        badgeNodes.length ? _.span({ class: "cms-tabs-tab-badge" }, ...badgeNodes) : null
      );
      const contentNodes = renderSlotToArray(slots, "tab", {
        ...ctx,
        tabId,
        label: labelNodes,
        icon: iconNodes,
        note: noteNodes,
        badge: badgeNodes
      }, fallbackContent);
      const onKeydown = (e) => {
        if (tab.disabled || disabledAll) return;
        const key = e.key;
        if (key === "Enter" || key === " ") {
          e.preventDefault();
          selectByIndex(index, { event: e, emit: true });
          return;
        }
        if (key === "Home") {
          e.preventDefault();
          const firstIndex = tabs.findIndex((item) => !item.disabled);
          if (firstIndex >= 0) selectByIndex(firstIndex, { event: e, emit: true, focus: true });
          return;
        }
        if (key === "End") {
          e.preventDefault();
          let lastIndex = -1;
          for (let i = tabs.length - 1; i >= 0; i -= 1) {
            if (!tabs[i]?.disabled) {
              lastIndex = i;
              break;
            }
          }
          if (lastIndex >= 0) selectByIndex(lastIndex, { event: e, emit: true, focus: true });
          return;
        }
        const prevKeys = orientation === "vertical" ? ["ArrowUp"] : ["ArrowLeft"];
        const nextKeys = orientation === "vertical" ? ["ArrowDown"] : ["ArrowRight"];
        if (prevKeys.includes(key)) {
          e.preventDefault();
          const prevIndex = findEnabledIndex(index, -1);
          if (prevIndex >= 0) selectByIndex(prevIndex, { event: e, emit: true, focus: true });
          return;
        }
        if (nextKeys.includes(key)) {
          e.preventDefault();
          const nextIndex = findEnabledIndex(index, 1);
          if (nextIndex >= 0) selectByIndex(nextIndex, { event: e, emit: true, focus: true });
        }
      };
      const itemAccent = resolveAccent(tab.color ?? tab.state);
      const item = _.div({
        class: uiClass([
          "cms-tabs-item",
          uiWhen(isActive, "active"),
          uiWhen(tab.disabled || disabledAll, "disabled"),
          props.itemClass,
          tab.itemClass
        ]),
        style: {
          ...(itemAccent ? { "--cms-tabs-item-accent": itemAccent } : {}),
          ...(props.itemStyle || {}),
          ...(tab.itemStyle || {})
        },
        "data-name": String(tab.value)
      });
      const btn = UI.Btn({
        class: uiClass([
          "cms-tabs-tab",
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
        tabindex: isActive ? "0" : "-1",
        size: tab.size ?? props.size ?? null,
        style: {
          ...(props.tabStyle || {}),
          ...(tab.tabStyle || {})
        },
        onClick: (e) => {
          selectByIndex(index, { event: e, emit: true });
        },
        onKeydown
      }, ...contentNodes);
      item.appendChild(btn);
      item.appendChild(_.span({ class: "tab-indicator" }));
      tabButtons[index] = { tab, index, item, btn };
      return item;
    };

    if (tabs.length) {
      const defaultNavNodes = tabs.map((tab, index) => makeTabNode(tab, index));
      const navContent = JSswift.ui.renderSlot(slots, "nav", {
        ...createRootCtx(),
        nodes: defaultNavNodes
      }, defaultNavNodes);
      renderSlotToArray(null, "default", {}, navContent).forEach((node) => nav.appendChild(node));
    } else {
      renderSlotToArray(slots, "empty", createRootCtx(), props.empty ?? _.div({ class: "cms-tabs-empty" }, "Nessuna tab disponibile."))
        .forEach((node) => nav.appendChild(node));
    }

    const extraCtx = createRootCtx();
    const extraNodes = [
      ...renderSlotToArray(null, "default", {}, JSswift.ui.renderSlot(slots, "extra", extraCtx, null)),
      ...renderSlotToArray(slots, "default", extraCtx, children)
    ];
    bar.appendChild(nav);
    if (extraNodes.length) {
      bar.appendChild(_.div({ class: "cms-tabs-extra" }, ...extraNodes));
    }
    wrap.appendChild(bar);

    syncValue(initialValue);
    if (model) {
      model.watch((value) => {
        syncValue(coerceValue(value, true));
      }, "UI.Tabs:watch");
    } else if (uiIsReactive(props.value)) {
      app.reactive.effect(() => {
        syncValue(coerceValue(uiUnwrap(props.value), true));
      }, "UI.Tabs:value");
    }

    wrap._getValue = () => getValue();
    wrap._setValue = (value) => selectByValue(value, { emit: true });
    wrap._select = (value) => selectByValue(value, { emit: true });
    wrap._next = () => goNext();
    wrap._prev = () => goPrev();
    wrap._getTabs = () => tabs.slice();
    setPropertyProps(wrap, props);
    return wrap;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Tabs = {
      signature: "UI.Tabs(props) | UI.Tabs(props, ...children)",
      props: {
        tabs: "Array<{ value|name|id|key, label|title, note|subtitle|description, icon, badge|counter, disabled, hidden, onClick }>",
        items: "Alias of tabs",
        value: "any",
        defaultValue: "any",
        default: "Alias of defaultValue",
        model: "[get,set] signal",
        orientation: "horizontal|vertical",
        variant: "line|pills|soft",
        fill: "boolean",
        wrap: "boolean",
        disabled: "boolean",
        color: "string",
        state: "string",
        gap: "string|number",
        tabGap: "string|number",
        align: "string",
        justify: "string",
        size: "string|number",
        dense: "boolean",
        navClass: "string",
        tabClass: "string",
        itemClass: "string",
        slots: "{ nav?, tab?, label?, icon?, note?, badge?, extra?, empty?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        nav: "Full nav renderer",
        tab: "Single tab renderer",
        label: "Label renderer",
        icon: "Icon renderer",
        note: "Note renderer",
        badge: "Badge/counter renderer",
        extra: "Extra area next to the nav",
        empty: "Fallback when tabs/items are empty",
        default: "Children / extra content fallback"
      },
      events: {
        onChange: "(value, tab, event, index)"
      },
      keyboard: ["Enter/Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"],
      returns: "HTMLDivElement con ._getValue(), ._setValue(value), ._select(value), ._next(), ._prev(), ._getTabs()",
      description: "Standardized tab bar with controlled/uncontrolled support, structured slots, badge/note/icon, and keyboard navigation."
    };
  }
  // Esempio: JSswift.ui.Tabs({ tabs: [{ label: "Overview", value: "overview", icon: "dashboard" }], model: [get,set] })

  UI.RouteTab = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const router = JSswift.router || app?.router || null;
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(props, key);
    const hasExplicitActive = hasOwn("active") || hasOwn("selected");
    const normalizeVariant = (value) => {
      const raw = String(uiUnwrap(value) || "").toLowerCase();
      if (raw === "pill" || raw === "pills") return "pills";
      if (raw === "soft" || raw === "card") return "soft";
      return "line";
    };
    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return JSswift.uiColors?.includes(raw) ? `var(--cms-${raw})` : String(raw);
    };
    const resolvePath = (value) => {
      if (value == null || value === "") return "";
      try {
        const url = new URL(String(value), window.location.origin);
        return url.pathname || "";
      } catch (_) {
        return String(value).split(/[?#]/)[0] || "";
      }
    };
    const isExternalLink = (value) => {
      if (uiUnwrap(props.external) === true) return true;
      if (!value) return false;
      return /^(mailto:|tel:|https?:\/\/|\/\/)/i.test(String(value));
    };
    const getHref = () => uiUnwrap(props.href ?? props.to) || "#";
    const getTo = () => uiUnwrap(props.to ?? props.href) || "";
    const getCurrentPath = () => {
      try {
        if (router?.current) return router.current().pathname || window.location.pathname || "";
      } catch (_) { }
      return window.location.pathname || "";
    };
    const matchCurrentRoute = () => {
      const to = getTo();
      if (!to) return false;
      const matchValue = uiUnwrap(props.match ?? props.activeMatch ?? props.routeMatch);
      const matchMode = String(uiUnwrap(props.matchMode ?? (props.startsWith ? "startsWith" : (props.exact ? "exact" : ""))) || "").toLowerCase();
      const currentPath = getCurrentPath();
      if (typeof matchValue === "function") {
        return !!matchValue({ currentPath, to, href: getHref(), router, props });
      }
      if (matchValue instanceof RegExp) {
        return matchValue.test(currentPath);
      }
      const targetPath = resolvePath(typeof matchValue === "string" && !["exact", "startsWith", "prefix", "section"].includes(matchValue.toLowerCase())
        ? matchValue
        : to);
      if (!targetPath) return false;
      const mode = matchMode || (typeof matchValue === "string" && ["startsWith", "prefix", "section"].includes(matchValue.toLowerCase()) ? "startsWith" : "exact");
      if (mode === "startswith" || mode === "prefix" || mode === "section") {
        return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
      }
      if (router?.isActive) return !!router.isActive(to);
      return currentPath === targetPath;
    };
    const getDisabled = () => !!uiUnwrap(props.disabled);
    let manualActive = null;
    const getActive = () => {
      if (manualActive != null) return !!manualActive;
      if (hasExplicitActive) return !!uiUnwrap(props.active ?? props.selected);
      return matchCurrentRoute();
    };

    const variant = normalizeVariant(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line")));
    const normalizedState = !uiUnwrap(props.color) && uiUnwrap(props.state)
      ? normalizeState(uiUnwrap(props.state))
      : "";
    const stateClass = normalizedState ? `cms-state-${normalizedState}` : "";
    const p = JSswift.omit(props, [
      "active", "selected", "label", "title", "text", "to", "icon", "iconRight", "iconSize",
      "note", "subtitle", "caption", "description", "badge", "counter", "count", "aside", "trailing",
      "slots", "state", "color", "dense", "outline", "flat", "glossy", "glow", "glass", "gradient",
      "textGradient", "lightShadow", "shadow", "rounded", "radius", "textColor", "variant", "pills",
      "soft", "block", "fill", "match", "matchMode", "activeMatch", "routeMatch", "exact",
      "startsWith", "external", "onNavigate"
    ]);
    p.href = getHref();
    p.class = uiClass([
      "cms-route-tab",
      "cms-clear-set",
      "cms-singularity",
      `variant-${variant}`,
      uiWhen(props.block ?? props.fill, "block"),
      uiWhen(props.dense, "dense"),
      stateClass,
      props.class
    ]);
    p.style = {
      ...(props.style || {})
    };

    const accent = resolveAccent(props.color ?? props.state);
    if (accent) p.style["--cms-route-tab-accent"] = accent;

    const iconSize = props.iconSize ?? props.size ?? null;
    const resolveIconNode = (value, as) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return null;
      if (typeof raw === "string") return UI.Icon({ name: raw, size: iconSize });
      return JSswift.ui.slot(raw, { as });
    };
    const ctx = () => ({
      active: getActive(),
      disabled: getDisabled(),
      href: getHref(),
      to: getTo(),
      external: isExternalLink(getHref()),
      navigate: (event) => {
        if (getDisabled()) return false;
        const nextTo = getTo();
        const external = isExternalLink(getHref());
        if (!external && nextTo && router?.navigate) {
          if (event?.preventDefault) event.preventDefault();
          router.navigate(nextTo);
          props.onNavigate?.(nextTo, event || null);
          return true;
        }
        props.onNavigate?.(nextTo || getHref(), event || null);
        return false;
      }
    });

    const iconNodes = renderSlotToArray(slots, "icon", ctx(), resolveIconNode(props.icon, "icon"));
    const labelNodes = renderSlotToArray(
      slots,
      "label",
      ctx(),
      props.label ?? props.title ?? props.text ?? children
    );
    const noteNodes = renderSlotToArray(
      slots,
      "note",
      ctx(),
      props.note ?? props.subtitle ?? props.caption ?? props.description
    );
    const badgeNodes = renderSlotToArray(
      slots,
      "badge",
      ctx(),
      props.badge ?? props.counter ?? props.count
    );
    const asideNodes = renderSlotToArray(
      slots,
      "aside",
      ctx(),
      props.aside ?? props.trailing ?? resolveIconNode(props.iconRight, "iconRight")
    );
    const defaultNodes = renderSlotToArray(slots, "default", ctx(), props.content ?? props.body);

    const content = _.span({ class: "cms-route-tab-inner" },
      iconNodes.length ? _.span({ class: "cms-route-tab-icon" }, ...iconNodes) : null,
      _.span({ class: "cms-route-tab-copy" },
        _.span({ class: "cms-route-tab-label" }, ...(labelNodes.length ? labelNodes : [getTo() || getHref() || ""])),
        noteNodes.length ? _.span({ class: "cms-route-tab-note" }, ...noteNodes) : null,
        defaultNodes.length ? _.span({ class: "cms-route-tab-extra" }, ...defaultNodes) : null
      ),
      badgeNodes.length ? _.span({ class: "cms-route-tab-badge" }, ...badgeNodes) : null,
      asideNodes.length ? _.span({ class: "cms-route-tab-aside" }, ...asideNodes) : null
    );

    const wrap = _.a(p, content);
    setPropertyProps(wrap, props);

    const syncState = () => {
      const active = getActive();
      const disabled = getDisabled();
      const href = getHref();
      const external = isExternalLink(href);
      wrap.classList.toggle("active", active);
      wrap.classList.toggle("is-disabled", disabled);
      wrap.classList.toggle("is-external", external);
      if (active) wrap.setAttribute("aria-current", String(uiUnwrap(props.ariaCurrent) || "page"));
      else wrap.removeAttribute("aria-current");
      wrap.setAttribute("href", href || "#");
      if (disabled) {
        wrap.setAttribute("aria-disabled", "true");
        wrap.tabIndex = -1;
      } else {
        wrap.removeAttribute("aria-disabled");
        if (!hasOwn("tabIndex") && !hasOwn("tabindex")) wrap.removeAttribute("tabindex");
      }
      if (getTo()) wrap.dataset.to = String(getTo());
      else delete wrap.dataset.to;
      if (external && wrap.target === "_blank" && !wrap.rel) wrap.rel = "noopener noreferrer";
    };

    const userOnClick = props.onClick;
    wrap.onclick = (e) => {
      userOnClick?.(e);
      if (e.defaultPrevented) return;
      if (getDisabled()) {
        e.preventDefault();
        return;
      }
      ctx().navigate(e);
    };

    if (!hasExplicitActive && getTo() && router?.subscribe) {
      router.subscribe(() => syncState());
    }
    JSswift.reactive.effect(() => {
      syncState();
    }, "UI.RouteTab:render");

    wrap._isActive = () => getActive();
    wrap._setActive = (value) => {
      manualActive = value == null ? null : !!value;
      syncState();
      return wrap;
    };
    wrap._navigate = (event) => ctx().navigate(event);
    return wrap;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.RouteTab = {
      signature: "UI.RouteTab(...children) | UI.RouteTab(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        to: "string",
        href: "string",
        active: "boolean",
        selected: "Alias of active",
        match: "\"exact\"|\"startsWith\"|RegExp|Function|string",
        matchMode: "\"exact\"|\"startsWith\"",
        exact: "boolean",
        startsWith: "boolean",
        note: "String|Node|Function|Array",
        badge: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        aside: "Node|Function|Array",
        variant: "\"line\"|\"pills\"|\"soft\"",
        disabled: "boolean",
        block: "boolean",
        state: "string",
        color: "string",
        slots: "{ icon?, label?, note?, badge?, aside?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        icon: "Leading icon content",
        label: "Main label content",
        note: "Secondary note/caption",
        badge: "Badge / counter area",
        aside: "Trailing visual/action area",
        default: "Extra content under the note"
      },
      events: {
        onClick: "MouseEvent",
        onNavigate: "(to, event)"
      },
      returns: "HTMLAnchorElement con ._isActive(), ._setActive(boolean|null), ._navigate(event?)",
      description: "Standardized tab/link for router or href navigation, with structured slots, states, and badges."
    };
  }
  // Esempio: JSswift.ui.RouteTab({ label: "Home", to: "/" })

  UI.Breadcrumbs = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const router = JSswift.router || app?.router || null;
    const model = resolveModel(props.model, "UI.Breadcrumbs:model");
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && JSswift.uiSizes?.includes(v)) ? `cms-size-${v}` : "";
    });
    const variantClass = uiComputed(props.variant, () => {
      const raw = String(uiUnwrap(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line"))) || "").toLowerCase();
      if (raw === "pill" || raw === "pills") return "variant-pills";
      if (raw === "soft" || raw === "card") return "variant-soft";
      return "variant-line";
    });
    const nowrapClass = uiComputed([props.wrap, props.nowrap], () => {
      return (uiUnwrap(props.wrap) === false || !!uiUnwrap(props.nowrap)) ? "no-wrap" : "";
    });
    const wrap = _.nav({
      class: uiClass([
        "cms-breadcrumbs",
        "cms-clear-set",
        sizeClass,
        variantClass,
        nowrapClass,
        uiWhen(props.dense, "dense"),
        props.class
      ]),
      style: { ...(props.style || {}) },
      role: "navigation",
      "aria-label": props.ariaLabel || "Breadcrumb"
    });
    const beforeEl = _.div({ class: "cms-breadcrumbs-before" });
    const listEl = _.ol({ class: "cms-breadcrumbs-list" });
    const afterEl = _.div({ class: "cms-breadcrumbs-after" });
    wrap.appendChild(beforeEl);
    wrap.appendChild(listEl);
    wrap.appendChild(afterEl);

    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return JSswift.uiColors?.includes(raw) ? `var(--cms-${raw})` : String(raw);
    };
    const isExternalLink = (entry) => {
      if (!entry) return false;
      if (uiUnwrap(entry.external) === true) return true;
      const href = uiUnwrap(entry.href ?? entry.to);
      if (!href) return false;
      return /^(mailto:|tel:|https?:\/\/|\/\/)/i.test(String(href));
    };
    const cloneIfNode = (value) => {
      if (value?.nodeType && value.cloneNode) return value.cloneNode(true);
      return value;
    };
    const renderInto = (host, nodes) => {
      host.innerHTML = "";
      nodes.forEach((node) => host.appendChild(node));
    };
    const renderNamedSlot = (slotBag, name, ctx, fallback, alias = null) => {
      const primary = JSswift.ui.getSlot(slotBag, name) != null
        ? renderSlotToArray(slotBag, name, ctx, fallback)
        : [];
      if (primary.length) return primary;
      if (alias && JSswift.ui.getSlot(slotBag, alias) != null) {
        return renderSlotToArray(slotBag, alias, ctx, fallback);
      }
      return renderSlotToArray(null, "default", ctx, fallback);
    };
    const resolveIconNode = (value, size, as) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return null;
      if (typeof raw === "string") return UI.Icon({ name: raw, size });
      return JSswift.ui.slot(raw, { as });
    };
    const normalizeItems = () => {
      const source = model ? model.get() : uiUnwrap(props.items ?? props.value ?? props.breadcrumbs);
      const list = [];
      const pushItem = (entry) => {
        if (entry == null || entry === false) return;
        if (Array.isArray(entry)) {
          entry.forEach(pushItem);
          return;
        }
        if (typeof entry === "string" || typeof entry === "number") {
          list.push({ label: String(entry) });
          return;
        }
        if (entry?.nodeType || typeof entry === "function") {
          list.push({ label: entry });
          return;
        }
        list.push(entry);
      };

      const home = uiUnwrap(props.home);
      if (home) {
        pushItem(home === true ? { label: "Home", to: "/", icon: "home" } : home);
      }
      pushItem(source);
      if (!list.length && children?.length) {
        children.forEach((child) => pushItem(child));
      }
      return list.filter((item) => !uiUnwrap(item?.hidden));
    };
    const getCurrentIndex = (items) => {
      const explicitIndex = items.findIndex((item) => !!uiUnwrap(item?.current ?? item?.active ?? item?.selected));
      if (explicitIndex > -1) return explicitIndex;
      return uiUnwrap(props.autoCurrent) === false ? -1 : (items.length ? items.length - 1 : -1);
    };
    const collapseItems = (items) => {
      const maxRaw = Number(uiUnwrap(props.max ?? props.maxItems ?? props.collapseAfter ?? props.collapse));
      const max = Number.isFinite(maxRaw) ? Math.max(0, Math.trunc(maxRaw)) : 0;
      if (!max || max < 3 || items.length <= max) {
        return items.map((item, index) => ({ type: "item", item, index, key: `item-${index}` }));
      }

      let leading = Number(uiUnwrap(props.leadingCount ?? props.keepStart ?? 1));
      let trailing = Number(uiUnwrap(props.trailingCount ?? props.keepEnd ?? Math.max(1, max - 2)));
      leading = Number.isFinite(leading) ? Math.max(1, Math.trunc(leading)) : 1;
      trailing = Number.isFinite(trailing) ? Math.max(1, Math.trunc(trailing)) : Math.max(1, max - 2);
      if (leading + trailing + 1 > max) {
        trailing = Math.max(1, max - leading - 1);
        if (leading + trailing + 1 > max) leading = Math.max(1, max - trailing - 1);
      }
      if (leading + trailing >= items.length) {
        return items.map((item, index) => ({ type: "item", item, index, key: `item-${index}` }));
      }

      const entries = [];
      for (let i = 0; i < leading; i++) {
        entries.push({ type: "item", item: items[i], index: i, key: `item-${i}` });
      }
      const hiddenItems = items.slice(leading, items.length - trailing);
      entries.push({
        type: "collapsed",
        key: `collapsed-${leading}-${items.length - trailing}`,
        items: hiddenItems,
        from: leading,
        to: items.length - trailing - 1
      });
      for (let i = items.length - trailing; i < items.length; i++) {
        entries.push({ type: "item", item: items[i], index: i, key: `item-${i}` });
      }
      return entries;
    };
    const navigateItem = (item, event = null) => {
      if (!item) return false;
      const href = uiUnwrap(item.href ?? item.to) || "";
      const to = uiUnwrap(item.to) || "";
      if (!isExternalLink(item) && to && router?.navigate) {
        if (event?.preventDefault) event.preventDefault();
        router.navigate(to);
        item.onNavigate?.(to, event || null);
        props.onNavigate?.(to, item, event || null);
        return true;
      }
      item.onNavigate?.(to || href, event || null);
      props.onNavigate?.(to || href, item, event || null);
      return false;
    };
    const createSeparator = (entry, index, total) => {
      const prev = entry;
      const next = total[index + 1] || null;
      const ctx = { index, entry, previous: prev, next };
      const fallback = cloneIfNode(uiUnwrap((entry?.type === "item" ? entry.item?.separator : null) ?? props.separator ?? "/"));
      const nodes = renderNamedSlot(slots, "separator", ctx, fallback);
      return _.li({ class: "cms-breadcrumbs-separator-item", "aria-hidden": "true" },
        _.span({ class: "cms-breadcrumbs-separator" }, ...nodes)
      );
    };
    const createCollapsedEntry = (entry, items, currentIndex) => {
      const ctx = {
        type: "collapsed",
        collapsed: true,
        items,
        hiddenItems: entry.items,
        currentIndex,
        from: entry.from,
        to: entry.to
      };
      const fallback = _.span({ class: "cms-breadcrumb cms-breadcrumb-collapsed" },
        _.span({ class: "cms-breadcrumb-inner" },
          _.span({ class: "cms-breadcrumb-copy" },
            _.span({ class: "cms-breadcrumb-label" }, String(uiUnwrap(props.collapsedLabel) || "…"))
          )
        )
      );
      const nodes = renderNamedSlot(slots, "collapsed", ctx, fallback, "item");
      return _.li({ class: "cms-breadcrumbs-entry is-collapsed" }, ...nodes);
    };
    const createItemEntry = (entry, items, currentIndex, visibleIndex) => {
      const item = entry.item || {};
      const slotBag = item.slots ? { ...slots, ...item.slots } : slots;
      const href = uiUnwrap(item.href ?? item.to) || "";
      const disabled = !!uiUnwrap(item.disabled);
      const current = entry.index === currentIndex;
      const iconSize = item.iconSize ?? props.itemSize ?? props.size ?? null;
      const accent = resolveAccent(item.color ?? item.state ?? props.color ?? props.state);
      const state = !uiUnwrap(item.color) && uiUnwrap(item.state)
        ? normalizeState(uiUnwrap(item.state))
        : "";
      const labelFallback = item.label ?? item.title ?? item.text ?? item.to ?? item.href ?? "";
      const noteFallback = item.note ?? item.subtitle ?? item.caption ?? item.description;
      const badgeFallback = item.badge ?? item.counter ?? item.count;
      const asideFallback = item.aside ?? item.trailing ?? resolveIconNode(item.iconRight, iconSize, "iconRight");
      const defaultFallback = item.content ?? item.body;
      const ctx = {
        item,
        index: entry.index,
        visibleIndex,
        total: items.length,
        current,
        active: current,
        disabled,
        href,
        to: uiUnwrap(item.to) || "",
        external: isExternalLink(item),
        isFirst: entry.index === 0,
        isLast: entry.index === items.length - 1,
        navigate: (event) => navigateItem(item, event)
      };

      const iconNodes = renderNamedSlot(slotBag, "icon", ctx, resolveIconNode(item.icon, iconSize, "icon"));
      const labelNodes = renderNamedSlot(slotBag, "label", ctx, labelFallback);
      const noteNodes = renderNamedSlot(slotBag, "note", ctx, noteFallback);
      const badgeNodes = renderNamedSlot(slotBag, "badge", ctx, badgeFallback);
      const asideNodes = renderNamedSlot(slotBag, "aside", ctx, asideFallback);
      const defaultNodes = renderNamedSlot(slotBag, "default", ctx, defaultFallback);

      const content = _.span({ class: "cms-breadcrumb-inner" },
        iconNodes.length ? _.span({ class: "cms-breadcrumb-icon" }, ...iconNodes) : null,
        _.span({ class: "cms-breadcrumb-copy" },
          _.span({ class: "cms-breadcrumb-label" }, ...(labelNodes.length ? labelNodes : [href || ""])),
          noteNodes.length ? _.span({ class: "cms-breadcrumb-note" }, ...noteNodes) : null,
          defaultNodes.length ? _.span({ class: "cms-breadcrumb-extra" }, ...defaultNodes) : null
        ),
        badgeNodes.length ? _.span({ class: "cms-breadcrumb-badge" }, ...badgeNodes) : null,
        asideNodes.length ? _.span({ class: "cms-breadcrumb-aside" }, ...asideNodes) : null
      );

      const interactive = !disabled && (!current || !!uiUnwrap(item.linkCurrent ?? props.linkCurrent));
      const sharedProps = {
        class: uiClass([
          "cms-breadcrumb",
          "cms-clear-set",
          "cms-singularity",
          uiWhen(current, "is-current"),
          uiWhen(current, "active"),
          uiWhen(disabled, "is-disabled"),
          state ? `cms-state-${state}` : "",
          item.class
        ]),
        style: {
          ...(item.style || {})
        },
        "aria-current": current ? String(uiUnwrap(item.ariaCurrent ?? props.ariaCurrent) || "page") : null
      };
      if (accent) sharedProps.style["--cms-breadcrumb-accent"] = accent;

      let node = null;
      if (interactive && href) {
        node = _.a({
          ...sharedProps,
          href,
          target: item.target,
          rel: item.rel,
          onClick: (event) => {
            item.onClick?.(event, ctx);
            props.onItemClick?.(item, ctx, event);
            if (event.defaultPrevented) return;
            ctx.navigate(event);
          }
        }, content);
        if (ctx.external && node.target === "_blank" && !node.rel) node.rel = "noopener noreferrer";
      } else if (interactive && typeof item.onClick === "function") {
        node = _.button({
          ...sharedProps,
          type: item.type || "button",
          onClick: (event) => {
            item.onClick?.(event, ctx);
            props.onItemClick?.(item, ctx, event);
          }
        }, content);
      } else {
        node = _.span({
          ...sharedProps,
          "aria-disabled": disabled ? "true" : null
        }, content);
      }

      setPropertyProps(node, {
        size: item.size ?? props.itemSize ?? props.size,
        radius: item.radius ?? props.radius,
        gradient: item.gradient ?? props.gradient
      });

      const fallback = node;
      const rendered = renderNamedSlot(slotBag, "item", ctx, fallback);
      return _.li({
        class: uiClass([
          "cms-breadcrumbs-entry",
          uiWhen(current, "is-current"),
          uiWhen(disabled, "is-disabled")
        ])
      }, ...rendered);
    };
    const render = () => {
      const items = normalizeItems();
      const currentIndex = getCurrentIndex(items);
      const visibleItems = collapseItems(items);
      const accent = resolveAccent(props.color ?? props.state);
      wrap.classList.toggle("is-empty", items.length === 0);
      if (accent) wrap.style.setProperty("--cms-breadcrumb-accent", accent);
      else wrap.style.removeProperty("--cms-breadcrumb-accent");

      const rootCtx = {
        items,
        visibleItems,
        currentIndex,
        count: items.length,
        collapsed: visibleItems.some((entry) => entry.type === "collapsed")
      };
      renderInto(beforeEl, renderNamedSlot(slots, "before", rootCtx, props.before));
      renderInto(afterEl, renderNamedSlot(slots, "after", rootCtx, props.after));

      listEl.innerHTML = "";
      if (!items.length) {
        const emptyNodes = renderNamedSlot(slots, "empty", rootCtx, props.empty);
        if (emptyNodes.length) listEl.appendChild(_.li({ class: "cms-breadcrumbs-entry is-empty" }, ...emptyNodes));
        return;
      }

      visibleItems.forEach((entry, visibleIndex) => {
        if (visibleIndex > 0) listEl.appendChild(createSeparator(visibleItems[visibleIndex - 1], visibleIndex - 1, visibleItems));
        listEl.appendChild(
          entry.type === "collapsed"
            ? createCollapsedEntry(entry, items, currentIndex)
            : createItemEntry(entry, items, currentIndex, visibleIndex)
        );
      });
    };

    app.reactive.effect(() => {
      render();
    }, "UI.Breadcrumbs:render");

    wrap.getItems = () => normalizeItems();
    wrap.getVisibleItems = () => collapseItems(normalizeItems());
    wrap.refresh = () => {
      render();
      return wrap;
    };
    wrap.setItems = (next) => {
      if (model) model.set(next);
      else props.items = next;
      render();
      return wrap;
    };
    setPropertyProps(wrap, props);
    return wrap;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Breadcrumbs = {
      signature: "UI.Breadcrumbs(props)",
      props: {
        items: "Array<string|number|Node|Function|{ label?, to?, href?, icon?, note?, badge?, current?, disabled?, hidden?, slots? }>",
        model: "[get,set] signal|Array",
        home: "boolean|Object",
        separator: "string|Node|Function",
        before: "Node|Function|Array",
        after: "Node|Function|Array",
        empty: "Node|Function|Array",
        variant: "\"line\"|\"pills\"|\"soft\"",
        max: "number",
        leadingCount: "number",
        trailingCount: "number",
        dense: "boolean",
        wrap: "boolean",
        nowrap: "boolean",
        linkCurrent: "boolean",
        color: "string",
        state: "string",
        itemSize: "string|number",
        ariaLabel: "string",
        class: "string",
        style: "object"
      },
      slots: {
        before: "Content before breadcrumb list",
        after: "Content after breadcrumb list",
        item: "Full renderer for a breadcrumb entry",
        icon: "Leading icon for each breadcrumb",
        label: "Main breadcrumb label",
        note: "Secondary line for the breadcrumb",
        badge: "Badge/counter area",
        aside: "Trailing area",
        default: "Extra content under note",
        separator: "Separator renderer",
        collapsed: "Renderer for collapsed middle items",
        empty: "Renderer for empty state"
      },
      events: {
        onItemClick: "(item, ctx, event)",
        onNavigate: "(toOrHref, item, event)"
      },
      returns: "HTMLElement <nav> con .getItems(), .getVisibleItems(), .refresh(), .setItems(items)",
      description: "Breadcrumbs standardizzati con item strutturati, slot completi, collapse automatico e supporto a link/router."
    };
  }
  // Esempio: JSswift.ui.Breadcrumbs({ items: [{ label: "Home", to: "/" }, { label: "Pagina" }] })

  UI.Pagination = (...args) => {
    const { props } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const model = resolveModel(props.model, "UI.Pagination:model");
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? `cms-size-${v}` : "";
    });
    const wrap = _.nav({
      class: uiClass([
        "cms-pagination",
        "cms-clear-set",
        sizeClass,
        uiWhen(props.dense, "dense"),
        uiWhen(props.simple, "is-simple"),
        uiWhen(props.disabled, "is-disabled"),
        props.class
      ]),
      style: { ...(props.style || {}) },
      role: "navigation",
      "aria-label": props.ariaLabel || "Pagination"
    });
    const controls = _.div({ class: "cms-pagination-controls" });
    const startGroup = _.div({ class: "cms-pagination-start" });
    const pagesGroup = _.div({ class: "cms-pagination-pages" });
    const endGroup = _.div({ class: "cms-pagination-end" });
    const summary = _.div({ class: "cms-pagination-summary" });

    controls.appendChild(startGroup);
    controls.appendChild(pagesGroup);
    controls.appendChild(endGroup);
    wrap.appendChild(controls);
    wrap.appendChild(summary);

    let currentPage = 1;
    let currentPages = 1;

    const toInt = (value, fallback = 0) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return fallback;
      const n = Number(raw);
      if (!Number.isFinite(n)) return fallback;
      return Math.trunc(n);
    };
    const clampPage = (page, pages = getPages()) => {
      const raw = Number(page);
      const next = Number.isFinite(raw) ? Math.trunc(raw) : 1;
      return Math.min(Math.max(next || 1, 1), Math.max(1, pages || 1));
    };
    const getPages = () => {
      const explicit = toInt(props.max ?? props.pages ?? props.pageCount ?? props.totalPages, 0);
      if (explicit > 0) return explicit;
      const total = toInt(props.total ?? props.totalItems ?? props.count, 0);
      const pageSize = toInt(props.pageSize ?? props.perPage ?? props.limit, 0);
      if (total >= 0 && pageSize > 0) return Math.max(1, Math.ceil(total / pageSize));
      return 1;
    };
    const getRequestedPage = () => {
      if (model) return toInt(model.get(), 1);
      return toInt(props.page ?? props.value ?? props.current ?? props.currentPage, 1);
    };
    const getSiblingCount = () => Math.max(0, toInt(props.siblings ?? props.siblingCount ?? props.window, 1));
    const getBoundaryCount = () => Math.max(0, toInt(props.boundaryCount ?? props.boundaries ?? props.edges, 1));
    const isDisabled = () => !!uiUnwrap(props.disabled);
    const showSummary = () => uiUnwrap(props.showSummary ?? props.showLabel) !== false;
    const showNumbers = () => uiUnwrap(props.showPages) !== false && !uiUnwrap(props.simple);
    const showPrev = () => uiUnwrap(props.showPrev) !== false;
    const showNext = () => uiUnwrap(props.showNext) !== false;
    const showEdges = () => !!uiUnwrap(props.showEdges);
    const showFirst = () => {
      const value = uiUnwrap(props.showFirst);
      return value == null ? showEdges() : !!value;
    };
    const showLast = () => {
      const value = uiUnwrap(props.showLast);
      return value == null ? showEdges() : !!value;
    };
    const hideOnSinglePage = () => !!uiUnwrap(props.hideOnSinglePage);
    const getTotal = () => {
      const total = uiUnwrap(props.total ?? props.totalItems ?? props.count);
      if (total == null || total === "") return null;
      const n = Number(total);
      return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : null;
    };
    const getPageSize = () => {
      const pageSize = uiUnwrap(props.pageSize ?? props.perPage ?? props.limit);
      if (pageSize == null || pageSize === "") return null;
      const n = Number(pageSize);
      return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
    };
    const getCtx = (page = currentPage, pages = currentPages) => {
      const total = getTotal();
      const pageSize = getPageSize();
      const from = total != null && pageSize ? (total === 0 ? 0 : ((page - 1) * pageSize) + 1) : null;
      const to = total != null && pageSize ? Math.min(total, page * pageSize) : null;
      return {
        page,
        value: page,
        current: page,
        currentPage: page,
        pages,
        max: pages,
        total,
        pageSize,
        from,
        to,
        disabled: isDisabled(),
        isFirst: page <= 1,
        isLast: page >= pages,
        canPrev: page > 1,
        canNext: page < pages,
        setPage: (nextPage, event) => commitPage(nextPage, event),
        prev: (event) => commitPage(page - 1, event),
        next: (event) => commitPage(page + 1, event),
        first: (event) => commitPage(1, event),
        last: (event) => commitPage(pages, event)
      };
    };
    const buildItems = (page, pages) => {
      if (pages <= 0) return [];
      const items = [];
      const included = new Set();
      const boundary = getBoundaryCount();
      const siblings = getSiblingCount();

      for (let i = 1; i <= Math.min(boundary, pages); i++) included.add(i);
      for (let i = Math.max(1, page - siblings); i <= Math.min(pages, page + siblings); i++) included.add(i);
      for (let i = Math.max(1, pages - boundary + 1); i <= pages; i++) included.add(i);

      let last = 0;
      for (let i = 1; i <= pages; i++) {
        if (!included.has(i)) continue;
        if (last && i - last > 1) items.push({ type: "ellipsis", key: `ellipsis-${last}-${i}` });
        items.push({ type: "page", page: i, key: `page-${i}` });
        last = i;
      }
      if (!items.length) items.push({ type: "page", page: 1, key: "page-1" });
      return items;
    };
    const renderNamedSlot = (name, fallback, ctx, alias = null) => {
      const primary = JSswift.ui.getSlot(slots, name) != null
        ? renderSlotToArray(slots, name, ctx, fallback)
        : [];
      if (primary.length) return primary;
      if (alias && JSswift.ui.getSlot(slots, alias) != null) {
        return renderSlotToArray(slots, alias, ctx, fallback);
      }
      return renderSlotToArray(null, "default", ctx, fallback);
    };
    const renderInto = (host, nodes) => {
      host.innerHTML = "";
      nodes.forEach((node) => host.appendChild(node));
    };
    const createButton = (name, fallback, onClick, options = {}) => {
      const ctx = { ...getCtx(), kind: name, active: !!options.active };
      return UI.Btn({
        class: uiClass([
          "cms-pagination-btn",
          `cms-pagination-${name}`,
          uiWhen(options.active, "active"),
          options.class
        ]),
        size: props.itemSize || props.size || (props.dense ? "sm" : "md"),
        color: options.active ? (props.color || props.state || "primary") : (options.color || null),
        outline: options.active ? false : (options.outline ?? true),
        disabled: isDisabled() || !!options.disabled,
        "aria-current": options.active ? "page" : null,
        onClick: (event) => {
          if (isDisabled() || options.disabled) return;
          onClick?.(event);
        }
      }, ...renderNamedSlot(name, fallback, ctx, name === "summary" ? "label" : (name === "page" ? "item" : null)));
    };
    const render = (page, pages) => {
      currentPage = clampPage(page, pages);
      currentPages = Math.max(1, pages || 1);
      const ctx = getCtx(currentPage, currentPages);

      wrap.style.display = hideOnSinglePage() && currentPages <= 1 ? "none" : "";
      summary.style.display = showSummary() ? "" : "none";
      pagesGroup.style.display = showNumbers() ? "" : "none";

      startGroup.innerHTML = "";
      pagesGroup.innerHTML = "";
      endGroup.innerHTML = "";

      const startNodes = renderNamedSlot("start", props.start, ctx);
      if (startNodes.length) {
        startGroup.appendChild(_.div({ class: "cms-pagination-extra cms-pagination-extra-start" }, ...startNodes));
      }

      if (showFirst()) {
        startGroup.appendChild(createButton("first", "«", (event) => commitPage(1, event), {
          disabled: currentPage <= 1
        }));
      }
      if (showPrev()) {
        startGroup.appendChild(createButton("prev", "Prev", (event) => commitPage(currentPage - 1, event), {
          disabled: currentPage <= 1
        }));
      }

      if (showNumbers()) {
        buildItems(currentPage, currentPages).forEach((item) => {
          if (item.type === "ellipsis") {
            const ellipsisCtx = { ...ctx, kind: "ellipsis" };
            const ellipsisNodes = renderNamedSlot("ellipsis", "…", ellipsisCtx);
            pagesGroup.appendChild(_.span({ class: "cms-pagination-ellipsis", "aria-hidden": "true" }, ...ellipsisNodes));
            return;
          }
          const itemPage = item.page;
          const itemCtx = { ...ctx, page: itemPage, value: itemPage, item, active: itemPage === currentPage };
          pagesGroup.appendChild(UI.Btn({
            class: uiClass([
              "cms-pagination-btn",
              "cms-pagination-page-btn",
              uiWhen(itemPage === currentPage, "active")
            ]),
            size: props.itemSize || props.size || (props.dense ? "sm" : "md"),
            color: itemPage === currentPage ? (props.color || props.state || "primary") : null,
            outline: itemPage === currentPage ? false : true,
            disabled: isDisabled(),
            "aria-current": itemPage === currentPage ? "page" : null,
            onClick: (event) => commitPage(itemPage, event)
          }, ...renderNamedSlot("page", String(itemPage), itemCtx, "item")));
        });
      }

      if (showNext()) {
        endGroup.appendChild(createButton("next", "Next", (event) => commitPage(currentPage + 1, event), {
          disabled: currentPage >= currentPages
        }));
      }
      if (showLast()) {
        endGroup.appendChild(createButton("last", "»", (event) => commitPage(currentPages, event), {
          disabled: currentPage >= currentPages
        }));
      }

      const endNodes = renderNamedSlot("end", props.end, ctx);
      if (endNodes.length) {
        endGroup.appendChild(_.div({ class: "cms-pagination-extra cms-pagination-extra-end" }, ...endNodes));
      }

      let summaryText = `Pagina ${currentPage} di ${currentPages}`;
      if (ctx.total != null && ctx.pageSize) {
        summaryText = ctx.total === 0
          ? "0 risultati"
          : `${ctx.from}-${ctx.to} di ${ctx.total}`;
      }
      renderInto(summary, renderNamedSlot("summary", summaryText, ctx, "label"));
    };
    const commitPage = (page, event = null) => {
      const pages = getPages();
      const nextPage = clampPage(page, pages);
      if (nextPage === currentPage && pages === currentPages) return nextPage;
      render(nextPage, pages);
      if (model && model.get() !== nextPage) model.set(nextPage);
      props.onChange?.(nextPage, getCtx(nextPage, pages), event);
      props.onPageChange?.(nextPage, getCtx(nextPage, pages), event);
      return nextPage;
    };

    app.reactive.effect(() => {
      const pages = getPages();
      const requested = getRequestedPage();
      const nextPage = clampPage(requested, pages);
      render(nextPage, pages);
      if (model && requested !== nextPage) model.set(nextPage);
    }, "UI.Pagination:sync");

    wrap.getPage = () => currentPage;
    wrap.getPages = () => currentPages;
    wrap.setPage = (page) => commitPage(page);
    wrap.prev = () => commitPage(currentPage - 1);
    wrap.next = () => commitPage(currentPage + 1);
    wrap.first = () => commitPage(1);
    wrap.last = () => commitPage(currentPages);
    setPropertyProps(wrap, props);
    return wrap;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Pagination = {
      signature: "UI.Pagination(props)",
      props: {
        max: "number",
        pages: "number",
        total: "number",
        pageSize: "number",
        value: "number",
        page: "number",
        model: "[get,set] signal",
        showPages: "boolean",
        showSummary: "boolean",
        showLabel: "boolean",
        showPrev: "boolean",
        showNext: "boolean",
        showFirst: "boolean",
        showLast: "boolean",
        showEdges: "boolean",
        siblings: "number",
        boundaryCount: "number",
        hideOnSinglePage: "boolean",
        size: "xxs|xs|sm|md|lg|xl|xxl|xxxl",
        dense: "boolean",
        simple: "boolean",
        color: "primary|secondary|warning|danger|success|info|light|dark",
        state: "primary|secondary|warning|danger|success|info|light|dark",
        slots: "{ start?, end?, first?, prev?, page?, item?, ellipsis?, next?, last?, summary?, label? }",
        class: "string",
        style: "object"
      },
      slots: {
        start: "Content before the controls",
        end: "Content after the controls",
        first: "First button content",
        prev: "Prev button content",
        page: "Page item content (ctx: { page, active, pages })",
        item: "Alias of page",
        ellipsis: "Ellipsis content",
        next: "Next button content",
        last: "Last button content",
        summary: "Summary content",
        label: "Alias legacy di summary"
      },
      events: {
        onChange: "(page, ctx, event)",
        onPageChange: "(page, ctx, event)"
      },
      returns: "HTMLElement <nav>",
      description: "Paginazione standard con controlli edge, numeri, ellissi, summary e supporto total/pageSize."
    };
  }
  // Esempio: JSswift.ui.Pagination({ total: 120, pageSize: 12, model: [get,set], showEdges: true })

