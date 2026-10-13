
  UI.Btn = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};

    const state = uiComputed([props.color, props.state], () => {
      const color = uiUnwrap(props.color) || uiUnwrap(props.state) || "";
      return ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"].includes(color)
        ? color
        : (uiUnwrap(props.state) || "");
    });

    const cls = uiClass(["jss-clear-set", "jss-btn", "jss-singularity", "jss-clickable", state, uiWhen(props.outline, "outline"), props.class]);

    const p = JSswift.omit(props, [
      "icon", "iconRight", "label", "loading", "loadingText", "disabled", "outline", "iconAlign", "slots",
      "shortcode", "shortcut", "hotkey", "showShortcode", "showShortcut"
    ]);
    p.class = cls;
    const isLoading = () => !!uiUnwrap(props.loading);
    const isDisabled = () => !!uiUnwrap(props.disabled) || isLoading();

    const iconFallback = props.icon != null
      ? (typeof props.icon === "string" ? UI.Icon({ name: props.icon }) : props.icon)
      : null;
    const iconRightFallback = props.iconRight != null
      ? (typeof props.iconRight === "string" ? UI.Icon({ name: props.iconRight }) : props.iconRight)
      : null;
    const icon = JSswift.ui.renderSlot(slots, "icon", {}, iconFallback);
    const iconRight = JSswift.ui.renderSlot(slots, "iconRight", {}, iconRightFallback);
    const label = JSswift.ui.renderSlot(slots, "label", {}, props.label);
    const slotChildren = renderSlotToArray(slots, "default", {}, children);

    const content = [];
    const pushAll = (x) => {
      if (!x) return;
      if (Array.isArray(x)) content.push(...x);
      else content.push(x);
    };

    const align = props.iconAlign;
    const iconAfter = align === "after" || align === "right";

    if (iconAfter && !iconRightFallback) {
      pushAll(label);
      if (slotChildren.length) content.push(...slotChildren);
      pushAll(icon);
    } else {
      pushAll(icon);
      pushAll(label);
      if (slotChildren.length) content.push(...slotChildren);
    }
    pushAll(iconRight);
    pushAll(uiCreateShortcodeHint(props, { className: "jss-shortcode jss-btn-shortcode" }));

    if (content.length === 0) content.push(_.span("Button"));

    const loadingNode = _.span({ class: "jss-btn-loading", hidden: true });
    const contentNode = _.span({ class: "jss-btn-content" }, ...content);
    let loadingVisible = false;
    const renderLoadingContent = () => {
      const fallback = UI.Spinner
        ? UI.Spinner({
            size: props.loadingSize || props.spinnerSize || 16,
            thickness: props.loadingThickness || 2,
            color: props.loadingColor || "currentColor",
            label: props.loadingText || null,
            "aria-label": props.loadingText ? null : "Loading"
          })
        : _.span({ class: "jss-muted", style: { marginRight: "8px" } }, props.loadingText || "Loading");
      return renderSlotToArray(null, "default", {}, JSswift.ui.renderSlot(slots, "loading", {}, fallback));
    };

    const onPointerDown = (e) => {
      props.onPointerDown?.(e);
      if (isDisabled() || !e?.currentTarget) return;
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = typeof e.clientX === "number" ? e.clientX - rect.left : rect.width / 2;
      const y = typeof e.clientY === "number" ? e.clientY - rect.top : rect.height / 2;
      btn.style.setProperty("--jss-burst-x", `${x}px`);
      btn.style.setProperty("--jss-burst-y", `${y}px`);
      btn.classList.remove("jss-btn-burst");
      void btn.offsetWidth;
      btn.classList.add("jss-btn-burst");
    };

    const btn = _.button({
      ...p,
      disabled: isDisabled(),
      onClick: (event) => {
        if (isDisabled()) {
          event?.preventDefault?.();
          return false;
        }
        return props.onClick?.(event);
      },
      onPointerDown,
      "aria-disabled": isDisabled() ? "true" : null,
      "aria-busy": isLoading() ? "true" : null
    }, loadingNode, contentNode);

    const stopState = JSswift.reactive.effect(() => {
      const loading = isLoading();
      const disabled = isDisabled();
      btn.disabled = disabled;
      btn.classList.toggle("is-loading", loading);
      btn.setAttribute("aria-disabled", disabled ? "true" : "false");
      if (loading) btn.setAttribute("aria-busy", "true");
      else btn.removeAttribute("aria-busy");
      loadingNode.hidden = !loading;
      if (loading !== loadingVisible) {
        loadingNode.replaceChildren(...(loading ? renderLoadingContent() : []));
        loadingVisible = loading;
      }
    }, "UI.Btn:state");
    JSswift._registerCleanup?.(btn, stopState);

    setPropertyProps(btn, props);
    uiRegisterShortcode(btn, props, {
      isEnabled: () => !isDisabled(),
      action: () => {
        if (isDisabled()) return false;
        btn.click();
      }
    });
    return btn;
  }
  UI.Button = UI.Btn;
  JSswift.ui.Btn = UI.Btn;
  JSswift.ui.Button = UI.Button;

  // Esempio: JSswift.ui.QBtn({ color: "primary", icon: "save", label: "Salva" })
