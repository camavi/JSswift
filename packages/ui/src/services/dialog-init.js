  app.services = app.services || {};
  app.services.dialog = app.services.dialog || {};
  app.dialog = app.services.dialog;

  let modalRoot = null;

  function ensureModalRoot() {
    if (modalRoot) return modalRoot;

    modalRoot = document.createElement("div");
    modalRoot.setAttribute("data-jss-modal-root", "true");
    document.body.appendChild(modalRoot);
    return modalRoot;
  }
