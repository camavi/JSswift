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
          content.push(UI.Item({ class: "cms-item-empty", flat: true }, ...emptyNodes));
        }
      }
    }

    const cls = uiClass([
      "cms-list",
      uiWhen(props.dense, "dense"),
      uiWhen(props.divider, "divider"),
      uiWhen(marker === false || marker === "none", "cms-list-no-marker"),
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
    if (gap != null) p.style["--cms-list-gap"] = gap;
    if (marker != null && marker !== false && marker !== true && marker !== "none") {
      p.style.listStyleType = String(marker);
    }

    const list = _[ordered ? "ol" : "ul"](p, ...content);
    return list;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.List = {
      signature: "UI.List(...children) | UI.List(props, ...children)",
      props: {
        items: "Array<Node|Object|string>",
        ordered: "boolean",
        number: "boolean",
        marker: "boolean|string",
        dense: "boolean",
        divider: "boolean",
        gap: "string|number",
        empty: "String|Node|Function|Array",
        itemClass: "string",
        itemStyle: "object",
        itemProps: "object",
        slots: "{ default?, item?, empty? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "List content fallback",
        item: "Render custom di ogni item ({ item, index, count, first, last })",
        empty: "Empty state content"
      },
      returns: "HTMLUListElement|HTMLOListElement",
      description: "Lista dichiarativa con supporto items, slot item, ordered/marker ed empty state."
    };
  }
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
      "cms-item",
      uiWhen(props.divider, "divider"),
      uiWhen(hasSurface, "cms-clear-set"),
      uiWhen(hasSurface, "cms-singularity"),
      uiWhen(hasSurface, "cms-item-surface"),
      uiWhen(isInline, "cms-item-inline"),
      uiWhen(interactive, "cms-item-clickable"),
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

    const titleSection = titleNodes.length ? _.div({ class: "cms-item-title" }, ...titleNodes) : null;
    const subtitleSection = subtitleNodes.length ? _.div({ class: "cms-item-subtitle" }, ...subtitleNodes) : null;
    const metaSection = metaNodes.length ? _.div({ class: "cms-item-meta" }, ...metaNodes) : null;
    const bodySection = mergedBodyNodes.length
      ? _.div({ class: uiClass(["cms-item-body", uiWhen(!(titleNodes.length || subtitleNodes.length || metaNodes.length), "is-standalone")]) }, ...mergedBodyNodes)
      : null;
    const actionsSection = actionsNodes.length ? _.div({ class: "cms-item-actions" }, ...actionsNodes) : null;

    const item = _.li(
      p,
      _.div(
        { class: "cms-item-row" },
        iconNodes.length ? _.div({ class: "cms-item-icon" }, ...iconNodes) : null,
        _.div(
          { class: "cms-item-main" },
          metaSection,
          titleSection,
          subtitleSection,
          bodySection,
          actionsSection
        ),
        asideNodes.length ? _.div({ class: "cms-item-aside" }, ...asideNodes) : null
      )
    );
    setPropertyProps(item, props);
    return item;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Item = {
      signature: "UI.Item(...children) | UI.Item(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        title: "String|Node|Function|Array",
        subtitle: "String|Node|Function|Array",
        meta: "String|Node|Function|Array",
        body: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        aside: "Node|Function|Array",
        actions: "Node|Function|Array",
        clickable: "boolean",
        to: "string",
        active: "boolean",
        selected: "boolean",
        disabled: "boolean",
        color: "string",
        state: "Alias of color",
        size: "string|number",
        outline: "boolean",
        shadow: "boolean|string",
        lightShadow: "boolean",
        border: "boolean",
        glossy: "boolean",
        glow: "boolean",
        glass: "boolean",
        gradient: "boolean|number",
        textGradient: "boolean",
        radius: "string|number",
        divider: "boolean",
        slots: "{ icon?, title?, subtitle?, meta?, body?, aside?, actions?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        icon: "Leading visual/icon",
        title: "Main title content",
        subtitle: "Secondary text",
        meta: "Top meta content",
        body: "Body content",
        aside: "Trailing content",
        actions: "Actions row",
        default: "Fallback body content"
      },
      returns: "HTMLLIElement",
      description: "Structured item for simple lists, feeds, task lists, and clickable rows."
    };
  }
  // Esempio: JSswift.ui.Item({}, "Elemento")

  UI.Separator = (...args) => {
    const { props } = JSswift.uiNormalizeArgs(args);
    const cls = uiClass(["cms-separator", uiWhen(props.vertical, "vertical"), props.class]);
    const p = JSswift.omit(props, ["vertical", "size", "slots"]);
    p.class = cls;
    const style = { borderColor: "var(--cms-border)", ...(props.style || {}) };
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
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Separator = {
      signature: "UI.Separator() | UI.Separator(props)",
      props: {
        vertical: "boolean",
        size: "string|number",
        slots: "{ default? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Unused (separator has no content)"
      },
      returns: "HTMLHRElement",
      description: "Separatore orizzontale o verticale."
    };
  }
  // Esempio: JSswift.ui.Separator()

