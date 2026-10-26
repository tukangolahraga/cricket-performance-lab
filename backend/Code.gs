/** CPL V6.4 repository backend. Private helpers end with _. No public REST API. */
const KEYS_ = ['cpl_t20_v11','cpl_t20_v41_archive','cpl_t20_v42_registry','cpl_t20_v5_notes','cpl_t20_v51_pose_sessions','cpl_t20_v53_motion_tracks','cpl_t20_v54_phase_assessments','cpl_t20_v55_development','cpl_v56_bowling_assessments','cpl_v57_bowling_dashboard_notes','cpl_v58_athlete_reports','cpl_v59_scouting','cpl_v60_coach_assessments_v1'];
const TABLES_ = {
 Teams:['teamId','name'], Players:['playerId','teamId','name','uid'],
 Matches:['matchId','revision','batchId','fileId','sha256','savedAt','user','format','teamA','teamB','deliveries'],
 MatchTeams:['matchId','batchId','slot','teamId'],
 Rosters:['matchId','batchId','slot','localPlayerId','playerId'],
 Innings:['matchId','batchId','innings','battingSlot','ended','reason'],
 Deliveries:['matchId','batchId','innings','sequence','strikerId','nonStrikerId','bowlerId','runs','extra','extraRuns','wicket','dismissedId','shotX','shotY','pitchX','pitchY'],
 Snapshots:['id','revision','fileId','sha256','savedAt','user'],
 Audit:['time','user','action','id','revision']
};
function props_(){return PropertiesService.getScriptProperties();}
function who_(){
 const p=props_(), email=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
 if(p.getProperty('CPL_AUTH_MODE')==='PERSONAL_OWNER'){
  const owner=String(p.getProperty('CPL_ADMIN_EMAIL')||'').trim().toLowerCase();
  if(!owner||!email||email!==owner)throw Error('ACCESS_DENIED: personal owner only');
  return email;
 }
 const domain=String(p.getProperty('CPL_WORKSPACE_DOMAIN')||'').trim().toLowerCase();
 const allowed=String(p.getProperty('CPL_ALLOWED_EMAILS')||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 if(!domain||!email||!email.endsWith('@'+domain)||!allowed.includes(email))throw Error('ACCESS_DENIED: Workspace domain AND explicit email allowlist required');
 return email;
}
function admin_(){const user=who_();if(user!==String(props_().getProperty('CPL_ADMIN_EMAIL')||'').toLowerCase().trim())throw Error('ADMIN_REQUIRED');return user;}
function lock_(fn){const l=LockService.getScriptLock();l.waitLock(30000);try{return fn();}finally{l.releaseLock();}}
function setup(){
 admin_();return lock_(()=>{
  const p=props_();
  if(!p.getProperty('CPL_SPREADSHEET_ID'))p.setProperty('CPL_SPREADSHEET_ID',SpreadsheetApp.create('Cricket Performance Lab').getId());
  if(!p.getProperty('CPL_BACKUP_FOLDER_ID'))p.setProperty('CPL_BACKUP_FOLDER_ID',DriveApp.createFolder('CPL private backups').getId());
  const e=env_();Object.keys(TABLES_).forEach(name=>{if(!e.ss.getSheetByName(name)){const sh=e.ss.insertSheet(name);sh.appendRow(TABLES_[name]);sh.setFrozenRows(1);}});
  return {ok:true,spreadsheetId:e.ss.getId(),folderId:e.folder.getId()};
 });
}
function env_(){const p=props_(),id=p.getProperty('CPL_SPREADSHEET_ID'),folder=p.getProperty('CPL_BACKUP_FOLDER_ID');if(!id||!folder)throw Error('SETUP_REQUIRED');return {ss:SpreadsheetApp.openById(id),folder:DriveApp.getFolderById(folder)};}
function doGet(){who_();return HtmlService.createHtmlOutputFromFile('App').setTitle('Cricket Performance Lab • V6.4 Cloud');}
function rows_(e,name){const sh=e.ss.getSheetByName(name);if(!sh)throw Error('SETUP_REQUIRED: '+name);return sh.getDataRange().getValues().slice(1);}
function find_(e,name,id){const a=rows_(e,name),found=[];a.forEach((r,i)=>{if(String(r[0])===String(id))found.push({row:r,index:i+2});});if(found.length>1)throw Error('DUPLICATE_KEY: '+name);return found[0]||null;}
function safe_(v){if(v===null||v===undefined)return '';if(typeof v!=='string')return v;return /^[\s]*[=+@\-]/.test(v)||/^[\t\r\n]/.test(v)?"'"+v:v;}
function write_(e,name,data){if(!data.length)return;const sh=e.ss.getSheetByName(name);for(let i=0;i<data.length;i+=150){const chunk=data.slice(i,i+150).map(r=>r.map(safe_));sh.getRange(sh.getLastRow()+1,1,chunk.length,TABLES_[name].length).setValues(chunk);}}
function pointer_(e,name,old,row){const sh=e.ss.getSheetByName(name);if(old)sh.getRange(old.index,1,1,row.length).setValues([row.map(safe_)]);else write_(e,name,[row]);SpreadsheetApp.flush();}
function hash_(text){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function file_(e,data,name){const raw=JSON.stringify(data);const f=e.folder.createFile(Utilities.newBlob(raw,'application/json',name));return {id:f.getId(),hash:hash_(raw),name};}
function read_(id,hash){const raw=DriveApp.getFileById(id).getBlob().getDataAsString();if(hash_(raw)!==hash)throw Error('BACKUP_INTEGRITY_FAILED');return JSON.parse(raw);}
function size_(x,max){if(Utilities.newBlob(JSON.stringify(x)).getBytes().length>max)throw Error('PAYLOAD_TOO_LARGE');}
function str_(v,max,label){if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('INVALID_'+label);return v;}
function id_(v){const s=String(v??'');if(!/^[a-zA-Z0-9_-]{1,100}$/.test(s))throw Error('INVALID_ID');return s;}
function int_(v,min,max){if(!Number.isInteger(v)||v<min||v>max)throw Error('INVALID_NUMBER');}
function validate_(m){
 size_(m,1200000);if(!m||typeof m!=='object')throw Error('INVALID_MATCH');id_(m.id);
 const f={T20:11,SIXES:6,SUPER8:8}[m.matchFormat];if(!f)throw Error('INVALID_FORMAT');
 if(!Array.isArray(m.teams)||m.teams.length!==2||!Array.isArray(m.innings)||m.innings.length<1||m.innings.length>2)throw Error('INVALID_MATCH');
 const ids=m.teams.map(t=>{
  str_(t.name,120,'TEAM');if(!Array.isArray(t.players)||t.players.length!==f)throw Error('INVALID_ROSTER');
  const a=t.players.map(p=>{str_(p.name,120,'PLAYER');id_(p.id);if(p.uid!=null)id_(p.uid);return String(p.id);});
  if(new Set(a).size!==a.length)throw Error('DUPLICATE_PLAYER_ID');return new Set(a);
 });
 const canonical=s=>s.trim().normalize('NFKC').toLowerCase();if(canonical(m.teams[0].name)===canonical(m.teams[1].name))throw Error('DUPLICATE_TEAM');
 const uids=m.teams.flatMap(t=>t.players.filter(p=>p.uid).map(p=>String(p.uid)));if(new Set(uids).size!==uids.length)throw Error('DUPLICATE_UID');
 m.innings.forEach((inn,i)=>{
  int_(inn.batting,0,1);if(inn.index!==i||i&&inn.batting===m.innings[0].batting||!Array.isArray(inn.events)||inn.events.length>400)throw Error('INVALID_INNINGS');
  inn.events.forEach(d=>{
   if(!ids[inn.batting].has(String(d.striker))||!ids[inn.batting].has(String(d.nonStriker))||String(d.striker)===String(d.nonStriker)||!ids[1-inn.batting].has(String(d.bowler)))throw Error('INVALID_PLAYER_REFERENCE');
   int_(d.runs,0,6);int_(d.extraRuns??0,0,6);
   if(!['normal','wide','noball','bye','legbye'].includes(d.extra)||!['none','bowled','caught','lbw','stumped','hitwicket','runout'].includes(d.wicket))throw Error('INVALID_DELIVERY');
   if(d.wicket!=='none'&&![String(d.striker),String(d.nonStriker)].includes(String(d.dismissed)))throw Error('INVALID_DISMISSED');
   if(d.wicket!=='none'&&((d.extra==='wide'&&!['stumped','runout'].includes(d.wicket))||(d.extra==='noball'&&d.wicket!=='runout')||(['bye','legbye'].includes(d.extra)&&d.wicket!=='runout')))throw Error('INVALID_DISMISSAL');
   for(const k of ['shotX','shotY','pitchX','pitchY'])if(d[k]!=null&&(typeof d[k]!=='number'||!Number.isFinite(d[k])||Math.abs(d[k])>10000))throw Error('INVALID_COORDINATE');
  });
 });
 return m;
}
function normalized_(m,batch){
 const mid=String(m.id), out={Teams:[],Players:[],MatchTeams:[],Rosters:[],Innings:[],Deliveries:[]},maps=[];
 m.teams.forEach((t,slot)=>{
  const tid='t_'+hash_(t.name.trim().normalize('NFKC').toLowerCase());out.Teams.push([tid,t.name]);out.MatchTeams.push([mid,batch,slot,tid]);const map={};
  t.players.forEach(p=>{const pid=p.uid?'p_'+hash_('uid:'+p.uid):'p_'+hash_([mid,slot,p.id].join(':'));map[String(p.id)]=pid;out.Players.push([pid,tid,p.name,p.uid||'']);out.Rosters.push([mid,batch,slot,String(p.id),pid]);});maps.push(map);
 });
 m.innings.forEach((inn,i)=>{
  out.Innings.push([mid,batch,i,inn.batting,!!inn.ended,inn.reason||'']);
  inn.events.forEach((d,j)=>out.Deliveries.push([mid,batch,i,j,maps[inn.batting][d.striker],maps[inn.batting][d.nonStriker],maps[1-inn.batting][d.bowler],d.runs,d.extra,d.extraRuns||0,d.wicket,d.wicket==='none'?'':maps[inn.batting][d.dismissed],d.shotX??'',d.shotY??'',d.pitchX??'',d.pitchY??'']));
 });return out;
}
function checkRevision_(base,rev){if(!Number.isInteger(base)||base!==rev)throw Error('CONFLICT: server revision '+rev);}
function audit_(e,user,action,id,rev){try{write_(e,'Audit',[[new Date().toISOString(),user,action,id,rev]]);}catch(err){console.error('Audit failed after commit: '+err.message);}}
function ping(){const user=who_(),e=env_(),r=find_(e,'Snapshots','workspace');return {user,revision:r?Number(r.row[1]):0,keys:KEYS_,schema:'CPL_REPO_1'};}
function saveCloud(input){
 const user=who_();size_(input,8000000);const data=input&&input.datasets;
 if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!KEYS_.includes(k)))throw Error('INVALID_DATASETS');
 Object.keys(data).forEach(k=>{if(typeof data[k]!=='string')throw Error('INVALID_JSON');JSON.parse(data[k]);});
 return lock_(()=>{const e=env_(),old=find_(e,'Snapshots','workspace'),rev=old?Number(old.row[1]):0;checkRevision_(input.baseRevision,rev);
  const now=new Date().toISOString(),backup=file_(e,{schema:'CPL_SNAPSHOT_1',revision:rev+1,savedAt:now,datasets:data},'snapshot_r'+(rev+1)+'_'+Utilities.getUuid()+'.json');
  pointer_(e,'Snapshots',old,['workspace',rev+1,backup.id,backup.hash,now,user]);audit_(e,user,'SNAPSHOT_SAVE','workspace',rev+1);
  return {revision:rev+1,backupName:backup.name,savedAt:now};
 });
}
function loadCloud(){const user=who_();return lock_(()=>{const e=env_(),r=find_(e,'Snapshots','workspace');if(!r)return {revision:0,datasets:{},user};const doc=read_(r.row[2],r.row[3]);return {revision:Number(r.row[1]),datasets:doc.datasets,user};});}
function dbSaveMatch(input){
 const user=who_(),m=validate_(input&&input.match);
 return lock_(()=>{const e=env_(),mid=String(m.id),old=find_(e,'Matches',mid),rev=old?Number(old.row[1]):0;checkRevision_(input.baseRevision,rev);
  const batch=Utilities.getUuid(),indexed=normalized_(m,batch),now=new Date().toISOString();
  const backup=file_(e,{schema:'CPL_MATCH_1',revision:rev+1,batchId:batch,savedAt:now,match:m},'match_'+mid+'_r'+(rev+1)+'_'+batch+'.json');
  for(const table of ['Teams','Players']){const known=new Set(rows_(e,table).map(r=>r[0]));write_(e,table,indexed[table].filter(r=>{if(known.has(r[0]))return false;known.add(r[0]);return true;}));}
  for(const table of ['MatchTeams','Rosters','Innings','Deliveries'])write_(e,table,indexed[table]);
  SpreadsheetApp.flush();
  // Publish pointer LAST. Uncommitted batches must never be used in analytics.
  pointer_(e,'Matches',old,[mid,rev+1,batch,backup.id,backup.hash,now,user,m.matchFormat,indexed.MatchTeams[0][3],indexed.MatchTeams[1][3],indexed.Deliveries.length]);
  audit_(e,user,'MATCH_SAVE',mid,rev+1);return {ok:true,id:mid,revision:rev+1,deliveries:indexed.Deliveries.length,savedAt:now,driveFileId:backup.id};
 });
}
function dbListMatches(){who_();return lock_(()=>{const e=env_(),names=new Map(rows_(e,'Teams').map(r=>[r[0],String(r[1]).replace(/^'/,'')]));return {matches:rows_(e,'Matches').map(r=>({id:String(r[0]),revision:Number(r[1]),savedAt:r[5],format:r[7],teams:[names.get(r[8]),names.get(r[9])],deliveries:r[10]}))};});}
function dbLoadMatch(id){who_();id=id_(id);return lock_(()=>{const e=env_(),r=find_(e,'Matches',id);if(!r)throw Error('NOT_FOUND');const doc=read_(r.row[3],r.row[4]);validate_(doc.match);return {id,revision:Number(r.row[1]),match:doc.match};});}
function dbLoadOpponentHistory(teamName){
 who_();if(typeof teamName!=='string'||teamName.length>120)throw Error('INVALID_TEAM');
 return lock_(()=>{const e=env_(),name=teamName.trim().normalize('NFKC').toLowerCase(),tid='t_'+hash_(name),all=rows_(e,'Matches').filter(r=>!name||r[8]===tid||r[9]===tid).sort((a,b)=>String(a[5]).localeCompare(String(b[5]))),selected=all.slice(-60);
  const matches=selected.map(r=>{const doc=read_(r[3],r[4]);return validate_(doc.match);});return {matches,count:matches.length,requested:selected.length,total:all.length,truncated:all.length>60};
 });
}
