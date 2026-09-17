import assert from 'node:assert/strict';
import {createHandler,config} from '../netlify/functions/web.mjs';
import {getStore} from '@netlify/blobs';
import {BlobsServer} from '@netlify/blobs/server';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';

// Use Netlify's actual SDK and local Blobs server, with isolated temporary data.
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'zuby-netlify-test-'));
const token=randomBytes(32).toString('hex');
let server=new BlobsServer({directory,token});
let address=await server.start();
const store=name=>getStore({name,siteID:'zuby-test',token,apiURL:`http://127.0.0.1:${address.port}`,consistency:'strong'});
const stores=()=>({content:store('content'),media:store('media')});
let handler=createHandler(stores);
const origin='https://example.netlify.app';let cookie='';
const request=(url,method='GET',body,auth=true,extra={})=>{
 const pathname=new URL(origin+url).pathname;
 assert.ok(config.path.some(route=>route.endsWith('*')?pathname.startsWith(route.slice(0,-1)):pathname===route),`Netlify must route ${pathname} to the function`);
 return handler(new Request(origin+url,{method,headers:{...(auth?{cookie}:{}),...(method!=='GET'?{Origin:origin}:{}),...extra},...(body!==undefined?{body}:{})}));
};
try{
 delete process.env.ADMIN_PASSWORD;
 assert.equal((await request('/admin/login')).status,503);
 process.env.ADMIN_PASSWORD=randomBytes(32).toString('hex');
 assert.equal((await request('/admin')).status,303);
 assert.equal((await request('/admin/')).status,303);
 const loginPage=await request('/admin/login/');assert.equal(loginPage.status,200);assert.match(await loginPage.text(),/action="\/admin\/login"/);
 assert.equal((await request('/api/content','GET',undefined,false,{'oai-authenticated-user-id':'owner'})).status,403);
 assert.equal((await request('/admin/login','POST','password=wrong')).status,403);
 assert.equal((await request('/admin/login','POST','password='+process.env.ADMIN_PASSWORD,true,{Origin:'https://evil.example'})).status,403);
 const login=await request('/admin/login','POST','password='+process.env.ADMIN_PASSWORD);
 cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Strict/);
 assert.equal((await request('/admin')).status,200);
 assert.equal((await request('/admin/')).status,200);
 let {data,revision}=await (await request('/api/content')).json();
 const original=await (await request('/')).text();assert.match(original,/bootstrap/);
 data.team[0].name='Test přetrvání';data.team[0].hidden=true;data.priceNote='Nová poznámka testu';
 assert.equal((await request('/api/content','PUT',JSON.stringify({data,revision}))).status,200);
 assert.ok(!(await (await request('/')).text()).includes('Nová poznámka testu'));
 await server.stop();server=new BlobsServer({directory,token});address=await server.start();
 handler=createHandler(stores); // Restart storage and handler, preserving disk contents.
 let draft=await (await request('/api/content')).json();assert.equal(draft.data.priceNote,'Nová poznámka testu');
 assert.equal((await request('/api/content','PUT',JSON.stringify({data,revision,publish:true}))).status,409);
 assert.equal((await request('/api/content','PUT',JSON.stringify({data,revision:draft.revision,publish:true}))).status,200);
 const page=await (await request('/')).text();assert.ok(page.includes('Nová poznámka testu'));assert.ok(!page.includes('Test přetrvání'));
 const form=new FormData();form.set('file',new File([fs.readFileSync('public/recepce-logo.webp')],'photo.webp',{type:'image/webp'}));
 assert.equal((await request('/api/upload','POST',form,false)).status,403);
 const uploaded=await request('/api/upload','POST',form);assert.equal(uploaded.status,200);const {src}=await uploaded.json();
 await server.stop();server=new BlobsServer({directory,token});address=await server.start();
 handler=createHandler(stores);const photo=await request(src);assert.equal(photo.status,200);assert.equal(photo.headers.get('content-type'),'image/webp');
 assert.deepEqual(Buffer.from(await photo.arrayBuffer()),fs.readFileSync('public/recepce-logo.webp'));
 assert.ok((await (await request('/')).text()).includes('Nová poznámka testu'),'published content survives storage restart');
 const invalid=new FormData();invalid.set('file',new File(['this is not a photo'],'fake.png',{type:'image/png'}));assert.equal((await request('/api/upload','POST',invalid)).status,400);
 assert.equal((await request('/api/content','PUT',JSON.stringify({data,revision:2}),false)).status,403);
 assert.match((await request('/signout-with-chatgpt')).headers.get('set-cookie'),/Max-Age=0/);
 process.env.ADMIN_PASSWORD=randomBytes(32).toString('hex');assert.equal((await request('/api/content')).status,403);
 console.log('PASS: deployed route coverage, login, forged headers, origin, permissions, drafts, publish, revision conflict, hidden profile, upload, actual Blobs SDK/storage restarts, logout and password rotation.');
}finally{
 await server.stop();
 assert.equal(path.dirname(path.resolve(directory)),path.resolve(os.tmpdir()));
 assert.ok(path.basename(directory).startsWith('zuby-netlify-test-'));
 fs.rmSync(directory,{recursive:true,force:true});delete process.env.ADMIN_PASSWORD;
}
