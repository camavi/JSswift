

UI.Page = (...args) => {
  const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };
  applyCommonProps(props);

  const isSectionNode = (node, name) => {
    return !!(node && node.nodeType === 1 && node.classList?.contains(`jss-page-${name}`));
  };
  const renderIconFallback = (value) => {
    if (value == null) return null;
    if (typeof value === "string") return UI.Icon({ name: value, size: rawProps.iconSize || rawProps.size || "xl" });
    return JSswift.ui.slot(value, { as: "icon" });
  };

  const ctx = {
    dense: !!uiUnwrap(rawProps.dense),
    flat: !!uiUnwrap(rawProps.flat),
    centered: !!uiUnwrap(rawProps.centered),
    narrow: !!uiUnwrap(rawProps.narrow)
  };
  const appendResolvedValue = (host, value) => {
    if (value == null || value === false) return;
    if (Array.isArray(value)) {
      value.forEach((item) => appendResolvedValue(host, item));
      return;
    }
    if (value?.nodeType) {
      host.appendChild(value);
      return;
    }
    host.appendChild(document.createTextNode(String(value)));
  };
  const renderPropNodes = (name, fallback, map = (value) => value) => {
    const slot = JSswift.ui.getSlot(slots, name);
    if (slot !== null && slot !== undefined) {
      return renderSlotToArray(slots, name, ctx, null);
    }
    if (typeof fallback === "function") {
      const inlineNames = new Set(["eyebrow", "title", "subtitle"]);
      const host = _[inlineNames.has(name) ? "span" : "div"]({ class: `jss-page-slot-${name}` });
      JSswift.reactive.effect(() => {
        const nextValue = map(fallback(ctx));
        const normalized = flattenSlotValue(JSswift.ui.slot(nextValue));
        host.replaceChildren();
        if (Array.isArray(normalized)) normalized.forEach((item) => appendResolvedValue(host, item));
        else appendResolvedValue(host, normalized);
      }, `UI.Page:${name}`);
      return [host];
    }
    return renderSlotToArray(slots, name, ctx, map(fallback));
  };

  const defaultNodes = renderSlotToArray(slots, "default", ctx, children?.length ? children : []);
  const sectionNodes = {
    hero: [],
    header: [],
    body: [],
    footer: [],
    actions: []
  };
  const looseNodes = [];

  defaultNodes.forEach((node) => {
    if (isSectionNode(node, "hero")) sectionNodes.hero.push(node);
    else if (isSectionNode(node, "header")) sectionNodes.header.push(node);
    else if (isSectionNode(node, "body")) sectionNodes.body.push(node);
    else if (isSectionNode(node, "footer")) sectionNodes.footer.push(node);
    else if (isSectionNode(node, "actions")) sectionNodes.actions.push(node);
    else looseNodes.push(node);
  });

  const iconNodes = renderPropNodes("icon", rawProps.icon, renderIconFallback);
  const heroNodes = renderPropNodes("hero", rawProps.hero ?? rawProps.banner);
  const eyebrowNodes = renderPropNodes("eyebrow", rawProps.eyebrow ?? rawProps.kicker);
  const titleNodes = renderPropNodes("title", rawProps.title);
  const subtitleNodes = renderPropNodes("subtitle", rawProps.subtitle ?? rawProps.description);
  const headerNodes = renderPropNodes("header", rawProps.header);
  const asideNodes = renderPropNodes("aside", rawProps.aside);
  const bodyNodes = renderPropNodes("body", rawProps.body ?? rawProps.content);
  const footerNodes = renderPropNodes("footer", rawProps.footer);
  const actionsNodes = renderPropNodes("actions", rawProps.actions);

  const generatedHero = heroNodes.length
    ? _.div({ class: uiClass(["jss-page-hero", rawProps.heroClass]) }, ...heroNodes)
    : null;

  const hasStructuredHeader = iconNodes.length || eyebrowNodes.length || titleNodes.length || subtitleNodes.length || headerNodes.length || asideNodes.length;
  const generatedHeader = hasStructuredHeader
    ? _.div(
      { class: uiClass(["jss-page-header", rawProps.headerClass]) },
      _.div(
        { class: "jss-page-head" },
        iconNodes.length ? _.div({ class: uiClass(["jss-page-icon", rawProps.iconClass]) }, ...iconNodes) : null,
        _.div(
          { class: "jss-page-head-main" },
          eyebrowNodes.length ? _.div({ class: uiClass(["jss-page-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
          titleNodes.length ? _.div({ class: uiClass(["jss-page-title", rawProps.titleClass]) }, ...titleNodes) : null,
          subtitleNodes.length ? _.div({ class: uiClass(["jss-page-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
          headerNodes.length ? _.div({ class: uiClass(["jss-page-header-content", rawProps.headerContentClass]) }, ...headerNodes) : null
        ),
        asideNodes.length ? _.div({ class: uiClass(["jss-page-aside", rawProps.asideClass]) }, ...asideNodes) : null
      )
    )
    : null;

  const mergedBodyNodes = [...bodyNodes, ...looseNodes];
  const generatedBody = mergedBodyNodes.length
    ? _.div({ class: uiClass(["jss-page-body", rawProps.bodyClass]) }, ...mergedBodyNodes)
    : null;

  const mergedActionNodes = [...actionsNodes, ...sectionNodes.actions];
  const generatedFooter = (footerNodes.length || mergedActionNodes.length)
    ? _.div(
      { class: uiClass(["jss-page-footer", rawProps.footerClass]) },
      ...footerNodes,
      mergedActionNodes.length ? _.div({ class: "jss-page-actions" }, ...mergedActionNodes) : null
    )
    : null;

  const hasHero = !!(heroNodes.length || sectionNodes.hero.length);
  const hasHeader = !!(hasStructuredHeader || sectionNodes.header.length);
  const p = JSswift.omit(props, [
    "actions", "aside", "asideClass", "banner", "body", "bodyClass", "centered", "content",
    "dense", "description", "eyebrow", "eyebrowClass", "flat", "footer", "footerClass",
    "gap", "header", "headerClass", "headerContentClass", "headerGap", "hero", "heroClass",
    "heroPadding", "icon", "iconClass", "iconSize", "kicker", "maxWidth", "minHeight",
    "narrow", "padding", "size", "slots", "subtitle", "subtitleClass", "title", "titleClass"
  ]);
  p.class = uiClass([
    "jss-panel",
    "jss-page",
    "jss-singularity",
    uiWhen(rawProps.dense, "dense"),
    uiWhen(rawProps.flat, "jss-page-flat"),
    uiWhen(rawProps.centered, "jss-page-centered"),
    uiWhen(rawProps.narrow, "jss-page-narrow"),
    uiWhen(hasHero, "jss-page-has-hero"),
    uiWhen(hasHeader, "jss-page-has-header"),
    props.class
  ]);
  p.style = { ...(props.style || {}) };

  if (rawProps.gap != null || uiIsReactive(rawProps.gap)) {
    p.style["--jss-page-gap"] = uiStyleValue(rawProps.gap, toCssSize);
  }
  if (rawProps.padding != null || uiIsReactive(rawProps.padding)) {
    p.style["--jss-page-padding"] = uiStyleValue(rawProps.padding, toCssSize);
  }
  if (rawProps.maxWidth != null || uiIsReactive(rawProps.maxWidth)) {
    p.style["--jss-page-max-width"] = uiStyleValue(rawProps.maxWidth, toCssSize);
  }
  if (rawProps.minHeight != null || uiIsReactive(rawProps.minHeight)) {
    p.style["--jss-page-min-height"] = uiStyleValue(rawProps.minHeight, toCssSize);
  }
  if (rawProps.headerGap != null || uiIsReactive(rawProps.headerGap)) {
    p.style["--jss-page-header-gap"] = uiStyleValue(rawProps.headerGap, toCssSize);
  }
  if (rawProps.heroPadding != null || uiIsReactive(rawProps.heroPadding)) {
    p.style["--jss-page-hero-padding"] = uiStyleValue(rawProps.heroPadding, toCssSize);
  }

  const el = _.div(
    p,
    generatedHero,
    ...sectionNodes.hero,
    generatedHeader,
    ...sectionNodes.header,
    generatedBody,
    ...sectionNodes.body,
    generatedFooter,
    ...sectionNodes.footer
  );

  setPropertyProps(el, rawProps);
  return el;
};
