import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';

const bundled=path.resolve('.local-forpsi/runtime/php/php.exe');
const php=process.env.PHP_BINARY||(fs.existsSync(bundled)?bundled:'php');
const ext=php===bundled?['-d','extension_dir='+path.dirname(php)+'/ext',...['curl','openssl','fileinfo','gd'].flatMap(e=>['-d','extension='+e])]:[];
fs.mkdirSync('.local-forpsi',{recursive:true});
const tmp=fs.mkdtempSync(path.resolve('.local-forpsi/test-')),data=path.join(tmp,'data'),config=path.join(tmp,'config.php');
const origin='http://127.0.0.1:5193';
const phpString=s=>"'"+s.replaceAll('\\','/').replaceAll("'","\\'")+"'";
fs.writeFileSync(config,`<?php
$c = require ${phpString(path.resolve('forpsi/config.example.php'))};
$c['origin'] = '${origin}'; $c['data_dir'] = ${phpString(data)};
$c['app_key'] = str_repeat('a', 64); $c['local_test'] = true;
if (!is_file(__DIR__ . '/users.json')) file_put_contents(__DIR__ . '/users.json', json_encode(['spravce1' => ['password_hash' => password_hash('654321', PASSWORD_BCRYPT)], 'spravce2' => ['password_hash' => password_hash('123456', PASSWORD_BCRYPT)]]));
$c['users'] = json_decode(file_get_contents(__DIR__ . '/users.json'), true);
return $c;`);
let server,serverError;
const logPath=path.join(tmp,'php.log'),log=fs.openSync(logPath,'a');
function start(){server=spawn(php,[...ext,'-d','display_errors=0','-d','upload_max_filesize=4M','-d','post_max_size=5M','-S','127.0.0.1:5193','-t','dist/forpsi/www','forpsi/router.php'],{env:{...process.env,ZUBY_CONFIG:config},stdio:['ignore',log,log]});server.on('error',e=>{serverError=e})}
async function stop(){if(!server||server.exitCode!==null)return;await new Promise(resolve=>{server.once('exit',resolve);server.kill()})}
async function wait(){for(let i=0;i<50;i++){if(serverError)throw serverError;try{await fetch(origin);return}catch{await new Promise(r=>setTimeout(r,100))}}throw Error('PHP server did not start')}
function client(){let cookie='';return async(url,options={})=>{
 const headers={Origin:origin,...options.headers};if(cookie)headers.Cookie=cookie;
 const r=await fetch(origin+url,{redirect:'manual',...options,headers});
 const c=r.headers.getSetCookie().find(c=>c.startsWith('zuby_session='));if(c)cookie=c.split(';')[0];return r;
}}
const csrf=html=>{const m=html.match(/name="csrf" value="([a-f0-9]+)"/);assert.ok(m,'CSRF input');return m[1]};
const boot=html=>JSON.parse(html.match(/<script id="bootstrap" type="application\/json">(.*?)<\/script>/s)[1]);
const form=(values)=>({method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(values)});
const json=(method,value,token)=>({method,headers:{'Content-Type':'application/json',...(token?{'X-CSRF-Token':token}:{})},body:JSON.stringify(value)});
function mails(){return fs.readdirSync(path.join(data,'mail')).map(n=>JSON.parse(fs.readFileSync(path.join(data,'mail',n),'utf8')))}
async function begin(c,user='spravce1',pw='654321'){
 let token=csrf(await (await c('/admin/login')).text());
 assert.equal((await c('/admin/login',form({username:user,password:pw,csrf:token}))).status,303);
 const pending=JSON.parse(fs.readFileSync(path.join(data,'challenges.json'),'utf8'))[user];
 // Mail files have random names; find the code matching the current server-side hash.
 const {createHmac}=await import('node:crypto');
 const code=mails().filter(m=>m.body.includes('Účet: '+user)).map(m=>m.body.match(/kód: ([0-9]{6})/)[1]).find(n=>createHmac('sha256','a'.repeat(64)).update(pending.nonce+n).digest('hex')===pending.hash);
 token=csrf(await (await c('/admin/verify')).text());return {token,code};
}
async function login(c,user='spravce1',pw='654321'){
 const {token,code}=await begin(c,user,pw);assert.equal((await c('/admin/verify',form({csrf:token,code}))).status,303);
 return boot(await (await c('/admin')).text()).csrf;
}
try{
 start();await wait();
 const guest=client(),a=client(),b=client();
 assert.equal((await guest('/api/content')).status,401);
 assert.equal((await guest('/api/content',json('PUT',{}))).status,401);
 assert.equal((await guest('/api/upload',{method:'POST'})).status,401);
 assert.equal((await guest('/admin')).status,303);
 assert.equal((await guest('/api/booking',json('POST',{}))).status,403);
 console.log('PASS unauthenticated administration and uploads denied');
 const pending=await begin(a);
 assert.equal((await a('/api/content')).status,401);
 assert.equal((await a('/admin/verify',form({csrf:'bad',code:pending.code}))).status,403);
 assert.equal((await a('/admin/verify',form({csrf:pending.token,code:'000000'}))).status,403);
 assert.equal((await a('/admin/verify',form({csrf:pending.token,code:pending.code}))).status,303);
 const token=boot(await (await a('/admin')).text()).csrf;
 assert.equal((await a('/admin/verify',form({csrf:token,code:pending.code}))).status,403);
 assert.ok(mails().every(m=>m.to==='marius.mervart@gmail.com'));
 const token2=await login(b,'spravce2','123456');
 console.log('PASS two accounts, required email OTP, wrong code, CSRF and replay rejection');
 let state=await (await a('/api/content')).json();const edited=structuredClone(state.data);edited.announcement='FORPSI test '+randomUUID();
 assert.equal((await a('/api/content',json('PUT',{...state,publish:true}))).status,403);
 assert.equal((await a('/api/content',{...json('PUT',state,token),headers:{...json('PUT',state,token).headers,Origin:'https://foreign.example'}})).status,403);
 let saved=await (await a('/api/content',json('PUT',{data:edited,revision:state.revision,publish:false},token))).json();assert.ok(Number.isInteger(saved.revision));
 assert.ok(!(await (await guest('/')).text()).includes(edited.announcement));
 assert.equal((await b('/api/content',json('PUT',{data:edited,revision:state.revision,publish:true},token2))).status,409);
 let published=await a('/api/content',json('PUT',{data:edited,revision:saved.revision,publish:true},token));assert.equal(published.status,200);
 assert.ok((await (await guest('/')).text()).includes(edited.announcement));
 state=await (await a('/api/content')).json();const invalid=structuredClone(edited);invalid.photos[0].src='javascript:alert(1)';
 assert.equal((await a('/api/content',json('PUT',{data:invalid,revision:state.revision,publish:true},token))).status,422);
 console.log('PASS draft/publish separation, public content, conflict prevention and validation');
 const badPhoto=new FormData();badPhoto.set('file',new Blob(['<svg onload="alert(1)"></svg>'],{type:'image/png'}),'fake.png');
 assert.equal((await a('/api/upload',{method:'POST',headers:{'X-CSRF-Token':token},body:badPhoto})).status,422);
 const goodPhoto=new FormData();goodPhoto.set('file',new Blob([fs.readFileSync('public/favicon.png')],{type:'image/png'}),'portrait.png');
 const upload=await a('/api/upload',{method:'POST',headers:{'X-CSRF-Token':token},body:goodPhoto});assert.equal(upload.status,200,await upload.clone().text());
 const media=(await upload.json()).src;const image=await guest(media);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/webp');
 state=await (await a('/api/content')).json();state.data.photos[0].src=media;
 assert.equal((await a('/api/content',json('PUT',{...state,publish:true},token))).status,200);
 const snapshot=path.join(tmp,'export');
 const exported=spawnSync(php,[...ext,'dist/forpsi/zuby-app/bin/export.php',snapshot],{env:{...process.env,ZUBY_CONFIG:config},stdio:['ignore',log,log]});
 assert.equal(exported.status,0,exported.error?.message);
 const snapshotState=JSON.parse(fs.readFileSync(path.join(snapshot,'content.json'),'utf8'));
 assert.equal(snapshotState.published.photos[0].src,media);
 assert.ok(fs.existsSync(path.join(snapshot,'media',path.basename(media))));
 assert.deepEqual(fs.readdirSync(snapshot).sort(),['content.json','media']);
 console.log('PASS real image validation, WebP re-encoding, public media and private storage');
 console.log('PASS content export includes referenced images and excludes credentials');
 const settings=await (await guest('/api/booking-config')).json();assert.equal(settings.localTest,true);assert.equal(settings.enabled,true);
 const request={name:'Test uživatel',email:'test@example.com',phone:'+420123456789',message:'TEST, NEODESÍLAT',website:'',captcha:'',requestId:randomUUID()};
 let r=await guest('/api/booking',json('POST',request,settings.csrf));assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).localTest,true);
 r=await guest('/api/booking',json('POST',request,settings.csrf));assert.equal(r.status,200);
 assert.equal(mails().filter(m=>m.subject.includes('žádost o objednání')).length,1);
 assert.equal((await guest('/api/booking',json('POST',{...request,email:'bad\r\nBcc: attacker@example.com'},settings.csrf))).status,422);
 assert.equal((await guest('/api/booking',json('POST',{...request,website:'spam'},settings.csrf))).status,422);
 console.log('PASS booking target, no duplicate delivery, validation and honeypot (test mailbox only)');
 await stop();start();await wait();
 assert.ok((await (await guest('/')).text()).includes(edited.announcement));assert.equal((await guest(media)).status,200);assert.equal((await a('/api/content')).status,200);
 console.log('PASS content, photos and sessions persist across restart');
 assert.equal((await a('/admin/logout',form({csrf:token}))).status,303);assert.equal((await a('/api/content')).status,401);
 const expired=client(),p=await begin(expired,'spravce2','123456');const challengePath=path.join(data,'challenges.json');const challenge=JSON.parse(fs.readFileSync(challengePath,'utf8'));challenge.spravce2.expires=1;fs.writeFileSync(challengePath,JSON.stringify(challenge));
 assert.equal((await expired('/admin/verify',form({csrf:p.token,code:p.code}))).status,403);
 const limited=client();const challenge2=await begin(limited,'spravce2','123456');for(let i=0;i<5;i++)assert.equal((await limited('/admin/verify',form({csrf:challenge2.token,code:'000000'}))).status,403);
 assert.equal((await limited('/admin/verify',form({csrf:challenge2.token,code:challenge2.code}))).status,403);
 const denied=client(),denyToken=csrf(await (await denied('/admin/login')).text());for(let i=0;i<5;i++)assert.equal((await denied('/admin/login',form({csrf:denyToken,username:'unknown',password:'bad'}))).status,403);
 assert.equal((await denied('/admin/login',form({csrf:denyToken,username:'unknown',password:'bad'}))).status,429);
 console.log('PASS logout, code expiry, attempt limit and login throttling');
 // Even a accidentally uploaded local-test configuration fails on a public HTTPS origin.
 await stop();
 const source=fs.readFileSync(config,'utf8');fs.writeFileSync(config,source.replace("'http://127.0.0.1:5193'","'https://example.com'"));start();await wait();assert.equal((await guest('/')).status,503);
 console.log('PASS production cannot enable local-test mail/captcha bypass');
 console.log('All FORPSI integration tests passed. No real emails sent.');
}catch(e){console.error(e);console.error(fs.readFileSync(logPath,'utf8').slice(-2000));process.exitCode=1}finally{await stop();fs.closeSync(log)}
