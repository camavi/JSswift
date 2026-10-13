  function toValue(rows) {
    if (typeof rows === "function") return rows();
    return rows || [];
  }

  function tableGetByPath(obj, path) {
    if (obj == null || path == null) return undefined;
    if (typeof path !== "string" || path.indexOf(".") < 0) return obj?.[path];
    return path.split(".").reduce((acc, key) => acc == null ? acc : acc[key], obj);
  }

  function defaultCompare(a, b) {
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  }

  function tableToArray(value) {
    const rows = toValue(value);
    return Array.isArray(rows) ? rows : [];
  }

  function tableColumnLabel(col) {
    return col?.label ?? col?.title ?? col?.header ?? col?.key ?? "";
  }

  function tableColumnSortKey(col, index) {
    return col?.sortKey ?? col?.key ?? `__col_${index}`;
  }

  function tableFindColumn(columns, key) {
    return columns.find((col, index) => tableColumnSortKey(col, index) === key || col?.key === key) || null;
  }

  function tableResolveValue(col, row, rowIndex) {
    if (!col) return row;
    if (typeof col.get === "function") return col.get(row, { row, rowIndex, col });
    if (typeof col.value === "function") return col.value(row, { row, rowIndex, col });
    if (typeof col.key === "string") return tableGetByPath(row, col.key);
    return col.key != null ? row?.[col.key] : row;
  }

  function tableResolveStyle(style, ctx) {
    if (typeof style === "function") return style(ctx) || {};
    return style || {};
  }

  function tableTextValue(value) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(tableTextValue).filter(Boolean).join(" ");
    if (typeof Node !== "undefined" && value instanceof Node) return value.textContent || "";
    if (typeof value === "object") {
      if (typeof value.textContent === "string") return value.textContent;
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return String(value);
  }

  function tableNormalizePageSizes(options, fallback) {
    const list = Array.isArray(options) ? options : fallback;
    const normalized = list
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
    return normalized.length ? Array.from(new Set(normalized)) : fallback;
  }

  function tableMatchesQuery(row, columns, query, props) {
    const predicate = props.searchBy || props.searchPredicate;
    if (typeof predicate === "function") return !!predicate(row, { query, columns });

    const terms = String(query || "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!terms.length) return true;

    const searchKeys = Array.isArray(props.searchKeys) && props.searchKeys.length
      ? props.searchKeys
      : columns.filter((col) => col?.searchable !== false).map((col) => col?.searchKey ?? col?.key).filter(Boolean);

    const tokens = [];
    if (searchKeys.length) {
      for (const key of searchKeys) {
        if (typeof key === "function") tokens.push(tableTextValue(key(row)));
        else {
          const col = columns.find((item) => item?.key === key || item?.searchKey === key);
          tokens.push(tableTextValue(col ? tableResolveValue(col, row, -1) : tableGetByPath(row, key)));
        }
      }
    } else {
      tokens.push(tableTextValue(row));
    }

    const haystack = tokens.join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  }
