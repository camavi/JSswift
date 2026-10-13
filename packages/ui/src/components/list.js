
  UI.List = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const ordered = !!uiUnwrap(props.number ?? props.ordered);
    const marker = uiUnwrap(props.marker);
    const itemSource = uiUnwrap(props.items);
    const items = Array.isArray(itemSource) ? itemSource : (itemSource == null ? [] : [itemSource]);

    const buildItemProps = (entryProps = {}) => {
      const baseProps = props.itemProps || {};
      const merged = { ...baseProps, ...entryProps };
      if (props.divider != null && merged.divider == null) merged.divider = props.divider;
      merged.class = uiClass([baseProps.class, props.itemClass, entryProps.class]);
      merged.style = {
        ...(baseProps.style || {}),
        ...(props.itemStyle || {}),
        ...(entryProps.style || {})
      };
      return merged;
    };

    const normalizeResolvedNode = (value) => {
      if (value == null || value === false) return [];
      if (isListItemNode(value)) return [value];
      if (isUIPlainObject(value)) {
        const itemChildren = value.children != null
          ? asNodeArray(value.children)
          : (value.content != null
            ? asNodeArray(value.content)
            : asNodeArray(value.node));
        return [UI.Item(buildItemProps(value), ...itemChildren)];
      }
      if (Array.isArray(value)) {
        return [UI.Item(buildItemProps(), ...value)];
      }
      if (value?.nodeType) {
        return [UI.Item(buildItemProps(), value)];
      }
      return [UI.Item(buildItemProps(), value)];
    };

    const normalizeItemNode = (value, index, total, useItemSlot = true) => {
      if (value == null || value === false) return [];
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
          return slotted.flatMap((node) => normalizeResolvedNode(node));
        }
      }
      return normalizeResolvedNode(value);
    };

    const content = [];
    items.forEach((item, index) => {
      content.push(...normalizeItemNode(item, index, items.length));
    });

    const defaultNodes = renderSlotToArray(slots, "default", { items, count: items.length }, children);
    defaultNodes.forEach((node, index) => {
      content.push(...normalizeItemNode(node, items.length + index, items.length + defaultNodes.length, false));
    });

    if (!content.length) {
      const emptyNodes = renderSlotToArray(slots, "empty", { items, count: 0 }, props.empty);
      if (emptyNodes.length) {
        if (emptyNodes.length === 1 && isListItemNode(emptyNodes[0])) {
          content.push(emptyNodes[0]);
        } else {
          content.push(UI.Item({ class: "jss-item-empty", flat: true }, ...emptyNodes));
        }
      }
    }

    const cls = uiClass([
      "jss-list",
      "jss-singularity",
      uiComputed(props.size, () => {
        const size = uiUnwrap(props.size);
        return typeof size === "string" && JSswift.uiSizes?.includes(size) ? `jss-size-${size}` : "";
      }),
      uiWhen(props.dense, "dense"),
      uiWhen(props.divider, "divider"),
      uiWhen(marker === false || marker === "none", "jss-list-no-marker"),
      props.class
    ]);
    const p = JSswift.omit(props, [
      "dense", "divider", "slots", "number", "ordered", "items", "itemClass", "itemStyle", "itemProps",
      "empty", "marker", "gap"
    ]);
    p.class = cls;
    p.style = {
      ...(props.style || {})
    };
    const gap = uiStyleValue(props.gap, toCssSize);
    if (props.size != null) {
      p.style.fontSize = uiStyleValue(props.size, (value) =>
        typeof value === "string" && JSswift.uiSizes?.includes(value) ? "" : toCssSize(value));
    }
    if (gap != null) p.style["--jss-list-gap"] = gap;
    if (marker != null && marker !== false && marker !== true && marker !== "none") {
      p.style.listStyleType = String(marker);
    }

    const list = _[ordered ? "ol" : "ul"](p, ...content);
    return list;
  };

  // Esempio: JSswift.ui.List({}, JSswift.ui.Item({}, "Item"))
