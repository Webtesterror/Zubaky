import fs from 'node:fs';
import path from 'node:path';
const dir=path.resolve('.local-forpsi/data/mail');
if(!fs.existsSync(dir)){console.log('Místní testovací schránka je prázdná.');process.exit(0)}
const files=fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>({file:path.join(dir,n),time:fs.statSync(path.join(dir,n)).mtimeMs})).sort((a,b)=>b.time-a.time);
for(const {file} of files.slice(0,5)){
 const m=JSON.parse(fs.readFileSync(file,'utf8'));
 console.log(`${new Date(m.time*1000).toLocaleString('cs-CZ')} | ${m.subject}\n${m.body}\n`);
}
