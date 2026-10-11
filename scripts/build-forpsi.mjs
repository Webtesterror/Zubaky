import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const output=path.resolve('dist/forpsi'),pub=path.join(output,'www'),app=path.join(output,'zuby-app');
for(const dir of [pub,app,'forpsi/vendor/PHPMailer'])fs.mkdirSync(dir,{recursive:true});
const dependencies={
 'src/PHPMailer.php':'45599a196ae7944ee2dcd4f3d3da0ac4243513d346b2d77bbd15dbd0c37f7064',
 'src/SMTP.php':'522bcf0d07be7e7e00114711db5c9ce2b4d59ac041c5ec36eaadd979d5fa7046',
 'src/Exception.php':'22ab858ae438d98f58f41f38ad2191d1b0d59570aebea0463a7948cfae1021b7',
 'LICENSE':'a1a33180d02960ab1c5de36cf20b1a2f0fe9888d83826ad263da5db52f1b183b',
};
for(const [name,sha] of Object.entries(dependencies)){
 const target=path.join('forpsi/vendor/PHPMailer',path.basename(name));
 let bytes=fs.existsSync(target)?fs.readFileSync(target):null;
 if(!bytes){const r=await fetch('https://raw.githubusercontent.com/PHPMailer/PHPMailer/v7.1.1/'+name);if(!r.ok)throw Error('PHPMailer download failed: '+r.status);bytes=Buffer.from(await r.arrayBuffer())}
 if(createHash('sha256').update(bytes).digest('hex')!==sha)throw Error('PHPMailer checksum mismatch: '+name);
 fs.writeFileSync(target,bytes);
}
const bin=process.platform==='win32'?path.resolve('node_modules/@esbuild/win32-x64/esbuild.exe'):path.resolve('node_modules/.bin/esbuild');
const result=spawnSync(bin,['worker/client.tsx','--bundle','--format=esm','--jsx=automatic','--target=es2022','--minify','--platform=browser','--define:process.env.NODE_ENV="production"','--outfile='+path.join(pub,'client.js')],{stdio:'inherit'});
if(result.error)throw result.error;if(result.status)process.exit(result.status);
fs.cpSync('public',pub,{recursive:true});fs.cpSync('forpsi/public',pub,{recursive:true});
fs.writeFileSync(path.join(pub,'style.css'),fs.readFileSync('app/globals.css','utf8').replace('@import "tailwindcss";',''));
// Explicit allowlist: private configuration, credentials and live data are never part of a build.
for(const name of ['app.php','auth.php','storage.php','mail.php','validation.php','render.php','config.example.php'])fs.copyFileSync('forpsi/'+name,path.join(app,name));
fs.cpSync('forpsi/bin',path.join(app,'bin'),{recursive:true});fs.cpSync('forpsi/vendor',path.join(app,'vendor'),{recursive:true});
fs.copyFileSync('lib/seed.json',path.join(app,'seed.json'));fs.copyFileSync('lib/english.json',path.join(app,'english.json'));
console.log('FORPSI: dist/forpsi/www + dist/forpsi/zuby-app (PHP 8.2+, bez Node na serveru).');
console.log('Soukromý config.php a zuby-data se při sestavení ani nasazení nepřepisují.');
