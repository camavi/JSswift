import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import path from 'node:path';
test('offline SVG named imports include only the selected drawing',async()=>{
 const result=await build({stdin:{contents:"import {add} from './packages/ui/src/icons.js'; globalThis.icon=add();",resolveDir:process.cwd()},bundle:true,write:false,minify:true});
 const code=result.outputFiles[0].text;
 assert.ok(code.includes('M12 5v14M5 12h14'));
 assert.ok(!code.includes('m16 3 5 5-12 12-6 1 1-6L16 3Z'));
 assert.ok(code.length<1500);
 for(const name of ['jsswift','ui']){
  const fs=await import('node:fs/promises');const pkg=JSON.parse(await fs.readFile(path.join('packages',name,'package.json')));
  assert.equal(pkg.exports['./icons'].import,'./dist/icons.js');
 }
});
