import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const original=read('reference/v6.4-popup-original.html');
let html=original;
for(const id of ['cpl-cloud-bridge','cpl-opponent-db-v64']){
 const pattern=new RegExp('<script id="'+id+'">[\\s\\S]*?</script>');
 if(!pattern.test(html))throw Error('Source block missing: '+id);
 html=html.replace(pattern,'<!-- '+id+': replaced by repository bridge -->');
}
html=html.replace('Server dapat menolak data lebih dari 8 MB atau dataset melebihi 49.000 karakter.','Snapshot lengkap maksimum 8 MB disimpan sebagai JSON di Drive; indeks pertandingan berada di Sheets.');
const config=read('config.js'),bridge=read('scripts/client-bridge.js');
html=html.replace('</body>','<script id="cpl-repository-config">'+config+'</script><script id="cpl-repository-bridge">'+bridge+'</script></body>');
fs.writeFileSync(new URL('index.html',root),html);
fs.writeFileSync(new URL('backend/App.html',root),html);
const scripts=[...original.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
const manifest={source:'Downloaded local V6.4 Popup Edition file; chat API exposed no attachments',file:'reference/v6.4-popup-original.html',sha256:crypto.createHash('sha256').update(fs.readFileSync(new URL('reference/v6.4-popup-original.html',root))).digest('hex'),scriptBlocks:scripts.length,replacedScriptIds:['cpl-cloud-bridge','cpl-opponent-db-v64'],preservedOtherScriptBlocks:scripts.length-2,generated:['index.html','backend/App.html']};
fs.writeFileSync(new URL('docs/source-manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
console.log('Built index.html and backend/App.html from inspected V6.4 source');
