/* Included inline by build.mjs in both GitHub Pages and Apps Script. */
(()=>{
 'use strict';
 const KEYS=['cpl_t20_v11','cpl_t20_v41_archive','cpl_t20_v42_registry','cpl_t20_v5_notes','cpl_t20_v51_pose_sessions','cpl_t20_v53_motion_tracks','cpl_t20_v54_phase_assessments','cpl_t20_v55_development','cpl_v56_bowling_assessments','cpl_v57_bowling_dashboard_notes','cpl_v58_athlete_reports','cpl_v59_scouting','cpl_v60_coach_assessments_v1'];
 const get=id=>document.getElementById(id),cloud=!!window.google?.script?.run;
 const status=get('cpl-cloud-status'),db=get('cpl-db-status'),panel=get('cpl-cloud-panel');
 const scope='cpl_repo_'+(cloud?'cloud':'local')+'_';
 let busy=false;
 const msg=(s,target=status)=>{target.textContent=s;};
 function reloadApp(){
  if(!cloud){location.reload();return;}
  // Reloading the HtmlService iframe itself can produce Google's blank frame.
  panel.classList.add('open');msg('Data lokal sudah diperbarui. Klik Muat ulang aplikasi untuk memuat semua modul.');
  const a=document.createElement('a');a.textContent='Muat ulang aplikasi';a.href=window.CPL_CONFIG.cloudAppUrl;a.target='_top';a.style.cssText='display:block;padding:16px;background:#00aa80;color:#041f1a;margin:12px 0;border-radius:9px;font-weight:bold';status.appendChild(a);
 }
 const run=(name,arg)=>new Promise((resolve,reject)=>{
  if(!cloud)return reject(Error('Mode lokal. Buka workspace cloud untuk login dan sinkronisasi.'));
  let settled=false;
  const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);fn(value);};
  const timer=setTimeout(()=>finish(reject,Error('Google belum membalas dalam 60 detik. Data mungkin sudah tersimpan; periksa daftar pertandingan atau revisi server sebelum mencoba lagi.')),60000);
  try{const r=google.script.run.withSuccessHandler(value=>finish(resolve,value)).withFailureHandler(e=>finish(reject,Error(e.message||String(e))));if(arg===undefined)r[name]();else r[name](arg);}catch(e){finish(reject,e);}
 });
 async function act(fn,target=status){
  if(busy){msg('Permintaan cloud lain masih berjalan. Tunggu hingga selesai; jika belum ada balasan, pesan batas waktu akan muncul dalam 60 detik.',target);return;}
  busy=true;msg('⏳ Sedang memproses permintaan. Tunggu konfirmasi dari Google…',target);
  const button=target===db?get('cpl-db-save'):null,oldLabel=button?.textContent;
  if(button){button.disabled=true;button.textContent='⏳ Memproses…';}
  try{await fn();}catch(e){msg('Gagal: '+e.message,target);}finally{busy=false;if(button){button.disabled=false;button.textContent=oldLabel;}}
 }
 // A tab must retain its own baseline; another tab's save must not advance it.
 const read=key=>{try{return JSON.parse(sessionStorage.getItem(scope+key)||'null');}catch{return null;}};
 const remember=(key,value)=>sessionStorage.setItem(scope+key,JSON.stringify(value));
 function datasets(){const data={};for(const k of KEYS){const v=localStorage.getItem(k);if(v!==null){JSON.parse(v);data[k]=v;}}return data;}
 function validateBundle(data){if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!KEYS.includes(k)))throw Error('Bundle tidak valid');for(const v of Object.values(data)){if(typeof v!=='string')throw Error('Dataset harus JSON string');JSON.parse(v);}}
 function apply(data){validateBundle(data);const before=KEYS.map(k=>[k,localStorage.getItem(k)]);try{for(const k of KEYS){if(Object.hasOwn(data,k))localStorage.setItem(k,data[k]);else localStorage.removeItem(k);}}catch(e){for(const [k,v] of before){try{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);}catch{}}throw Error('Penyimpanan lokal gagal. Pulihkan dari ekspor lokal; jangan lanjut scoring sebelum diperiksa.');}}
 function exportBundle(){const blob=new Blob([JSON.stringify({schema:'CPL_LOCAL_TRANSFER_1',exportedAt:new Date().toISOString(),datasets:datasets()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cpl-transfer-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 get('cpl-cloud-launch').onclick=()=>{panel.classList.add('open');msg(cloud?'Workspace cloud. Periksa koneksi, lalu ambil snapshot sebelum mengedit data bersama.':'Mode lokal GitHub Pages/file. Ekspor bundle, lalu buka workspace cloud. Data tiap alamat browser terpisah.');};
 get('cpl-cloud-close').onclick=()=>panel.classList.remove('open');
 get('cpl-cloud-ping').onclick=()=>act(async()=>{const r=await run('ping');msg('Terhubung sebagai '+r.user+'\nRevisi server '+r.revision+'\nIni hanya pemeriksaan koneksi; belum ada data yang disimpan.');});
 get('cpl-cloud-load').onclick=()=>act(async()=>{
  if(!confirm('Ekspor bundle lokal dahulu. Ambil snapshot akan mengganti seluruh dataset lokal. Lanjutkan?'))return;
  const r=await run('loadCloud');apply(r.datasets);remember('snapshotRevision',r.revision);reloadApp();
 });
 get('cpl-cloud-save').onclick=()=>act(async()=>{
  let revision=read('snapshotRevision');
  if(revision===null){const r=await run('ping');if(r.revision!==0)throw Error('Ambil snapshot cloud dahulu. Periksa koneksi tidak menetapkan revisi dasar.');revision=0;}
  if(!confirm('Simpan seluruh snapshot lokal ke cloud? Untuk indeks pertandingan gunakan Simpan pertandingan juga.'))return;
  const r=await run('saveCloud',{datasets:datasets(),baseRevision:revision});remember('snapshotRevision',r.revision);msg('Snapshot tersimpan, revisi '+r.revision+'\nBackup Drive: '+r.backupName);
 });
 const toolbar=document.createElement('div');toolbar.innerHTML='<button id="cpl-export-bundle">Ekspor bundle lengkap</button><button id="cpl-import-bundle">Impor bundle lengkap</button><input type="file" accept="application/json,.json" id="cpl-bundle-file" hidden><a id="cpl-open-workspace" target="_blank" rel="noopener noreferrer">Buka workspace cloud</a>';
 get('cpl-cloud-box').appendChild(toolbar);
 get('cpl-export-bundle').onclick=()=>act(async()=>{exportBundle();msg('Ekspor berisi 13 dataset; video asli tidak disertakan. Simpan berkas pribadi.');});
 get('cpl-import-bundle').onclick=()=>get('cpl-bundle-file').click();
 get('cpl-bundle-file').onchange=()=>act(async()=>{const f=get('cpl-bundle-file').files[0];if(!f)return;if(f.size>8000000)throw Error('Maksimum 8 MB');const x=JSON.parse(await f.text());if(x.schema!=='CPL_LOCAL_TRANSFER_1')throw Error('Format bundle tidak dikenal');validateBundle(x.datasets);if(!confirm('Bundle akan mengganti data lokal. Ekspor data lama dahulu. Lanjutkan?'))return;apply(x.datasets);reloadApp();});
 const url=window.CPL_CONFIG?.cloudAppUrl||'';const link=get('cpl-open-workspace');
 if(/^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url)){link.href=url;}else{link.removeAttribute('href');link.textContent='Workspace cloud belum dikonfigurasi di config.js';}
 window.cplDbRemoteMatches=[];
 get('cpl-db-save').onclick=()=>act(async()=>{
  if(typeof match==='undefined'||!match)throw Error('Buat pertandingan dahulu');const revs=read('matchRevisions')||{},id=String(match.id);
  const r=await run('dbSaveMatch',{match:JSON.parse(JSON.stringify(match)),baseRevision:revs[id]??0});if(!r.ok)throw Error('Server tidak mengonfirmasi');revs[id]=r.revision;remember('matchRevisions',revs);
  msg('Pertandingan tersimpan: '+r.id+'\nRevisi '+r.revision+' • '+r.deliveries+' delivery\nBackup Drive dibuat. Snapshot lengkap memakai tombol terpisah.',db);
 },db);
 get('cpl-db-history').onclick=()=>act(async()=>{const r=await run('dbLoadOpponentHistory',get('cpl-db-team').value.trim());window.cplDbRemoteMatches=r.matches;msg('Histori cloud: '+r.count+' dari '+r.total+(r.truncated?' (60 terbaru; hasil dibatasi)':'')+'\nPilih mode Riwayat/Gabungan.',db);document.dispatchEvent(new Event('cpl-opponent-db-loaded'));},db);
 const loadTools=document.createElement('div');loadTools.innerHTML='<button id="cpl-list-cloud">Daftar pertandingan cloud</button><select id="cpl-cloud-matches" aria-label="Pertandingan cloud"></select><button id="cpl-load-match">Muat pertandingan terpilih</button>';
 get('cpl-db-panel').appendChild(loadTools);
 get('cpl-list-cloud').onclick=()=>act(async()=>{const r=await run('dbListMatches'),select=get('cpl-cloud-matches');select.replaceChildren();for(const m of r.matches){const o=document.createElement('option');o.value=m.id;o.textContent=m.teams.join(' vs ')+' • '+m.id+' • r'+m.revision;select.appendChild(o);}msg(r.matches.length+' pertandingan ditemukan',db);},db);
 get('cpl-load-match').onclick=()=>act(async()=>{const id=get('cpl-cloud-matches').value;if(!id)throw Error('Pilih pertandingan');if(!confirm('Ekspor bundle dahulu. Pertandingan aktif akan diganti; undo/redo dikosongkan.'))return;const r=await run('dbLoadMatch',id);localStorage.setItem('cpl_t20_v11',JSON.stringify({match:r.match,undo:[],redo:[]}));const revs=read('matchRevisions')||{};revs[id]=r.revision;remember('matchRevisions',revs);match=r.match;undo=[];redo=[];render();msg('Pertandingan dimuat dari cloud: '+id+' • revisi '+r.revision,db);},db);
 msg(cloud?'Cloud tersedia; belum diperiksa.':'Mode lokal. Simpan cloud memerlukan workspace Apps Script.',db);
})();
