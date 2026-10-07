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
    if (gap != null) p.style["--jss-list-gap"] = gap;
    if (marker != null && marker !== false && marker !== true && marker !== "none") {
      p.style.listStyleType = String(marker);
    }

    const list = _[ordered ? "ol" : "ul"](p, ...content);
    return list;
  };

  // Esempio: JSswift.ui.List({}, JSswift.ui.Item({}, "Item"))

  UI.Item = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    if (props.state != null && props.color == null) props.color = props.state;
    applyCommonProps(props);
    const slots = props.slots || {};
    const interactive = uiComputed([props.clickable, props.to], () => !!(uiUnwrap(props.clickable) || uiUnwrap(props.to)));
    const active = uiComputed([props.active, props.selected], () => !!(uiUnwrap(props.active) || uiUnwrap(props.selected)));
    const hasSurface = !!(
      props.color != null || props.outline || props.border || props.glossy || props.glow || props.glass ||
      props.shadow || props.gradient || props.textGradient || props.lightShadow || props.radius ||
      props.rounded || props.flat
    );

    const resolveIcon = (value, size, as) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return null;
      if (typeof raw === "string") return UI.Icon({ name: raw, size: size || "sm" });
      return JSswift.ui.slot(raw, { as });
    };

    const iconNodes = renderSlotToArray(slots, "icon", {}, resolveIcon(props.icon, props.iconSize || props.size, "icon"));
    const titleNodes = renderSlotToArray(slots, "title", {}, props.title ?? props.label);
    const subtitleNodes = renderSlotToArray(slots, "subtitle", {}, props.subtitle ?? props.caption ?? props.description);
    const metaNodes = renderSlotToArray(slots, "meta", {}, props.meta ?? props.eyebrow);
    const bodyNodes = renderSlotToArray(slots, "body", {}, props.body ?? props.content);
    const defaultNodes = renderSlotToArray(slots, "default", {}, children);
    const actionsNodes = renderSlotToArray(slots, "actions", {}, props.actions ?? props.footer);
    const asideFallback = props.aside ?? props.trailing ?? resolveIcon(props.iconRight, props.iconSize || props.size, "iconRight");
    const asideNodes = renderSlotToArray(slots, "aside", {}, asideFallback);

    const mergedBodyNodes = [...bodyNodes, ...defaultNodes];
    const isInline = !(
      hasSurface || props.clickable || props.to || iconNodes.length || titleNodes.length ||
      subtitleNodes.length || metaNodes.length || actionsNodes.length || asideNodes.length ||
      bodyNodes.length
    );

    const cls = uiClass([
      "jss-item",
      uiWhen(props.divider, "divider"),
      uiWhen(hasSurface, "jss-clear-set"),
      uiWhen(hasSurface, "jss-singularity"),
      uiWhen(hasSurface, "jss-item-surface"),
      uiWhen(isInline, "jss-item-inline"),
      uiWhen(interactive, "jss-item-clickable"),
      uiWhen(active, "is-active"),
      uiWhen(props.disabled, "is-disabled"),
      props.class
    ]);
    const p = JSswift.omit(props, [
      "divider", "slots", "label", "title", "subtitle", "caption", "description", "meta", "eyebrow",
      "body", "content", "children", "node", "icon", "iconRight", "iconSize", "aside", "trailing",
      "actions", "footer", "clickable", "to", "active", "selected", "disabled", "state",
      "color", "size", "outline", "flat", "border", "glossy", "glow", "glass", "gradient",
      "textGradient", "lightShadow", "shadow", "rounded", "radius", "textColor", "dense"
    ]);
    p.class = cls;
    p.style = {
      ...(props.style || {})
    };

    const userOnClick = props.onClick;
    const userOnKeydown = props.onKeydown;
    const onClick = (e) => {
      userOnClick?.(e);
      if (e.defaultPrevented || uiUnwrap(props.disabled)) return;
      const to = uiUnwrap(props.to);
      if (to && JSswift.router?.navigate) {
        e.preventDefault();
        JSswift.router.navigate(to);
      }
    };
    const onKeydown = (e) => {
      userOnKeydown?.(e);
      if (e.defaultPrevented || uiUnwrap(props.disabled)) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    };
    if (uiUnwrap(props.disabled)) {
      p["aria-disabled"] = "true";
    }
    if (uiUnwrap(props.clickable) || uiUnwrap(props.to)) {
      p.onClick = onClick;
      p.onKeydown = onKeydown;
      if (p.tabIndex == null) p.tabIndex = uiUnwrap(props.disabled) ? -1 : 0;
      if (p.role == null) p.role = "button";
    }

    const titleSection = titleNodes.length ? _.div({ class: "jss-item-title" }, ...titleNodes) : null;
    const subtitleSection = subtitleNodes.length ? _.div({ class: "jss-item-subtitle" }, ...subtitleNodes) : null;
    const metaSection = metaNodes.length ? _.div({ class: "jss-item-meta" }, ...metaNodes) : null;
    const bodySection = mergedBodyNodes.length
      ? _.div({ class: uiClass(["jss-item-body", uiWhen(!(titleNodes.length || subtitleNodes.length || metaNodes.length), "is-standalone")]) }, ...mergedBodyNodes)
      : null;
    const actionsSection = actionsNodes.length ? _.div({ class: "jss-item-actions" }, ...actionsNodes) : null;

    const item = _.li(
      p,
      _.div(
        { class: "jss-item-row" },
        iconNodes.length ? _.div({ class: "jss-item-icon" }, ...iconNodes) : null,
        _.div(
          { class: "jss-item-main" },
          metaSection,
          titleSection,
          subtitleSection,
          bodySection,
          actionsSection
        ),
        asideNodes.length ? _.div({ class: "jss-item-aside" }, ...asideNodes) : null
      )
    );
    setPropertyProps(item, props);
    return item;
  };

  // Esempio: JSswift.ui.Item({}, "Elemento")

  UI.Separator = (...args) => {
    const { props } = JSswift.uiNormalizeArgs(args);
    const cls = uiClass(["jss-separator", uiWhen(props.vertical, "vertical"), props.class]);
    const p = JSswift.omit(props, ["vertical", "size", "slots"]);
    p.class = cls;
    const style = { borderColor: "var(--jss-border)", ...(props.style || {}) };
    const sizeValue = uiUnwrap(props.size);
    const vertical = uiUnwrap(props.vertical);
    if (sizeValue != null) {
      const size = toCssSize(sizeValue);
      if (vertical) style.width = size;
      else style.height = size;
    }
    p.style = style;
    return _.hr(p);
  };

  // Esempio: JSswift.ui.Separator()

