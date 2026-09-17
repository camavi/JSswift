import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

class FakeEventTarget {
  constructor() {
    this._listeners = new Map();
  }

  addEventListener(type, fn) {
    if (typeof fn !== "function") return;
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type).add(fn);
  }

  removeEventListener(type, fn) {
    this._listeners.get(type)?.delete(fn);
  }

  dispatchEvent(event) {
    if (!event || !event.type) throw new Error("FakeEventTarget.dispatchEvent: event.type is required");
    if (!("target" in event)) event.target = this;
    event.currentTarget = this;
    const listeners = Array.from(this._listeners.get(event?.type) || []);
    listeners.forEach((fn) => fn.call(this, event));
  }
}

class FakeStyleDeclaration {
  constructor() {
    this._props = new Map();
  }

  setProperty(name, value) {
    this._props.set(String(name), String(value));
    this[name] = String(value);
  }

  removeProperty(name) {
    const key = String(name);
    this._props.delete(key);
    delete this[key];
  }

  getPropertyValue(name) {
    return this._props.get(String(name)) || "";
  }
}

class FakeClassList {
  constructor() {
    this._items = new Set();
  }

  add(...names) {
    names.forEach((name) => {
      if (name) this._items.add(name);
    });
  }

  remove(...names) {
    names.forEach((name) => this._items.delete(name));
  }

  contains(name) {
    return this._items.has(name);
  }

  toggle(name, force) {
    if (force === true) {
      this._items.add(name);
      return true;
    }
    if (force === false) {
      this._items.delete(name);
      return false;
    }
    if (this._items.has(name)) {
      this._items.delete(name);
      return false;
    }
    this._items.add(name);
    return true;
  }
}

class FakeStorage {
  constructor() {
    this._map = new Map();
  }

  get length() {
    return this._map.size;
  }

  key(index) {
    return Array.from(this._map.keys())[index] ?? null;
  }

  getItem(key) {
    return this._map.has(key) ? this._map.get(key) : null;
  }

  setItem(key, value) {
    this._map.set(String(key), String(value));
  }

  removeItem(key) {
    this._map.delete(String(key));
  }

  clear() {
    this._map.clear();
  }
}

class FakeNode extends FakeEventTarget {
  constructor(tagName = "") {
    super();
    this.tagName = tagName.toUpperCase();
    this.nodeType = tagName === "#text" ? 3 : tagName === "#comment" ? 8 : tagName === "fragment" ? 11 : 1;
    this.parentNode = null;
    this.childNodes = [];
    this.style = new FakeStyleDeclaration();
    this.classList = new FakeClassList();
    this.attributes = new Map();
    this.dataset = {};
    this.id = "";
    this.className = "";
    this.isConnected = false;
    this.textContent = "";
    this._value = "";
    this.disabled = false;
    this.required = false;
    this.readOnly = false;
    this.checked = false;
    this.selected = false;
    this.multiple = false;
    this.type = "";
    this.files = [];
  }

  get value() {
    return this._value ?? "";
  }

  set value(value) {
    this._value = value == null ? "" : String(value);
    if (this.type === "file" && this._value === "") {
      this.files = [];
    }
  }

  get valueAsNumber() {
    const parsed = Number(this.value);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }

  set valueAsNumber(value) {
    if (value == null || Number.isNaN(Number(value))) {
      this.value = "";
      return;
    }
    this.value = String(value);
  }

  get firstChild() {
    return this.childNodes[0] ?? null;
  }

  get nextSibling() {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    const index = siblings.indexOf(this);
    return index >= 0 ? siblings[index + 1] ?? null : null;
  }

  appendChild(node) {
    if (!node) return node;
    if (node.nodeType === 11) {
      const children = [...node.childNodes];
      children.forEach((child) => {
        node.removeChild(child);
        this.appendChild(child);
      });
      return node;
    }
    node.parentNode = this;
    node.isConnected = this.isConnected;
    this.childNodes.push(node);
    return node;
  }

  insertBefore(node, referenceNode) {
    if (!node) return node;
    if (node.nodeType === 11) {
      const children = [...node.childNodes];
      children.forEach((child) => {
        node.removeChild(child);
        this.insertBefore(child, referenceNode);
      });
      return node;
    }
    node.parentNode = this;
    node.isConnected = this.isConnected;
    if (!referenceNode) {
      this.childNodes.push(node);
      return node;
    }
    const index = this.childNodes.indexOf(referenceNode);
    if (index === -1) {
      this.childNodes.push(node);
    } else {
      this.childNodes.splice(index, 0, node);
    }
    return node;
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index >= 0) this.childNodes.splice(index, 1);
    node.parentNode = null;
    node.isConnected = false;
    return node;
  }

  replaceChildren(...nodes) {
    while (this.firstChild) this.removeChild(this.firstChild);
    nodes.forEach((node) => this.appendChild(node));
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  cloneNode(deep = false) {
    const copy = new FakeNode(
      this.nodeType === 3 ? "#text" : this.nodeType === 8 ? "#comment" : this.nodeType === 11 ? "fragment" : this.tagName.toLowerCase()
    );
    copy.textContent = this.textContent;
    copy.className = this.className;
    copy.id = this.id;
    copy.dataset = { ...this.dataset };
    copy.attributes = new Map(this.attributes);
    this.classList._items.forEach((name) => copy.classList.add(name));
    this.style._props.forEach((value, key) => copy.style.setProperty(key, value));
    if (deep) {
      this.childNodes.forEach((child) => copy.appendChild(child.cloneNode(true)));
    }
    return copy;
  }

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }

  contains(node) {
    if (node === this) return true;
    return this.childNodes.some((child) => child === node || child.contains?.(node));
  }

  setAttribute(name, value) {
    const next = String(value);
    this.attributes.set(name, next);
    if (name === "class") {
      this.className = next;
      this.classList = new FakeClassList();
      next.split(/\s+/).filter(Boolean).forEach((token) => this.classList.add(token));
    } else if (name === "id") {
      this.id = next;
    } else if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      this.dataset[key] = next;
    } else if (name === "type") {
      this.type = next;
    }
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === "class") {
      this.className = "";
      this.classList = new FakeClassList();
    } else if (name === "id") {
      this.id = "";
    } else if (name.startsWith("data-")) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      delete this.dataset[key];
    }
  }

  getBoundingClientRect() {
    return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }

  focus() { }

  scrollIntoView() { }
}

function findNodeById(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  for (const child of node.childNodes || []) {
    const match = findNodeById(child, id);
    if (match) return match;
  }
  return null;
}

function createEnvironment() {
  const localStorage = new FakeStorage();
  const sessionStorage = new FakeStorage();
  const document = new FakeEventTarget();
  const documentElement = new FakeNode("html");
  const body = new FakeNode("body");
  documentElement.isConnected = true;
  body.isConnected = true;
  document.documentElement = documentElement;
  document.body = body;
  document.readyState = "complete";
  document.getElementById = (id) => findNodeById(document.body, String(id));
  document.createElement = (tag) => new FakeNode(tag);
  document.createElementNS = (ns, tag) => new FakeNode(tag);
  document.createTextNode = (text) => {
    const node = new FakeNode("#text");
    node.textContent = String(text);
    return node;
  };
  document.createComment = (text) => {
    const node = new FakeNode("#comment");
    node.textContent = String(text);
    return node;
  };
  document.createDocumentFragment = () => new FakeNode("fragment");
  document.querySelector = () => null;
  document.querySelectorAll = () => [];

  const location = new URL("http://localhost/");
  const history = {
    pushState(_state, _title, url = "") {
      if (url) {
        const next = new URL(String(url), location.origin);
        location.pathname = next.pathname;
        location.search = next.search;
        location.hash = next.hash;
      }
    },
    replaceState(_state, _title, url = "") {
      if (url) {
        const next = new URL(String(url), location.origin);
        location.pathname = next.pathname;
        location.search = next.search;
        location.hash = next.hash;
      }
    }
  };
  const windowTarget = new FakeEventTarget();

  return { windowTarget, document, localStorage, sessionStorage, history, location };
}

export async function loadCMS() {
  const { windowTarget, document, localStorage, sessionStorage, history, location } = createEnvironment();

  globalThis.document = document;
  globalThis.localStorage = localStorage;
  globalThis.sessionStorage = sessionStorage;
  globalThis.history = history;
  globalThis.location = location;
  globalThis.origin = location.origin;
  globalThis.__windowTarget = windowTarget;
  globalThis.window = globalThis;
  globalThis.self = globalThis;
  globalThis.addEventListener = windowTarget.addEventListener.bind(windowTarget);
  globalThis.removeEventListener = windowTarget.removeEventListener.bind(windowTarget);
  globalThis.dispatchEvent = windowTarget.dispatchEvent.bind(windowTarget);
  globalThis.innerHeight = 1024;
  globalThis.innerWidth = 1280;
  globalThis.Node = FakeNode;
  globalThis.Element = FakeNode;
  globalThis.HTMLElement = FakeNode;
  globalThis.SVGElement = FakeNode;
  globalThis.MutationObserver = class {
    observe() { }
    disconnect() { }
  };
  globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  globalThis.fetch = async () => {
    throw new Error("fetch not stubbed in tests");
  };
  globalThis.atob = (value) => Buffer.from(String(value), "base64").toString("binary");
  globalThis.performance = globalThis.performance || { now: () => Date.now() };
  globalThis.JSswift_setting = {
    modeDev: true,
    http: {
      baseURL: "",
      timeout: 0,
      retry: { attempts: 0, delay: 0, factor: 1 },
      headers: {}
    }
  };

  delete globalThis.JSswift;
  delete globalThis.JSswift;
  delete globalThis._;

  const filename = path.resolve("pages/_jsswift-fe/js/cms.js");
  const source = await fs.readFile(filename, "utf8");
  vm.runInThisContext(source, { filename });
  return globalThis.JSswift;
}
