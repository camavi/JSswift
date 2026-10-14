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
      "close": { viewBox: "0 0 24 24", paths: [{ d: "m6 6 12 12M6 18 18 6", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round" }] },
      "chevron-left": { viewBox: "0 0 24 24", paths: [{ d: "m15 5-7 7 7 7", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }] },
      "chevron-right": { viewBox: "0 0 24 24", paths: [{ d: "m9 5 7 7-7 7", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }] },
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
      "jss-icon",
      typeof name === "string" && !name.includes("#") ? "material-icons" : "",
      uiComputed(props.fill, () =>
        typeof name === "string" && !name.includes("#") && uiUnwrap(props.fill)
          ? "material-icons-fill" : ""),
      ...(hasVisualSurface ? ["jss-clear-set", "jss-singularity"] : []),
      sizeClass,
      props.class
    ]);
    const p = JSswift.omit(props, ["name", "size", "class", "style", "label", "border", "color", "icon", "iconRight", "removable", "onRemove", "dense", "flat", "glossy", "outline", "slots", "spriteUrl", "tooltip", "tooltipProps", "fill"]);
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
        v = `var(--jss-icon-size-${size})`;
      }
      v = typeof v === "number" ? v + "px" : String(v);
      icon.style.setProperty("--set-icon-size", v);
    }

    setPropertyProps(icon, props);
    return wrapIcon(icon);
  };

  // Esempio: JSswift.ui.Icon({ name: "home", size: 18 })
