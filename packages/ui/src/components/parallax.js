

UI.Parallax = function Parallax(...args) {
  const { props: rawProps, children } = JSswift.uiNormalizeArgs(args);
  const slots = rawProps.slots || {};
  const props = { ...rawProps };

  applyCommonProps(props);

  const stateClass = uiComputed(rawProps.state, () => {
    const state = normalizeState(uiUnwrap(rawProps.state));
    return state ? `jss-state-${state}` : "";
  });
  const mapColorValue = (value) => {
    if (value == null || value === false || value === "") return "";
    const text = String(value);
    return isTokenCSS(text) ? `var(--jss-${text})` : text;
  };
  const getBackgroundImage = () => {
    const background = uiUnwrap(rawProps.background);
    if (background) return String(background);
    const source = uiUnwrap(rawProps.image) || uiUnwrap(rawProps.src) || "";
    if (!source) return "none";
    const text = String(source);
    if (/^url\(/i.test(text) || /gradient\(/i.test(text) || /^var\(/i.test(text)) return text;
    return `url(${JSON.stringify(text)})`;
  };
  const getNumericValue = (value, fallback) => {
    const num = Number(uiUnwrap(value));
    return Number.isFinite(num) ? num : fallback;
  };

  const ctx = {
    speed: () => uiUnwrap(rawProps.speed) ?? 0.18,
    state: () => uiUnwrap(rawProps.state) || "",
    disabled: () => !!uiUnwrap(rawProps.disabled)
  };

  const badgeNodes = renderSlotToArray(slots, "badge", ctx, rawProps.badge);
  const backgroundNodes = renderSlotToArray(slots, "background", ctx, rawProps.backgroundContent);
  const eyebrowNodes = renderSlotToArray(slots, "eyebrow", ctx, rawProps.eyebrow ?? rawProps.kicker);
  const titleNodes = renderSlotToArray(slots, "title", ctx, rawProps.title);
  const subtitleNodes = renderSlotToArray(slots, "subtitle", ctx, rawProps.subtitle);
  const headerNodes = renderSlotToArray(slots, "header", ctx, rawProps.header);
  const asideNodes = renderSlotToArray(slots, "aside", ctx, rawProps.aside);
  const mediaNodes = renderSlotToArray(slots, "media", ctx, rawProps.media);
  const contentNodes = renderSlotToArray(slots, "content", ctx, rawProps.content ?? rawProps.body);
  const defaultNodes = renderSlotToArray(slots, "default", ctx, children?.length ? children : []);
  const footerNodes = renderSlotToArray(slots, "footer", ctx, rawProps.footer);
  const actionsNodes = renderSlotToArray(slots, "actions", ctx, rawProps.actions);
  const mergedBodyNodes = [...contentNodes, ...defaultNodes];

  const generatedBadge = badgeNodes.length
    ? _.div({ class: uiClass(["jss-parallax-badge", rawProps.badgeClass]) }, ...badgeNodes)
    : null;
  const hasStructuredHeader = eyebrowNodes.length || titleNodes.length || subtitleNodes.length || headerNodes.length || asideNodes.length;
  const generatedHeader = hasStructuredHeader
    ? _.div(
      { class: uiClass(["jss-parallax-header", rawProps.headerClass]) },
      _.div(
        { class: "jss-parallax-head" },
        _.div(
          { class: "jss-parallax-head-main" },
          eyebrowNodes.length ? _.div({ class: uiClass(["jss-parallax-eyebrow", rawProps.eyebrowClass]) }, ...eyebrowNodes) : null,
          titleNodes.length ? _.div({ class: uiClass(["jss-parallax-title", rawProps.titleClass]) }, ...titleNodes) : null,
          subtitleNodes.length ? _.div({ class: uiClass(["jss-parallax-subtitle", rawProps.subtitleClass]) }, ...subtitleNodes) : null,
          headerNodes.length ? _.div({ class: uiClass(["jss-parallax-header-content", rawProps.headerContentClass]) }, ...headerNodes) : null
        ),
        asideNodes.length ? _.div({ class: uiClass(["jss-parallax-aside", rawProps.asideClass]) }, ...asideNodes) : null
      )
    )
    : null;
  const generatedMedia = mediaNodes.length
    ? _.div({ class: uiClass(["jss-parallax-media", rawProps.mediaClass]) }, ...mediaNodes)
    : null;
  const generatedBody = mergedBodyNodes.length
    ? _.div({ class: uiClass(["jss-parallax-body", rawProps.bodyClass]) }, ...mergedBodyNodes)
    : null;
  const generatedFooter = (footerNodes.length || actionsNodes.length)
    ? _.div(
      { class: uiClass(["jss-parallax-footer", rawProps.footerClass]) },
      footerNodes.length ? _.div({ class: "jss-parallax-footer-content" }, ...footerNodes) : null,
      actionsNodes.length ? _.div({ class: "jss-parallax-actions" }, ...actionsNodes) : null
    )
    : null;

  const wrapProps = JSswift.omit(props, [
    "actions", "align", "aside", "asideClass", "background", "backgroundContent", "backgroundContentClass",
    "badge", "badgeClass", "bgClass", "bgPosition", "bgRepeat", "bgSize", "body", "bodyClass", "color",
    "content", "contentClass", "contentMaxWidth", "disabled", "eyebrow", "eyebrowClass", "footer",
    "footerClass", "gap", "header", "headerClass", "headerContentClass", "height", "image", "imageAlt",
    "imageClass", "innerClass", "justify", "kicker", "maxOffset", "media", "mediaClass", "minHeight",
    "overlay", "padding", "slots", "speed", "src", "startTop", "state", "subtitle", "subtitleClass",
    "textColor", "title", "titleClass"
  ]);
  wrapProps.class = uiClass([
    "jss-parallax",
    "jss-singularity",
    stateClass,
    uiWhen(rawProps.disabled, "jss-parallax-static"),
    uiWhen(() => !!(uiUnwrap(rawProps.background) || uiUnwrap(rawProps.image) || uiUnwrap(rawProps.src) || rawProps.backgroundContent), "jss-parallax-has-image"),
    uiWhen(generatedBadge, "jss-parallax-has-badge"),
    uiWhen(hasStructuredHeader, "jss-parallax-has-header"),
    props.class
  ]);
  wrapProps.style = { ...(props.style || {}) };
  if (rawProps.height != null) wrapProps.style["--jss-parallax-height"] = uiStyleValue(rawProps.height, toCssSize);
  if (rawProps.minHeight != null) wrapProps.style["--jss-parallax-min-height"] = uiStyleValue(rawProps.minHeight, toCssSize);
  if (rawProps.padding != null) wrapProps.style["--jss-parallax-padding"] = uiStyleValue(rawProps.padding, toCssSize);
  if (rawProps.gap != null) wrapProps.style["--jss-parallax-gap"] = uiStyleValue(rawProps.gap, toCssSize);
  if (rawProps.contentMaxWidth != null) wrapProps.style["--jss-parallax-content-max-width"] = uiStyleValue(rawProps.contentMaxWidth, toCssSize);
  if (rawProps.justify != null) wrapProps.style["--jss-parallax-justify"] = uiStyleValue(rawProps.justify);
  if (rawProps.align != null) wrapProps.style["--jss-parallax-align"] = uiStyleValue(rawProps.align);
  if (rawProps.textColor != null) wrapProps.style["--jss-parallax-color"] = uiStyleValue(rawProps.textColor, mapColorValue);
  if (rawProps.overlay != null) wrapProps.style["--jss-parallax-overlay"] = uiStyleValue(rawProps.overlay);
  if (rawProps.bgPosition != null) wrapProps.style["--jss-parallax-position"] = uiStyleValue(rawProps.bgPosition);
  if (rawProps.bgSize != null) wrapProps.style["--jss-parallax-size"] = uiStyleValue(rawProps.bgSize);
  if (rawProps.bgRepeat != null) wrapProps.style["--jss-parallax-repeat"] = uiStyleValue(rawProps.bgRepeat);
  wrapProps.style["--jss-parallax-image"] = (uiIsReactive(rawProps.background) || uiIsReactive(rawProps.image) || uiIsReactive(rawProps.src))
    ? () => getBackgroundImage()
    : getBackgroundImage();

  wrapProps.style["--jss-parallax-offset"] = "0px";
  wrapProps.style["--jss-parallax-bleed"] = uiStyleValue(rawProps.maxOffset ?? 96, value => `${Math.abs(Number(value) || 96) + 2}px`);

  const bg = _.div(
    { class: uiClass(["jss-parallax-bg", rawProps.bgClass]) },
    backgroundNodes.length
      ? _.div({ class: uiClass(["jss-parallax-bg-content", rawProps.backgroundContentClass]) }, ...backgroundNodes)
      : null
  );
  const content = _.div(
    { class: uiClass(["jss-parallax-content", rawProps.contentClass, rawProps.innerClass]) },
    generatedBadge,
    generatedHeader,
    generatedMedia,
    generatedBody,
    generatedFooter
  );

  const wrap = _.div(wrapProps, bg, content);

  let disposed = false;
  let ticking = false;
  let resizeObserver = null;
  const motionPreference = typeof window !== "undefined" ? window.matchMedia?.("(prefers-reduced-motion: reduce)") : null;

  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    if (typeof window !== "undefined") {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    }
    motionPreference?.removeEventListener?.("change", scheduleUpdate);
    resizeObserver?.disconnect?.();
    resizeObserver = null;
  };

  const update = () => {
    if (disposed) return;
    if (!wrap.isConnected) {
      cleanup();
      return;
    }
    if (uiUnwrap(rawProps.disabled) || motionPreference?.matches) {
      bg.style.transform = "translate3d(0, 0, 0)";
      wrap.style.setProperty("--jss-parallax-offset", "0px");
      return;
    }
    const rect = wrap.getBoundingClientRect();
    const speed = getNumericValue(rawProps.speed, 0.18);
    const maxOffset = Math.abs(getNumericValue(rawProps.maxOffset, 96));
    const explicitStartTop = uiUnwrap(rawProps.startTop);
    const rawOffset = explicitStartTop != null && explicitStartTop !== ""
      ? (rect.top - getNumericValue(rawProps.startTop, 0)) * speed
      : (((typeof window !== "undefined" ? window.innerHeight || document.documentElement.clientHeight || 0 : 0) / 2) - (rect.top + (rect.height / 2))) * speed;
    const offset = maxOffset > 0 ? Math.max(-maxOffset, Math.min(maxOffset, rawOffset)) : rawOffset;
    const cssOffset = `${offset.toFixed(2)}px`;
    bg.style.transform = `translate3d(0, ${cssOffset}, 0)`;
    wrap.style.setProperty("--jss-parallax-offset", cssOffset);
  };

  function scheduleUpdate() {
    if (disposed || ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }

  if (typeof window !== "undefined") {
    motionPreference?.addEventListener?.("change", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => { scheduleUpdate(); });
      resizeObserver.observe(wrap);
    }
    requestAnimationFrame(() => { scheduleUpdate(); });
    setTimeout(() => { scheduleUpdate(); }, 90);
  }

  wrap.refresh = () => {
    scheduleUpdate();
    return wrap;
  };
  wrap.update = wrap.refresh;
  wrap.destroy = () => {
    cleanup();
    wrap.remove();
    return null;
  };
  wrap._dispose = cleanup;

  setPropertyProps(wrap, rawProps);
  return wrap;
};


// Example:
// _.Parallax({ src: "/assets/hero.jpg", height: "280px", speed: 0.2 }, _.h2("Hello"));

// -------------------------------
