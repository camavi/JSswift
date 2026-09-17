import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COL_COUNT = 24;
const PRIMARY_MEDIA_BREAKPOINTS = [
  { size: 768, key: "tablet", primary: true },
  { size: 1024, key: "pc", primary: true },
];
const LEGACY_MEDIA_BREAKPOINTS = [
  { size: 400, key: "xs" },
  { size: 600, key: "sm" },
  { size: 900, key: "md" },
  { size: 1200, key: "lg" },
  { size: 1440, key: "xl" },
];
const MEDIA_BREAKPOINTS = [...PRIMARY_MEDIA_BREAKPOINTS, ...LEGACY_MEDIA_BREAKPOINTS]
  .sort((a, b) => a.size - b.size);
const OUT_FILES = [
  path.join(ROOT_DIR, "packages/ui/dist/css/responsive.css"),
  path.join(ROOT_DIR, "packages/jsswift/dist/css/responsive.css"),
];

// prefisso classe
const CLASS_PREFIX = "cms-";

const UI_SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl"];

const DEFAULT_SIZE_GROUPS = [
  { prefix: "m", unit: "px" },
  { prefix: "p", unit: "px" },
  { prefix: "b", unit: "px" },
  { prefix: "f", unit: "px" },
  { prefix: "fw", unit: "number" },
  { prefix: "lh", unit: "number" },
  { prefix: "ls", unit: "px" },
  { prefix: "w", unit: "%" },
  { prefix: "min-w", unit: "%" },
  { prefix: "max-w", unit: "%" },
  { prefix: "h", unit: "%" },
  { prefix: "min-h", unit: "%" },
  { prefix: "max-h", unit: "%" },
  { prefix: "r", unit: "px" },
  { prefix: "s", unit: "px" },
  { prefix: "gap", unit: "px" },
];

function parseSizeValue(value, unit, key, invalid) {
  const str = String(value);
  if (unit === "number") {
    if (!/^-?\d+(\.\d+)?$/.test(str)) {
      invalid.push(`${key}=${str} (expected number)`);
      return null;
    }
    const n = Number(str);
    if (!Number.isFinite(n) || n < 0) {
      invalid.push(`${key}=${str} (expected >= 0)`);
      return null;
    }
    return n;
  }

  if (unit === "px" || unit === "%") {
    const re = unit === "px" ? /^-?\d+(\.\d+)?px$/ : /^-?\d+(\.\d+)?%$/;
    if (!re.test(str)) {
      invalid.push(`${key}=${str} (expected ${unit})`);
      return null;
    }
    const n = Number(str.slice(0, -unit.length));
    if (!Number.isFinite(n) || n < 0) {
      invalid.push(`${key}=${str} (expected >= 0)`);
      return null;
    }
    return n;
  }

  invalid.push(`${key}=${str} (unknown unit ${unit})`);
  return null;
}

function validateDefaultSizes(defaultSize, sizes, groups) {
  const expected = new Set();
  const missing = [];
  const extras = [];
  const invalid = [];

  for (const group of groups) {
    let prev = -Infinity;
    for (const size of sizes) {
      const key = `${group.prefix}-${size}`;
      expected.add(key);
      if (!(key in defaultSize)) {
        missing.push(key);
        continue;
      }
      const parsed = parseSizeValue(defaultSize[key], group.unit, key, invalid);
      if (parsed !== null && parsed < prev) {
        invalid.push(`${key}=${defaultSize[key]} (non-increasing)`);
      }
      if (parsed !== null) {
        prev = parsed;
      }
    }
  }

  for (const key of Object.keys(defaultSize)) {
    if (!expected.has(key)) {
      extras.push(key);
    }
  }

  if (missing.length || extras.length || invalid.length) {
    const details = [];
    if (missing.length) details.push(`missing: ${missing.join(", ")}`);
    if (extras.length) details.push(`extras: ${extras.join(", ")}`);
    if (invalid.length) details.push(`invalid: ${invalid.join(", ")}`);
    throw new Error(`DEFAULT_SIZE validation failed: ${details.join(" | ")}`);
  }
}

const DEFAULT_SIZE = {
  //margin
  'm-xxs': '2px',
  'm-xs': '4px',
  'm-sm': '6px',
  'm-md': '10px',
  'm-lg': '16px',
  'm-xl': '24px',
  'm-xxl': '32px',
  'm-xxxl': '64px',
  //padding
  'p-xxs': '2px',
  'p-xs': '4px',
  'p-sm': '6px',
  'p-md': '10px',
  'p-lg': '16px',
  'p-xl': '24px',
  'p-xxl': '32px',
  'p-xxxl': '64px',
  //border
  'b-xxs': '2px',
  'b-xs': '4px',
  'b-sm': '6px',
  'b-md': '10px',
  'b-lg': '16px',
  'b-xl': '24px',
  'b-xxl': '32px',
  'b-xxxl': '64px',
  //font-size
  'f-xxs': '10px',
  'f-xs': '12px',
  'f-sm': '14px',
  'f-md': '16px',
  'f-lg': '18px',
  'f-xl': '20px',
  'f-xxl': '22px',
  'f-xxxl': '24px',
  //font-weight
  'fw-xxs': '100',
  'fw-xs': '200',
  'fw-sm': '300',
  'fw-md': '400',
  'fw-lg': '500',
  'fw-xl': '600',
  'fw-xxl': '700',
  'fw-xxxl': '800',
  //line-height
  'lh-xxs': '1',
  'lh-xs': '1.1',
  'lh-sm': '1.2',
  'lh-md': '1.3',
  'lh-lg': '1.4',
  'lh-xl': '1.5',
  'lh-xxl': '1.6',
  'lh-xxxl': '1.8',
  //letter-spacing
  'ls-xxs': '0px',
  'ls-xs': '0.2px',
  'ls-sm': '0.4px',
  'ls-md': '0.6px',
  'ls-lg': '0.8px',
  'ls-xl': '1px',
  'ls-xxl': '1.2px',
  'ls-xxxl': '1.6px',
  //width
  'w-xxs': '20%',
  'w-xs': '30%',
  'w-sm': '60%',
  'w-md': '80%',
  'w-lg': '100%',
  'w-xl': '120%',
  'w-xxl': '140%',
  'w-xxxl': '160%',
  //min-width
  'min-w-xxs': '20%',
  'min-w-xs': '30%',
  'min-w-sm': '60%',
  'min-w-md': '80%',
  'min-w-lg': '100%',
  'min-w-xl': '120%',
  'min-w-xxl': '140%',
  'min-w-xxxl': '160%',
  //max-width
  'max-w-xxs': '20%',
  'max-w-xs': '30%',
  'max-w-sm': '60%',
  'max-w-md': '80%',
  'max-w-lg': '100%',
  'max-w-xl': '120%',
  'max-w-xxl': '140%',
  'max-w-xxxl': '160%',
  //height
  'h-xxs': '20%',
  'h-xs': '40%',
  'h-sm': '60%',
  'h-md': '80%',
  'h-lg': '100%',
  'h-xl': '120%',
  'h-xxl': '140%',
  'h-xxxl': '160%',
  //min-height
  'min-h-xxs': '20%',
  'min-h-xs': '40%',
  'min-h-sm': '60%',
  'min-h-md': '80%',
  'min-h-lg': '100%',
  'min-h-xl': '120%',
  'min-h-xxl': '140%',
  'min-h-xxxl': '160%',
  //max-height
  'max-h-xxs': '20%',
  'max-h-xs': '40%',
  'max-h-sm': '60%',
  'max-h-md': '80%',
  'max-h-lg': '100%',
  'max-h-xl': '120%',
  'max-h-xxl': '140%',
  'max-h-xxxl': '160%',
  //border-radius
  'r-xxs': '2px',
  'r-xs': '4px',
  'r-sm': '6px',
  'r-md': '10px',
  'r-lg': '16px',
  'r-xl': '24px',
  'r-xxl': '32px',
  'r-xxxl': '9999px',
  //space
  's-xxs': '2px',
  's-xs': '4px',
  's-sm': '6px',
  's-md': '10px',
  's-lg': '16px',
  's-xl': '24px',
  's-xxl': '32px',
  's-xxxl': '64px',
  //gap
  'gap-xxs': '2px',
  'gap-xs': '4px',
  'gap-sm': '6px',
  'gap-md': '10px',
  'gap-lg': '16px',
  'gap-xl': '24px',
  'gap-xxl': '32px',
  'gap-xxxl': '64px',
};

const list_class = [
  //margin
  { class: 'm', name: 'margin', var: 'm' },
  { class: 'm-l', name: 'margin-left', var: 'm' },
  { class: 'm-r', name: 'margin-right', var: 'm' },
  { class: 'm-t', name: 'margin-top', var: 'm' },
  { class: 'm-b', name: 'margin-bottom', var: 'm' },
  //padding
  { class: 'p', name: 'padding', var: 'p' },
  { class: 'p-l', name: 'padding-left', var: 'p' },
  { class: 'p-r', name: 'padding-right', var: 'p' },
  { class: 'p-t', name: 'padding-top', var: 'p' },
  { class: 'p-b', name: 'padding-bottom', var: 'p' },
  //border
  { class: 'b', name: 'border', var: 'b' },
  { class: 'b-l', name: 'border-left', var: 'b' },
  { class: 'b-r', name: 'border-right', var: 'b' },
  { class: 'b-t', name: 'border-top', var: 'b' },
  { class: 'b-b', name: 'border-bottom', var: 'b' },
  //font
  { class: 'f', name: 'font-size', var: 'f' },
  { class: 'fw', name: 'font-weight', var: 'fw' },
  { class: 'lh', name: 'line-height', var: 'lh' },
  { class: 'ls', name: 'letter-spacing', var: 'ls' },
  //dimension
  { class: 'w', name: 'width', var: 'w' },
  { class: 'min-w', name: 'min-width', var: 'min-w' },
  { class: 'max-w', name: 'max-width', var: 'max-w' },
  { class: 'h', name: 'height', var: 'h' },
  { class: 'min-h', name: 'min-height', var: 'min-h' },
  { class: 'max-h', name: 'max-height', var: 'max-h' },
  //layout spacing
  { class: 'gap', name: 'gap', var: 'gap' },
  { class: 'gap-x', name: 'column-gap', var: 'gap' },
  { class: 'gap-y', name: 'row-gap', var: 'gap' },
  //radius
  { class: 'r', name: 'border-radius', var: 'r' },
  { class: 'gutter', condition: '>*', name: ['margin-top', 'margin-left'], var: 'm' },
  { class: 'gutter-x', condition: '>*', name: 'margin-left', var: 'm' },
  { class: 'gutter-y', condition: '>*', name: 'margin-top', var: 'm' },
];

const list_layout_class = [
  {
    class: "display",
    name: "display",
    values: {
      none: "none",
      block: "block",
      flex: "flex",
      "inline-flex": "inline-flex",
      grid: "grid",
      "inline-grid": "inline-grid",
    },
  },
  {
    class: "dir",
    name: "flex-direction",
    values: {
      row: "row",
      "row-reverse": "row-reverse",
      column: "column",
      col: "column",
      "column-reverse": "column-reverse",
      "col-reverse": "column-reverse",
    },
  },
  {
    class: "wrap",
    name: "flex-wrap",
    values: {
      wrap: "wrap",
      nowrap: "nowrap",
      reverse: "wrap-reverse",
      "wrap-reverse": "wrap-reverse",
    },
  },
  {
    class: "align",
    name: "align-items",
    values: {
      stretch: "stretch",
      start: "flex-start",
      "flex-start": "flex-start",
      center: "center",
      end: "flex-end",
      "flex-end": "flex-end",
      baseline: "baseline",
    },
  },
  {
    class: "justify",
    name: "justify-content",
    values: {
      start: "flex-start",
      "flex-start": "flex-start",
      center: "center",
      end: "flex-end",
      "flex-end": "flex-end",
      between: "space-between",
      "space-between": "space-between",
      around: "space-around",
      "space-around": "space-around",
      evenly: "space-evenly",
      "space-evenly": "space-evenly",
    },
  },
  {
    class: "self",
    name: "align-self",
    values: {
      auto: "auto",
      stretch: "stretch",
      start: "flex-start",
      "flex-start": "flex-start",
      center: "center",
      end: "flex-end",
      "flex-end": "flex-end",
      baseline: "baseline",
    },
  },
  {
    class: "justify-self",
    name: "justify-self",
    values: {
      auto: "auto",
      stretch: "stretch",
      start: "start",
      center: "center",
      end: "end",
    },
  },
  {
    class: "place-self",
    name: "place-self",
    values: {
      auto: "auto",
      stretch: "stretch",
      start: "start",
      center: "center",
      end: "end",
    },
  },
  {
    class: "items",
    name: "justify-items",
    values: {
      stretch: "stretch",
      start: "start",
      center: "center",
      end: "end",
    },
  },
  {
    class: "place",
    name: "place-items",
    values: {
      stretch: "stretch",
      start: "start",
      center: "center",
      end: "end",
    },
  },
  {
    class: "grid-flow",
    name: "grid-auto-flow",
    values: {
      row: "row",
      column: "column",
      dense: "dense",
      "row-dense": "row dense",
      "column-dense": "column dense",
    },
  },
];

const RESPONSIVE_STYLE_PROPS = [
  ["display", "display"],
  ["flex-direction", "flex-direction"],
  ["flex-wrap", "flex-wrap"],
  ["align-items", "align-items"],
  ["justify-content", "justify-content"],
  ["align-self", "align-self"],
  ["justify-self", "justify-self"],
  ["place-items", "place-items"],
  ["place-self", "place-self"],
  ["grid-template-columns", "grid-template-columns"],
  ["grid-template-rows", "grid-template-rows"],
  ["grid-auto-flow", "grid-auto-flow"],
  ["grid-auto-rows", "grid-auto-rows"],
  ["grid-column", "grid-column"],
  ["grid-row", "grid-row"],
  ["grid-area", "grid-area"],
  ["gap", "gap"],
  ["row-gap", "row-gap"],
  ["column-gap", "column-gap"],
  ["width", "width"],
  ["min-width", "min-width"],
  ["max-width", "max-width"],
  ["height", "height"],
  ["min-height", "min-height"],
  ["max-height", "max-height"],
  ["padding", "padding"],
  ["padding-left", "padding-left"],
  ["padding-right", "padding-right"],
  ["padding-top", "padding-top"],
  ["padding-bottom", "padding-bottom"],
  ["margin", "margin"],
  ["margin-left", "margin-left"],
  ["margin-right", "margin-right"],
  ["margin-top", "margin-top"],
  ["margin-bottom", "margin-bottom"],
  ["font-size", "font-size"],
  ["font-weight", "font-weight"],
  ["line-height", "line-height"],
  ["letter-spacing", "letter-spacing"],
  ["border-radius", "border-radius"],
  ["overflow", "overflow"],
  ["order", "order"],
];

function buildClassTemplates(classes, sizes) {
  const templates = [];
  for (const c of classes) {
    for (const size of sizes) {
      let decl = '';
      if (Array.isArray(c.name)) {
        for (const n of c.name) {
          decl += `${n}: var(--cms-${c.var}-${size});`;
        }
      } else {
        decl = `${c.name}: var(--cms-${c.var}-${size});`;
      }
      templates.push({
        suffix: `${c.class}-${size}` + (c.condition ? `${c.condition}` : ''),
        decl: decl,
      });
    }
  }
  return templates;
}

function buildLayoutClassTemplates(classes) {
  const templates = [];
  for (const c of classes) {
    for (const [key, value] of Object.entries(c.values)) {
      templates.push({
        suffix: `${c.class}-${key}`,
        decl: `${c.name}: ${value};`,
      });
    }
  }
  return templates;
}

function buildColumnWidths(count) {
  const widths = new Array(count);
  for (let i = 0; i < count; i++) {
    const columns = i + 1;
    const v = columns * 100 / COL_COUNT;
    widths[i] = Number.isInteger(v) ? `${v}%` : `${v.toFixed(6)}%`;
  }
  return widths;
}

function addClassLines(lines, prefix, indent, templates) {
  for (const t of templates) {
    lines.push(`${indent}.${prefix}${t.suffix} { ${t.decl} }`);
  }
}
function addColumnLines(lines, prefix, indent, widths) {
  lines.push(`${indent}.${prefix}col-auto { max-width: 100%; flex: 0 0 auto; width: auto; }`);
  for (let i = 0; i < widths.length; i++) {
    const n = i + 1;
    const w = widths[i];
    lines.push(`${indent}.${prefix}col-${n} { flex: 0 0 ${w}; max-width: ${w}; }`);
  }
}
function addGridColumnLines(lines, prefix, indent, count) {
  for (let i = 1; i <= count; i++) {
    lines.push(`${indent}.${prefix}grid-cols-${i} { grid-template-columns: repeat(${i}, minmax(0, 1fr)); }`);
  }
}
function addGridColResponsiveLines(lines, breakpoint, indent) {
  if (!breakpoint?.primary) return;
  const fallback = breakpoint.key === "tablet"
    ? "var(--cms-grid-col-sm, var(--cms-grid-col-base, auto))"
    : "var(--cms-grid-col-lg, var(--cms-grid-col-md, var(--cms-grid-col-tablet, var(--cms-grid-col-sm, var(--cms-grid-col-base, auto)))))";
  lines.push(`${indent}.cms-grid.cms-grid > .cms-grid-col { grid-column: var(--cms-grid-col-${breakpoint.key}, ${fallback}); }`);
}
function addResponsiveStyleLines(lines) {
  const selectorFor = (key, deviceKey = "") => {
    const className = deviceKey ? `cms-rsp-${deviceKey}-${key}` : `cms-rsp-${key}`;
    return `.cms-rsp.${className}.${className}`;
  };

  for (const [prop, key] of RESPONSIVE_STYLE_PROPS) {
    lines.push(`${selectorFor(key)} { ${prop}: var(--cms-rsp-${key}); }`);
  }
  lines.push("");

  for (const breakpoint of PRIMARY_MEDIA_BREAKPOINTS) {
    lines.push(`@media (min-width: ${breakpoint.size}px) {`);
    for (const [prop, key] of RESPONSIVE_STYLE_PROPS) {
      lines.push(`  ${selectorFor(key, breakpoint.key)} { ${prop}: var(--cms-rsp-${breakpoint.key}-${key}); }`);
    }
    lines.push("}");
    lines.push("");
  }
}
function main() {
  validateDefaultSizes(DEFAULT_SIZE, UI_SIZES, DEFAULT_SIZE_GROUPS);
  const lines = [];
  lines.push("/* AUTO-GENERATED FILE – DO NOT EDIT */");
  lines.push("/* JSswift responsive – CSS classes */");
  lines.push("");

  //creare il root:
  lines.push(":root{");
  for (const i in DEFAULT_SIZE) {
    const d = DEFAULT_SIZE[i];
    lines.push(`  --cms-${i}: ${d};`);
  }
  lines.push("}");
  lines.push("");

  lines.push(".cms-row { display: flex; align-items: stretch; flex-wrap: wrap; }");
  lines.push(".cms-col { flex-direction: column; gap: var(--cms-s-md); box-sizing: border-box; min-width: 0; }");
  lines.push(".cms-col-auto { max-width: 100%; flex: 0 0 auto; width: auto; }");
  lines.push(".cms-col-inline { display: inline-block; }");
  lines.push(".cms-col-flex { display: flex; flex-direction: column; gap: var(--cms-s-md); }");
  lines.push(".cms-col-flex.cms-col-inline { display: inline-flex; }");
  lines.push('[class*="cms-col"] { position: relative; box-sizing: border-box; flex: 1; }');

  lines.push('[class*="cms-col"] .cms-col-start, [class*="cms-col"] .cms-col-body, [class*="cms-col"] .cms-col-end { display: flex; min-width: 0; flex-direction: column; gap: inherit; }');
  lines.push('[class*="cms-col"] .cms-col-body { flex: 1 1 auto; }');

  lines.push("");
  addResponsiveStyleLines(lines);

  const classTemplates = buildClassTemplates(list_class, UI_SIZES);
  const layoutClassTemplates = buildLayoutClassTemplates(list_layout_class);
  const columnWidths = buildColumnWidths(COL_COUNT);
  addClassLines(lines, CLASS_PREFIX, "", classTemplates);
  addClassLines(lines, CLASS_PREFIX, "", layoutClassTemplates);

  //creare i colonne da 24
  addColumnLines(lines, CLASS_PREFIX, "", columnWidths);
  addGridColumnLines(lines, CLASS_PREFIX, "", COL_COUNT);

  // media queries
  for (const m of MEDIA_BREAKPOINTS) {
    lines.push(`@media (min-width: ${m.size}px) {`);
    const mediaPrefix = `${CLASS_PREFIX}${m.key}-`;
    addClassLines(lines, mediaPrefix, "  ", classTemplates);
    addClassLines(lines, mediaPrefix, "  ", layoutClassTemplates);
    //medias colonne
    addColumnLines(lines, mediaPrefix, "  ", columnWidths);
    addGridColumnLines(lines, mediaPrefix, "  ", COL_COUNT);
    addGridColResponsiveLines(lines, m, "  ");

    lines.push("}");
    lines.push("");
  }

  for (const outFile of OUT_FILES) {
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, lines.join("\n"), "utf8");
  }

  console.log(`✅ CSS generato: ${OUT_FILES.map((file) => path.relative(ROOT_DIR, file)).join(", ")}`);
  console.log(`   Classi create: ${lines.length}`);
}
main();
