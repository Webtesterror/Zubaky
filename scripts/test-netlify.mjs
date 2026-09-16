import assert from 'node:assert/strict';
import {createHandler} from '../netlify/functions/web.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';

// Persistent test double exercises the Blobs CAS contract without production credentials.
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'zuby-netlify-test-'));
function store(name){return {
 async getWithMetadata(key){const file=path.join(directory,name+encodeURIComponent(key));if(!fs.existsSync(file))return null;const r=JSON.parse(fs.readFileSync(file));if(r.binary)r.data=Uint8Array.from(r.data).buffer;return r},
 async setJSON(key,data,options={}){return this.set(key,JSON.stringify(data),{...options,json:true})},
 async set(key,data,options={}){const old=await this.getWithMetadata(key);if(options.onlyIfNew&&old||options.onlyIfMatch&&old?.etag!==options.onlyIfMatch)return {modified:false};const binary=data instanceof ArrayBuffer;const r={data:binary?[...new Uint8Array(data)]:options.json?JSON.parse(data):data,binary,metadata:options.metadata||{},etag:randomBytes(12).toString('hex')};fs.writeFileSync(path.join(directory,name+encodeURIComponent(key)),JSON.stringify(r));return {modified:true,etag:r.etag}}
}}
const stores=()=>({content:store('content'),media:store('media')});
let handler=createHandler(stores);
const origin='https://example.netlify.app';let cookie='';
const request=(url,method='GET',body,auth=true,extra={})=>handler(new Request(origin+url,{method,headers:{...(auth?{cookie}:{}),...(method!=='GET'?{Origin:origin}:{}),...extra},...(body!==undefined?{body}:{})}));
try{
 delete process.env.ADMIN_PASSWORD;
 assert.equal((await request('/admin/login')).status,503);
 process.env.ADMIN_PASSWORD=randomBytes(32).toString('hex');
 assert.equal((await request('/admin')).status,303);
 assert.equal((await request('/api/content','GET',undefined,false,{'oai-authenticated-user-id':'owner'})).status,403);
 assert.equal((await request('/admin/login','POST','password=wrong')).status,403);
 assert.equal((await request('/admin/login','POST','password='+process.env.ADMIN_PASSWORD,true,{Origin:'https://evil.example'})).status,403);
 const login=await request('/admin/login','POST','password='+process.env.ADMIN_PASSWORD);
 cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Strict/);
 assert.equal((await request('/admin')).status,200);
 let {data,revision}=await (await request('/api/content')).json();
 const original=await (await request('/')).text();assert.match(original,/bootstrap/);
 data.team[0].name='Test přetrvání';data.team[0].hidden=true;data.priceNote='Nová poznámka testu';
 assert.equal((await request('/api/content','PUT',JSON.stringify({data,revision}))).status,200);
 assert.ok(!(await (await request('/')).text()).includes('Nová poznámka testu'));
 handler=createHandler(stores); // Simulate a new process with persisted content.
 let draft=await (await request('/api/content')).json();assert.equal(draft.data.priceNote,'Nová poznámka testu');
 assert.equal((await request('/api/content','PUT',JSON.stringify({data,revision,publish:true}))).status,409);
 assert.equal((await request('/api/content','PUT',JSON.stringify({data,revision:draft.revision,publish:true}))).status,200);
 const page=await (await request('/')).text();assert.ok(page.includes('Nová poznámka testu'));assert.ok(!page.includes('Test přetrvání'));
 const form=new FormData();form.set('file',new File([fs.readFileSync('public/recepce-logo.webp')],'photo.webp',{type:'image/webp'}));
 assert.equal((await request('/api/upload','POST',form,false)).status,403);
 const uploaded=await request('/api/upload','POST',form);assert.equal(uploaded.status,200);const {src}=await uploaded.json();
 handler=createHandler(stores);const photo=await request(src);assert.equal(photo.status,200);assert.equal(photo.headers.get('content-type'),'image/webp');
 const invalid=new FormData();invalid.set('file',new File(['this is not a photo'],'fake.png',{type:'image/png'}));assert.equal((await request('/api/upload','POST',invalid)).status,400);
 assert.equal((await request('/api/content','PUT',JSON.stringify({data,revision:2}),false)).status,403);
 assert.match((await request('/signout-with-chatgpt')).headers.get('set-cookie'),/Max-Age=0/);
 process.env.ADMIN_PASSWORD=randomBytes(32).toString('hex');assert.equal((await request('/api/content')).status,403);
 console.log('PASS: login, forged headers, origin, permissions, drafts, publish, revision conflict, hidden profile, upload, persistence contract, logout and password rotation.');
}finally{fs.rmSync(directory,{recursive:true,force:true});delete process.env.ADMIN_PASSWORD}
