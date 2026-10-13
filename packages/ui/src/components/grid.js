
  UI.Grid = (...args) => {
    const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const itemSource = uiUnwrap(rawProps.items);
    const items = Array.isArray(itemSource) ? itemSource : (itemSource == null ? [] : [itemSource]);

    const buildItemProps = (entryProps = {}) => {
      const baseProps = rawProps.itemProps || {};
      const merged = { ...baseProps, ...entryProps };
      merged.class = uiClass([baseProps.class, rawProps.itemClass, entryProps.class]);
      merged.style = {
        ...(baseProps.style || {}),
        ...(rawProps.itemStyle || {}),
        ...(entryProps.style || {})
      };
      return merged;
    };

    const normalizeResolvedNode = (value, entryProps = {}) => {
      if (value == null || value === false) return [];
      if (isGridColNode(value)) return [value];
      if (isUIPlainObject(value)) {
        const childContent = value.children != null
          ? asNodeArray(value.children)
          : (value.content != null
            ? asNodeArray(value.content)
            : (value.node != null
              ? asNodeArray(value.node)
              : (value.label != null ? asNodeArray(value.label) : [])));
        return [UI.GridCol(buildItemProps(value), ...childContent)];
      }
      if (Array.isArray(value)) {
        return [UI.GridCol(buildItemProps(entryProps), ...value)];
      }
      return [UI.GridCol(buildItemProps(entryProps), value)];
    };

    const normalizeItemNode = (value, index, total, useItemSlot = true) => {
      if (value == null || value === false) return [];
      const entryProps = isUIPlainObject(value) ? value : {};
      if (useItemSlot) {
        const ctx = {
          item: value,
          index,
          count: total,
          first: index === 0,
          last: index === total - 1
        };
        const slotted = renderSlotToArray(slots, "item", ctx, null);
        if (slotted.length) {
          return slotted.flatMap((node) => normalizeResolvedNode(node, entryProps));
        }
      }
      return normalizeResolvedNode(value, entryProps);
    };

    const content = [];
    items.forEach((item, index) => {
      content.push(...normalizeItemNode(item, index, items.length));
    });

    const defaultNodes = renderSlotToArray(slots, "default", { items, count: items.length }, children);
    defaultNodes.forEach((node) => {
      content.push(...normalizeResolvedNode(node));
    });

    if (!content.length) {
      const emptyNodes = renderSlotToArray(slots, "empty", { items, count: 0 }, rawProps.empty);
      emptyNodes.forEach((node) => {
        const normalized = normalizeResolvedNode(node, {
          style: { gridColumn: "1 / -1" }
        });
        content.push(...normalized);
      });
    }

    const cls = uiClass([
      "jss-grid",
      JSswift.uiResponsiveClasses({ mobile: rawProps }, uiResponsiveGridRules),
      JSswift.uiResponsiveClasses(rawProps, uiResponsiveGridRules),
      uiWhen(rawProps.dense, "dense"),
      uiWhen(rawProps.inline, "jss-grid-inline"),
      uiWhen(rawProps.debug, "jss-grid-debug"),
      rawProps.class
    ]);

    const p = JSswift.omit(rawProps, [
      "gap", "rowGap", "columnGap", "colGap", "cols", "columns", "rows", "areas", "align", "justify",
      "alignItems", "justifyItems", "placeItems", "placeContent", "dense", "flow", "inline", "debug",
      "autoFit", "autoFill", "min", "max", "autoRows", "items", "itemClass", "itemStyle", "itemProps",
      "empty", "slots", "full", "width", "minWidth", "maxWidth", "padding",
      ...JSswift.uiResponsiveOmitProps
    ]);
    p.class = cls;

    const style = { ...(rawProps.style || {}) };
    if (
      JSswift.uiResponsiveHasConfig?.(rawProps)
      && rawProps.display == null
      && !uiHasResponsiveOverride(rawProps, "display")
      && style.display == null
    ) {
      style.display = rawProps.inline ? "inline-grid" : "grid";
    }
    const gap = uiStyleValue(rawProps.gap, toCssSize);
    if (gap != null && !uiHasResponsiveOverride(rawProps, "gap")) {
      style["--jss-grid-gap"] = gap;
      style.gap = gap;
    }
    const rowGap = uiStyleValue(rawProps.rowGap, toCssSize);
    if (rowGap != null && !uiHasResponsiveOverride(rawProps, "rowGap")) style.rowGap = rowGap;
    const columnGap = uiStyleValue(rawProps.columnGap ?? rawProps.colGap, toCssSize);
    if (columnGap != null && !uiHasResponsiveOverride(rawProps, ["columnGap", "colGap"])) style.columnGap = columnGap;

    const trackMax = uiStyleValue(rawProps.max, toCssSize, "1fr");
    const min = uiStyleValue(rawProps.min, toCssSize);
    if (min != null) {
      const mode = uiUnwrap(rawProps.autoFill) ? "auto-fill" : "auto-fit";
      style.gridTemplateColumns = `repeat(${mode}, minmax(${min}, ${trackMax || "1fr"}))`;
    } else {
      const cols = uiStyleValue(rawProps.columns ?? rawProps.cols, (v) => typeof v === "number"
        ? `repeat(${v}, minmax(0, 1fr))`
        : String(v)
      );
      if (cols != null && !uiHasResponsiveOverride(rawProps, ["cols", "columns"])) style.gridTemplateColumns = cols;
    }

    const rows = uiStyleValue(rawProps.rows, (v) => typeof v === "number"
      ? `repeat(${v}, minmax(0, auto))`
      : String(v)
    );
    if (rows != null) style.gridTemplateRows = rows;

    const autoRows = uiStyleValue(rawProps.autoRows, toCssSize);
    if (autoRows != null) style.gridAutoRows = autoRows;

    const flow = uiStyleValue(rawProps.flow, (v) => {
      const value = String(v);
      return rawProps.dense && !value.includes("dense") ? `${value} dense` : value;
    });
    if (flow != null && !uiHasResponsiveOverride(rawProps, "flow")) style.gridAutoFlow = flow;

    const areas = uiStyleValue(rawProps.areas, (value) => {
      if (Array.isArray(value)) {
        return value.map((row) => `"${Array.isArray(row) ? row.join(" ") : String(row)}"`).join(" ");
      }
      return String(value);
    });
    if (areas != null) style.gridTemplateAreas = areas;

    const align = uiStyleValue(rawProps.align ?? rawProps.alignItems);
    if (align != null && !uiHasResponsiveOverride(rawProps, ["align", "alignItems"])) style.alignItems = align;
    const justify = uiStyleValue(rawProps.justify);
    if (justify != null && !uiHasResponsiveOverride(rawProps, "justify")) style.justifyContent = justify;
    const justifyItems = uiStyleValue(rawProps.justifyItems);
    if (justifyItems != null) style.justifyItems = justifyItems;
    const placeItems = uiStyleValue(rawProps.placeItems);
    if (placeItems != null) style.placeItems = placeItems;
    const placeContent = uiStyleValue(rawProps.placeContent);
    if (placeContent != null) style.placeContent = placeContent;
    const width = uiStyleValue(rawProps.width, toCssSize);
    if (width != null && !uiHasResponsiveOverride(rawProps, "width")) style.width = width;
    if (uiUnwrap(rawProps.full) === true) style.width = "100%";
    const minWidth = uiStyleValue(rawProps.minWidth, toCssSize);
    if (minWidth != null && !uiHasResponsiveOverride(rawProps, "minWidth")) style.minWidth = minWidth;
    const maxWidth = uiStyleValue(rawProps.maxWidth, toCssSize);
    if (maxWidth != null && !uiHasResponsiveOverride(rawProps, "maxWidth")) style.maxWidth = maxWidth;
    const padding = uiStyleValue(rawProps.padding, toCssSize);
    if (padding != null && !uiHasResponsiveOverride(rawProps, "padding")) style.padding = padding;
    if (Object.keys(style).length) p.style = style;
    JSswift.uiApplyResponsiveProps(p, rawProps, JSswift.uiResponsiveStyleRules);

    const el = _.div(p, ...content);
    setPropertyProps(el, rawProps);
    return el;
  };

  // Esempio: JSswift.ui.Grid({}, JSswift.ui.GridCol({ span: 12 }, "Col"))
