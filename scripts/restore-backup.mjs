import fs from 'node:fs';
const [input,output]=process.argv.slice(2);
if(!input||!output){console.error('Usage: node scripts/restore-backup.mjs INPUT.json NEW-OUTPUT.json');process.exit(1);}
const doc=JSON.parse(fs.readFileSync(input,'utf8'));let result;
if(doc.schema==='CPL_SNAPSHOT_1'&&doc.datasets&&typeof doc.datasets==='object'&&!Array.isArray(doc.datasets)){
 for(const v of Object.values(doc.datasets)){if(typeof v!=='string')throw Error('Dataset must be JSON string');JSON.parse(v);}
 result={schema:'CPL_LOCAL_TRANSFER_1',exportedAt:new Date().toISOString(),datasets:doc.datasets};
}else if(doc.schema==='CPL_MATCH_1'&&doc.match?.teams&&doc.match?.innings){result={format:'CPL_T20_V2',match:doc.match};}
else throw Error('Unsupported backup schema');
fs.writeFileSync(output,JSON.stringify(result,null,2),{flag:'wx'});
console.log('Created recovery import. Review it before importing; no service was contacted.');
