import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readCSSSource } from '../tools/ui-css-source.mjs';
import { componentNames, member } from '../tools/select-ui.mjs';
import { parseAst } from 'rolldown/parseAst';
import { readUIManifest, uiSourceFiles } from '../tools/ui-manifest.mjs';

test('CSS source imports preserve exact cascade order and reject missing files and cycles', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-css-source-'));
  try {
    const entry = path.join(directory, 'entry.css');
    await fs.mkdir(path.join(directory, 'button'));
    await fs.writeFile(path.join(directory, 'button/base.css'), '.button{color:red}\n@import "../animation.css";');
    await fs.writeFile(path.join(directory, 'animation.css'), '@keyframes burst{to{opacity:0}}');
    await fs.writeFile(entry, '.shared{color:black}\n@import "./button/base.css";\n.button{color:blue}');
    assert.equal(readCSSSource(entry), '.shared{color:black}\n.button{color:red}\n@keyframes burst{to{opacity:0}}\n.button{color:blue}');
    await fs.writeFile(path.join(directory, 'animation.css'), '@import "./entry.css";');
    assert.throws(() => readCSSSource(entry), /import cycle/);
    await fs.unlink(path.join(directory, 'animation.css'));
    assert.throws(() => readCSSSource(entry), /ENOENT/);
    await fs.writeFile(entry, '@import "./button/base.css" screen;');
    assert.throws(() => readCSSSource(entry), /Unsupported/);
  } finally { await fs.rm(directory, {recursive:true,force:true}); }
});

test('UI source manifest rejects missing registered assets and duplicate aliases', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-ui-manifest-'));
  try {
    const manifest = {buildOrder:['button.js'],components:{Button:{js:'button.js',aliases:['Btn'],css:['button.css']}}};
    const write = () => fs.writeFile(path.join(directory, 'modules.json'), JSON.stringify(manifest));
    await fs.writeFile(path.join(directory, 'button.js'), 'UI.Button = UI.Btn;');
    await write();
    await assert.rejects(readUIManifest(directory), /ENOENT/);
    await fs.writeFile(path.join(directory, 'button.css'), '.jss-btn{}');
    assert.deepEqual((await readUIManifest(directory)).components, manifest.components);
    manifest.components.Button.aliases.push('Button');
    await write();
    await assert.rejects(readUIManifest(directory), /Duplicate.*alias/);
    manifest.components.Button.aliases = ['Btn'];
    manifest.components.Button.js = 'missing.js';
    await write();
    await assert.rejects(readUIManifest(directory), /absent from buildOrder/);
    manifest.components.Button.js = 'button.js';
    manifest.services = { Loading: { js: ['missing.js'] } };
    await write();
    await assert.rejects(readUIManifest(directory), /service Loading.*buildOrder/);
    manifest.services.Loading.js = ['button.js'];
    manifest.components.Button.dependencies = ['Unknown'];
    await write();
    await assert.rejects(readUIManifest(directory), /Unknown UI dependency/);
    manifest.components.Button.dependencies = [];
    manifest.cssOwnership = { button: ['Unknown'] };
    await write();
    await assert.rejects(readUIManifest(directory), /Invalid UI CSS ownership/);
  } finally { await fs.rm(directory, {recursive:true,force:true}); }
});


test('every public UI export and source asset belongs to the complete registry', async () => {
  const directory = path.resolve('packages/ui/src');
  const manifest = await readUIManifest(directory);
  const names = new Map();
  for (const [name, entry] of Object.entries(manifest.components)) {
    for (const exported of [name, ...entry.aliases]) names.set(exported, entry.js);
  }
  assert.deepEqual([...names.keys()].sort(), [...await componentNames(process.cwd())].sort());
  const files = manifest.buildOrder.map(file => ({file, text:null}));
  for (const file of files) file.text = await fs.readFile(path.join(directory, file.file), 'utf8');
  let offset = 0;
  for (const file of files) { file.start = offset; file.end = offset + file.text.length; offset = file.end + 1; }
  const program = parseAst(files.map(file => file.text).join('\n'));
  for (const node of program.body[0].expression.callee.body.body) {
    const name = node.expression?.type === 'AssignmentExpression' ? member(node.expression.left) : null;
    if (!/^UI\.[^.]+$/.test(name ?? '')) continue;
    const source = files.find(file => node.start >= file.start && node.start < file.end);
    assert.equal(source.file, names.get(name.slice(3)), name);
  }
  const registered = new Set(uiSourceFiles(manifest));
  for (const folder of ['components', 'helpers', 'services', 'css/components', 'css/shared', 'css/services']) {
    for (const file of await fs.readdir(path.join(directory, folder), {recursive:true,withFileTypes:true}).catch(error => { if (error.code === 'ENOENT') return []; throw error; })) {
      if (!file.isFile()) continue;
      const relative = path.relative(directory, path.join(file.parentPath, file.name));
      assert.ok(registered.has(relative), relative);
    }
  }
  assert.doesNotMatch(readCSSSource(path.join(directory, manifest.styles.entry)), /@import/);
  assert.ok(manifest.components.Upload.css.length);
  assert.ok(manifest.components.TabPanel.css.length);
  assert.equal(manifest.services.Loading.styling, 'inline-styles');
});
