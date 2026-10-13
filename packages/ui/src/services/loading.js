
  app.services = app.services || {};
  app.services.loading = app.services.loading || {};
  app.loading = app.services.loading;

  let overlay = null;
  let countLoading = 0;

  function ensureOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "jss-loading-backdrop";
    overlay.style.cssText = `
position: fixed; inset: 0;
background: rgba(0,0,0,0.45);
display: none;
align-items: center; justify-content: center;
z-index: 10001;
padding: 14px;
`;
    const box = document.createElement("div");
    box.className = "jss-panel jss-loading-card";
    box.style.cssText = `
padding: 14px 16px;
border-radius: var(--jss-r-lg);
min-width: 260px;
display:flex; gap: 12px; align-items:center;
flex-direction: column;
`;

    const spinner = document.createElement("div");
    spinner.className = "jss-loading-spinner";
    spinner.style.cssText = `
width: 18px; height: 18px;
border-radius: 50%;
border: 2px solid rgba(255,255,255,0.25);
border-top-color: var(--jss-primary);
animation: jssSpin 0.9s linear infinite;
`;

    const text = document.createElement("div");
    text.className = "jss-muted jss-loading-text";
    text.textContent = "Loading...";

    const progressWrap = document.createElement("div");
    progressWrap.className = "jss-loading-progress";
    progressWrap.style.cssText = `
width: 100%;
height: 6px;
border-radius: 999px;
overflow: hidden;
background: rgba(255,255,255,0.08);
display: none;
`;
    const progressBar = document.createElement("div");
    progressBar.className = "jss-loading-progress-bar";
    progressBar.style.cssText = `
height: 100%;
width: 0%;
background: var(--jss-primary);
transition: width 200ms ease;
`;
    progressWrap.appendChild(progressBar);

    const row = document.createElement("div");
    row.style.cssText = "display:flex; gap: 12px; align-items:center; width: 100%;";
    row.appendChild(spinner);
    row.appendChild(text);

    box.appendChild(row);
    box.appendChild(progressWrap);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const style = document.createElement("style");
    style.textContent = `
@keyframes jssSpin { to { transform: rotate(360deg); } }
`;
    document.head.appendChild(style);

    overlay._textNode = text;
    overlay._spinner = spinner;
    overlay._progressWrap = progressWrap;
    overlay._progressBar = progressBar;
    overlay._progressActive = false;
    return overlay;
  }

  function normalizeLoadingOptions(message, opts) {
    if (typeof message === "object" && message !== null) return { ...message };
    const base = (opts && typeof opts === "object") ? opts : {};
    if (typeof opts === "string" && (message == null || typeof message === "number")) {
      return { ...base, message: opts };
    }
    return { ...base, message: message };
  }

  function setLoadingMode(ov, mode) {
    const showProgress = mode === "progress";
    ov._spinner.style.display = showProgress ? "none" : "";
    ov._progressWrap.style.display = showProgress ? "block" : "none";
    ov._mode = mode;
  }

  app.loading.show = function (message = "Loading...", opts = {}) {
    const ov = ensureOverlay();
    const o = normalizeLoadingOptions(message, opts);
    countLoading++;
    ov._progressActive = false;
    ov._textNode.textContent = o.message || "Loading...";
    setLoadingMode(ov, "spinner");
    if (o.spinner === false) ov._spinner.style.display = "none";
    ov.style.display = "flex";
  };

  app.loading.hide = function () {
    if (!overlay) return;
    countLoading = Math.max(0, countLoading - 1);
    if (countLoading === 0) {
      overlay.style.display = "none";
      overlay._progressActive = false;
    }
  };

  app.loading.progress = function (value = 0, opts = {}) {
    const ov = ensureOverlay();
    if (typeof value === "object" && value !== null) {
      opts = value;
      value = value.value ?? 0;
    }
    const o = normalizeLoadingOptions(null, opts);
    if (!ov._progressActive) {
      countLoading++;
      ov._progressActive = true;
    }
    const v = Math.max(0, Math.min(100, Number(value ?? 0)));
    ov._textNode.textContent = o.message || "Loading...";
    ov._progressBar.style.width = v + "%";
    setLoadingMode(ov, "progress");
    ov.style.display = "flex";
  };

  // helper: wrapper async
  app.loading.wrap = async function (message, fn) {
    app.loading.show(message);
    try { return await fn(); }
    finally { app.loading.hide(); }
  };

  // ===============================
  // UI.Table
  // ===============================
