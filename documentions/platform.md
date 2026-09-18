# Router, store, HTTP, auth, and themes

    JSswift.router.setOutlet("#app");
    JSswift.router.add("/", () => DashboardPage());
    JSswift.router.notFound(() => JSswift.ui.EmptyState({ title: "Page not found" }));
    JSswift.router.start();
    const rows = await JSswift.http.getJSON("/api/rows");

Use getJSON, postJSON, putJSON, patchJSON, and delJSON for JSON APIs. Use request hooks only through onBefore, onAfter, and onError. Use JSswift.auth and JSswift.Can only with a defined permission model. Theme helpers are setTheme, getTheme, and toggleTheme; default persistence is jsswift:theme.
