
  UI.Separator = (...args) => {
    const { props } = JSswift.uiNormalizeArgs(args);
    const cls = uiClass(["jss-clear-set", "jss-separator", "jss-singularity", uiWhen(props.vertical, "vertical"), props.class]);
    const p = JSswift.omit(props, ["vertical", "size", "slots"]);
    p.class = cls;
    const style = { ...(props.style || {}) };
    if (typeof uiUnwrap(props.gradient) === "number") {
      style["--jss-separator-gradient-deg"] = `${uiUnwrap(props.gradient)}deg`;
    }
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
