import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const bin=process.platform==='win32'?path.resolve('node_modules/@esbuild/win32-x64/esbuild.exe'):path.resolve('node_modules/.bin/esbuild');
function run(args){const r=spawnSync(bin,args,{stdio:'inherit'});if(r.error)throw r.error;if(r.status)process.exit(r.status)}
const common=['--bundle','--format=esm','--jsx=automatic','--target=es2022','--define:process.env.NODE_ENV="production"'];
fs.mkdirSync('dist/client',{recursive:true});fs.mkdirSync('netlify/functions',{recursive:true});
run(['worker/client.tsx',...common,'--minify','--platform=browser','--outfile=dist/client/client.js']);
run(['netlify/server.tsx',...common,'--platform=node','--external:@netlify/blobs','--banner:js=import { createRequire } from "node:module"; const require = createRequire(import.meta.url);','--outfile=netlify/functions/web.mjs']);
fs.cpSync('public','dist/client',{recursive:true});
fs.writeFileSync('dist/client/style.css',fs.readFileSync('app/globals.css','utf8').replace('@import "tailwindcss";',''));
console.log('Netlify: klient a server s administrací sestaveny.');
