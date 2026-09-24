import React from 'react';
import {renderToString} from 'react-dom/server';
import {createHmac,randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {getStore} from '@netlify/blobs';
import Reception from '../app/reception';
import AdminEditor from '../app/admin/editor';
import seed from '../lib/seed.json';
import {contentSchema} from '../lib/validation';
import type {Content} from '../lib/content';
import {readPreferences,pageTitle,pageDescription,type Locale} from '../lib/preferences';

type State={draft:Content,published:Content,revision:number};
const cookieName='__Host-zuby_admin';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers});
const password=()=>process.env.ADMIN_PASSWORD||'';
const secret=()=>password().length>=24?password():null;
const digest=(s:string)=>createHash('sha256').update(s).digest();
const equal=(a:string,b:string)=>timingSafeEqual(digest(a),digest(b));
const sign=(s:string)=>createHmac('sha256',secret()!).update(s).digest('base64url');
function allowed(req:Request){
 if(!secret())return false;
 const token=req.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
 const [expiry,nonce,signature,...rest]=token.split('.');
 return rest.length===0&&!!nonce&&!!signature&&Number(expiry)>Date.now()&&Number(expiry)<=Date.now()+28800000&&equal(signature,sign(expiry+'.'+nonce));
}
function document(body:string,bootstrap:unknown,status=200,locale:Locale='cs'){
 return new Response(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${pageTitle(locale)}</title><meta name="description" content="${pageDescription(locale)}">${(bootstrap as {page?:string}).page==='home'?'<link rel="alternate" hreflang="cs" href="/?lang=cs"><link rel="alternate" hreflang="en" href="/?lang=en"><link rel="alternate" hreflang="x-default" href="/">':''}<link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/style.css">${(bootstrap as {page?:string}).page==='home'?'<link rel="preload" as="image" href="/recepce-fotografie-2k.webp" media="(max-width: 1000px)">':''}</head><body><div id="root">${body}</div><script id="bootstrap" type="application/json">${JSON.stringify(bootstrap).replace(/</g,'\\u003c')}</script><script type="module" src="/client.js"></script></body></html>`,{status,headers:{...headers,'Content-Type':'text/html;charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-src https://www.google.com https://maps.google.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self'"}});
}
function login(message='',status=200){return document(`<main class="login"><h1>Přihlášení do správy</h1><p>${message||'Zadejte heslo správce webu.'}</p><form method="post" action="/admin/login" class="form-grid"><label class="field">Heslo správce<input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button class="primary">Přihlásit se</button></form><a href="/">Zpět na web</a></main>`,{page:'none'},status)}
const redirect=(location:string,cookie?:string)=>new Response(null,{status:303,headers:{...headers,Location:location,...(cookie?{'Set-Cookie':cookie}:{})}});

// Site-wide stores survive deployment. One CAS write makes draft + publish atomic.
export function createHandler(stores=()=>({content:getStore({name:'zuby-content',consistency:'strong'}),media:getStore({name:'zuby-media',consistency:'strong'})})){
 return async function handler(req:Request):Promise<Response>{try{
 const path=new URL(req.url).pathname.replace(/\/+$/,'')||'/';
 if(!['GET','HEAD'].includes(req.method)&&req.headers.get('origin')!==new URL(req.url).origin)return json({error:'Neplatný původ požadavku.'},403);
 if(path==='/admin/login'||path==='/signin-with-chatgpt'){
  if(!secret())return login('V Netlify nastavte proměnnou ADMIN_PASSWORD na heslo o alespoň 24 znacích a proveďte nové nasazení.',503);
  if(req.method==='POST'){
   const raw=await req.text();if(raw.length>2048)return login('Neplatné heslo.',403);
   if(!equal(new URLSearchParams(raw).get('password')||'',password()))return login('Nesprávné heslo.',403);
   const value=(Date.now()+28800000)+'.'+randomBytes(24).toString('base64url');
   return redirect('/admin',`${cookieName}=${value}.${sign(value)}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800`);
  }
  return login();
 }
 if(path==='/signout-with-chatgpt')return redirect('/',`${cookieName}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`);
 if(path==='/admin')return allowed(req)?document(renderToString(<AdminEditor/>),{page:'editor'}):redirect('/admin/login');
 if(path.startsWith('/api/')&&!path.startsWith('/api/media/')&&!allowed(req))return json({error:'Přihlaste se jako správce.'},403);
 const {content,media}=stores();
 if(path==='/api/content'||path==='/'){
  const record=await content.getWithMetadata('state',{type:'json'});
  const state:State=record?.data??{draft:structuredClone(seed),published:structuredClone(seed),revision:0};
  state.draft.announcement??='';state.published.announcement??='';
  if(path==='/'&&(req.method==='GET'||req.method==='HEAD')){const data=structuredClone(state.published);data.team=data.team.filter(p=>!p.hidden);const prefs=readPreferences(req.url,req.headers.get('cookie')||'');return document(renderToString(<Reception data={data} initialLocale={prefs.locale} initialConsent={prefs.consent}/>),{page:'home',data,...prefs},200,prefs.locale)}
  if(path==='/api/content'&&req.method==='GET')return json({data:state.draft,revision:state.revision});
  if(path==='/api/content'&&req.method==='PUT'){
   const raw=await req.text();if(raw.length>1500000)return json({error:'Obsah je příliš velký.'},413);
   const input=JSON.parse(raw);const data=contentSchema.parse(input.data);
   if(input.revision!==state.revision)return json({error:'Obsah mezitím změnil jiný editor. Obnovte administraci.'},409);
   const next={draft:data,published:input.publish===true?data:state.published,revision:state.revision+1};
   const result=await content.setJSON('state',next,record?{onlyIfMatch:record.etag}:{onlyIfNew:true});
   if(!result.modified)return json({error:'Obsah mezitím změnil jiný editor. Obnovte administraci.'},409);
   return json({revision:next.revision,message:input.publish===true?'Změny byly zveřejněny.':'Koncept byl uložen.'});
  }
 }
 if(path==='/api/upload'&&req.method==='POST'){
  if(Number(req.headers.get('content-length'))>4200000)return json({error:'Maximální velikost je 4 MB.'},413);
  const form=await req.formData(),file=form.get('file');
  if(!(file instanceof File)||file.size>4000000||file.size<12)return json({error:'Nahrajte fotografii do 4 MB.'},400);
  const bytes=new Uint8Array(await file.arrayBuffer());
  const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const png=[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
  const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  const type=jpeg?'image/jpeg':png?'image/png':webp?'image/webp':null;
  if(!type||type!==file.type)return json({error:'Povoleny jsou skutečné obrázky JPG, PNG a WebP.'},400);
  const key=crypto.randomUUID()+'.'+(jpeg?'jpg':png?'png':'webp');
  await media.set(key,bytes.buffer,{metadata:{contentType:type}});
  return json({src:'/api/media/'+key});
 }
 if(path.startsWith('/api/media/')&&(req.method==='GET'||req.method==='HEAD')){
  const key=path.slice(11);if(!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(key))return new Response('Nenalezeno',{status:404});
  const file=await media.getWithMetadata(key,{type:'arrayBuffer'});if(!file)return new Response('Nenalezeno',{status:404});
  return new Response(file.data,{headers:{'Content-Type':String(file.metadata.contentType),'X-Content-Type-Options':'nosniff','Cache-Control':'public,max-age=31536000,immutable'}});
 }
 return json({error:'Nenalezeno'},404);
 }catch(e){console.error('Netlify request failed',e instanceof Error?e.name:'unknown');return json({error:'Požadavek se nepodařilo dokončit. Zkontrolujte údaje nebo zkuste akci později.'},503)}};
}
export default createHandler();
export const config={path:['/','/admin','/admin/*','/api/*','/signin-with-chatgpt','/signout-with-chatgpt'],rateLimit:{windowLimit:120,windowSize:60,aggregateBy:['ip','domain']}};
