  // ===============================
  // HTTP (fetch wrapper)
  // ===============================
  const {
    createReactiveState: createHttpReactiveState,
    sleep,
    isRetryable,
    makeAbort,
    normalizeRequest,
    runHooks,
    wrapResponse,
    withJSON
  } = JSswift._httpShared;
  const JSswiftHttpSetting =
    typeof globalThis !== "undefined" && globalThis.JSswift_setting
      ? globalThis.JSswift_setting
      : {};
  const configHTTP = {
    baseURL: JSswiftHttpSetting.http?.baseURL || "",
    timeout: JSswiftHttpSetting.http?.timeout ?? 0, // ms, 0 = no timeout
    retry: JSswiftHttpSetting.http?.retry || { attempts: 0, delay: 250, factor: 2 }, // attempts extra
    headers: JSswiftHttpSetting.http?.headers || {},
    credentials: JSswiftHttpSetting.http?.credentials, // "include" etc (optional)
    debug: JSswiftHttpSetting.debug ?? false
  };
  const httpState = createHttpReactiveState(JSswift);
  const now = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());

  const hooksHTTP = {
    beforeRequest: new Set(),  // (req) => req
    afterResponse: new Set(),  // (res, req) => res
    onError: new Set()         // (err, req) => void
  };

  async function coreFetch(req) {
    // Auth integration: se esiste auth.fetch usa quello
    const f = (JSswift.auth && typeof JSswift.auth.fetch === "function")
      ? JSswift.auth.fetch.bind(JSswift.auth)
      : fetch;
    const init = {
      method: req.method,
      headers: req.headers,
      body: req.body,
      credentials: req.credentials,
      signal: req.signal
    };
    return f(req.url, init);
  }

  async function request(input, init = {}) {
    let req = normalizeRequest(configHTTP, input, init);

    // hooksHTTP pre
    req = await runHooks(hooksHTTP.beforeRequest, req);
    const requestId = httpState.markStart(req);
    const startAt = now();

    const retryCfg = req.retry || { attempts: 0, delay: 250, factor: 2 };
    const maxAttempts = Math.max(0, Number(retryCfg.attempts || 0));
    let delay = Math.max(0, Number(retryCfg.delay || 0));
    const factor = Math.max(1, Number(retryCfg.factor || 2));

    let lastErr = null;
    let lastRes = null;
    let finalRes = null;
    let finalErr = null;

    try {
      for (let attempt = 0; attempt <= maxAttempts; attempt++) {
        lastErr = null;
        lastRes = null;

        const { signal, cancel } = makeAbort(req.timeout, init.signal);
        const effectiveReq = { ...req, signal };
        const attemptAt = now();

        try {
          if (configHTTP.debug) console.log("[http.request]", effectiveReq.method, effectiveReq.url);

          JSswift.perf?.inc("httpRequests");
          JSswift.perf?.mark("http:req", { url: req.url, method: req.method });


          const res = await coreFetch(effectiveReq);
          lastRes = res;

          // hooksHTTP post
          const outRes = await runHooks(hooksHTTP.afterResponse, res, effectiveReq);
          const dt = now() - attemptAt;

          JSswift.perf?.tick("http:res", dt, { status: res.status, url: req.url });

          // retryable status?
          if (attempt < maxAttempts && isRetryable(null, outRes)) {
            cancel();
            await sleep(delay);
            delay = Math.round(delay * factor);
            continue;
          }

          cancel();
          finalRes = outRes;
          return wrapResponse(outRes, effectiveReq);

        } catch (err) {
          lastErr = err;
          cancel();

          // hooksHTTP error
          for (const fn of hooksHTTP.onError) {
            try { fn(err, effectiveReq); } catch { }
          }

          // retry?
          if (attempt < maxAttempts && isRetryable(err, null)) {
            await sleep(delay);
            delay = Math.round(delay * factor);
            continue;
          }

          finalErr = err;
          throw err;
        }
      }
    } finally {
      const totalDt = now() - startAt;
      httpState.markEnd(requestId, finalRes, finalErr, totalDt);
    }

    // fallback (non dovrebbe arrivare qui)
    if (lastErr) throw lastErr;
    return wrapResponse(lastRes, req);
  }

  // shortcuts
  JSswift.http = {};
  JSswift.http.request = request;
  JSswift.http.state = () => httpState.state;
  JSswift.http.get = (url, init) => request(url, { ...init, method: "GET" });
  JSswift.http.del = (url, init) => request(url, { ...init, method: "DELETE" });
  JSswift.http.post = (url, body, init) => withJSON(request, "POST", url, body, init);
  JSswift.http.put = (url, body, init) => withJSON(request, "PUT", url, body, init);
  JSswift.http.patch = (url, body, init) => withJSON(request, "PATCH", url, body, init);

  JSswift.http.getJSON = async (url, init) => (await request(url, { ...init, method: "GET" })).jsonStrict();
  JSswift.http.delJSON = async (url, init) => (await request(url, { ...init, method: "DELETE" })).jsonStrict();
  JSswift.http.postJSON = async (url, body, init) => (await withJSON(request, "POST", url, body, init)).jsonStrict();
  JSswift.http.putJSON = async (url, body, init) => (await withJSON(request, "PUT", url, body, init)).jsonStrict();
  JSswift.http.patchJSON = async (url, body, init) => (await withJSON(request, "PATCH", url, body, init)).jsonStrict();

  JSswift.http.onBefore = function (fn) { hooksHTTP.beforeRequest.add(fn); return () => hooksHTTP.beforeRequest.delete(fn); };
  JSswift.http.onAfter = function (fn) { hooksHTTP.afterResponse.add(fn); return () => hooksHTTP.afterResponse.delete(fn); };
  JSswift.http.onError = function (fn) { hooksHTTP.onError.add(fn); return () => hooksHTTP.onError.delete(fn); };

  // shortcuts per browser global
  window._http = JSswift.http;
  // ===============================
