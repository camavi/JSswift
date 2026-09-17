  // useRouter (hook-style)
  // ===============================
  JSswift.useRouter = function (ctx) {
    const router = JSswift.router;

    // nessun cleanup necessario ora, ma pronto per future estensioni
    if (ctx && typeof ctx.onDispose === "function") {
      // placeholder per future listener
    }

    return {
      navigate: router.navigate,
      back: () => history.back(),
      forward: () => history.forward(),
      get current() {
        return router;
      }
    };
  };
  // ===============================
  // useRoute (hook-style, reattivo)
  // ===============================
  JSswift.useRoute = function (ctx) {
    const [getPath, setPath] = JSswift.reactive.signal("");
    const [getParams, setParams] = JSswift.reactive.signal({});
    const [getQuery, setQuery] = JSswift.reactive.signal({});
    const [getHash, setHash] = JSswift.reactive.signal("");

    // handler aggiornamento
    const update = (routeCtx) => {
      setPath(routeCtx.path || "");
      setParams(routeCtx.params || {});
      setQuery(routeCtx.query || {});
      setHash(routeCtx.hash || "");
    };

    // subscribe router
    const unsubscribe = JSswift.router.subscribe(update);

    // cleanup automatico
    if (ctx && typeof ctx.onDispose === "function") {
      ctx.onDispose(unsubscribe);
    }

    return {
      path: getPath,
      params: getParams,
      query: getQuery,
      hash: getHash
    };
  };

  // ===============================
  // Permission-based rendering helpers
  // ===============================
