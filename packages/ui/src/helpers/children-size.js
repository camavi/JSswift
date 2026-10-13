
  const normalizeChildren = (children) => {
    const out = [];
    for (const ch of (children || [])) {
      const v = flattenSlotValue(JSswift.ui.slot(ch));
      if (!v) continue;
      if (Array.isArray(v)) out.push(...v);
      else out.push(v);
    }
    return out;
  };

  const slotToArray = (value, opts) => {
    const v = flattenSlotValue(JSswift.ui.slot(value, opts));
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
  };

  const toCssSize = (v) => {
    if (typeof v === "number") return `${v}px`;
    if (typeof v === "string" && JSswift.uiSizes?.includes(v)) return `var(--jss-size-${v})`;
    return String(v);
  };
