# Router, store, HTTP, auth, and themes

    _.router.setOutlet("#app");
    _.router.add("/", () => DashboardPage());
    _.router.notFound(() => _.EmptyState({ title: "Page not found" }));
    _.router.start();
    const rows = await _.http.getJSON("/api/rows");

Use getJSON, postJSON, putJSON, patchJSON, and delJSON for JSON APIs. Use request hooks only through onBefore, onAfter, and onError. Use _.auth and _.Can only with a defined permission model. Theme helpers are setTheme, getTheme, and toggleTheme; default persistence is jsswift:theme.
