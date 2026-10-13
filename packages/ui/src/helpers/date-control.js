
  const buildDateControl = (args, options = {}) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const isCalendar = options.calendar === true;
    const slots = props.slots || {};
    const sizeValue = uiComputed(props.size, () => {
      const value = String(uiUnwrap(props.size) || "").toLowerCase();
      return ["xs", "sm", "md", "lg", "xl"].includes(value) ? `jss-size-${value}` : "";
    });
    const requestedMode = String(
      uiUnwrap(
        props.mode
        ?? (uiUnwrap(props.rangeMultiple ?? props.multipleRange ?? props.multiRange) ? "range-multiple" : null)
        ?? ((props.range && props.multiple) ? "range-multiple" : (props.range ? "range" : (props.multiple ? "multiple" : "single")))
      )
    ).toLowerCase();
    const mode = ["range-multiple", "multiple-range", "rangemultiple", "multiplerange", "range_multiple", "multiple_range", "multi-range", "multi_range", "ranges"]
      .includes(requestedMode)
      ? "range-multiple"
      : (requestedMode === "range"
        ? "range"
        : (requestedMode === "multiple" ? "multiple" : "single"));
    const valueBinding = props.model || ((uiIsSignal(props.value) || uiIsRod(props.value)) ? props.value : null);
    const model = resolveModel(valueBinding, isCalendar ? "UI.Calendar:model" : "UI.Datepicker:model");
    const initialRawValue = model ? model.get() : uiUnwrap(props.value);
    const rangeAsArray = uiUnwrap(props.rangeAs ?? props.rangeModel) === "array" || Array.isArray(initialRawValue);
    const rangeMultipleAsArray = uiUnwrap(props.rangeMultipleAs ?? props.multipleRangeAs) === "array"
      || (Array.isArray(initialRawValue) && Array.isArray(initialRawValue[0]));
    const isTimeEnabled = () => mode === "single" && !!uiUnwrap(props.withTime ?? props.time ?? props.timePicker ?? props.enableTime);
    const getTimeOptions = () => {
      const detectedTime = uiExportTimeValue(
        uiExtractTimeFromValue(uiUnwrap(props.timeValue) ?? (model ? model.get() : uiUnwrap(props.value)) ?? initialRawValue, { withSeconds: true }),
        { withSeconds: true }
      );
      return {
        withSeconds: !!uiUnwrap(props.timeWithSeconds ?? props.withSeconds ?? props.showSeconds)
          || /:\d{2}:\d{2}$/.test(detectedTime)
          || /:\d{2}:\d{2}$/.test(uiUnwrap(props.timeFormat) || ""),
        min: uiUnwrap(props.timeMin ?? props.minTime),
        max: uiUnwrap(props.timeMax ?? props.maxTime),
        use12h: uiUnwrap(props.time12h ?? props.use12h ?? props.ampm)
      };
    };
    const getTimeMinuteStep = () => {
      const raw = Number(uiUnwrap(props.timeMinuteStep ?? props.minuteStep ?? 5));
      return Math.max(1, Math.min(30, Number.isFinite(raw) ? raw : 5));
    };
    const getTimeSecondStep = () => {
      const raw = Number(uiUnwrap(props.timeSecondStep ?? props.secondStep ?? 5));
      return Math.max(1, Math.min(30, Number.isFinite(raw) ? raw : 5));
    };

    const pad = (n) => String(n).padStart(2, "0");
    const createDate = (year, month, day) => {
      const date = new Date(year, month, day);
      if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
      return date;
    };
    const toIsoDate = (date) => {
      if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };
    const fromIsoDate = (iso) => {
      if (typeof iso !== "string") return null;
      const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) return null;
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      const day = Number(match[3]);
      const date = new Date(year, month, day);
      if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
      return date;
    };
    const shiftDays = (iso, amount) => {
      const date = fromIsoDate(iso);
      if (!date) return null;
      date.setDate(date.getDate() + amount);
      return toIsoDate(date);
    };
    const shiftMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
    const monthStart = (value) => {
      if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), 1);
      const date = normalizeDateOnly(value);
      const parsed = fromIsoDate(date);
      return parsed ? new Date(parsed.getFullYear(), parsed.getMonth(), 1) : new Date();
    };
    const todayIso = () => toIsoDate(new Date());
    const isSameIso = (a, b) => !!a && !!b && a === b;
    const compareIso = (a, b) => {
      if (a == null && b == null) return 0;
      if (a == null) return -1;
      if (b == null) return 1;
      return a < b ? -1 : (a > b ? 1 : 0);
    };
    const diffDays = (a, b) => {
      const da = fromIsoDate(a);
      const db = fromIsoDate(b);
      if (!da || !db) return 0;
      return Math.round((db.getTime() - da.getTime()) / 86400000);
    };
    const ensureArray = (value) => Array.isArray(value) ? value.slice() : (value == null || value === "" ? [] : [value]);
    const cloneRangeValue = (value) => ({ from: value?.from || null, to: value?.to || null });
    const cloneRangeList = (value) => Array.isArray(value) ? value.map(cloneRangeValue) : [];
    const exportRangeValue = (value) => {
      const out = cloneRangeValue(value);
      return rangeAsArray ? [out.from, out.to] : out;
    };
    const exportRangeMultipleValue = (value) => cloneRangeList(value).map((item) => (
      rangeMultipleAsArray ? [item.from, item.to] : item
    ));
    const cloneValue = (value) => {
      if (mode === "multiple") return Array.isArray(value) ? value.slice() : [];
      if (mode === "range") return cloneRangeValue(value);
      if (mode === "range-multiple") return cloneRangeList(value);
      return value || null;
    };
    const exportValue = (value) => {
      if (mode === "multiple") return Array.isArray(value) ? value.slice() : [];
      if (mode === "range") return exportRangeValue(value);
      if (mode === "range-multiple") return exportRangeMultipleValue(value);
      return value || "";
    };
    const serializeValue = (value) => JSON.stringify(exportValue(value));
    const normalizeDateOnly = (raw) => {
      if (raw == null || raw === "") return null;
      if (raw instanceof Date) return toIsoDate(raw);
      if (typeof raw === "number") return toIsoDate(new Date(raw));
      if (typeof raw !== "string") {
        if (typeof raw === "object" && raw.date != null) return normalizeDateOnly(raw.date);
        return null;
      }
      const value = raw.trim();
      if (!value) return null;
      const isoLike = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|[T\s])/);
      if (isoLike) {
        const date = createDate(Number(isoLike[1]), Number(isoLike[2]) - 1, Number(isoLike[3]));
        return toIsoDate(date);
      }
      const euroLike = value.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
      if (euroLike) {
        const year = euroLike[3].length === 2 ? (2000 + Number(euroLike[3])) : Number(euroLike[3]);
        const date = createDate(year, Number(euroLike[2]) - 1, Number(euroLike[1]));
        return toIsoDate(date);
      }
      if (/^\d{1,4}$/.test(value)) return null;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      const explicitYear = value.match(/(?:^|[^\d])(\d{4})(?!\d)/);
      if (explicitYear && parsed.getFullYear() !== Number(explicitYear[1])) return null;
      return toIsoDate(parsed);
    };
    const normalizeRangeValue = (raw) => {
      if (raw == null || raw === "") return { from: null, to: null };
      let from = null;
      let to = null;
      if (Array.isArray(raw)) {
        from = normalizeDateOnly(raw[0]);
        to = normalizeDateOnly(raw[1]);
      } else if (typeof raw === "object") {
        from = normalizeDateOnly(raw.from ?? raw.start ?? raw.dateFrom ?? raw.departure);
        to = normalizeDateOnly(raw.to ?? raw.end ?? raw.dateTo ?? raw.return);
      } else {
        const found = String(raw).match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/g) || [];
        from = normalizeDateOnly(found[0]);
        to = normalizeDateOnly(found[1]);
      }
      if (from && to && from > to) [from, to] = [to, from];
      return { from, to };
    };
    const normalizeRangeMultipleValue = (raw) => {
      const out = [];
      const seen = new Set();
      const pushRange = (value) => {
        const normalized = normalizeRangeValue(value);
        if (!normalized.from) return;
        const key = `${normalized.from || ""}|${normalized.to || ""}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(normalized);
      };
      if (raw == null || raw === "") return out;
      if (Array.isArray(raw)) {
        const isFlatDateList = raw.every((item) => (
          item == null
          || typeof item === "string"
          || typeof item === "number"
          || item instanceof Date
        ));
        if (isFlatDateList) {
          const dates = raw.map(normalizeDateOnly).filter(Boolean);
          for (let index = 0; index < dates.length; index += 2) {
            pushRange({ from: dates[index], to: dates[index + 1] || null });
          }
        } else {
          raw.forEach((item) => pushRange(item));
        }
      } else if (typeof raw === "object" && Array.isArray(raw.ranges)) {
        raw.ranges.forEach((item) => pushRange(item));
      } else if (typeof raw === "object") {
        pushRange(raw);
      } else {
        const found = String(raw).match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/g) || [];
        const dates = found.map(normalizeDateOnly).filter(Boolean);
        for (let index = 0; index < dates.length; index += 2) {
          pushRange({ from: dates[index], to: dates[index + 1] || null });
        }
      }
      return out.sort((a, b) => compareIso(a.from, b.from) || compareIso(a.to, b.to));
    };
    const normalizeMultipleValue = (raw) => {
      const out = [];
      ensureArray(raw).forEach((item) => {
        const normalized = normalizeDateOnly(item);
        if (normalized && !out.includes(normalized)) out.push(normalized);
      });
      return out.sort();
    };
    const normalizeValue = (raw) => {
      if (mode === "range") return normalizeRangeValue(raw);
      if (mode === "range-multiple") return normalizeRangeMultipleValue(raw);
      if (mode === "multiple") return normalizeMultipleValue(raw);
      return normalizeDateOnly(raw);
    };
    const getMin = () => normalizeDateOnly(uiUnwrap(props.min ?? props.minDate));
    const getMax = () => normalizeDateOnly(uiUnwrap(props.max ?? props.maxDate));
    const getLocale = () => uiUnwrap(props.locale) || undefined;
    const getFirstDayOfWeek = () => {
      const raw = Number(uiUnwrap(props.firstDayOfWeek ?? props.weekStart ?? 1));
      return Number.isFinite(raw) ? ((raw % 7) + 7) % 7 : 1;
    };
    const getMonthsToShow = () => {
      const fallback = (mode === "range" || mode === "range-multiple") ? 2 : 1;
      const raw = Number(uiUnwrap(props.monthsToShow) ?? fallback);
      return Math.max(1, Math.min(4, Number.isFinite(raw) ? raw : fallback));
    };
    const getDefaultViewValue = () => {
      const min = getMin();
      const max = getMax();
      let fallback = normalizeDateOnly(uiUnwrap(props.defaultMonth)) || todayIso();
      if (min && fallback < min) fallback = min;
      if (max && fallback > max) fallback = max;
      return fallback || min || max || todayIso();
    };
    const getCurrentValue = () => uiUnwrap(props.confirm) ? workingValue : localValue;
    const getDateContext = (iso) => {
      const date = fromIsoDate(iso);
      if (!date) return { date: iso, value: iso };
      return {
        date: iso,
        value: iso,
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        weekday: date.getDay(),
        today: isSameIso(iso, todayIso())
      };
    };
    const matchesDateSpec = (spec, iso) => {
      if (spec == null) return false;
      if (Array.isArray(spec)) return spec.some((item) => normalizeDateOnly(item) === iso);
      if (spec instanceof Set) return spec.has(iso);
      if (typeof spec === "function") return !!spec(iso, getDateContext(iso));
      if (typeof spec === "string" || spec instanceof Date || typeof spec === "number") {
        return normalizeDateOnly(spec) === iso;
      }
      return false;
    };
    const isDateAllowed = (iso) => {
      if (!iso) return false;
      const min = getMin();
      const max = getMax();
      if (min && iso < min) return false;
      if (max && iso > max) return false;
      const allowSpec = uiUnwrap(props.options ?? props.enableDates ?? props.allowedDates);
      if (allowSpec != null && !matchesDateSpec(allowSpec, iso)) return false;
      const disableSpec = uiUnwrap(props.disableDates ?? props.disabledDates ?? props.notAllowedDates);
      if (disableSpec != null && matchesDateSpec(disableSpec, iso)) return false;
      const weekday = fromIsoDate(iso)?.getDay();
      if (Array.isArray(uiUnwrap(props.allowedWeekdays ?? props.weekdays)) && weekday != null) {
        const allowedWeekdays = uiUnwrap(props.allowedWeekdays ?? props.weekdays).map((x) => Number(x));
        if (!allowedWeekdays.includes(weekday)) return false;
      }
      if (uiUnwrap(props.weekdaysOnly) && (weekday === 0 || weekday === 6)) return false;
      if (uiUnwrap(props.weekendsOnly) && weekday != null && weekday !== 0 && weekday !== 6) return false;
      const current = getCurrentValue();
      const pendingRange = mode === "range"
        ? (current?.from && !current?.to ? current : null)
        : (mode === "range-multiple"
          ? ((Array.isArray(current) && current.length && current[current.length - 1]?.from && !current[current.length - 1]?.to)
            ? current[current.length - 1]
            : null)
          : null);
      if (pendingRange?.from) {
        const nights = Math.abs(diffDays(pendingRange.from, iso));
        const minRange = Number(uiUnwrap(props.minRange ?? props.minDays ?? props.minNights));
        const maxRange = Number(uiUnwrap(props.maxRange ?? props.maxDays ?? props.maxNights));
        if (Number.isFinite(minRange) && nights < minRange) return false;
        if (Number.isFinite(maxRange) && nights > maxRange) return false;
      }
      return true;
    };
    const formatSingleDisplay = (iso) => {
      if (!iso) return "";
      const date = fromIsoDate(iso);
      if (!date) return iso;
      const displayMask = String(uiUnwrap(props.displayMask ?? props.mask ?? "") || "").toLowerCase();
      if (displayMask === "iso" || uiUnwrap(props.isoDisplay) === true) return iso;
      return new Intl.DateTimeFormat(getLocale(), {
        year: "numeric",
        month: "short",
        day: "2-digit"
      }).format(date);
    };
    const formatDisplayValue = (value, timeValue = localTimeValue) => {
      if (mode === "range-multiple") {
        if (!Array.isArray(value) || !value.length) return "";
        if (value.length > 2 && uiUnwrap(props.compactMultiple) !== false) {
          return `${value.length} ${uiUnwrap(props.multipleRangeLabel) || "intervalli selezionati"}`;
        }
        return value.map((range) => {
          const from = range?.from ? formatSingleDisplay(range.from) : "";
          const to = range?.to ? formatSingleDisplay(range.to) : "";
          return from && to ? `${from} -> ${to}` : (from || to || "");
        }).filter(Boolean).join("; ");
      }
      if (mode === "multiple") {
        if (!Array.isArray(value) || !value.length) return "";
        if (value.length > 3 && uiUnwrap(props.compactMultiple) !== false) {
          return `${value.length} ${uiUnwrap(props.multipleLabel) || "date selezionate"}`;
        }
        return value.map(formatSingleDisplay).join(", ");
      }
      if (mode === "range") {
        const from = value?.from ? formatSingleDisplay(value.from) : "";
        const to = value?.to ? formatSingleDisplay(value.to) : "";
        if (from && to) return `${from} -> ${to}`;
        return from || to || "";
      }
      const dateLabel = formatSingleDisplay(value);
      if (!isTimeEnabled()) return dateLabel;
      const timeLabel = formatTimeDisplayValue(timeValue);
      return [dateLabel, timeLabel].filter(Boolean).join(" • ");
    };
    const extractTypedDates = (raw) => {
      const found = String(raw || "").match(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/g) || [];
      return found.map(normalizeDateOnly).filter(Boolean);
    };
    const parseTypedValue = (raw) => {
      if (raw == null || raw === "") {
        if (mode === "multiple" || mode === "range-multiple") return [];
        if (mode === "range") return { from: null, to: null };
        return null;
      }
      const dates = extractTypedDates(raw);
      if (mode === "range-multiple") {
        const ranges = [];
        for (let index = 0; index < dates.length; index += 2) {
          if (!dates[index]) continue;
          ranges.push({ from: dates[index], to: dates[index + 1] || null });
        }
        return ranges;
      }
      if (mode === "multiple") return dates;
      if (mode === "range") return { from: dates[0] || null, to: dates[1] || null };
      return dates[0] || normalizeDateOnly(raw);
    };
    const emptyValue = () => ((mode === "multiple" || mode === "range-multiple") ? [] : (mode === "range" ? { from: null, to: null } : null));
    const resolveDateTimeTimeValue = (raw, fallback = null) => {
      if (!isTimeEnabled()) return null;
      const options = getTimeOptions();
      const explicit = uiUnwrap(props.timeValue);
      const source = raw != null ? raw : explicit;
      const resolved = uiExtractTimeFromValue(source, options);
      return uiCloneTimeParts(resolved ?? fallback ?? null);
    };
    const getCurrentTimeValue = () => uiUnwrap(props.confirm) ? workingTimeValue : localTimeValue;
    const exportCurrentValue = (dateValue = localValue, timeValue = localTimeValue) => {
      if (mode === "single" && isTimeEnabled()) return uiMergeDateAndTime(dateValue || null, timeValue, getTimeOptions());
      return exportValue(dateValue);
    };
    const serializeCurrentValue = (dateValue = localValue, timeValue = localTimeValue) => JSON.stringify(exportCurrentValue(dateValue, timeValue));
    const formatTimeDisplayValue = (value) => uiFormatTimeDisplay(value, getTimeOptions());

    let localValue = normalizeValue(initialRawValue);
    let workingValue = cloneValue(localValue);
    let localTimeValue = resolveDateTimeTimeValue(initialRawValue, uiExtractTimeFromValue(uiUnwrap(props.timeValue), getTimeOptions()));
    let workingTimeValue = uiCloneTimeParts(localTimeValue);
    let hoverDate = null;
    let mouseSelectedDate = null;
    let viewMonth = monthStart(
      mode === "range"
        ? (localValue?.from || localValue?.to || getDefaultViewValue())
        : (mode === "range-multiple"
          ? (localValue?.[localValue.length - 1]?.from || localValue?.[localValue.length - 1]?.to || getDefaultViewValue())
          : (mode === "multiple"
            ? (localValue[0] || getDefaultViewValue())
            : (localValue || getDefaultViewValue())))
    );
    let entry = null;
    let panelRoot = null;

    const getVisibleMonthOffset = (value) => {
      const date = value instanceof Date ? value : fromIsoDate(normalizeDateOnly(value));
      if (!date) return -1;
      const year = date.getFullYear();
      const month = date.getMonth();
      for (let index = 0; index < getMonthsToShow(); index += 1) {
        const visibleMonth = shiftMonths(viewMonth, index);
        if (visibleMonth.getFullYear() === year && visibleMonth.getMonth() === month) return index;
      }
      return -1;
    };

    const fieldProps = {
      ...props,
      label: props.label ?? props.placeholder
    };
    const hasFloatingLabel = fieldProps.label != null || JSswift.ui.getSlot(slots, "label") != null;
    const defaultPlaceholder = mode === "range"
      ? "Seleziona andata e ritorno"
      : (mode === "range-multiple"
        ? "Seleziona intervalli"
        : (mode === "multiple" ? "Seleziona date" : "Seleziona data"));

    const displayInput = isCalendar ? null : _.input({
      class: uiClass(["jss-input", "jss-date-display", sizeValue, uiWhen(props.manualInput, "is-manual"), props.inputClass]),
      type: "text",
      autocomplete: "off",
      placeholder: hasFloatingLabel ? "" : (props.placeholder ?? defaultPlaceholder),
      readOnly: !uiUnwrap(props.manualInput),
      disabled: !!uiUnwrap(props.disabled),
      value: formatDisplayValue(localValue, localTimeValue)
    });
    const hiddenHost = _.div({ style: { display: "contents" } });
    const controlNode = isCalendar ? null : _.div({ class: "jss-date-control", style: { display: "contents" } }, displayInput, hiddenHost);

    const field = isCalendar ? null : UI.FormField({
      ...fieldProps,
      iconRight: props.iconRight ?? "calendar_month",
      control: controlNode,
      getValue: () => displayInput.value,
      onClear: () => {
        if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
        setDateValue(emptyValue(), null);
        if (entry) closePanel();
      },
      onFocus: () => displayInput.focus()
    });

    const syncViewMonth = (value, options = {}) => {
      const current = options.focusIso || (
        mode === "range"
          ? (value?.from || value?.to || getDefaultViewValue())
          : (mode === "range-multiple"
            ? (value?.[value.length - 1]?.from || value?.[value.length - 1]?.to || getDefaultViewValue())
            : (mode === "multiple"
              ? (value?.[0] || getDefaultViewValue())
              : (value || getDefaultViewValue())))
      );
      let nextViewMonth = monthStart(current);
      if (options.preserveMonthOffset) {
        const monthOffset = Number.isInteger(options.visibleMonthOffset)
          ? options.visibleMonthOffset
          : getVisibleMonthOffset(options.anchorIso || options.focusIso || current);
        if (monthOffset > 0) nextViewMonth = shiftMonths(nextViewMonth, -monthOffset);
      }
      viewMonth = nextViewMonth;
    };

    const syncHiddenInputs = () => {
      hiddenHost.replaceChildren();
      const baseName = uiUnwrap(props.name);
      if (!baseName) return;
      const appendHidden = (name, value) => {
        hiddenHost.appendChild(_.input({ type: "hidden", name, value: value ?? "" }));
      };
      const value = localValue;
      if (mode === "single") {
        appendHidden(baseName, exportCurrentValue(value, localTimeValue));
        return;
      }
      if (mode === "range") {
        appendHidden(uiUnwrap(props.nameFrom) || `${baseName}_from`, value?.from || "");
        appendHidden(uiUnwrap(props.nameTo) || `${baseName}_to`, value?.to || "");
        return;
      }
      if (mode === "range-multiple") {
        const rangeList = Array.isArray(value) ? value : [];
        const fromName = /\[\]$/.test(uiUnwrap(props.nameFrom) || "") ? uiUnwrap(props.nameFrom) : `${uiUnwrap(props.nameFrom) || `${baseName}_from`}[]`;
        const toName = /\[\]$/.test(uiUnwrap(props.nameTo) || "") ? uiUnwrap(props.nameTo) : `${uiUnwrap(props.nameTo) || `${baseName}_to`}[]`;
        rangeList.forEach((item) => {
          appendHidden(fromName, item?.from || "");
          appendHidden(toName, item?.to || "");
        });
        return;
      }
      const listName = /\[\]$/.test(baseName) ? baseName : `${baseName}[]`;
      (Array.isArray(value) ? value : []).forEach((item) => appendHidden(listName, item));
    };

    const syncDisplay = () => {
      if (isCalendar) return;
      displayInput.readOnly = !uiUnwrap(props.manualInput);
      displayInput.disabled = !!uiUnwrap(props.disabled);
      displayInput.setAttribute("aria-expanded", entry ? "true" : "false");
      displayInput.value = formatDisplayValue(localValue, localTimeValue);
      syncHiddenInputs();
      field?._refresh?.();
    };

    const setDateValue = (nextValue, event, options = {}) => {
      const normalized = normalizeValue(nextValue);
      const nextTime = isTimeEnabled()
        ? uiCloneTimeParts(
          uiExtractTimeFromValue(
            options.timeValue != null
              ? options.timeValue
              : (options.preserveTime ? getCurrentTimeValue() : nextValue),
            getTimeOptions()
          ) ?? (options.preserveTime ? getCurrentTimeValue() : null)
        )
        : null;
      const prev = serializeCurrentValue(localValue, localTimeValue);
      localValue = cloneValue(normalized);
      workingValue = cloneValue(normalized);
      if (isTimeEnabled()) {
        localTimeValue = uiCloneTimeParts(nextTime);
        workingTimeValue = uiCloneTimeParts(nextTime);
      }
      hoverDate = null;
      syncViewMonth(normalized, options);
      syncDisplay();
      renderPanel();
      if (model && options.fromModel !== true) model.set(exportCurrentValue(normalized, nextTime));
      const nextSerialized = serializeCurrentValue(normalized, nextTime);
      if (options.emit !== false && nextSerialized !== prev) {
        const emitted = exportCurrentValue(normalized, nextTime);
        props.onInput?.(emitted, event);
        props.onChange?.(emitted, event);
      }
      return normalized;
    };
    const setTimeValue = (nextValue, event, options = {}) => {
      if (!isTimeEnabled()) return null;
      const normalizedTime = uiCloneTimeParts(uiExtractTimeFromValue(nextValue, getTimeOptions()));
      if (uiUnwrap(props.confirm) && options.commit !== true) {
        workingTimeValue = normalizedTime;
        renderPanel();
        return normalizedTime;
      }
      const prev = serializeCurrentValue(localValue, localTimeValue);
      localTimeValue = uiCloneTimeParts(normalizedTime);
      workingTimeValue = uiCloneTimeParts(normalizedTime);
      syncDisplay();
      renderPanel();
      if (model && options.fromModel !== true) model.set(exportCurrentValue(localValue, normalizedTime));
      const nextSerialized = serializeCurrentValue(localValue, normalizedTime);
      if (options.emit !== false && nextSerialized !== prev) {
        const emitted = exportCurrentValue(localValue, normalizedTime);
        props.onInput?.(emitted, event);
        props.onChange?.(emitted, event);
      }
      return normalizedTime;
    };
    const setWorkingOrCommit = (nextValue, event, options = {}) => {
      if (uiUnwrap(props.confirm)) {
        workingValue = cloneValue(normalizeValue(nextValue));
        if (isTimeEnabled() && (options.timeValue != null || options.preserveTime)) {
          workingTimeValue = uiCloneTimeParts(uiExtractTimeFromValue(
            options.timeValue != null ? options.timeValue : getCurrentTimeValue(),
            getTimeOptions()
          ));
        }
        hoverDate = null;
        syncViewMonth(workingValue, options);
        renderPanel();
        return;
      }
      setDateValue(nextValue, event, options);
    };
    const selectionPreview = () => {
      const current = getCurrentValue();
      if (mode === "range") {
        if (!current?.from || current?.to || !hoverDate) return current;
        return compareIso(current.from, hoverDate) <= 0
          ? { from: current.from, to: hoverDate }
          : { from: hoverDate, to: current.from };
      }
      if (mode === "range-multiple") {
        const last = Array.isArray(current) && current.length ? current[current.length - 1] : null;
        if (!last?.from || last?.to || !hoverDate) return last;
        return compareIso(last.from, hoverDate) <= 0
          ? { from: last.from, to: hoverDate }
          : { from: hoverDate, to: last.from };
      }
      return current;
    };
    const renderedRanges = () => {
      if (mode === "range") {
        const preview = selectionPreview();
        return preview?.from ? [preview] : [];
      }
      if (mode === "range-multiple") {
        const current = Array.isArray(getCurrentValue()) ? getCurrentValue() : [];
        if (!current.length) return [];
        const preview = selectionPreview();
        if (!preview?.from) return current;
        return [...current.slice(0, -1), preview];
      }
      return [];
    };
    const isSelectedDate = (iso) => {
      const current = getCurrentValue();
      if (mode === "multiple") return current.includes(iso);
      if (mode === "range-multiple") {
        return Array.isArray(current) && current.some((range) => isSameIso(range?.from, iso) || isSameIso(range?.to, iso));
      }
      if (mode === "range") return isSameIso(current?.from, iso) || isSameIso(current?.to, iso);
      return isSameIso(current, iso);
    };
    const isInRange = (iso) => {
      if (mode !== "range" && mode !== "range-multiple") return false;
      return renderedRanges().some((range) => range?.from && range?.to && iso >= range.from && iso <= range.to);
    };
    const updateRangeHover = (iso, options = {}) => {
      const current = getCurrentValue();
      const pendingRange = mode === "range"
        ? current
        : (mode === "range-multiple"
          ? (Array.isArray(current) && current.length ? current[current.length - 1] : null)
          : null);
      if (!pendingRange?.from || pendingRange?.to || hoverDate === iso) return;
      hoverDate = iso;
      // Re-rendering on focus replaces the clicked day button before the click event fires.
      if (options.render !== false) renderPanel();
    };
    const shouldCloseOnSelect = () => {
      if (isCalendar) return false;
      if (uiUnwrap(props.confirm)) return false;
      if (props.closeOnSelect === false) return false;
      if (mode === "multiple" || mode === "range-multiple") return !!props.closeOnSelect;
      return true;
    };
    const selectDate = (iso, event, selectionOptions = {}) => {
      if (!isDateAllowed(iso) || uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
      const syncOptions = {
        focusIso: iso,
        anchorIso: iso,
        preserveTime: isTimeEnabled(),
        timeValue: getCurrentTimeValue(),
        preserveMonthOffset: !!entry && getMonthsToShow() > 1,
        visibleMonthOffset: Number.isInteger(selectionOptions.visibleMonthOffset) ? selectionOptions.visibleMonthOffset : null
      };
      if (mode === "multiple") {
        const list = normalizeMultipleValue(getCurrentValue());
        const next = list.includes(iso) ? list.filter((item) => item !== iso) : [...list, iso];
        setWorkingOrCommit(next.sort(), event, syncOptions);
        if (shouldCloseOnSelect()) closePanel();
        return;
      }
      if (mode === "range") {
        const current = cloneValue(getCurrentValue());
        let next;
        if (!current.from || (current.from && current.to)) {
          next = { from: iso, to: null };
        } else if (compareIso(iso, current.from) < 0) {
          next = { from: iso, to: current.from };
        } else {
          next = { from: current.from, to: iso };
        }
        setWorkingOrCommit(next, event, syncOptions);
        if (next.to && shouldCloseOnSelect()) closePanel();
        return;
      }
      if (mode === "range-multiple") {
        const list = normalizeRangeMultipleValue(getCurrentValue());
        const last = list.length ? list[list.length - 1] : null;
        let next;
        if (!last?.from || last?.to) {
          next = [...list, { from: iso, to: null }];
        } else if (compareIso(iso, last.from) < 0) {
          next = [...list.slice(0, -1), { from: iso, to: last.from }];
        } else {
          next = [...list.slice(0, -1), { from: last.from, to: iso }];
        }
        setWorkingOrCommit(next, event, syncOptions);
        if (next[next.length - 1]?.to && shouldCloseOnSelect()) closePanel();
        return;
      }
      setWorkingOrCommit(iso, event, syncOptions);
      if (shouldCloseOnSelect()) closePanel();
    };
    const clearValue = () => {
      if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
      mouseSelectedDate = null;
      setDateValue(emptyValue(), null, { timeValue: null });
    };
    const jumpToToday = () => {
      if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
      const today = todayIso();
      if (!isDateAllowed(today)) {
        syncViewMonth(today);
        renderPanel();
        return;
      }
      if (mode === "range") {
        const tomorrow = shiftDays(today, 1);
        const next = tomorrow && isDateAllowed(tomorrow) ? { from: today, to: tomorrow } : { from: today, to: null };
        setWorkingOrCommit(next, null);
        return;
      }
      if (mode === "range-multiple") {
        const tomorrow = shiftDays(today, 1);
        const next = tomorrow && isDateAllowed(tomorrow)
          ? [{ from: today, to: tomorrow }]
          : [{ from: today, to: null }];
        setWorkingOrCommit(next, null);
        return;
      }
      if (mode === "multiple") {
        setWorkingOrCommit([today], null);
        return;
      }
      setWorkingOrCommit(today, null, { preserveTime: isTimeEnabled(), timeValue: getCurrentTimeValue() });
    };
    const scrollTimeColumnsToSelection = (options = {}) => {
      uiCenterTimeColumnsToSelection(panelRoot, options);
    };
    const jumpToNow = () => {
      if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
      if (!isTimeEnabled()) return;
      const scrollState = uiCaptureTimeColumnScrollState(panelRoot);
      setTimeValue(new Date(), null, { commit: !uiUnwrap(props.confirm) });
      scrollTimeColumnsToSelection({ scrollState });
      if (!uiUnwrap(props.confirm) && props.closeOnSelect === true) closePanel();
    };
    const applyWorkingValue = () => {
      if (uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return;
      if (!uiUnwrap(props.confirm)) return;
      setDateValue(workingValue, null, { timeValue: workingTimeValue, preserveTime: true });
      if (props.closeOnSelect !== false) closePanel();
    };

    const renderPanel = () => {
      if (!panelRoot) return;
      const locale = getLocale();
      const monthLabelFormatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
      const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
      const titleDates = Array.from({ length: 7 }, (_, index) => {
        const day = (getFirstDayOfWeek() + index) % 7;
        return weekdayFormatter.format(new Date(2024, 0, 7 + day));
      });
      const pickerValue = getCurrentValue();

      const buildDayPoint = (ctx) => {
        let pointNode = JSswift.ui.renderSlot(slots, "point", ctx, null);
        if (pointNode == null) pointNode = JSswift.ui.renderSlot(slots, "dayPoint", ctx, null);
        if (pointNode == null && props.pointIcon != null && (ctx.selected || ctx.inRange || ctx.today)) {
          pointNode = typeof props.pointIcon === "string"
            ? UI.Icon({ name: props.pointIcon, size: 10 })
            : JSswift.ui.slot(props.pointIcon, ctx);
        }
        return renderSlotToArray(null, "default", ctx, pointNode);
      };

      const renderMonth = (baseDate, monthOffset) => {
        const year = baseDate.getFullYear();
        const month = baseDate.getMonth();
        const start = new Date(year, month, 1);
        const offset = (start.getDay() - getFirstDayOfWeek() + 7) % 7;
        const gridStart = new Date(year, month, 1 - offset);
        const monthBox = _.div({ class: "jss-date-month" });
        monthBox.appendChild(_.div({ class: "jss-date-month-title" }, monthLabelFormatter.format(start)));

        const weekdays = _.div({ class: "jss-date-weekdays" });
        titleDates.forEach((label) => weekdays.appendChild(_.div({ class: "jss-date-weekday" }, label)));
        monthBox.appendChild(weekdays);

        const grid = _.div({ class: "jss-date-grid" });
        for (let index = 0; index < 42; index += 1) {
          const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
          const iso = toIsoDate(date);
          const inMonth = date.getMonth() === month;
          const selected = isSelectedDate(iso);
          const inRange = isInRange(iso);
          const rangeStart = (mode === "range" || mode === "range-multiple") && renderedRanges().some((range) => isSameIso(range?.from, iso));
          const rangeEnd = (mode === "range" || mode === "range-multiple") && renderedRanges().some((range) => isSameIso(range?.to, iso));
          const disabled = !isDateAllowed(iso);
          const ctx = {
            ...getDateContext(iso),
            selected,
            inRange,
            rangeStart,
            rangeEnd,
            disabled,
            outside: !inMonth,
            value: pickerValue,
            select: () => selectDate(iso, null, { visibleMonthOffset: monthOffset })
          };
          const pointNodes = buildDayPoint(ctx);
          const labelNode = JSswift.ui.renderSlot(slots, "day", ctx, String(date.getDate()));
          const labelNodes = renderSlotToArray(null, "default", ctx, labelNode);
          const dayBtn = _.button({
            type: "button",
            class: uiClass([
              "jss-date-day",
              uiWhen(!inMonth, "is-outside"),
              uiWhen(selected, "is-selected"),
              uiWhen(inRange, "is-in-range"),
              uiWhen(rangeStart, "is-range-start"),
              uiWhen(rangeEnd, "is-range-end"),
              uiWhen(disabled, "is-disabled"),
              uiWhen(isSameIso(iso, todayIso()), "is-today"),
              uiWhen(pointNodes.length, "has-point")
            ]),
            disabled,
            onMouseDown: (event) => {
              if (event.button !== 0) return;
              mouseSelectedDate = iso;
              event.preventDefault();
              selectDate(iso, event, { visibleMonthOffset: monthOffset });
            },
            onClick: (event) => {
              if (mouseSelectedDate != null && event.detail !== 0) {
                mouseSelectedDate = null;
                return;
              }
              mouseSelectedDate = null;
              selectDate(iso, event, { visibleMonthOffset: monthOffset });
            },
            onMouseEnter: () => updateRangeHover(iso),
            onFocus: () => updateRangeHover(iso, { render: false })
          },
            _.span({ class: "jss-date-day-label" }, ...labelNodes),
            pointNodes.length ? _.span({ class: "jss-date-day-point" }, ...pointNodes) : null
          );
          grid.appendChild(dayBtn);
        }
        monthBox.appendChild(grid);
        return monthBox;
      };

      const min = getMin();
      const max = getMax();
      const candidateYears = [
        viewMonth.getFullYear(),
        fromIsoDate(todayIso())?.getFullYear(),
        fromIsoDate(min)?.getFullYear(),
        fromIsoDate(max)?.getFullYear(),
        fromIsoDate(uiUnwrap(props.defaultMonth))?.getFullYear()
      ];
      if (mode === "range") {
        candidateYears.push(fromIsoDate(pickerValue?.from)?.getFullYear(), fromIsoDate(pickerValue?.to)?.getFullYear());
      } else if (mode === "range-multiple") {
        pickerValue.forEach((item) => {
          candidateYears.push(fromIsoDate(item?.from)?.getFullYear(), fromIsoDate(item?.to)?.getFullYear());
        });
      } else if (mode === "multiple") {
        pickerValue.forEach((item) => candidateYears.push(fromIsoDate(item)?.getFullYear()));
      } else {
        candidateYears.push(fromIsoDate(pickerValue)?.getFullYear());
      }
      const validYears = candidateYears.filter((year) => Number.isFinite(year));
      const inferredYearStart = (validYears.length ? Math.min(...validYears) : viewMonth.getFullYear()) - 100;
      const inferredYearEnd = (validYears.length ? Math.max(...validYears) : viewMonth.getFullYear()) + 50;
      const yearStart = Number(uiUnwrap(props.yearStart ?? (min ? fromIsoDate(min)?.getFullYear() : null) ?? inferredYearStart));
      const yearEnd = Number(uiUnwrap(props.yearEnd ?? (max ? fromIsoDate(max)?.getFullYear() : null) ?? inferredYearEnd));
      const monthSelect = _.select({
        class: "jss-date-select",
        value: String(viewMonth.getMonth()),
        onChange: (event) => {
          viewMonth = new Date(viewMonth.getFullYear(), Number(event.currentTarget.value), 1);
          props.onNavigate?.({ month: viewMonth.getMonth() + 1, year: viewMonth.getFullYear() });
          renderPanel();
        }
      },
        ...Array.from({ length: 12 }, (_, index) => uiOptionNode({ value: String(index) }, new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2024, index, 1))))
      );
      const yearSelect = _.select({
        class: "jss-date-select jss-date-select-year",
        value: String(viewMonth.getFullYear()),
        onChange: (event) => {
          viewMonth = new Date(Number(event.currentTarget.value), viewMonth.getMonth(), 1);
          props.onNavigate?.({ month: viewMonth.getMonth() + 1, year: viewMonth.getFullYear() });
          renderPanel();
        }
      },
        ...Array.from({ length: Math.max(1, yearEnd - yearStart + 1) }, (_, index) => {
          const year = yearStart + index;
          return uiOptionNode({ value: String(year) }, String(year));
        })
      );

      const header = _.div({ class: "jss-date-header" },
        _.button({
          type: "button",
          class: "jss-date-nav",
          onClick: () => {
            viewMonth = shiftMonths(viewMonth, -1);
            props.onNavigate?.({ month: viewMonth.getMonth() + 1, year: viewMonth.getFullYear() });
            renderPanel();
          }
        }, UI.Icon({ name: "chevron_left", size: 16 })),
        _.div({ class: "jss-date-header-center" }, monthSelect, yearSelect),
        _.button({
          type: "button",
          class: "jss-date-nav",
          onClick: () => {
            viewMonth = shiftMonths(viewMonth, 1);
            props.onNavigate?.({ month: viewMonth.getMonth() + 1, year: viewMonth.getFullYear() });
            renderPanel();
          }
        }, UI.Icon({ name: "chevron_right", size: 16 }))
      );

      const shortcuts = _.div({ class: "jss-date-shortcuts" });
      const shortcutList = uiUnwrap(props.shortcuts ?? props.presets) || [];
      shortcutList.forEach((item, index) => {
        if (!item) return;
        const rawValue = typeof item.value === "function" ? item.value({ today: todayIso() }) : item.value;
        const label = item.label ?? item.text ?? `Preset ${index + 1}`;
        shortcuts.appendChild(_.button({
          type: "button",
          class: "jss-date-shortcut",
          onClick: () => setWorkingOrCommit(rawValue, null, { preserveTime: isTimeEnabled(), timeValue: getCurrentTimeValue() })
        }, label));
      });

      const months = _.div({ class: "jss-date-months" });
      for (let index = 0; index < getMonthsToShow(); index += 1) {
        months.appendChild(renderMonth(shiftMonths(viewMonth, index), index));
      }
      const footerDisplayValue = formatDisplayValue(pickerValue, getCurrentTimeValue());
      const footerValue = _.div({ class: "jss-date-value" },
        ...renderSlotToArray(
          slots,
          "value",
          { value: pickerValue, displayValue: footerDisplayValue, mode, timeValue: getCurrentTimeValue() },
          footerDisplayValue || renderSlotToArray(slots, "default", {}, children)
        )
      );
      const headerTime = _.div({ class: "jss-time-header" });
      const columnsTime = _.div({ class: "jss-time-columns-2" },
        _.div({ class: "jss-time-column-title" }, uiUnwrap(props.hoursLabel) || "Ore"),
        _.div({ class: "jss-time-column-title" }, uiUnwrap(props.minutesLabel) || "Min")
      );
      headerTime.appendChild(columnsTime);
      const bodyTime = isTimeEnabled()
        ? uiCreateTimePickerSection({
          props: {
            min: uiUnwrap(props.timeMin ?? props.minTime),
            max: uiUnwrap(props.timeMax ?? props.maxTime),
            use12h: uiUnwrap(props.time12h ?? props.use12h ?? props.ampm),
            hoursLabel: uiUnwrap(props.timeHoursLabel) || "Ore",
            minutesLabel: uiUnwrap(props.timeMinutesLabel) || "Min",
            secondsLabel: uiUnwrap(props.timeSecondsLabel) || "Sec"
          },
          slots,
          slotPrefix: "time",
          value: getCurrentTimeValue(),
          withSeconds: false,
          minuteStep: 1,
          secondStep: getTimeSecondStep(),
          disabled: !!uiUnwrap(props.disabled),
          readonly: !!uiUnwrap(props.readonly),
          embedded: true,
          pointIcon: uiUnwrap(props.timePointIcon),
          shortcuts: uiUnwrap(props.timeShortcuts ?? props.timePresets),
          onSelect: (nextTime) => {
            const scrollState = uiCaptureTimeColumnScrollState(panelRoot);
            setTimeValue(nextTime, null);
            scrollTimeColumnsToSelection({ scrollState });
          }
        })
        : null;
      const footerInfo = _.div({ class: "jss-date-footer-info" },
        footerValue
      );

      const footer = _.div({ class: uiClass(["jss-date-footer", uiWhen(isTimeEnabled(), "has-time")]) },
        footerInfo,
        _.div({ class: "jss-date-actions" },
          _.button({ type: "button", class: "jss-date-action", onClick: jumpToToday }, uiUnwrap(props.todayLabel) || "Oggi"),
          uiUnwrap(props.clearable) !== false
            ? _.button({ type: "button", class: "jss-date-action", onClick: clearValue }, uiUnwrap(props.clearLabel) || "Reset")
            : null,
          uiUnwrap(props.confirm)
            ? _.button({ type: "button", class: "jss-date-action is-primary", onClick: applyWorkingValue }, uiUnwrap(props.applyLabel) || "Applica")
            : null
        )
      );

      const footerTimer = _.div(_.button({ type: "button", class: "jss-date-action jss-w-lg", onClick: jumpToNow }, uiUnwrap(props.nowLabel) || "Ora"));

      const contentTimer = isTimeEnabled() ? _.div({ class: "jss-date-time" }, headerTime, bodyTime, footerTimer) : null;

      panelRoot.replaceChildren(
        _.div({
          class: "jss-date-panel-root",
          onKeydown: (event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              if (isCalendar) props.onEscape?.(event);
              else closePanel();
            }
          }
        },
          header,
          shortcutList.length ? shortcuts : null,
          _.div({ class: 'jss-data-time' }, months, contentTimer),
          footer
        )
      );
    };

    const createCalendarPanel = (standalone = false) => {
      const fallback = (mode === "range" || mode === "range-multiple") ? 2 : 1;
      const root = _.div({
        class: uiClass(["jss-clear-set", "jss-card", "jss-singularity", "jss-date-panel",
          standalone ? "jss-date-calendar" : "", sizeValue,
          uiWhen(props.dense, "jss-card-dense"),
          uiComputed(props.monthsToShow, () => Number(uiUnwrap(props.monthsToShow) ?? fallback) > 1 ? "multi-month" : ""),
          props.panelClass, props.class]),
        style: { ...(props.style || {}), ...(props.panelStyle || {}) }
      });
      setPropertyProps(root, props);
      return root;
    };

    function openPanel() {
      if (entry || uiUnwrap(props.disabled) || uiUnwrap(props.readonly)) return entry;
      workingValue = cloneValue(localValue);
      workingTimeValue = uiCloneTimeParts(localTimeValue);
      hoverDate = null;
      mouseSelectedDate = null;
      syncViewMonth(workingValue);
      entry = JSswift.overlay.open(({ close }) => {
        const fallback = (mode === "range" || mode === "range-multiple") ? 2 : 1;
        const raw = Number(uiUnwrap(props.monthsToShow) ?? fallback);
        panelRoot = createCalendarPanel();
        renderPanel();
        return panelRoot;
      }, {
        type: "date",
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
        className: uiClassStatic(["jss-date-overlay", props.panelClass, uiWhen(isTimeEnabled(), "has-time")]),
        onClose: () => {
          entry = null;
          panelRoot = null;
          hoverDate = null;
          syncDisplay();
          props.onClose?.();
        }
      });
      const calendarColor = uiUnwrap(props.color) || "var(--jss-text-2, var(--jss-text))";
      entry.panel.classList.toggle("jss-date-uncolored", !uiUnwrap(props.color));
      entry.panel.style.setProperty("--jss-date-accent", JSswift.uiColors.includes(calendarColor)
        ? `var(--jss-${calendarColor})` : calendarColor);
      if (props.panelStyle) Object.assign(entry.panel.style, props.panelStyle);
      overlayEnter(entry);
      syncDisplay();
      props.onOpen?.();
      return entry;
    }

    function closePanel() {
      if (!entry) return;
      mouseSelectedDate = null;
      const toClose = entry;
      overlayLeave(toClose, () => JSswift.overlay.close(toClose.id));
    }

    if (isCalendar) panelRoot = createCalendarPanel(true);

    if (!isCalendar) displayInput.addEventListener("focus", (event) => {
      props.onFocus?.(event);
      if (props.openOnFocus !== false) openPanel();
    });
    if (!isCalendar) displayInput.addEventListener("click", (event) => {
      props.onClick?.(event);
      openPanel();
    });
    if (!isCalendar) displayInput.addEventListener("keydown", (event) => {
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
        clearValue();
      }
    });
    if (!isCalendar && uiUnwrap(props.manualInput)) {
      displayInput.addEventListener("input", (event) => {
        props.onTyping?.(displayInput.value, event);
      });
      displayInput.addEventListener("change", (event) => {
        const parsed = parseTypedValue(displayInput.value);
        setDateValue(parsed, event, { timeValue: uiExtractTimeFromValue(displayInput.value, getTimeOptions()), preserveTime: !uiExtractTimeFromValue(displayInput.value, getTimeOptions()) });
      });
      displayInput.addEventListener("blur", (event) => {
        props.onBlur?.(event);
        const parsed = parseTypedValue(displayInput.value);
        if (displayInput.value === "") clearValue();
        else setDateValue(parsed, event, { timeValue: uiExtractTimeFromValue(displayInput.value, getTimeOptions()), preserveTime: !uiExtractTimeFromValue(displayInput.value, getTimeOptions()) });
      });
    } else if (!isCalendar) {
      displayInput.addEventListener("blur", (event) => props.onBlur?.(event));
    }

    let stopModel = null;
    if (model) {
      stopModel = model.watch((next) => {
        const normalized = normalizeValue(next);
        const nextTime = resolveDateTimeTimeValue(next);
        if (serializeCurrentValue(normalized, nextTime) === serializeCurrentValue(localValue, localTimeValue)) return;
        localValue = normalized;
        workingValue = cloneValue(localValue);
        localTimeValue = uiCloneTimeParts(nextTime);
        workingTimeValue = uiCloneTimeParts(nextTime);
        hoverDate = null;
        syncViewMonth(localValue);
        syncDisplay();
        renderPanel();
      }, isCalendar ? "UI.Calendar:watch" : "UI.Datepicker:watch");
    }

    const stopRender = JSswift.reactive.effect(() => {
      if (!model && props.value != null) {
        localValue = normalizeValue(uiUnwrap(props.value));
        workingValue = cloneValue(localValue);
        localTimeValue = resolveDateTimeTimeValue(uiUnwrap(props.value));
        workingTimeValue = uiCloneTimeParts(localTimeValue);
      } else if (isTimeEnabled() && props.timeValue != null) {
        localTimeValue = resolveDateTimeTimeValue(uiUnwrap(props.timeValue));
        workingTimeValue = uiCloneTimeParts(localTimeValue);
      }
      syncDisplay();
      renderPanel();
      if (entry && uiUnwrap(props.disabled)) closePanel();
    }, isCalendar ? "UI.Calendar:render" : "UI.Datepicker:render");

    JSswift._registerCleanup(isCalendar ? panelRoot : field, () => {
      stopModel?.();
      stopRender();
      if (entry) JSswift.overlay.close(entry.id);
    });

    if (isCalendar) {
      panelRoot._calendar = panelRoot;
      panelRoot._date = panelRoot;
      panelRoot._getValue = () => exportCurrentValue(localValue, localTimeValue);
      panelRoot._setValue = (value) => setDateValue(value, null, { emit: false, timeValue: resolveDateTimeTimeValue(value) });
      panelRoot._clear = clearValue;
      panelRoot._select = (value) => {
        const iso = normalizeDateOnly(value);
        if (iso) selectDate(iso, null);
      };
      panelRoot._time = () => uiCloneTimeParts(localTimeValue);
      return panelRoot;
    }

    field._input = displayInput;
    field._date = displayInput;
    field._open = openPanel;
    field._close = closePanel;
    field._getValue = () => exportCurrentValue(localValue, localTimeValue);
    field._setValue = (value) => setDateValue(value, null, { emit: false, timeValue: resolveDateTimeTimeValue(value) });
    field._time = () => uiCloneTimeParts(localTimeValue);
    field._panel = () => entry?.panel || null;

    return field;
  };
