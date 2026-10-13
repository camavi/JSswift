import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createServer} from 'vite';
import {jssRuntime} from 'jsswift/vite';
const root=process.cwd();
const server=await createServer({configFile:false,root,plugins:[jssRuntime()],logLevel:'silent',server:{host:'127.0.0.1',port:0}});
let external;
try {
 await server.listen();
 const base=()=>`http://127.0.0.1:${server.httpServer.address().port}`;
 const get=async url=>{const r=await fetch(base()+url);const text=await r.text();assert.equal(r.status,200,text.slice(0,1000));return text;};
 await get('/'); await get('/app.js');
 const runtime=()=>get('/@id/__x00__jss:runtime');
 assert.match(await runtime(),/UI\.Button\s*=/);
 await get('/@id/__x00__jss:selected.css');
 // Poll for watcher-driven server restarts, without manually invalidating the plugin.
 async function until(check){const deadline=Date.now()+15000;let last;while(Date.now()<deadline){try{const code=await runtime();if(check(code))return;}catch(e){last=e;}await new Promise(r=>setTimeout(r,100));}throw last??new Error('Discovery watcher did not update selection');}
 await new Promise(r=>setTimeout(r,250));
 await fs.writeFile(path.join(root,'added.js'),'_.Badge({});');
 await until(code=>/UI\.Badge\s*=/.test(code));
 await fs.unlink(path.join(root,'added.js'));
 await until(code=>!/UI\.Badge\s*=/.test(code));
 await fs.writeFile(path.join(root,'app.js'),"import 'jss:runtime'; _.Input({label:'Name'});");
 await until(code=>/UI\.Input\s*=/.test(code)&&!/UI\.Table\s*=/.test(code));
 external=await fs.mkdtemp(path.join(os.tmpdir(),'jss-external-watch-'));
 await fs.writeFile(path.join(root,'jss.config.js'),'export default '+JSON.stringify({ui:{auto:[external],components:['Button'],responsive:false},icons:false}));
 await until(code=>/UI\.Btn\s*=/.test(code)&&!/UI\.Input\s*=/.test(code));
 await fs.writeFile(path.join(external,'outside.js'),'_.Badge({});');
 await until(code=>/UI\.Badge\s*=/.test(code));
 await fs.unlink(path.join(external,'outside.js'));
 await until(code=>!/UI\.Badge\s*=/.test(code));
 console.log('Installed-package Vite dev HTTP, implicit discovery, add/unlink/change passed');
} finally {await server.close();if(external)await fs.rm(external,{recursive:true,force:true});}
