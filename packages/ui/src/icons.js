// Small offline SVG factories. Named ESM imports allow bundlers to omit unused drawings.
function svg(d, size = 20) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key, value] of Object.entries({viewBox:'0 0 24 24',width:size,height:size,fill:'none',stroke:'currentColor','stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'})) node.setAttribute(key, value);
  const path = document.createElementNS(node.namespaceURI, 'path');
  path.setAttribute('d', d); node.appendChild(path); return node;
}
export function add(size) { return svg('M12 5v14M5 12h14', size); }
export function close(size) { return svg('m6 6 12 12M6 18 18 6', size); }
export function check(size) { return svg('m5 12 4 4L19 6', size); }
export function edit(size) { return svg('m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5', size); }
export function search(size) { return svg('M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15ZM16 16l5 5', size); }
export function inventory(size) { return svg('M12 3 3 8v9l9 5 9-5V8l-9-5ZM3 8l9 5 9-5M12 13v9', size); }
export function grid(size) { return svg('M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', size); }
export function euro(size) { return svg('M18 5a7 7 0 1 0 0 14M4 10h11M4 14h9', size); }
export function empty(size) { return svg('M4 7h16v13H4zM8 7V4h8v3M9 13h6', size); }
export function save(size) { return svg('M5 3h12l4 4v14H3V3h2ZM7 3v6h10V3M7 21v-8h10v8', size); }
export function chevronLeft(size) { return svg('m15 5-7 7 7 7', size); }
export function chevronRight(size) { return svg('m9 5 7 7-7 7', size); }
export function chevronDown(size) { return svg('m5 9 7 7 7-7', size); }
