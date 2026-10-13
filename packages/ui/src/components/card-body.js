  UI.cardBody = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const cls = uiClass(["jss-card-body", "jss-card-section", props.class]);
    const p = JSswift.omit(props, [
      "slots", "display", "direction", "wrap", "align", "justify", "gap",
      "rowGap", "columnGap", "padding", "width"
    ]);
    p.class = cls;
    JSswift.uiApplyResponsiveProps(p, props, JSswift.uiResponsiveStyleRules);
    const el = _.div(p, ...renderSlotToArray(slots, "default", {}, children));
    setPropertyProps(el, props);
    return el;
  };
