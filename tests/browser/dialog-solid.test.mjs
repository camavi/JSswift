import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {buildConfiguredRuntime} from '../../tools/build-configured-runtime.mjs';
import {chromePath,chromeSession} from '../helpers/chrome-session.mjs';
test('offline dialog close and solid form contrast work in full and selected runtimes', {skip:!chromePath,timeout:60000},async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jss-solid-dialog-'));let browser,server;
 try {
  for(const mode of ['selected','full']) {
   const out=path.join(dir,mode);
   await buildConfiguredRuntime({ui:mode==='full'?{all:true,responsive:false}:{components:['Dialog','Input','Select'],responsive:false},icons:false},out);
   await fs.writeFile(path.join(out,'index.html'),`<link rel="icon" href="data:,"><link rel="stylesheet" href="css/runtime.css"><script type="module">import './runtime.js';window.form=_.Input({label:'Nome',error:'Inserisci il nome'});window.dialog=_.Dialog({class:'jss-dialog-solid',title:'Prodotto',ariaLabel:'Prodotto',content:_.div({},form,_.Select({label:'Categoria',options:[{value:'Casa',label:'Casa'}]})),actions:[_.Button({color:'primary'},'Salva')],onOpen:()=>form.focus()});dialog.open();</script>`);
  }
  server=http.createServer(async(req,res)=>{try{const file=path.join(dir,new URL(req.url,'http://local').pathname);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromeSession();
  for(const mode of ['selected','full']) {
   await browser.send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/${mode}/index.html`});
   await browser.until("!!document.querySelector('.jss-dialog-solid .jss-error')");
   assert.equal(await browser.evaluate("!!document.querySelector('.jss-dialog-close svg path') && !document.querySelector('.jss-dialog-close .material-icons')"),true);
   assert.equal(await browser.evaluate("document.querySelector('.jss-dialog-close').getAttribute('aria-label')"),'Chiudi dialog');
   for(const theme of ['light','dark']) {
    await browser.evaluate(`_.setTheme('${theme}')`);
    const result=await browser.evaluate(`new Promise(resolve=>setTimeout(()=>{
     const panel=document.querySelector('.jss-dialog-solid');const bg=getComputedStyle(panel).backgroundColor;
     const lum=color=>{const c=color.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};
     const ratios=[...panel.querySelectorAll('.jss-dialog-title,.jss-dialog-title span,.jss-float-label,.jss-float-label span,.jss-error,.jss-error span,.jss-btn-content,.jss-btn-content span')].map(n=>{const a=lum(getComputedStyle(n).color),b=lum(n.closest('.jss-btn') ? getComputedStyle(n.closest('.jss-btn')).backgroundColor : bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
     resolve({ratios,image:getComputedStyle(panel).backgroundImage,btnImage:getComputedStyle(panel.querySelector('.jss-btn')).backgroundImage});
    },350))`);
    if(process.env.JSS_SOLID_SCREENSHOTS){const shot=await browser.send('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(process.env.JSS_SOLID_SCREENSHOTS,mode+'-'+theme+'.png'),Buffer.from(shot.data,'base64'));}
    assert.equal(result.image,'none');assert.equal(result.btnImage,'none');assert(result.ratios.length>=3);assert(result.ratios.every(x=>x>=4.5),JSON.stringify({mode,theme,...result}));
   }
   await browser.evaluate("document.querySelector('.jss-dialog-close').click()");await browser.until('!dialog.isOpen()');
   await browser.evaluate("dialog.open({closeIcon:'custom_close'})");await browser.until("document.querySelector('.jss-dialog-close').textContent.includes('custom_close')");
  }
  assert.equal(browser.events.some(e=>e.method==='Network.requestWillBeSent'&&/fonts.googleapis|fonts.gstatic/.test(e.params.request.url)),false);
 } finally {await browser?.close();if(server)await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});}
});
