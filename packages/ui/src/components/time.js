
  UI.Time = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const sizeValue = uiComputed(props.size, () => {
      const value = String(uiUnwrap(props.size) || "").toLowerCase();
      return ["xs", "sm", "md", "lg", "xl"].includes(value) ? `jss-size-${value}` : "";
    });
    const getTimeOptions = () => {
      const detectedTime = uiExportTimeValue(
        uiExtractTimeFromValue(model ? model.get() : uiUnwrap(props.value) ?? initialRawValue, { withSeconds: true }),
        { withSeconds: true }
      );
      return {
        withSeconds: !!uiUnwrap(props.withSeconds ?? props.showSeconds) || /:\d{2}:\d{2}$/.test(detectedTime),
        min: uiUnwrap(props.min ?? props.minTime),
        max: uiUnwrap(props.max ?? props.maxTime),
        use12h: uiUnwrap(props.use12h ?? props.ampm)
      };
    };
    const getMinuteStep = () => {
      const raw = Number(uiUnwrap(props.minuteStep ?? 1));
      return Math.max(1, Math.min(30, Number.isFinite(raw) ? raw : 5));
    };
    const getSecondStep = () => {
      const raw = Number(uiUnwrap(props.secondStep ?? 1));
      return Math.max(1, Math.min(30, Number.isFinite(raw) ? raw : 5));
    };
    const valueBinding = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(valueBinding, "UI.Time:model");
    const initialRawValue = model ? model.get() : uiUnwrap(props.value);
    const parseTypedValue = (raw) => uiExtractTimeFromValue(raw, getTimeOptions());
    const formatDisplayValue = (value) => uiFormatTimeDisplay(value, getTimeOptions());
    const exportValue = (value) => uiExportTimeValue(value, getTimeOptions());
    const serializeValue = (value) => JSON.stringify(exportValue(value));

    let localValue = uiCloneTimeParts(parseTypedValue(initialRawValue));
    let workingValue = uiCloneTimeParts(localValue);
    let entry = null;
    let panelRoot = null;

    const fieldProps = {
      ...props,
      label: props.label ?? props.placeholder
    };
    const hasFloatingLabel = fieldProps.label != null || JSswift.ui.getSlot(slots, "label") != null;

    const displayInput = _.input({
      class: uiClass(["jss-input", "jss-time-display", sizeValue, uiWhen(props.manualInput, "is-manual"), props.inputClass]),
      type: "text",
      autocomplete: "off",
      placeholder: hasFloatingLabel ? "" : (props.placeholder ?? "Seleziona orario"),
      readOnly: !uiUnwrap(props.manualInput),
      disabled: !!uiUnwrap(props.disabled),
      value: formatDisplayValue(localValue)
    });
    displayInput.setAttribute("aria-haspopup", "dialog");
    const hiddenHost = _.div({ style: { display: "contents" } });
    const controlNode = _.div({ class: "jss-time-control", style: { display: "contents" } }, displayInput, hiddenHost);

    const field = UI.FormField({
      ...fieldProps,
      iconRight: props.iconRight ?? "schedule",
      control: controlNode,
      getValue: () => displayInput.value,
      onClear: () => {
        if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
        setTimeState(null, null, { commit: true });
        if (entry) closePanel();
      },
      onFocus: () => displayInput.focus()
    });

    const getCurrentValue = () => uiUnwrap(props.confirm) ? workingValue : localValue;
    const syncHiddenInputs = () => {
      hiddenHost.replaceChildren();
      const baseName = uiUnwrap(props.name);
      if (!baseName) return;
      hiddenHost.appendChild(_.input({ type: "hidden", name: baseName, value: exportValue(localValue) }));
    };
    const syncDisplay = () => {
      displayInput.readOnly = !uiUnwrap(props.manualInput);
      displayInput.disabled = !!uiUnwrap(props.disabled);
      displayInput.setAttribute("aria-expanded", entry ? "true" : "false");
      displayInput.value = formatDisplayValue(localValue);
      syncHiddenInputs();
      field._refresh?.();
    };
    const setTimeState = (nextValue, event, options = {}) => {
      const normalized = uiCloneTimeParts(parseTypedValue(nextValue));
      if (uiUnwrap(props.confirm) && options.commit !== true) {
        workingValue = uiCloneTimeParts(normalized);
        renderPanel();
        return normalized;
      }
      const prev = serializeValue(localValue);
      localValue = uiCloneTimeParts(normalized);
      workingValue = uiCloneTimeParts(normalized);
      syncDisplay();
      renderPanel();
      if (model && options.fromModel !== true) model.set(exportValue(normalized));
      const nextSerialized = serializeValue(normalized);
      if (options.emit !== false && nextSerialized !== prev) {
        const emitted = exportValue(normalized);
        props.onInput?.(emitted, event);
        props.onChange?.(emitted, event);
      }
      return normalized;
    };
    const shouldCloseOnSelect = (meta) => {
      if (uiUnwrap(props.confirm)) return false;
      if (props.closeOnSelect !== true) return false;
      if (getTimeOptions().withSeconds) return meta?.part === "second";
      return meta?.part === "minute";
    };
    const scrollTimeColumnsToSelection = (options = {}) => {
      uiCenterTimeColumnsToSelection(panelRoot, options);
    };
    const jumpToNow = () => {
      if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
      const scrollState = uiCaptureTimeColumnScrollState(panelRoot);
      setTimeState(new Date(), null, { commit: !uiUnwrap(props.confirm) });
      scrollTimeColumnsToSelection({ scrollState });
      if (!uiUnwrap(props.confirm) && props.closeOnSelect === true) closePanel();
    };
    const applyWorkingValue = () => {
      if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
      if (!uiUnwrap(props.confirm)) return;
      setTimeState(workingValue, null, { commit: true });
      if (props.closeOnSelect !== false) closePanel();
    };

    const renderPanel = () => {
      if (!panelRoot) return;
      const currentValue = getCurrentValue();
      const footerDisplayValue = formatDisplayValue(currentValue);
      const header = _.div({ class: "jss-time-header" });
      const columns = _.div({ class: "jss-time-columns" },
        _.div({ class: "jss-time-column-title" }, uiUnwrap(props.hoursLabel) || "Ore"),
        _.div({ class: "jss-time-column-title" }, uiUnwrap(props.minutesLabel) || "Min")
      );
      const withSeconds = getTimeOptions().withSeconds;
      if (withSeconds) {
        columns.appendChild(_.div({ class: "jss-time-column-title" }, uiUnwrap(props.secondsLabel) || "Sec"));
      }
      header.appendChild(columns);
      const body = uiCreateTimePickerSection({
        props: {
          min: uiUnwrap(props.min ?? props.minTime),
          max: uiUnwrap(props.max ?? props.maxTime),
          use12h: uiUnwrap(props.use12h ?? props.ampm),
          hoursLabel: uiUnwrap(props.hoursLabel) || "Ore",
          minutesLabel: uiUnwrap(props.minutesLabel) || "Min",
          secondsLabel: uiUnwrap(props.secondsLabel) || "Sec"
        },
        slots,
        value: currentValue,
        withSeconds: withSeconds,
        minuteStep: getMinuteStep(),
        secondStep: getSecondStep(),
        disabled: !!uiUnwrap(props.disabled),
        readonly: !!uiUnwrap(props.readonly),
        pointIcon: uiUnwrap(props.pointIcon),
        shortcuts: uiUnwrap(props.shortcuts ?? props.presets),
        onSelect: (nextTime, meta) => {
          const scrollState = uiCaptureTimeColumnScrollState(panelRoot);
          setTimeState(nextTime, null);
          scrollTimeColumnsToSelection({ scrollState });
          if (shouldCloseOnSelect(meta)) closePanel();
        }
      });
      const footer = _.div({ class: "jss-time-footer" },
        _.div({ class: "jss-time-value" },
          ...renderSlotToArray(
            slots,
            "value",
            { value: currentValue, displayValue: footerDisplayValue },
            footerDisplayValue || renderSlotToArray(slots, "default", {}, children)
          )
        ),
        _.div({ class: "jss-time-actions" },
          _.button({ type: "button", class: "jss-time-action", onClick: jumpToNow }, uiUnwrap(props.nowLabel) || "Ora"),
          uiUnwrap(props.clearable) !== false
            ? _.button({ type: "button", class: "jss-time-action", onClick: () => { if (!uiUnwrap(props.disabled) && !uiUnwrap(props.readonly)) setTimeState(null, null, { commit: !uiUnwrap(props.confirm) }); } }, uiUnwrap(props.clearLabel) || "Reset")
            : null,
          uiUnwrap(props.confirm)
            ? _.button({ type: "button", class: "jss-time-action is-primary", onClick: applyWorkingValue }, uiUnwrap(props.applyLabel) || "Applica")
            : null
        )
      );
      panelRoot.replaceChildren(_.div({
        class: "jss-time-panel-root",
        onKeydown: (event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closePanel();
          }
        }
      }, header, body, footer));
    };

    function openPanel() {
      if (entry || uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return entry;
      workingValue = uiCloneTimeParts(localValue);
      entry = JSswift.overlay.open(() => {
        panelRoot = _.div({ class: uiClassStatic(["jss-time-panel", uiUnwrap(sizeValue), props.panelClass]) });
        renderPanel();
        return panelRoot;
      }, {
        type: "time",
        anchorEl: field._control || displayInput,
        placement: props.placement || "bottom-start",
        offsetX: props.offsetX ?? 0,
        offsetY: props.offsetY ?? props.offset ?? 8,
        backdrop: false,
        lockScroll: false,
        trapFocus: false,
        closeOnOutside: props.closeOnOutside !== false,
        closeOnBackdrop: false,
        closeOnEsc: true,
        autoFocus: false,
        className: uiClassStatic(["jss-time-overlay", props.panelClass]),
        onClose: () => {
          entry = null;
          panelRoot = null;
          syncDisplay();
          props.onClose?.();
        }
      });
      const timeColor = uiUnwrap(props.color);
      entry.panel.classList.toggle("jss-time-uncolored", !timeColor);
      entry.panel.style.setProperty("--jss-time-accent", JSswift.uiColors.includes(timeColor)
        ? `var(--jss-${timeColor})` : (timeColor || "var(--jss-text-2, var(--jss-text))"));
      if (props.panelStyle) Object.assign(entry.panel.style, props.panelStyle);
      overlayEnter(entry);
      scrollTimeColumnsToSelection();
      syncDisplay();
      props.onOpen?.();
      return entry;
    }

    function closePanel() {
      if (!entry) return;
      const toClose = entry;
      overlayLeave(toClose, () => JSswift.overlay.close(toClose.id));
    }

    displayInput.addEventListener("focus", (event) => {
      props.onFocus?.(event);
      if (props.openOnFocus !== false) openPanel();
    });
    displayInput.addEventListener("click", (event) => {
      props.onClick?.(event);
      openPanel();
    });
    displayInput.addEventListener("keydown", (event) => {
      if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
      if (event.key === "Escape") {
        if (entry) {
          event.preventDefault();
          closePanel();
        }
        return;
      }
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPanel();
      }
      if ((event.key === "Backspace" || event.key === "Delete") && !uiUnwrap(props.manualInput) && uiUnwrap(props.clearable) !== false) {
        event.preventDefault();
        setTimeState(null, event, { commit: true });
      }
    });
    if (uiUnwrap(props.manualInput)) {
      displayInput.addEventListener("input", (event) => props.onTyping?.(displayInput.value, event));
      displayInput.addEventListener("change", (event) => { if (!uiUnwrap(props.disabled) && !uiUnwrap(props.readonly)) setTimeState(displayInput.value, event); });
      displayInput.addEventListener("blur", (event) => {
        props.onBlur?.(event);
        if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
        if (displayInput.value === "") setTimeState(null, event);
        else setTimeState(displayInput.value, event);
      });
    } else {
      displayInput.addEventListener("blur", (event) => props.onBlur?.(event));
    }

    if (model) {
      const stopModel = model.watch((next) => {
        const normalized = uiCloneTimeParts(parseTypedValue(next));
        if (serializeValue(normalized) === serializeValue(localValue)) return;
        localValue = uiCloneTimeParts(normalized);
        workingValue = uiCloneTimeParts(normalized);
        syncDisplay();
        renderPanel();
      }, "UI.Time:watch");
      JSswift._registerCleanup(field, stopModel);
    }

    const stopRender = JSswift.reactive.effect(() => {
      if (!model && props.value != null) {
        localValue = uiCloneTimeParts(parseTypedValue(uiUnwrap(props.value)));
        workingValue = uiCloneTimeParts(localValue);
      }
      syncDisplay();
      renderPanel();
      if (entry && uiUnwrap(props.disabled)) closePanel();
    }, "UI.Time:render");
    JSswift._registerCleanup(field, () => {
      stopRender();
      if (entry) JSswift.overlay.close(entry.id);
    });

    field._input = displayInput;
    field._time = displayInput;
    field._open = openPanel;
    field._close = closePanel;
    field._getValue = () => exportValue(localValue);
    field._setValue = (value) => setTimeState(value, null, { emit: false, commit: true });
    field._panel = () => entry?.panel || null;

    return field;
  };

  // Esempio: JSswift.ui.Time({ value: "09:30" })
