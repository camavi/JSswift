

UI.AppShell = (...args) => {
  const { props, children } = JSswift.uiNormalizeArgs(args);
  const slots = props.slots || {};
  const hasOwn = (obj, key) => !!obj && Object.prototype.hasOwnProperty.call(obj, key);

  const inheritColor = (childProps) => {
    if (!hasOwn(childProps, "color") && !hasOwn(childProps, "state") && hasOwn(props, "color")) {
      childProps.color = props.color;
    }
    return childProps;
  };

  const noDrawer = uiUnwrap(props.noDrawer) === true || props.drawer === false;
  const reverse = uiUnwrap(props.reverse) === true;
  const stack = uiUnwrap(props.stack) === true;
  const currentStateKey = props.drawerStateKey ?? props.stateKey ?? drawerStateKey;

  if (currentStateKey) {
    drawerStateKey = currentStateKey;
    drawerOpen = readDrawerOpen(currentStateKey);
  }

  const shellCtx = {
    props,
    noDrawer,
    stateKey: currentStateKey,
    isDrawerOpen: () => readDrawerOpen(currentStateKey),
    openDrawer: () => setDrawerOpen(true, currentStateKey),
    closeDrawer: () => setDrawerOpen(false, currentStateKey),
    toggleDrawer: () => setDrawerOpen(!readDrawerOpen(currentStateKey), currentStateKey)
  };

  const headerProps = (props.headerProps && typeof props.headerProps === "object") ? { ...props.headerProps } : {};
  let headerFallback = props.header;
  if (!hasOwn(props, "header") && (
    Object.keys(headerProps).length ||
    hasOwn(props, "title") ||
    hasOwn(props, "subtitle") ||
    hasOwn(props, "left") ||
    hasOwn(props, "right")
  )) {
    if (!hasOwn(headerProps, "title") && hasOwn(props, "title")) headerProps.title = props.title;
    if (!hasOwn(headerProps, "subtitle") && hasOwn(props, "subtitle")) headerProps.subtitle = props.subtitle;
    if (!hasOwn(headerProps, "left") && hasOwn(props, "left")) headerProps.left = props.left;
    if (!hasOwn(headerProps, "right") && hasOwn(props, "right")) headerProps.right = props.right;
    if (!hasOwn(headerProps, "drawerStateKey")) headerProps.drawerStateKey = currentStateKey;
    if (noDrawer && !hasOwn(headerProps, "left")) headerProps.left = false;
    headerFallback = UI.Header(inheritColor(headerProps));
  }

  const drawerProps = (props.drawerProps && typeof props.drawerProps === "object") ? { ...props.drawerProps } : {};
  const drawerItems = hasOwn(props, "drawerItems") ? props.drawerItems : props.items;
  const drawerHeader = hasOwn(props, "drawerHeader") ? props.drawerHeader : undefined;
  let drawerFallback = props.drawer;
  if (!hasOwn(props, "drawer") && !noDrawer && (
    Object.keys(drawerProps).length ||
    drawerItems != null ||
    drawerHeader != null
  )) {
    if (!hasOwn(drawerProps, "items") && drawerItems != null) drawerProps.items = drawerItems;
    if (!hasOwn(drawerProps, "header") && drawerHeader != null) drawerProps.header = drawerHeader;
    if (!hasOwn(drawerProps, "stateKey")) drawerProps.stateKey = currentStateKey;
    drawerFallback = UI.Drawer(inheritColor(drawerProps));
  }

  const pageProps = (props.pageProps && typeof props.pageProps === "object") ? { ...props.pageProps } : {};
  const pageContentFallback = hasOwn(props, "content") ? props.content : children;
  const defaultPageContent = renderSlotToArray(slots, "default", shellCtx, pageContentFallback);
  let pageFallback = props.page;
  if (!hasOwn(props, "page") && (Object.keys(pageProps).length || defaultPageContent.length)) {
    pageFallback = UI.Page(inheritColor(pageProps), ...defaultPageContent);
  }

  const footerProps = (props.footerProps && typeof props.footerProps === "object") ? { ...props.footerProps } : {};
  const footerContent = hasOwn(props, "footerContent") ? props.footerContent : undefined;
  let footerFallback = props.footer;
  if (!hasOwn(props, "footer") && (Object.keys(footerProps).length || footerContent != null)) {
    footerFallback = UI.Footer(inheritColor(footerProps), ...renderSlotToArray(null, "default", shellCtx, footerContent));
  }

  const headerNodes = renderSlotToArray(slots, "header", shellCtx, headerFallback);
  const drawerNodes = noDrawer ? [] : renderSlotToArray(slots, "drawer", shellCtx, drawerFallback);
  const pageNodes = renderSlotToArray(slots, "page", shellCtx, pageFallback);
  const footerNodes = renderSlotToArray(slots, "footer", shellCtx, footerFallback);

  const cls = uiClass([
    "jss-app",
    "jss-app-shell",
    uiWhen(noDrawer, "no-drawer"),
    uiWhen(reverse, "is-reverse"),
    uiWhen(stack, "is-stack"),
    uiWhen(props.flush, "is-flush"),
    uiWhen(props.divider, "is-divider"),
    props.class
  ]);

  const p = JSswift.omit(props, [
    "header", "drawer", "page", "footer", "content",
    "title", "subtitle", "left", "right",
    "items", "drawerItems", "drawerHeader",
    "headerProps", "drawerProps", "pageProps", "footerProps",
    "footerContent",
    "noDrawer", "reverse", "stack", "flush", "divider",
    "drawerStateKey", "stateKey",
    "drawerWidth", "gap", "padding",
    "slots", "color"
  ]);
  p.class = cls;
  p.style = { ...(props.style || {}) };

  const drawerWidth = uiStyleValue(props.drawerWidth, toCssSize);
  if (drawerWidth != null) p.style["--jss-app-shell-drawer-width"] = drawerWidth;
  const gap = uiStyleValue(props.gap, toCssSize);
  if (gap != null) p.style["--jss-app-shell-gap"] = gap;
  const padding = uiStyleValue(props.padding, toCssSize);
  if (padding != null) p.style["--jss-app-shell-padding"] = padding;

  const headerWrap = headerNodes.length
    ? _.div({ class: "jss-app-shell-header-slot" }, ...headerNodes)
    : null;
  const drawerWrap = drawerNodes.length
    ? _.div({ class: "jss-app-shell-drawer-slot" }, ...drawerNodes)
    : null;
  const pageWrap = pageNodes.length
    ? _.div({ class: "jss-app-shell-page-slot" }, ...pageNodes)
    : null;
  const footerWrap = footerNodes.length
    ? _.div({ class: "jss-app-shell-footer-slot" }, ...footerNodes)
    : null;

  const bodyNodes = [drawerWrap, pageWrap];

  const root = _.div(
    p,
    ...(headerWrap ? [headerWrap] : []),
    _.div({ class: "jss-app-shell-body" }, ...bodyNodes.filter(Boolean)),
    ...(footerWrap ? [footerWrap] : [])
  );

  root.openDrawer = shellCtx.openDrawer;
  root.closeDrawer = shellCtx.closeDrawer;
  root.toggleDrawer = shellCtx.toggleDrawer;
  root.isDrawerOpen = shellCtx.isDrawerOpen;
  root.header = headerWrap;
  root.drawer = drawerWrap;
  root.page = pageWrap;
  root.footer = footerWrap;

  setPropertyProps(root, props);
  return root;
};
