import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
const root=process.cwd(),dataRoot=path.resolve(process.env.ZUBY_DATA_DIR||'.local-data');
fs.mkdirSync(dataRoot,{recursive:true});fs.mkdirSync(path.join(dataRoot,'media'),{recursive:true});
const secretFile=path.join(dataRoot,'setup-code');
if(!fs.existsSync(secretFile))fs.writeFileSync(secretFile,crypto.randomBytes(24).toString('base64url'));
const code=fs.readFileSync(secretFile,'utf8').trim();
const sqlite=new DatabaseSync(path.join(dataRoot,'content.sqlite'));sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON');
sqlite.exec('CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY); CREATE TABLE IF NOT EXISTS local_sessions(hash TEXT PRIMARY KEY,expires INTEGER NOT NULL);');
for(const name of fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort()){if(!sqlite.prepare('SELECT name FROM local_migrations WHERE name=?').get(name)){sqlite.exec('BEGIN');try{sqlite.exec(fs.readFileSync(path.join('drizzle',name),'utf8'));sqlite.prepare('INSERT INTO local_migrations(name) VALUES (?)').run(name);sqlite.exec('COMMIT')}catch(e){sqlite.exec('ROLLBACK');throw e}}}
class Statement{constructor(sql,args=[]){this.sql=sql;this.args=args}bind(...args){return new Statement(this.sql,args)}async first(){return sqlite.prepare(this.sql).get(...this.args)||null}async run(){const r=sqlite.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes)}}}async all(){return {results:sqlite.prepare(this.sql).all(...this.args),success:true}}}
const DB={prepare:sql=>new Statement(sql),async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const BUCKET={async put(key,bytes,options){fs.writeFileSync(path.join(dataRoot,'media',key),bytes);fs.writeFileSync(path.join(dataRoot,'media',key+'.json'),JSON.stringify(options))},async get(key){const f=path.join(dataRoot,'media',key);if(!fs.existsSync(f))return null;return {body:fs.readFileSync(f),...JSON.parse(fs.readFileSync(f+'.json'))}}};
globalThis.__localBindings={DB,BUCKET,ADMIN_SETUP_CODE:code};
const {default:worker}=await import(pathToFileURL(path.join(root,'.sites-runtime/local-worker.mjs')).href);
const mime={'.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ttf':'font/ttf','.woff2':'font/woff2','.pdf':'application/pdf'};
const ASSETS={async fetch(req){let p;try{p=decodeURIComponent(new URL(req.url).pathname)}catch{return new Response('Nenalezeno',{status:404})}const dir=path.join(root,'dist/client'),f=path.resolve(dir,'.'+p);if(!f.startsWith(dir+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile())return new Response('Nenalezeno',{status:404});return new Response(fs.readFileSync(f),{headers:{'Content-Type':mime[path.extname(f)]||'application/octet-stream','X-Content-Type-Options':'nosniff'}})}};
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const port=Number(process.env.PORT||5173);
const origin=`http://127.0.0.1:${port}`;
const server=http.createServer(async(incoming,out)=>{try{
 if(incoming.headers.host!==`127.0.0.1:${port}`){out.writeHead(403);out.end('Neplatný host');return}
 const url=new URL(incoming.url,origin);const chunks=[];let size=0;for await(const chunk of incoming){size+=chunk.length;if(size>5500000){out.writeHead(413);out.end('Soubor je příliš velký');return}chunks.push(chunk)}const body=Buffer.concat(chunks);
 if(url.pathname==='/signin-with-chatgpt'){
 if(incoming.method==='POST'){
 if(incoming.headers.origin!==origin){out.writeHead(403);out.end('Neplatný původ');return}
 const supplied=(new URLSearchParams(body.toString()).get('code')||'').trim();if(supplied.length!==code.length||!crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(code))){out.writeHead(403,{'Content-Type':'text/html;charset=utf-8'});out.end('<p>Nesprávný kód.</p><a href="/signin-with-chatgpt">Zkusit znovu</a>');return}
 const token=crypto.randomBytes(32).toString('base64url');sqlite.prepare('INSERT INTO local_sessions(hash,expires) VALUES (?,?)').run(hash(token),Date.now()+86400000);out.writeHead(303,{'Location':'/admin','Set-Cookie':`zuby_local=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`});out.end();return}
 out.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'});out.end('<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><main class="login"><h1>Místní přihlášení</h1><p>Zadejte přístupový kód z předaného návodu. Tento náhled běží pouze na vašem počítači.</p><form method="post" class="form-grid"><label class="field">Přístupový kód<input name="code" type="password" required></label><button class="primary">Přihlásit se</button></form></main></html>');return}
 if(url.pathname==='/signout-with-chatgpt'){const token=incoming.headers.cookie?.match(/(?:^|; )zuby_local=([^;]+)/)?.[1];if(token)sqlite.prepare('DELETE FROM local_sessions WHERE hash=?').run(hash(token));out.writeHead(303,{'Location':'/','Set-Cookie':'zuby_local=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});out.end();return}
 const headers=new Headers();for(const [key,value] of Object.entries(incoming.headers)){if(!key.startsWith('oai-authenticated-user-')&&value)headers.set(key,Array.isArray(value)?value.join(','):value)}
 const token=incoming.headers.cookie?.match(/(?:^|; )zuby_local=([^;]+)/)?.[1];if(token&&sqlite.prepare('SELECT hash FROM local_sessions WHERE hash=? AND expires>?').get(hash(token),Date.now())){headers.set('oai-authenticated-user-id','local-owner');headers.set('oai-authenticated-user-email','spravce@localhost')}
 const request=new Request(url,{method:incoming.method,headers,...(body.length?{body}:{} )});const response=await worker.fetch(request,{ASSETS});out.writeHead(response.status,Object.fromEntries(response.headers));out.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){console.error(e);out.writeHead(500);out.end('Chyba místního serveru')}});
server.listen(port,'127.0.0.1',()=>console.log(`Local: ${origin}`));
