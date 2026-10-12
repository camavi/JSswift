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
  const originalKpi = stats.firstElementChild;
  click('next'); const paged = host.textContent.includes('Prodotto 6');
  const lastPageFocus = document.activeElement === pager;
  click('previous'); const firstPageFocus = document.activeElement === pager;
  const stableKpi = stats.firstElementChild === originalKpi;
  const table = host.querySelector('table');
  const whiteSurface = getComputedStyle(table).backgroundColor === 'rgb(255, 255, 255)' && getComputedStyle(table.querySelector('th')).backgroundColor === 'rgb(255, 255, 255)';
  const baselineRods = _.rod._all?.size ?? 0;
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
  for (let i=0;i<3;i++) { click('add-product'); await wait(); dialog.close(); await wait(); }
  const rodsDisposed = _.rod._all.size === baselineRods;
  const originalRows = rows; rows = [{...rows[0],id:Number.MAX_SAFE_INTEGER}];
  click('add-product'); await wait();
  models.name.value='Safe ID'; models.category.value='Casa'; models.price.value='1'; models.quantity.value='1';
  click('save-product'); await wait();
  const safeId = valid(rows) && rows[1].id === 1;
  rows = originalRows; localStorage.setItem(key,JSON.stringify(rows)); renderStats(); render();
  search.focus(); const q = document.activeElement; q.value = 'MODIFICATO'; q.dispatchEvent(new Event('input',{bubbles:true}));
  const searched = host.textContent.includes('Modificato') && !host.textContent.includes('Prodotto 2');
  q.value = ''; q.dispatchEvent(new Event('input',{bubbles:true}));
  filter.querySelector('.jss-select-control').click(); await wait();
  [...document.querySelectorAll('.jss-select-option')].find(n => n.textContent==='Ufficio' && n.getBoundingClientRect().width).click();
  const filtered = host.textContent.includes('Prodotto 2') && !host.textContent.includes('Modificato');
  const mobile = document.documentElement.scrollWidth <= innerWidth;
  return {rodsDisposed,safeId,initialFocus,paged,lastPageFocus,firstPageFocus,stableKpi,whiteSurface,invalid,errorAssociated,storageFailure,categoryBound,numeric,added,focusRestored,edited,escaped,searched,filtered,trapped,mobile};
 })().catch(e => ({error:String(e.stack || e)}))`, {afterReload:`({count:rows.length,name:rows[0].name,category:rows[6]?.category})`});
 assert.deepEqual(result,{before:{rodsDisposed:true,safeId:true,initialFocus:true,paged:true,lastPageFocus:true,firstPageFocus:true,stableKpi:true,whiteSurface:true,invalid:true,errorAssociated:true,storageFailure:true,categoryBound:true,numeric:true,added:true,focusRestored:true,edited:true,escaped:true,searched:true,filtered:true,trapped:true,mobile:true},after:{count:7,name:'Modificato',category:'Casa'}});
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
 await writeFile(html, `<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 const result = await runChromeMobileEval(findChrome(),pathToFileURL(html).href, `(() => {
 const base = {rows:[{name:'Casa'}],columns:[{key:'name',label:'Nome'}],toolbarStart:'Toolbar',status:'Custom status'};
 const normal = _.Table(base), hidden = _.Table({...base,hideStatus:true,embedded:true});
 document.body.append(normal,hidden);
 const embedded = getComputedStyle(hidden).borderTopWidth === '0px' && getComputedStyle(hidden.querySelector('.jss-table-wrap')).borderTopWidth === '0px';
 return {embedded,normal:!!normal.querySelector('.jss-table-status'),custom:normal.textContent.includes('Custom status'),
 hidden:!!hidden.querySelector('.jss-table-status'),hiddenCustom:hidden.textContent.includes('Custom status'),
 toolbar:!!hidden.querySelector('.jss-table-toolbar'),head:!!hidden.querySelector('thead'),rows:hidden.querySelectorAll('tbody tr').length,
 leaked:hidden.hasAttribute('hideStatus')};
 })()`);
 assert.deepEqual(result,{embedded:true,normal:true,custom:true,hidden:false,hiddenCustom:false,toolbar:true,head:true,rows:1,leaked:false});
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

test("Popover reopens on the same trigger after outside click and Escape", {
  skip: !findChrome() ? "Chrome/Chromium is not available" : false
}, async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-popover-reopen-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  await writeFile(htmlFile, `<!doctype html><html><body>
    <script src="${coreUrl}"></script><script src="${uiUrl}"></script>
    <script>
      const trigger = _.Button({ label: 'Open' });
      document.body.append(trigger);
      const popover = _.Popover({ content: 'Details', returnFocus: false });
      trigger.addEventListener('click', () => popover.open(trigger));
      const wait = () => new Promise(resolve => setTimeout(resolve, 100));
      (async () => {
        trigger.click(); await wait();
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await wait();
        const outsideClosed = !popover.isOpen();
        trigger.click(); await wait();
        const reopened = !!document.querySelector('.jss-popover') && popover.isOpen();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await wait();
        const escapeClosed = !popover.isOpen();
        trigger.click(); await wait();
        const reopenedAgain = !!document.querySelector('.jss-popover') && popover.isOpen();
        document.body.dataset.result = encodeURIComponent(JSON.stringify({ outsideClosed, reopened, escapeClosed, reopenedAgain }));
      })();
    </script></body></html>`);
  const result = readBrowserResult(await runChrome(findChrome(), htmlFile));
  assert.deepEqual(result, { outsideClosed: true, reopened: true, escapeClosed: true, reopenedAgain: true });
});

test("Menu reopens on the same trigger after outside click and Escape", {
  skip: !findChrome() ? "Chrome/Chromium is not available" : false
}, async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-menu-reopen-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  await writeFile(htmlFile, `<!doctype html><html><body>
    <script src="${coreUrl}"></script><script src="${uiUrl}"></script>
    <script>
      const trigger = _.Button({ label: 'Open' });
      document.body.append(trigger);
      const popover = _.Menu({ content: 'Details', returnFocus: false });
      trigger.addEventListener('click', () => popover.open(trigger));
      const wait = () => new Promise(resolve => setTimeout(resolve, 100));
      (async () => {
        trigger.click(); await wait();
        document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        await wait();
        const outsideClosed = !popover.isOpen();
        trigger.click(); await wait();
        const reopened = !!document.querySelector('.jss-menu-panel') && popover.isOpen();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await wait();
        const escapeClosed = !popover.isOpen();
        trigger.click(); await wait();
        const reopenedAgain = !!document.querySelector('.jss-menu-panel') && popover.isOpen();
        document.body.dataset.result = encodeURIComponent(JSON.stringify({ outsideClosed, reopened, escapeClosed, reopenedAgain }));
      })();
    </script></body></html>`);
  const result = readBrowserResult(await runChrome(findChrome(), htmlFile));
  assert.deepEqual(result, { outsideClosed: true, reopened: true, escapeClosed: true, reopenedAgain: true });
});

test("Menu applies Dense and surface effects to the overlay panel", {
  skip: !findChrome() ? "Chrome/Chromium is not available" : false
}, async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-menu-density-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  const cssUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/css/ui.css")).href;
  await writeFile(htmlFile, `<!doctype html><html><head><link rel="stylesheet" href="${cssUrl}"></head><body>
  <script src="${coreUrl}"></script><script src="${uiUrl}"></script><script>
    const button = _.Button({label:'Open'}); document.body.append(button);
    const items = [{label:'Edit'},{label:'Duplicate'},{label:'Delete'}];
    const normal = _.Menu({items}); const first = normal.open(button);
    const normalHeight = first.panel.getBoundingClientRect().height; normal.close();
    const compact = _.Menu({items,dense:true,glossy:true}); const second = compact.open(button);
    const denseHeight = second.panel.getBoundingClientRect().height;
    document.body.dataset.result = encodeURIComponent(JSON.stringify({normalHeight,denseHeight,
      dense:second.panel.classList.contains('jss-dense'),glossy:second.panel.classList.contains('jss-glossy'),
      shellEffect:second.panel.querySelector('.jss-menu-shell').classList.contains('jss-glossy')}));
  </script></body></html>`);
  const result = readBrowserResult(await runChrome(findChrome(), htmlFile));
  assert.equal(result.dense, true);
  assert.equal(result.glossy, true);
  assert.equal(result.shellEffect, false);
  assert.ok(result.denseHeight < result.normalHeight - 15, JSON.stringify(result));
});

test("Menu and Popover restore focus without moving page scroll", {
  skip: !findChrome() ? "Chrome/Chromium is not available" : false
}, async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-overlay-scroll-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const coreUrl = pathToFileURL(path.join(ROOT_DIR, "packages/core/dist/cms.js")).href;
  const uiUrl = pathToFileURL(path.join(ROOT_DIR, "packages/ui/dist/ui.js")).href;
  await writeFile(htmlFile, `<!doctype html><html><body style="height:4000px">
    <script src="${coreUrl}"></script><script src="${uiUrl}"></script><script>
    (async () => {
      const results = [];
      const wait = () => new Promise(resolve => setTimeout(resolve, 250));
      for (const component of ['Menu','Popover']) {
        window.scrollTo(0,0);
        const button = _.Button({label:component});document.body.prepend(button);button.focus();
        const overlay = _[component]({content:'Details'});overlay.open(button);
        window.scrollTo(0,1200);const before = window.scrollY;overlay.close();await wait();
        results.push({component,before,after:window.scrollY,focusRestored:document.activeElement===button});button.remove();
      }
      document.body.dataset.result=encodeURIComponent(JSON.stringify(results));
    })();
    </script></body></html>`);
  const results = readBrowserResult(await runChrome(findChrome(), htmlFile));
  for (const result of results) {
    assert.ok(result.before > 0, JSON.stringify(result));
    assert.equal(result.after, result.before, JSON.stringify(result));
    assert.equal(result.focusRestored, true, JSON.stringify(result));
  }
});

test("Table redesign keeps sorting, search, pagination and contrast in both themes", {
  skip: !findChrome() ? "Chrome/Chromium is not available" : false
}, async () => {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "jsswift-table-design-"));
  const htmlFile = path.join(tmpDir, "index.html");
  const asset = name => pathToFileURL(path.join(ROOT_DIR, name)).href;
  await writeFile(htmlFile, `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"></head><body style="margin:12px"><main id="host"></main>
  <script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>
  (async()=>{
    const wait=()=>new Promise(r=>setTimeout(r,80));const results=[];
    const columns=[{key:'name',label:'Nome',sortable:true},{key:'value',label:'Valore',sortable:true,align:'right'}];
    const rows=Array.from({length:12},(_,i)=>({name:'Riga '+String(i+1).padStart(2,'0'),value:12-i}));
    for(const theme of ['light','dark']){
      _.setTheme(theme,{persist:false});
      const table=_.Table({color:'primary',columns,rows,searchable:true,searchKeys:['name'],pageSize:5});document.querySelector('#host').replaceChildren(table);await wait();
      const initial=table.querySelectorAll('tbody tr').length;
      table.querySelector('.jss-table-page-next').click();await wait();
      const next=table.querySelector('tbody').textContent.includes('Riga 06');
      const input=table.querySelector('input[type="search"]');input.value='Riga 12';input.dispatchEvent(new Event('input',{bubbles:true}));await wait();
      const filtered=table.querySelectorAll('tbody tr').length===1&&table.querySelector('tbody').textContent.includes('Riga 12');
      input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));await wait();
      table.querySelectorAll('.jss-table-head-button')[1].click();await wait();
      const sorted=table.querySelector('tbody tr').textContent.includes('Riga 12');
      const sortAccessible=table.querySelectorAll('th')[1].getAttribute('aria-sort')==='ascending';
      const cell=getComputedStyle(table.querySelector('td')),head=getComputedStyle(table.querySelector('th')),root=getComputedStyle(table);
      const compact=_.Table({columns,rows:rows.slice(0,3),dense:true,pagination:false});const normal=_.Table({columns,rows:rows.slice(0,3),pagination:false});document.querySelector('#host').append(compact,normal);
      const glassLight=_.Table({color:'light',glass:true,columns,rows:rows.slice(0,3),pagination:false});document.querySelector('#host').append(glassLight);
      const lightGlassSurface=getComputedStyle(glassLight).backgroundColor;
      const smaller=compact.querySelector('tbody tr').getBoundingClientRect().height<normal.querySelector('tbody tr').getBoundingClientRect().height;
      const noPager=getComputedStyle(compact.querySelector('.jss-table-pager')).display==='none';
      results.push({theme,initial,next,filtered,sorted,sortAccessible,smaller,noPager,lightGlassSurface,head:head.backgroundColor,surface:root.backgroundColor,text:cell.color,overflow:document.documentElement.scrollWidth>innerWidth});
    }
    document.body.dataset.result=encodeURIComponent(JSON.stringify(results));
  })();</script></body></html>`);
  const results = readBrowserResult(await runChrome(findChrome(), htmlFile, {width:390,height:900}));
  const luminance = rgb => {
    const channels = rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;});
    return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
  };
  for(const result of results){
    assert.equal(result.initial,5,JSON.stringify(result));
    assert.equal(result.lightGlassSurface,'rgb(241, 245, 249)',JSON.stringify(result));
    for(const key of ['next','filtered','sorted','sortAccessible','smaller','noPager'])assert.equal(result[key],true,JSON.stringify(result));
    assert.equal(result.overflow,false,JSON.stringify(result));
    assert.notEqual(result.head,result.surface,JSON.stringify(result));
    const text=luminance(result.text),background=luminance(result.surface);
    assert.ok((Math.max(text,background)+0.05)/(Math.min(text,background)+0.05)>=4.5,JSON.stringify(result));
  }
});

test("Drawer navigation groups, palette and density work in both themes", {
  skip: !findChrome() ? "Chrome unavailable" : false
}, async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'jss-drawer-design-'));
  const html = path.join(tmp, 'index.html');
  const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
  await writeFile(html, `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>
  const results=[];
  for(const theme of ['light','dark']){
    _.setTheme(theme,{persist:false});
    const make=(extra={})=>_.Drawer({stateKey:'test-'+theme+'-'+Math.random(),closeOnSelect:false,title:'Workspace',subtitle:'Navigation',style:{height:'auto'},items:[{id:'one',label:'One'},{id:'group',label:'Group',items:[{id:'child',label:'Child'}]}],...extra});
    const drawer=make({color:'warning',glass:true}),dense=make({color:'warning',dense:true}),light=make({color:'light'});
    document.querySelector('#host').replaceChildren(drawer,dense,light);
    for(const d of [drawer,dense,light])d.openDrawer();
    const toggle=drawer.querySelector('.jss-drawer-group-toggle'),group=drawer.querySelector('.jss-drawer-group-items');
    const closed=group.hidden && getComputedStyle(group).display==='none';
    toggle.click(); const opened=!group.hidden && toggle.getAttribute('aria-expanded')==='true';
    const child=group.querySelector('a');child.click();
    const selected=child.getAttribute('aria-current')==='page' && child.classList.contains('active');
    const glass=getComputedStyle(child,'::before').backgroundImage.includes('radial-gradient');
    toggle.click();const reclosed=group.hidden && toggle.getAttribute('aria-expanded')==='false';
    results.push({theme,closed,opened,selected,glass,reclosed,controls:toggle.getAttribute('aria-controls')===group.id,svg:!!toggle.querySelector('svg'),common:drawer.classList.contains('jss-state-warning')&&drawer.classList.contains('jss-singularity'),dense:dense.querySelector('.jss-drawer-entry').getBoundingClientRect().height<drawer.querySelector('.jss-drawer-entry').getBoundingClientRect().height,light:getComputedStyle(light).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth});
  }
  document.body.dataset.result=encodeURIComponent(JSON.stringify(results));</script>`);
  const results=readBrowserResult(await runChrome(findChrome(),html,{width:390,height:900}));
  for(const result of results){
    for(const key of ['closed','opened','selected','glass','reclosed','controls','svg','common','dense'])assert.equal(result[key],true,JSON.stringify(result));
    assert.equal(result.light,'rgb(241, 245, 249)',JSON.stringify(result));
    assert.equal(result.overflow,false,JSON.stringify(result));
  }
});

test("Page surfaces preserve theme contrast, Glass and common props", {
 skip: !findChrome() ? "Chrome unavailable" : false
}, async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-page-design-'));const html=path.join(tmp,'index.html');
 const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>
 const results=[];
 for(const theme of ['light','dark']){
 _.setTheme(theme,{persist:false});
 for(const color of ['primary','secondary','warning','danger','success','info','light','dark']){
 for(const effect of [{},{outline:true},{flat:true},{glass:true}]){
 const p=_.Page({color,...effect,title:'Panoramica',subtitle:'Informazioni',body:'Contenuto',style:{minHeight:'0'},actions:_.Button({label:'Azione'})});document.querySelector('#host').replaceChildren(p);
 const s=getComputedStyle(p);const sub=getComputedStyle(p.querySelector('.jss-page-subtitle'));
 results.push({theme,color,effect,common:p.classList.contains('jss-state-'+color)&&p.classList.contains('jss-singularity'),surface:s.backgroundColor,text:s.color,sub:sub.color,glass:!effect.glass||getComputedStyle(p.querySelector('.jss-page-header'),'::before').backgroundImage.includes('radial-gradient'),overflow:document.documentElement.scrollWidth>innerWidth});
 }}}
 document.body.dataset.result=encodeURIComponent(JSON.stringify(results));</script>`);
 const results=readBrowserResult(await runChrome(findChrome(),html,{width:390,height:900}));
 for(const r of results){assert.equal(r.common,true,JSON.stringify(r));assert.equal(r.glass,true,JSON.stringify(r));assert.equal(r.overflow,false,JSON.stringify(r));
 if(r.color==='light'&&!r.effect.outline&&!r.effect.flat){assert.equal(r.surface,'rgb(241, 245, 249)',JSON.stringify(r));assert.equal(r.text,'rgb(31, 41, 55)',JSON.stringify(r));}
 if(r.color==='dark'&&!r.effect.outline&&!r.effect.flat){assert.equal(r.surface,'rgb(31, 41, 55)',JSON.stringify(r));assert.equal(r.text,'rgb(241, 245, 249)',JSON.stringify(r));}
 }
});

test("AppShell inherits reactive color, respects overrides and composes responsive layouts", {
 skip: !findChrome() ? "Chrome unavailable" : false
}, async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-shell-design-'));const html=path.join(tmp,'index.html');
 const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>
 (async()=>{const wait=()=>new Promise(r=>setTimeout(r,100));const results=[];let index=0;
 for(const theme of ['light','dark']){
 _.setTheme(theme,{persist:false});const [color,setColor]=_.signal('primary');
 const opts=()=>({color,stateKey:'shell-test-'+index++,title:'Workspace',headerProps:{sticky:false},drawerItems:[{label:'Home'}],pageProps:{title:'Page'},content:_.Button({color:'danger',label:'Delete'}),footerContent:'Footer'});
 const shell=_.AppShell(opts());document.querySelector('#host').replaceChildren(shell);await wait();
 const components=()=>[shell.header.firstElementChild,shell.drawer.firstElementChild,shell.page.firstElementChild,shell.footer.firstElementChild];
 const initial=components().every(n=>n.classList.contains('jss-state-primary'));
 setColor('warning');await wait();const reactive=components().every(n=>n.classList.contains('jss-state-warning')&&!n.classList.contains('jss-state-primary'));
 const nested=shell.page.querySelector('.jss-btn').classList.contains('jss-state-danger');
 shell.openDrawer();await wait();const opened=shell.isDrawerOpen()&&shell.drawer.firstElementChild.classList.contains('open');shell.closeDrawer();await wait();
 const mobile=innerWidth<=900,closed=!shell.isDrawerOpen()&&(!mobile||getComputedStyle(shell.drawer.firstElementChild).visibility==='hidden');
 const ownHeader=_.Header({color:'success',title:'Custom'});
 const custom=_.AppShell({...opts(),header:ownHeader,drawerProps:{color:'dark'},pageProps:{color:null,title:'Page'},footerProps:{color:'light'}});document.querySelector('#host').replaceChildren(custom);await wait();
 setColor('info');await wait();
 const overrides=custom.header.firstElementChild===ownHeader&&ownHeader.classList.contains('jss-state-success')&&custom.drawer.firstElementChild.classList.contains('jss-state-dark')&&!custom.page.firstElementChild.classList.contains('jss-state-info')&&custom.footer.firstElementChild.classList.contains('jss-state-light');
 const slotted=_.Page({color:'danger',title:'Slot'});const slotShell=_.AppShell({...opts(),slots:{page:()=>slotted}});document.querySelector('#host').replaceChildren(slotShell);const slots=slotShell.page.firstElementChild===slotted&&slotted.classList.contains('jss-state-danger');
 const reverse=_.AppShell({...opts(),reverse:true});document.querySelector('#host').replaceChildren(reverse);await wait();const reversed=mobile||reverse.drawer.getBoundingClientRect().x>reverse.page.getBoundingClientRect().x;
 const stack=_.AppShell({...opts(),stack:true});document.querySelector('#host').replaceChildren(stack);await wait();const stacked=stack.drawer.getBoundingClientRect().width>=stack.page.getBoundingClientRect().width-1;
 const no=_.AppShell({...opts(),noDrawer:true});document.querySelector('#host').replaceChildren(no);const noDrawer=no.drawer===null&&!no.querySelector('.jss-header-toggle');
 results.push({theme,initial,reactive,nested,opened,closed,overrides,slots,reversed,stacked,noDrawer,overflow:document.documentElement.scrollWidth>innerWidth});}
 document.body.dataset.result=encodeURIComponent(JSON.stringify(results));})();</script>`);
 for(const width of [1200,390]){
 const results=readBrowserResult(await runChrome(findChrome(),html,{width,height:900}));
 for(const result of results){for(const key of ['initial','reactive','nested','opened','closed','overrides','slots','reversed','stacked','noDrawer'])assert.equal(result[key],true,JSON.stringify({width,...result}));assert.equal(result.overflow,false,JSON.stringify({width,...result}));}
 }
});

test("Parallax semantic surfaces, media and reactive colors", {skip:!findChrome()?"Chrome unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-parallax-'));const html=path.join(tmp,'index.html');const asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>
 (async()=>{const host=document.querySelector('#host');const results=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const color of ['primary','secondary','warning','danger','success','info','light','dark'])for(const effect of [{},{outline:true},{glass:true}]){
 const p=_.Parallax({color,...effect,title:'Nuove prospettive',subtitle:'Informazioni',actions:_.Button({label:'Esplora'})});host.replaceChildren(p);const s=getComputedStyle(p),c=getComputedStyle(p.querySelector('.jss-parallax-content'));results.push({theme,color,effect,common:p.classList.contains('jss-state-'+color),text:s.color,content:c.color,bg:s.backgroundColor,media:getComputedStyle(p.querySelector('.jss-parallax-bg'),'::before').backgroundImage,glass:!effect.glass||getComputedStyle(p,'::before').backgroundImage.includes('radial-gradient'),overflow:document.documentElement.scrollWidth>innerWidth});}
 const [color,setColor]=_.signal('primary');const reactive=_.Parallax({color,title:'Live'});host.replaceChildren(reactive);setColor('danger');await new Promise(r=>setTimeout(r,50));results.push({reactive:reactive.classList.contains('jss-state-danger')&&!reactive.classList.contains('jss-state-primary')});
 const photo=_.Parallax({background:'linear-gradient(120deg,#345,#789)',textColor:'#ffffff',title:'Media',disabled:true});host.replaceChildren(photo);await new Promise(r=>setTimeout(r,150));results.push({photo:photo.classList.contains('jss-parallax-has-image'),photoText:getComputedStyle(photo.querySelector('.jss-parallax-content')).color,offset:photo.style.getPropertyValue('--jss-parallax-offset')});
 for(const color of ['primary','warning','light','dark']){const p=_.Parallax({color,background:'linear-gradient(#345,#789)',title:'Tint'});host.replaceChildren(p);results.push({tint:color,overlay:getComputedStyle(p.querySelector('.jss-parallax-bg'),'::after').backgroundImage,text:getComputedStyle(p.querySelector('.jss-parallax-content')).color});}
 for(const effect of ['lightShadow','gradient','glossy','glass']){const p=_.Parallax({color:'primary',[effect]:true,background:'linear-gradient(#345,#789)',title:'Optics'});host.replaceChildren(p);const optics=getComputedStyle(p,effect==='glass'?'::before':'::after');results.push({optical:effect,z:optics.zIndex,image:optics.backgroundImage,contentZ:getComputedStyle(p.querySelector('.jss-parallax-content')).zIndex});}
 const custom=_.Parallax({color:'primary',background:'linear-gradient(#345,#789)',overlay:'rgba(255,0,0,.3)'});host.replaceChildren(custom);results.push({customOverlay:getComputedStyle(custom.querySelector('.jss-parallax-bg'),'::after').backgroundColor});
 }document.body.dataset.result=encodeURIComponent(JSON.stringify(results));})();</script>`);
 const results=readBrowserResult(await runChrome(findChrome(),html,{width:390}));for(const r of results){if('optical'in r){assert.ok(Number(r.z)>0&&Number(r.z)<Number(r.contentZ),JSON.stringify(r));assert.ok(r.image.includes('gradient'),JSON.stringify(r));continue;}if('tint'in r){assert.ok(r.overlay.includes('gradient'),JSON.stringify(r));if(r.tint==='primary'||r.tint==='warning')assert.ok(r.overlay.includes('color(srgb'),JSON.stringify(r));if(r.tint==='light')assert.equal(r.text,'rgb(31, 41, 55)');continue;}if('customOverlay'in r){assert.equal(r.customOverlay,'rgba(255, 0, 0, 0.3)');continue;}if('reactive'in r){assert.equal(r.reactive,true);continue;}if('photo'in r){assert.equal(r.photo,true);assert.equal(r.photoText,'rgb(255, 255, 255)');assert.equal(r.offset,'0px');continue;}assert.equal(r.common,true,JSON.stringify(r));assert.equal(r.glass,true,JSON.stringify(r));assert.equal(r.overflow,false,JSON.stringify(r));assert.equal(r.media,'none');assert.equal(r.content,r.text,JSON.stringify(r));if(!r.effect.glass&&!r.effect.outline&&r.color==='light')assert.equal(r.text,'rgb(31, 41, 55)',JSON.stringify(r));}
});

test("Parallax background moves independently during page scroll",{skip:!findChrome()||!hasDevtoolsWebSocket()?"Chrome/WebSocket unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-parallax-scroll-'));const html=path.join(tmp,'index.html');const asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><div style="height:300px"></div><main id="host"></main><div style="height:2000px"></div><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>const src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="sky"><stop stop-color="#123"/><stop offset="1" stop-color="#789"/></linearGradient></defs><path fill="url(#sky)" d="M0 0h800v600H0z"/><circle cx="600" cy="120" r="80" fill="#fea"/></svg>');document.querySelector('#host').append(_.Parallax({src,height:460,speed:.38,maxOffset:150,title:'Scroll test'}));</script>`);
 const result=await runChromeMobileEval(findChrome(),pathToFileURL(html).href,`(async()=>{const wait=()=>new Promise(r=>setTimeout(r,150));const p=document.querySelector('.jss-parallax');p.scrollIntoView();await wait();const bg=p.querySelector('.jss-parallax-bg');const before=new DOMMatrix(getComputedStyle(bg).transform).m42;const title=p.querySelector('.jss-parallax-title');const y=title.getBoundingClientRect().top;scrollBy(0,180);await wait();return {image:getComputedStyle(bg,'::before').backgroundImage,raw:p.style.getPropertyValue('--jss-parallax-image'),before,after:new DOMMatrix(getComputedStyle(bg).transform).m42,titleDelta:title.getBoundingClientRect().top-y,scroll:scrollY};})()`,{width:1100,height:800,deviceScaleFactor:1});
 assert.notEqual(result.image,'none',JSON.stringify(result));
 assert.ok(Math.abs(result.after-result.before)>30,JSON.stringify(result));assert.ok(Math.abs(result.titleDelta+180)<2,JSON.stringify(result));
});

test("Footer follows Header surfaces and keeps dense and stacked content compact",{skip:!findChrome()?"Chrome unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-footer-'));const html=path.join(tmp,'index.html');const asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>
 const results=[];const host=document.querySelector('#host');for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const color of ['primary','secondary','warning','danger','success','info','light','dark'])for(const effect of [{},{flat:true},{outline:true},{glass:true},{outline:true,glass:true},{lightShadow:true},{glossy:true},{gradient:true},{textGradient:true},{outline:true,textGradient:true}]){const props={color,...effect,title:'Panoramica',subtitle:'Dettagli'};const f=_.Footer({...props,actions:_.Button({label:'Azione'})}),h=_.Header({...props,left:false});host.replaceChildren(f,h);const fs=getComputedStyle(f),hs=getComputedStyle(h);results.push({theme,color,effect,surface:fs.backgroundColor,same:fs.backgroundColor===hs.backgroundColor,headerText:hs.color,titleClip:getComputedStyle(f.querySelector('.jss-footer-title')).backgroundClip,text:fs.color,sub:getComputedStyle(f.querySelector('.jss-footer-subtitle')).color,button:getComputedStyle(f.querySelector('.jss-btn')).backgroundColor,glass:!effect.glass||getComputedStyle(f,'::before').backgroundImage.includes('radial-gradient'),overflow:document.documentElement.scrollWidth>innerWidth});}
 const normal=_.Footer({title:'Title',subtitle:'Subtitle',actions:_.Button({label:'Action'})}),dense=_.Footer({dense:true,title:'Title',subtitle:'Subtitle',actions:_.Button({label:'Action'})}),stack=_.Footer({stack:true,title:'Title',subtitle:'Subtitle',actions:_.Button({label:'Action'})});host.replaceChildren(normal,dense,stack);results.push({density:dense.getBoundingClientRect().height<normal.getBoundingClientRect().height,stack:stack.getBoundingClientRect().height<180});}
 document.body.dataset.result=encodeURIComponent(JSON.stringify(results));</script>`);
 for(const width of [1200,390])for(const r of readBrowserResult(await runChrome(findChrome(),html,{width}))){if('density'in r){assert.equal(r.density,true,JSON.stringify(r));assert.equal(r.stack,true,JSON.stringify(r));continue;}if(!r.effect.glass)assert.equal(r.same,true,JSON.stringify(r));if(r.effect.outline&&r.effect.glass&&r.color==='light')assert.equal(r.text,'rgb(31, 41, 55)',JSON.stringify(r));if(r.effect.textGradient&&r.color==='light'&&!r.effect.outline){assert.equal(r.surface,'rgb(241, 245, 249)',JSON.stringify(r));assert.equal(r.text,'rgb(31, 41, 55)',JSON.stringify(r));}if(r.effect.textGradient&&r.effect.outline&&r.color==='light'){assert.equal(r.surface,'rgba(241, 245, 249, 0.92)',JSON.stringify(r));assert.equal(r.text,'rgb(31, 41, 55)',JSON.stringify(r));}if(r.effect.textGradient){assert.equal(r.titleClip,'text',JSON.stringify(r));assert.equal(r.text,r.headerText,JSON.stringify(r));}if(r.effect.flat)assert.equal(r.text,r.headerText,JSON.stringify(r));assert.equal(r.sub,r.text,JSON.stringify(r));assert.notEqual(r.button,'rgba(0, 0, 0, 0)',JSON.stringify(r));assert.equal(r.glass,true,JSON.stringify(r));assert.equal(r.overflow,false,JSON.stringify(r));}
});

test("Toolbar applies Header colors and effects with compact responsive content",{skip:!findChrome()?"Chrome unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-toolbar-'));const html=path.join(tmp,'index.html');const asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>
 const results=[];const host=document.querySelector('#host');for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const color of ['primary','secondary','warning','danger','success','info','light','dark'])for(const effect of [{},{flat:true},{outline:true},{glass:true},{outline:true,glass:true},{lightShadow:true},{glossy:true},{gradient:true},{textGradient:true},{outline:true,textGradient:true}]){const props={color,...effect,title:'Panoramica',subtitle:'Dettagli'};const f=_.Toolbar({...props,actions:_.Button({label:'Azione'})}),h=_.Header({...props,left:false});host.replaceChildren(f,h);const fs=getComputedStyle(f),hs=getComputedStyle(h);results.push({theme,color,effect,backgroundImage:fs.backgroundImage,surface:fs.backgroundColor,same:fs.backgroundColor===hs.backgroundColor,headerText:hs.color,titleClip:getComputedStyle(f.querySelector('.jss-toolbar-title')).backgroundClip,text:fs.color,sub:getComputedStyle(f.querySelector('.jss-toolbar-subtitle')).color,button:getComputedStyle(f.querySelector('.jss-btn')).backgroundColor,glass:!effect.glass||getComputedStyle(f,'::before').backgroundImage.includes('radial-gradient'),overflow:document.documentElement.scrollWidth>innerWidth});}
 const normal=_.Toolbar({title:'Title',subtitle:'Subtitle',actions:_.Button({label:'Action'})}),dense=_.Toolbar({dense:true,title:'Title',subtitle:'Subtitle',actions:_.Button({label:'Action'})}),stack=_.Toolbar({stack:true,title:'Title',subtitle:'Subtitle',actions:_.Button({label:'Action'})});host.replaceChildren(normal,dense,stack);results.push({density:dense.getBoundingClientRect().height<normal.getBoundingClientRect().height,stack:stack.getBoundingClientRect().height<180});}
 document.body.dataset.result=encodeURIComponent(JSON.stringify(results));</script>`);
 for(const width of [1200,390])for(const r of readBrowserResult(await runChrome(findChrome(),html,{width}))){if('density'in r){assert.equal(r.density,true,JSON.stringify(r));assert.equal(r.stack,true,JSON.stringify(r));continue;}if(!r.effect.glass)assert.equal(r.same,true,JSON.stringify(r));if(r.effect.outline&&r.effect.glass&&r.color==='light')assert.equal(r.text,'rgb(31, 41, 55)',JSON.stringify(r));if(r.effect.textGradient&&r.color==='light'&&!r.effect.outline){assert.equal(r.surface,'rgb(241, 245, 249)',JSON.stringify(r));assert.equal(r.text,'rgb(31, 41, 55)',JSON.stringify(r));}if(r.effect.textGradient&&r.effect.outline&&r.color==='light'){assert.equal(r.surface,'rgba(241, 245, 249, 0.92)',JSON.stringify(r));assert.equal(r.text,'rgb(31, 41, 55)',JSON.stringify(r));}if(r.effect.textGradient){assert.equal(r.backgroundImage,'none',JSON.stringify(r));assert.equal(r.titleClip,'text',JSON.stringify(r));assert.equal(r.text,r.headerText,JSON.stringify(r));}if(r.effect.flat)assert.equal(r.text,r.headerText,JSON.stringify(r));assert.equal(r.sub,r.text,JSON.stringify(r));assert.notEqual(r.button,'rgba(0, 0, 0, 0)',JSON.stringify(r));assert.equal(r.glass,true,JSON.stringify(r));assert.equal(r.overflow,false,JSON.stringify(r));}
});

test("Grid and GridCol compose responsive spans, spacing, items and empty state",{skip:!findChrome()||!hasDevtoolsWebSocket()?"Chrome/WebSocket unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-grid-audit-'));const html=path.join(tmp,'index.html');const asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 for(const width of [390,820,1200]){
 const r=await runChromeMobileEval(findChrome(),pathToFileURL(html).href,`(()=>{const host=document.querySelector('#host');const first=_.GridCol({span:'full',tablet:{span:1},pc:{span:2}},'First');const grid=_.Grid({cols:1,tablet:{cols:2},pc:{cols:4},rowGap:20,columnGap:12},first,...[1,2,3].map(n=>_.GridCol({},'Cell '+n)));host.replaceChildren(grid);const g=getComputedStyle(grid),c=getComputedStyle(first);const responsive={tracks:g.gridTemplateColumns.split(' ').length,rowGap:g.rowGap,colGap:g.columnGap,span:c.gridColumn,overflow:document.documentElement.scrollWidth>innerWidth};const items=_.Grid({cols:2,items:['A','B','C'],slots:{item:({item,index})=>_.GridCol({},index+':'+item)}});host.replaceChildren(items);const itemText=items.textContent;const empty=_.Grid({items:[],empty:'Nessun elemento'});host.replaceChildren(empty);const emptyText=empty.textContent;const auto=_.Grid({min:140,gap:16},...Array.from({length:4},()=>_.GridCol({},'Auto')));host.replaceChildren(auto);return {responsive,itemText,emptyText,auto:getComputedStyle(auto).gridTemplateColumns.split(' ').length,overflow:document.documentElement.scrollWidth>innerWidth};})()`,{width,height:900,deviceScaleFactor:1});
 assert.equal(r.responsive.tracks,width>=1024?4:width>=768?2:1,JSON.stringify(r));assert.equal(r.responsive.rowGap,'20px');assert.equal(r.responsive.colGap,'12px');assert.match(r.responsive.span,width>=1024?/span 2/:width>=768?/span 1/:/1 \/ -1/);assert.equal(r.itemText,'0:A1:B2:C');assert.equal(r.emptyText,'Nessun elemento');assert.ok(r.auto>=2);assert.equal(r.overflow,false);assert.equal(r.responsive.overflow,false);
 }
});

test("Container sizing, spacing, sections and responsive layouts behave consistently",{skip:!findChrome()||!hasDevtoolsWebSocket()?"Chrome/WebSocket unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-container-audit-'));const html=path.join(tmp,'index.html');const asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 for(const width of [390,820,1200]){
 const r=await runChromeMobileEval(findChrome(),pathToFileURL(html).href,`(async()=>{const host=document.querySelector('#host');const mount=p=>{const c=_.Container(p,'Content');host.replaceChildren(c);return c};let c=mount({maxWidth:'narrow',padding:24});let s=getComputedStyle(c);const sizing={width:c.getBoundingClientRect().width,max:s.maxWidth,pad:s.paddingTop};c=mount({fluid:true});const fluid=getComputedStyle(c).maxWidth;c=mount({paddingX:32,paddingY:18});s=getComputedStyle(c);const axes=[s.paddingLeft,s.paddingTop];c=mount({layout:'grid',cols:2,gap:16});s=getComputedStyle(c);const grid=[s.display,s.gridTemplateColumns.split(' ').length,s.gap];c=mount({layout:'flex',gap:12,tablet:{direction:'column'},pc:{direction:'row'}});const direction=getComputedStyle(c).flexDirection;
 const [label,setLabel]=_.signal('Initial');const child=_.Button({color:'danger',label:'Delete'});c=_.Container({tag:'section',header:'Header',start:'Left',body:()=>label(),end:'Right',footer:'Footer',sectionGap:20},child);host.replaceChildren(c);setLabel('Updated');await new Promise(r=>setTimeout(r,50));const sections={tag:c.tagName,text:c.textContent,gap:getComputedStyle(c).gap,start:!!c.querySelector('.jss-container-start'),end:!!c.querySelector('.jss-container-end'),body:!!c.querySelector('.jss-container-body')};
 c=_.Container({},child);host.replaceChildren(c);const retained=child.classList.contains('jss-state-danger');return {sizing,fluid,axes,grid,direction,sections,retained,overflow:document.documentElement.scrollWidth>innerWidth};})()`,{width,height:900,deviceScaleFactor:1});
 assert.equal(r.sizing.width,Math.min(width,760),JSON.stringify(r));assert.equal(r.sizing.pad,'24px',JSON.stringify(r));assert.equal(r.fluid,'none');assert.deepEqual(r.axes,['32px','18px']);assert.equal(r.grid[0],'grid');assert.equal(r.grid[1],2);assert.equal(r.grid[2],'16px');assert.equal(r.direction,width>=1024?'row':width>=768?'column':'row',JSON.stringify(r));assert.equal(r.sections.tag,'SECTION');assert.ok(r.sections.text.includes('Updated'));assert.equal(r.sections.gap,'20px');assert.equal(r.sections.start,true,JSON.stringify(r));assert.equal(r.sections.end,true,JSON.stringify(r));assert.equal(r.retained,true);assert.equal(r.overflow,false);
 }
});

test("Row and Col sizing, responsive spans and regions preserve layout",{skip:!findChrome()||!hasDevtoolsWebSocket()?"Chrome/WebSocket unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-row-col-'));const html=path.join(tmp,'index.html');const asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 for(const width of [390,820,1200]){
 const r=await runChromeMobileEval(findChrome(),pathToFileURL(html).href,`(async()=>{const host=document.querySelector('#host');const mount=c=>{host.replaceChildren(c);return c};let row=mount(_.Row({width:320},'Width'));const explicit=row.getBoundingClientRect().width;row=mount(_.Row({inline:true},'Inline'));const inline={width:row.getBoundingClientRect().width,display:getComputedStyle(row).display};row=mount(_.Row({inline:true,full:true},'Full'));const full=row.getBoundingClientRect().width;
 const cols=Array.from({length:3},()=>_.Col({col:24,tablet:{col:12},pc:{col:8},minHeight:20},'Cell'));row=mount(_.Row({gap:12,tablet:{gap:20},pc:{gap:24}},...cols));const positions=cols.map(c=>({x:c.offsetLeft,y:c.offsetTop,w:c.getBoundingClientRect().width}));const overflow=document.documentElement.scrollWidth>innerWidth;
 row=mount(_.Row({direction:'column',tablet:{direction:'row'},gap:16,align:'center',justify:'space-between'},_.Col({width:100},'A'),_.Col({width:100},'B')));const s=getComputedStyle(row);const spacing={direction:s.flexDirection,gap:s.gap,align:s.alignItems,justify:s.justifyContent};
 row=mount(_.Row({reverse:true},_.Col({width:80},'A'),_.Col({width:80},'B')));const reversed=row.firstElementChild.getBoundingClientRect().x>row.lastElementChild.getBoundingClientRect().x;
 const [label,setLabel]=_.signal('Before');const button=_.Button({color:'danger',label:'Delete'});row=mount(_.Row({start:'Start',body:()=>label(),end:'End'}));setLabel('After');await new Promise(r=>setTimeout(r,50));const text=row.textContent;const col=mount(_.Col({header:'Header',body:'Body',footer:'Footer',gap:8},button));const sections=col.textContent;mount(_.Row({},_.Col({},button)));return {explicit,inline,full,positions,overflow,spacing,reversed,text,sections,color:button.classList.contains('jss-state-danger')};})()`,{width,height:900,deviceScaleFactor:1});
 assert.equal(r.explicit,320,JSON.stringify(r));assert.equal(r.inline.display,'inline-flex');assert.ok(r.inline.width<150,JSON.stringify(r));assert.equal(r.full,width);assert.equal(r.overflow,false,JSON.stringify(r));const perRow=width>=1024?3:width>=768?2:1;assert.equal(r.positions.slice(0,perRow).every(p=>p.y===r.positions[0].y),true,JSON.stringify(r));if(perRow<3)assert.ok(r.positions[perRow].y>r.positions[0].y,JSON.stringify(r));assert.equal(r.spacing.direction,width>=768?'row':'column');assert.equal(r.spacing.gap,'16px');assert.equal(r.spacing.align,'center');assert.equal(r.spacing.justify,'space-between');assert.equal(r.reversed,true);assert.ok(r.text.includes('Start')&&r.text.includes('After')&&r.text.includes('End'));assert.ok(r.sections.includes('Header')&&r.sections.includes('Body')&&r.sections.includes('Footer'));assert.equal(r.color,true);
 }
});

test("Spacer distributes free space horizontally and vertically in both themes",{skip:!findChrome()||!hasDevtoolsWebSocket()?"Chrome/WebSocket unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-spacer-'));const html=path.join(tmp,'index.html');const asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 for(const width of [390,820,1200]){
 const results=await runChromeMobileEval(findChrome(),pathToFileURL(html).href,`(async()=>{const host=document.querySelector('#host'),results=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});const a=_.Button({label:'Start',color:'primary',width:80}),b=_.Button({label:'End',color:'danger',width:80}),spacer=_.Spacer();let row=_.Row({width:320,gap:12,wrap:false},a,spacer,b);host.replaceChildren(row);const horizontal={space:spacer.getBoundingClientRect().width,end:b.getBoundingClientRect().right-row.getBoundingClientRect().right,bg:getComputedStyle(spacer).backgroundColor};const s1=_.Spacer(),s2=_.Spacer();row=_.Row({width:320,wrap:false},_.Col({width:40},'A'),s1,_.Col({width:40},'B'),s2,_.Col({width:40},'C'));host.replaceChildren(row);const equal=[s1.getBoundingClientRect().width,s2.getBoundingClientRect().width];const vertical=_.Spacer();const col=_.Col({height:240,gap:12},_.div({style:{flex:'0 0 30px'}},'Top'),vertical,_.div({style:{flex:'0 0 30px'}},'Bottom'));host.replaceChildren(col);const verticalSpace=vertical.getBoundingClientRect().height;const sized=_.Spacer({minWidth:20,width:30,tablet:{minWidth:40,width:50},pc:{minWidth:60,width:70}});row=_.Row({width:320,wrap:false},sized);host.replaceChildren(row);const min=getComputedStyle(sized).minWidth;const [label,setLabel]=_.signal('Before');const content=_.Spacer({slots:{default:()=>()=>label()}});host.replaceChildren(_.Row({},content,b));setLabel('After');await new Promise(r=>setTimeout(r,30));results.push({theme,horizontal,equal,verticalSpace,min,text:content.textContent,color:b.classList.contains('jss-state-danger'),overflow:document.documentElement.scrollWidth>innerWidth});}return results;})()`,{width,height:900,deviceScaleFactor:1});
 for(const r of results){assert.ok(Math.abs(r.horizontal.space-136)<1,JSON.stringify(r));assert.ok(Math.abs(r.horizontal.end)<1,JSON.stringify(r));assert.equal(r.horizontal.bg,'rgba(0, 0, 0, 0)');assert.deepEqual(r.equal,[100,100]);assert.equal(r.verticalSpace,156,JSON.stringify(r));assert.equal(r.min,width>=1024?'60px':width>=768?'40px':'20px');assert.equal(r.text,'After');assert.equal(r.color,true);assert.equal(r.overflow,false);}
 }
});

test("Layout regions, responsive inheritance and panel controls work in both themes",{skip:!findChrome()||!hasDevtoolsWebSocket()?"Chrome/WebSocket unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-layout-'));const html=path.join(tmp,'index.html');const asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script>`);
 for(const width of [390,820,1200]){
 const results=await runChromeMobileEval(findChrome(),pathToFileURL(html).href,`(async()=>{const host=document.querySelector('#host'),results=[];const tick=()=>new Promise(r=>setTimeout(r,30));for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});const drawer=_.rod(false),nav=_.rod(false),button=_.Button({label:'Delete',color:'danger'});const layout=_.Layout({header:'Header',aside:'Left',nav:'Right',navEnabled:true,page:button,footer:'Footer',drawerOpen:drawer,navOpen:nav,drawerWidth:200,navWidth:180,gap:8,tablet:{gap:12,disposition:'classicRight',areas:['header header header','main main main','footer footer footer']},pc:{gap:16},minHeight:400});host.replaceChildren(layout);layout.reflow();const initial={header:layout.header().textContent,footer:layout.footer().textContent,mobile:layout.isMobile(),areas:layout.querySelector('.jss-layout-shell-grid').style.gridTemplateAreas,disposition:layout.dataset.disposition,color:button.classList.contains('jss-state-danger'),bg:getComputedStyle(layout).backgroundColor};layout.openAside();layout.openNav();await tick();const opened={drawer:drawer.value,nav:nav.value,aria:layout.aside().getAttribute('aria-hidden'),floating:layout.aside().classList.contains('is-floating')};document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await tick();const escaped=[layout.isDrawerOpen(),layout.isNavOpen()];layout.closeAside();layout.closeNav();await tick();layout.toggleAside();await tick();const toggled=drawer.value;layout.headerUpdate('New header');layout.pageUpdate('New page');layout.footerUpdate(null);layout.asideUpdate(null);const updated={header:layout.header().textContent,page:layout.page().textContent,footerHidden:layout.footer().hidden,asideHidden:layout.aside().hidden};layout._dispose();host.replaceChildren();results.push({initial,opened,escaped,toggled,updated,overflow:document.documentElement.scrollWidth>innerWidth});}return results;})()`,{width,height:900,deviceScaleFactor:1});
 for(const r of results){assert.equal(r.initial.header,'Header');assert.equal(r.initial.footer,'Footer');assert.equal(r.initial.mobile,width<1024);assert.equal(r.initial.disposition,width>=768?'classicright':'',JSON.stringify(r));if(width>=768)assert.ok(r.initial.areas.includes('main main main'),JSON.stringify(r));assert.equal(r.initial.color,true);assert.equal(r.opened.drawer,true);assert.equal(r.opened.nav,true);assert.equal(r.opened.aria,'false');assert.equal(r.opened.floating,width<1024);assert.deepEqual(r.escaped,width<1024?[false,false]:[true,true]);assert.equal(r.toggled,true);assert.deepEqual(r.updated,{header:'New header',page:'New page',footerHidden:true,asideHidden:true});assert.equal(r.overflow,false);}
 }
});

test("Icon Glass keeps palette-colored glyphs and the glass surface across themes",{skip:!findChrome()?"Chrome unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-icon-glass-')),html=path.join(tmp,'index.html'),asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>const results=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const color of ['primary','secondary','warning','danger','success','info','light','dark'])for(const outline of [false,true]){const icon=_.Icon({name:'#chevron-down',color,glass:true,outline,size:32});document.body.append(icon);const s=getComputedStyle(icon),p=getComputedStyle(icon,'::before');results.push({theme,color,outline,fg:s.color,surface:s.backgroundColor,layer:p.zIndex,glass:p.backgroundImage,stroke:getComputedStyle(icon.querySelector('svg')).stroke});icon.remove();}}document.body.dataset.result=encodeURIComponent(JSON.stringify(results));</script>`);
 const rows=readBrowserResult(await runChrome(findChrome(),html));for(const r of rows){const values=r.fg.match(/[\d.]+/g).map(Number);let rgb=values;if(r.fg.startsWith('color(srgb'))rgb=values.slice(0,3).map(v=>v*255);const brightness=rgb.slice(0,3).reduce((a,b)=>a+b,0)/3;if(!['light','dark','secondary'].includes(r.color))assert.ok(Math.max(...rgb.slice(0,3))-Math.min(...rgb.slice(0,3))>35,JSON.stringify(r));if(r.color==='light')assert.ok(brightness>140,JSON.stringify(r));if(r.color==='dark')assert.ok(brightness<140,JSON.stringify(r));assert.equal(r.layer,'-1');assert.match(r.glass,/gradient/);assert.equal(r.stroke,r.fg);}
});

test("Icon Dense scales glyph and surface together across sizes and themes",{skip:!findChrome()?"Chrome unavailable":false},async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-icon-dense-')),html=path.join(tmp,'index.html'),asset=n=>pathToFileURL(path.join(ROOT_DIR,n)).href;
 await writeFile(html,`<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>const rows=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const name of ['home','#chevron-down'])for(const size of [undefined,'xs','md','xl',16,32,48])for(const color of ['primary','secondary','success','warning','danger','info','light','dark'])for(const effect of [{},{flat:true},{outline:true},{border:true},{glass:true},{glossy:true},{gradient:true}]){const normal=_.Icon({name,size,color,...effect}),dense=_.Icon({name,size,color,...effect,dense:true});document.body.append(normal,dense);const n=normal.getBoundingClientRect(),d=dense.getBoundingClientRect(),s=getComputedStyle(dense),svg=dense.querySelector('svg');rows.push({theme,name,size,color,effect,normal:n.width,width:d.width,height:d.height,font:parseFloat(s.fontSize),margin:s.margin,border:parseFloat(s.borderTopWidth),display:s.display,svg:svg?svg.getBoundingClientRect().width:null,inner:d.width-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)-parseFloat(s.borderLeftWidth)-parseFloat(s.borderRightWidth),foreground:s.color,normalForeground:getComputedStyle(normal).color});normal.remove();dense.remove();}}document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));</script>`);
 for(const r of readBrowserResult(await runChrome(findChrome(),html))){assert.ok(Math.abs(r.width-r.normal*.75)<.1,JSON.stringify(r));assert.ok(Math.abs(r.height-r.width)<.1,JSON.stringify(r));assert.ok(Math.abs(r.font-r.width)<.1,JSON.stringify(r));assert.equal(r.margin,'0px');if(!r.effect.border&&!r.effect.outline)assert.equal(r.border,0,JSON.stringify(r));assert.equal(r.display,'inline-flex');if(r.svg!==null)assert.ok(Math.abs(r.svg-r.inner)<.1,JSON.stringify(r));assert.equal(r.foreground,r.normalForeground);}
});

test("Icon Fill toggles Material Symbols without changing sprite or custom content", { skip: !findChrome() ? "Chrome unavailable" : false }, async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "jss-icon-fill-"));
  const html = path.join(tmp, "index.html");
  const asset = name => pathToFileURL(path.join(ROOT_DIR, name)).href;
  await writeFile(html, `<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><style>.jss-icon{transition:none!important}</style><body><script>
    const results = [];
    for (const theme of ['light', 'dark']) {
      _.setTheme(theme, {persist:false});
      for (const effect of [{}, {outline:true}, {glass:true}, {glow:true}]) {
        const [getFill, setFill] = _.signal(false);
        const reactive = _.Icon({name:'home', fill:getFill, color:'primary', ...effect});
        const standard = _.Icon({name:'home', color:'primary', ...effect});
        const filled = _.Icon({name:'home', fill:true, color:'primary', ...effect});
        const sprite = _.Icon({name:'#chevron-down', fill:true});
        const customContent = _.span('Custom');
        const custom = _.Icon({name:customContent, fill:true});
        const legacy = _.Icon({name:'#legacy-fill', fill:false});
        document.body.append(standard, filled, reactive, sprite, custom, legacy);
        const read = icon => ({axis:getComputedStyle(icon).fontVariationSettings, text:icon.textContent, leaked:icon.hasAttribute('fill'), filled:icon.classList.contains('material-icons-fill')});
        const states = [read(reactive)];
        setFill(true); states.push(read(reactive));
        setFill(false); states.push(read(reactive));
        results.push({theme, effect, standard:read(standard), filled:read(filled), states, sprite:read(sprite), svgFill:sprite.querySelector('svg').style.fill, custom:read(custom), customKept:custom.contains(customContent), legacyFill:legacy.querySelector('svg').style.fill});
        for (const icon of [standard, filled, reactive, sprite, custom, legacy]) icon.remove();
      }
    }
    document.body.dataset.result = encodeURIComponent(JSON.stringify(results));
  </script>`);
  const rows = readBrowserResult(await runChrome(findChrome(), html));
  assert.equal(rows.length, 8);
  for (const row of rows) {
    assert.match(row.standard.axis, /"FILL" 0/);
    assert.match(row.filled.axis, /"FILL" 1/);
    assert.equal(row.filled.text, 'home');
    assert.deepEqual(row.states.map(state => state.filled), [false, true, false]);
    assert.match(row.states[1].axis, /"FILL" 1/);
    assert.match(row.states[2].axis, /"FILL" 0/);
    for (const state of [row.standard, row.filled, ...row.states, row.sprite, row.custom]) assert.equal(state.leaked, false);
    assert.equal(row.sprite.filled, false);
    assert.equal(row.svgFill, '');
    assert.equal(row.custom.filled, false);
    assert.equal(row.customKept, true);
    assert.equal(row.legacyFill, 'currentcolor');
  }
});

test("Alert shares Header palette and effects with readable actions across themes and widths", { skip: !findChrome() ? "Chrome unavailable" : false }, async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'jss-alert-surfaces-'));
  const html = path.join(tmp, 'index.html');
  const asset = name => pathToFileURL(path.join(ROOT_DIR, name)).href;
  await writeFile(html, `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><style>*{transition:none!important}</style><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>
    const rows=[],host=document.querySelector('#host');
    for(const theme of ['light','dark']){
      _.setTheme(theme,{persist:false});
      for(const color of ['primary','secondary','success','warning','danger','info','light','dark'])
      for(const effect of [{},{dense:true},{flat:true},{border:true},{shadow:true},{lightShadow:true},{glow:true},{glossy:true},{glass:true},{gradient:true},{textGradient:true},{outline:true},{outline:true,glass:true},{outline:true,textGradient:true},{outline:true,glow:true},{outline:true,glossy:true}]){
        const a=_.Alert({color,...effect,title:'Titolo',message:'Messaggio',description:'Descrizione',meta:'Dettagli',dismissible:true,actions:_.Button({label:'Azione'})});
        const h=_.Header({color,...effect,title:'Titolo',left:false,sticky:false});host.replaceChildren(a,h);
        const s=getComputedStyle(a),hs=getComputedStyle(h),button=getComputedStyle(a.querySelector('.jss-alert-actions button'));
        rows.push({theme,color,effect,classes:a.className,surface:s.backgroundColor,headerSurface:hs.backgroundColor,text:s.color,headerText:hs.color,sub:getComputedStyle(a.querySelector('.jss-alert-description')).color,button:button.color,buttonSurface:button.backgroundColor,shadow:s.boxShadow,headerShadow:hs.boxShadow,image:s.backgroundImage,headerImage:hs.backgroundImage,clip:getComputedStyle(a.querySelector('.jss-alert-title')).backgroundClip,glass:getComputedStyle(a,'::before').backgroundImage,border:s.borderTopWidth,overflow:document.documentElement.scrollWidth>innerWidth});
      }
      const content={title:'Titolo',message:'Messaggio',description:'Descrizione',actions:_.Button({label:'Azione'})};
      const normal=_.Alert(content),dense=_.Alert({...content,actions:_.Button({label:'Azione'}),dense:true}),large=_.Alert({...content,actions:_.Button({label:'Azione'}),size:24}),gap=_.Alert({...content,actions:_.Button({label:'Azione'}),gap:24});
      host.replaceChildren(normal,dense,large,gap);
      rows.push({theme,density:dense.getBoundingClientRect().height<normal.getBoundingClientRect().height,font:parseFloat(getComputedStyle(large).fontSize),normalFont:parseFloat(getComputedStyle(normal).fontSize),icon:parseFloat(getComputedStyle(large.querySelector('.jss-icon')).fontSize),gap:getComputedStyle(gap).gap});
    }
    document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));
  </script>`);
  for (const width of [1200,390]) {
    for (const row of readBrowserResult(await runChrome(findChrome(), html, {width}))) {
      if ('density' in row) {
        assert.equal(row.density,true,JSON.stringify(row));
        assert.equal(row.font,24); assert.ok(row.font>row.normalFont); assert.equal(row.icon,24); assert.equal(row.gap,'24px');
        continue;
      }
      for (const key of Object.keys(row.effect)) {
        const name=key==='lightShadow'?'light-shadow':key==='textGradient'?'text-gradient':key;
        assert.ok(row.classes.split(' ').includes('jss-'+name),JSON.stringify(row));
      }
      if (!row.effect.glass) {
        assert.equal(row.surface,row.headerSurface,JSON.stringify(row));
        assert.equal(row.text,row.headerText,JSON.stringify(row));
      }
      if (row.effect.shadow || row.effect.lightShadow || row.effect.glow) assert.equal(row.shadow,row.headerShadow,JSON.stringify(row));
      if (row.effect.glossy || row.effect.gradient || row.effect.lightShadow) assert.equal(row.image,row.headerImage,JSON.stringify(row));
      if (row.effect.glass) assert.match(row.glass,/gradient/,JSON.stringify(row));
      if (row.effect.glass && row.color==='light') assert.equal(row.text,'rgb(31, 41, 55)',JSON.stringify(row));
      if (row.effect.glass && row.color==='dark') assert.equal(row.text,'rgb(241, 245, 249)',JSON.stringify(row));
      if (row.effect.textGradient) assert.equal(row.clip,'text',JSON.stringify(row));
      if (row.effect.border || row.effect.outline) assert.equal(row.border,'1px',JSON.stringify(row));
      else assert.equal(row.border,'0px',JSON.stringify(row));
      assert.equal(row.sub,row.text,JSON.stringify(row));
      assert.equal(row.button,row.text,JSON.stringify(row));
      assert.notEqual(row.buttonSurface,'rgba(0, 0, 0, 0)',JSON.stringify(row));
      assert.equal(row.overflow,false,JSON.stringify(row));
    }
  }
});

test("Alert preserves tone precedence, reactive roles, slots and cancellable dismissal", { skip: !findChrome() ? "Chrome unavailable" : false }, async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'jss-alert-behavior-'));
  const html = path.join(tmp, 'index.html');
  const asset = name => pathToFileURL(path.join(ROOT_DIR,name)).href;
  await writeFile(html, `<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>
    const [getTone,setTone]=_.signal('info'),[getText,setText]=_.signal('Prima'),[getDense,setDense]=_.signal(false);
    const a=_.Alert({color:getTone,dense:getDense,message:getText,slots:{title:()=>_.span('Titolo custom')},aside:_.span('Aside'),actions:_.Button({color:'success',label:'Azione'}),stack:true});
    const explicit=_.Alert({color:'info',state:'success',type:'danger',message:'Precedenza'}),fixed=_.Alert({color:getTone,role:'note',message:'Ruolo esplicito'}),fallback=_.Alert({message:'Default'});
    const cancelled=_.Alert({message:'Conserva',dismissible:true,onDismiss:event=>event.preventDefault()}),dismissed=_.Alert({message:'Chiudi',dismissible:true});
    document.body.append(a,explicit,fixed,fallback,cancelled,dismissed);
    const before=a.getAttribute('role');setTone('warning');setText('Dopo');setDense(true);
    cancelled.querySelector('.jss-alert-close').click();dismissed.querySelector('.jss-alert-close').click();
    document.body.dataset.result=encodeURIComponent(JSON.stringify({before,after:a.getAttribute('role'),text:a.querySelector('.jss-alert-message').textContent,title:a.querySelector('.jss-alert-title').textContent,dense:a.classList.contains('jss-dense'),state:a.classList.contains('jss-state-warning'),old:a.classList.contains('jss-state-info'),precedence:explicit.className,fixed:fixed.getAttribute('role'),defaultState:fallback.classList.contains('jss-state-warning'),kept:cancelled.isConnected,removed:!dismissed.isConnected,aside:a.querySelector('.jss-alert-side').textContent,stack:getComputedStyle(a.querySelector('.jss-alert-side')).flexBasis,child:a.querySelector('.jss-alert-actions button').classList.contains('jss-state-success')}));
  </script>`);
  const row=readBrowserResult(await runChrome(findChrome(),html));
  assert.equal(row.before,'status');assert.equal(row.after,'alert');assert.equal(row.text,'Dopo');assert.equal(row.title,'Titolo custom');
  assert.equal(row.dense,true);assert.equal(row.state,true);assert.equal(row.old,false);
  assert.match(row.precedence,/jss-state-danger/);assert.doesNotMatch(row.precedence,/jss-state-(success|info)/);
  assert.equal(row.fixed,'note');assert.equal(row.defaultState,true);assert.equal(row.kept,true);assert.equal(row.removed,true);assert.equal(row.aside,'Aside');assert.equal(row.stack,'100%');assert.equal(row.child,true);
});

test("EmptyState shares Alert palette and effects with readable actions across themes and widths", { skip: !findChrome() ? "Chrome unavailable" : false }, async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'jss-empty-surfaces-'));
  const html = path.join(tmp, 'index.html');
  const asset = name => pathToFileURL(path.join(ROOT_DIR, name)).href;
  await writeFile(html, `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><style>*{transition:none!important}</style><main id="host"></main><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><script>
    const rows=[],host=document.querySelector('#host');
    for(const theme of ['light','dark']){
      _.setTheme(theme,{persist:false});
      for(const color of ['primary','secondary','success','warning','danger','info','light','dark'])
      for(const effect of [{},{dense:true},{flat:true},{border:true},{shadow:true},{lightShadow:true},{glow:true},{glossy:true},{glass:true},{gradient:true},{textGradient:true},{outline:true},{outline:true,glass:true},{outline:true,textGradient:true},{outline:true,glow:true},{outline:true,glossy:true}]){
        const a=_.EmptyState({color,...effect,title:'Titolo',message:'Messaggio',description:'Descrizione',meta:'Dettagli',dismissible:true,actions:_.Button({label:'Azione'})});
        const h=_.Alert({color,...effect,title:'Titolo'});host.replaceChildren(a,h);
        const s=getComputedStyle(a),hs=getComputedStyle(h),button=getComputedStyle(a.querySelector('.jss-empty-state-actions button'));
        rows.push({theme,color,effect,classes:a.className,surface:s.backgroundColor,headerSurface:hs.backgroundColor,text:s.color,headerText:hs.color,sub:getComputedStyle(a.querySelector('.jss-empty-state-description')).color,button:button.color,buttonSurface:button.backgroundColor,shadow:s.boxShadow,headerShadow:hs.boxShadow,image:s.backgroundImage,headerImage:hs.backgroundImage,clip:getComputedStyle(a.querySelector('.jss-empty-state-title')).backgroundClip,glass:getComputedStyle(a,'::before').backgroundImage,border:s.borderTopWidth,overflow:document.documentElement.scrollWidth>innerWidth});
      }
      const content={title:'Titolo',message:'Messaggio',description:'Descrizione',actions:_.Button({label:'Azione'})};
      const normal=_.EmptyState(content),dense=_.EmptyState({...content,actions:_.Button({label:'Azione'}),dense:true}),large=_.EmptyState({...content,actions:_.Button({label:'Azione'}),size:24}),gap=_.EmptyState({...content,actions:_.Button({label:'Azione'}),gap:24});
      host.replaceChildren(normal,dense,large,gap);
      rows.push({theme,density:dense.getBoundingClientRect().height<normal.getBoundingClientRect().height,font:parseFloat(getComputedStyle(large).fontSize),normalFont:parseFloat(getComputedStyle(normal).fontSize),icon:parseFloat(getComputedStyle(large.querySelector('.jss-icon')).fontSize),gap:getComputedStyle(gap).gap});
    }
    document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));
  </script>`);
  for (const width of [1200,390]) {
    for (const row of readBrowserResult(await runChrome(findChrome(), html, {width}))) {
      if ('density' in row) {
        assert.equal(row.density,true,JSON.stringify(row));
        assert.equal(row.font,24); assert.ok(row.font>row.normalFont); assert.equal(row.icon,24); assert.equal(row.gap,'24px');
        continue;
      }
      for (const key of Object.keys(row.effect)) {
        const name=key==='lightShadow'?'light-shadow':key==='textGradient'?'text-gradient':key;
        assert.ok(row.classes.split(' ').includes('jss-'+name),JSON.stringify(row));
      }
      {
        assert.equal(row.surface,row.headerSurface,JSON.stringify(row));
        assert.equal(row.text,row.headerText,JSON.stringify(row));
      }
      if (row.effect.shadow || row.effect.lightShadow || row.effect.glow) assert.equal(row.shadow,row.headerShadow,JSON.stringify(row));
      if (row.effect.glossy || row.effect.gradient || row.effect.lightShadow) assert.equal(row.image,row.headerImage,JSON.stringify(row));
      if (row.effect.glass) assert.match(row.glass,/gradient/,JSON.stringify(row));
      if (row.effect.glass && row.color==='light') assert.equal(row.text,'rgb(31, 41, 55)',JSON.stringify(row));
      if (row.effect.glass && row.color==='dark') assert.equal(row.text,'rgb(241, 245, 249)',JSON.stringify(row));
      if (row.effect.textGradient) assert.equal(row.clip,'text',JSON.stringify(row));
      if (row.effect.border || row.effect.outline) assert.equal(row.border,'1px',JSON.stringify(row));
      else assert.equal(row.border,'0px',JSON.stringify(row));
      assert.equal(row.sub,row.text,JSON.stringify(row));
      assert.equal(row.button,row.text,JSON.stringify(row));
      assert.notEqual(row.buttonSurface,'rgba(0, 0, 0, 0)',JSON.stringify(row));
      assert.equal(row.overflow,false,JSON.stringify(row));
    }
  }
});

test("Form binds native controls, resets, validates edits and cleans up submitting effects", { skip: !findChrome() ? "Chrome unavailable" : false }, async () => {
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-form-')),html=path.join(tmp,'index.html');
 const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><main id="host"></main><script>
 (async()=>{const tick=()=>new Promise(r=>setTimeout(r,0)),model=_.rod({name:'Ada'}),form=_.useForm({model,validateOn:'input',rules:{name:v=>v==='Good'||'Nome non valido'}}),field=form.field('name');let submitted=null;
 const root=_.Form({form,padding:24,width:300,onSubmit:values=>submitted=values.name,slots:{default:()=>[_.Input({label:'Nome',...field}),_.Button({type:'submit',label:'Salva'}),_.Button({type:'reset',label:'Reset'})]}});document.querySelector('#host').append(root);
 const input=root.querySelector('input'),initial=input.value;form.setValue('name','Programmatic');await tick();const programmatic=input.value;
 input.value='Bad';input.dispatchEvent(new Event('input',{bubbles:true}));await tick();const bad=form.getError('name');input.value='Good';input.dispatchEvent(new Event('input',{bubbles:true}));await tick();const good=form.getError('name');root.requestSubmit();await tick();const result=submitted;
 root.querySelector('button[type=reset]').click();await tick();const reset={value:input.value,model:form.getValue('name')};const size={padding:getComputedStyle(root).padding,width:getComputedStyle(root).width};
 _.mount(document.querySelector('#host'),_.span('Replacement'));form.submitting.value=true;await tick();const cleanup=!root.classList.contains('is-submitting');field.dispose();
 document.body.dataset.result=encodeURIComponent(JSON.stringify({initial,programmatic,bad,good,result,reset,size,cleanup}));})().catch(e=>document.body.dataset.result=encodeURIComponent(JSON.stringify({error:String(e)})));
 </script>`);
 const row=readBrowserResult(await runChrome(findChrome(),html));assert.equal(row.error,undefined,JSON.stringify(row));assert.equal(row.initial,'Ada');assert.equal(row.programmatic,'Programmatic');assert.equal(row.bad,'Nome non valido');assert.equal(row.good,null);assert.equal(row.result,'Good');assert.deepEqual(row.reset,{value:'Ada',model:'Ada'});assert.deepEqual(row.size,{padding:'24px',width:'300px'});assert.equal(row.cleanup,true);
});

test("Explicit card sections inherit Card surfaces and respect dividers density and responsive layout", { skip: !findChrome() ? "Chrome unavailable" : false }, async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-sections-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><style>*{transition:none!important}body{margin:12px}</style><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><main id="host"></main><script>
 const host=document.querySelector('#host'),rows=[];
 for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const color of ['primary','secondary','success','warning','danger','info','light','dark'])for(const effect of [{},{dense:true},{glass:true},{glow:true},{gradient:true},{textGradient:true},{outline:true},{shadow:true},{lightShadow:true},{glossy:true}]){
 const make=divider=>_.Card({color,...effect},_.cardHeader({divider},_.strong('Titolo')),_.cardBody({},_.span('Contenuto')),_.cardFooter({divider},_.Button({color:'primary',label:'Azione'})));
 const a=make(false),b=make(true);host.replaceChildren(a,b);const root=getComputedStyle(a),header=getComputedStyle(a.querySelector('.jss-card-header')),body=getComputedStyle(a.querySelector('.jss-card-body')),footer=getComputedStyle(a.querySelector('.jss-card-footer'));
 rows.push({theme,color,effect,text:root.color,sectionText:[header.color,body.color,footer.color],surfaces:[header.backgroundColor,body.backgroundColor,footer.backgroundColor],margin:header.marginTop,borders:[header.borderBottomWidth,footer.borderTopWidth],dividers:[getComputedStyle(b.querySelector('.jss-card-header')).borderBottomWidth,getComputedStyle(b.querySelector('.jss-card-footer')).borderTopWidth],overflow:document.documentElement.scrollWidth>innerWidth});}
 const make=dense=>_.Card({dense},_.cardHeader({},_.span('Titolo')),_.cardBody({},_.span('Testo')),_.cardFooter({},_.Button({label:'Azione'})));const normal=make(false),dense=make(true);host.replaceChildren(normal,dense);const compact=dense.getBoundingClientRect().height<normal.getBoundingClientRect().height;
 const [get,set]=_.signal('Prima');const custom=_.Card({},_.cardHeader({slots:{default:()=>_.strong('Slot')}}),_.cardBody({},()=>get()),_.cardFooter({direction:'column',tablet:{direction:'row'},gap:12},_.Button({label:'Uno'}),_.Button({label:'Due'})));host.replaceChildren(custom);set('Dopo');rows.push({compact,slot:custom.querySelector('.jss-card-header').textContent,reactive:custom.querySelector('.jss-card-body').textContent,direction:getComputedStyle(custom.querySelector('.jss-card-footer')).flexDirection});}
 document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));</script>`);
 for(const width of [390,1200])for(const row of readBrowserResult(await runChrome(findChrome(),html,{width}))){if('compact' in row){assert.equal(row.compact,true);assert.equal(row.slot,'Slot');assert.equal(row.reactive,'Dopo');assert.equal(row.direction,width<768?'column':'row');continue;}assert.deepEqual(row.sectionText,[row.text,row.text,row.text],JSON.stringify(row));assert.deepEqual(row.surfaces,['rgba(0, 0, 0, 0)','rgba(0, 0, 0, 0)','rgba(0, 0, 0, 0)']);assert.equal(row.margin,'0px');assert.deepEqual(row.borders,['0px','0px']);assert.deepEqual(row.dividers,['1px','1px']);assert.equal(row.overflow,false);}
});

test("Card effects preserve child Button foreground and border", { skip: !findChrome() ? "Chrome unavailable" : false }, async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-card-glass-buttons-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><style>*{transition:none!important}</style><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>
 const rows=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const parentEffect of [{glass:true},{outline:true},{outline:true,glass:true},{textGradient:true}])for(const cardColor of ['primary','secondary','success','warning','danger','info','light','dark'])for(const color of ['primary','secondary','success','warning','danger','info','light','dark'])for(const effect of [{},{outline:true},{glass:true}]){
 const a=_.Button({color,...effect,label:'Azione'}),b=_.Button({color,...effect,label:'Azione'}),card=_.Card({color:cardColor,...parentEffect},_.cardFooter({},a));document.body.replaceChildren(card,b);const read=e=>{const s=getComputedStyle(e);return {color:s.color,fill:s.webkitTextFillColor,border:s.borderTopColor,background:s.backgroundColor}};rows.push({theme,parentEffect,cardColor,color,effect,inside:read(a),outside:read(b)});}}
 document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));</script>`);
 const rows=readBrowserResult(await runChrome(findChrome(),html));assert.equal(rows.length,1536);for(const row of rows)assert.deepEqual(row.inside,row.outside,JSON.stringify(row));
});

test("Light Card Outline and Text Gradient keep a visible neutral border in both themes", { skip: !findChrome() ? "Chrome unavailable" : false },async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-card-light-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>const rows=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const effect of [{outline:true},{textGradient:true}]){const card=_.Card({color:'light',...effect},_.cardHeader({},'light'),_.cardBody({},'Contenuto'));document.body.replaceChildren(card);const s=getComputedStyle(card);rows.push({theme,effect,border:s.borderTopColor,width:s.borderTopWidth,image:s.backgroundImage});}}document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));</script>`);
 for(const row of readBrowserResult(await runChrome(findChrome(),html))){assert.equal(row.border,'rgb(203, 213, 225)');assert.equal(row.width,'1px');if(row.effect.textGradient){assert.match(row.image,/gradient/);if(row.theme==='dark')assert.match(row.image,/248, 250, 252/);}}
});

test("Light Glass Card stays translucent with readable section text in both themes", { skip: !findChrome() ? "Chrome unavailable" : false },async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-card-light-glass-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>const rows=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const outline of [false,true]){const card=_.Card({color:'light',glass:true,outline},_.cardHeader({},'light'),_.cardBody({},'Contenuto'),_.cardFooter({},_.Button({color:'primary',label:'Azione'})));document.body.replaceChildren(card);const s=getComputedStyle(card),veil=getComputedStyle(card,'::before');rows.push({theme,outline,background:s.backgroundColor,text:s.color,section:getComputedStyle(card.querySelector('.jss-card-body')).color,filter:veil.filter,veil:veil.getPropertyValue('--set-sec-color').trim()});}}document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));</script>`);
 for(const row of readBrowserResult(await runChrome(findChrome(),html))){assert.equal(row.background,'rgba(241, 245, 249, 0.28)');assert.equal(row.text,row.theme==='dark'?'rgb(241, 245, 249)':'rgb(31, 41, 55)');assert.equal(row.section,row.text);assert.equal(row.filter,'none');assert.equal(row.veil,'rgb(241 245 249 / 8%)');}
});

test("Upload follows Card surfaces with readable lines text and independent buttons", { skip: !findChrome() ? "Chrome unavailable" : false },async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-upload-surfaces-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><style>*{transition:none!important}body{margin:12px}</style><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>
 const rows=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const color of ['primary','secondary','success','warning','danger','info','light','dark'])for(const effect of [{},{dense:true},{flat:true},{border:true},{shadow:true},{lightShadow:true},{glow:true},{glass:true},{glossy:true},{gradient:true},{textGradient:true},{outline:true},{outline:true,glass:true}]){
 const upload=_.BoxUpload({color,...effect,submitMode:'form'}),card=_.Card({color,...effect},'Card'),button=_.Button({color:'primary',size:'sm',label:'Browse'});document.body.replaceChildren(upload,card,button);const s=getComputedStyle(upload),c=getComputedStyle(card),b=getComputedStyle(upload.querySelector('.jss-upload-actions button')),expected=getComputedStyle(button);
 rows.push({theme,color,effect,surface:s.backgroundColor,expected:c.backgroundColor,text:s.color,cardText:c.color,sub:getComputedStyle(upload.querySelector('.jss-upload-subtitle')).color,empty:getComputedStyle(upload.querySelector('.jss-upload-empty')).color,border:s.borderTopWidth,cardBorder:c.borderTopWidth,shadow:s.boxShadow,cardShadow:c.boxShadow,button:b.color,expectedButton:expected.color,buttonFill:b.webkitTextFillColor,expectedFill:expected.webkitTextFillColor,clip:getComputedStyle(upload.querySelector('.jss-upload-title')).backgroundClip,clear:getComputedStyle(upload.querySelector('.jss-upload-clear')).color,clearOpacity:getComputedStyle(upload.querySelector('.jss-upload-clear')).opacity,line:getComputedStyle(upload.querySelector('.jss-upload-empty')).borderTopWidth,innerOverflow:upload.querySelector('.jss-upload-dropzone').scrollWidth>upload.querySelector('.jss-upload-dropzone').clientWidth,overflow:document.documentElement.scrollWidth>innerWidth});upload._dispose();}
 const make=dense=>_.Upload({dense,submitMode:'form'});const normal=make(false),dense=make(true);document.body.replaceChildren(normal,dense);rows.push({density:dense.getBoundingClientRect().height<normal.getBoundingClientRect().height});normal._dispose();dense._dispose();}document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));</script>`);
 for(const width of [390,1200])for(const row of readBrowserResult(await runChrome(findChrome(),html,{width}))){if('density'in row){assert.equal(row.density,true);continue;}assert.equal(row.surface,row.expected,JSON.stringify(row));assert.equal(row.text,row.cardText,JSON.stringify(row));assert.equal(row.sub,row.text);assert.equal(row.empty,row.text);assert.equal(row.border,row.cardBorder);assert.equal(row.shadow,row.cardShadow);assert.equal(row.button,row.expectedButton);assert.equal(row.buttonFill,row.expectedFill);assert.equal(row.clear,row.text);assert.equal(row.clearOpacity,'0.65');assert.equal(row.line,'1px');assert.equal(row.innerOverflow,false,JSON.stringify(row));if(row.effect.textGradient)assert.equal(row.clip,'text');assert.equal(row.overflow,false,JSON.stringify(row));}
});

test("Upload selects removes clears and honors disabled state and tone updates", { skip: !findChrome() ? "Chrome unavailable" : false },async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-upload-files-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>
 (async()=>{const [disabled,setDisabled]=_.signal(false),[tone,setTone]=_.signal('info');const root=_.Upload({state:tone,color:'danger',disabled,submitMode:'form',width:320}),api=root._upload;document.body.append(root);await api.addFiles([new File(['abc'],'a.txt'),new File(['def'],'b.txt')]);const count=root.querySelectorAll('.jss-upload-file').length;await api.remove(api.files()[0]);const removed=api.files().length;api.clear();const cleared=api.files().length;setDisabled(true);const buttons=[...root.querySelectorAll('.jss-upload-actions button')].every(b=>b.disabled);await api.addFiles([new File(['x'],'blocked.txt')]);const blocked=api.files().length;setTone('success');const precedence=root.classList.contains('jss-state-success')&&!root.classList.contains('jss-state-danger')&&!root.classList.contains('jss-state-info');const tabindex=root.tabIndex;root._dispose();setDisabled(false);const stopped=root.getAttribute('aria-disabled')==='true';document.body.dataset.result=encodeURIComponent(JSON.stringify({count,removed,cleared,buttons,blocked,precedence,tabindex,stopped}));})().catch(e=>document.body.dataset.result=encodeURIComponent(JSON.stringify({error:String(e)})));
 </script>`);const row=readBrowserResult(await runChrome(findChrome(),html));assert.equal(row.error,undefined,JSON.stringify(row));assert.deepEqual(row,{count:2,removed:1,cleared:0,buttons:true,blocked:0,precedence:true,tabindex:-1,stopped:true});
});

test("Dark Glass Upload stays dark and translucent with pale text in both themes", { skip: !findChrome() ? "Chrome unavailable" : false },async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-upload-dark-glass-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>const rows=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const outline of [false,true]){const root=_.BoxUpload({color:'dark',glass:true,outline,submitMode:'form'});document.body.replaceChildren(root);const s=getComputedStyle(root);rows.push({theme,outline,background:s.backgroundColor,text:s.color,sub:getComputedStyle(root.querySelector('.jss-upload-subtitle')).color,clear:getComputedStyle(root.querySelector('.jss-upload-clear')).color,veil:getComputedStyle(root,'::before').opacity});root._dispose();}}document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));</script>`);
 for(const row of readBrowserResult(await runChrome(findChrome(),html))){assert.equal(row.background,'rgba(15, 23, 42, 0.76)');assert.equal(row.text,'rgb(241, 245, 249)');assert.equal(row.sub,row.text);assert.equal(row.clear,row.text);assert.equal(row.veil,'0.5');}
});

test("Dark Outline Upload uses defined neutral foreground and edge in both themes", { skip: !findChrome() ? "Chrome unavailable" : false },async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-upload-dark-outline-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>const rows=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});const root=_.BoxUpload({color:'dark',outline:true,submitMode:'form'});document.body.replaceChildren(root);const s=getComputedStyle(root);rows.push({theme,text:s.color,border:s.borderTopColor,background:s.backgroundColor,sub:getComputedStyle(root.querySelector('.jss-upload-subtitle')).color,clear:getComputedStyle(root.querySelector('.jss-upload-clear')).color});root._dispose();}document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));</script>`);
 for(const row of readBrowserResult(await runChrome(findChrome(),html))){assert.equal(row.text,row.theme==='light'?'rgb(31, 41, 55)':'rgb(226, 232, 240)');assert.equal(row.border,row.theme==='light'?'rgb(51, 65, 85)':'rgb(100, 116, 139)');assert.equal(row.background,'rgba(0, 0, 0, 0)');assert.equal(row.sub,row.text);assert.equal(row.clear,row.text);}
});

test("Upload ignores file validation completed after clear disposal or disable", { skip: !findChrome() ? "Chrome unavailable" : false },async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-upload-stale-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><script>(async()=>{const rows=[];for(const action of ['clear','dispose','disable']){let release;const [disabled,setDisabled]=_.signal(false);const root=_.Upload({disabled,submitMode:'form',validate:()=>new Promise(r=>release=r)});document.body.append(root);const pending=root._upload.addFiles([new File(['x'],'late.txt')]);if(action==='clear')root._upload.clear();if(action==='dispose')root._dispose();if(action==='disable')setDisabled(true);release(true);await pending;rows.push({action,count:root._upload.files().length});root._dispose();}document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));})()</script>`);
 for(const row of readBrowserResult(await runChrome(findChrome(),html)))assert.equal(row.count,0,row.action);
});

test("Calendar and Date share palette effects and readable selection controls", { skip: !findChrome() ? "Chrome unavailable" : false },async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-calendar-shared-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${asset('packages/ui/dist/css/ui.css')}"><style>*{transition:none!important}body{margin:12px}</style><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><main id="host"></main><script>
 const host=document.querySelector('#host'),rows=[];for(const theme of ['light','dark']){_.setTheme(theme,{persist:false});for(const color of ['primary','secondary','success','warning','danger','info','light','dark'])for(const effect of [{},{dense:true},{glass:true},{glow:true},{shadow:true},{gradient:true},{textGradient:true},{outline:true}]){const cal=_.Calendar({color,...effect,value:'2026-10-12'}),card=_.Card({color,...effect},'Card');host.replaceChildren(cal,card);const s=getComputedStyle(cal),c=getComputedStyle(card),day=cal.querySelector('.jss-date-day.is-selected');rows.push({theme,color,effect,background:s.backgroundColor,expected:c.backgroundColor,text:s.color,expectedText:c.color,day:getComputedStyle(day).color,fill:getComputedStyle(day).webkitTextFillColor,selected:getComputedStyle(day).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth});}
 const model=_.rod('2026-10-12'),cal=_.Calendar({model,color:'success',width:320});host.replaceChildren(cal);cal._select('2026-10-15');const selected=cal._getValue();const date=_.Date({color:'success',glass:true,value:'2026-10-12'});host.append(date);date._open();const panel=document.querySelector('.jss-date-overlay .jss-date-panel');rows.push({shared:!!panel?.classList.contains('jss-card'),glass:!!panel?.classList.contains('jss-glass'),selected,width:getComputedStyle(cal).width});date._close();}
 document.body.dataset.result=encodeURIComponent(JSON.stringify(rows));</script>`);
 for(const width of [390,1200])for(const row of readBrowserResult(await runChrome(findChrome(),html,{width}))){if('shared'in row){assert.equal(row.shared,true);assert.equal(row.glass,true);assert.equal(row.selected,'2026-10-15');assert.equal(row.width,'320px');continue;}assert.equal(row.background,row.expected,JSON.stringify(row));assert.equal(row.text,row.expectedText);assert.equal(row.day,row.text);assert.equal(row.fill,row.text);assert.notEqual(row.selected,'rgba(0, 0, 0, 0)');assert.equal(row.overflow,false,JSON.stringify(row));}
});

test("Calendar honors selection modes limits readonly actions and lifecycle", { skip: !findChrome() ? "Chrome unavailable" : false },async()=>{
 const tmp=await mkdtemp(path.join(os.tmpdir(),'jss-calendar-audit-')),html=path.join(tmp,'index.html');const asset=name=>pathToFileURL(path.join(ROOT_DIR,name)).href;
 await writeFile(html,`<!doctype html><script src="${asset('packages/core/dist/cms.js')}"></script><script src="${asset('packages/ui/dist/ui.js')}"></script><body><main id="host"></main><script>(async()=>{const host=document.querySelector('#host'),tick=()=>new Promise(r=>setTimeout(r,0)),out={};
 const single=_.Calendar({value:'2026-10-12',min:'2026-10-05',max:'2026-10-25',weekdaysOnly:true});host.append(single);single._select('2026-10-03');out.blocked=single._getValue();single._select('2026-10-15');out.single=single._getValue();
 const range=_.Calendar({range:true});host.append(range);range._select('2026-10-16');range._select('2026-10-12');out.range=range._getValue();
 const multi=_.Calendar({multiple:true});host.append(multi);multi._select('2026-10-12');multi._select('2026-10-16');multi._select('2026-10-12');out.multi=multi._getValue();
 out.locked=[];for(const prop of ['disabled','readonly']){const root=_.Calendar({[prop]:true,value:'2026-10-12'});host.append(root);root._select('2026-10-15');root._clear();out.locked.push(root._getValue());}
 const model=_.rod('2026-10-12'),count=model._actions.length,reactive=_.Calendar({model});host.append(reactive);model.value='2026-10-20';await tick();out.external=reactive._getValue();_.mount(host,_.span('Replacement'));out.watchers=model._actions.length-count;model.value='2026-10-21';await tick();out.usable=model.value;
 document.body.dataset.result=encodeURIComponent(JSON.stringify(out));})().catch(e=>document.body.dataset.result=encodeURIComponent(JSON.stringify({error:String(e)})));</script>`);
 const row=readBrowserResult(await runChrome(findChrome(),html));assert.equal(row.error,undefined);assert.equal(row.blocked,'2026-10-12');assert.equal(row.single,'2026-10-15');assert.deepEqual(row.range,{from:'2026-10-12',to:'2026-10-16'});assert.deepEqual(row.multi,['2026-10-16']);assert.deepEqual(row.locked,['2026-10-12','2026-10-12']);assert.equal(row.external,'2026-10-20');assert.equal(row.watchers,0);assert.equal(row.usable,'2026-10-21');
});
