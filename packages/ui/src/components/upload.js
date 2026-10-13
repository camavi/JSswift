

  UI.Upload = (props = {}) => {
    const inputTone = props;
    props = { ...props };
    props.color = uiComputed([props.state, props.status, props.color], () =>
      uiUnwrap(inputTone.state) || uiUnwrap(inputTone.status) || uiUnwrap(inputTone.color) || "");
    applyCommonProps(props);
    const slots = props.slots || {};
    const [getFiles, setFiles] = JSswift.reactive.signal([]);
    const [getDragging, setDragging] = JSswift.reactive.signal(false);
    const [getBusy, setBusy] = JSswift.reactive.signal(false);
    const [getError, setError] = JSswift.reactive.signal(null);
    let seq = 0;
    let disposed = false;
    let selectionVersion = 0;

    const isDisabled = () => !!uiUnwrap(props.disabled) || !!uiUnwrap(props.readonly);
    const isMultiple = () => props.multiple !== false && props.single !== true;
    const isFormSubmitMode = () => ["form", "native", "submit", "external"].includes(String(uiUnwrap(props.submitMode ?? props.modeSubmit ?? props.uploadMode) || "").toLowerCase());
    const showBrowse = () => uiUnwrap(props.showBrowse ?? props.browseButton) !== false;
    const showUpload = () => !isFormSubmitMode() && uiUnwrap(props.showUpload ?? props.uploadButton) !== false;
    const showClear = () => uiUnwrap(props.showClear ?? props.clearButton) !== false;
    const showFiles = () => uiUnwrap(props.showFiles ?? props.files) !== false;
    const getStatusClass = () => {
      return "";
    };
    const getFieldName = () => props.fieldName || props.paramName || props.name || "file";
    const getParallel = () => Math.max(1, Number(uiUnwrap(props.parallelUploads ?? props.parallel) || 1));
    const getRetry = () => {
      const retry = uiUnwrap(props.retry);
      if (retry === true) return { attempts: 2, delay: 350, factor: 2 };
      if (!retry) return { attempts: 0, delay: 350, factor: 2 };
      return {
        attempts: Math.max(0, Number(retry.attempts ?? retry.retries ?? 0)),
        delay: Math.max(0, Number(retry.delay ?? 350)),
        factor: Math.max(1, Number(retry.factor ?? 2))
      };
    };
    const toList = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      return Array.from(value);
    };
    const formatBytes = (size) => {
      const n = Number(size || 0);
      if (n < 1024) return `${n} B`;
      if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
      if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
      return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
    };
    const getAccepted = () => String(uiUnwrap(props.acceptedFiles ?? props.accept) || "").trim();
    const acceptMatches = (file) => {
      const accept = getAccepted();
      if (!accept) return true;
      const name = String(file.name || "").toLowerCase();
      const type = String(file.type || "").toLowerCase();
      return accept.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean).some((rule) => {
        if (rule.startsWith(".")) return name.endsWith(rule);
        if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
        return type === rule;
      });
    };
    const activeFiles = () => getFiles().filter((item) => item.status !== "rejected" && item.status !== "removed");
    const totalSize = (extra = 0) => activeFiles().reduce((sum, item) => sum + Number(item.size || 0), extra);
    const refresh = () => {
      setFiles(getFiles().slice());
      root.classList.toggle("is-busy", getFiles().some((item) => item.status === "uploading"));
      root.classList.toggle("has-files", getFiles().some((item) => item.status !== "removed"));
      props.onChange?.(getFiles().slice(), api);
    };
    const rejectFile = (file, reason, detail = null) => {
      const item = {
        id: `upload_${Date.now()}_${++seq}`,
        file,
        name: file?.name || "file",
        size: Number(file?.size || 0),
        type: file?.type || "",
        status: "rejected",
        progress: 0,
        error: reason,
        detail,
        attempts: 0,
        response: null,
        xhr: null
      };
      getFiles().push(item);
      props.onRejected?.(item, { reason, detail, api });
      return item;
    };
    const validateFile = async (file, nextCount) => {
      const maxFiles = props.maxFiles == null ? null : Number(uiUnwrap(props.maxFiles));
      const maxFileSize = props.maxFileSize == null ? null : Number(uiUnwrap(props.maxFileSize));
      const minFileSize = props.minFileSize == null ? null : Number(uiUnwrap(props.minFileSize));
      const maxTotalSize = props.maxTotalSize == null ? null : Number(uiUnwrap(props.maxTotalSize));
      if (maxFiles != null && nextCount > maxFiles) return "max-files";
      if (maxFileSize != null && Number(file.size || 0) > maxFileSize) return "max-file-size";
      if (minFileSize != null && Number(file.size || 0) < minFileSize) return "min-file-size";
      if (maxTotalSize != null && totalSize(Number(file.size || 0)) > maxTotalSize) return "max-total-size";
      if (!acceptMatches(file)) return "accept";
      const validator = props.filter || props.acceptFile || props.validate;
      if (typeof validator === "function") {
        const out = await validator(file, { files: getFiles().slice(), api });
        if (out === false) return "filter";
        if (typeof out === "string") return out;
      }
      return null;
    };
    const reconcileRejected = async () => {
      for (const item of getFiles()) {
        if (item.status !== "rejected" || item.error !== "max-files") continue;
        const reason = await validateFile(item.file, activeFiles().length + 1);
        if (reason) {
          item.error = reason;
          continue;
        }
        item.status = "queued";
        item.progress = 0;
        item.error = null;
        item.detail = null;
      }
    };
    const createItem = (file) => ({
      id: `upload_${Date.now()}_${++seq}`,
      file,
      name: file?.name || "file",
      size: Number(file?.size || 0),
      type: file?.type || "",
      status: "queued",
      progress: 0,
      bytesUploaded: 0,
      error: null,
      detail: null,
      attempts: 0,
      response: null,
      xhr: null
    });
    const addFiles = async (inputFiles, meta = {}) => {
      if (disposed || isDisabled()) return [];
      setError(null);
      const incoming = toList(inputFiles);
      const added = [];
      if (!isMultiple() && incoming.length) {
        clear({ silent: true });
      }
      const version = selectionVersion;
      for (const file of incoming) {
        const reason = await validateFile(file, activeFiles().length + 1);
        if (disposed || isDisabled() || version !== selectionVersion) return [];
        if (reason) {
          rejectFile(file, reason);
          continue;
        }
        const item = createItem(file);
        getFiles().push(item);
        added.push(item);
        props.onAdded?.(item, { file, meta, api });
        if (!isMultiple()) break;
      }
      refresh();
      if (added.length && props.autoUpload && !isFormSubmitMode()) upload();
      return added;
    };
    const clear = (opts = {}) => {
      selectionVersion++;
      for (const item of getFiles()) {
        if (item.status === "uploading") abort(item);
        item.status = "removed";
      }
      setFiles([]);
      setError(null);
      refresh();
      if (!opts.silent) props.onClear?.(api);
    };
    const remove = async (itemOrId) => {
      const item = typeof itemOrId === "string" ? getFiles().find((entry) => entry.id === itemOrId) : itemOrId;
      if (!item) return;
      if (item.status === "uploading") abort(item);
      const next = getFiles().filter((entry) => entry !== item);
      setFiles(next);
      await reconcileRejected();
      refresh();
      props.onRemove?.(item, { api });
    };
    const abort = (itemOrId) => {
      const item = typeof itemOrId === "string" ? getFiles().find((entry) => entry.id === itemOrId) : itemOrId;
      if (!item || item.status !== "uploading") return;
      item.status = "canceled";
      item.error = "canceled";
      item.xhr?.abort?.();
      props.onCancel?.(item, { api });
      refresh();
    };
    const abortAll = () => getFiles().filter((item) => item.status === "uploading").forEach(abort);
    const resolveUploadOptions = async (item) => {
      const base = {
        url: uiUnwrap(props.url),
        method: uiUnwrap(props.method || "POST"),
        headers: props.headers,
        formFields: props.formFields || props.fields,
        fieldName: getFieldName(),
        withCredentials: !!uiUnwrap(props.withCredentials ?? props.credentials),
        sendRaw: !!uiUnwrap(props.sendRaw)
      };
      if (typeof props.factory === "function") {
        try {
          const out = await props.factory(item.file, { item, files: getFiles().slice(), api });
          if (out && typeof out === "object") Object.assign(base, out);
          else if (out != null) throw new Error("factory must return an object");
        } catch (error) {
          props.onFactoryFailed?.(error, { item, api });
          throw error;
        }
      }
      return base;
    };
    const applyHeaders = (xhr, headers, item) => {
      const resolved = typeof headers === "function" ? headers(item.file, { item, api }) : headers;
      if (!resolved) return;
      if (resolved instanceof Headers) {
        resolved.forEach((value, key) => xhr.setRequestHeader(key, value));
      } else if (Array.isArray(resolved)) {
        resolved.forEach((entry) => {
          if (Array.isArray(entry)) xhr.setRequestHeader(entry[0], entry[1]);
          else if (entry?.name) xhr.setRequestHeader(entry.name, entry.value);
        });
      } else if (typeof resolved === "object") {
        Object.keys(resolved).forEach((key) => xhr.setRequestHeader(key, resolved[key]));
      }
    };
    const appendFields = (form, fields, item) => {
      const resolved = typeof fields === "function" ? fields(item.file, { item, api }) : fields;
      if (!resolved) return;
      if (Array.isArray(resolved)) {
        resolved.forEach((entry) => {
          if (Array.isArray(entry)) form.append(entry[0], entry[1]);
          else if (entry?.name) form.append(entry.name, entry.value);
        });
      } else if (typeof resolved === "object") {
        Object.keys(resolved).forEach((key) => form.append(key, resolved[key]));
      }
    };
    const uploadViaXhr = (item, options) => new Promise((resolve, reject) => {
      if (!options.url) {
        reject(new Error("UI.Upload: url is required"));
        return;
      }
      if (typeof XMLHttpRequest !== "function") {
        reject(new Error("UI.Upload: XMLHttpRequest is not available"));
        return;
      }
      const xhr = new XMLHttpRequest();
      item.xhr = xhr;
      xhr.open(String(options.method || "POST").toUpperCase(), options.url, true);
      xhr.withCredentials = !!options.withCredentials;
      applyHeaders(xhr, options.headers, item);
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        item.bytesUploaded = event.loaded;
        item.progress = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
        props.onProgress?.(item, { event, api });
        refresh();
      };
      xhr.onload = () => {
        const ok = xhr.status >= 200 && xhr.status < 300;
        const response = { status: xhr.status, text: xhr.responseText, xhr };
        ok ? resolve(response) : reject(Object.assign(new Error(`HTTP error ${xhr.status}`), { response }));
      };
      xhr.onerror = () => reject(new Error("network-error"));
      xhr.onabort = () => reject(new Error("canceled"));
      const body = options.sendRaw ? item.file : (() => {
        const form = new FormData();
        appendFields(form, options.formFields, item);
        form.append(options.fieldName || "file", item.file, item.name);
        return form;
      })();
      xhr.send(body);
    });
    const runUpload = async (item) => {
      const retry = getRetry();
      let delay = retry.delay;
      item.status = "uploading";
      item.error = null;
      item.progress = Math.max(0, item.progress || 0);
      props.onStart?.(item, { api });
      refresh();
      for (let attempt = 0; attempt <= retry.attempts; attempt++) {
        item.attempts = attempt + 1;
        try {
          const options = await resolveUploadOptions(item);
          const response = typeof props.upload === "function" || typeof props.uploader === "function"
            ? await (props.upload || props.uploader)(item.file, { item, options, progress: (value) => {
              item.progress = Math.max(0, Math.min(100, Number(value) || 0));
              props.onProgress?.(item, { api });
              refresh();
            }, api })
            : await uploadViaXhr(item, options);
          item.status = "done";
          item.progress = 100;
          item.response = response;
          item.xhr = null;
          props.onSuccess?.(item, { response, api });
          props.onComplete?.(item, { response, api });
          refresh();
          return item;
        } catch (error) {
          if (String(error?.message || error) === "canceled" || item.status === "canceled") {
            item.status = "canceled";
            item.error = "canceled";
            item.xhr = null;
            props.onComplete?.(item, { error, api });
            refresh();
            return item;
          }
          if (attempt < retry.attempts) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.round(delay * retry.factor);
            continue;
          }
          item.status = "error";
          item.error = error;
          item.xhr = null;
          setError(error);
          props.onError?.(item, { error, api });
          props.onComplete?.(item, { error, api });
          refresh();
          return item;
        }
      }
      return item;
    };
    const processQueue = () => {
      if (disposed || isDisabled()) return;
      const uploading = getFiles().filter((item) => item.status === "uploading").length;
      const openSlots = Math.max(0, getParallel() - uploading);
      const queued = getFiles().filter((item) => item.status === "queued").slice(0, openSlots);
      if (!queued.length) {
        const busyNow = getFiles().some((item) => item.status === "uploading");
        setBusy(busyNow);
        if (!busyNow) props.onFinish?.(getFiles().slice(), { api });
        return;
      }
      setBusy(true);
      queued.forEach((item) => {
        runUpload(item).finally(() => processQueue());
      });
    };
    const upload = (items = null) => {
      const targets = items ? toList(items) : getFiles().filter((item) => ["queued", "error", "canceled"].includes(item.status));
      targets.forEach((entry) => {
        const item = typeof entry === "string" ? getFiles().find((candidate) => candidate.id === entry) : entry;
        if (item && item.status !== "uploading" && item.status !== "done" && item.status !== "rejected") {
          item.status = "queued";
          item.progress = 0;
          item.error = null;
        }
      });
      refresh();
      processQueue();
    };
    const retryUpload = (itemOrId) => upload([itemOrId]);
    const browse = () => {
      if (isDisabled()) return;
      input.click();
    };

    const input = _.input({
      type: "file",
      class: "jss-upload-input",
      name: getFieldName(),
      accept: getAccepted() || null,
      multiple: isMultiple(),
      capture: props.capture || null,
      disabled: isDisabled(),
      onChange: (event) => {
        addFiles(event.target.files, { event, source: "browse" });
        event.target.value = "";
      }
    });
    const listEl = _.div({ class: "jss-upload-list" });
    const summaryEl = _.div({ class: "jss-upload-summary" });
    const actionsEl = _.div({ class: "jss-upload-actions" });
    let currentStatusClass = getStatusClass();
    const root = _.div({
      class: uiClass([
        "jss-clear-set",
        "jss-card",
        "jss-upload",
        uiWhen(props.dense, "jss-card-dense"),
        "jss-singularity",
        currentStatusClass,
        uiWhen(props.box || props.variant === "box", "jss-upload-box"),
        uiWhen(props.compact, "is-compact"),
        uiWhen(isFormSubmitMode(), "is-form-mode"),
        uiWhen(!showFiles(), "is-files-hidden"),
        props.class
      ]),
      tabindex: isDisabled() ? "-1" : "0",
      role: "group",
      style: props.style,
      "aria-disabled": isDisabled() ? "true" : "false"
    });
    const api = {
      addFiles,
      browse,
      upload,
      retry: retryUpload,
      retryAll: () => upload(getFiles().filter((item) => item.status === "error" || item.status === "canceled")),
      remove,
      clear,
      abort,
      abortAll,
      files: () => getFiles().slice(),
      state: () => ({
        files: getFiles().slice(),
        busy: getBusy(),
        dragging: getDragging(),
        error: getError()
      }),
      reset: clear
    };
    const renderActions = () => {
      const ctx = { api, files: getFiles().slice(), busy: getBusy(), disabled: isDisabled(), submitMode: isFormSubmitMode() ? "form" : "upload" };
      const actionNodes = [];
      if (showBrowse()) {
        actionNodes.push(JSswift.ui.renderSlot(slots, "browse", ctx, UI.Button({ size: "sm", color: "primary", disabled: isDisabled(), icon: "folder_open", label: props.browseText || "Browse", onClick: browse })));
      }
      if (showUpload()) {
        actionNodes.push(JSswift.ui.renderSlot(slots, "upload", ctx, UI.Button({ size: "sm", color: "primary", icon: "upload", label: props.uploadText || "Upload", loading: getBusy(), disabled: isDisabled() || !getFiles().some((item) => ["queued", "error", "canceled"].includes(item.status)), onClick: () => upload() })));
      }
      if (showClear()) {
        actionNodes.push(JSswift.ui.renderSlot(slots, "clear", ctx, UI.Button({ size: "sm", class: "jss-upload-clear", outline: true, icon: "delete", label: props.clearText || "Clear", disabled: isDisabled() || !getFiles().length, onClick: () => clear() })));
      }
      return renderSlotToArray(slots, "actions", ctx, actionNodes);
    };
    const renderFile = (item, index) => {
      const ctx = {
        item,
        file: item.file,
        index,
        api,
        remove: () => remove(item),
        retry: () => retryUpload(item),
        abort: () => abort(item)
      };
      const fallback = _.div({ class: uiClass(["jss-upload-file", `is-${item.status}`]) },
        _.div({ class: "jss-upload-file-icon" }, UI.Icon({ name: item.status === "done" ? "check_circle" : item.status === "error" || item.status === "rejected" ? "error" : "description" })),
        _.div({ class: "jss-upload-file-main" },
          _.div({ class: "jss-upload-file-name" }, ...renderSlotToArray(slots, "fileName", ctx, item.name)),
          _.div({ class: "jss-upload-file-meta" },
            ...renderSlotToArray(slots, "fileMeta", ctx, item.error ? String(item.error?.message || item.error) : (item.status === "queued" ? "Queued" : item.status))
          ),
          _.div({ class: "jss-upload-progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(item.progress || 0) },
            _.div({ class: "jss-upload-progress-bar", style: { width: `${item.progress || 0}%` } })
          )
        ),
        _.div({ class: "jss-upload-file-trailing" },
          _.div({ class: "jss-upload-file-size" }, formatBytes(item.size)),
          _.div({ class: "jss-upload-file-actions" },
            ...renderSlotToArray(slots, "fileActions", ctx, [
              item.status === "uploading" ? UI.Button({ size: "sm", outline: true, icon: "close", "aria-label": "Cancel", onClick: () => abort(item) }) : null,
              item.status === "error" || item.status === "canceled" ? UI.Button({ size: "sm", outline: true, icon: "refresh", "aria-label": "Retry", onClick: () => retryUpload(item) }) : null,
              UI.Button({ size: "sm", dense: true, outline: true, icon: "delete", "aria-label": "Remove", onClick: () => remove(item) })
            ])
          )
        )
      );
      const custom = JSswift.ui.renderSlot(slots, "file", ctx, fallback);
      return _.div({ class: "jss-upload-file-wrap", "data-status": item.status, "data-id": item.id }, ...renderSlotToArray(null, "default", {}, custom));
    };
    const render = () => {
      const files = getFiles();
      actionsEl.replaceChildren(...renderActions());
      listEl.replaceChildren();
      summaryEl.hidden = !showFiles();
      listEl.hidden = !showFiles();
      if (!files.length) {
        const empty = JSswift.ui.renderSlot(slots, "empty", { api }, props.emptyText || "No files selected");
        listEl.appendChild(_.div({ class: "jss-upload-empty" }, ...renderSlotToArray(null, "default", {}, empty)));
      } else {
        files.forEach((item, index) => listEl.appendChild(renderFile(item, index)));
      }
      const summaryFiles = files.filter((item) => item.status !== "rejected" && item.status !== "removed");
      summaryEl.textContent = `${summaryFiles.length} file • ${formatBytes(summaryFiles.reduce((sum, item) => sum + Number(item.size || 0), 0))}`;
    };
    const iconNode = JSswift.ui.renderSlot(slots, "icon", { api }, UI.Icon({ name: props.icon || "cloud_upload" }));
    const titleNode = JSswift.ui.renderSlot(slots, "title", { api }, props.title || "Upload files");
    const subtitleNode = JSswift.ui.renderSlot(slots, "subtitle", { api }, props.subtitle || (getAccepted() ? `Accepted: ${getAccepted()}` : "Drag files here or browse from your device"));
    const dropzone = _.div({
      class: "jss-upload-dropzone",
      onClick: (event) => {
        if (event.target?.closest?.(".jss-upload-actions, .jss-upload-list")) return;
        if (props.clickable !== false) browse();
      },
      onDragenter: (event) => {
        if (props.drag === false || isDisabled()) return;
        event.preventDefault();
        setDragging(true);
        root.classList.add("is-dragging");
      },
      onDragover: (event) => {
        if (props.drag === false || isDisabled()) return;
        event.preventDefault();
      },
      onDragleave: (event) => {
        if (event.currentTarget !== event.target) return;
        setDragging(false);
        root.classList.remove("is-dragging");
      },
      onDrop: (event) => {
        if (props.drag === false || isDisabled()) return;
        event.preventDefault();
        setDragging(false);
        root.classList.remove("is-dragging");
        props.onDrop?.(event, { api });
        addFiles(event.dataTransfer?.files || [], { event, source: "drop" });
      }
    },
      _.div({ class: "jss-upload-head" },
        _.div({ class: "jss-upload-icon" }, ...renderSlotToArray(null, "default", {}, iconNode)),
        _.div({ class: "jss-upload-copy" },
          _.div({ class: "jss-upload-title" }, ...renderSlotToArray(null, "default", {}, titleNode)),
          _.div({ class: "jss-upload-subtitle" }, ...renderSlotToArray(null, "default", {}, subtitleNode))
        ),
        actionsEl
      ),
      summaryEl,
      listEl
    );
    const header = JSswift.ui.renderSlot(slots, "header", { api }, null);
    renderSlotToArray(null, "default", {}, header).forEach((node) => root.appendChild(node));
    root.appendChild(input);
    renderSlotToArray(slots, "default", { api, dropzone }, dropzone).forEach((node) => root.appendChild(node));
    const stopRender = JSswift.reactive.effect(() => { render(); }, "UI.Upload:render");
    const stopState = JSswift.reactive.effect(() => {
      root.classList.toggle("is-disabled", isDisabled());
      root.classList.toggle("is-form-mode", isFormSubmitMode());
      root.classList.toggle("is-files-hidden", !showFiles());
      const nextStatusClass = getStatusClass();
      if (nextStatusClass !== currentStatusClass) {
        if (currentStatusClass) root.classList.remove(currentStatusClass);
        if (nextStatusClass) root.classList.add(nextStatusClass);
        currentStatusClass = nextStatusClass;
      }
      root.setAttribute("aria-disabled", isDisabled() ? "true" : "false");
      root.tabIndex = isDisabled() ? -1 : 0;
      input.disabled = isDisabled();
      input.multiple = isMultiple();
      input.name = getFieldName();
    }, "UI.Upload:disabled");
    root._upload = api;
    root._addFiles = addFiles;
    root._browse = browse;
    root._uploadFiles = upload;
    root._input = input;
    root._dispose = () => {
      if (disposed) return;
      disposed = true;
      selectionVersion++;
      stopRender();
      stopState();
      abortAll();
    };
    JSswift._registerCleanup?.(root, root._dispose);
    setPropertyProps(root, props);
    return root;
  };
  UI.BoxUpload = (props = {}) => UI.Upload({ ...props, box: true });
  UI.boxUpload = (props = {}) => UI.BoxUpload(props);
  JSswift.ui.Upload = UI.Upload;
  JSswift.ui.BoxUpload = UI.BoxUpload;
  JSswift.ui.boxUpload = UI.boxUpload;
