import test from "node:test";
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const findChrome = () => {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) || "";
};

const runChrome = (chromePath, htmlFile, options = {}) => new Promise((resolve, reject) => {
  const width = options.width || 1440;
  const height = options.height || 900;
  execFile(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--allow-file-access-from-files",
    `--window-size=${width},${height}`,
    "--virtual-time-budget=5000",
    "--dump-dom",
    pathToFileURL(htmlFile).href
  ], { maxBuffer: 1024 * 1024 * 4 }, (error, stdout, stderr) => {
    if (error) {
      error.message = `${error.message}\n${stderr}`;
      reject(error);
      return;
    }
    resolve(stdout);
  });
});

const readBrowserResult = (dom) => {
  const match = dom.match(/\sdata-result="([^"]+)"/);
  assert.ok(match, `missing browser result in DOM:\n${dom.slice(0, 2000)}`);
  return JSON.parse(decodeURIComponent(match[1]));
};

const hasDevtoolsWebSocket = () => typeof WebSocket === "function";

const requestJson = (baseUrl, requestPath, method = "GET") => new Promise((resolve, reject) => {
  const req = http.request(`${baseUrl}${requestPath}`, { method }, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        error.message = `${error.message}\n${data}`;
        reject(error);
      }
    });
  });
  req.on("error", reject);
  req.end();
});

const runChromeMobileEval = async (chromePath, pageUrl, evaluateExpression, options = {}) => {
  assert.ok(hasDevtoolsWebSocket(), "Node WebSocket API is required for mobile browser emulation tests");
  const port = options.port || 19000 + Math.floor(Math.random() * 2000);
  const baseUrl = `http://127.0.0.1:${port}`;
  const userDataDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-chrome-cdp-"));
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--allow-file-access-from-files",
    "about:blank"
  ], { stdio: "ignore" });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const cleanup = async () => {
    chrome.kill("SIGTERM");
    await sleep(200);
  };

  let ws = null;
  try {
    let version = null;
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        version = await requestJson(baseUrl, "/json/version");
        break;
      } catch {
        await sleep(100);
      }
    }
    assert.ok(version, "Chrome DevTools endpoint did not start");

    const target = await requestJson(baseUrl, "/json/new?about:blank", "PUT");
    ws = new WebSocket(target.webSocketDebuggerUrl);
    const pending = new Map();
    let nextId = 1;

    ws.onmessage = (event) => {
      const payload = JSON.parse(String(event.data));
      if (!payload.id || !pending.has(payload.id)) return;
      const { resolve, reject } = pending.get(payload.id);
      pending.delete(payload.id);
      if (payload.error) reject(new Error(JSON.stringify(payload.error)));
      else resolve(payload.result);
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
      width: options.width || 390,
      height: options.height || 844,
      deviceScaleFactor: options.deviceScaleFactor || 3,
      mobile: true,
      screenWidth: options.width || 390,
      screenHeight: options.height || 844,
    });
    if (options.focusEmulation) await send("Emulation.setFocusEmulationEnabled", {enabled:true});
    await send("Page.navigate", { url: pageUrl });
    await sleep(options.navigateDelayMs || 1200);

    let result = await send("Runtime.evaluate", {
      expression: evaluateExpression,
      returnByValue: true,
      awaitPromise: true
    });

    if (options.afterReload && !result.exceptionDetails) {
      assert.ok(result.result && "value" in result.result, JSON.stringify(result));
      const before = result.result.value;
      await send("Page.reload");
      await sleep(1200);
      const after = await send("Runtime.evaluate", {expression: options.afterReload, returnByValue:true, awaitPromise:true});
      assert.ok(!after.exceptionDetails, JSON.stringify(after.exceptionDetails));
      result = {result:{value:{before, after:after.result.value}}};
    }
    ws.close();
    await cleanup();
    if (Object.prototype.hasOwnProperty.call(result?.result || {}, "value")) {
      return result.result.value;
    }
    if (result?.exceptionDetails) {
      return {
        error: "runtime-evaluate-exception",
        text: result.exceptionDetails.text,
        description: result.exceptionDetails.exception?.description || null
      };
    }
    return {
      error: "runtime-evaluate-no-value",
      raw: result
    };
  } catch (error) {
    try {
      ws?.close();
    } catch {}
    await cleanup();
    throw error;
  }
};

test("Grid responsive columns keep display:grid and render four desktop tracks", {
  skip: findChrome() ? false : "Chrome/Chromium is not available"
}, async () => {
  const chromePath = findChrome();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-grid-responsive-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;

  await writeFile(htmlFile, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; padding: 24px; }
    #root { width: 960px; }
    .probe-cell { min-height: 32px; border: 1px solid #999; box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="${coreUrl}"></script>
  <script src="${uiUrl}"></script>
  <script>
    const finish = (result) => {
      document.body.setAttribute("data-result", encodeURIComponent(JSON.stringify(result)));
    };

    try {
      const UI = window._ || window.JSswift?.ui;
      const cells = Array.from({ length: 8 }, (_, index) =>
        UI.div({ class: "probe-cell" }, "cell " + (index + 1))
      );
      const grid = UI.Grid({
        cols: 1,
        gap: "md",
        tablet: { cols: 2, gap: "lg" },
        pc: { cols: 4 }
      }, ...cells);

      document.getElementById("root").appendChild(grid);

      setTimeout(() => {
        const style = getComputedStyle(grid);
        const children = Array.from(grid.children);
        const rects = children.slice(0, 5).map((child) => {
          const rect = child.getBoundingClientRect();
          return {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.round(rect.width)
          };
        });
        const trackCount = style.gridTemplateColumns.split(" ").filter(Boolean).length;
        const firstTop = rects[0]?.top ?? 0;
        const firstFourSameRow = rects.slice(0, 4).every((rect) => Math.abs(rect.top - firstTop) <= 2);
        const firstFourIncrease = rects.slice(1, 4).every((rect, index) => rect.left > rects[index].left);

        finish({
          className: grid.className,
          display: style.display,
          gap: style.gap,
          gridTemplateColumns: style.gridTemplateColumns,
          trackCount,
          rects,
          firstFourSameRow,
          firstFourIncrease,
          fifthIsNextRow: rects[4] ? rects[4].top > firstTop : false
        });
      }, 250);
    } catch (error) {
      finish({ error: String(error?.stack || error) });
    }
  </script>
</body>
</html>`, "utf8");

  const dom = await runChrome(chromePath, htmlFile);
  const result = readBrowserResult(dom);

  assert.equal(result.error, undefined);
  assert.equal(result.display, "grid");
  assert.notEqual(result.gap, "normal");
  assert.equal(result.trackCount, 4, result.gridTemplateColumns);
  assert.equal(result.firstFourSameRow, true, JSON.stringify(result.rects));
  assert.equal(result.firstFourIncrease, true, JSON.stringify(result.rects));
  assert.equal(result.fifthIsNextRow, true, JSON.stringify(result.rects));
});

test("GridCol col alias uses grid vars without generic grid-column vars", {
  skip: findChrome() ? false : "Chrome/Chromium is not available"
}, async () => {
  const chromePath = findChrome();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-gridcol-responsive-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;

  await writeFile(htmlFile, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; padding: 24px; }
    #root { width: 960px; }
    .probe-shell { min-height: 48px; box-sizing: border-box; border: 1px solid #777; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="${coreUrl}"></script>
  <script src="${uiUrl}"></script>
  <script>
    const finish = (result) => {
      document.body.setAttribute("data-result", encodeURIComponent(JSON.stringify(result)));
    };

    try {
      const UI = window._ || window.JSswift?.ui;
      const toolbar = UI.Toolbar({
        class: "probe-toolbar",
        gap: "sm",
        start: UI.Btn({ label: "A" }),
        end: UI.Btn({ label: "B" })
      });
      const col = UI.GridCol({
        class: "probe-shell",
        span: 12,
        tablet: { col: 5 },
        pc: { col: 4 },
        gap: "md"
      }, toolbar);
      const grid = UI.Grid({
        cols: 12,
        gap: "md",
        tablet: { cols: 12, gap: "lg" },
        pc: { cols: 12 }
      }, col, UI.GridCol({ col: 8 }, "side"));

      document.getElementById("root").appendChild(grid);

      setTimeout(() => {
        const gridStyle = getComputedStyle(grid);
        const colStyle = getComputedStyle(col);
        const toolbarStyle = getComputedStyle(toolbar);
        const gridRect = grid.getBoundingClientRect();
        const colRect = col.getBoundingClientRect();
        const toolbarRect = toolbar.getBoundingClientRect();
        finish({
          gridDisplay: gridStyle.display,
          gridGap: gridStyle.gap,
          gridTemplateColumns: gridStyle.gridTemplateColumns,
          colClassName: col.className,
          colAttr: col.getAttribute("col"),
          colGridColumn: colStyle.gridColumn,
          colBase: col.style.getPropertyValue("--jss-grid-col-base"),
          colTablet: col.style.getPropertyValue("--jss-grid-col-tablet"),
          colPc: col.style.getPropertyValue("--jss-grid-col-pc"),
          rspGridColumn: col.style.getPropertyValue("--jss-rsp-grid-column"),
          rspPcGridColumn: col.style.getPropertyValue("--jss-rsp-pc-grid-column"),
          toolbarDisplay: toolbarStyle.display,
          toolbarGap: toolbarStyle.gap,
          gridWidth: Math.round(gridRect.width),
          colWidth: Math.round(colRect.width),
          toolbarWidth: Math.round(toolbarRect.width)
        });
      }, 50);
    } catch (error) {
      finish({ error: String(error?.stack || error) });
    }
  </script>
</body>
</html>`, "utf8");

  const dom = await runChrome(chromePath, htmlFile);
  const result = readBrowserResult(dom);

  assert.equal(result.error, undefined);
  assert.equal(result.gridDisplay, "grid");
  assert.notEqual(result.gridGap, "normal");
  assert.equal(result.colAttr, null);
  assert.match(result.colGridColumn, /span 4/);
  assert.match(result.colBase, /span 12/);
  assert.match(result.colTablet, /span 5/);
  assert.match(result.colPc, /span 4/);
  assert.equal(result.rspGridColumn, "");
  assert.equal(result.rspPcGridColumn, "");
  assert.equal(result.colClassName.includes("jss-rsp-grid-column"), false);
  assert.equal(result.colClassName.includes("jss-rsp-pc-grid-column"), false);
  assert.equal(result.toolbarDisplay, "flex");
  assert.notEqual(result.toolbarGap, "normal");
  assert.ok(result.colWidth > 250 && result.colWidth < 360, JSON.stringify(result));
  assert.ok(result.toolbarWidth <= result.colWidth + 2, JSON.stringify(result));
});

test("Avatar applies common responsive props", {
  skip: findChrome() ? false : "Chrome/Chromium is not available"
}, async () => {
  const chromePath = findChrome();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-avatar-responsive-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;

  await writeFile(htmlFile, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; padding: 24px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="${coreUrl}"></script>
  <script src="${uiUrl}"></script>
  <script>
    const finish = (result) => {
      document.body.setAttribute("data-result", encodeURIComponent(JSON.stringify(result)));
    };

    try {
      const UI = window._ || window.JSswift?.ui;
      const avatar = UI.Avatar({
        label: "Probe",
        width: "40px",
        tablet: { width: "80px" }
      });

      document.getElementById("root").appendChild(avatar);

      const style = getComputedStyle(avatar);
      finish({
        className: avatar.className,
        width: style.width,
        rspWidth: avatar.style.getPropertyValue("--jss-rsp-width"),
        rspTabletWidth: avatar.style.getPropertyValue("--jss-rsp-tablet-width")
      });
    } catch (error) {
      finish({ error: String(error?.stack || error) });
    }
  </script>
</body>
</html>`, "utf8");

  const mobile = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 390, height: 844 }));
  const tablet = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 800, height: 900 }));

  assert.equal(mobile.error, undefined);
  assert.equal(tablet.error, undefined);
  assert.equal(mobile.className.includes("jss-rsp"), true);
  assert.equal(mobile.className.includes("jss-rsp-width"), true);
  assert.equal(mobile.className.includes("jss-rsp-tablet-width"), true);
  assert.equal(mobile.rspWidth, "40px");
  assert.equal(mobile.rspTabletWidth, "80px");
  assert.equal(mobile.width, "40px");
  assert.equal(tablet.width, "80px");
});

test("Nested GridCol does not inherit span variables from parent GridCol", {
  skip: findChrome() ? false : "Chrome/Chromium is not available"
}, async () => {
  const chromePath = findChrome();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-nested-gridcol-responsive-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;

  await writeFile(htmlFile, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; padding: 24px; }
    #root { width: 960px; }
    .inner-cell { min-height: 34px; border: 1px solid #777; box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="${coreUrl}"></script>
  <script src="${uiUrl}"></script>
  <script>
    const finish = (result) => {
      document.body.setAttribute("data-result", encodeURIComponent(JSON.stringify(result)));
    };

    try {
      const UI = window._ || window.JSswift?.ui;
      const childA = UI.GridCol({ class: "inner-cell inner-a" }, "A");
      const childB = UI.GridCol({ class: "inner-cell inner-b" }, "B");
      const innerGrid = UI.Grid({
        cols: 1,
        tablet: { cols: 2 },
        pc: { cols: 2 }
      }, childA, childB);
      const parentCol = UI.GridCol({ pc: { col: 7 } }, innerGrid);
      const outerGrid = UI.Grid({ cols: 1, pc: { cols: 12 } }, parentCol);

      document.getElementById("root").appendChild(outerGrid);

      const parentStyle = getComputedStyle(parentCol);
      const innerStyle = getComputedStyle(innerGrid);
      const childAStyle = getComputedStyle(childA);
      const childBStyle = getComputedStyle(childB);
      const childARect = childA.getBoundingClientRect();
      const childBRect = childB.getBoundingClientRect();
      finish({
        parentGridColumn: parentStyle.gridColumn,
        innerDisplay: innerStyle.display,
        innerTracks: innerStyle.gridTemplateColumns.split(" ").filter(Boolean).length,
        childAGridColumn: childAStyle.gridColumn,
        childBGridColumn: childBStyle.gridColumn,
        childABase: childA.style.getPropertyValue("--jss-grid-col-base"),
        childATablet: childA.style.getPropertyValue("--jss-grid-col-tablet"),
        childAPc: childA.style.getPropertyValue("--jss-grid-col-pc"),
        childBBase: childB.style.getPropertyValue("--jss-grid-col-base"),
        sameRow: Math.abs(childARect.top - childBRect.top) <= 2,
        secondAfterFirst: childBRect.left > childARect.left,
        childAWidth: Math.round(childARect.width),
        childBWidth: Math.round(childBRect.width)
      });
    } catch (error) {
      finish({ error: String(error?.stack || error) });
    }
  </script>
</body>
</html>`, "utf8");

  const result = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 1440, height: 900 }));

  assert.equal(result.error, undefined);
  assert.match(result.parentGridColumn, /span 7/);
  assert.equal(result.innerDisplay, "grid");
  assert.equal(result.innerTracks, 2);
  assert.doesNotMatch(result.childAGridColumn, /span 7/);
  assert.doesNotMatch(result.childBGridColumn, /span 7/);
  assert.equal(result.childABase, "auto");
  assert.match(result.childATablet, /--jss-grid-col-base/);
  assert.match(result.childAPc, /--jss-grid-col-tablet/);
  assert.equal(result.childBBase, "auto");
  assert.equal(result.sameRow, true, JSON.stringify(result));
  assert.equal(result.secondAfterFirst, true, JSON.stringify(result));
  assert.ok(Math.abs(result.childAWidth - result.childBWidth) <= 2, JSON.stringify(result));
});

test("Toolbar responsive gap and direction apply across mobile tablet and pc", {
  skip: findChrome() ? false : "Chrome/Chromium is not available"
}, async () => {
  const chromePath = findChrome();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-toolbar-responsive-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;

  await writeFile(htmlFile, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; padding: 24px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="${coreUrl}"></script>
  <script src="${uiUrl}"></script>
  <script>
    const finish = (result) => {
      document.body.setAttribute("data-result", encodeURIComponent(JSON.stringify(result)));
    };

    try {
      const UI = window._ || window.JSswift?.ui;
      const toolbar = UI.Toolbar({
        gap: "sm",
        direction: "column",
        tablet: { direction: "row", gap: "md" },
        pc: { gap: "lg" }
      }, UI.Btn({ label: "A" }), UI.Btn({ label: "B" }));

      document.getElementById("root").appendChild(toolbar);

      const style = getComputedStyle(toolbar);
      const rootStyle = getComputedStyle(document.documentElement);
      finish({
        className: toolbar.className,
        styleGap: toolbar.style.gap,
        gap: style.gap,
        flexDirection: style.flexDirection,
        gapSm: rootStyle.getPropertyValue("--jss-gap-sm").trim(),
        gapMd: rootStyle.getPropertyValue("--jss-gap-md").trim(),
        gapLg: rootStyle.getPropertyValue("--jss-gap-lg").trim(),
        rspGap: toolbar.style.getPropertyValue("--jss-rsp-gap"),
        rspTabletGap: toolbar.style.getPropertyValue("--jss-rsp-tablet-gap"),
        rspPcGap: toolbar.style.getPropertyValue("--jss-rsp-pc-gap")
      });
    } catch (error) {
      finish({ error: String(error?.stack || error) });
    }
  </script>
</body>
</html>`, "utf8");

  const mobile = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 390, height: 844 }));
  const tablet = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 800, height: 900 }));
  const pc = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 1440, height: 900 }));

  assert.equal(mobile.error, undefined);
  assert.equal(tablet.error, undefined);
  assert.equal(pc.error, undefined);

  assert.equal(mobile.styleGap, "");
  assert.equal(tablet.styleGap, "");
  assert.equal(pc.styleGap, "");

  assert.equal(mobile.flexDirection, "column");
  assert.equal(tablet.flexDirection, "row");
  assert.equal(pc.flexDirection, "row");

  assert.equal(mobile.gap, mobile.gapSm);
  assert.equal(tablet.gap, tablet.gapMd);
  assert.equal(pc.gap, pc.gapLg);
});

test("Card sections apply responsive gap padding justify and direction", {
  skip: findChrome() ? false : "Chrome/Chromium is not available"
}, async () => {
  const chromePath = findChrome();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-card-section-responsive-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;

  await writeFile(htmlFile, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; padding: 24px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="${coreUrl}"></script>
  <script src="${uiUrl}"></script>
  <script>
    const finish = (result) => {
      document.body.setAttribute("data-result", encodeURIComponent(JSON.stringify(result)));
    };

    try {
      const UI = window._ || window.JSswift?.ui;
      const header = UI.cardHeader({
        gap: "sm",
        tablet: { gap: "md", justify: "space-between" }
      }, UI.span("Title"), UI.Btn({ label: "Action" }));
      const body = UI.cardBody({
        padding: "sm",
        tablet: { padding: "lg" }
      }, "Body");
      const footer = UI.cardFooter({
        direction: "column",
        tablet: { direction: "row" }
      }, UI.Btn({ label: "Cancel" }), UI.Btn({ label: "Save" }));
      const card = UI.Card({
        display: "flex",
        direction: "column",
        gap: "sm",
        tablet: { gap: "md" }
      }, header, body, footer);

      document.getElementById("root").appendChild(card);

      const rootStyle = getComputedStyle(document.documentElement);
      const headerStyle = getComputedStyle(header);
      const bodyStyle = getComputedStyle(body);
      const footerStyle = getComputedStyle(footer);
      const cardStyle = getComputedStyle(card);
      finish({
        headerClassName: header.className,
        headerStyleGap: header.style.gap,
        headerGap: headerStyle.gap,
        headerJustify: headerStyle.justifyContent,
        bodyStylePadding: body.style.padding,
        bodyPaddingTop: bodyStyle.paddingTop,
        footerStyleDirection: footer.style.flexDirection,
        footerDirection: footerStyle.flexDirection,
        cardDisplay: cardStyle.display,
        cardGap: cardStyle.gap,
        gapSm: rootStyle.getPropertyValue("--jss-gap-sm").trim(),
        gapMd: rootStyle.getPropertyValue("--jss-gap-md").trim(),
        pSm: rootStyle.getPropertyValue("--jss-p-sm").trim(),
        pLg: rootStyle.getPropertyValue("--jss-p-lg").trim()
      });
    } catch (error) {
      finish({ error: String(error?.stack || error) });
    }
  </script>
</body>
</html>`, "utf8");

  const mobile = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 390, height: 844 }));
  const tablet = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 800, height: 900 }));
  const pc = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 1440, height: 900 }));

  assert.equal(mobile.error, undefined);
  assert.equal(tablet.error, undefined);
  assert.equal(pc.error, undefined);

  assert.equal(mobile.headerStyleGap, "");
  assert.equal(tablet.headerStyleGap, "");
  assert.equal(pc.headerStyleGap, "");
  assert.equal(mobile.headerGap, mobile.gapSm);
  assert.equal(tablet.headerGap, tablet.gapMd);
  assert.equal(pc.headerGap, pc.gapMd);
  assert.equal(tablet.headerJustify, "space-between");
  assert.equal(pc.headerJustify, "space-between");

  assert.equal(mobile.bodyStylePadding, "");
  assert.equal(tablet.bodyStylePadding, "");
  assert.equal(pc.bodyStylePadding, "");
  assert.equal(mobile.bodyPaddingTop, mobile.pSm);
  assert.equal(tablet.bodyPaddingTop, tablet.pLg);
  assert.equal(pc.bodyPaddingTop, pc.pLg);

  assert.equal(mobile.footerStyleDirection, "");
  assert.equal(tablet.footerStyleDirection, "");
  assert.equal(pc.footerStyleDirection, "");
  assert.equal(mobile.footerDirection, "column");
  assert.equal(tablet.footerDirection, "row");
  assert.equal(pc.footerDirection, "row");

  assert.equal(mobile.cardDisplay, "flex");
  assert.equal(mobile.cardGap, mobile.gapSm);
  assert.equal(tablet.cardGap, tablet.gapMd);
  assert.equal(pc.cardGap, pc.gapMd);
});

test("Menu responsive width stays clamped inside mobile viewport", {
  skip: findChrome() ? false : "Chrome/Chromium is not available"
}, async () => {
  const chromePath = findChrome();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-menu-mobile-clamp-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;

  await writeFile(htmlFile, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; }
    #root { padding: 16px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="${coreUrl}"></script>
  <script src="${uiUrl}"></script>
  <script>
    const finish = (result) => {
      document.body.setAttribute("data-result", encodeURIComponent(JSON.stringify(result)));
    };

    try {
      const UI = window._ || window.JSswift?.ui;
      const menu = UI.Menu({
        width: "calc(100vw - 32px)",
        tablet: { width: "320px" },
        pc: { width: "320px" },
        items: [
          { label: "Apri preview", icon: "visibility" }
        ]
      });
      const btn = UI.Btn({ width: "100%", tablet: { width: "auto" } }, "Azioni release");
      document.getElementById("root").appendChild(btn);
      menu.bind(btn);
      const entry = menu.open(btn);

      requestAnimationFrame(() => {
        const panel = entry?.panel;
        const rect = panel.getBoundingClientRect();
        finish({
          className: panel.className,
          menuWidth: panel.style.getPropertyValue("--jss-menu-width"),
          panelWidth: Math.round(rect.width),
          left: Number(rect.left.toFixed(2)),
          right: Number(rect.right.toFixed(2)),
          viewportWidth: window.innerWidth
        });
      });
    } catch (error) {
      finish({ error: String(error?.stack || error) });
    }
  </script>
</body>
</html>`, "utf8");

  const result = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 390, height: 844 }));

  assert.equal(result.error, undefined);
  assert.equal(result.className.includes("jss-rsp-width"), true);
  assert.equal(result.className.includes("jss-rsp-tablet-width"), true);
  assert.equal(result.className.includes("jss-rsp-pc-width"), true);
  assert.equal(result.menuWidth, "calc(100vw - 32px)");
  assert.ok(result.panelWidth >= 300 && result.panelWidth < result.viewportWidth, JSON.stringify(result));
  assert.ok(result.left >= 8, JSON.stringify(result));
  assert.ok(result.right <= result.viewportWidth - 8, JSON.stringify(result));
});

test("ContextMenu responsive width stays clamped inside mobile viewport", {
  skip: findChrome() ? false : "Chrome/Chromium is not available"
}, async () => {
  const chromePath = findChrome();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-context-menu-mobile-clamp-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;

  await writeFile(htmlFile, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; }
    #root { padding: 16px; }
    #surface { min-height: 120px; border: 1px solid #999; }
  </style>
</head>
<body>
  <div id="root">
    <div id="surface"></div>
  </div>
  <script src="${coreUrl}"></script>
  <script src="${uiUrl}"></script>
  <script>
    const finish = (result) => {
      document.body.setAttribute("data-result", encodeURIComponent(JSON.stringify(result)));
    };

    try {
      const UI = window._ || window.JSswift?.ui;
      const surface = document.getElementById("surface");
      const ctx = UI.ContextMenu({
        width: "calc(100vw - 32px)",
        tablet: { width: "320px" },
        pc: { width: "320px" },
        items: [
          { label: "Apri preview", icon: "visibility" }
        ]
      });
      ctx.bind(surface);
      const entry = ctx.openAt(85, 80);

      requestAnimationFrame(() => {
        const panel = entry?.panel;
        const rect = panel.getBoundingClientRect();
        finish({
          className: panel.className,
          menuWidth: panel.style.getPropertyValue("--jss-menu-width"),
          panelWidth: Math.round(rect.width),
          left: Number(rect.left.toFixed(2)),
          right: Number(rect.right.toFixed(2)),
          viewportWidth: window.innerWidth
        });
      });
    } catch (error) {
      finish({ error: String(error?.stack || error) });
    }
  </script>
</body>
</html>`, "utf8");

  const result = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 390, height: 844 }));

  assert.equal(result.error, undefined);
  assert.equal(result.className.includes("jss-context-menu-panel"), true);
  assert.equal(result.className.includes("jss-rsp-width"), true);
  assert.equal(result.className.includes("jss-rsp-tablet-width"), true);
  assert.equal(result.className.includes("jss-rsp-pc-width"), true);
  assert.equal(result.menuWidth, "calc(100vw - 32px)");
  assert.ok(result.panelWidth >= 300 && result.panelWidth < result.viewportWidth, JSON.stringify(result));
  assert.ok(result.left >= 8, JSON.stringify(result));
  assert.ok(result.right <= result.viewportWidth - 8, JSON.stringify(result));
});

test("Menu repositions when panel width grows after open", {
  skip: !findChrome() ? "Chrome/Chromium is not available" : (!hasDevtoolsWebSocket() ? "Node WebSocket API is not available" : false)
}, async () => {
  const chromePath = findChrome();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-menu-resize-clamp-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;

  await writeFile(htmlFile, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; }
    #root { padding: 16px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="${coreUrl}"></script>
  <script src="${uiUrl}"></script>
  <script>
    const finish = (result) => {
      document.body.setAttribute("data-result", encodeURIComponent(JSON.stringify(result)));
    };

    try {
      const UI = window._ || window.JSswift?.ui;
      const menu = UI.Menu({
        width: "220px",
        items: [
          { label: "Apri preview", icon: "visibility" }
        ]
      });
      const btn = UI.Btn("Azioni release");
      document.getElementById("root").appendChild(btn);
      menu.bind(btn);
      const entry = menu.open(btn);
      const panel = entry?.panel;

      requestAnimationFrame(() => {
        panel.style.width = "calc(100vw - 32px)";
        panel.style.maxWidth = "calc(100vw - 32px)";
        requestAnimationFrame(() => {
          const rect = panel.getBoundingClientRect();
          finish({
            viewportWidth: window.visualViewport ? window.visualViewport.width : window.innerWidth,
            panelWidth: Math.round(rect.width),
            left: Number(rect.left.toFixed(2)),
            right: Number(rect.right.toFixed(2))
          });
        });
      });
    } catch (error) {
      finish({ error: String(error?.stack || error) });
    }
  </script>
</body>
</html>`, "utf8");

  // Await the result in a live page: virtual-time dump-dom may end before RAF callbacks.
  const result = await runChromeMobileEval(chromePath, pathToFileURL(htmlFile).href, `(() => new Promise(resolve => {
    const deadline = Date.now() + 4000;
    const read = () => {
      const encoded = document.body?.getAttribute("data-result");
      if (encoded) return resolve(JSON.parse(decodeURIComponent(encoded)));
      if (Date.now() > deadline) return resolve({ error: "menu-measurement-timeout" });
      setTimeout(read, 25);
    };
    read();
  }))()`, { width: 390, height: 844 });

  assert.equal(result.error, undefined);
  assert.ok(result.panelWidth >= 300 && result.panelWidth < result.viewportWidth, JSON.stringify(result));
  assert.ok(result.left >= 8, JSON.stringify(result));
  assert.ok(result.right <= result.viewportWidth - 8, JSON.stringify(result));
});

test("Dialog fullscreen stays inside the mobile viewport without overscan", {
  skip: !findChrome()
    ? "Chrome/Chromium is not available"
    : (!hasDevtoolsWebSocket() ? "Node WebSocket API is not available" : false)
}, async () => {
  const chromePath = findChrome();
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-dialog-fullscreen-mobile-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;

  await writeFile(htmlFile, `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="${cssUrl}">
  <style>
    body { margin: 0; }
  </style>
</head>
<body>
  <script src="${coreUrl}"></script>
  <script src="${uiUrl}"></script>
  <script>
    const finish = (result) => {
      document.body.setAttribute("data-result", encodeURIComponent(JSON.stringify(result)));
    };

    try {
      const UI = window._ || window.JSswift?.ui;
      const dialog = UI.Dialog({
        size: "full",
        fullscreen: true,
        state: "secondary",
        title: "Workspace go-live",
        subtitle: "Probe",
        bodyMaxHeight: "78vh",
        stickyHeader: true,
        stickyActions: true,
        scrollable: true,
        actions: [
          UI.Btn({ label: "Annulla" }),
          UI.Btn({ color: "primary", label: "Pubblica" })
        ],
        content: UI.div(
          { style: { minHeight: "1200px" } },
          "Contenuto fullscreen"
        )
      });

      dialog.open();

      setTimeout(() => {
        const panel = document.querySelector(".jss-overlay-panel.jss-dialog");
        const rect = panel.getBoundingClientRect();
        const style = getComputedStyle(panel);
        const vv = window.visualViewport;
        finish({
          className: panel.className,
          left: Number(rect.left.toFixed(2)),
          right: Number(rect.right.toFixed(2)),
          top: Number(rect.top.toFixed(2)),
          bottom: Number(rect.bottom.toFixed(2)),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          viewportWidth: Math.round((vv && vv.width) || window.innerWidth),
          viewportHeight: Math.round((vv && vv.height) || window.innerHeight),
          position: style.position,
          boxSizing: style.boxSizing,
          transform: style.transform,
          borderTopWidth: style.borderTopWidth,
          borderBottomWidth: style.borderBottomWidth
        });
      }, 300);
    } catch (error) {
      finish({ error: String(error?.stack || error) });
    }
  </script>
</body>
</html>`, "utf8");

  const result = await runChromeMobileEval(chromePath, pathToFileURL(htmlFile).href, `(() => new Promise((resolve) => {
    const start = Date.now();
    const measure = () => {
      const panel = document.querySelector(".jss-overlay-panel.jss-dialog");
      if (!panel) {
        if ((Date.now() - start) > 4000) {
          resolve({
            error: "panel-not-found",
            bodyResult: document.body?.getAttribute("data-result") || null,
            readyState: document.readyState
          });
          return;
        }
        setTimeout(measure, 50);
        return;
      }
      const rect = panel.getBoundingClientRect();
      const style = getComputedStyle(panel);
      const vv = window.visualViewport;
      resolve({
        className: panel.className,
        left: Number(rect.left.toFixed(2)),
        right: Number(rect.right.toFixed(2)),
        top: Number(rect.top.toFixed(2)),
        bottom: Number(rect.bottom.toFixed(2)),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        viewportWidth: Math.round((vv && vv.width) || window.innerWidth),
        viewportHeight: Math.round((vv && vv.height) || window.innerHeight),
        position: style.position,
        boxSizing: style.boxSizing,
        transform: style.transform,
        borderTopWidth: style.borderTopWidth,
        borderBottomWidth: style.borderBottomWidth,
        inset: style.inset
      });
    };
    setTimeout(measure, 500);
  }))()`);

  assert.equal(result.error, undefined, JSON.stringify(result));
  assert.equal(result.className.includes("fullscreen"), true);
  assert.equal(result.position, "fixed");
  assert.equal(result.boxSizing, "border-box");
  assert.equal(result.borderTopWidth, "0px");
  assert.equal(result.borderBottomWidth, "0px");
  assert.equal(result.left >= 0, true, JSON.stringify(result));
  assert.equal(result.top >= 0, true, JSON.stringify(result));
  assert.equal(result.right <= result.viewportWidth, true, JSON.stringify(result));
  assert.equal(result.bottom <= result.viewportHeight, true, JSON.stringify(result));
  assert.equal(result.width, result.viewportWidth, JSON.stringify(result));
  assert.equal(result.height <= result.viewportHeight, true, JSON.stringify(result));
});


test("Select commits user selection to rod and signal models", {
  skip: !findChrome() ? "Chrome/Chromium is not available" : (!hasDevtoolsWebSocket() ? "Node WebSocket API is not available" : false)
}, async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-select-signal-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const asset = name => pathToFileURL(path.join(ROOT_DIR, name)).href;
  await writeFile(htmlFile, `<!doctype html><html><head>
    <link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}">
    </head><body><div id="app"></div>
    <script src="${asset('packages/core/dist/cms.js')}"></script>
    <script src="${asset('packages/ui/dist/ui.js')}"></script>
    <script>
      window.samples = [];
      for (const mode of ['full', 'pair', 'rod']) {
        const model = mode === 'rod' ? _.rod('') : _.signal('');
        const read = () => mode === 'rod' ? model.value : model[0]();
        const write = value => { if (mode === 'rod') model.value = value; else model[1](value); };
        const select = _.Select({ label: 'Categoria', model: mode === 'pair' ? model.slice(0, 2) : model,
          options: [{value:'',label:'Seleziona'}, {value:'Casa',label:'Casa'}, {value:'Ufficio',label:'Ufficio'}] });
        let saved = null;
        const save = _.Button({onClick: () => { saved = read(); }}, 'Salva');
        document.getElementById('app').append(select, save);
        window.samples.push({read, write, select, save, saved: () => saved});
      }
    </script></body></html>`);
  const result = await runChromeMobileEval(findChrome(), pathToFileURL(htmlFile).href, `
    (async () => {
      const wait = () => new Promise(resolve => setTimeout(resolve, 50));
      const deadline = Date.now() + 4000;
      while (!window.samples) { if (Date.now() > deadline) throw Error('samples missing'); await wait(); }
      const results = [];
      for (const sample of samples) {
        sample.select.querySelector('.jss-select-control').click();
        await wait();
        const option = [...document.querySelectorAll('.jss-select-option')].find(node => node.textContent === 'Casa' && node.getBoundingClientRect().width > 0);
        if (!option) throw Error('Casa option missing');
        option.click();
        sample.save.click();
        const selected = sample.read();
        const saved = sample.saved();
        sample.write('Ufficio');
        await wait();
        results.push({selected, saved, display: sample.select.querySelector('.jss-select-value').textContent});
      }
      return results;
    })().catch(error => ({error: String(error.stack || error)}))`);
  assert.deepEqual(result, [
    {selected:'Casa', saved:'Casa', display:'Ufficio'},
    {selected:'Casa', saved:'Casa', display:'Ufficio'},
    {selected:'Casa', saved:'Casa', display:'Ufficio'}
  ]);
});


test("Public field APIs focus controls and synchronize accessibility and constraints", {
  skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-field-api-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const asset = name => pathToFileURL(path.join(ROOT_DIR, name)).href;
  await writeFile(htmlFile, `<!doctype html><body><div id="app"></div>
    <script src="${asset('packages/core/dist/cms.js')}"></script>
    <script src="${asset('packages/ui/dist/ui.js')}"></script>
    <script>
      window.error = _.rod('');
      window.input = _.Input({label:'Prezzo', required:true, min:0, max:100, step:'any', error,
        ariaDescribedBy:'error-text'});
      window.select = _.Select({label:'Categoria', ariaLabel:'Categoria prodotto', required:true,
        options:[{value:'Casa',label:'Casa'}]});
      app.append(input, select, _.p({id:'error-text'}, 'Errore'));
    </script></body>`);
  const result = await runChromeMobileEval(findChrome(), pathToFileURL(htmlFile).href, `
    (async () => {
      while (!window.input) await new Promise(r => setTimeout(r, 20));
      input.focus();
      const native = document.activeElement;
      const initial = native.getAttribute('aria-invalid');
      error.value = 'Prezzo non valido';
      await new Promise(r => setTimeout(r, 50));
      const linked = native.getAttribute('aria-describedby').split(' ').some(id => document.getElementById(id)?.textContent === 'Prezzo non valido');
      error.value = ''; await new Promise(r => setTimeout(r, 50));
      const cleared = native.getAttribute('aria-describedby') === 'error-text';
      error.value = 'Prezzo non valido'; await new Promise(r => setTimeout(r, 50));
      const attrs = {linked,cleared,tag:native.tagName, label:native.getAttribute('aria-label'), min:native.min,
        max:native.max, step:native.step, required:native.required, initial,
        invalid:native.getAttribute('aria-invalid'), described:native.getAttribute('aria-describedby').split(' ')[0]};
      select.focus();
      return {attrs, role:document.activeElement.getAttribute('role'),
        label:document.activeElement.getAttribute('aria-label'),
        required:document.activeElement.getAttribute('aria-required'),
        expanded:document.activeElement.getAttribute('aria-expanded')};
    })()`);
  assert.deepEqual(result, {attrs:{linked:true,cleared:true,tag:'INPUT',label:'Prezzo',min:'0',max:'100',step:'any',required:true,
    initial:'false',invalid:'true',described:'error-text'}, role:'combobox',label:'Categoria prodotto',
    required:'true',expanded:'false'});
});


test("Documented CRUD validates, edits, binds rod, restores focus and survives reload", {
 skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
 const tmp = await mkdtemp(path.join(os.tmpdir(), 'jsswift-crud-'));
 const html = path.join(tmp, 'index.html');
 const doc = await readFile(path.join(ROOT_DIR,'documentions/examples/crud.md'),'utf8');
 const code = doc.match(/```js\n([\s\S]*?)\n```/)[1];
 const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html, `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><div id="app"></div><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>${code}</script>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(async () => {
  const wait = () => new Promise(r => setTimeout(r,350));
  const click = id => { const button = document.getElementById(id); button.focus(); button.click(); };
  click('next'); const paged = host.textContent.includes('Prodotto 6'); click('previous');
  click('add-product'); await wait();
  const initialFocus = document.activeElement.getAttribute('aria-label') === 'Nome';
  click('save-product'); await wait();
  const invalid = errors.name.value !== '' && document.activeElement.getAttribute('aria-invalid') === 'true';
  const errorAssociated = document.activeElement.getAttribute('aria-describedby').split(' ').some(id => document.getElementById(id)?.textContent === errors.name.value);
  fields.name.focus(); const input = document.activeElement; input.value = 'Nuovo'; input.dispatchEvent(new Event('input',{bubbles:true}));
  fields.category.querySelector('.jss-select-control').click(); await wait();
  [...document.querySelectorAll('.jss-select-option')].find(n => n.textContent==='Casa' && n.getBoundingClientRect().width).click();
  const categoryBound = models.category.value === 'Casa';
  models.price.value = '-1'; models.quantity.value = '1.5'; click('save-product');
  const numeric = !!errors.price.value && !!errors.quantity.value;
  models.price.value = '12'; models.quantity.value = '3';
  const originalWrite = Storage.prototype.setItem;
  Storage.prototype.setItem = function() { throw new Error('storage blocked'); };
  let storageFailure;
  try { click('save-product'); storageFailure = dialog.isOpen() && rows.length === 6 && notice.textContent === 'Salvataggio non riuscito'; }
  finally { Storage.prototype.setItem = originalWrite; }
  click('save-product'); await wait();
  const added = rows.length === 7 && rows[6].category === 'Casa';
  const focusRestored = document.activeElement.id === 'add-product';
  if (!document.getElementById('edit-1')) click('previous');
  click('edit-1'); await wait(); models.name.value = 'Modificato'; click('save-product'); await wait();
  const edited = rows[0].name === 'Modificato' && document.activeElement.id === 'edit-1';
  click('add-product'); await wait();
  const panel = document.querySelector('[role=dialog]');
  const buttons = panel.querySelectorAll('button'); buttons[buttons.length-1].focus();
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
  const trapped = panel.contains(document.activeElement);
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); await wait();
  const escapeDeadline = Date.now() + 2000;
  while ((dialog.isOpen() || document.activeElement.id !== 'add-product') && Date.now() < escapeDeadline) await wait();
  const escaped = !dialog.isOpen() && document.activeElement.id === 'add-product';
  search.focus(); const q = document.activeElement; q.value = 'MODIFICATO'; q.dispatchEvent(new Event('input',{bubbles:true}));
  const searched = host.textContent.includes('Modificato') && !host.textContent.includes('Prodotto 2');
  q.value = ''; q.dispatchEvent(new Event('input',{bubbles:true}));
  filter.querySelector('.jss-select-control').click(); await wait();
  [...document.querySelectorAll('.jss-select-option')].find(n => n.textContent==='Ufficio' && n.getBoundingClientRect().width).click();
  const filtered = host.textContent.includes('Prodotto 2') && !host.textContent.includes('Modificato');
  const mobile = document.documentElement.scrollWidth <= innerWidth;
  return {initialFocus,paged,invalid,errorAssociated,storageFailure,categoryBound,numeric,added,focusRestored,edited,escaped,searched,filtered,trapped,mobile};
 })().catch(e => ({error:String(e.stack || e)}))`, {afterReload:`({count:rows.length,name:rows[0].name,category:rows[6]?.category})`});
 assert.deepEqual(result,{before:{initialFocus:true,paged:true,invalid:true,errorAssociated:true,storageFailure:true,categoryBound:true,numeric:true,added:true,focusRestored:true,edited:true,escaped:true,searched:true,filtered:true,trapped:true,mobile:true},after:{count:7,name:'Modificato',category:'Casa'}});
});


test("Dialog default autofocus and explicit opt-out remain supported", {
 skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
 const tmp = await mkdtemp(path.join(os.tmpdir(), 'jsswift-default-focus-'));
 const html = path.join(tmp,'index.html');
 const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html, `<!doctype html><body><button id="trigger">Apri</button><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(async () => {
  const wait = () => new Promise(r => setTimeout(r,400));
  const trigger = document.getElementById('trigger'); trigger.focus();
  const a = _.Dialog({title:'Default',content:_.Input({label:'Nome'})}); a.open(); await wait();
  const defaultFocused = document.activeElement.getAttribute('aria-label') === 'Chiudi dialog';
  a.close(); await wait(); trigger.focus();
  const b = _.Dialog({title:'Opt out',autoFocus:false,content:_.Input({label:'Nome'})}); b.open(); await wait();
  const optedOut = document.activeElement === trigger; b.close(); await wait();
  return {defaultFocused,optedOut};
 })()`);
 assert.deepEqual(result,{defaultFocused:true,optedOut:true});
});


test("Documented focus CSS outlines only the focus-visible control", {
 skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
 const tmp = await mkdtemp(path.join(os.tmpdir(),'jsswift-focus-css-'));
 const html = path.join(tmp,'index.html');
 const guide = await readFile(path.join(ROOT_DIR,'documentions/AI.md'),'utf8');
 const css = guide.match(/```css\n([\s\S]*?)\n```/)[1];
 await writeFile(html, `<!doctype html><style>${css}</style><input id="first" aria-label="Nome"><button id="second">Secondo</button><button id="disabled" disabled>Disabilitato</button><a id="link" href="#">Link</a>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(() => {
  const width = id => { const s = getComputedStyle(document.getElementById(id)); return s.outlineStyle === 'none' ? '0px' : s.outlineWidth; };
  const before = ['first','second','disabled','link'].map(width);
  document.getElementById('first').focus();
  return {before,visible:document.getElementById('first').matches(':focus-visible'), after:['first','second','disabled','link'].map(width)};
 })()`, {focusEmulation:true});
 assert.deepEqual(result,{before:['0px','0px','0px','0px'],visible:true,after:['3px','0px','0px','0px']});
});


test("Table hideStatus omits only the status region and preserves default counts", {
 skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
 const tmp = await mkdtemp(path.join(os.tmpdir(), 'jsswift-table-status-'));
 const html = path.join(tmp, 'index.html');
 const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html, `<!doctype html><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(() => {
 const base = {rows:[{name:'Casa'}],columns:[{key:'name',label:'Nome'}],toolbarStart:'Toolbar',status:'Custom status'};
 const normal = _.Table(base), hidden = _.Table({...base,hideStatus:true});
 document.body.append(normal,hidden);
 return {normal:!!normal.querySelector('.jss-table-status'),custom:normal.textContent.includes('Custom status'),
 hidden:!!hidden.querySelector('.jss-table-status'),hiddenCustom:hidden.textContent.includes('Custom status'),
 toolbar:!!hidden.querySelector('.jss-table-toolbar'),head:!!hidden.querySelector('thead'),rows:hidden.querySelectorAll('tbody tr').length,
 leaked:hidden.hasAttribute('hideStatus')};
 })()`);
 assert.deepEqual(result,{normal:true,custom:true,hidden:false,hiddenCustom:false,toolbar:true,head:true,rows:1,leaked:false});
});


test("Repeated Input/Textarea unmount releases shared rod callbacks", {
 skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
 const tmp = await mkdtemp(path.join(os.tmpdir(), 'jsswift-field-cleanup-'));
 const html = path.join(tmp, 'index.html');
 const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html, `<!doctype html><div id="host"></div><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(async () => {
 const model=_.rod('first'), error=_.rod(''), baseActions=model._actions.length, baseHooks=model._disposeHooks.length;
 const controls=[];
 for(let i=0;i<20;i++) {
  const input=_.Input({label:'Nome',model,error}), textarea=_.Textarea({label:'Note',model,error});
  _.mount('#host',_.div({},input,textarea));
  input.focus(); controls.push(document.activeElement);
  _.mount('#host',_.div());
 }
 model.value='after'; error.value='Error'; await new Promise(r=>setTimeout(r,50));
 return {actions:model._actions.length-baseActions,hooks:model._disposeHooks.length-baseHooks,disposed:model._disposed,unchanged:controls.every(c=>c.value==='first')};
 })()`);
 assert.deepEqual(result,{actions:0,hooks:0,disposed:false,unchanged:true});
});

test("Autofill timers and Table/Layout rod watchers stop on unmount", {
 skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
 const tmp = await mkdtemp(path.join(os.tmpdir(), 'jsswift-autofill-cleanup-'));
 const html = path.join(tmp, 'index.html');
 const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html, `<!doctype html><div id="host"></div><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(async () => {
 const query=_.rod(''),drawer=_.rod(true),nav=_.rod(true);
 const baseline=[query,drawer,nav].map(r=>r._actions.length);
 let staleEvents=0;
 for(let i=0;i<10;i++) {
  const raw=_.InputRaw(), field=_.Input({label:'Nome',onInput:()=>staleEvents++});
  _.mount('#host',_.div({},raw,field,_.Table({rows:[{name:'Casa'}],columns:[{key:'name'}],searchModel:query}),_.Layout({drawerOpen:drawer,navOpen:nav})));
  field.focus(); raw.value='autofilled'; field._input.value='autofilled';
  raw.addEventListener('input',()=>staleEvents++);
  _.mount('#host',_.div());
 }
 await new Promise(r=>setTimeout(r,1400));
 return {staleEvents,watchers:[query,drawer,nav].map((r,i)=>r._actions.length-baseline[i])};
 })()`);
 assert.deepEqual(result,{staleEvents:0,watchers:[0,0,0]});
});

test("Detached field attributes and Table rendering stop tracking rods", {
 skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
 const tmp = await mkdtemp(path.join(os.tmpdir(), 'jsswift-effect-cleanup-'));
 const html = path.join(tmp, 'index.html');
 const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html, `<!doctype html><div id="host"></div><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(async () => {
 const required=_.rod(false),rows=_.rod([{name:'First'}]);
 const field=_.Input({label:'Nome',required}),table=_.Table({rows:()=>rows.value,columns:[{key:'name'}]});
 _.mount('#host',_.div({},field,table));field.focus();const control=document.activeElement;
 required.value=true;rows.value=[{name:'Second'}];await new Promise(r=>setTimeout(r,50));
 const live=control.required && table.textContent.includes('Second');
 _.mount('#host',_.div());
 required.value=false;rows.value=[{name:'Third'}];await new Promise(r=>setTimeout(r,50));
 return {live,detachedRequired:control.required,detachedTable:table.textContent.includes('Second')&&!table.textContent.includes('Third')};
 })()`);
 assert.deepEqual(result,{live:true,detachedRequired:true,detachedTable:true});
});

test("Overlay coalesces resize bursts and cancels pending positioning on close", {
 skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
 const tmp = await mkdtemp(path.join(os.tmpdir(), 'jsswift-overlay-measure-'));
 const html = path.join(tmp, 'index.html');
 const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html, `<!doctype html><button id="anchor">Anchor</button><script src="${asset('packages/core/dist/cms.js')}"></script>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(async () => {
 const anchor=document.getElementById('anchor');const original=anchor.getBoundingClientRect.bind(anchor);let reads=0;
 anchor.getBoundingClientRect=()=>{reads++;return original();};
 const panel=document.createElement('div');panel.textContent='Panel';
 const entry=JSswift.overlay.open(panel,{anchorEl:anchor,autoFocus:false});
 await new Promise(r=>setTimeout(r,100));reads=0;
 for(let i=0;i<20;i++)window.dispatchEvent(new Event('resize'));
 const synchronous=reads;
 await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
 const burst=reads;
 window.dispatchEvent(new Event('resize'));entry.close();reads=0;
 for(let i=0;i<20;i++)window.dispatchEvent(new Event('resize'));
 await new Promise(r=>setTimeout(r,100));
 return {synchronous,burst,afterClose:reads};
 })()`);
 assert.deepEqual(result,{synchronous:0,burst:1,afterClose:0});
});

test("Select/Search release models and effects and ignore late async results", {
 skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
 const tmp = await mkdtemp(path.join(os.tmpdir(), 'jsswift-select-search-cleanup-'));
 const html = path.join(tmp, 'index.html');
 const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html, `<!doctype html><div id="host"></div><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(async () => {
 const wait=()=>new Promise(r=>setTimeout(r,60));
 const model=_.rod('Casa'), filterable=_.rod(true), disabled=_.rod(false);
 const baseline=[model,filterable].map(r=>r._actions.length);
 const saved=[];
 for(let i=0;i<10;i++) {
  const select=_.Select({label:'Categoria',model,filterable,disabled,options:['Casa','Ufficio']});
  const search=_.Search({label:'Ricerca',model,disabled,items:['Casa','Ufficio']});
  _.mount('#host',_.div({},select,search)); saved.push([select,search]);
  _.mount('#host',_.div());
 }
 const snapshots=saved.map(pair=>pair.map(n=>n.innerHTML));
 model.value='Ufficio';filterable.value=false;disabled.value=true;await wait();
 const unchanged=saved.every((pair,i)=>pair.every((n,j)=>n.innerHTML===snapshots[i][j]));
 let resolveSearch,resolveOptions,results=0;
 const options=new Promise(r=>resolveOptions=r);
 const select=_.Select({label:'Async',options:()=>options});
 const search=_.Search({label:'Async search',value:'Casa',items:()=>new Promise(r=>resolveSearch=r),onResults:()=>results++});
 _.mount('#host',_.div({},select,search));
 const pending=search._searchNow();await wait();
 _.mount('#host',_.div());const before=select.innerHTML;
 resolveOptions(['Late']);resolveSearch(['Casa']);await pending;await wait();
 return {watchers:[model,filterable].map((r,i)=>r._actions.length-baseline[i]),unchanged,results,optionsUnchanged:select.innerHTML===before,modelDisposed:model._disposed,portals:document.querySelectorAll('.jss-search-menu,.jss-select-menu').length};
 })()`);
 assert.deepEqual(result,{watchers:[0,0],unchanged:true,results:0,optionsUnchanged:true,modelDisposed:false,portals:0});
});

test("Select/Search signal model effects stop after lifecycle disposal", {
 skip: !findChrome() ? "Chrome unavailable" : (!hasDevtoolsWebSocket() ? "WebSocket unavailable" : false)
}, async () => {
 const tmp = await mkdtemp(path.join(os.tmpdir(), 'jsswift-signal-cleanup-'));
 const html = path.join(tmp, 'index.html');
 const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html, `<!doctype html><div id="host"></div><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(async () => {
 const wait=()=>new Promise(r=>setTimeout(r,60));
 const [get,set]=_.signal('Casa');let reads=0;
 const model=[()=>{reads++;return get();},set];
 const select=_.Select({label:'Categoria',model,options:['Casa','Ufficio']});
 const search=_.Search({label:'Ricerca',model,items:['Casa','Ufficio']});
 _.mount('#host',_.div({},select,search));set('Ufficio');await wait();
 const live=select.textContent.includes('Ufficio')&&search._input.value==='Ufficio';
 _.mount('#host',_.div());const before=reads;set('Casa');await wait();
 return {live,readsStopped:reads===before,signalAlive:get()==='Casa'};
 })()`);
 assert.deepEqual(result,{live:true,readsStopped:true,signalAlive:true});
});


test("Catalogue fields preserve borders, labels and focus inside rounded surfaces", {skip: !findChrome()}, async () => {
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jsswift-border-'));
 const html=path.join(tmp,'index.html');
 const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 const guide=await readFile(path.join(ROOT_DIR,'documentions/AI.md'),'utf8');
 const css=guide.match(/```css\n(\.catalogue-filters[\s\S]*?)\n```/)[1];
 await writeFile(html, `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><style>${css}</style><div id="app"></div><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>window.error=_.rod('');window.field=_.Input({label:'Cerca',error});app.append(_.Card({radius:12},_.div({class:'catalogue-filters'},field)),_.Kpi({title:'Disponibili',value:9,note:'In magazzino'}))</script>`);
 for (const width of [390,1440]) {
 const result=await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(() => {
 const input=document.querySelector('input'),control=input.closest('.jss-control');
 const r=input.getBoundingClientRect(),c=control.getBoundingClientRect();
 const before={background:getComputedStyle(input).backgroundColor,height:r.height,inside:r.top>=c.top+1&&r.bottom<=c.bottom-1,radius:parseFloat(getComputedStyle(control).borderRadius)};
 field.focus();error.value='Errore ricerca';
 return {before,focused:document.activeElement===input,invalid:input.getAttribute('aria-invalid'),message:document.getElementById(input.getAttribute('aria-describedby'))?.textContent,label:input.getAttribute('aria-label'),overflow:document.documentElement.scrollWidth>innerWidth};
 })()`, {width,focusEmulation:true});
 assert.deepEqual(result,{before:{background:'rgba(0, 0, 0, 0)',height:40,inside:true,radius:12},focused:true,invalid:'true',message:'Errore ricerca',label:'Cerca',overflow:false});
 }
});


test("Light CSS preserves base props and optional responsive CSS matches the full bundle", {skip:!findChrome()}, async () => {
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jsswift-light-css-'));
 const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 const results={};
 for(const mode of ['full','light','addon']) {
  const html=path.join(tmp,mode+'.html');
  const styles=mode==='full'?['ui.css']:mode==='light'?['ui-light.css']:['ui-light.css','responsive.css'];
  await writeFile(html, `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">${styles.map(name=>`<link rel="stylesheet" href="${asset('packages/ui/dist/css/'+name)}">`).join('')}<div id="app"></div><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>
  app.append(_.Grid({id:'grid',cols:2,gap:'md',pc:{cols:4}},...Array.from({length:4},()=>_.div('Item'))),_.Button({id:'button',color:'primary',outline:true,dense:true},'Action'),_.Row({id:'row',gap:'md'},_.Input({label:'Nome'}),_.Select({label:'Categoria',options:[{value:'Casa',label:'Casa'}]})));
  </script>`);
  results[mode]={};
  for (const width of [390,1440]) {
   results[mode][width]=await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(() => {
    const style=id=>getComputedStyle(document.getElementById(id));const g=style('grid'),b=style('button'),r=style('row');
    return {columns:g.gridTemplateColumns.split(' ').length,gridDisplay:g.display,gridGap:g.gap,rowDisplay:r.display,rowGap:r.gap,buttonColor:b.color,buttonBackground:b.backgroundColor,buttonBorder:b.borderColor,buttonPadding:b.padding,inputHeight:getComputedStyle(document.querySelector('input')).minHeight,overflow:document.documentElement.scrollWidth>innerWidth};
   })()`,{width});
  }
 }
 assert.deepEqual(results.addon,results.full);
 assert.deepEqual(results.light[390],results.full[390]);
 assert.equal(results.light[1440].columns,2);assert.equal(results.full[1440].columns,4);
 assert.equal(results.light[390].rowDisplay,'flex');assert.equal(results.light[390].gridDisplay,'grid');
 assert.ok(parseFloat(results.light[390].gridGap)>0);
});


test("Documented themes and repeated mount replacement preserve shared model ownership", {skip:!findChrome()}, async () => {
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jsswift-themes-lifecycle-'));const html=path.join(tmp,'index.html');
 const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 const guide=await readFile(path.join(ROOT_DIR,'documentions/ui/themes.md'),'utf8');const example=guide.match(/```js\n([\s\S]*?)\n```/)[1];
 await writeFile(html, `<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui-light.css')}"><div id="host"></div><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>${example}</script>`);
 const result=await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(() => {
 const background=()=>getComputedStyle(document.documentElement).getPropertyValue('--jss-bg').trim();
 _.setTheme('light',{persist:false});const light=background();_.setTheme('dark');const dark=background();
 const saved=localStorage.getItem('jsswift:theme');_.setTheme('light',{persist:false});const retained=localStorage.getItem('jsswift:theme');
 const model=_.rod('Casa'),baseline=model._actions.length;
 for(let i=0;i<20;i++) _.mount('#host',_.div({},_.Input({label:'Nome',model}),_.Select({label:'Categoria',model,options:[{value:'Casa',label:'Casa'}]})));
 const live=model._actions.length;_.mount('#host',[]);const released=model._actions.length===baseline;
 model.value='Ufficio';return {themeChanges:light!==dark,saved,retained,onlyLive:live-baseline===2,released,sharedAlive:model.value==='Ufficio'};
 })()`);
 assert.deepEqual(result,{themeChanges:true,saved:'dark',retained:'dark',onlyLive:true,released:true,sharedAlive:true});
});
