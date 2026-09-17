  UI.Table = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const columns = Array.isArray(props.columns) ? props.columns : [];
    const basePageSizes = tableNormalizePageSizes(props.pageSizeOptions, [5, 10, 20, 50]);
    const initialPageSize = Number(props.pageSize ?? basePageSizes[0] ?? 10) || 10;
    const pageSizes = Array.from(new Set([...basePageSizes, initialPageSize])).sort((a, b) => a - b);
    const initialSort = props.initialSort || (props.sortBy ? { key: props.sortBy, dir: props.sortDir === "desc" ? "desc" : "asc" } : null);
    const searchable = props.searchable === true
      || typeof props.searchable === "string"
      || props.searchPlaceholder != null
      || props.search != null
      || props.query != null
      || !!props.searchModel
      || !!props.queryModel
      || Array.isArray(props.searchKeys)
      || typeof props.searchBy === "function"
      || typeof props.searchPredicate === "function";
    const searchModel = resolveModel(props.searchModel || props.queryModel, "UI.Table:query");

    const [getPage, setPage] = app.reactive.signal(Math.max(1, Number(props.page || 1) || 1));
    const [getPageSize, setPageSizeState] = app.reactive.signal(initialPageSize);
    const [getSort, setSort] = app.reactive.signal(initialSort);
    const [getQuery, setQueryState] = app.reactive.signal(String((searchModel ? searchModel.get() : (props.search ?? props.query)) ?? ""));

    const setQuery = (value) => {
      const next = String(value ?? "");
      setQueryState(next);
      if (searchModel) searchModel.set(next);
      setPage(1);
    };
    const setPageSize = (value) => {
      const next = Number(value) || initialPageSize;
      setPageSizeState(next);
      setPage(1);
    };
    const toggleSort = (col, index) => {
      const nextKey = tableColumnSortKey(col, index);
      const current = getSort();
      if (!current || (current.key !== nextKey && current.key !== col?.key)) setSort({ key: nextKey, dir: "asc" });
      else if (current.dir === "asc") setSort({ key: nextKey, dir: "desc" });
      else setSort(null);
      setPage(1);
    };

    let searchInput = null;
    if (searchModel) {
      searchModel.watch((value) => {
        const next = String(value ?? "");
        setQueryState(next);
        if (searchInput && searchInput.value !== next) searchInput.value = next;
        setPage(1);
      }, "UI.Table:queryWatch");
    }

    const wrapProps = JSswift.omit(props, [
      "columns", "rows", "rowKey", "loading", "page", "pageSize", "pageSizeOptions", "pagination",
      "initialSort", "sortBy", "sortDir", "search", "query", "searchable", "searchPlaceholder",
      "searchKeys", "searchBy", "searchPredicate", "searchModel", "queryModel", "filter",
      "actions", "actionsLabel", "emptyText", "loadingText", "onRowClick", "onRowDblClick",
      "tableClass", "tableStyle", "cardClass", "dense", "striped", "hover", "stickyHeader",
      "toolbar", "toolbarStart", "toolbarEnd", "caption", "footer", "status", "rowClass", "rowAttrs",
      "minTableWidth", "hideHeader", "hideFooter", "slots", "body"
    ]);
    wrapProps.class = uiClass(["cms-table-card", props.class, props.cardClass]);
    if (props.dense != null) wrapProps.dense = props.dense;

    const shell = _.div({ class: "cms-table-shell" });
    const leadNodes = renderSlotToArray(slots, "default", {}, children);
    if (leadNodes.length) shell.appendChild(_.div({ class: "cms-table-lead" }, ...leadNodes));

    const toolbarStartNodes = renderSlotToArray(slots, "toolbarStart", {}, props.toolbarStart);
    const toolbarNodes = renderSlotToArray(slots, "toolbar", {}, props.toolbar);
    const toolbarEndNodes = renderSlotToArray(slots, "toolbarEnd", {}, props.toolbarEnd);

    const toolbar = _.div({ class: "cms-table-toolbar" });
    const toolbarMain = _.div({ class: "cms-table-toolbar-main" });
    const toolbarSide = _.div({ class: "cms-table-toolbar-side" });
    toolbarStartNodes.forEach((node) => toolbarMain.appendChild(node));
    toolbarNodes.forEach((node) => toolbarMain.appendChild(node));

    const searchSlotNodes = renderSlotToArray(slots, "search", { query: getQuery(), getQuery, setQuery }, null);
    if (searchSlotNodes.length) {
      searchSlotNodes.forEach((node) => toolbarSide.appendChild(node));
    } else if (searchable) {
      searchInput = _.input({
        type: "search",
        class: "cms-input",
        placeholder: typeof props.searchable === "string" ? props.searchable : (props.searchPlaceholder || "Cerca nella tabella"),
        value: String(getQuery() || "")
      });
      searchInput.addEventListener("input", () => setQuery(searchInput.value));
      const clearSearch = UI.Btn({
        class: "cms-table-search-clear",
        outline: true,
        onClick: () => {
          if (searchInput) searchInput.value = "";
          setQuery("");
        }
      }, "Reset");
      toolbarSide.appendChild(
        _.div({ class: "cms-singularity cms-table-search" },
          _.span({ class: "cms-table-search-icon", "aria-hidden": "true" }, "⌕"),
          searchInput,
          clearSearch
        )
      );
    }
    toolbarEndNodes.forEach((node) => toolbarSide.appendChild(node));
    if (toolbarMain.childNodes.length || toolbarSide.childNodes.length) {
      toolbar.appendChild(toolbarMain);
      toolbar.appendChild(toolbarSide);
      shell.appendChild(toolbar);
    }

    const statusSummary = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const statusFilter = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const statusSort = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const statusExtraNodes = renderSlotToArray(slots, "status", {}, props.status);
    const status = _.div({ class: "cms-table-status" },
      statusSummary,
      statusFilter,
      statusSort,
      ...statusExtraNodes
    );
    shell.appendChild(status);

    const captionNodes = renderSlotToArray(slots, "caption", {}, props.caption);
    if (captionNodes.length) shell.appendChild(_.div({ class: "cms-table-caption" }, ...captionNodes));

    const thead = _.thead();
    const tbody = _.tbody();
    const hasActions = !!props.actions || !!slots.actions;

    const tableClass = uiClass([
      "cms-table",
      uiWhen(props.dense, "dense"),
      uiWhen(props.striped, "striped"),
      uiWhen(props.hover !== false, "hover"),
      uiWhen(props.stickyHeader !== false, "sticky-head"),
      props.tableClass
    ]);
    const tableStyle = {
      ...(props.tableStyle || {})
    };
    if (props.minTableWidth != null) tableStyle["--cms-table-min-width"] = toCssSize(props.minTableWidth);
    const table = _.table({ class: tableClass, style: tableStyle }, thead, tbody);
    const wrapTable = _.div({ class: "cms-singularity cms-table-wrap" }, table);
    shell.appendChild(wrapTable);

    const pagerInfo = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const pagerMeta = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const btnPrev = UI.Btn({ outline: true, onClick: () => setPage(Math.max(1, getPage() - 1)) }, "‹");
    const btnNext = UI.Btn({ outline: true, onClick: () => setPage(getPage() + 1) }, "›");
    const pageChip = _.div({ class: "cms-singularity cms-table-chip" }, "");
    const sizeSelect = _.select({ class: "cms-input cms-table-size-select" },
      ...pageSizes.map((size) => uiOptionNode({ value: String(size) }, String(size)))
    );
    sizeSelect.value = String(getPageSize());
    sizeSelect.addEventListener("change", () => setPageSize(sizeSelect.value));
    const footerExtraNodes = renderSlotToArray(slots, "footer", {}, props.footer);

    const footer = _.div({ class: "cms-table-foot" },
      _.div({ class: "cms-table-foot-main" },
        pagerInfo,
        pagerMeta,
        _.label({ class: "cms-table-size" },
          _.span("Righe"),
          sizeSelect
        )
      ),
      _.div({ class: "cms-table-foot-extra" },
        ...footerExtraNodes,
        _.div({ class: "cms-table-pager" },
          btnPrev,
          pageChip,
          btnNext
        )
      )
    );
    if (props.hideFooter !== true) shell.appendChild(footer);

    const renderHeader = () => {
      thead.innerHTML = "";
      if (props.hideHeader) return;

      const row = _.tr();
      columns.forEach((col, colIndex) => {
        const ctx = { col, colIndex, sort: getSort() };
        const thStyle = {
          ...tableResolveStyle(col?.style, { ...ctx, header: true }),
          ...tableResolveStyle(col?.headerStyle ?? col?.thStyle, { ...ctx, header: true })
        };
        if (col?.width != null) thStyle.width = toCssSize(col.width);
        if (col?.minWidth != null) thStyle.minWidth = toCssSize(col.minWidth);
        if (col?.maxWidth != null) thStyle.maxWidth = toCssSize(col.maxWidth);
        if (col?.align) thStyle.textAlign = col.align;
        let headerNodes = renderSlotToArray(col?.slots, "header", ctx, null);
        if (!headerNodes.length) {
          const fallback = typeof col?.header === "function" ? col.header(ctx) : (col?.header ?? tableColumnLabel(col));
          headerNodes = renderSlotToArray(slots, "header", ctx, fallback);
        }

        const currentSort = getSort();
        const sortKey = tableColumnSortKey(col, colIndex);
        const isSortable = col?.sortable !== false && (col?.key != null || typeof col?.get === "function" || typeof col?.compare === "function");
        const isActive = !!currentSort && (currentSort.key === sortKey || currentSort.key === col?.key);
        const th = _.th({
          class: uiClass([
            "cms-table-head-cell",
            uiWhen(col?.nowrap, "is-nowrap"),
            uiWhen(isSortable, "cms-table-sortable"),
            uiWhen(isActive, "is-sorted"),
            col?.headerClass
          ]),
          style: thStyle
        });

        if (isSortable) {
          th.appendChild(
            _.button({
              type: "button",
              class: "cms-table-head-button",
              onClick: () => toggleSort(col, colIndex)
            },
              _.span({ class: "cms-table-head-label" }, ...headerNodes),
              _.span({ class: "cms-table-head-arrow", "aria-hidden": "true" },
                isActive ? (currentSort.dir === "asc" ? "↑" : "↓") : "↕"
              )
            )
          );
        } else {
          headerNodes.forEach((node) => th.appendChild(node));
        }
        row.appendChild(th);
      });

      if (hasActions) {
        const actionsHeaderNodes = renderSlotToArray(slots, "actionsHeader", {}, props.actionsLabel || "Azioni");
        row.appendChild(
          _.th({ class: "cms-table-head-cell cms-table-head-actions", style: { textAlign: "right" } }, ...actionsHeaderNodes)
        );
      }
      thead.appendChild(row);
    };

    const renderStateRow = (slotName, fallback) => {
      const ctx = { columns, count: columns.length };
      const nodes = renderSlotToArray(slots, slotName, ctx, fallback);
      const colSpan = String(columns.length + (hasActions ? 1 : 0));
      tbody.appendChild(
        _.tr(
          _.td({ colSpan, class: "cms-table-state" }, ...nodes)
        )
      );
    };

    app.reactive.effect(() => {
      const rows = tableToArray(props.rows);
      const query = String(getQuery() || "").trim();
      const currentSort = getSort();
      const loading = typeof props.loading === "function" ? !!props.loading() : !!props.loading;
      const paginationEnabled = props.pagination !== false;

      renderHeader();
      tbody.innerHTML = "";
      if (searchInput && searchInput.value !== getQuery()) searchInput.value = getQuery();
      if (sizeSelect.value !== String(getPageSize())) sizeSelect.value = String(getPageSize());

      if (loading) {
        statusSummary.textContent = "Caricamento in corso";
        statusFilter.style.display = "none";
        statusSort.style.display = "none";
        pagerInfo.textContent = "Loading…";
        pagerMeta.textContent = "";
        pageChip.textContent = "Pagina 1";
        btnPrev.disabled = true;
        btnNext.disabled = true;
        renderStateRow("loading", props.loadingText || "Loading...");
        return;
      }

      let list = rows.slice();
      const datasetTotal = list.length;
      if (typeof props.filter === "function") {
        list = list.filter((row, index) => props.filter(row, { row, index, query, rows, columns }));
      }
      if (query) {
        list = list.filter((row) => tableMatchesQuery(row, columns, query, props));
      }

      if (currentSort) {
        const sortCol = tableFindColumn(columns, currentSort.key);
        if (sortCol) {
          list.sort((a, b) => {
            const av = tableResolveValue(sortCol, a, -1);
            const bv = tableResolveValue(sortCol, b, -1);
            const out = typeof sortCol.compare === "function"
              ? sortCol.compare(av, bv, a, b)
              : defaultCompare(av, bv);
            return currentSort.dir === "asc" ? out : -out;
          });
        }
      }

      const filteredTotal = list.length;
      const currentPageSize = Math.max(1, Number(getPageSize()) || initialPageSize);
      const pages = paginationEnabled ? Math.max(1, Math.ceil(filteredTotal / currentPageSize)) : 1;
      const page = paginationEnabled ? Math.min(getPage(), pages) : 1;
      if (page !== getPage()) setPage(page);

      const start = paginationEnabled ? (page - 1) * currentPageSize : 0;
      const end = paginationEnabled ? start + currentPageSize : filteredTotal;
      const pageRows = list.slice(start, end);

      statusSummary.textContent = filteredTotal === datasetTotal
        ? `${filteredTotal} righe`
        : `${filteredTotal} di ${datasetTotal} righe`;
      statusFilter.textContent = query ? `Ricerca: ${query}` : "";
      statusFilter.style.display = query ? "" : "none";
      if (currentSort) {
        const sortCol = tableFindColumn(columns, currentSort.key);
        statusSort.textContent = sortCol
          ? `Ordine: ${tableColumnLabel(sortCol)} ${currentSort.dir === "asc" ? "↑" : "↓"}`
          : "";
        statusSort.style.display = sortCol ? "" : "none";
      } else {
        statusSort.style.display = "none";
      }

      pagerInfo.textContent = filteredTotal
        ? `${start + 1}-${Math.min(end, filteredTotal)} di ${filteredTotal}`
        : "0 risultati";
      pagerMeta.textContent = filteredTotal !== datasetTotal ? `Dataset totale ${datasetTotal}` : `Page size ${currentPageSize}`;
      pageChip.textContent = paginationEnabled ? `Pagina ${page} / ${pages}` : "Tutte le righe";
      btnPrev.disabled = !paginationEnabled || page <= 1;
      btnNext.disabled = !paginationEnabled || page >= pages;
      sizeSelect.disabled = !paginationEnabled;
      sizeSelect.parentNode.style.display = paginationEnabled ? "" : "none";

      if (pageRows.length === 0) {
        renderStateRow("empty", props.emptyText || "Nessun dato");
        return;
      }

      for (let pageIndex = 0; pageIndex < pageRows.length; pageIndex++) {
        const row = pageRows[pageIndex];
        const rowIndex = start + pageIndex;
        const rowCtx = { row, rowIndex, pageIndex };
        const rowAttrs = typeof props.rowAttrs === "function" ? (props.rowAttrs(row, rowCtx) || {}) : (props.rowAttrs || {});
        const rowClass = typeof props.rowClass === "function" ? props.rowClass(row, rowCtx) : props.rowClass;
        const isInteractiveRow = !!(props.onRowClick || props.onRowDblClick);
        const tr = _.tr({
          ...rowAttrs,
          class: uiClass([
            "cms-table-row",
            rowClass,
            rowAttrs.class,
            uiWhen(isInteractiveRow, "is-clickable")
          ])
        });

        if (props.rowKey) {
          const key = typeof props.rowKey === "function" ? props.rowKey(row, rowCtx) : tableGetByPath(row, props.rowKey);
          if (key != null) tr.dataset.key = String(key);
        }

        const shouldIgnoreRowEvent = (event) => {
          const target = event?.target;
          return !!(target && target.closest && target.closest("button, a, input, select, textarea, label, [data-table-action]"));
        };
        if (props.onRowClick) {
          tr.addEventListener("click", (event) => {
            if (shouldIgnoreRowEvent(event)) return;
            props.onRowClick(row, rowCtx, event);
          });
        }
        if (props.onRowDblClick) {
          tr.addEventListener("dblclick", (event) => {
            if (shouldIgnoreRowEvent(event)) return;
            props.onRowDblClick(row, rowCtx, event);
          });
        }

        columns.forEach((col, colIndex) => {
          const value = tableResolveValue(col, row, rowIndex);
          const cellCtx = { ...rowCtx, col, colIndex, value };
          const tdStyle = {
            ...tableResolveStyle(col?.style, cellCtx),
            ...tableResolveStyle(col?.cellStyle ?? col?.tdStyle, cellCtx)
          };
          if (col?.align) tdStyle.textAlign = col.align;
          if (col?.width != null) tdStyle.width = toCssSize(col.width);
          if (col?.minWidth != null) tdStyle.minWidth = toCssSize(col.minWidth);
          if (col?.maxWidth != null) tdStyle.maxWidth = toCssSize(col.maxWidth);
          const cellClass = typeof col?.cellClass === "function" ? col.cellClass(row, cellCtx) : (col?.cellClass || col?.class);
          const td = _.td({
            class: uiClass(["cms-table-cell", cellClass, uiWhen(col?.nowrap, "is-nowrap")]),
            style: tdStyle
          });

          let cellNodes = renderSlotToArray(col?.slots, "cell", cellCtx, null);
          if (!cellNodes.length) {
            const raw = typeof col?.render === "function"
              ? col.render(row, cellCtx)
              : (typeof col?.format === "function" ? col.format(value, row, cellCtx) : value);
            const fallback = raw == null ? (col?.emptyText ?? "") : raw;
            cellNodes = renderSlotToArray(slots, "cell", cellCtx, fallback);
          }
          if (!cellNodes.length) cellNodes = [""];
          cellNodes.forEach((node) => td.appendChild(node));
          tr.appendChild(td);
        });

        if (hasActions) {
          const actionCtx = { ...rowCtx };
          const actionRaw = typeof props.actions === "function" ? props.actions(row, rowCtx) : props.actions;
          let actionNodes = renderSlotToArray(slots, "actions", actionCtx, actionRaw);
          if (!actionNodes.length) actionNodes = renderSlotToArray(null, "default", actionCtx, actionRaw);
          tr.appendChild(
            _.td({ class: "cms-table-cell cms-table-cell-actions", style: { textAlign: "right" } },
              _.div({ class: "cms-table-actions" }, ...actionNodes)
            )
          );
        }

        tbody.appendChild(tr);
      }
    }, "UI.Table:render");

    wrapProps.body = shell;
    return UI.Card(wrapProps);
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Table = {
      signature: "UI.Table(props)",
      props: {
        columns: "Array<{ key, label?, sortable?, get?, value?, render?, format?, width?, minWidth?, maxWidth?, align?, compare?, style?, headerStyle?, thStyle?, cellStyle?, tdStyle?, cellClass?, headerClass?, nowrap?, searchable? }>",
        rows: "Array|() => Array",
        rowKey: "string|((row)=>string)",
        loading: "boolean|() => boolean",
        page: "number",
        pageSize: "number",
        pageSizeOptions: "number[]",
        pagination: "boolean",
        initialSort: "{ key, dir: 'asc'|'desc' }",
        search: "string",
        query: "string",
        searchable: "boolean|string",
        searchPlaceholder: "string",
        searchKeys: "Array<string|function>",
        searchModel: "[get,set] signal",
        filter: "(row, ctx)=>boolean",
        actions: "(row, ctx)=>Node|Array",
        actionsLabel: "string|Node|Function|Array",
        emptyText: "string|Node|Function|Array",
        loadingText: "string|Node|Function|Array",
        toolbar: "Node|Function|Array",
        toolbarStart: "Node|Function|Array",
        toolbarEnd: "Node|Function|Array",
        caption: "string|Node|Function|Array",
        footer: "Node|Function|Array",
        status: "string|Node|Function|Array",
        rowClass: "string|((row,ctx)=>string)",
        rowAttrs: "object|((row,ctx)=>object)",
        minTableWidth: "string|number",
        stickyHeader: "boolean",
        hideHeader: "boolean",
        hideFooter: "boolean",
        dense: "boolean",
        striped: "boolean",
        hover: "boolean",
        tableClass: "string",
        cardClass: "string",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Introductory content above the table",
        toolbarStart: "Toolbar left area",
        toolbar: "Central/custom toolbar",
        toolbarEnd: "Toolbar right area",
        search: "Replaces the built-in search box",
        header: "Custom column header",
        cell: "Global cell renderer",
        actions: "Global row actions renderer",
        actionsHeader: "Actions column header",
        caption: "Caption above the table",
        status: "Extra content in the status row",
        loading: "Loading state",
        empty: "Empty state",
        footer: "Extra content in the footer"
      },
      events: {
        onRowClick: "(row, ctx, event) => void",
        onRowDblClick: "(row, ctx, event) => void"
      },
      returns: "HTMLDivElement",
      description: "Standardized table with toolbar, search, sorting, pagination, states, and flexible rendering."
    };
  }

