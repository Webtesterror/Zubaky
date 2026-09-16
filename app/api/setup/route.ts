import {env} from 'cloudflare:workers';
import {adminStatus,checkOrigin} from '@/lib/admin';
import {database} from '@/lib/content';
export async function POST(req:Request){
 try{
  checkOrigin(req);
  const status=await adminStatus();
  if(!status.user)return Response.json({error:'Nejprve se přihlaste přes ChatGPT a potom aktivaci zopakujte.'},{status:401});
  const raw=await req.text();
  if(raw.length>400)return Response.json({error:'Neplatný aktivační kód.'},{status:400});
  const input=JSON.parse(raw);
  const code=typeof input.code==='string'?input.code.trim():'';
  const expected=(env as unknown as {ADMIN_SETUP_CODE?:string}).ADMIN_SETUP_CODE?.trim();
  if(!expected)return Response.json({error:'Aktivace není nakonfigurována. Kontaktujte správce webu.'},{status:503});
  if(code.length!==expected.length)return Response.json({error:'Neplatný aktivační kód. Zkopírujte aktuální kód z předaných přístupových údajů.'},{status:403});
  let diff=0;for(let i=0;i<expected.length;i++)diff|=expected.charCodeAt(i)^code.charCodeAt(i);
  if(diff)return Response.json({error:'Neplatný aktivační kód. Zkopírujte aktuální kód z předaných přístupových údajů.'},{status:403});
  // Read-only diagnostics do not activate or transfer the administrator.
  if(input.verifyOnly===true)return Response.json({ok:true,verified:true,configured:status.configured});
  if(status.allowed)return Response.json({ok:true});
  if(status.configured)return Response.json({error:'Správa je již propojená s jiným účtem. Přihlaste se účtem správce.'},{status:403});
  const result=await database().prepare('INSERT OR IGNORE INTO administrator (id,user_id) VALUES (1,?)').bind(status.user.userId).run();
  if(!result.meta.changes)return Response.json({error:'Správce již byl nastaven. Obnovte prosím stránku.'},{status:409});
  return Response.json({ok:true});
 }catch{return Response.json({error:'Aktivace se nezdařila. Obnovte stránku a zkuste to znovu.'},{status:400})}
}
