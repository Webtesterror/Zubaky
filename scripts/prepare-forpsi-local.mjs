import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
const base=path.resolve('.local-forpsi'),data=path.join(base,'data');
fs.mkdirSync(data,{recursive:true});fs.mkdirSync(path.join(data,'media'),{recursive:true});
if(!fs.existsSync(path.join(data,'content.json'))&&fs.existsSync('.local-data/content.sqlite')){
 const db=new DatabaseSync('.local-data/content.sqlite',{readOnly:true});
 const seed=JSON.parse(fs.readFileSync('lib/seed.json','utf8'));
 const read=id=>{const row=db.prepare('SELECT body FROM content WHERE id=?').get(id);return row?{announcement:'',...JSON.parse(row.body)}:structuredClone(seed)};
 const state={draft:read('draft'),published:read('published'),revision:0};db.close();
 fs.writeFileSync(path.join(data,'content.json'),JSON.stringify(state),{flag:'wx'});
 if(fs.existsSync('.local-data/media'))for(const name of fs.readdirSync('.local-data/media'))if(/^[a-f0-9-]+\.(jpg|png|webp)$/.test(name))fs.copyFileSync(path.join('.local-data/media',name),path.join(data,'media',name));
 console.log('Dosavadní místní obsah a fotografie byly zkopírovány; původní databáze zůstala zachována.');
}
if(!fs.existsSync(path.join(base,'production-config.php')))throw Error('Nejprve spusťte forpsi/bin/setup.php s --config=.local-forpsi/production-config.php --credentials=.local-forpsi/PRISTUPY.txt');
if(!fs.existsSync(path.join(base,'local-config.php'))){
 const phpPath=JSON.stringify(base.replaceAll('\\','/'));
 fs.writeFileSync(path.join(base,'local-config.php'),`<?php\n$c = require __DIR__ . '/production-config.php';\n$c['origin'] = 'http://127.0.0.1:5173';\n$c['data_dir'] = ${phpPath} . '/data';\n$c['local_test'] = true;\nreturn $c;\n`);
}
console.log('Místní konfigurace připravena. SMTP je v tomto náhledu nahrazeno soukromou testovací schránkou.');
