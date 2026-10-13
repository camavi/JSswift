

  UI.Card = (...args) => {
    const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
    const slots = rawProps.slots || {};
    const props = { ...rawProps };
    applyCommonProps(props);

    const isSectionNode = (node, name) => {
      return !!(node && node.nodeType === 1 && node.classList?.contains(`jss-card-${name}`));
    };
    const renderIconFallback = (value) => {
      if (value == null) return null;
      if (typeof value === "string") return UI.Icon({ name: value, size: rawProps.iconSize || rawProps.size || "lg" });
      return JSswift.ui.slot(value, { as: "icon" });
    };
    const iconFallback = renderIconFallback(rawProps.icon);
    const coverFallback = rawProps.image
      ? _.img({
        src: rawProps.image,
        alt: rawProps.imageAlt || "",
        class: uiClass(["jss-card-cover-media", rawProps.imageClass]),
        style: rawProps.imageStyle
      })
      : rawProps.cover;

    const ctx = {
      dense: !!uiUnwrap(rawProps.dense),
      flat: !!uiUnwrap(rawProps.flat),
      clickable: !!uiUnwrap(rawProps.clickable),
      to: uiUnwrap(rawProps.to) || null
    };

    const defaultNodes = renderSlotToArray(slots, "default", ctx, children?.length ? children : []);
    const sectionNodes = {
      identifier: [],
      cover: [],
      media: [],
      header: [],
      body: [],
      footer: [],
      actions: []
    };
    const looseNodes = [];

    defaultNodes.forEach((node) => {
      if (isSectionNode(node, "identifier")) sectionNodes.identifier.push(node);
      else if (isSectionNode(node, "cover")) sectionNodes.cover.push(node);
      else if (isSectionNode(node, "media")) sectionNodes.media.push(node);
      else if (isSectionNode(node, "header")) sectionNodes.header.push(node);
      else if (isSectionNode(node, "body")) sectionNodes.body.push(node);
      else if (isSectionNode(node, "footer")) sectionNodes.footer.push(node);
      else if (isSectionNode(node, "actions")) sectionNodes.actions.push(node);
      else looseNodes.push(node);
    });

    const identifierNodes = renderSlotToArray(slots, "identifier", ctx, rawProps.identifier);
    const coverNodes = renderSlotToArray(slots, "cover", ctx, coverFallback);
    const mediaNodes = renderSlotToArray(slots, "media", ctx, rawProps.media);
    const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, rawProps.eyebrow ?? rawProps.kicker);
    const titleNodes = renderSlotToArray(slots, "title", ctx, rawProps.title);
    const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, rawProps.subtitle);
    const headerNodes = renderSlotToArray(slots, "header", ctx, rawProps.header);
    const iconNodes = renderSlotToArray(slots, "icon", ctx, iconFallback);
    const asideNodes = renderSlotToArray(slots, "aside", ctx, rawProps.aside ?? rawProps.headerAside);
    const bodyNodes = renderSlotToArray(slots, "body", ctx, rawProps.body);
    const footerNodes = renderSlotToArray(slots, "footer", ctx, rawProps.footer);
    const actionsNodes = renderSlotToArray(slots, "actions", ctx, rawProps.actions);

    const generatedIdentifier = identifierNodes.length
      ? _.div({ class: uiClass(["jss-card-identifier", rawProps.identifierClass]) }, ...identifierNodes)
      : null;
    const generatedCover = coverNodes.length
      ? _.div({ class: uiClass(["jss-card-cover", rawProps.coverClass]) }, ...coverNodes)
      : null;
    const generatedMedia = mediaNodes.length
      ? _.div({ class: uiClass(["jss-card-media", rawProps.mediaClass]) }, ...mediaNodes)
      : null;

    const hasStructuredHeader = iconNodes.length || eyebrowNodes.length || titleNodes.length || subtitleNodes.length || headerNodes.length || asideNodes.length;
    const generatedHeader = hasStructuredHeader
      ? _.div(
        { class: uiClass(["jss-card-header", rawProps.headerClass]) },
        _.div(
          { class: "jss-card-head" },
          iconNodes.length ? _.div({ class: "jss-card-icon" }, ...iconNodes) : null,
          _.div(
            { class: "jss-card-head-main" },
            eyebrowNodes.length ? _.div({ class: uiClass(["jss-card-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
            titleNodes.length ? _.div({ class: uiClass(["jss-card-title", rawProps.titleClass]) }, ...titleNodes) : null,
            subtitleNodes.length ? _.div({ class: uiClass(["jss-card-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
            headerNodes.length ? _.div({ class: uiClass(["jss-card-header-content", rawProps.headerContentClass]) }, ...headerNodes) : null
          ),
          asideNodes.length ? _.div({ class: uiClass(["jss-card-aside", rawProps.asideClass]) }, ...asideNodes) : null
        )
      )
      : null;

    const mergedBodyNodes = [...bodyNodes, ...looseNodes];
    const generatedBody = mergedBodyNodes.length
      ? _.div({ class: uiClass(["jss-card-body", rawProps.bodyClass]) }, ...mergedBodyNodes)
      : null;

    const mergedActionNodes = [...actionsNodes, ...sectionNodes.actions];
    const generatedFooter = (footerNodes.length || mergedActionNodes.length)
      ? _.div(
        { class: uiClass(["jss-card-footer", rawProps.footerClass]) },
        ...footerNodes,
        mergedActionNodes.length ? _.div({ class: "jss-card-actions" }, ...mergedActionNodes) : null
      )
      : null;

    const interactiveClass = uiComputed([rawProps.clickable, rawProps.to], () => {
      return (uiUnwrap(rawProps.clickable) || uiUnwrap(rawProps.to)) ? "jss-card-clickable" : "";
    });
    const hasIdentifier = identifierNodes.length || sectionNodes.identifier.length;
    const hasTopVisual = coverNodes.length || sectionNodes.cover.length || mediaNodes.length || sectionNodes.media.length;

    const p = JSswift.omit(props, [
      "actions", "aside", "asideClass", "body", "bodyClass", "clickable", "cover", "coverClass",
      "coverHeight", "dense", "eyebrow", "eyebrowClass", "flat", "footer", "footerClass", "header",
      "headerAside", "headerClass", "headerContentClass", "icon", "iconSize", "identifier",
      "identifierClass", "image", "imageAlt", "imageClass", "imageStyle", "kicker", "media",
      "mediaClass", "slots", "subtitle", "subtitleClass", "title", "titleClass", "to",
      "display", "direction", "wrap", "align", "justify", "gap", "rowGap", "columnGap",
      "cols", "columns"
    ]);
    p.class = uiClass([
      "jss-panel",
      "jss-card",
      'jss-clear-set',
      "jss-singularity",
      uiWhen(rawProps.flat, "jss-card-flat"),
      uiWhen(rawProps.dense, "jss-card-dense"),
      uiWhen(hasIdentifier, "jss-card-has-identifier"),
      uiWhen(hasTopVisual, "jss-card-has-top-visual"),
      interactiveClass,
      props.class
    ]);
    p.style = { ...(props.style || {}) };
    if (rawProps.coverHeight != null) {
      p.style["--jss-card-cover-height"] = toCssSize(uiUnwrap(rawProps.coverHeight));
    }
    JSswift.uiApplyResponsiveProps(p, rawProps, JSswift.uiResponsiveStyleRules);

    const userOnClick = rawProps.onClick;
    const userOnKeydown = rawProps.onKeydown;
    const onClick = (e) => {
      userOnClick?.(e);
      if (e.defaultPrevented) return;
      const to = uiUnwrap(rawProps.to);
      if (to && JSswift.router?.navigate) {
        e.preventDefault();
        JSswift.router.navigate(to);
      }
    };
    const onKeydown = (e) => {
      userOnKeydown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e);
      }
    };
    if (uiUnwrap(rawProps.clickable) || uiUnwrap(rawProps.to)) {
      p.onClick = onClick;
      p.onKeydown = onKeydown;
      if (p.tabIndex == null) p.tabIndex = 0;
      if (p.role == null) p.role = "button";
    }

    const el = _.div(
      p,
      generatedIdentifier,
      ...sectionNodes.identifier,
      generatedCover,
      ...sectionNodes.cover,
      generatedMedia,
      ...sectionNodes.media,
      generatedHeader,
      ...sectionNodes.header,
      generatedBody,
      ...sectionNodes.body,
      generatedFooter,
      ...sectionNodes.footer
    );

    setPropertyProps(el, rawProps);
    return el;
  }
