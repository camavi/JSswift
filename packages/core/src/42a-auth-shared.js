  // ===============================
  // Auth shared helpers
  // ===============================
  JSswift._authShared = (() => {
    function createPermissionApi(getUser) {
      const roles = () => getUser()?.roles || [];
      const perms = () => getUser()?.permissions || [];

      return {
        roles,
        perms,
        hasRole: (role) => roles().includes(role),
        can: (permission) => perms().includes(permission),
        canAny: (list) => list.some((item) => roles().includes(item) || perms().includes(item)),
        canAll: (list) => list.every((item) => roles().includes(item) || perms().includes(item))
      };
    }

    function matchesProtectedPath(path, protectedList) {
      return protectedList.some((entry) =>
        typeof entry === "string"
          ? path.startsWith(entry)
          : entry instanceof RegExp
            ? entry.test(path)
            : false
      );
    }

    function attachDevTools(app, auth) {
      if (!app || !auth) return;

      let tracing = false;

      function safeNow() {
        return Date.now();
      }

      function decodeJWT(token) {
        if (!token || typeof token !== "string") return null;
        const parts = token.split(".");
        if (parts.length < 2) return null;
        try {
          const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const json = decodeURIComponent(
            atob(b64).split("").map((char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0")).join("")
          );
          return JSON.parse(json);
        } catch {
          return null;
        }
      }

      function getAuthState() {
        if (typeof auth._getState === "function") {
          const state = auth._getState();
          return state && typeof state === "object"
            ? state
            : { user: auth.user?.() ?? null };
        }
        return { user: auth.user?.() ?? null };
      }

      function status() {
        const state = getAuthState() || {};
        const user = state.user ?? auth.user?.();
        const name = user?.name || user?.email || user?.id || "anon";
        const ok = !!auth.isAuth?.();
        const expiresAt = state.expiresAt || null;
        const left = expiresAt ? expiresAt - safeNow() : null;
        return ok
          ? `AUTH ✅ user=${name}${expiresAt ? ` expiresIn=${Math.round(left / 1000)}s` : ""}`
          : `AUTH ❌ user=${name}`;
      }

      function inspect(label = "auth") {
        const state = getAuthState() || {};
        const user = state.user ?? auth.user?.();
        const roles = user?.roles || [];
        const perms = user?.permissions || [];
        const accessToken = state.accessToken || null;
        const refreshToken = state.refreshToken || null;
        const jwt = accessToken ? decodeJWT(accessToken) : null;
        const expiresAt = state.expiresAt || (jwt?.exp ? jwt.exp * 1000 : null);
        const now = safeNow();
        const expiresInMs = expiresAt ? (expiresAt - now) : null;

        const info = {
          label,
          isAuth: !!auth.isAuth?.(),
          user,
          roles,
          permissions: perms,
          has: {
            role: (role) => !!auth.hasRole?.(role),
            can: (permission) => !!auth.can?.(permission)
          },
          token: {
            hasAccess: !!accessToken,
            hasRefresh: !!refreshToken,
            expiresAt,
            expiresInSec: expiresInMs == null ? null : Math.round(expiresInMs / 1000),
            decodedJWT: jwt
          }
        };

        console.groupCollapsed(`[JSswift.auth.inspect] ${label}`);
        console.log("status:", status());
        console.log(info);
        if (expiresInMs != null) {
          if (expiresInMs <= 0) console.warn("⚠️ Access token scaduto.");
          else if (expiresInMs < 60_000) console.warn("⚠️ Access token in scadenza (<60s).");
        }
        console.groupEnd();

        return info;
      }

      function trace(on = true) {
        tracing = !!on;
        console.log("[JSswift.auth.trace]", tracing ? "ON" : "OFF");
      }

      if (typeof auth.fetch === "function" && !auth._fetchWrapped) {
        const originalFetch = auth.fetch.bind(auth);
        auth.fetch = async (...args) => {
          const res = await originalFetch(...args);
          if (tracing) {
            try {
              console.log("[auth.fetch]", res.status, args[0]);
            } catch { }
          }
          return res;
        };
        auth._fetchWrapped = true;
      }

      auth.decodeJWT = decodeJWT;
      auth.status = status;
      auth.inspect = inspect;
      auth.trace = trace;
    }

    return {
      createPermissionApi,
      matchesProtectedPath,
      attachDevTools
    };
  })();
