import React from 'react';
import {renderToString} from 'react-dom/server';
import Reception from '../app/reception';
import AdminEditor from '../app/admin/editor';
import Setup from '../app/admin/setup';
import {readContent} from '../lib/content';
import {adminStatus} from '../lib/admin';
import {requestContext} from './request-context';
import * as content from '../app/api/content/route';
import * as setup from '../app/api/setup/route';
import * as upload from '../app/api/upload/route';
import * as media from '../app/api/media/[key]/route';
type Bindings={ASSETS?:{fetch:(r:Request)=>Promise<Response>}};
function html(element:React.ReactNode,bootstrap:unknown,title='ZUBY | DÁSNĚ — stomatologické centrum v Hradci Králové'){
 const body=renderToString(element);const payload=JSON.stringify(bootstrap).replace(/</g,'\\u003c');
 return new Response(`<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="ZUBY | DÁSNĚ — informace o ordinaci, náš tým, průběh léčby, ceník a kontakt."><link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/style.css"><link rel="preload" href="/source/ISOCPEUR%20Regular.ttf" as="font" type="font/ttf" crossorigin></head><body><div id="root">${body}</div><script id="bootstrap" type="application/json">${payload}</script><script type="module" src="/client.js"></script></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; frame-src https://www.google.com https://maps.google.com; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com; base-uri 'self'; form-action 'self'"}});
}
export default {async fetch(req:Request,bindings:Bindings){return requestContext.run(req,async()=>{try{
 const path=new URL(req.url).pathname;
 if(path==='/api/content'&&req.method==='GET')return content.GET();
 if(path==='/api/content'&&req.method==='PUT')return content.PUT(req);
 if(path==='/api/setup'&&req.method==='POST')return setup.POST(req);
 if(path==='/api/upload'&&req.method==='POST')return upload.POST(req);
 if(path.startsWith('/api/media/')&&req.method==='GET')return media.GET(req,{params:Promise.resolve({key:path.slice(11)})});
 if(path.startsWith('/api/'))return new Response('Nenalezeno',{status:404});
 if(req.method!=='GET'&&req.method!=='HEAD')return new Response('Metoda není podporována',{status:405});
 if(path==='/'){const data=await readContent('published');data.team=data.team.filter(p=>!p.hidden);return html(<Reception data={data}/>,{page:'home',data})}
 if(path==='/admin'){const status=await adminStatus();
 if(!status.user)return Response.redirect(new URL('/signin-with-chatgpt?return_to=/admin',req.url),302);
 if(!status.configured)return html(<Setup/>,{page:'setup'},'Aktivace správce | Zuby Dásně');
 if(!status.allowed)return html(<main className="login"><h1>Přístup pouze pro správce</h1><p>Tento účet nemá oprávnění upravovat web.</p><a href="/signout-with-chatgpt?return_to=/admin" target="_top">Odhlásit se</a></main>,{page:'none'});
 return html(<AdminEditor/>,{page:'editor'},'Správa obsahu | Zuby Dásně');}
 return bindings.ASSETS?bindings.ASSETS.fetch(req):new Response('Nenalezeno',{status:404});
 }catch(e){if(e instanceof Response)return e;console.error('Request failed',e instanceof Error?e.message:'unknown');return new Response('<!doctype html><html lang="cs"><meta charset="utf-8"><h1>Web je dočasně nedostupný</h1><p>Zkuste prosím stránku obnovit později.</p></html>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8'}})}})}};
