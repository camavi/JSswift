import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, rm, symlink, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadKnowledge } from '../ai/knowledge.mjs';
import vm from 'node:vm';
import { loadCMS } from './helpers/load-cms.mjs';

test('documented application aliases exist on the shared runtime namespace', async () => {
  const runtime = await loadCMS();
  for (const name of ['signal', 'effect', 'computed', 'untracked', 'batch']) {
    assert.equal(runtime[name], runtime.reactive[name], `_.${name} aliases the reactive implementation`);
  }
  const uiSource = await readFile(new URL('../pages/_jsswift-fe/js/ui.js', import.meta.url), 'utf8');
  assert.ok(!uiSource.includes('UI.meta'), 'UI bundle excludes component metadata registrations');
  assert.ok(!uiSource.includes('META_PROP_DESCRIPTIONS'), 'UI bundle excludes metadata normalization tables');
  vm.runInThisContext(uiSource);
  assert.deepEqual(Object.keys(runtime.ui.meta), [], 'No component catalog is allocated at runtime');
  const app = globalThis._;
  assert.equal(app, runtime);
  const knowledge = await loadKnowledge();
  for (const component of knowledge.map.components) {
    assert.equal(typeof app[component.name], 'function', `_.${component.name}`);
  }
  assert.equal(typeof app.mount, 'function');
  assert.equal(typeof app.http.getJSON, 'function');
  for (const name of ['signal', 'effect', 'computed', 'untracked', 'batch']) {
    assert.equal(typeof app[name], 'function', `_.${name} is available after UI initialization`);
  }
  const model = app.signal(false);
  let observed;
  const stop = app.effect(() => { observed = model[0](); });
  const toggle = app.Toggle({ model });
  assert.ok(toggle.nodeType);
  model[1](true);
  assert.equal(model[0](), true);
  assert.equal(observed, true);
  stop();
  model[2]();
});

test('knowledge routes realistic application requests to focused contracts', async () => {
  const knowledge = await loadKnowledge();
  for (const [query, id] of [
    ['AI.md', 'guide:AI'],
    ['jss.config.js', 'guide:configured-runtime'],
    ['jss:runtime', 'guide:configured-runtime'],
    ['jsswift/vite', 'guide:configured-runtime'],
    ['jss-build', 'guide:configured-runtime'],
    ['componenti selettivi', 'guide:configured-runtime'],
    ['base.css palette tema', 'guide:ui/themes'],
    ['proprietà comuni', 'guide:ui/common-props'],
    ['form con validazione', 'guide:ui/forms'],
    ['layout responsive', 'guide:ui/layout-and-responsive'],
    ['stato reattività', 'guide:reactivity'],
    ['_.signal', 'guide:reactivity'],
    ['_.rod', 'guide:reactivity'],
    ['router HTTP', 'guide:platform'],
    ['jsswift/icons', 'component:icon'],
    ['icone offline', 'component:icon'],
    ['_.Input', 'component:input'],
    ['_.Toggle', 'component:toggle'],
    ['_.Button', 'component:btn'],
    ['AppShell', 'component:app-shell'],
    ['cardHeader', 'component:card-header']
  ]) assert.ok(knowledge.search(query).some(entry => entry.id === id), query);
  assert.equal(knowledge.search('_.Input')[0].id, 'component:input');
  assert.equal(knowledge.search('_.Toggle')[0].id, 'component:toggle');
  assert.equal(knowledge.search('_.Button')[0].title, 'Button');
  assert.deepEqual(knowledge.search('zzzzunknown'), []);
  await assert.rejects(knowledge.read('component:missing'), /Unknown document/);
});

test('knowledge rejects stale maps and references escaping the documentation root', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'jsswift-knowledge-'));
  try {
    const root = path.join(temp, 'docs');
    await cp(new URL('../documentions/', import.meta.url), root, { recursive: true });
    const mapPath = path.join(root, 'knowledge-map.json');
    const map = JSON.parse(await readFile(mapPath, 'utf8'));
    map.components[0].summary += ' stale';
    await writeFile(mapPath, JSON.stringify(map));
    await assert.rejects(loadKnowledge(root), /Stale component/);
    map.components[0].summary = map.components[0].summary.replace(/ stale$/, '');
    map.topics[0].paths = ['../outside.md'];
    await writeFile(mapPath, JSON.stringify(map));
    await assert.rejects(loadKnowledge(root), /Invalid documentation path/);
    map.topics[0].paths = ['escape.md'];
    await writeFile(mapPath, JSON.stringify(map));
    await writeFile(path.join(temp, 'outside.md'), 'outside');
    await symlink(path.join(temp, 'outside.md'), path.join(root, 'escape.md'));
    await assert.rejects(loadKnowledge(root), /outside documentation root/);
  } finally { await rm(temp, { recursive: true, force: true }); }
});


test('AI quick-start example creates native controls and synchronizes model values', async () => {
  await loadCMS();
  vm.runInThisContext(await readFile(new URL('../pages/_jsswift-fe/js/ui.js', import.meta.url), 'utf8'));
  const text = await readFile(new URL('../documentions/AI.md', import.meta.url), 'utf8');
  const snippet = text.match(/```js\n([\s\S]*?)```/)[1].replace(/^import .*;\n/gm, '').replace(/_\.mount\('#app',[\s\S]*$/, '');
  const sample = new Function('window', snippet + '\nreturn { name, category, nameInput:input, categorySelect:select, table, dialog };')(globalThis);
  assert.ok(sample.table.nodeType);
  assert.equal(sample.nameInput._input.value, 'Prodotto 01');
  sample.name.value = 'Prodotto aggiornato';
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(sample.nameInput._input.value, 'Prodotto aggiornato');
  sample.category.value = 'Ufficio';
  assert.equal(sample.category.value, 'Ufficio');
  sample.nameInput._input.value = 'Nome digitato';
  sample.nameInput._input.dispatchEvent({type:'input'});
  assert.equal(sample.name.value, 'Nome digitato');
  sample.name.dispose();
  sample.category.dispose();
});
