let drawerStateKey = "jsswift:drawer-open";
const drawerToggleIcons = new Set();
const drawerElsByKey = new Map();
const readDrawerOpen = (key = drawerStateKey) => {
  const store = JSswift?.store;
  if (store?.get) {
    const stored = store.get(key, undefined);
    if (typeof stored === "boolean") return stored;
  }
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};
const writeDrawerOpen = (open, key = drawerStateKey) => {
  const store = JSswift?.store;
  if (store?.set) {
    store.set(key, !!open);
    return;
  }
  try {
    localStorage.setItem(key, open ? "1" : "0");
  } catch {
    // ignore storage errors
  }
};
let drawerOpen = readDrawerOpen();
const setDrawerOpen = (open, key = drawerStateKey) => {
  drawerOpen = !!open;
  const drawerEls = drawerElsByKey.get(key);
  if (drawerEls && drawerEls.size) {
    drawerEls.forEach((el) => el?.classList.toggle("open", drawerOpen));
  } else {
    const drawerEl = document.querySelector(".jss-drawer");
    if (drawerEl) drawerEl.classList.toggle("open", drawerOpen);
  }
  drawerToggleIcons.forEach((entry) => {
    if (!entry) return;
    if (typeof entry.update === "function") {
      entry.update(drawerOpen);
      return;
    }
    const { el, openIcon, closeIcon } = entry;
    if (el) el.textContent = drawerOpen ? openIcon : closeIcon;
  });
  writeDrawerOpen(drawerOpen, key);
  return drawerOpen;
};
