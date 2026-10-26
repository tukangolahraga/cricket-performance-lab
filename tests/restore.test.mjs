import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const script=new URL('../scripts/restore-backup.mjs',import.meta.url);
test('backup conversion yields frontend-compatible imports and refuses overwrite',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cpl-restore-'));
 for(const [schema,content] of [['CPL_MATCH_1',{match:{teams:[],innings:[]}}],['CPL_SNAPSHOT_1',{datasets:{cpl_t20_v11:'null'}}]]){
  const input=path.join(dir,schema+'.json'),output=path.join(dir,schema+'-output.json');fs.writeFileSync(input,JSON.stringify({schema,...content}));
  const r=spawnSync(process.execPath,[script.pathname.replace(/^\/([A-Za-z]:)/,'$1'),input,output],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  const doc=JSON.parse(fs.readFileSync(output));if(schema==='CPL_MATCH_1')assert.equal(doc.format,'CPL_T20_V2');else assert.equal(doc.schema,'CPL_LOCAL_TRANSFER_1');
  assert.notEqual(spawnSync(process.execPath,[script.pathname.replace(/^\/([A-Za-z]:)/,'$1'),input,output]).status,0);
 }
 // Leave temp fixtures to OS cleanup; never recursively remove computed paths.
});
