import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readUIManifest, uiSourceFiles } from '../tools/ui-manifest.mjs';

const exec = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));

test('installed tarball exposes a working configured CLI and Vite plugin', { timeout: 120000 }, async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-package-build-'));
  try {
    const packed = await exec('npm', ['pack', './packages/jsswift', '--json', '--pack-destination', directory], { cwd: root });
    const metadata = JSON.parse(packed.stdout)[0];
    for (const file of ['dist/build/vite-jss.mjs', 'dist/build/vite-jss.d.mts', 'dist/build/build-configured-runtime.mjs', 'dist/build/build-configured-runtime.d.mts', 'dist/build/runtime-layout.mjs', 'dist/build/discover-ui.mjs', 'dist/ui-src/modules.json', 'dist/ui-src/helpers/layout-responsive.js', 'dist/ui-src/components/layout.js', 'dist/ui-src/components/grid-col.js', 'dist/ui-src/css/components/card/base.css', 'dist/ui-src/components/button.js', 'dist/ui-src/components/select.js', 'dist/ui-src/helpers/field-control.js', 'dist/ui-src/css/components/button/base.css', 'dist/build/ui-manifest.mjs', 'dist/cms.js', 'dist/ui.js']) {
      assert.ok(metadata.files.some(entry => entry.path === file), file);
    }
    const sourceManifest = await readUIManifest(path.join(root, 'packages/ui/src'));
    for (const file of uiSourceFiles(sourceManifest)) assert.ok(metadata.files.some(entry => entry.path === 'dist/ui-src/' + file), file);
    await fs.writeFile(path.join(directory, 'package.json'), JSON.stringify({ type: 'module', private: true }));
    await exec('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', path.join(directory, metadata.filename)], { cwd: directory, maxBuffer: 1024 * 1024 });
    const installed = path.join(directory, 'node_modules/jsswift');
    const manifest = JSON.parse(await fs.readFile(path.join(installed, 'package.json'), 'utf8'));
    assert.ok(manifest.dependencies.esbuild);
    assert.ok(manifest.dependencies.postcss);
    assert.ok(manifest.dependencies.rolldown);
    assert.equal(manifest.peerDependenciesMeta.vite.optional, true);
    const cli = path.join(directory, 'node_modules/.bin/jss-build');
    assert.match((await exec(cli, ['--help'], { cwd: directory })).stdout, /Usage: jss-build/);
    const config = "export default {ui:{responsive:false},extras:['tabler']};";
    await fs.writeFile(path.join(directory, 'jss.config.js'), config);
    await fs.writeFile(path.join(directory, 'app.js'), "import 'jss:runtime'; const extras = [_.Toggle, _.Calendar, _.TabPanel, _.Notify, _.Dialog, _.Menu]; _.Grid({cols:1}, _.GridCol({}, _.Card({}, _.Button({label:'Save'}))));");
    await exec(cli, [], { cwd: directory });
    const report = JSON.parse(await fs.readFile(path.join(directory, 'dist-runtime/build-report.json'), 'utf8'));
    for (const name of ['Button', 'Card', 'Grid', 'GridCol', 'Toggle', 'Calendar', 'TabPanel', 'Notify', 'Dialog', 'Menu']) assert.ok(report.components.includes(name), name);
    assert.ok(!report.components.includes('Table'));
    assert.equal(report.javascript[0], 'cms.js');
    await fs.access(path.join(directory, 'dist-runtime/img/svg/tabler-icons-sprite.svg'));
    assert.match(await fs.readFile(path.join(directory, 'dist-runtime/css/runtime.css'), 'utf8'), /fonts.gstatic.com/);
    await fs.writeFile(path.join(directory, 'index.html'), '<div id="app"></div><script type="module" src="./app.js"></script>');
    await fs.writeFile(path.join(directory, 'app.js'), "import 'jss:runtime'; import {add} from 'jsswift/icons'; const extras = [_.Toggle, _.Calendar, _.TabPanel, _.Notify, _.Dialog, _.Menu]; _.mount('#app', _.Grid({cols:1}, _.GridCol({}, _.Card({}, _.Button({label:'Save',icon:add()})))));");
    // Vite is supplied by the consumer, independently from the tarball dependencies.
    await fs.symlink(process.env.JSS_TEST_VITE_PATH ?? path.join(root, 'node_modules/vite'), path.join(directory, 'node_modules/vite'), 'dir');
    await fs.writeFile(path.join(directory, 'verify.mjs'), `
      import assert from 'node:assert/strict';
      import {build} from 'vite';
      import {jssRuntime} from 'jsswift/vite';
      import {validateConfig} from 'jsswift/build';
      assert.equal(validateConfig({ui:{all:true}}).ui.all,true);
      const result=await build({configFile:false,root:process.cwd(),plugins:[jssRuntime()],logLevel:'silent',build:{write:false}});
      const report=JSON.parse(result.output.find(file=>file.fileName==='jss-build-report.json').source);
      for (const name of ['Button', 'Card', 'Grid', 'GridCol', 'Toggle', 'Calendar', 'TabPanel', 'Notify', 'Dialog', 'Menu']) assert.ok(report.components.includes(name), name);
      assert.ok(!report.components.includes('Table'));
      assert.equal(report.reasons,undefined);assert.equal(report.discovery.files,undefined);
      const js=result.output.find(file=>file.fileName.endsWith('.js')).code;
      assert.ok(js.includes('M12 5v14M5 12h14'));assert.ok(!js.includes('m16 3 5 5-12 12-6 1 1-6L16 3Z'));
      assert.ok(result.output.some(file=>file.fileName.endsWith('.svg')));
      assert.ok(result.output.some(file=>file.fileName.endsWith('.css') && file.source.includes('fonts.gstatic.com')));
    `);
    await exec(process.execPath, ['verify.mjs'], { cwd: directory, maxBuffer: 1024 * 1024 });
    await fs.copyFile(path.join(root, 'tests/fixtures/vite-dev-consumer.mjs'), path.join(directory, 'dev-verify.mjs'));
    const dev = await exec(process.execPath, ['dev-verify.mjs'], {cwd:directory, maxBuffer:1024*1024});
    assert.match(dev.stdout, /Vite dev HTTP/);
    for (const [name, config] of [['core', { ui: { all: false } }], ['full', { ui: { all: true }, extras: ['nunito-font'] }]]) {
      const configPath = path.join(directory, name + '.config.mjs');
      await fs.writeFile(configPath, 'export default ' + JSON.stringify(config));
      await exec(cli, [configPath, name], { cwd: directory });
      const report = JSON.parse(await fs.readFile(path.join(directory, name, 'build-report.json'), 'utf8'));
      if (name === 'core') { assert.deepEqual(report.components, []); assert.deepEqual(report.css, ['base.css']); }
      else { assert.equal(report.components, 'all'); await fs.access(path.join(directory, name, 'fonts/Nunito-Regular.ttf')); }
    }
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
