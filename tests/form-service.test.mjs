import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { loadCMS } from './helpers/load-cms.mjs';
await loadCMS();
vm.runInThisContext(await fs.readFile('packages/ui/dist/ui.js','utf8'));
const tick = () => new Promise(resolve => setTimeout(resolve,0));
const deferred = () => { let resolve; const promise=new Promise(r=>resolve=r); return {promise,resolve}; };

test('useForm synchronizes initial values, edits, duplicate fields and external rod updates',async()=>{
 const model=_.rod({name:'Ada'}),form=_.useForm({model}),a=form.field('name'),b=form.field('name');
 assert.equal(a.value,'Ada');form.setValue('name','Grace');await tick();assert.equal(a.value,'Grace');assert.equal(b.value,'Grace');
 a.value='Lin';await tick();assert.equal(form.getValue('name'),'Lin');assert.equal(b.value,'Lin');
 model.value={name:'External'};await tick();assert.equal(a.value,'External');assert.equal(b.value,'External');
 a.dispose();b.dispose();model.value={name:'Still usable'};await tick();assert.equal(model.value.name,'Still usable');
});
test('useForm resets a snapshot of initial values and synchronizes plain models',async()=>{
 const model={name:'Ada',nested:{count:1}},form=_.useForm({model}),field=form.field('name');
 form.setValue('name','Changed');model.nested.count=2;form.reset();await tick();assert.equal(field.value,'Ada');assert.equal(model.nested.count,1);
 model.nested.count=3;form.reset();assert.equal(model.nested.count,1);field.dispose();
 const explicit=_.useForm({model:{name:'A'},initial:{name:'B'}});explicit.reset();assert.equal(explicit.getValue('name'),'B');
});
test('useForm rejects overlapping submit without clearing the active submitting flag',async()=>{
 const form=_.useForm(),gate=deferred();let count=0;const first=form.submit(async()=>{count++;await gate.promise});await tick();
 assert.deepEqual(await form.submit(()=>count++),{ok:false,reason:'submitting'});assert.equal(count,1);assert.equal(form.submitting.value,true);
 gate.resolve();assert.equal((await first).ok,true);assert.equal(form.submitting.value,false);
});
test('useForm ignores stale validation and results arriving after reset',async()=>{
 const pending=[],form=_.useForm({model:{name:'old'},rules:{name:()=>{const d=deferred();pending.push(d);return d.promise}}});
 const old=form.validateField('name');form.setValue('name','new');const current=form.validateField('name');pending[1].resolve(true);assert.equal(await current,true);pending[0].resolve('Old error');assert.equal(await old,false);assert.equal(form.getError('name'),null);
 const late=form.validateField('name');form.reset();pending[2].resolve('Late error');await late;assert.equal(form.getError('name'),null);
 const submit=form.submit(()=>assert.fail('reset must cancel submission before callback'));form.reset();pending[3].resolve(true);assert.equal((await submit).reason,'reset');
});
test('useForm field disposal removes its document listener and stops synchronization',async()=>{
 const model=_.rod({name:'A'}),form=_.useForm({model}),field=form.field('name');await field.onInput();assert.equal(document._listeners.get('pointerdown')?.size,1);field.dispose();assert.equal(document._listeners.get('pointerdown')?.size,0);
 model.value={name:'B'};await tick();assert.equal(field.value,'A');assert.equal(form.getValue('name'),'B');
});
