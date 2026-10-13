
  const overlayAnimDuration = (el, fallback = 180) => {
    const d = getComputedStyle(el).transitionDuration;
    if (!d) return fallback;
    const first = d.split(",")[0].trim();
    if (!first) return fallback;
    const ms = first.includes("ms") ? parseFloat(first) : parseFloat(first) * 1000;
    return Number.isFinite(ms) ? ms : fallback;
  };

  const overlayEnter = (entry) => {
    if (!entry?.overlay || !entry?.panel) return;
    entry.overlay.classList.add("enter");
    entry.panel.classList.add("enter");
    requestAnimationFrame(() => {
      if (!entry?.overlay || !entry?.panel) return;
      entry.overlay.classList.add("entered");
      entry.panel.classList.add("entered");
      entry.overlay.classList.remove("enter");
      entry.panel.classList.remove("enter");
    });
  };

  const overlayLeave = (entry, done) => {
    if (!entry?.overlay || !entry?.panel) {
      done?.();
      return;
    }
    if (entry._closing) return;
    entry._closing = true;
    entry.overlay.classList.add("leave");
    entry.panel.classList.add("leave");
    const finish = () => {
      if (entry._closed) return;
      entry._closed = true;
      done?.();
    };
    const onEnd = (e) => {
      if (e.target !== entry.panel) return;
      entry.panel.removeEventListener("transitionend", onEnd);
      finish();
    };
    entry.panel.addEventListener("transitionend", onEnd);
    const ms = overlayAnimDuration(entry.panel, 180);
    setTimeout(finish, ms + 40);
  };
