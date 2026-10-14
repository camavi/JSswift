
  // Input: supporta value come rod (two-way) oppure rod via props.model
  // props: { model: rod OR [get,set] signal OR plain, placeholder, type }


  let uiFieldMessageId = 0;
  UI.FormField = (props = {}) => {

    applyCommonProps(props);

    const slots = props.slots || {};
    const state = uiComputed([props.color, props.state], () => {
      const color = uiUnwrap(props.color) || uiUnwrap(props.state) || "";
      return ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"].includes(color)
        ? color
        : (uiUnwrap(props.state) || "");
    });

    const wrap = _.div({ class: uiClass(["jss-clear-field-set", "jss-field", "jss-singularity-field", state, uiWhen(props.fill, "jss-field-fill"), uiWhen(props.outline, "outline"), props.wrapClass, props.class]) });

    const topLabelNodes = renderSlotToArray(slots, "topLabel", {}, props.topLabel);
    if (topLabelNodes.length) {
      wrap.appendChild(_.div({ class: "jss-field-label" }, ...topLabelNodes));
    }
    const isMulti = props.multi || props.multiple;

    const controlEl = typeof props.control === "function" ? props.control() : props.control;
    const getHasValue = () => {
      if (typeof props.hasValue === "function") return !!props.hasValue();
      if (props.hasValue != null) return !!uiUnwrap(props.hasValue);
      const v = props.getValue ? props.getValue() : null;
      return !(v == null || v === "");
    };
    const getHasValueUntracked = () => JSswift.reactive.untracked(getHasValue);
    const clear = () => {
      if (props.disabled || props.readonly) return;
      props.onClear?.();
      props.onFocus?.();
    };

    const controlSlot = JSswift.ui.renderSlot(slots, "control", {
      control: controlEl,
      clear,
      disabled: !!props.disabled,
      readonly: !!props.readonly,
      hasValue: getHasValueUntracked()
    }, null);

    let control = null;
    let clearBtn = null;

    if (controlSlot) {
      control = Array.isArray(controlSlot)
        ? _.div({ class: "jss-control" }, ...controlSlot)
        : controlSlot;
    } else {
      control = _.div({ class: "jss-control" });

      // left addon
      const left = _.div({ class: "jss-addon jss-addon-left" });
      const iconFallback = props.icon != null
        ? (typeof props.icon === "string" ? UI.Icon({ name: props.icon }) : props.icon)
        : null;
      const iconNode = JSswift.ui.renderSlot(slots, "icon", {}, iconFallback);
      const prefixNode = JSswift.ui.renderSlot(slots, "prefix", {}, props.prefix);
      renderSlotToArray(null, "default", {}, iconNode).forEach(n => left.appendChild(n));
      renderSlotToArray(null, "default", {}, prefixNode).forEach(n => left.appendChild(n));
      if (left.childNodes.length) control.appendChild(left);

      // middle: controlEl + floating label
      const mid = _.div({ class: "jss-mid" + (left.childNodes.length > 0 ? " jss-with-left" : ""), style: { position: "relative", flex: "1", minWidth: "0" } });
      if (controlEl) mid.appendChild(controlEl);

      const labelNodes = renderSlotToArray(slots, "label", {}, props.label);
      if (labelNodes.length) {
        const floatLabel = _.div({ class: uiClass(["jss-float-label", uiWhen(isMulti, "jss-multiselect")]) }, ...labelNodes);
        mid.appendChild(floatLabel);
      }

      control.appendChild(mid);

      // clear
      const defaultClear = props.clearable ? _.div({
        class: "jss-clear",
        title: "Clear",
        onClick: clear
      }, UI.Icon({ name: "#close" })) : null;

      const clearNode = JSswift.ui.renderSlot(slots, "clear", {

        disabled: !!props.disabled,
        readonly: !!props.readonly,
        hasValue: getHasValueUntracked()
      }, defaultClear);

      if (clearNode) {
        clearNode.onclick = (e) => {
          e.stopPropagation();
          clear();
        }
        renderSlotToArray(null, "default", {}, clearNode).forEach(n => control.appendChild(n));
      }

      clearBtn = defaultClear;
      if (clearBtn && props.clearable?.action) {
        props.clearable.action((v) => v ? clearBtn.classList.remove("jss-d-none") : clearBtn.classList.add("jss-d-none"));
      }

      // right addon
      const right = _.div({ class: "jss-addon jss-addon-right" });
      const iconRightFallback = props.iconRight != null
        ? (typeof props.iconRight === "string" ? UI.Icon({ name: props.iconRight }) : props.iconRight)
        : null;
      const iconRightNode = JSswift.ui.renderSlot(slots, "iconRight", {}, iconRightFallback);
      const suffixNode = JSswift.ui.renderSlot(slots, "suffix", {}, props.suffix);
      const shortcodeNode = JSswift.ui.renderSlot(slots, "shortcode", { props }, uiCreateShortcodeHint(props, { className: "jss-shortcode jss-field-shortcode" }));
      renderSlotToArray(null, "default", {}, suffixNode).forEach(n => right.appendChild(n));
      renderSlotToArray(null, "default", {}, iconRightNode).forEach(n => right.appendChild(n));
      renderSlotToArray(null, "default", {}, shortcodeNode).forEach(n => right.appendChild(n));
      if (right.childNodes.length) {
        control.appendChild(right);
        mid.classList.add("jss-with-right");
      }
    }

    const resolveValue = (value) => {
      if (!value) return value;
      if (value && typeof value.action === "function") return value.value;
      if (Array.isArray(value) && typeof value[0] === "function") return value[0]();
      if (typeof value === "function") return value();
      return value;
    };
    const hasContent = (value) => {
      if (value == null || value === false || value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    };
    let messageEl = null;
    const messageId = `jsswift-field-message-${++uiFieldMessageId}`;
    const syncDescription = () => {
      if (!controlEl?.setAttribute) return;
      const ids = [uiUnwrap(props.ariaDescribedBy), messageEl?.id].filter(Boolean).join(" ").trim();
      if (ids) controlEl.setAttribute("aria-describedby", [...new Set(ids.split(/\s+/))].join(" "));
      else controlEl.removeAttribute("aria-describedby");
    };
    wrap._syncDescription = syncDescription;
    const renderMessage = () => {
      const statusOrder = [
        { key: "error", value: resolveValue(props.error), slot: "errorMessage", className: "jss-error" },
        { key: "warning", value: resolveValue(props.warning), slot: "warning", className: "jss-warning" },
        { key: "success", value: resolveValue(props.success), slot: "success", className: "jss-success" },
        { key: "note", value: resolveValue(props.note), slot: "note", className: "jss-note" },
        { key: "hint", value: resolveValue(props.hint), slot: "hint", className: "jss-hint" }
      ];
      let active = null;
      for (const item of statusOrder) {
        if (hasContent(item.value)) {
          active = item;
          break;
        }
      }
      const ctx = {
        error: statusOrder[0].value,
        warning: statusOrder[1].value,
        success: statusOrder[2].value,
        note: statusOrder[3].value,
        hint: statusOrder[4].value,
        props
      };
      const nodes = active
        ? renderSlotToArray(slots, active.slot, ctx, active.value)
        : [];
      const nextEl = nodes.length
        ? _.div({ id: messageId, class: active?.className }, ...nodes)
        : null;

      const stateKeys = ["error", "warning", "success", "note"];
      stateKeys.forEach((k) => control?.classList?.toggle(k, active?.key === k));

      if (messageEl) {
        if (nextEl) messageEl.replaceWith(nextEl);
        else messageEl.remove();
      } else if (nextEl) {
        wrap.appendChild(nextEl);
      }
      messageEl = nextEl;
      syncDescription();
    };

    // state updater
    const setHasValue = () => {
      const has = getHasValue();
      control?.classList?.toggle("has-value", has);
      if (clearBtn) clearBtn.style.display = has ? "" : "none";
    };

    // initial states
    JSswift.reactive.untracked(setHasValue);
    control?.classList?.toggle("disabled", !!props.disabled);

    wrap.appendChild(control);
    const errorSlot = JSswift.ui.getSlot(slots, "errorMessage");
    const warningSlot = JSswift.ui.getSlot(slots, "warning");
    const successSlot = JSswift.ui.getSlot(slots, "success");
    const noteSlot = JSswift.ui.getSlot(slots, "note");
    const hintSlot = JSswift.ui.getSlot(slots, "hint");
    const canReact = !!(props.error?.action || props.warning?.action || props.success?.action || props.note?.action || props.hint?.action)
      || (Array.isArray(props.error) && typeof props.error[0] === "function")
      || (Array.isArray(props.warning) && typeof props.warning[0] === "function")
      || (Array.isArray(props.success) && typeof props.success[0] === "function")
      || (Array.isArray(props.note) && typeof props.note[0] === "function")
      || (Array.isArray(props.hint) && typeof props.hint[0] === "function")
      || typeof props.error === "function"
      || typeof props.warning === "function"
      || typeof props.success === "function"
      || typeof props.note === "function"
      || typeof props.hint === "function"
      || typeof errorSlot === "function"
      || typeof warningSlot === "function"
      || typeof successSlot === "function"
      || typeof noteSlot === "function"
      || typeof hintSlot === "function";
    if (canReact) {
      const stopMessage = JSswift.reactive.effect(() => { renderMessage(); }, "UI.FormField:message");
      JSswift._registerCleanup(wrap, stopMessage);
    } else {
      renderMessage();
    }

    // expose small API so Input/Select can refresh state when value changes programmatically
    wrap._refresh = setHasValue;
    wrap._control = control;
    wrap._el = controlEl;

    setPropertyProps(wrap, props);
    if (typeof props.size === "number" || JSswift.uiSizes.includes(props.size)) {
      wrap.style.setProperty("--jss-field-size-height", "calc(var(--jss-font-size, 14px) * 1.5 + 10px)");
    }

    return wrap;
  };
