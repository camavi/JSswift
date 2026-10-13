

  UI.Select = (props = {}) => {
    const scope = uiSubscriptionScope();
    let disposed = false;
    const fieldProps = {
      ...props,
      label: props.label ?? props.placeholder
    };
    const filterable = props.filterable;
    const isMulti = !!props.multiple || !!props.multi;
    const allowCustom = !!props.allowCustom || !!props.allowCustomValue;
    const slots = props.slots || {};
    const isBoundValue = (v) => !!v && ((typeof v === "object" && typeof v._bind === "function") || uiIsSignal(v));
    const valueBinding = isBoundValue(props.model)
      ? props.model
      : (isBoundValue(props.value) ? props.value : null);

    const toArray = (v) => {
      if (Array.isArray(v)) return v.slice();
      if (v == null || v === "") return [];
      return [v];
    };
    const normalizeValue = (v) => isMulti ? toArray(v) : v;
    const initialValue = valueBinding
      ? JSswift.reactive.untracked(() => (
        typeof valueBinding === "object" && typeof valueBinding._bind === "function"
          ? valueBinding.value
          : valueBinding[0]()
      ))
      : props.value;

    // state
    const [getOpen, setOpen] = JSswift.reactive.signal(false);
    const [getFilter, setFilter] = JSswift.reactive.signal("");
    const [getValue, setValue] = JSswift.reactive.signal(isMulti ? toArray(initialValue) : (initialValue ?? ""));
    const [getLoading, setLoading] = JSswift.reactive.signal(false);
    const [getList, setList] = JSswift.reactive.signal([]);      // normalized flat list
    const [getFlat, setFlat] = JSswift.reactive.signal([]);      // flat selectable options only (no groups)
    const [getActive, setActive] = JSswift.reactive.signal(-1);  // active index in flat selectable list

    let modelSet = null;

    // model binding
    if (valueBinding) {
      if (typeof valueBinding === "object" && typeof valueBinding._bind === "function") {
        JSswift.reactive.untracked(() => setValue(normalizeValue(valueBinding.value)));
        scope.action(valueBinding, (v) => setValue(normalizeValue(v)));
        modelSet = (v) => {
          const next = normalizeValue(v);
          if (valueBinding.value !== next) valueBinding.value = next;
        };
      } else if (Array.isArray(valueBinding) && typeof valueBinding[0] === "function" && typeof valueBinding[1] === "function") {
        const get = valueBinding[0];
        const set = valueBinding[1];
        JSswift.reactive.untracked(() => {
          scope.effect(() => { setValue(normalizeValue(get())); }, "UI.Select:model");
        });
        modelSet = (v) => set(normalizeValue(v));
      }
    }

    function isDisabled() {
      if (typeof props.disabled === "function") return props.disabled();
      else if (typeof props.disabled === "boolean") return props.disabled;
      else if (props?.disabled?.action) {
        return props.disabled.value;
      } else return false;
    }

    function normalizeOption(opt) {
      if (opt == null) return null;
      if (typeof opt === "string" || typeof opt === "number") {
        return { type: "option", label: String(opt), value: opt, disabled: false };
      }
      if (typeof opt === "object") {
        // group support: { label, options: [...] }
        if (Array.isArray(opt.options)) {
          return {
            type: "group",
            label: String(opt.label ?? ""),
            options: opt.options
          };
        }
        const label = opt.label ?? (opt.value != null ? String(opt.value) : "");
        return {
          type: "option",
          label: String(label),
          value: opt.value ?? opt.label ?? "",
          disabled: !!opt.disabled
        };
      }
      return { type: "option", label: String(opt), value: opt, disabled: false };
    }

    // Build display list with groups + flatten selectable list
    function buildLists(rawOptions) {
      const base = Array.isArray(rawOptions) ? rawOptions : [];
      const normalized = base.map(normalizeOption).filter(Boolean);

      const display = [];     // includes group headers + options
      const selectable = [];  // options only (no group headers)

      for (const item of normalized) {
        if (item.type === "group") {
          display.push({ type: "group", label: item.label });
          const gopts = (item.options || []).map(normalizeOption).filter(Boolean).filter(x => x.type === "option");
          for (const o of gopts) {
            display.push(o);
            selectable.push(o);
          }
        } else {
          display.push(item);
          selectable.push(item);
        }
      }

      setList(display);
      setFlat(selectable);
    }

    // supports async options
    async function loadOptions() {
      if (disposed) return;
      const src = props.options;
      let raw;

      try {
        const v = (typeof src === "function")
          ? JSswift.ui.withoutRodPathCapture(() => src())
          : src;
        if (v && typeof v.then === "function") {
          setLoading(true);
          raw = await v;
        } else {
          raw = v;
        }
        if (!disposed) buildLists(raw);
      } catch (e) {
        if (disposed) return;
        console.error("[UI.Select] options load error:", e);
        buildLists([]);
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    function commit(next) {
      const val = normalizeValue(next);
      setValue(val);
      if (modelSet) modelSet(val);
      props.onChange?.(val);
    }

    function toggleValue(val) {
      const list = toArray(getValue());
      const exists = list.some(v => v == val);
      const next = exists ? list.filter(v => v != val) : [...list, val];
      commit(next);
    }

    function selectValue(val, fromFilter = false) {
      if (isMulti) {
        toggleValue(val);
        if (fromFilter) clearFilterInput();
      } else {
        commit(val);
        close();
      }
    }

    function clearFilterInput() {
      setFilter("");
      if (filterInput) filterInput.value = "";
    }

    function close() {
      setOpen(false);
      clearFilterInput();
      setActive(-1);
    }

    async function open() {
      if (disposed || isDisabled()) return;
      setOpen(true);

      // load options (sync/async) on open
      await loadOptions();
      if (disposed) return;

      // set active to current selected, otherwise first enabled
      const current = getValue();
      const flat = getFlat();
      let idx = -1;
      if (isMulti) {
        const list = toArray(current);
        for (const val of list) {
          idx = flat.findIndex(o => o.value == val && !o.disabled);
          if (idx >= 0) break;
        }
      } else {
        idx = flat.findIndex(o => o.value == current && !o.disabled);
      }
      if (idx < 0) idx = flat.findIndex(o => !o.disabled);
      setActive(idx);

      if (filterInput) setTimeout(() => filterInput.focus(), 0);
    }

    function toggle() {
      if (getOpen()) close();
      else open();
    }

    // root select (control + menu)
    const root = _.div({
      class: uiClass(["jss-select", isMulti ? "multiple" : "", props.class]),
      tabIndex: isDisabled() ? -1 : 0,
      role: "combobox",
      "aria-expanded": "false",
      "aria-disabled": isDisabled() ? "true" : "false"
    });

    const valueNode = _.div({
      class: uiClass(["jss-select-value", isMulti ? "jss-select-value-multi" : ""])
    });
    scope.effect(() => {
      const flat = getFlat();
      valueNode.innerHTML = "";
      if (isMulti) {
        const list = toArray(getValue());
        for (const val of list) {
          const opt = flat.find(o => o.value == val);
          const label = opt ? opt.label : (val == null ? "" : String(val));
          let removing = false;
          const chip = UI.Chip({
            label,
            dense: true,
            color: props.chipColor || props.color,
            icon: props.chipIcon || null,
            iconRight: props.chipIconRight || null,
            glossy: props.glossy,
            glow: props.glow,
            glass: props.chipGlass || props.glass,
            class: props.chipClass,
            flat: props.flat,
            rounded: props.rounded,
            outline: props.outline,
            shadow: props.chipShadow,
            lightShadow: props.lightShadow,
            gloss: props.gloss,
            border: props.border,
            size: props.chipSize,
            removable: true,
            onRemove: (e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              e?.stopImmediatePropagation?.();
              if (removing) return;
              removing = true;
              toggleValue(val);
            }
          });
          valueNode.appendChild(chip);
        }
      } else {
        const v = getValue();
        const opt = flat.find(o => o.value == v);
        valueNode.textContent = opt ? opt.label : ((v == null || v === "") ? "" : String(v));
      }
    }, "UI.Select:value");

    const arrowWrap = _.div({ class: "jss-select-arrow" });
    scope.effect(() => {
      const arrowNode = JSswift.ui.renderSlot(slots, "arrow", { open: getOpen() }, UI.Icon("#chevron-down"));
      arrowWrap.innerHTML = "";
      renderSlotToArray(null, "default", {}, arrowNode).forEach(n => arrowWrap.appendChild(n));
    }, "UI.Select:arrow");

    const control = _.div({ class: "jss-select-control", onClick: toggle },
      valueNode,
      arrowWrap
    );

    const optionsWrap = _.div({
      class: "jss-select-options",
      role: "listbox",
      "aria-multiselectable": isMulti ? "true" : "false"
    });

    const filterWrap = _.div({ class: "jss-select-filter jss-d-none" });
    let filterInput = null;
    const defaultFilterInput = _.input({
      class: "jss-input",
      type: "text",
      placeholder: props.filterPlaceholder || "Cerca...",
      onInput: (e) => setFilter(e.target.value || "")
    });
    const renderFilterSlot = () => {
      const filterNode = JSswift.ui.renderSlot(slots, "filter", {
        value: getFilter(),
        setValue: (v) => {
          const next = v == null ? "" : String(v);
          setFilter(next);
          if (filterInput && "value" in filterInput) filterInput.value = next;
        },
        close
      }, defaultFilterInput);
      filterWrap.innerHTML = "";
      const nodes = renderSlotToArray(null, "default", {}, filterNode);
      nodes.forEach(n => filterWrap.appendChild(n));
      filterInput = nodes.length === 1 && nodes[0] && nodes[0].tagName === "INPUT" ? nodes[0] : null;
      if (filterInput) filterInput.value = getFilter() || "";
    };
    JSswift.reactive.untracked(renderFilterSlot);
    scope.effect(() => {
      const next = getFilter() || "";
      if (filterInput && "value" in filterInput && filterInput.value !== next) {
        filterInput.value = next;
      }
    }, "UI.Select:filterValue");

    if (typeof filterable === "boolean") filterable ? filterWrap.classList.remove("jss-d-none") : filterWrap.classList.add("jss-d-none");
    else if (filterable?.action) {
      scope.action(filterable, (v) => {
        v ? filterWrap.classList.remove("jss-d-none") : filterWrap.classList.add("jss-d-none");
      });
      filterable.value ? filterWrap.classList.remove("jss-d-none") : filterWrap.classList.add("jss-d-none");;
    }
    //copia del props
    const menuProps = { ...props };
    applyCommonProps(menuProps);

    const stateMenu = uiComputed([menuProps.color, menuProps.state], () => {
      const color = uiUnwrap(menuProps.color) || uiUnwrap(menuProps.state) || "";
      return ["primary", "secondary", "warning", "danger", "success", "info", "light", "dark"].includes(color)
        ? color
        : (uiUnwrap(menuProps.state) || "");
    });
    const menu = _.div({
      class: uiClass(["jss-select-menu", "jss-singularity-menu-select", stateMenu, menuProps.class, uiWhen(props.fill, "jss-select-menu-fill")]),
      "data-jss-overlay-portal": "true",
      onClick: (e) => e.stopPropagation()
    },
      filterWrap, optionsWrap
    );
    let menuPortalFrame = 0;
    let menuPortalBound = false;

    const scheduleMenuPosition = () => {
      if (!getOpen() || menu.parentNode !== document.body) return;
      if (menuPortalFrame) return;
      menuPortalFrame = requestAnimationFrame(() => {
        menuPortalFrame = 0;
        if (!getOpen() || !root.isConnected || menu.parentNode !== document.body) return;
        const anchor = root.getBoundingClientRect();
        const gap = 6;
        const pad = 8;
        const maxWidth = Math.max(160, window.innerWidth - (pad * 2));
        const width = Math.min(Math.max(anchor.width, 180), maxWidth);
        const left = Math.max(pad, Math.min(anchor.left, window.innerWidth - width - pad));

        menu.style.width = `${width}px`;
        menu.style.left = `${left}px`;
        menu.style.right = "auto";
        menu.style.marginTop = "0";

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
      menu.style.marginTop = "";
    };

    root.appendChild(control);
    root.appendChild(menu);

    // open class + aria
    scope.effect(() => {
      const o = getOpen();
      root.classList.toggle("open", o);
      root.setAttribute("aria-expanded", o ? "true" : "false");
      if (o) mountMenuPortal();
      else unmountMenuPortal();
    }, "UI.Select:open");

    scope.effect(() => {
      const d = isDisabled();
      root.classList.toggle("disabled", d);
      root.tabIndex = d ? -1 : 0;
      root.setAttribute("aria-disabled", d ? "true" : "false");
    }, "UI.Select:disabled");

    // render options with filter (active paint in separate effect)
    let optionNodes = [];
    let lastActive = -1;
    let activeIndex = -1;

    function paintActive() {
      const active = getActive();
      activeIndex = active;
      if (active === lastActive) return;
      if (optionNodes[lastActive]) optionNodes[lastActive].classList.remove("active");
      if (optionNodes[active]) optionNodes[active].classList.add("active");
      lastActive = active;
      if (active >= 0) optionNodes[active]?.scrollIntoView({ block: "nearest" });
    }

    scope.effect(() => {
      const display = getList();
      const flat = getFlat();
      const filter = (getFilter() || "").toLowerCase().trim();
      const current = getValue();
      const selectedValues = isMulti ? toArray(current) : [current];
      const loading = getLoading();
      const activeSnapshot = activeIndex;

      optionsWrap.innerHTML = "";
      optionNodes = [];
      lastActive = -1;

      // build filtered view:
      // we filter only options, group headers appear only if their options remain
      const nodes = [];
      let flatIndex = 0;

      const pushOption = (opt) => {
        const selected = selectedValues.some(v => v == opt.value);
        const disabled = !!opt.disabled;

        const cls = [
          "jss-select-option",
          selected ? "selected" : "",
          disabled ? "disabled" : ""
        ].filter(Boolean).join(" ");

        const select = () => {
          if (isMulti) toggleValue(opt.value);
          else { commit(opt.value); close(); }
        };

        const content = JSswift.ui.renderSlot(slots, "option", {
          opt,
          selected,
          active: flatIndex === activeSnapshot,
          disabled,
          select
        }, opt.label);
        const contentNodes = renderSlotToArray(null, "default", {}, content);

        const node = _.div({
          class: cls,
          "data-flat-index": String(flatIndex),
          // da sistemare nel futuro
          //onMouseEnter: () => setActive(flatIndex),
          onClick: disabled ? null : select
        }, ...contentNodes);

        nodes.push(node);
        optionNodes[flatIndex] = node;
        flatIndex++;
      };

      // If filter active, we filter against flat list; groups become irrelevant visually.
      if (filter) {
        const filtered = flat.filter(o => o.label.toLowerCase().includes(filter));
        if (filtered.length === 0) {
          const emptyNode = JSswift.ui.renderSlot(slots, "empty", { filter }, props.emptyText || "Nessuna opzione");
          optionsWrap.appendChild(_.div({ class: "jss-select-empty" }, ...renderSlotToArray(null, "default", {}, emptyNode)));
          if (getOpen()) scheduleMenuPosition();
          return;
        }
        for (const opt of filtered) pushOption(opt);
      } else {
        // no filter: render grouped display list with headers
        let hadAnyOption = false;
        for (const item of display) {
          if (item.type === "group") {
            const groupNode = JSswift.ui.renderSlot(slots, "group", { label: item.label }, item.label);
            nodes.push(_.div({ class: "jss-select-group" }, ...renderSlotToArray(null, "default", {}, groupNode)));
          } else {
            hadAnyOption = true;
            pushOption(item);
          }
        }
        if (!hadAnyOption) {
          const emptyNode = JSswift.ui.renderSlot(slots, "empty", { filter }, props.emptyText || "Nessuna opzione");
          optionsWrap.appendChild(_.div({ class: "jss-select-empty" }, ...renderSlotToArray(null, "default", {}, emptyNode)));
          if (getOpen()) scheduleMenuPosition();
          return;
        }
      }

      if (loading) {
        const loadingNode = JSswift.ui.renderSlot(slots, "loading", {}, "Caricamento...");
        optionsWrap.appendChild(_.div({ class: "jss-select-empty" }, ...renderSlotToArray(null, "default", {}, loadingNode)));
        if (getOpen()) scheduleMenuPosition();
        return;
      }

      for (const n of nodes) optionsWrap.appendChild(n);
      paintActive();
      if (getOpen()) scheduleMenuPosition();
    }, "UI.Select:render");

    scope.effect(() => {
      paintActive();
    }, "UI.Select:paintActive");

    // outside click + escape cleanup
    const onDocClick = (e) => {
      if (!root.isConnected) return;
      const t = e.target;
      if (root.contains(t)) return;
      if (menu.contains(t)) return;
      close();
    };
    document.addEventListener("click", onDocClick, true);

    const onKeyDown = (e) => {
      if (isDisabled()) return;

      const openNow = getOpen();
      const flat = getFlat();
      const active = getActive();
      const isFilterTarget = filterInput && e.target === filterInput;

      const nextEnabled = (start, dir) => {
        let i = start;
        while (i >= 0 && i < flat.length) {
          if (!flat[i].disabled) return i;
          i += dir;
        }
        return -1;
      };

      const findMatchByFilter = (term) => {
        if (!term) return null;
        const t = term.toLowerCase();
        let exact = flat.find(o => String(o.label).toLowerCase() === t || String(o.value).toLowerCase() === t);
        if (!exact) exact = flat.find(o => String(o.label).toLowerCase().includes(t));
        return exact && !exact.disabled ? exact : null;
      };

      if (e.key === "Escape") {
        if (openNow) { e.preventDefault(); close(); }
        return;
      }

      if (isFilterTarget && (e.key === "Enter" || e.key === " ")) {
        const term = (getFilter() || "").trim();
        if (term) {
          const match = findMatchByFilter(term);
          if (match) {
            e.preventDefault();
            selectValue(match.value, true);
            return;
          }
          if (allowCustom && e.key === "Enter") {
            e.preventDefault();
            selectValue(term, true);
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            return;
          }
        }
        if (e.key === " ") return;
      }

      if (e.key === "Enter" || e.key === " ") {
        // open if closed, otherwise commit active
        e.preventDefault();
        if (!openNow) { open(); return; }
        if (active >= 0 && flat[active] && !flat[active].disabled) {
          if (isMulti) toggleValue(flat[active].value);
          else { commit(flat[active].value); close(); }
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!openNow) { open(); return; }
        const i = nextEnabled(active < 0 ? 0 : active + 1, +1);
        if (i >= 0) setActive(i);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!openNow) { open(); return; }
        const i = nextEnabled(active < 0 ? flat.length - 1 : active - 1, -1);
        if (i >= 0) setActive(i);
        return;
      }

      if (e.key === "Home") {
        if (!openNow) return;
        e.preventDefault();
        const i = nextEnabled(0, +1);
        if (i >= 0) setActive(i);
        return;
      }

      if (e.key === "End") {
        if (!openNow) return;
        e.preventDefault();
        const i = nextEnabled(flat.length - 1, -1);
        if (i >= 0) setActive(i);
        return;
      }
    };

    // attach keydown to root + filter wrapper
    root.addEventListener("keydown", onKeyDown);
    filterWrap.addEventListener("keydown", onKeyDown);

    root._dispose = () => {
      if (disposed) return;
      disposed = true;
      scope.dispose();
      document.removeEventListener("click", onDocClick, true);
      root.removeEventListener("keydown", onKeyDown);
      filterWrap.removeEventListener("keydown", onKeyDown);
      unmountMenuPortal();
    };

    const selectHasValue = () => {
      const v = getValue();
      if (isMulti) return Array.isArray(v) && v.length > 0;
      if (v == null) return false;
      if (v !== "") return true;

      return getFlat().some((opt) => opt.value === "");
    };

    // Wrap in FormField
    const field = UI.FormField({
      ...fieldProps,
      control: root,
      clearable: props.clearable,
      disabled: isDisabled(),
      readonly: false,
      hasValue: selectHasValue,
      getValue: () => {
        const v = getValue();
        return isMulti ? (Array.isArray(v) && v.length ? v : "") : v;
      },
      onClear: () => {
        if (isDisabled()) return;
        commit(isMulti ? [] : null);
        close();
      },
      onFocus: () => {
        // open on focus (nice UX)
        open();
      }
    });

    // refresh has-value when value changes
    scope.effect(() => { field._refresh?.(); }, "UI.Select:fieldRefresh");

    uiConfigureFieldControl(field, root, props);
    field._select = root;
    field._dispose = root._dispose;
    JSswift._registerCleanup?.(field, field._dispose);
    uiRegisterShortcode(field, props, {
      isEnabled: () => !isDisabled(),
      action: () => {
        if (isDisabled()) return false;
        uiFocusShortcutTarget(root);
        open();
      }
    });

    loadOptions();

    return field;
  }
