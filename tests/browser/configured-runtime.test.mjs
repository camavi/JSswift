import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { buildConfiguredRuntime } from '../../tools/build-configured-runtime.mjs';

const chrome = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome'].filter(Boolean).find(existsSync);

test('selective application runtime renders styled controls and reactive fields in Chrome', { skip: !chrome }, async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'jss-select-browser-'));
  try {
    const output = path.join(directory, 'runtime');
    await buildConfiguredRuntime({ ui: { components: ['Button', 'Input', 'Table'], services: ['Dialog'], responsive: false } }, output);
    const runtime = await fs.readFile(path.join(output, 'runtime.js'), 'utf8');
    const html = `<!doctype html><link rel="stylesheet" href="./runtime/css/runtime.css"><div id="app"></div><script type="module">
      try {
        ${runtime}
        const model = _.rod('Initial');
        const input = _.Input({ label: 'Name', model });
        const button = _.Button({ label: 'Save' });
        const table = _.Table({ rows: [{ name: 'Visible row' }], columns: [{key:'name',label:'Name'}], pagination:false });
        _.mount('#app', _.div({}, input, button, table));
        model.value = 'Updated';
        const dialog = _.Dialog({title:'Test',content:'Dialog content'});
        dialog.open();
        const open = !!document.querySelector('.jss-dialog');
        dialog.close();
        setTimeout(() => {
          document.body.dataset.result = JSON.stringify({ value: document.querySelector('input').value, button: button.tagName, table: !!table.querySelector('table'), text: table.textContent.includes('Visible row'), omitted: _.Select === undefined && _.Upload === undefined, styled: getComputedStyle(button).display !== 'inline', open, closed: !document.querySelector('.jss-dialog') });
        }, 500);
      } catch(error) { document.body.dataset.error = error.stack; }
    </script>`;
    const file = path.join(directory, 'index.html');
    await fs.writeFile(file, html);
    const { stdout } = await promisify(execFile)(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=2000', '--dump-dom', pathToFileURL(file).href], { maxBuffer: 4 * 1024 * 1024 });
    assert.doesNotMatch(stdout, /data-error=/, stdout.slice(-4000));
    const match = stdout.match(/data-result="([^"]*)"/);
    assert.ok(match, stdout.slice(-4000));
    const result = JSON.parse(match[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
    assert.deepEqual(result, { value: 'Updated', button: 'BUTTON', table: true, text: true, omitted: true, styled: true, open: true, closed: true });
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
