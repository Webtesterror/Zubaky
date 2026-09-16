import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const bin=process.platform==='win32'?path.resolve('node_modules/@esbuild/win32-x64/esbuild.exe'):path.resolve('node_modules/.bin/esbuild');
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/client',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
const common=['--bundle','--format=esm','--jsx=automatic','--target=es2022','--define:process.env.NODE_ENV="production"'];
function run(args){const r=spawnSync(bin,args,{stdio:'inherit'});if(r.error)throw r.error;if(r.status)process.exit(r.status)}
run(['worker/client.tsx',...common,'--minify','--outfile=dist/client/client.js','--platform=browser']);
const server=['worker/index.tsx',...common,'--platform=browser','--conditions=workerd,worker','--external:node:*','--alias:next/headers=./worker/request-context.ts','--alias:next/navigation=./worker/navigation.ts'];
run([...server,'--external:cloudflare:workers','--outfile=dist/server/index.js']);
run([...server,'--alias:cloudflare:workers=./worker/local-bindings.ts','--outfile=.sites-runtime/local-worker.mjs']);
fs.cpSync('public','dist/client',{recursive:true});
fs.writeFileSync('dist/client/style.css',fs.readFileSync('app/globals.css','utf8').replace('@import "tailwindcss";',''));
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});
fs.writeFileSync('dist/server/wrangler.json',JSON.stringify({name:'zuby-dasne',main:'index.js',compatibility_date:'2026-05-15',compatibility_flags:['nodejs_compat'],assets:{directory:'../client',binding:'ASSETS',run_worker_first:true},d1_databases:[{binding:'DB',database_name:'zuby-dasne',database_id:'00000000-0000-4000-8000-000000000000'}],r2_buckets:[{binding:'BUCKET',bucket_name:'zuby-dasne-media'}]},null,2));
console.log('Web, server a místní náhled byly sestaveny.');
