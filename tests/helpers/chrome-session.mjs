import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
export const chromePath=[process.env.CHROME_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean).find(existsSync);
export const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function chromeSession(){
 const profile=await fs.mkdtemp(path.join(os.tmpdir(),'jss-dev-chrome-'));
 const process=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
 let ws;
 try{
  let port;
  for(let i=0;i<100;i++){try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await delay(100);}}
  if(!port)throw new Error('Chrome did not start');
  const target=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
  ws=new WebSocket(target.webSocketDebuggerUrl);const pending=new Map();let id=0;
  const events=[];
  ws.onmessage=e=>{const m=JSON.parse(String(e.data));if(!m.id){events.push(m);return;}const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}};
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;const timer=setTimeout(()=>{pending.delete(next);reject(new Error('CDP timeout '+method));},15000);pending.set(next,{resolve,reject,timer});ws.send(JSON.stringify({id:next,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description??r.exceptionDetails.text);return r.result.value;};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Emulation.setFocusEmulationEnabled',{enabled:true});
  return {send,evaluate,events,async until(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(100);}throw new Error('Browser condition failed: '+expression);},async key(key,shift=false){await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:key==='Tab'?9:27,modifiers:shift?8:0});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:key==='Tab'?9:27,modifiers:shift?8:0});},async close(){ws.close();const ended=new Promise(r=>process.once('exit',r));process.kill();await ended;await fs.rm(profile,{recursive:true,force:true});}};
 }catch(e){ws?.close();process.kill();await delay(300);await fs.rm(profile,{recursive:true,force:true});throw e;}
}
