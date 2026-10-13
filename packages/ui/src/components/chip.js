
  UI.Chip = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeClass = uiComputed(props.size, () => {
      const v = uiUnwrap(props.size);
      return (typeof v === "string" && sizeMap[v]) ? v : "";
    });
    const cls = uiClass([
      "jss-clear-set",
      "jss-chip",
      "jss-singularity",
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
      const btn = UI.Btn({ class: "jss-chip-remove", onClick: props.onRemove, size: props?.size ?? null }, UI.Icon({ size: props?.size ?? null, name: "close" }));
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

  // Esempio: JSswift.ui.Chip({ label: "Tag", removable: true })
