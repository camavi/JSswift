  UI.Tabs = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const hasOwn = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);
    const normalizeOrientation = (value) => String(uiUnwrap(value) || "horizontal").toLowerCase() === "vertical" ? "vertical" : "horizontal";
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
      return JSswift.uiColors?.includes(raw) ? `var(--jss-${raw})` : String(raw);
    };
    const isSameValue = (a, b) => Object.is(a, b) || (a != null && b != null && a == b);

    const model = resolveModel(props.model, "UI.Tabs:model");
    const orientation = normalizeOrientation(props.orientation || props.orient || props.direction);
    const variant = normalizeVariant(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line")));
    const fillTabs = !!uiUnwrap(props.fill ?? props.navFill ?? props.stretch);
    const wrapTabs = !!uiUnwrap(props.wrap);
    const disabledAll = !!uiUnwrap(props.disabled);
    const componentId = props.id || (`jss-tabs-` + Math.random().toString(36).slice(2, 9));
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
      "jss-clear-set",
      "jss-tabs",
      "jss-singularity",
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
    if (props.gap != null) wrapProps.style["--jss-tabs-gap"] = toCssSize(props.gap);
    if (props.tabGap != null) wrapProps.style["--jss-tabs-tab-gap"] = toCssSize(props.tabGap);
    const accentColor = resolveAccent(props.color ?? props.state);
    wrapProps.style["--jss-tabs-accent"] = uiUnwrap(props.color ?? props.state) === "light"
      ? "#cbd5e1" : accentColor || "var(--jss-text)";
    const wrap = _.div(wrapProps);

    const bar = _.div({
      class: uiClass(["jss-tabs-bar", props.barClass]),
      style: {
        alignItems: props.align || (orientation === "vertical" ? "stretch" : "center"),
        justifyContent: props.justify || "flex-start",
        ...(props.barStyle || {})
      }
    });
    const nav = _.div({
      class: uiClass(["jss-tabs-nav", props.navClass]),
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
      const fallbackContent = _.span({ class: "jss-tabs-tab-inner" },
        iconNodes.length ? _.span({ class: "jss-tabs-tab-icon" }, ...iconNodes) : null,
        _.span({ class: "jss-tabs-tab-copy" },
          _.span({ class: "jss-tabs-tab-label" }, ...(labelNodes.length ? labelNodes : [""])),
          noteNodes.length ? _.span({ class: "jss-tabs-tab-note" }, ...noteNodes) : null
        ),
        badgeNodes.length ? _.span({ class: "jss-tabs-tab-badge" }, ...badgeNodes) : null
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
          "jss-tabs-item",
          uiWhen(isActive, "active"),
          uiWhen(tab.disabled || disabledAll, "disabled"),
          props.itemClass,
          tab.itemClass
        ]),
        style: {
          ...(itemAccent ? { "--jss-tabs-item-accent": itemAccent } : {}),
          ...(props.itemStyle || {}),
          ...(tab.itemStyle || {})
        },
        "data-name": String(tab.value)
      });
      const btn = UI.Btn({
        class: uiClass([
          "jss-tabs-tab",
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
      renderSlotToArray(slots, "empty", createRootCtx(), props.empty ?? _.div({ class: "jss-tabs-empty" }, "Nessuna tab disponibile."))
        .forEach((node) => nav.appendChild(node));
    }

    const extraCtx = createRootCtx();
    const extraNodes = [
      ...renderSlotToArray(null, "default", {}, JSswift.ui.renderSlot(slots, "extra", extraCtx, null)),
      ...renderSlotToArray(slots, "default", extraCtx, children)
    ];
    bar.appendChild(nav);
    if (extraNodes.length) {
      bar.appendChild(_.div({ class: "jss-tabs-extra" }, ...extraNodes));
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

  // Esempio: JSswift.ui.Tabs({ tabs: [{ label: "Overview", value: "overview", icon: "dashboard" }], model: [get,set] })
