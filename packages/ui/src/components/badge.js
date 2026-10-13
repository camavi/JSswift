
  UI.Badge = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? `jss-size-${v}` : "";
    });
    const cls = uiClass([
      "jss-clear-set",
      "jss-badge",
      "jss-singularity",
      sizeClass,
      uiWhen(props.outline, "outline"),
      props.class
    ]);
    const p = JSswift.omit(props, [
      "label",
      "color",
      "outline",
      "size",
      "slots",
      "notification",
      "iconSize",
      "topLeft",
      "topRight",
      "bottomLeft",
      "bottomRight",
      "left",
      "right"
    ]);
    p.class = cls;

    const style = {
      ...(props.style || {})
    };
    if (props.size) {
      const size = uiUnwrap(props.size);
      if (!(typeof size === "string" && sizeMap[size])) {
        style.fontSize = toCssSize(props.size);
      }
    }
    p.style = style;

    const renderNamedSlotToArray = (names, ctx, fallback) => {
      const list = Array.isArray(names) ? names : [names];
      for (const name of list) {
        if (JSswift.ui.getSlot(slots, name) != null) {
          return renderSlotToArray(slots, name, ctx, fallback);
        }
      }
      return fallback == null || fallback === false || fallback === ""
        ? []
        : renderSlotToArray(null, "default", ctx, fallback);
    };

    const resolveIconSize = () => {
      const raw = uiUnwrap(props.iconSize ?? props.size);
      if (typeof raw === "number") return Math.max(10, Math.round(raw * 0.85));
      if (typeof raw === "string") {
        const map = {
          xxs: 10,
          xs: 11,
          sm: 12,
          md: 13,
          lg: 14,
          xl: 16,
          xxl: 18,
          xxxl: 20
        };
        return map[raw] || 14;
      }
      return 14;
    };

    const resolveIconFallback = (source, as) => {
      const raw = uiUnwrap(source);
      if (raw == null || raw === false || raw === "") return null;
      if (typeof raw === "string") return UI.Icon({ name: raw, size: resolveIconSize() });
      return JSswift.ui.slot(raw, { as });
    };

    const renderIconAnchor = (slotNames, propKey, position) => _.dynamic(() => {
      const iconFallback = resolveIconFallback(props[propKey], position);
      const nodes = renderNamedSlotToArray(slotNames, { position }, iconFallback);
      if (!nodes.length) return null;
      return _.span({
        class: `jss-badge-anchor jss-badge-anchor-${position}`,
        "data-badge-slot": position
      }, ...nodes);
    });

    const content = _.dynamic(() => {
      const labelFallback = uiUnwrap(props.label);
      let labelNodes = renderNamedSlotToArray(["label"], {}, labelFallback);
      if (!labelNodes.length) labelNodes = renderNamedSlotToArray(["default"], {}, children);
      return _.span(
        { class: "jss-badge-content" },
        _.span({ class: "jss-badge-label" }, ...(labelNodes.length ? labelNodes : [""]))
      );
    });

    const notification = _.dynamic(() => {
      const rawNotification = uiUnwrap(props.notification);
      const fallback = rawNotification == null || rawNotification === false || rawNotification === ""
        ? null
        : rawNotification;
      const nodes = renderNamedSlotToArray(["notification"], { notification: rawNotification }, fallback);
      if (!nodes.length) return null;
      return _.span({
        class: "jss-badge-notification",
        "data-badge-slot": "notification",
        "aria-label": typeof rawNotification === "number" ? `${rawNotification} notifications` : null
      }, ...nodes);
    });

    const wrap = _.span(
      renderIconAnchor(["left"], "left", "left"),
      renderIconAnchor(["centerLeft", "center-left"], "centerLeft", "center-left"),
      p,
      content,
      renderIconAnchor(["topLeft", "top-left"], "topLeft", "top-left"),
      renderIconAnchor(["topRight", "top-right"], "topRight", "top-right"),
      renderIconAnchor(["bottomLeft", "bottom-left"], "bottomLeft", "bottom-left"),
      renderIconAnchor(["bottomRight", "bottom-right"], "bottomRight", "bottom-right"),
      renderIconAnchor(["centerRight", "center-right"], "centerRight", "center-right"),
      renderIconAnchor(["right"], "right", "right"),
      notification
    );
    // se esiste un props con left o right
    if (props.topLeft || props.centerLeft || props.bottomLeft) {
      wrap.style.setProperty("padding-left", "15px");
    }
    if (props.topRight || props.centerRight || props.bottomRight) {
      wrap.style.setProperty("padding-right", "15px");
    }

    setPropertyProps(wrap, props);
    return wrap;
  };

  // Esempio: JSswift.ui.Badge({ label: "New" })
