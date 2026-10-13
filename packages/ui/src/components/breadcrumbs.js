
  UI.Breadcrumbs = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const router = JSswift.router || app?.router || null;
    const model = resolveModel(props.model, "UI.Breadcrumbs:model");
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && JSswift.uiSizes?.includes(v)) ? `jss-size-${v}` : "";
    });
    const variantClass = uiComputed(props.variant, () => {
      const raw = String(uiUnwrap(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line"))) || "").toLowerCase();
      if (raw === "pill" || raw === "pills") return "variant-pills";
      if (raw === "soft" || raw === "card") return "variant-soft";
      if (raw === "solid") return "variant-solid";
      return "variant-line";
    });
    const nowrapClass = uiComputed([props.wrap, props.nowrap], () => {
      return (uiUnwrap(props.wrap) === false || !!uiUnwrap(props.nowrap)) ? "no-wrap" : "";
    });
    const wrap = _.nav({
      class: uiClass([
        "jss-breadcrumbs",
        "jss-clear-set",
        "jss-singularity",
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
    const beforeEl = _.div({ class: "jss-breadcrumbs-before" });
    const listEl = _.ol({ class: "jss-breadcrumbs-list" });
    const afterEl = _.div({ class: "jss-breadcrumbs-after" });
    wrap.appendChild(beforeEl);
    wrap.appendChild(listEl);
    wrap.appendChild(afterEl);

    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return JSswift.uiColors?.includes(raw) ? `var(--jss-${raw})` : String(raw);
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
      return _.li({ class: "jss-breadcrumbs-separator-item", "aria-hidden": "true" },
        _.span({ class: "jss-breadcrumbs-separator" }, ...nodes)
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
      const fallback = _.span({ class: "jss-breadcrumb jss-breadcrumb-collapsed" },
        _.span({ class: "jss-breadcrumb-inner" },
          _.span({ class: "jss-breadcrumb-copy" },
            _.span({ class: "jss-breadcrumb-label" }, String(uiUnwrap(props.collapsedLabel) || "…"))
          )
        )
      );
      const nodes = renderNamedSlot(slots, "collapsed", ctx, fallback, "item");
      return _.li({ class: "jss-breadcrumbs-entry is-collapsed" }, ...nodes);
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

      const content = _.span({ class: "jss-breadcrumb-inner" },
        iconNodes.length ? _.span({ class: "jss-breadcrumb-icon" }, ...iconNodes) : null,
        _.span({ class: "jss-breadcrumb-copy" },
          _.span({ class: "jss-breadcrumb-label" }, ...(labelNodes.length ? labelNodes : [href || ""])),
          noteNodes.length ? _.span({ class: "jss-breadcrumb-note" }, ...noteNodes) : null,
          defaultNodes.length ? _.span({ class: "jss-breadcrumb-extra" }, ...defaultNodes) : null
        ),
        badgeNodes.length ? _.span({ class: "jss-breadcrumb-badge" }, ...badgeNodes) : null,
        asideNodes.length ? _.span({ class: "jss-breadcrumb-aside" }, ...asideNodes) : null
      );

      const interactive = !disabled && (!current || !!uiUnwrap(item.linkCurrent ?? props.linkCurrent));
      const sharedProps = {
        class: uiClass([
          "jss-breadcrumb",
          "jss-clear-set",
          "jss-singularity",
          uiWhen(current, "is-current"),
          uiWhen(current, "active"),
          uiWhen(disabled, "is-disabled"),
          state ? `jss-state-${state}` : "",
          item.class
        ]),
        style: {
          ...(item.style || {})
        },
        "aria-current": current ? String(uiUnwrap(item.ariaCurrent ?? props.ariaCurrent) || "page") : null
      };
      if (accent) sharedProps.style["--jss-breadcrumb-accent"] = accent;

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
          "jss-breadcrumbs-entry",
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
      if (accent) wrap.style.setProperty("--jss-breadcrumb-accent", uiUnwrap(props.color ?? props.state) === "light" ? "#cbd5e1" : accent);
      else wrap.style.removeProperty("--jss-breadcrumb-accent");

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
        if (emptyNodes.length) listEl.appendChild(_.li({ class: "jss-breadcrumbs-entry is-empty" }, ...emptyNodes));
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

  // Esempio: JSswift.ui.Breadcrumbs({ items: [{ label: "Home", to: "/" }, { label: "Pagina" }] })
