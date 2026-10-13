
  UI.RouteTab = (...args) => {
    const { props, children } = JSswift.uiNormalizeArgs(args);
    const slots = props.slots || {};
    const router = JSswift.router || app?.router || null;
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(props, key);
    const hasExplicitActive = hasOwn("active") || hasOwn("selected");
    const normalizeVariant = (value) => {
      const raw = String(uiUnwrap(value) || "").toLowerCase();
      if (raw === "pill" || raw === "pills") return "pills";
      if (raw === "soft" || raw === "card") return "soft";
      if (raw === "solid") return "solid";
      return "line";
    };
    const resolveAccent = (value) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === "") return null;
      return JSswift.uiColors?.includes(raw) ? `var(--jss-${raw})` : String(raw);
    };
    const resolvePath = (value) => {
      if (value == null || value === "") return "";
      try {
        const url = new URL(String(value), window.location.origin);
        return url.pathname || "";
      } catch (_) {
        return String(value).split(/[?#]/)[0] || "";
      }
    };
    const isExternalLink = (value) => {
      if (uiUnwrap(props.external) === true) return true;
      if (!value) return false;
      return /^(mailto:|tel:|https?:\/\/|\/\/)/i.test(String(value));
    };
    const getHref = () => uiUnwrap(props.href ?? props.to) || "#";
    const getTo = () => uiUnwrap(props.to ?? props.href) || "";
    const getCurrentPath = () => {
      try {
        if (router?.current) return router.current().pathname || window.location.pathname || "";
      } catch (_) { }
      return window.location.pathname || "";
    };
    const matchCurrentRoute = () => {
      const to = getTo();
      if (!to) return false;
      const matchValue = uiUnwrap(props.match ?? props.activeMatch ?? props.routeMatch);
      const matchMode = String(uiUnwrap(props.matchMode ?? (props.startsWith ? "startsWith" : (props.exact ? "exact" : ""))) || "").toLowerCase();
      const currentPath = getCurrentPath();
      if (typeof matchValue === "function") {
        return !!matchValue({ currentPath, to, href: getHref(), router, props });
      }
      if (matchValue instanceof RegExp) {
        return matchValue.test(currentPath);
      }
      const targetPath = resolvePath(typeof matchValue === "string" && !["exact", "startsWith", "prefix", "section"].includes(matchValue.toLowerCase())
        ? matchValue
        : to);
      if (!targetPath) return false;
      const mode = matchMode || (typeof matchValue === "string" && ["startsWith", "prefix", "section"].includes(matchValue.toLowerCase()) ? "startsWith" : "exact");
      if (mode === "startswith" || mode === "prefix" || mode === "section") {
        return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
      }
      if (router?.isActive) return !!router.isActive(to);
      return currentPath === targetPath;
    };
    const getDisabled = () => !!uiUnwrap(props.disabled);
    let manualActive = null;
    const getActive = () => {
      if (manualActive != null) return !!manualActive;
      if (hasExplicitActive) return !!uiUnwrap(props.active ?? props.selected);
      return matchCurrentRoute();
    };

    const variant = normalizeVariant(props.variant || (props.pills ? "pills" : (props.soft ? "soft" : "line")));
    const normalizedState = !uiUnwrap(props.color) && uiUnwrap(props.state)
      ? normalizeState(uiUnwrap(props.state))
      : "";
    const stateClass = normalizedState ? `jss-state-${normalizedState}` : "";
    const p = JSswift.omit(props, [
      "active", "selected", "label", "title", "text", "to", "icon", "iconRight", "iconSize",
      "note", "subtitle", "caption", "description", "badge", "counter", "count", "aside", "trailing",
      "slots", "state", "color", "dense", "outline", "flat", "glossy", "glow", "glass", "gradient",
      "textGradient", "lightShadow", "shadow", "rounded", "radius", "textColor", "variant", "pills",
      "soft", "block", "fill", "match", "matchMode", "activeMatch", "routeMatch", "exact",
      "startsWith", "external", "onNavigate"
    ]);
    p.href = getHref();
    p.class = uiClass([
      "jss-route-tab",
      "jss-clear-set",
      "jss-singularity",
      `variant-${variant}`,
      uiWhen(props.block ?? props.fill, "block"),
      uiWhen(props.dense, "dense"),
      stateClass,
      props.class
    ]);
    p.style = {
      ...(props.style || {})
    };

    const accent = resolveAccent(props.color ?? props.state);
    if (accent) p.style["--jss-route-tab-accent"] = accent;

    const iconSize = props.iconSize ?? props.size ?? null;
    const resolveIconNode = (value, as) => {
      const raw = uiUnwrap(value);
      if (raw == null || raw === false || raw === "") return null;
      if (typeof raw === "string") return UI.Icon({ name: raw, size: iconSize });
      return JSswift.ui.slot(raw, { as });
    };
    const ctx = () => ({
      active: getActive(),
      disabled: getDisabled(),
      href: getHref(),
      to: getTo(),
      external: isExternalLink(getHref()),
      navigate: (event) => {
        if (getDisabled()) return false;
        const nextTo = getTo();
        const external = isExternalLink(getHref());
        if (!external && nextTo && router?.navigate) {
          if (event?.preventDefault) event.preventDefault();
          router.navigate(nextTo);
          props.onNavigate?.(nextTo, event || null);
          return true;
        }
        props.onNavigate?.(nextTo || getHref(), event || null);
        return false;
      }
    });

    const iconNodes = renderSlotToArray(slots, "icon", ctx(), resolveIconNode(props.icon, "icon"));
    const labelNodes = renderSlotToArray(
      slots,
      "label",
      ctx(),
      props.label ?? props.title ?? props.text ?? children
    );
    const noteNodes = renderSlotToArray(
      slots,
      "note",
      ctx(),
      props.note ?? props.subtitle ?? props.caption ?? props.description
    );
    const badgeNodes = renderSlotToArray(
      slots,
      "badge",
      ctx(),
      props.badge ?? props.counter ?? props.count
    );
    const asideNodes = renderSlotToArray(
      slots,
      "aside",
      ctx(),
      props.aside ?? props.trailing ?? resolveIconNode(props.iconRight, "iconRight")
    );
    const defaultNodes = renderSlotToArray(slots, "default", ctx(), props.content ?? props.body);

    const content = _.span({ class: "jss-route-tab-inner" },
      iconNodes.length ? _.span({ class: "jss-route-tab-icon" }, ...iconNodes) : null,
      _.span({ class: "jss-route-tab-copy" },
        _.span({ class: "jss-route-tab-label" }, ...(labelNodes.length ? labelNodes : [getTo() || getHref() || ""])),
        noteNodes.length ? _.span({ class: "jss-route-tab-note" }, ...noteNodes) : null,
        defaultNodes.length ? _.span({ class: "jss-route-tab-extra" }, ...defaultNodes) : null
      ),
      badgeNodes.length ? _.span({ class: "jss-route-tab-badge" }, ...badgeNodes) : null,
      asideNodes.length ? _.span({ class: "jss-route-tab-aside" }, ...asideNodes) : null
    );

    const wrap = _.a(p, content);
    setPropertyProps(wrap, props);

    const syncState = () => {
      const active = getActive();
      const disabled = getDisabled();
      const href = getHref();
      const external = isExternalLink(href);
      wrap.classList.toggle("active", active);
      wrap.classList.toggle("is-disabled", disabled);
      wrap.classList.toggle("is-external", external);
      if (active) wrap.setAttribute("aria-current", String(uiUnwrap(props.ariaCurrent) || "page"));
      else wrap.removeAttribute("aria-current");
      wrap.setAttribute("href", href || "#");
      if (disabled) {
        wrap.setAttribute("aria-disabled", "true");
        wrap.tabIndex = -1;
      } else {
        wrap.removeAttribute("aria-disabled");
        if (!hasOwn("tabIndex") && !hasOwn("tabindex")) wrap.removeAttribute("tabindex");
      }
      if (getTo()) wrap.dataset.to = String(getTo());
      else delete wrap.dataset.to;
      if (external && wrap.target === "_blank" && !wrap.rel) wrap.rel = "noopener noreferrer";
    };

    const userOnClick = props.onClick;
    wrap.onclick = (e) => {
      userOnClick?.(e);
      if (e.defaultPrevented) return;
      if (getDisabled()) {
        e.preventDefault();
        return;
      }
      ctx().navigate(e);
    };

    if (!hasExplicitActive && getTo() && router?.subscribe) {
      router.subscribe(() => syncState());
    }
    JSswift.reactive.effect(() => {
      syncState();
    }, "UI.RouteTab:render");

    wrap._isActive = () => getActive();
    wrap._setActive = (value) => {
      manualActive = value == null ? null : !!value;
      syncState();
      return wrap;
    };
    wrap._navigate = (event) => ctx().navigate(event);
    return wrap;
  };

  // Esempio: JSswift.ui.RouteTab({ label: "Home", to: "/" })
