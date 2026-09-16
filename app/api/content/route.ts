import {database,readContent} from '@/lib/content';
import {adminStatus,checkOrigin} from '@/lib/admin';
import {contentSchema} from '@/lib/validation';
export async function GET(){try{if(!(await adminStatus()).allowed)return Response.json({error:'Přihlaste se jako správce.'},{status:403});const row=await database().prepare('SELECT revision FROM content WHERE id = ?').bind('draft').first<{revision:number}>();return Response.json({data:await readContent('draft'),revision:row?.revision??0},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Obsah se nepodařilo načíst.'},{status:503})}}
export async function PUT(req:Request){try{checkOrigin(req);if(!(await adminStatus()).allowed)return Response.json({error:'Nemáte oprávnění.'},{status:403});const body=await req.text();if(body.length>1500000)return Response.json({error:'Obsah je příliš velký.'},{status:413});const input=JSON.parse(body);const data=contentSchema.parse(input.data);if(!Number.isSafeInteger(input.revision)||input.revision<0)throw new Error('Neplatná verze.');const now=new Date().toISOString(),json=JSON.stringify(data),db=database();
 await db.prepare('INSERT OR IGNORE INTO content (id,body,revision,updated) VALUES (?,?,?,?)').bind('draft',json,0,now).run();
 const update=db.prepare('UPDATE content SET body = ?, revision = revision + 1, updated = ? WHERE id = ? AND revision = ?').bind(json,now,'draft',input.revision);
 const statements=[update];
 if(input.publish===true)statements.push(db.prepare('INSERT INTO content (id,body,revision,updated) SELECT ?,body,revision,updated FROM content WHERE id = ? AND changes() = 1 ON CONFLICT(id) DO UPDATE SET body=excluded.body, revision=excluded.revision, updated=excluded.updated').bind('published','draft'));
 const [result]=await db.batch(statements);
 if(!result.meta.changes)return Response.json({error:'Obsah mezitím změnil jiný editor. Otevřete administraci znovu; své změny si nejprve zkopírujte.'},{status:409});

 return Response.json({revision:input.revision+1,message:input.publish?'Změny byly zveřejněny.':'Koncept byl uložen.'});
 }catch(e){console.error('Content save failed',e instanceof Error?e.message:'unknown');return Response.json({error:'Uložení se nezdařilo. Zkontrolujte vyplněná pole a zkuste to znovu. Vaše změny zůstávají ve formuláři.'},{status:400})}}
