  // ===============================
  // HTTP shared helpers
  // ===============================
  JSswift._httpShared = (() => {
    function createReactiveState(JSswift) {
      const reactive = JSswift.reactive;
      const [getInFlight, setInFlight] = reactive.signal(0);
      const [getStatus, setStatus] = reactive.signal("idle");
      const [getLastRequest, setLastRequest] = reactive.signal(null);
      const [getLastResponse, setLastResponse] = reactive.signal(null);
      const [getLastError, setLastError] = reactive.signal(null);
      const [getLastDuration, setLastDuration] = reactive.signal(0);
      const [getLastUpdated, setLastUpdated] = reactive.signal(0);
      let lastStartId = 0;

      function markStart(req) {
        const id = ++lastStartId;
        const ts = Date.now();
        setInFlight(getInFlight() + 1);
        setStatus("pending");
        setLastError(null);
        setLastResponse(null);
        setLastRequest({
          id,
          url: req.url,
          method: req.method,
          meta: req.meta,
          timeout: req.timeout,
          retry: req.retry,
          startedAt: ts
        });
        setLastUpdated(ts);
        return id;
      }

      function markEnd(id, res, err, durationMs) {
        const ts = Date.now();
        setInFlight(Math.max(0, getInFlight() - 1));
        if (id === lastStartId) {
          if (err) {
            setStatus("error");
            setLastError(err);
            setLastResponse(null);
          } else if (res) {
            setStatus("success");
            setLastError(null);
            setLastResponse({
              id,
              status: res.status,
              ok: res.ok,
              headers: res.headers,
              url: res.url,
              receivedAt: ts,
              raw: res
            });
          } else {
            setStatus("idle");
            setLastError(null);
            setLastResponse(null);
          }
          setLastDuration(Math.max(0, Number(durationMs || 0)));
        }
        setLastUpdated(ts);
      }

      const state = {
        inFlight: getInFlight,
        status: getStatus,
        isLoading: JSswift.store?.computed
          ? JSswift.store.computed(() => getInFlight() > 0)
          : () => getInFlight() > 0,
        lastRequest: getLastRequest,
        lastResponse: getLastResponse,
        lastError: getLastError,
        lastDuration: getLastDuration,
        lastUpdated: getLastUpdated,
        reset() {
          setInFlight(0);
          setStatus("idle");
          setLastRequest(null);
          setLastResponse(null);
          setLastError(null);
          setLastDuration(0);
          setLastUpdated(Date.now());
        }
      };

      return { state, markStart, markEnd };
    }

    function joinURL(base, path) {
      if (!base) return path;
      if (/^https?:\/\//i.test(path)) return path;
      const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
      const normalizedPath = path.startsWith("/") ? path : "/" + path;
      return normalizedBase + normalizedPath;
    }

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function isRetryable(err, res) {
      if (err) return true;
      if (!res) return false;
      return res.status === 429 || (res.status >= 500 && res.status <= 599);
    }

    function makeAbort(timeoutMs, externalSignal) {
      if (!timeoutMs && !externalSignal) return { signal: undefined, cancel: () => { } };

      const controller = new AbortController();
      const signal = controller.signal;

      let timeoutId = null;
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
      }

      const onAbort = () => controller.abort(externalSignal.reason || new Error("aborted"));
      if (externalSignal) {
        if (externalSignal.aborted) onAbort();
        else externalSignal.addEventListener("abort", onAbort, { once: true });
      }

      const cancel = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (externalSignal) externalSignal.removeEventListener?.("abort", onAbort);
      };

      return { signal, cancel };
    }

    function normalizeRequest(configHTTP, input, init = {}) {
      const url = typeof input === "string" ? joinURL(configHTTP.baseURL, input) : input;
      const method = (init.method || "GET").toUpperCase();
      const headers = new Headers(configHTTP.headers);
      if (init.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));

      return {
        url,
        method,
        headers,
        body: init.body,
        credentials: init.credentials ?? configHTTP.credentials,
        signal: init.signal,
        timeout: init.timeout ?? configHTTP.timeout,
        retry: init.retry ?? configHTTP.retry,
        meta: init.meta || {}
      };
    }

    async function runHooks(set, ...args) {
      let current = args[0];
      for (const fn of set) {
        current = (await fn(current, ...args.slice(1))) ?? current;
      }
      return current;
    }

    function wrapResponse(res, req) {
      return {
        ok: res.ok,
        status: res.status,
        headers: res.headers,
        raw: res,
        req,

        async json() {
          let data = null;
          let error = null;
          try { data = await res.json(); } catch { data = null; }
          if (!res.ok) error = data ?? { status: res.status };
          return { data, error, ok: res.ok, status: res.status };
        },

        async jsonStrict() {
          const { data, error } = await this.json();
          if (error) {
            const e = new Error(`HTTP error ${res.status} ${req?.method || ""} ${req?.url || ""}`.trim());
            e.status = res.status;
            e.data = data;
            e.req = {
              url: req?.url,
              method: req?.method,
              meta: req?.meta
            };
            throw e;
          }
          return { data, ok: true, status: res.status };
        },

        async text() {
          let text = "";
          try { text = await res.text(); } catch { }
          return { text, ok: res.ok, status: res.status };
        },

        async textStrict() {
          const out = await this.text();
          if (!out.ok) {
            const e = new Error("HTTP error " + res.status);
            e.status = res.status;
            e.text = out.text;
            throw e;
          }
          return out;
        }
      };
    }

    function withJSON(request, method, url, body, init = {}) {
      const headers = new Headers(init.headers || {});
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      return request(url, {
        ...init,
        method,
        headers,
        body: body == null ? undefined : JSON.stringify(body)
      });
    }

    return {
      createReactiveState,
      joinURL,
      sleep,
      isRetryable,
      makeAbort,
      normalizeRequest,
      runHooks,
      wrapResponse,
      withJSON
    };
  })();
