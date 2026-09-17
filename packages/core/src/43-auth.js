  // ===============================
  // Auth Plugin (store + router guard)
  // Auth Plugin + Roles / Permissions
  // Auth Plugin (async + refresh token)
  // ===============================
  JSswift.plugins.auth = {
    install(app, opts = {}) {
      const {
        createPermissionApi,
        matchesProtectedPath,
        attachDevTools
      } = JSswift._authShared;
      const options = {
        key: opts.key || "auth",
        loginRoute: opts.loginRoute || "/login",
        protected: opts.protected || [],
        autoRedirect: opts.autoRedirect ?? true,

        // async config
        endpoints: opts.endpoints || {
          login: "/api/login",
          refresh: "/api/refresh",
          logout: "/api/logout"
        },

        fetchOptions: opts.fetchOptions || {},
        tokenHeader: opts.tokenHeader || "Authorization",
        tokenPrefix: opts.tokenPrefix || "Bearer ",

        refreshMargin: opts.refreshMargin || 30_000 // ms prima della scadenza
      };

      // ---------- STORE ----------
      const [getAuth, setAuth] = app.store.signal(options.key, null);

      const getUser = () => getAuth()?.user || null;
      const isAuth = () => !!getAuth()?.accessToken;

      // ---------- ROLES / PERMS ----------
      const {
        hasRole,
        can,
        canAny,
        canAll
      } = createPermissionApi(getUser);

      // ---------- INTERNAL STATE ----------
      let refreshing = false;
      let refreshQueue = [];

      // ---------- HELPERS ----------
      function needsRefresh() {
        const a = getAuth();
        if (!a?.expiresAt) return false;
        return Date.now() > (a.expiresAt - options.refreshMargin);
      }

      async function doRefresh() {
        if (refreshing) {
          return new Promise((res, rej) => refreshQueue.push({ res, rej }));
        }

        refreshing = true;

        try {
          const r = await fetch(options.endpoints.refresh, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: getAuth()?.refreshToken })
          });

          if (!r.ok) throw new Error("Refresh failed");

          const data = await r.json();
          setAuth({ ...getAuth(), ...data });

          refreshQueue.forEach(q => q.res(true));
          refreshQueue = [];
          return true;

        } catch (e) {
          refreshQueue.forEach(q => q.rej(e));
          refreshQueue = [];
          setAuth(null);
          if (options.autoRedirect) app.router.navigate(options.loginRoute);
          throw e;

        } finally {
          refreshing = false;
        }
      }

      // ---------- ASYNC AUTH API ----------
      async function loginAsync(credentials) {
        const r = await fetch(options.endpoints.login, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials)
        });

        if (!r.ok) throw new Error("Login failed");
        const data = await r.json();
        setAuth(data);
        return data;
      }

      async function logoutAsync() {
        try {
          await fetch(options.endpoints.logout, { method: "POST" });
        } catch { }
        setAuth(null);
        if (options.autoRedirect) app.router.navigate(options.loginRoute);
      }

      // ---------- AUTH FETCH ----------
      async function authFetch(url, opts = {}) {
        if (needsRefresh()) await doRefresh();

        const a = getAuth();
        const headers = new Headers(opts.headers || {});
        if (a?.accessToken) {
          headers.set(options.tokenHeader, options.tokenPrefix + a.accessToken);
        }

        const r = await fetch(url, { ...options.fetchOptions, ...opts, headers });

        if (r.status === 401 && getAuth()?.refreshToken && !opts._authRetried) {
          await doRefresh();
          return authFetch(url, { ...opts, _authRetried: true });
        }

        return r;
      }

      // ---------- ROUTER GUARD ----------
      app.router.beforeEach((ctx) => {
        const path = ctx.path;
        const protectedMatch = matchesProtectedPath(path, options.protected);

        if (protectedMatch && !isAuth()) {
          return options.loginRoute;
        }
        return true;
      });

      // ---------- PUBLIC API ----------
      app.auth = {
        user: getUser,
        isAuth,
        hasRole,
        can,
        canAny,
        canAll,
        loginAsync,
        logoutAsync,
        fetch: authFetch,
        _getState: getAuth
      };

      // ---------- HOOK ----------
      app.useAuth = function (ctx) {
        if (ctx && typeof ctx.onDispose === "function") {
          // future-proof
        }

        return app.auth;
      };

      attachDevTools(JSswift, app.auth);
    }
  };
