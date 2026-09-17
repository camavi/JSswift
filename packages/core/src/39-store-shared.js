  // ===============================
  // Store shared helpers
  // ===============================
  JSswift._storeShared = (() => {
    function scopeId(scope) {
      return `${scope.storage}::${scope.prefix}`;
    }

    function createScopeTools(config, knownScopes) {
      function getScope(opts = {}) {
        const scope = {
          storage: opts.storage ?? config.storage,
          prefix: opts.prefix ?? config.prefix
        };
        knownScopes.set(scopeId(scope), scope);
        return scope;
      }

      function getStorage(scope = null) {
        const mode = typeof scope === "string" ? scope : (scope?.storage ?? config.storage);
        return mode === "session" ? window.sessionStorage : window.localStorage;
      }

      function fullKey(key, scope = null) {
        const resolved = scope || getScope();
        return resolved.prefix + key;
      }

      function channelKey(key, scope = null) {
        const resolved = scope || getScope();
        return `${scopeId(resolved)}::${key}`;
      }

      return { getScope, getStorage, fullKey, channelKey };
    }

    function safeParse(str) {
      try { return JSON.parse(str); } catch { return undefined; }
    }

    function safeStringify(value) {
      try { return JSON.stringify(value); } catch { return undefined; }
    }

    function clearScopedMapEntries(scope, ...maps) {
      const prefix = `${scope.storage}::${scope.prefix}::`;
      for (const map of maps) {
        for (const id of Array.from(map.keys())) {
          if (id.startsWith(prefix)) map.delete(id);
        }
      }
    }

    return {
      createScopeTools,
      safeParse,
      safeStringify,
      clearScopedMapEntries
    };
  })();
