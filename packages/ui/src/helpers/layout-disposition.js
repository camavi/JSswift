  const layoutDispositionMap = {
    classic: { side: "left", nav: "top", rows: ["header", "nav", "body", "footer"] },
    classicright: { side: "right", nav: "top", rows: ["header", "nav", "body", "footer"] },
    sidebarfullleft: { side: "left", fullSide: true, nav: "top", rows: ["header", "nav", "body", "footer"] },
    sidebarfullright: { side: "right", fullSide: true, nav: "top", rows: ["header", "nav", "body", "footer"] },
    appshell: { side: "left", nav: "top", rows: ["header", "nav", "body", "footer"] },
    dashboard: { side: "left", nav: "top", rows: ["header", "nav", "body", "footer"] },
    website: { side: null, nav: "top", rows: ["header", "nav", "body", "footer"] },
    documentation: { side: "right", nav: "left", rows: ["header", "body", "footer"] },
    landing: { side: null, nav: null, rows: ["header", "body", "footer"] }
  };
  const normalizeLayoutDisposition = (value) => {
    const raw = uiUnwrap(value);
    if (raw == null || raw === false || raw === "") return "";
    return String(raw).trim().toLowerCase().replace(/[\s_-]+/g, "");
  };
  const createLayoutDispositionAreas = (config, state) => {
    if (!config || !state.main) return null;
    const side = config.side || (state.aside ? "left" : null);
    const navPosition = config.nav || (state.nav ? "top" : null);
    const sideVisible = !!state.aside && !!side;
    const navVisible = !!state.nav && !!navPosition;
    const leftArea = navVisible && navPosition === "left" ? "nav" : (sideVisible && side === "left" ? "aside" : ".");
    const rightArea = navVisible && navPosition === "right" ? "nav" : (sideVisible && side === "right" ? "aside" : ".");
    const bodyRow = [leftArea, "main", rightArea];
    const rows = [];
    const rowNames = [...(config.rows || [])];
    if (navVisible && navPosition === "top" && !rowNames.includes("nav")) {
      const bodyIndex = rowNames.indexOf("body");
      rowNames.splice(bodyIndex >= 0 ? bodyIndex : rowNames.length, 0, "nav");
    }
    for (const rowName of rowNames) {
      if (rowName === "header" && state.header) {
        rows.push(config.fullSide && sideVisible && side === "left"
          ? ["aside", "header", "header"]
          : config.fullSide && sideVisible && side === "right"
            ? ["header", "header", "aside"]
            : ["header", "header", "header"]
        );
      } else if (rowName === "nav" && navVisible && navPosition === "top") {
        rows.push(config.fullSide && sideVisible && side === "left"
          ? ["aside", "nav", "nav"]
          : config.fullSide && sideVisible && side === "right"
            ? ["nav", "nav", "aside"]
            : ["nav", "nav", "nav"]
        );
      } else if (rowName === "body") {
        rows.push(bodyRow);
      } else if (rowName === "footer" && state.footer) {
        rows.push(config.fullSide && sideVisible && side === "left"
          ? ["aside", "footer", "footer"]
          : config.fullSide && sideVisible && side === "right"
            ? ["footer", "footer", "aside"]
            : ["footer", "footer", "footer"]
        );
      }
    }
    return rows.length ? rows.map((row) => `"${row.join(" ")}"`).join(" ") : null;
  };
