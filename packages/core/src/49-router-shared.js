  // ===============================
  // Router shared helpers
  // ===============================
  JSswift._routerShared = (() => {
    function normalizePath(path) {
      if (!path) return "/";
      if (!path.startsWith("/")) path = "/" + path;
      if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
      return path;
    }

    function stripBase(path, base = "") {
      if (base && path.startsWith(base)) {
        const next = path.slice(base.length) || "/";
        return normalizePath(next);
      }
      return normalizePath(path);
    }

    function compilePattern(pattern) {
      pattern = normalizePath(pattern);
      const keys = [];
      const regexStr = pattern
        .replace(/([.+*?=^!${}()[\]|/\\])/g, "\\$1")
        .replace(/\\\/:([A-Za-z0-9_]+)/g, (_, key) => {
          keys.push(key);
          return "\\/([^\\/]+)";
        });
      return {
        pattern,
        regex: new RegExp("^" + regexStr + "$"),
        keys
      };
    }

    function parseQuery(search) {
      const query = {};
      const params = new URLSearchParams(search || "");
      params.forEach((value, key) => {
        if (query[key] === undefined) query[key] = value;
        else if (Array.isArray(query[key])) query[key].push(value);
        else query[key] = [query[key], value];
      });
      return query;
    }

    function flattenRoutes(routes) {
      const all = [];
      for (const route of routes) {
        all.push({ ...route, _parent: null });
        if (route.children && route.children.length) {
          for (const child of route.children) {
            all.push({ ...child, _parent: route });
          }
        }
      }
      all.sort((a, b) => b.path.length - a.path.length);
      return all;
    }

    function matchRoute(pathname, routes) {
      const path = normalizePath(pathname);
      const all = flattenRoutes(routes);

      for (const route of all) {
        const match = route._compiled.regex.exec(path);
        if (!match) continue;

        const params = {};
        route._compiled.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1]);
        });

        return { route, params, parent: route._parent || null };
      }
      return null;
    }

    function pushHistoryEntry(history, ctx, limit = 50) {
      history.push({
        at: Date.now(),
        path: ctx.path,
        params: ctx.params,
        query: ctx.query,
        hash: ctx.hash
      });
      if (history.length > limit) history.shift();
    }

    return {
      normalizePath,
      stripBase,
      compilePattern,
      parseQuery,
      flattenRoutes,
      matchRoute,
      pushHistoryEntry
    };
  })();
