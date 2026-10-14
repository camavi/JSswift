import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import http from 'node:http';
import {buildConfiguredRuntime} from '../../tools/build-configured-runtime.mjs';
import {chromePath,chromeSession} from '../helpers/chrome-session.mjs';
test('Button resize keeps pager labels visible and Table honors disabled/embedded shadows', {skip:!chromePath,timeout:60000},async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jss-pager-test-'));let b,server;
 try{
  for(const all of [false,true]){
   const out=path.join(dir,all?'full':'selected');await buildConfiguredRuntime({ui:all?{all:true,responsive:false}:{components:['Button','Table'],responsive:false},icons:false},out);
   await fs.writeFile(path.join(out,'index.html'),`<link rel="icon" href="data:,"><link rel="stylesheet" href="css/runtime.css"><style>body{margin:0}.pager{display:flex;gap:8px;width:324px}.count{margin-right:12px}@media(max-width:650px){.pager{flex-wrap:wrap}.count{width:100%}.pager button{flex:1}}</style><script type="module">import './runtime.js';const pager=_.div({class:'pager'},_.span({class:'count'},'Pagina 1 di 3'),_.Button({id:'previous',dense:true,outline:true},'Precedente'),_.Button({id:'next',dense:true,outline:true},'Successiva'));const rows=[{name:'Record'}],columns=[{key:'name',label:'Nome'}];const ordinary=_.Table({rows,columns,shadow:true});ordinary.id='ordinary';const none=_.Table({rows,columns,shadow:'none'});none.id='none';const embedded=_.Table({rows,columns,embedded:true,shadow:true,minTableWidth:720,scrollLabel:'Elenco prodotti'});embedded.id='embedded';const shadow=_.rod('none');const reactive=_.Card({shadow},'Reactive');reactive.id='reactive';window.shadow=shadow;document.body.append(pager,ordinary,none,embedded,reactive);</script>`);
  }
  server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://local');const file=path.join(dir,url.pathname);const data=await fs.readFile(file);res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html');res.end(data);}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));b=await chromeSession();
  for(const mode of ['selected','full']){
   await b.send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await b.send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/${mode}/index.html`});await b.until("!!document.getElementById('embedded')");
   for(const theme of ['light','dark']){await b.evaluate(`_.setTheme('${theme}')`);assert.equal(await b.evaluate("getComputedStyle(document.getElementById('none')).boxShadow"),'none');assert.equal(await b.evaluate("getComputedStyle(document.getElementById('embedded')).boxShadow"),'none');assert.notEqual(await b.evaluate("getComputedStyle(document.getElementById('ordinary')).boxShadow"),'none');}
   assert.equal(await b.evaluate("document.getElementById('reactive').classList.contains('jss-shadow')"),false);await b.evaluate('shadow.value=true');await b.until("document.getElementById('reactive').classList.contains('jss-shadow')");await b.evaluate("shadow.value='none'");await b.until("!document.getElementById('reactive').classList.contains('jss-shadow')");
   await b.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
   assert.equal(await b.evaluate("['previous','next'].every(id=>{const n=document.getElementById(id),b=n.getBoundingClientRect(),r=n.querySelector('.jss-btn-content').getBoundingClientRect();return b.width>100&&r.left>=b.left&&r.right<=b.right&&!getComputedStyle(n).transitionProperty.includes('all')})"),true);
   await b.evaluate("document.querySelector('#embedded [role=region]').focus()");assert.equal(await b.evaluate("document.activeElement.getAttribute('aria-label')"),'Elenco prodotti');
  }
 }finally{await b?.close();if(server)await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});}
});
