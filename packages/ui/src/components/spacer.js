

  UI.Spacer = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const p = JSswift.omit(props, ["slots"]);
    p.class = uiClass(["jss-spacer", props.class]);
    const content = renderSlotToArray(slots, "default", {}, children);
    const el = _.div(p, ...content);
    setPropertyProps(el, props);
    return el;
  };
