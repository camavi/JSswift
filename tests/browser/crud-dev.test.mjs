import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createServer} from 'vite';
import {jssRuntime} from '../../tools/vite-jss.mjs';
import {chromePath,chromeSession,delay} from '../helpers/chrome-session.mjs';

test('documented CRUD runs in Vite dev: keyboard, error associations, storage failures, reload and rod ownership', {skip:!chromePath,timeout:120000},async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jss-crud-dev-'));
 let server,browser;
 try{
  const doc=await fs.readFile('documentions/examples/crud.md','utf8');
  let code=doc.match(/```js\n([\s\S]*?)\n```/)[1];
  code=code.replace("returnFocus = origin;", "returnFocus = origin; ownedModels.forEach(m=>{const dispose=m.dispose.bind(m);m.dispose=()=>{window.__disposed++;dispose();};});");
  await fs.writeFile(path.join(dir,'app.js'),"import 'jss:runtime'; window.__disposed=0;\n"+code+"\nwindow.__crud={get models(){return models;}};");
  await fs.copyFile(path.resolve('packages/ui/dist/icons.js'),path.join(dir,'icons.js'));
  await fs.writeFile(path.join(dir,'jss.config.js'),'export default {ui:{responsive:false},icons:false};');
  await fs.writeFile(path.join(dir,'index.html'),'<link rel="icon" href="data:,"><div id="app"></div><script type="module" src="/app.js"></script>');
  server=await createServer({configFile:false,root:dir,plugins:[jssRuntime({config:path.join(dir,'jss.config.js')})],logLevel:'silent',server:{host:'127.0.0.1',port:0}});await server.listen();
  browser=await chromeSession();const {evaluate:e,until,key}=browser;
  const url=`http://127.0.0.1:${server.httpServer.address().port}`;
  await browser.send('Page.navigate',{url});await until("!!document.getElementById('add-product')");
  assert.equal(await e(`(async()=>{const {add,edit}=await import('/icons.js');const first=add();const second=add();const button=_.Button({icon:edit(16)},'Edit');return first!==second&&first.namespaceURI==='http://www.w3.org/2000/svg'&&first.getAttribute('aria-hidden')==='true'&&first.getAttribute('focusable')==='false'&&button.querySelector('svg').getAttribute('width')==='16';})()`),true);
  const open=async id=>{await e(`document.getElementById('${id}').click()`);await until("!!document.querySelector('[role=dialog] input')");await delay(200);};
  const close=async()=>{await key('Escape');await until("!document.querySelector('[role=dialog]')");await delay(100);};
  await open('add-product');assert.equal(await e("document.activeElement===document.querySelector('[role=dialog] input')"),true);
  for(const shift of [false,true])for(let i=0;i<12;i++){await key('Tab',shift);assert.equal(await e("document.querySelector('[role=dialog]').contains(document.activeElement)"),true);}
  await e("document.getElementById('save-product').click()");await delay(100);
  const associations=await e(`Array.from(document.querySelectorAll('[role=dialog] input[aria-required=true],[role=dialog] [role=combobox][aria-required=true]')).map(n=>({tag:n.tagName,type:n.type,invalid:n.getAttribute('aria-invalid'),description:n.getAttribute('aria-describedby'),text:(n.getAttribute('aria-describedby')||'').split(' ').map(id=>document.getElementById(id)?.textContent)}))`);
  assert.equal(associations.length,4);
  assert.ok(associations.every(n=>n.invalid==='true'&&n.text.some(t=>t?.trim())),JSON.stringify(associations));
  await close();assert.equal(await e("document.activeElement.id"),'add-product');assert.equal(await e('window.__disposed'),8);
  await open('edit-1');
  await e("window.__oldTrigger=document.getElementById('edit-1'); document.getElementById('save-product').click()");
  await until("!document.querySelector('[role=dialog]') && document.activeElement.id==='edit-1'");
  assert.equal(await e("!window.__oldTrigger.isConnected"),true);
  await open('edit-1');
  await e("window.__setItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('quota');};document.getElementById('save-product').click();");
  assert.equal(await e("!!document.querySelector('[role=dialog]') && document.querySelector('[role=dialog] [role=alert]').textContent.includes('Salvataggio non riuscito')"),true);
  await e('Storage.prototype.setItem=window.__setItem');await close();
  const before=await e('window.__disposed');
  for(let i=0;i<10;i++){await open('add-product');await close();}
  assert.equal(await e('window.__disposed'),before+80);
  await e("localStorage.setItem('jsswift-crud-example','{broken')");await browser.send('Page.reload');await until("document.querySelector('[role=status]')?.textContent==='Archivio non disponibile'");
  assert.equal(await e("document.querySelectorAll('tbody tr').length"),5);
  await e("localStorage.setItem('jsswift-crud-example',JSON.stringify([{id:1,name:'Persistito',category:'Casa',price:3,quantity:2}]))");await browser.send('Page.reload');await until("document.querySelector('tbody')?.textContent.includes('Persistito')");
  assert.equal(await e("document.querySelectorAll('tbody tr').length"),1);
  await e("localStorage.setItem('jsswift-crud-example',JSON.stringify([{id:1,name:'Invalid',category:'Missing',price:3,quantity:2}]))");await browser.send('Page.reload');await until("document.querySelector('[role=status]')?.textContent==='Archivio non valido'");
  const injected=await browser.send('Page.addScriptToEvaluateOnNewDocument',{source:"Storage.prototype.getItem=function(){throw new Error('blocked storage');}"});
  await browser.send('Page.reload');await until("document.querySelector('[role=status]')?.textContent==='Archivio non disponibile'");
  await browser.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injected.identifier});
  const errors=browser.events.filter(x=>x.method==='Runtime.exceptionThrown'||x.method==='Network.loadingFailed'||x.method==='Network.responseReceived'&&x.params.response.status>=400);assert.deepEqual(errors,[]);
 }finally{await browser?.close();await server?.close();await fs.rm(dir,{recursive:true,force:true});}
});
