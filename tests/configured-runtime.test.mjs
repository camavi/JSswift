import test from 'node:test';
import { EventEmitter } from 'node:events';
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
    const report = await buildConfiguredRuntime({ report: 'full', ui: { components: ['Button', 'Table'], responsive: false } }, directory);
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
    await fs.writeFile(config, "export default {ui:{components:['Button'], responsive:false}, icons:false, extras:[]};");
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

test('AI quick start selects its documented components without loading the full catalog', async () => {
  const guide = await fs.readFile(new URL('../documentions/AI.md', import.meta.url), 'utf8');
  const configSource = guide.match(/```mjs\n([\s\S]*?)\n```/)[1];
  const { default: config } = await import(`data:text/javascript,${encodeURIComponent(configSource)}`);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-ai-config-'));
  try {
    const entrySource = guide.match(/```js\n([\s\S]*?)\n```/)[1];
    await fs.writeFile(path.join(directory, 'app.js'), entrySource);
    const report = await buildConfiguredRuntime(config, path.join(directory, 'runtime'), process.cwd(), directory);
    for (const component of ['Button','Input','Select','Card','Table','Dialog']) assert.ok(report.components.includes(component), component);
    for (const component of ['Upload','Calendar','Parallax','LoadingBar']) assert.ok(!report.components.includes(component), component);
    const entry = guide.match(/```js\n([\s\S]*?)\n```/)[1];
    assert.match(entry, /import 'jss:runtime'/);
    assert.doesNotMatch(entry, /import 'jsswift'/);
  } finally { await fs.rm(directory, {recursive:true,force:true}); }
});

test('automatic discovery selects static JS/TS and inline HTML UI, merging dynamic inclusions', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-auto-'));
  try {
    await fs.mkdir(path.join(directory, 'src'));
    await fs.writeFile(path.join(directory, 'src/app.ts'), `
      import 'jss:runtime';
      const text: string = '_.Select()'; // _.Calendar()
      _.Button({label:text}); _['Input']({}); _.dialog.alert('Saved');
      const dynamic = 'Chip'; _[dynamic]({});
    `);
    await fs.writeFile(path.join(directory, 'index.html'), `<!doctype html><html><head></head><body>
<script type="module" src="./src/app.ts"></script>
<script type="module">_.Badge({label:'ok'})</script>
<script type="application/json">{"sample":"_.Table()"}</script>
</body></html>`);
    const config = { ui: { auto: ['src', 'index.html'], components: ['Chip'], responsive: false } };
    const report = await buildConfiguredRuntime(config, path.join(directory, 'out'), process.cwd(), directory);
    assert.deepEqual(report.discovery.components, ['Badge', 'Button', 'Input']);
    assert.deepEqual(report.discovery.services, ['Dialog']);
    for (const name of ['Badge', 'Button', 'Input', 'Chip', 'Dialog']) assert.ok(report.components.includes(name), name);
    for (const name of ['Select', 'Calendar', 'Table']) assert.ok(!report.components.includes(name), name);
    const css = await fs.readFile(path.join(directory, 'out/css/runtime.css'), 'utf8');
    assert.match(css, /\.jss-btn\s*\{/);
    assert.doesNotMatch(css, /\.jss-select-menu\s*\{/);
    await fs.writeFile(path.join(directory, 'jss.config.mjs'), `export default ${JSON.stringify(config)}`);
    const result = await build({ configFile: false, root: directory, plugins: [jssRuntime({ config: path.join(directory, 'jss.config.mjs') })], logLevel: 'silent', build: { write: false } });
    const viteReport = JSON.parse(result.output.find(file => file.fileName === 'jss-build-report.json').source);
    assert.deepEqual(viteReport.discovery.components, report.discovery.components);
    assert.deepEqual(viteReport.components, report.components);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('automatic discovery validates config and reports source failures', async () => {
  assert.equal(validateConfig({ui:{auto:true}}).ui.all, false);
  for (const auto of [[], 'src', [42]]) assert.throws(() => validateConfig({ui:{auto}}), /ui.auto/);
  assert.throws(() => validateConfig({ui:{all:true,auto:true}}), /alone/);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-auto-invalid-'));
  try {
    await fs.writeFile(path.join(directory, 'app.js'), '_.Button(');
    await assert.rejects(buildConfiguredRuntime({ui:{auto:['app.js']}}, path.join(directory, 'out'), process.cwd(), directory), /UI discovery failed.*app.js/);
  } finally { await fs.rm(directory, {recursive:true,force:true}); }
});


test('Vite invalidates discovered selections on app changes, additions and removals', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-auto-watch-'));
  try {
    await fs.mkdir(path.join(directory, 'src'));
    const file = path.join(directory, 'src/app.js');
    const extra = path.join(directory, 'src/extra.js');
    const config = path.join(directory, 'jss.config.mjs');
    await fs.writeFile(config, "export default {ui:{auto:['src']}};");
    await fs.writeFile(file, '_.Button({})');
    const plugin = jssRuntime({config});
    const context = {addWatchFile() {}, emitFile(asset) { this.report = JSON.parse(asset.source); }};
    const runtime = plugin.resolveId('jss:runtime');
    await plugin.load.call(context, runtime);
    const watcher = new EventEmitter();
    watcher.add = () => {};
    const httpServer = new EventEmitter();
    let restarts = 0;
    plugin.configureServer({watcher, httpServer, restart() { restarts++; }});
    for (const event of ['change', 'add', 'unlink']) {
      if (event === 'change') await fs.writeFile(file, '_.Input({})');
      if (event === 'add') await fs.writeFile(extra, '_.Badge({})');
      if (event === 'unlink') await fs.unlink(extra);
      watcher.emit(event, event === 'change' ? file : extra);
      await plugin.load.call(context, runtime);
      await plugin.generateBundle.call(context);
      assert.ok(context.report.components.includes('Input'));
      assert.equal(context.report.components.includes('Badge'), event === 'add');
      assert.ok(!context.report.components.includes('Button'));
    }
    assert.equal(restarts, 3);
    watcher.emit('change', path.join(directory, 'dist/generated.js'));
    assert.equal(restarts, 3);
    httpServer.emit('close');
    assert.equal(watcher.listenerCount('change'), 0);
  } finally { await fs.rm(directory, {recursive:true,force:true}); }
});


test('discovery is default and explicit selections disable it without redundant flags', () => {
  for (const config of [{}, {ui:{}}, {ui:{responsive:false}}]) {
    const result=validateConfig(config); assert.equal(result.ui.auto,true); assert.equal(result.ui.all,false);
  }
  for (const ui of [{components:['Button']},{components:[]},{services:['Dialog']},{services:[]},{all:true},{all:false}]) assert.equal(validateConfig({ui}).ui.auto,false);
  assert.equal(validateConfig({ui:{components:['Button'],auto:true}}).ui.auto,true);
  assert.equal(validateConfig({ui:{auto:false}}).ui.all,false);
  assert.throws(()=>validateConfig({icons:'auto'}),/icons must be boolean/);
});

test('default discovery integrates Material CSS through Icon dependencies and excludes output', async () => {
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'jss-auto-default-'));
  try {
    await fs.writeFile(path.join(directory,'app.js'), "import 'jss:runtime'; _.Button({icon:'save',label:'Save'});");
    await fs.mkdir(path.join(directory,'custom-output'));
    await fs.writeFile(path.join(directory,'custom-output/stale.js'),'_.Calendar({});');
    await fs.writeFile(path.join(directory,'jss.config.mjs'), 'export default {ui:{responsive:false}};');
    // Standalone output must be empty; nested generated output is ignored by Vite.
    const standalone=await buildConfiguredRuntime({ui:{responsive:false}},path.join(directory,'dist-runtime'),process.cwd(),directory);
    assert.ok(standalone.components.includes('Button'));
    assert.ok(standalone.extras.includes('material-symbols-outlined'));
    assert.match(await fs.readFile(path.join(directory,'dist-runtime/css/runtime.css'),'utf8'),/font-family: 'Material Symbols Outlined'/);
    await fs.writeFile(path.join(directory,'index.html'),'<script type="module" src="./app.js"></script>');
    const result=await build({configFile:false,root:directory,plugins:[jssRuntime({config:path.join(directory,'jss.config.mjs')})],logLevel:'silent',build:{write:false,outDir:'custom-output'}});
    const report=JSON.parse(result.output.find(file=>file.fileName==='jss-build-report.json').source);
    assert.ok(report.components.includes('Button'));
    assert.ok(!report.components.includes('Calendar'),JSON.stringify(report.discovery));
    assert.ok(report.config.extras.includes('material-symbols-outlined'));
    assert.match(result.output.find(file=>file.fileName.endsWith('.css')).source,/fonts.gstatic.com/);
    const offline=await buildConfiguredRuntime({ui:{components:['Button'],responsive:false},icons:false},path.join(directory,'offline'));
    assert.ok(!offline.extras.includes('material-symbols-outlined'));
    assert.doesNotMatch(await fs.readFile(path.join(directory,'offline/css/runtime.css'),'utf8'),/fonts.gstatic.com/);
    const explicit=await buildConfiguredRuntime({ui:{components:['Icon']},icons:false,extras:['material-symbols-outlined']},path.join(directory,'explicit'));
    assert.ok(explicit.extras.includes('material-symbols-outlined'));
  } finally {await fs.rm(directory,{recursive:true,force:true});}
});

test('selective CSS removes unrequested TabPanel, EmptyState and Stat base rules', async () => {
  const css=await fs.readFile('packages/ui/dist/css/ui-components.css','utf8');
  const selected=selectComponentCSS(css,['Button','Kpi']);
  for (const name of ['tabpanel','empty-state','stat']) assert.doesNotMatch(selected.css,new RegExp('\\.jss-'+name+'\\s*\\{'));
  assert.match(selected.css,/\.jss-kpi\s*\{/);
});


test('CSS ownership removes layout, route and choice rules while preserving their owners and complex rules', async () => {
 const css=await fs.readFile('packages/ui/dist/css/ui-components.css','utf8');
 const result=selectComponentCSS(css,['Button','Kpi']);
 for(const name of ['layout','route-tab','choice-wrap','singularity-check']) assert.doesNotMatch(result.css,new RegExp('\\.jss-'+name+'\\s*\\{'));
 for(const [owner,name] of [['Layout','layout'],['RouteTab','route-tab'],['Checkbox','choice-wrap'],['Rating','choice-wrap']]) assert.match(selectComponentCSS(css,[owner]).css,new RegExp('\\.jss-'+name+'\\s*\\{'));
 assert.match(selectComponentCSS('.jss-singularity-check .jss-slider {}',['Slider']).css,/jss-singularity-check/);
 assert.equal(result.analysis.outputBytes,Buffer.byteLength(result.css));
 assert.ok(result.analysis.retainedRules.complex>0);
 assert.ok(result.analysis.retainedRules.sharedOrUnknown>0);
});

test('CSS pruning uses mandatory outer classes and preserves functional alternatives', () => {
 const css='.jss-layout:is(.x,.y){color:red}:is(.jss-layout,.jss-btn){color:blue}.jss-btn:not(.jss-layout){color:green}.jss-btn:has(.jss-layout){color:black}[data-label=".jss-layout"]{color:white}.jss-layout:has([data-x="("]){color:orange}';
 const result=selectComponentCSS(css,['Button']);
 assert.doesNotMatch(result.css,/color:red|color:orange/);
 for(const color of ['blue','green','black','white'])assert.ok(result.css.includes('color:'+color));
 assert.match(selectComponentCSS(css,['Layout']).css,/color:red/);
});

test('build reports default to compact and full diagnostics remain opt-in', async () => {
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jss-report-'));
 try {
  const config={ui:{components:['Button'],responsive:false},icons:false};
  const compact=await buildConfiguredRuntime(config,path.join(dir,'compact'));
  const full=await buildConfiguredRuntime({...config,report:'full'},path.join(dir,'full'));
  assert.equal(compact.reasons,undefined);assert.equal(compact.discovery.files,undefined);
  assert.ok(full.reasons['UI.Btn']);assert.ok(Array.isArray(full.discovery.files));
  assert.deepEqual(compact.components,full.components);assert.deepEqual(compact.cssAnalysis,full.cssAnalysis);
  assert.ok(JSON.stringify(compact).length<JSON.stringify(full).length);
  assert.throws(()=>validateConfig({report:'unknown'}),/report must/);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});

test('FormField owns generic control CSS without retaining it in Button-only builds', () => {
 const css='.jss-control{padding:1px}.jss-control:hover{color:red}.shared{color:black}';
 assert.equal(selectComponentCSS(css,['Button']).css,'.shared{color:black}');
 assert.match(selectComponentCSS(css,['FormField']).css,/\.jss-control:hover/);
});
