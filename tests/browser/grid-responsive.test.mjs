import test from "node:test";
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
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
    await send("Page.navigate", { url: pageUrl });
    await sleep(options.navigateDelayMs || 1200);

    const result = await send("Runtime.evaluate", {
      expression: evaluateExpression,
      returnByValue: true,
      awaitPromise: true
    });

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

      requestAnimationFrame(() => {
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
      });
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
          colBase: col.style.getPropertyValue("--cms-grid-col-base"),
          colTablet: col.style.getPropertyValue("--cms-grid-col-tablet"),
          colPc: col.style.getPropertyValue("--cms-grid-col-pc"),
          rspGridColumn: col.style.getPropertyValue("--cms-rsp-grid-column"),
          rspPcGridColumn: col.style.getPropertyValue("--cms-rsp-pc-grid-column"),
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
  assert.equal(result.colClassName.includes("cms-rsp-grid-column"), false);
  assert.equal(result.colClassName.includes("cms-rsp-pc-grid-column"), false);
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
        rspWidth: avatar.style.getPropertyValue("--cms-rsp-width"),
        rspTabletWidth: avatar.style.getPropertyValue("--cms-rsp-tablet-width")
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
  assert.equal(mobile.className.includes("cms-rsp"), true);
  assert.equal(mobile.className.includes("cms-rsp-width"), true);
  assert.equal(mobile.className.includes("cms-rsp-tablet-width"), true);
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
        childABase: childA.style.getPropertyValue("--cms-grid-col-base"),
        childATablet: childA.style.getPropertyValue("--cms-grid-col-tablet"),
        childAPc: childA.style.getPropertyValue("--cms-grid-col-pc"),
        childBBase: childB.style.getPropertyValue("--cms-grid-col-base"),
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
  assert.match(result.childATablet, /--cms-grid-col-base/);
  assert.match(result.childAPc, /--cms-grid-col-tablet/);
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
        gapSm: rootStyle.getPropertyValue("--cms-gap-sm").trim(),
        gapMd: rootStyle.getPropertyValue("--cms-gap-md").trim(),
        gapLg: rootStyle.getPropertyValue("--cms-gap-lg").trim(),
        rspGap: toolbar.style.getPropertyValue("--cms-rsp-gap"),
        rspTabletGap: toolbar.style.getPropertyValue("--cms-rsp-tablet-gap"),
        rspPcGap: toolbar.style.getPropertyValue("--cms-rsp-pc-gap")
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
        gapSm: rootStyle.getPropertyValue("--cms-gap-sm").trim(),
        gapMd: rootStyle.getPropertyValue("--cms-gap-md").trim(),
        pSm: rootStyle.getPropertyValue("--cms-p-sm").trim(),
        pLg: rootStyle.getPropertyValue("--cms-p-lg").trim()
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
          menuWidth: panel.style.getPropertyValue("--cms-menu-width"),
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
  assert.equal(result.className.includes("cms-rsp-width"), true);
  assert.equal(result.className.includes("cms-rsp-tablet-width"), true);
  assert.equal(result.className.includes("cms-rsp-pc-width"), true);
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
          menuWidth: panel.style.getPropertyValue("--cms-menu-width"),
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
  assert.equal(result.className.includes("cms-context-menu-panel"), true);
  assert.equal(result.className.includes("cms-rsp-width"), true);
  assert.equal(result.className.includes("cms-rsp-tablet-width"), true);
  assert.equal(result.className.includes("cms-rsp-pc-width"), true);
  assert.equal(result.menuWidth, "calc(100vw - 32px)");
  assert.ok(result.panelWidth >= 300 && result.panelWidth < result.viewportWidth, JSON.stringify(result));
  assert.ok(result.left >= 8, JSON.stringify(result));
  assert.ok(result.right <= result.viewportWidth - 8, JSON.stringify(result));
});

test("Menu repositions when panel width grows after open", {
  skip: findChrome() ? false : "Chrome/Chromium is not available"
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

  const result = readBrowserResult(await runChrome(chromePath, htmlFile, { width: 390, height: 844 }));

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
        const panel = document.querySelector(".cms-overlay-panel.cms-dialog");
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
      const panel = document.querySelector(".cms-overlay-panel.cms-dialog");
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
