import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildConfiguredRuntime, validateConfig } from '../tools/build-configured-runtime.mjs';
import { selectUI, selectComponentCSS } from '../tools/select-ui.mjs';
import { loadCMS } from './helpers/load-cms.mjs';
import vm from 'node:vm';
import { jssRuntime } from '../tools/vite-jss.mjs';
import { build } from 'vite';

test('configuration validates selection and rejects ambiguous options', () => {
  assert.equal(validateConfig({ ui: { components: ['Table'] } }).ui.all, false);
  assert.throws(() => validateConfig({ ui: { all: true, components: ['Table'] } }), /alone/);
  assert.throws(() => validateConfig({ ui: { services: 'Dialog' } }), /array/);
  assert.throws(() => validateConfig({ extras: ['material-icons'] }), /Unknown extra/);
  assert.throws(() => validateConfig({ ui: { all: 'false' } }), /boolean/);
});

test('selective runtime resolves dependencies and works without omitted components', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-select-test-'));
  try {
    const report = await buildConfiguredRuntime({ ui: { components: ['Button', 'Table'], responsive: false } }, directory);
    assert.ok(report.components.includes('Icon'));
    assert.ok(report.components.includes('Card'));
    assert.ok(!report.components.includes('Select'));
    assert.ok(!report.components.includes('Dialog'));
    assert.ok(report.removedSelectors > 0);
    assert.match(report.reasons['UI.Card'], /UI.Table/);
    const css = await fs.readFile(path.join(directory, 'css/runtime.css'), 'utf8');
    assert.match(css, /\.jss-btn\s*\{/);
    assert.doesNotMatch(css, /\.jss-select-menu\s*\{/);
    await loadCMS();
    vm.runInThisContext(await fs.readFile(path.join(directory, 'runtime.js'), 'utf8'));
    assert.equal(typeof _.Button, 'function');
    assert.equal(_.Select, undefined);
    assert.equal(_.Dialog, undefined);
    assert.equal(_.Button({ label: 'Save', icon: 'save' }).tagName, 'BUTTON');
    const table = _.Table({ rows: [{ name: 'Test' }], columns: [{ key: 'name', label: 'Name' }], pagination: false });
    const descendants = node => [node, ...(node.childNodes ?? []).flatMap(descendants)];
    assert.ok(descendants(table).some(node => node.tagName === 'TABLE'));
    assert.ok(descendants(_.Icon('home')).some(node => node.textContent === 'home'));
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('CSS selection retains shared rules, splits grouped selectors and prunes media rules', () => {
  const result = selectComponentCSS('.jss-btn, .jss-table {color:red} @media(min-width:1px){.jss-table-head{color:blue}} .jss-clear-set{display:block}', ['Button']);
  assert.match(result.css, /jss-btn/);
  assert.match(result.css, /jss-clear-set/);
  assert.doesNotMatch(result.css, /jss-table|@media/);
});

test('Vite integration consumes config and bundles only selected UI and extras', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-vite-test-'));
  try {
    const config = path.join(directory, 'jss.config.mjs');
    await fs.writeFile(config, "export default {ui:{components:['Button'], responsive:false}, extras:[]};");
    await fs.writeFile(path.join(directory, 'index.html'), '<div id="app"></div><script type="module" src="./app.js"></script>');
    await fs.writeFile(path.join(directory, 'app.js'), "import 'jss:runtime'; _.mount('#app', _.Button({label:'Save'}));");
    const result = await build({ configFile: false, root: directory, plugins: [jssRuntime({ config })], logLevel: 'silent', build: { write: false, minify: false } });
    const report = JSON.parse(result.output.find(file => file.fileName === 'jss-build-report.json').source);
    assert.ok(report.components.includes('Button'));
    assert.ok(!report.components.includes('Table'));
    const css = result.output.find(file => file.fileName.endsWith('.css')).source;
    assert.doesNotMatch(css, /fonts.gstatic.com|\.jss-select-menu\s*\{/);
    assert.match(css, /\.jss-btn\s*\{/);
    assert.ok(result.output.some(file => file.type === 'chunk'));
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('services are selected independently and component inventory rejects unknown names', async () => {
  await assert.rejects(selectUI(process.cwd(), ['Missing'], []), /Unknown UI component/);
  await assert.rejects(selectUI(process.cwd(), [], ['Missing']), /Unknown UI service/);
  for (const name of ['Notify', 'Dialog', 'Loading', 'Form']) {
    const selection = await selectUI(process.cwd(), [], [name]);
    await loadCMS();
    globalThis.getComputedStyle = () => ({ getPropertyValue: () => '0', transitionDuration: '0s', animationDuration: '0s' });
    document.body ??= document.createElement('body');
    document.head ??= document.createElement('head');
    vm.runInThisContext(selection.code);
    if (name === 'Notify') {
      assert.equal(typeof _.Notify.promise, 'function');
      const id = JSswift.notify.show({ message: 'Saved', timeout: 0 });
      assert.ok(id);
      JSswift.notify.clear();
    }
    if (name === 'Dialog') { assert.equal(typeof JSswift.dialog.prompt, 'function'); const dialog = _.Dialog({ title: 'Test' }); dialog.open(); dialog.close(); await new Promise(resolve => setTimeout(resolve, 300)); }
    if (name === 'Loading') { JSswift.loading.show(); JSswift.loading.hide(); }
    if (name === 'Form') { const form = _.useForm({ model: { name: 'Test' } }); assert.ok(form); }
  }
});

test('configured builds include only requested UI and optional assets', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-config-test-'));
  try {
    const core = path.join(directory, 'core');
    const report = await buildConfiguredRuntime({ ui: { all: false } }, core);
    assert.equal(report.javascript.length, 1);
    assert.deepEqual(report.css, ['base.css']);
    assert.doesNotMatch(await fs.readFile(path.join(core, 'css/runtime.css'), 'utf8'), /fonts.gstatic.com|Material Symbols Outlined/);
    assert.deepEqual((await fs.readdir(core)).sort(), ['build-report.json', 'css', 'runtime.js']);
    const full = path.join(directory, 'full');
    const enabled = await buildConfiguredRuntime({ ui: { all: true, responsive: false }, extras: ['material-symbols-outlined', 'tabler'] }, full);
    assert.equal(enabled.javascript.length, 2);
    assert.equal(enabled.css[0], 'ui-light.css');
    assert.match(await fs.readFile(path.join(full, 'css/runtime.css'), 'utf8'), /fonts.gstatic.com/);
    await fs.access(path.join(full, 'img/svg/tabler-icons-sprite.svg'));
    assert.ok(enabled.runtimeBytes > report.runtimeBytes);
    await assert.rejects(buildConfiguredRuntime({ extras: [] }, full), /must be empty/);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
