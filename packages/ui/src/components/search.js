
  UI.Search = (props = {}) => {
    const scope = uiSubscriptionScope();
    let disposed = false;
    const slots = props.slots || {};
    const isBoundValue = (v) => !!v && ((typeof v === "object" && typeof v._bind === "function") || uiIsSignal(v));
    const valueBinding = isBoundValue(props.model)
      ? props.model
      : (isBoundValue(props.value) ? props.value : null);
    const initialValue = valueBinding
      ? (typeof valueBinding === "object" && typeof valueBinding._bind === "function" ? valueBinding.value : valueBinding[0]())
      : uiUnwrap(props.value);

    const [getQuery, setQueryState] = JSswift.reactive.signal(initialValue == null ? "" : String(initialValue));
    const [getOpen, setOpen] = JSswift.reactive.signal(false);
    const [getLoading, setLoading] = JSswift.reactive.signal(false);
    const [getError, setError] = JSswift.reactive.signal(null);
    const [getResults, setResults] = JSswift.reactive.signal([]);
    const [getActive, setActive] = JSswift.reactive.signal(-1);

    const uid = `jss-search-${Math.random().toString(36).slice(2, 10)}`;
    const cache = new Map();
    let modelSet = null;
    let searchTimer = null;
    let activeController = null;
    let requestId = 0;
    let menuPortalFrame = 0;
    let menuPortalBound = false;
    let lastActive = -1;
    let resultNodes = [];

    const toNumber = (value, fallback) => {
      const n = Number(uiUnwrap(value));
      return Number.isFinite(n) ? n : fallback;
    };
    const toBool = (value, fallback = false) => {
      const raw = uiUnwrap(value);
      return raw == null ? fallback : !!raw;
    };
    const isDisabled = () => toBool(props.disabled, false);
    const isReadonly = () => toBool(props.readonly, false);
    const minLength = () => Math.max(0, toNumber(props.minLength, props.endpoint ? 1 : 0));
    const debounceMs = () => Math.max(0, toNumber(props.debounce, 250));
    const getLabel = (item) => {
      const fn = props.getLabel || props.labelOf;
      if (typeof fn === "function") return fn(item);
      if (item == null) return "";
      if (typeof item === "string" || typeof item === "number") return String(item);
      return item.label ?? item.title ?? item.name ?? item.text ?? item.value ?? "";
    };
    const getValue = (item) => {
      const fn = props.getValue || props.valueOf;
      if (typeof fn === "function") return fn(item);
      if (item == null) return "";
      if (typeof item === "string" || typeof item === "number") return item;
      return item.value ?? item.id ?? item.key ?? getLabel(item);
    };
    const normalizeResults = (raw) => {
      if (Array.isArray(raw)) return raw;
      if (!raw || typeof raw !== "object") return [];
      if (Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw.results)) return raw.results;
      if (Array.isArray(raw.data)) return raw.data;
      return [];
    };
    const resolveListSource = async (source, query) => {
      const value = typeof source === "function" ? source(query, { props }) : uiUnwrap(source);
      return value && typeof value.then === "function" ? await value : value;
    };
    const buildEndpointUrl = (endpoint, query) => {
      const raw = typeof endpoint === "function" ? endpoint(query, { props }) : uiUnwrap(endpoint);
      if (!raw) return "";
      const base = String(raw);
      const url = new URL(base, window.location.href);
      const param = uiUnwrap(props.queryParam) || "q";
      if (param) url.searchParams.set(param, query);
      const params = typeof props.params === "function" ? props.params(query, { props }) : uiUnwrap(props.params);
      if (params && typeof params === "object") {
        Object.keys(params).forEach((key) => {
          const value = uiUnwrap(params[key]);
          if (value == null || value === false) return;
          url.searchParams.set(key, String(value));
        });
      }
      return url.toString();
    };
    const setQuery = (value, meta = {}) => {
      const next = value == null ? "" : String(value);
      if (getQuery() !== next) setQueryState(next);
      if (input.value !== next) input.value = next;
      if (modelSet && !meta.fromModel) modelSet(next);
      if (!meta.fromModel) props.onInput?.(next, meta.event);
      field?._refresh?.();
    };
    const close = () => {
      setOpen(false);
      setActive(-1);
    };
    const hasPanelContent = () => {
      if (getLoading() || getError() || getResults().length) return true;
      const query = getQuery().trim();
      if (query.length >= minLength()) return !!(props.emptyText || JSswift.ui.getSlot(slots, "empty") != null);
      return !!(props.startText || JSswift.ui.getSlot(slots, "empty") != null);
    };
    const open = () => {
      if (isDisabled()) return;
      if (!hasPanelContent()) return;
      setOpen(true);
      scheduleMenuPosition();
    };
    const clearResults = () => {
      setResults([]);
      setError(null);
      setActive(-1);
    };
    const runSearch = async (query, options = {}) => {
      if (disposed) return;
      const q = query == null ? "" : String(query).trim();
      const id = ++requestId;
      const endpoint = uiUnwrap(props.endpoint ?? props.url);
      const source = props.items ?? props.options ?? props.suggestions;

      if (activeController) {
        activeController.abort();
        activeController = null;
      }
      if (q.length < minLength()) {
        setLoading(false);
        clearResults();
        if (options.open && hasPanelContent()) open();
        else if (!hasPanelContent()) close();
        return;
      }

      const cacheEnabled = props.cache !== false;
      const cacheKey = `${endpoint || "local"}::${q}`;
      if (cacheEnabled && cache.has(cacheKey)) {
        setResults(cache.get(cacheKey));
        setError(null);
        setLoading(false);
        setActive(cache.get(cacheKey).length ? 0 : -1);
        if (options.open !== false) open();
        return;
      }

      setLoading(true);
      setError(null);
      if (options.open !== false) open();
      props.onSearch?.(q);

      try {
        let raw;
        if (endpoint) {
          activeController = new AbortController();
          const url = buildEndpointUrl(endpoint, q);
          const response = await fetch(url, {
            method: "GET",
            headers: props.headers,
            credentials: props.credentials,
            signal: activeController.signal
          });
          if (!response.ok) throw new Error(`Search request failed (${response.status})`);
          const parser = props.parseResponse || ((res) => res.json());
          raw = await parser(response);
        } else if (source != null) {
          const list = normalizeResults(await resolveListSource(source, q));
          const filterFn = props.filter || ((item, term) => String(getLabel(item)).toLowerCase().includes(term.toLowerCase()));
          raw = list.filter((item) => filterFn(item, q));
        } else {
          raw = [];
        }
        if (disposed || id !== requestId) return;
        const mapped = typeof props.mapResponse === "function" ? props.mapResponse(raw, q) : normalizeResults(raw);
        const results = normalizeResults(mapped);
        if (cacheEnabled) cache.set(cacheKey, results);
        setResults(results);
        setActive(results.length ? 0 : -1);
        props.onResults?.(results, q);
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (disposed || id !== requestId) return;
        setError(error);
        setResults([]);
        setActive(-1);
        props.onError?.(error, q);
      } finally {
        if (!disposed && id === requestId) {
          setLoading(false);
          activeController = null;
          scheduleMenuPosition();
        }
      }
    };
    const scheduleSearch = (query, options = {}) => {
      if (disposed) return;
      if (searchTimer) clearTimeout(searchTimer);
      const delay = options.immediate ? 0 : debounceMs();
      searchTimer = setTimeout(() => {
        searchTimer = null;
        runSearch(query, options);
      }, delay);
    };
    const submit = (event) => {
      const q = getQuery();
      props.onSubmit?.(q, event);
      if (props.submitOnEnter === false) return;
      scheduleSearch(q, { immediate: true, open: true });
    };
    const selectResult = (item, event) => {
      if (!item) return;
      const value = getValue(item);
      const label = getLabel(item);
      if (props.commitValue === "value") setQuery(value, { event });
      else if (props.commitValue !== false) setQuery(label, { event });
      props.onSelect?.(item, { value, label, query: getQuery(), event });
      if (props.closeOnSelect !== false) close();
    };
    const moveActive = (dir) => {
      const list = getResults();
      if (!list.length) return;
      const current = getActive();
      const next = current < 0
        ? (dir > 0 ? 0 : list.length - 1)
        : Math.max(0, Math.min(list.length - 1, current + dir));
      setActive(next);
    };
    const renderHighlightedLabel = (label) => {
      const text = label == null ? "" : String(label);
      const q = getQuery().trim();
      if (!q || props.highlight === false) return [document.createTextNode(text)];
      const index = text.toLowerCase().indexOf(q.toLowerCase());
      if (index < 0) return [document.createTextNode(text)];
      return [
        document.createTextNode(text.slice(0, index)),
        _.mark({ class: "jss-search-highlight" }, text.slice(index, index + q.length)),
        document.createTextNode(text.slice(index + q.length))
      ];
    };
    const renderDefaultResult = (item) => {
      const label = getLabel(item);
      const description = item && typeof item === "object" ? (item.description ?? item.subtitle ?? item.note) : null;
      return _.div({ class: "jss-search-result-content" },
        _.div({ class: "jss-search-result-label" }, ...renderHighlightedLabel(label)),
        description ? _.div({ class: "jss-search-result-description" }, String(description)) : null
      );
    };
    const scheduleMenuPosition = () => {
      if (!getOpen() || menu.parentNode !== document.body) return;
      if (menuPortalFrame) return;
      menuPortalFrame = requestAnimationFrame(() => {
        menuPortalFrame = 0;
        if (!getOpen() || !root.isConnected || menu.parentNode !== document.body) return;
        const anchor = root.getBoundingClientRect();
        const gap = 6;
        const pad = 8;
        const maxWidth = Math.max(180, window.innerWidth - (pad * 2));
        const width = Math.min(Math.max(anchor.width, toNumber(props.minMenuWidth, 260)), maxWidth);
        const left = Math.max(pad, Math.min(anchor.left, window.innerWidth - width - pad));
        menu.style.width = `${width}px`;
        menu.style.left = `${left}px`;
        menu.style.right = "auto";
        const menuHeight = menu.getBoundingClientRect().height || 0;
        const spaceBelow = window.innerHeight - anchor.bottom - gap - pad;
        const spaceAbove = anchor.top - gap - pad;
        const placeAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
        let top = placeAbove ? (anchor.top - gap - menuHeight) : (anchor.bottom + gap);
        top = Math.max(pad, Math.min(top, window.innerHeight - menuHeight - pad));
        menu.style.top = `${top}px`;
      });
    };
    const bindMenuPortalPosition = () => {
      if (menuPortalBound) return;
      menuPortalBound = true;
      window.addEventListener("resize", scheduleMenuPosition);
      window.addEventListener("scroll", scheduleMenuPosition, true);
    };
    const unbindMenuPortalPosition = () => {
      if (!menuPortalBound) return;
      menuPortalBound = false;
      window.removeEventListener("resize", scheduleMenuPosition);
      window.removeEventListener("scroll", scheduleMenuPosition, true);
    };
    const mountMenuPortal = () => {
      if (menu.parentNode === document.body) return;
      if (menuPortalFrame) {
        cancelAnimationFrame(menuPortalFrame);
        menuPortalFrame = 0;
      }
      menu.classList.add("portal");
      menu.style.display = "block";
      document.body.appendChild(menu);
      bindMenuPortalPosition();
      scheduleMenuPosition();
    };
    const unmountMenuPortal = () => {
      if (menuPortalFrame) {
        cancelAnimationFrame(menuPortalFrame);
        menuPortalFrame = 0;
      }
      unbindMenuPortalPosition();
      if (menu.parentNode !== root) root.appendChild(menu);
      menu.classList.remove("portal");
      menu.style.display = "";
      menu.style.position = "";
      menu.style.top = "";
      menu.style.left = "";
      menu.style.right = "";
      menu.style.width = "";
    };

    const hasFloatingLabel = props.label != null || JSswift.ui.getSlot(slots, "label") != null;
    const syncPlaceholder = () => {
      if (!hasFloatingLabel) {
        input.placeholder = uiUnwrap(props.placeholder) || "";
        return;
      }
      input.placeholder = document.activeElement === input ? (uiUnwrap(props.placeholder) || "") : "";
    };

    const input = _.input({
      id: props.id,
      class: uiClass(["jss-input", "jss-search-input", props.inputClass]),
      type: "search",
      name: props.name,
      placeholder: hasFloatingLabel ? "" : props.placeholder,
      autocomplete: props.autocomplete || "off",
      inputmode: props.inputmode,
      value: getQuery(),
      disabled: isDisabled(),
      readOnly: isReadonly(),
      role: "combobox",
      "aria-autocomplete": "list",
      "aria-expanded": "false",
      "aria-controls": `${uid}-list`
    });

    const resultsWrap = _.div({
      id: `${uid}-list`,
      class: "jss-search-results",
      role: "listbox"
    });
    const menu = _.div({
      class: uiClass(["jss-search-menu", "jss-singularity-menu-select", props.menuClass, uiWhen(props.fill, "jss-select-menu-fill")]),
      "data-jss-overlay-portal": "true",
      onClick: (event) => event.stopPropagation()
    }, resultsWrap);
    const root = _.div({
      class: uiClass(["jss-search", props.class]),
      role: "presentation"
    }, input, menu);

    let field = null;

    if (valueBinding) {
      if (typeof valueBinding === "object" && typeof valueBinding._bind === "function") {
        scope.action(valueBinding, (v) => setQuery(v, { fromModel: true }));
        modelSet = (v) => {
          if (valueBinding.value !== v) valueBinding.value = v;
        };
      } else if (Array.isArray(valueBinding) && typeof valueBinding[0] === "function" && typeof valueBinding[1] === "function") {
        const get = valueBinding[0];
        const set = valueBinding[1];
        scope.effect(() => { setQuery(get(), { fromModel: true }); }, "UI.Search:model");
        modelSet = (v) => set(v);
      }
    } else if (uiIsReactive(props.value)) {
      scope.effect(() => { setQuery(uiUnwrap(props.value), { fromModel: true }); }, "UI.Search:value");
    }

    input.addEventListener("input", (event) => {
      setQuery(input.value, { event });
      if (props.searchOnInput !== false) scheduleSearch(input.value, { open: true });
    });
    input.addEventListener("change", (event) => props.onChange?.(input.value, event));
    input.addEventListener("focus", (event) => {
      syncPlaceholder();
      props.onFocus?.(event);
      if (props.openOnFocus !== false) {
        if (props.searchOnFocus && !getResults().length) scheduleSearch(input.value, { immediate: true, open: true });
        else open();
      }
    });
    input.addEventListener("blur", (event) => {
      syncPlaceholder();
      props.onBlur?.(event);
    });
    input.addEventListener("keydown", (event) => {
      if (isDisabled() || isReadonly()) return;
      const openNow = getOpen();
      const list = getResults();
      const active = getActive();
      if (event.key === "Escape") {
        if (openNow) {
          event.preventDefault();
          close();
        }
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!openNow) {
          open();
          if (!list.length) scheduleSearch(input.value, { immediate: true, open: true });
        } else moveActive(1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!openNow) open();
        else moveActive(-1);
        return;
      }
      if (event.key === "Home" && openNow && list.length && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setActive(0);
        return;
      }
      if (event.key === "End" && openNow && list.length && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setActive(list.length - 1);
        return;
      }
      if (event.key === "Enter") {
        if (openNow && active >= 0 && list[active]) {
          event.preventDefault();
          selectResult(list[active], event);
        } else {
          submit(event);
        }
      }
    });

    const onDocClick = (event) => {
      if (!root.isConnected) return;
      const target = event.target;
      if (root.contains(target) || menu.contains(target)) return;
      close();
    };
    document.addEventListener("click", onDocClick, true);

    scope.effect(() => {
      const openNow = getOpen();
      root.classList.toggle("open", openNow);
      input.setAttribute("aria-expanded", openNow ? "true" : "false");
      if (openNow) mountMenuPortal();
      else unmountMenuPortal();
    }, "UI.Search:open");

    scope.effect(() => {
      const d = isDisabled();
      const r = isReadonly();
      root.classList.toggle("disabled", d);
      root.classList.toggle("readonly", r);
      input.disabled = d;
      input.readOnly = r;
    }, "UI.Search:disabled");

    scope.effect(() => {
      const loading = getLoading();
      const error = getError();
      const results = getResults();
      const query = getQuery();
      resultsWrap.innerHTML = "";
      resultNodes = [];
      lastActive = -1;

      if (loading) {
        const loadingNode = JSswift.ui.renderSlot(slots, "loading", { query }, props.loadingText || "Caricamento...");
        resultsWrap.appendChild(_.div({ class: "jss-search-empty is-loading" }, ...renderSlotToArray(null, "default", {}, loadingNode)));
      } else if (error) {
        const errorNode = JSswift.ui.renderSlot(slots, "error", { error, query }, props.errorText || "Errore ricerca");
        resultsWrap.appendChild(_.div({ class: "jss-search-empty is-error" }, ...renderSlotToArray(null, "default", {}, errorNode)));
      } else if (!results.length) {
        const enoughQuery = query.trim().length >= minLength();
        const emptyDefault = enoughQuery ? (props.emptyText || "Nessun risultato") : (props.startText || "");
        const emptyNode = JSswift.ui.renderSlot(slots, "empty", { query }, emptyDefault);
        if (emptyDefault || JSswift.ui.getSlot(slots, "empty") != null) {
          resultsWrap.appendChild(_.div({ class: "jss-search-empty" }, ...renderSlotToArray(null, "default", {}, emptyNode)));
        }
      } else {
        results.forEach((item, index) => {
          const selected = false;
          const label = getLabel(item);
          const value = getValue(item);
          const select = (event) => selectResult(item, event);
          const content = JSswift.ui.renderSlot(slots, "result", {
            item,
            index,
            active: selected,
            label,
            value,
            query,
            select
          }, renderDefaultResult(item));
          const node = _.div({
            id: `${uid}-result-${index}`,
            class: uiClass(["jss-search-result", selected ? "active" : ""]),
            role: "option",
            "aria-selected": selected ? "true" : "false",
            onMouseEnter: () => setActive(index),
            onMouseDown: (event) => event.preventDefault(),
            onClick: select
          }, ...renderSlotToArray(null, "default", {}, content));
          resultsWrap.appendChild(node);
          resultNodes[index] = node;
        });
      }
      if (!hasPanelContent()) close();
      scheduleMenuPosition();
    }, "UI.Search:render");

    scope.effect(() => {
      const active = getActive();
      if (active === lastActive) return;
      if (resultNodes[lastActive]) {
        resultNodes[lastActive].classList.remove("active");
        resultNodes[lastActive].setAttribute("aria-selected", "false");
      }
      if (resultNodes[active]) {
        resultNodes[active].classList.add("active");
        resultNodes[active].setAttribute("aria-selected", "true");
        resultNodes[active].scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", `${uid}-result-${active}`);
      } else {
        input.removeAttribute("aria-activedescendant");
      }
      lastActive = active;
    }, "UI.Search:active");

    field = UI.FormField({
      ...props,
      icon: props.icon ?? "search",
      wrapClass: uiClass(["jss-search-field", props.wrapClass]),
      control: root,
      getValue: () => getQuery(),
      onClear: () => {
        if (isDisabled() || isReadonly()) return;
        setQuery("", {});
        clearResults();
        props.onClear?.();
      },
      onFocus: () => input.focus()
    });

    input.addEventListener("input", () => field._refresh?.());
    input.addEventListener("change", () => field._refresh?.());

    field._input = input;
    field._search = root;
    field._open = open;
    field._close = close;
    field._searchNow = () => runSearch(getQuery(), { immediate: true, open: true });
    field._getResults = getResults;
    field._setValue = (value) => setQuery(value, {});
    field._dispose = () => {
      if (disposed) return;
      disposed = true;
      scope.dispose();
      requestId++;
      cache.clear();
      document.removeEventListener("click", onDocClick, true);
      if (searchTimer) clearTimeout(searchTimer);
      if (activeController) activeController.abort();
      unmountMenuPortal();
    };
    JSswift._registerCleanup?.(field, field._dispose);
    uiRegisterShortcode(input, props, {
      isEnabled: () => !input.disabled,
      action: () => uiFocusShortcutTarget(input, { selectText: !!props.selectOnShortcode })
    });

    if (props.autoSearch || props.searchOnMount) {
      scheduleSearch(getQuery(), { immediate: true, open: false });
    }

    return field;
  };
