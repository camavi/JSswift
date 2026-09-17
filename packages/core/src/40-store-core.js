  // ===============================
  // JSswift.store v1 (persisted reactive state)
  // ===============================
  JSswift.store = (() => {
    const config = {
      prefix: "JSswift:",
      storage: "local", // "local" | "session"
      syncTabs: true,
      writeDelay: 0, // ms (0 = microtask)
    };

    const mem = new Map();          // channelKey -> value (runtime cache)
    const watchers = new Map();     // channelKey -> Set(fn)
    const pendingWrites = new Map();// channelKey -> { key, scope }
    const knownScopes = new Map();  // scopeId -> { storage, prefix }
    let writeQueued = false;
    const {
      createScopeTools,
      safeParse,
      safeStringify,
      clearScopedMapEntries
    } = JSswift._storeShared;
    const {
      getScope,
      getStorage,
      fullKey,
      channelKey
    } = createScopeTools(config, knownScopes);

    function emit(key, value, scope = null) {
      const resolved = scope || getScope();
      const set = watchers.get(channelKey(key, resolved));
      if (!set) return;
      for (const fn of set) {
        try {
          if (JSswift.reactive?.untracked) {
            JSswift.reactive.untracked(() => fn(value));
          } else {
            fn(value);
          }
        } catch (e) { console.error("[store] watcher error:", e); }
      }
    }

    function flushWrites() {
      writeQueued = false;
      for (const [id, pending] of Array.from(pendingWrites.entries())) {
        pendingWrites.delete(id);
        const v = mem.get(id);
        const s = safeStringify(v);
        if (s === undefined) continue;
        const st = getStorage(pending.scope);
        try { st.setItem(fullKey(pending.key, pending.scope), s); }
        catch (e) { console.error("[store] write error:", e); }
      }
    }

    function scheduleWrite(key, scope = null) {
      const resolved = scope || getScope();
      pendingWrites.set(channelKey(key, resolved), { key, scope: resolved });
      if (writeQueued) return;
      writeQueued = true;

      if (config.writeDelay > 0) {
        setTimeout(flushWrites, config.writeDelay);
      } else {
        queueMicrotask(flushWrites);
      }
    }

    function readFromStorage(key, scope = null) {
      const resolved = scope || getScope();
      const st = getStorage(resolved);
      const raw = st.getItem(fullKey(key, resolved));
      if (raw == null) return undefined;
      return safeParse(raw);
    }

    function get(key, fallback, scope = null) {
      const resolved = scope || getScope();
      const id = channelKey(key, resolved);
      if (mem.has(id)) return mem.get(id);
      const v = readFromStorage(key, resolved);
      if (v !== undefined) {
        mem.set(id, v);
        return v;
      }
      return fallback;
    }

    function set(key, value, scope = null) {
      const resolved = scope || getScope();
      mem.set(channelKey(key, resolved), value);
      scheduleWrite(key, resolved);
      emit(key, value, resolved);
      return value;
    }

    function remove(key, scope = null) {
      const resolved = scope || getScope();
      const id = channelKey(key, resolved);
      mem.delete(id);
      pendingWrites.delete(id);
      try { getStorage(resolved).removeItem(fullKey(key, resolved)); } catch { }
      emit(key, undefined, resolved);
    }

    function clear(opts = {}) {
      const scope = getScope(opts);
      // rimuove solo chiavi col prefix nel relativo storage
      const st = getStorage(scope);
      const keys = [];
      for (let i = 0; i < st.length; i++) {
        const k = st.key(i);
        if (k && k.startsWith(scope.prefix)) keys.push(k);
      }
      for (const k of keys) st.removeItem(k);

      clearScopedMapEntries(scope, mem, pendingWrites, watchers);
    }

    function watch(key, fn, scope = null) {
      if (typeof fn !== "function") return () => { };
      const resolved = scope || getScope();
      const id = channelKey(key, resolved);
      if (!watchers.has(id)) watchers.set(id, new Set());
      watchers.get(id).add(fn);
      return () => watchers.get(id)?.delete(fn);
    }

    // Signal persistente (core feature)
    function signal(key, initial, opts = {}) {
      const scope = getScope({
        storage: opts.storage,
        prefix: opts.prefix
      });

      const hydrated = get(key, initial, scope);
      const [getSig, setSig, disposeSignal] = JSswift.reactive.signal(hydrated);

      // quando cambia signal -> store, deve restare nello scope corretto
      const stopEffect = JSswift.reactive.effect(() => {
        const v = getSig();
        set(key, v, scope);
      });

      // quando cambia store (cross-tab o set manuale nello stesso scope) -> signal
      const unwatch = watch(key, (v) => {
        // evita loop inutili
        if (getSig() !== v) setSig(v);
      }, scope);

      // cleanup helper
      const dispose = () => {
        try { stopEffect?.(); } catch { }
        try { unwatch?.(); } catch { }
        try { disposeSignal?.(); } catch { }
      };

      return [getSig, setSig, dispose];
    }

    getScope();

    // cross-tab sync
    if (config.syncTabs) {
      window.addEventListener("storage", (e) => {
        if (!e.key || !e.storageArea) return;

        for (const scope of knownScopes.values()) {
          if (getStorage(scope) !== e.storageArea) continue;
          if (!e.key.startsWith(scope.prefix)) continue;

          const key = e.key.slice(scope.prefix.length);
          const v = e.newValue == null ? undefined : safeParse(e.newValue);
          const id = channelKey(key, scope);

          // aggiorna cache + watchers (senza forzare write)
          if (v === undefined) mem.delete(id);
          else mem.set(id, v);

          emit(key, v, scope);
        }
      });
    }

    function configure(next = {}) {
      Object.assign(config, next);
      getScope();
    }

    function stats() {
      return {
        prefix: config.prefix,
        storage: config.storage,
        syncTabs: config.syncTabs,
        cacheSize: mem.size,
        scopeCount: knownScopes.size,
      };
    }

    return { configure, stats, get, set, remove, clear, watch, signal };
  })();
