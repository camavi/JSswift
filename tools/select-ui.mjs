import fs from 'node:fs/promises';
import path from 'node:path';
import { parseAst } from 'rolldown/parseAst';
import postcss from 'postcss';
import { runtimeLayout } from './runtime-layout.mjs';

const services = {
  Notify: ['UI.Notify', 'JSswift.services.notify', 'JSswift.notify'],
  Dialog: ['UI.Dialog', 'JSswift.dialog'],
  Loading: ['JSswift.loading'],
  Form: ['JSswift.useForm'],
};

function member(node) {
  if (node?.type === 'ChainExpression') return member(node.expression);
  if (node?.type === 'Identifier') return node.name;
  if (node?.type !== 'MemberExpression') return null;
  const object = member(node.object);
  const property = node.computed ? (node.property.type === 'Literal' ? node.property.value : null) : node.property.name;
  if (!object || typeof property !== 'string') return null;
  return `${object}.${property}`;
}

function walk(node, visit, parent = null, key = null) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node, parent, key);
  for (const [name, value] of Object.entries(node)) {
    if (['start', 'end', 'loc', 'range'].includes(name)) continue;
    if (Array.isArray(value)) for (const child of value) walk(child, visit, node, name);
    else if (value && typeof value === 'object') walk(value, visit, node, name);
  }
}

function canonical(name, components) {
  name = name.replace(/^app\./, 'JSswift.');
  // UI aliases exist on both public namespaces. Slot helpers are separate.
  const match = /^(?:UI|JSswift\.ui|_)\.([^.]+)(.*)$/.exec(name);
  if (match && components.has(match[1])) return `UI.${match[1] === 'Button' ? 'Btn' : match[1]}${match[2]}`;
  return name;
}

export async function selectUI(root, requested, requestedServices) {
  const directory = runtimeLayout(root).source;
  const manifest = JSON.parse(await fs.readFile(path.join(directory, 'modules.json'), 'utf8'));
  const files = await Promise.all(manifest.buildOrder.map(async file => ({ file, text: await fs.readFile(path.join(directory, file), 'utf8') })));
  let offset = 0;
  for (const file of files) { file.start = offset; offset += file.text.length + 1; file.end = offset; }
  const source = files.map(file => file.text).join('\n');
  const program = parseAst(source);
  const call = program.body[0]?.expression;
  if (program.body.length !== 1 || call?.type !== 'CallExpression' || !call.callee.body?.body) throw new Error('Unexpected UI module structure; update dependency extraction');
  const nodes = call.callee.body.body;
  const components = new Set();
  for (const node of nodes) {
    const lhs = node.expression?.type === 'AssignmentExpression' ? member(node.expression.left) : null;
    if (lhs && /^UI\.[^.]+$/.test(lhs)) components.add(lhs.slice(3));
  }
  for (const name of requested) if (!components.has(name)) throw new Error(`Unknown UI component: ${name}`);
  for (const name of requestedServices) if (!Object.hasOwn(services, name)) throw new Error(`Unknown UI service: ${name}`);
  const definitions = new Map();
  const records = nodes.map((node, index) => {
    const file = files.find(file => node.start >= file.start && node.start < file.end).file;
    const defined = [];
    if (node.type === 'VariableDeclaration') for (const declaration of node.declarations) {
      walk(declaration.id, child => { if (child.type === 'Identifier') defined.push(child.name); });
    }
    if (node.type === 'FunctionDeclaration') defined.push(node.id.name);
    if (node.expression?.type === 'AssignmentExpression') {
      const lhs = member(node.expression.left);
      if (!lhs) throw new Error(`Unsupported UI assignment in ${file}`);
      defined.push(canonical(lhs, components));
    }
    for (const name of defined) {
      if (!definitions.has(name)) definitions.set(name, []);
      definitions.get(name).push(index);
    }
    const references = new Set();
    walk(node, (child, parent, key) => {
      if (child.type === 'MemberExpression') {
        const name = member(child);
        if (name) references.add(canonical(name, components));
      }
      if (child.type === 'Identifier') {
        if (parent?.type === 'MemberExpression' && key === 'property' && !parent.computed) return;
        if ((parent?.type === 'Property' || parent?.type === 'MethodDefinition') && key === 'key' && !parent.computed) return;
        references.add(child.name);
      }
    });
    return { index, node, file, defined, references };
  });
  const included = new Set();
  const reasons = {};
  const include = (index, reason) => {
    if (included.has(index)) return;
    included.add(index);
    const record = records[index];
    for (const name of record.defined) reasons[name] ??= reason;
    for (const reference of record.references) {
      for (const dependency of definitions.get(reference) ?? []) include(dependency, record.defined[0] ?? `initialization:${record.file}`);
    }
    // A selected component/service includes its public methods and aliases.
    for (const name of record.defined) {
      if (/^UI\.[^.]+$/.test(name) || /^JSswift\.(dialog|loading|notify)$/.test(name) || name === 'JSswift.services.notify') {
        for (const [child, indices] of definitions) if (child.startsWith(name + '.')) for (const dependency of indices) include(dependency, name);
      }
    }
  };
  // Preserve initialization order and rod-path hooks. Helpers otherwise follow references.
  for (const record of records) if ((record.file === '00-bootstrap.js' && !record.defined.includes('JSswift.services.notify')) || record.defined.includes('JSswift.omit')) include(record.index, 'shared UI initialization');
  const roots = [...requested.map(name => `UI.${name}`), ...requestedServices.flatMap(name => services[name])];
  for (const root of roots) for (const index of definitions.get(canonical(root, components)) ?? []) include(index, 'requested');
  const selectedRecords = records.filter(record => included.has(record.index));
  const selectedComponents = [...components].filter(name => definitions.get(canonical(`UI.${name}`, components))?.some(index => included.has(index)));
  const selectedServices = Object.keys(services).filter(name => services[name].every(root => definitions.get(canonical(root, components))?.some(index => included.has(index))));
  return {
    code: `(function initJSswiftUI(app) {\n${selectedRecords.map(record => source.slice(record.node.start, record.node.end)).join('\n')}\n})(JSswift);`,
    components: selectedComponents,
    services: selectedServices,
    sources: [...new Set(selectedRecords.map(record => path.relative(root, path.join(directory, record.file))))],
    reasons,
  };
}

// Only rules with explicit component ownership are removed. Shared tokens,
// utilities, native styles and unknown selectors are retained conservatively.
const cssOwners = {
  btn: ['Btn', 'Button'], card: ['Card', 'cardHeader', 'cardBody', 'cardFooter'],
  input: ['Input', 'InputRaw', 'Textarea', 'FormField'], field: ['FormField'],
  textarea: ['Textarea'], select: ['Select'], search: ['Search'], upload: ['Upload'],
  icon: ['Icon'], badge: ['Badge'], avatar: ['Avatar'], chip: ['Chip'],
  list: ['List', 'Item'], item: ['Item'], separator: ['Separator'], tooltip: ['Tooltip'],
  checkbox: ['Checkbox'], radio: ['Radio'], toggle: ['Toggle'], slider: ['Slider'], rating: ['Rating'],
  date: ['Date', 'Calendar', 'Datepicker'], calendar: ['Date', 'Calendar'], time: ['Time'],
  tabs: ['Tabs', 'RouteTab'], tab: ['Tabs', 'RouteTab', 'TabPanel'], breadcrumbs: ['Breadcrumbs'], breadcrumb: ['Breadcrumbs'],
  pagination: ['Pagination'], spinner: ['Spinner'], progress: ['Progress'], 'loading-bar': ['LoadingBar'],
  banner: ['Banner'], alert: ['Alert'], table: ['Table'], menu: ['Menu'], popover: ['Popover'],
  dialog: ['Dialog'], notify: ['Notify'], toast: ['Notify'], loading: ['$Loading'],
  header: ['Header', 'Layout'], drawer: ['Drawer', 'Layout'], footer: ['Footer', 'Layout'],
  page: ['Page', 'Layout'], 'app-shell': ['AppShell'], parallax: ['Parallax'],
  toolbar: ['Toolbar'], grid: ['Grid', 'GridCol'], container: ['Container'], form: ['Form'], kpi: ['Kpi'],
};

export function selectComponentCSS(css, components, selectedServices = []) {
  const selected = new Set([...components, ...selectedServices.map(name => `$${name}`)]);
  const prefixes = Object.keys(cssOwners).sort((a, b) => b.length - a.length);
  const ast = postcss.parse(css);
  let removedSelectors = 0;
  ast.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    const selectors = postcss.list.comma(rule.selector).filter(selector => {
      // Functional selector lists can mix owners; preserve them rather than
      // risk changing :is/:not/:has semantics without a selector AST.
      if (/:(?:is|where|not|has)\(/.test(selector)) return true;
      const classes = [...selector.matchAll(/\.jss-([a-zA-Z0-9_-]+)/g)].map(match => match[1]);
      const omitted = classes.some(name => {
        const prefix = prefixes.find(prefix => name === prefix || name.startsWith(prefix + '-'));
        return prefix && !cssOwners[prefix].some(owner => selected.has(owner));
      });
      if (omitted) removedSelectors++;
      return !omitted;
    });
    if (selectors.length) rule.selector = selectors.join(',\n');
    else rule.remove();
  });
  ast.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove(); });
  return { css: ast.toString(), removedSelectors };
}
