import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

import { loadCMS } from "./helpers/load-cms.mjs";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const nextMicrotask = () => new Promise((resolve) => queueMicrotask(resolve));
const collectText = (node) => {
  if (!node) return "";
  if (node.nodeType === 3 || node.nodeType === 8) return String(node.textContent || "");
  return (node.childNodes || []).map(collectText).join("");
};
const findNodes = (node, predicate, acc = []) => {
  if (!node) return acc;
  if (predicate(node)) acc.push(node);
  for (const child of node.childNodes || []) findNodes(child, predicate, acc);
  return acc;
};

test("reactive effect cleanup and dispose work", async () => {
  const CMS = await loadCMS();
  const [getCount, setCount] = CMS.signal(1);

  let runs = 0;
  let cleanups = 0;

  const stop = CMS.effect((onCleanup) => {
    getCount();
    runs += 1;
    onCleanup(() => {
      cleanups += 1;
    });
  });

  assert.equal(runs, 1);
  assert.equal(cleanups, 0);

  setCount(2);
  assert.equal(runs, 2);
  assert.equal(cleanups, 1);

  stop();
  assert.equal(cleanups, 2);

  setCount(3);
  assert.equal(runs, 2);
});

test("computed tracks only tracked dependencies and ignores untracked reads", async () => {
  const CMS = await loadCMS();
  const [getCount, setCount] = CMS.signal(2);
  const [getDebug, setDebug] = CMS.signal(10);

  let computedRuns = 0;
  const derived = CMS.computed(() => {
    computedRuns += 1;
    const count = getCount();
    const debug = CMS.untracked(() => getDebug());
    return `${count}:${debug}`;
  });

  assert.equal(derived(), "2:10");
  assert.equal(computedRuns, 1);

  setDebug(11);
  assert.equal(derived(), "2:10");
  assert.equal(computedRuns, 1);

  setCount(3);
  assert.equal(derived(), "3:11");
  assert.equal(computedRuns, 2);
});

test("batch flushes reactive subscribers once after grouped writes", async () => {
  const CMS = await loadCMS();
  const [getLeft, setLeft] = CMS.signal(1);
  const [getRight, setRight] = CMS.signal(10);
  const snapshots = [];

  CMS.effect(() => {
    snapshots.push(`${getLeft()}:${getRight()}`);
  });

  assert.deepEqual(snapshots, ["1:10"]);

  CMS.batch(() => {
    setLeft(2);
    setRight(20);
  });

  assert.deepEqual(snapshots, ["1:10", "2:20"]);

  CMS.batch(() => {
    setLeft(3);
    CMS.batch(() => {
      setRight(30);
    });
  });

  assert.deepEqual(snapshots, ["1:10", "2:20", "3:30"]);
});

test("batch supports optional microtask flush", async () => {
  const CMS = await loadCMS();
  const [getLeft, setLeft] = CMS.signal(1);
  const [getRight, setRight] = CMS.signal(10);
  const snapshots = [];

  CMS.effect(() => {
    snapshots.push(`${getLeft()}:${getRight()}`);
  });

  CMS.batch(() => {
    setLeft(2);
    setRight(20);
  }, { flush: "microtask" });

  assert.deepEqual(snapshots, ["1:10"]);

  await nextMicrotask();

  assert.deepEqual(snapshots, ["1:10", "2:20"]);
});

test("store.signal keeps scopes isolated across prefix and storage", async () => {
  const CMS = await loadCMS();
  const scopeA = { prefix: "A:", storage: "session" };
  const scopeB = { prefix: "B:", storage: "local" };

  const [getA, setA] = CMS.store.signal("shared", 1, scopeA);
  const [getB, setB] = CMS.store.signal("shared", 9, scopeB);

  assert.equal(getA(), 1);
  assert.equal(getB(), 9);

  setA(2);
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.equal(getA(), 2);
  assert.equal(getB(), 9);
  assert.equal(window.sessionStorage.getItem("A:shared"), "2");
  assert.equal(window.localStorage.getItem("B:shared"), "9");

  setB(10);
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.equal(getA(), 2);
  assert.equal(getB(), 10);
  assert.equal(window.localStorage.getItem("B:shared"), "10");
});

test("store.watch callbacks run untracked and do not trigger reactive loop guard", async () => {
  const CMS = await loadCMS();
  const scope = { prefix: "WATCH:", storage: "session" };
  const [getValue, setValue] = CMS.store.signal("count", 0, scope);
  const [getHits, setHits] = CMS.signal(0);

  const stopWatch = CMS.store.watch("count", () => {
    setHits(getHits() + 1);
  }, scope);

  assert.equal(getValue(), 0);
  assert.equal(getHits(), 0);

  setValue(1);
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.equal(getValue(), 1);
  assert.equal(getHits(), 1);

  stopWatch();
  setValue(2);
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.equal(getHits(), 1);
});

test("theme helpers persist theme values and cycle custom theme lists", async () => {
  const CMS = await loadCMS();

  assert.equal(CMS.getTheme(), null);

  CMS.setTheme("midnight");

  assert.equal(document.documentElement.getAttribute("data-theme"), "midnight");
  assert.equal(window.localStorage.getItem("cmswift:theme"), "midnight");
  assert.equal(CMS.getTheme(), "midnight");

  const nextTheme = CMS.toggleTheme(["light", "dark", "midnight"]);
  assert.equal(nextTheme, "light");
  assert.equal(CMS.getTheme(), "light");
  assert.equal(window.localStorage.getItem("cmswift:theme"), "light");

  const nextAfterLight = CMS.toggleTheme(["light", "dark", "midnight"]);
  assert.equal(nextAfterLight, "dark");
  assert.equal(CMS.getTheme(), "dark");
});

test("getTheme restores saved theme from localStorage when DOM has no theme", async () => {
  const CMS = await loadCMS();

  window.localStorage.setItem("cmswift:theme", "sepia");
  document.documentElement.removeAttribute("data-theme");

  assert.equal(CMS.getTheme(), "sepia");
  assert.equal(document.documentElement.getAttribute("data-theme"), "sepia");
});

test("http request exposes public API, hooks and state surface", async () => {
  const CMS = await loadCMS();
  const calls = [];

  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return {
      ok: true,
      status: 200,
      url: String(url),
      headers: new Headers({ "Content-Type": "application/json" }),
      async json() {
        return { ok: true, echoedHeader: init.headers.get("X-Test") };
      },
      async text() {
        return JSON.stringify({ ok: true });
      }
    };
  };

  let beforeHits = 0;
  let afterHits = 0;
  const offBefore = CMS.http.onBefore((req) => {
    beforeHits += 1;
    req.headers.set("X-Test", "hooked");
    return req;
  });
  const offAfter = CMS.http.onAfter((res) => {
    afterHits += 1;
    return res;
  });

  const out = await CMS.http.getJSON("/probe", {
    meta: { test: "http-success" },
    retry: { attempts: 0, delay: 0, factor: 1 }
  });

  assert.equal(beforeHits, 1);
  assert.equal(afterHits, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/probe");
  assert.equal(out.ok, true);
  assert.deepEqual(out.data, { ok: true, echoedHeader: "hooked" });

  const state = CMS.http.state();
  assert.equal(state.status(), "success");
  assert.equal(state.isLoading(), false);
  assert.equal(state.lastRequest().meta.test, "http-success");
  assert.equal(state.lastResponse().status, 200);

  offBefore();
  offAfter();
});

test("http onError runs when afterResponse throws", async () => {
  const CMS = await loadCMS();

  globalThis.fetch = async (url) => ({
    ok: true,
    status: 200,
    url: String(url),
    headers: new Headers(),
    async json() {
      return { ok: true };
    },
    async text() {
      return "ok";
    }
  });

  let errorHits = 0;
  const offAfter = CMS.http.onAfter((_res, req) => {
    if (req.meta?.forceError) {
      throw new Error("forced-after-error");
    }
    return _res;
  });
  const offError = CMS.http.onError((err, req) => {
    if (req.meta?.forceError) {
      errorHits += 1;
      assert.equal(err.message, "forced-after-error");
    }
  });

  await assert.rejects(
    CMS.http.getJSON("/boom", {
      meta: { forceError: true },
      retry: { attempts: 0, delay: 0, factor: 1 }
    }),
    /forced-after-error/
  );

  assert.equal(errorHits, 1);
  assert.equal(CMS.http.state().status(), "error");

  offAfter();
  offError();
});

test("router navigate updates subscribers, active state and unmounts previous view", async () => {
  const CMS = await loadCMS();
  const outlet = document.createElement("div");
  const disposals = [];
  const seen = [];

  CMS.router.setOutlet(outlet);
  CMS.router.add("/alpha/:id", (ctx) => ({
    node: document.createTextNode(`alpha:${ctx.params.id}`),
    dispose: () => disposals.push(`alpha:${ctx.params.id}`)
  }));
  CMS.router.add("/beta", () => ({
    node: document.createTextNode("beta"),
    dispose: () => disposals.push("beta")
  }));
  CMS.router.notFound((ctx) => document.createTextNode(`404:${ctx.path}`));

  const unsubscribe = CMS.router.subscribe((ctx) => {
    seen.push({
      path: ctx.path,
      params: { ...ctx.params },
      query: { ...ctx.query },
      hash: ctx.hash
    });
  });

  CMS.router.navigate("/alpha/7?tab=main#info");
  await tick();

  assert.equal(seen.at(-1).path, "/alpha/7");
  assert.deepEqual(seen.at(-1).params, { id: "7" });
  assert.deepEqual(seen.at(-1).query, { tab: "main" });
  assert.equal(seen.at(-1).hash, "#info");
  assert.equal(CMS.router.isActive("/alpha/:id"), true);

  CMS.router.navigate("/beta");
  await tick();

  assert.equal(disposals.includes("alpha:7"), true);
  assert.equal(seen.at(-1).path, "/beta");
  assert.equal(CMS.router.isActive("/beta"), true);

  CMS.router.navigate("/missing?x=1#n");
  await tick();

  assert.equal(seen.at(-1).path, "/missing");
  assert.deepEqual(seen.at(-1).query, { x: "1" });
  assert.equal(seen.at(-1).hash, "#n");
  assert.equal(CMS.router.history().at(-1).path, "/missing");

  unsubscribe();
});

test("renderer applies class, style, boolean props and event options", async () => {
  const CMS = await loadCMS();
  const [getOn, setOn] = CMS.signal(true);
  let clicks = 0;

  const input = CMS.input({
    class: ["base", { active: () => getOn() }],
    style: {
      "--cms-probe": () => (getOn() ? "10px" : "20px")
    },
    disabled: () => !getOn(),
    "aria-label": () => (getOn() ? "enabled" : null)
  });

  const onceBtn = CMS.button({
    onClick: {
      handler: () => {
        clicks += 1;
      },
      options: { once: true }
    }
  }, "Once");

  assert.equal(input.getAttribute("class"), "base active");
  assert.equal(input.style.getPropertyValue("--cms-probe"), "10px");
  assert.equal(input.disabled, false);
  assert.equal(input.getAttribute("aria-label"), "enabled");

  setOn(false);

  assert.equal(input.getAttribute("class"), "base");
  assert.equal(input.style.getPropertyValue("--cms-probe"), "20px");
  assert.equal(input.disabled, true);
  assert.equal(input.getAttribute("aria-label"), null);

  onceBtn.dispatchEvent({ type: "click" });
  onceBtn.dispatchEvent({ type: "click" });
  assert.equal(clicks, 1);
});

test("renderer supports attr style and nested-path keys directly in props", async () => {
  const CMS = await loadCMS();
  const [getOn, setOn] = CMS.signal(true);

  const node = CMS.div({
    "attr:data-state": () => getOn() ? "open" : null,
    "@aria-expanded": () => getOn(),
    "style.opacity": () => getOn() ? "1" : "",
    "dataset.mode": () => getOn() ? "active" : "idle"
  });

  assert.equal(node.getAttribute("data-state"), "open");
  assert.equal(node.getAttribute("aria-expanded"), "true");
  assert.equal(node.style.opacity, "1");
  assert.equal(node.dataset.mode, "active");

  setOn(false);

  assert.equal(node.getAttribute("data-state"), null);
  assert.equal(node.getAttribute("aria-expanded"), "false");
  assert.equal(node.style.opacity, "");
  assert.equal(node.dataset.mode, "idle");
});

test("renderer cleans up stale keys when dynamic style objects change shape", async () => {
  const CMS = await loadCMS();
  const [getEnabled, setEnabled] = CMS.signal(true);
  const [getColor, setColor] = CMS.signal("red");

  const node = CMS.div({
    style: () => getEnabled()
      ? { color: getColor(), opacity: "1", "--cms-probe": "10px" }
      : { color: "blue" }
  });

  assert.equal(node.style.color, "red");
  assert.equal(node.style.opacity, "1");
  assert.equal(node.style.getPropertyValue("--cms-probe"), "10px");

  setColor("green");
  assert.equal(node.style.color, "green");
  assert.equal(node.style.opacity, "1");

  setEnabled(false);
  assert.equal(node.style.color, "blue");
  assert.equal(node.style.opacity, "");
  assert.equal(node.style.getPropertyValue("--cms-probe"), "");
});

test("renderer disposes dynamic event effects on unmount", async () => {
  const CMS = await loadCMS();
  const [getMode, setMode] = CMS.signal("idle");
  const host = document.createElement("div");
  document.body.appendChild(host);

  const node = CMS.button({
    onClick: {
      handler: () => getMode(),
      options: () => (getMode() === "capture" ? { capture: true } : false)
    }
  }, "Dyn");

  const unmount = CMS.mount(host, node, { clear: true });
  unmount();

  let addCalls = 0;
  let removeCalls = 0;
  const originalAdd = node.addEventListener.bind(node);
  const originalRemove = node.removeEventListener.bind(node);

  node.addEventListener = function (...args) {
    addCalls += 1;
    return originalAdd(...args);
  };

  node.removeEventListener = function (...args) {
    removeCalls += 1;
    return originalRemove(...args);
  };

  setMode("capture");

  assert.equal(addCalls, 0);
  assert.equal(removeCalls, 0);
});

test("renderer composes multiple event listeners in a single event prop", async () => {
  const CMS = await loadCMS();
  const dynamicHandler = CMS.rod((event) => calls.push(`dynamic:${event.type}:v1`));
  const calls = [];

  const node = CMS.button({
    onClick: [
      () => calls.push("static"),
      { handler: dynamicHandler, options: { once: true } }
    ]
  }, "Compose");

  node.dispatchEvent({ type: "click" });
  node.dispatchEvent({ type: "click" });

  assert.deepEqual(calls, ["static", "dynamic:click:v1", "static"]);

  dynamicHandler.value = (event) => calls.push(`dynamic:${event.type}:v2`);
  node.dispatchEvent({ type: "click" });

  assert.deepEqual(calls, ["static", "dynamic:click:v1", "static", "static", "dynamic:click:v2"]);
});

test("renderer dynamic children cleanup disposed subtrees on replace", async () => {
  const CMS = await loadCMS();
  const [getVisible, setVisible] = CMS.signal(true);
  const [getMode, setMode] = CMS.signal("idle");

  const host = CMS.div(() => {
    if (!getVisible()) return null;
    return CMS.button({
      onClick: {
        handler: () => getMode(),
        options: () => (getMode() === "capture" ? { capture: true } : false)
      }
    }, "Child");
  });

  const button = host.childNodes.find((node) => node.nodeType === 1);
  assert.ok(button);

  setVisible(false);

  let addCalls = 0;
  let removeCalls = 0;
  const originalAdd = button.addEventListener.bind(button);
  const originalRemove = button.removeEventListener.bind(button);

  button.addEventListener = function (...args) {
    addCalls += 1;
    return originalAdd(...args);
  };

  button.removeEventListener = function (...args) {
    removeCalls += 1;
    return originalRemove(...args);
  };

  setMode("capture");

  assert.equal(addCalls, 0);
  assert.equal(removeCalls, 0);
});

test("renderer disposes dynamic prop effects and rod bindings on unmount", async () => {
  const CMS = await loadCMS();
  const [getOn, setOn] = CMS.signal(true);
  const rodLabel = _.rod("alpha");
  const host = document.createElement("div");
  document.body.appendChild(host);

  const node = CMS.div({
    class: () => getOn() ? "on" : "off",
    "aria-label": () => getOn() ? "enabled" : null,
    "data-probe": rodLabel
  }, "Probe");

  const unmount = CMS.mount(host, node, { clear: true });
  unmount();

  let setCalls = 0;
  let removeCalls = 0;
  const originalSet = node.setAttribute.bind(node);
  const originalRemove = node.removeAttribute.bind(node);

  node.setAttribute = function (...args) {
    setCalls += 1;
    return originalSet(...args);
  };

  node.removeAttribute = function (...args) {
    removeCalls += 1;
    return originalRemove(...args);
  };

  setOn(false);
  rodLabel.value = "beta";

  assert.equal(setCalls, 0);
  assert.equal(removeCalls, 0);
});

test("renderer supports two-way value rods on textarea and select", async () => {
  const CMS = await loadCMS();
  const textValue = _.rod("hello");
  const selectValue = _.rod("b");

  const textarea = CMS.textarea({ value: textValue });
  const select = CMS.select({ value: selectValue },
    CMS.option({ value: "a" }, "A"),
    CMS.option({ value: "b" }, "B")
  );

  assert.equal(textarea.value, "hello");
  assert.equal(select.value, "b");

  textValue.value = "world";
  selectValue.value = "a";

  assert.equal(textarea.value, "world");
  assert.equal(select.value, "a");

  textarea.value = "from-dom";
  textarea.dispatchEvent({ type: "input" });
  select.value = "b";
  select.dispatchEvent({ type: "change" });

  assert.equal(textValue.value, "from-dom");
  assert.equal(selectValue.value, "b");
});

test("renderer supports two-way checked rods on checkbox inputs", async () => {
  const CMS = await loadCMS();
  const checkedValue = _.rod(true);

  const checkbox = CMS.input({
    type: "checkbox",
    checked: checkedValue
  });

  assert.equal(checkbox.checked, true);

  checkedValue.value = false;
  assert.equal(checkbox.checked, false);

  checkbox.checked = true;
  checkbox.dispatchEvent({ type: "change" });

  assert.equal(checkedValue.value, true);
});

test("renderer supports checked rods on radio groups via input value", async () => {
  const CMS = await loadCMS();
  const selectedValue = _.rod("b");

  const radioA = CMS.input({
    type: "radio",
    name: "dept",
    value: "a",
    checked: selectedValue
  });
  const radioB = CMS.input({
    type: "radio",
    name: "dept",
    value: "b",
    checked: selectedValue
  });

  assert.equal(radioA.checked, false);
  assert.equal(radioB.checked, true);

  selectedValue.value = "a";
  assert.equal(radioA.checked, true);
  assert.equal(radioB.checked, false);

  radioB.checked = true;
  radioB.dispatchEvent({ type: "change" });
  assert.equal(selectedValue.value, "b");
  assert.equal(radioA.checked, false);
  assert.equal(radioB.checked, true);

  selectedValue.value = null;
  assert.equal(radioA.checked, false);
  assert.equal(radioB.checked, false);
});

test("renderer keeps numeric rods numeric on input range controls", async () => {
  const CMS = await loadCMS();
  const rangeValue = _.rod(25);

  const range = CMS.input({
    type: "range",
    min: 0,
    max: 100,
    step: 5,
    value: rangeValue
  });

  assert.equal(range.value, "25");

  rangeValue.value = 40;
  assert.equal(range.value, "40");

  range.value = "55";
  range.dispatchEvent({ type: "input" });
  assert.equal(rangeValue.value, 55);
  assert.equal(typeof rangeValue.value, "number");
});

test("renderer keeps numeric rods numeric and nullable on input number controls", async () => {
  const CMS = await loadCMS();
  const numberValue = _.rod(12);

  const input = CMS.input({
    type: "number",
    min: 0,
    max: 100,
    step: 1,
    value: numberValue
  });

  assert.equal(input.value, "12");

  numberValue.value = 48;
  assert.equal(input.value, "48");

  input.value = "33";
  input.dispatchEvent({ type: "input" });
  assert.equal(numberValue.value, 33);
  assert.equal(typeof numberValue.value, "number");

  input.value = "";
  input.dispatchEvent({ type: "input" });
  assert.equal(numberValue.value, null);

  numberValue.value = 7;
  assert.equal(input.value, "7");
});

test("renderer maps single select empty placeholder to null rods", async () => {
  const CMS = await loadCMS();
  const selectValue = _.rod(null);

  const select = CMS.select({ value: selectValue },
    CMS.option({ value: "" }, "Choose one"),
    CMS.option({ value: "ops" }, "Operations"),
    CMS.option({ value: "sales" }, "Sales")
  );

  assert.equal(select.value, "");

  selectValue.value = "sales";
  assert.equal(select.value, "sales");

  select.value = "";
  select.dispatchEvent({ type: "change" });
  assert.equal(selectValue.value, null);

  select.value = "ops";
  select.dispatchEvent({ type: "change" });
  assert.equal(selectValue.value, "ops");
});

test("renderer supports files rods on input file controls", async () => {
  const CMS = await loadCMS();
  const filesRod = _.rod([]);

  const input = CMS.input({
    type: "file",
    multiple: true,
    files: filesRod
  });

  const fakeFiles = [
    { name: "alpha.txt", size: 12, type: "text/plain" },
    { name: "beta.jpg", size: 42, type: "image/jpeg" }
  ];

  input.files = fakeFiles.slice();
  input.value = "C:\\fakepath\\alpha.txt";
  input.dispatchEvent({ type: "change" });

  assert.deepEqual(filesRod.value, fakeFiles);

  filesRod.value = [];
  assert.equal(input.value, "");
  assert.deepEqual(input.files, []);
});

test("renderer supports select multiple value rods", async () => {
  const CMS = await loadCMS();
  const selectedValues = _.rod(["b", "c"]);

  const select = CMS.select({ multiple: true, value: selectedValues },
    CMS.option({ value: "a" }, "A"),
    CMS.option({ value: "b" }, "B"),
    CMS.option({ value: "c" }, "C")
  );

  const options = select.childNodes.filter((node) => node.tagName === "OPTION");
  assert.equal(options[0].selected, false);
  assert.equal(options[1].selected, true);
  assert.equal(options[2].selected, true);

  selectedValues.value = ["a"];
  assert.equal(options[0].selected, true);
  assert.equal(options[1].selected, false);
  assert.equal(options[2].selected, false);

  options[0].selected = true;
  options[1].selected = true;
  options[2].selected = false;
  select.dispatchEvent({ type: "change" });

  assert.deepEqual(selectedValues.value, ["a", "b"]);
});

test("renderer supports selected rods on option elements", async () => {
  const CMS = await loadCMS();
  const optionASelected = _.rod(false);
  const optionBSelected = _.rod(true);

  const select = CMS.select({ value: "b" },
    CMS.option({ value: "a", selected: optionASelected }, "A"),
    CMS.option({ value: "b", selected: optionBSelected }, "B")
  );

  const options = select.childNodes.filter((node) => node.tagName === "OPTION");
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.equal(options[0].selected, false);
  assert.equal(options[1].selected, true);

  optionASelected.value = true;
  optionBSelected.value = false;

  assert.equal(options[0].selected, true);
  assert.equal(options[1].selected, false);

  options[0].selected = false;
  options[1].selected = true;
  select.dispatchEvent({ type: "change" });

  assert.equal(optionASelected.value, false);
  assert.equal(optionBSelected.value, true);
});

test("renderer supports dynamic children and SVG text nodes", async () => {
  const CMS = await loadCMS();
  const [getMode, setMode] = CMS.signal("single");

  const host = CMS.div(() => {
    if (getMode() === "single") return CMS.span("A");
    if (getMode() === "array") return [CMS.span("B"), CMS.span("C")];
    return null;
  });

  const childTags = () => host.childNodes
    .filter((node) => node.nodeType === 1)
    .map((node) => node.tagName);

  assert.deepEqual(childTags(), ["SPAN"]);

  setMode("array");
  assert.deepEqual(childTags(), ["SPAN", "SPAN"]);

  setMode("empty");
  assert.deepEqual(childTags(), []);

  const svg = CMS.svg(
    CMS.text({ "aria-label": "probe" }, "Hello")
  );
  const textNode = svg.childNodes[0];

  assert.equal(textNode.tagName, "TEXT");
  assert.equal(textNode.nodeType, 1);
  assert.equal(textNode.getAttribute("aria-label"), "probe");
});

test("renderer keeps rod children reactive inside dynamic child arrays", async () => {
  const CMS = await loadCMS();
  const labelRod = CMS.rod("A");
  const host = CMS.div(() => ["prefix:", labelRod, ":suffix"]);
  const textContent = () => host.childNodes
    .filter((node) => node.nodeType === 3)
    .map((node) => node.textContent)
    .join("");

  assert.equal(textContent(), "prefix:A:suffix");

  labelRod.value = "B";
  assert.equal(textContent(), "prefix:B:suffix");

  const mountHost = document.createElement("div");
  document.body.appendChild(mountHost);
  const unmount = CMS.mount(mountHost, host, { clear: true });
  unmount();

  labelRod.value = "C";
  assert.equal(textContent(), "prefix:B:suffix");
});

test("rod binding shares renderer DOM prop semantics for class style and boolean props", async () => {
  const CMS = await loadCMS();
  const host = document.createElement("div");
  document.body.appendChild(host);
  const state = _.rod("active");
  const width = _.rod("12px");
  const disabled = _.rod(false);

  CMS.rodBind(host, state, { key: "class" });
  CMS.rodBind(host, width, { key: "style.--cms-probe" });
  CMS.rodBind(host, disabled, { key: "disabled" });

  assert.equal(host.getAttribute("class"), "active");
  assert.equal(host.style.getPropertyValue("--cms-probe"), "12px");
  assert.equal(host.disabled, false);

  state.value = "";
  width.value = null;
  disabled.value = true;
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.equal(host.getAttribute("class"), null);
  assert.equal(host.style.getPropertyValue("--cms-probe"), "");
  assert.equal(host.disabled, true);
});

test("rod binding supports auto attr style paths and nested property targets", async () => {
  const CMS = await loadCMS();
  const input = document.createElement("input");
  const panel = document.createElement("div");
  panel.dataset = {};
  panel.foo = { bar: 0 };
  document.body.appendChild(input);
  document.body.appendChild(panel);

  const autoValue = _.rod("12");
  const ariaLabel = _.rod("probe");
  const opacity = _.rod("0.5");
  const nested = _.rod(7);

  CMS.rodBind(input, autoValue, { key: "auto" });
  CMS.rodBind(panel, ariaLabel, { key: "attr:aria-label" });
  CMS.rodBind(panel, opacity, { key: "style.opacity" });
  CMS.rodBind(panel, nested, { key: "foo.bar" });

  assert.equal(input.value, "12");
  assert.equal(panel.getAttribute("aria-label"), "probe");
  assert.equal(panel.style.opacity, "0.5");
  assert.equal(panel.foo.bar, 7);

  autoValue.value = "18";
  ariaLabel.value = null;
  opacity.value = "";
  nested.value = 11;
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.equal(input.value, "18");
  assert.equal(panel.getAttribute("aria-label"), null);
  assert.equal(panel.style.opacity, "");
  assert.equal(panel.foo.bar, 11);
});

test("mount and component cleanup run on unmount and clear", async () => {
  const CMS = await loadCMS();
  const root = document.createElement("div");
  let componentDisposals = 0;
  let mountDisposals = 0;

  const Probe = CMS.component((props, ctx) => {
    ctx.onDispose(() => {
      componentDisposals += 1;
    });
    return document.createTextNode(`probe:${props.label}`);
  });

  const unmountFirst = CMS.mount(root, () => Probe({ label: "a" }), { clear: true });
  assert.equal(root.childNodes.length, 1);

  const secondUnmount = CMS.mount(root, {
    node: document.createTextNode("b"),
    dispose: () => {
      mountDisposals += 1;
    }
  }, { clear: true });

  assert.equal(componentDisposals, 1);
  assert.equal(root.childNodes.length, 1);

  secondUnmount();
  assert.equal(mountDisposals, 1);
  assert.equal(root.childNodes.length, 0);

  unmountFirst();
  assert.equal(componentDisposals, 1);
});

test("component dispose runs user dispose and ctx.onDispose once", async () => {
  const CMS = await loadCMS();
  let userDisposals = 0;
  let ctxDisposals = 0;

  const Probe = CMS.component((_props, ctx) => {
    ctx.onDispose(() => {
      ctxDisposals += 1;
    });
    return {
      node: document.createTextNode("probe"),
      dispose: () => {
        userDisposals += 1;
      }
    };
  });

  const instance = Probe();
  instance.dispose();
  instance.dispose();

  assert.equal(userDisposals, 1);
  assert.equal(ctxDisposals, 1);
});

test("overlay keeps stack, scroll lock and listener cleanup coherent", async () => {
  const CMS = await loadCMS();
  const anchor = document.createElement("button");
  document.body.appendChild(anchor);

  const closed = [];
  const first = CMS.overlay.open(() => CMS.div("first"), {
    backdrop: true,
    lockScroll: true,
    onClose: () => closed.push("first")
  });

  const overlayRoot = document.getElementById("cms-overlay-root");
  assert.ok(overlayRoot);
  assert.equal(CMS.overlay._stack.size, 1);
  assert.equal(document.documentElement.classList.contains("cms-scroll-locked"), true);
  assert.equal(document._listeners.get("mousedown")?.size ?? 0, 1);
  assert.equal(document._listeners.get("keydown")?.size ?? 0, 1);
  assert.equal(first.overlay.parentNode, overlayRoot);

  const second = CMS.overlay.open(() => CMS.div("second"), {
    anchorEl: anchor,
    placement: "bottom-start",
    lockScroll: true,
    onClose: () => closed.push("second")
  });

  assert.equal(CMS.overlay._stack.size, 2);
  assert.equal(document._listeners.get("mousedown")?.size ?? 0, 2);
  assert.equal(document._listeners.get("keydown")?.size ?? 0, 2);
  assert.equal(globalThis.__windowTarget._listeners.get("resize")?.size ?? 0, 1);
  assert.equal(globalThis.__windowTarget._listeners.get("scroll")?.size ?? 0, 1);
  assert.equal(second.panel.style.top, "8px");
  assert.equal(second.panel.style.left, "8px");

  CMS.overlay.closeTop();

  assert.equal(CMS.overlay._stack.size, 1);
  assert.equal(document.documentElement.classList.contains("cms-scroll-locked"), true);
  assert.equal(document._listeners.get("mousedown")?.size ?? 0, 1);
  assert.equal(document._listeners.get("keydown")?.size ?? 0, 1);
  assert.equal(globalThis.__windowTarget._listeners.get("resize")?.size ?? 0, 0);
  assert.equal(globalThis.__windowTarget._listeners.get("scroll")?.size ?? 0, 0);

  CMS.overlay.close(first.id);

  assert.equal(CMS.overlay._stack.size, 0);
  assert.equal(document.documentElement.classList.contains("cms-scroll-locked"), false);
  assert.equal(document._listeners.get("mousedown")?.size ?? 0, 0);
  assert.equal(document._listeners.get("keydown")?.size ?? 0, 0);
  assert.deepEqual(closed, ["second", "first"]);
});

test("overlay outside click ignores interactive UI portals", async () => {
  const CMS = await loadCMS();
  let closed = 0;
  const entry = CMS.overlay.open(() => CMS.div("dialog"), {
    closeOnOutside: true,
    onClose: () => {
      closed += 1;
    }
  });
  const portal = document.createElement("div");
  portal.setAttribute("data-cms-overlay-portal", "true");
  const option = document.createElement("div");
  portal.appendChild(option);
  document.body.appendChild(portal);

  document.dispatchEvent({ type: "mousedown", target: option });

  assert.equal(CMS.overlay._stack.has(entry.id), true);
  assert.equal(closed, 0);

  document.dispatchEvent({ type: "mousedown", target: document.body });

  assert.equal(CMS.overlay._stack.has(entry.id), false);
  assert.equal(closed, 1);
});

test("overlay outside click closes from regular outside targets", async () => {
  const CMS = await loadCMS();
  let closed = 0;
  const entry = CMS.overlay.open(() => CMS.div("dialog"), {
    closeOnOutside: true,
    onClose: () => {
      closed += 1;
    }
  });
  const outside = document.createElement("button");
  document.body.appendChild(outside);

  document.dispatchEvent({ type: "mousedown", target: outside });

  assert.equal(CMS.overlay._stack.has(entry.id), false);
  assert.equal(closed, 1);
});

test("auth plugin updates public state for login, role checks and logout", async () => {
  const CMS = await loadCMS();
  const calls = [];

  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || "GET" });

    if (String(url) === "/api/login") {
      return {
        ok: true,
        status: 200,
        url: String(url),
        headers: new Headers({ "Content-Type": "application/json" }),
        async json() {
          return {
            user: {
              id: "u1",
              email: "ada@example.test",
              roles: ["admin"],
              permissions: ["posts.write"]
            },
            accessToken: "token-1",
            refreshToken: "refresh-1",
            expiresAt: Date.now() + 60_000
          };
        }
      };
    }

    if (String(url) === "/api/logout") {
      return {
        ok: true,
        status: 204,
        url: String(url),
        headers: new Headers(),
        async json() {
          return {};
        }
      };
    }

    throw new Error(`Unexpected fetch in auth state test: ${url}`);
  };

  CMS.usePlugin(CMS.plugins.auth, {
    autoRedirect: false,
    endpoints: {
      login: "/api/login",
      refresh: "/api/refresh",
      logout: "/api/logout"
    }
  });

  assert.equal(CMS.auth.isAuth(), false);

  await CMS.auth.loginAsync({ email: "ada@example.test", password: "pw" });

  assert.equal(CMS.auth.isAuth(), true);
  assert.equal(CMS.auth.user().email, "ada@example.test");
  assert.equal(CMS.auth.hasRole("admin"), true);
  assert.equal(CMS.auth.can("posts.write"), true);
  assert.equal(CMS.auth.canAny(["users.read", "posts.write"]), true);
  assert.equal(CMS.auth.canAll(["admin", "posts.write"]), true);
  assert.match(CMS.auth.status(), /AUTH ✅/);
  const originalGroupCollapsed = console.groupCollapsed;
  const originalLog = console.log;
  const originalGroupEnd = console.groupEnd;
  const originalWarn = console.warn;
  console.groupCollapsed = () => { };
  console.log = () => { };
  console.groupEnd = () => { };
  console.warn = () => { };
  try {
    assert.equal(CMS.auth.inspect("test-auth").token.hasAccess, true);
  } finally {
    console.groupCollapsed = originalGroupCollapsed;
    console.log = originalLog;
    console.groupEnd = originalGroupEnd;
    console.warn = originalWarn;
  }

  await CMS.auth.logoutAsync();

  assert.equal(CMS.auth.isAuth(), false);
  assert.deepEqual(
    calls.map((entry) => `${entry.method} ${entry.url}`),
    ["POST /api/login", "POST /api/logout"]
  );
});

test("auth.fetch retries a 401 only once after refresh", async () => {
  const CMS = await loadCMS();
  const calls = [];

  globalThis.fetch = async (url, init = {}) => {
    const headers = new Headers(init.headers || {});
    calls.push({
      url: String(url),
      method: init.method || "GET",
      auth: headers.get("Authorization")
    });

    if (String(url) === "/api/login") {
      return {
        ok: true,
        status: 200,
        url: String(url),
        headers: new Headers({ "Content-Type": "application/json" }),
        async json() {
          return {
            user: { id: "u2", roles: ["editor"], permissions: ["docs.read"] },
            accessToken: "token-old",
            refreshToken: "refresh-old",
            expiresAt: Date.now() + 60_000
          };
        }
      };
    }

    if (String(url) === "/api/refresh") {
      return {
        ok: true,
        status: 200,
        url: String(url),
        headers: new Headers({ "Content-Type": "application/json" }),
        async json() {
          return {
            accessToken: "token-new",
            refreshToken: "refresh-new",
            expiresAt: Date.now() + 120_000
          };
        }
      };
    }

    if (String(url) === "/private") {
      return {
        ok: false,
        status: 401,
        url: String(url),
        headers: new Headers(),
        async json() {
          return { ok: false };
        }
      };
    }

    throw new Error(`Unexpected fetch in auth retry test: ${url}`);
  };

  CMS.usePlugin(CMS.plugins.auth, {
    autoRedirect: false,
    endpoints: {
      login: "/api/login",
      refresh: "/api/refresh",
      logout: "/api/logout"
    }
  });

  await CMS.auth.loginAsync({ email: "editor@example.test", password: "pw" });
  const response = await CMS.auth.fetch("/private");

  assert.equal(response.status, 401);
  assert.deepEqual(
    calls.map((entry) => `${entry.method} ${entry.url} ${entry.auth ?? ""}`.trim()),
    [
      "POST /api/login",
      "GET /private Bearer token-old",
      "POST /api/refresh",
      "GET /private Bearer token-new"
    ]
  );
});

test("ui.meta docTable renders missing-meta fallback", async () => {
  const CMS = await loadCMS();
  const out = CMS.docTable("UnknownProbe");

  assert.equal(out.tagName, "DIV");
  assert.equal(out.getAttribute("class"), "cms-muted");
  assert.equal(collectText(out), "Meta non trovata: UnknownProbe");
});

test("UI.Button aliases UI.Btn", async () => {
  const CMS = await loadCMS();
  const filename = path.resolve("pages/_cmswift-fe/js/ui.js");
  const source = await fs.readFile(filename, "utf8");
  vm.runInThisContext(source, { filename });

  assert.equal(CMS.Button, CMS.Btn);
  assert.equal(globalThis._.Button, globalThis._.Btn);
  assert.equal(CMS.ui.Button, CMS.ui.Btn);

  const out = CMS.Button({ label: "Salva", color: "primary" });
  const uiOut = CMS.ui.Button({ label: "Annulla" });

  assert.equal(out.tagName, "BUTTON");
  assert.equal(collectText(out), "Salva");
  assert.equal(out.classList.contains("cms-btn"), true);
  assert.equal(uiOut.tagName, "BUTTON");
  assert.equal(collectText(uiOut), "Annulla");
});

test("UI.Icon uses built-in inline sprite fallback without external URL", async () => {
  const CMS = await loadCMS();
  const filename = path.resolve("pages/_cmswift-fe/js/ui.js");
  const source = await fs.readFile(filename, "utf8");
  vm.runInThisContext(source, { filename });

  delete CMS.config.iconSpriteUrl;
  delete globalThis.CMSwift_setting.iconSpriteUrl;

  const out = CMS.Icon("#chevron-down");
  const uses = findNodes(out, (node) => node.tagName === "USE");
  const paths = findNodes(out, (node) => node.tagName === "PATH");

  assert.equal(out.tagName, "SPAN");
  assert.equal(uses.length, 0);
  assert.equal(paths.length, 1);
  assert.equal(paths[0].getAttribute("d"), "M6 9l6 6l6 -6");
});

test("ui.meta docTable fallback works without TabPanel and without props", async () => {
  const CMS = await loadCMS();
  CMS.ui.meta.ProbeMeta = {
    signature: "UI.ProbeMeta(opts)",
    returns: "HTMLElement",
    slots: {
      default: {
        type: "node",
        description: "Main content"
      }
    },
    events: {
      ready: "Emitted when ready"
    }
  };

  const out = CMS.docTable("ProbeMeta");
  const text = collectText(out);
  const headings = findNodes(out, (node) => node.tagName === "H4").map(collectText);

  assert.equal(out.tagName, "DIV");
  assert.equal(text.includes("_.ProbeMeta"), true);
  assert.equal(text.includes("_.ProbeMeta(opts)"), true);
  assert.equal(text.includes("Documentation"), true);
  assert.equal(text.includes("Props"), false);
  assert.equal(text.includes("Returns: HTMLElement"), true);
  assert.equal(headings.includes("Documentation"), true);
  assert.equal(headings.includes("Slots"), true);
  assert.equal(headings.includes("Events"), true);
});

test("ui.meta docTable uses TabPanel when available", async () => {
  const CMS = await loadCMS();
  CMS.ui.meta.ProbeWithProps = {
    props: {
      tone: {
        type: "string|number",
        default: "soft",
        values: ["soft", "loud"],
        description: "Visual tone",
        category: "general"
      },
      dense: {
        type: "boolean",
        default: false,
        description: "Dense mode",
        category: "layout"
      }
    },
    events: [{ name: "change", description: "When value changes" }],
    returns: "VNode"
  };

  const originalTabPanel = globalThis._.TabPanel;
  globalThis._.TabPanel = (props = {}) => CMS.div({
    "data-probe-tabpanel": props.orientation || "none",
    "data-tab-count": String((props.tabs || []).length)
  }, props.tabs?.flatMap((tab) => [CMS.span(tab.label), tab.content]));

  try {
    const out = CMS.docTable("ProbeWithProps");
    const tabPanels = findNodes(out, (node) => node.getAttribute?.("data-probe-tabpanel"));
    const text = collectText(out);
    const horizontalPanel = tabPanels.find((node) => node.getAttribute("data-probe-tabpanel") === "horizontal");

    const orientations = tabPanels.map((node) => node.getAttribute("data-probe-tabpanel"));
    assert.equal(tabPanels.length, 4);
    assert.equal(orientations.filter((value) => value === "horizontal").length, 1);
    assert.equal(orientations.filter((value) => value === "vertical").length, 3);
    assert.ok(horizontalPanel);
    assert.equal(horizontalPanel.getAttribute("data-tab-count"), "3");
    assert.equal(text.includes("Props"), true);
    assert.equal(text.includes("general"), true);
    assert.equal(text.includes("layout"), true);
    assert.equal(text.includes("Events"), true);
    assert.equal(text.includes("Returns: VNode"), true);
  } finally {
    if (originalTabPanel === undefined) delete globalThis._.TabPanel;
    else globalThis._.TabPanel = originalTabPanel;
  }
});
