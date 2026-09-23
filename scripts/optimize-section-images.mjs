// Run manually after replacing source photographs; originals remain untouched.
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const seed=JSON.parse(fs.readFileSync('lib/seed.json','utf8'));
const manifest={};
fs.mkdirSync('public/optimized',{recursive:true});
for(const src of new Set([...seed.photos,...seed.team].map(p=>p.src).filter(Boolean))){
 const input=fs.readFileSync('public'+src), meta=await sharp(input).metadata();
 const variants=[];
 for(const width of [480,960,1440].filter(w=>w<=meta.width)){
  const bytes=await sharp(input).rotate().resize({width,withoutEnlargement:true}).webp({quality:82}).toBuffer();
  const hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16);
  const url=`/optimized/${hash}-${width}.webp`;
  fs.writeFileSync('public'+url,bytes);variants.push({src:url,width});
 }
 manifest[src]={width:meta.width,height:meta.height,variants};
}
fs.writeFileSync('lib/image-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Responsive section photographs generated; source files preserved.');
