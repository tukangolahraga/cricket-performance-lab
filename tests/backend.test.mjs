import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const source=fs.readFileSync(new URL('../backend/Code.gs',import.meta.url),'utf8');
function harness(){
 let email='coach@example.org',seq=0,fail='',locked=false;const files=new Map(),sheets=new Map(),properties=new Map([
  ['CPL_WORKSPACE_DOMAIN','example.org'],['CPL_ALLOWED_EMAILS','coach@example.org,viewer@example.org'],['CPL_ADMIN_EMAIL','coach@example.org']
 ]);
 function sheet(name){
  const data=[];
  return {data,setName(){},setFrozenRows(){},appendRow(r){data.push([...r]);},getLastRow(){return data.length;},getDataRange(){return {getValues:()=>structuredClone(data)};},
   getRange(row,col,n,w){
    return {setValues(values){if(fail===name)throw Error('INJECTED_WRITE_FAILURE');for(let i=0;i<n;i++){data[row-1+i]??=[];for(let j=0;j<w;j++)data[row-1+i][col-1+j]=values[i][j];}},getValues(){return structuredClone(data.slice(row-1,row-1+n).map(r=>r.slice(col-1,col-1+w)));}};
   }
  };
 }
 const ss={getId:()=> 'sheet-id',getSheetByName:n=>sheets.get(n)||null,insertSheet(n){const sh=sheet(n);sheets.set(n,sh);return sh;}};
 const folder={getId:()=> 'folder-id',createFile(blob){if(fail==='Drive')throw Error('DRIVE_FAILURE');const id='file-'+(++seq);files.set(id,blob.text);return {getId:()=>id};}};
 const context=vm.createContext({console,PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k)||null,setProperty:(k,v)=>properties.set(k,v)})},
  Session:{getActiveUser:()=>({getEmail:()=>email})},
  LockService:{getScriptLock:()=>({waitLock(){assert.equal(locked,false);locked=true;},releaseLock(){locked=false;}})},
  SpreadsheetApp:{create:()=>ss,openById:()=>ss,flush(){}},
  DriveApp:{createFolder:()=>folder,getFolderById:()=>folder,getFileById:id=>{if(!files.has(id))throw Error('FILE_MISSING');return {getBlob:()=>({getDataAsString:()=>files.get(id)})};}},
  HtmlService:{createHtmlOutputFromFile:()=>({setTitle:()=> 'html'})},
  Utilities:{newBlob:(text,type,name)=>({text,name,getBytes:()=>Buffer.from(text)}),getUuid:()=> 'batch-'+(++seq),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(algo,text)=>Array.from(crypto.createHash('sha256').update(text).digest())}
 });
 vm.runInContext(source,context);context.setup();return {c:context,sheets,files,properties,setEmail:v=>email=v,setFail:v=>fail=v};
}
function match(id='100',format='SIXES'){
 const n={SIXES:6,SUPER8:8,T20:11}[format];return {id,created:'2026-10-26T00:00:00.000Z',version:1,matchFormat:format,venue:'Test',teams:[0,1].map(t=>({name:'Team '+t,players:Array.from({length:n},(_,i)=>({id:t+'-'+i,name:'Player '+t+'-'+i}))})),innings:[{index:0,batting:0,ended:false,events:[{striker:'0-0',nonStriker:'0-1',bowler:'1-0',runs:4,extra:'normal',extraRuns:0,wicket:'none',dismissed:null,shotX:0,pitchY:0}]}]};
}
test('all exposed endpoints deny blank, foreign-domain and unlisted users',()=>{
 const h=harness();const calls=[()=>h.c.doGet(),()=>h.c.ping(),()=>h.c.loadCloud(),()=>h.c.saveCloud({}),()=>h.c.dbListMatches(),()=>h.c.dbLoadMatch('100'),()=>h.c.dbLoadOpponentHistory(''),()=>h.c.dbSaveMatch({}),()=>h.c.setup()];
 for(const email of ['', 'outsider@example.org','coach@evil.example.org']){h.setEmail(email);for(const fn of calls)assert.throws(fn,/ACCESS_DENIED/);}
 h.setEmail('viewer@example.org');assert.throws(()=>h.c.setup(),/ADMIN_REQUIRED/);assert.equal(h.c.ping().revision,0);
});
test('setup is repeatable and preserves saved records',()=>{const h=harness();h.c.dbSaveMatch({match:match(),baseRevision:0});h.c.setup();assert.equal(h.c.dbListMatches().matches.length,1);});
test('personal owner mode accepts only configured owner, including Gmail',()=>{
 const h=harness();h.properties.set('CPL_AUTH_MODE','PERSONAL_OWNER');h.properties.set('CPL_ADMIN_EMAIL','owner@gmail.com');h.properties.delete('CPL_WORKSPACE_DOMAIN');h.properties.delete('CPL_ALLOWED_EMAILS');
 h.setEmail('owner@gmail.com');assert.equal(h.c.ping().user,'owner@gmail.com');h.c.dbSaveMatch({match:match(),baseRevision:0});
 for(const email of ['', 'other@gmail.com','coach@example.org']){h.setEmail(email);for(const fn of [()=>h.c.doGet(),()=>h.c.ping(),()=>h.c.loadCloud(),()=>h.c.saveCloud({}),()=>h.c.dbListMatches(),()=>h.c.dbLoadMatch('100'),()=>h.c.dbLoadOpponentHistory(''),()=>h.c.dbSaveMatch({}),()=>h.c.setup()])assert.throws(fn,/ACCESS_DENIED/);}
});
test('each scoring format round-trips complete annotations and publishes normalized FKs',()=>{
 for(const format of ['SIXES','SUPER8','T20']){const h=harness(),m=match('100',format);const r=h.c.dbSaveMatch({match:m,baseRevision:0});assert.equal(r.revision,1);assert.equal(JSON.stringify(h.c.dbLoadMatch('100').match),JSON.stringify(m));
  const ptr=h.sheets.get('Matches').data[1],batch=ptr[2],roster=h.sheets.get('Rosters').data.slice(1),pids=new Set(roster.map(r=>r[4]));
  for(const d of h.sheets.get('Deliveries').data.slice(1)){assert.equal(d[1],batch);for(const i of [4,5,6])assert.ok(pids.has(d[i]));assert.equal(d[12],0);}
  assert.equal(h.c.dbLoadOpponentHistory('  TEAM 1 ').count,1);
 }
});
test('stale saves reject, same match creates new batch without duplicate live listing',()=>{
 const h=harness(),m=match();h.c.dbSaveMatch({match:m,baseRevision:0});assert.throws(()=>h.c.dbSaveMatch({match:m,baseRevision:0}),/CONFLICT/);
 m.innings[0].events[0].runs=6;h.c.dbSaveMatch({match:m,baseRevision:1});assert.equal(h.c.dbListMatches().matches.length,1);assert.equal(h.c.dbLoadMatch('100').revision,2);assert.equal(h.c.dbLoadOpponentHistory('').matches[0].innings[0].events[0].runs,6);
});
test('failed index batch or Drive write preserves published revision and supports retry',()=>{
 const h=harness(),m=match();h.c.dbSaveMatch({match:m,baseRevision:0});m.innings[0].events[0].runs=6;
 for(const failure of ['Drive','Deliveries','Matches']){h.setFail(failure);assert.throws(()=>h.c.dbSaveMatch({match:m,baseRevision:1}),/FAILURE/);h.setFail('');assert.equal(h.c.dbLoadMatch('100').revision,1);assert.equal(h.c.dbLoadMatch('100').match.innings[0].events[0].runs,4);}
 h.c.dbSaveMatch({match:m,baseRevision:1});assert.equal(h.c.dbLoadMatch('100').revision,2);
});
test('missing/corrupt backups fail explicitly rather than return incomplete history',()=>{
 const h=harness();h.c.dbSaveMatch({match:match(),baseRevision:0});const id=h.sheets.get('Matches').data[1][3];h.files.set(id,'{}');assert.throws(()=>h.c.dbLoadOpponentHistory(''),/INTEGRITY/);h.files.delete(id);assert.throws(()=>h.c.dbLoadMatch('100'),/MISSING/);
});
test('snapshot over cell limit uses Drive; snapshot replacement removes absent keys',()=>{
 const h=harness(),datasets={cpl_t20_v5_notes:JSON.stringify({note:'x'.repeat(60000)}),cpl_t20_v11:'null'};
 const r=h.c.saveCloud({datasets,baseRevision:0});assert.equal(r.revision,1);assert.equal(h.c.loadCloud().datasets.cpl_t20_v5_notes,datasets.cpl_t20_v5_notes);assert.throws(()=>h.c.saveCloud({datasets,baseRevision:0}),/CONFLICT/);
 h.c.saveCloud({datasets:{cpl_t20_v11:'null'},baseRevision:1});assert.deepEqual(Object.keys(h.c.loadCloud().datasets),['cpl_t20_v11']);
 assert.throws(()=>h.c.saveCloud({datasets:{unknown:'{}'},baseRevision:2}),/INVALID/);assert.throws(()=>h.c.saveCloud({datasets:{cpl_t20_v11:'bad'},baseRevision:2}));
});
test('payload limits reject before storage',()=>{const h=harness();assert.throws(()=>h.c.saveCloud({datasets:{cpl_t20_v5_notes:JSON.stringify('x'.repeat(8000001))},baseRevision:0}),/TOO_LARGE/);assert.equal(h.files.size,0);});
test('validation rejects bad identity, roster, numbers and references before writing',()=>{
 const edits=[m=>m.teams[0].players[1].id='0-0',m=>m.innings[0].events[0].bowler='0-0',m=>m.innings[0].events[0].nonStriker='0-0',m=>m.innings[0].events[0].runs='4',m=>m.innings[0].events[0].runs=-1,m=>m.innings[0].events[0].shotX='=IMPORTXML()',m=>m.innings[0].events[0].extra='evil',m=>m.innings[0].events[0].wicket='evil',m=>m.teams[0].players.pop(),m=>m.innings.push({...m.innings[0],index:1}),m=>m.id='../bad'];
 for(const edit of edits){const h=harness(),m=match();edit(m);assert.throws(()=>h.c.dbSaveMatch({match:m,baseRevision:0}));assert.equal(h.files.size,0);}
});
test('formula-leading strings are escaped in Sheets and preserved in JSON',()=>{const h=harness(),m=match();m.teams[0].name=' =IMPORTXML("x")';m.teams[0].players[0].name='@SUM(1)';h.c.dbSaveMatch({match:m,baseRevision:0});assert.ok(h.sheets.get('Teams').data[1][1].startsWith("'"));assert.equal(h.c.dbLoadMatch('100').match.teams[0].name,m.teams[0].name);});
test('local player IDs do not conflate across matches; supplied UIDs link',()=>{const h=harness(),a=match('100'),b=match('101');a.teams[0].players[0].uid='athlete-1';b.teams[0].players[0].uid='athlete-1';h.c.dbSaveMatch({match:a,baseRevision:0});h.c.dbSaveMatch({match:b,baseRevision:0});const rs=h.sheets.get('Rosters').data.slice(1),pa=rs.filter(r=>r[0]==='100'),pb=rs.filter(r=>r[0]==='101');assert.equal(pa[0][4],pb[0][4]);assert.notEqual(pa[1][4],pb[1][4]);});
