import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const bridge=fs.readFileSync(new URL('../scripts/client-bridge.js',import.meta.url),'utf8');
function client(cloud=false){
 const elements=new Map(),store=new Map(),calls=[];let reloads=0,success,failure;
 function el(id){if(elements.has(id))return elements.get(id);const e={id,value:'',textContent:'',classList:{add(){},remove(){}},appendChild(){},replaceChildren(){},removeAttribute(){},click(){},files:[]};Object.defineProperty(e,'innerHTML',{set(html){for(const [,name] of html.matchAll(/id="([^"]+)"/g))el(name);}});elements.set(id,e);return e;}
 const methods={ping:()=>({user:'coach@example.org',revision:4}),loadCloud:()=>({revision:4,datasets:{cpl_t20_v5_notes:'{}'}}),saveCloud:()=>({revision:5,backupName:'test.json'}),dbSaveMatch:()=>({ok:true,id:'100',revision:1,deliveries:0})};
 const runner=new Proxy({}, {get(_t,name){if(name==='withSuccessHandler')return fn=>{success=fn;return runner;};if(name==='withFailureHandler')return fn=>{failure=fn;return runner;};return arg=>{calls.push({name,arg});try{success(methods[name](arg));}catch(e){failure(e);}};}});
 const context={window:{google:cloud?{script:{run:runner}}:undefined},document:{getElementById:el,createElement:()=>el('new-'+elements.size),dispatchEvent(){}},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},location:{reload:()=>reloads++},confirm:()=>true,match:{id:'100',teams:[],innings:[]},Event:class{},console};
 context.sessionStorage=context.localStorage;
 if(cloud)context.google=context.window.google;
 vm.runInNewContext(bridge,context);return {el,store,calls,methods,reloads:()=>reloads};
}
test('Pages rejects cloud write visibly and never claims success',async()=>{const h=client();await h.el('cpl-cloud-save').onclick();assert.match(h.el('cpl-cloud-status').textContent,/Gagal: Mode lokal/);assert.equal(h.calls.length,0);});
test('ping cannot establish or advance snapshot baseline',async()=>{const h=client(true);await h.el('cpl-cloud-ping').onclick();assert.equal(h.store.has('cpl_repo_cloud_snapshotRevision'),false);await h.el('cpl-cloud-save').onclick();assert.match(h.el('cpl-cloud-status').textContent,/Ambil snapshot/);assert.ok(!h.calls.some(c=>c.name==='saveCloud'));h.store.set('cpl_repo_cloud_snapshotRevision','2');await h.el('cpl-cloud-ping').onclick();assert.equal(h.store.get('cpl_repo_cloud_snapshotRevision'),'2');});
test('load replaces absent datasets and save uses retained revision',async()=>{const h=client(true);h.store.set('cpl_t20_v11','null');await h.el('cpl-cloud-load').onclick();assert.equal(h.store.get('cpl_repo_cloud_snapshotRevision'),'4');assert.equal(h.store.has('cpl_t20_v11'),false);assert.equal(h.reloads(),1);await h.el('cpl-cloud-save').onclick();assert.equal(h.calls.at(-1).arg.baseRevision,4);assert.equal(h.store.get('cpl_repo_cloud_snapshotRevision'),'5');});
test('failed match response cannot update local revision or report success',async()=>{const h=client(true);h.methods.dbSaveMatch=()=>{throw Error('CONFLICT');};await h.el('cpl-db-save').onclick();assert.match(h.el('cpl-db-status').textContent,/Gagal: CONFLICT/);assert.equal(h.store.has('cpl_repo_cloud_matchRevisions'),false);});
