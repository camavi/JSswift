
  const uiCloneTimeParts = (value) => {
    if (!value) return null;
    return {
      hour: Number(value.hour) || 0,
      minute: Number(value.minute) || 0,
      second: Number(value.second) || 0
    };
  };
  const uiTimePad = (value) => String(Math.max(0, Number(value) || 0)).padStart(2, "0");
  const uiNormalizeTimeParts = (raw, options = {}) => {
    if (raw == null || raw === "") return null;
    let hour = null;
    let minute = null;
    let second = 0;
    let meridiem = null;

    if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
      hour = raw.getHours();
      minute = raw.getMinutes();
      second = raw.getSeconds();
    } else if (typeof raw === "number" && Number.isFinite(raw)) {
      const total = Math.max(0, Math.floor(raw));
      hour = Math.floor(total / 3600) % 24;
      minute = Math.floor(total / 60) % 60;
      second = total % 60;
    } else if (typeof raw === "object") {
      if (raw.time != null || raw.value != null) return uiNormalizeTimeParts(raw.time ?? raw.value, options);
      hour = Number(raw.hour ?? raw.hours ?? raw.h ?? raw.hh);
      minute = Number(raw.minute ?? raw.minutes ?? raw.min ?? raw.mm ?? 0);
      second = Number(raw.second ?? raw.seconds ?? raw.sec ?? raw.ss ?? 0);
      meridiem = raw.meridiem ?? raw.ampm ?? raw.period ?? null;
    } else if (typeof raw === "string") {
      const value = raw.trim();
      if (!value) return null;
      const compact = value.match(/^(\d{1,2})(\d{2})(\d{2})?$/);
      const match = value.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*([ap]m)?/i);
      if (match) {
        hour = Number(match[1]);
        minute = Number(match[2]);
        second = match[3] != null ? Number(match[3]) : 0;
        meridiem = match[4] || null;
      } else if (compact) {
        hour = Number(compact[1]);
        minute = Number(compact[2]);
        second = compact[3] != null ? Number(compact[3]) : 0;
      } else {
        return null;
      }
    } else {
      return null;
    }

    if (!Number.isFinite(hour) || !Number.isFinite(minute) || !Number.isFinite(second)) return null;
    if (meridiem) {
      const lower = String(meridiem).toLowerCase();
      if (lower === "pm" && hour < 12) hour += 12;
      if (lower === "am" && hour === 12) hour = 0;
    }
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return null;

    const normalized = {
      hour: Math.floor(hour),
      minute: Math.floor(minute),
      second: Math.floor(second)
    };
    return uiConstrainTimeParts(normalized, options);
  };
  const uiExportTimeValue = (value, options = {}) => {
    const parts = value && typeof value === "object" && value.hour != null
      ? uiCloneTimeParts(value)
      : uiNormalizeTimeParts(value, options);
    if (!parts) return "";
    const withSeconds = options.withSeconds === true || Number(parts.second || 0) > 0;
    return `${uiTimePad(parts.hour)}:${uiTimePad(parts.minute)}${withSeconds ? `:${uiTimePad(parts.second)}` : ""}`;
  };
  const uiCompareTimeValue = (a, b) => {
    const av = uiExportTimeValue(a, { withSeconds: true });
    const bv = uiExportTimeValue(b, { withSeconds: true });
    if (!av && !bv) return 0;
    if (!av) return -1;
    if (!bv) return 1;
    return av < bv ? -1 : (av > bv ? 1 : 0);
  };
  function uiConstrainTimeParts(value, options = {}) {
    if (!value) return null;
    const out = uiCloneTimeParts(value);
    const min = options.min != null ? uiNormalizeTimeParts(options.min, { withSeconds: true }) : null;
    const max = options.max != null ? uiNormalizeTimeParts(options.max, { withSeconds: true }) : null;
    if (min && uiCompareTimeValue(out, min) < 0) return uiCloneTimeParts(min);
    if (max && uiCompareTimeValue(out, max) > 0) return uiCloneTimeParts(max);
    return out;
  }
  const uiExtractTimeFromValue = (raw, options = {}) => {
    if (raw == null || raw === "") return null;
    if (raw instanceof Date) return uiNormalizeTimeParts(raw, options);
    if (typeof raw === "object") return uiNormalizeTimeParts(raw.time != null ? raw.time : raw, options);
    if (typeof raw === "string" || typeof raw === "number") return uiNormalizeTimeParts(raw, options);
    return null;
  };
  const uiFormatTimeDisplay = (value, options = {}) => {
    const parts = uiNormalizeTimeParts(value, options);
    if (!parts) return "";
    const withSeconds = options.withSeconds === true || Number(parts.second || 0) > 0;
    const use12h = !!uiUnwrap(options.use12h ?? options.ampm);
    if (!use12h) {
      return `${uiTimePad(parts.hour)}:${uiTimePad(parts.minute)}${withSeconds ? `:${uiTimePad(parts.second)}` : ""}`;
    }
    const meridiem = parts.hour >= 12 ? "PM" : "AM";
    const hour = parts.hour % 12 || 12;
    return `${uiTimePad(hour)}:${uiTimePad(parts.minute)}${withSeconds ? `:${uiTimePad(parts.second)}` : ""} ${meridiem}`;
  };
  const uiMergeDateAndTime = (dateValue, timeValue, options = {}) => {
    if (!dateValue) return "";
    const time = uiExportTimeValue(timeValue, options);
    return time ? `${dateValue}T${time}` : dateValue;
  };
  const uiBuildTimeSteps = (step, max) => {
    const safeStep = Math.max(1, Math.min(max + 1, Math.round(Number(step) || 1)));
    const out = [];
    for (let value = 0; value <= max; value += safeStep) out.push(value);
    return out;
  };
  const uiCreateTimePickerSection = (config = {}) => {
    const {
      props = {},
      slots = {},
      value = null,
      withSeconds = false,
      minuteStep = 5,
      secondStep = 5,
      disabled = false,
      readonly = false,
      embedded = false,
      className = "",
      slotPrefix = "",
      shortcuts = null,
      onSelect = null
    } = config;
    const selectedValue = uiNormalizeTimeParts(value, { withSeconds, min: props.min, max: props.max });
    const baseParts = selectedValue
      || uiNormalizeTimeParts(new Date(), { withSeconds, min: props.min, max: props.max })
      || { hour: 0, minute: 0, second: 0 };
    const selectedParts = selectedValue ? uiCloneTimeParts(selectedValue) : null;
    const prefixed = (name) => slotPrefix ? `${slotPrefix}${name[0].toUpperCase()}${name.slice(1)}` : null;
    const renderNamedSlot = (name, ctx, fallback) => {
      const candidates = [prefixed(name), name].filter(Boolean);
      for (const candidate of candidates) {
        const slotValue = JSswift.ui.getSlot(slots, candidate);
        if (slotValue == null) continue;
        const rendered = JSswift.ui.renderSlot(slots, candidate, ctx, fallback);
        if (rendered != null) return rendered;
      }
      return JSswift.ui.slot(fallback, ctx);
    };
    const renderPointNodes = (ctx) => {
      let pointNode = renderNamedSlot("point", ctx, null);
      if (pointNode == null && config.pointIcon != null && ctx.selected) {
        pointNode = typeof config.pointIcon === "string"
          ? UI.Icon({ name: config.pointIcon, size: embedded ? 10 : 12 })
          : JSswift.ui.slot(config.pointIcon, ctx);
      }
      return renderSlotToArray(null, "default", ctx, pointNode);
    };
    const makeRequestedValue = (part, optionValue) => {
      const next = {
        hour: baseParts.hour,
        minute: baseParts.minute,
        second: withSeconds ? baseParts.second : 0
      };
      next[part] = optionValue;
      return next;
    };
    const section = _.div({
      class: uiClass([
        "jss-time-section",
        uiWhen(embedded, "is-embedded"),
        uiWhen(withSeconds, "has-seconds"),
        className
      ])
    });
    const shortcutList = uiUnwrap(shortcuts) || [];
    if (Array.isArray(shortcutList) && shortcutList.length) {
      const shortcutWrap = _.div({ class: "jss-time-shortcuts" });
      shortcutList.forEach((item, index) => {
        if (!item) return;
        const rawValue = typeof item.value === "function"
          ? item.value({ now: uiExportTimeValue(new Date(), { withSeconds }) })
          : item.value;
        const normalizedValue = uiNormalizeTimeParts(rawValue, { withSeconds, min: props.min, max: props.max });
        if (!normalizedValue) return;
        const ctx = {
          item,
          index,
          value: uiExportTimeValue(normalizedValue, { withSeconds }),
          displayValue: uiFormatTimeDisplay(normalizedValue, { withSeconds, use12h: props.use12h ?? props.ampm })
        };
        const labelNode = renderNamedSlot("shortcut", ctx, item.label ?? item.text ?? ctx.displayValue);
        shortcutWrap.appendChild(_.button({
          type: "button",
          class: uiClass(["jss-time-shortcut", uiWhen(!!selectedParts && uiCompareTimeValue(normalizedValue, selectedParts) === 0, "is-selected")]),
          disabled: disabled || readonly,
          onClick: () => onSelect?.(normalizedValue, { shortcut: item, index })
        }, ...renderSlotToArray(null, "default", ctx, labelNode)));
      });
      if (shortcutWrap.childNodes.length) section.appendChild(shortcutWrap);
    }
    const columns = _.div({ class: "jss-time-columns" });
    const createColumn = (title, part, values) => {
      const column = _.div({ class: "jss-time-column", "data-time-part": part });
      const optionsWrap = _.div({ class: "jss-time-options" });
      values.forEach((optionValue) => {
        const requested = makeRequestedValue(part, optionValue);
        const normalized = uiConstrainTimeParts(requested, { withSeconds, min: props.min, max: props.max });
        const optionDisabled = disabled || readonly || uiCompareTimeValue(normalized, requested) !== 0;
        const selected = !!selectedParts && selectedParts[part] === optionValue;
        const ctx = {
          part,
          selected,
          disabled: optionDisabled,
          value: optionValue,
          label: uiTimePad(optionValue),
          timeValue: uiExportTimeValue(normalized, { withSeconds }),
          displayValue: uiFormatTimeDisplay(normalized, { withSeconds, use12h: props.use12h ?? props.ampm })
        };
        const optionNode = renderNamedSlot("option", ctx, ctx.label);
        const pointNodes = selected ? renderPointNodes(ctx) : [];
        optionsWrap.appendChild(_.button({
          type: "button",
          class: uiClass(["jss-time-option", uiWhen(selected, "is-selected"), uiWhen(optionDisabled, "is-disabled")]),
          disabled: optionDisabled,
          onClick: () => onSelect?.(normalized, { part, optionValue })
        },
          _.span({ class: "jss-time-option-label" }, ...renderSlotToArray(null, "default", ctx, optionNode)),
          pointNodes.length ? _.span({ class: "jss-time-option-point" }, ...pointNodes) : null
        ));
      });
      column.appendChild(optionsWrap);
      return column;
    };
    columns.appendChild(createColumn(uiUnwrap(props.hoursLabel) || "Ore", "hour", uiBuildTimeSteps(1, 23)));
    columns.appendChild(createColumn(uiUnwrap(props.minutesLabel) || "Min", "minute", uiBuildTimeSteps(minuteStep, 59)));
    if (withSeconds) {
      columns.appendChild(createColumn(uiUnwrap(props.secondsLabel) || "Sec", "second", uiBuildTimeSteps(secondStep, 59)));
    }
    section.appendChild(columns);
    return section;
  };

  const uiCaptureTimeColumnScrollState = (root) => {
    if (!root) return null;
    const state = {};
    root.querySelectorAll(".jss-time-column").forEach((column, index) => {
      const key = column.getAttribute("data-time-part") || String(index);
      state[key] = column.scrollTop;
    });
    return state;
  };

  const uiCenterTimeColumnsToSelection = (root, options = {}) => {
    if (!root) return;
    const scrollState = options.scrollState || null;
    const behavior = options.behavior ?? "smooth";
    root.querySelectorAll(".jss-time-column").forEach((column, index) => {
      const key = column.getAttribute("data-time-part") || String(index);
      const previousTop = scrollState && Number.isFinite(scrollState[key]) ? scrollState[key] : null;
      if (previousTop != null) column.scrollTop = previousTop;
      const selectedOption = column.querySelector(".jss-time-option.is-selected");
      if (!selectedOption) return;
      const maxTop = Math.max(0, column.scrollHeight - column.clientHeight);
      const targetTop = selectedOption.offsetTop - ((column.clientHeight - selectedOption.offsetHeight) / 2);
      const nextTop = Math.max(0, Math.min(maxTop, targetTop));
      if (Math.abs(column.scrollTop - nextTop) < 1) {
        column.scrollTop = nextTop;
        return;
      }
      if (behavior && typeof column.scrollTo === "function") {
        column.scrollTo({ top: nextTop, behavior });
        return;
      }
      column.scrollTop = nextTop;
    });
  };
