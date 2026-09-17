  UI.Icon = (...args) => {
    let props = {};
    let children = [];
    let name = "home";
    let hasName = false;
    const a = args[0];
    const b = args[1];
    const isPlainObject = (v) => v && typeof v === "object" && !v.nodeType && !Array.isArray(v) && !(v instanceof Function);

    if (typeof a === "string") {
      name = a;
      hasName = true;
      if (isPlainObject(b)) {
        props = b;
        if (args.length > 2) children = args.slice(2);
      } else if (args.length > 1) {
        children = args.slice(1);
      }
    } else if (isPlainObject(a)) {
      props = a;
      if (a.name != null) {
        name = a.name;
        hasName = true;
      }
      if (args.length > 1) children = args.slice(1);
    } else if (args.length) {
      children = args;
    }

    if (!hasName && children.length) {
      name = children.length === 1 ? children[0] : children;
    }
    applyCommonProps(props);

    const slots = props.slots || {};

    const size = uiUnwrap(props.size);
    const color = uiUnwrap(props.color);
    const isFill = String(name).endsWith("-fill");
    const style = { ...(props.style || {}) };
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? v : "";
    });

    const hasVisualSurface = !!(props.color || props.clickable || props.border || props.glossy || props.glow || props.glass || props.shadow || props.outline || props.gradient || props.textGradient || props.lightShadow || props.radius);
    const builtInSpriteIcons = {
      "chevron-down": {
        viewBox: "0 0 24 24",
        paths: [{ d: "M6 9l6 6l6 -6", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }]
      }
    };
    const createBuiltInSpriteIcon = (id) => {
      const def = builtInSpriteIcons[id];
      if (!def) return null;
      return _.svg(
        { width: "100%", height: "100%", viewBox: def.viewBox, fill: "none", "aria-hidden": "true", focusable: "false" },
        ...def.paths.map((path) => _.path(path))
      );
    };
    const wrapIcon = (icon) => {
      const tooltip = uiUnwrap(props.tooltip);
      if (tooltip == null || tooltip === false || !UI.Tooltip) return icon;
      const tooltipProps = isPlainObject(tooltip)
        ? { ...tooltip }
        : { text: tooltip };
      if (isPlainObject(props.tooltipProps)) Object.assign(tooltipProps, props.tooltipProps);
      return UI.Tooltip({ ...tooltipProps, target: icon });
    };

    const cls = uiClass([
      "cms-icon",
      "material-icons",
      ...(hasVisualSurface ? ["cms-clear-set", "cms-singularity"] : []),
      sizeClass,
      props.class
    ]);
    const p = JSswift.omit(props, ["name", "size", "class", "style", "label", "border", "color", "icon", "iconRight", "removable", "onRemove", "dense", "flat", "glossy", "outline", "slots", "spriteUrl", "tooltip", "tooltipProps"]);
    p.class = cls;
    if (Object.keys(style).length) p.style = style;

    if (typeof name === "function" || (name && typeof name === "object")) {
      const customNode = JSswift.ui.renderSlot(slots, "default", {}, name);
      const content = renderSlotToArray(null, "default", {}, customNode);
      const icon = _.span({ ...p, "data-icon": "custom" }, ...content);
      setPropertyProps(icon, props);
      return wrapIcon(icon);
    }

    const nameStr = String(name);
    const useHref = nameStr.includes("#") ? nameStr : "";
    let icon = null;
    if (useHref) {
      const spriteUrl =
        props.spriteUrl ||
        JSswift.config?.iconSpriteUrl ||
        (typeof globalThis !== "undefined" ? globalThis.JSswift_setting?.iconSpriteUrl : null);
      const symbolId = useHref.slice(useHref.indexOf("#") + 1);
      const svg = spriteUrl
        ? _.svg(
          { width: "100%", height: "100%" },
          _.use({ href: spriteUrl + useHref })
        )
        : createBuiltInSpriteIcon(symbolId) || _.svg(
          { width: "100%", height: "100%" },
          _.use({ href: useHref })
        );
      if (isFill) svg.style.fill = "currentColor";
      icon = _.span({ ...p, "data-icon": nameStr }, svg, ...children);
    } else {
      icon = _.span({ ...p, "data-icon": nameStr }, nameStr, ...children);
    }

    if (size != null) {
      let v = size;
      if (JSswift.uiSizes.includes(size)) {
        v = `var(--cms-icon-size-${size})`;
      }
      v = typeof v === "number" ? v + "px" : String(v);
      icon.style.setProperty("--set-icon-size", v);
    }

    setPropertyProps(icon, props);
    return wrapIcon(icon);
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Icon = {
      signature: "UI.Icon(name) | UI.Icon(props) | UI.Icon(props, ...children)",
      props: {
        name: "string|Node|Function",
        size: "number|string",
        color: "string",
        shadow: "boolean|string",
        lightShadow: "boolean",
        clickable: "boolean",
        border: "boolean",
        glossy: "boolean",
        glow: "boolean",
        glass: "boolean",
        gradient: "boolean|number",
        outline: "boolean",
        textGradient: "boolean",
        radius: "number|string",
        spriteUrl: "string",
        tooltip: "String|Node|Function|Object",
        tooltipProps: "object",
        slots: "{ default? }",
        class: "string",
        style: "object"
      },
      slots: {
        default: "Custom icon content"
      },
      returns: "HTMLSpanElement",
      description: "Sprite- or text-based icon with configurable size/color."
    };
  }
  // Esempio: JSswift.ui.Icon({ name: "home", size: 18 })

  UI.Badge = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? `cms-size-${v}` : "";
    });
    const cls = uiClass([
      "cms-clear-set",
      "cms-badge",
      "cms-singularity",
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
        class: `cms-badge-anchor cms-badge-anchor-${position}`,
        "data-badge-slot": position
      }, ...nodes);
    });

    const content = _.dynamic(() => {
      const labelFallback = uiUnwrap(props.label);
      let labelNodes = renderNamedSlotToArray(["label"], {}, labelFallback);
      if (!labelNodes.length) labelNodes = renderNamedSlotToArray(["default"], {}, children);
      return _.span(
        { class: "cms-badge-content" },
        _.span({ class: "cms-badge-label" }, ...(labelNodes.length ? labelNodes : [""]))
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
        class: "cms-badge-notification",
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
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Badge = {
      signature: "UI.Badge(...children) | UI.Badge(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        color: "string",
        size: "string|number",
        outline: "boolean",
        notification: "string|number|Node|Function|[get,set] signal",
        iconSize: "string|number",
        topLeft: "String|Node|Function|Array",
        topRight: "String|Node|Function|Array",
        bottomLeft: "String|Node|Function|Array",
        bottomRight: "String|Node|Function|Array",
        centerLeft: "String|Node|Function|Array",
        centerRight: "String|Node|Function|Array",
        left: "String|Node|Function|Array",
        right: "String|Node|Function|Array",
        slots: "{ label?, default?, notification?, topLeft?, topRight?, bottomLeft?, bottomRight?, left?, right? }",
        class: "string",
        style: "object"
      },
      slots: {
        label: "Badge label content",
        default: "Fallback content",
        notification: "Notification badge content",
        topLeft: "Icon anchored top-left",
        topRight: "Icon anchored top-right",
        bottomLeft: "Icon anchored bottom-left",
        bottomRight: "Icon anchored bottom-right",
        centerLeft: "Icon anchored center-left",
        centerRight: "Icon anchored center-right",
        left: "Icon anchored left",
        right: "Icon anchored right"
      },
      returns: "HTMLSpanElement",
      description: "Inline badge with reactive notification and 6 positionable icon slots."
    };
  }
  // Esempio: JSswift.ui.Badge({ label: "New" })

  const avatarGetInitials = (value) => {
    if (value == null || value === false) return "";
    const text = String(value)
      .replace(/[._-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return "";
    const words = text.split(" ").filter(Boolean);
    if (!words.length) return "";
    if (words.length === 1) {
      const token = words[0].replace(/[^a-z0-9]/gi, "");
      return token.slice(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  };

  const avatarStatusState = (value, fallback) => {
    const raw = value == null || value === true ? fallback : value;
    if (raw == null || raw === false) return normalizeState(fallback);
    const token = String(raw).toLowerCase();
    if (token === "online" || token === "available" || token === "active") return "success";
    if (token === "away" || token === "pending") return "warning";
    if (token === "busy" || token === "dnd" || token === "blocked") return "danger";
    if (token === "offline" || token === "idle") return "secondary";
    return normalizeState(token) || normalizeState(fallback);
  };

  const avatarPrimitiveBadge = (value, className = "cms-avatar-badge") => {
    if (value == null || value === false) return null;
    if (value instanceof Node || Array.isArray(value)) return value;
    if (typeof value === "function") return value;
    if (value === true) return _.span({ class: className });
    return _.span({ class: className }, String(value));
  };

  const avatarPrimitiveStatus = (value, color) => {
    if (value == null || value === false) {
      if (!color) return null;
      const fallbackState = avatarStatusState(null, color);
      return _.span({ class: uiClass(["cms-avatar-status", fallbackState ? `cms-state-${fallbackState}` : ""]) });
    }
    if (value instanceof Node || Array.isArray(value)) return value;
    if (typeof value === "function") return value;
    const state = avatarStatusState(value, color);
    if (value === true || state) {
      return _.span({ class: uiClass(["cms-avatar-status", state ? `cms-state-${state}` : ""]) });
    }
    return avatarPrimitiveBadge(value, "cms-avatar-badge");
  };

  const avatarRenderAnchor = (className, nodes) => {
    if (!nodes || !nodes.length) return null;
    return _.span({ class: uiClass(["cms-avatar-anchor", className]) }, ...nodes);
  };

  UI.Avatar = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && JSswift.uiSizes?.includes(v)) ? `cms-size-${v}` : "";
    });
    const stateClass = uiComputed([props.color, props.state], () => {
      const v = uiUnwrap(props.color) || uiUnwrap(props.state) || "";
      const state = normalizeState(v);
      return state ? `cms-state-${state}` : "";
    });
    const cls = uiClass([
      "cms-clear-set",
      "cms-avatar",
      "cms-singularity",
      sizeClass,
      stateClass,
      uiWhen(props.square, "cms-avatar-square"),
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
      if (normalized) return `var(--cms-r-${normalized})`;
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
        class: "cms-avatar-img",
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

    const bodyClass = mediaNodes.length ? "cms-avatar-media" : "cms-avatar-fallback";
    const body = _.span({ class: "cms-avatar-body" },
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
      avatarRenderAnchor("cms-avatar-anchor-top-left", topLeftNodes),
      avatarRenderAnchor("cms-avatar-anchor-top-right", topRightNodes),
      avatarRenderAnchor("cms-avatar-anchor-bottom-left", bottomLeftNodes),
      avatarRenderAnchor("cms-avatar-anchor-bottom-right", bottomRightNodes)
    );
    setPropertyProps(wrap, props);
    return wrap;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Avatar = {
      signature: "UI.Avatar(...children) | UI.Avatar(props, ...children)",
      props: {
        src: "string",
        srcset: "string",
        sizes: "string",
        alt: "string",
        label: "String|Node|Function|Array",
        name: "string",
        initials: "string|Node|Function|Array",
        text: "string|Node|Function|Array",
        size: "number|string",
        fontSize: "number|string",
        radius: "number|string",
        square: "boolean",
        elevated: "boolean",
        color: "string",
        state: "string",
        icon: "string|Node|Function|Array",
        iconSize: "number|string",
        media: "Node|Function|Array",
        fit: "cover|contain|fill|scale-down|none",
        badge: "string|number|Node|Function|Array",
        notification: "string|number|Node|Function|Array",
        status: "boolean|string|number|Node|Function|Array",
        statusColor: "success|warning|danger|info|primary|secondary|dark|light|string",
        topLeft: "Node|Function|Array",
        topRight: "Node|Function|Array",
        bottomLeft: "Node|Function|Array",
        bottomRight: "Node|Function|Array",
        slots: "{ media?, default?, fallback?, label?, icon?, badge?, status?, topLeft?, topRight?, bottomLeft?, bottomRight? }",
        mobile: "{ width?, height?, minWidth?, maxWidth?, padding?, margin?, radius? }",
        tablet: "{ width?, height?, minWidth?, maxWidth?, padding?, margin?, radius? }",
        pc: "{ width?, height?, minWidth?, maxWidth?, padding?, margin?, radius? }",
        class: "string",
        style: "object"
      },
      slots: {
        media: "Custom main media",
        default: "Custom main content instead of image or fallback",
        fallback: "Fallback custom quando non c'e immagine",
        label: "Fallback testuale / initials",
        icon: "Fallback icon",
        badge: "Badge overlay, di default top-right",
        status: "Presence dot or overlay content, bottom-right by default",
        topLeft: "Top-left overlay content",
        topRight: "Top-right overlay content",
        bottomLeft: "Bottom-left overlay content",
        bottomRight: "Bottom-right overlay content"
      },
      returns: "HTMLDivElement",
      description: "Flexible avatar with image, smart fallbacks, states, badge, and overlay slots."
    };
  }
  // Esempio: JSswift.ui.Avatar({ label: "CM" })

  UI.Chip = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? v : "";
    });
    const cls = uiClass([
      "cms-clear-set",
      "cms-chip",
      "cms-singularity",
      sizeClass,
      props.class
    ]);
    const p = JSswift.omit(props, ["label", "border", "color", "icon", "iconRight", "removable", "onRemove", "dense", "flat", "glossy", "outline", "slots"]);
    p.class = cls;
    p.style = {
      ...(props.style || {})
    };

    const iconFallback = props.icon
      ? (typeof props.icon === "string" ? UI.Icon({ name: props.icon, size: props?.size ?? null }) : JSswift.ui.slot(props.icon, { as: "icon" }))
      : null;
    const iconRightFallback = props.iconRight
      ? (typeof props.iconRight === "string" ? UI.Icon({ name: props.iconRight, size: props?.size ?? null }) : JSswift.ui.slot(props.iconRight, { as: "iconRight" }))
      : null;
    const iconNode = JSswift.ui.renderSlot(slots, "icon", {}, iconFallback);
    const iconRightNode = JSswift.ui.renderSlot(slots, "iconRight", {}, iconRightFallback);
    const labelNodes = renderSlotToArray(slots, "label", {}, props.label);
    const labelNode = labelNodes.length ? labelNodes : renderSlotToArray(slots, "default", {}, children);

    const iconNodes = renderSlotToArray(null, "default", {}, iconNode);
    const iconRightNodes = renderSlotToArray(null, "default", {}, iconRightNode);
    const wrap = _.span(p, ...iconNodes, ...(labelNode.length ? labelNode : [""]), ...iconRightNodes);
    if (props.removable) {
      const btn = UI.Btn({ class: "cms-chip-remove", onClick: props.onRemove, size: props?.size ?? null }, UI.Icon({ size: props?.size ?? null, name: "close" }));
      wrap.appendChild(btn);
      btn.onclick = () => {
        if (props.onRemove) {
          props.onRemove();
        }
        wrap.remove();
      }
    }
    setPropertyProps(wrap, props);
    return wrap;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Chip = {
      signature: "UI.Chip(...children) | UI.Chip(props, ...children)",
      props: {
        label: "String|Node|Function|Array",
        icon: "String|Node|Function|Array",
        iconRight: "String|Node|Function|Array",
        removable: "boolean",
        onRemove: "function",
        dense: "boolean",
        outline: "boolean|string|number",
        slots: "{ icon?, label?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        icon: "Chip icon content",
        iconRight: "Chip right icon content",
        label: "Chip label content",
        default: "Fallback content"
      },
      events: {
        onRemove: "MouseEvent"
      },
      returns: "HTMLSpanElement",
      description: "Chip with optional icon and removal."
    };
  }
  // Esempio: JSswift.ui.Chip({ label: "Tag", removable: true })

  UI.Stat = (...args) => {
    const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.state) || uiUnwrap(rawProps.color) || "");
    const stateClass = uiComputed([rawProps.state, rawProps.color], () => {
      const state = resolveStateValue();
      return state ? `cms-state-${state}` : "";
    });
    const trendClass = uiComputed(rawProps.trend, () => {
      const raw = String(uiUnwrap(rawProps.trend) || "").toLowerCase();
      if (["up", "positive", "success", "gain", "increase"].includes(raw)) return "is-positive";
      if (["down", "negative", "danger", "loss", "decrease"].includes(raw)) return "is-negative";
      if (["flat", "neutral", "steady", "stable"].includes(raw)) return "is-neutral";
      return "";
    });

    const props = { ...rawProps };
    const p = JSswift.omit(props, [
      "actions",
      "aside",
      "delta",
      "eyebrow",
      "footer",
      "icon",
      "iconSize",
      "label",
      "meta",
      "note",
      "slots",
      "state",
      "subtitle",
      "title",
      "trend",
      "value"
    ]);
    p.class = uiClass([
      "cms-clear-set",
      "cms-stat",
      "cms-singularity",
      stateClass,
      trendClass,
      props.class
    ]);
    p.style = { ...(props.style || {}) };

    const renderNamed = (slotName, fallback, ctx = {}) => renderSlotToArray(
      slots,
      slotName,
      ctx,
      fallback
    );

    const iconFallback = rawProps.icon == null
      ? null
      : (typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || "md" })
        : JSswift.ui.slot(rawProps.icon, { as: "icon" }));

    const eyebrowNodes = renderNamed("eyebrow", rawProps.eyebrow);
    const labelNodes = renderNamed("label", rawProps.label ?? rawProps.title);
    const valueNodes = renderNamed("value", rawProps.value);
    const noteNodes = renderNamed("note", rawProps.note ?? rawProps.subtitle);
    const metaNodes = renderNamed("meta", rawProps.meta);
    const deltaNodes = renderNamed("delta", rawProps.delta, { trend: rawProps.trend });
    const iconNodes = renderNamed("icon", iconFallback);
    const asideNodes = renderNamed("aside", rawProps.aside);
    const footerNodes = renderNamed("footer", rawProps.footer);
    const actionsNodes = renderNamed("actions", rawProps.actions);
    const bodyNodes = renderNamed("default", children);

    const stat = _.article(
      p,
      _.div(
        { class: "cms-stat-head" },
        _.div(
          { class: "cms-stat-lead" },
          iconNodes.length ? _.div({ class: "cms-stat-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-stat-copy" },
            eyebrowNodes.length ? _.div({ class: "cms-stat-eyebrow" }, ...eyebrowNodes) : null,
            labelNodes.length ? _.div({ class: "cms-stat-label" }, ...labelNodes) : null
          )
        ),
        asideNodes.length ? _.div({ class: "cms-stat-aside" }, ...asideNodes) : null
      ),
      _.div(
        { class: "cms-stat-body" },
        valueNodes.length ? _.div({ class: "cms-stat-value" }, ...valueNodes) : null,
        deltaNodes.length
          ? _.div({ class: "cms-stat-delta" }, ...deltaNodes)
          : null,
        noteNodes.length ? _.div({ class: "cms-stat-note" }, ...noteNodes) : null,
        metaNodes.length ? _.div({ class: "cms-stat-meta" }, ...metaNodes) : null,
        bodyNodes.length ? _.div({ class: "cms-stat-extra" }, ...bodyNodes) : null
      ),
      (footerNodes.length || actionsNodes.length)
        ? _.div(
          { class: "cms-stat-footer" },
          footerNodes.length ? _.div({ class: "cms-stat-footer-copy" }, ...footerNodes) : null,
          actionsNodes.length ? _.div({ class: "cms-stat-actions" }, ...actionsNodes) : null
        )
        : null
    );

    setPropertyProps(stat, rawProps);
    return stat;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Stat = {
      signature: "UI.Stat(...children) | UI.Stat(props, ...children)",
      props: {
        eyebrow: "String|Node|Function|Array",
        label: "String|Node|Function|Array",
        title: "Alias of label",
        value: "String|Number|Node|Function|Array",
        delta: "String|Node|Function|Array",
        trend: "up|down|flat|positive|negative|neutral",
        note: "String|Node|Function|Array",
        subtitle: "Alias of note",
        meta: "Node|Function|Array",
        icon: "String|Node|Function|Array",
        aside: "Node|Function|Array",
        footer: "Node|Function|Array",
        actions: "Node|Function|Array",
        state: "primary|secondary|success|warning|danger|info|light|dark",
        slots: "{ eyebrow?, label?, value?, delta?, note?, meta?, icon?, aside?, footer?, actions?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        eyebrow: "Small kicker above the stat label",
        label: "Main stat label",
        value: "Primary metric value",
        delta: "Trend / delta content",
        note: "Supporting note",
        meta: "Extra meta badges or info",
        icon: "Leading icon or avatar",
        aside: "Right-side support content",
        footer: "Footer/supporting bottom content",
        actions: "Footer actions cluster",
        default: "Extra body content"
      },
      returns: "HTMLElement",
      description: "Compact surface for single metrics, trends, and operational metadata."
    };
  }
  // Esempio: JSswift.ui.Stat({ label: "Revenue", value: "€ 128k", delta: "+18%" })

  UI.Kpi = (...args) => {
    const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const resolveStateValue = () => normalizeState(uiUnwrap(rawProps.state) || uiUnwrap(rawProps.color) || "");
    const stateClass = uiComputed([rawProps.state, rawProps.color], () => {
      const state = resolveStateValue();
      return state ? `cms-state-${state}` : "";
    });

    const props = { ...rawProps };
    const p = JSswift.omit(props, [
      "actions",
      "aside",
      "delta",
      "eyebrow",
      "footer",
      "icon",
      "iconSize",
      "label",
      "media",
      "meta",
      "note",
      "slots",
      "state",
      "subtitle",
      "title",
      "trend",
      "value"
    ]);
    p.class = uiClass([
      "cms-clear-set",
      "cms-kpi",
      "cms-singularity",
      stateClass,
      props.class
    ]);
    p.style = { ...(props.style || {}) };

    const renderNamed = (slotName, fallback, ctx = {}) => renderSlotToArray(
      slots,
      slotName,
      ctx,
      fallback
    );

    const iconFallback = rawProps.icon == null
      ? null
      : (typeof rawProps.icon === "string"
        ? UI.Icon({ name: rawProps.icon, size: rawProps.iconSize || "lg" })
        : JSswift.ui.slot(rawProps.icon, { as: "icon" }));

    const eyebrowNodes = renderNamed("eyebrow", rawProps.eyebrow);
    const titleNodes = renderNamed("title", rawProps.title ?? rawProps.label);
    const valueNodes = renderNamed("value", rawProps.value);
    const deltaNodes = renderNamed("delta", rawProps.delta, { trend: rawProps.trend });
    const noteNodes = renderNamed("note", rawProps.note ?? rawProps.subtitle);
    const metaNodes = renderNamed("meta", rawProps.meta);
    const iconNodes = renderNamed("icon", iconFallback);
    const asideNodes = renderNamed("aside", rawProps.aside);
    const mediaNodes = renderNamed("media", rawProps.media);
    const footerNodes = renderNamed("footer", rawProps.footer);
    const actionsNodes = renderNamed("actions", rawProps.actions);
    const bodyNodes = renderNamed("default", children);

    const kpi = _.section(
      p,
      _.div(
        { class: "cms-kpi-head" },
        _.div(
          { class: "cms-kpi-title-wrap" },
          iconNodes.length ? _.div({ class: "cms-kpi-icon" }, ...iconNodes) : null,
          _.div(
            { class: "cms-kpi-copy" },
            eyebrowNodes.length ? _.div({ class: "cms-kpi-eyebrow" }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: "cms-kpi-title" }, ...titleNodes) : null
          )
        ),
        asideNodes.length ? _.div({ class: "cms-kpi-aside" }, ...asideNodes) : null
      ),
      _.div(
        { class: "cms-kpi-core" },
        _.div(
          { class: "cms-kpi-value-wrap" },
          valueNodes.length ? _.div({ class: "cms-kpi-value" }, ...valueNodes) : null,
          deltaNodes.length ? _.div({ class: "cms-kpi-delta" }, ...deltaNodes) : null
        ),
        noteNodes.length ? _.div({ class: "cms-kpi-note" }, ...noteNodes) : null,
        metaNodes.length ? _.div({ class: "cms-kpi-meta" }, ...metaNodes) : null,
        mediaNodes.length ? _.div({ class: "cms-kpi-media" }, ...mediaNodes) : null,
        bodyNodes.length ? _.div({ class: "cms-kpi-extra" }, ...bodyNodes) : null
      ),
      (footerNodes.length || actionsNodes.length)
        ? _.div(
          { class: "cms-kpi-footer" },
          footerNodes.length ? _.div({ class: "cms-kpi-footer-copy" }, ...footerNodes) : null,
          actionsNodes.length ? _.div({ class: "cms-kpi-actions" }, ...actionsNodes) : null
        )
        : null
    );

    setPropertyProps(kpi, rawProps);
    return kpi;
  };
  if (JSswift.isDev?.()) {
    UI.meta = UI.meta || {};
    UI.meta.Kpi = {
      signature: "UI.Kpi(...children) | UI.Kpi(props, ...children)",
      props: {
        eyebrow: "String|Node|Function|Array",
        title: "String|Node|Function|Array",
        label: "Alias of title",
        value: "String|Number|Node|Function|Array",
        delta: "String|Node|Function|Array",
        trend: "up|down|flat|positive|negative|neutral",
        note: "String|Node|Function|Array",
        subtitle: "Alias of note",
        meta: "Node|Function|Array",
        media: "Node|Function|Array",
        icon: "String|Node|Function|Array",
        aside: "Node|Function|Array",
        footer: "Node|Function|Array",
        actions: "Node|Function|Array",
        state: "primary|secondary|success|warning|danger|info|light|dark",
        slots: "{ eyebrow?, title?, value?, delta?, note?, meta?, media?, icon?, aside?, footer?, actions?, default? }",
        class: "string",
        style: "object"
      },
      slots: {
        eyebrow: "Kicker content",
        title: "KPI title content",
        value: "Primary KPI value",
        delta: "Delta/trend content",
        note: "Supporting note",
        meta: "Extra meta badges or inline info",
        media: "Secondary data view or mini-visual content",
        icon: "Leading icon or avatar",
        aside: "Top-right support content",
        footer: "Bottom support content",
        actions: "Footer actions cluster",
        default: "Extra body content"
      },
      returns: "HTMLElement",
      description: "Richer surface for KPIs, headline metrics, and mini dashboard summaries."
    };
  }
  // Esempio: JSswift.ui.Kpi({ title: "Orders", value: "342", delta: "+12%" })

  const overlayAnimDuration = (el, fallback = 180) => {
    const d = getComputedStyle(el).transitionDuration;
    if (!d) return fallback;
    const first = d.split(",")[0].trim();
    if (!first) return fallback;
    const ms = first.includes("ms") ? parseFloat(first) : parseFloat(first) * 1000;
    return Number.isFinite(ms) ? ms : fallback;
  };

  const overlayEnter = (entry) => {
    if (!entry?.overlay || !entry?.panel) return;
    entry.overlay.classList.add("enter");
    entry.panel.classList.add("enter");
    requestAnimationFrame(() => {
      if (!entry?.overlay || !entry?.panel) return;
      entry.overlay.classList.add("entered");
      entry.panel.classList.add("entered");
      entry.overlay.classList.remove("enter");
      entry.panel.classList.remove("enter");
    });
  };

  const overlayLeave = (entry, done) => {
    if (!entry?.overlay || !entry?.panel) {
      done?.();
      return;
    }
    if (entry._closing) return;
    entry._closing = true;
    entry.overlay.classList.add("leave");
    entry.panel.classList.add("leave");
    const finish = () => {
      if (entry._closed) return;
      entry._closed = true;
      done?.();
    };
    const onEnd = (e) => {
      if (e.target !== entry.panel) return;
      entry.panel.removeEventListener("transitionend", onEnd);
      finish();
    };
    entry.panel.addEventListener("transitionend", onEnd);
    const ms = overlayAnimDuration(entry.panel, 180);
    setTimeout(finish, ms + 40);
  };

