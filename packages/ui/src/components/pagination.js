
  UI.Pagination = (...args) => {
    const { props } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const model = resolveModel(props.model, "UI.Pagination:model");
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? `jss-size-${v}` : "";
    });
    const wrap = _.nav({
      class: uiClass([
        "jss-pagination",
        "jss-clear-set",
        "jss-singularity",
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
    const controls = _.div({ class: "jss-pagination-controls" });
    const startGroup = _.div({ class: "jss-pagination-start" });
    const pagesGroup = _.div({ class: "jss-pagination-pages" });
    const endGroup = _.div({ class: "jss-pagination-end" });
    const summary = _.div({ class: "jss-pagination-summary" });

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
    const activeEffects = (active) => active ? {
      glossy: props.glossy, glow: props.glow, glass: props.glass,
      gradient: props.gradient, textGradient: props.textGradient
    } : {};
    const createButton = (name, fallback, onClick, options = {}) => {
      const ctx = { ...getCtx(), kind: name, active: !!options.active };
      return UI.Btn({
        ...activeEffects(options.active),
        class: uiClass([
          "jss-pagination-btn",
          `jss-pagination-${name}`,
          uiWhen(options.active, "active"),
          options.class
        ]),
        size: props.itemSize || props.size || (props.dense ? "sm" : "md"),
        color: options.active ? (props.color || props.state || null) : (options.color || null),
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
      const color = uiUnwrap(props.color ?? props.state);
      const accent = color == null || color === "" ? "var(--jss-text)"
        : color === "light" ? "#cbd5e1"
        : JSswift.uiColors?.includes(color) ? `var(--jss-${color})` : String(color);
      wrap.style.setProperty("--jss-pagination-accent", accent);

      wrap.style.display = hideOnSinglePage() && currentPages <= 1 ? "none" : "";
      summary.style.display = showSummary() ? "" : "none";
      pagesGroup.style.display = showNumbers() ? "" : "none";

      startGroup.innerHTML = "";
      pagesGroup.innerHTML = "";
      endGroup.innerHTML = "";

      const startNodes = renderNamedSlot("start", props.start, ctx);
      if (startNodes.length) {
        startGroup.appendChild(_.div({ class: "jss-pagination-extra jss-pagination-extra-start" }, ...startNodes));
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
            pagesGroup.appendChild(_.span({ class: "jss-pagination-ellipsis", "aria-hidden": "true" }, ...ellipsisNodes));
            return;
          }
          const itemPage = item.page;
          const itemCtx = { ...ctx, page: itemPage, value: itemPage, item, active: itemPage === currentPage };
          pagesGroup.appendChild(UI.Btn({
            ...activeEffects(itemPage === currentPage),
            class: uiClass([
              "jss-pagination-btn",
              "jss-pagination-page-btn",
              uiWhen(itemPage === currentPage, "active")
            ]),
            size: props.itemSize || props.size || (props.dense ? "sm" : "md"),
            color: itemPage === currentPage ? (props.color || props.state || null) : null,
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
        endGroup.appendChild(_.div({ class: "jss-pagination-extra jss-pagination-extra-end" }, ...endNodes));
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
    const containerProps = { ...props };
    for (const effect of ["glossy", "glow", "glass", "gradient", "textGradient"]) {
      delete containerProps[effect];
    }
    setPropertyProps(wrap, containerProps);
    return wrap;
  };

  // Esempio: JSswift.ui.Pagination({ total: 120, pageSize: 12, model: [get,set], showEdges: true })
