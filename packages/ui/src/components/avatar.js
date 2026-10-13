
  UI.Avatar = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && JSswift.uiSizes?.includes(v)) ? `jss-size-${v}` : "";
    });
    const stateClass = uiComputed([props.color, props.state], () => {
      const v = uiUnwrap(props.color) || uiUnwrap(props.state) || "";
      const state = normalizeState(v);
      return state ? `jss-state-${state}` : "";
    });
    const cls = uiClass([
      "jss-clear-set",
      "jss-avatar",
      "jss-singularity",
      sizeClass,
      stateClass,
      uiWhen(props.square, "jss-avatar-square"),
      uiWhen(props.elevated, "elevated"),
      props.class
    ]);

    const p = JSswift.omit(props, [
      "src", "srcset", "srcSet", "sizes", "alt", "label", "name", "initials", "text",
      "size", "fontSize", "textSize", "radius", "rounded", "square", "elevated",
      "icon", "iconSize", "media", "fit", "badge", "notification", "status",
      "statusColor", "presence", "topLeft", "topRight", "bottomLeft", "bottomRight",
      "slots"
    ]);
    p.class = cls;

    const style = { ...(props.style || {}) };
    const sizeStyle = uiStyleValue(props.size, (value) => {
      if (typeof value === "string" && JSswift.uiSizes?.includes(value)) return "";
      return toCssSize(value);
    }, "");
    if (sizeStyle != null) {
      style.width = sizeStyle;
      style.height = sizeStyle;
    }

    const fontSizeValue = props.fontSize ?? props.textSize;
    const fontSizeStyle = fontSizeValue != null
      ? uiStyleValue(fontSizeValue, toCssSize)
      : uiStyleValue(props.size, (value) => {
        if (typeof value === "string" && JSswift.uiSizes?.includes(value)) return "";
        return `clamp(11px, calc(${toCssSize(value)} * 0.34), 28px)`;
      }, "");
    if (fontSizeStyle != null) style.fontSize = fontSizeStyle;

    const radiusStyle = uiStyleValue(props.radius, (value) => {
      const normalized = normalizeRadius(value);
      if (normalized === "xxxl") return "999px";
      if (normalized) return `var(--jss-r-${normalized})`;
      if (typeof value === "number") return `${value}px`;
      return String(value);
    });
    if (radiusStyle != null) style["--set-border-radius"] = radiusStyle;
    p.style = style;

    const ctx = { props };
    const altText = uiComputed([props.alt, props.label, props.name, props.text], () => {
      const raw = uiUnwrap(props.alt) || uiUnwrap(props.label) || uiUnwrap(props.name) || uiUnwrap(props.text) || "avatar";
      return String(raw);
    });
    const iconFallback = props.icon != null
      ? (typeof props.icon === "string"
        ? UI.Icon({ name: props.icon, size: props.iconSize || props.size || "sm" })
        : JSswift.ui.slot(props.icon, { as: "icon" }))
      : null;
    const labelFallback = uiComputed([props.initials, props.text, props.label, props.name], () => {
      const explicit = uiUnwrap(props.initials) ?? uiUnwrap(props.text);
      if (explicit != null) return explicit;
      const rawLabel = uiUnwrap(props.label) ?? uiUnwrap(props.name);
      if (typeof rawLabel === "string") return avatarGetInitials(rawLabel);
      return rawLabel;
    });
    const badgeFallback = avatarPrimitiveBadge(uiUnwrap(props.badge ?? props.notification));
    const statusFallback = avatarPrimitiveStatus(
      uiUnwrap(props.status ?? props.presence),
      uiUnwrap(props.statusColor)
    );

    let mediaNodes = renderSlotToArray(slots, "media", ctx, props.media);
    if (!mediaNodes.length && props.src) {
      const imgProps = {
        class: "jss-avatar-img",
        src: props.src,
        alt: altText,
        sizes: props.sizes,
        style: {}
      };
      if (props.srcset != null) imgProps.srcset = props.srcset;
      if (props.srcSet != null) imgProps.srcset = props.srcSet;
      const fitStyle = uiStyleValue(props.fit);
      if (fitStyle != null) imgProps.style.objectFit = fitStyle;
      mediaNodes = [_.img(imgProps)];
    }

    const defaultNodes = renderSlotToArray(slots, "default", ctx, children);
    const fallbackNodes = renderSlotToArray(slots, "fallback", ctx, null);
    const labelNodes = renderSlotToArray(slots, "label", ctx, labelFallback);
    const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
    const mainNodes = mediaNodes.length
      ? mediaNodes
      : (defaultNodes.length
        ? defaultNodes
        : (fallbackNodes.length
          ? fallbackNodes
          : (labelNodes.length
            ? labelNodes
            : (iconNodes.length ? iconNodes : ["?"]))));

    const bodyClass = mediaNodes.length ? "jss-avatar-media" : "jss-avatar-fallback";
    const body = _.span({ class: "jss-avatar-body" },
      _.span({ class: bodyClass }, ...mainNodes)
    );

    let topLeftNodes = renderSlotToArray(slots, "topLeft", ctx, props.topLeft);
    let topRightNodes = renderSlotToArray(slots, "topRight", ctx, props.topRight);
    let bottomLeftNodes = renderSlotToArray(slots, "bottomLeft", ctx, props.bottomLeft);
    let bottomRightNodes = renderSlotToArray(slots, "bottomRight", ctx, props.bottomRight);
    const badgeNodes = renderSlotToArray(slots, "badge", ctx, badgeFallback);
    const statusNodes = renderSlotToArray(slots, "status", ctx, statusFallback);

    if (!topRightNodes.length && badgeNodes.length) topRightNodes = badgeNodes;
    if (!bottomRightNodes.length && statusNodes.length) bottomRightNodes = statusNodes;

    const wrap = _.div(
      p,
      body,
      avatarRenderAnchor("jss-avatar-anchor-top-left", topLeftNodes),
      avatarRenderAnchor("jss-avatar-anchor-top-right", topRightNodes),
      avatarRenderAnchor("jss-avatar-anchor-bottom-left", bottomLeftNodes),
      avatarRenderAnchor("jss-avatar-anchor-bottom-right", bottomRightNodes)
    );
    setPropertyProps(wrap, props);
    return wrap;
  };

  // Esempio: JSswift.ui.Avatar({ label: "CM" })
