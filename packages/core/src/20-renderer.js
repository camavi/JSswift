/* ===============================
   _h hyperscript (usa JSswift.reactive.effect)
   =============================== */

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "line",
  "rect",
  "polygon",
  "polyline",
  "text",
  "tspan",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "use",
  "symbol",
  "clipPath",
  "mask",
  "pattern",
  "filter",
  "feGaussianBlur",
  "feOffset",
  "feBlend",
  "feColorMatrix"
]);

function isContentProp(key) {
  return key === "innerHTML" || key === "innerText" || key === "textContent" || key === "value";
}

function createElement(tag, ...args) {
  const isSVG = SVG_TAGS.has(tag);
  const el = tag === "text" && !isSVG
    ? document.createTextNode("")
    : isSVG
      ? document.createElementNS(SVG_NS, tag)
      : document.createElement(tag);

  const isRod = (v) => !!v && v.type === "rod";
  const interpolationCursor = createRodInterpolationCursor();
  const childHelpers = createRendererChildHelpers(el, { isRod, interpolationCursor });
  const {
    appendRodText,
    appendInterpolatedText,
    appendDynamicChild,
    appendChildValue
  } = childHelpers;
  const domBridge = createDomPropBridge(el, { isSVG, normalizeClass, isContentProp });
  const {
    isBooleanDomProp,
    isBindingValueKey,
    applyBindingValue,
    setStyleEntry,
    setProp,
    setClassValue
  } = domBridge;

  function registerNodeEffect(run) {
    const stop = JSswift.reactive.effect(run);
    JSswift._registerCleanup(el, stop);
    return stop;
  }

  function isNumericValueControl(control) {
    if (String(control?.tagName || "").toLowerCase() !== "input") return false;
    const inputType = String(control?.type || "").toLowerCase();
    return inputType === "range" || inputType === "number";
  }

  function getValueControlType(control) {
    if (String(control?.tagName || "").toLowerCase() !== "input") return "";
    return String(control?.type || "").toLowerCase();
  }

  function isSingleSelectControl(control) {
    return String(control?.tagName || "").toLowerCase() === "select" && !control.multiple;
  }

  function isFileInputControl(control) {
    return String(control?.tagName || "").toLowerCase() === "input"
      && String(control?.type || "").toLowerCase() === "file";
  }

  function bindRodValueControl(control, rodValue, eventName) {
    registerNodeEffect(() => {
      const next = rodValue.value ?? "";
      if (control.value !== String(next)) setProp("value", next);
    });

    const onValueChange = () => {
      let next = control.value;
      const controlType = getValueControlType(control);
      const isNumericRod = typeof rodValue.value === "number" || rodValue.value == null;
      if (isSingleSelectControl(control) && control.value === "") {
        next = null;
      } else if (isNumericValueControl(control) && isNumericRod) {
        if (controlType === "number" && control.value === "") {
          next = null;
        } else {
          const numeric = typeof control.valueAsNumber === "number" && !Number.isNaN(control.valueAsNumber)
            ? control.valueAsNumber
            : Number(control.value);
          next = Number.isNaN(numeric) ? (controlType === "number" ? null : 0) : numeric;
        }
      }
      if (rodValue.value !== next) rodValue.value = next;
    };

    control.addEventListener(eventName, onValueChange);
    JSswift._registerCleanup(control, () => {
      control.removeEventListener(eventName, onValueChange);
    });
  }

  function bindRodCheckedControl(control, rodValue) {
    registerNodeEffect(() => {
      const next = !!rodValue.value;
      if (!!control.checked !== next) setProp("checked", next);
    });

    const onCheckedChange = () => {
      const next = !!control.checked;
      if (rodValue.value !== next) rodValue.value = next;
    };

    control.addEventListener("change", onCheckedChange);
    JSswift._registerCleanup(control, () => {
      control.removeEventListener("change", onCheckedChange);
    });
  }

  function bindRodRadioControl(control, rodValue) {
    const readOwnValue = () => String(control.value ?? "on");

    registerNodeEffect(() => {
      const next = rodValue.value == null ? null : String(rodValue.value);
      const shouldCheck = next === readOwnValue();
      if (!!control.checked !== shouldCheck) setProp("checked", shouldCheck);
    });

    const onCheckedChange = () => {
      if (!control.checked) return;
      const next = readOwnValue();
      if (rodValue.value !== next) rodValue.value = next;
    };

    control.addEventListener("change", onCheckedChange);
    JSswift._registerCleanup(control, () => {
      control.removeEventListener("change", onCheckedChange);
    });
  }

  function bindRodFilesControl(control, rodValue) {
    const readFiles = () => {
      const files = control.files;
      if (files == null) return [];
      if (Array.isArray(files)) return files.slice();
      if (typeof files.length === "number") return Array.from(files);
      return [files];
    };

    registerNodeEffect(() => {
      const next = rodValue.value;
      const shouldClear = next == null || (Array.isArray(next) && next.length === 0);
      if (!shouldClear) return;
      if (control.value !== "") setProp("value", "");
      if (Array.isArray(control.files)) control.files = [];
    });

    const onFilesChange = () => {
      const next = readFiles();
      rodValue.value = next;
    };

    control.addEventListener("change", onFilesChange);
    JSswift._registerCleanup(control, () => {
      control.removeEventListener("change", onFilesChange);
    });
  }

  function bindRodSelectMultiple(control, rodValue) {
    const readValues = () => Array.from(control.childNodes || [])
      .filter((node) => node?.tagName === "OPTION" && node.selected)
      .map((node) => String(node.value ?? ""));

    const applyFromRod = () => {
      const nextValues = Array.isArray(rodValue.value)
        ? rodValue.value.map((item) => String(item))
        : [];
      const nextSet = new Set(nextValues);
      Array.from(control.childNodes || []).forEach((node) => {
        if (node?.tagName !== "OPTION") return;
        const shouldSelect = nextSet.has(String(node.value ?? ""));
        if (!!node.selected === shouldSelect) return;
        node.selected = shouldSelect;
        if (shouldSelect) node.setAttribute("selected", "");
        else node.removeAttribute("selected");
      });
    };

    registerNodeEffect(applyFromRod);
    control._cmsApplySelectedValues = applyFromRod;
    queueMicrotask(applyFromRod);

    const onValueChange = () => {
      const next = readValues();
      const current = Array.isArray(rodValue.value) ? rodValue.value.map((item) => String(item)) : [];
      if (current.length === next.length && current.every((item, index) => item === next[index])) return;
      rodValue.value = next;
    };

    control.addEventListener("change", onValueChange);
    JSswift._registerCleanup(control, () => {
      control.removeEventListener("change", onValueChange);
    });
  }

  function bindRodOptionSelected(optionEl, rodValue) {
    registerNodeEffect(() => {
      const next = !!rodValue.value;
      if (!!optionEl.selected !== next) setProp("selected", next);
    });

    let parentSelect = null;
    const onParentChange = () => {
      const next = !!optionEl.selected;
      if (rodValue.value !== next) rodValue.value = next;
    };

    const attachParent = () => {
      if (parentSelect || optionEl.parentNode?.tagName !== "SELECT") return;
      parentSelect = optionEl.parentNode;
      parentSelect.addEventListener("change", onParentChange);
    };

    queueMicrotask(attachParent);
    JSswift._registerCleanup(optionEl, () => {
      parentSelect?.removeEventListener("change", onParentChange);
    });
  }

  function bindProp(key, value) {
    if (isEventProp(key)) {
      bindEventProp(el, key, value, isRod);
      return;
    }
    if (key === "class") {
      if (hasDynamicClassValue(value)) {
        registerNodeEffect(() => {
          setClassValue(normalizeClass(value));
        });
        return;
      }
      setClassValue(normalizeClass(value));
      return;
    }
    if (key === "style" && value && typeof value === "object") {
      const styleApplier = createStyleObjectApplier(setStyleEntry);
      if (hasDynamicStyleValue(value, isRod)) {
        registerNodeEffect(() => {
          styleApplier.apply(value, isRod);
        });
        return;
      }
      styleApplier.apply(value, isRod);
      return;
    }
    if (key === "style" && (typeof value === "function" || isRod(value))) {
      const styleApplier = createStyleObjectApplier(setStyleEntry);
      registerNodeEffect(() => {
        styleApplier.apply(value, isRod);
      });
      return;
    }
    if (isBindingValueKey(key) && typeof value === "function") {
      registerNodeEffect(() => {
        applyBindingValue(key, value());
      });
      return;
    }
    if (isBindingValueKey(key) && !isRod(value)) {
      applyBindingValue(key, value);
      return;
    }
    if (typeof value === "function") {
      registerNodeEffect(() => {
        setProp(key, value());
      });
      return;
    }
    if (key === "value" && isRod(value) && (tag === "input" || tag === "textarea" || tag === "select")) {
      if (tag === "select" && !!el.multiple) {
        bindRodSelectMultiple(el, value);
        return;
      }
      bindRodValueControl(el, value, tag === "select" ? "change" : "input");
      return;
    }
    if (key === "checked" && isRod(value) && tag === "input") {
      if (String(el.type || "").toLowerCase() === "radio") {
        bindRodRadioControl(el, value);
        return;
      }
      bindRodCheckedControl(el, value);
      return;
    }
    if (key === "files" && isRod(value) && isFileInputControl(el)) {
      bindRodFilesControl(el, value);
      return;
    }
    if (key === "selected" && isRod(value) && tag === "option") {
      bindRodOptionSelected(el, value);
      return;
    }
    if (isContentProp(key) && isRod(value)) {
      registerNodeEffect(() => {
        setProp(key, value.value);
      });
      return;
    }
    if (isRod(value)) {
      const unbind = JSswift.rodBind(el, value, { key });
      JSswift._registerCleanup(el, unbind);
      return;
    }
    setProp(key, value);
  }

  applyRendererArgs(args, {
    el,
    isRod,
    interpolationCursor,
    appendChildValue,
    appendRodText,
    appendInterpolatedText,
    appendDynamicChild,
    bindProp
  });

  if (tag === "select" && typeof el._cmsApplySelectedValues === "function") {
    el._cmsApplySelectedValues();
  }

  return el;
}

const _h = {};
const DOM_ELEMENTS = [

  // ─────────────────────────────
  // Document & Metadata
  // ─────────────────────────────
  "html",
  "head",
  "title",
  "base",
  "link",
  "meta",
  "style",

  // ─────────────────────────────
  // Sectioning
  // ─────────────────────────────
  "body",
  "header",
  "footer",
  "main",
  "section",
  "article",
  "aside",
  "nav",

  // ─────────────────────────────
  // Headings
  // ─────────────────────────────
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",

  // ─────────────────────────────
  // Text content
  // ─────────────────────────────
  "p",
  "div",
  "span",
  "pre",
  "blockquote",
  "hr",
  "br",
  "address",

  // ─────────────────────────────
  // Inline text semantics
  // ─────────────────────────────
  "a",
  "abbr",
  "b",
  "bdi",
  "bdo",
  "cite",
  "code",
  "data",
  "dfn",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "small",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",

  // ─────────────────────────────
  // Lists
  // ─────────────────────────────
  "ul",
  "ol",
  "li",
  "dl",
  "dt",
  "dd",

  // ─────────────────────────────
  // Tables
  // ─────────────────────────────
  "table",
  "caption",
  "colgroup",
  "col",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",

  // ─────────────────────────────
  // Forms
  // ─────────────────────────────
  "form",
  "label",
  "input",
  "textarea",
  "button",
  "select",
  "option",
  "optgroup",
  "fieldset",
  "legend",
  "datalist",
  "output",
  "progress",
  "meter",

  // ─────────────────────────────
  // Embedded content
  // ─────────────────────────────
  "img",
  "picture",
  "source",
  "iframe",
  "embed",
  "object",
  "param",

  // ─────────────────────────────
  // Media
  // ─────────────────────────────
  "audio",
  "video",
  "track",

  // ─────────────────────────────
  // Interactive
  // ─────────────────────────────
  "details",
  "summary",
  "dialog",

  // ─────────────────────────────
  // Scripting
  // ─────────────────────────────
  "script",
  "noscript",
  "canvas",
  "template",
  "slot",

  // ─────────────────────────────
  // SVG (principali)
  // ─────────────────────────────
  "svg",
  "g",
  "path",
  "circle",
  "ellipse",
  "line",
  "rect",
  "polygon",
  "polyline",
  "text",
  "tspan",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "use",
  "symbol",
  "clipPath",
  "mask",
  "pattern",
  "filter",
  "feGaussianBlur",
  "feOffset",
  "feBlend",
  "feColorMatrix"
];
DOM_ELEMENTS.forEach(tag => {
  window._[tag] = (...args) => createElement(tag, ...args);
});
_.DOM_ELEMENTS = DOM_ELEMENTS;

_.fragment = (...children) => children;
_.dynamic = function (renderFn) {
  const anchor = document.createComment("dyn");
  const parent = document.createDocumentFragment();
  parent.appendChild(anchor);

  let current = null;

  JSswift.reactive.effect(() => {
    const next = renderFn();

    // rimuovi current
    if (current && current.parentNode) current.parentNode.removeChild(current);
    current = null;

    if (next == null) return;

    // normalizza: node o string
    let node = next;
    if (typeof next === "string" || typeof next === "number") {
      node = document.createTextNode(String(next));
    }

    // inserisci dopo anchor
    const p = anchor.parentNode;
    if (p && node && node.nodeType) {
      p.insertBefore(node, anchor.nextSibling);
      current = node;
    }
  });

  return parent; // fragment con anchor
};
